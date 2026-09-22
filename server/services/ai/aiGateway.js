const groqProvider = require("./providers/groqProvider");
const geminiProvider = require("./providers/geminiProvider");

// Provider order
const PROVIDER_ORDER = [
  "groq",
  "gemini",
];

async function generate(prompt, options = {}) {
  let lastError;

  const messages = options.messages || [
    ...(options.systemInstruction
      ? [
          {
            role: "system",
            content: options.systemInstruction,
          },
        ]
      : []),
    {
      role: "user",
      content: prompt,
    },
  ];

  const providerOptions = {
    ...options,
    messages,
  };

  for (const provider of PROVIDER_ORDER) {
    try {
      console.log(`\n🔄 AI Gateway → ${provider}`);

      let result;

      if (provider === "groq") {
        result = await groqProvider.generate(
          prompt,
          providerOptions
        );
      }

      if (provider === "gemini") {
        result = await geminiProvider.generate(
          prompt,
          providerOptions
        );
      }

      if (result) {
        console.log(
          `✅ AI Gateway → ${result.provider} → ${result.model}`
        );

        return result;
      }
    } catch (error) {
      lastError = error;

      console.error(
        `❌ AI Gateway → ${provider} failed:`,
        error.message
      );

      console.log("➡️ Trying next provider...");
    }
  }

  console.error("❌ All AI providers failed");

  throw lastError || new Error("All AI providers failed");
}

async function generateJSON(prompt, options = {}) {
  const jsonType = options.jsonType || "object";

  const result = await generate(prompt, {
    ...options,

    responseFormat:
      jsonType === "array"
        ? undefined
        : { type: "json_object" },

    responseMimeType: "application/json",
  });

  try {
    return {
      ...result,
      data: JSON.parse(result.content),
    };
  } catch (error) {
    console.error("❌ AI returned invalid JSON");

    throw new Error("AI returned invalid JSON");
  }
}

module.exports = {
  generate,
  generateJSON,
};