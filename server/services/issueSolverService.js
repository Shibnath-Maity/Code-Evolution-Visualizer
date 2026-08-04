const { searchDocuments } = require("./ragService");
const { getCurrentRepository } = require("./repositoryContext");
const { getCommits, getCommitDiff } = require("./gitService");
const { generateJSON } = require("./geminiService");

const MAX_DOCUMENTS = 5;
const MAX_RELATED_COMMITS = 3;
const MAX_DIFF_CHARS = 1000;

async function solveIssue({ issue, repoPath }) {
  try {
    if (!issue) {
      throw new Error("Issue data is required.");
    }

    // Use current repository if not supplied
    if (!repoPath) {
      const current = getCurrentRepository();

      if (!current || !current.repoPath || !current.repositoryId) {
        throw new Error("Repository not analyzed.");
      }

      repoPath = current.repoPath;
    }

    const { repositoryId } = getCurrentRepository();

    console.log("Repository:", repositoryId);

    // ==========================================
    // Search Repository (RAG)
    // ==========================================

    const searchText = `
${issue.title}

${issue.body || ""}

${(issue.comments || [])
  .map((c) => c.body)
  .join("\n")}
`;

    const rag = await searchDocuments(
      searchText,
      repositoryId,
      MAX_DOCUMENTS
    );

    const documents = rag.documents?.[0] || [];
    const metadatas = rag.metadatas?.[0] || [];

    const repositoryContext = documents
      .map((doc, index) => {
        const meta = metadatas[index] || {};

        return `
========================================
File: ${meta.file || "Unknown"}
========================================

${doc}
`;
      })
      .join("\n");

    // ==========================================
    // Related Commits
    // ==========================================

    const commits = await getCommits(repoPath);

    const relatedCommits = commits
      .filter((commit) => {
        const msg = (commit.message || "").toLowerCase();

        return (
          msg.includes("fix") ||
          msg.includes("bug") ||
          msg.includes("issue") ||
          msg.includes("resolve") ||
          msg.includes("error")
        );
      })
      .slice(0, MAX_RELATED_COMMITS);

    // ==========================================
    // Commit Diffs
    // ==========================================

    const commitDiffs = [];

    for (const commit of relatedCommits) {
      try {
        const diff = await getCommitDiff(repoPath, commit.hash);

        commitDiffs.push({
          hash: commit.hash,
          message: commit.message,
          diff: diff.substring(0, MAX_DIFF_CHARS),
        });
      } catch (err) {
        console.log(err.message);
      }
    }

    // ==========================================
    // Gemini Prompt
    // ==========================================

    const prompt = `
You are an expert Open Source Software Engineer.

Your task is to solve ONLY this GitHub issue.

Never hallucinate.

Never invent files.

Never invent functions.

Never invent commits.

Use ONLY the repository context.

======================================
GITHUB ISSUE
======================================

Title:
${issue.title}

Description:
${issue.body || "No description"}

Comments:

${(issue.comments || [])
  .map((c) => `${c.author}: ${c.body}`)
  .join("\n")}

======================================
REPOSITORY CONTEXT
======================================

${repositoryContext}

======================================
RELATED COMMITS
======================================

${relatedCommits
  .map(
    (c) =>
      `${c.hash.substring(0,7)} | ${c.message}`
  )
  .join("\n")}

======================================
COMMIT DIFFS
======================================

${commitDiffs
  .map(
    (d) =>
`${d.hash}

${d.diff}`
  )
  .join("\n\n")}

Return ONLY JSON.

{
  "summary":"",
  "rootCause":"",
  "confidence":0,
  "complexity":"Easy",
  "affectedFiles":[],
  "relatedCommits":[],
  "solution":"",
  "implementationSteps":[],
  "patch":{
      "file":"",
      "oldCode":"",
      "newCode":""
  }
}

Rules:

1. confidence must be between 0 and 100.
2. implementationSteps must be an array.
3. affectedFiles must be an array.
4. relatedCommits must be an array.
5. If there is not enough repository evidence,
   clearly say so.
`;

    // ==========================================
    // Gemini
    // ==========================================

    const result = await generateJSON(prompt);

    // Fall back to git history only when Gemini returns nothing — keeps
    // Gemini's result when it's non-empty, at the cost of not verifying
    // it against real commit hashes.
    // Note: simple-git's log objects use `author_name`, not `author`.
    if (!result.relatedCommits || result.relatedCommits.length === 0) {
      result.relatedCommits = relatedCommits.map((commit) => ({
        hash: commit.hash,
        message: commit.message,
        author: commit.author_name,
        date: commit.date,
      }));
    }

    // Ground truth from RAG search — real files that back the context
    // Gemini actually saw. Filters out any hallucinated filenames while
    // still allowing Gemini-identified files that are verifiably present
    // in our retrieved context through.
    const ragFiles = [...new Set(
      metadatas
        .map((m) => m.file)
        .filter(Boolean)
    )];

    if (!result.affectedFiles || result.affectedFiles.length === 0) {
      result.affectedFiles = ragFiles;
    } else {
      result.affectedFiles = [...new Set([
        ...result.affectedFiles.filter((f) => ragFiles.includes(f)),
        ...ragFiles,
      ])];
    }

    return result;
  } catch (err) {
    console.error("Issue Solver:", err);

    throw err;
  }
}

module.exports = {
  solveIssue,
};