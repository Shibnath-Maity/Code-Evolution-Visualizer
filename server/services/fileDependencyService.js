const fs = require("fs");
const path = require("path");

/* ==========================================================
   BUILD FILE RELATIONSHIPS
========================================================== */

function buildFileRelations(repoPath, targetFile) {
  const relations = {
    importedBy: [],
    imports: [],
  };

  const targetName = targetFile.replace(/\\/g, "/");

  walk(repoPath);

  return relations;

  function walk(dir) {
    const entries = fs.readdirSync(dir, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (
          [
            ".git",
            "node_modules",
            "dist",
            "build",
          ].includes(entry.name)
        ) {
          continue;
        }

        walk(full);
        continue;
      }

      const ext = path.extname(entry.name);

      if (
        ![
          ".js",
          ".jsx",
          ".ts",
          ".tsx",
        ].includes(ext)
      ) {
        continue;
      }

      const content = fs.readFileSync(full, "utf8");

      const relative = path
        .relative(repoPath, full)
        .replace(/\\/g, "/");
              if (relative === targetName) {

        const imports =
          content.match(
            /(?:import.*?from\s+['"](.*?)['"]|require\(['"](.*?)['"]\))/g
          ) || [];

        relations.imports.push(...imports);

      } else {

        if (
          content.includes(path.basename(targetName))
        ) {
          relations.importedBy.push(relative);
        }

      }
    }
  }
}

module.exports = {
  buildFileRelations,
};