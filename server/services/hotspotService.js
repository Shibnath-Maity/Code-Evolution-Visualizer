function calculateHotspots(fileAnalysis, contributors) {
  const hotspots = [];

  // Use all analyzed files
  const files = fileAnalysis.allFiles || [];

  files.forEach((file) => {
    const fileName = file.file;

    const changes = file.changes;
    const additions = file.additions || 0;
    const deletions = file.deletions || 0;

    /*
      For now we don't have per-file contributor information.
      So keep contributor count as 0.

      Later we will calculate:
      how many different developers modified each file.
    */
    const contributorCount = 0;

    // Code churn = additions + deletions
    const churn = additions + deletions;

    const score =
      (changes * 0.6) +
      (churn * 0.1) +
      (contributorCount * 0.4);

    let risk = "LOW";

    if (score > 50) {
      risk = "HIGH";
    } else if (score > 20) {
      risk = "MEDIUM";
    }

    hotspots.push({
      file: fileName,
      changes,
      additions,
      deletions,
      churn,
      contributors: contributorCount,
      score: Math.round(score),
      risk,
    });
  });

  return hotspots
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

module.exports = {
  calculateHotspots,
};