import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  GitCommit,
  Users,
  FileCode2,
  Flame,
  Search,
  X,
  Copy,
  Download,
  Check,
  Code2,
  Terminal,
  Activity,
  Layers,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";

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
  let color = "text-slate-400";
  let bg = "hover:bg-slate-800/40";

  if (line.startsWith("+")) {
    color = "text-emerald-400";
    bg = "bg-emerald-500/10 hover:bg-emerald-500/15";
  } else if (line.startsWith("-")) {
    color = "text-rose-400";
    bg = "bg-rose-500/10 hover:bg-rose-500/15";
  } else if (line.startsWith("@@")) {
    color = "text-indigo-400 font-semibold";
    bg = "bg-indigo-500/10";
  }

  return (
    <div className={`px-3 py-0.5 flex items-center font-mono text-xs transition-colors ${bg} ${color}`}>
      <span className="w-10 shrink-0 text-slate-600 select-none text-[11px] font-mono">{index + 1}</span>
      <span className="whitespace-pre flex-1">{line || "\u00A0"}</span>
    </div>
  );
}

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_GRADIENTS = [
  "from-indigo-500 to-purple-600 text-white",
  "from-emerald-500 to-teal-600 text-white",
  "from-blue-500 to-cyan-600 text-white",
  "from-rose-500 to-pink-600 text-white",
  "from-amber-500 to-orange-600 text-white",
  "from-violet-500 to-fuchsia-600 text-white",
];

