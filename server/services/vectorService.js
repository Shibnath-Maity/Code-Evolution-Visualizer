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
// Files to index
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
".env.example",
".dockerfile",
];

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
    "Dockerfile": "Dockerfile",
    "Makefile": "Makefile",
    "Jenkinsfile": "Jenkins",
    "Procfile": "Procfile",
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
    "Gemfile": "Ruby Dependencies",
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


function getSourceFiles(directory, repoRoot = directory) {
  let files = [];

  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  // Files that should always be indexed even without extensions
  const SPECIAL_FILES = [
    "Dockerfile",
    "Makefile",
    "Jenkinsfile",
    "Procfile",
    "package.json",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
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
    "Cargo.lock",
    "composer.json",
    "Gemfile",
    "Gemfile.lock",
    ".env.example",
  ];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    // ================================
    // Directory
    // ================================

    if (entry.isDirectory()) {
      if (IGNORED_DIRS.includes(entry.name)) {
        continue;
      }

      files = files.concat(
        getSourceFiles(fullPath, repoRoot)
      );

      continue;
    }

    // ================================
    // Special configuration files
    // ================================

    if (SPECIAL_FILES.includes(entry.name)) {
      files.push(fullPath);
      continue;
    }

    // ================================
    // Normal extensions
    // ================================

    const extension = path
      .extname(entry.name)
      .toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      continue;
    }

    // Ignore generated statistics
    if (
      entry.name.toLowerCase() === "stats.json"
    ) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}
// ==========================================
// Smart chunking
// ==========================================

function chunkCode(content, chunkSize = 3000) {
  const chunks = [];

  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push(content.slice(i, i + chunkSize));
  }

  return chunks;
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

    let totalChunks = 0;
    const repositoryFiles = [];
const languageStats = {};

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(
          filePath,
          "utf-8"
        );

        if (!content.trim()) {
          continue;
        }

        const relativePath = path.relative(
          repoPath,
          filePath
        );

        const fileName = path.basename(filePath);
        const extension =
          path.extname(fileName).toLowerCase();

       const language = detectLanguage(
  extension,
  fileName
);
repositoryFiles.push({
  file: relativePath,
  language,
  extension,
});

languageStats[language] =
  (languageStats[language] || 0) + 1;
        const directory = path.dirname(relativePath);

        const chunks = chunkCode(content);

        console.log(
          `📄 ${relativePath} → ${chunks.length} chunks`
        );

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

          const chunkId =
            `${repositoryId}_${relativePath.replace(
              /[^a-zA-Z0-9]/g,
              "_"
            )}_${i}`;

          await addDocument(
            chunkId,
            documentText,
            {
              file: relativePath,
              directory,
              fileName,
              chunk: i,
              totalChunks: chunks.length,
              type: "source",
              language,
              extension,
              repositoryId,
            }
          );

          totalChunks++;
        }
      } catch (error) {
        console.error(
          `⚠️ Could not process ${filePath}:`,
          error.message
        );
      }
    }
    // ==========================================
// Create Repository Summary
// ==========================================

const languageSummary = Object.entries(languageStats)
  .map(([language, count]) => `${language}: ${count} files`)
  .join("\n");

const fileSummary = repositoryFiles
  .map(
    (item) =>
      `- ${item.file} (${item.language})`
  )
  .join("\n");

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

Files in repository:
${fileSummary}
`;

console.log("\n📋 Creating repository summary...");

await addDocument(
  `${repositoryId}_repository_summary`,
  repositorySummary,
  {
    repositoryId,
    type: "repository_summary",
    totalFiles: files.length,
    totalChunks,
    languages: Object.keys(languageStats).join(", "),
  }
);

console.log("✅ Repository summary added to ChromaDB");

    console.log(
      "\n✅ Repository indexed successfully"
    );

    console.log(
      `📦 Total chunks stored: ${totalChunks}`
    );

    return {
      files: files.length,
      chunks: totalChunks,
    };
  } catch (error) {
    console.error(
      "❌ Repository indexing failed:",
      error.message
    );

    throw error;
  }
}

module.exports = {
  getSourceFiles,
  chunkCode,
  indexRepository,
};