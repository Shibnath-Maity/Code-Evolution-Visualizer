import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import API from "../services/api";
import FileAnalysis from "../components/FileAnalysis";
import RepositoryOverview from "../components/RepositoryOverview";
import RepositoryArchitecture from "../components/RepositoryArchitecture";
import StatCard from "../components/StatCard";
import LanguageDistribution from "../components/LanguageDistribution";
import ProjectHealthScore from "../components/ProjectHealthScore";
import DownloadRepositoryReport from "../components/DownloadRepositoryReport";
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
    () => Object.entries(contributors || {}),
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
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Analyzing repository…</h2>
        <p className="text-gray-500 mt-2">This may take a moment.</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">No repository analyzed yet</h2>
        <p className="text-gray-500 mt-2">
          Go to the Home page and analyze a GitHub repository.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Repository Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Repository Dashboard
            </h1>

            {repoUrl && (
              <p className="mt-2 text-sm text-slate-500 break-all">
                Repository: {repoUrl}
              </p>
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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
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
        <div className="mb-8">
          <ProjectHealthScore
            stats={stats}
            fileAnalysis={fileAnalysis}
            codeEvolution={codeEvolution}
            architecture={architecture}
            languageAnalysis={languageAnalysis}
            commits={allCommits}
          />
        </div>

        {/* Repository Architecture */}
        <div className="mb-8">
     <RepositoryArchitecture
  architecture={architecture?.tree || architecture}
/>
        </div>

        <div className="mb-8">
          <LanguageDistribution languageAnalysis={languageAnalysis} />
        </div>

        {/* Search Box */}
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
          <h2 className="text-2xl font-bold mb-4">Recent Commits</h2>

          {displayedCommits.length === 0 ? (
            <p className="text-gray-500">No commits found.</p>
          ) : (
            displayedCommits.map((commit) => (
              <div
                key={commit.hash || `${commit.author_name}-${commit.date}`}
                role="button"
                tabIndex={0}
                className="border-b py-3 cursor-pointer hover:bg-gray-100 rounded px-2 transition-colors"
                onClick={() => handleSelectCommit(commit.hash)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectCommit(commit.hash);
                  }
                }}
              >
                <p className="font-semibold text-slate-800">{commit.message}</p>
                <p className="text-gray-600 text-sm">{commit.author_name}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {new Date(commit.date).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Unified File Analysis with On-Demand AI */}
        <div className="mt-10">
        <FileAnalysis
  fileAnalysis={fileAnalysis}
  repositoryId={repositoryId}
/>
        </div>

        {/* Commit Details */}
        {(loadingCommit || selectedCommit || commitError) && (
          <div className="mt-10 bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Commit Details</h2>

            {loadingCommit && (
              <p className="text-gray-500 italic">Loading commit details...</p>
            )}

            {!loadingCommit && commitError && (
              <p className="text-red-600">{commitError}</p>
            )}

            {!loadingCommit && selectedCommit && (
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-gray-700">Commit Hash</p>
                  <p className="text-gray-600 break-all font-mono text-sm">{selectedCommit.hash}</p>
                </div>

                <div>
                  <p className="font-semibold text-gray-700">Author</p>
                  <p className="text-gray-800">{selectedCommit.author}</p>
                </div>

                <div>
                  <p className="font-semibold text-gray-700">Commit Date</p>
                  <p className="text-gray-800">{selectedCommit.date}</p>
                </div>

                <div>
                  <p className="font-semibold text-gray-700">Message</p>
                  <p className="text-gray-800">{selectedCommit.message}</p>
                </div>

                <div>
                  <p className="font-semibold text-gray-700">Files Changed</p>
                  <ul className="list-disc ml-6 text-slate-700 text-sm">
                    {(selectedCommit.files || []).map((file) => (
                      <li key={file}>{file}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-700">Changes Summary</p>
                  <p className="text-gray-800">{selectedCommit.summary}</p>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center mb-3">
                    <p className="font-semibold text-lg text-slate-900">Commit Diff</p>

                    <div className="flex gap-2">
                      <button
                        onClick={copyDiff}
                        disabled={loadingDiff || !commitDiff}
                        className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Copy Diff
                      </button>
                      <button
                        onClick={downloadDiff}
                        disabled={loadingDiff || !commitDiff}
                        className="bg-green-600 text-white text-sm px-4 py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Download Patch
                      </button>
                    </div>
                  </div>

                  {loadingDiff ? (
                    <p className="text-gray-500 italic">Loading diff...</p>
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
        <div className="mt-10 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Contributors</h2>

          {contributorEntries.length === 0 ? (
            <p className="text-gray-500">No contributors found.</p>
          ) : (
            contributorEntries.map(([name, contributor]) => (
              <div
                key={name}
                className="flex justify-between items-center border-b py-3"
              >
                <span className="font-medium text-slate-800">{contributor.name || name}</span>
                <span className="text-blue-600 font-semibold text-sm">
                  {contributor.commits || 0} commits
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Board;