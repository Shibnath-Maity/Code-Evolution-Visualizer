const {
  cloneRepository,
  getCommits,
  getContributors,
  getCommitStats,
} = require("./gitService");
const { indexRepository } = require("./vectorService");
const { getBranches } = require("./branchService");
const { createTimeline } = require("./analyticsService");
const { getFileChanges } = require("./fileAnalyticsService");
const { calculateHotspots } = require("./hotspotService");
const { analyzeLanguages } = require("./languageService");
const { getCodeChurn } = require("./churnService");

let stepCounter = 0;

function logStep(message) {
  stepCounter += 1;
  console.log(`${stepCounter}️⃣ ${message}`);
}

/**
 * Kicks off repository indexing in the background. Does NOT block
 * analysis — indexing (embeddings/vector store) can take much longer
 * than the git-stats analysis below and isn't required for it.
 *
 * Returns the promise so callers that *do* care about completion
 * (e.g. to update a job-status record) can hook into it, without
 * forcing every caller to wait on it.
 */
function startBackgroundIndexing(repoPath, repositoryId) {
  console.log("🔍 Starting background repository indexing...");
  console.log("Repository:", repoPath);
  console.log("Repository ID:", repositoryId);

  const indexingPromise = indexRepository(repoPath, repositoryId)
    .then(() => {
      console.log("✅ Background repository indexing completed!");
    })
    .catch((error) => {
      console.error("❌ Background repository indexing failed:", error.message);
      // Re-throw so callers awaiting `indexingPromise` can observe the
      // failure too, without this unhandled rejection crashing the process.
      throw error;
    });

  // Prevent an unhandled-rejection warning for callers who never look at
  // this promise, while still leaving the real rejection above for
  // anyone who does await it.
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
    logStep("Cloning repository...");
    const repoPath = await cloneRepository(url);

    // Indexing is independent of the git-stats analysis below and can
    // be much slower — don't block on it.
    const indexingPromise = startBackgroundIndexing(repoPath, repositoryId);

    logStep("Gathering repository data...");
    // These only depend on `repoPath`, so run them concurrently instead
    // of paying their combined latency sequentially.
   const [commits, contributors, branchData] =
  await Promise.all([
    getCommits(repoPath),
    getContributors(repoPath),
    getBranches(repoPath),
  ]);

const stats = getCommitStats(commits);
const [fileAnalysis, codeEvolution] =
  await Promise.all([
    getFileChanges(repoPath),
    getCodeChurn(repoPath),
  ]);
console.log("Commits:", commits.length);
console.log("Code evolution:", codeEvolution.length);
console.log("Stats:", stats);

    logStep("Building timeline...");
    const timeline = createTimeline(commits);

    logStep("Analyzing languages...");
    const languageAnalysis = analyzeLanguages(fileAnalysis);

    logStep("Calculating hotspots...");
    const hotspots = calculateHotspots(fileAnalysis, contributors);

    logStep("Analysis completed!");

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
hotspots: hotspots.hotspots,
allScoredHotspots: hotspots.allScored,

      // Branch analysis
      branches: branchData,

      // Commits
      recentCommits: commits.slice(0, 5),
      allCommits: commits,

      // Callers that need to know when indexing (embeddings) finishes —
      // e.g. to gate a "chat with this repo" feature — can await this.
      // It's already caught internally, so ignoring it is also safe.
      indexingPromise,
    };
  } catch (error) {
    console.error("❌ Repository analysis failed:", error.message);
    throw error;
  }
}

module.exports = {
  analyzeRepository,
};