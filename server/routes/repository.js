const express = require("express");
const router = express.Router();

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
    const { url } = req.body;

    console.log("🚀 Starting repository analysis...");

    const result = await analyzeRepository(url);

    // Keep repo path available for commit details and diff
    currentRepoPath = result.repoPath;

    console.log("8️⃣ Sending response...");

    res.json({
      stats: result.stats,
      contributors: result.contributors,
      timeline: result.timeline,
      fileChanges: result.fileChanges,
      hotspots: result.hotspots,
      recentCommits: result.recentCommits,
      allCommits: result.allCommits,
    });

  } catch (error) {
    console.error("❌ Backend Error:");
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/commit/:hash", async (req, res) => {
  console.log("Commit API Called");

  try {
    const { hash } = req.params;

    console.log("Hash:", hash);
    console.log("Repo Path:", currentRepoPath);

    const commit = await getCommitDetails(currentRepoPath, hash);

    console.log("Commit fetched successfully");

    res.json({
      success: true,
      data: commit,
    });
  } catch (error) {
    console.log("ERROR OCCURRED");
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
router.get("/commit/:hash/diff", async (req, res) => {
  try {
    const { hash } = req.params;

    console.log("Diff API Called");
    console.log("Hash:", hash);
    console.log("Repo Path:", currentRepoPath);

    const diff = await getCommitDiff(currentRepoPath, hash);

    res.json({
      success: true,
      data: diff,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
module.exports = router;