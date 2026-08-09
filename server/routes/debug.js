const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const { solveBug } = require("../services/bugSolverService");
const { getAnalysisSession } = require("../services/sessionService");

router.post("/bug-solver", protect, async (req, res) => {
  try {
    const { error, repositoryId } = req.body;

    // ------------------------------------------
    // Validate error
    // ------------------------------------------
    if (typeof error !== "string" || !error.trim()) {
      return res.status(400).json({
        success: false,
        message: "Error message is required.",
      });
    }

    // ------------------------------------------
    // Validate repositoryId
    // ------------------------------------------
    if (!repositoryId) {
      return res.status(400).json({
        success: false,
        message: "repositoryId is required.",
      });
    }

    // ------------------------------------------
    // Get repository session
    // ------------------------------------------
    const session = getAnalysisSession(repositoryId);

    if (!session || !session.repoPath) {
      return res.status(400).json({
        success: false,
        message: "Repository not analyzed yet, or session has expired.",
      });
    }

    const repoPath = session.repoPath;

    console.log("\n========== BUG SOLVER ROUTE ==========");
    console.log("Repository ID:", repositoryId);
    console.log("Repository Path:", repoPath);

    // ------------------------------------------
    // Solve
    // ------------------------------------------
    const result = await solveBug({
      error,
      repoPath,
      repositoryId,
    });

    // ------------------------------------------
    // Response
    // ------------------------------------------
    return res.json({
      success: true,
      data: result,
      processingTimeMs: result?.processingTimeMs || null,
      model: result?.model || "Gemini",
    });
  } catch (err) {
    console.error("❌ Bug Solver Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Bug analysis failed.",
    });
  }
});

module.exports = router;