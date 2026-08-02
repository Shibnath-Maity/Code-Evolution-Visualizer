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
} = require("../services/gitService");
const { analyzeRepository } = require("../services/analysisService");

const { createTimeline } = require("../services/analyticsService");
const { getFileChanges } = require("../services/fileAnalyticsService");
const { calculateHotspots } = require("../services/hotspotService");
const { getRepositoryInfo } = require("../services/githubService");
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
// Test Route
router.get("/info", (req, res) => {
  res.json({
    name: "Code Evolution Visualizer",
    owner: "Shibnath Maity",
    contributors: 5,
    stars: 100,
  });
});
//Add repo
router.get("/repo-info", async (req, res) => {
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

// Analyze Repository
router.post("/analytics", async (req, res) => {
  try {
const { url, repositoryId } = req.body;
  //  const repositoryId = crypto.randomUUID();
console.log("Repository ID from frontend:", repositoryId);
    console.log("🚀 Starting repository analysis...");

    // Normal repository analysis
    const result = await analyzeRepository(url, repositoryId);
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
  languageAnalysis: result.languageAnalysis,
  codeEvolution: result.codeEvolution,
  repoPath: result.repoPath,   // ⭐ ADD THIS
  hotspots: result.hotspots,
  allScoredHotspots: result.allScoredHotspots,

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
    console.error("❌ Backend Error:");
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/calendar", async (req, res) => {
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
router.get("/commit/:hash", async (req, res) => {
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
router.get("/commit/:hash/diff", async (req, res) => {
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

router.get("/commit/:hash/summary", async (req, res) => {
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


module.exports = router;