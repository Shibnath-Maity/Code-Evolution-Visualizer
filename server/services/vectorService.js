const fs = require("fs");
const path = require("path");
const { addDocument } = require("./ragService");

// ==========================================
// Directories to ignore
// ==========================================

const IGNORED_DIRS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  "target",
  "out",
  ".idea",
  ".vscode",
];

// ==========================================
// Files to index (matched by extension)
// ==========================================

const ALLOWED_EXTENSIONS = [
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".java",
  ".py",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".html",
  ".css",
  ".scss",
  ".json",
  ".md",
  ".xml",
  ".yml",
  ".yaml",
  ".sql",
  ".gradle",
  ".properties",
  ".toml",
  ".ini",
  // Note: "Dockerfile" and ".env.example" have no matching extname()
  // result, so they're handled separately via SPECIAL_FILES below.
];

// Files that should always be indexed even though they don't have
// (or don't rely on) a normal extension.
const SPECIAL_FILES = [
  "Dockerfile",
  "Makefile",
  "Jenkinsfile",
  "Procfile",
  "package.json",
  "requirements.txt",
  "Pipfile",
  "Pipfile.lock",
  "pyproject.toml",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "settings.gradle",
  "settings.gradle.kts",
  "gradle.properties",
  "go.mod",
  "go.sum",
  "Cargo.toml",
  "composer.json",
  "Gemfile",
  ".env.example",
];

// Lockfiles: worth acknowledging in the repo summary, but usually huge,
// machine-generated, and low-value to chunk/embed for semantic search.
// We index them as a single truncated chunk instead of splitting fully.
const LOCKFILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "Gemfile.lock",
  "Cargo.lock",
]);

// Skip files bigger than this entirely (bytes). Prevents pathological
// slowdowns on generated/minified/vendored files that slipped through
// the extension filter.
const MAX_FILE_SIZE_BYTES = 1.5 * 1024 * 1024; // 1.5MB

// Cap how much of a lockfile we actually embed.
const LOCKFILE_MAX_CHARS = 4000;

// How many files to embed concurrently.
const INDEX_CONCURRENCY = 5;

// ==========================================
// Detect programming language
// ==========================================
function detectLanguage(extension, fileName = "") {
  const languages = {
    ".js": "JavaScript",
    ".jsx": "React JSX",
    ".ts": "TypeScript",
    ".tsx": "React TypeScript",
    ".java": "Java",
    ".py": "Python",
    ".c": "C",
    ".cpp": "C++",
    ".h": "C/C++ Header",
    ".hpp": "C++ Header",
    ".html": "HTML",
    ".css": "CSS",
    ".scss": "SCSS",
    ".json": "JSON",
    ".md": "Markdown",
    ".xml": "XML",
    ".yml": "YAML",
    ".yaml": "YAML",
    ".sql": "SQL",
    ".gradle": "Gradle",
    ".properties": "Properties",
    ".toml": "TOML",
    ".ini": "INI",
  };

  const specialFiles = {
    Dockerfile: "Dockerfile",
    Makefile: "Makefile",
    Jenkinsfile: "Jenkins",
    Procfile: "Procfile",
    ".env.example": "Environment Configuration",
    "requirements.txt": "Python Dependencies",
    "go.mod": "Go Modules",
    "go.sum": "Go Dependencies",
    "Cargo.toml": "Rust Cargo",
    "Cargo.lock": "Rust Dependencies",
    "pom.xml": "Maven",
    "package.json": "Node.js Configuration",
    "package-lock.json": "NPM Lockfile",
    "yarn.lock": "Yarn Lockfile",
    "pnpm-lock.yaml": "PNPM Lockfile",
    "composer.json": "PHP Composer",
    Gemfile: "Ruby Dependencies",
    "Gemfile.lock": "Ruby Dependencies",
  };

  if (specialFiles[fileName]) {
    return specialFiles[fileName];
  }

  return languages[extension] || "Unknown";
}

// ==========================================
// Find source files recursively
// ==========================================

