function getCommitStatistics(commits = []) {
  const authors = new Set();

  const stats = {
    totalCommits: commits.length,

    totalAdditions: 0,
    totalDeletions: 0,
    totalFilesChanged: 0,

    averageAdditions: 0,
    averageDeletions: 0,
    averageFilesChanged: 0,

    authors: 0,
    firstCommit: null,
    latestCommit: null,

    featureCommits: 0,
    bugFixes: 0,
    refactoring: 0,
    documentation: 0,
    mergeCommits: 0,
    revertCommits: 0,
    styleCommits: 0,
    choreCommits: 0,
    testCommits: 0,
    ciCommits: 0,
    performanceCommits: 0,
  };

  commits.forEach((commit) => {
    if (commit.author_name) {
      authors.add(commit.author_name);
    }

    stats.totalAdditions += Number(commit.additions || 0);
    stats.totalDeletions += Number(commit.deletions || 0);
    stats.totalFilesChanged += Number(commit.files_changed || 0);

    const msg = (commit.message || "").toLowerCase();

    if (msg.startsWith("feat")) stats.featureCommits++;
    else if (msg.startsWith("fix")) stats.bugFixes++;
    else if (msg.startsWith("refactor")) stats.refactoring++;
    else if (msg.startsWith("docs")) stats.documentation++;
    else if (msg.startsWith("merge")) stats.mergeCommits++;
    else if (msg.startsWith("revert")) stats.revertCommits++;
    else if (msg.startsWith("style")) stats.styleCommits++;
    else if (msg.startsWith("chore")) stats.choreCommits++;
    else if (msg.startsWith("test")) stats.testCommits++;
    else if (msg.startsWith("ci")) stats.ciCommits++;
    else if (msg.startsWith("perf")) stats.performanceCommits++;
  });

  stats.authors = authors.size;

  if (commits.length > 0) {
    stats.averageAdditions = Math.round(
      stats.totalAdditions / commits.length
    );

    stats.averageDeletions = Math.round(
      stats.totalDeletions / commits.length
    );

    stats.averageFilesChanged = Number(
      (stats.totalFilesChanged / commits.length).toFixed(1)
    );

    stats.firstCommit = commits[commits.length - 1]?.date ?? null;
    stats.latestCommit = commits[0]?.date ?? null;
  }

  console.log("COMMIT STATS:");
  console.log(stats);

  return stats;
}

module.exports = {
  getCommitStatistics,
};