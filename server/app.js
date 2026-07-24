const express = require("express");
const cors = require("cors");

const repositoryRoutes = require("./routes/repository");
const repoRoutes = require("./routes/repo");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/repository", repositoryRoutes);
app.use("/api", repoRoutes); 
app.get("/", (req, res) => {
    res.json({ message: "API Running" });
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});