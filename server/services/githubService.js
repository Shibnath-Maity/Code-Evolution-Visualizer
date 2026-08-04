
const axios = require("axios");
 
const BASE_URL = "https://api.github.com";
 
const headers = process.env.GITHUB_TOKEN
  ? {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
    }
  : {
      Accept: "application/vnd.github+json",
    };
 
// ==========================================
// Repository Info
// ==========================================
async function getRepositoryInfo(repoUrl) {
  try {
    const cleanedUrl = repoUrl.replace(".git", "");
    const parts = cleanedUrl.split("/");
 
    const owner = parts[3];
    const repo = parts[4];
 
    const response = await axios.get(
      `${BASE_URL}/repos/${owner}/${repo}`,
      { headers }
    );
 
    const data = response.data;
 
    return {
      owner,
      repo,
      name: data.name,
      description: data.description,
      language: data.language,
      stars: data.stargazers_count,
      forks: data.forks_count,
      avatarUrl: data.owner.avatar_url,
      htmlUrl: data.html_url,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    throw new Error("Unable to fetch repository information.");
  }
}
 
// ==========================================
// Get Repository Issues
// ==========================================
async function getRepositoryIssues(owner, repo, state = "open") {
  try {
    const response = await axios.get(
      `${BASE_URL}/repos/${owner}/${repo}/issues`,
      {
        headers,
        params: {
          state,
          per_page: 50,
        },
      }
    );
 
    return response.data
      .filter((issue) => !issue.pull_request)
      .map((issue) => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        body: issue.body,
        state: issue.state,
        comments: issue.comments,
        labels: issue.labels.map((l) => l.name),
        author: issue.user.login,
        url: issue.html_url,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
      }));
  } catch (err) {
    if (err.response?.status === 404) {
      throw new Error("Repository not found — check the owner/repo name.");
    }
    if (err.response?.status === 403) {
      throw new Error(
        "GitHub API rate limit hit. Add a GITHUB_TOKEN to your .env to raise the limit."
      );
    }
    throw new Error("Unable to fetch repository issues.");
  }
}
 
// ==========================================
// Get Single Issue + Comments
// ==========================================
async function getRepositoryIssue(owner, repo, issueNumber) {
  try {
    const issueResponse = await axios.get(
      `${BASE_URL}/repos/${owner}/${repo}/issues/${issueNumber}`,
      { headers }
    );
 
    const commentsResponse = await axios.get(
      `${BASE_URL}/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
      { headers }
    );
 
    const issue = issueResponse.data;
 
    return {
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body || "",
      state: issue.state,
      labels: issue.labels.map((l) => l.name),
      author: issue.user.login,
      url: issue.html_url,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      comments: commentsResponse.data.map((comment) => ({
        author: comment.user.login,
        body: comment.body,
        createdAt: comment.created_at,
      })),
    };
  } catch (err) {
    if (err.response?.status === 404) {
      throw new Error("Issue not found.");
    }
    if (err.response?.status === 403) {
      throw new Error(
        "GitHub API rate limit hit. Add a GITHUB_TOKEN to your .env to raise the limit."
      );
    }
    throw new Error("Unable to fetch issue details.");
  }
}
 
module.exports = {
  getRepositoryInfo,
  getRepositoryIssues,
  getRepositoryIssue,
};
 
