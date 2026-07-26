const simpleGit = require("simple-git");
const path = require("path");
const fs = require("fs");

// Clone Repository
async function cloneRepository(repoUrl) {
  if (!repoUrl) {
    throw new Error("Repository URL is required.");
  }

  repoUrl = repoUrl.trim();

  if (!repoUrl.startsWith("https://github.com/")) {
    throw new Error("Please enter a valid GitHub repository URL.");
  }

  const repoName = repoUrl
    .split("/")
    .pop()
    .replace(".git", "");

  const repoPath = path.join(
    __dirname,
    "../repositories",
    repoName
  );

  // If repository already exists, verify that it is a valid Git repo
  if (fs.existsSync(repoPath)) {
    console.log("📁 Repository already exists. Checking Git...");

    try {
      const existingGit = simpleGit(repoPath);

      await existingGit.status();

      console.log("✅ Existing repository is valid.");

      return repoPath;

    } catch (error) {
      console.log("⚠️ Existing repository is corrupted.");
      console.log("🗑️ Removing corrupted repository...");

      fs.rmSync(repoPath, {
        recursive: true,
        force: true,
      });
    }
  }

  try {
    console.log("📥 Cloning repository...");

    const git = simpleGit();

    await git.clone(repoUrl, repoPath);

    console.log("✅ Repository cloned successfully.");

  } catch (error) {
    console.error("❌ Git clone failed:");
    console.error(error);

    throw new Error(
      "Unable to clone repository. Please check the GitHub URL and repository access."
    );
  }

  return repoPath;
}
// Get All Commits
async function getCommits(repoPath) {
  const git = simpleGit(repoPath);

  const log = await git.log();

  return log.all;
}

// Get Contributors
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

// Commit Statistics
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

// Commit Details (Day 11)
async function getCommitDetails(repoPath, hash) {
  console.log("Inside getCommitDetails");

  const git = simpleGit(repoPath);

  console.log("Running git show...");

 const result = await git.show([
  hash,
  "--stat",
  "--format=fuller",
]);

const lines = result.split("\n");

const details = {
  hash: "",
  author: "",
  date: "",
  message: "",
  files: [],
  summary: "",
};

let messageFound = false;

for (const line of lines) {
  if (line.startsWith("commit ")) {
    details.hash = line.replace("commit ", "");
  } else if (line.startsWith("Author:")) {
    details.author = line.replace("Author:", "").trim();
  } else if (line.startsWith("CommitDate:")) {
    details.date = line.replace("CommitDate:", "").trim();
  } else if (
    !messageFound &&
    line.startsWith("    ")
  ) {
    details.message = line.trim();
    messageFound = true;
  } else if (
    line.includes("|") &&
    !line.includes("file changed")
  ) {
    details.files.push(line.trim());
  } else if (
    line.includes("file changed") ||
    line.includes("files changed")
  ) {
    details.summary = line.trim();
  }
}

return details;


}
async function getCommitDiff(repoPath, hash) {
  const git = simpleGit(repoPath);

  console.log("Getting diff for:", hash);

  const diff = await git.show([
    hash,
    "--patch",
    "--stat"
  ]);

  return diff;
}
//Time line
// Get Timeline
async function getTimeline(repoPath) {
  const git = simpleGit(repoPath);

  const log = await git.log();

  return log.all.map((commit) => ({
    hash: commit.hash,
    message: commit.message,
    author: commit.author_name,
    date: commit.date,
    type: getCommitType(commit.message),
  }));
}

// Detect commit type
function getCommitType(message = "") {
  const msg = message.toLowerCase().trim();

  if (msg.startsWith("feat")) return "feat";
  if (msg.startsWith("fix")) return "fix";
  if (msg.startsWith("docs")) return "docs";
  if (msg.startsWith("refactor")) return "refactor";

  return "other";
}

module.exports = {
  cloneRepository,
  getCommits,
  getContributors,
  getCommitStats,
  getCommitDetails,
  getCommitDiff,
};