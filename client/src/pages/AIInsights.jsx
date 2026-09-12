import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAnalysis } from "../context/AnalysisContext";
import API from "../services/api";
import RepositoryChatbot from "../components/RepositoryChatbot";
import {
  Sparkles,
  Calendar,
  Clock,
  FileCode,
  GitCommitHorizontal,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  Loader2,
  RefreshCw,
  Bot,
  FolderGit2,
} from "lucide-react";

// Maps section headers to UI display metadata
const SECTION_META = {
  SUMMARY: { title: "Summary", icon: Sparkles, bar: "bg-sky-500", text: "text-sky-600" },
  DEVELOPMENT_ACTIVITY: { title: "Development Activity", icon: Clock, bar: "bg-cyan-500", text: "text-cyan-600" },
  CODE_HEALTH: { title: "Code Health", icon: ShieldCheck, bar: "bg-teal-500", text: "text-teal-600" },
  HOTSPOTS: { title: "Hotspots", icon: FileCode, bar: "bg-blue-500", text: "text-blue-600" },
  COMMIT_QUALITY: { title: "Commit Quality", icon: GitCommitHorizontal, bar: "bg-indigo-400", text: "text-indigo-600" },
  RECOMMENDATIONS: { title: "Recommendations", icon: Lightbulb, bar: "bg-amber-400", text: "text-amber-600" },
  RISK: { title: "Risk", icon: AlertTriangle, bar: "bg-rose-400", text: "text-rose-600" },
};

const SECTION_ORDER = Object.keys(SECTION_META);

function parseAnalysis(text) {
  if (!text) return [];

  const pattern = new RegExp(
    `^[ \\t]*\\*{0,2}(${SECTION_ORDER.join("|")})\\*{0,2}:?[ \\t]*$`,
    "gm"
  );
  const parts = text.split(pattern).filter((part) => part.trim().length > 0);

  const sections = [];
  for (let i = 0; i < parts.length; i++) {
    const label = parts[i].trim();
    if (SECTION_ORDER.includes(label)) {
      const content = (parts[i + 1] || "").trim();
      if (content) sections.push({ key: label, content });
      i++;
    }
  }

  return sections;
}

