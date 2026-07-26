const {
  cloneRepository,
  getCommits,
  getContributors,
  getCommitStats,
} = require("./gitService");

const { createTimeline } = require("./analyticsService");
const { getFileChanges } = require("./fileAnalyticsService");
const { calculateHotspots } = require("./hotspotService");

async function analyzeRepository(url) {
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
  const hotspots = calculateHotspots(
    fileChanges,
    contributors
  );

  return {
    repoPath,
    stats,
    contributors,
    timeline,
    fileChanges,
    hotspots,
    recentCommits: commits.slice(0, 5),
    allCommits: commits,
  };
}

module.exports = {
  analyzeRepository,
};