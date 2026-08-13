import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import { useAnalysis } from "../context/AnalysisContext";
import {
  X,
  FileCode2,
  Plus,
  Minus,
  GitCommit,
  Users,
  Sparkles,
  ShieldAlert,
  ShieldQuestion,
  ShieldCheck,
  Lightbulb,
  TriangleAlert,
  CircleCheck,
  Activity,
  Clock,
  GitBranch,
  History,
  Wand2,
  Copy,
  Check,
  BarChart3,
  Calendar,
  ExternalLink,
} from "lucide-react";

const RISK_STYLES = {
  Critical: {
    text: "text-rose-600 dark:text-rose-400",
    ring: "#f43f5e",
    badge: "bg-rose-50/80 text-rose-700 border-rose-200/80 ring-rose-500/10",
    pulse: "bg-rose-500",
  },
  High: {
    text: "text-orange-600 dark:text-orange-400",
    ring: "#f97316",
    badge: "bg-orange-50/80 text-orange-700 border-orange-200/80 ring-orange-500/10",
    pulse: "bg-orange-500",
  },
  Medium: {
    text: "text-amber-600 dark:text-amber-400",
    ring: "#f59e0b",
    badge: "bg-amber-50/80 text-amber-700 border-amber-200/80 ring-amber-500/10",
    pulse: "bg-amber-500",
  },
  Low: {
    text: "text-emerald-600 dark:text-emerald-400",
    ring: "#10b981",
    badge: "bg-emerald-50/80 text-emerald-700 border-emerald-200/80 ring-emerald-500/10",
    pulse: "bg-emerald-500",
  },
  Unknown: {
    text: "text-slate-500",
    ring: "#94a3b8",
    badge: "bg-slate-100 text-slate-600 border-slate-200 ring-slate-500/10",
    pulse: "bg-slate-400",
  },
};

const RISK_ICON = {
  Critical: ShieldAlert,
  High: ShieldAlert,
  Medium: ShieldQuestion,
  Low: ShieldCheck,
  Unknown: ShieldQuestion,
};

const TABS = [
  { key: "ai", label: "AI Analysis", icon: Sparkles },
  { key: "metrics", label: "Metrics", icon: BarChart3 },
  { key: "timeline", label: "Timeline", icon: Activity },
  { key: "dependencies", label: "Dependencies", icon: GitBranch },
  { key: "commits", label: "Commits", icon: History },
];

function initials(name) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function relativeTime(dateStr) {
  if (!dateStr) return "Unknown date";
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function ScoreGauge({ score, ringColor }) {
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
      <svg viewBox="0 0 88 88" className="w-20 h-20 -rotate-90 drop-shadow-sm">
        {/* Track background */}
        <circle cx="44" cy="44" r={r} fill="none" stroke="#f1f5f9" strokeWidth="7" />
        {/* Active Ring */}
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold text-slate-900 tracking-tight">{pct}%</span>
        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest -mt-1">Score</span>
      </div>
    </div>
  );
}

function EmptyTab({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="bg-slate-100/80 p-4 rounded-2xl mb-3 shadow-inner">
        <Icon size={24} className="text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="text-xs text-slate-400 mt-1 max-w-[240px] leading-relaxed">{hint}</p>
    </div>
  );
}

function TabSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-20 bg-slate-100 rounded-2xl w-full" />
      <div className="h-12 bg-slate-100 rounded-xl w-3/4" />
      <div className="h-28 bg-slate-100 rounded-2xl w-full" />
    </div>
  );
}

function Bar({ label, value, color = "bg-slate-900" }) {
  const safeVal = Math.min(100, Math.max(0, value));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-slate-600">{label}</span>
        <span className="font-bold text-slate-800">{Math.round(safeVal)}%</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
          style={{ width: `${safeVal}%` }}
        />
      </div>
    </div>
  );
}

