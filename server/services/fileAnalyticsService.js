const fs = require("fs");
const path = require("path");
const simpleGit = require("simple-git");

/* ==========================================================
   DIRECTORIES TO IGNORE
========================================================== */

const IGNORED_DIRECTORIES = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  "coverage",
  ".idea",
  ".vscode",
  "__pycache__",
  "vendor",
  "bin",
  "obj",
]);

/* ==========================================================
   FILES TO IGNORE
========================================================== */

const IGNORED_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
]);

/* ==========================================================
   SUPPORTED SOURCE FILES
========================================================== */

const CODE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".java",
  ".py",
  ".c",
  ".cpp",
  ".cs",
  ".go",
  ".php",
  ".rb",
  ".swift",
  ".kt",
  ".html",
  ".css",
  ".scss",
  ".json",
  ".md",
  ".xml",
  ".yml",
  ".yaml",
]);

/* ==========================================================
   HELPERS & PATH NORMALIZATION
========================================================== */

function isIgnoredDirectory(name) {
  return IGNORED_DIRECTORIES.has(name);
}

function isIgnoredFile(name) {
  return IGNORED_FILES.has(name);
}

function isCodeFile(filePath) {
  return CODE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

/**
 * Normalizes Windows backslashes (\) to standard POSIX slashes (/),
 * strips quotes, and removes leading './' references.
 */
function normalizeGitPath(filePath) {
  if (!filePath) return "";

  return filePath
    .replace(/^"|"$/g, "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "");
}

/* ==========================================================
   BINARY FILE DETECTION
========================================================== */

function isBinary(buffer) {
  const length = Math.min(buffer.length, 1024);

  for (let i = 0; i < length; i++) {
    if (buffer[i] === 0) {
      return true;
    }
  }

  return false;
}

/* ==========================================================
   READ FILE CONTENT
========================================================== */

function readSourceFile(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);

    if (isBinary(buffer)) {
      return null;
    }

    const content = buffer.toString("utf8");

    return {
      content,
      size: buffer.length,
      lines: content.split(/\r?\n/).length,
    };
  } catch {
    return null;
  }
}

/* ==========================================================
   REPOSITORY SCANNER
========================================================== */

function scanRepository(rootPath) {
  const files = [];

  function walk(currentDirectory) {
    let entries = [];
    try {
      entries = fs.readdirSync(currentDirectory, { withFileTypes: true });
    } catch (err) {
      console.warn(`⚠️ Warning: Could not read directory: ${currentDirectory}`);
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDirectory, entry.name);

      if (entry.isDirectory()) {
        if (isIgnoredDirectory(entry.name)) {
          continue;
        }

        walk(fullPath);
        continue;
      }

      if (isIgnoredFile(entry.name)) {
        continue;
      }

      if (!isCodeFile(fullPath)) {
        continue;
      }

      const source = readSourceFile(fullPath);

      if (!source) {
        continue;
      }

      // Format relative path using POSIX slashes for Windows/Linux compatibility
      const relativePath = path.relative(rootPath, fullPath);
      const normalizedPath = normalizeGitPath(relativePath);

      files.push({
        path: normalizedPath,
        name: entry.name,
        extension: path.extname(entry.name),
        size: source.size,
        lines: source.lines,
        content: source.content,
        isCodeFile: true,
      });
    }
  }

  walk(rootPath);

  return files;
}

/* ==========================================================
   GIT HISTORY ANALYZER
========================================================== */

