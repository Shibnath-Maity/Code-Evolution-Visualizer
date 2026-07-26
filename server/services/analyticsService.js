
function getCommitType(message = "") {
  const msg = message.toLowerCase().trim();

  if (msg.startsWith("feat")) return "feat";
  if (msg.startsWith("fix")) return "fix";
  if (msg.startsWith("docs")) return "docs";
  if (msg.startsWith("refactor")) return "refactor";

  return "other";
}

function createTimeline(commits = []) {
  return commits.map((commit) => ({
    hash: commit.hash,
    message: commit.message,
    author: commit.author_name,
    date: commit.date,
    type: getCommitType(commit.message),
  }));
}

module.exports = {
  createTimeline,
};