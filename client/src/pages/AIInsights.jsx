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
  SUMMARY: { title: "Summary", icon: Sparkles, accent: "bg-indigo-50 text-indigo-600" },
  DEVELOPMENT_ACTIVITY: { title: "Development Activity", icon: Clock, accent: "bg-blue-50 text-blue-600" },
  CODE_HEALTH: { title: "Code Health", icon: ShieldCheck, accent: "bg-emerald-50 text-emerald-600" },
  HOTSPOTS: { title: "Hotspots", icon: FileCode, accent: "bg-orange-50 text-orange-600" },
  COMMIT_QUALITY: { title: "Commit Quality", icon: GitCommitHorizontal, accent: "bg-amber-50 text-amber-600" },
  RECOMMENDATIONS: { title: "Recommendations", icon: Lightbulb, accent: "bg-amber-50 text-amber-600" },
  RISK: { title: "Risk", icon: AlertTriangle, accent: "bg-red-50 text-red-600" },
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

function QuickFactCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-start gap-3">
      <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-indigo-600" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-900 truncate">{value}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
    </div>
  );
}

function AnalysisSectionCard({ sectionKey, content }) {
  const meta = SECTION_META[sectionKey] || { title: sectionKey, icon: Sparkles, accent: "bg-slate-100 text-slate-600" };
  const Icon = meta.icon;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-3">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${meta.accent}`}>
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">{meta.title}</h3>
      </div>
      <FormattedText text={content} />
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-slate-100" />
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
    { icon: Calendar, label: "Most Active Day", value: mostActiveDay, sub: "Based on commit history" },
    { icon: Clock, label: "Most Active Hour", value: mostActiveHour, sub: "Based on commit history" },
    { icon: FileCode, label: "Most Modified File", value: mostModifiedFile, sub: "Based on file changes" },
    { icon: GitCommitHorizontal, label: "Total Commits", value: stats.totalCommits || 0, sub: "Repository history" },
  ];

  async function generateAIAnalysis() {
    if (!repositoryData || !repositoryId) {
      setError("Repository data is not available. Analyze a repository first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await API.post("/ai/analyze-repository", {
        ...repositoryData,
        repositoryId,
      });

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
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-slate-900">AI Insights</h1>
          <span className="text-[10px] uppercase font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
            Beta
          </span>
        </div>

        <button
          onClick={generateAIAnalysis}
          disabled={loading || !repositoryData}
          title={!repositoryData ? "Analyze a repository first" : undefined}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              {analysis ? "Re-analyze Repository" : "Analyze Repository"}
            </>
          )}
        </button>
      </div>

      <p className="text-slate-500 mt-2 mb-8">
        Get AI-powered insights about your repository.
      </p>

      {/* No repository connected state */}
      {!repositoryData && (
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4">
            <FolderGit2 className="h-6 w-6 text-slate-400" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">No repository connected</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            Analyze a repository from the dashboard first, then come back here to generate AI insights for it.
          </p>
        </div>
      )}

      {repositoryData && (
        <div className="space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2 p-4 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* AI Summary Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <h2 className="text-xl font-semibold text-slate-900">AI Repository Analysis</h2>
              </div>
              {lastAnalyzedAt && !loading && (
                <span className="text-xs text-slate-400">
                  Last analyzed {lastAnalyzedAt.toLocaleTimeString()}
                </span>
              )}
            </div>

            <div className="mt-5">
              {loading ? (
                <>
                  <div className="flex items-center gap-3 text-slate-500 pb-4">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                    <span>Llama 3.2 is analyzing your repository...</span>
                  </div>
                  <AnalysisSkeleton />
                </>
              ) : analysis ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Bot className="h-5 w-5 text-indigo-600" />
                    <span className="font-medium text-slate-900">Llama 3.2 Analysis</span>
                  </div>

                  {sections.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sections.map((section) => (
                        <AnalysisSectionCard key={section.key} sectionKey={section.key} content={section.content} />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-5">
                      <FormattedText text={analysis} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center text-center py-10">
                  <div className="h-11 w-11 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                  </div>
                  <p className="text-sm text-slate-500 max-w-sm">
                    Click <span className="font-medium text-indigo-600">Analyze Repository</span> to let your AI
                    assistant generate a summary, development activity breakdown, and recommendations for this
                    codebase.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Facts */}
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Quick Facts
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {quickFacts.map((fact) => (
                <QuickFactCard key={fact.label} {...fact} />
              ))}
            </div>
          </div>

          {/* AI Assistant Chatbot */}
          <RepositoryChatbot repositoryId={repositoryId} />
        </div>
      )}
    </div>
  );
}

export default AIInsights;