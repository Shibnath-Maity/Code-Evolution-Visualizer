const { searchDocuments } = require("./ragService");
const { generateAnswer } = require("./llmService");

async function askRepository(question, repositoryId) {
  try {
    console.log("\n🔎 Searching repository...");

    const results = await searchDocuments(
      question,
      repositoryId,
      5
    );

    const documents = results.documents?.[0] || [];
    const metadatas = results.metadatas?.[0] || [];

    if (documents.length === 0) {
      return "I could not find relevant information in the repository.";
    }

    const context = documents
      .map((document, index) => {
        const metadata = metadatas[index] || {};

        return `
--- Repository File ${index + 1} ---

File: ${metadata.file || "Unknown"}
Problem: ${metadata.problem || "Unknown"}
Language: ${metadata.language || "Unknown"}

${document}
`;
      })
      .join("\n");

    console.log(
      `📚 Retrieved ${documents.length} relevant chunks`
    );

    console.log("🤖 Sending context to Gemini...");

    return await generateAnswer(
      question,
      context
    );

  } catch (error) {
    console.error("QA Service Error:", error.message);
    throw error;
  }
}

module.exports = {
  askRepository,
};