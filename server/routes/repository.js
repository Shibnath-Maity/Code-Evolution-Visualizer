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
  getFileHistory,
} = require("../services/gitService");
const { analyzeRepository } = require("../services/analysisService");
const { solveIssue } = require("../services/issueSolverService");
const { createTimeline } = require("../services/analyticsService");
const { getFileChanges } = require("../services/fileAnalyticsService");
const { calculateHotspots } = require("../services/hotspotService");
const {
  getRepositoryInfo,
  getRepositoryIssues,
  getRepositoryIssue,
} = require("../services/githubService");
const { indexRepository } = require("../services/vectorService");
const { getAnalysisSession } = require("../services/sessionService");
const {
  generateCommitSummary,
} = require("../services/aiCommitService");
const {
  getCommitCalendar,
} = require("../services/calendarService");
const protect = require("../middleware/authMiddleware");
const {
  explainFile,
} = require("../services/fileExplanationService");
const {
  buildArchitecture,
} = require("../services/architectureService");

// ==========================================
// Helper: resolve a repoPath from the session, or fail cleanly.
// Every route that used to read the global `currentRepoPath` now
// needs a repositoryId (query for GET, body for POST) so it can
// look up the right session — this is what makes multiple repos /
// multiple users safe at the same time.
// ==========================================
function getRepoPathOrFail(repositoryId, res) {
  if (!repositoryId) {
    res.status(400).json({
      success: false,
      message: "repositoryId is required.",
    });
    return null;
  }

  const session = getAnalysisSession(repositoryId);

  if (!session || !session.repoPath) {
    res.status(400).json({
      success: false,
      message: "Repository not analyzed yet, or session has expired.",
    });
    return null;
  }

  return session.repoPath;
}

router.get("/info", (req, res) => {
  res.json({
    name: "Code Evolution Visualizer",
    owner: "Shibnath Maity",
    contributors: 5,
    stars: 100,
  });
});

// Add repo
router.get("/repo-info", protect, async (req, res) => {
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

// ==========================================
// Fetch Repository Issues
// ==========================================
router.post("/issues", protect, async (req, res) => {
  console.log("===== /issues API HIT =====");
  console.log("Request Body:", req.body);

  try {
    const { repoUrl } = req.body;

    console.log("Repository URL:", repoUrl);

    if (!repoUrl) {
      return res.status(400).json({
        success: false,
        message: "Repository URL is required",
      });
    }

    const repo = await getRepositoryInfo(repoUrl);

    console.log("Repository Info:", repo);

    const issues = await getRepositoryIssues(repo.owner, repo.repo);

    console.log("Issues Found:", issues.length);

    res.json({
      success: true,
      repository: repo,
      issues,
    });
  } catch (error) {
    console.error("Issue Fetch Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// AI Issue Solver
// ==========================================
router.post("/issue-solution", protect, async (req, res) => {
  try {
    const { owner, repo, issueNumber, repositoryId } = req.body;

    if (!owner || !repo || !issueNumber) {
      return res.status(400).json({
        success: false,
        message: "owner, repo and issueNumber are required",
      });
    }

    const repoPath = getRepoPathOrFail(repositoryId, res);
    if (!repoPath) return;

    // Fetch issue from GitHub
    const issue = await getRepositoryIssue(owner, repo, issueNumber);

    // Ask Gemini to solve it
    const solution = await solveIssue({
      issue,
      repoPath,
      repositoryId,
    });

    res.json({
      success: true,
      issue,
      solution,
    });
  } catch (error) {
    console.error("Issue Solver Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.use((req, res, next) => {
  console.log("📍 Repository router hit:", req.method, req.url);
  next();
});

// ==========================================
// Analyze Repository
// ==========================================
router.post("/analytics", protect, async (req, res) => {
  console.log("📌 Analytics route reached");
  try {
    const { url } = req.body;

    // Backend now owns the repositoryId instead of trusting the
    // frontend to generate/send one.
    const repositoryId = crypto.randomUUID();

    console.log("🚀 Starting repository analysis...", repositoryId);

    const result = await analyzeRepository(url, repositoryId);

    console.log("✅ Analysis complete for", repositoryId);
    console.log(result.commitStatistics);

    console.log("8️⃣ Sending dashboard response...");

    // Send dashboard immediately. Full data also lives in the
    // session under repositoryId for every other route to reuse.
    res.json({
      repositoryId,
      stats: result.stats,
      contributors: result.contributors,
      timeline: result.timeline,
      fileAnalysis: result.fileAnalysis,
      aiFileAnalysis: result.aiFileAnalysis,
      aiFileAnalysisPending: result.aiFileAnalysisPending,
      languageAnalysis: result.languageAnalysis,
      codeEvolution: result.codeEvolution,
      hotspots: result.hotspots,
      allScoredHotspots: result.allScoredHotspots,
      hotspotInsights: result.hotspotInsights,
      hotspotInsightsPending: result.hotspotInsightsPending,
      branches: result.branches,
      recentCommits: result.recentCommits,
      allCommits: result.allCommits,
      architecture: result.architecture,
      commitStatistics: result.commitStatistics,
    });
  } catch (error) {
    console.error("========== BACKEND ERROR ==========");
    console.error(error);
    console.error(error.stack);

    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack,
    });
  }
});

// ==========================================
// Poll Session Status
// ==========================================
router.get("/analytics/:repositoryId/status", protect, (req, res) => {
  const { repositoryId } = req.params;

  const session = getAnalysisSession(repositoryId);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: "Session not found or expired.",
    });
  }

  res.json({
    success: true,

    status: session.status,

    // Architecture
    architecture: session.architecture,
    architecturePending: session.architecturePending,
    architectureError: session.architectureError,

    // Code Evolution
    codeEvolution: session.codeEvolution,
    codeEvolutionPending: session.codeEvolutionPending,
    codeEvolutionError: session.codeEvolutionError,

    // Hotspot AI
    hotspotInsights: session.hotspotInsights,
    hotspotInsightsPending: session.hotspotInsightsPending,
    hotspotInsightsError: session.hotspotInsightsError,

    // Vector / RAG
    vectorIndexingPending: session.vectorIndexingPending,
    vectorIndexingError: session.vectorIndexingError,

    // Health Score
    healthScore: session.healthScore,
    healthScorePending: session.healthScorePending,
    healthScoreError: session.healthScoreError,

    error: session.error,
  });
});

// ==========================================
// Full session data (lets the frontend reload the complete
// analysis for a repositoryId without re-running it)
// ==========================================
router.get("/analytics/:repositoryId", protect, (req, res) => {
  const { repositoryId } = req.params;

  const session = getAnalysisSession(repositoryId);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: "Session expired.",
    });
  }

  res.json({
    success: true,
    data: session,
  });
});