async function getGitHistory(repoPath) {
  const git = simpleGit(repoPath);

  console.log("📜 Reading complete git file history...");

  const fileMap = {};

  try {
    // --all ensures commits across all branches are evaluated
    // --numstat provides addition and deletion line metrics per file
    const raw = await git.raw([
      "log",
      "--all",
      "--numstat",
      "--format=COMMIT:%H|%an",
    ]);

    const commits = raw.split(/^COMMIT:/m);

    for (const commit of commits) {
      if (!commit.trim()) continue;

      const lines = commit.split(/\r?\n/);
      const header = lines[0];
      const author = header.includes("|") ? header.split("|")[1].trim() : null;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split("\t");

        // Numstat layout: <additions> <deletions> <filename>
        if (parts.length !== 3) continue;

        let additions = parts[0];
        let deletions = parts[1];
        let filePath = normalizeGitPath(parts[2]);

        if (!filePath || isIgnoredFile(path.basename(filePath))) {
          continue;
        }

        // Handle binary or uncounted file markers ('-')
        additions = additions === "-" ? 0 : Number.parseInt(additions, 10) || 0;
        deletions = deletions === "-" ? 0 : Number.parseInt(deletions, 10) || 0;

        if (!fileMap[filePath]) {
          fileMap[filePath] = {
            changes: 0,
            additions: 0,
            deletions: 0,
            contributors: new Set(),
          };
        }

        fileMap[filePath].changes += 1;
        fileMap[filePath].additions += additions;
        fileMap[filePath].deletions += deletions;

        if (author) {
          fileMap[filePath].contributors.add(author);
        }
      }
    }
  } catch (err) {
    console.warn("⚠️ Git history extraction failed or folder is not a valid Git repository:", err.message);
  }

  return fileMap;
}

/* ==========================================================
   MERGE GIT HISTORY + SOURCE FILES
========================================================== */

function mergeRepositoryData(scannedFiles, gitHistory) {
  return scannedFiles
    .map((file) => {
      const normalizedPath = normalizeGitPath(file.path);

      const git = gitHistory[normalizedPath] || {
        changes: 0,
        additions: 0,
        deletions: 0,
        contributors: new Set(),
      };

      const additions = Number(git.additions) || 0;
      const deletions = Number(git.deletions) || 0;
      const changes = Number(git.changes) || 0;
      const metrics = calculateFileMetrics(file);

      return {
        ...file,
        path: normalizedPath,
        changes,
        additions,
        deletions,
        churn: additions + deletions,
        contributorCount: git.contributors ? git.contributors.size : 0,
        lastModified: null,
        metrics,
      };
    })
    .sort((a, b) => {
      // Primary sort: Change frequency
      if (b.changes !== a.changes) {
        return b.changes - a.changes;
      }
      // Secondary sort: Code churn (additions + deletions)
      return b.churn - a.churn;
    });
}

/* ==========================================================
   FILE METRICS
========================================================== */

function calculateFileMetrics(file) {
  const content = file.content || "";

  return {
    imports: countImports(content),
    exports: countExports(content),
    functions: countFunctions(content),
    classes: countClasses(content),
    interfaces: countInterfaces(content),
    comments: countComments(content),
    todos: countTODOs(content),
    consoleLogs: countConsoleLogs(content),
    conditions: countConditions(content),
    loops: countLoops(content),
    switches: countSwitch(content),
    tryCatch: countTryCatch(content),
    asyncFunctions: countAsync(content),
  };
}

/* ==========================================================
   COUNT HELPERS
========================================================== */

function matchCount(regex, text) {
  return (text.match(regex) || []).length;
}

function countImports(content) {
  return matchCount(/^\s*import\s+/gm, content);
}

function countExports(content) {
  return matchCount(/^\s*export\s+/gm, content);
}

function countFunctions(content) {
  return matchCount(/\bfunction\b|=>/g, content);
}

function countClasses(content) {
  return matchCount(/\bclass\s+/g, content);
}

function countInterfaces(content) {
  return matchCount(/\binterface\s+/g, content);
}

