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
const { generateHotspotInsights } = require("./hotspotAIService");

const {
  createAnalysisSession,
  updateAnalysisSession,
  getAnalysisSession,
} = require("./sessionService");

let stepCounter = 0;

function logStep(message) {
  stepCounter += 1;
  console.log(`${stepCounter}️⃣ ${message}`);
}

/**
 * Single source of truth for background state initialization.
 */
function pendingBackgroundFields() {
  return {
    architecture: null,
    architecturePending: true,
    architectureError: null,

    codeEvolution: null,
    codeEvolutionPending: true,
    codeEvolutionError: null,

    hotspotInsights: null,
    hotspotInsightsPending: true,
    hotspotInsightsError: null,

    vectorIndexingPending: true,
    vectorIndexingError: null,

    healthScorePending: true,
    healthScoreError: null,
  };
}

/**
 * Runs vector/RAG indexing in the background asynchronously.
 */
function startBackgroundIndexing(repoPath, repositoryId) {
  console.log("🔍 Starting background repository vector indexing...");

  indexRepository(repoPath, repositoryId)
    .then(() => {
      console.log("✅ Background repository indexing completed!");
      updateAnalysisSession(repositoryId, {
        vectorIndexingPending: false,
        vectorIndexingError: null,
      });
    })
    .catch((error) => {
      console.error(
        "❌ Background repository indexing failed:",
        error.message
      );
      updateAnalysisSession(repositoryId, {
        vectorIndexingPending: false,
        vectorIndexingError: error.message,
      });
    });
}

/**
 * Fires off AI hotspot insights in the background.
 */
function startBackgroundAIWork(repositoryId, hotspots) {
  setImmediate(async () => {
    try {
      const hotspotInsights = await generateHotspotInsights(
        hotspots.hotspots
      );
      updateAnalysisSession(repositoryId, {
        hotspotInsights,
        hotspotInsightsPending: false,
        hotspotInsightsError: null,
      });
      console.log("✅ AI Hotspot Insights completed");
    } catch (err) {
      console.error("❌ Hotspot Insight Error:", err.message);
      updateAnalysisSession(repositoryId, {
        hotspotInsightsPending: false,
        hotspotInsightsError: err.message,
      });
    }
  });
}

/**
 * Runs Architecture parsing + Code Evolution (churn) in the background.
 * Recalculates the final project health score once BOTH have landed.
 */
function startBackgroundArchitectureAndEvolution(
  repoPath,
  repositoryId,
  fileAnalysis,
  hotspots
) {
  const maybeFinalizeHealthScore = () => {
    const session = getAnalysisSession(repositoryId);
    if (!session) return;

    if (session.architecturePending || session.codeEvolutionPending) return;

    try {
      const healthScore = calculateProjectHealth({
        architecture: session.architecture,
        fileAnalysis,
        hotspots: hotspots.hotspots,
        codeEvolution: session.codeEvolution,
      });

      updateAnalysisSession(repositoryId, {
        healthScore,
        healthScorePending: false,
        healthScoreError: null,
      });
      console.log("❤️ PROJECT HEALTH (finalized):", healthScore);
    } catch (err) {
      console.error("❌ Final health score calculation failed:", err.message);
      updateAnalysisSession(repositoryId, {
        healthScorePending: false,
        healthScoreError: err.message,
      });
    }
  };

  // Background Architecture job
  setImmediate(async () => {
    try {
      const architecture = buildArchitecture(repoPath);
      console.log(
        "🏗️ ARCHITECTURE RESULT:",
        architecture ? "Generated Successfully" : "Null/Undefined"
      );

      updateAnalysisSession(repositoryId, {
        architecture,
        architecturePending: false,
        architectureError: null,
      });
      console.log("✅ Architecture Tree generated");
    } catch (err) {
      console.error("❌ Background architecture failed:", err.message);
      updateAnalysisSession(repositoryId, {
        architecturePending: false,
        architectureError: err.message,
      });
    } finally {
      maybeFinalizeHealthScore();
    }
  });

  // Background Code Evolution job
  setImmediate(async () => {
    try {
      const codeEvolution = await getCodeChurn(repoPath);
      updateAnalysisSession(repositoryId, {
        codeEvolution,
        codeEvolutionPending: false,
        codeEvolutionError: null,
      });
      console.log("✅ Code Evolution calculated");
    } catch (err) {
      console.error("❌ Background code evolution failed:", err.message);
      updateAnalysisSession(repositoryId, {
        codeEvolutionPending: false,
        codeEvolutionError: err.message,
      });
    } finally {
      maybeFinalizeHealthScore();
    }
  });
}

/**
 * Main Repository Analysis Flow
 */
async function analyzeRepository(url, repositoryId) {
  if (typeof url !== "string" || !url.trim()) {
    throw new Error("analyzeRepository: 'url' must be a non-empty string");
  }
  if (!repositoryId) {
    throw new Error("analyzeRepository: 'repositoryId' is required");
  }

  stepCounter = 0;

  createAnalysisSession(repositoryId, {
    status: "processing",
    url,
    aiFileExplanations: {},
    ...pendingBackgroundFields(),
  });

  try {
    logStep("Cloning repository...");
    const repoPath = await cloneRepository(url);

    logStep("Gathering core repository data...");
    const [commits, contributors, branchData] = await Promise.all([
      getCommits(repoPath),
      getContributors(repoPath),
      getBranches(repoPath),
    ]);

    const stats = getCommitStats(commits);
    const commitStatistics = getCommitStatistics(commits);

    logStep("Analyzing files and building timeline...");
    const [fileAnalysis, timeline] = await Promise.all([
      getFileChanges(repoPath),
      Promise.resolve(createTimeline(commits)),
    ]);

    logStep("Analyzing languages...");
    const languageAnalysis = analyzeLanguages(fileAnalysis);

    logStep("Calculating hotspots...");
    const hotspots = calculateHotspots(fileAnalysis, contributors);

    logStep("Calculating initial health score (provisional)...");
    const provisionalHealthScore = calculateProjectHealth({
      architecture: null,
      fileAnalysis,
      hotspots: hotspots.hotspots,
      codeEvolution: null,
    });

    updateAnalysisSession(repositoryId, {
      status: "ready",
      repoPath,

      stats,
      commitStatistics,
      contributors,
      timeline,
      fileAnalysis,
      languageAnalysis,

      hotspots: hotspots.hotspots,
      allScoredHotspots: hotspots.allScored,

      branches: branchData,

      healthScore: provisionalHealthScore,

      recentCommits: commits.slice(0, 5),
      allCommits: commits,

      ...pendingBackgroundFields(),
    });

    startBackgroundArchitectureAndEvolution(
      repoPath,
      repositoryId,
      fileAnalysis,
      hotspots
    );
    startBackgroundIndexing(repoPath, repositoryId);
    startBackgroundAIWork(repositoryId, hotspots);

    logStep("Dashboard response ready! (Background processing queued)");

    return {
      repoPath,

      stats,
      commitStatistics,
      contributors,
      timeline,
      fileAnalysis,
      languageAnalysis,

      hotspots: hotspots.hotspots,
      allScoredHotspots: hotspots.allScored,

      branches: branchData,

      healthScore: provisionalHealthScore,

      recentCommits: commits.slice(0, 5),
      allCommits: commits,

      ...pendingBackgroundFields(),
    };
  } catch (error) {
    console.error("❌ Repository analysis failed:", error.message);
    updateAnalysisSession(repositoryId, {
      status: "failed",
      error: error.message,
    });
    throw error;
  }
}

module.exports = {
  analyzeRepository,
};