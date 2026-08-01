const { searchDocuments } = require("./ragService");
const { getCurrentRepository } = require("./repositoryContext");
const { getCommits, getCommitDiff } = require("./gitService");
const { generateJSON } = require("./llmService");

const BUG_KEYWORDS = [
  "fix",
  "bug",
  "hotfix",
  "resolve",
  "error",
  "crash",
  "null",
  "undefined",
  "exception",
  "issue",
];

// Word-boundary regexes built once at module load, not per-call. Plain
// substring matching (message.includes("null")) also matched inside
// unrelated words like "annulled" or "nullable-config", quietly padding
// the related-commits list with noise that then gets fed to the LLM as
// "evidence".
const BUG_KEYWORD_PATTERNS = BUG_KEYWORDS.map(
  (keyword) => new RegExp(`\\b${keyword}\\b`, "i")
);

const MAX_RELATED_COMMITS = 3;
const MAX_DOC_CHARS = 1000;
// MAX_RELATED_COMMITS = 3;
const MAX_DIFF_COMMITS = 1;
const MAX_DIFF_CHARS = 700;
const ALLOWED_SEVERITIES = ["Low", "Medium", "High", "Critical"];
const PATCH_TYPES = ["modify", "insert", "delete"];
// -----------------------------
// Dynamic retrieval limit
// -----------------------------
// Wider error → more candidate documents pulled from ChromaDB, since
// broad framework errors (React, Java) tend to touch more of the
// codebase than a narrow one (a single markdown typo).
//
// Rewritten from a long inline if/else chain of raw substring checks
// into a data-driven rule table using word-boundary regexes. Two
// concrete problems that fixes:
//
// 1. `error.includes(".c")` also matched inside unrelated text like
//    "database.config" or "eslint.cache" — a short, unanchored
//    extension check like that will false-positive on anything
//    containing those two characters in sequence. `/\.c\b/i` requires
//    an actual word boundary right after the "c", so "database.config"
//    no longer matches while "foo.c" and "foo.cpp" still correctly do
//    (regex alternation backtracks to the longer "cpp" branch).
// 2. The rule set is now a table instead of ~80 lines of inline
//    branching inside solveBug(), and it's independently testable.
const RETRIEVAL_LIMIT_RULES = [
  { limit: 5, pattern: /\.(jsx?|tsx?)\b|\breact\b/i, label: "js/ts/react" },
  { limit: 5, pattern: /\.java\b|nullpointerexception|\bspring\b/i, label: "java" },
  {
    limit: 5,
    pattern: /\.py\b|traceback|modulenotfounderror|attributeerror/i,
    label: "python",
  },
  {
    limit: 5,
    pattern: /\.(c|cpp|h|hpp)\b|segmentation fault|undefined reference/i,
    label: "c/cpp",
  },
  { limit: 4, pattern: /\.(html|css)\b/i, label: "html/css" },
  { limit: 4, pattern: /\.json\b|unexpected token/i, label: "json" },
  { limit: 2, pattern: /\.md\b/i, label: "markdown" },
];

const DEFAULT_RETRIEVAL_LIMIT = 3;
const EXACT_MATCH_RETRIEVAL_LIMIT = 1;

// File/component names specific enough that, if mentioned, the answer is
// almost certainly about that exact file — so a narrow, high-precision
// retrieval beats a broad one.
const FILE_REGEX =
/[A-Za-z0-9_-]+\.(jsx?|tsx?|java|kt|py|cpp|c|cc|h|hpp|go|rs|php|cs|swift|html|css|scss|json|xml|yml|yaml|sql|md)/i;


