// ==========================================================
// Commit Timeline Service
// ==========================================================

function getCommitType(message = "") {
  const msg = String(message)
    .toLowerCase()
    .trim();

  // Conventional commits
  if (/^feat(\(.+\))?!?:/.test(msg)) {
    return "feat";
  }

  if (/^fix(\(.+\))?!?:/.test(msg)) {
    return "fix";
  }

  if (/^docs(\(.+\))?!?:/.test(msg)) {
    return "docs";
  }

  if (/^refactor(\(.+\))?!?:/.test(msg)) {
    return "refactor";
  }

  if (/^test(\(.+\))?!?:/.test(msg)) {
    return "test";
  }

  if (/^chore(\(.+\))?!?:/.test(msg)) {
    return "chore";
  }

  if (/^style(\(.+\))?!?:/.test(msg)) {
    return "style";
  }

  if (/^perf(\(.+\))?!?:/.test(msg)) {
    return "performance";
  }

  if (/^ci(\(.+\))?!?:/.test(msg)) {
    return "ci";
  }

  if (/^revert(\(.+\))?!?:/.test(msg)) {
    return "revert";
  }

  // Common non-conventional commit messages
  if (/^(add|added|implement|implemented|create|created)\b/.test(msg)) {
    return "feat";
  }

  if (/^(bug|bugfix|bug fix|resolve|resolved|repair|fixed)\b/.test(msg)) {
    return "fix";
  }

  if (/^(update|upgrade|improve|improved|enhance)\b/.test(msg)) {
    return "other";
  }

  return "other";
}

// ==========================================================
// Create Timeline
// ==========================================================

function createTimeline(commits = []) {
  if (!Array.isArray(commits)) {
    return [];
  }

  return commits.map((commit) => ({
    hash: commit.hash || "",
    message: commit.message || "",
    author:
      commit.author_name ||
      commit.author ||
      "Unknown",
    date: commit.date || null,
    type: getCommitType(commit.message),
  }));
}

// ==========================================================
// Timeline Statistics
// ==========================================================

function getTimelineStats(timeline = []) {
  const stats = {
    total: timeline.length,
    feat: 0,
    fix: 0,
    docs: 0,
    refactor: 0,
    test: 0,
    chore: 0,
    style: 0,
    performance: 0,
    ci: 0,
    revert: 0,
    other: 0,
  };

  for (const commit of timeline) {
    if (stats[commit.type] !== undefined) {
      stats[commit.type]++;
    } else {
      stats.other++;
    }
  }

  return stats;
}

module.exports = {
  getCommitType,
  createTimeline,
  getTimelineStats,
};