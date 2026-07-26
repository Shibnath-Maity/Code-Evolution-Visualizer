const path = require("path");

const extensionMap = {
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".html": "HTML",
  ".css": "CSS",
  ".scss": "SCSS",
  ".json": "JSON",
  ".md": "Markdown",
  ".java": "Java",
  ".py": "Python",
  ".c": "C",
  ".cpp": "C++",
  ".h": "C/C++",
  ".go": "Go",
  ".rs": "Rust",
  ".php": "PHP",
  ".sql": "SQL",
};

function analyzeLanguages(fileAnalysis) {
  const files = fileAnalysis.allFiles || [];

  const languages = {};

  files.forEach((file) => {
    const extension = path.extname(file.file).toLowerCase();

    const language = extensionMap[extension] || "Other";

    languages[language] = (languages[language] || 0) + 1;
  });

  const totalFiles = files.length;

  const result = Object.entries(languages)
    .map(([language, files]) => ({
      language,
      files,
      percentage: totalFiles
        ? Math.round((files / totalFiles) * 100)
        : 0,
    }))
    .sort((a, b) => b.files - a.files);

  return {
    totalFiles,
    languages: result,
  };
}

module.exports = {
  analyzeLanguages,
};