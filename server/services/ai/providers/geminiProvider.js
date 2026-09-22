const { GoogleGenAI } = require("@google/genai");

const clients = [
  {
    name: "gemini-1",
    client: new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY_1,
    }),
  },
  {
    name: "gemini-2",
    client: new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY_2,
    }),
  },
];

const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

async function generate(prompt, options = {}) {
  let lastError;

  for (const provider of clients) {
    try {
      console.log(`🤖 Trying ${provider.name}`);

    const config = {};

if (options.responseMimeType) {
  config.responseMimeType = options.responseMimeType;
}

if (options.maxOutputTokens) {
  config.maxOutputTokens = options.maxOutputTokens;
}

if (options.responseSchema) {
  config.responseSchema = options.responseSchema;
}

      const response = await provider.client.models.generateContent({
        model: options.model || MODEL,
        contents: prompt,
        config,
      });

      const content =
        typeof response.text === "function"
          ? response.text()
          : response.text;

      if (!content) {
        throw new Error(`${provider.name} returned empty response`);
      }

      console.log(`✅ ${provider.name} succeeded`);

      return {
        content,
        provider: provider.name,
        model: options.model || MODEL,
      };
    } catch (error) {
      lastError = error;

      console.error(`❌ ${provider.name} failed:`, error.message);
    }
  }

  throw lastError;
}

module.exports = {
  generate,
};