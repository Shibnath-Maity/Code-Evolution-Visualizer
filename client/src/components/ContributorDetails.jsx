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
  GitBranch,
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

function StatCard({ icon: Icon, label, value, tone = "text-slate-900", bgTone = "bg-slate-50" }) {
  return (
    <div className={`rounded-xl ${bgTone} p-3.5 border border-slate-100/80 transition-all hover:border-slate-200/80`}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
        <Icon size={14} className="opacity-70" />
        <span>{label}</span>
      </div>
      <p className={`text-xl font-bold tracking-tight ${tone}`}>{value}</p>
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

  if (!selectedContributor) return null;

  const visibleCommits = filteredCommits.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCommits.length;

  return (
    <div className="mt-6 bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-100/50 overflow-hidden transition-all duration-200">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-semibold text-sm flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
            {initials(selectedContributor)}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 truncate tracking-tight">
              {selectedContributor}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1">
              <GitBranch size={12} className="text-slate-400" />
              Contributor Activity
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Close contributor details"
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-all shrink-0 active:scale-95"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-6">
        {contributorCommits.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <GitCommit size={32} className="mx-auto mb-3 text-slate-300 stroke-[1.5]" />
            <p className="text-sm font-medium">No commits found for this contributor.</p>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <StatCard icon={GitCommit} label="Commits" value={contributorCommits.length} />
              <StatCard
                icon={Plus}
                label="Additions"
                value={stats.additions.toLocaleString()}
                tone="text-emerald-600"
                bgTone="bg-emerald-50/50"
              />
              <StatCard
                icon={Minus}
                label="Deletions"
                value={stats.deletions.toLocaleString()}
                tone="text-rose-600"
                bgTone="bg-rose-50/50"
              />
              <StatCard
                icon={Flame}
                label="Total Churn"
                value={(stats.additions + stats.deletions).toLocaleString()}
                tone="text-amber-600"
                bgTone="bg-amber-50/50"
              />
            </div>

            {stats.firstCommit && stats.lastCommit && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-6 px-1">
                <Calendar size={13} className="text-slate-400" />
                <span>
                  Active {stats.firstCommit.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  {" — "}
                  {stats.lastCommit.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}

            {/* Filter Bar */}
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <h3 className="text-sm font-semibold text-slate-800">
                Commits {query && <span className="text-slate-400 font-normal">({filteredCommits.length})</span>}
              </h3>
              <div className="relative flex items-center w-full sm:w-72">
                <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  placeholder="Search commits or hashes..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50/80 focus:bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Commit List */}
            {filteredCommits.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No commits match "<span className="font-medium text-slate-600">{query}</span>"
              </div>
            ) : (
              <div className="space-y-2.5">
                {visibleCommits.map((commit) => (
                  <div
                    key={commit.hash}
                    className="border border-slate-100 rounded-xl p-3.5 hover:border-slate-200 hover:bg-slate-50/60 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 leading-snug truncate group-hover:text-indigo-600 transition-colors">
                          {commit.message}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5">
                          <span>{new Date(commit.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          {(commit.additions !== undefined || commit.deletions !== undefined) && (
                            <span className="flex items-center gap-1.5 font-mono text-[11px]">
                              <span className="text-emerald-600 font-medium">+{commit.additions || 0}</span>
                              <span className="text-rose-600 font-medium">-{commit.deletions || 0}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-md bg-slate-100/80 group-hover:bg-indigo-50 group-hover:text-indigo-600 text-[11px] font-mono text-slate-500 transition-colors shrink-0">
                        {commit.hash.substring(0, 7)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Button */}
            {hasMore && (
              <button
                onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.99] transition-all"
              >
                <span>Load More</span>
                <ChevronDown size={14} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ContributorDetails;