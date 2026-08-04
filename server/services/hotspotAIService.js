const { generateJSON } = require("./geminiService");

async function generateHotspotInsights(hotspots) {
  const prompt = `
You are a senior software architect and code reviewer.

Analyze the repository hotspot files.

A hotspot is a file that has been modified frequently or by multiple contributors.
Use the provided Git statistics to determine the risk and maintenance priority.

For EACH hotspot return exactly one JSON object.

Return ONLY valid JSON in this format:

[
  {
    "file": "src/App.jsx",
    "riskLevel": "Low",
    "summary": "Short explanation of why this file is a hotspot.",
    "recommendations": [
      "Recommendation 1",
      "Recommendation 2",
      "Recommendation 3"
    ],
    "impact": "What parts of the project may be affected."
  }
]

Rules:
- riskLevel must be only Low, Medium, or High.
- summary should be 1-2 sentences.
- recommendations must contain exactly 3 items.
- impact should be a single sentence.
- Do not include markdown.
- Do not explain your reasoning.
- Return ONLY JSON.

Hotspot Data:

${JSON.stringify(hotspots, null, 2)}
`;

  try {
    return await generateJSON(prompt);
} catch (err) {
    console.error("Hotspot AI Failed:");
    console.error(err);

    return [];
}
}

module.exports = {
  generateHotspotInsights,
};