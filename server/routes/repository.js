const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const {
  getCommitDiff,
  getCommitDetails,
  getAICommitData,
  getFileHistory,
} = require("../services/gitService");

const {
  analyzeRepository,
} = require("../services/analysisService");

const {
  solveIssue,
} = require("../services/issueSolverService");

const {
  getRepositoryInfo,
  getRepositoryIssues,
  getRepositoryIssue,
  getRepositoryPullRequests,
} = require("../services/githubService");

const {
  getAnalysisSession,
  getFileAIAnalysis,
  saveFileAIAnalysis,
} = require("../services/sessionService");

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

const Repository = require("../models/repositoryModel");

/* ==========================================================
   AUTHENTICATED USER HELPER
========================================================== */

function getUserId(req) {
  return req.userId || req.user?.id || req.user?.userId;
}

/* ==========================================================
   REPOSITORY SESSION HELPER
========================================================== */

async function getRepoPathOrFail(
  userId,
  repositoryId,
  res
) {
  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authenticated user not found.",
    });

    return null;
  }

  if (!repositoryId) {
    res.status(400).json({
      success: false,
      message: "repositoryId is required.",
    });

    return null;
  }

  // 🔐 Verify repository belongs to logged-in user
  const repository = await Repository.findOne({
    repositoryId,
    userId,
  });

  if (!repository) {
    res.status(403).json({
      success: false,
      message: "You do not have access to this repository.",
    });

    return null;
  }

  const session = getAnalysisSession(
    userId,
    repositoryId
  );

  if (!session || !session.repoPath) {
    res.status(404).json({
      success: false,
      message:
        "Repository not analyzed yet, or session has expired.",
    });

    return null;
  }

  return session.repoPath;
}

/* ==========================================================
   ROUTER LOGGING
========================================================== */

router.use((req, res, next) => {
  console.log(
    "📍 Repository router hit:",
    req.method,
    req.url
  );

  next();
});

/* ==========================================================
   INFO
========================================================== */

router.get("/info", (req, res) => {
  res.json({
    name: "Code Evolution Visualizer",
    owner: "Shibnath Maity",
    contributors: 5,
    stars: 100,
  });
});

/* ==========================================================
   REPOSITORY INFO
========================================================== */

