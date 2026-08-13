import { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import API from "../services/api";
import { useAnalysis } from "../context/AnalysisContext";
import {
  Bug,
  Sparkles,
  Loader2,
  AlertCircle,
  Download,
  FileCode,
  CheckCircle2,
  GitCommit,
  Star,
  GitFork,
  Circle,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

function parseOwnerRepo(url) {
  if (!url) return null;

  if (url.startsWith("git@github.com:")) {
    const path = url.replace("git@github.com:", "").replace(/\.git$/, "");
    const [owner, repo] = path.split("/");
    if (!owner || !repo) return null;
    return { owner, repo };
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com" && parsed.hostname !== "www.github.com") {
      return null;
    }

    const parts = parsed.pathname
      .replace(/^\/|\/$/g, "")
      .replace(/\.git$/, "")
      .split("/");

    if (parts.length < 2) return null;

    return { owner: parts[0], repo: parts[1] };
  } catch {
    return null;
  }
}

export default function IssueSolver() {
  const location = useLocation();
  const params = useParams();

  const { analysis, repositoryId } = useAnalysis();
  const contextRepoUrl = analysis?.repoUrl;
  const contextRepository = analysis?.repository;

  const sessionRepoUrl = sessionStorage.getItem("repoUrl");
  const sessionRepoData = sessionStorage.getItem("repositoryData")
    ? JSON.parse(sessionStorage.getItem("repositoryData"))
    : null;

  const repoUrl =
    contextRepoUrl ||
    sessionRepoUrl ||
    location.state?.repoUrl ||
    (params.owner && params.repo ? `https://github.com/${params.owner}/${params.repo}` : "");

  const repository = contextRepository || sessionRepoData || location.state?.repository || null;

  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [solution, setSolution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [solving, setSolving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [solveError, setSolveError] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  async function loadIssues() {
    setLoadError("");
    setSolveError("");
    setSolution(null);
    setSelectedIssue(null);
    setIssues([]);

    if (!repoUrl) {
      setLoadError("No repository found. Please analyze a repository from the Home page first.");
      return;
    }

    const parsed = parseOwnerRepo(repoUrl);
    if (!parsed) {
      setLoadError("Invalid GitHub repository URL.");
      return;
    }

    try {
      setLoading(true);
      const response = await API.post("/repository/issues", { repoUrl });

      if (response.data.repository) {
        sessionStorage.setItem("repositoryData", JSON.stringify(response.data.repository));
      }
      setIssues(response.data.issues || []);
    } catch (error) {
      console.error(error);
      setLoadError(
        error.response?.data?.message || "Unable to load issues for this repository."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (repoUrl) {
      loadIssues();
    }
  }, [repoUrl]);

  async function solveIssue(issue) {
    setSelectedIssue(issue);
    setSolution(null);
    setSolveError("");

    const parsed = parseOwnerRepo(repoUrl);
    if (!parsed) {
      setSolveError("Invalid repository URL.");
      return;
    }

    try {
      setSolving(true);

      const response = await API.post("/repository/issue-solution", {
        owner: parsed.owner,
        repo: parsed.repo,
        issueNumber: issue.number,
        repositoryId,
      });

      setSolution(response.data.solution);
    } catch (error) {
      console.error(error);
      setSolveError(
        error.response?.data?.message || "Failed to generate AI solution."
      );
    } finally {
      setSolving(false);
    }
  }

  const downloadPDF = () => {
    if (!solution || !selectedIssue) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Issue #${selectedIssue.number}: ${selectedIssue.title}`, 14, 20);

    doc.setFontSize(12);
    doc.text(`Repository: ${repository?.owner}/${repository?.name}`, 14, 28);
    doc.text(`Confidence: ${solution.confidence}% | Complexity: ${solution.complexity}`, 14, 34);

    autoTable(doc, {
      startY: 40,
      head: [["Category", "Details"]],
      body: [
        ["Summary", solution.summary || "N/A"],
        ["Root Cause", solution.rootCause || "N/A"],
        ["Solution", solution.solution || "N/A"],
        ["Affected Files", (solution.affectedFiles || []).join(", ") || "None"],
      ],
      styles: { cellWidth: "wrap" },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 140 } },
    });

    doc.save(`Issue-${selectedIssue.number}-Solution.pdf`);
  };

  const handleCopyCode = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  function getLanguageColor(language) {
    const colors = {
      JavaScript: "#f1e05a",
      TypeScript: "#3178c6",
      Java: "#b07219",
      Python: "#3572A5",
      C: "#555555",
      "C++": "#f34b7d",
      Go: "#00ADD8",
      Rust: "#dea584",
      HTML: "#e34c26",
      CSS: "#563d7c",
    };
    return colors[language] || "#9ca3af";
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0F17] via-[#0D1117] to-[#010409] text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Header */}
      <header className="border-b border-slate-800/80 bg-[#161B22]/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl shadow-lg shadow-emerald-900/20 ring-1 ring-emerald-400/30">
              <Bug className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                  AI Issue Resolver
                </h1>
                <span className="text-[10px] font-semibold tracking-wide uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                  Powered by Gemini
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {repository
                  ? `Analyzing ${repository.owner}/${repository.name}`
                  : "Context-aware automated codebase troubleshooting"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Banner Alert for Empty Repo Context */}
        {!repoUrl && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3 text-amber-200 backdrop-blur-sm">
            <AlertCircle className="text-amber-400 shrink-0 w-5 h-5" />
            <p className="text-sm">
              No active repository context found. Please analyze a repository from the dashboard to enable issue resolution.
            </p>
          </div>
        )}

        {/* Load Error Alert */}
        {loadError && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 text-rose-300 backdrop-blur-sm">
            <AlertCircle className="text-rose-400 shrink-0 w-5 h-5" />
            <p className="text-sm">{loadError}</p>
          </div>
        )}

        {/* Repository Overview Card */}
        {repository && (
          <section className="bg-[#161B22]/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <FaGithub className="w-6 h-6 text-slate-300" />
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    {repository.owner} <span className="text-slate-500">/</span> {repository.name}
                  </h2>
                </div>
                <p className="text-sm text-slate-400 max-w-2xl">
                  {repository.description || "No repository description available."}
                </p>
              </div>
              <img
                src={repository.avatarUrl || "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"}
                alt="Avatar"
                className="w-14 h-14 rounded-xl ring-2 ring-slate-800 object-cover shadow-md"
              />
            </div>

            {/* Repository Meta Tags */}
            <div className="flex flex-wrap items-center gap-6 mt-6 pt-4 border-t border-slate-800/80 text-xs font-medium text-slate-400">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-slate-200">{repository.stars ?? 0}</span> stars
              </div>
              <div className="flex items-center gap-1.5">
                <GitFork className="w-4 h-4 text-indigo-400" />
                <span className="text-slate-200">{repository.forks ?? 0}</span> forks
              </div>
              <div className="flex items-center gap-1.5">
                <Bug className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-200">{issues.length}</span> Issues loaded
              </div>
              {repository.language && (
                <div className="flex items-center gap-1.5">
                  <Circle className="w-2.5 h-2.5 fill-current" style={{ color: getLanguageColor(repository.language) }} />
                  <span className="text-slate-200">{repository.language}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Dashboard Grid View */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Issues List */}
          <section className="lg:col-span-5 bg-[#161B22]/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl shadow-lg flex flex-col h-[780px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-200 flex items-center gap-2">
                Repository Issues
                <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full font-mono">
                  {issues.length}
                </span>
              </h2>
            </div>

            {/* Skeleton Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center flex-1 space-y-3">
                <Loader2 className="animate-spin text-emerald-400 w-8 h-8" />
                <p className="text-xs text-slate-400 font-medium">Fetching repository issues...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && repoUrl && issues.length === 0 && (
              <div className="flex flex-col items-center justify-center flex-1 text-center p-6 space-y-3">
                <div className="p-4 bg-slate-800/40 rounded-full">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200">No Open Issues</h3>
                <p className="text-xs text-slate-400 max-w-xs">
                  This repository has no open issues that require resolution right now.
                </p>
              </div>
            )}

            {/* Scrollable Issue List */}
            <div className="overflow-y-auto space-y-3 pr-1 flex-1 custom-scrollbar">
              {issues.map((issue) => {
                const isSelected = selectedIssue?.id === issue.id;
                return (
                  <div
                    key={issue.id || issue.number}
                    className={`group relative rounded-xl border p-4 transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "border-indigo-500/80 bg-indigo-500/10 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/50"
                        : "border-slate-800/80 hover:border-slate-700 bg-[#0D1117]/50 hover:bg-[#0D1117]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-400">
                            #{issue.number}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize ${
                              issue.state === "open"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {issue.state}
                          </span>
                        </div>

                        <h3 className="font-semibold text-sm text-slate-200 line-clamp-1 group-hover:text-indigo-300 transition-colors">
                          {issue.title}
                        </h3>

                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {issue.body || "No detailed description provided."}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          solveIssue(issue);
                        }}
                        disabled={solving && selectedIssue?.id === issue.id}
                        className="shrink-0 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
                      >
                        {solving && selectedIssue?.id === issue.id ? (
                          <Loader2 className="animate-spin w-3.5 h-3.5" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                        )}
                        <span>{solving && selectedIssue?.id === issue.id ? "Solving" : "Solve"}</span>
                      </button>
                    </div>

                    {/* Labels */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-800/60">
                      {(issue.labels || []).slice(0, 3).map((label, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-800/80 text-[10px] font-medium px-2 py-0.5 rounded text-slate-300 border border-slate-700/50"
                        >
                          {typeof label === "object" ? label.name : label}
                        </span>
                      ))}
                      <span className="ml-auto text-[10px] text-slate-500">
                        by <span className="text-slate-400">{issue.author || "Unknown"}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right Column: AI Solution Panel */}
          <section className="lg:col-span-7 bg-[#161B22]/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-lg min-h-[780px] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-100">AI Generated Solution</h2>
                  <p className="text-xs text-slate-400">Contextual root-cause analysis & patches</p>
                </div>
              </div>

              {solution && (
                <button
                  onClick={downloadPDF}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export PDF</span>
                </button>
              )}
            </div>

            {/* Empty State */}
            {!selectedIssue && !solution && !solving && (
              <div className="flex flex-col items-center justify-center flex-1 text-center p-8 space-y-4">
                <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-800">
                  <Sparkles className="w-10 h-10 text-slate-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-200">No Solution Active</h3>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                    Select an issue from the list and click <span className="text-indigo-400 font-semibold">Solve</span> to let Gemini analyze repository context and propose fixes.
                  </p>
                </div>
              </div>
            )}

            {/* Solving Loading Indicator */}
            {solving && (
              <div className="my-auto bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 text-indigo-300 flex items-center gap-4">
                <Loader2 className="animate-spin w-6 h-6 text-indigo-400 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-indigo-200">Analyzing Repository Context</h4>
                  <p className="text-xs text-indigo-300/80 leading-relaxed">
                    Reading code AST, cross-referencing commit logs, and formulating optimal solution...
                  </p>
                </div>
              </div>
            )}

            {/* Solution Error Message */}
            {solveError && (
              <div className="my-auto bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-300 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <p className="text-sm">{solveError}</p>
              </div>
            )}

            {/* Render Solution Payload */}
            {solution && !solving && (
              <div className="mt-6 space-y-6 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                {/* Metrics Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0D1117] p-4 rounded-xl border border-slate-800/80 space-y-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confidence Score</span>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-emerald-400">{solution.confidence}%</span>
                      <span className="text-[10px] text-slate-500 font-mono">Precision Match</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${solution.confidence}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-[#0D1117] p-4 rounded-xl border border-slate-800/80 space-y-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Complexity</span>
                    <div>
                      <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {solution.complexity || "Medium"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Executive Summary</h3>
                  <p className="text-sm text-slate-300 leading-relaxed bg-[#0D1117] p-4 rounded-xl border border-slate-800/80">
                    {solution.summary}
                  </p>
                </div>

                {/* Root Cause */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Root Cause Analysis</h3>
                  <div className="text-sm text-slate-300 leading-relaxed bg-[#0D1117] p-4 rounded-xl border border-slate-800/80 font-mono text-xs">
                    {solution.rootCause}
                  </div>
                </div>

                {/* Recommended Solution */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Recommended Strategy</h3>
                  <div className="text-sm text-slate-300 leading-relaxed bg-[#0D1117] p-4 rounded-xl border border-slate-800/80 whitespace-pre-wrap">
                    {solution.solution}
                  </div>
                </div>

                {/* Affected Files */}
                {solution.affectedFiles?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileCode className="w-4 h-4" /> Affected Files
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {solution.affectedFiles.map((file, idx) => (
                        <span
                          key={idx}
                          className="bg-[#0D1117] text-slate-300 font-mono text-xs px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5"
                        >
                          <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step-by-Step Implementation */}
                {solution.implementationSteps?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Implementation Workflow
                    </h3>
                    <ol className="space-y-2">
                      {solution.implementationSteps.map((step, i) => (
                        <li key={i} className="flex gap-3 bg-[#0D1117] p-3 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                          <span className="font-mono text-emerald-400 font-bold shrink-0">{i + 1}.</span>
                          <span className="leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Related Commits */}
                {solution.relatedCommits?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                      <GitCommit className="w-4 h-4" /> Contextual Commits
                    </h3>
                    <div className="space-y-2">
                      {solution.relatedCommits.map((commit, index) => (
                        <div key={commit.hash || index} className="bg-[#0D1117] border border-slate-800/80 rounded-xl p-3 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-purple-400 font-semibold">
                              {commit.hash ? commit.hash.substring(0, 7) : "Commit"}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {commit.date ? new Date(commit.date).toLocaleDateString() : ""}
                            </span>
                          </div>
                          <p className="text-slate-200 font-medium">{commit.message}</p>
                          <p className="text-[10px] text-slate-400">By {commit.author}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Code Patch Differential */}
                {solution.patch?.file && (
                  <div className="space-y-3 pt-4 border-t border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Proposed Patch</h3>
                      <span className="font-mono text-xs text-slate-400 bg-[#0D1117] px-2.5 py-1 rounded-md border border-slate-800">
                        {solution.patch.file}
                      </span>
                    </div>

                    {/* Diff Viewer Card */}
                    <div className="bg-black/80 rounded-xl border border-slate-800 overflow-hidden font-mono text-xs">
                      {/* Old Code Block */}
                      <div className="p-3 bg-rose-500/5 border-b border-slate-800/80">
                        <div className="text-[10px] font-bold text-rose-400 mb-1 uppercase tracking-wider">- Original Code</div>
                        <pre className="text-rose-300/90 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                          {solution.patch.oldCode}
                        </pre>
                      </div>

                      {/* New Code Block */}
                      <div className="p-3 bg-emerald-500/5 relative group">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">+ Proposed Fix</span>
                          <button
                            onClick={() => handleCopyCode(solution.patch.newCode)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-md transition-colors"
                            title="Copy Fix"
                          >
                            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <pre className="text-emerald-300/90 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                          {solution.patch.newCode}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}