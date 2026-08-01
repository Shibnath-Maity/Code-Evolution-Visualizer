require("dotenv").config();
const express = require("express");
const cors = require("cors");

const repositoryRoutes = require("./routes/repository");
const repoRoutes = require("./routes/repo");
const aiRoutes = require("./routes/ai");
const assistantRoutes = require("./routes/assistant");
const qaRoutes = require("./routes/qa");
const debugRoutes = require("./routes/debug");
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

app.get("/", (req, res) => {
  res.json({
    message: "API Running",
  });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});