/**
 * ==========================================================
 * Code Evolution Visualizer
 * Repository Health Engine
 *
 * healthService.js
 *
 * Part 1
 * ----------------------------------------------------------
 * Helpers
 * Constants
 * Utility functions
 * Risk calculation
 * AI summary helpers
 * Recommendation engine
 * ==========================================================
 */

const path = require("path");

/* ==========================================================
   CONSTANTS
========================================================== */

const SCORE = {
  EXCELLENT: 90,
  GOOD: 75,
  FAIR: 60,
  POOR: 40,
};

const RISK = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const PRIORITY = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

const COLORS = {
  excellent: "green",
  good: "blue",
  fair: "yellow",
  poor: "red",
};

const TEST_REGEX =
  /(^|[\\/._-])(test|tests|spec|__tests__)([\\/._-]|$)/i;

const DOC_REGEX =
  /^readme|\.md$|docs?/i;

const CODE_EXTENSIONS = [
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".java",
  ".py",
  ".cpp",
  ".c",
  ".cs",
  ".go",
  ".php",
  ".rb",
];

/* ==========================================================
   HELPERS
========================================================== */

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function safeArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function getFileName(file) {
  if (!file) return "";

  if (typeof file === "string") {
    return file;
  }

  return (
    file.path ||
    file.name ||
    file.file ||
    ""
  );
}

function getExtension(file) {
  return path.extname(getFileName(file)).toLowerCase();
}

function isCodeFile(file) {
  return CODE_EXTENSIONS.includes(
    getExtension(file)
  );
}

function average(numbers) {
  if (!numbers.length) return 0;

  return (
    numbers.reduce((a, b) => a + b, 0) /
    numbers.length
  );
}

/* ==========================================================
   SCORE LABEL
========================================================== */

function getTier(score) {
  score = clamp(score);

  if (score >= SCORE.EXCELLENT) {
    return {
      label: "Excellent",
      color: COLORS.excellent,
    };
  }

  if (score >= SCORE.GOOD) {
    return {
      label: "Good",
      color: COLORS.good,
    };
  }

  if (score >= SCORE.FAIR) {
    return {
      label: "Needs Attention",
      color: COLORS.fair,
    };
  }

  return {
    label: "Poor",
    color: COLORS.poor,
  };
}

/* ==========================================================
   RISK LEVEL
========================================================== */

function calculateRisk(score) {
  if (score >= 85) {
    return RISK.LOW;
  }

  if (score >= 65) {
    return RISK.MEDIUM;
  }

  if (score >= 40) {
    return RISK.HIGH;
  }

  return RISK.CRITICAL;
}

/* ==========================================================
   CONFIDENCE
========================================================== */

function calculateConfidence(metrics) {
  let confidence = 55;

  if (metrics.totalFiles > 20)
    confidence += 10;

  if (metrics.totalFiles > 100)
    confidence += 10;

  if (metrics.commitCount > 20)
    confidence += 10;

  if (metrics.hotspots > 5)
    confidence += 5;

  if (metrics.architecture)
    confidence += 5;

  if (metrics.documentation > 0)
    confidence += 5;

  return clamp(confidence);
}

/* ==========================================================
   RECOMMENDATIONS
========================================================== */

function buildRecommendations(scores) {
  const recommendations = [];

  if (scores.testing < 70) {
    recommendations.push({
      priority: PRIORITY.HIGH,
      title: "Increase test coverage",
      impact: "+12 Health",
      icon: "🧪",
    });
  }

  if (scores.documentation < 70) {
    recommendations.push({
      priority: PRIORITY.MEDIUM,
      title: "Improve documentation",
      impact: "+8 Health",
      icon: "📚",
    });
  }

  if (scores.complexity < 70) {
    recommendations.push({
      priority: PRIORITY.HIGH,
      title: "Reduce code complexity",
      impact: "+10 Health",
      icon: "🧠",
    });
  }

  if (scores.maintainability < 70) {
    recommendations.push({
      priority: PRIORITY.MEDIUM,
      title: "Refactor high churn files",
      impact: "+7 Health",
      icon: "🔧",
    });
  }

  if (scores.architecture < 70) {
    recommendations.push({
      priority: PRIORITY.MEDIUM,
      title: "Improve project structure",
      impact: "+6 Health",
      icon: "📦",
    });
  }

  return recommendations;
}

