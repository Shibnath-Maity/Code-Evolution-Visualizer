import Pagination from "../components/Pagination";
import CommitTypeChart from "../components/CommitTypeChart";
import { useEffect, useState } from "react";
import CommitDetails from "../components/CommitDetails";
import API from "../services/api";
import {
  GitCommit,
  Search,
  User,
  Calendar,
  FileText,
  Plus,
  Minus,
} from "lucide-react";

function Commits() {
  const [commits, setCommits] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const repoUrl = localStorage.getItem("repoUrl");
  const [selectedCommit, setSelectedCommit] = useState(null);
const [commitDiff, setCommitDiff] = useState("");
const [loadingDetails, setLoadingDetails] = useState(false);
const [loadingDiff, setLoadingDiff] = useState(false);
const [currentPage, setCurrentPage] = useState(1);

const COMMITS_PER_PAGE = 10;

useEffect(() => {
  const analysis = JSON.parse(
    localStorage.getItem("repositoryAnalysis")
  );

  if (!analysis) {
    return;
  }

  console.log("First commit:", analysis.allCommits[0]);

  setLoading(true);
  setCommits(analysis.allCommits || []);
  setLoading(false);
}, []);

  const filteredCommits = commits.filter((commit) => {
    const search = searchTerm.toLowerCase();

    return (
      (commit.message || "").toLowerCase().includes(search) ||
      (commit.author_name || "").toLowerCase().includes(search) ||
      (commit.hash || "").toLowerCase().includes(search)
    );
  });
const totalPages = Math.ceil(
  filteredCommits.length / COMMITS_PER_PAGE
);

const startIndex = (currentPage - 1) * COMMITS_PER_PAGE;

const paginatedCommits = filteredCommits.slice(
  startIndex,
  startIndex + COMMITS_PER_PAGE
);
const handleCommitClick = async (hash) => {
  console.log("Clicked hash:", hash);

  try {
    setLoadingDetails(true);
    setLoadingDiff(true);

    const detailsResponse = await API.get(
      `/repository/commit/${hash}`
    );

    const diffResponse = await API.get(
      `/repository/commit/${hash}/diff`
    );

    setSelectedCommit(detailsResponse.data.data);
    setCommitDiff(diffResponse.data.data);

  } catch (error) {
    console.error("Failed to load commit:", error);
  } finally {
    setLoadingDetails(false);
    setLoadingDiff(false);
  }
};

  
  return (
    <div className="min-h-screen bg-gray-100 p-8">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <GitCommit className="text-blue-600" size={32} />

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Commits
            </h1>

            <p className="text-gray-500">
              Explore the complete commit history
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">

        <div className="relative max-w-xl">

          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search commits, authors or hash..."
            value={searchTerm}
           onChange={(e) => {
  setSearchTerm(e.target.value);
  setCurrentPage(1);
}}
            className="
              w-full
              border
              border-gray-200
              rounded-xl
              py-3
              pl-11
              pr-4
              outline-none
              focus:ring-2
              focus:ring-blue-500
            "
          />

        </div>

      </div>
{/* Commit Type Chart */}
<CommitTypeChart commits={commits} />


      {/* Commit count */}
      <div className="mb-4 text-sm text-gray-500">
        Showing {startIndex + 1}-
{Math.min(startIndex + COMMITS_PER_PAGE, filteredCommits.length)}
of {filteredCommits.length} commits
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl p-10 text-center">
          Loading commits...
        </div>
      )}

      {/* Empty */}
      {!loading && filteredCommits.length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center">
          No commits found.
        </div>
      )}

      {/* Commit List */}
      {!loading && filteredCommits.length > 0 && (
        <div className="space-y-4">

         {paginatedCommits.map((commit, index) => (
<div
  key={commit.hash || index}
  onClick={() => handleCommitClick(commit.hash)}
  className="
    bg-white
    rounded-2xl
    shadow-sm
    p-6
    hover:shadow-md
    transition
    cursor-pointer
    border
    border-transparent
    hover:border-blue-200
  "
>

              {/* Top */}
              <div className="flex justify-between gap-4">

                <div>

                  <h2 className="text-lg font-semibold text-slate-900">
                    {commit.message}
                  </h2>

                  <div className="flex flex-wrap gap-5 mt-3 text-sm text-gray-500">

                    <span className="flex items-center gap-2">
                      <User size={15} />
                      {commit.author_name}
                    </span>

                    <span className="flex items-center gap-2">
                      <Calendar size={15} />
                      {new Date(commit.date).toLocaleString()}
                    </span>

                    <span className="flex items-center gap-2">
                      <FileText size={15} />
                      {commit.files_changed || 0} files changed
                    </span>

                  </div>

                </div>

                {/* Hash */}
                <span
                  className="
                    h-fit
                    bg-gray-100
                    text-gray-600
                    px-3
                    py-1
                    rounded-lg
                    text-xs
                    font-mono
                  "
                >
                  {(commit.hash || "").substring(0, 7)}
                </span>

              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-5 text-sm">

                <span className="flex items-center gap-1 text-green-600">
                  <Plus size={15} />
                  {commit.additions || 0}
                </span>

                <span className="flex items-center gap-1 text-red-600">
                  <Minus size={15} />
                  {commit.deletions || 0}
                </span>

                <span className="text-gray-500">
                  {commit.files_changed || 0} files changed
                </span>

              </div>

            </div>

          ))}

        </div>
      )}

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
/>

<CommitDetails
  selectedCommit={selectedCommit}
  loadingDetails={loadingDetails}
  loadingDiff={loadingDiff}
  commitDiff={commitDiff}
  onClose={() => {
    setSelectedCommit(null);
    setCommitDiff("");
  }}
/>


    </div>
  );
}

export default Commits;