const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Keep the AI request comfortably below Groq's TPM limit.
const MAX_FILE_CHARS = 8000;

function prepareFileContent(content = "") {
  if (content.length <= MAX_FILE_CHARS) {
    return content;
  }

  return (
    content.slice(0, MAX_FILE_CHARS) +
    "\n\n[FILE CONTENT TRUNCATED FOR AI ANALYSIS]"
  );
}

function normalizeAIResult(result) {
  return {
    purpose:
      result?.purpose ||
      result?.summary ||
      "Unable to determine the purpose of this file.",

    role: result?.role || "Unknown",

    summary:
      result?.summary ||
      result?.purpose ||
      "No summary available.",

    responsibilities: Array.isArray(result?.responsibilities)
      ? result.responsibilities
      : [],

    workflow: Array.isArray(result?.workflow)
      ? result.workflow
      : [],

    components: Array.isArray(result?.components)
      ? result.components
      : [],

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

    risks: Array.isArray(result?.risks)
      ? result.risks
      : [],

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

/**
 * Analyzes a single file on-demand when requested by the user.
 */
async function analyzeFileWithAI(file) {
  try {
    const content = prepareFileContent(file.content);

    const prompt = `
You are a Senior Software Architect.

Analyze the following source file.

Return ONLY valid JSON with this exact structure:

{
  "purpose": "Short explanation of the file's purpose",
  "role": "The role this file plays in the module/repository",
  "summary": "Clear summary of what the file does",
  "responsibilities": [
    "Responsibility 1",
    "Responsibility 2"
  ],
  "workflow": [
    "Step 1",
    "Step 2"
  ],
  "components": [
    {
      "name": "Component or Module Name",
      "description": "Short explanation"
    }
  ],
  "importantFunctions": [
    {
      "name": "functionName",
      "description": "What it does"
    }
  ],
  "dependencies": [
    "dependency1",
    "dependency2"
  ],
  "designPatterns": [
    "Pattern or architectural approach"
  ],
  "dataFlow": [
    "Input/Output transformation step 1"
  ],
  "risks": [
    "Potential edge case or flaw"
  ],
  "relatedFiles": [
    "Related file path"
  ],
  "complexity": "Low|Medium|High",
  "maintainability": "Excellent|Good|Fair|Poor",
  "bestPractices": [
    "Best practice observed"
  ],
  "improvements": [
    "Suggested improvement 1"
  ]
}

Rules:
- Base answers ONLY on the provided file content.
- If a field is not applicable, return an empty array [] or a neutral string like "N/A".
- Do not invent functions or classes that do not exist in the code.
- Keep descriptions concise and developer-focused.

Filename:
${file.name}

Path:
${file.path}

Code:
${content}
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 1500,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content:
            "You are an expert software architect. Return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const raw = response.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);

    return normalizeAIResult(parsed);
  } catch (err) {
    console.error("❌ AI File Analysis Error:", err.message);

    return normalizeAIResult({
      purpose: "Unable to analyze file",
      role: "Unknown",
      summary: "AI analysis failed.",
      risks: [err.message],
    });
  }
}

module.exports = {
  analyzeFileWithAI,
};