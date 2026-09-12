const { generateJSON } = require("./geminiService");

// ==========================================
// Normalize file path
// ==========================================

function normalizeFilePath(filePath = "") {
  return String(filePath)
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .trim()
    .toLowerCase();
}

// ==========================================
// Get filename only
// ==========================================

function getFileName(filePath = "") {
  const normalized = normalizeFilePath(filePath);

  return normalized.split("/").pop();
}

// ==========================================
// Find AI insight for hotspot
// ==========================================

function findInsight(insights, hotspot) {
  if (!Array.isArray(insights)) {
    return null;
  }

  const hotspotPath = normalizeFilePath(
    hotspot.file ||
      hotspot.path ||
      hotspot.filePath ||
      ""
  );

  const hotspotName = getFileName(hotspotPath);

  // 1. Exact path match
  let match = insights.find((insight) => {
    const insightPath = normalizeFilePath(
      insight.file ||
        insight.path ||
        insight.filePath ||
        ""
    );

    return (
      insightPath === hotspotPath
    );
  });

  if (match) {
    return match;
  }

  // 2. Filename match
  match = insights.find((insight) => {
    const insightName = getFileName(
      insight.file ||
        insight.path ||
        insight.filePath ||
        ""
    );

    return (
      insightName === hotspotName
    );
  });

  return match || null;
}

// ==========================================
// Generate Hotspot Insights
// ==========================================

async function generateHotspotInsights(hotspots = []) {
  if (!Array.isArray(hotspots) || hotspots.length === 0) {
    console.log(
      "⚠️ No hotspots available for AI analysis."
    );

    return [];
  }

  // Keep only useful hotspot information.
  const hotspotData = hotspots.map((hotspot) => ({
    file:
      hotspot.file ||
      hotspot.path ||
      hotspot.filePath ||
      "Unknown",

    changes:
      Number(hotspot.changes) || 0,

    additions:
      Number(hotspot.additions) || 0,

    deletions:
      Number(hotspot.deletions) || 0,

    commits:
      Number(hotspot.commits) || 0,

    score:
      Number(hotspot.score) || 0,

    contributors:
      Number(hotspot.contributors) || 0,
  }));

  const prompt = `
You are a senior software architect and expert code reviewer.

You are analyzing Git hotspots in a software repository.

A hotspot is a file that has:
- many changes
- many commits
- many additions/deletions
- or involvement from multiple contributors.

Your task is to identify maintenance risk and provide practical recommendations.

IMPORTANT:

Return EXACTLY ONE result for EVERY hotspot file provided.

The "file" field MUST contain the EXACT SAME file path provided in the hotspot data.

Do NOT change:
- slash direction
- directory names
- filename
- file extension

Return ONLY valid JSON.

Required format:

[
  {
    "file": "client/src/pages/Board.jsx",
    "riskLevel": "High",
    "summary": "This file has a high change frequency and should be reviewed for maintainability and architectural complexity.",
    "recommendations": [
      "Review the file for oversized responsibilities.",
      "Consider extracting independent logic into smaller modules.",
      "Add automated tests around frequently changed functionality."
    ],
    "impact": "Changes to this file may affect multiple parts of the application that depend on its UI and state management."
  }
]

Rules:

1. riskLevel MUST be exactly:
   - Low
   - Medium
   - High

2. summary must contain 1-2 concise sentences.

3. recommendations MUST contain exactly 3 practical recommendations.

4. impact must be exactly one concise sentence.

5. Do not invent functionality that is not represented by the hotspot data.

6. Base the risk primarily on:
   - changes
   - additions
   - deletions
   - commits
   - contributors
   - hotspot score

7. High-change files should generally receive higher maintenance priority.

8. Do NOT include Markdown.

9. Do NOT explain your reasoning.

10. Return ONLY the JSON array.

HOTSPOT DATA:

${JSON.stringify(
  hotspotData,
  null,
  2
)}
`;

  try {
    console.log(
      `🤖 Generating AI insights for ${hotspotData.length} hotspots...`
    );

    const aiResult =
      await generateJSON(prompt);

    // ==========================================
    // Validate Gemini response
    // ==========================================

    let insights = aiResult;

    // Sometimes models return:
    // { "hotspots": [...] }
    if (
      !Array.isArray(insights) &&
      Array.isArray(aiResult?.hotspots)
    ) {
      insights = aiResult.hotspots;
    }

    if (!Array.isArray(insights)) {
      console.error(
        "❌ Gemini hotspot response is not an array:",
        aiResult
      );

      return [];
    }

    console.log(
      `✅ Gemini generated ${insights.length} hotspot insights`
    );

    // ==========================================
    // Normalize + match every hotspot
    // ==========================================

    const finalInsights = hotspotData.map(
      (hotspot) => {
        const matchedInsight =
          findInsight(
            insights,
            hotspot
          );

        if (matchedInsight) {
          return {
            file: hotspot.file,

            riskLevel:
              ["Low", "Medium", "High"].includes(
                matchedInsight.riskLevel
              )
                ? matchedInsight.riskLevel
                : "Medium",

            summary:
              matchedInsight.summary ||
              "This file has significant repository activity and should be reviewed for maintainability.",

            recommendations:
              Array.isArray(
                matchedInsight.recommendations
              )
                ? matchedInsight.recommendations
                    .slice(0, 3)
                : [],

            impact:
              matchedInsight.impact ||
              "Changes to this file may affect dependent parts of the repository.",
          };
        }

        // ==========================================
        // Fallback if Gemini didn't return this file
        // ==========================================

        console.warn(
          `⚠️ No AI insight matched: ${hotspot.file}`
        );

        return {
          file: hotspot.file,

          riskLevel:
            hotspot.score >= 70
              ? "High"
              : hotspot.score >= 40
              ? "Medium"
              : "Low",

          summary:
            "This file is frequently changed and should be reviewed for maintainability and potential architectural risk.",

          recommendations: [
            "Review the file for unnecessary complexity.",
            "Consider splitting large responsibilities into smaller modules.",
            "Add or strengthen automated tests around frequently changed functionality.",
          ],

          impact:
            "Changes to this file may affect other parts of the application that depend on it.",
        };
      }
    );

    console.log(
      `✅ Final hotspot insights: ${finalInsights.length}`
    );

    return finalInsights;
  } catch (err) {
    console.error(
      "❌ Hotspot AI Failed:"
    );

    console.error(
      err.message || err
    );

    return [];
  }
}

module.exports = {
  generateHotspotInsights,
};