const simpleGit = require("simple-git");

async function getFileChanges(repoPath) {
  const git = simpleGit(repoPath);

  // Get all commits
  const log = await git.log();

  const fileMap = {};

  for (const commit of log.all) {
    // Get files changed in this commit
    const summary = await git.show([
      commit.hash,
      "--numstat",
      "--format=",
    ]);

    const lines = summary.split("\n");

    for (const line of lines) {
      if (!line.trim()) continue;

      const parts = line.split("\t");

      if (parts.length !== 3) continue;

      const additions = parseInt(parts[0]) || 0;
      const deletions = parseInt(parts[1]) || 0;
      const file = parts[2];

      if (!fileMap[file]) {
        fileMap[file] = {
          file,
          changes: 0,
          additions: 0,
          deletions: 0,
        };
      }

      fileMap[file].changes++;
      fileMap[file].additions += additions;
      fileMap[file].deletions += deletions;
    }
  }

  const files = Object.values(fileMap);

  files.sort((a, b) => b.changes - a.changes);

  return {
    totalFiles: files.length,
    mostChangedFiles: files.slice(0, 10),
    allFiles: files,
  };
}

module.exports = {
  getFileChanges,
};