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
    badge: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    dot: "#fb7185",
    bar: "bg-rose-500",
  },
  High: {
    badge: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
    dot: "#fb923c",
    bar: "bg-orange-500",
  },
  Medium: {
    badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    dot: "#fbbf24",
    bar: "bg-amber-500",
  },
  Low: {
    badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    dot: "#34d399",
    bar: "bg-emerald-500",
  },
  Unknown: {
    badge: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
    dot: "#94a3b8",
    bar: "bg-slate-500",
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
    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center sm:h-16 sm:w-16">
      <svg viewBox="0 0 80 80" className="h-14 w-14 -rotate-90 transform sm:h-16 sm:w-16">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#1e2733" strokeWidth="6" />
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
          className="transition-all duration-700 ease-out motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[15px] font-bold leading-none tracking-tighter tabular-nums text-[#f1f5f9] sm:text-[17px]">
          {pct}
        </span>
      </div>
    </div>
  );
}

function EmptyTab({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-[#242b35] bg-[#151b23] text-[#64748b]">
        <Icon size={17} strokeWidth={1.75} />
      </div>
      <p className="text-[13px] font-semibold tracking-tight text-[#f1f5f9]">{title}</p>
      <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-[#64748b]">{hint}</p>
    </div>
  );
}

function TabSkeleton() {
  return (
    <div className="space-y-3 p-4 sm:p-5">
      <div className="h-20 w-full animate-pulse rounded-lg bg-slate-800/60 motion-reduce:animate-none" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-14 w-full animate-pulse rounded-lg bg-slate-800/60 motion-reduce:animate-none" />
        <div className="h-14 w-full animate-pulse rounded-lg bg-slate-800/60 motion-reduce:animate-none" />
      </div>
      <div className="h-28 w-full animate-pulse rounded-lg bg-slate-800/60 motion-reduce:animate-none" />
    </div>
  );
}

function Bar({ label, value, color = "bg-slate-400" }) {
  const safeVal = Math.min(100, Math.max(0, value));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-medium text-[#94a3b8]">{label}</span>
        <span className="font-mono font-medium tabular-nums text-[#f1f5f9]">
          {Math.round(safeVal)}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out motion-reduce:transition-none ${color}`}
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#242b35] bg-[#0d1117] font-sans text-[#f1f5f9]">

      {/* File header — fixed */}
      <div className="shrink-0 border-b border-[#242b35] bg-[#11161d] px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#242b35] bg-[#151b23] text-[#94a3b8]">
              <FileCode2 size={15} strokeWidth={1.75} />
            </div>
            <div className="min-w-0 pt-0.5">
              <h2
                className="truncate text-[14px] font-semibold tracking-tight text-[#f1f5f9]"
                title={file}
              >
                {fileName}
              </h2>
              {filePath && (
                <p className="mt-0.5 truncate font-mono text-[11px] text-[#64748b]">
                  {filePath}/
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close hotspot details"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#64748b] transition-colors hover:bg-[#1a222c] hover:text-[#f1f5f9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500/60"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Metrics bar — fixed */}
      <div className="flex shrink-0 flex-col items-center gap-3 border-b border-[#242b35] bg-[#11161d] px-4 py-3 sm:flex-row sm:gap-4 sm:px-5">
        <ScoreGauge score={gaugePct} ringColor={risk.dot} />

        <div className="grid w-full flex-1 grid-cols-3 gap-px overflow-hidden rounded-lg border border-[#242b35] bg-[#242b35] sm:w-auto">
          <div className="bg-[#151b23] px-2.5 py-2 text-center sm:px-4">
            <p className="flex items-center justify-center gap-1 text-[9.5px] font-bold uppercase tracking-widest text-[#64748b]">
              <Plus size={9} className="text-emerald-400" /> Adds
            </p>
            <p className="mt-1 font-mono text-sm font-medium tabular-nums text-emerald-400">
              +{additions.toLocaleString()}
            </p>
          </div>
          <div className="bg-[#151b23] px-2.5 py-2 text-center sm:px-4">
            <p className="flex items-center justify-center gap-1 text-[9.5px] font-bold uppercase tracking-widest text-[#64748b]">
              <Minus size={9} className="text-rose-400" /> Dels
            </p>
            <p className="mt-1 font-mono text-sm font-medium tabular-nums text-rose-400">
              -{deletions.toLocaleString()}
            </p>
          </div>
          <div className="bg-[#151b23] px-2.5 py-2 text-center sm:px-4">
            <p className="flex items-center justify-center gap-1 text-[9.5px] font-bold uppercase tracking-widest text-[#64748b]">
              <GitCommit size={9} className="text-[#94a3b8]" /> Commits
            </p>
            <p className="mt-1 font-mono text-sm font-medium tabular-nums text-[#f1f5f9]">
              {changes.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs — fixed, IDE style */}
      <div className="shrink-0 border-b border-[#242b35] bg-[#11161d] px-2 sm:px-3">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar" role="tablist" aria-label="Hotspot detail sections">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.key)}
                className={`relative shrink-0 whitespace-nowrap px-3 py-2.5 text-[12.5px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sky-500/60 ${
                  isActive ? "text-[#f1f5f9]" : "text-[#64748b] hover:text-[#94a3b8]"
                }`}
              >
                {tab.label}
                <span
                  className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-colors motion-reduce:transition-none ${
                    isActive ? "bg-sky-400" : "bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Content — scrollable */}
      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar bg-[#0d1117]">

        {/* ANALYSIS TAB */}
        {activeTab === "ai" && (
          <div className="space-y-5 p-4 sm:p-5">

            {/* AI Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[10.5px] font-bold uppercase tracking-widest text-[#64748b]">
                  AI Analysis
                </h3>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${risk.badge}`}
                >
                  <RiskIcon size={11} strokeWidth={2.5} />
                  {aiInsight?.riskLevel || "Unknown"} risk
                </span>
              </div>
              <p className="rounded-lg border border-[#242b35] bg-[#11161d] p-3.5 text-[13px] leading-relaxed text-[#94a3b8] sm:p-4">
                {aiInsight?.summary || "AI analysis is not available for this hotspot."}
              </p>
            </div>

            {/* Risk Drivers */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-widest text-[#64748b]">
                <TriangleAlert size={12} className="text-amber-400" /> Risk drivers
              </h3>
              <div className="space-y-4 rounded-lg border border-[#242b35] bg-[#11161d] p-3.5 sm:p-4">
                {riskFactors?.length ? (
                  riskFactors.map((f, i) => <Bar key={i} label={f.label} value={f.value} color={risk.bar} />)
                ) : (
                  <>
                    <Bar label="Change frequency" value={derivedFrequency} color={risk.bar} />
                    <Bar label="Code churn (adds + dels)" value={derivedChurn} color="bg-slate-500" />
                  </>
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-2.5">
              <h3 className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-widest text-[#64748b]">
                <Lightbulb size={12} className="text-emerald-400" /> Recommendations
              </h3>
              {aiInsight?.recommendations?.length ? (
                <ul className="space-y-1.5">
                  {aiInsight.recommendations.map((r, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 rounded-lg border border-[#242b35] bg-[#11161d] p-3 text-[13px] leading-relaxed text-[#94a3b8] transition-colors hover:border-emerald-500/20"
                    >
                      <CircleCheck size={15} className="mt-0.5 shrink-0 text-emerald-400/80" strokeWidth={2} />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg border border-[#242b35] bg-[#11161d] p-3.5 text-center text-[13px] italic text-[#64748b]">
                  No specific recommendations available.
                </p>
              )}
            </div>

            {/* Confidence */}
            {confidence != null && (
              <div className="flex items-center justify-between border-t border-[#242b35] pt-4">
                <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-widest text-[#64748b]">
                  <Sparkles size={12} className="text-sky-400" /> AI confidence
                </div>
                <span className="rounded border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-sky-400">
                  {confidence}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* METRICS TAB */}
        {activeTab === "metrics" && (
          loadingHistory ? <TabSkeleton /> : fileMetrics ? (
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-lg border border-[#242b35] bg-[#11161d] p-3.5">
                  <p className="mb-1 text-[9.5px] font-bold uppercase tracking-widest text-[#64748b]">
                    Total commits
                  </p>
                  <p className="font-mono text-xl font-medium tabular-nums text-[#f1f5f9]">
                    {fileMetrics.totalCommits}
                  </p>
                </div>
                <div className="rounded-lg border border-[#242b35] bg-[#11161d] p-3.5">
                  <p className="mb-1 text-[9.5px] font-bold uppercase tracking-widest text-[#64748b]">
                    Contributors
                  </p>
                  <p className="font-mono text-xl font-medium tabular-nums text-[#f1f5f9]">
                    {fileMetrics.contributors}
                  </p>
                </div>
                <div className="rounded-lg border border-[#242b35] bg-[#11161d] p-3.5">
                  <p className="mb-1 text-[9.5px] font-bold uppercase tracking-widest text-[#64748b]">
                    Avg adds/commit
                  </p>
                  <p className="font-mono text-lg font-medium tabular-nums text-emerald-400">
                    +{fileMetrics.avgAdditions}
                  </p>
                </div>
                <div className="rounded-lg border border-[#242b35] bg-[#11161d] p-3.5">
                  <p className="mb-1 text-[9.5px] font-bold uppercase tracking-widest text-[#64748b]">
                    Avg dels/commit
                  </p>
                  <p className="font-mono text-lg font-medium tabular-nums text-rose-400">
                    -{fileMetrics.avgDeletions}
                  </p>
                </div>

                <div className="col-span-2 rounded-lg border border-[#242b35] bg-[#11161d] p-3.5">
                  <p className="mb-3 flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-widest text-[#64748b]">
                    <Calendar size={11} /> Active period
                  </p>
                  <div className="flex items-center gap-3 font-mono text-[12px] font-medium tabular-nums text-[#94a3b8]">
                    <span className="shrink-0">
                      {fileMetrics.firstModified?.toLocaleDateString() || "N/A"}
                    </span>
                    <div className="relative h-px flex-1 bg-[#242b35]">
                      <div className="absolute -top-1 right-0 h-2 w-2 rounded-full bg-slate-500" />
                    </div>
                    <span className="shrink-0">
                      {fileMetrics.lastModified?.toLocaleDateString() || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : <EmptyTab icon={BarChart3} title={historyError ? "Error" : "No metrics"} hint="History unavailable." />
        )}

        {/* TIMELINE TAB */}
        {activeTab === "timeline" && (
          loadingHistory ? <TabSkeleton /> : monthlyBuckets.length > 0 ? (
            <div className="p-4 sm:p-5">
              <div className="flex h-36 items-end gap-1.5 border-b border-[#242b35] pb-2 pt-3 sm:h-44 sm:gap-2">
                {monthlyBuckets.map(([month, count]) => (
                  <div key={month} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                    <span className="translate-y-1 font-mono text-[10px] font-medium tabular-nums text-[#64748b] opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transition-none">
                      {count}
                    </span>
                    <div
                      className="w-full max-w-[32px] rounded-t bg-slate-600 transition-all duration-300 group-hover:bg-sky-500/70 motion-reduce:transition-none"
                      style={{ height: `${(count / maxMonthlyCount) * 100}%`, minHeight: "6px" }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-1.5 pt-2 sm:gap-2">
                {monthlyBuckets.map(([month]) => (
                  <span key={month} className="flex-1 text-center font-mono text-[9.5px] text-[#64748b]">
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
            <div className="p-4 sm:p-5">
              <div className="overflow-hidden rounded-lg border border-[#242b35] bg-[#11161d]">
                {coupledFiles.slice(0, 10).map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 border-b border-[#242b35] px-3.5 py-2.5 transition-colors last:border-b-0 hover:bg-[#1a222c]"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-[12.5px] text-[#94a3b8]">
                      <GitBranch size={13} className="shrink-0 text-[#64748b]" />
                      <span className="truncate font-mono">{d.file}</span>
                    </span>
                    <span className="shrink-0 rounded bg-[#151b23] px-1.5 py-0.5 font-mono text-[10.5px] font-medium tabular-nums text-[#94a3b8]">
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
            <div className="divide-y divide-[#242b35]">
              {fileCommits.map((c, i) => (
                <div key={c.hash || i} className="space-y-2 p-3.5 transition-colors hover:bg-[#1a222c] sm:p-4">
                  <p className="text-[13px] font-medium leading-snug text-[#f1f5f9]">
                    {c.message || "No commit message"}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-[#64748b]">
                    <span className="flex items-center gap-1.5 font-medium text-[#94a3b8]">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1a222c] text-[9px] font-bold text-[#94a3b8]">
                        {initials(c.author_name)}
                      </span>
                      {c.author_name || "Unknown"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={11} /> {relativeTime(c.date)}
                    </span>
                    <div className="flex items-center gap-1.5 font-mono tabular-nums">
                      <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-400">
                        +{c.additions || 0}
                      </span>
                      <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-rose-400">
                        -{c.deletions || 0}
                      </span>
                    </div>
                    <span className="ml-auto font-mono text-[#64748b]">
                      {(c.hash || "").substring(0, 7)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyTab icon={History} title="No commits found" hint="File history is empty." />
        )}
      </div>

      {/* Footer actions — fixed */}
      <div className="flex shrink-0 flex-col gap-2 border-t border-[#242b35] bg-[#11161d] p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2.5">
          <button className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-sky-500/20 bg-sky-500/10 px-4 text-[13px] font-medium text-sky-400 transition-colors hover:bg-sky-500/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500/60 sm:h-9">
            <Wand2 size={14} /> Generate Refactor
          </button>
          <button
            onClick={handleCopyReport}
            className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#242b35] bg-[#151b23] px-4 text-[13px] font-medium text-[#94a3b8] transition-colors hover:bg-[#1a222c] hover:text-[#f1f5f9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500/60 sm:h-9"
          >
            {copied ? (
              <><Check size={14} className="text-emerald-400" /> Copied</>
            ) : (
              <><Copy size={14} /> Copy Report</>
            )}
          </button>
        </div>

        {fileMetrics && (
          <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-widest text-[#64748b]">
            <Users size={13} /> {fileMetrics.contributors} contributors
          </span>
        )}
      </div>
    </div>
  );
}

export default HotspotDetails;