function clamp(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Safely get a file name/path
 */
function getFileName(file) {
  if (!file) return "";

  if (typeof file === "string") {
    return file;
  }

  return file.path || file.name || file.file || "";
}

/**
 * Safely get numeric value
 */
function getNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

/**
 * ---------------------------------------------------------
 * MAINTAINABILITY
 * ---------------------------------------------------------
 *
 * Uses:
 * - hotspots
 * - file count
 * - code churn
 */
function calculateMaintainability({
  fileAnalysis,
  hotspots,
  codeEvolution,
}) {
  let score = 100;

  const totalFiles = getNumber(
    fileAnalysis?.totalFiles
  );

  const hotspotCount = Array.isArray(hotspots)
    ? hotspots.length
    : 0;

  const churnCount = Array.isArray(codeEvolution)
    ? codeEvolution.length
    : 0;

  // Hotspots indicate areas that require frequent
  // maintenance.
  if (hotspotCount > 30) score -= 30;
  else if (hotspotCount > 20) score -= 22;
  else if (hotspotCount > 10) score -= 15;
  else if (hotspotCount > 5) score -= 8;

  // Extremely large repositories need more
  // maintenance effort.
  if (totalFiles > 1000) score -= 10;
  else if (totalFiles > 500) score -= 6;
  else if (totalFiles > 200) score -= 3;

  // Churn is useful, but don't punish active projects
  // too aggressively.
  if (churnCount > 100) score -= 5;
  else if (churnCount > 50) score -= 3;

  return clamp(score);
}


/**
 * ---------------------------------------------------------
 * COMPLEXITY
 * ---------------------------------------------------------
 *
 * Current version uses hotspots and file concentration.
 *
 * Later we can add actual cyclomatic complexity.
 */
function calculateComplexity({
  hotspots,
  fileAnalysis,
}) {
  let score = 100;

  const hotspotList = Array.isArray(hotspots)
    ? hotspots
    : [];

  const totalFiles = getNumber(
    fileAnalysis?.totalFiles
  );

  if (hotspotList.length > 30) score -= 40;
  else if (hotspotList.length > 20) score -= 30;
  else if (hotspotList.length > 10) score -= 20;
  else if (hotspotList.length > 5) score -= 10;
  else if (hotspotList.length > 2) score -= 5;

  if (totalFiles > 500) score -= 5;

  return clamp(score);
}


/**
 * ---------------------------------------------------------
 * SECURITY
 * ---------------------------------------------------------
 *
 * Initial static security scanner.
 *
 * Looks for common dangerous patterns.
 */
function calculateSecurity(fileAnalysis) {
  let score = 100;

  const files = fileAnalysis?.allFiles || [];

  let securityIssues = [];

  const patterns = [
    {
      regex: /password\s*=\s*["'`][^"'`]+["'`]/i,
      type: "Hard-coded password",
    },
    {
      regex: /api[_-]?key\s*=\s*["'`][^"'`]+["'`]/i,
      type: "Hard-coded API key",
    },
    {
      regex: /secret\s*=\s*["'`][^"'`]+["'`]/i,
      type: "Hard-coded secret",
    },
    {
      regex: /token\s*=\s*["'`][^"'`]+["'`]/i,
      type: "Hard-coded token",
    },
    {
      regex: /eval\s*\(/i,
      type: "eval() usage",
    },
    {
      regex: /child_process/i,
      type: "child_process usage",
    },
  ];

  for (const file of files) {
    const name = getFileName(file);

    /*
     * We currently only have file metadata here.
     *
     * If your fileAnalysis contains source/content,
     * scan it too.
     */
    const content =
      typeof file === "object"
        ? file.content || file.code || ""
        : "";

    for (const pattern of patterns) {
      if (pattern.regex.test(content)) {
        securityIssues.push({
          file: name,
          issue: pattern.type,
        });
      }
    }
  }

  score -= securityIssues.length * 10;

  return {
    score: clamp(score),
    issues: securityIssues,
  };
}


/**
 * ---------------------------------------------------------
 * TESTING
 * ---------------------------------------------------------
 */
function calculateTesting(fileAnalysis) {
  const files = fileAnalysis?.allFiles || [];

  const totalFiles = files.length;

  if (totalFiles === 0) {
    return {
      score: 0,
      testFiles: 0,
      ratio: 0,
    };
  }

  const testFiles = files.filter((file) => {
    const name = getFileName(file);

    return (
      /(^|[./_-])(test|tests|spec|__tests__)([./_-]|$)/i.test(
        name
      ) ||
      /\.(test|spec)\.[a-z0-9]+$/i.test(name)
    );
  }).length;

  const ratio = testFiles / totalFiles;

  let score = 30;

  if (ratio >= 0.30) score = 95;
  else if (ratio >= 0.20) score = 85;
  else if (ratio >= 0.10) score = 75;
  else if (ratio >= 0.05) score = 60;
  else if (testFiles > 0) score = 50;

  return {
    score,
    testFiles,
    ratio: Number((ratio * 100).toFixed(1)),
  };
}


/**
 * ---------------------------------------------------------
 * DOCUMENTATION
 * ---------------------------------------------------------
 */
function calculateDocumentation(fileAnalysis) {
  const files = fileAnalysis?.allFiles || [];

  const documentationFiles = files.filter((file) => {
    const name = getFileName(file);

    return (
      /^readme/i.test(name) ||
      /\.md$/i.test(name) ||
      /(^|\/)docs?(\/|$)/i.test(name)
    );
  }).length;

  let score = 30;

  if (documentationFiles >= 5) score = 95;
  else if (documentationFiles >= 3) score = 85;
  else if (documentationFiles === 2) score = 75;
  else if (documentationFiles === 1) score = 65;

  return {
    score,
    documentationFiles,
  };
}


/**
 * ---------------------------------------------------------
 * ARCHITECTURE
 * ---------------------------------------------------------
 */
function calculateArchitecture({
  architecture,
  fileAnalysis,
}) {
  let score = 60;

  const totalFiles = getNumber(
    fileAnalysis?.totalFiles
  );

  const folders =
    architecture?.folders || [];

  const files =
    architecture?.files || [];

  const folderCount = folders.length;

  /*
   * A repository with some meaningful folder
   * organization gets a better starting score.
   */
  if (folderCount >= 2) score += 10;
  if (folderCount >= 5) score += 10;
  if (folderCount >= 10) score += 5;

  /*
   * Very small repositories don't need complicated
   * architecture.
   */
  if (totalFiles > 20) score += 5;
  if (totalFiles > 50) score += 5;

  /*
   * If architecture exists, reward having a
   * structured representation.
   */
  if (architecture) {
    score += 5;
  }

  return clamp(score);
}


/**
 * ---------------------------------------------------------
 * OVERALL HEALTH
 * ---------------------------------------------------------
 */
function calculateOverallHealth(scores) {
  const overall =
    scores.maintainability * 0.20 +
    scores.complexity * 0.20 +
    scores.security * 0.20 +
    scores.testing * 0.15 +
    scores.documentation * 0.10 +
    scores.architecture * 0.15;

  return clamp(overall);
}


/**
 * ---------------------------------------------------------
 * MAIN HEALTH ANALYZER
 * ---------------------------------------------------------
 */
function calculateProjectHealth({
  architecture,
  fileAnalysis,
  hotspots,
  codeEvolution,
}) {
  const maintainability =
    calculateMaintainability({
      fileAnalysis,
      hotspots,
      codeEvolution,
    });

  const complexity =
    calculateComplexity({
      hotspots,
      fileAnalysis,
    });

  const security =
    calculateSecurity(fileAnalysis);

  const testing =
    calculateTesting(fileAnalysis);

  const documentation =
    calculateDocumentation(fileAnalysis);

  const architectureScore =
    calculateArchitecture({
      architecture,
      fileAnalysis,
    });

  const scores = {
    maintainability,
    complexity,
    security: security.score,
    testing: testing.score,
    documentation: documentation.score,
    architecture: architectureScore,
  };

  const overall =
    calculateOverallHealth(scores);

  return {
    overall,

    maintainability: {
      score: maintainability,
    },

    complexity: {
      score: complexity,
    },

    security,

    testing,

    documentation,

    architecture: {
      score: architectureScore,
    },
  };
}


module.exports = {
  calculateProjectHealth,
};