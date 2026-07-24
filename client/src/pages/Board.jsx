import { useEffect, useState } from "react";
import API from "../services/api";
import TimelineChart from "../components/TimelineChart";
import RepositoryOverview from "../components/RepositoryOverview";
import Navbar from "../components/Navbar";
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
const [selectedCommit, setSelectedCommit] = useState(null);
const [commitDiff, setCommitDiff] = useState("");
const [loadingDiff, setLoadingDiff] = useState(false);
const [searchTerm, setSearchTerm] = useState("");
const [allCommits, setAllCommits] = useState([]);
const [repoInfo, setRepoInfo] = useState(null);
const copyDiff = () => {
  navigator.clipboard.writeText(commitDiff);
  alert("Diff copied!");
};

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
      console.log("Recent:", res.data.recentCommits.length);
console.log("All:", res.data.allCommits.length);

      console.log(res.data);

      setStats({
        commits: res.data.stats.totalCommits,
        contributors: Object.keys(res.data.contributors).length,
        hotspots: res.data.hotspots.length,
      });

      setRecentCommits(res.data.recentCommits);
      setAllCommits(res.data.allCommits)
      console.log("Loaded commits:", res.data.recentCommits);
      setContributors(res.data.contributors);
      setTimeline(res.data.timeline);
      const repoRes = await API.get("/api/repo-info", {
  params: {
    url: repoUrl,
  },
});

setRepoInfo(repoRes.data);
    } catch (err) {
  console.error(err);

  const message =
    err.response?.data?.message || "Analysis failed";

  alert(message);
}
  };
 const fetchCommitDetails = async (hash) => {
  try {
    console.log("Fetching commit:", hash);

    const res = await API.get(`/repository/commit/${hash}`);

    console.log("Full Response:", res);
    console.log("Response Data:", res.data);
    console.log("Commit Details:", res.data.data);

    setSelectedCommit(res.data.data);
  } catch (err) {
    console.error("Commit Fetch Error:", err);

    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    }

    alert("Failed to load commit details.");
  }
};
const fetchCommitDiff = async (hash) => {
  try {
    setLoadingDiff(true);

    const res = await API.get(`/repository/commit/${hash}/diff`);

    setCommitDiff(res.data.data);
  } catch (err) {
    console.error("Diff Fetch Error:", err);
    alert("Failed to load commit diff.");
  } finally {
    setLoadingDiff(false);
  }
};
const displayedCommits =
  searchTerm.trim() === ""
    ? recentCommits
    : allCommits.filter((commit) => {
        const search = searchTerm.toLowerCase();

        return (
          (commit.message || "")
            .toLowerCase()
            .includes(search) ||

          (commit.author_name || "")
            .toLowerCase()
            .includes(search) ||

          (commit.hash || "")
            .toLowerCase()
            .includes(search)
        );
      });
const downloadDiff = () => {
  const blob = new Blob([commitDiff], { type: "text/plain" });

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "commit.patch";

  a.click();

  window.URL.revokeObjectURL(url);
};
console.log("Search:", searchTerm);
console.log("Commits:", recentCommits);
  return (
  <div className="bg-gray-100 min-h-screen">
    <Navbar />

    <div className="p-10">
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


      {/* Repository Overview */}
      {repoInfo && (
        <RepositoryOverview repo={repoInfo} />
      )}

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
      {/* search box */}
      {/* <div className="mb-4">
  <input
    type="text"
    placeholder="Search commits..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="border p-2 rounded w-full"
  />
</div> */}
<div className="mb-6 relative max-w-xs">
  <label htmlFor="commit-search" className="sr-only">
    Search commits
  </label>

  <svg
    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>

  <input
    id="commit-search"
    type="text"
    placeholder="Search commits..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-8 text-sm text-gray-700 placeholder-gray-400 shadow-sm transition-all duration-200 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
  />

  {searchTerm && (
    <button
      type="button"
      onClick={() => setSearchTerm("")}
      aria-label="Clear search"
      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )}
</div>
 

      {/* Recent Commits */}
      <div className="mt-10 bg-white rounded-lg shadow p-6">
  <h2 className="text-2xl font-bold mb-4">
    Recent Commits
  </h2>

  {displayedCommits.length === 0 ? (
  <p>No commits found.</p>
) : (
  displayedCommits.map((commit, index) => (
    <div
      key={index}
      className="border-b py-3 cursor-pointer hover:bg-gray-100 rounded px-2"
      onClick={() => {
        console.log(commit);
        fetchCommitDetails(commit.hash);
        fetchCommitDiff(commit.hash);
      }}
    >
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
{/* Commit Details */}
{/* Commit Details */}

{/* Commit Details */}
{selectedCommit && (
  <div className="mt-10 bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold mb-6">
      Commit Details
    </h2>

    <div className="space-y-4">

      <div>
        <p className="font-semibold">Commit Hash</p>
        <p className="text-gray-600 break-all">
          {selectedCommit.hash}
        </p>
      </div>

      <div>
        <p className="font-semibold">Author</p>
        <p>{selectedCommit.author}</p>
      </div>

      <div>
        <p className="font-semibold">Commit Date</p>
        <p>{selectedCommit.date}</p>
      </div>

      <div>
        <p className="font-semibold">Message</p>
        <p>{selectedCommit.message}</p>
      </div>

      <div>
        <p className="font-semibold">Files Changed</p>

        <ul className="list-disc ml-6">
          {selectedCommit.files.map((file, index) => (
            <li key={index}>{file}</li>
          ))}
        </ul>
      </div>

      <div>
        <p className="font-semibold">Changes</p>
        <p>{selectedCommit.summary}</p>
      </div>
<div className="mt-6">
 <div className="flex justify-between items-center mb-3">
  <p className="font-semibold text-lg">
    Commit Diff
  </p>

  <button
    onClick={copyDiff}
    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
  >
    Copy Diff
  </button>
  <button
  onClick={downloadDiff}
  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
>
  Download Patch
</button>
</div>

  {loadingDiff ? (
    <p>Loading diff...</p>
  ) : (
  <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto text-sm">
  {commitDiff.split("\n").map((line, index) => {
    let color = "text-gray-200";

    if (line.startsWith("+")) {
      color = "bg-green-900 text-green-300";
    } else if (line.startsWith("-")) {
      color = "bg-red-900 text-red-300";
    } else if (line.startsWith("@@")) {
      color = "text-blue-300";
    }
    //download diff

   
    return (
      <div
  key={index}
  className={`${color} px-2 flex`}
>
  <span className="w-12 text-gray-500 select-none">
    {index + 1}
  </span>

  <span>{line}</span>
</div>
    );
  })}
</pre>
  )}
</div>
    </div>
  </div>
)}

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

    </div>
  );
}

export default Board;