function determineRetrievalLimit(error) {
  const normalized = error.toLowerCase();

  const fileMatch = normalized.match(FILE_REGEX);

  if (fileMatch) {
    return {
      limit: 1,
      reason: `exact file: ${fileMatch[0]}`,
    };
  }

  for (const rule of RETRIEVAL_LIMIT_RULES) {
    if (rule.pattern.test(normalized)) {
      return {
        limit: rule.limit,
        reason: rule.label,
      };
    }
  }

  return {
    limit: DEFAULT_RETRIEVAL_LIMIT,
    reason: "default",
  };
}
function buildRepositoryContext(documents, metadatas) {
  return documents
    .map((doc, index) => {
      const meta = metadatas[index] || {};

      return `
====================================
File: ${meta.file || "Unknown"}
Type: ${meta.type || "source"}
====================================

${(doc || "").substring(0, MAX_DOC_CHARS)}
`;
    })
    .join("\n");
}

function findRelatedCommits(commits) {
  return commits.filter((commit) => {
    const message = commit.message || "";
    return BUG_KEYWORD_PATTERNS.some((pattern) => pattern.test(message));
  });
}

async function loadCommitDiffs(repoPath, commits) {
  const diffs = [];

  for (const commit of commits.slice(0, MAX_DIFF_COMMITS)) {
    try {
      const diff = await getCommitDiff(repoPath, commit.hash);

      diffs.push({
        hash: commit.hash,
        message: commit.message,
        diff: (diff || "").substring(0, MAX_DIFF_CHARS),
      });
    } catch (err) {
      console.error("Diff Error:", err.message);
    }
  }

  return diffs;
}

