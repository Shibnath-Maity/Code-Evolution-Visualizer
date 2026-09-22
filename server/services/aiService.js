const aiGateway = require("./ai/aiGateway");

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

  const result = await aiGateway.generate(prompt, {
    temperature: 0.2,
    maxOutputTokens: 1500,
  });

  console.log(
    `🤖 Repository Analysis AI → ${result.provider} → ${result.model}`
  );

  return result.content;
}

module.exports = {
  analyzeRepository,
};