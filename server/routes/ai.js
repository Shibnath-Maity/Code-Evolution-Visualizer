const express = require("express");
const router = express.Router();

const {
  askOllama,
  analyzeRepository,
} = require("../services/aiService");


// ==========================================
// Normal AI Chat
// ==========================================

router.post("/chat", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        error: "Question is required",
      });
    }

    const answer = await askOllama(question);

    res.json({
      answer,
    });

  } catch (error) {
    console.error("AI Error:", error);

    res.status(500).json({
      error: "Failed to get response from Ollama",
    });
  }
});


// ==========================================
// Repository AI Analysis
// ==========================================

router.post("/analyze-repository", async (req, res) => {
  try {

    const repositoryData = req.body;

    if (!repositoryData || !repositoryData.stats) {
      return res.status(400).json({
        error: "Repository analysis data is required",
      });
    }

    const analysis = await analyzeRepository(repositoryData);

    res.json({
      analysis,
    });

  } catch (error) {

    console.error("Repository AI Error:", error);

    res.status(500).json({
      error: "Failed to analyze repository",
    });
  }
});


module.exports = router;