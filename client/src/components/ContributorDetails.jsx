import { useEffect, useMemo, useState } from "react";
import {
  X,
  Search,
  GitCommit,
  Plus,
  Minus,
  Calendar,
  Flame,
  ChevronDown,
} from "lucide-react";

const PAGE_SIZE = 10;

function initials(name) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function StatCard({ icon: Icon, label, value, tone = "text-slate-900" }) {
  return (
    <div className="rounded-xl bg-gray-50 px-4 py-3">
      <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
        <Icon size={12} />
        {label}
      </p>
      <p className={`text-lg font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function ContributorDetails({ selectedContributor, allCommits, onClose }) {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setQuery("");
    setVisibleCount(PAGE_SIZE);
  }, [selectedContributor]);

  useEffect(() => {
    if (!selectedContributor || !onClose) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedContributor, onClose]);

  const contributorCommits = useMemo(
    () =>
      (allCommits || [])
        .filter((commit) => commit.author_name === selectedContributor)
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [allCommits, selectedContributor]
  );

  const filteredCommits = useMemo(() => {
    if (!query.trim()) return contributorCommits;
    const q = query.toLowerCase();
    return contributorCommits.filter(
      (commit) =>
        commit.message?.toLowerCase().includes(q) ||
        commit.hash?.toLowerCase().includes(q)
    );
  }, [contributorCommits, query]);

  const stats = useMemo(() => {
    const additions = contributorCommits.reduce((sum, c) => sum + (c.additions || 0), 0);
    const deletions = contributorCommits.reduce((sum, c) => sum + (c.deletions || 0), 0);
    const dates = contributorCommits.map((c) => new Date(c.date)).filter((d) => !isNaN(d));
    const firstCommit = dates.length ? new Date(Math.min(...dates)) : null;
    const lastCommit = dates.length ? new Date(Math.max(...dates)) : null;
    return { additions, deletions, firstCommit, lastCommit };
  }, [contributorCommits]);

  if (!selectedContributor) {
    return null;
  }

  const visibleCommits = filteredCommits.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCommits.length;

  return (
    <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0">
            {initials(selectedContributor)}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900 truncate">
              {selectedContributor}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Contributor activity</p>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Close contributor details"
          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors shrink-0"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-6">
        {contributorCommits.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <GitCommit size={28} className="mx-auto mb-2 text-gray-300" />
            <p>No commits found for this contributor.</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard icon={GitCommit} label="Total commits" value={contributorCommits.length} />
              <StatCard
                icon={Plus}
                label="Additions"
                value={stats.additions.toLocaleString()}
                tone="text-green-600"
              />
              <StatCard
                icon={Minus}
                label="Deletions"
                value={stats.deletions.toLocaleString()}
                tone="text-red-600"
              />
              <StatCard
                icon={Flame}
                label="Total churn"
                value={(stats.additions + stats.deletions).toLocaleString()}
                tone="text-orange-500"
              />
            </div>

            {stats.firstCommit && stats.lastCommit && (
              <p className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
                <Calendar size={13} />
                Active from {stats.firstCommit.toLocaleDateString()} to{" "}
                {stats.lastCommit.toLocaleDateString()}
              </p>
            )}

            {/* Search */}
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <h3 className="font-semibold text-slate-900">
                Commits {query && `(${filteredCommits.length} matching)`}
              </h3>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 w-full sm:w-64">
                <Search size={14} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  placeholder="Search this contributor's commits..."
                  className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-gray-400 outline-none min-w-0"
                />
              </div>
            </div>

            {/* Commit list */}
            {filteredCommits.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                No commits match "{query}".
              </div>
            ) : (
              <div className="space-y-3">
                {visibleCommits.map((commit) => (
                  <div
                    key={commit.hash}
                    className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {commit.message}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          <span>{new Date(commit.date).toLocaleString()}</span>
                          {(commit.additions !== undefined ||
                            commit.deletions !== undefined) && (
                            <span className="flex items-center gap-2 text-xs">
                              <span className="text-green-600 font-medium">
                                +{commit.additions || 0}
                              </span>
                              <span className="text-red-600 font-medium">
                                -{commit.deletions || 0}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="h-fit bg-gray-100 px-3 py-1 rounded-lg text-xs font-mono text-gray-600 shrink-0">
                        {commit.hash.substring(0, 7)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {hasMore && (
              <button
                onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Show more <ChevronDown size={15} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ContributorDetails;