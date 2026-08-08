import Pagination from "../components/Pagination";
import CommitTypeChart from "../components/CommitTypeChart";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAnalysis } from "../context/AnalysisContext";
import CommitDetails from "../components/CommitDetails";
import API from "../services/api";
import CommitStatistics from "../components/CommitStatistics";
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
  const { analysis, repositoryId } = useAnalysis();

  // Memoize raw commits array from context
  const commits = useMemo(
    () => analysis?.allCommits || [],
    [analysis]
  );
  const commitStatistics = analysis?.commitStatistics || null;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [commitDiff, setCommitDiff] = useState("");
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const COMMITS_PER_PAGE = 10;

  // Reset pagination and active details ONLY when switching repositories,
  // NOT when analysis/embedding background status updates.
  useEffect(() => {
    setCurrentPage(1);
    setSelectedCommit(null);
    setCommitDiff("");
    setAiSummary(null);
  }, [repositoryId]);

  // Memoize filtered commits so recalculation only triggers when search or commits change
  const filteredCommits = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return commits.filter((commit) => {
      return (
        (commit.message || "").toLowerCase().includes(search) ||
        (commit.author_name || "").toLowerCase().includes(search) ||
        (commit.hash || "").toLowerCase().includes(search)
      );
    });
  }, [commits, searchTerm]);

  // Ensure totalPages is at least 1 even when empty
  const totalPages = Math.max(
    1,
    Math.ceil(filteredCommits.length / COMMITS_PER_PAGE)
  );

  const startIndex = (currentPage - 1) * COMMITS_PER_PAGE;

  // Memoize paginated commits slice
  const paginatedCommits = useMemo(() => {
    return filteredCommits.slice(
      startIndex,
      startIndex + COMMITS_PER_PAGE
    );
  }, [filteredCommits, startIndex]);

  const handleCommitClick = useCallback(async (hash) => {
    console.log("Clicked hash:", hash);

    if (!hash) return;

    try {
      setLoadingDetails(true);
      setLoadingDiff(true);
      setLoadingSummary(true);

      // Pass repositoryId via params to fix backend 400 errors
      const [detailsResponse, diffResponse, summaryResponse] =
        await Promise.all([
          API.get(`/repository/commit/${hash}`, {
            params: { repositoryId },
          }),
          API.get(`/repository/commit/${hash}/diff`, {
            params: { repositoryId },
          }),
          API.get(`/repository/commit/${hash}/summary`, {
            params: { repositoryId },
          }),
        ]);

      setSelectedCommit(detailsResponse.data.data);
      setCommitDiff(diffResponse.data.data);
      setAiSummary(summaryResponse.data.data);
    } catch (error) {
      console.error("Error fetching commit details:", error);
    } finally {
      setLoadingDetails(false);
      setLoadingDiff(false);
      setLoadingSummary(false);
    }
  }, [repositoryId]);

  if (!analysis) {
    return (
      <div className="flex justify-center items-center h-screen">
        <h2 className="text-2xl font-semibold">
          No repository analyzed yet.
        </h2>
      </div>
    );
  }

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

      {/* Commit Type Chart & Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        <CommitTypeChart commits={commits} />
        <CommitStatistics stats={commitStatistics} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* LEFT LIST */}
        <div className="xl:col-span-2 h-[calc(100vh-120px)] overflow-y-auto pr-3">

          <div className="mb-4 text-sm text-gray-500">
            Showing {filteredCommits.length > 0 ? startIndex + 1 : 0} -{" "}
            {Math.min(
              startIndex + COMMITS_PER_PAGE,
              filteredCommits.length
            )}{" "}
            of {filteredCommits.length} commits
          </div>

          {filteredCommits.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center">
              No commits found.
            </div>
          )}

          {filteredCommits.length > 0 && (
            <div className="space-y-4">
              {paginatedCommits.map((commit) => (
                <div
                  key={commit.hash ?? `${commit.author_name}-${commit.date}`}
                  onClick={() => {
                    if (commit.hash) {
                      handleCommitClick(commit.hash);
                    }
                  }}
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

                    <span className="h-fit bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-mono">
                      {(commit.hash || "").substring(0, 7)}
                    </span>
                  </div>

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

        </div>

        {/* RIGHT SIDEBAR */}
        <div className="xl:col-span-1">
          <div
            className="
              sticky
              top-6
              h-[calc(100vh-2rem)]
              overflow-y-auto
              pr-2
            "
          >
            <CommitDetails
              selectedCommit={selectedCommit}
              loadingDetails={loadingDetails}
              loadingDiff={loadingDiff}
              loadingSummary={loadingSummary}
              aiSummary={aiSummary}
              commitDiff={commitDiff}
              onClose={() => {
                setSelectedCommit(null);
                setCommitDiff("");
                setAiSummary(null);
              }}
            />
          </div>
        </div>

      </div>

    </div>
  );
}

export default Commits;