const express = require("express");
const router = express.Router();
const {
    cloneRepository,
    getCommits,
    getContributors,
    getCommitStats
} = require("../services/gitService");
const { createTimeline } = require("../services/analyticsService");
const { getFileChanges } = require("../services/fileAnalyticsService");
const { calculateHotspots } = require("../services/hotspotService");
router.get("/info", (req, res) => {
    res.json({
        name: "Code Evalution Visualize",
        owner: "Shibnath Maity",
        "contributors": 5,
        "stars": 100

    });
});
router.post("/analytics", async(req,res)=>{

    try{

        const {url}=req.body;


        const repoPath = await cloneRepository(url);


        const commits = await getCommits(repoPath);

        const contributors = await getContributors(repoPath);

        const stats = await getCommitStats(repoPath);
        const timeline = createTimeline(commits);

const fileChanges = await getFileChanges(repoPath);
const hotspots = calculateHotspots(
    fileChanges,
    contributors
);

res.json({

    stats,

    contributors,

    timeline,

    fileChanges,

    hotspots,

    recentCommits: commits.slice(0,5)

});

    }
    catch(error){

        res.status(500).json({
            message:error.message
        });

    }

});
 
module.exports = router;