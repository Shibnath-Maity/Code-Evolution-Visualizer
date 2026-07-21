import {useEffect} from "react";
import API from "../services/api";

function Board(){
useEffect(() => {
  console.log("Calling backend...");

  API.get("/")
    .then((res) => {
      console.log("✅ Backend response:", res.data);
    })
    .catch((err) => {
      console.log("❌ Backend error:", err);
    });
}, []);
    return(
        <div className="p-10">

            <h1 className="text-3xl font-bold">
                Code Evolution Visualizer
            </h1>


            <div className="grid grid-cols-3 gap-5 mt-10">

                <div className="bg-blue-500 text-white p-5 rounded">
                    Total Commits
                    <h2 className="text-3xl">
                        0
                    </h2>
                </div>


                <div className="bg-green-500 text-white p-5 rounded">
                    Contributors
                    <h2 className="text-3xl">
                        0
                    </h2>
                </div>


                <div className="bg-red-500 text-white p-5 rounded">
                    Hotspots
                    <h2 className="text-3xl">
                        0
                    </h2>
                </div>

            </div>

        </div>
    )

}


export default Board;