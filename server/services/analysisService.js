const {
  cloneRepository,
  getCommits,
  getContributors,
  getCommitStats,
} = require("./gitService");

const { getBranches } = require("./branchService");
const { createTimeline } = require("./analyticsService");
const { getFileChanges } = require("./fileAnalyticsService");
const { calculateHotspots } = require("./hotspotService");
const { analyzeLanguages } = require("./languageService");
const { getCodeChurn } = require("./churnService");
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
  const fileAnalysis = await getFileChanges(repoPath);


  console.log("7️⃣ Analyzing languages...");
const languageAnalysis = analyzeLanguages(fileAnalysis);
console.log("8️⃣ Calculating code evolution...");
const codeEvolution = await getCodeChurn(repoPath);



  console.log("9 Calculating hotspots...");
  const hotspots = calculateHotspots(
    fileAnalysis,
    contributors
  );

  console.log("10 Getting branches...");
  const branchData = await getBranches(repoPath);

  console.log("11 Analysis completed!");

  return {
   repoPath,

  stats,
  contributors,
  timeline,

  // File analysis
  fileAnalysis,

  // Language analysis
  languageAnalysis,

   codeEvolution,

  // Hotspots
  hotspots,

  // Branch analysis
  branches: branchData,

  // Commits
  recentCommits: commits.slice(0, 5),
  allCommits: commits,
  };
}

module.exports = {
  analyzeRepository,
};