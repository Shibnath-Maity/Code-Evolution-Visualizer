
const protect = require("../middleware/authMiddleware");
const express = require("express");

const {
  askRepositoryAssistant,
} = require("../services/assistantService");

const router = express.Router();

// ==========================================
// Ask AI Repository Assistant
// ==========================================
router.post("/ask", protect, async (req, res) => {
  try {
    const {
      question,
      repositoryId,
    } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        error: "Question is required.",
      });
    }

    const result =
      await askRepositoryAssistant(
        question,
        repositoryId
      );

    res.json({
      success: true,
      answer: result.answer,
      sources: result.sources,
    });

  } catch (error) {
    console.error(
      "Assistant route error:",
      error.message
    );

    res.status(500).json({
      success: false,
      error:
        "Failed to process assistant request.",
    });
  }
});
module.exports = router;