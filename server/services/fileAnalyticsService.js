const simpleGit = require("simple-git");

// Delimiter unlikely to appear in commit messages; used only to split
// `git log` output into per-commit blocks.
const COMMIT_SEP = "###COMMIT###";

async function getFileChanges(repoPath) {
  try {
    const git = simpleGit(repoPath);

    console.log("📂 Getting file changes...");

    // Single git command for the entire history
    const raw = await git.raw([
      "log",
      `--pretty=format:${COMMIT_SEP}`,
      "--numstat",
    ]);

    const fileMap = {};
    let commitsProcessed = 0;

    const blocks = raw.split(COMMIT_SEP);

    for (const block of blocks) {
      if (!block.trim()) continue;

      commitsProcessed++;

      const lines = block.split("\n");

      for (const line of lines) {
        if (!line.trim()) continue;

        const parts = line.split("\t");
        if (parts.length !== 3) continue;

        const additions = parts[0] === "-" ? 0 : parseInt(parts[0], 10) || 0;
        const deletions = parts[1] === "-" ? 0 : parseInt(parts[1], 10) || 0;
        const file = parts[2];

        if (!fileMap[file]) {
          fileMap[file] = {
            file,
            changes: 0,
            additions: 0,
            deletions: 0,
          };
        }

        fileMap[file].changes++;
        fileMap[file].additions += additions;
        fileMap[file].deletions += deletions;
      }
    }

    console.log(`📊 Processed ${commitsProcessed} commits`);

    const files = Object.values(fileMap);
    files.sort((a, b) => b.changes - a.changes);

    console.log("✅ File analysis completed");

    return {
      totalFiles: files.length,
      mostChangedFiles: files.slice(0, 10),
      allFiles: files,
    };
  } catch (error) {
    console.error("❌ File analysis failed:", error.message);
    throw error;
  }
}

module.exports = {
  getFileChanges,
};