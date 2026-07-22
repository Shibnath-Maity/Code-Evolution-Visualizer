const simpleGit = require("simple-git");

async function getFileChanges(repoPath) {
  const git = simpleGit(repoPath);

  const logs = await git.log({
    "--stat": null,
  });

  const files = {};

  logs.all.forEach((commit) => {
    if (commit.diff && commit.diff.files) {
      commit.diff.files.forEach((file) => {
        const fileName = file.file;

        if (files[fileName]) {
          files[fileName]++;
        } else {
          files[fileName] = 1;
        }
      });
    }
  });

  return Object.entries(files)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map((item) => ({
      file: item[0],
      changes: item[1],
    }));
}

module.exports = {
  getFileChanges,
};