router.get("/calendar", protect, async (req, res) => {
  try {
    const { repositoryId } = req.query;

    const repoPath = getRepoPathOrFail(repositoryId, res);
    if (!repoPath) return;

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
router.get("/commit/:hash", protect, async (req, res) => {
  try {
    const { hash } = req.params;
    const { repositoryId } = req.query;

    const repoPath = getRepoPathOrFail(repositoryId, res);
    if (!repoPath) return;

    const data = await getCommitDetails(repoPath, hash);

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
router.get("/commit/:hash/diff", protect, async (req, res) => {
  try {
    const { hash } = req.params;
    const { repositoryId } = req.query;

    const repoPath = getRepoPathOrFail(repositoryId, res);
    if (!repoPath) return;

    const data = await getCommitDiff(repoPath, hash);

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
router.get("/commit/:hash/summary", protect, async (req, res) => {
  try {
    const { hash } = req.params;
    const { repositoryId } = req.query;

    const repoPath = getRepoPathOrFail(repositoryId, res);
    if (!repoPath) return;

    const commit = await getAICommitData(repoPath, hash);

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

// ==========================================
// AI File Explanation
// ==========================================
router.post("/file-explanation", protect, async (req, res) => {
  try {
    const { filePath, repositoryId } = req.body;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: "filePath is required",
      });
    }

    const repoPath = getRepoPathOrFail(repositoryId, res);
    if (!repoPath) return;

    console.log("repoPath:", repoPath);
    console.log("filePath:", filePath);
const architecture = buildArchitecture(repoPath);

const explanation = await explainFile(
  repoPath,
  filePath,
  architecture,
  repositoryId
);


    res.json({
      success: true,
      data: explanation,
    });
  } catch (error) {
    console.error("File Explanation Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// File Commit History + Co-Change (for Hotspot details panel)
// ==========================================
router.get("/hotspots/commits", protect, async (req, res) => {
  try {
    const { file, repositoryId } = req.query;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "file query param is required.",
      });
    }

    const repoPath = getRepoPathOrFail(repositoryId, res);
    if (!repoPath) return;

    const data = await getFileHistory(repoPath, file);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("File History Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;