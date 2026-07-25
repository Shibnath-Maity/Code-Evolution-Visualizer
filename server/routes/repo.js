const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/repo-info", async (req, res) => {
  try {
    const { url } = req.query;

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
    res.status(500).json({
      error: "Failed to fetch repository info",
    });
  }
});

module.exports = router;