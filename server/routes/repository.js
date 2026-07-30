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
} = require("../services/gitService");
const { analyzeRepository } = require("../services/analysisService");

const { createTimeline } = require("../services/analyticsService");
const { getFileChanges } = require("../services/fileAnalyticsService");
const { calculateHotspots } = require("../services/hotspotService");
const { getRepositoryInfo } = require("../services/githubService");
const { indexRepository } = require("../services/vectorService");
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
      hotspots: result.hotspots,
      branches: result.branches,
      recentCommits: result.recentCommits,
      allCommits: result.allCommits,
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

module.exports = router;