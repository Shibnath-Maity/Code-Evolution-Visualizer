const simpleGit = require("simple-git");

async function getCommitCalendar(repoPath) {
  const git = simpleGit(repoPath);

  const log = await git.log();

  const calendar = {};

  for (const commit of log.all) {
    const date = commit.date.split("T")[0]; // YYYY-MM-DD

    calendar[date] = (calendar[date] || 0) + 1;
  }

  return Object.entries(calendar)
    .map(([date, commits]) => ({
      date,
      commits,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

module.exports = {
  getCommitCalendar,
};