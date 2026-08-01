const express = require("express");
const router = express.Router();

const { solveBug } = require("../services/bugSolverService");

router.post("/bug-solver", async (req, res) => {
  try {
    const { error } = req.body;

    if (!error?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Error message is required.",
      });
    }
const result = await solveBug({
  error,
  repoPath: null,
  repositoryId: null,
});

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("❌ Bug Solver Error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;