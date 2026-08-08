const activeAnalyses = new Map();

// Session expiration time (2 hours of inactivity)
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

/* ==========================================================
   SESSION CORE MANAGEMENT
========================================================== */

function createAnalysisSession(analysisId, data) {
  activeAnalyses.set(analysisId, {
    ...data,
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
    fileAIAnalysisCache: data?.fileAIAnalysisCache || {},
  });
}

function getAnalysisSession(analysisId) {
  const session = activeAnalyses.get(analysisId);
  if (!session) return null;

  // Touch access time to keep active sessions alive
  session.lastAccessedAt = Date.now();
  return session;
}

function updateAnalysisSession(analysisId, updates) {
  const session = activeAnalyses.get(analysisId);

  if (!session) return false;

  activeAnalyses.set(analysisId, {
    ...session,
    ...updates,
    lastAccessedAt: Date.now(),
  });

  return true;
}

function deleteAnalysisSession(analysisId) {
  return activeAnalyses.delete(analysisId);
}

function hasAnalysisSession(analysisId) {
  return activeAnalyses.has(analysisId);
}

function getAllAnalysisSessions() {
  return activeAnalyses;
}

/* ==========================================================
   PER-FILE AI CACHING
========================================================== */

function getFileAIAnalysis(analysisId, filePath) {
  const session = activeAnalyses.get(analysisId);

  if (!session || !session.fileAIAnalysisCache) {
    return null;
  }

  session.lastAccessedAt = Date.now();
  return session.fileAIAnalysisCache[filePath] || null;
}

function saveFileAIAnalysis(analysisId, filePath, analysis) {
  const session = activeAnalyses.get(analysisId);

  if (!session) return false;

  const existingCache = session.fileAIAnalysisCache || {};

  activeAnalyses.set(analysisId, {
    ...session,
    lastAccessedAt: Date.now(),
    fileAIAnalysisCache: {
      ...existingCache,
      [filePath]: analysis,
    },
  });

  return true;
}

/* ==========================================================
   AUTOMATIC MEMORY CLEANUP
========================================================== */

function cleanupStaleSessions(ttlMs = SESSION_TTL_MS) {
  const now = Date.now();
  for (const [id, session] of activeAnalyses.entries()) {
    const lastAccess = session.lastAccessedAt || session.createdAt;
    if (now - lastAccess > ttlMs) {
      activeAnalyses.delete(id);
    }
  }
}

// Periodically purge dead sessions every 30 minutes
setInterval(() => cleanupStaleSessions(), 30 * 60 * 1000);

/* ==========================================================
   EXPORTS
========================================================== */

module.exports = {
  createAnalysisSession,
  getAnalysisSession,
  updateAnalysisSession,
  deleteAnalysisSession,
  hasAnalysisSession,
  getAllAnalysisSessions,
  getFileAIAnalysis,
  saveFileAIAnalysis,
  cleanupStaleSessions,
};