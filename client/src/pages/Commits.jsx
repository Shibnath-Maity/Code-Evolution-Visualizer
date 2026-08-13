import { useState, useEffect, useMemo, useCallback } from "react";
import { useAnalysis } from "../context/AnalysisContext";
import API from "../services/api";
import Pagination from "../components/Pagination";
import CommitTypeChart from "../components/CommitTypeChart";
import CommitDetails from "../components/CommitDetails";
import CommitStatistics from "../components/CommitStatistics";
import {
  GitCommit,
  Search,
  User,
  Calendar,
  FileText,
  Plus,
  Minus,
  X,
  Sparkles,
  ArrowRight,
  MousePointerClick,
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const COMMITS_PER_PAGE = 10;

  // Close & reset modal helper
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedCommit(null);
    setCommitDiff("");
    setAiSummary(null);
  }, []);

  // Reset pagination and active details when switching repositories
  useEffect(() => {
    setCurrentPage(1);
    closeModal();
  }, [repositoryId, closeModal]);

  // Lock background scroll when modal popup is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  // Keyboard shortcut listener to close modal on 'Esc' key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isModalOpen) {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, closeModal]);

  // Memoize filtered commits
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
    if (!hash) return;

    // Open modal immediately to show loading skeleton
    setIsModalOpen(true);

    try {
      setLoadingDetails(true);
      setLoadingDiff(true);
      setLoadingSummary(true);

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
      <div className="flex flex-col justify-center items-center h-screen bg-slate-950 text-slate-300">
        <GitCommit className="h-12 w-12 text-slate-600 mb-4 animate-bounce" />
        <h2 className="text-xl font-semibold tracking-tight text-white">
          No repository analyzed yet
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Select or analyze a repository to view commit timeline data.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
              <GitCommit size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                Commit History
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                Explore, search, and inspect code changes across repository commits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-400 self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Total Commits: <span className="text-white font-bold">{commits.length.toLocaleString()}</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="Search commits by message, author, or hash..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-900/80 border border-slate-800 focus:border-indigo-500/80 rounded-2xl py-3.5 pl-11 pr-10 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all shadow-lg focus:ring-4 focus:ring-indigo-500/10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Commit Type Chart & Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <CommitTypeChart commits={commits} />
          <CommitStatistics stats={commitStatistics} />
        </div>

        {/* Commit Feed List */}
        <div className="space-y-4">
          
          {/* Action Helper & Pagination Meta Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-400 px-1">
            <div className="flex items-center gap-2 text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl w-fit">
              <MousePointerClick size={14} className="text-indigo-400 shrink-0" />
              <span>Click any commit card below to view line diffs, file changes & AI summary</span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span>
                Showing {filteredCommits.length > 0 ? startIndex + 1 : 0} -{" "}
                {Math.min(
                  startIndex + COMMITS_PER_PAGE,
                  filteredCommits.length
                )}{" "}
                of {filteredCommits.length} commits
              </span>
              {searchTerm && (
                <span className="text-indigo-400">
                  (Filtered)
                </span>
              )}
            </div>
          </div>

          {filteredCommits.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center backdrop-blur-xl">
              <GitCommit size={36} className="mx-auto text-slate-600 mb-3" />
              <p className="text-base font-semibold text-slate-300">No commits found</p>
              <p className="text-xs text-slate-500 mt-1">
                Try adjusting your search terms or clearing filters.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedCommits.map((commit) => (
                <div
                  key={commit.hash ?? `${commit.author_name}-${commit.date}`}
                  onClick={() => {
                    if (commit.hash) handleCommitClick(commit.hash);
                  }}
                  title="Click to inspect commit details, diffs, and AI summary"
                  className="group relative bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl p-5 shadow-lg backdrop-blur-xl transition-all duration-200 cursor-pointer overflow-hidden"
                >
                  {/* Subtle hover gradient glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    
                    {/* Left Details Section */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-start gap-2">
                        <h2 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                          {commit.message}
                        </h2>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                        <span className="flex items-center gap-1.5 font-medium text-slate-300">
                          <User size={14} className="text-indigo-400" />
                          {commit.author_name}
                        </span>

                        <span className="flex items-center gap-1.5 font-mono">
                          <Calendar size={14} className="text-slate-500" />
                          {new Date(commit.date).toLocaleString()}
                        </span>

                        <span className="flex items-center gap-1.5 font-mono">
                          <FileText size={14} className="text-slate-500" />
                          {commit.files_changed || 0} files changed
                        </span>
                      </div>
                    </div>

                    {/* Right CTA Button & Diff Badges */}
                    <div className="flex md:flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 border-slate-800/60 pt-3 md:pt-0 shrink-0">
                      
                      {/* Explicit CTA Badge with Hash */}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 group-hover:bg-indigo-600 border border-slate-700/60 group-hover:border-indigo-500 text-slate-300 group-hover:text-white text-xs font-medium transition-all shadow-sm">
                        <span>Inspect</span>
                        <span className="font-mono text-[11px] text-slate-400 group-hover:text-indigo-200">
                          ({(commit.hash || "").substring(0, 7)})
                        </span>
                        <ArrowRight
                          size={13}
                          className="text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform"
                        />
                      </span>

                      {/* Additions / Deletions Counters */}
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="flex items-center gap-0.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          <Plus size={12} />
                          {commit.additions || 0}
                        </span>
                        <span className="flex items-center gap-0.5 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                          <Minus size={12} />
                          {commit.deletions || 0}
                        </span>
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL POPUP FOR COMMIT DETAILS                            */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
          {/* Dark Glassmorphism Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
            onClick={closeModal}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-5xl max-h-[88vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <GitCommit size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Commit Analysis & Diff
                    <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                      <Sparkles size={10} /> AI Enhanced
                    </span>
                  </h3>
                  <p className="text-xs font-mono text-slate-400">
                    {selectedCommit?.hash ? `Hash: ${selectedCommit.hash}` : "Fetching commit details..."}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Close commit details modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar bg-slate-950/40">
              <CommitDetails
                selectedCommit={selectedCommit}
                loadingDetails={loadingDetails}
                loadingDiff={loadingDiff}
                loadingSummary={loadingSummary}
                aiSummary={aiSummary}
                commitDiff={commitDiff}
                onClose={closeModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Commits;