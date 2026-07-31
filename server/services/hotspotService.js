// Weights for the three signals that make up a hotspot score. They sum
// to 1 so the final score is interpretable as roughly 0-100.
const WEIGHTS = {
  changes: 0.5,
  churn: 0.3,
  contributors: 0.2,
};

// Score thresholds are applied to the *normalized* 0-100 score, so they
// mean the same thing regardless of whether the repo is small or huge —
// unlike comparing raw change/churn counts to fixed numbers, which
// would misclassify everything as HIGH on a big repo and everything as
// LOW on a small one.
const RISK_THRESHOLDS = {
  high: 66,
  medium: 33,
};

// Min-max normalize a list of numbers to the 0-1 range. If every value
// is the same (including all-zero), returns 0 for all of them rather
// than dividing by zero.
function normalize(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  if (range === 0) return values.map(() => 0);

  return values.map((v) => (v - min) / range);
}

function classifyRisk(score) {
  if (score >= RISK_THRESHOLDS.high) return "HIGH";
  if (score >= RISK_THRESHOLDS.medium) return "MEDIUM";
  return "LOW";
}

/**
 * Ranks files by "hotspot" risk — a combination of how often a file
 * changes, how much churn it accumulates, and how many different
 * people touch it. All three tend to correlate with bugs and
 * coordination overhead.
 *
 * @param {{ allFiles: Array<{file, changes, additions, deletions, contributorCount}> }} fileAnalysis
 */
function calculateHotspots(fileAnalysis) {
  const files = fileAnalysis?.allFiles || [];

  if (files.length === 0) {
    return { hotspots: [], allScored: [] };
  }

  const changesValues = files.map((f) => f.changes || 0);
  const churnValues = files.map((f) => (f.additions || 0) + (f.deletions || 0));
  const contributorValues = files.map((f) => f.contributorCount || 0);

  const normChanges = normalize(changesValues);
  const normChurn = normalize(churnValues);
  const normContributors = normalize(contributorValues);

  const scored = files.map((file, i) => {
    const changes = changesValues[i];
    const churn = churnValues[i];
    const contributorCount = contributorValues[i];

    const score = Math.round(
      100 *
        (normChanges[i] * WEIGHTS.changes +
          normChurn[i] * WEIGHTS.churn +
          normContributors[i] * WEIGHTS.contributors)
    );

    return {
      file: file.file,
      changes,
      additions: file.additions || 0,
      deletions: file.deletions || 0,
      churn,
      contributors: contributorCount,
      score,
      risk: classifyRisk(score),
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return {
    // Top 10 for a "riskiest files" widget.
    hotspots: scored.slice(0, 10),
    // Full ranked list, e.g. for a "how many HIGH-risk files total" stat
    // or a searchable table — dropped entirely in the original, which
    // only ever returned the top 10.
    allScored: scored,
  };
}

module.exports = {
  calculateHotspots,
};