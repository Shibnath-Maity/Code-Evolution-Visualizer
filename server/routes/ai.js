const express = require("express");
const {
  askOllama,
  analyzeRepository,
} = require("../services/aiService");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const DEBUG = process.env.DEBUG_AI === "true";

const MAX_QUESTION_LENGTH = 2000;

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const CHAT_RATE_LIMIT_MAX = 30;
const ANALYSIS_RATE_LIMIT_MAX = 5;

const requestLog = new Map();

// ==========================================
// Logging
// ==========================================

function log(...args) {
  if (DEBUG) {
    console.log(...args);
  }
}

// ==========================================
// Rate Limiter
// ==========================================

function isRateLimited(key, maxRequests) {
  const now = Date.now();

  const timestamps = (requestLog.get(key) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= maxRequests) {
    requestLog.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  requestLog.set(key, timestamps);

  return false;
}

// Cleanup old rate-limit entries
setInterval(() => {
  const now = Date.now();

  for (const [key, timestamps] of requestLog.entries()) {
    const fresh = timestamps.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
    );

    if (fresh.length === 0) {
      requestLog.delete(key);
    } else {
      requestLog.set(key, fresh);
    }
  }
}, RATE_LIMIT_WINDOW_MS).unref();

// ==========================================
// AI Service Availability
// ==========================================

function isUnavailableError(error) {
  const code = error?.cause?.code || error?.code;

  return (
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT" ||
    code === "ENOTFOUND" ||
    error?.name === "AbortError" ||
    error?.message?.toLowerCase().includes("fetch failed")
  );
}

// ==========================================
// Normal AI Chat
// ==========================================

router.post("/chat", protect, async (req, res) => {
  const { question } = req.body || {};

  // Validation
  if (typeof question !== "string" || !question.trim()) {
    return res.status(400).json({
      error: "Question is required",
    });
  }

  const trimmedQuestion = question.trim();

  if (trimmedQuestion.length > MAX_QUESTION_LENGTH) {
    return res.status(400).json({
      error: `Question must be ${MAX_QUESTION_LENGTH} characters or fewer`,
    });
  }

  // Rate limit
  const rateLimitKey = `chat:${req.user?.id || req.ip}`;

  if (isRateLimited(rateLimitKey, CHAT_RATE_LIMIT_MAX)) {
    return res.status(429).json({
      error:
        "Too many questions, please slow down and try again shortly.",
    });
  }

  log("💬 Chat question:", trimmedQuestion);

  try {
    const answer = await askOllama(trimmedQuestion);

    return res.json({
      answer,
    });
  } catch (error) {
    console.error("❌ AI Chat Error:", error.message);

    if (isUnavailableError(error)) {
      return res.status(503).json({
        error:
          "AI service is currently unavailable. Is Ollama running?",
      });
    }

    return res.status(500).json({
      error: "Failed to get response from Ollama",
    });
  }
});

// ==========================================
// Repository AI Analysis
// ==========================================

router.post("/analyze-repository", protect, async (req, res) => {
  const repositoryData = req.body || {};

  // Validation
  if (
    typeof repositoryData !== "object" ||
    Array.isArray(repositoryData)
  ) {
    return res.status(400).json({
      error: "Repository analysis data is required",
    });
  }

  if (!repositoryData.stats) {
    return res.status(400).json({
      error: "Repository analysis data is required",
    });
  }

  // Rate limit
  const rateLimitKey = `analysis:${req.user?.id || req.ip}`;

  if (isRateLimited(rateLimitKey, ANALYSIS_RATE_LIMIT_MAX)) {
    return res.status(429).json({
      error:
        "Too many analysis requests, please slow down and try again shortly.",
    });
  }

  log("📊 Starting repository AI analysis");

  try {
    const analysis = await analyzeRepository(repositoryData);

    return res.json({
      analysis,
    });
  } catch (error) {
    console.error("❌ Repository AI Error:", error.message);

    if (isUnavailableError(error)) {
      return res.status(503).json({
        error:
          "AI service is currently unavailable. Is Ollama running?",
      });
    }

    return res.status(500).json({
      error: "Failed to analyze repository",
    });
  }
});

module.exports = router;