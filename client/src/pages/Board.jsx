import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import API from "../services/api";
import FileAnalysis from "../components/FileAnalysis";
import RepositoryOverview from "../components/RepositoryOverview";
import StatCard from "../components/StatCard";
import LanguageDistribution from "../components/LanguageDistribution";
import ProjectHealthScore from "../components/ProjectHealthScore";
import DownloadRepositoryReport from "../components/DownloadRepositoryReport";
import RepositoryStructure from "../components/RepositoryStructure";
import { useAnalysis } from "../context/AnalysisContext";

// ---- helpers -------------------------------------------------------------

const emptyFileAnalysis = { totalFiles: 0, mostChangedFiles: [], allFiles: [] };
const emptyLanguageAnalysis = { totalFiles: 0, languages: [] };

function DiffLine({ line, index }) {
  let color = "text-gray-200";

  if (line.startsWith("+")) {
    color = "bg-green-900 text-green-300";
  } else if (line.startsWith("-")) {
    color = "bg-red-900 text-red-300";
  } else if (line.startsWith("@@")) {
    color = "text-blue-300";
  }

  return (
    <div className={`${color} px-2 flex`}>
      <span className="w-12 text-gray-500 select-none">{index + 1}</span>
      <span>{line}</span>
    </div>
  );
}

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-indigo-100 text-indigo-700",
];

function avatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function SectionHeader({ title, subtitle, count }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {count !== undefined && (
        <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-3 py-1">
          {count}
        </span>
      )}
    </div>
  );
}

// ---- component ------------------------------------------------------------

