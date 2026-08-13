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

/* ==========================================================
   SCOPED LOGGING (Thread-Safe / Multi-User Safe)
========================================================== */
function logStep(repositoryId, message) {
  console.log(`[Repo ${repositoryId}] ${message}`);
}

/* ==========================================================
   BACKGROUND STATE INITIALIZER
========================================================== */
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
 * Validates that the active session matches the running background job.
 * Discards background results if a newer analysis run superseded this job.
 */
function isSessionActive(userId, repositoryId, executionId) {
  const session = getAnalysisSession(userId, repositoryId);
  return session && session.executionId === executionId;
}

/* ==========================================================
   BACKGROUND VECTOR / RAG INDEXING
========================================================== */
function startBackgroundIndexing(userId, repoPath, repositoryId, executionId) {
  logStep(repositoryId, "🔍 Starting background repository vector indexing...");

  // FIX: indexRepository's signature is (repoPath, userId, repositoryId) —
  // this previously passed (repoPath, repositoryId, userId), swapping the two IDs.
  indexRepository(repoPath, userId, repositoryId)
    .then(() => {
      if (!isSessionActive(userId, repositoryId, executionId)) return;

      logStep(repositoryId, "✅ Background repository indexing completed!");
      updateAnalysisSession(userId, repositoryId, {
        vectorIndexingPending: false,
        vectorIndexingError: null,
      });
    })
    .catch((error) => {
      if (!isSessionActive(userId, repositoryId, executionId)) return;

      console.error(`[Repo ${repositoryId}] ❌ Background indexing failed:`, error.message);
      updateAnalysisSession(userId, repositoryId, {
        vectorIndexingPending: false,
        vectorIndexingError: error.message,
      });
    });
}

/* ==========================================================
   BACKGROUND AI HOTSPOT INSIGHTS
========================================================== */
function startBackgroundAIWork(userId, repositoryId, hotspots, executionId) {
  setImmediate(async () => {
    try {
      const hotspotInsights = await generateHotspotInsights(hotspots.hotspots);

      if (!isSessionActive(userId, repositoryId, executionId)) return;

      updateAnalysisSession(userId, repositoryId, {
        hotspotInsights,
        hotspotInsightsPending: false,
        hotspotInsightsError: null,
      });

      logStep(repositoryId, "✅ AI Hotspot Insights completed");
    } catch (err) {
      if (!isSessionActive(userId, repositoryId, executionId)) return;

      console.error(`[Repo ${repositoryId}] ❌ Hotspot Insight Error:`, err.message);
      updateAnalysisSession(userId, repositoryId, {
        hotspotInsightsPending: false,
        hotspotInsightsError: err.message,
      });
    }
  });
}

/* ==========================================================
   BACKGROUND ARCHITECTURE + CODE EVOLUTION
========================================================== */
function startBackgroundArchitectureAndEvolution(
  userId,
  repoPath,
  repositoryId,
  fileAnalysis,
  hotspots,
  executionId
) {
  const maybeFinalizeHealthScore = () => {
    if (!isSessionActive(userId, repositoryId, executionId)) return;

    const session = getAnalysisSession(userId, repositoryId);
    if (!session || session.architecturePending || session.codeEvolutionPending) {
      return;
    }

    try {
      const healthScore = calculateProjectHealth({
        architecture: session.architecture,
        fileAnalysis,
        hotspots: hotspots.hotspots,
        codeEvolution: session.codeEvolution,
      });

      updateAnalysisSession(userId, repositoryId, {
        healthScore,
        healthScorePending: false,
        healthScoreError: null,
      });

      logStep(repositoryId, `❤️ PROJECT HEALTH (finalized): ${healthScore}`);
    } catch (err) {
      console.error(`[Repo ${repositoryId}] ❌ Final health score failed:`, err.message);
      updateAnalysisSession(userId, repositoryId, {
        healthScorePending: false,
        healthScoreError: err.message,
      });
    }
  };

  /* ----------------------------------------------------------
     Architecture
  ---------------------------------------------------------- */
  setImmediate(async () => {
    try {
      const architecture = buildArchitecture(repoPath);

      if (!isSessionActive(userId, repositoryId, executionId)) return;

      updateAnalysisSession(userId, repositoryId, {
        architecture,
        architecturePending: false,
        architectureError: null,
      });

      logStep(repositoryId, "✅ Architecture Tree generated");
    } catch (err) {
      if (!isSessionActive(userId, repositoryId, executionId)) return;

      console.error(`[Repo ${repositoryId}] ❌ Background architecture failed:`, err.message);
      updateAnalysisSession(userId, repositoryId, {
        architecturePending: false,
        architectureError: err.message,
      });
    } finally {
      maybeFinalizeHealthScore();
    }
  });

  /* ----------------------------------------------------------
     Code Evolution
  ---------------------------------------------------------- */
  setImmediate(async () => {
    try {
      const codeEvolution = await getCodeChurn(repoPath);

      if (!isSessionActive(userId, repositoryId, executionId)) return;

      updateAnalysisSession(userId, repositoryId, {
        codeEvolution,
        codeEvolutionPending: false,
        codeEvolutionError: null,
      });

      logStep(repositoryId, "✅ Code Evolution calculated");
    } catch (err) {
      if (!isSessionActive(userId, repositoryId, executionId)) return;

      console.error(`[Repo ${repositoryId}] ❌ Background code evolution failed:`, err.message);
      updateAnalysisSession(userId, repositoryId, {
        codeEvolutionPending: false,
        codeEvolutionError: err.message,
      });
    } finally {
      maybeFinalizeHealthScore();
    }
  });
}

