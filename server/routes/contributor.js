const express = require("express");
const router = express.Router();

const contributorAIService = require("../services/contributorAIService");

router.post("/ask", async (req, res) => {
  try {
    const { contributorName, question, allCommits } = req.body;
const start = Date.now();

const answer = await contributorAIService.askContributor({
  contributorName,
  question,
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