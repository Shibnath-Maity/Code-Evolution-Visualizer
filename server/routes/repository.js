const express = require("express");
const router = express.Router();

const {
  cloneRepository,
  getCommits,
  getContributors,
  getCommitStats,
} = require("../services/gitService");

const { createTimeline } = require("../services/analyticsService");
const { getFileChanges } = require("../services/fileAnalyticsService");
const { calculateHotspots } = require("../services/hotspotService");

// Test Route
router.get("/info", (req, res) => {
  res.json({
    name: "Code Evolution Visualizer",
    owner: "Shibnath Maity",
    contributors: 5,
    stars: 100,
  });
});

// Analyze Repository
router.post("/analytics", async (req, res) => {
  try {
    const { url } = req.body;

    console.log("1️⃣ Cloning repository...");
    const repoPath = await cloneRepository(url);

    console.log("2️⃣ Getting commits...");
    const commits = await getCommits(repoPath);

    console.log("3️⃣ Getting contributors...");
    const contributors = await getContributors(repoPath);

    console.log("4️⃣ Getting commit stats...");
    const stats = await getCommitStats(repoPath);

    console.log("5️⃣ Creating timeline...");
    const timeline = createTimeline(commits);

    console.log("6️⃣ Getting file changes...");
    const fileChanges = await getFileChanges(repoPath);

    console.log("7️⃣ Calculating hotspots...");
    const hotspots = calculateHotspots(fileChanges, contributors);

    console.log("8️⃣ Sending response...");

    res.json({
      stats,
      contributors,
      timeline,
      fileChanges,
      hotspots,
      recentCommits: commits.slice(0, 5),
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

module.exports = router;