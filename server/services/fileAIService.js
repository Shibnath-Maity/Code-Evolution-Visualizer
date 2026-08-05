const { generateJSON } = require("./llmService");
function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getRisk(score) {
  if (score >= 85) return "Low";
  if (score >= 70) return "Medium";
  if (score >= 50) return "High";
  return "Critical";
}

function analyzeFile(file) {

  const metrics = file.metrics || {};

  let score = 100;

  const issues = [];

  /* --------------------------------
     Large File
  -------------------------------- */

  if (file.lines > 600) {
    score -= 20;

    issues.push({
      severity: "High",
      title: "Very Large File",
      description:
        "This file contains more than 600 lines."
    });

  } else if (file.lines > 300) {

    score -= 10;

    issues.push({
      severity: "Medium",
      title: "Large File",
      description:
        "Consider splitting into smaller modules."
    });

  }

  /* --------------------------------
     Functions
  -------------------------------- */

  if (metrics.functions > 20) {

    score -= 10;

    issues.push({
      severity: "Medium",
      title: "Too Many Functions",
      description:
        "File contains many functions."
    });

  }

  /* --------------------------------
     Imports
  -------------------------------- */

  if (metrics.imports > 30) {

    score -= 8;

    issues.push({
      severity: "Medium",
      title: "Too Many Imports",
      description:
        "Large dependency surface."
    });

  }

  /* --------------------------------
     TODO
  -------------------------------- */

  if (metrics.todos > 0) {

    score -= metrics.todos;

    issues.push({
      severity: "Low",
      title: "TODO Comments",
      description:
        `${metrics.todos} TODO/FIXME comments found`
    });

  }

  /* --------------------------------
     Console Logs
  -------------------------------- */

  if (metrics.consoleLogs > 0) {

    score -= metrics.consoleLogs;

    issues.push({
      severity: "Low",
      title: "Console Logs",
      description:
        `${metrics.consoleLogs} console statements detected`
    });

  }

  /* --------------------------------
     Complexity
  -------------------------------- */

  if (metrics.conditions > 20) {

    score -= 15;

    issues.push({
      severity: "High",
      title: "High Complexity",
      description:
        "Too many conditional statements."
    });

  }

  score = clamp(score);

  return {

    name: file.name,

    path: file.path,

    score,

    risk: getRisk(score),

    issues,

    metrics,

    summary:
      generateSummary(file, score),

    recommendations:
      generateRecommendations(file, metrics),

  };

}
/* ==========================================================
   AI SUMMARY
========================================================== */

function generateSummary(file, score) {

  const metrics = file.metrics || {};

  const strengths = [];
  const weaknesses = [];

  if (file.lines < 200)
    strengths.push("Compact file size");

  if (metrics.consoleLogs === 0)
    strengths.push("No console.log statements");

  if (metrics.todos === 0)
    strengths.push("No pending TODO comments");

  if (metrics.conditions < 10)
    strengths.push("Simple control flow");

  if (file.lines > 300)
    weaknesses.push("Large source file");

  if (metrics.consoleLogs > 0)
    weaknesses.push("Contains console logs");

  if (metrics.todos > 0)
    weaknesses.push("Contains unfinished TODOs");

  if (metrics.functions > 20)
    weaknesses.push("Too many functions");

  if (metrics.conditions > 20)
    weaknesses.push("High cyclomatic complexity");

  return {

    title:
      score >= 90
        ? "Excellent code quality"
        : score >= 80
        ? "Healthy source file"
        : score >= 70
        ? "Needs minor improvements"
        : score >= 50
        ? "Needs refactoring"
        : "High-risk file",

    strengths,

    weaknesses,

  };

}

/* ==========================================================
   RECOMMENDATIONS
========================================================== */

