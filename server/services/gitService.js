const simpleGit = require("simple-git");
const path = require("path");
const fs = require("fs");

const GITHUB_URL_PATTERN =
  /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(\.git)?\/?$/;

const SHA_PATTERN = /^[0-9a-f]{4,40}$/i;

// Unique-ish delimiters unlikely to appear in commit messages/author
// names, used to split `git log` output into per-commit blocks.

const COMMIT_SEP = "###COMMIT###";
const FIELD_SEP = "|||";
function assertValidHash(hash) {
  if (typeof hash !== "string" || !SHA_PATTERN.test(hash)) {
    throw new Error("Invalid commit hash.");
  }
}

// ==========================================
// Clone Repository
// ==========================================

async function cloneRepository(repoUrl) {
  if (!repoUrl) {
    throw new Error("Repository URL is required.");
  }

  repoUrl = repoUrl.trim();

  const match = repoUrl.match(GITHUB_URL_PATTERN);
  if (!match) {
    throw new Error("Please enter a valid GitHub repository URL.");
  }

  const [, owner, repoName] = match;

  // Key the clone directory on owner + repo, not just repo name — two
  // different repos can share a name (e.g. "userA/app" vs "userB/app"),
  // and using repoName alone would make the second analysis silently
  // reuse the first repo's clone.
  const folderName = `${owner}__${repoName}`;
  const repoPath = path.join(__dirname, "../repositories", folderName);

  if (fs.existsSync(repoPath)) {
    console.log("📁 Repository already exists. Checking Git...");

    try {
      const existingGit = simpleGit(repoPath);
      await existingGit.status();

      console.log("🔄 Refreshing existing repository...");
      // Without this, a repo cloned once would keep returning the same
      // stale commit history on every future analysis.
      await existingGit.fetch(["--all", "--prune"]);
      await existingGit.pull();

      console.log("✅ Existing repository is valid and up to date.");
      return repoPath;
    } catch (error) {
      console.log("⚠️ Existing repository is corrupted or unreachable.");
      console.log("🗑️ Removing repository for a fresh clone...");

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
    console.error("❌ Git clone failed:", error.message);

    throw new Error(
      "Unable to clone repository. Please check the GitHub URL and repository access."
    );
  }

  return repoPath;
}

// ==========================================
// Get All Commits
// ==========================================

async function getCommits(repoPath) {
  const git = simpleGit(repoPath);

  const log = await git.log();

  const commits = [];

  for (const commit of log.all) {
    const diff = await git.raw([
      "show",
      "--stat",
      "--format=",
      commit.hash,
    ]);

    let additions = 0;
    let deletions = 0;
    let filesChanged = 0;

    const lines = diff.split("\n");

    for (const line of lines) {
      const plus = (line.match(/\+/g) || []).length;
      const minus = (line.match(/-/g) || []).length;

      additions += plus;
      deletions += minus;

      if (line.includes("|")) {
        filesChanged++;
      }
    }

    commits.push({
      ...commit,
      additions,
      deletions,
      files_changed: filesChanged,
    });
  }

  return commits;
}

// ==========================================
// Get Contributors
// ==========================================
//
// Single `git log --numstat` call instead of one `git show` per commit.
// This is the difference between 1 subprocess and N+1 subprocesses for
// a repo with N commits, and gives exact added/removed line counts
// (via numstat) instead of estimating them from `--stat`'s truncated
// +/- symbol columns.

async function getContributors(repoPath) {
  const git = simpleGit(repoPath);

  const raw = await git.raw([
    "log",
    `--pretty=format:${COMMIT_SEP}%H${FIELD_SEP}%an${FIELD_SEP}%ad`,
    "--date=iso-strict",
    "--numstat",
  ]);

  const contributors = {};

  const blocks = raw.split(COMMIT_SEP).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split("\n");
    const header = lines[0];
    const [hash, author, date] = header.split(FIELD_SEP);

    if (!contributors[author]) {
      contributors[author] = {
        name: author,
        commits: 0,
        linesAdded: 0,
        linesRemoved: 0,
        filesChanged: new Set(),
        lastContribution: date,
      };
    }

    const contributor = contributors[author];
    contributor.commits += 1;

    if (new Date(date) > new Date(contributor.lastContribution)) {
      contributor.lastContribution = date;
    }

    // Remaining lines are numstat rows: "<added>\t<removed>\t<path>".
    // Binary files report "-" instead of a number for added/removed.
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const [addedStr, removedStr, file] = line.split("\t");
      if (file === undefined) continue;

      const added = addedStr === "-" ? 0 : parseInt(addedStr, 10) || 0;
      const removed = removedStr === "-" ? 0 : parseInt(removedStr, 10) || 0;

      contributor.linesAdded += added;
      contributor.linesRemoved += removed;
      contributor.filesChanged.add(file);
    }
  }

  Object.values(contributors).forEach((contributor) => {
    contributor.filesChanged = contributor.filesChanged.size;
  });

  return contributors;
}

// ==========================================
// Commit Statistics
// ==========================================

// async function getCommitStats(repoPath) {
//   const git = simpleGit(repoPath);
//   const log = await git.log();

//   return {
//     totalCommits: log.total,
//     firstCommit: log.all.length > 0 ? log.all[log.all.length - 1].date : null,
//     latestCommit: log.all.length > 0 ? log.all[0].date : null,
//   };
// }

function getCommitStats(commits) {
    return {
        totalCommits: commits.length,
        firstCommit: commits.length ? commits[commits.length - 1].date : null,
        latestCommit: commits.length ? commits[0].date : null,
    };
}
// ==========================================
// Commit Details
// ==========================================

async function getCommitDetails(repoPath, hash) {
  assertValidHash(hash);

  const git = simpleGit(repoPath);

  const result = await git.show([hash, "--stat", "--format=fuller"]);
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
    } else if (!messageFound && line.startsWith("    ")) {
      details.message = line.trim();
      messageFound = true;
    } else if (line.includes("|") && !line.includes("file changed")) {
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
  assertValidHash(hash);

  const git = simpleGit(repoPath);
  const diff = await git.show([hash, "--patch", "--stat"]);

  return diff;
}

// ==========================================
// AI Commit Data
// ==========================================

async function getAICommitData(repoPath, hash) {
  assertValidHash(hash);

  const git = simpleGit(repoPath);

  // Complete commit information
  const raw = await git.show([
    hash,
    "--stat",
    "--patch",
    "--format=fuller",
  ]);

  const lines = raw.split("\n");

  const data = {
    hash,
    author: "",
    date: "",
    message: "",
    files: [],
    diff: raw,
  };

  let messageFound = false;

  for (const line of lines) {
    if (line.startsWith("Author:")) {
      data.author = line.replace("Author:", "").trim();
    }

    else if (line.startsWith("CommitDate:")) {
      data.date = line.replace("CommitDate:", "").trim();
    }

    else if (!messageFound && line.startsWith("    ")) {
      data.message = line.trim();
      messageFound = true;
    }

    else if (
      line.includes("|") &&
      !line.includes("file changed") &&
      !line.includes("files changed")
    ) {
      const file = line.split("|")[0].trim();

      if (file.length) {
        data.files.push(file);
      }
    }
  }

  return data;
}
// ==========================================
// Timeline
// ==========================================

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
  getTimeline,
  getCommitType,
  getAICommitData,
};