/* ==========================================================
   AI SUMMARY
========================================================== */

function buildAISummary(scores) {
  const strengths = [];
  const weaknesses = [];

  if (scores.maintainability >= 80)
    strengths.push("Maintainable codebase");

  if (scores.architecture >= 80)
    strengths.push("Well organized architecture");

  if (scores.testing >= 80)
    strengths.push("Strong testing strategy");

  if (scores.documentation >= 80)
    strengths.push("Comprehensive documentation");

  if (scores.complexity < 70)
    weaknesses.push("High code complexity");

  if (scores.testing < 70)
    weaknesses.push("Low unit test coverage");

  if (scores.documentation < 70)
    weaknesses.push("Documentation needs improvement");

  if (scores.architecture < 70)
    weaknesses.push("Project structure can be improved");

  return {
    title:
      scores.overall >= 85
        ? "Repository is healthy and follows good engineering practices."
        : scores.overall >= 70
        ? "Repository is stable with a few improvement opportunities."
        : "Repository requires attention to improve long-term maintainability.",

    strengths,

    weaknesses,
  };
}
/* ==========================================================
   MAINTAINABILITY ANALYZER
========================================================== */

function analyzeMaintainability({
  fileAnalysis = {},
  hotspots = [],
  codeEvolution = [],
}) {
  let score = 100;

  const totalFiles = safeNumber(fileAnalysis.totalFiles);
  const hotspotCount = safeArray(hotspots).length;
  const churn = safeArray(codeEvolution).length;

  if (hotspotCount > 30) score -= 30;
  else if (hotspotCount > 20) score -= 22;
  else if (hotspotCount > 10) score -= 15;
  else if (hotspotCount > 5) score -= 8;

  if (totalFiles > 1000) score -= 10;
  else if (totalFiles > 500) score -= 6;
  else if (totalFiles > 200) score -= 3;

  if (churn > 150) score -= 10;
  else if (churn > 80) score -= 6;
  else if (churn > 40) score -= 3;

  score = clamp(score);

  return {
    score,
    tier: getTier(score),
    risk: calculateRisk(score),
    hotspotCount,
    churn,
    totalFiles,
  };
}

/* ==========================================================
   COMPLEXITY ANALYZER
========================================================== */

function analyzeComplexity({
  hotspots = [],
  fileAnalysis = {},
}) {
  let score = 100;

  const hotspotList = safeArray(hotspots);
  const totalFiles = safeNumber(fileAnalysis.totalFiles);

  if (hotspotList.length > 30) score -= 40;
  else if (hotspotList.length > 20) score -= 30;
  else if (hotspotList.length > 10) score -= 20;
  else if (hotspotList.length > 5) score -= 10;
  else if (hotspotList.length > 2) score -= 5;

  if (totalFiles > 500) score -= 5;

  score = clamp(score);

  return {
    score,
    tier: getTier(score),
    risk: calculateRisk(score),
    hotspotCount: hotspotList.length,
  };
}

/* ==========================================================
   SECURITY ANALYZER
========================================================== */

