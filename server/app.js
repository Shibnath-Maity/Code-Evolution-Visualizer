const express = require("express");
const cors = require("cors");

const repositoryRoutes = require("./routes/repository");
const repoRoutes = require("./routes/repo");
const aiRoutes = require("./routes/ai");
const assistantRoutes = require("./routes/assistant");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/repository", repositoryRoutes);
app.use("/api", repoRoutes);
app.use("/ai", aiRoutes);
app.use("/assistant", assistantRoutes);
// Test Route
app.get("/", (req, res) => {
  res.json({
    message: "API Running",
  });
});

// Start Server
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});