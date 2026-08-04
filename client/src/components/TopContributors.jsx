import { useMemo, useState } from "react";
import { Search, Trophy, GitCommit } from "lucide-react";

const MEDALS = ["🥇", "🥈", "🥉"];
const RANK_LABELS = ["Top Contributor", "Second Contributor", "Third Contributor"];

function getInitial(name) {
  return (name || "U").charAt(0).toUpperCase();
}

function relativeTime(date) {
  if (!date) return null;
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(date).toLocaleDateString();
}

export default function TopContributors({
  contributors = [],
  aggregates = {},
  activeContributor,
  onSelect,
}) {
  const [query, setQuery] = useState("");

  const totalCommits = useMemo(
    () => contributors.reduce((sum, c) => sum + (c.commits || 0), 0),
    [contributors]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return contributors;
    const q = query.toLowerCase();
    return contributors.filter((c) => (c.name || "").toLowerCase().includes(q));
  }, [contributors, query]);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Top Contributors</h2>
        </div>

        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            aria-label="Search contributors"
            className="text-sm border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 w-40 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 py-10 text-center">No contributors found.</p>
      ) : (
        <div className="space-y-5">
          {filtered.map((contributor, index) => {
            const commits = contributor.commits || 0;
            const pct = totalCommits > 0 ? ((commits / totalCommits) * 100).toFixed(1) : "0.0";
            const agg = aggregates[contributor.name] || {};
            const isActive = activeContributor === contributor.name;

            return (
              <button
                key={contributor.name || index}
                type="button"
                onClick={() => onSelect?.(contributor.name)}
                className={`w-full text-left rounded-xl p-4 border transition ${
                  isActive
                    ? "border-indigo-300 bg-indigo-50/60 ring-2 ring-indigo-100"
                    : "border-gray-100 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                        {getInitial(contributor.name)}
                      </div>
                      {index < 3 && (
                        <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-yellow-400 text-white text-[11px] font-bold flex items-center justify-center border-2 border-white">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {contributor.name || "Unknown Contributor"}
                      </p>
                      {contributor.email && (
                        <p className="text-xs text-gray-400 truncate">{contributor.email}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5">
                        {index < 3 ? (
                          <>
                            {MEDALS[index]} {RANK_LABELS[index]}
                          </>
                        ) : (
                          `Rank #${index + 1}`
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900 flex items-center gap-1 justify-end">
                      <GitCommit size={13} className="text-indigo-400" />
                      {commits}
                    </p>
                    <p className="text-xs text-gray-500">commits</p>
                  </div>
                </div>

                <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center flex-wrap gap-x-5 gap-y-1 mt-3 text-xs">
                  <span className="text-gray-400">{pct}% of total</span>
                  {typeof agg.additions === "number" && (
                    <span className="text-emerald-600 font-medium">+{agg.additions}</span>
                  )}
                  {typeof agg.deletions === "number" && (
                    <span className="text-rose-500 font-medium">-{agg.deletions}</span>
                  )}
                  {agg.lastActive && (
                    <span className="text-gray-400">
                      Last active · {relativeTime(agg.lastActive)}
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
