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
} from "lucide-react";

const RISK_STYLES = {
  Critical: {
    badge: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
    dot: "#e11d48",
    bar: "bg-rose-500",
  },
  High: {
    badge: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
    dot: "#d97706",
    bar: "bg-amber-500",
  },
  Medium: {
    badge: "bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20",
    dot: "#ca8a04",
    bar: "bg-yellow-500",
  },
  Low: {
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    dot: "#059669",
    bar: "bg-emerald-500",
  },
  Unknown: {
    badge: "bg-zinc-50 text-zinc-600 ring-1 ring-inset ring-zinc-500/20",
    dot: "#71717a",
    bar: "bg-zinc-400",
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
  { key: "ai", label: "Analysis" },
  { key: "metrics", label: "Metrics" },
  { key: "timeline", label: "Timeline" },
  { key: "dependencies", label: "Dependencies" },
  { key: "commits", label: "Commits" },
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
  const r = 32;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative w-16 h-16 shrink-0 flex items-center justify-center group">
      <svg viewBox="0 0 80 80" className="w-16 h-16 -rotate-90 transform drop-shadow-sm">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#f4f4f5" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[17px] font-bold text-zinc-900 font-mono tracking-tighter tabular-nums leading-none">
          {pct}
        </span>
      </div>
    </div>
  );
}

function EmptyTab({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6 animate-in fade-in duration-500">
      <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-4 text-zinc-400 shadow-sm">
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <p className="text-sm font-semibold text-zinc-900 tracking-tight">{title}</p>
      <p className="text-xs text-zinc-500 mt-1.5 max-w-[240px] leading-relaxed">{hint}</p>
    </div>
  );
}

function TabSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-24 bg-zinc-100/80 rounded-xl w-full" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-16 bg-zinc-100/80 rounded-xl w-full" />
        <div className="h-16 bg-zinc-100/80 rounded-xl w-full" />
      </div>
      <div className="h-32 bg-zinc-100/80 rounded-xl w-full" />
    </div>
  );
}

