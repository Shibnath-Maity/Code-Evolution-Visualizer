const fs = require("fs");
const path = require("path");

const { generateJSON } = require("./llmService");
const {
  buildFileRelations,
} = require("./fileDependencyService");
/* ==========================================================
   AI FILE EXPLANATION
========================================================== */

async function explainFile(
    repoPath,
    filePath,
    architecture = null
) {

  const absolutePath = path.join(
    repoPath,
    filePath
  );

  if (!fs.existsSync(absolutePath)) {
    throw new Error("File not found.");
  }


const content = fs.readFileSync(
  absolutePath,
  "utf8"
);

const relations =
  buildFileRelations(
    repoPath,
    filePath
  );

const architectureSummary = architecture
  ? JSON.stringify(
      architecture.dashboard,
      null,
      2
    )
  : "Not available";
// Get folder of current file
const folder = path.dirname(absolutePath);

// Files in same folder
const nearbyFiles = fs
  .readdirSync(folder)
  .filter(file => file !== path.basename(filePath))
  .map(file =>
    path.relative(
      repoPath,
      path.join(folder, file)
    )
  )
  .slice(0, 20);

// Extract imports
const imports = (
  content.match(
    /(?:import.*?from\s+['"](.*?)['"]|require\(['"](.*?)['"]\))/g
  ) || []
).join("\n");

const repositoryContext = architecture
  ? JSON.stringify(
      architecture.dashboard || architecture,
      null,
      2
    )
  : "Not Available";

 const prompt = `
You are a Principal Software Architect and Senior Code Reviewer.

Analyze the following repository file as a Principal Software Architect.

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

Imports

${JSON.stringify(relations.imports, null, 2)}

Imported By

${JSON.stringify(relations.importedBy, null, 2)}

SOURCE CODE

${content}

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
  "improvements": [],
  "relatedFiles": [],
  "complexity": "",
  "maintainability": "",
  "bestPractices": []
}

Rules:

Purpose
- Explain WHY this file exists.

Summary
- Explain WHAT this file does.

Role

Classify this file into exactly one category.

Possible values:

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

Return only the best matching role.

Responsibilities
- List the primary responsibilities of this file.

Workflow
- Explain how execution flows through the file from top to bottom.

Components
- List important classes, React components, exported objects or modules.

Important Functions
- List the important functions with a short explanation of each.

Dependencies
- Mention imported libraries and explain why they are used.

Design Patterns
- Mention patterns used such as MVC, Factory, Singleton, Repository, Hook, Service Layer, Observer, etc.
- If none are obvious, return an empty array.

Data Flow
- Explain how data enters, is processed, and leaves this file.

Related Files
- Mention files that this file is likely to interact with based on imports.

Risks
- Mention architectural or maintainability risks only.
- Ignore console.log, TODO comments, loop count, and metric counts.

Improvements
- Suggest practical improvements that would make the code cleaner or easier to maintain.

Complexity
- Return one sentence describing the overall complexity.

Maintainability
- Return one sentence describing how maintainable the file is.

Best Practices
- Mention engineering best practices already followed by this file.

Do NOT:
- Mention console.log count.
- Mention TODO count.
- Mention loop count.
- Mention if statement count.
- Mention code metrics.
- Invent functions or files that do not exist.

Only use the provided source code.
Return ONLY JSON.
`;

  return await generateJSON(prompt);
}

module.exports = {
  explainFile,
};