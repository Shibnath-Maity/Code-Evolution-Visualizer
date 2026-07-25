import { Flame, FileWarning, AlertTriangle, Clock } from "lucide-react";

const HOTSPOTS = [
  {
    path: "src/components/Board.jsx",
    changes: 18,
    lastModified: "2 hours ago",
    risk: "High",
  },
  {
    path: "src/api/repositoryService.js",
    changes: 14,
    lastModified: "Yesterday",
    risk: "High",
  },
  {
    path: "src/components/CommitTimeline.jsx",
    changes: 9,
    lastModified: "2 days ago",
    risk: "Medium",
  },
  {
    path: "src/utils/dateHelpers.js",
    changes: 6,
    lastModified: "3 days ago",
    risk: "Medium",
  },
  {
    path: "src/pages/Dashboard.jsx",
    changes: 4,
    lastModified: "5 days ago",
    risk: "Low",
  },
  {
    path: "src/hooks/useAnalysis.js",
    changes: 3,
    lastModified: "1 week ago",
    risk: "Low",
  },
];

const RISK_STYLES = {
  High: "bg-red-50 text-red-600",
  Medium: "bg-amber-50 text-amber-600",
  Low: "bg-emerald-50 text-emerald-600",
};

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function HotspotRow({ hotspot, maxChanges }) {
  const intensity = Math.round((hotspot.changes / maxChanges) * 100);

  return (
    <div className="flex items-center gap-4 px-2 py-4 border-b border-slate-100 last:border-0">
      <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
        <FileWarning className="h-4 w-4 text-orange-500" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 font-mono truncate">
          {hotspot.path}
        </p>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
          <Clock className="h-3 w-3" />
          {hotspot.lastModified}
        </div>
      </div>

      <div className="hidden sm:flex flex-1 items-center gap-3 max-w-[160px]">
        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full"
            style={{ width: `${intensity}%` }}
          />
        </div>
      </div>

      <div className="text-sm font-semibold text-slate-700 w-24 text-right shrink-0">
        {hotspot.changes} changes
      </div>

      <span
        className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${RISK_STYLES[hotspot.risk]}`}
      >
        {hotspot.risk}
      </span>
    </div>
  );
}

function Hotspots() {
  const sorted = [...HOTSPOTS].sort((a, b) => b.changes - a.changes);
  const totalHotspots = sorted.length;
  const mostChanged = sorted[0];
  const maxChanges = mostChanged.changes;

  const highRiskCount = sorted.filter((h) => h.risk === "High").length;
  const overallRisk =
    highRiskCount >= 2 ? "High" : highRiskCount === 1 ? "Medium" : "Low";

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900">Code Hotspots</h1>
      <p className="text-slate-500 mt-2 mb-8">
        Find files that change frequently and may need attention.
      </p>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={Flame}
          label="Total Hotspots"
          value={totalHotspots}
          accent="bg-orange-500"
        />
        <StatCard
          icon={FileWarning}
          label="Most Changed File"
          value={mostChanged.path.split("/").pop()}
          accent="bg-blue-500"
        />
        <StatCard
          icon={AlertTriangle}
          label="Risk Level"
          value={overallRisk}
          accent={
            overallRisk === "High"
              ? "bg-red-500"
              : overallRisk === "Medium"
              ? "bg-amber-500"
              : "bg-emerald-500"
          }
        />
      </div>

      {/* Hotspot List */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        {sorted.map((hotspot) => (
          <HotspotRow key={hotspot.path} hotspot={hotspot} maxChanges={maxChanges} />
        ))}
      </div>
    </div>
  );
}

export default Hotspots;