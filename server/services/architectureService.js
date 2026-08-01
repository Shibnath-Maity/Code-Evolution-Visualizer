const fs = require("fs");
const path = require("path");

const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  ".vite",
  "coverage",
  "__pycache__",
  ".idea",
  ".vscode",
]);

function getFileType(extension) {
  const frontend = [".jsx", ".tsx", ".css", ".scss"];
  const backend = [".js", ".ts", ".py", ".java", ".c", ".cpp"];
  const config = [".json", ".yml", ".yaml", ".env"];
  const docs = [".md", ".txt"];

  if (frontend.includes(extension)) return "frontend";
  if (backend.includes(extension)) return "backend";
  if (config.includes(extension)) return "config";
  if (docs.includes(extension)) return "documentation";

  return "other";
}

function scanDirectory(dirPath, rootPath) {
  const items = fs.readdirSync(dirPath, { withFileTypes: true });

  const folders = [];
  const files = [];

  for (const item of items) {
    if (item.name.startsWith(".")) continue;

    if (
      item.isDirectory() &&
      IGNORED_DIRS.has(item.name)
    ) {
      continue;
    }

    const fullPath = path.join(dirPath, item.name);
    const relativePath = path
      .relative(rootPath, fullPath)
      .replace(/\\/g, "/");

    if (item.isDirectory()) {
      folders.push(
        scanDirectory(fullPath, rootPath)
      );
    } else {
      const extension = path.extname(item.name).toLowerCase();

      files.push({
        name: item.name,
        path: relativePath,
        extension,
        type: getFileType(extension),
      });
    }
  }

  return {
    name: path.basename(dirPath),
    path: path
      .relative(rootPath, dirPath)
      .replace(/\\/g, "/"),
    type: "folder",
    folders,
    files,
  };
}

function buildArchitecture(repoPath) {
  if (!fs.existsSync(repoPath)) {
    throw new Error(`Repository path does not exist: ${repoPath}`);
  }

  return scanDirectory(repoPath, repoPath);
}

module.exports = {
  buildArchitecture,
};