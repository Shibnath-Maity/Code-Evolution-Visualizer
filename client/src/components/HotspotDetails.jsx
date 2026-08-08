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
  Critical: { text: "text-red-600", bg: "bg-red-50", ring: "#ef4444", badge: "bg-red-50 text-red-600 border border-red-100" },
  High: { text: "text-orange-600", bg: "bg-orange-50", ring: "#f97316", badge: "bg-orange-50 text-orange-600 border border-orange-100" },
  Medium: { text: "text-amber-600", bg: "bg-amber-50", ring: "#f59e0b", badge: "bg-amber-50 text-amber-600 border border-amber-100" },
  Low: { text: "text-emerald-600", bg: "bg-emerald-50", ring: "#10b981", badge: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
  Unknown: { text: "text-slate-500", bg: "bg-slate-50", ring: "#94a3b8", badge: "bg-slate-50 text-slate-500 border border-slate-200" },
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
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-slate-900">{pct}%</span>
      </div>
    </div>
  );
}

function EmptyTab({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="bg-slate-50 p-3 rounded-full mb-3">
        <Icon size={22} className="text-slate-300" />
      </div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-xs text-slate-400 mt-1 max-w-[240px]">{hint}</p>
    </div>
  );
}

function TabSkeleton() {
  return (
    <div className="p-5 space-y-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-100 rounded w-full" />
      ))}
    </div>
  );
}