function getSourceFiles(directory, repoRoot = directory, seenRealPaths = new Set()) {
  let files = [];

  // Guard against symlink cycles (e.g. a symlinked dir pointing back
  // up the tree, which would otherwise recurse forever).
  let realPath;
  try {
    realPath = fs.realpathSync(directory);
  } catch (err) {
    console.error(`⚠️ Could not resolve ${directory}:`, err.message);
    return files;
  }
  if (seenRealPaths.has(realPath)) {
    return files;
  }
  seenRealPaths.add(realPath);

  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch (err) {
    console.error(`⚠️ Could not read directory ${directory}:`, err.message);
    return files;
  }

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    // ================================
    // Directory
    // ================================

    if (entry.isDirectory()) {
      if (IGNORED_DIRS.includes(entry.name)) {
        continue;
      }

      files = files.concat(getSourceFiles(fullPath, repoRoot, seenRealPaths));
      continue;
    }

    // Skip symlinked files to avoid surprises/duplication; only index
    // real files.
    if (entry.isSymbolicLink()) {
      continue;
    }

    // ================================
    // Special configuration files / lockfiles
    // ================================

    if (SPECIAL_FILES.includes(entry.name) || LOCKFILES.has(entry.name)) {
      files.push(fullPath);
      continue;
    }

    // ================================
    // Normal extensions
    // ================================

    const extension = path.extname(entry.name).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      continue;
    }

    // Ignore generated statistics
    if (entry.name.toLowerCase() === "stats.json") {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

// ==========================================
// Smart chunking (overlap + prefers newline boundaries)
// ==========================================

function chunkCode(content, chunkSize = 3000, overlap = 200) {
  if (content.length <= chunkSize) {
    return [content];
  }

  const chunks = [];
  let start = 0;

  while (start < content.length) {
    let end = Math.min(start + chunkSize, content.length);

    // If we're not at the end of the file, try to break on a newline
    // near the boundary so we don't split mid-line/mid-function.
    if (end < content.length) {
      const lastNewline = content.lastIndexOf("\n", end);
      if (lastNewline > start + chunkSize * 0.5) {
        end = lastNewline + 1;
      }
    }

    chunks.push(content.slice(start, end));

    if (end >= content.length) break;

    // Step forward, backing up by `overlap` so context carries between
    // chunks (helps retrieval quality for anything split across a
    // boundary).
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

// ==========================================
// Tiny concurrency-limited async map
// ==========================================

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runNext() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, runNext);
  await Promise.all(workers);

  return results;
}

// ==========================================
// Index a single file (extracted so it can run concurrently)
// ==========================================

async function indexFile(filePath, repoPath, repositoryId) {
  const relativePath = path.relative(repoPath, filePath);
  const fileName = path.basename(filePath);
  const extension = path.extname(fileName).toLowerCase();
  const directory = path.dirname(relativePath);

  let stats;
  try {
    stats = fs.statSync(filePath);
  } catch (err) {
    console.error(`⚠️ Could not stat ${filePath}:`, err.message);
    return null;
  }

  if (stats.size > MAX_FILE_SIZE_BYTES) {
    console.log(
      `⏭️  Skipping ${relativePath} (${Math.round(stats.size / 1024)}KB exceeds size limit)`
    );
    return null;
  }

  let content;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error(`⚠️ Could not process ${filePath}:`, error.message);
    return null;
  }

  if (!content.trim()) {
    return null;
  }

  const language = detectLanguage(extension, fileName);
  const isLockfile = LOCKFILES.has(fileName);

  // Lockfiles: index a single truncated chunk rather than fully
  // splitting a machine-generated file that's rarely useful to search
  // line-by-line.
  const chunks = isLockfile
    ? [content.slice(0, LOCKFILE_MAX_CHARS)]
    : chunkCode(content);

  console.log(`📄 ${relativePath} → ${chunks.length} chunk(s)`);

  for (let i = 0; i < chunks.length; i++) {
    const documentText = `
Repository ID: ${repositoryId}

File: ${relativePath}
File Name: ${fileName}
Directory: ${directory}
Language: ${language}
Extension: ${extension}

Repository Source Code:
This document is part of a software repository.
The following content comes from the file:
${relativePath}

Code / Content:
${chunks[i]}
`;

    const chunkId = `${repositoryId}_${relativePath.replace(/[^a-zA-Z0-9]/g, "_")}_${i}`;

    await addDocument(chunkId, documentText, {
      file: relativePath,
      directory,
      fileName,
      chunk: i,
      totalChunks: chunks.length,
      type: "source",
      language,
      extension,
      repositoryId,
    });
  }

  return {
    file: relativePath,
    language,
    extension,
    chunkCount: chunks.length,
  };
}

