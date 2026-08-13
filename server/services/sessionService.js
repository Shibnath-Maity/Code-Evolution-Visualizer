
const activeAnalyses = new Map();

/* ==========================================================
   SESSION KEY
========================================================== */

function getSessionKey(userId, repositoryId) {
  if (!userId || !repositoryId) {
    throw new Error("userId and repositoryId are required");
  }

  return `${userId}:${repositoryId}`;
}

/* ==========================================================
   CREATE / REPLACE ONE REPOSITORY SESSION
========================================================== */

function createAnalysisSession(userId, repositoryId, data = {}) {
  const key = getSessionKey(userId, repositoryId);

  const existingSession = activeAnalyses.get(key);

  const session = {
    ...data,

    userId,
    repositoryId,

    createdAt: existingSession?.createdAt || Date.now(),
    lastAccessedAt: Date.now(),

    // Preserve file AI cache if the same repository is re-analyzed
    fileAIAnalysisCache:
      data.fileAIAnalysisCache ||
      existingSession?.fileAIAnalysisCache ||
      {},
  };

  activeAnalyses.set(key, session);

  console.log("🟢 Analysis session created/updated:", key);

  return key;
}

/* ==========================================================
   GET SESSION
========================================================== */

function getAnalysisSession(userId, repositoryId) {
  const key = getSessionKey(userId, repositoryId);

  const session = activeAnalyses.get(key);

  if (!session) {
    return null;
  }

  session.lastAccessedAt = Date.now();

  return session;
}

/* ==========================================================
   UPDATE SESSION
========================================================== */

function updateAnalysisSession(userId, repositoryId, updates) {
  const key = getSessionKey(userId, repositoryId);

  const session = activeAnalyses.get(key);

  if (!session) {
    return false;
  }

  activeAnalyses.set(key, {
    ...session,
    ...updates,

    userId,
    repositoryId,

    lastAccessedAt: Date.now(),
  });

  return true;
}

/* ==========================================================
   DELETE ONE REPOSITORY SESSION
========================================================== */

function deleteAnalysisSession(userId, repositoryId) {
  const key = getSessionKey(userId, repositoryId);

  const deleted = activeAnalyses.delete(key);

  if (deleted) {
    console.log("🗑️ Analysis session deleted:", key);
  }

  return deleted;
}

/* ==========================================================
   DELETE ALL USER SESSIONS
   Use ONLY when user logs out / account cleanup /
   explicit "clear all analyses".
========================================================== */

function deleteUserAnalysisSession(userId) {
  if (!userId) {
    throw new Error("userId is required");
  }

  const prefix = `${userId}:`;
  let deleted = false;

  for (const key of activeAnalyses.keys()) {
    if (key.startsWith(prefix)) {
      activeAnalyses.delete(key);
      deleted = true;

      console.log("🗑️ User analysis session deleted:", key);
    }
  }

  return deleted;
}

/* ==========================================================
   CHECK SESSION
========================================================== */

function hasAnalysisSession(userId, repositoryId) {
  const key = getSessionKey(userId, repositoryId);

  return activeAnalyses.has(key);
}

/* ==========================================================
   GET ALL SESSIONS
========================================================== */

function getAllAnalysisSessions() {
  return activeAnalyses;
}

/* ==========================================================
   GET ALL SESSIONS FOR ONE USER
========================================================== */

function getUserAnalysisSessions(userId) {
  if (!userId) {
    throw new Error("userId is required");
  }

  const prefix = `${userId}:`;
  const sessions = [];

  for (const [key, session] of activeAnalyses.entries()) {
    if (key.startsWith(prefix)) {
      sessions.push(session);
    }
  }

  return sessions;
}

/* ==========================================================
   PER-FILE AI CACHE
========================================================== */

function getFileAIAnalysis(
  userId,
  repositoryId,
  filePath
) {
  const session = getAnalysisSession(
    userId,
    repositoryId
  );

  if (
    !session ||
    !session.fileAIAnalysisCache
  ) {
    return null;
  }

  return (
    session.fileAIAnalysisCache[filePath] ||
    null
  );
}

/* ==========================================================
   SAVE FILE AI ANALYSIS
========================================================== */

function saveFileAIAnalysis(
  userId,
  repositoryId,
  filePath,
  analysis
) {
  const key = getSessionKey(
    userId,
    repositoryId
  );

  const session = activeAnalyses.get(key);

  if (!session) {
    return false;
  }

  if (!session.fileAIAnalysisCache) {
    session.fileAIAnalysisCache = {};
  }

  session.fileAIAnalysisCache[filePath] = analysis;
  session.lastAccessedAt = Date.now();

  return true;
}

/* ==========================================================
   SESSION CLEANUP
========================================================== */

/*
  Prevent unlimited memory growth.

  Example:
  A user analyzes 50 repositories.
  Old sessions eventually disappear if unused.
*/

const SESSION_TTL =
  Number(process.env.ANALYSIS_SESSION_TTL) ||
  1000 * 60 * 60 * 6; // 6 hours

function cleanupExpiredSessions() {
  const now = Date.now();

  for (const [key, session] of activeAnalyses.entries()) {
    if (
      now - session.lastAccessedAt >
      SESSION_TTL
    ) {
      activeAnalyses.delete(key);

      console.log(
        "🧹 Expired analysis session removed:",
        key
      );
    }
  }
}

// Run cleanup every 30 minutes
setInterval(
  cleanupExpiredSessions,
  1000 * 60 * 30
);

/* ==========================================================
   EXPORTS
========================================================== */

module.exports = {
  createAnalysisSession,
  getAnalysisSession,
  updateAnalysisSession,

  deleteAnalysisSession,
  deleteUserAnalysisSession,

  hasAnalysisSession,
  getAllAnalysisSessions,
  getUserAnalysisSessions,

  getFileAIAnalysis,
  saveFileAIAnalysis,

  cleanupExpiredSessions,
};