function renderInlineMarkdown(line, keyPrefix) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${keyPrefix}-${i}`} className="font-semibold text-slate-800">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{part}</span>
    )
  );
}

function FormattedText({ text }) {
  const lines = text.split("\n");
  const blocks = [];
  let currentList = [];

  const flushList = () => {
    if (currentList.length) {
      blocks.push({ type: "list", items: currentList });
      currentList = [];
    }
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      return;
    }
    const bulletMatch = line.match(/^[*-]\s+(.*)/);
    if (bulletMatch) {
      currentList.push(bulletMatch[1]);
    } else {
      flushList();
      blocks.push({ type: "para", text: line });
    }
  });
  flushList();

  return (
    <div className="space-y-3">
      {blocks.map((block, i) =>
        block.type === "list" ? (
          <ul key={i} className="list-disc list-outside pl-5 space-y-1.5">
            {block.items.map((item, j) => (
              <li key={j} className="text-sm text-slate-600 leading-6">
                {renderInlineMarkdown(item, `${i}-${j}`)}
              </li>
            ))}
          </ul>
        ) : (
          <p key={i} className="text-sm text-slate-600 leading-6">
            {renderInlineMarkdown(block.text, `${i}`)}
          </p>
        )
      )}
    </div>
  );
}

function QuickFactStat({ icon: Icon, label, value, isLast }) {
  return (
    <div className={`flex items-center gap-3 py-4 px-5 ${!isLast ? "sm:border-r border-slate-100" : ""}`}>
      <Icon className="h-4 w-4 text-sky-500 shrink-0" strokeWidth={2} />
      <div className="min-w-0">
        <p className="text-[11px] text-slate-400 leading-none mb-1">{label}</p>
        <p className="text-sm font-semibold text-slate-900 truncate leading-none">{value}</p>
      </div>
    </div>
  );
}

function AnalysisSectionCard({ sectionKey, content }) {
  const meta = SECTION_META[sectionKey] || { title: sectionKey, icon: Sparkles, bar: "bg-slate-400", text: "text-slate-600" };
  const Icon = meta.icon;

  return (
    <div className="relative bg-white rounded-xl pl-5 pr-5 py-4 border border-slate-100 overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${meta.bar}`} />
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${meta.text}`} strokeWidth={2} />
        <h3 className="text-sm font-semibold text-slate-900">{meta.title}</h3>
      </div>
      <FormattedText text={content} />
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="relative bg-white rounded-xl pl-5 pr-5 py-4 border border-slate-100 overflow-hidden animate-pulse">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200" />
          <div className="flex items-center gap-2 mb-4">
            <div className="h-4 w-4 rounded-full bg-slate-100" />
            <div className="h-3 w-24 rounded bg-slate-100" />
          </div>
          <div className="space-y-2">
            <div className="h-2.5 rounded bg-slate-100 w-full" />
            <div className="h-2.5 rounded bg-slate-100 w-5/6" />
            <div className="h-2.5 rounded bg-slate-100 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function AIInsights() {
  const location = useLocation();
  const { repositoryId, analysis: currentAnalysis } = useAnalysis();

  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState(null);
  const [repositoryData, setRepositoryData] = useState(null);

  // Sync state whenever the active repository in context updates
  useEffect(() => {
    if (!repositoryId || !currentAnalysis) {
      setRepositoryData(null);
      setAnalysis("");
      setLastAnalyzedAt(null);
      setError("");
      return;
    }

    setRepositoryData({
      ...currentAnalysis,
      repositoryId,
    });

    // Clear stale AI analysis output from the previous repository
    setAnalysis("");
    setLastAnalyzedAt(null);
    setError("");
  }, [repositoryId, currentAnalysis]);

  const timeline = repositoryData?.timeline || [];
  const fileChanges = repositoryData?.fileChanges || [];
  const stats = repositoryData?.stats || {};

  // Most active day calculation
  const mostActiveDay = (() => {
    if (!timeline.length) return "N/A";
    const days = {};
    timeline.forEach((commit) => {
      const day = new Date(commit.date).toLocaleDateString("en-US", { weekday: "long" });
      days[day] = (days[day] || 0) + 1;
    });
    const result = Object.entries(days).sort((a, b) => b[1] - a[1])[0];
    return result ? result[0] : "N/A";
  })();

  // Most active hour calculation
  const mostActiveHour = (() => {
    if (!timeline.length) return "N/A";
    const hours = {};
    timeline.forEach((commit) => {
      const hour = new Date(commit.date).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    });
    const result = Object.entries(hours).sort((a, b) => b[1] - a[1])[0];
    if (!result) return "N/A";
    const hour = Number(result[0]);
    return `${hour}:00 – ${hour + 1}:00`;
  })();

  // Most modified file calculation
  const mostModifiedFile = (() => {
    if (!fileChanges.length) return "N/A";
    const files = {};
    fileChanges.forEach((item) => {
      const file = item.file || item.path || item.filename;
      if (file) files[file] = (files[file] || 0) + 1;
    });
    const result = Object.entries(files).sort((a, b) => b[1] - a[1])[0];
    return result ? result[0] : "N/A";
  })();

  const quickFacts = [
    { icon: Calendar, label: "Most Active Day", value: mostActiveDay },
    { icon: Clock, label: "Most Active Hour", value: mostActiveHour },
    { icon: FileCode, label: "Most Modified File", value: mostModifiedFile },
    { icon: GitCommitHorizontal, label: "Total Commits", value: stats.totalCommits || 0 },
  ];

  async function generateAIAnalysis() {
    if (!repositoryData || !repositoryId) {
      setError("Repository data is not available. Analyze a repository first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Send lightweight payload to prevent 413 Payload Too Large
      const aiPayload = {
        repositoryId,
        repoUrl: repositoryData.repoUrl,
        repository: repositoryData.repository
          ? {
              name: repositoryData.repository.name,
              description: repositoryData.repository.description,
              language: repositoryData.repository.language,
              stars: repositoryData.repository.stars,
              forks: repositoryData.repository.forks,
            }
          : null,
        stats: repositoryData.stats || {},

        // Contributors, so the backend's Contributor Activity section has data
        contributors: repositoryData.contributors || [],

        // Capped commit summary
        timeline: (repositoryData.timeline || [])
          .slice(0, 100)
          .map((commit) => ({
            hash: commit.hash,
            message: commit.message,
            author: commit.author,
            date: commit.date,
            type: commit.type,
          })),

        // Capped file change summary
        fileChanges: (repositoryData.fileChanges || [])
          .slice(0, 100)
          .map((file) => ({
            file: file.file || file.path || file.filename,
            additions: file.additions || 0,
            deletions: file.deletions || 0,
            changes: file.changes || 0,
          })),
      };

      const response = await API.post("/ai/analyze-repository", aiPayload);

      setAnalysis(response.data.analysis);
      setLastAnalyzedAt(new Date());
    } catch (err) {
      console.error("AI analysis error:", err);
      setError(err.response?.data?.error || "Failed to generate AI analysis.");
    } finally {
      setLoading(false);
    }
  }

  const sections = parseAnalysis(analysis);

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header — light text since this app's page canvas is dark */}
      <div className="flex items-center justify-between mb-1 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-white tracking-tight">AI Insights</h1>
          <span className="text-[10px] font-semibold text-sky-300 bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded-full">
            Beta
          </span>
        </div>
      </div>
      <p className="text-slate-400 text-sm mb-8">
        Get AI-powered insights about your repository.
      </p>

      {/* No repository connected state */}
      {!repositoryData && (
        <div className="rounded-2xl border border-dashed border-slate-700 p-12 flex flex-col items-center text-center">
          <div className="h-11 w-11 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <FolderGit2 className="h-5 w-5 text-slate-500" />
          </div>
          <h2 className="text-sm font-semibold text-white">No repository connected</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            Analyze a repository from the dashboard first, then come back here to generate AI insights for it.
          </p>
        </div>
      )}

      {repositoryData && (
        <div className="space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Facts strip */}
          <div className="rounded-xl border border-slate-100 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 divide-slate-100">
            {quickFacts.map((fact, i) => (
              <QuickFactStat key={fact.label} {...fact} isLast={i === quickFacts.length - 1} />
            ))}
          </div>

          {/* AI Analysis Panel — hero treatment */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 text-white">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 15% 20%, rgba(56,189,248,0.35), transparent 45%), radial-gradient(circle at 85% 75%, rgba(45,212,191,0.25), transparent 45%)",
              }}
            />
            <div className="relative p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-sky-300" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">Repository Analysis</h2>
                    {lastAnalyzedAt && !loading && (
                      <p className="text-xs text-slate-400">
                        Last analyzed {lastAnalyzedAt.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={generateAIAnalysis}
                  disabled={loading || !repositoryData}
                  title={!repositoryData ? "Analyze a repository first" : undefined}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-400 text-slate-900 text-sm font-semibold hover:bg-sky-300 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      {analysis ? "Re-analyze" : "Analyze Repository"}
                    </>
                  )}
                </button>
              </div>

              {!analysis && !loading && (
                <p className="text-sm text-slate-400 mt-4 max-w-md">
                  Generate a summary, development activity breakdown, and recommendations for this codebase.
                </p>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="mt-2">
            {loading ? (
              <>
                <div className="flex items-center gap-3 text-slate-300 pb-4 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                  <span>AI is analyzing your repository...</span>
                </div>
                <AnalysisSkeleton />
              </>
            ) : analysis ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="h-4 w-4 text-sky-400" />
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Findings
                  </span>
                </div>

                {sections.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sections.map((section) => (
                      <AnalysisSectionCard key={section.key} sectionKey={section.key} content={section.content} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-slate-100 p-5">
                    <FormattedText text={analysis} />
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* AI Assistant Chatbot */}
          <RepositoryChatbot repositoryId={repositoryId} />
        </div>
      )}
    </div>
  );
}

export default AIInsights;