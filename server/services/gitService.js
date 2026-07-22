const simpleGit = require("simple-git");
const path = require("path");
const fs = require("fs");

async function cloneRepository(repoUrl) {
  if (!repoUrl) {
    throw new Error("Repository URL is required.");
  }

  repoUrl = repoUrl.trim();

  if (!repoUrl.startsWith("https://github.com/")) {
    throw new Error("Please enter a valid GitHub repository URL.");
  }

  const git = simpleGit();

  const repoName = repoUrl
    .split("/")
    .pop()
    .replace(".git", "");

  const repoPath = path.join(
    __dirname,
    "../repositories",
    repoName
  );

  if (fs.existsSync(repoPath)) {
    console.log("Repository already exists. Using existing copy...");
    return repoPath;
  }

  try {
  console.log("Cloning repository...");
  await git.clone(repoUrl, repoPath);
} catch (error) {
  throw new Error("Invalid or inaccessible GitHub repository.");
}

return repoPath;
}

async function getCommits(repoPath) {
  const git = simpleGit(repoPath);

  const log = await git.log();

  return log.all;
}

async function getContributors(repoPath) {
  const git = simpleGit(repoPath);

  const log = await git.log();

  const contributors = {};

  log.all.forEach((commit) => {
    const author = commit.author_name;

    contributors[author] = (contributors[author] || 0) + 1;
  });

  return contributors;
}

async function getCommitStats(repoPath) {
  const git = simpleGit(repoPath);

  const log = await git.log();

  return {
    totalCommits: log.total,
    firstCommit:
      log.all.length > 0 ? log.all[log.all.length - 1].date : null,
    latestCommit:
      log.all.length > 0 ? log.all[0].date : null,
  };
}

module.exports = {
  cloneRepository,
  getCommits,
  getContributors,
  getCommitStats,
};