function Bar({ label, value, color = "bg-zinc-900" }) {
  const safeVal = Math.min(100, Math.max(0, value));
  return (
    <div className="space-y-1.5 group">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-600 font-medium group-hover:text-zinc-900 transition-colors">{label}</span>
        <span className="font-mono text-zinc-800 font-medium tabular-nums">{Math.round(safeVal)}%</span>
      </div>
      <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
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

    return () => { cancelled = true; };
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

  const derivedChurn = additions + deletions > 0
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
    return lines.join("\n");
  };

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(buildReportText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {}
  };

  const maxMonthlyCount = Math.max(1, ...monthlyBuckets.map(([, c]) => c));
  const fileName = file?.split("/").pop() || file;
  const filePath = file?.split("/").slice(0, -1).join("/") || "";

  return (
    <div className="flex flex-col h-full bg-white text-zinc-900 border border-zinc-200/60 rounded-2xl shadow-2xl shadow-zinc-900/5 overflow-hidden font-sans">
      
      {/* Header Area */}
      <div className="shrink-0 bg-white border-b border-zinc-100">
        <div className="px-5 py-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50/50 shadow-sm text-zinc-600 shrink-0">
              <FileCode2 size={18} strokeWidth={1.75} />
            </div>
            <div className="min-w-0 pt-0.5">
              <h2 className="text-[15px] font-semibold text-zinc-900 truncate tracking-tight" title={file}>
                {fileName}
              </h2>
              {filePath && (
                <p className="text-xs text-zinc-400 truncate font-mono mt-0.5">{filePath}/</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Unified Metrics Bar */}
        <div className="px-5 pb-5 flex items-center gap-5 shrink-0 flex-wrap">
          <ScoreGauge score={gaugePct} ringColor={risk.dot} />
          
          <div className="flex items-center flex-1 min-w-[240px] rounded-xl border border-zinc-100 bg-zinc-50/50 p-1.5 shadow-sm">
            <div className="px-3 py-1.5 flex-1 text-center border-r border-zinc-200/60">
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center justify-center gap-1">
                <Plus size={10} className="text-emerald-500" /> Adds
              </p>
              <p className="text-sm font-mono font-medium text-emerald-600 mt-1 tabular-nums">
                +{additions.toLocaleString()}
              </p>
            </div>
            <div className="px-3 py-1.5 flex-1 text-center border-r border-zinc-200/60">
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center justify-center gap-1">
                <Minus size={10} className="text-rose-500" /> Dels
              </p>
              <p className="text-sm font-mono font-medium text-rose-600 mt-1 tabular-nums">
                -{deletions.toLocaleString()}
              </p>
            </div>
            <div className="px-3 py-1.5 flex-1 text-center relative group">
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center justify-center gap-1">
                <GitCommit size={10} className="text-zinc-400" /> Commits
              </p>
              <p className="text-sm font-mono font-medium text-zinc-800 mt-1 tabular-nums">
                {changes.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pill Tabs */}
      <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/30 shrink-0">
        <div className="flex items-center p-1 bg-zinc-100/80 rounded-xl overflow-x-auto no-scrollbar gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 min-w-fit px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-200 ${
                  isActive 
                    ? "bg-white text-zinc-900 shadow-sm ring-1 ring-black/5" 
                    : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        
        {/* ANALYSIS TAB */}
        {activeTab === "ai" && (
          <div className="p-5 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* Top Status & Summary */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">AI Summary</h3>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${risk.badge}`}>
                  <RiskIcon size={12} strokeWidth={2.5} />
                  {aiInsight?.riskLevel || "Unknown"} Risk
                </span>
              </div>
              <p className="text-[13px] text-zinc-700 leading-relaxed bg-zinc-50/80 border border-zinc-100 rounded-xl p-4 shadow-sm">
                {aiInsight?.summary || "AI analysis is not available for this hotspot."}
              </p>
            </div>

            {/* Risk Factors */}
            <div className="space-y-4 pt-2">
              <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <TriangleAlert size={14} className="text-amber-500" /> Risk Drivers
              </h3>
              <div className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm space-y-4">
                {riskFactors?.length ? (
                  riskFactors.map((f, i) => <Bar key={i} label={f.label} value={f.value} color={risk.bar} />)
                ) : (
                  <>
                    <Bar label="Change frequency" value={derivedFrequency} color={risk.bar} />
                    <Bar label="Code churn (adds + dels)" value={derivedChurn} color="bg-zinc-300" />
                  </>
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-3 pt-2">
              <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Lightbulb size={14} className="text-emerald-500" /> Recommendations
              </h3>
              {aiInsight?.recommendations?.length ? (
                <ul className="grid gap-2">
                  {aiInsight.recommendations.map((r, i) => (
                    <li key={i} className="group flex items-start gap-3 text-[13px] text-zinc-700 bg-white border border-zinc-100 hover:border-emerald-200/60 p-3.5 rounded-xl shadow-sm transition-colors">
                      <CircleCheck size={16} className="text-emerald-500/70 group-hover:text-emerald-500 mt-0.5 shrink-0 transition-colors" strokeWidth={2} />
                      <span className="leading-relaxed">{r}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-zinc-400 italic bg-zinc-50 rounded-xl p-4 text-center border border-zinc-100">No specific recommendations available.</p>
              )}
            </div>

            {/* Impact / Confidence Footer */}
            {confidence != null && (
              <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                  <Sparkles size={12} className="text-indigo-400" /> AI Confidence
                </div>
                <span className="text-[11px] font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full ring-1 ring-inset ring-indigo-500/20">
                  {confidence}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* METRICS TAB */}
        {activeTab === "metrics" && (
          loadingHistory ? <TabSkeleton /> : fileMetrics ? (
            <div className="p-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-zinc-100 bg-white shadow-sm rounded-xl p-4 hover:border-zinc-200 transition-colors">
                  <p className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase mb-1">Total Commits</p>
                  <p className="text-2xl font-mono font-medium text-zinc-900 tabular-nums">{fileMetrics.totalCommits}</p>
                </div>
                <div className="border border-zinc-100 bg-white shadow-sm rounded-xl p-4 hover:border-zinc-200 transition-colors">
                  <p className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase mb-1">Contributors</p>
                  <p className="text-2xl font-mono font-medium text-zinc-900 tabular-nums">{fileMetrics.contributors}</p>
                </div>
                <div className="border border-zinc-100 bg-emerald-50/30 shadow-sm rounded-xl p-4">
                  <p className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase mb-1">Avg Adds/Commit</p>
                  <p className="text-xl font-mono font-medium text-emerald-600 tabular-nums">+{fileMetrics.avgAdditions}</p>
                </div>
                <div className="border border-zinc-100 bg-rose-50/30 shadow-sm rounded-xl p-4">
                  <p className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase mb-1">Avg Dels/Commit</p>
                  <p className="text-xl font-mono font-medium text-rose-600 tabular-nums">-{fileMetrics.avgDeletions}</p>
                </div>
                
                <div className="col-span-2 border border-zinc-100 bg-zinc-900 shadow-md rounded-xl p-4 mt-2 text-white">
                  <p className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase flex items-center gap-1.5 mb-2">
                    <Calendar size={12} /> Active Period
                  </p>
                  <div className="flex items-center gap-3 text-sm font-mono font-medium tabular-nums">
                    <span>{fileMetrics.firstModified?.toLocaleDateString() || "N/A"}</span>
                    <div className="flex-1 h-[1px] bg-zinc-700 relative">
                       <div className="absolute right-0 -top-1 w-2 h-2 rounded-full bg-zinc-500" />
                    </div>
                    <span>{fileMetrics.lastModified?.toLocaleDateString() || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : <EmptyTab icon={BarChart3} title={historyError ? "Error" : "No metrics"} hint="History unavailable." />
        )}

        {/* TIMELINE TAB */}
        {activeTab === "timeline" && (
          loadingHistory ? <TabSkeleton /> : monthlyBuckets.length > 0 ? (
            <div className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-end gap-2 h-48 pt-4 border-b border-zinc-100 pb-2">
                {monthlyBuckets.map(([month, count]) => (
                  <div key={month} className="flex-1 h-full flex flex-col items-center justify-end gap-2 group">
                    <span className="text-[11px] font-mono font-medium text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums translate-y-2 group-hover:translate-y-0 duration-200">
                      {count}
                    </span>
                    <div
                      className="w-full max-w-[40px] bg-zinc-800 rounded-t-md transition-all duration-300 group-hover:bg-zinc-600"
                      style={{ height: `${(count / maxMonthlyCount) * 100}%`, minHeight: '8px' }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 pt-3">
                {monthlyBuckets.map(([month]) => (
                  <span key={month} className="flex-1 text-center text-[10px] font-mono text-zinc-500">
                    {month.slice(2)}
                  </span>
                ))}
              </div>
            </div>
          ) : <EmptyTab icon={Activity} title="No timeline data" hint="Commit history empty." />
        )}

        {/* DEPENDENCIES TAB */}
        {activeTab === "dependencies" && (
          loadingHistory ? <TabSkeleton /> : coupledFiles.length > 0 ? (
            <div className="p-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="divide-y divide-zinc-100/80 border border-zinc-100 rounded-xl overflow-hidden shadow-sm bg-white">
                {coupledFiles.slice(0, 10).map((d, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-50 transition-colors group">
                    <span className="flex items-center gap-3 text-[13px] text-zinc-700 truncate min-w-0">
                      <GitBranch size={14} className="text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0" />
                      <span className="truncate font-mono">{d.file}</span>
                    </span>
                    <span className="text-[11px] font-mono font-medium text-zinc-600 shrink-0 tabular-nums bg-zinc-100 px-2 py-1 rounded-md">
                      {d.count}×
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyTab icon={GitBranch} title="No coupled files" hint="File doesn't change alongside others." />
        )}

        {/* COMMITS TAB */}
        {activeTab === "commits" && (
          loadingHistory ? <TabSkeleton /> : fileCommits?.length > 0 ? (
            <div className="divide-y divide-zinc-100 border-t border-zinc-50 bg-white animate-in fade-in duration-300">
              {fileCommits.map((c, i) => (
                <div key={c.hash || i} className="p-4 hover:bg-zinc-50/80 transition-colors space-y-2.5 group">
                  <p className="text-[13px] font-medium text-zinc-900 leading-snug group-hover:text-zinc-700 transition-colors">
                    {c.message || "No commit message"}
                  </p>
                  <div className="flex items-center gap-x-4 gap-y-2 flex-wrap text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center bg-zinc-200/80 text-zinc-700 text-[9px] font-bold ring-1 ring-inset ring-black/5">
                        {initials(c.author_name)}
                      </span>
                      {c.author_name || "Unknown"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} className="text-zinc-400" /> {relativeTime(c.date)}
                    </span>
                    <div className="flex items-center gap-2 font-mono tabular-nums">
                      <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+{c.additions || 0}</span>
                      <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">-{c.deletions || 0}</span>
                    </div>
                    <span className="font-mono text-zinc-400 ml-auto group-hover:text-zinc-600 transition-colors">
                      {(c.hash || "").substring(0, 7)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyTab icon={History} title="No commits found" hint="File history is empty." />
        )}
      </div>

      {/* Action Footer */}
      <div className="px-5 py-4 border-t border-zinc-100 flex items-center justify-between gap-3 flex-wrap shrink-0 bg-white">
        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-1.5 bg-gradient-to-b from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 active:from-zinc-900 active:to-zinc-950 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-all shadow-sm ring-1 ring-inset ring-zinc-900/10">
            <Wand2 size={14} className="text-zinc-300" /> Generate Refactor
          </button>
          <button
            onClick={handleCopyReport}
            className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 px-4 py-2 rounded-lg transition-all shadow-sm"
          >
            {copied ? (
              <><Check size={14} className="text-emerald-600" /> Copied</>
            ) : (
              <><Copy size={14} className="text-zinc-400" /> Copy Report</>
            )}
          </button>
        </div>

        {fileMetrics && (
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
            <Users size={14} /> {fileMetrics.contributors} Contributors
          </span>
        )}
      </div>
    </div>
  );
}

export default HotspotDetails;