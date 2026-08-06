const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const contributorAIService = require("../services/contributorAIService");

router.post("/ask", protect, async (req, res) => {
  try {
    const { contributorName, question, allCommits } = req.body || {};

    if (typeof contributorName !== "string" || !contributorName.trim()) {
      return res.status(400).json({
        success: false,
        message: "contributorName is required.",
      });
    }

    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "question is required.",
      });
    }

    if (!Array.isArray(allCommits)) {
      return res.status(400).json({
        success: false,
        message: "allCommits must be an array.",
      });
    }

    const start = Date.now();

    const answer = await contributorAIService.askContributor({
      contributorName: contributorName.trim(),
      question: question.trim(),
      allCommits,
    });

    const duration = Date.now() - start;

    res.json({
      success: true,
      answer,
      duration,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;