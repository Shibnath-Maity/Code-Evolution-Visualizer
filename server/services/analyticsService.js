function createTimeline(commits){

    const timeline={};


    commits.forEach(commit=>{

        const date =
        commit.date.substring(0,10);


        if(timeline[date]){
            timeline[date]++;
        }
        else{
            timeline[date]=1;
        }

    });


    return timeline;

}


module.exports={
    createTimeline
};