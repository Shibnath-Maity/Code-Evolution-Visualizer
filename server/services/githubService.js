const axios = require("axios");

async function getRepositoryInfo(repoUrl) {
  try {
    // Example:
    // https://github.com/Shibnath-Maity/code-evolution-visualizer.git

    const cleanedUrl = repoUrl.replace(".git", "");
    const parts = cleanedUrl.split("/");

    const owner = parts[3];
    const repo = parts[4];

    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`
    );

    const data = response.data;

    return {
      name: data.name,
      owner: data.owner.login,
      description: data.description || "No description available",
      language: data.language || "Unknown",
      stars: data.stargazers_count,
      forks: data.forks_count,
      updatedAt: new Date(data.updated_at).toLocaleDateString(),
      avatarUrl: data.owner.avatar_url,
      htmlUrl: data.html_url,
    };
  } catch (error) {
    console.error("GitHub API Error:", error.message);
    throw new Error("Unable to fetch repository information.");
  }
}

module.exports = {
  getRepositoryInfo,
};