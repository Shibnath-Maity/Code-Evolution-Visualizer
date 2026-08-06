const express = require("express");
const protect = require("../middleware/authMiddleware");
const { askRepositoryAssistant } = require("../services/assistantService");

const router = express.Router();

const DEBUG = process.env.DEBUG_ASSISTANT === "true";
const MAX_QUESTION_LENGTH = 2000;

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;

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
// Rate limiting
// ==========================================

function isRateLimited(key) {
  const now = Date.now();

  const timestamps = (requestLog.get(key) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
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
      (timestamp) =>
        now - timestamp < RATE_LIMIT_WINDOW_MS
    );

    if (fresh.length === 0) {
      requestLog.delete(key);
    } else {
      requestLog.set(key, fresh);
    }
  }
}, RATE_LIMIT_WINDOW_MS).unref();

// ==========================================
// Test route
// ==========================================

router.get("/test", (req, res) => {
  res.json({
    message: "QA route is working",
  });
});

// ==========================================
// AI Question Answering
// ==========================================

router.post("/",protect, async (req, res) => {
  const { question, repositoryId } = req.body || {};

  // ----------------------------------------
  // Validation
  // ----------------------------------------

  if (typeof question !== "string" || !question.trim()) {
    return res.status(400).json({
      error: "question is required",
    });
  }

  if (
    typeof repositoryId !== "string" &&
    typeof repositoryId !== "number"
  ) {
    return res.status(400).json({
      error: "repositoryId is required",
    });
  }

  const repositoryIdStr = String(repositoryId).trim();

  if (!repositoryIdStr) {
    return res.status(400).json({
      error: "repositoryId is required",
    });
  }

  const trimmedQuestion = question.trim();

  if (trimmedQuestion.length > MAX_QUESTION_LENGTH) {
    return res.status(400).json({
      error: `question must be ${MAX_QUESTION_LENGTH} characters or fewer`,
    });
  }

  // ----------------------------------------
  // Rate limiting
  // Per client IP + repository
  // ----------------------------------------

  const rateLimitKey = `${req.ip}:${repositoryIdStr}`;

  if (isRateLimited(rateLimitKey)) {
    return res.status(429).json({
      error:
        "Too many questions, please slow down and try again shortly.",
    });
  }

  log(
    "🧠 Repository AI Question:",
    trimmedQuestion,
    "| repo:",
    repositoryIdStr
  );

  // ----------------------------------------
  // Repository Assistant
  // ----------------------------------------

  try {
    const result = await askRepositoryAssistant(
      trimmedQuestion,
      repositoryIdStr
    );

    return res.json({
      answer: result.answer,
      sources: result.sources || [],
    });
  } catch (error) {
    console.error(
      "❌ QA Error:",
      error.response?.data || error.message
    );

    if (error.code === "GEMINI_NOT_CONFIGURED") {
      return res.status(503).json({
        error: "AI assistant is not configured.",
      });
    }

    return res.status(500).json({
      error: "Failed to generate answer",
    });
  }
});

module.exports = router;