function Bar({ label, value, color = "bg-slate-900" }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-slate-700">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

function HotspotDetails({ selectedHotspot, onClose, maxScore = 0 }) {
  const { repositoryId } = useAnalysis();

  const [activeTab, setActiveTab] = useState("ai");
  const [copied, setCopied] = useState(false);

  const [fileCommits, setFileCommits] = useState(null); // null = not fetched yet
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
      params: {
        repositoryId,
        file,
      },
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
      .slice(-6); // last 6 months with activity
  }, [fileCommits]);

  if (!selectedHotspot) return null;

  const {
    changes = 0,
    additions = 0,
    deletions = 0,
    score = 0,
    aiInsight,
  } = selectedHotspot;

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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-orange-100 p-2.5 rounded-xl shrink-0">
            <FileCode2 size={20} className="text-orange-500" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 truncate" title={file}>
              {file}
            </h2>
            <p className="text-xs text-gray-400 truncate">{file}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${risk.badge}`}>
            <RiskIcon size={12} />
            {aiInsight?.riskLevel || "Unknown"}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Score + stat pills */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-5 shrink-0 flex-wrap">
        <ScoreGauge score={gaugePct} ringColor={risk.ring} />
        <div className="grid grid-cols-3 gap-4 flex-1 min-w-[220px]">
          <div>
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <Plus size={11} /> Additions
            </p>
            <p className="text-sm font-bold text-green-600">+{additions}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <Minus size={11} /> Deletions
            </p>
            <p className="text-sm font-bold text-red-600">-{deletions}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <GitCommit size={11} /> Commits
            </p>
            <p className="text-sm font-bold text-slate-900">{changes}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 pt-2 border-b border-gray-100 overflow-x-auto shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "ai" && (
          <div className="p-5 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mb-2">
                <Sparkles size={14} className="text-violet-500" />
                AI Summary
              </h3>
              <p className="text-sm text-gray-600 leading-6">
                {aiInsight?.summary || "AI analysis is not available for this hotspot."}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mb-3">
                <TriangleAlert size={14} className="text-red-500" />
                Risk Factors
              </h3>
              {riskFactors?.length ? (
                <div className="space-y-3">
                  {riskFactors.map((f, i) => (
                    <Bar key={i} label={f.label} value={f.value} color="bg-red-500" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <Bar label="Change Frequency" value={derivedFrequency} color="bg-red-500" />
                  <Bar label="Code Churn (additions + deletions)" value={derivedChurn} color="bg-orange-500" />
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mb-3">
                <Lightbulb size={14} className="text-amber-500" />
                Recommendations
              </h3>
              {aiInsight?.recommendations?.length ? (
                <ul className="space-y-2">
                  {aiInsight.recommendations.map((r, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2"
                    >
                      <CircleCheck size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 italic">No specific recommendations available.</p>
              )}
            </div>

            {(aiInsight?.impact || impactPrediction?.length) && (
              <div>
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mb-2">
                  <Activity size={14} className="text-blue-500" />
                  {impactPrediction?.length ? "Impact Prediction" : "Potential Impact"}
                </h3>
                {impactPrediction?.length ? (
                  <div className="space-y-3">
                    {impactPrediction.map((f, i) => (
                      <Bar key={i} label={f.label} value={f.value} color="bg-blue-500" />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 leading-6">{aiInsight.impact}</p>
                )}
              </div>
            )}

            {confidence != null && (
              <div className="bg-slate-900 text-white rounded-xl p-4">
                <p className="text-xs text-slate-300 mb-1">AI Confidence</p>
                <p className="text-2xl font-bold">{confidence}%</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "metrics" && (
          loadingHistory ? (
            <TabSkeleton />
          ) : fileMetrics ? (
            <div className="p-5 grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[11px] text-gray-400">Total Commits</p>
                <p className="text-lg font-bold text-slate-900">{fileMetrics.totalCommits}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[11px] text-gray-400">Contributors</p>
                <p className="text-lg font-bold text-slate-900">{fileMetrics.contributors}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[11px] text-gray-400">Avg Additions / commit</p>
                <p className="text-lg font-bold text-green-600">+{fileMetrics.avgAdditions}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[11px] text-gray-400">Avg Deletions / commit</p>
                <p className="text-lg font-bold text-red-600">-{fileMetrics.avgDeletions}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                <p className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Calendar size={11} /> First → Last modified
                </p>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  {fileMetrics.firstModified?.toLocaleDateString() || "N/A"} →{" "}
                  {fileMetrics.lastModified?.toLocaleDateString() || "N/A"}
                </p>
              </div>
            </div>
          ) : (
            <EmptyTab
              icon={BarChart3}
              title={historyError ? "Error loading commit history" : "No metrics available"}
              hint={
                historyError
                  ? "Failed to load details from the server."
                  : "No commit history found for this file."
              }
            />
          )
        )}

        {activeTab === "timeline" && (
          loadingHistory ? (
            <TabSkeleton />
          ) : monthlyBuckets.length > 0 ? (
            <div className="p-5">
              <div className="flex items-end gap-3 h-40">
                {monthlyBuckets.map(([month, count]) => (
                  <div key={month} className="flex-1 h-full flex flex-col items-center justify-end gap-2">
                    <span className="text-[11px] font-semibold text-slate-700">{count}</span>
                    <div
                      className="w-full bg-orange-400 rounded-t-md"
                      style={{ height: `${(count / maxMonthlyCount) * 100}%`, minHeight: 4 }}
                    />
                    <span className="text-[10px] text-gray-400">{month.slice(2)}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-4">Commits per month, last {monthlyBuckets.length} active months.</p>
            </div>
          ) : (
            <EmptyTab
              icon={Activity}
              title={historyError ? "Error loading commit history" : "No timeline data"}
              hint={
                historyError
                  ? "Failed to load details from the server."
                  : "No commit history found for this file."
              }
            />
          )
        )}

        {activeTab === "dependencies" && (
          loadingHistory ? (
            <TabSkeleton />
          ) : coupledFiles.length > 0 ? (
            <div className="p-5 space-y-2">
              <p className="text-xs text-gray-400 mb-3">
                Files most often changed in the same commits as this one.
              </p>
              {coupledFiles.slice(0, 10).map((d, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
                  <span className="flex items-center gap-2 text-slate-700 truncate">
                    <GitBranch size={13} className="text-gray-400 shrink-0" />
                    <span className="truncate">{d.file}</span>
                  </span>
                  <span className="text-xs font-medium text-orange-600 shrink-0">{d.count}×</span>
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
          )
        )}

        {activeTab === "commits" && (
          loadingHistory ? (
            <TabSkeleton />
          ) : fileCommits?.length > 0 ? (
            <div className="p-5 space-y-3">
              {fileCommits.map((c, i) => (
                <div key={c.hash || i} className="border-b border-gray-50 pb-3 last:border-0">
                  <p className="text-sm font-medium text-slate-800">{c.message || "No commit message"}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-bold flex items-center justify-center">
                        {initials(c.author_name)}
                      </span>
                      {c.author_name || "Unknown"}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Clock size={11} /> {relativeTime(c.date)}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-green-600">
                      <Plus size={10} /> {c.additions || 0}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-red-600">
                      <Minus size={10} /> {c.deletions || 0}
                    </span>
                    <span className="text-[11px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
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
              hint={
                historyError
                  ? "Failed to load details from the server."
                  : "No commit history found for this file."
              }
            />
          )
        )}
      </div>

      {/* Action bar */}
      <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2 shrink-0 flex-wrap">
        <button className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors">
          <Wand2 size={13} /> Generate Refactor
        </button>
        <button
          onClick={handleCopyReport}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 px-3 py-2 rounded-lg border border-gray-200 transition-colors"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-500" /> Copied!
            </>
          ) : (
            <>
              <Copy size={13} /> Copy Report
            </>
          )}
        </button>
        {fileMetrics && (
          <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
            <Users size={12} /> {fileMetrics.contributors} contributors
          </span>
        )}
      </div>
    </div>
  );
}

export default HotspotDetails;