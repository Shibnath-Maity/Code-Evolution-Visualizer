const { Type } = require("@google/genai");
const aiGateway = require("./ai/aiGateway");

// ==========================================
// File limits
// ==========================================

// Keep individual file requests reasonably sized.
const MAX_FILE_CHARS = 12000;

// ==========================================
// Prepare file content
// ==========================================

function prepareFileContent(content = "") {
  if (typeof content !== "string") {
    return "";
  }

  if (content.length <= MAX_FILE_CHARS) {
    return content;
  }

  return (
    content.slice(0, MAX_FILE_CHARS) +
    "\n\n[FILE CONTENT TRUNCATED FOR AI ANALYSIS]"
  );
}

// ==========================================
// Normalize AI result
// ==========================================

function normalizeAIResult(result) {
  return {
    purpose:
      result?.purpose ||
      result?.summary ||
      "Unable to determine the purpose of this file.",

    role: result?.role || "Unknown",

    summary:
      result?.summary || result?.purpose || "No summary available.",

    responsibilities: Array.isArray(result?.responsibilities)
      ? result.responsibilities
      : [],

    workflow: Array.isArray(result?.workflow) ? result.workflow : [],

    components: Array.isArray(result?.components) ? result.components : [],

    importantFunctions: Array.isArray(result?.importantFunctions)
      ? result.importantFunctions
      : [],

    dependencies: Array.isArray(result?.dependencies)
      ? result.dependencies
      : [],

    designPatterns: Array.isArray(result?.designPatterns)
      ? result.designPatterns
      : [],

    dataFlow: Array.isArray(result?.dataFlow)
      ? result.dataFlow
      : typeof result?.dataFlow === "string"
      ? [result.dataFlow]
      : [],

    risks: Array.isArray(result?.risks) ? result.risks : [],

    relatedFiles: Array.isArray(result?.relatedFiles)
      ? result.relatedFiles
      : [],

    complexity: result?.complexity || "Medium",

    maintainability: result?.maintainability || "Good",

    bestPractices: Array.isArray(result?.bestPractices)
      ? result.bestPractices
      : [],

    improvements: Array.isArray(result?.improvements)
      ? result.improvements
      : [],
  };
}

// ==========================================
// Gemini JSON Schema
// ==========================================

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    purpose: {
      type: Type.STRING,
      description: "Short explanation of the file's purpose.",
    },
    role: {
      type: Type.STRING,
      description: "The role this file plays in the repository.",
    },
    summary: {
      type: Type.STRING,
      description: "Clear technical summary of the file.",
    },
    responsibilities: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    workflow: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    components: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["name", "description"],
      },
    },
    importantFunctions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["name", "description"],
      },
    },
    dependencies: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    designPatterns: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    dataFlow: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    risks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    relatedFiles: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    complexity: {
      type: Type.STRING,
      enum: ["Low", "Medium", "High"],
    },
    maintainability: {
      type: Type.STRING,
      enum: ["Excellent", "Good", "Fair", "Poor"],
    },
    bestPractices: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    improvements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    "purpose",
    "role",
    "summary",
    "responsibilities",
    "workflow",
    "components",
    "importantFunctions",
    "dependencies",
    "designPatterns",
    "dataFlow",
    "risks",
    "relatedFiles",
    "complexity",
    "maintainability",
    "bestPractices",
    "improvements",
  ],
};

// ==========================================
// Analyze Single File
// ==========================================

async function analyzeFileWithAI(file) {
  try {
    // ========================================
    // Validate file
    // ========================================

    if (!file) {
      throw new Error("File information is required.");
    }

    if (!file.content) {
      throw new Error("File content is empty.");
    }

    // ========================================
    // Prepare file information
    // ========================================

    const content = prepareFileContent(file.content);
    const fileName = file.name || "Unknown file";
    const filePath = file.path || fileName;

    // ========================================
    // Prompt
    // ========================================

    const prompt = `
You are a Senior Software Architect performing
a focused source-code analysis.

Analyze ONLY the source file provided below.

Your goal is to help a developer understand this
file inside an existing software repository.

IMPORTANT RULES:

1. Base your analysis ONLY on the provided source code.
2. Never invent: functions, classes, components, dependencies, files, APIs, architecture, or behavior.
3. Only mention a function if it actually appears in the provided source code.
4. Only mention dependencies that are actually imported, required, referenced, or clearly used.
5. Do not assume how another file works.
6. If something cannot be determined from this file, return "N/A" or [].
7. Keep the explanation concise and developer-focused.
8. The purpose should explain WHY this file exists.
9. The role should explain WHERE this file fits within the application.
10. Responsibilities should describe actual work performed by this file.
11. Workflow should describe the actual execution flow visible from this file.
12. Components should include actual React components, classes, modules, or important objects present in the code.
13. importantFunctions should contain actual functions or methods found in the source code.
14. dependencies should contain actual dependencies.
15. dataFlow should explain actual input/output transformations visible in the code.
16. risks should only be included when there is evidence in the source code.
17. relatedFiles should ONLY include files that are explicitly referenced/imported or whose path is directly visible from the source code.
18. Do not invent related files.
19. complexity should reflect the actual code.
20. maintainability should reflect the actual code.
21. bestPractices should mention practices actually visible in the source code.
22. improvements should be practical improvements based on the provided code.
23. Do not analyze code that was not provided.
24. Do not provide markdown.
25. Return the required JSON structure only.

----------------------------------------
FILE INFORMATION
----------------------------------------

Filename:
${fileName}

Path:
${filePath}

----------------------------------------
SOURCE CODE
----------------------------------------

${content}

----------------------------------------
END SOURCE CODE
----------------------------------------
`;

    console.log(`🤖 AI Gateway analyzing file: ${filePath}`);
    const startTime = Date.now();

    // ========================================
    // AI Gateway Request
    // ========================================

    const result = await aiGateway.generateJSON(prompt, {
      temperature: 0.2,
      maxOutputTokens: 2000,
      responseSchema,
    });

    const elapsed = Date.now() - startTime;

    console.log(`⏱️ AI response time: ${elapsed}ms`);
    console.log(
      `🤖 File Analysis AI → ${result.provider} → ${result.model}`
    );

    const parsed = result.data;

    // ========================================
    // Normalize result
    // ========================================

    const normalizedResult = normalizeAIResult(parsed);
    console.log(`✅ File analysis completed: ${filePath}`);

    return normalizedResult;
  } catch (err) {
    // ========================================
    // Error handling
    // ========================================

    console.error("❌ File Analysis Error:", err?.message || err);

    return normalizeAIResult({
      purpose: "Unable to analyze file",
      role: "Unknown",
      summary: "AI analysis failed.",
      responsibilities: [],
      workflow: [],
      components: [],
      importantFunctions: [],
      dependencies: [],
      designPatterns: [],
      dataFlow: [],
      risks: [err?.message || "Unknown Gateway error"],
      relatedFiles: [],
      complexity: "Medium",
      maintainability: "Fair",
      bestPractices: [],
      improvements: [],
    });
  }
}

// ==========================================
// Exports
// ==========================================

module.exports = {
  analyzeFileWithAI,
};