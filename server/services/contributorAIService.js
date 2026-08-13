const gemini = require("./geminiService");

/**
 * Normalizes contributor names for consistent matching.
 * Handles pipe-separated emails/handles (e.g. "Jane Doe | jane@example.com").
 */
function normalizeContributorName(value) {
  return String(value || "")
    .split("|")[0]
    .trim()
    .toLowerCase();
}

async function askContributor({
  contributorName,
  question,
  allCommits,
}) {
  const selectedContributor = normalizeContributorName(contributorName);

  // Filter commits matching the selected contributor name
  const commits = (allCommits || [])
    .filter((c) => {
      const author = normalizeContributorName(
        c.author_name || c.author || c.committer_name || c.committer || c.name
      );

      return author === selectedContributor;
    })
    .slice(0, 50); // Cap at 50 commits to prevent prompt context bloat

  console.log(
    `🤖 Contributor AI: "${contributorName}" → Matched ${commits.length} commits`
  );

  if (!commits.length) {
    return `No commit history was found for ${contributorName}.`;
  }

  // Format context cleanly for the prompt
  const commitContext = commits
    .map(
      (commit, index) => `
Commit ${index + 1}
Date: ${commit.date || "Unknown"}
Message: ${commit.message || "No message"}
Hash: ${commit.hash || commit.sha || "N/A"}
Files: ${
        (commit.files || commit.changedFiles || [])
          .map((f) => (typeof f === "string" ? f : f?.path || ""))
          .filter(Boolean)
          .join(", ") || "Unknown"
      }
Additions: ${commit.additions ?? 0}
Deletions: ${commit.deletions ?? 0}`
    )
    .join("\n-------------------------\n");

  const prompt = `
You are a Senior Software Engineering Reviewer analyzing ONE SPECIFIC CONTRIBUTOR.

SELECTED CONTRIBUTOR: ${contributorName}

IMPORTANT:
Only analyze commits belonging to "${contributorName}".

COMMIT HISTORY:
${commitContext}

USER QUESTION:
${question}

RULES:
- Answer ONLY using the provided commit history.
- Do NOT mix information from other contributors.
- Do NOT invent technologies, responsibilities, skills, or achievements.
- Base all conclusions on actual commit messages, modified files, additions, and deletions.
- If the commit history does not provide enough evidence to answer fully, explicitly state that limit.
- Mention specific commit messages or modified files when useful.
- Keep the answer concise, actionable, and structured with clear headings and bullet points.
`;

  try {
    const answer = await gemini.generate(prompt);
    console.log(`✅ Contributor AI response successfully generated for: ${contributorName}`);
    return answer;
  } catch (error) {
    console.error(`❌ Contributor AI failed for ${contributorName}:`, error.message);
    throw error;
  }
}

module.exports = {
  askContributor,
};