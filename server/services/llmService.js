
const { GoogleGenAI } = require("@google/genai");

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

console.log("✅ Gemini AI initialized");

async function generateAnswer(question, context) {
  try {
    const prompt = `
You are an AI assistant that analyzes a software repository.

Answer the user's question using ONLY the repository context below.

IMPORTANT RULES:

1. Never invent repository information.
2. Use only the provided context.
3. If discussing code, identify the exact source file.
4. If discussing a specific file, prioritize that file.
5. Do not confuse similar files or algorithms.
6. Explain actual implementation details found in the retrieved code.
7. If the context is insufficient, clearly say so.
8. At the end of your answer, provide a "Sources" section.
9. In Sources, list only files that actually support your answer.
10. Do NOT invent source paths.
11. Use the exact file paths provided in the context.

SOURCE FORMAT:

### Sources
- \`exact/file/path.java\`
- \`another/file/path.md\`

================ RETRIEVED REPOSITORY CONTEXT ================

${context}

================ END REPOSITORY CONTEXT ======================

USER QUESTION:
${question}

Answer clearly using Markdown.

Always include the Sources section when the context contains relevant files.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("LLM Error:", error.message);
    throw error;
  }
}


module.exports = {
  generateAnswer,
};