function countComments(content) {
  return (
    matchCount(/\/\/.*/g, content) +
    matchCount(/\/\*[\s\S]*?\*\//g, content)
  );
}

function countTODOs(content) {
  return matchCount(/TODO|FIXME/gi, content);
}

function countConsoleLogs(content) {
  return matchCount(/console\.(log|warn|error|info)/g, content);
}

function countConditions(content) {
  return matchCount(/\bif\s*\(/g, content);
}

function countLoops(content) {
  return (
    matchCount(/\bfor\s*\(/g, content) +
    matchCount(/\bwhile\s*\(/g, content)
  );
}

function countSwitch(content) {
  return matchCount(/\bswitch\s*\(/g, content);
}

function countTryCatch(content) {
  return (
    matchCount(/\btry\s*\{/g, content) +
    matchCount(/\bcatch\s*\(/g, content)
  );
}

function countAsync(content) {
  return matchCount(/\basync\b/g, content);
}

/* ==========================================================
   REPOSITORY SUMMARY
========================================================== */

function buildRepositorySummary(files) {
  const summary = {
    totalFiles: files.length,
    totalLines: 0,
    totalSize: 0,
    totalChanges: 0,
    totalAdditions: 0,
    totalDeletions: 0,
    extensions: {},
    largestFiles: [],
    mostChangedFiles: [],
  };

  for (const file of files) {
    summary.totalLines += file.lines;
    summary.totalSize += file.size;
    summary.totalChanges += file.changes;
    summary.totalAdditions += file.additions;
    summary.totalDeletions += file.deletions;

    summary.extensions[file.extension] =
      (summary.extensions[file.extension] || 0) + 1;
  }

  summary.largestFiles = [...files]
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 10);

  summary.mostChangedFiles = [...files]
    .sort((a, b) => b.changes - a.changes)
    .slice(0, 10);

  return summary;
}

/* ==========================================================
   MAIN FILE ANALYZER
========================================================== */

async function getFileChanges(repoPath) {
  try {
    console.log("📂 Starting repository file analysis...");

    const [scannedFiles, gitHistory] = await Promise.all([
      Promise.resolve(scanRepository(repoPath)),
      getGitHistory(repoPath),
    ]);

    console.log(`📄 Source files scanned: ${scannedFiles.length}`);

    const allFiles = mergeRepositoryData(scannedFiles, gitHistory);
    const summary = buildRepositorySummary(allFiles);

    console.log("✅ File analysis completed successfully");

    return {
      totalFiles: summary.totalFiles,
      totalLines: summary.totalLines,
      totalSize: summary.totalSize,
      totalChanges: summary.totalChanges,
      totalAdditions: summary.totalAdditions,
      totalDeletions: summary.totalDeletions,
      languages: summary.extensions,
      largestFiles: summary.largestFiles,
      mostChangedFiles: summary.mostChangedFiles,
      allFiles,
    };
  } catch (error) {
    console.error("❌ File analysis failed:", error);
    throw error;
  }
}

/* ==========================================================
   SEARCH
========================================================== */

function findFile(fileAnalysis, filename) {
  const normalizedSearch = normalizeGitPath(filename);
  return (
    fileAnalysis.allFiles.find(
      (file) =>
        file.path === normalizedSearch || file.name === filename
    ) || null
  );
}

function searchFiles(fileAnalysis, query) {
  const normalizedQuery = query.toLowerCase();

  return fileAnalysis.allFiles.filter((file) =>
    file.path.toLowerCase().includes(normalizedQuery)
  );
}

/* ==========================================================
   STATISTICS
========================================================== */

function getRepositoryStatistics(fileAnalysis) {
  const files = fileAnalysis.allFiles;

  return {
    totalFiles: files.length,
    codeFiles: files.filter((f) => f.isCodeFile).length,
    totalLines: fileAnalysis.totalLines,
    averageLines: files.length
      ? Math.round(fileAnalysis.totalLines / files.length)
      : 0,
    averageFileSize: files.length
      ? Math.round(fileAnalysis.totalSize / files.length)
      : 0,
    extensions: fileAnalysis.languages,
  };
}

/* ==========================================================
   EXPORTS
========================================================== */

module.exports = {
  getFileChanges,
  findFile,
  searchFiles,
  getRepositoryStatistics,
};