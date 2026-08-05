const {
  cloneRepository,
  getCommits,
  getContributors,
  getCommitStats,
} = require("./gitService");

const { buildArchitecture } = require("./architectureService");
const { indexRepository } = require("./vectorService");
const { getBranches } = require("./branchService");
const { createTimeline } = require("./analyticsService");
const { getCommitStatistics } = require("./commitStatisticsService");
const { getFileChanges } = require("./fileAnalyticsService");
const { calculateHotspots } = require("./hotspotService");
const { analyzeLanguages } = require("./languageService");
const { getCodeChurn } = require("./churnService");
const { calculateProjectHealth } = require("./healthService");
const {
    generateHotspotInsights
} = require("./hotspotAIService");
// NEW
const { setCurrentRepository } = require("./repositoryContext");
const {
  analyzeRepositoryFiles,
} = require("./aiFileAnalysisService");
let stepCounter = 0;

function logStep(message) {
  stepCounter += 1;
  console.log(`${stepCounter}️⃣ ${message}`);
}

function startBackgroundIndexing(repoPath, repositoryId) {
  console.log("🔍 Starting background repository indexing...");
  console.log("Repository:", repoPath);
  console.log("Repository ID:", repositoryId);

  const indexingPromise = indexRepository(repoPath, repositoryId)
    .then(() => {
      console.log("✅ Background repository indexing completed!");
    })
    .catch((error) => {
      console.error(
        "❌ Background repository indexing failed:",
        error.message
      );
      throw error;
    });

  indexingPromise.catch(() => {});

  return indexingPromise;
}

async function analyzeRepository(url, repositoryId) {
  if (typeof url !== "string" || !url.trim()) {
    throw new Error("analyzeRepository: 'url' must be a non-empty string");
  }

  if (!repositoryId) {
    throw new Error("analyzeRepository: 'repositoryId' is required");
  }

  stepCounter = 0;

  try {
   // Clone Repository
logStep("Cloning repository...");
const repoPath = await cloneRepository(url);

// Build Architecture
logStep("Building repository architecture...");
const architecture = buildArchitecture(repoPath);

// Save repository AFTER architecture is available
setCurrentRepository(
  repositoryId,
  repoPath,
  architecture
);
    console.log("===== ARCHITECTURE =====");
console.log("repoPath =", repoPath);
console.log(architecture.dashboard);
console.log(architecture.tree);
console.log("Architecture:");
console.log(JSON.stringify(architecture, null, 2));
    // Background indexing
    const indexingPromise = startBackgroundIndexing(
      repoPath,
      repositoryId
    );

    // Git Data
    logStep("Gathering repository data...");

    const [commits, contributors, branchData] = await Promise.all([
      getCommits(repoPath),
      getContributors(repoPath),
      getBranches(repoPath),
    ]);

    const stats = getCommitStats(commits);

    const commitStatistics = getCommitStatistics(commits);

    const [fileAnalysis, codeEvolution] = await Promise.all([
      getFileChanges(repoPath),
      getCodeChurn(repoPath),
    ]);
    // AI File Analysis
logStep("Analyzing repository files with AI...");

const aiFileAnalysis =
  await analyzeRepositoryFiles(fileAnalysis);

    // Timeline
    logStep("Building timeline...");
    const timeline = createTimeline(commits);

    // Languages
    logStep("Analyzing languages...");
    const languageAnalysis = analyzeLanguages(fileAnalysis);

    // Hotspots
   // Hotspots
logStep("Calculating hotspots...");

const hotspots = calculateHotspots(
  fileAnalysis,
  contributors
);

logStep("Generating AI hotspot insights...");

let hotspotInsights = [];

try {
    hotspotInsights = await generateHotspotInsights(
        hotspots.hotspots
    );
} catch (err) {
    console.error("Hotspot Insight Error:");
    console.error(err);
}
    // Health
    logStep("Calculating project health...");

    const healthScore = calculateProjectHealth({
      architecture,
      fileAnalysis,
      hotspots: hotspots.hotspots,
      codeEvolution,
    });

    console.log("❤️ PROJECT HEALTH:", healthScore);

    logStep("Analysis completed!");

    return {
      repoPath,

      // Dashboard
      stats,
      commitStatistics,

      // Contributors
      contributors,

      // Timeline
      timeline,

      // Files
      fileAnalysis,
// AI File Analysis
aiFileAnalysis,
      // Languages
      languageAnalysis,

      // Code Evolution
      codeEvolution,

      // Architecture
      architecture,

      // Hotspots
      hotspots: hotspots.hotspots,
      allScoredHotspots: hotspots.allScored,
hotspotInsights,
      // Branches
      branches: branchData,

      // Health
      healthScore,

      // Commits
      recentCommits: commits.slice(0, 5),
      allCommits: commits,

      // Background indexing
      indexingPromise,
    };
  } catch (error) {
    console.error(
      "❌ Repository analysis failed:",
      error.message
    );
    throw error;
  }
}

module.exports = {
  analyzeRepository,
};