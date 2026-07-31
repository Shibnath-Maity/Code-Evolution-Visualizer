const simpleGit = require("simple-git");

// Delimiters unlikely to appear in commit subjects/author names, used
// to split `git log` output into per-commit blocks and fields.
const COMMIT_SEP = "###COMMIT###";
const FIELD_SEP = "|||";

async function getCodeChurn(repoPath) {
  const git = simpleGit(repoPath);

  // Single subprocess for the whole history instead of one `git show`
  // per commit. %s is the commit subject (first line only), matching
  // what simple-git's `log().all[].message` gives you.
  const raw = await git.raw([
    "log",
    `--pretty=format:${COMMIT_SEP}%H${FIELD_SEP}%ad${FIELD_SEP}%an${FIELD_SEP}%s`,
    "--date=iso-strict",
    "--numstat",
  ]);

  const evolution = [];

  const blocks = raw.split(COMMIT_SEP).filter((block) => block.trim());

  for (const block of blocks) {
    const lines = block.split("\n");
    const header = lines[0];
    
const [
  hash = "",
  date = "",
  author = "",
  message = ""
] = header.split(FIELD_SEP);
    let additions = 0;
    let deletions = 0;
    let filesChanged = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const parts = line.split("\t");
      if (parts.length !== 3) continue;

      const added = parseInt(parts[0], 10);
      const deleted = parseInt(parts[1], 10);

      // Ignore binary files (numstat reports "-" for them, which
      // parseInt turns into NaN).
      if (isNaN(added) || isNaN(deleted)) continue;

      additions += added;
      deletions += deleted;
      filesChanged++;
    }

    evolution.push({
      hash,
      date,
      message,
      author,

      additions,
      deletions,
      filesChanged,

      churn: additions + deletions,
    });
  }
evolution.reverse();
  return evolution;
}

module.exports = {
  getCodeChurn,
};