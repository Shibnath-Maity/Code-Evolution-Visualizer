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
    <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0">
          {getInitial(contributorName)}
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900 truncate">{contributorName}</h2>
          {rank === 0 && (
            <span className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
              <Trophy size={11} /> Top Contributor
            </span>
          )}
          {stats.first && stats.last && (
            <p className="text-[11px] text-gray-400 mt-0.5">
              Active from {stats.first.toLocaleDateString()} to {stats.last.toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-5 shrink-0">
        <div className="text-center">
          <p className="text-sm font-bold text-slate-900 flex items-center gap-1 justify-center">
            <GitCommit size={12} className="text-indigo-400" /> {stats.count}
          </p>
          <p className="text-[10px] text-gray-400">Commits</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-emerald-600 flex items-center gap-1 justify-center">
            <Plus size={12} /> {stats.additions.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-400">Additions</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-orange-500 flex items-center gap-1 justify-center">
            <Flame size={12} /> {(stats.additions + stats.deletions).toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-400">Total Churn</p>
        </div>
      </div>
    </div>
  );
}
