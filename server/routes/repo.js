const express = require("express");
const axios = require("axios");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/repo-info", protect, async (req, res) => {
  try {
    const { url } = req.query;

    if (typeof url !== "string" || !url.trim()) {
      return res.status(400).json({ error: "url query param is required" });
    }

    const match = url.match(/github\.com\/([^/]+)\/([^/.]+)/);

    if (!match) {
      return res.status(400).json({ error: "Invalid GitHub URL" });
    }

    const owner = match[1];
    const repo = match[2];

    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`
    );

    const data = response.data;

    res.json({
        id: data.id,   
      ownerAvatar: data.owner.avatar_url,
      owner: data.owner.login,
      name: data.name,
      description: data.description,
      stars: data.stargazers_count,
      forks: data.forks_count,
      language: data.language,
      defaultBranch: data.default_branch,
      license: data.license?.name || "None",
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: "Repository not found" });
    }

    if (err.response?.status === 403) {
      return res.status(503).json({
        error: "GitHub API rate limit exceeded. Please try again later.",
      });
    }

    console.error("❌ Repo Info Error:", err.message);

    res.status(500).json({
      error: "Failed to fetch repository info",
    });
  }
});

module.exports = router;