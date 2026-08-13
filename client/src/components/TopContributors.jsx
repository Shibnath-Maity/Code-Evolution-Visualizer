import React, { useMemo, useState, useDeferredValue } from "react";
import { Search, Trophy, GitCommit, X, Sparkles, Clock, Code2 } from "lucide-react";

const RANK_BADGES = [
  {
    bg: "bg-amber-400/10 text-amber-300 ring-amber-400/30 border-amber-400/20",
    medal: "bg-amber-400 text-slate-950 shadow-amber-500/50",
    label: "1st Contributor",
    glow: "shadow-amber-500/10",
  },
  {
    bg: "bg-slate-300/10 text-slate-300 ring-slate-300/30 border-slate-300/20",
    medal: "bg-slate-300 text-slate-950 shadow-slate-400/50",
    label: "2nd Contributor",
    glow: "shadow-slate-400/10",
  },
  {
    bg: "bg-amber-600/10 text-amber-400 ring-amber-600/30 border-amber-600/20",
    medal: "bg-amber-600 text-amber-50 shadow-amber-700/50",
    label: "3rd Contributor",
    glow: "shadow-amber-800/10",
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
    return contributors.filter((c) =>
      (c.name || "").toLowerCase().includes(q)
    );
  }, [contributors, deferredQuery]);

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-800/80 shadow-2xl p-6 transition-all duration-300">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20 shadow-lg shadow-indigo-500/5">
            <Trophy size={20} className="stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Top Contributors
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              {numberFormatter.format(totalCommits)} total commits across team
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:flex-initial min-w-[200px]">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search team members..."
            aria-label="Search contributors"
            className="w-full text-xs font-medium border border-slate-800 rounded-2xl pl-9 pr-8 py-2.5 bg-slate-950/50 text-slate-200 placeholder:text-slate-500 outline-none transition-all duration-200 focus:bg-slate-950 focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 shadow-inner"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-md transition"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Contributors List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/30">
          <div className="p-3 rounded-full bg-slate-800/50 text-slate-400 mb-3">
            <Search size={20} />
          </div>
          <p className="text-sm font-semibold text-slate-300">
            No contributors found
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search terms
          </p>
          {query && (
            <button
              onClick={() => setQuery("")}
              className="mt-3 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
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
              totalCommits > 0
                ? ((commits / totalCommits) * 100).toFixed(1)
                : "0.0";
            const agg = aggregates[contributor.name] || {};
            const isActive = activeContributor === contributor.name;
            const isTop3 = index < 3;
            const badgeStyle = RANK_BADGES[index];

            return (
              <button
                key={contributor.name || index}
                type="button"
                onClick={() => onSelect?.(contributor.name)}
                className={`w-full group text-left rounded-2xl p-4 border transition-all duration-200 ease-out hover:-translate-y-0.5 relative overflow-hidden ${
                  isActive
                    ? "border-indigo-500/50 bg-indigo-500/10 ring-1 ring-indigo-500/30 shadow-lg shadow-indigo-500/10"
                    : "border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/50 hover:shadow-xl"
                }`}
              >
                {/* Subtle Hover Gradient Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Avatar + Info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 text-indigo-400 font-bold flex items-center justify-center text-sm shadow-md">
                          {getInitial(contributor.name)}
                        </div>
                        {isTop3 && (
                          <span
                            className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full ring-2 ring-slate-900 font-black text-[10px] flex items-center justify-center shadow-lg ${badgeStyle.medal}`}
                          >
                            {index + 1}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-white truncate group-hover:text-indigo-300 transition-colors">
                            {contributor.name || "Unknown Contributor"}
                          </p>
                          {index === 0 && (
                            <Sparkles
                              size={14}
                              className="text-amber-400 shrink-0 animate-pulse"
                            />
                          )}
                        </div>

                        {contributor.email && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {contributor.email}
                          </p>
                        )}

                        <p className="text-[11px] font-semibold text-slate-400 mt-1">
                          {isTop3 ? (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${badgeStyle.bg}`}
                            >
                              {badgeStyle.label}
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              Rank #{index + 1}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Right: Commit Counter */}
                    <div className="text-right shrink-0">
                      <div className="font-black text-white text-base flex items-center gap-1.5 justify-end">
                        <GitCommit
                          size={15}
                          className="text-indigo-400 stroke-[2.2]"
                        />
                        {numberFormatter.format(commits)}
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        commits
                      </p>
                    </div>
                  </div>

                  {/* Progress / Share Bar */}
                  <div className="mt-3.5 h-1.5 bg-slate-950/80 rounded-full overflow-hidden p-0.5 ring-1 ring-slate-800/80">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500 ease-out shadow-sm shadow-indigo-500/50"
                      style={{
                        width: `${Math.min(Math.max(Number(pct), 2), 100)}%`,
                      }}
                    />
                  </div>

                  {/* Bottom Stats Footer */}
                  <div className="flex items-center justify-between flex-wrap gap-2 mt-3 text-xs">
                    <span className="text-slate-400 font-medium text-[11px]">
                      {pct}% contribution share
                    </span>

                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      {typeof agg.additions === "number" && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                          +{numberFormatter.format(agg.additions)}
                        </span>
                      )}
                      {typeof agg.deletions === "number" && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/20">
                          -{numberFormatter.format(agg.deletions)}
                        </span>
                      )}
                    </div>

                    {agg.lastActive && (
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        <Clock size={11} className="text-slate-400" />
                        Active {relativeTime(agg.lastActive)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}