function Board() {
  const { analysis, loading, repositoryId } = useAnalysis();

  const [selectedCommit, setSelectedCommit] = useState(null);
  const [commitDiff, setCommitDiff] = useState("");
  const [loadingCommit, setLoadingCommit] = useState(false);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [commitError, setCommitError] = useState("");

  // Tracks the most recently requested commit hash so that responses
  // for stale/out-of-order requests (e.g. rapid clicking) are ignored.
  const activeRequestRef = useRef(null);

  const copyDiff = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(commitDiff);
    } catch (error) {
      console.error("Clipboard Error:", error);
      alert("Couldn't copy diff to clipboard.");
      return;
    }
    alert("Diff copied!");
  }, [commitDiff]);

  const downloadDiff = useCallback(() => {
    const blob = new Blob([commitDiff], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "commit.patch";
    a.click();

    window.URL.revokeObjectURL(url);
  }, [commitDiff]);

  const handleSelectCommit = useCallback(
    async (hash) => {
      if (!hash) return;

      // Mark this hash as the latest request; any earlier in-flight
      // requests will check this ref before applying their results.
      activeRequestRef.current = hash;

      setLoadingCommit(true);
      setLoadingDiff(true);
      setCommitError("");
      setSelectedCommit(null);
      setCommitDiff("");

      const [detailsResult, diffResult] = await Promise.allSettled([
        API.get(`/repository/commit/${hash}?repositoryId=${repositoryId}`),
        API.get(`/repository/commit/${hash}/diff?repositoryId=${repositoryId}`),
      ]);

      // Ignore results if a newer commit was selected in the meantime.
      if (activeRequestRef.current !== hash) return;

      if (detailsResult.status === "fulfilled") {
        setSelectedCommit(detailsResult.value.data.data);
      } else {
        console.error("Commit Fetch Error:", detailsResult.reason);
        setCommitError("Failed to load commit details.");
      }

      if (diffResult.status === "fulfilled") {
        setCommitDiff(diffResult.value.data.data);
      } else {
        console.error("Diff Fetch Error:", diffResult.reason);
      }

      setLoadingCommit(false);
      setLoadingDiff(false);
    },
    [repositoryId]
  );

  // Fallback defaults so destructuring never throws when analysis is null
  const {
    stats = {},
    contributors = {},
    fileAnalysis = emptyFileAnalysis,
    languageAnalysis = emptyLanguageAnalysis,
    architecture = null,
    recentCommits = [],
    allCommits = [],
    hotspots = [],
    codeEvolution = [],
    repoInfo = null,
    repoUrl = "",
  } = analysis || {};

  const displayedCommits = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return recentCommits;

    return allCommits.filter((commit) => {
      return (
        (commit.message || "").toLowerCase().includes(search) ||
        (commit.author_name || "").toLowerCase().includes(search) ||
        (commit.hash || "").toLowerCase().includes(search)
      );
    });
  }, [searchTerm, recentCommits, allCommits]);

  const contributorEntries = useMemo(
    () =>
      Object.entries(contributors || {}).sort(
        (a, b) => (b[1]?.commits || 0) - (a[1]?.commits || 0)
      ),
    [contributors]
  );

  const diffLines = useMemo(
    () => (commitDiff ? commitDiff.split("\n") : []),
    [commitDiff]
  );

  // Reset any selected commit/diff state when the underlying analysis
  // changes (e.g. a new repository is analyzed) to avoid showing stale data.
  useEffect(() => {
    setSelectedCommit(null);
    setCommitDiff("");
    setCommitError("");
    activeRequestRef.current = null;
  }, [repositoryId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <h2 className="text-xl font-semibold text-slate-800">Analyzing repository…</h2>
          <p className="text-slate-500 mt-1 text-sm">This may take a moment.</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-semibold text-slate-800">No repository analyzed yet</h2>
          <p className="text-slate-500 mt-1 text-sm">
            Go to the Home page and analyze a GitHub repository.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8 space-y-8">
        {/* Repository Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Repository Dashboard
            </h1>

            {repoUrl && (
              <p className="mt-2 text-sm text-slate-500 break-all">{repoUrl}</p>
            )}
          </div>

          <DownloadRepositoryReport
            repoUrl={repoUrl}
            stats={stats}
            contributors={contributors}
            fileAnalysis={fileAnalysis}
            languageAnalysis={languageAnalysis}
            architecture={architecture}
            codeEvolution={codeEvolution}
            hotspots={hotspots}
            recentCommits={recentCommits}
          />
        </div>

        {/* Repository Overview */}
        {repoInfo && <RepositoryOverview repo={repoInfo} />}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Commits"
            value={stats?.totalCommits || 0}
            type="commits"
            color="bg-gradient-to-br from-blue-500 to-blue-700"
            trend="from last analysis"
          />

          <StatCard
            title="Contributors"
            value={contributorEntries.length}
            type="contributors"
            color="bg-gradient-to-br from-emerald-500 to-emerald-700"
            trend="from last analysis"
          />

          <StatCard
            title="Files"
            value={fileAnalysis?.totalFiles || 0}
            type="files"
            color="bg-gradient-to-br from-purple-500 to-purple-700"
            trend="from last analysis"
          />

          <StatCard
            title="Hotspots"
            value={hotspots?.length || 0}
            type="hotspots"
            color="bg-gradient-to-br from-orange-500 to-orange-700"
            trend="from last analysis"
          />
        </div>

        {/* Project Health */}
        <ProjectHealthScore
          stats={stats}
          fileAnalysis={fileAnalysis}
          codeEvolution={codeEvolution}
          architecture={architecture}
          languageAnalysis={languageAnalysis}
          commits={allCommits}
        />

        {/* Repository Structure */}
        <RepositoryStructure architecture={architecture} />

        {/* Language Distribution */}
        <LanguageDistribution languageAnalysis={languageAnalysis} />

        {/* Unified File Analysis with On-Demand AI */}
        <FileAnalysis fileAnalysis={fileAnalysis} repositoryId={repositoryId} />

        {/* Recent Commits */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <SectionHeader
              title="Recent Commits"
              subtitle="Latest activity in this repository"
            />

            <div className="relative w-full sm:w-64">
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
          </div>

          {displayedCommits.length === 0 ? (
            <p className="text-slate-500 text-sm py-6 text-center">No commits found.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {displayedCommits.map((commit) => (
                <div
                  key={commit.hash || `${commit.author_name}-${commit.date}`}
                  role="button"
                  tabIndex={0}
                  className="py-3 px-2 -mx-2 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between gap-4"
                  onClick={() => handleSelectCommit(commit.hash)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectCommit(commit.hash);
                    }
                  }}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">{commit.message}</p>
                    <p className="text-slate-500 text-sm mt-0.5">{commit.author_name}</p>
                  </div>
                  <p className="text-slate-400 text-xs whitespace-nowrap shrink-0">
                    {new Date(commit.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Commit Details */}
        {(loadingCommit || selectedCommit || commitError) && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <SectionHeader title="Commit Details" />

            {loadingCommit && (
              <p className="text-slate-500 italic text-sm">Loading commit details...</p>
            )}

            {!loadingCommit && commitError && (
              <p className="text-red-600 text-sm">{commitError}</p>
            )}

            {!loadingCommit && selectedCommit && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Commit Hash
                    </p>
                    <p className="text-slate-700 break-all font-mono text-sm mt-1">
                      {selectedCommit.hash}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Author
                    </p>
                    <p className="text-slate-800 mt-1">{selectedCommit.author}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Commit Date
                    </p>
                    <p className="text-slate-800 mt-1">{selectedCommit.date}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Message
                    </p>
                    <p className="text-slate-800 mt-1">{selectedCommit.message}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-2">
                    Files Changed
                  </p>
                  <ul className="list-disc ml-5 text-slate-700 text-sm space-y-1">
                    {(selectedCommit.files || []).map((file) => (
                      <li key={file}>{file}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-1">
                    Changes Summary
                  </p>
                  <p className="text-slate-800 text-sm">{selectedCommit.summary}</p>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center mb-3">
                    <p className="font-semibold text-slate-900">Commit Diff</p>

                    <div className="flex gap-2">
                      <button
                        onClick={copyDiff}
                        disabled={loadingDiff || !commitDiff}
                        className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Copy Diff
                      </button>
                      <button
                        onClick={downloadDiff}
                        disabled={loadingDiff || !commitDiff}
                        className="bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Download Patch
                      </button>
                    </div>
                  </div>

                  {loadingDiff ? (
                    <p className="text-slate-500 italic text-sm">Loading diff...</p>
                  ) : (
                    <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto text-sm font-mono leading-relaxed">
                      {diffLines.map((line, index) => (
                        <DiffLine key={index} line={line} index={index} />
                      ))}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contributors List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <SectionHeader
            title="Contributors"
            subtitle="Ranked by number of commits"
            count={contributorEntries.length}
          />

          {contributorEntries.length === 0 ? (
            <p className="text-slate-500 text-sm py-6 text-center">No contributors found.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {contributorEntries.map(([name, contributor]) => {
                const displayName = contributor.name || name;
                return (
                  <div key={name} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold ${avatarColor(
                          displayName
                        )}`}
                      >
                        {initials(displayName)}
                      </div>
                      <span className="font-medium text-slate-800 truncate">{displayName}</span>
                    </div>
                    <span className="text-blue-600 font-semibold text-sm whitespace-nowrap">
                      {contributor.commits || 0} commits
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Board;