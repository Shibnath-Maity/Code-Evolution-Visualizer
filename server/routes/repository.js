const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const {
  cloneRepository,
  getCommits,
  getContributors,
  getCommitStats,
  getCommitDiff,
  getCommitDetails,
  getAICommitData,
    getFileHistory,
} = require("../services/gitService");
const { analyzeRepository } = require("../services/analysisService");
const { solveIssue } = require("../services/issueSolverService");
const { createTimeline } = require("../services/analyticsService");
const { getFileChanges } = require("../services/fileAnalyticsService");
const { calculateHotspots } = require("../services/hotspotService");
const {
  getRepositoryInfo,
  getRepositoryIssues,
  getRepositoryIssue,
} = require("../services/githubService");
const { indexRepository } = require("../services/vectorService");
const {
  setCurrentRepository,
} = require("../services/repositoryContext");
const {
  generateCommitSummary,
} = require("../services/aiCommitService");
const {
  getCommitCalendar,
} = require("../services/calendarService");
let currentRepoPath = "";
const protect = require("../middleware/authMiddleware");
// Test Route
const {
  explainFile,
} = require("../services/fileExplanationService");

const {
  buildArchitecture,
} = require("../services/architectureService");
router.get("/info", (req, res) => {
  res.json({
    name: "Code Evolution Visualizer",
    owner: "Shibnath Maity",
    contributors: 5,
    stars: 100,
  });
});
//Add repo
router.get("/repo-info", protect, async (req, res) => {
  try {
    const { url } = req.query;

    const repo = await getRepositoryInfo(url);

    res.json(repo);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// ==========================================
// Fetch Repository Issues
// ==========================================
router.post("/issues", protect, async (req, res) => {
  try {
    const { repoUrl } = req.body;

    if (!repoUrl) {
      return res.status(400).json({
        success: false,
        message: "Repository URL is required",
      });
    }

    const repo = await getRepositoryInfo(repoUrl);

    const issues = await getRepositoryIssues(
      repo.owner,
      repo.repo
    );

    res.json({
      success: true,
      repository: repo,
      issues,
    });

  } catch (error) {
    console.error("Issue Fetch Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// AI Issue Solver
// ==========================================
// ==========================================
// AI Issue Solver
// ==========================================
router.post("/issue-solution", protect, async (req, res) => {
  try {
    const { owner, repo, issueNumber } = req.body;

    if (!owner || !repo || !issueNumber) {
      return res.status(400).json({
        success: false,
        message: "owner, repo and issueNumber are required",
      });
    }

    // Make sure repository is analyzed
    if (!currentRepoPath) {
      return res.status(400).json({
        success: false,
        message: "Analyze the repository first.",
      });
    }

    // Fetch issue from GitHub
    const issue = await getRepositoryIssue(
      owner,
      repo,
      issueNumber
    );

    // Ask Gemini to solve it
    const solution = await solveIssue({
      issue,
      repoPath: currentRepoPath,
    });

    res.json({
      success: true,
      issue,
      solution,
    });

  } catch (error) {
    console.error("Issue Solver Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// Analyze Repository
router.post("/analytics", protect, async (req, res) => {
  try {
const { url, repositoryId } = req.body;
  //  const repositoryId = crypto.randomUUID();
console.log("Repository ID from frontend:", repositoryId);
    console.log("🚀 Starting repository analysis...");

    // Normal repository analysis
    const result = await analyzeRepository(url, repositoryId);
    console.log("===== ANALYSIS RESULT =====");
console.log(result);
console.log("repoPath =", result.repoPath);
    setCurrentRepository(
  repositoryId,
  result.repoPath
);

console.log("Current Repository:", {
  repositoryId,
  repoPath: result.repoPath,
});
currentRepoPath = result.repoPath;

// Save repository for AI Assistant / Debug Center
setCurrentRepository(repositoryId, result.repoPath);

console.log("✅ Current Repository Saved");
console.log({
  repositoryId,
  repoPath: result.repoPath,
});

console.log(result.commitStatistics);
    currentRepoPath = result.repoPath;

    console.log("8️⃣ Sending dashboard response...");

    // Send dashboard immediately
    res.json({
        repositoryId,
  stats: result.stats,
  contributors: result.contributors,
  timeline: result.timeline,
  fileAnalysis: result.fileAnalysis,
  aiFileAnalysis: result.aiFileAnalysis,
  languageAnalysis: result.languageAnalysis,
  codeEvolution: result.codeEvolution,
  repoPath: result.repoPath,   // ⭐ ADD THIS
  hotspots: result.hotspots,
  allScoredHotspots: result.allScoredHotspots,

  hotspotInsights: result.hotspotInsights, 
  branches: result.branches,
  recentCommits: result.recentCommits,
  allCommits: result.allCommits,
    // 🏗️ Repository Architecture
  architecture: result.architecture,
  commitStatistics: result.commitStatistics,
    });

    // ==========================================
    // Background RAG Indexing (does NOT block UI)
    // ==========================================
//     setImmediate(() => {
//       console.log("\n🧠 Starting background RAG indexing...");
//  console.log("Repository ID:", repositoryId);
//   console.log("Repository Path:", result.repoPath);
//       indexRepository(result.repoPath, repositoryId)
      
//         .then(() => {
//           console.log("✅ Background RAG indexing completed!");
//         })
//         .catch((err) => {
//           console.error(
//             "❌ Background RAG indexing failed:",
//             err.message
//           );
//         });
//     });

  } catch (error) {
    console.error("========== BACKEND ERROR ==========");
    console.error(error);
    console.error(error.stack);

    res.status(500).json({
        success: false,
        message: error.message,
        stack: error.stack,
    });
}
});

router.get("/calendar", protect, async (req, res) => {
  try {
    const { repoPath } = req.query;

    if (!repoPath) {
      return res.status(400).json({
        error: "repoPath is required",
      });
    }

    const calendar = await getCommitCalendar(repoPath);

    res.json(calendar);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Unable to generate calendar",
    });
  }
});

// Commit Details
router.get("/commit/:hash", protect, async (req, res) => {
  try {
    const { hash } = req.params;

    if (!currentRepoPath) {
      return res.status(400).json({
        success: false,
        message: "Repository not analyzed yet.",
      });
    }

    const data = await getCommitDetails(currentRepoPath, hash);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Commit Diff
router.get("/commit/:hash/diff", protect, async (req, res) => {
  try {
    const { hash } = req.params;

    if (!currentRepoPath) {
      return res.status(400).json({
        success: false,
        message: "Repository not analyzed yet.",
      });
    }

    const data = await getCommitDiff(currentRepoPath, hash);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// ==========================================
// AI Commit Summary
// ==========================================

router.get("/commit/:hash/summary", protect, async (req, res) => {
  try {
    const { hash } = req.params;

    if (!currentRepoPath) {
      return res.status(400).json({
        success: false,
        message: "Repository not analyzed yet.",
      });
    }

    // Get commit information
    const commit = await getAICommitData(currentRepoPath, hash);

    // Generate AI summary
    const summary = await generateCommitSummary(commit);

    res.json({
      success: true,
      data: summary,
    });

  } catch (error) {
    console.error("AI Commit Summary Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// ==========================================
// AI File Explanation
// ==========================================


// ==========================================
// AI File Explanation
// ==========================================
router.post("/file-explanation", protect, async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: "filePath is required",
      });
    }

    if (!currentRepoPath) {
      return res.status(400).json({
        success: false,
        message: "Analyze repository first.",
      });
    }

    console.log("currentRepoPath:", currentRepoPath);
    console.log("filePath:", filePath);

    const architecture = buildArchitecture(currentRepoPath);

    const explanation = await explainFile(
      currentRepoPath,
      filePath,
      architecture
    );

    res.json({
      success: true,
      data: explanation,
    });

  } catch (error) {
    console.error("File Explanation Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// File Commit History + Co-Change (for Hotspot details panel)
// ==========================================

router.get("/hotspots/commits", protect, async (req, res) => {
  try {
    const { file } = req.query;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "file query param is required.",
      });
    }

    if (!currentRepoPath) {
      return res.status(400).json({
        success: false,
        message: "Repository not analyzed yet.",
      });
    }

    const data = await getFileHistory(currentRepoPath, file);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("File History Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;