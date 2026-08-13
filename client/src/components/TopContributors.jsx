import { useMemo, useState, useDeferredValue } from "react";
import { Search, Trophy, GitCommit, X, Sparkles } from "lucide-react";

const RANK_BADGES = [
  {
    bg: "bg-amber-400 text-amber-950 ring-amber-300/50",
    label: "Top Contributor",
    glow: "shadow-amber-500/20",
  },
  {
    bg: "bg-slate-300 text-slate-950 ring-slate-200/50",
    label: "2nd Contributor",
    glow: "shadow-slate-400/20",
  },
  {
    bg: "bg-amber-700 text-amber-50 ring-amber-600/50",
    label: "3rd Contributor",
    glow: "shadow-amber-800/20",
  },
];

const numberFormatter = new Intl.NumberFormat("en-US");

function getInitial(name) {
  return (name || "U").trim().charAt(0).toUpperCase();
}

function relativeTime(date) {
  if (!date) return null;
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function TopContributors({
  contributors = [],
  aggregates = {},
  activeContributor,
  onSelect,
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const totalCommits = useMemo(
    () => contributors.reduce((sum, c) => sum + (c.commits || 0), 0),
    [contributors]
  );

  const filtered = useMemo(() => {
    if (!deferredQuery.trim()) return contributors;
    const q = deferredQuery.toLowerCase();
    return contributors.filter((c) => (c.name || "").toLowerCase().includes(q));
  }, [contributors, deferredQuery]);

  return (
    <div className="w-full max-w-2xl bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-100 p-6 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/10">
            <Trophy size={20} className="stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">
              Top Contributors
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              {numberFormatter.format(totalCommits)} total commits across team
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 sm:flex-initial min-w-[180px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contributors..."
            aria-label="Search contributors"
            className="w-full text-xs font-medium border border-slate-200/80 rounded-xl pl-9 pr-8 py-2 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md transition"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Contributors List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
          <p className="text-sm font-medium text-slate-600">No contributors found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search query</p>
          {query && (
            <button
              onClick={() => setQuery("")}
              className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((contributor, index) => {
            const commits = contributor.commits || 0;
            const pct =
              totalCommits > 0 ? ((commits / totalCommits) * 100).toFixed(1) : "0.0";
            const agg = aggregates[contributor.name] || {};
            const isActive = activeContributor === contributor.name;
            const isTop3 = index < 3;
            const badgeStyle = RANK_BADGES[index];

            return (
              <button
                key={contributor.name || index}
                type="button"
                onClick={() => onSelect?.(contributor.name)}
                className={`w-full group text-left rounded-xl p-4 border transition-all duration-200 ease-out hover:-translate-y-0.5 ${
                  isActive
                    ? "border-indigo-500/30 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-md shadow-indigo-500/5"
                    : "border-slate-100 hover:border-slate-200/80 hover:bg-slate-50/70 hover:shadow-md hover:shadow-slate-200/40"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Avatar + Details */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-100 to-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm shadow-inner">
                        {getInitial(contributor.name)}
                      </div>
                      {isTop3 && (
                        <span
                          className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ring-2 ring-white font-extrabold text-[10px] flex items-center justify-center shadow-sm ${badgeStyle.bg}`}
                        >
                          {index + 1}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-slate-900 truncate">
                          {contributor.name || "Unknown Contributor"}
                        </p>
                        {index === 0 && (
                          <Sparkles size={13} className="text-amber-500 shrink-0" />
                        )}
                      </div>

                      {contributor.email && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {contributor.email}
                        </p>
                      )}

                      <p className="text-[11px] font-medium text-slate-500 mt-1">
                        {isTop3 ? (
                          <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                            {badgeStyle.label}
                          </span>
                        ) : (
                          `Rank #${index + 1}`
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Right: Commit Stats */}
                  <div className="text-right shrink-0">
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-1 justify-end">
                      <GitCommit size={14} className="text-indigo-500 stroke-[2.2]" />
                      {numberFormatter.format(commits)}
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      commits
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(Math.max(Number(pct), 2), 100)}%` }}
                  />
                </div>

                {/* Stat Badges */}
                <div className="flex items-center justify-between flex-wrap gap-2 mt-3 text-xs">
                  <span className="text-slate-400 font-medium">{pct}% of total</span>

                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    {typeof agg.additions === "number" && (
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium border border-emerald-200/60">
                        +{numberFormatter.format(agg.additions)}
                      </span>
                    )}
                    {typeof agg.deletions === "number" && (
                      <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 font-medium border border-rose-200/60">
                        -{numberFormatter.format(agg.deletions)}
                      </span>
                    )}
                  </div>

                  {agg.lastActive && (
                    <span className="text-slate-400 text-[11px]">
                      Active {relativeTime(agg.lastActive)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}