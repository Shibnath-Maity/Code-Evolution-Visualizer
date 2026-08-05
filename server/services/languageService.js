const path = require("path");

const EXTENSION_MAP = {
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".html": "HTML",
  ".css": "CSS",
  ".scss": "SCSS",
  ".less": "Less",
  ".json": "JSON",
  ".md": "Markdown",
  ".java": "Java",
  ".py": "Python",
  ".c": "C",
  ".cpp": "C++",
  ".h": "C/C++",
  ".hpp": "C++",
  ".go": "Go",
  ".rs": "Rust",
  ".php": "PHP",
  ".sql": "SQL",
  ".rb": "Ruby",
  ".swift": "Swift",
  ".kt": "Kotlin",
  ".cs": "C#",
  ".vue": "Vue",
  ".svelte": "Svelte",
  ".sh": "Shell",
  ".yml": "YAML",
  ".yaml": "YAML",
  ".xml": "XML",
  ".toml": "TOML",
  ".gradle": "Gradle",
};

// Filenames that have no (or a non-indicative) extension. Kept in sync
// with the special-filename handling in vectorService/repoIndexer so
// the whole app agrees on how these are classified.
const SPECIAL_FILENAME_MAP = {
  Dockerfile: "Dockerfile",
  Makefile: "Makefile",
  Jenkinsfile: "Jenkins",
  Procfile: "Procfile",
  "go.mod": "Go",
  "go.sum": "Go",
  "Cargo.toml": "Rust",
  "Cargo.lock": "Rust",
  "package.json": "Node.js Config",
  "package-lock.json": "Node.js Config",
  "requirements.txt": "Python Config",
  "pyproject.toml": "Python Config",
  "pom.xml": "Maven",
  Gemfile: "Ruby",
  "Gemfile.lock": "Ruby",
};

function detectLanguage(filePath) {
  const fileName = path.basename(filePath);

  if (SPECIAL_FILENAME_MAP[fileName]) {
    return SPECIAL_FILENAME_MAP[fileName];
  }

  const extension = path.extname(fileName).toLowerCase();
  return EXTENSION_MAP[extension] || "Other";
}

// Rounds percentages so they sum to 100 (the "largest remainder"
// method), instead of rounding each independently and letting the
// total drift a point or two off in either direction.
function distributePercentages(counts, total) {
  if (!total) return counts.map(() => 0);

  const raw = counts.map((count) => (count / total) * 100);
  const floored = raw.map(Math.floor);

  let remainder = 100 - floored.reduce((sum, n) => sum + n, 0);

  const order = raw
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac);

  const result = [...floored];
  for (let i = 0; i < remainder; i++) {
    result[order[i].index] += 1;
  }

  return result;
}

function analyzeLanguages(fileAnalysis) {
  const files = fileAnalysis?.allFiles || [];

  const counts = {};
  const frameworks = new Set();
files.forEach((file) => {
  const filePath = file.path || file.name;

  if (!filePath) return;

  const language = detectLanguage(filePath);
  counts[language] = (counts[language] || 0) + 1;

  const name = path.basename(filePath);

  if (name === "package.json") frameworks.add("Node.js");
  if (name === "next.config.js") frameworks.add("Next.js");
  if (name === "vite.config.js") frameworks.add("Vite");
  if (name === "tailwind.config.js") frameworks.add("Tailwind CSS");
  if (name === "package-lock.json") frameworks.add("NPM");
  if (name === "pom.xml") frameworks.add("Maven");
  if (name === "build.gradle") frameworks.add("Gradle");
  if (name === "Cargo.toml") frameworks.add("Rust Cargo");
  if (name === "go.mod") frameworks.add("Go Modules");
  if (name === "requirements.txt") frameworks.add("Python");
  if (name === "pyproject.toml") frameworks.add("Python");
});

  const totalFiles = files.length;

  const languages = Object.keys(counts);
  const fileCounts = languages.map((language) => counts[language]);
  const percentages = distributePercentages(fileCounts, totalFiles);

  const result = languages
    .map((language, i) => ({
      language,
      files: fileCounts[i],
      percentage: percentages[i],
    }))
    .sort((a, b) => b.files - a.files);

  return {
     totalFiles,
  totalLanguages: result.length,
  dominantLanguage:
    result.length > 0 ? result[0].language : "Unknown",
  frameworks: [...frameworks],
  languages: result,
  };
}

module.exports = {
  analyzeLanguages,
};