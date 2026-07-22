import { useEffect, useState } from "react";
import API from "../services/api";
import TimelineChart from "../components/TimelineChart";
function Board() {
  const [repoUrl, setRepoUrl] = useState("");

  const [stats, setStats] = useState({
    commits: 0,
    contributors: 0,
    hotspots: 0,
  });

  const [recentCommits, setRecentCommits] = useState([]);
  const [contributors, setContributors] = useState({});
const [timeline, setTimeline] = useState({});
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

  const analyzeRepository = async () => {

  if (!repoUrl.trim()) {
    alert("Please enter a GitHub repository URL.");
    return;
  }

    try {
      const res = await API.post("/repository/analytics", {
        url: repoUrl,
      });

      console.log(res.data);

      setStats({
        commits: res.data.stats.totalCommits,
        contributors: Object.keys(res.data.contributors).length,
        hotspots: res.data.hotspots.length,
      });

      setRecentCommits(res.data.recentCommits);
      setContributors(res.data.contributors);
      setTimeline(res.data.timeline);
    } catch (err) {
  console.error(err);

  const message =
    err.response?.data?.message || "Analysis failed";

  alert(message);
}
  };

  return (
    <div className="p-10 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-8">
        Code Evolution Visualizer
      </h1>

      {/* Repository Input */}
      <div className="flex gap-4 mb-10">
        <input
          type="text"
          placeholder="GitHub Repository URL"
          className="border p-3 rounded w-[500px]"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
        />

        <button
          onClick={analyzeRepository}
          className="bg-blue-600 text-white px-6 rounded hover:bg-blue-700"
        >
          Analyze
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-blue-500 text-white p-6 rounded-lg shadow">
          <h2 className="text-lg">Total Commits</h2>
          <p className="text-4xl font-bold mt-3">{stats.commits}</p>
        </div>

        <div className="bg-green-500 text-white p-6 rounded-lg shadow">
          <h2 className="text-lg">Contributors</h2>
          <p className="text-4xl font-bold mt-3">{stats.contributors}</p>
        </div>

        <div className="bg-red-500 text-white p-6 rounded-lg shadow">
          <h2 className="text-lg">Hotspots</h2>
          <p className="text-4xl font-bold mt-3">{stats.hotspots}</p>
        </div>
      </div>

      {/* Recent Commits */}
      <div className="mt-10 bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">
          Recent Commits
        </h2>

        {recentCommits.length === 0 ? (
          <p>No commits found.</p>
        ) : (
          recentCommits.map((commit, index) => (
            <div key={index} className="border-b py-3">
              <p className="font-semibold">{commit.message}</p>

              <p className="text-gray-600">
                {commit.author_name}
              </p>

              <p className="text-gray-500 text-sm">
                {new Date(commit.date).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Contributors List */}
      <div className="mt-10 bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">
          Contributors
        </h2>

        {Object.keys(contributors).length === 0 ? (
          <p>No contributors found.</p>
        ) : (
          Object.entries(contributors).map(([name, commits]) => (
            <div
              key={name}
              className="flex justify-between border-b py-3"
            >
              <span className="font-medium">{name}</span>

              <span className="text-blue-600 font-semibold">
                {commits} commits
              </span>
            </div>
          ))
        )}
      </div>

      {/* Timeline Chart */}
      <TimelineChart timeline={timeline} />
    </div>
  );
}

export default Board;