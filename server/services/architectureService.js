const fs = require("fs");
const path = require("path");

/* ==========================================================
   IGNORE
========================================================== */

const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  ".vite",
  ".idea",
  ".vscode",
  "coverage",
  "__pycache__",
]);

/* ==========================================================
   LAYERS
========================================================== */

const LAYER_NAMES = [
  "components",
  "pages",
  "routes",
  "controllers",
  "services",
  "models",
  "hooks",
  "utils",
  "config",
  "assets",
  "middleware",
  "contexts",
  "store",
  "api",
  "tests",
];

/* ==========================================================
   FRAMEWORK DETECTION
========================================================== */

function detectFramework(rootPath) {
  const files = fs.readdirSync(rootPath);

  const exists = (file) => fs.existsSync(path.join(rootPath, file));

  if (exists("next.config.js")) {
    return { name: "Next.js", confidence: 99 };
  }

  if (exists("angular.json")) {
    return { name: "Angular", confidence: 99 };
  }

  if (exists("manage.py")) {
    return { name: "Django", confidence: 98 };
  }

  if (exists("pom.xml")) {
    return { name: "Spring Boot", confidence: 98 };
  }

  // STEP 1 FIX: Support .ts and .mjs Vite config extensions
  if (
    exists("vite.config.js") ||
    exists("vite.config.ts") ||
    exists("vite.config.mjs")
  ) {
    return { name: "React (Vite)", confidence: 95 };
  }

  if (exists("package.json")) {
    try {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(rootPath, "package.json"), "utf8")
      );

      const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      // STEP 2 FIX: Differentiate Vite projects via package dependencies
      if (deps.react) {
        return {
          name: deps.vite ? "React (Vite)" : "React",
          confidence: 95,
        };
      }

      if (deps.express) return { name: "Express", confidence: 95 };
      if (deps.vue) return { name: "Vue", confidence: 95 };
    } catch {}
  }

  return { name: "Unknown", confidence: 50 };
}

/* ==========================================================
   FILE TYPE
========================================================== */

function getFileType(extension) {
  const frontend = [".jsx", ".tsx", ".css", ".scss", ".html"];
  const backend = [".js", ".ts", ".java", ".py", ".c", ".cpp", ".cs"];
  const config = [".json", ".yaml", ".yml", ".env"];
  const docs = [".md", ".txt"];

  if (frontend.includes(extension)) return "frontend";
  if (backend.includes(extension)) return "backend";
  if (config.includes(extension)) return "config";
  if (docs.includes(extension)) return "documentation";

  return "other";
}

/* ==========================================================
   METRICS
========================================================== */

const metrics = {
  folderCount: 0,
  fileCount: 0,
  maxDepth: 0,
  largestFolder: { name: "", files: 0 },
  layers: {},
  modules: [],
};

/* ==========================================================
   SCAN DIRECTORY
========================================================== */

function scanDirectory(currentPath, rootPath, depth = 0) {
  metrics.folderCount++;
  metrics.maxDepth = Math.max(metrics.maxDepth, depth);

  const entries = fs.readdirSync(currentPath, { withFileTypes: true });

  const folders = [];
  const files = [];
  let localFiles = 0;

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;

    if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(currentPath, entry.name);
    const relative = path
      .relative(rootPath, fullPath)
      .replace(/\\/g, "/");

    if (entry.isDirectory()) {
      const lower = entry.name.toLowerCase();

      if (LAYER_NAMES.includes(lower)) {
        metrics.layers[lower] = (metrics.layers[lower] || 0) + 1;
      }

      if (relative.startsWith("src/features/")) {
        metrics.modules.push(entry.name);
      }

      folders.push(scanDirectory(fullPath, rootPath, depth + 1));
    } else {
      metrics.fileCount++;
      localFiles++;

      files.push({
        name: entry.name,
        path: relative,
        extension: path.extname(entry.name),
        type: getFileType(path.extname(entry.name)),
      });
    }
  }

  if (localFiles > metrics.largestFolder.files) {
    metrics.largestFolder = {
      name: path.basename(currentPath),
      files: localFiles,
    };
  }

  return {
    name: path.basename(currentPath),
    path: path.relative(rootPath, currentPath).replace(/\\/g, "/"),
    folders,
    files,
  };
}

