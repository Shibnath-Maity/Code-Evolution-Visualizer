import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import API from "../services/api";
import RepositoryChatbot from "../components/RepositoryChatbot";
import axios from "axios";
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

const API_URL = "http://localhost:5000";

const QUALITY_METRICS = [
  { label: "Code Consistency", score: 0 },
  { label: "Commit Message Quality", score: 0 },
  { label: "Test Coverage Signal", score: 0 },
  { label: "Refactor Frequency", score: 0 },
];

// Maps the section headers the AI is asked to return (see the prompt in
// generateAIAnalysis) to how they're displayed. Keeping this in one place
// means the prompt and the UI can't silently drift apart.
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

// Splits the AI's plain-text response into the labeled sections it was
// asked to return. The model doesn't always format headers the same way
// ("SUMMARY:" one time, "**SUMMARY**" the next), so this matches a header
// sitting alone on its own line with either style, or no wrapping at all.
// Falls back to showing the raw text if nothing matches, so we never
// render nothing.
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

// Turns the AI's lightweight markdown (**bold**, "* bullet" lists, blank
// line = new paragraph) into real React elements. Deliberately hand-rolled
// instead of dangerouslySetInnerHTML, since this is model-generated text
// and shouldn't be treated as trusted HTML.
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

function QualityBar({ label, score }) {
  const color =
    score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-slate-600">{label}</span>
        <span className="text-sm font-medium text-slate-900">{score}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function RecommendationCard({ icon: Icon, accent, title, description }) {
  return (
    <div className="flex gap-3 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>
    </div>
  );
}

// One card per section of the AI's response, instead of a single wall of
// pre-wrapped text. This is the main "after analyze" readability fix.
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

// Skeleton shown while the AI request is in flight, so the layout doesn't
// jump from empty state -> spinner -> full grid of cards.
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

  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState(null);

  const [repositoryData, setRepositoryData] = useState(() => {
    const saved = localStorage.getItem("repositoryAnalysis");
    return saved ? JSON.parse(saved) : null;
  });

  const timeline = repositoryData?.timeline || [];
  const fileChanges = repositoryData?.fileChanges || [];
  const stats = repositoryData?.stats || {};

  // Most active day
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

  // Most active hour
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

  // Most modified file
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

  useEffect(() => {
    loadRepositoryData();
  }, []);

  async function loadRepositoryData() {
    try {
      const storedRepoUrl = localStorage.getItem("repoUrl");
      if (!storedRepoUrl) return;

      const response = await axios.post(`${API_URL}/repository/analytics`, {
        url: storedRepoUrl,
      });

      setRepositoryData(response.data);
    } catch (err) {
      console.error("Repository data error:", err);
    }
  }

  async function generateAIAnalysis() {
    if (!repositoryData) {
      setError("Repository data is not available. Analyze a repository first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const prompt = `
You are an AI assistant inside a Code Evolution Visualizer.

Analyze the following repository analytics.

Repository statistics:
${JSON.stringify(repositoryData.stats, null, 2)}

Contributors:
${JSON.stringify(repositoryData.contributors, null, 2)}

Timeline:
${JSON.stringify(repositoryData.timeline?.slice(0, 100), null, 2)}

File changes:
${JSON.stringify(repositoryData.fileChanges?.slice(0, 100), null, 2)}

Hotspots:
${JSON.stringify(repositoryData.hotspots?.slice(0, 50), null, 2)}

Give a developer-friendly analysis.

Return exactly these sections:

SUMMARY:
Write a concise repository summary.

DEVELOPMENT_ACTIVITY:
Explain development activity and commit frequency.

CODE_HEALTH:
Discuss possible code health issues.

HOTSPOTS:
Identify important files or areas that appear frequently changed.

COMMIT_QUALITY:
Analyze commit message quality.

RECOMMENDATIONS:
Give 3-5 practical recommendations.

RISK:
Mention potential technical risks.

Do not invent information that is not present in the repository data.
`;

      const response = await axios.post(`${API_URL}/ai/chat`, { question: prompt });

      setAnalysis(response.data.answer);
      setLastAnalyzedAt(new Date());
    } catch (err) {
      console.error("AI analysis error:", err);
      setError(err.response?.data?.error || "Failed to generate AI analysis.");
    } finally {
      setLoading(false);
    }
  }

  const overallScore = Math.round(
    QUALITY_METRICS.reduce((sum, metric) => sum + metric.score, 0) / QUALITY_METRICS.length
  );
  const hasQualityData = QUALITY_METRICS.some((m) => m.score > 0);
  const sections = parseAnalysis(analysis);

  return (
    <div className="p-8">
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

      <p className="text-slate-500 mt-2 mb-8">Get AI-powered insights about your repository.</p>

      {/* No repository connected yet */}
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
        <>
          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-2 p-4 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* AI Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-slate-100">
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
                    // Fallback if the model didn't return the expected section headers
                    <div className="bg-slate-50 rounded-xl p-5">
                      <FormattedText text={analysis} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-500 py-6">
                  Click <span className="font-medium text-indigo-600">Analyze Repository</span> to let your AI
                  assistant analyze the repository.
                </div>
              )}
            </div>

            {/* Quick Facts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
              {quickFacts.map((fact) => (
                <QuickFactCard key={fact.label} {...fact} />
              ))}
            </div>
          </div>

          {/* Bottom section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Code Quality */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-slate-900">Code Quality</h2>
                {hasQualityData ? (
                  <span className="text-sm font-semibold text-slate-900">
                    {overallScore}
                    <span className="text-slate-400 font-normal">/100</span>
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                    Coming soon
                  </span>
                )}
              </div>

              {hasQualityData ? (
                <div className="flex flex-col gap-4">
                  {QUALITY_METRICS.map((metric) => (
                    <QualityBar key={metric.label} {...metric} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  Quality scoring isn't wired up to live data yet — check back after that's connected.
                </p>
              )}
            </div>

            {/* AI Assistant */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-5">
                <Bot className="h-5 w-5 text-indigo-600" />
                <h2 className="font-semibold text-slate-900">AI Assistant</h2>
              </div>

              <div className="space-y-3">
                <RecommendationCard
                  icon={AlertCircle}
                  accent="bg-red-50 text-red-500"
                  title="Find risky files"
                  description="Ask the AI which files are changing frequently and may require refactoring."
                />
                <RecommendationCard
                  icon={Lightbulb}
                  accent="bg-amber-50 text-amber-500"
                  title="Improve commit quality"
                  description="Ask the AI to analyze your commit messages and suggest better practices."
                />
                <RecommendationCard
                  icon={ShieldCheck}
                  accent="bg-emerald-50 text-emerald-500"
                  title="Improve repository health"
                  description="Ask the AI to identify testing, maintainability and technical debt risks."
                />
              </div>
            </div>
          </div>
       
<RepositoryChatbot
    repositoryId={repositoryData?.repositoryId}
/>
        </>
      )}
    </div>
  );
}

export default AIInsights;
