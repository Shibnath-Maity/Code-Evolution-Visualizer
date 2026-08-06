const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const { solveBug } = require("../services/bugSolverService");
const { getCurrentRepository } = require("../services/repositoryContext");

router.post("/bug-solver", protect, async (req, res) => {
  try {
    const { error, repositoryId } = req.body;

    if (!error?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Error message is required.",
      });
    }

    if (!repositoryId) {
      return res.status(400).json({
        success: false,
        message: "repositoryId is required.",
      });
    }

    const repoPath = getCurrentRepository(repositoryId);

    if (!repoPath) {
      return res.status(400).json({
        success: false,
        message: "Repository not analyzed yet.",
      });
    }

    const result = await solveBug({
      error,
      repoPath,
      repositoryId,
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