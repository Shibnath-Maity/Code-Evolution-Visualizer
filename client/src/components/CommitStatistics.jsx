import React from "react";
import {
  GitCommit,
  Users,
  FileText,
  Plus,
  Minus,
  Folder,
  Calendar,
  BarChart3,
  Clock,
} from "lucide-react";

function StatisticRow({
  icon: Icon,
  label,
  value,
  colorClass = "text-white",
  iconColor = "text-slate-400",
  bgIcon = "bg-slate-800/50",
}) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-800/40 transition-colors border border-transparent hover:border-slate-800/60">
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 rounded-lg ${bgIcon} border border-slate-700/50`}>
          <Icon size={14} className={iconColor} />
        </div>
        <span className="text-xs font-medium text-slate-400">{label}</span>
      </div>
      <span className={`text-xs font-mono font-bold ${colorClass}`}>{value}</span>
    </div>
  );
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
}

function pick(source, ...keys) {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key];
  }
  return undefined;
}

function CommitStatistics({ stats }) {
  if (!stats) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 h-full flex flex-col justify-center items-center backdrop-blur-xl text-center">
        <BarChart3 className="h-8 w-8 text-slate-600 mb-2" />
        <p className="text-sm font-semibold text-slate-400">No Commit Statistics</p>
        <p className="text-xs text-slate-500 mt-0.5">Statistics data is currently unavailable.</p>
      </div>
    );
  }

  const totalCommits = toNumber(stats.totalCommits);
  const authors = toNumber(stats.authors);
  const filesChanged = toNumber(pick(stats, "filesChanged", "totalFilesChanged"));
  const additions = toNumber(pick(stats, "additions", "totalAdditions"));
  const deletions = toNumber(pick(stats, "deletions", "totalDeletions"));
  const avgFilesPerCommit = toNumber(
    pick(stats, "avgFilesPerCommit", "averageFilesChanged")
  );

  return (
    <div className="relative group bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 h-full flex flex-col justify-between shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute -bottom-20 -right-20 w-52 h-52 bg-indigo-500/10 blur-[70px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Commit Statistics
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Key activity metrics and repository impact summary
          </p>
        </div>

        <span className="px-2.5 py-1 bg-slate-800/60 border border-slate-700/60 rounded-xl text-[11px] font-mono text-indigo-300">
          Overview
        </span>
      </div>

      {/* Top Featured Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
        {/* Total Commits */}
        <div className="p-3 bg-slate-800/40 border border-slate-800/80 rounded-xl flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <GitCommit size={18} />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Commits</p>
            <p className="text-sm font-bold font-mono text-white">{totalCommits.toLocaleString()}</p>
          </div>
        </div>

        {/* Total Authors */}
        <div className="p-3 bg-slate-800/40 border border-slate-800/80 rounded-xl flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Authors</p>
            <p className="text-sm font-bold font-mono text-white">{authors.toLocaleString()}</p>
          </div>
        </div>

        {/* Additions */}
        <div className="p-3 bg-slate-800/40 border border-slate-800/80 rounded-xl flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Plus size={18} />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Additions</p>
            <p className="text-sm font-bold font-mono text-emerald-400">+{additions.toLocaleString()}</p>
          </div>
        </div>

        {/* Deletions */}
        <div className="p-3 bg-slate-800/40 border border-slate-800/80 rounded-xl flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Minus size={18} />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Deletions</p>
            <p className="text-sm font-bold font-mono text-rose-400">-{deletions.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Secondary Detailed Rows */}
      <div className="space-y-1 relative z-10 border-t border-slate-800/80 pt-3">
        <StatisticRow
          icon={FileText}
          label="Total Files Changed"
          value={filesChanged.toLocaleString()}
          iconColor="text-slate-300"
        />

        <StatisticRow
          icon={Folder}
          label="Avg. Files / Commit"
          value={avgFilesPerCommit.toFixed(2)}
          iconColor="text-amber-400"
          bgIcon="bg-amber-500/10"
        />

        <StatisticRow
          icon={Calendar}
          label="First Commit"
          value={formatDate(stats.firstCommit)}
          iconColor="text-indigo-400"
          bgIcon="bg-indigo-500/10"
        />

        <StatisticRow
          icon={Clock}
          label="Latest Commit"
          value={formatDate(stats.latestCommit)}
          iconColor="text-indigo-400"
          bgIcon="bg-indigo-500/10"
        />
      </div>
    </div>
  );
}

export default CommitStatistics;