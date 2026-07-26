const simpleGit = require("simple-git");

async function getCodeChurn(repoPath) {
  const git = simpleGit(repoPath);

  const log = await git.log();

  const evolution = [];

  for (const commit of log.all) {
    const result = await git.show([
      commit.hash,
      "--numstat",
      "--format=",
    ]);

    let additions = 0;
    let deletions = 0;
    let filesChanged = 0;

    const lines = result.split("\n");

    for (const line of lines) {
      if (!line.trim()) continue;

      const parts = line.split("\t");

      if (parts.length !== 3) continue;

      const added = parseInt(parts[0]);
      const deleted = parseInt(parts[1]);

      // Ignore binary files
      if (isNaN(added) || isNaN(deleted)) continue;

      additions += added;
      deletions += deleted;
      filesChanged++;
    }

    evolution.push({
      hash: commit.hash,
      date: commit.date,
      message: commit.message,
      author: commit.author_name,

      additions,
      deletions,
      filesChanged,

      churn: additions + deletions,
    });
  }

  return evolution;
}

module.exports = {
  getCodeChurn,
};