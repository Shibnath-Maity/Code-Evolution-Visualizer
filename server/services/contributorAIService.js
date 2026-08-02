const gemini = require("./geminiService");

async function askContributor({
  contributorName,
  question,
  allCommits,
}) {
 const commits = (allCommits || [])
  .filter((c) => {
    const author = (c.author_name || "")
      .split("|")[0]
      .trim()
      .toLowerCase();

    const contributor = contributorName
      .split("|")[0]
      .trim()
      .toLowerCase();

    return author === contributor;
  })
  .slice(0, 50);
  console.log("Matched commits:", commits.length);

  if (!commits.length) {
    return "No commits found for this contributor.";
  }

  const commitContext = commits
    .map((commit, index) => `
Commit ${index + 1}
Date: ${commit.date}
Message: ${commit.message || "No message"}
Hash: ${commit.hash || "N/A"}
Files: ${(commit.files || []).join(", ") || "Unknown"}
Additions: ${commit.additions ?? 0}
Deletions: ${commit.deletions ?? 0}
`)
    .join("\n-------------------------\n");

  const prompt = `
You are a Senior Software Engineering Reviewer.

Analyze ONLY the following contributor.

Contributor:
${contributorName}

Commit History:
${commitContext}

User Question:
${question}

Rules:
- Answer only from the commit history.
- Do not invent information.
- Keep the answer concise.
- Use bullet points where appropriate.
- Mention important commits if relevant.
`;

  return await gemini.generate(prompt);
}

module.exports = {
  askContributor,
};