// ==========================================
// Index entire repository
// ==========================================

async function indexRepository(repoPath, repositoryId) {
  try {
    if (!repositoryId) {
      throw new Error("repositoryId is required for indexing");
    }

    console.log("\n🔍 Starting repository indexing...");
    console.log("Repository:", repoPath);
    console.log("Repository ID:", repositoryId);

    const files = getSourceFiles(repoPath);

    console.log(`📁 Found ${files.length} indexable files`);
const frameworks = new Set();

for (const filePath of files) {
  if (path.basename(filePath) === "package.json") {
    try {
      const pkg = JSON.parse(fs.readFileSync(filePath, "utf8"));

      const deps = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
      };

      if (deps.react) frameworks.add("React");
      if (deps.express) frameworks.add("Express");
      if (deps.vite) frameworks.add("Vite");
      if (deps.tailwindcss) frameworks.add("Tailwind CSS");
      if (deps.axios) frameworks.add("Axios");
      if (deps.mongoose) frameworks.add("Mongoose");
      if (deps["react-router-dom"]) frameworks.add("React Router");
      if (deps.recharts) frameworks.add("Recharts");
    } catch (err) {
      console.error("Failed to parse package.json:", err.message);
    }
  }
}

console.log("Detected Frameworks:", [...frameworks]);
    const results = await mapWithConcurrency(files, INDEX_CONCURRENCY, (filePath) =>
      indexFile(filePath, repoPath, repositoryId).catch((error) => {
        console.error(`⚠️ Could not process ${filePath}:`, error.message);
        return null;
      })
    );

    const indexed = results.filter(Boolean);
    const totalChunks = indexed.reduce((sum, r) => sum + r.chunkCount, 0);

    const repositoryFiles = indexed.map(({ file, language, extension }) => ({
      file,
      language,
      extension,
    }));

    const languageStats = {};
    for (const { language } of indexed) {
      languageStats[language] = (languageStats[language] || 0) + 1;
    }

    // ==========================================
    // Create Repository Summary
    // ==========================================

    const languageSummary = Object.entries(languageStats)
      .map(([language, count]) => `${language}: ${count} files`)
      .join("\n");

    const fileSummary = repositoryFiles.map((item) => `- ${item.file} (${item.language})`).join("\n");

   const repositorySummary = `
Repository Overview

Repository ID:
${repositoryId}

Total indexable files:
${files.length}

Total indexed chunks:
${totalChunks}

Languages:
${languageSummary}

Frameworks:
${[...frameworks].join(", ") || "None detected"}

Files in repository:
${fileSummary}
`;

    console.log("\n📋 Creating repository summary...");

    await addDocument(`${repositoryId}_repository_summary`, repositorySummary, {
  repositoryId,
  type: "repository_summary",
  totalFiles: files.length,
  totalChunks,
  languages: Object.keys(languageStats).join(", "),
  frameworks: [...frameworks].join(", "),
});

    console.log("✅ Repository summary added to ChromaDB");
    console.log("\n✅ Repository indexed successfully");
    console.log(`📦 Total chunks stored: ${totalChunks}`);

    return {
      files: files.length,
      chunks: totalChunks,
    };
  } catch (error) {
    console.error("❌ Repository indexing failed:", error.message);
    throw error;
  }
}

module.exports = {
  getSourceFiles,
  chunkCode,
  indexRepository,
};