router.get(
  "/repo-info",
  protect,
  async (req, res) => {
    try {
      const { url } = req.query;

      if (!url) {
        return res.status(400).json({
          success: false,
          message: "Repository URL is required",
        });
      }

      const repo =
        await getRepositoryInfo(url);

      res.json(repo);
    } catch (error) {
      console.error(
        "Repository Info Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/* ==========================================================
   FETCH REPOSITORY ISSUES
========================================================== */

router.post(
  "/issues",
  protect,
  async (req, res) => {
    try {
      const { repoUrl } = req.body;

      if (!repoUrl) {
        return res.status(400).json({
          success: false,
          message:
            "Repository URL is required",
        });
      }

      const repo =
        await getRepositoryInfo(repoUrl);

      const issues =
        await getRepositoryIssues(
          repo.owner,
          repo.repo
        );

      res.json({
        success: true,
        repository: repo,
        issues,
      });
    } catch (error) {
      console.error(
        "Issue Fetch Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/* ==========================================================
   AI ISSUE SOLVER
========================================================== */

router.post(
  "/issue-solution",
  protect,
  async (req, res) => {
    try {
      const {
        owner,
        repo,
        issueNumber,
        repositoryId,
      } = req.body;

      const userId = getUserId(req);

      if (!owner || !repo || !issueNumber) {
        return res.status(400).json({
          success: false,
          message:
            "owner, repo and issueNumber are required",
        });
      }

      const repoPath =
        await getRepoPathOrFail(
          userId,
          repositoryId,
          res
        );

      if (!repoPath) return;

      const issue =
        await getRepositoryIssue(
          owner,
          repo,
          issueNumber
        );

      const solution =
        await solveIssue({
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
      console.error(
        "Issue Solver Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/* ==========================================================
   ANALYZE REPOSITORY
========================================================== */

router.post(
  "/analytics",
  protect,
  async (req, res) => {
    console.log(
      "📌 Analytics route reached"
    );

    try {
      const { url } = req.body;

      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated user not found.",
        });
      }

      if (!url) {
        return res.status(400).json({
          success: false,
          message:
            "Repository URL is required.",
        });
      }

      // Get GitHub repository information
      const repo = await getRepositoryInfo(url);

      if (!repo || !repo.owner || !repo.repo) {
        return res.status(400).json({
          success: false,
          message: "Invalid GitHub repository URL.",
        });
      }

      /*
       * Check whether this repository already
       * belongs to the logged-in user.
       */
      let repository = await Repository.findOne({
        userId,
        repoUrl: url.trim(),
      });

      let repositoryId;

      if (repository) {
        repositoryId = repository.repositoryId;

        // Re-analysis
        repository.status = "processing";
        repository.analysisError = null;

        await repository.save();

        console.log(
          "🔄 Re-analyzing existing repository:",
          repositoryId
        );
      } else {
        repositoryId = crypto.randomUUID();

        repository = await Repository.create({
          repositoryId,
          userId,
          repoUrl: url.trim(),
          owner: repo.owner,
          name: repo.repo,
          status: "processing",
        });

        console.log(
          "🆕 New repository created:",
          repositoryId
        );
      }

      console.log("👤 User:", userId);
      console.log("📦 Repository:", repositoryId);

      const result =
        await analyzeRepository(
          url,
          userId,
          repositoryId
        );

      /*
       * Analysis successfully completed.
       */
      await Repository.findOneAndUpdate(
        {
          repositoryId,
          userId,
        },
        {
          status: "ready",
          repoPath: result.repoPath,
          lastAnalyzedAt: new Date(),
          analysisError: null,
        }
      );

      console.log(
        "✅ Analysis complete for",
        repositoryId
      );

      // Note: architecture, codeEvolution, hotspotInsights, and
      // aiFileAnalysis are generated in the background by
      // analyzeRepository() and are NOT part of its return value.
      // They live on the session and are surfaced via the
      // /analytics/:repositoryId/status polling route instead.
      res.json({
        success: true,
        repositoryId,

        stats: result.stats,
        commitStatistics: result.commitStatistics,

        contributors: result.contributors,
        timeline: result.timeline,

        fileAnalysis: result.fileAnalysis,
        languageAnalysis: result.languageAnalysis,

        hotspots: result.hotspots,
        allScoredHotspots: result.allScoredHotspots,

        branches: result.branches,

        recentCommits: result.recentCommits,
        allCommits: result.allCommits,

        healthScore: result.healthScore,

        // Background task states — the frontend should poll
        // /analytics/:repositoryId/status for these.
        architecturePending: true,
        codeEvolutionPending: true,
        hotspotInsightsPending: true,
        vectorIndexingPending: true,
        healthScorePending: true,
      });
    } catch (error) {
      console.error(
        "❌ Repository analysis failed:",
        error
      );

      console.error(error.stack);

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/* ==========================================================
   POLL ANALYSIS STATUS
========================================================== */

router.get(
  "/analytics/:repositoryId/status",
  protect,
  (req, res) => {
    const {
      repositoryId,
    } = req.params;

    const userId =
      getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated user not found.",
      });
    }

    const session =
      getAnalysisSession(
        userId,
        repositoryId
      );

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Session not found or expired.",
      });
    }

    res.json({
      success: true,

      repositoryId,

      status:
        session.status,

      architecture:
        session.architecture,

      architecturePending:
        session.architecturePending,

      architectureError:
        session.architectureError,

      codeEvolution:
        session.codeEvolution,

      codeEvolutionPending:
        session.codeEvolutionPending,

      codeEvolutionError:
        session.codeEvolutionError,

      hotspotInsights:
        session.hotspotInsights,

      hotspotInsightsPending:
        session.hotspotInsightsPending,

      hotspotInsightsError:
        session.hotspotInsightsError,

      vectorIndexingPending:
        session.vectorIndexingPending,

      vectorIndexingError:
        session.vectorIndexingError,

      healthScore:
        session.healthScore,

      healthScorePending:
        session.healthScorePending,

      healthScoreError:
        session.healthScoreError,

      error:
        session.error,
    });
  }
);

/* ==========================================================
   FULL ANALYSIS SESSION
========================================================== */

router.get(
  "/analytics/:repositoryId",
  protect,
  (req, res) => {
    const {
      repositoryId,
    } = req.params;

    const userId =
      getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated user not found.",
      });
    }

    const session =
      getAnalysisSession(
        userId,
        repositoryId
      );

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Session expired.",
      });
    }

    res.json({
      success: true,
      data: session,
    });
  }
);

/* ==========================================================
   SESSION RESTORE
========================================================== */

router.get(
  "/analytics/:repositoryId/restore",
  protect,
  async (req, res) => {
    try {
      const { repositoryId } = req.params;
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authenticated user not found.",
        });
      }

      const repository = await Repository.findOne({
        repositoryId,
        userId,
      });

      if (!repository) {
        return res.status(404).json({
          success: false,
          message: "Repository not found.",
        });
      }

      const session = getAnalysisSession(
        userId,
        repositoryId
      );

      if (session) {
        return res.json({
          success: true,
          restored: true,
          data: session,
        });
      }

      // Session is gone (e.g. process restart or TTL expiry).
      // This does not reconstruct the in-memory analysis — the
      // frontend should prompt the user to re-run /analytics.
      return res.status(404).json({
        success: false,
        restored: false,
        message:
          "Analysis session expired. Please analyze the repository again.",
      });
    } catch (error) {
      console.error(
        "Session restore error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/* ==========================================================
   CALENDAR
========================================================== */

router.get(
  "/calendar",
  protect,
  async (req, res) => {
    try {
      const {
        repositoryId,
      } = req.query;

      const userId =
        getUserId(req);

      const repoPath =
        await getRepoPathOrFail(
          userId,
          repositoryId,
          res
        );

      if (!repoPath) return;

      const calendar =
        await getCommitCalendar(
          repoPath
        );

      res.json(calendar);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        error:
          "Unable to generate calendar",
      });
    }
  }
);

/* ==========================================================
   COMMIT DETAILS
========================================================== */

router.get(
  "/commit/:hash",
  protect,
  async (req, res) => {
    try {
      const {
        hash,
      } = req.params;

      const {
        repositoryId,
      } = req.query;

      const userId =
        getUserId(req);

      const repoPath =
        await getRepoPathOrFail(
          userId,
          repositoryId,
          res
        );

      if (!repoPath) return;

      const data =
        await getCommitDetails(
          repoPath,
          hash
        );

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
  }
);

/* ==========================================================
   COMMIT DIFF
========================================================== */

router.get(
  "/commit/:hash/diff",
  protect,
  async (req, res) => {
    try {
      const {
        hash,
      } = req.params;

      const {
        repositoryId,
      } = req.query;

      const userId =
        getUserId(req);

      const repoPath =
        await getRepoPathOrFail(
          userId,
          repositoryId,
          res
        );

      if (!repoPath) return;

      const data =
        await getCommitDiff(
          repoPath,
          hash
        );

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
  }
);

/* ==========================================================
   AI COMMIT SUMMARY
========================================================== */

router.get(
  "/commit/:hash/summary",
  protect,
  async (req, res) => {
    try {
      const {
        hash,
      } = req.params;

      const {
        repositoryId,
      } = req.query;

      const userId =
        getUserId(req);

      const repoPath =
        await getRepoPathOrFail(
          userId,
          repositoryId,
          res
        );

      if (!repoPath) return;

      const commit =
        await getAICommitData(
          repoPath,
          hash
        );

      const summary =
        await generateCommitSummary(
          commit
        );

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error(
        "AI Commit Summary Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/* ==========================================================
   AI FILE EXPLANATION
========================================================== */

router.post(
  "/file-explanation",
  protect,
  async (req, res) => {
    try {
      const {
        filePath,
        repositoryId,
      } = req.body;

      const userId =
        getUserId(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authenticated user not found.",
        });
      }

      if (!filePath) {
        return res.status(400).json({
          success: false,
          message:
            "filePath is required",
        });
      }

      if (!repositoryId) {
        return res.status(400).json({
          success: false,
          message: "repositoryId is required.",
        });
      }

      // 🔐 Verify repository belongs to logged-in user
      const repository = await Repository.findOne({
        repositoryId,
        userId,
      });

      if (!repository) {
        return res.status(403).json({
          success: false,
          message: "You do not have access to this repository.",
        });
      }

      const session = getAnalysisSession(
        userId,
        repositoryId
      );

      if (!session || !session.repoPath) {
        return res.status(404).json({
          success: false,
          message:
            "Repository not analyzed yet, or session has expired.",
        });
      }

      // Use previously cached AI file analysis if we have it,
      // to avoid triggering another AI call for the same file.
      const cached = getFileAIAnalysis(
        userId,
        repositoryId,
        filePath
      );

      if (cached) {
        return res.json({
          success: true,
          cached: true,
          data: cached,
        });
      }

      // Reuse the architecture already computed for this session
      // instead of rebuilding it on every file click.
      const architecture = session.architecture;

      if (!architecture) {
        return res.status(202).json({
          success: false,
          pending: true,
          message:
            "Repository architecture is still being generated.",
        });
      }

      console.log(
        "repoPath:",
        session.repoPath
      );

      console.log(
        "filePath:",
        filePath
      );

      const explanation =
        await explainFile(
          session.repoPath,
          filePath,
          architecture,
          repositoryId,
          userId
        );

      saveFileAIAnalysis(
        userId,
        repositoryId,
        filePath,
        explanation
      );

      res.json({
        success: true,
        cached: false,
        data: explanation,
      });
    } catch (error) {
      console.error(
        "File Explanation Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/* ==========================================================
   HOTSPOT FILE HISTORY
========================================================== */

router.get(
  "/hotspots/commits",
  protect,
  async (req, res) => {
    try {
      const {
        file,
        repositoryId,
      } = req.query;

      const userId =
        getUserId(req);

      if (!file) {
        return res.status(400).json({
          success: false,
          message:
            "file query param is required.",
        });
      }

      const repoPath =
        await getRepoPathOrFail(
          userId,
          repositoryId,
          res
        );

      if (!repoPath) return;

      const data =
        await getFileHistory(
          repoPath,
          file
        );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error(
        "File History Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/* ==========================================================
   PULL REQUESTS
========================================================== */

router.get(
  "/pull-requests",
  protect,
  async (req, res) => {
    try {
      const {
        owner,
        repo,
      } = req.query;

      if (!owner || !repo) {
        return res.status(400).json({
          success: false,
          message:
            "owner and repo are required",
        });
      }

      const pullRequests =
        await getRepositoryPullRequests(
          owner,
          repo
        );

      res.json({
        success: true,
        pullRequests,
      });
    } catch (error) {
      console.error(
        "Pull request error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to fetch pull requests",
      });
    }
  }
);

module.exports = router;