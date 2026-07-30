const axios = require("axios");
const { searchDocuments } = require("./ragService");

const OLLAMA_URL = "http://localhost:11434";
const CHAT_MODEL = "llama3.2";
const REQUEST_TIMEOUT_MS = 60_000;
const RESULT_COUNT = 10;
const MAX_CHARS_PER_SOURCE = 2500; // guard against one huge file blowing the context window

// ==========================================
// Build repository context from retrieved docs
// ==========================================

function truncate(text, maxChars) {
  if (!text || text.length <= maxChars) return text || "";
  return `${text.slice(0, maxChars)}\n... [truncated, ${text.length - maxChars} more characters]`;
}

function buildContext(documents, metadatas) {
  return documents
    .map((document, index) => {
      const metadata = metadatas[index] || {};
     return [
  `--- SOURCE ${index + 1} ---`,
  `File: ${metadata.file || "Unknown"}`,
  `Language: ${metadata.language || "Unknown"}`,
  `Type: ${metadata.type || "source"}`,
  `Problem: ${metadata.problem || "Unknown"}`,
  "",
  truncate(document, MAX_CHARS_PER_SOURCE),
].join("\n");
    })
    .join("\n\n");
}

// ==========================================
// Build the prompt
// (rules stated once each — the original repeated
// several of these 2-3x in slightly different wording,
// which tends to make smaller models less consistent,
// not more)
// ==========================================

function buildPrompt(question, context) {
  return `
You are a senior software engineer performing repository analysis, code review, and code explanation.

Your knowledge is STRICTLY LIMITED to the repository context below.

Do NOT use your general programming knowledge to fill in missing repository details.
Only use it to explain code that is explicitly present in the retrieved repository context.
If the repository context does not contain enough information, NEVER guess.

Instead reply exactly:

"This information is not available in the indexed repository."

==================================================
GENERAL RULES
==================================================

- Use ONLY the retrieved repository context.
- Never invent files, functions, classes, variables, APIs, architecture, dependencies, or technologies.
- Every conclusion MUST be supported by the retrieved repository context.
- Never speculate.
- Never assume missing code.
- Quote or reference the relevant file whenever possible.
- Explain your reasoning using the retrieved code.
- If only part of a file is available, explicitly state that additional repository context is required before making conclusions.
- Do NOT provide generic software engineering advice.
- Do NOT report bugs unless they are directly visible in the retrieved code.
- Do NOT report missing validation unless the retrieved code clearly shows it.
- Do NOT report security vulnerabilities without direct evidence.
- Do NOT report performance issues without direct evidence.
- Do NOT mention algorithm complexity unless the user specifically asks or the question is about an algorithm.
Never recommend code changes unless the retrieved code clearly demonstrates the issue.

If there is uncertainty, say:

"I don't have enough repository context to verify this."
==================================================
REPOSITORY OVERVIEW QUESTIONS
==================================================

If the user asks for a repository overview, include:

- Project purpose
- Folder structure
- Technologies used
- Main modules
- Overall architecture
- Important files
- Brief summary

If any information cannot be verified from the repository context, explicitly state that.

==================================================
CODE EXPLANATION QUESTIONS
==================================================

If the user asks to explain code, include:

- What the code does
- Important functions
- Important classes
- Important variables
- Logic flow
- Related files
- Dependencies (only if visible)

Explain ONLY what exists in the retrieved code.

==================================================
CODE REVIEW / CODE IMPROVEMENT QUESTIONS
==================================================

Review ONLY the retrieved code.

Look for:

- Code duplication
- Poor naming
- Long functions
- Repeated logic
- Missing validation
- Missing error handling
- Security issues
- Performance issues
- Maintainability problems
- Readability problems
- Dead code
- Unused variables
- Unused imports

ONLY report issues that are directly visible in the retrieved repository context.

Never infer issues from incomplete snippets.

If there is not enough repository context to verify an issue, explicitly say:

"I don't have enough repository context to confirm this issue."

==================================================
FOR EVERY CONFIRMED ISSUE USE THIS FORMAT
==================================================

Issue:

Evidence:

Why it matters:

Suggested improvement:

Affected file:

Confidence:

- High: Directly supported by the retrieved code.
- Medium: Strongly implied by multiple retrieved snippets.
- Low: Limited repository context available.

==================================================
IMPORTANT REVIEW RULES
==================================================

Evidence MUST come directly from the retrieved code.

Do NOT invent:

- bugs
- edge cases
- validation problems
- security vulnerabilities
- performance issues

If no issues are directly visible, respond exactly:

"I reviewed the retrieved repository context and found no clearly verifiable code quality issues."

==================================================
USER QUESTION
==================================================

${question}

==================================================
REPOSITORY CONTEXT
==================================================

${context}

==================================================
SOURCES USED
==================================================

At the end of your answer, list every file that was used to produce the answer.

Example:

Sources:
- src/app.js
- server/routes/repository.js
- package.json

==================================================
ANSWER
==================================================
`;
}
// ==========================================
// Ask Repository Assistant
// ==========================================

