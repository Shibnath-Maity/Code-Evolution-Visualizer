const simpleGit = require("simple-git");

async function getBranches(repoPath) {
  const git = simpleGit(repoPath);

  const result = await git.branch(["-a"]);

  const branches = result.all.map((branchName) => ({
    name: branchName,
    current: branchName === result.current,
  }));

  return {
    currentBranch: result.current,
    totalBranches: branches.length,
    branches,
  };
}

module.exports = {
  getBranches,
};