
const axios = require("axios");

const {
  searchDocuments,
} = require("./ragService");

const OLLAMA_URL = "http://localhost:11434";

// ==========================================
// Ask Repository Assistant
// ==========================================

async function askRepositoryAssistant(question) {
  try {
    if (!question || !question.trim()) {
      throw new Error("Question is required.");
    }

    console.log("\n🤖 User Question:");
    console.log(question);

    // ======================================
    // STEP 1: Retrieve relevant documents
    // ======================================

    const results = await searchDocuments(
      question,
      5
    );

    const documents =
      results.documents?.[0] || [];

    const metadatas =
      results.metadatas?.[0] || [];

    const distances =
      results.distances?.[0] || [];

    if (documents.length === 0) {
      return {
        answer:
          "I couldn't find relevant information in the repository.",
        sources: [],
      };
    }

    // ======================================
    // STEP 2: Build repository context
    // ======================================

    const context = documents
      .map((document, index) => {
        const metadata =
          metadatas[index] || {};

        return `
--- SOURCE ${index + 1} ---

File:
${metadata.file || "Unknown"}

Problem:
${metadata.problem || "Unknown"}

Code:
${document}
`;
      })
      .join("\n");

    // ======================================
    // STEP 3: Build prompt
    // ======================================

    const prompt = `
You are an AI assistant that understands a software repository.

Answer the user's question using ONLY the repository
context provided below.

If the answer cannot be found in the context,
say that the information is not available in
the repository.

Be clear and concise.

When explaining code:
- Mention the relevant file.
- Explain the important logic.
- Mention time complexity when possible.
- Mention space complexity when possible.

USER QUESTION:
${question}

REPOSITORY CONTEXT:
${context}

ANSWER:
`;

    // ======================================
    // STEP 4: Ask Ollama LLM
    // ======================================

    const response = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      {
        model: "llama3.2",
        prompt: prompt,
        stream: false,
      }
    );

    const answer =
      response.data?.response?.trim();

    // ======================================
    // STEP 5: Return answer + sources
    // ======================================

    const sources = metadatas.map(
      (metadata, index) => ({
        file:
          metadata.file || "Unknown",

        problem:
          metadata.problem || "Unknown",

        distance:
          distances[index] ?? null,
      })
    );

    return {
      answer,
      sources,
    };

  } catch (error) {
    console.error(
      "❌ Assistant Error:"
    );

    console.error(
      error.response?.data ||
      error.message
    );

    throw error;
  }
}

module.exports = {
  askRepositoryAssistant,
};