/* ==========================================================
   ARCHITECTURE SCORE
========================================================== */

function calculateArchitectureScore() {
  let score = 100;

  if (metrics.folderCount < 3) score -= 15;
  else if (metrics.folderCount < 6) score -= 8;

  if (!metrics.layers.components) score -= 5;
  if (!metrics.layers.services) score -= 8;
  if (!metrics.layers.utils) score -= 4;
  if (!metrics.layers.routes) score -= 4;
  if (!metrics.layers.models) score -= 4;

  if (metrics.maxDepth > 8) score -= 15;
  else if (metrics.maxDepth > 6) score -= 8;

  if (metrics.largestFolder.files > 60) score -= 15;
  else if (metrics.largestFolder.files > 40) score -= 10;
  else if (metrics.largestFolder.files > 20) score -= 5;

  return Math.max(0, Math.min(100, score));
}

/* ==========================================================
   FOLDER RISK ANALYSIS
========================================================== */

function analyzeFolderRisks(tree) {
  const risks = [];

  function visit(folder, depth = 0) {
    if (folder.files.length > 30) {
      risks.push({
        folder: folder.path || "/",
        severity: folder.files.length > 60 ? "High" : "Medium",
        reason: `${folder.files.length} files inside one folder`,
        suggestion: "Split into feature-based folders",
      });
    }

    if (depth > 7) {
      risks.push({
        folder: folder.path,
        severity: "Medium",
        reason: "Folder nesting is too deep",
        suggestion: "Reduce directory depth",
      });
    }

    for (const child of folder.folders) {
      visit(child, depth + 1);
    }
  }

  visit(tree);
  return risks;
}

/* ==========================================================
   AI SUMMARY
========================================================== */

function buildArchitectureSummary(score, risks) {
  const strengths = [];
  const weaknesses = [];

  if (metrics.layers.components) strengths.push("Component layer detected");
  if (metrics.layers.services) strengths.push("Service layer detected");
  if (metrics.layers.utils) strengths.push("Utility layer available");
  if (metrics.modules.length > 0) strengths.push("Feature modules detected");

  if (metrics.maxDepth > 6) weaknesses.push("Project has deep folder nesting");
  if (metrics.largestFolder.files > 30) weaknesses.push("Large folder should be split");
  if (!metrics.layers.services) weaknesses.push("No dedicated service layer");
  if (!metrics.layers.models) weaknesses.push("No model/domain layer found");

  return {
    title:
      score >= 85
        ? "Well structured architecture"
        : score >= 70
        ? "Architecture is good but can improve"
        : "Architecture needs refactoring",
    strengths,
    weaknesses,
    riskCount: risks.length,
  };
}

/* ==========================================================
   ARCHITECTURE FLOW
========================================================== */

