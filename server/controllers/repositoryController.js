
const crypto = require("crypto");

const Repository = require("../models/repositoryModel");

const {
  getRepositoryInfo,
} = require("../services/githubService");

const {
  analyzeRepository,
} = require("../services/analysisService");

/* ==========================================================
   AUTHENTICATED USER HELPER
========================================================== */

function getUserId(req) {
  return req.userId || req.user?.id || req.user?.userId;
}

/* ==========================================================
   ANALYZE REPOSITORY
========================================================== */

const analyzeRepositoryController = async (req, res) => {
  console.log("📌 Analytics controller reached");

  try {
    const { url } = req.body;

    const userId = getUserId(req);

    /* --------------------------------------------------------
       Validate authenticated user
    -------------------------------------------------------- */

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found.",
      });
    }

    /* --------------------------------------------------------
       Validate repository URL
    -------------------------------------------------------- */

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        success: false,
        message: "Repository URL is required.",
      });
    }

    const normalizedUrl = url.trim();

    if (!normalizedUrl) {
      return res.status(400).json({
        success: false,
        message: "Repository URL is required.",
      });
    }

    /* --------------------------------------------------------
       Get GitHub repository information
    -------------------------------------------------------- */

    const repo = await getRepositoryInfo(normalizedUrl);

    if (!repo || !repo.owner || !repo.repo) {
      return res.status(400).json({
        success: false,
        message: "Invalid GitHub repository URL.",
      });
    }

    console.log("🐙 GitHub Repository:", {
      owner: repo.owner,
      name: repo.repo,
    });

    /* --------------------------------------------------------
       Find existing repository for this user
    -------------------------------------------------------- */

    let repository = await Repository.findOne({
      userId,
      repoUrl: normalizedUrl,
    });

    let repositoryId;

    /* --------------------------------------------------------
       Existing repository
    -------------------------------------------------------- */

    if (repository) {
      repositoryId = repository.repositoryId;

      repository.status = "processing";
      repository.analysisError = null;

      await repository.save();

      console.log(
        "🔄 Re-analyzing existing repository:",
        repositoryId
      );
    }

    /* --------------------------------------------------------
       New repository
    -------------------------------------------------------- */

    else {
      repositoryId = crypto.randomUUID();

      repository = await Repository.create({
        repositoryId,
        userId,
        repoUrl: normalizedUrl,
        owner: repo.owner,
        name: repo.repo,
        status: "processing",
        analysisError: null,
      });

      console.log(
        "🆕 New repository created:",
        repositoryId
      );
    }

    console.log("👤 User:", userId);
    console.log("📦 Repository:", repositoryId);

    /* --------------------------------------------------------
       Run repository analysis
    -------------------------------------------------------- */

    const result = await analyzeRepository(
      normalizedUrl,
      userId,
      repositoryId
    );

    /* --------------------------------------------------------
       Update MongoDB repository
    -------------------------------------------------------- */

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
      "✅ Repository analysis complete:",
      repositoryId
    );

    /* --------------------------------------------------------
       Response
    -------------------------------------------------------- */

    return res.json({
      success: true,

      repositoryId,

      stats: result.stats,

      contributors:
        result.contributors,

      timeline:
        result.timeline,

      fileAnalysis:
        result.fileAnalysis,

      aiFileAnalysis:
        result.aiFileAnalysis,

      aiFileAnalysisPending:
        result.aiFileAnalysisPending,

      languageAnalysis:
        result.languageAnalysis,

      codeEvolution:
        result.codeEvolution,

      hotspots:
        result.hotspots,

      allScoredHotspots:
        result.allScoredHotspots,

      hotspotInsights:
        result.hotspotInsights,

      hotspotInsightsPending:
        result.hotspotInsightsPending,

      branches:
        result.branches,

      recentCommits:
        result.recentCommits,

      allCommits:
        result.allCommits,

      architecture:
        result.architecture,

      commitStatistics:
        result.commitStatistics,

      healthScore:
        result.healthScore,
    });
  } catch (error) {
    console.error(
      "❌ Repository analysis failed:",
      error
    );

    console.error(error.stack);

    /* --------------------------------------------------------
       Try to update repository status
    -------------------------------------------------------- */

    try {
      const { url } = req.body;
      const userId = getUserId(req);

      if (userId && url) {
        await Repository.findOneAndUpdate(
          {
            userId,
            repoUrl: url.trim(),
          },
          {
            status: "failed",
            analysisError: error.message,
          }
        );
      }
    } catch (dbError) {
      console.error(
        "❌ Failed to update repository error status:",
        dbError.message
      );
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Repository analysis failed.",
    });
  }
};

/* ==========================================================
   GET USER REPOSITORIES
========================================================== */

const getUserRepositories = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found.",
      });
    }

    const repositories = await Repository.find({
      userId,
    })
      .sort({ createdAt: -1 })
      .select(
        "repositoryId repoUrl owner name status lastAnalyzedAt analysisError createdAt updatedAt"
      );

    return res.json({
      success: true,
      repositories,
    });
  } catch (error) {
    console.error(
      "❌ Get User Repositories Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch repositories.",
    });
  }
};

/* ==========================================================
   GET SINGLE REPOSITORY
========================================================== */

const getRepositoryById = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { repositoryId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found.",
      });
    }

    if (!repositoryId) {
      return res.status(400).json({
        success: false,
        message: "repositoryId is required.",
      });
    }

    const repository = await Repository.findOne({
      repositoryId,
      userId,
    }).select(
      "repositoryId repoUrl owner name repoPath status lastAnalyzedAt analysisError createdAt updatedAt"
    );

    if (!repository) {
      return res.status(404).json({
        success: false,
        message: "Repository not found.",
      });
    }

    return res.json({
      success: true,
      repository,
    });
  } catch (error) {
    console.error(
      "❌ Get Repository Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch repository.",
    });
  }
};

/* ==========================================================
   DELETE REPOSITORY
========================================================== */

const deleteRepository = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { repositoryId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found.",
      });
    }

    if (!repositoryId) {
      return res.status(400).json({
        success: false,
        message: "repositoryId is required.",
      });
    }

    const repository =
      await Repository.findOneAndDelete({
        repositoryId,
        userId,
      });

    if (!repository) {
      return res.status(404).json({
        success: false,
        message: "Repository not found.",
      });
    }

    console.log(
      "🗑️ Repository deleted:",
      repositoryId
    );

    return res.json({
      success: true,
      message: "Repository deleted successfully.",
      repositoryId,
    });
  } catch (error) {
    console.error(
      "❌ Delete Repository Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete repository.",
    });
  }
};

module.exports = {
  analyzeRepositoryController,
  getUserRepositories,
  getRepositoryById,
  deleteRepository,
};

