const express = require("express");

const {
  searchDocuments,
} = require("../services/ragService");

const {
  generateAnswer,
} = require("../services/llmService");
console.log("🔍 generateAnswer type:", typeof generateAnswer);
const router = express.Router();

console.log("✅ qa.js loaded");

// Test route
router.get("/test", (req, res) => {
  console.log("✅ QA test route called");

  res.json({
    message: "QA route is working",
  });
});

// AI Question Answering
router.post("/", async (req, res) => {
  try {
    const { question, repositoryId } = req.body;

    if (!question || !repositoryId) {
      return res.status(400).json({
        error: "question and repositoryId are required",
      });
    }

    console.log("\n🧠 Repository AI Question:");
    console.log(question);

    // 1. Search ChromaDB
    const results = await searchDocuments(
      question,
      repositoryId,
      5
    );

    const documents = results.documents?.[0] || [];

    console.log(
      `📚 Retrieved ${documents.length} relevant chunks`
    );

    if (documents.length === 0) {
      return res.json({
        answer:
          "I could not find relevant information in this repository.",
      });
    }

    // 2. Combine retrieved context
  const metadata = results.metadatas?.[0] || [];

const context = documents
  .map((doc, index) => {
    const meta = metadata[index] || {};

    return `
================ FILE ${index + 1} ================

File: ${meta.file || "unknown"}
Type: ${meta.type || "unknown"}
Language: ${meta.language || "unknown"}
Directory: ${meta.directory || "."}

CONTENT:
${doc}

================ END FILE ${index + 1} ================
`;
  })
  .join("\n\n");

    // 3. Send context to Gemini
    console.log("🤖 Sending context to Gemini...");

    const answer = await generateAnswer(
      question,
      context
    );

    // 4. Return answer
    const sources = (results.metadatas?.[0] || []).map((metadata) => ({
  file: metadata.file || metadata.fileName || "Unknown file",
  language: metadata.language || "Unknown",
  type: metadata.type || "source",
  directory: metadata.directory || ".",
  extension: metadata.extension || "",
}));
  
res.json({
  answer,
  sources,
});
  } catch (error) {
    console.error("❌ QA Error:", error.message);

    res.status(500).json({
      error: "Failed to generate answer",
    });
  }
});

module.exports = router;