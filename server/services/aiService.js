const OLLAMA_URL = "http://localhost:11434";

async function askOllama(question) {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3.2",
      prompt: question,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }

  const data = await response.json();

  return data.response;
}


// ==========================================
// Repository AI Analysis
// ==========================================

async function analyzeRepository(repositoryData) {

  const prompt = `
You are an AI software engineering assistant inside a Code Evolution Visualizer.

Analyze the following repository data.

Repository statistics:
${JSON.stringify(repositoryData.stats, null, 2)}

Contributors:
${JSON.stringify(repositoryData.contributors, null, 2)}

Recent commit history:
${JSON.stringify(repositoryData.timeline?.slice(0, 30), null, 2)}

Give a useful developer-oriented analysis.

Include:

1. Development activity
2. Commit patterns
3. Contributor activity
4. Code growth
5. Possible automated commits
6. Potential concerns
7. Suggestions for improving the repository

Keep the answer clear and practical.
Do not invent information that is not present in the data.
`;

  return await askOllama(prompt);
}


module.exports = {
  askOllama,
  analyzeRepository,
};