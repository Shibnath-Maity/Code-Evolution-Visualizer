const path = require("path");
const fs = require("fs/promises");

const { searchDocuments } = require("./ragService");
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

const BUG_KEYWORD_PATTERNS = BUG_KEYWORDS.map(
  (keyword) => new RegExp(`\\b${keyword}\\b`, "i")
);

const MAX_RELATED_COMMITS = 3;
const MAX_DOC_CHARS = 1200;
const MAX_DIFF_COMMITS = 1;
const MAX_DIFF_CHARS = 2500;

const ALLOWED_SEVERITIES = [
  "Low",
  "Medium",
  "High",
  "Critical",
];

const PATCH_TYPES = [
  "modify",
  "insert",
  "delete",
];

const RETRIEVAL_LIMIT_RULES = [
  {
    limit: 5,
    pattern: /\.(jsx?|tsx?)\b|\breact\b/i,
    label: "js/ts/react",
  },
  {
    limit: 5,
    pattern: /\.java\b|nullpointerexception|\bspring\b/i,
    label: "java",
  },
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
  {
    limit: 4,
    pattern: /\.(html|css)\b/i,
    label: "html/css",
  },
  {
    limit: 4,
    pattern: /\.json\b|unexpected token/i,
    label: "json",
  },
  {
    limit: 2,
    pattern: /\.md\b/i,
    label: "markdown",
  },
];

const DEFAULT_RETRIEVAL_LIMIT = 3;

const FILE_REGEX =
  /[A-Za-z0-9_.\-/\\]+?\.(jsx?|tsx?|java|kt|py|cpp|c|cc|h|hpp|go|rs|php|cs|swift|html|css|scss|json|xml|yml|yaml|sql|md)\b/i;

// ==========================================================
// Helpers
// ==========================================================

