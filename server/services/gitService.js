const simpleGit = require("simple-git");
const path = require("path");
const fs = require("fs");

// Fixed regex: Escaped literal dot before 'git'
const GITHUB_URL_PATTERN =
  /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(\.git)?\/?$/;

const SHA_PATTERN = /^[0-9a-f]{4,40}$/i;
const ID_PATTERN = /^[\w-]+$/;

const COMMIT_SEP = "###COMMIT###";
const FIELD_SEP = "|||";

// ==========================================
// Validation Helpers
// ==========================================

function assertValidHash(hash) {
  if (typeof hash !== "string" || !SHA_PATTERN.test(hash)) {
    throw new Error("Invalid commit hash.");
  }
}

function assertValidId(id, fieldName) {
  if (!id || !ID_PATTERN.test(String(id))) {
    throw new Error(
      `Invalid ${fieldName}. Only alphanumeric characters, hyphens, and underscores are allowed.`
    );
  }
}

// ==========================================
// Git Commit SHA Helper
// ==========================================

async function getCurrentCommitSha(repoPath) {
  const git = simpleGit(repoPath);
  const result = await git.revparse(["HEAD"]);
  return result.trim();
}

// ==========================================
// Clone / Sync Repository Strategy
// ==========================================

async function cloneRepository(repoUrl, userId, repositoryId) {
  if (!repoUrl) {
    throw new Error("Repository URL is required.");
  }

  assertValidId(userId, "User ID");
  assertValidId(repositoryId, "Repository ID");

  repoUrl = repoUrl.trim();
  const match = repoUrl.match(GITHUB_URL_PATTERN);

  if (!match) {
    throw new Error("Please enter a valid GitHub repository URL.");
  }

  // Isolated directory per user & repository
  const userFolder = path.join(__dirname, "../repositories", String(userId));
  const repoPath = path.join(userFolder, String(repositoryId));

  fs.mkdirSync(userFolder, { recursive: true });

  // Check if repository already exists and is valid
  if (fs.existsSync(repoPath)) {
    const git = simpleGit(repoPath);

    try {
      const isRepo = await git.checkIsRepo();

      if (isRepo) {
        console.log("📁 Repository exists. Fetching updates...");
        await git.fetch(["origin", "--prune"]);

        let branch;
        try {
          const remoteHead = await git.raw([
            "symbolic-ref",
            "refs/remotes/origin/HEAD",
          ]);
          branch = remoteHead.trim().replace("refs/remotes/origin/", "");
        } catch {
          // Fallback: If origin/HEAD target isn't resolved locally, detect default branch automatically
          await git.remote(["set-head", "origin", "--auto"]);
          const remoteHead = await git.raw([
            "symbolic-ref",
            "refs/remotes/origin/HEAD",
          ]);
          branch = remoteHead.trim().replace("refs/remotes/origin/", "");
        }

        await git.reset(["--hard", `origin/${branch}`]);
        await git.clean("f", ["-d"]);
        console.log("✅ Existing repository updated successfully.");

        const commitSha = await getCurrentCommitSha(repoPath);
        return { repoPath, commitSha };
      } else {
        console.warn("⚠️ Path exists but is not a valid Git repository. Re-cloning...");
        fs.rmSync(repoPath, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn(
        "⚠️ Could not update existing repository. Falling back to fresh clone:",
        error.message
      );
      if (fs.existsSync(repoPath)) {
        fs.rmSync(repoPath, { recursive: true, force: true });
      }
    }
  }

  // Fresh Clone
  try {
    console.log("📥 Cloning repository...");
    const git = simpleGit();
    await git.clone(repoUrl, repoPath);
    console.log("✅ Repository cloned successfully.");

    const commitSha = await getCurrentCommitSha(repoPath);
    return { repoPath, commitSha };
  } catch (error) {
    console.error("❌ Git clone failed:", error.message);

    // Clean up partial clone directory on failure
    if (fs.existsSync(repoPath)) {
      fs.rmSync(repoPath, { recursive: true, force: true });
    }

    throw new Error(
      "Unable to clone repository. Please check the GitHub URL and access permissions."
    );
  }
}

// ==========================================
// Get All Commits
// ==========================================

async function getCommits(repoPath) {
  const git = simpleGit(repoPath);

  const raw = await git.raw([
    "log",
    `--pretty=format:${COMMIT_SEP}%H${FIELD_SEP}%an${FIELD_SEP}%ae${FIELD_SEP}%ad${FIELD_SEP}%s`,
    "--date=iso-strict",
    "--numstat",
  ]);

  const commits = [];
  const blocks = raw.split(COMMIT_SEP).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split("\n");
    const header = lines[0];

    const [hash, author_name, author_email, date, ...msgParts] =
      header.split(FIELD_SEP);
    const message = msgParts.join(FIELD_SEP);

    let additions = 0;
    let deletions = 0;
    let filesChanged = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const [addedStr, removedStr, file] = line.split("\t");
      if (file === undefined) continue;

      filesChanged++;
      additions += addedStr === "-" ? 0 : parseInt(addedStr, 10) || 0;
      deletions += removedStr === "-" ? 0 : parseInt(removedStr, 10) || 0;
    }

    commits.push({
      hash,
      author_name,
      author_email,
      date,
      message,
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
// IMPORTANT: Contributors are grouped by normalized author EMAIL (not the raw
// display name). Git allows the same person to commit under different name
// casing/spelling (e.g. "Anik Chand" vs "ANIK CHAND") while using the same
// email address. Grouping by exact name string previously caused these to be
// treated as two separate contributors, splitting one person's commit history
// across two buckets. Email is the stable, unique identifier for a person;
// name casing/spelling is not. If email is somehow missing, we fall back to a
// normalized (trimmed, lowercased) name so we still avoid casing-based splits.
// ==========================================

async function getContributors(repoPath) {
  const git = simpleGit(repoPath);

  const raw = await git.raw([
    "log",
    `--pretty=format:${COMMIT_SEP}%H${FIELD_SEP}%an${FIELD_SEP}%ae${FIELD_SEP}%ad`,
    "--date=iso-strict",
    "--numstat",
  ]);

  const contributors = {};
  const blocks = raw.split(COMMIT_SEP).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split("\n");
    const header = lines[0];
    const [hash, author, authorEmail, date] = header.split(FIELD_SEP);

    // Normalized identity key: prefer email (unique per person), fall back
    // to normalized name only if email is missing for some reason.
    const key = authorEmail
      ? authorEmail.trim().toLowerCase()
      : String(author || "").trim().toLowerCase();

    if (!contributors[key]) {
      contributors[key] = {
        name: author,
        email: authorEmail || null,
        commits: 0,
        linesAdded: 0,
        linesRemoved: 0,
        filesChanged: new Set(),
        lastContribution: date,
      };
    }

    const contributor = contributors[key];
    contributor.commits += 1;

    if (new Date(date) > new Date(contributor.lastContribution)) {
      contributor.lastContribution = date;
      // Keep the most recently used name/casing as the display name.
      contributor.name = author;
    }

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
// Commit Statistics & Details
// ==========================================

function getCommitStats(commits) {
  return {
    totalCommits: commits.length,
    firstCommit: commits.length ? commits[commits.length - 1].date : null,
    latestCommit: commits.length ? commits[0].date : null,
  };
}

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
  return await git.show([hash, "--patch", "--stat"]);
}

async function getAICommitData(repoPath, hash) {
  assertValidHash(hash);
  const git = simpleGit(repoPath);

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
    } else if (line.startsWith("CommitDate:")) {
      data.date = line.replace("CommitDate:", "").trim();
    } else if (!messageFound && line.startsWith("    ")) {
      data.message = line.trim();
      messageFound = true;
    } else if (
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
// Timeline & File Coupling
// ==========================================

function getCommitType(message = "") {
  const msg = message.toLowerCase().trim();
  if (msg.startsWith("feat")) return "feat";
  if (msg.startsWith("fix")) return "fix";
  if (msg.startsWith("docs")) return "docs";
  if (msg.startsWith("refactor")) return "refactor";
  return "other";
}

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

async function getFileHistory(repoPath, filePath) {
  const git = simpleGit(repoPath);

  const raw = await git.raw([
    "log",
    `--pretty=format:${COMMIT_SEP}%H${FIELD_SEP}%an${FIELD_SEP}%ad${FIELD_SEP}%s`,
    "--date=iso-strict",
    "--numstat",
  ]);

  const blocks = raw.split(COMMIT_SEP).filter(Boolean);
  const fileCommits = [];
  const coupledCounts = {};

  for (const block of blocks) {
    const lines = block.split("\n");
    const header = lines[0];
    const [hash, author, date, ...msgParts] = header.split(FIELD_SEP);
    const message = msgParts.join(FIELD_SEP);

    let matchedStats = null;
    const filesInCommit = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const [addedStr, removedStr, file] = line.split("\t");
      if (file === undefined) continue;

      filesInCommit.push(file);

      if (file === filePath) {
        matchedStats = {
          added: addedStr === "-" ? 0 : parseInt(addedStr, 10) || 0,
          removed: removedStr === "-" ? 0 : parseInt(removedStr, 10) || 0,
        };
      }
    }

    if (!matchedStats) continue;

    fileCommits.push({
      hash,
      author_name: author,
      date,
      message,
      additions: matchedStats.added,
      deletions: matchedStats.removed,
    });

    filesInCommit.forEach((f) => {
      if (f === filePath) return;
      coupledCounts[f] = (coupledCounts[f] || 0) + 1;
    });
  }

  const coupledFiles = Object.entries(coupledCounts)
    .map(([file, count]) => ({ file, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return { commits: fileCommits, coupledFiles };
}

module.exports = {
  cloneRepository,
  getCurrentCommitSha,
  getCommits,
  getContributors,
  getCommitStats,
  getCommitDetails,
  getCommitDiff,
  getTimeline,
  getCommitType,
  getAICommitData,
  getFileHistory,
};