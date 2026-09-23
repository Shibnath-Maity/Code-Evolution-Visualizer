import { useState, useEffect, useMemo } from "react";
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
  Check,
  Search,
  X,
  ChevronRight,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

const MONO =
  '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

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

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const day = 86400000;
  if (Number.isNaN(diff)) return null;
  if (diff < day) return "today";
  const days = Math.floor(diff / day);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

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

function CopyButton({ text, className = "" }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text || "");
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className={`inline-flex items-center gap-1.5 rounded-md border border-slate-700/80 bg-slate-900/80 px-2 py-1 text-[11px] font-medium text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${className}`}
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// Renders a code block as a real gutter with line numbers, optionally tinted
// red/green to read as a diff hunk instead of a plain <pre>.
function CodeBlock({ code, tone }) {
  const lines = (code || "").replace(/\n$/, "").split("\n");
  const toneStyles = {
    remove: { bg: "bg-rose-500/[0.07]", num: "text-rose-500/50", mark: "text-rose-400", prefix: "-" },
    add: { bg: "bg-emerald-500/[0.07]", num: "text-emerald-500/50", mark: "text-emerald-400", prefix: "+" },
    plain: { bg: "", num: "text-slate-600", mark: "text-slate-500", prefix: "" },
  };
  const t = toneStyles[tone] || toneStyles.plain;

  return (
    <div className={`overflow-x-auto ${t.bg}`} style={{ fontFamily: MONO }}>
      {lines.map((line, i) => (
        <div key={i} className="flex text-[12.5px] leading-[1.65]">
          <span className={`w-9 shrink-0 select-none text-right pr-3 ${t.num}`}>{i + 1}</span>
          <span className={`w-4 shrink-0 select-none ${t.mark}`}>{t.prefix}</span>
          <span className="whitespace-pre pr-4 text-slate-200">{line || " "}</span>
        </div>
      ))}
    </div>
  );
}

