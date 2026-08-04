require("dotenv").config();
console.log("GitHub Token Loaded:", !!process.env.GITHUB_TOKEN);
const express = require("express");
const cors = require("cors");

const repositoryRoutes = require("./routes/repository");
const repoRoutes = require("./routes/repo");
const aiRoutes = require("./routes/ai");
const assistantRoutes = require("./routes/assistant");
const qaRoutes = require("./routes/qa");
const debugRoutes = require("./routes/debug");
const contributorRoute = require("./routes/contributor");
const app = express();

app.use(cors());
app.use(express.json());

app.use("/repository", repositoryRoutes);
app.use("/api", repoRoutes);
app.use("/ai", aiRoutes);
app.use("/assistant", assistantRoutes);

app.use("/repository", debugRoutes);
// QA routes
app.use("/api/qa", qaRoutes);
app.use("/api/contributor", contributorRoute);
app.get("/", (req, res) => {
  res.json({
    message: "API Running",
  });
});

const PORT = 5000;

const {
  getRepositoryInfo,
  getRepositoryIssues,
} = require("./services/githubService");

app.get("/test-issues", async (req, res) => {
  try {
    const repoUrl = "https://github.com/facebook/react";

    const repo = await getRepositoryInfo(repoUrl);

    const issues = await getRepositoryIssues(repo.owner, repo.repo);

    res.json({
      repository: repo.name,
      issueCount: issues.length,
      firstIssue: issues[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});