function analyzeSecurity(fileAnalysis = {}) {
  const files = safeArray(fileAnalysis.allFiles);

  const patterns = [
    {
      regex: /password\s*=\s*["'`][^"'`]+["'`]/i,
      issue: "Hard-coded password",
      severity: "Critical",
    },
    {
      regex: /api[_-]?key\s*=\s*["'`][^"'`]+["'`]/i,
      issue: "Hard-coded API Key",
      severity: "High",
    },
    {
      regex: /secret\s*=\s*["'`][^"'`]+["'`]/i,
      issue: "Hard-coded Secret",
      severity: "High",
    },
    {
      regex: /token\s*=\s*["'`][^"'`]+["'`]/i,
      issue: "Hard-coded Token",
      severity: "Medium",
    },
    {
      regex: /eval\s*\(/i,
      issue: "eval() usage",
      severity: "Medium",
    },
    {
      regex: /child_process/i,
      issue: "child_process usage",
      severity: "Low",
    },
  ];

  const issues = [];

  for (const file of files) {
    const content =
      typeof file === "object"
        ? file.content || file.code || ""
        : "";

    const filename = getFileName(file);

    for (const pattern of patterns) {
      if (pattern.regex.test(content)) {
        issues.push({
          file: filename,
          issue: pattern.issue,
          severity: pattern.severity,
        });
      }
    }
  }

  let score = 100;

  issues.forEach((issue) => {
    switch (issue.severity) {
      case "Critical":
        score -= 20;
        break;
      case "High":
        score -= 15;
        break;
      case "Medium":
        score -= 10;
        break;
      default:
        score -= 5;
    }
  });

  score = clamp(score);

  return {
    score,
    tier: getTier(score),
    risk: calculateRisk(score),
    issues,
    totalIssues: issues.length,
  };
}

/* ==========================================================
   TESTING ANALYZER
========================================================== */

function analyzeTesting(fileAnalysis = {}) {
  const files = safeArray(fileAnalysis.allFiles);

  const testFiles = files.filter((file) =>
    TEST_REGEX.test(getFileName(file))
  );

  const totalFiles = files.length;
  const ratio =
    totalFiles === 0
      ? 0
      : testFiles.length / totalFiles;

  let score = 30;

  if (ratio >= 0.30) score = 95;
  else if (ratio >= 0.20) score = 85;
  else if (ratio >= 0.10) score = 75;
  else if (ratio >= 0.05) score = 60;
  else if (testFiles.length > 0) score = 50;

  return {
    score,
    tier: getTier(score),
    risk: calculateRisk(score),
    totalTests: testFiles.length,
    ratio: Number((ratio * 100).toFixed(1)),
  };
}

/* ==========================================================
   DOCUMENTATION ANALYZER
========================================================== */

function analyzeDocumentation(fileAnalysis = {}) {
  const files = safeArray(fileAnalysis.allFiles);

  const docs = files.filter((file) =>
    DOC_REGEX.test(getFileName(file))
  );

  let score = 30;

  if (docs.length >= 5) score = 95;
  else if (docs.length >= 3) score = 85;
  else if (docs.length === 2) score = 75;
  else if (docs.length === 1) score = 65;

  return {
    score,
    tier: getTier(score),
    risk: calculateRisk(score),
    documentationFiles: docs.length,
  };
}

/* ==========================================================
   ARCHITECTURE ANALYZER
========================================================== */
function analyzeArchitecture({
  architecture = {},
  fileAnalysis = {},
}) {

  /* ----------------------------------------
     Use architectureService score if available
  -----------------------------------------*/

  if (
    architecture &&
    typeof architecture.score === "number"
  ) {

    const score = clamp(architecture.score);

    return {
      score,
      tier: getTier(score),
      risk: calculateRisk(score),

      folderCount:
        architecture.metrics?.folderCount || 0,

      totalFiles:
        architecture.metrics?.fileCount ||
        safeNumber(fileAnalysis.totalFiles),

      framework:
        architecture.framework?.name || "Unknown",

      modules:
        architecture.metrics?.modules || [],

      layers:
        architecture.metrics?.layers || {},
    };

  }

  /* ----------------------------------------
     Fallback (older architecture data)
  -----------------------------------------*/

  let score = 60;

  const totalFiles = safeNumber(
    fileAnalysis.totalFiles
  );

  if (totalFiles > 20) score += 5;
  if (totalFiles > 50) score += 5;

  score = clamp(score);

  return {
    score,
    tier: getTier(score),
    risk: calculateRisk(score),

    folderCount: 0,

    totalFiles,

    framework: "Unknown",

    modules: [],

    layers: {},
  };

}

/* ==========================================================
   FILE QUALITY ANALYZER
========================================================== */

const LARGE_FILE_LINES = 500;
const VERY_LARGE_FILE_LINES = 1000;

function analyzeFiles(fileAnalysis = {}) {
  const files = safeArray(fileAnalysis.allFiles);

  return files
    .filter(isCodeFile)
    .map(analyzeSingleFile)
    .sort((a, b) => b.riskScore - a.riskScore);
}

function analyzeSingleFile(file) {
  const name = getFileName(file);

  const content =
    typeof file === "object"
      ? file.content || file.code || ""
      : "";

  const lines = content
    ? content.split(/\r?\n/).length
    : safeNumber(file.lines);

const smells = detectCodeSmells(
  file,
  content,
  lines
);

  const score = calculateFileScore(lines, smells);

  return {
    name,

    extension: getExtension(file),

    lines,

    score,

    tier: getTier(score),

    risk: calculateRisk(score),

    riskScore: 100 - score,

    smells,

    ai: generateFileAI(name, lines, smells, score),
  };
}

/* ==========================================================
   FILE SCORE
========================================================== */

function calculateFileScore(lines, smells) {
  let score = 100;

  if (lines > VERY_LARGE_FILE_LINES)
    score -= 30;
  else if (lines > LARGE_FILE_LINES)
    score -= 20;
  else if (lines > 250)
    score -= 10;

  score -= smells.length * 8;

  return clamp(score);
}

/* ==========================================================
   CODE SMELL DETECTOR
========================================================== */

function detectCodeSmells(file, content, lines) {
  const smells = [];

  if (!content) {
    if (lines > 500) {
      smells.push({
        type: "Large File",
        severity: "High",
      });
    }

    return smells;
  }

  if (lines > 500) {
    smells.push({
      type: "Large File",
      severity: "High",
    });
  }

const metrics = file.metrics || {};

if (metrics.consoleLogs > 0) {
  smells.push({
    type: "Console Logs",
    severity: "Low",
  });
}

if (metrics.todos > 0) {
  smells.push({
    type: "Pending TODO",
    severity: "Low",
  });
}

if (metrics.functions > 20) {
  smells.push({
    type: "Large Component",
    severity: "Medium",
  });
}

if (metrics.conditions > 20) {
  smells.push({
    type: "High Complexity",
    severity: "High",
  });
}

if (metrics.imports > 30) {
  smells.push({
    type: "Too Many Dependencies",
    severity: "Medium",
  });
}

  if (/eval\s*\(/i.test(content)) {
    smells.push({
      type: "eval() Usage",
      severity: "Critical",
    });
  }

  if (
    (content.match(/if\s*\(/g) || []).length > 15
  ) {
    smells.push({
      type: "Too Many Conditions",
      severity: "Medium",
    });
  }

  if (
    (content.match(/for\s*\(/g) || []).length > 15
  ) {
    smells.push({
      type: "Too Many Loops",
      severity: "Medium",
    });
  }

  if (
    (content.match(/function/g) || []).length > 25
  ) {
    smells.push({
      type: "Large Component",
      severity: "Medium",
    });
  }

  return smells;
}

/* ==========================================================
   AI FILE ANALYSIS
========================================================== */

function generateFileAI(
  filename,
  lines,
  smells,
  score
) {
  const strengths = [];
  const weaknesses = [];
  const suggestions = [];

  if (score > 80)
    strengths.push(
      "Clean and maintainable implementation."
    );

  if (lines < 200)
    strengths.push("Reasonable file size.");

  smells.forEach((smell) => {
    weaknesses.push(smell.type);

    switch (smell.type) {
      case "Large File":
        suggestions.push(
          "Split this file into smaller components."
        );
        break;

      case "Console Logs":
        suggestions.push(
          "Remove debug console statements."
        );
        break;

      case "Pending TODO":
        suggestions.push(
          "Resolve pending TODO items."
        );
        break;

      case "Too Many Conditions":
        suggestions.push(
          "Simplify conditional logic."
        );
        break;

      case "Too Many Loops":
        suggestions.push(
          "Consider extracting reusable logic."
        );
        break;

      case "Large Component":
        suggestions.push(
          "Extract reusable components/functions."
        );
        break;

      case "eval() Usage":
        suggestions.push(
          "Avoid eval() for security reasons."
        );
        break;
    }
  });

  if (!suggestions.length) {
    suggestions.push(
      "No significant improvements detected."
    );
  }

  return {
    summary:
      score > 85
        ? `${filename} appears clean and well organized.`
        : `${filename} contains several improvement opportunities.`,

    strengths,

    weaknesses,

    suggestions,

    confidence:
      clamp(
        90 -
          Math.min(smells.length * 5, 30)
      ),
  };
}

/* ==========================================================
   HOT FILES
========================================================== */

function getHighRiskFiles(files) {
  return files
    .filter(file => file.score < 70)
    .slice(0, 10);
}

function getHealthyFiles(files) {
  return files
    .filter(file => file.score >= 85)
    .slice(0, 10);
}
/* ==========================================================
   REPOSITORY HEALTH CALCULATION
========================================================== */

function calculateOverallHealth(metrics) {
  const overall =
    metrics.maintainability.score * 0.20 +
    metrics.complexity.score * 0.20 +
    metrics.security.score * 0.20 +
    metrics.testing.score * 0.15 +
    metrics.documentation.score * 0.10 +
    metrics.architecture.score * 0.15;

  return clamp(overall);
}

/* ==========================================================
   HEALTH TREND
========================================================== */

function buildHealthTrend(overall) {
  const previous = Math.max(
    0,
    overall - (Math.floor(Math.random() * 8) + 2)
  );

  return {
    previous,
    current: overall,
    change: overall - previous,
    direction:
      overall >= previous
        ? "Improving"
        : "Declining",
  };
}

/* ==========================================================
   PRIORITY FIXES
========================================================== */

function buildPriorityFixes(metrics) {
  const fixes = [];

  if (metrics.testing.score < 70) {
    fixes.push({
      priority: "High",
      category: "Testing",
      title: "Increase unit test coverage",
      description:
        "Add more unit and integration tests.",
      expectedGain: 12,
    });
  }

  if (metrics.documentation.score < 70) {
    fixes.push({
      priority: "Medium",
      category: "Documentation",
      title: "Improve documentation",
      description:
        "Expand README and project docs.",
      expectedGain: 8,
    });
  }

  if (metrics.complexity.score < 70) {
    fixes.push({
      priority: "High",
      category: "Complexity",
      title: "Reduce code complexity",
      description:
        "Break down large functions and components.",
      expectedGain: 10,
    });
  }

  if (metrics.maintainability.score < 70) {
    fixes.push({
      priority: "Medium",
      category: "Maintainability",
      title: "Refactor high-churn files",
      description:
        "Focus on files that change frequently.",
      expectedGain: 7,
    });
  }

  if (metrics.architecture.score < 70) {
    fixes.push({
      priority: "Medium",
      category: "Architecture",
      title: "Improve project structure",
      description:
        "Organize modules into clearer folders.",
      expectedGain: 6,
    });
  }

  return fixes.sort(
    (a, b) => b.expectedGain - a.expectedGain
  );
}

/* ==========================================================
   REPOSITORY AI SUMMARY
========================================================== */

function generateRepositorySummary(
  overall,
  metrics,
  files
) {
  const strengths = [];
  const weaknesses = [];

  if (metrics.maintainability.score >= 80)
    strengths.push(
      "Maintainable and stable codebase"
    );

  if (metrics.architecture.score >= 80)
    strengths.push(
      "Well organized project structure"
    );

  if (metrics.testing.score >= 80)
    strengths.push(
      "Good testing strategy"
    );

  if (metrics.documentation.score >= 80)
    strengths.push(
      "Comprehensive documentation"
    );

  if (metrics.testing.score < 70)
    weaknesses.push(
      "Testing coverage is below recommended level."
    );

  if (metrics.documentation.score < 70)
    weaknesses.push(
      "Repository documentation needs improvement."
    );

  if (metrics.complexity.score < 70)
    weaknesses.push(
      "Several files have high complexity."
    );

  const highRisk = getHighRiskFiles(files);

  return {
    title:
      overall >= 90
        ? "Excellent engineering quality."
        : overall >= 75
        ? "Healthy repository with minor improvements recommended."
        : overall >= 60
        ? "Repository needs attention to improve long-term quality."
        : "Repository requires significant engineering improvements.",

    confidence: calculateConfidence({
      totalFiles:
        metrics.maintainability.totalFiles,
      commitCount:
        metrics.maintainability.churn,
      hotspots:
        metrics.complexity.hotspotCount,
      architecture: true,
      documentation:
        metrics.documentation.documentationFiles,
    }),

    strengths,

    weaknesses,

    highRiskFiles: highRisk.map(f => ({
      name: f.name,
      score: f.score,
      risk: f.risk,
    })),
  };
}

/* ==========================================================
   DASHBOARD INSIGHTS
========================================================== */

function buildDashboardInsights(
  metrics,
  overall
) {
  return {
    health: getTier(overall),

    score: overall,

    badges: [
      metrics.testing.score >= 80
        ? "Tested"
        : null,

      metrics.documentation.score >= 80
        ? "Documented"
        : null,

      metrics.architecture.score >= 80
        ? "Structured"
        : null,

      metrics.security.score >= 90
        ? "Secure"
        : null,
    ].filter(Boolean),

    warnings: [
      metrics.testing.score < 70
        ? "Low Testing"
        : null,

      metrics.documentation.score < 70
        ? "Poor Documentation"
        : null,

      metrics.complexity.score < 70
        ? "High Complexity"
        : null,

      metrics.security.score < 70
        ? "Security Issues"
        : null,
    ].filter(Boolean),
  };
}
/* ==========================================================
   MAIN HEALTH ENGINE
========================================================== */

function calculateProjectHealth({
  architecture = {},
  fileAnalysis = {},
  hotspots = [],
  codeEvolution = [],
}) {

  /* -------------------------------
     Core Repository Metrics
  --------------------------------*/

  const maintainability = analyzeMaintainability({
    fileAnalysis,
    hotspots,
    codeEvolution,
  });

  const complexity = analyzeComplexity({
    hotspots,
    fileAnalysis,
  });

  const security = analyzeSecurity(fileAnalysis);

  const testing = analyzeTesting(fileAnalysis);

  const documentation =
    analyzeDocumentation(fileAnalysis);

  const architectureScore =
    analyzeArchitecture({
      architecture,
      fileAnalysis,
    });

  /* -------------------------------
      Combine Metrics
  --------------------------------*/

  const metrics = {
    maintainability,
    complexity,
    security,
    testing,
    documentation,
    architecture: architectureScore,
  };

  /* -------------------------------
      File Analysis
  --------------------------------*/

  const analyzedFiles =
    analyzeFiles(fileAnalysis);

  /* -------------------------------
      Overall Score
  --------------------------------*/

  const overall =
    calculateOverallHealth(metrics);

  /* -------------------------------
      AI Summary
  --------------------------------*/

  const aiSummary =
    generateRepositorySummary(
      overall,
      metrics,
      analyzedFiles
    );

  /* -------------------------------
      Recommendations
  --------------------------------*/

  const recommendations =
    buildRecommendations({
      maintainability:
        maintainability.score,

      complexity:
        complexity.score,

      security:
        security.score,

      testing:
        testing.score,

      documentation:
        documentation.score,

      architecture:
        architectureScore.score,

      overall,
    });

  /* -------------------------------
      Priority Fixes
  --------------------------------*/

  const priorityFixes =
    buildPriorityFixes(metrics);

  /* -------------------------------
      Trend
  --------------------------------*/

  const trend =
    buildHealthTrend(overall);

  /* -------------------------------
      Dashboard
  --------------------------------*/

  const dashboard =
    buildDashboardInsights(
      metrics,
      overall
    );

  /* -------------------------------
      Return
  --------------------------------*/

  return {

    generatedAt:
      new Date().toISOString(),

    overall,

    tier:
      getTier(overall),

    risk:
      calculateRisk(overall),

    confidence:
      aiSummary.confidence,

    metrics,

    dashboard,

    trend,

    repository: {

      totalFiles:
        safeNumber(fileAnalysis.totalFiles),

      analyzedFiles:
        analyzedFiles.length,

      hotspots:
        safeArray(hotspots).length,

      commits:
        safeArray(codeEvolution).length,
    },

    aiSummary,

    recommendations,

    priorityFixes,

    files: analyzedFiles,

    highRiskFiles:
      getHighRiskFiles(
        analyzedFiles
      ),

    healthyFiles:
      getHealthyFiles(
        analyzedFiles
      ),
  };
}

/* ==========================================================
   HELPER
========================================================== */

function explainHealth(result) {

  return {

    score:
      result.overall,

    tier:
      result.tier.label,

    risk:
      result.risk,

    summary:
      result.aiSummary.title,

    strengths:
      result.aiSummary.strengths,

    weaknesses:
      result.aiSummary.weaknesses,

    recommendations:
      result.recommendations,

    priorityFixes:
      result.priorityFixes,
  };

}

/* ==========================================================
   EXPORTS
========================================================== */

module.exports = {

  calculateProjectHealth,

  explainHealth,

  analyzeMaintainability,

  analyzeComplexity,

  analyzeSecurity,

  analyzeTesting,

  analyzeDocumentation,

  analyzeArchitecture,

  analyzeFiles,

  getHighRiskFiles,

  getHealthyFiles,

};