function buildArchitectureFlow(framework) {
  const nodes = [];
  const edges = [];

  const hasLayer = (name) => Boolean(metrics.layers[name]);

  const addNode = (id, label, type, description) => {
    nodes.push({ id, label, type, description });
  };

  const addEdge = (source, target, label) => {
    edges.push({ source, target, label });
  };

  // Frontend
  const hasFrontend =
    framework.name.includes("React") ||
    framework.name.includes("Next") ||
    framework.name.includes("Angular") ||
    framework.name.includes("Vue") ||
    hasLayer("components") ||
    hasLayer("pages");

  if (hasFrontend) {
    addNode(
      "frontend",
      `${framework.name} Frontend`,
      "frontend",
      "User interface and client-side application"
    );
  }

  // API / Routes
  if (hasLayer("routes") || hasLayer("api")) {
    addNode(
      "api",
      "API / Routes",
      "api",
      "Handles incoming application requests"
    );
  }

  // Middleware
  if (hasLayer("middleware")) {
    addNode(
      "middleware",
      "Middleware",
      "middleware",
      "Authentication, validation and request processing"
    );
  }

  // Controllers
  if (hasLayer("controllers")) {
    addNode(
      "controllers",
      "Controllers",
      "controller",
      "Coordinates requests and application operations"
    );
  }

  // Services
  if (hasLayer("services")) {
    addNode(
      "services",
      "Services",
      "service",
      "Contains the main business and application logic"
    );
  }

  // Models / Database
  if (hasLayer("models")) {
    addNode(
      "database",
      "Data / Models",
      "database",
      "Represents and manages application data"
    );
  }

  // Utilities
  if (hasLayer("utils")) {
    addNode("utils", "Utilities", "utility", "Shared helper functions");
  }

  // State
  if (hasLayer("contexts") || hasLayer("store")) {
    addNode(
      "state",
      "Application State",
      "service",
      "Shared application state and data"
    );
  }

  // Tests
  if (hasLayer("tests")) {
    addNode("tests", "Tests", "test", "Automated tests");
  }

  // Relationships
  const nodeExists = (id) => nodes.some((node) => node.id === id);

  if (nodeExists("frontend") && nodeExists("api")) {
    addEdge("frontend", "api", "HTTP requests");
  }

  if (nodeExists("api") && nodeExists("middleware")) {
    addEdge("api", "middleware", "Request processing");
  }

  if (nodeExists("middleware") && nodeExists("controllers")) {
    addEdge("middleware", "controllers", "Validated request");
  }

  if (nodeExists("api") && nodeExists("controllers") && !nodeExists("middleware")) {
    addEdge("api", "controllers", "Routes request");
  }

  if (nodeExists("api") && nodeExists("services") && !nodeExists("controllers")) {
    addEdge("api", "services", "Calls service");
  }

  if (nodeExists("controllers") && nodeExists("services")) {
    addEdge("controllers", "services", "Business logic");
  }

  if (nodeExists("services") && nodeExists("database")) {
    addEdge("services", "database", "Reads / writes");
  }

  if (nodeExists("services") && nodeExists("utils")) {
    addEdge("services", "utils", "Uses helpers");
  }

  if (nodeExists("frontend") && nodeExists("state")) {
    addEdge("frontend", "state", "Uses state");
  }

  return { nodes, edges };
}

/* ==========================================================
   DASHBOARD
========================================================== */

function buildDashboard(score) {
  return {
    architectureScore: score,
    totalFolders: metrics.folderCount,
    totalFiles: metrics.fileCount,
    maxDepth: metrics.maxDepth,
    largestFolder: metrics.largestFolder,
    detectedLayers: Object.keys(metrics.layers).length,
    detectedModules: metrics.modules.length,
  };
}

/* ==========================================================
   BUILD ARCHITECTURE
========================================================== */

function resetMetrics() {
  metrics.folderCount = 0;
  metrics.fileCount = 0;
  metrics.maxDepth = 0;
  metrics.largestFolder = { name: "", files: 0 };
  metrics.layers = {};
  metrics.modules = [];
}

function buildArchitecture(repoPath) {
  if (!fs.existsSync(repoPath)) {
    throw new Error(`Repository path does not exist: ${repoPath}`);
  }

  resetMetrics();

  console.log("🏗️ Building repository architecture...");

  const tree = scanDirectory(repoPath, repoPath, 0);
  const framework = detectFramework(repoPath);
  const flow = buildArchitectureFlow(framework);
  const score = calculateArchitectureScore();
  const risks = analyzeFolderRisks(tree);
  const summary = buildArchitectureSummary(score, risks);
  const dashboard = buildDashboard(score);

  console.log("✅ Architecture analysis completed");

  return {
    tree,
    framework,
    score,
    flow,
    metrics: {
      folderCount: metrics.folderCount,
      fileCount: metrics.fileCount,
      maxDepth: metrics.maxDepth,
      largestFolder: metrics.largestFolder,
      layers: metrics.layers,
      modules: metrics.modules,
    },
    risks,
    summary,
    dashboard,
  };
}

/* ==========================================================
   HELPERS
========================================================== */

function getArchitectureInsights(architecture) {
  return {
    framework: architecture.framework.name,
    architectureScore: architecture.score,
    strengths: architecture.summary.strengths,
    weaknesses: architecture.summary.weaknesses,
    risks: architecture.risks,
    modules: architecture.metrics.modules,
    layers: architecture.metrics.layers,
  };
}

/* ==========================================================
   EXPORTS
========================================================== */

module.exports = {
  buildArchitecture,
  getArchitectureInsights,
};