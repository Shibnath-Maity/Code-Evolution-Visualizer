const Groq = require("groq-sdk");

const clients = [
  {
    name: "groq-1",
    client: new Groq({
      apiKey: process.env.GROQ_API_KEY_1,
    }),
  },
  {
    name: "groq-2",
    client: new Groq({
      apiKey: process.env.GROQ_API_KEY_2,
    }),
  },
];

const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

async function generate(prompt, options = {}) {
  let lastError;

  for (const provider of clients) {
    try {
      console.log(`🤖 Trying ${provider.name}`);

      const response = await provider.client.chat.completions.create({
        model: options.model || MODEL,
        temperature: options.temperature ?? 0.2,
        response_format: options.responseFormat,
        messages: options.messages || [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = response.choices?.[0]?.message?.content;

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