async function askRepositoryAssistant(question, repositoryId) {
  if (!question || !question.trim()) {
    throw new Error("Question is required.");
  }

  if (!repositoryId || !String(repositoryId).trim()) {
    throw new Error("Repository ID is required.");
  }

  console.log("\n🤖 User Question:", question);

  try {
    // ======================================
    // STEP 1: Retrieve relevant documents
    // ======================================

    const results = await searchDocuments(question, repositoryId, RESULT_COUNT);

    const documents = results.documents?.[0] || [];
    const metadatas = results.metadatas?.[0] || [];
    const distances = results.distances?.[0] || [];

    // Check if language information exists
const hasLanguageInfo = metadatas.some(
  (m) => m.language && m.language !== "Unknown"
);

if (
  question.toLowerCase().includes("language") &&
  !hasLanguageInfo
) {
  return {
    answer: "This information is not available in the indexed repository.",
    sources: [],
  };
}

// Debug: show retrieved files
console.log("\n📂 Retrieved Files:");

metadatas.forEach((m, i) => {
  console.log(`${i + 1}. ${m.file || "Unknown"}`);
});


    if (documents.length === 0) {
      return {
        answer: "I couldn't find relevant information in the repository.",
        sources: [],
      };
    }

    // ======================================
    // STEP 2: Build context + prompt
    // ======================================

    const context = buildContext(documents, metadatas);
    const prompt = buildPrompt(question, context);

    // ======================================
    // STEP 3: Ask Ollama LLM
    // ======================================

    let response;
    try {
      response = await axios.post(
        `${OLLAMA_URL}/api/generate`,
       {
  model: CHAT_MODEL,
  prompt,
  stream: false,
  options: {
    temperature: 0.1,
    top_p: 0.9
  }
},
        { timeout: REQUEST_TIMEOUT_MS }
      );
    } catch (llmError) {
      if (llmError.code === "ECONNREFUSED") {
        throw new Error(
          `Could not reach Ollama at ${OLLAMA_URL}. Is it running?`
        );
      }
      if (llmError.code === "ECONNABORTED") {
        throw new Error(
          `Ollama did not respond within ${REQUEST_TIMEOUT_MS}ms.`
        );
      }
      throw llmError;
    }

    const answer =
      response.data?.response?.trim() ||
      "The assistant did not return an answer for this question.";

    // ======================================
    // STEP 4: Return answer + sources
    // ======================================
const sources = [
  ...new Map(
    metadatas.map((metadata, index) => [
      metadata.file || `Unknown-${index}`,
      {
        file: metadata.file || "Unknown",
        directory: metadata.directory || "Unknown",
        language: metadata.language || "Unknown",
        type: metadata.type || "source",
        problem: metadata.problem || "Unknown",
        distance: distances[index] ?? null,
      },
    ])
  ).values(),
];
    

    return { answer, sources };
  } catch (error) {
    console.error("❌ Assistant Error:", error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  askRepositoryAssistant,
};