function generateRecommendations(file, metrics) {

  const recommendations = [];

  if (file.lines > 300) {

    recommendations.push({
      priority: "High",
      title: "Split Large File",
      description:
        "Break this file into smaller reusable modules.",
    });

  }

  if (metrics.functions > 20) {

    recommendations.push({
      priority: "Medium",
      title: "Reduce Function Count",
      description:
        "Move related functions into helper modules.",
    });

  }

  if (metrics.consoleLogs > 0) {

    recommendations.push({
      priority: "Low",
      title: "Remove Console Logs",
      description:
        "Remove debugging statements before production.",
    });

  }

  if (metrics.todos > 0) {

    recommendations.push({
      priority: "Medium",
      title: "Resolve TODOs",
      description:
        "Complete or remove pending TODO/FIXME comments.",
    });

  }

  if (metrics.conditions > 20) {

    recommendations.push({
      priority: "High",
      title: "Reduce Complexity",
      description:
        "Refactor nested conditions into smaller functions.",
    });

  }

  if (metrics.imports > 30) {

    recommendations.push({
      priority: "Medium",
      title: "Reduce Dependencies",
      description:
        "Consider extracting reusable modules.",
    });

  }

  return recommendations;

}

/* ==========================================================
   FILE HEALTH BADGES
========================================================== */

function getHealthBadge(score) {

  if (score >= 90)
    return {
      label: "Excellent",
      color: "emerald",
    };

  if (score >= 80)
    return {
      label: "Good",
      color: "green",
    };

  if (score >= 70)
    return {
      label: "Fair",
      color: "yellow",
    };

  if (score >= 50)
    return {
      label: "Poor",
      color: "orange",
    };

  return {
    label: "Critical",
    color: "red",
  };

}

/* ==========================================================
   FILE COMPLEXITY
========================================================== */

function calculateComplexity(metrics) {

  return (
    metrics.conditions * 2 +
    metrics.loops * 2 +
    metrics.switches * 2 +
    metrics.functions +
    metrics.tryCatch
  );

}
/* ==========================================================
   REPOSITORY AI ANALYSIS
========================================================== */

 async function analyzeRepositoryFiles(fileAnalysis = {}) {

  const files = Array.isArray(fileAnalysis.allFiles)
    ? fileAnalysis.allFiles
    : [];

 const analyzedFiles = await Promise.all(
  files.map(async (file) => {
    const analysis = analyzeFile(file);

    try {
      const ai = await generateJSON(`
You are a senior software engineer.

Analyze this repository file.

File:
${file.path}

Code:

${file.content.slice(0, 6000)}

Return JSON only.

{
  "purpose":"",
  "responsibility":"",
  "keyFeatures":[
    ""
  ],
  "dependencies":[
    ""
  ],
  "designIssues":[
    ""
  ],
  "businessLogic":"",
  "improvements":[
    ""
  ]
}
`);

      analysis.ai = ai;
    } catch (e) {
      console.log("AI skipped:", file.path);

      analysis.ai = {
        purpose: "",
        responsibility: "",
        keyFeatures: [],
        dependencies: [],
        designIssues: [],
        businessLogic: "",
        improvements: [],
      };
    }

    return analysis;
  })
);

  analyzedFiles.sort(
    (a, b) => a.score - b.score
  );

  const statistics = {

    totalFiles: analyzedFiles.length,

    excellent: analyzedFiles.filter(
      f => f.score >= 90
    ).length,

    good: analyzedFiles.filter(
      f => f.score >= 80 &&
      f.score < 90
    ).length,

    fair: analyzedFiles.filter(
      f => f.score >= 70 &&
      f.score < 80
    ).length,

    poor: analyzedFiles.filter(
      f => f.score >= 50 &&
      f.score < 70
    ).length,

    critical: analyzedFiles.filter(
      f => f.score < 50
    ).length,

  };

  return {

    files: analyzedFiles,

    statistics,

    topRiskFiles:
      analyzedFiles.slice(0, 10),

    healthiestFiles:
      [...analyzedFiles]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10),

  };

}

/* ==========================================================
   FIND FILE ANALYSIS
========================================================== */

function getFileAnalysis(result, filePath) {

  return (
    result.files.find(
      file =>
        file.path === filePath ||
        file.name === filePath
    ) || null
  );

}

/* ==========================================================
   SEARCH FILES
========================================================== */

function searchFileAnalysis(
  result,
  keyword
) {

  keyword = keyword.toLowerCase();

  return result.files.filter(file =>
    file.path
      .toLowerCase()
      .includes(keyword)
  );

}

/* ==========================================================
   EXPORTS
========================================================== */

module.exports = {

  analyzeFile,

  analyzeRepositoryFiles,

  getFileAnalysis,

  searchFileAnalysis,

};