/**
 * aiFileAnalysisService.js
 * 
 * Provides synchronous static code analysis and scoring metrics.
 * AI/LLM operations have been separated out into fileExplanationService.js.
 */

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
      description: "This file contains more than 600 lines.",
    });
  } else if (file.lines > 300) {
    score -= 10;

    issues.push({
      severity: "Medium",
      title: "Large File",
      description: "Consider splitting into smaller modules.",
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
      description: "File contains many functions.",
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
      description: "Large dependency surface.",
    });
  }

  /* --------------------------------
     TODOs
  -------------------------------- */
  if (metrics.todos > 0) {
    score -= metrics.todos;

    issues.push({
      severity: "Low",
      title: "TODO Comments",
      description: `${metrics.todos} TODO/FIXME comments found`,
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
      description: `${metrics.consoleLogs} console statements detected`,
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
      description: "Too many conditional statements.",
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
    summary: generateSummary(file, score),
    recommendations: generateRecommendations(file, metrics),
  };
}

function generateSummary(file, score) {
  const metrics = file.metrics || {};

  const strengths = [];
  const weaknesses = [];

  if (file.lines < 200) strengths.push("Compact file size");
  if (metrics.consoleLogs === 0) strengths.push("No console.log statements");
  if (metrics.todos === 0) strengths.push("No pending TODO comments");
  if (metrics.conditions < 10) strengths.push("Simple control flow");

  if (file.lines > 300) weaknesses.push("Large source file");
  if (metrics.consoleLogs > 0) weaknesses.push("Contains console logs");
  if (metrics.todos > 0) weaknesses.push("Contains unfinished TODOs");
  if (metrics.functions > 20) weaknesses.push("Too many functions");
  if (metrics.conditions > 20) weaknesses.push("High cyclomatic complexity");

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

function generateRecommendations(file, metrics) {
  const recommendations = [];

  if (file.lines > 300) {
    recommendations.push({
      priority: "High",
      title: "Split Large File",
      description: "Break this file into smaller reusable modules.",
    });
  }

  if (metrics.functions > 20) {
    recommendations.push({
      priority: "Medium",
      title: "Reduce Function Count",
      description: "Move related functions into helper modules.",
    });
  }

  if (metrics.consoleLogs > 0) {
    recommendations.push({
      priority: "Low",
      title: "Remove Console Logs",
      description: "Remove debugging statements before production.",
    });
  }

  if (metrics.todos > 0) {
    recommendations.push({
      priority: "Medium",
      title: "Resolve TODOs",
      description: "Complete or remove pending TODO/FIXME comments.",
    });
  }

  if (metrics.conditions > 20) {
    recommendations.push({
      priority: "High",
      title: "Reduce Complexity",
      description: "Refactor nested conditions into smaller functions.",
    });
  }

  if (metrics.imports > 30) {
    recommendations.push({
      priority: "Medium",
      title: "Reduce Dependencies",
      description: "Consider extracting reusable modules.",
    });
  }

  return recommendations;
}

function getHealthBadge(score) {
  if (score >= 90) return { label: "Excellent", color: "emerald" };
  if (score >= 80) return { label: "Good", color: "green" };
  if (score >= 70) return { label: "Fair", color: "yellow" };
  if (score >= 50) return { label: "Poor", color: "orange" };

  return { label: "Critical", color: "red" };
}

function calculateComplexity(metrics) {
  return (
    (metrics.conditions || 0) * 2 +
    (metrics.loops || 0) * 2 +
    (metrics.switches || 0) * 2 +
    (metrics.functions || 0) +
    (metrics.tryCatch || 0)
  );
}

function getFileAnalysis(result, filePath) {
  return (
    result.files.find(
      (file) => file.path === filePath || file.name === filePath
    ) || null
  );
}

function searchFileAnalysis(result, keyword) {
  const term = keyword.toLowerCase();

  return result.files.filter((file) =>
    file.path.toLowerCase().includes(term)
  );
}

module.exports = {
  analyzeFile,
  getFileAnalysis,
  searchFileAnalysis,
  getHealthBadge,
  calculateComplexity,
};