function ScoreRing({ value = 0 }) {
  const size = 52;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(Math.max(value, 0), 100) / 100) * c;
  const color = value >= 75 ? "#34d399" : value >= 45 ? "#fbbf24" : "#fb7185";
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#1e293b" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 600ms ease" }}
      />
    </svg>
  );
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
  const [query, setQuery] = useState("");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [solution, setSolution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [solving, setSolving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [solveError, setSolveError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoUrl]);

  async function solveIssue(issue) {
    setSelectedIssue(issue);
    setSolution(null);
    setSolveError("");
    setActiveTab("overview");

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

  const filteredIssues = useMemo(() => {
    if (!query.trim()) return issues;
    const q = query.toLowerCase();
    return issues.filter(
      (issue) =>
        issue.title?.toLowerCase().includes(q) ||
        String(issue.number).includes(q) ||
        (issue.labels || []).some((l) => (typeof l === "object" ? l.name : l)?.toLowerCase().includes(q))
    );
  }, [issues, query]);

  const tabs = [
    { id: "overview", label: "Overview", show: true },
    { id: "patch", label: "Patch", show: !!solution?.patch?.file },
    { id: "files", label: "Files", show: (solution?.affectedFiles || []).length > 0 },
    { id: "commits", label: "Commits", show: (solution?.relatedCommits || []).length > 0 },
  ].filter((t) => t.show);

  return (
    <div
      className="min-h-screen bg-[#0A0D12] text-slate-100 antialiased selection:bg-indigo-500/40 selection:text-white"
      style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0A0D12]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/25 sm:h-9 sm:w-9">
              <Bug className="h-4 w-4 text-emerald-400 sm:h-4.5 sm:w-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-[14px] font-semibold tracking-tight text-slate-100 sm:text-[15px]">Issue Resolver</h1>
              </div>
              <p className="truncate text-[11.5px] text-slate-500 sm:text-[12px]">
                {repository ? (
                  <span style={{ fontFamily: MONO }}>
                    {repository.owner}/{repository.name}
                  </span>
                ) : (
                  "Automated root-cause analysis for open issues"
                )}
              </p>
            </div>
          </div>

          {repoUrl && (
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className="flex shrink-0 items-center gap-1.5 rounded-md border border-white/[0.08] px-2.5 py-1.5 text-[12px] font-medium text-slate-400 transition-colors hover:border-white/20 hover:text-slate-200 sm:px-3"
            >
              <FaGithub className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">View repo</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:space-y-5 sm:px-6 sm:py-6">
        {!repoUrl && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-4 text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-[13px] leading-relaxed">
              No active repository context. Analyze a repository from the dashboard first to enable issue resolution.
            </p>
          </div>
        )}

        {loadError && (
          <div className="flex items-start gap-3 rounded-lg border border-rose-500/20 bg-rose-500/[0.06] p-4 text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <p className="text-[13px] leading-relaxed">{loadError}</p>
          </div>
        )}

        {/* Repository strip */}
        {repository && (
          <section className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[12px] text-slate-400 sm:gap-x-6 sm:px-5 sm:py-3.5 sm:text-[12.5px]">
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-medium text-slate-200">{repository.stars ?? 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <GitFork className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-medium text-slate-200">{repository.forks ?? 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bug className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-medium text-slate-200">{issues.length}</span> open
            </div>
            {repository.language && (
              <div className="flex items-center gap-1.5">
                <Circle className="h-2 w-2 fill-current" style={{ color: getLanguageColor(repository.language) }} />
                <span className="font-medium text-slate-200">{repository.language}</span>
              </div>
            )}
            {repository.description && (
              <span className="truncate text-slate-500">{repository.description}</span>
            )}
          </section>
        )}

        {/* Workspace */}
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-12">
          {/* Issue list */}
          <section className="flex h-[70vh] min-h-[420px] flex-col rounded-xl border border-white/[0.07] bg-white/[0.015] lg:h-[760px] lg:col-span-5">
            <div className="border-b border-white/[0.06] p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-slate-300">Open issues</h2>
                <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[11px] text-slate-500" style={{ fontFamily: MONO }}>
                  {filteredIssues.length}
                </span>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter by title, #, or label"
                  className="w-full rounded-md border border-white/[0.08] bg-black/30 py-1.5 pl-8 pr-7 text-[12.5px] text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/50"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {loading && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
                <p className="text-[12px] text-slate-500">Fetching repository issues…</p>
              </div>
            )}

            {!loading && repoUrl && issues.length === 0 && !loadError && (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                <h3 className="text-[13px] font-medium text-slate-200">No open issues</h3>
                <p className="text-[12px] leading-relaxed text-slate-500">
                  This repository has nothing open that needs resolving right now.
                </p>
              </div>
            )}

            {!loading && issues.length > 0 && filteredIssues.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
                <p className="text-[12.5px] text-slate-500">No issues match “{query}”</p>
              </div>
            )}

            <div className="custom-scrollbar flex-1 space-y-1.5 overflow-y-auto p-3">
              {filteredIssues.map((issue) => {
                const isSelected = selectedIssue?.id === issue.id;
                const isSolvingThis = solving && isSelected;
                return (
                  <button
                    key={issue.id || issue.number}
                    onClick={() => solveIssue(issue)}
                    disabled={isSolvingThis}
                    className={`group w-full rounded-lg border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 ${
                      isSelected
                        ? "border-indigo-500/50 bg-indigo-500/[0.08]"
                        : "border-transparent bg-white/[0.015] hover:border-white/[0.08] hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11.5px] font-medium text-slate-500" style={{ fontFamily: MONO }}>
                            #{issue.number}
                          </span>
                          {timeAgo(issue.createdAt || issue.created_at) && (
                            <span className="text-[11px] text-slate-600">{timeAgo(issue.createdAt || issue.created_at)}</span>
                          )}
                        </div>
                        <h3 className="line-clamp-1 text-[13px] font-medium text-slate-200">{issue.title}</h3>
                        <p className="line-clamp-1 text-[12px] leading-relaxed text-slate-500">
                          {issue.body || "No description provided."}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {(issue.labels || []).slice(0, 3).map((label, idx) => (
                            <span
                              key={idx}
                              className="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-[1px] text-[10.5px] text-slate-400"
                            >
                              {typeof label === "object" ? label.name : label}
                            </span>
                          ))}
                          <span className="ml-auto text-[10.5px] text-slate-600">{issue.author || "unknown"}</span>
                        </div>
                      </div>
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors sm:h-7 sm:w-7 ${
                          isSelected ? "bg-indigo-500 text-white" : "bg-white/[0.04] text-slate-500 group-hover:text-slate-300"
                        }`}
                      >
                        {isSolvingThis ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Solution panel */}
          <section className="flex min-h-[70vh] flex-col rounded-xl border border-white/[0.07] bg-white/[0.015] lg:min-h-[760px] lg:col-span-7">
            <div className="flex items-center justify-between border-b border-white/[0.06] p-4">
              <div className="min-w-0">
                <h2 className="text-[13px] font-semibold text-slate-300">
                  {selectedIssue ? (
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="text-slate-600">Issue</span>
                      <ChevronRight className="h-3 w-3 text-slate-700" />
                      <span className="truncate text-slate-200" style={{ fontFamily: MONO }}>
                        #{selectedIssue.number}
                      </span>
                    </span>
                  ) : (
                    "AI solution"
                  )}
                </h2>
                {selectedIssue && (
                  <p className="mt-0.5 line-clamp-1 text-[12.5px] text-slate-500">{selectedIssue.title}</p>
                )}
              </div>

              {solution && (
                <button
                  onClick={downloadPDF}
                  className="flex shrink-0 items-center gap-1.5 rounded-md border border-white/[0.1] bg-white/[0.04] px-2.5 py-1.5 text-[12px] font-medium text-slate-300 transition-colors hover:border-white/20 hover:bg-white/[0.07]"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export PDF
                </button>
              )}
            </div>

            {!selectedIssue && !solving && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <Sparkles className="h-6 w-6 text-slate-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-[13.5px] font-medium text-slate-300">Nothing selected yet</h3>
                  <p className="max-w-sm text-[12.5px] leading-relaxed text-slate-500">
                    Pick an issue on the left to generate a root-cause analysis and a proposed patch.
                  </p>
                </div>
              </div>
            )}

            {solving && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                <div className="space-y-1">
                  <h4 className="text-[13.5px] font-medium text-slate-200">Analyzing repository context</h4>
                  <p className="max-w-sm text-[12.5px] leading-relaxed text-slate-500">
                    Reading source, cross-referencing commit history, and drafting a fix…
                  </p>
                </div>
              </div>
            )}

            {solveError && !solving && (
              <div className="flex flex-1 items-start justify-center p-8">
                <div className="flex w-full max-w-md items-start gap-3 rounded-lg border border-rose-500/20 bg-rose-500/[0.06] p-4 text-rose-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <p className="text-[13px] leading-relaxed">{solveError}</p>
                </div>
              </div>
            )}

            {solution && !solving && (
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Metrics */}
                <div className="flex flex-wrap items-center gap-4 border-b border-white/[0.06] px-4 py-3.5 sm:gap-6">
                  <div className="flex items-center gap-3">
                    <ScoreRing value={solution.confidence ?? 0} />
                    <div>
                      <div className="text-[17px] font-semibold text-slate-100">{solution.confidence}%</div>
                      <div className="text-[11px] text-slate-500">confidence</div>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-white/[0.06]" />
                  <div>
                    <span className="inline-flex items-center rounded-md border border-indigo-500/25 bg-indigo-500/10 px-2 py-1 text-[11.5px] font-medium text-indigo-300">
                      {solution.complexity || "Medium"} complexity
                    </span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto border-b border-white/[0.06] px-4">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative shrink-0 px-3 py-2.5 text-[12.5px] font-medium transition-colors ${
                        activeTab === tab.id ? "text-slate-100" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <span className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-indigo-500" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
                  {activeTab === "overview" && (
                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Summary</h3>
                        <p className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3.5 text-[13px] leading-relaxed text-slate-300">
                          {solution.summary}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-rose-400/80">Root cause</h3>
                        <div className="rounded-lg border border-white/[0.06] bg-black/30 p-3.5 text-[13px] leading-relaxed text-slate-300" style={{ fontFamily: MONO, fontSize: 12.5 }}>
                          {solution.rootCause}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-amber-400/80">Strategy</h3>
                        <div className="whitespace-pre-wrap rounded-lg border border-white/[0.06] bg-white/[0.02] p-3.5 text-[13px] leading-relaxed text-slate-300">
                          {solution.solution}
                        </div>
                      </div>

                      {solution.implementationSteps?.length > 0 && (
                        <div className="space-y-1.5">
                          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-emerald-400/80">
                            Implementation steps
                          </h3>
                          <ol className="space-y-1.5">
                            {solution.implementationSteps.map((step, i) => (
                              <li
                                key={i}
                                className="flex gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-[12.5px] text-slate-300"
                              >
                                <span
                                  className="shrink-0 font-semibold text-emerald-400"
                                  style={{ fontFamily: MONO }}
                                >
                                  {String(i + 1).padStart(2, "0")}
                                </span>
                                <span className="leading-relaxed">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "patch" && solution.patch?.file && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[12px] text-slate-300"
                          style={{ fontFamily: MONO }}
                        >
                          {solution.patch.file}
                        </span>
                        <CopyButton text={solution.patch.newCode} />
                      </div>
                      <div className="overflow-hidden rounded-lg border border-white/[0.08]">
                        <div className="border-b border-white/[0.06] bg-rose-500/[0.04] px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-rose-400/80">
                          Before
                        </div>
                        <CodeBlock code={solution.patch.oldCode} tone="remove" />
                        <div className="border-y border-white/[0.06] bg-emerald-500/[0.04] px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-emerald-400/80">
                          After
                        </div>
                        <CodeBlock code={solution.patch.newCode} tone="add" />
                      </div>
                    </div>
                  )}

                  {activeTab === "files" && (
                    <div className="space-y-2">
                      {(solution.affectedFiles || []).map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5"
                        >
                          <FileCode className="h-4 w-4 shrink-0 text-cyan-400" />
                          <span className="truncate text-[12.5px] text-slate-300" style={{ fontFamily: MONO }}>
                            {file}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "commits" && (
                    <div className="space-y-2">
                      {(solution.relatedCommits || []).map((commit, index) => (
                        <div
                          key={commit.hash || index}
                          className="space-y-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-[12px] font-medium text-purple-300" style={{ fontFamily: MONO }}>
                              <GitCommit className="h-3.5 w-3.5" />
                              {commit.hash ? commit.hash.substring(0, 7) : "commit"}
                            </span>
                            <span className="text-[11px] text-slate-600">
                              {commit.date ? new Date(commit.date).toLocaleDateString() : ""}
                            </span>
                          </div>
                          <p className="text-[13px] text-slate-200">{commit.message}</p>
                          <p className="text-[11px] text-slate-500">by {commit.author}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}