/* ==========================================================
   MAIN REPOSITORY ANALYSIS FLOW
========================================================== */
async function analyzeRepository(url, userId, repositoryId) {
  if (typeof url !== "string" || !url.trim()) {
    throw new Error("analyzeRepository: 'url' must be a non-empty string");
  }
  if (!userId) {
    throw new Error("analyzeRepository: 'userId' is required");
  }
  if (!repositoryId) {
    throw new Error("analyzeRepository: 'repositoryId' is required");
  }

  // Unique ID to prevent concurrent run race conditions
  const executionId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  /* ----------------------------------------------------------
     Create user-isolated analysis session
  ---------------------------------------------------------- */
  createAnalysisSession(userId, repositoryId, {
    executionId,
    status: "processing",
    url,
    ...pendingBackgroundFields(),
  });

  try {
    logStep(repositoryId, "Cloning repository...");

    // Extract both repoPath and commitSha from cloneRepository object response
    const { repoPath, commitSha } = await cloneRepository(url, userId, repositoryId);

    logStep(repositoryId, "Gathering core repository data...");
    const [commits, contributors, branchData] = await Promise.all([
      getCommits(repoPath),
      getContributors(repoPath),
      getBranches(repoPath),
    ]);

    const stats = getCommitStats(commits);
    const commitStatistics = getCommitStatistics(commits);

    logStep(repositoryId, "Analyzing files and building timeline...");
    const [fileAnalysis, timeline] = await Promise.all([
      getFileChanges(repoPath),
      Promise.resolve(createTimeline(commits)),
    ]);

    logStep(repositoryId, "Analyzing languages...");
    const languageAnalysis = analyzeLanguages(fileAnalysis);

    logStep(repositoryId, "Calculating hotspots...");
    const hotspots = calculateHotspots(fileAnalysis, contributors);

    logStep(repositoryId, "Calculating initial health score (provisional)...");
    const provisionalHealthScore = calculateProjectHealth({
      architecture: null,
      fileAnalysis,
      hotspots: hotspots.hotspots,
      codeEvolution: null,
    });

    const sessionPayload = {
      executionId,
      status: "ready",
      repoPath,
      commitSha,
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

    /* ----------------------------------------------------------
       Save initial analysis into USER-SPECIFIC session
    ---------------------------------------------------------- */
    updateAnalysisSession(userId, repositoryId, sessionPayload);

    /* ----------------------------------------------------------
       Queue Background Jobs (tracked via executionId)
    ---------------------------------------------------------- */
    startBackgroundArchitectureAndEvolution(
      userId,
      repoPath,
      repositoryId,
      fileAnalysis,
      hotspots,
      executionId
    );

    startBackgroundIndexing(userId, repoPath, repositoryId, executionId);
    startBackgroundAIWork(userId, repositoryId, hotspots, executionId);

    logStep(repositoryId, "Dashboard response ready! (Background processing queued)");

    return sessionPayload;
  } catch (error) {
    console.error(`[Repo ${repositoryId}] ❌ Repository analysis failed:`, error.message);

    if (isSessionActive(userId, repositoryId, executionId)) {
      updateAnalysisSession(userId, repositoryId, {
        status: "failed",
        error: error.message,
      });
    }

    throw error;
  }
}

module.exports = {
  analyzeRepository,
};