function HotspotDetails({ selectedHotspot, onClose, maxScore = 0 }) {
  const { repositoryId } = useAnalysis();

  const [activeTab, setActiveTab] = useState("ai");
  const [copied, setCopied] = useState(false);

  const [fileCommits, setFileCommits] = useState(null);
  const [coupledFiles, setCoupledFiles] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(false);

  const file = selectedHotspot?.file;

  useEffect(() => {
    if (!file || !repositoryId) return;

    let cancelled = false;
    setLoadingHistory(true);
    setHistoryError(false);
    setFileCommits(null);
    setCoupledFiles([]);

    API.get(`/repository/hotspots/commits`, {
      params: { repositoryId, file },
    })
      .then((res) => {
        if (cancelled) return;
        setFileCommits(res.data?.data?.commits || []);
        setCoupledFiles(res.data?.data?.coupledFiles || []);
      })
      .catch(() => {
        if (cancelled) return;
        setHistoryError(true);
        setFileCommits([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [file, repositoryId]);

  const fileMetrics = useMemo(() => {
    if (!fileCommits || fileCommits.length === 0) return null;

    const authors = new Set(fileCommits.map((c) => c.author_name).filter(Boolean));
    const dates = fileCommits.map((c) => new Date(c.date)).filter((d) => !isNaN(d));
    const first = dates.length ? new Date(Math.min(...dates)) : null;
    const last = dates.length ? new Date(Math.max(...dates)) : null;
    const totalAdd = fileCommits.reduce((s, c) => s + (c.additions || 0), 0);
    const totalDel = fileCommits.reduce((s, c) => s + (c.deletions || 0), 0);

    return {
      totalCommits: fileCommits.length,
      contributors: authors.size,
      firstModified: first,
      lastModified: last,
      avgAdditions: Math.round(totalAdd / fileCommits.length),
      avgDeletions: Math.round(totalDel / fileCommits.length),
    };
  }, [fileCommits]);

  const monthlyBuckets = useMemo(() => {
    if (!fileCommits || fileCommits.length === 0) return [];
    const buckets = {};
    fileCommits.forEach((c) => {
      if (!c.date) return;
      const d = new Date(c.date);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets[key] = (buckets[key] || 0) + 1;
    });
    return Object.entries(buckets)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-6);
  }, [fileCommits]);

  if (!selectedHotspot) return null;

  const { changes = 0, additions = 0, deletions = 0, score = 0, aiInsight } = selectedHotspot;

  const risk = RISK_STYLES[aiInsight?.riskLevel] || RISK_STYLES.Unknown;
  const RiskIcon = RISK_ICON[aiInsight?.riskLevel] || RISK_ICON.Unknown;
  const gaugePct = maxScore > 0 ? (score / maxScore) * 100 : score;

  const riskFactors = aiInsight?.riskFactors;
  const impactPrediction = aiInsight?.impactPrediction;
  const confidence = aiInsight?.confidence;

  const derivedChurn =
    additions + deletions > 0
      ? Math.min(100, Math.round(((additions + deletions) / (maxScore || additions + deletions || 1)) * 100))
      : 0;
  const derivedFrequency = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  const buildReportText = () => {
    const lines = [
      `Hotspot Report: ${file}`,
      `Risk Level: ${aiInsight?.riskLevel || "Unknown"}`,
      `Score: ${Math.round(gaugePct)}%`,
      `Additions: +${additions}  Deletions: -${deletions}  Commits: ${changes}`,
      "",
      "AI Summary:",
      aiInsight?.summary || "Not available.",
    ];
    if (aiInsight?.recommendations?.length) {
      lines.push("", "Recommendations:");
      aiInsight.recommendations.forEach((r) => lines.push(`- ${r}`));
    }
    if (aiInsight?.impact) {
      lines.push("", "Potential Impact:", aiInsight.impact);
    }
    if (fileMetrics) {
      lines.push(
        "",
        "History:",
        `- ${fileMetrics.totalCommits} commits by ${fileMetrics.contributors} contributor(s)`,
        `- First modified: ${fileMetrics.firstModified?.toLocaleDateString() || "N/A"}`,
        `- Last modified: ${fileMetrics.lastModified?.toLocaleDateString() || "N/A"}`
      );
    }
    return lines.join("\n");
  };

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(buildReportText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const maxMonthlyCount = Math.max(1, ...monthlyBuckets.map(([, c]) => c));
  const fileName = file?.split("/").pop() || file;
  const filePath = file?.split("/").slice(0, -1).join("/") || "";

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 shadow-xl rounded-2xl border border-slate-100 overflow-hidden font-sans">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-100/60 shadow-sm shrink-0">
            <FileCode2 size={22} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 truncate tracking-tight" title={file}>
              {fileName}
            </h2>
            {filePath && <p className="text-xs text-slate-400 truncate tracking-wide">{filePath}/</p>}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span
            className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 border ring-1 ${risk.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${risk.pulse}`} />
            <RiskIcon size={13} />
            {aiInsight?.riskLevel || "Unknown"}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-all duration-200"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Metrics Header Bar */}
      <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-6 shrink-0 flex-wrap">
        <ScoreGauge score={gaugePct} ringColor={risk.ring} />
        
        <div className="grid grid-cols-3 gap-3 flex-1 min-w-[240px] bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
          <div className="px-2">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Plus size={10} className="text-emerald-500" /> Additions
            </p>
            <p className="text-base font-bold text-emerald-600 mt-0.5">+{additions.toLocaleString()}</p>
          </div>
          <div className="px-2 border-l border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Minus size={10} className="text-rose-500" /> Deletions
            </p>
            <p className="text-base font-bold text-rose-600 mt-0.5">-{deletions.toLocaleString()}</p>
          </div>
          <div className="px-2 border-l border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <GitCommit size={10} className="text-slate-400" /> Commits
            </p>
            <p className="text-base font-bold text-slate-900 mt-0.5">{changes.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Modern Tab Switcher */}
      <div className="px-5 pt-3 bg-white border-b border-slate-100 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap mb-2 ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm scale-[1.02]"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
              }`}
            >
              <Icon size={14} className={isActive ? "text-orange-400" : "text-slate-400"} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Scrollable Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* AI ANALYSIS TAB */}
        {activeTab === "ai" && (
          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-br from-violet-50/50 via-white to-slate-50/50 p-4 rounded-2xl border border-violet-100/80 shadow-xs">
              <h3 className="text-xs font-bold text-violet-900 uppercase tracking-wider flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-violet-600" />
                AI Analysis Summary
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {aiInsight?.summary || "AI analysis is not available for this hotspot."}
              </p>
            </div>

            {/* Risk Factors */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <TriangleAlert size={14} className="text-rose-500" />
                Risk Factors
              </h3>
              {riskFactors?.length ? (
                <div className="space-y-3 pt-1">
                  {riskFactors.map((f, i) => (
                    <Bar key={i} label={f.label} value={f.value} color="bg-rose-500" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <Bar label="Change Frequency" value={derivedFrequency} color="bg-rose-500" />
                  <Bar label="Code Churn (Additions + Deletions)" value={derivedChurn} color="bg-orange-500" />
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Lightbulb size={14} className="text-amber-500" />
                Recommendations
              </h3>
              {aiInsight?.recommendations?.length ? (
                <ul className="space-y-2">
                  {aiInsight.recommendations.map((r, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50/80 border border-slate-100 rounded-xl p-3"
                    >
                      <CircleCheck size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{r}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">No specific recommendations available.</p>
              )}
            </div>

            {/* Impact Prediction */}
            {(aiInsight?.impact || impactPrediction?.length) && (
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Activity size={14} className="text-blue-500" />
                  {impactPrediction?.length ? "Impact Prediction" : "Potential Impact"}
                </h3>
                {impactPrediction?.length ? (
                  <div className="space-y-3 pt-1">
                    {impactPrediction.map((f, i) => (
                      <Bar key={i} label={f.label} value={f.value} color="bg-blue-500" />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 leading-relaxed">{aiInsight.impact}</p>
                )}
              </div>
            )}

            {/* Confidence Banner */}
            {confidence != null && (
              <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-md">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">AI Confidence Rating</p>
                  <p className="text-xs text-slate-300 mt-0.5">Based on analytical heuristic confidence models</p>
                </div>
                <div className="text-2xl font-black text-emerald-400">{confidence}%</div>
              </div>
            )}
          </div>
        )}

        {/* METRICS TAB */}
        {activeTab === "metrics" &&
          (loadingHistory ? (
            <TabSkeleton />
          ) : fileMetrics ? (
            <div className="p-6 grid grid-cols-2 gap-3">
              <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Commits</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{fileMetrics.totalCommits}</p>
              </div>
              <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contributors</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{fileMetrics.contributors}</p>
              </div>
              <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Additions / Commit</p>
                <p className="text-2xl font-extrabold text-emerald-600 mt-1">+{fileMetrics.avgAdditions}</p>
              </div>
              <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Deletions / Commit</p>
                <p className="text-2xl font-extrabold text-rose-600 mt-1">-{fileMetrics.avgDeletions}</p>
              </div>
              <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 col-span-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={12} className="text-slate-500" /> Active Period
                </p>
                <p className="text-xs font-semibold text-slate-800 mt-2 flex items-center gap-2">
                  <span>{fileMetrics.firstModified?.toLocaleDateString() || "N/A"}</span>
                  <span className="text-slate-300">→</span>
                  <span>{fileMetrics.lastModified?.toLocaleDateString() || "N/A"}</span>
                </p>
              </div>
            </div>
          ) : (
            <EmptyTab
              icon={BarChart3}
              title={historyError ? "Error loading commit history" : "No metrics available"}
              hint={historyError ? "Failed to load details from the server." : "No commit history found for this file."}
            />
          ))}

        {/* TIMELINE TAB */}
        {activeTab === "timeline" &&
          (loadingHistory ? (
            <TabSkeleton />
          ) : monthlyBuckets.length > 0 ? (
            <div className="p-6">
              <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-5">
                <div className="flex items-end gap-3 h-44 pt-6">
                  {monthlyBuckets.map(([month, count]) => (
                    <div key={month} className="flex-1 h-full flex flex-col items-center justify-end gap-2 group">
                      <span className="text-[10px] font-bold text-slate-600 opacity-80 group-hover:opacity-100 transition-opacity">
                        {count}
                      </span>
                      <div
                        className="w-full bg-orange-500 group-hover:bg-orange-600 rounded-t-lg transition-all duration-300 shadow-xs"
                        style={{ height: `${(count / maxMonthlyCount) * 100}%`, minHeight: 6 }}
                      />
                      <span className="text-[10px] font-semibold text-slate-400 mt-1">{month.slice(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 text-center mt-3">
                Commits per month (last {monthlyBuckets.length} active months)
              </p>
            </div>
          ) : (
            <EmptyTab
              icon={Activity}
              title={historyError ? "Error loading commit history" : "No timeline data"}
              hint={historyError ? "Failed to load details from the server." : "No commit history found for this file."}
            />
          ))}

        {/* DEPENDENCIES TAB */}
        {activeTab === "dependencies" &&
          (loadingHistory ? (
            <TabSkeleton />
          ) : coupledFiles.length > 0 ? (
            <div className="p-6 space-y-2">
              <p className="text-xs text-slate-400 mb-3">Files frequently changed together in the same commits.</p>
              {coupledFiles.slice(0, 10).map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 text-xs bg-slate-50/80 hover:bg-slate-100/80 border border-slate-100 rounded-xl px-3.5 py-2.5 transition-colors"
                >
                  <span className="flex items-center gap-2.5 text-slate-700 truncate min-w-0">
                    <GitBranch size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate font-medium">{d.file}</span>
                  </span>
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100 shrink-0">
                    {d.count}×
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyTab
              icon={GitBranch}
              title={historyError ? "Error loading commit history" : "No coupled files found"}
              hint={
                historyError
                  ? "Failed to load details from the server."
                  : "This file hasn't consistently changed alongside others."
              }
            />
          ))}

        {/* COMMITS TAB */}
        {activeTab === "commits" &&
          (loadingHistory ? (
            <TabSkeleton />
          ) : fileCommits?.length > 0 ? (
            <div className="p-6 space-y-3">
              {fileCommits.map((c, i) => (
                <div
                  key={c.hash || i}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50/80 transition-all space-y-2"
                >
                  <p className="text-xs font-semibold text-slate-800 leading-snug">{c.message || "No commit message"}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                      <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[9px] font-bold flex items-center justify-center">
                        {initials(c.author_name)}
                      </span>
                      {c.author_name || "Unknown"}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock size={11} /> {relativeTime(c.date)}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600">+{c.additions || 0}</span>
                    <span className="text-[11px] font-semibold text-rose-600">-{c.deletions || 0}</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 ml-auto">
                      {(c.hash || "").substring(0, 7)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyTab
              icon={History}
              title={historyError ? "Error loading commit history" : "No commits found"}
              hint={historyError ? "Failed to load details from the server." : "No commit history found for this file."}
            />
          ))}
      </div>

      {/* Action Footer */}
      <div className="px-6 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-[0.98]">
            <Wand2 size={14} /> Generate Refactor
          </button>
          <button
            onClick={handleCopyReport}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100/80 px-3.5 py-2.5 rounded-xl border border-slate-200/80 transition-all active:scale-[0.98]"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-500" /> Copied
              </>
            ) : (
              <>
                <Copy size={14} /> Copy Report
              </>
            )}
          </button>
        </div>

        {fileMetrics && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Users size={13} /> {fileMetrics.contributors} contributors
          </span>
        )}
      </div>
    </div>
  );
}

export default HotspotDetails;