const express = require("express");
const router = express.Router();

const { askOllama } = require("../services/aiService");

router.post("/chat", async (req, res) => {
  try {
    const { question, repositoryData } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        error: "Question is required",
      });
    }

    if (!repositoryData) {
      return res.status(400).json({
        error: "Repository data is required",
      });
    }

    const prompt = `
You are the AI Repository Assistant for a Code Evolution Visualizer.

You answer questions using ONLY the repository analytics supplied below.

IMPORTANT:
1. The "hotspots" data represents files that are frequently changed.
2. The "fileChanges" data represents recorded file modifications.
3. If the user asks which file changed the most, inspect hotspots and fileChanges.
4. Do not confuse:
   - most frequently changed file
   - largest single change
   - highest churn
5. If the data supports a direct answer, give it directly.
6. If the data does not support the answer, clearly say so.
7. Never invent statistics or repository information.
Risk interpretation:
- A frequently changed file is a potential hotspot, not automatically a risk.
- A large commit is not automatically a risk.
- Only describe something as a risk when the repository data provides supporting evidence.
- When evidence is weak, use phrases such as "potential concern" or "may warrant review".
- Do not label a contributor as risky simply because they have many commits.
- Do not judge code quality solely from commit frequency.

Repository Statistics:
${JSON.stringify(repositoryData.stats, null, 2)}

Contributors:
${JSON.stringify(repositoryData.contributors, null, 2)}

Timeline:
${JSON.stringify(repositoryData.timeline?.slice(0, 100), null, 2)}

File Changes:
${JSON.stringify(repositoryData.fileChanges?.slice(0, 200), null, 2)}

Hotspots:
${JSON.stringify(repositoryData.hotspots?.slice(0, 100), null, 2)}

Recent Commits:
${JSON.stringify(repositoryData.recentCommits?.slice(0, 20), null, 2)}

All Commits:
${JSON.stringify(repositoryData.allCommits?.slice(0, 100), null, 2)}

User Question:
${question}

Answer the user's question in a clear, developer-friendly way.
IMPORTANT RULES:
- Only use values explicitly present in the repository data.
- Do NOT invent file sizes, change sizes, commit statistics, hashes, dates, or contributor information.
- Do NOT calculate byte sizes, percentages, averages, totals, or other metrics unless they can be directly calculated from the provided data.
- Clearly distinguish between "most frequently changed" and "largest change".
- Use bullet points when useful.
- Mention specific files, contributors, commits, or metrics only when supported by the data.
- If the requested information cannot be determined from the provided data, say:
  "The current repository analysis does not contain enough information to determine that."

RESPONSE QUALITY RULES:
- Prefer exact file names and exact values from the repository data.
- Do not generalize when specific data is available.
- For hotspot questions, report the actual files and their change counts.
- For contributor questions, report the actual contributor and commit count.
- For large-change questions, report additions and deletions when those values exist.
- Do not say ".js files are frequently changed" when individual JavaScript files and their counts are available.
- Do not call something a "risk" simply because it has many commits or changes.
- Explain why a hotspot or large change could be a potential concern.
- Separate FACTS from INTERPRETATION.

When appropriate, structure the response as:

FACTS:
- Specific repository facts.
RISK ANALYSIS RULES:
- A repository fact is NOT automatically a risk.
- Do not classify a commit, file, contributor, README change, or increased activity as a risk without supporting evidence.
- Frequent file changes are a potential hotspot, not proof of a problem.
- Large commits are a potential review concern, not proof of a defect.
- A contributor having many commits is NOT a contributor risk.
- Multiple contributors are NOT automatically a coordination risk.
- README/documentation changes are NOT a code risk.
- Increased commit activity is NOT automatically a risk.
- Only identify a potential risk when there is a reasonable connection between the repository evidence and a possible technical problem.
- If there is insufficient evidence for a risk, explicitly say that no confirmed risk can be determined from the available analytics.
- Never manufacture a risk just to fill the POTENTIAL RISKS section.
- Do not recommend investigating information that is unavailable in the provided repository data unless the user explicitly asks how to obtain that information.
RECOMMENDATIONS:
- Give practical actions based only on the available evidence.`

    const answer = await askOllama(prompt);

    res.json({
      answer,
    });

  } catch (error) {
    console.error("Repository Assistant Error:", error);

    res.status(500).json({
      error: "Failed to get repository assistant response",
    });
  }
});

module.exports = router;