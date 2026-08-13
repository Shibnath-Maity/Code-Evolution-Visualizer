import React, { useEffect, useMemo, useState } from "react";
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
  ArrowUpRight,
  Sparkles,
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

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "text-slate-900 dark:text-white",
  accentColor = "bg-indigo-500",
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md hover:shadow-slate-200/50 dark:border-slate-800/80 dark:bg-slate-900/40 dark:hover:border-slate-700 dark:hover:bg-slate-800/60 dark:hover:shadow-none">
      {/* Top Accent Line */}
      <div className={`absolute inset-x-0 top-0 h-0.5 opacity-0 transition-opacity group-hover:opacity-100 ${accentColor}`} />
      
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <Icon size={14} className="shrink-0 opacity-80" />
        <span>{label}</span>
      </div>
      <p className={`text-2xl font-bold tracking-tight font-mono tabular-nums ${tone}`}>
        {value}
      </p>
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

  const contributorCommits = useMemo(() => {
    return (allCommits || [])
      .filter((commit) => commit.author_name === selectedContributor)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [allCommits, selectedContributor]);

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
    <div className="relative mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 shadow-2xl shadow-slate-200/50 backdrop-blur-2xl transition-all dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
      {/* Ambient decorative glow background */}
      <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl" />

      {/* Header */}
      <div className="relative flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/40 px-6 py-5 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 font-bold text-white shadow-lg shadow-indigo-500/25">
            {initials(selectedContributor)}
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {selectedContributor}
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <GitBranch size={13} className="text-indigo-500 shrink-0" />
              <span>Contributor Activity Breakdown</span>
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Close contributor details"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/60 bg-white text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-6">
        {contributorCommits.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-12 text-center dark:border-slate-800">
            <GitCommit size={36} className="mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              No commit activity found
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              This contributor has no recorded commits in this repository.
            </p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                icon={GitCommit}
                label="Commits"
                value={contributorCommits.length}
                accentColor="bg-indigo-500"
              />
              <StatCard
                icon={Plus}
                label="Additions"
                value={stats.additions.toLocaleString()}
                tone="text-emerald-600 dark:text-emerald-400"
                accentColor="bg-emerald-500"
              />
              <StatCard
                icon={Minus}
                label="Deletions"
                value={stats.deletions.toLocaleString()}
                tone="text-rose-600 dark:text-rose-400"
                accentColor="bg-rose-500"
              />
              <StatCard
                icon={Flame}
                label="Total Churn"
                value={(stats.additions + stats.deletions).toLocaleString()}
                tone="text-amber-600 dark:text-amber-400"
                accentColor="bg-amber-500"
              />
            </div>

            {/* Date Span indicator */}
            {stats.firstCommit && stats.lastCommit && (
              <div className="mb-6 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <Calendar size={14} className="text-indigo-500 shrink-0" />
                <span>
                  Active period:{" "}
                  <strong className="text-slate-700 dark:text-slate-200 font-mono">
                    {stats.firstCommit.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </strong>{" "}
                  —{" "}
                  <strong className="text-slate-700 dark:text-slate-200 font-mono">
                    {stats.lastCommit.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </strong>
                </span>
              </div>
            )}

            {/* Commit Search Header */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Commit History
                </h3>
                {query && (
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                    {filteredCommits.length} matches
                  </span>
                )}
              </div>

              <div className="relative flex w-full items-center sm:w-72">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3.5 text-slate-400"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  placeholder="Filter messages or hashes..."
                  className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 py-2 pl-9 pr-8 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200 dark:focus:border-indigo-400 dark:focus:bg-slate-900"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Timeline Commit List */}
            {filteredCommits.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No commits found matching "<span className="font-semibold text-slate-600 dark:text-slate-300">{query}</span>"
              </div>
            ) : (
              <div className="relative space-y-3 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                {visibleCommits.map((commit) => (
                  <div
                    key={commit.hash || Math.random()}
                    className="group relative flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-3.5 transition-all duration-200 hover:border-slate-200 hover:bg-slate-50/80 hover:shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 dark:hover:border-slate-700 dark:hover:bg-slate-800/60"
                  >
                    {/* Visual Git Node Marker */}
                    <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-colors group-hover:border-indigo-500 group-hover:bg-indigo-500 group-hover:text-white dark:border-slate-700 dark:bg-slate-800">
                      <GitCommit size={14} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-snug text-slate-800 transition-colors group-hover:text-indigo-600 dark:text-slate-200 dark:group-hover:text-indigo-400">
                          {commit.message}
                        </p>
                        
                        {commit.hash && (
                          <span className="flex shrink-0 items-center gap-0.5 rounded-lg border border-slate-200/60 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-500 group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:border-slate-700/60 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:border-indigo-800 dark:group-hover:bg-indigo-950/50 dark:group-hover:text-indigo-300">
                            {commit.hash.substring(0, 7)}
                            <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 dark:text-slate-500">
                        <span>
                          {new Date(commit.date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>

                        {(commit.additions !== undefined || commit.deletions !== undefined) && (
                          <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums">
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              +{commit.additions || 0}
                            </span>
                            <span className="text-rose-600 dark:text-rose-400 font-semibold">
                              -{commit.deletions || 0}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load More Pagination */}
            {hasMore && (
              <button
                onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50 py-2.5 text-xs font-bold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-100 active:scale-[0.99] dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <span>Load More Commits</span>
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