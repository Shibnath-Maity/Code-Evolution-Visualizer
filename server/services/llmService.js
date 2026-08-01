const Groq = require("groq-sdk");

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is missing");
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.1-8b-instant"
// Other good options:
// "openai/gpt-oss-120b"
// "deepseek-r1-distill-llama-70b"

const TEMPERATURE = 0.2;
const MAX_TOKENS = 2048;

async function generateAnswer(question, context) {
  const systemPrompt = `
You are a senior software engineer.

Answer ONLY using the provided repository context.

Never invent files.

Never invent functions.

Never invent architecture.

If the answer is unavailable, reply:

"This information is not available in the indexed repository."

Always answer in Markdown.

Always finish with

### Sources

listing only files found in the context.
`;

  const userPrompt = `
================ Repository Context ================

${context}

====================================================

User Question:

${question}
`;

  try {
    const response = await groq.chat.completions.create({
      model: MODEL,

      temperature: TEMPERATURE,

      max_completion_tokens: MAX_TOKENS,

      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    return response.choices[0].message.content;
  } catch (err) {
    console.error("Groq Error:", err);

    throw err;
  }
}

async function generateJSON(prompt) {
  try {
    const response = await groq.chat.completions.create({
      model: MODEL,

      temperature: 0,

      max_completion_tokens: MAX_TOKENS,

      messages: [
        {
          role: "system",
          content: `
You are an expert software debugging assistant.

Return ONLY valid JSON.

Do not wrap the JSON in markdown.

Do not use \`\`\`json.

Return only the JSON object.
`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    let content = response.choices[0].message.content.trim();

    // Remove markdown fences if the model adds them
    content = content
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();

    return JSON.parse(content);
  } catch (err) {
    console.error("Groq JSON Error:", err);
    throw err;
  }
}

module.exports = {
  generateAnswer,
   generateJSON,
};