function determineRetrievalLimit(error) {
  const normalized = error.toLowerCase();

  const fileMatch = normalized.match(FILE_REGEX);

  if (fileMatch) {
    return {
      limit: 3,
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

// ==========================================================
// Read the actual file from the repository on disk
// (used to validate generated patches against ground truth,
// since the RAG context is truncated to MAX_DOC_CHARS)
// ==========================================================

async function readRepositoryFile(repoPath, filePath) {
  if (!repoPath || !filePath) return "";

  const safePath = filePath.replace(/\\/g, "/");

  const fullPath = path.resolve(repoPath, safePath);
  const rootPath = path.resolve(repoPath);

  if (!fullPath.startsWith(rootPath)) {
    return "";
  }

  try {
    return await fs.readFile(fullPath, "utf8");
  } catch (err) {
    console.error("Repository file read error:", err.message);
    return "";
  }
}

// ==========================================================
// Build repository context
// ==========================================================

function buildRepositoryContext(documents, metadatas) {
  if (!documents?.length) {
    return "";
  }

  return documents
    .map((doc, index) => {
      const metadata = metadatas?.[index] || {};

      const file =
        metadata.file ||
        metadata.fileName ||
        "unknown";

      const language =
        metadata.language ||
        "unknown";

      return `
----------------------------------------
Repository File
----------------------------------------

File: ${file}
File Name: ${metadata.fileName || path.basename(file)}
Language: ${language}
Chunk: ${metadata.chunk ?? 0}/${metadata.totalChunks ?? 1}

Code:
${(doc || "").substring(0, MAX_DOC_CHARS)}
`;
    })
    .join("\n");
}

// ==========================================================
// Find commits related to bug/fix
// ==========================================================

function findRelatedCommits(commits) {
  return commits.filter((commit) => {
    const message = commit.message || "";

    return BUG_KEYWORD_PATTERNS.some((pattern) =>
      pattern.test(message)
    );
  });
}

// ==========================================================
// Load only a very small number of diffs
// ==========================================================

async function loadCommitDiffs(repoPath, commits) {
  const diffs = [];

  for (const commit of commits.slice(0, MAX_DIFF_COMMITS)) {
    try {
      const diff = await getCommitDiff(
        repoPath,
        commit.hash
      );

      diffs.push({
        hash: commit.hash,
        message: commit.message,
        diff: (diff || "").substring(
          0,
          MAX_DIFF_CHARS
        ),
      });
    } catch (err) {
      console.error(
        "Diff Error:",
        err.message
      );
    }
  }

  return diffs;
}

// ==========================================================
// Extract file mentioned in error
// ==========================================================

function extractMentionedFile(error) {
  const match = error.match(FILE_REGEX);

  if (!match) {
    return null;
  }

  return path.basename(
    match[0].replace(/\\/g, "/")
  );
}

// ==========================================================
// Extract line number from common error formats
// ==========================================================

function extractLineNumber(error) {
  if (!error) return 0;

  const patterns = [
    /:(\d+):\d+/,        // file.js:44:12
    /\((\d+):\d+\)/,     // (file.js:44:12)
    /\bline\s+(\d+)\b/i, // Line 44
  ];

  for (const pattern of patterns) {
    const match = error.match(pattern);

    if (match) {
      return Number(match[1]);
    }
  }

  return 0;
}

// ==========================================================
// Prompt
// ==========================================================

function buildPrompt(
  error,
  repositoryContext,
  commits,
  diffs,
  mentionedFile,
  mentionedLine
) {
  return `
You are a Senior Software Debugging Engineer.

Analyze the following bug using ONLY the repository evidence provided.

==================================================
ERROR
==================================================

${error}

==================================================
EXACT FILE MENTIONED BY USER
==================================================

${mentionedFile || "None"}

==================================================
LINE MENTIONED BY USER
==================================================

${mentionedLine || 0}

==================================================
REPOSITORY CONTEXT
==================================================

${repositoryContext || "(no repository context found)"}

==================================================
RELATED COMMITS
==================================================

${
  commits.length
    ? commits
        .map(
          (c) =>
            `${c.hash.substring(0, 7)} | ${
              c.message
            } | ${c.date || ""}`
        )
        .join("\n")
    : "(no related commits found)"
}

==================================================
COMMIT DIFF
==================================================

${
  diffs.length
    ? diffs
        .map(
          (d) =>
            `# ${d.hash} — ${d.message}\n${d.diff}`
        )
        .join("\n\n")
    : "(no commit diff loaded)"
}

==================================================
STRICT GROUNDING RULES
==================================================

1. Use ONLY the repository context above.

2. NEVER invent:
   - files
   - functions
   - variables
   - code
   - line numbers
   - commits

3. If an exact file is mentioned, prefer that file.

4. The "file" field MUST be a file that actually appears
   in the repository context.

5. The "patch.file" MUST be the same file as "file".

6. "patch.oldCode" MUST be copied from the repository
   context.

7. Never create an oldCode snippet that is not present.

8. The patch must be the smallest possible change.

9. Modify only ONE file.

10. LEARNING & EXPLANATION RULES:
    - "whyThisFixWorks" MUST concisely explain why the proposed fix resolves the bug whenever a fix is provided.
    - "learning" MUST explain the root technical takeaway so the developer can avoid similar issues in the future.
    - Do NOT return empty strings for "whyThisFixWorks" or "learning" when confidence > 0.
    - Explain the concept in clear, professional developer language based strictly on the evidence.

11. If evidence is insufficient, return:

file: ""
line: 0
rootCause: "Insufficient repository context."
affectedFiles: []
relatedCommits: []
fix: "Not enough evidence."
whyThisFixWorks: ""
learning: ""
patch.oldCode: ""
patch.newCode: ""

12. Confidence must represent evidence strength.
Do not use high confidence when repository evidence is weak.

13. Return ONLY valid JSON.

==================================================
OUTPUT
==================================================

Return EXACTLY:

{
  "bugType": "",
  "severity": "Low",
  "confidence": 0,
  "file": "",
  "line": 0,
  "rootCause": "",
  "affectedFiles": [],
  "relatedCommits": [],
  "fix": "",
  "whyThisFixWorks": "",
  "learning": "",
  "patch": {
    "type": "modify",
    "file": "",
    "oldCode": "",
    "newCode": ""
  }
}
`;
}

// ==========================================================
// Normalize confidence
// ==========================================================

function clampConfidence(value) {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(n))
  );
}

// ==========================================================
// Normalize severity
// ==========================================================

function normalizeSeverity(value) {
  const match = ALLOWED_SEVERITIES.find(
    (severity) =>
      severity.toLowerCase() ===
      String(value).toLowerCase()
  );

  return match || "Medium";
}

// ==========================================================
// Normalize patch
// ==========================================================

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

    file:
      typeof patch.file === "string"
        ? patch.file
        : "",

    oldCode:
      typeof patch.oldCode === "string"
        ? patch.oldCode
        : "",

    newCode:
      typeof patch.newCode === "string"
        ? patch.newCode
        : "",
  };
}

// ==========================================================
// Normalize bug report
// ==========================================================

function normalizeBugReport(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error(
      "LLM returned a non-object bug report"
    );
  }

  return {
    bugType:
      typeof raw.bugType === "string"
        ? raw.bugType
        : "Unknown",

    severity:
      normalizeSeverity(raw.severity),

    confidence:
      clampConfidence(raw.confidence),

    file:
      typeof raw.file === "string"
        ? raw.file
        : "",

    line:
      Number.isFinite(Number(raw.line))
        ? Math.max(
            0,
            Math.trunc(Number(raw.line))
          )
        : 0,

    rootCause:
      typeof raw.rootCause === "string"
        ? raw.rootCause
        : "",

    affectedFiles:
      Array.isArray(raw.affectedFiles)
        ? raw.affectedFiles.filter(
            (file) =>
              typeof file === "string"
          )
        : [],

    relatedCommits:
      Array.isArray(raw.relatedCommits)
        ? raw.relatedCommits
        : [],

    fix:
      typeof raw.fix === "string"
        ? raw.fix
        : "",

    whyThisFixWorks:
      typeof raw.whyThisFixWorks === "string"
        ? raw.whyThisFixWorks
        : "",

    learning:
      typeof raw.learning === "string"
        ? raw.learning
        : "",

    patch:
      normalizePatch(raw.patch),
  };
}

// ==========================================================
// Validate result against repository evidence
// ==========================================================

function validateBugReport(
  result,
  repositoryContext,
  mentionedFile,
  mentionedLine
) {
  const context = repositoryContext || "";

  // --------------------------------------------------------
  // No evidence
  // --------------------------------------------------------

  if (!context.trim()) {
    return {
      bugType: result.bugType || "Unknown",
      severity: result.severity,
      confidence: 0,
      file: "",
      line: 0,
      rootCause:
        "Insufficient repository context.",
      affectedFiles: [],
      relatedCommits: [],
      fix: "Not enough evidence.",
      whyThisFixWorks: "",
      learning: "",
      patch: {
        type: "modify",
        file: "",
        oldCode: "",
        newCode: "",
      },
    };
  }

  // --------------------------------------------------------
  // Validate file
  // --------------------------------------------------------

  if (result.file) {
    const resultFileName = path.basename(
      result.file.replace(/\\/g, "/")
    );

    const contextHasFile =
      context
        .toLowerCase()
        .includes(
          resultFileName.toLowerCase()
        );

    if (!contextHasFile) {
      result.file = "";
      result.line = 0;
      result.rootCause =
        "Insufficient repository context.";
      result.affectedFiles = [];
      result.fix = "Not enough evidence.";
      result.whyThisFixWorks = "";
      result.learning = "";
      result.patch = normalizePatch(null);
      result.confidence = 0;

      return result;
    }
  }

  // --------------------------------------------------------
  // If user explicitly mentioned a file,
  // don't allow the LLM to switch to another file.
  // --------------------------------------------------------

  if (
    mentionedFile &&
    result.file &&
    path.basename(
      result.file.replace(/\\/g, "/")
    ).toLowerCase() !==
      mentionedFile.toLowerCase()
  ) {
    result.file = "";
    result.line = 0;
    result.rootCause =
      "Insufficient repository context.";
    result.affectedFiles = [];
    result.fix = "Not enough evidence.";
    result.whyThisFixWorks = "";
    result.learning = "";
    result.patch = normalizePatch(null);
    result.confidence = 0;

    return result;
  }

  // --------------------------------------------------------
  // Use line from user's error when available.
  // The LLM must not invent another line.
  // --------------------------------------------------------

  if (mentionedLine > 0) {
    result.line = mentionedLine;
  }

  // --------------------------------------------------------
  // Validate patch file
  // --------------------------------------------------------

  if (result.patch.file) {
    const patchFileName = path.basename(
      result.patch.file.replace(/\\/g, "/")
    );

    const resultFileName = result.file
      ? path.basename(
          result.file.replace(/\\/g, "/")
        )
      : "";

    if (
      resultFileName &&
      patchFileName.toLowerCase() !==
        resultFileName.toLowerCase()
    ) {
      result.patch = normalizePatch(null);
    }
  }

  // --------------------------------------------------------
  // CRITICAL:
  // oldCode MUST exist in repository context.
  // --------------------------------------------------------

  if (
    result.patch.oldCode &&
    !context.includes(result.patch.oldCode)
  ) {
    console.log(
      "⚠️ Patch oldCode was not found in repository context."
    );

    result.patch = normalizePatch(null);
  }

  // --------------------------------------------------------
  // Never allow patch without oldCode.
  // --------------------------------------------------------

  if (
    result.patch.newCode &&
    !result.patch.oldCode
  ) {
    result.patch = normalizePatch(null);
  }

  // --------------------------------------------------------
  // If patch exists, make sure patch.file exists.
  // --------------------------------------------------------

  if (
    result.patch.oldCode &&
    !result.patch.file
  ) {
    result.patch = normalizePatch(null);
  }

  return result;
}

// ==========================================================
// Main Bug Solver
// ==========================================================

async function solveBug({
  error,
  repoPath,
  repositoryId,
}) {
  try {
    console.log(
      "\n========== BUG SOLVER =========="
    );

    if (
      typeof error !== "string" ||
      !error.trim()
    ) {
      throw new Error(
        "A non-empty error description is required."
      );
    }

    if (!repositoryId) {
      throw new Error(
        "repositoryId is required."
      );
    }

    if (!repoPath) {
      throw new Error(
        "repoPath is required for the specified repository."
      );
    }

    console.log(
      "Repository ID:",
      repositoryId
    );

    console.log(
      "Repository Path:",
      repoPath
    );

    // ------------------------------------------------------
    // Extract exact file + line from error
    // ------------------------------------------------------

    const mentionedFile =
      extractMentionedFile(error);

    const mentionedLine =
      extractLineNumber(error);

    console.log(
      "🎯 Mentioned File:",
      mentionedFile || "none"
    );

    console.log(
      "📍 Mentioned Line:",
      mentionedLine || "none"
    );

    // ------------------------------------------------------
    // RAG retrieval
    // ------------------------------------------------------

    const {
      limit,
      reason,
    } = determineRetrievalLimit(error);

    console.log(
      `📚 Searching ChromaDB (top ${limit} documents, reason: ${reason})...`
    );

    const rag = await searchDocuments(
      error,
      repositoryId,
      limit,
      mentionedFile
    );

    const documents =
      rag.documents?.[0] || [];

    const metadatas =
      rag.metadatas?.[0] || [];

    console.log(
      "Retrieved Documents:",
      documents.length
    );

    const repositoryContext =
      buildRepositoryContext(
        documents,
        metadatas
      );

    // ------------------------------------------------------
    // Load commits
    // ------------------------------------------------------

    console.log(
      "Loading commits..."
    );

    const commits =
      await getCommits(repoPath);

    const relatedCommits =
      findRelatedCommits(commits);

    const topRelatedCommits =
      relatedCommits.slice(
        0,
        MAX_RELATED_COMMITS
      );

    console.log(
      "Related commits:",
      topRelatedCommits.length
    );

    // ------------------------------------------------------
    // Load ONE commit diff
    // ------------------------------------------------------

    console.log(
      "Loading commit diffs..."
    );

    const commitDiffs =
      await loadCommitDiffs(
        repoPath,
        topRelatedCommits
      );

    // ------------------------------------------------------
    // Build prompt
    // ------------------------------------------------------

    const prompt = buildPrompt(
      error,
      repositoryContext,
      topRelatedCommits,
      commitDiffs,
      mentionedFile,
      mentionedLine
    );

    // ------------------------------------------------------
    // LLM
    // ------------------------------------------------------

    console.log(
      "🤖 Calling LLM..."
    );

    const rawResult =
      await generateJSON(prompt);

    let result =
      normalizeBugReport(rawResult);

    // ------------------------------------------------------
    // Ground truth validation (against retrieved RAG context)
    // ------------------------------------------------------

    result =
      validateBugReport(
        result,
        repositoryContext,
        mentionedFile,
        mentionedLine
      );

    // ------------------------------------------------------
    // Validate patch against the ACTUAL repository file on
    // disk. The RAG context is truncated to MAX_DOC_CHARS,
    // so a patch can pass the check above but still not
    // exist in the real file — this closes that gap.
    // ------------------------------------------------------

    if (result.patch.oldCode && result.patch.file) {
      const actualFile = await readRepositoryFile(
        repoPath,
        result.patch.file
      );

      if (!actualFile.includes(result.patch.oldCode)) {
        console.log(
          "⚠️ Patch oldCode does not exist in actual repository file."
        );

        result.patch = normalizePatch(null);
      }
    }

    // ------------------------------------------------------
    // If the LLM didn't return related commits,
    // use only commits we actually found.
    // ------------------------------------------------------

    if (
      !Array.isArray(
        result.relatedCommits
      ) ||
      result.relatedCommits.length === 0
    ) {
      result.relatedCommits =
        topRelatedCommits.map(
          (commit) => ({
            hash: commit.hash,
            message: commit.message,
            date: commit.date,
          })
        );
    }

    // ------------------------------------------------------
    // Make sure affected files are grounded.
    // ------------------------------------------------------

    result.affectedFiles =
      result.affectedFiles.filter(
        (file) =>
          repositoryContext
            .toLowerCase()
            .includes(
              path.basename(
                file.replace(/\\/g, "/")
              ).toLowerCase()
            )
      );

    // If exact file exists, include it.
    if (
      result.file &&
      !result.affectedFiles.some(
        (file) =>
          path.basename(
            file.replace(/\\/g, "/")
          ).toLowerCase() ===
          path.basename(
            result.file.replace(/\\/g, "/")
          ).toLowerCase()
      )
    ) {
      result.affectedFiles.unshift(
        result.file
      );
    }

    console.log(
      "\n========== BUG SOLVER RESULT =========="
    );

    console.log(
      "File:",
      result.file
    );

    console.log(
      "Line:",
      result.line
    );

    console.log(
      "Severity:",
      result.severity
    );

    console.log(
      "Confidence:",
      result.confidence
    );

    console.log(
      "Patch available:",
      Boolean(
        result.patch.oldCode &&
          result.patch.newCode
      )
    );

    return result;
  } catch (err) {
    console.error(
      "\n❌ BUG SOLVER FAILED"
    );

    console.error(err);

    throw err;
  }
}

module.exports = {
  solveBug,
};