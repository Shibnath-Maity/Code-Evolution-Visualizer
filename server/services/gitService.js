const simpleGit = require("simple-git");
const path = require("path");


async function cloneRepository(repoUrl) {

    const git = simpleGit();

    const repoName = repoUrl
        .split("/")
        .pop()
        .replace(".git", "");

    const repoPath = path.join(
        __dirname,
        "../repositories",
        repoName
    );

    await git.clone(repoUrl, repoPath);

    return repoPath;
}


async function getCommits(repoPath) {

    const git = simpleGit(repoPath);

    const log = await git.log();

    return log.all;
}


async function getContributors(repoPath){

    const git = simpleGit(repoPath);

    const log = await git.log();

    const contributors = {};

    log.all.forEach(commit => {

        const author = commit.author_name;

        if(contributors[author]){
            contributors[author]++;
        }
        else{
            contributors[author] = 1;
        }

    });


    return contributors;
}
async function getCommitStats(repoPath){

    const git = simpleGit(repoPath);

    const log = await git.log();

    return {
        totalCommits: log.total,
        firstCommit: log.all[log.all.length - 1].date,
        latestCommit: log.all[0].date
    };

}
module.exports = {
    cloneRepository,
    getCommits,
    getContributors,
    getCommitStats
};