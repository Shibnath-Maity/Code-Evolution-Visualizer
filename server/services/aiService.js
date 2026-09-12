const GEMINI_API_KEY = process.env.GEMINI_API_KEY_AI;
 GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function askGemini(question) {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini error: GEMINI_API_KEY_AI is not set");
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: question }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini error: ${response.status} - ${errText}`);
  }

  const data = await response.json();

  // Gemini returns candidates[0].content.parts[0].text
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!text) {
    console.warn("Gemini returned empty text. Raw response:", JSON.stringify(data, null, 2));
  }

  return text;
}


// ==========================================
// Repository AI Analysis
// ==========================================

async function analyzeRepository(repositoryData) {
  const prompt = `
You are an AI software engineering assistant inside a Code Evolution Visualizer.

Analyze the following repository data.

Repository statistics:
${JSON.stringify(repositoryData.stats || {}, null, 2)}

Contributors:
${JSON.stringify(repositoryData.contributors || [], null, 2)}

Recent commit history:
${JSON.stringify(repositoryData.timeline?.slice(0, 30) || [], null, 2)}

File changes:
${JSON.stringify(repositoryData.fileChanges?.slice(0, 30) || [], null, 2)}

Respond using EXACTLY these section headers, each on its own line, in this order.
Do not add markdown symbols like ** around the headers. Do not skip a section.

SUMMARY:
<2-3 sentence overview of the repository's overall health and activity>

DEVELOPMENT_ACTIVITY:
<commit frequency, most active periods, contributor activity>

CODE_HEALTH:
<code growth, maintainability signals, anything concerning in the stats>

HOTSPOTS:
<files that change most often, based on file changes data>

COMMIT_QUALITY:
<commit message quality, size of commits, possible automated/bot commits>

RECOMMENDATIONS:
<practical, actionable suggestions for improving the repository>

RISK:
<potential risks or concerns, or "No significant risks identified" if none>

Do not invent information that is not present in the data.
`;

  return await askGemini(prompt);
}

module.exports = {
  askGemini,
  analyzeRepository,
};