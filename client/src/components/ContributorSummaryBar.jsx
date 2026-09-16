import { useMemo } from "react";
import { Trophy, GitCommit, Plus, Flame } from "lucide-react";

function getInitial(name) {
  return (name || "U").charAt(0).toUpperCase();
}

export default function ContributorSummaryBar({ contributorName, allCommits, rank }) {
  const stats = useMemo(() => {
    const commits = (allCommits || []).filter(
      (c) => (c.author_name || c.author) === contributorName
    );
    const additions = commits.reduce((s, c) => s + (c.additions || 0), 0);
    const deletions = commits.reduce((s, c) => s + (c.deletions || 0), 0);
    const dates = commits.map((c) => new Date(c.date)).filter((d) => !isNaN(d));
    const first = dates.length ? new Date(Math.min(...dates)) : null;
    const last = dates.length ? new Date(Math.max(...dates)) : null;
    return { count: commits.length, additions, deletions, first, last };
  }, [allCommits, contributorName]);

  if (!contributorName) return null;

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Contributor info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-full bg-purple-500/10 text-purple-300 font-bold flex items-center justify-center shrink-0 border border-purple-500/20">
          {getInitial(contributorName)}
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-white truncate">{contributorName}</h2>
          {rank === 0 && (
            <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
              <Trophy size={11} className="shrink-0" /> Top Contributor
            </span>
          )}
          {stats.first && stats.last && (
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              Active from {stats.first.toLocaleDateString()} to {stats.last.toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:flex sm:items-center sm:gap-5 sm:shrink-0">
        <div className="text-center">
          <p className="text-sm font-bold text-white flex items-center gap-1 justify-center whitespace-nowrap">
            <GitCommit size={12} className="text-indigo-400 shrink-0" /> {stats.count}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Commits</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-emerald-400 flex items-center gap-1 justify-center whitespace-nowrap">
            <Plus size={12} className="shrink-0" /> {stats.additions.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Additions</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-orange-400 flex items-center gap-1 justify-center whitespace-nowrap">
            <Flame size={12} className="shrink-0" /> {(stats.additions + stats.deletions).toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Total Churn</p>
        </div>
      </div>
    </div>
  );
}