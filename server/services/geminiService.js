const { GoogleGenAI } = require("@google/genai");

const MODEL = "gemini-3.1-flash-lite";

const clients = [
  {
    name: "gemini-1",
    ai: new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY_1,
    }),
  },
  {
    name: "gemini-2",
    ai: new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY_2,
    }),
  },
];

async function generate(prompt) {
  let lastError;

  for (const client of clients) {
    try {
      console.log(`Trying ${client.name}...`);

      const response = await client.ai.models.generateContent({
        model: MODEL,
        contents: prompt,
      });

      console.log(`${client.name} succeeded`);

      return response.text;
    } catch (error) {
      lastError = error;

      console.error(`${client.name} failed:`, error.message);

      // Try next Gemini account
    }
  }

  throw lastError;
}

async function generateJSON(prompt) {
  let lastError;

  for (const client of clients) {
    try {
      console.log(`Trying ${client.name} for JSON...`);

      const response = await client.ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text =
        typeof response.text === "function"
          ? response.text()
          : response.text;

      console.log(`${client.name} succeeded`);

      return JSON.parse(text);
    } catch (error) {
      lastError = error;

      console.error(`${client.name} failed:`, error.message);

      // Try next Gemini account
    }
  }

  throw lastError;
}

module.exports = {
  generate,
  generateJSON,
};