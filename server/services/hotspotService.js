function calculateHotspots(fileChanges, contributors){

    const hotspots = [];


    fileChanges.forEach(file => {

        const fileName = file.file;

        const changes = file.changes;


        let contributorCount = 0;


        if(contributors[fileName]){
            contributorCount = contributors[fileName];
        }


        const score =
            (changes * 0.6) +
            (contributorCount * 0.4);



        let risk = "LOW";


        if(score > 50){
            risk = "HIGH";
        }
        else if(score > 20){
            risk = "MEDIUM";
        }


        hotspots.push({

            file:fileName,

            changes,

            contributors:contributorCount,

            score:Math.round(score),

            risk

        });


    });


    return hotspots
    .sort((a,b)=>b.score-a.score)
    .slice(0,10);

}


module.exports = {
    calculateHotspots
};