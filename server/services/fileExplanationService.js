const fs = require("fs");
const path = require("path");

const { generateJSON } = require("./llmService");
const { buildFileRelations } = require("./fileDependencyService");

const {
  getAnalysisSession,
  updateAnalysisSession,
} = require("./sessionService");

/* ==========================================================
   AI FILE EXPLANATION
========================================================== */

async function explainFile(
  repoPath,
  filePath,
  architecture = null,
  repositoryId = null
) {
  /* ========================================================
     1. CHECK CACHE FIRST
  ======================================================== */

  if (repositoryId) {
    const session = getAnalysisSession(repositoryId);

    const cached = session?.aiFileExplanations?.[filePath];

    if (cached) {
      console.log("⚡ Returning cached AI analysis:", filePath);
      return cached;
    }
  }

  console.log("🤖 Generating NEW AI analysis:", filePath);

  /* ========================================================
     2. READ FILE
  ======================================================== */

  const absolutePath = path.join(repoPath, filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error("File not found.");
  }

  const content = fs.readFileSync(absolutePath, "utf8");

  /* ========================================================
     3. FILE RELATIONSHIPS
  ======================================================== */

  const relations = buildFileRelations(repoPath, filePath);

  /* ========================================================
     4. ARCHITECTURE
  ======================================================== */

  const repositoryContext = architecture
    ? JSON.stringify(architecture.dashboard || architecture, null, 2)
    : "Not Available";

  /* ========================================================
     5. NEARBY FILES
  ======================================================== */

  const folder = path.dirname(absolutePath);

  const nearbyFiles = fs
    .readdirSync(folder)
    .filter((file) => file !== path.basename(filePath))
    .map((file) => path.relative(repoPath, path.join(folder, file)))
    .slice(0, 20);

  /* ========================================================
     6. IMPORTS
  ======================================================== */

  const imports = (
    content.match(
      /(?:import.*?from\s+['"](.*?)['"]|require\(['"](.*?)['"]\))/g
    ) || []
  ).join("\n");

  /* ========================================================
     7. AI PROMPT
  ======================================================== */

  const prompt = `
You are a Principal Software Architect and Senior Code Reviewer.

Analyze ONLY the following repository file.

Focus on:

- Why this file exists
- Its role in the repository
- How it interacts with other files
- Data flow
- Responsibilities
- Maintainability
- Architecture

Avoid discussing syntax, formatting, or code metrics.

FILE PATH

${filePath}

NEARBY FILES

${nearbyFiles.join("\n")}

DETECTED IMPORTS

${imports}

REPOSITORY ARCHITECTURE

${repositoryContext}

FILE RELATIONSHIPS

Imports:
${JSON.stringify(relations.imports, null, 2)}

Imported By:
${JSON.stringify(relations.importedBy, null, 2)}

SOURCE CODE

${content.slice(0, 12000)}

Return ONLY valid JSON.

{
  "purpose": "",
  "summary": "",
  "role": "",
  "responsibilities": [],
  "workflow": [],
  "components": [
    {
      "name": "",
      "description": ""
    }
  ],
  "importantFunctions": [
    {
      "name": "",
      "description": ""
    }
  ],
  "dependencies": [],
  "designPatterns": [],
  "dataFlow": [],
  "risks": [],
  "risk": "",
  "improvements": [],
  "relatedFiles": [],
  "complexity": "",
  "maintainability": "",
  "bestPractices": []
}

Rules:

Purpose:
Explain WHY this file exists.

Summary:
Explain WHAT this file does.

Role:
Classify this file into exactly one category:

- Controller
- Service
- Utility
- Middleware
- React Component
- Hook
- Configuration
- Route
- Model
- Helper

Responsibilities:
List the primary responsibilities.

Workflow:
Explain execution flow through the file.

Components:
List important classes, React components, exported objects or modules.

Important Functions:
List important functions with short explanations.

Dependencies:
Mention imported libraries and why they are used.

Design Patterns:
Mention patterns that are clearly visible.

Data Flow:
Explain how data enters, is processed and leaves.

Related Files:
Mention files this file interacts with based on the provided relationships/imports.

Risks:
Mention architectural or maintainability risks only.

Risk:
Classify the overall architectural/maintainability risk as exactly one of:
- Low
- Medium
- High

Improvements:
Suggest practical improvements.

Complexity:
One sentence.

Maintainability:
One sentence.

Best Practices:
Mention engineering practices already followed.

DO NOT:

- Mention console.log count.
- Mention TODO count.
- Mention loop count.
- Mention if statement count.
- Mention code metrics.
- Invent functions.
- Invent files.

Only use the provided source code.

Return ONLY JSON.
`;

  /* ========================================================
     8. CALL AI
  ======================================================== */

  const result = await generateJSON(prompt);

  /* ========================================================
     9. SAVE RESULT IN SESSION CACHE
  ======================================================== */

  if (repositoryId) {
    const session = getAnalysisSession(repositoryId);

    const existingCache = session?.aiFileExplanations || {};

    updateAnalysisSession(repositoryId, {
      aiFileExplanations: {
        ...existingCache,
        [filePath]: result,
      },
    });

    console.log("💾 Cached AI analysis:", filePath);
  }

  return result;
}

module.exports = {
  explainFile,
};