function buildPrompt(error, repositoryContext, commits, diffs) {
  return `
You are a Senior Software Debugging Engineer.

Your job is to analyze bugs ONLY using the repository context below.

IMPORTANT RULES

- Use ONLY repository context.
- Never invent files, code, commits, functions, or line numbers.
- If the repository context does not clearly identify the bug, return:

file: ""
line: 0
rootCause: "Insufficient repository context."
affectedFiles: []
relatedCommits: []
fix: "Not enough evidence."
patch.oldCode: ""
patch.newCode: ""

- NEVER guess another file.
- NEVER guess another function.
- NEVER guess code that is not present in the repository context.
- Return ONLY valid JSON.
====================================
USER ERROR
====================================

${error}

====================================
REPOSITORY CONTEXT
====================================

${repositoryContext || "(no matching repository context found)"}

====================================
RELATED COMMITS (up to ${MAX_RELATED_COMMITS} shown; message/metadata only)
====================================

${commits
  .map(
    c =>
      `${c.hash.substring(0,7)} | ${c.message} | ${c.date}`
  )
  .join("\n")}

====================================
COMMIT DIFFS (full diff available for only the first ${MAX_DIFF_COMMITS} of the related commits above — do not assume diffs exist for the rest)
====================================

${diffs.length ? diffs.map((d) => `# ${d.hash} — ${d.message}\n${d.diff}`).join("\n\n") : "(no diffs loaded)"}

====================================

Return EXACTLY this JSON structure:

{
   "bugType":"",
  "severity":"Low | Medium | High | Critical",
  "confidence":0,
  "file":"",
  "line":0,
  "rootCause":"",
  "affectedFiles":[],
  "relatedCommits":[],
  "fix":"",
  "patch":{
    "type":"modify",
    "file":"",
    "oldCode":"",
    "newCode":""
  }
}

Rules:


PATCH RULES
- Generate the smallest fix.
- Modify only one file.
- oldCode must exist in repository context.
- newCode is the corrected version.
- Never generate an entire file.
- Leave oldCode/newCode empty if evidence is insufficient.
`
}

function clampConfidence(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function normalizeSeverity(value) {
  const match = ALLOWED_SEVERITIES.find(
    (s) => s.toLowerCase() === String(value).toLowerCase()
  );
  return match || "Medium";
}

// The model is asked to return a strict shape, but nothing previously
// checked that it actually did — a missing `affectedFiles` array, a
// `confidence` of "high" instead of a number, or a made-up severity
// string would all have flowed straight through to whatever calls
// solveBug(). This guarantees the contract instead of hoping.
function normalizeBugReport(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("LLM returned a non-object bug report");
  }

  return {
    bugType: typeof raw.bugType === "string" ? raw.bugType : "Unknown",
    severity: normalizeSeverity(raw.severity),
    confidence: clampConfidence(raw.confidence),
    file: typeof raw.file === "string" ? raw.file : "",
    line: Number.isFinite(Number(raw.line)) ? Math.max(0, Math.trunc(Number(raw.line))) : 0,
    rootCause: typeof raw.rootCause === "string" ? raw.rootCause : "",
    affectedFiles: Array.isArray(raw.affectedFiles)
      ? raw.affectedFiles.filter((f) => typeof f === "string")
      : [],
    relatedCommits: Array.isArray(raw.relatedCommits) ? raw.relatedCommits : [],
    fix: typeof raw.fix === "string" ? raw.fix : "",
    patch: normalizePatch(raw.patch),
  };
}

 function normalizePatch(patch) {
  if (!patch || typeof patch !== "object") {
    return {
      type: "modify",
      file: "",
      oldCode: "",
      newCode: "",
    };
  }

  return {
    type: PATCH_TYPES.includes(patch.type)
      ? patch.type
      : "modify",

    file: typeof patch.file === "string"
      ? patch.file
      : "",

    oldCode: typeof patch.oldCode === "string"
      ? patch.oldCode
      : "",

    newCode: typeof patch.newCode === "string"
      ? patch.newCode
      : "",
  };
}
  
async function solveBug({ error, repoPath, repositoryId }) {
  try {
    console.log("\n========== BUG SOLVER ==========");

    if (typeof error !== "string" || !error.trim()) {
      throw new Error("A non-empty error description is required.");
    }

    if (!repoPath || !repositoryId) {
      const current = getCurrentRepository();

      repoPath = current.repoPath;
      repositoryId = current.repositoryId;
    }

    if (!repoPath || !repositoryId) {
      throw new Error("No repository has been analyzed.");
    }

    console.log("Repository ID:", repositoryId);
    console.log("Repository Path:", repoPath);

    console.log("Searching ChromaDB...");

    const { limit, reason } = determineRetrievalLimit(error);
    console.log(`📚 Retrieving top ${limit} documents (${reason})...`);

  const fileMatch = error.match(FILE_REGEX);

const rag = await searchDocuments(
  error,
  repositoryId,
  limit,
  fileMatch ? fileMatch[0] : null
);

    console.log("✅ ChromaDB Search Success");

    const documents = rag.documents?.[0] || [];
    const metadatas = rag.metadatas?.[0] || [];

    console.log("Retrieved Documents:", documents.length);

    const repositoryContext = buildRepositoryContext(documents, metadatas);

    console.log("Loading commits...");

    const commits = await getCommits(repoPath);

    console.log("Total Commits:", commits.length);

    const relatedCommits = findRelatedCommits(commits);

    console.log("Related Commits:", relatedCommits.length);

    console.log("Loading commit diffs...");

    const topRelatedCommits = relatedCommits.slice(0, MAX_RELATED_COMMITS);
    const commitDiffs = await loadCommitDiffs(repoPath, topRelatedCommits);

    console.log("Loaded Diffs:", commitDiffs.length);

    const prompt = buildPrompt(
      error,
      repositoryContext,
      topRelatedCommits,
      commitDiffs
    );

    console.log("Calling LLM...");
const rawResult = await generateJSON(prompt);

console.log("✅ LLM Success");

const result = normalizeBugReport(rawResult);

// Prevent hallucinated file names
if (
  result.file &&
  !repositoryContext.includes(result.file.split(/[\\/]/).pop())
) {
  result.file = "";
  result.line = 0;
  result.rootCause = "Insufficient repository context.";
  result.affectedFiles = [];
  result.fix = "Not enough evidence.";
  result.patch.oldCode = "";
  result.patch.newCode = "";
}

return result;
    
  } catch (err) {
    console.error("\n❌ BUG SOLVER FAILED");
    console.error(err);
    console.error(err.stack);

    throw err;
  }
}

module.exports = {
  solveBug,
};