const { analyzeFileWithAI } = require("./aiFileAnalysisService");
const fs = require("fs");
const path = require("path");
const simpleGit = require("simple-git");

const COMMIT_SEPARATOR = "###COMMIT###";

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
   HELPERS
========================================================== */

function isIgnoredDirectory(name) {
  return IGNORED_DIRECTORIES.has(name);
}

function isIgnoredFile(name) {
  return IGNORED_FILES.has(name);
}

function isCodeFile(filePath) {
  return CODE_EXTENSIONS.has(
    path.extname(filePath).toLowerCase()
  );
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
    const entries = fs.readdirSync(currentDirectory, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const fullPath = path.join(
        currentDirectory,
        entry.name
      );

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

      files.push({
        path: path.relative(rootPath, fullPath),

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
   GIT HISTORY
========================================================== */

async function getGitHistory(repoPath) {
  const git = simpleGit(repoPath);

  console.log("📜 Reading git history...");

  const raw = await git.raw([
    "log",
    `--pretty=format:${COMMIT_SEPARATOR}`,
    "--numstat",
  ]);

  const fileMap = {};

  const commits = raw.split(COMMIT_SEPARATOR);

  for (const commit of commits) {
    if (!commit.trim()) continue;

    const lines = commit.split("\n");

    for (const line of lines) {
      if (!line.trim()) continue;

      const parts = line.split("\t");

      if (parts.length !== 3) {
        continue;
      }

      const additions =
        parts[0] === "-"
          ? 0
          : parseInt(parts[0], 10) || 0;

      const deletions =
        parts[1] === "-"
          ? 0
          : parseInt(parts[1], 10) || 0;

      const file = parts[2];

      if (!fileMap[file]) {
        fileMap[file] = {
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

  return fileMap;
}
/* ==========================================================
   MERGE GIT HISTORY + SOURCE FILES
========================================================== */

function mergeRepositoryData(scannedFiles, gitHistory) {
  return scannedFiles
    .map((file) => {
      const git =
        gitHistory[file.path] || {
          changes: 0,
          additions: 0,
          deletions: 0,
        };

      const metrics = calculateFileMetrics(file);

      return {
        ...file,

        changes: git.changes,

        additions: git.additions,

        deletions: git.deletions,

        churn:
          git.additions + git.deletions,

        lastModified: null,

        metrics,
      };
    })
    .sort((a, b) => b.changes - a.changes);
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
  return matchCount(
    /^\s*import\s+/gm,
    content
  );
}

function countExports(content) {
  return matchCount(
    /^\s*export\s+/gm,
    content
  );
}

function countFunctions(content) {
  return matchCount(
    /\bfunction\b|=>/g,
    content
  );
}

function countClasses(content) {
  return matchCount(
    /\bclass\s+/g,
    content
  );
}

function countInterfaces(content) {
  return matchCount(
    /\binterface\s+/g,
    content
  );
}

function countComments(content) {
  return (
    matchCount(/\/\/.*/g, content) +
    matchCount(/\/\*[\s\S]*?\*\//g, content)
  );
}

function countTODOs(content) {
  return matchCount(
    /TODO|FIXME/gi,
    content
  );
}

function countConsoleLogs(content) {
  return matchCount(
    /console\.(log|warn|error|info)/g,
    content
  );
}

function countConditions(content) {
  return matchCount(
    /\bif\s*\(/g,
    content
  );
}

function countLoops(content) {
  return (
    matchCount(/\bfor\s*\(/g, content) +
    matchCount(/\bwhile\s*\(/g, content)
  );
}

function countSwitch(content) {
  return matchCount(
    /\bswitch\s*\(/g,
    content
  );
}

function countTryCatch(content) {
  return (
    matchCount(/\btry\s*\{/g, content) +
    matchCount(/\bcatch\s*\(/g, content)
  );
}

function countAsync(content) {
  return matchCount(
    /\basync\b/g,
    content
  );
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

  summary.largestFiles =
    [...files]
      .sort((a, b) => b.lines - a.lines)
      .slice(0, 10);

  summary.mostChangedFiles =
    [...files]
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

    const [scannedFiles, gitHistory] =
      await Promise.all([
        Promise.resolve(scanRepository(repoPath)),
        getGitHistory(repoPath),
      ]);

    console.log(
      `📄 Source files scanned: ${scannedFiles.length}`
    );

    const allFiles = mergeRepositoryData(
      scannedFiles,
      gitHistory
    );
    console.log("🤖 Starting AI File Analysis...");

const aiFiles = [];

for (const file of allFiles) {
  try {
    const ai = await analyzeFileWithAI(file);

    aiFiles.push({
      ...file,
      ai,
    });

    console.log("✅", file.path);
  } catch (err) {
    console.error("AI Error:", file.path);

    aiFiles.push({
      ...file,
      ai: {
        purpose: "Analysis failed",
        summary: err.message,
      },
    });
  }
}

const summary =
  buildRepositorySummary(aiFiles);

    console.log("✅ File analysis completed");

    return {
      totalFiles: summary.totalFiles,

      totalLines: summary.totalLines,

      totalSize: summary.totalSize,

      totalChanges: summary.totalChanges,

      totalAdditions: summary.totalAdditions,

      totalDeletions: summary.totalDeletions,

      languages: summary.extensions,

      largestFiles: summary.largestFiles,

      mostChangedFiles:
        summary.mostChangedFiles,

      allFiles: aiFiles,
    };
  } catch (error) {
    console.error(
      "❌ File analysis failed:",
      error
    );

    throw error;
  }
}

/* ==========================================================
   SEARCH
========================================================== */

function findFile(fileAnalysis, filename) {
  return (
    fileAnalysis.allFiles.find(
      file =>
        file.path === filename ||
        file.name === filename
    ) || null
  );
}

function searchFiles(fileAnalysis, query) {
  query = query.toLowerCase();

  return fileAnalysis.allFiles.filter(file =>
    file.path
      .toLowerCase()
      .includes(query)
  );
}

/* ==========================================================
   STATISTICS
========================================================== */

function getRepositoryStatistics(
  fileAnalysis
) {
  const files =
    fileAnalysis.allFiles;

  return {

    totalFiles: files.length,

    codeFiles: files.filter(
      f => f.isCodeFile
    ).length,

    totalLines:
      fileAnalysis.totalLines,

    averageLines:
      files.length
        ? Math.round(
            fileAnalysis.totalLines /
              files.length
          )
        : 0,

    averageFileSize:
      files.length
        ? Math.round(
            fileAnalysis.totalSize /
              files.length
          )
        : 0,

    extensions:
      fileAnalysis.languages,
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