function avatarGradient(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function SectionHeader({ title, subtitle, count, icon: Icon }) {
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Icon size={18} />
          </div>
        )}
        <div>
          <h2 className="text-base font-bold text-white tracking-wide">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 font-mono mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {count !== undefined && (
        <span className="text-xs font-mono font-semibold text-slate-300 bg-slate-800/80 border border-slate-700/60 rounded-full px-3 py-1">
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
  const [copiedDiff, setCopiedDiff] = useState(false);

  const activeRequestRef = useRef(null);

  const copyDiff = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(commitDiff);
      setCopiedDiff(true);
      setTimeout(() => setCopiedDiff(false), 1500);
    } catch (error) {
      console.error("Clipboard Error:", error);
    }
  }, [commitDiff]);

  const downloadDiff = useCallback(() => {
    const blob = new Blob([commitDiff], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `commit-${selectedCommit?.hash || "patch"}.patch`;
    a.click();

    window.URL.revokeObjectURL(url);
  }, [commitDiff, selectedCommit]);

  const handleSelectCommit = useCallback(
    async (hash) => {
      if (!hash) return;

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

  useEffect(() => {
    setSelectedCommit(null);
    setCommitDiff("");
    setCommitError("");
    activeRequestRef.current = null;
  }, [repositoryId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 font-sans">
        <div className="text-center p-8 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-2xl shadow-2xl space-y-4">
          <div className="relative mx-auto h-12 w-12 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">Analyzing Repository...</h2>
            <p className="text-slate-400 text-xs font-mono mt-1">Parsing AST, commits, and file structure</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 font-sans">
        <div className="text-center p-8 max-w-md bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-2xl shadow-2xl space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-slate-800/60 text-slate-400 border border-slate-700/50 mb-1">
            <Code2 size={24} />
          </div>
          <h2 className="text-lg font-bold text-white">No Repository Selected</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            Please navigate to the Home page and analyze a GitHub repository to unlock comprehensive insights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans selection:bg-indigo-500 selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Repository Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-indigo-950/40 p-6 rounded-2xl border border-slate-800/80 shadow-2xl backdrop-blur-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-400" />
              <h1 className="text-2xl font-black text-white tracking-tight">
                Repository Dashboard
              </h1>
            </div>
            {repoUrl && (
              <p className="text-xs font-mono text-slate-400 flex items-center gap-1 break-all">
                <span>{repoUrl}</span>
                <ArrowUpRight size={12} className="text-indigo-400 shrink-0" />
              </p>
            )}
          </div>

          <div className="shrink-0">
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
        </div>

        {/* Repository Overview */}
        {repoInfo && <RepositoryOverview repo={repoInfo} />}

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Commits"
            value={stats?.totalCommits || 0}
            type="commits"
            icon={GitCommit}
            color="from-blue-600 to-indigo-600"
            trend="from last analysis"
          />

          <StatCard
            title="Contributors"
            value={contributorEntries.length}
            type="contributors"
            icon={Users}
            color="from-emerald-600 to-teal-600"
            trend="active authors"
          />

          <StatCard
            title="Total Files"
            value={fileAnalysis?.totalFiles || 0}
            type="files"
            icon={FileCode2}
            color="from-purple-600 to-fuchsia-600"
            trend="in codebase"
          />

          <StatCard
            title="Hotspots"
            value={hotspots?.length || 0}
            type="hotspots"
            icon={Flame}
            color="from-amber-600 to-rose-600"
            trend="high churn files"
          />
        </div>

        {/* Project Health Score */}
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

        {/* Recent Commits Grid */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <SectionHeader
              title="Recent Commits"
              subtitle="Latest timeline activity in this repository"
              icon={GitCommit}
            />

            {/* Search Bar Input */}
            <div className="relative w-full sm:w-72 -mt-2 sm:mt-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                id="commit-search"
                type="text"
                placeholder="Search commit or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-1.5 pl-9 pr-8 text-xs text-slate-200 placeholder-slate-500 font-mono transition-all duration-200 focus:border-indigo-500 focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {displayedCommits.length === 0 ? (
            <div className="text-slate-500 text-xs font-mono py-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/60">
              No matching commits found.
            </div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
              {displayedCommits.map((commit) => (
                <div
                  key={commit.hash || `${commit.author_name}-${commit.date}`}
                  role="button"
                  tabIndex={0}
                  className="p-3.5 bg-slate-950/50 hover:bg-slate-800/40 border border-slate-800/60 hover:border-indigo-500/30 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-4 group"
                  onClick={() => handleSelectCommit(commit.hash)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectCommit(commit.hash);
                    }
                  }}
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-xs text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                      {commit.message}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span className="text-slate-300 font-medium">{commit.author_name}</span>
                      <span>•</span>
                      <span className="text-slate-500">{commit.hash ? commit.hash.slice(0, 7) : "hash"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-slate-500 font-mono text-[11px]">
                      {new Date(commit.date).toLocaleDateString()}
                    </p>
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Commit Details Modal / Inspector */}
        {(loadingCommit || selectedCommit || commitError) && (
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-5">
            <SectionHeader title="Commit Inspector" icon={Terminal} />

            {loadingCommit && (
              <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 py-6 justify-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                Fetching commit details and patch diff...
              </div>
            )}

            {!loadingCommit && commitError && (
              <div className="text-rose-400 text-xs font-mono bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
                {commitError}
              </div>
            )}

            {!loadingCommit && selectedCommit && (
              <div className="space-y-6">
                
                {/* Meta Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Commit Hash</p>
                    <p className="text-indigo-300 font-semibold break-all">{selectedCommit.hash}</p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Author</p>
                    <p className="text-slate-200 font-semibold">{selectedCommit.author}</p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Commit Date</p>
                    <p className="text-slate-300">{selectedCommit.date}</p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Message</p>
                    <p className="text-slate-200 truncate">{selectedCommit.message}</p>
                  </div>
                </div>

                {/* Changed Files */}
                {selectedCommit.files?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Files Changed ({selectedCommit.files.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCommit.files.map((file) => (
                        <span key={file} className="bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] px-2.5 py-1 rounded-lg">
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Code Diff Box */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-xs font-mono font-bold text-white flex items-center gap-2">
                      <Code2 size={15} className="text-indigo-400" /> Commit Code Patch
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={copyDiff}
                        disabled={loadingDiff || !commitDiff}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-700/60 transition-all disabled:opacity-40 cursor-pointer"
                      >
                        {copiedDiff ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>{copiedDiff ? "Copied" : "Copy Diff"}</span>
                      </button>

                      <button
                        onClick={downloadDiff}
                        disabled={loadingDiff || !commitDiff}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 cursor-pointer shadow-lg shadow-indigo-600/20"
                      >
                        <Download size={12} />
                        <span>Download Patch</span>
                      </button>
                    </div>
                  </div>

                  {loadingDiff ? (
                    <div className="text-slate-500 font-mono italic text-xs py-8 text-center bg-slate-950/60 rounded-xl border border-slate-800">
                      Loading patch difference...
                    </div>
                  ) : (
                    <pre className="bg-slate-950 rounded-xl border border-slate-800/80 p-2 overflow-x-auto text-xs font-mono max-h-96 custom-scrollbar">
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

        {/* Contributors List Section */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
          <SectionHeader
            title="Contributors"
            subtitle="Ranked by total commit contributions"
            count={contributorEntries.length}
            icon={Users}
          />

          {contributorEntries.length === 0 ? (
            <div className="text-slate-500 text-xs font-mono py-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/60">
              No contributors detected in repository timeline.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {contributorEntries.map(([name, contributor]) => {
                const displayName = contributor.name || name;
                return (
                  <div
                    key={name}
                    className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br ${avatarGradient(
                          displayName
                        )} flex items-center justify-center text-xs font-bold shadow-md`}
                      >
                        {initials(displayName)}
                      </div>
                      <span className="font-semibold text-xs text-slate-200 truncate">
                        {displayName}
                      </span>
                    </div>

                    <span className="text-indigo-400 font-mono text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg shrink-0">
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