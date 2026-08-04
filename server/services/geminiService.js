const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL =  "gemini-3.1-flash-lite"

async function generate(prompt) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  return response.text;
}

async function generateJSON(prompt) {
  try {
    const response = await ai.models.generateContent({
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

    console.log("Gemini Response:", text);

    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Error:");
    console.error(error);

    if (error.response) {
      console.error(error.response);
    }

    throw error;
  }
}

module.exports = {
  generate,
  generateJSON,
};