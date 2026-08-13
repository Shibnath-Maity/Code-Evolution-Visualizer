import React, { useMemo, useState } from "react";
import {
  GitCommit,
  Clock,
  Plus,
  Minus,
  Copy,
  Check,
  History,
  User,
} from "lucide-react";

const MAX_COMMITS = 10;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayLabel(date) {
  const commitDay = startOfDay(date).getTime();
  const today = startOfDay(new Date()).getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  if (commitDay === today) return "Today";
  if (commitDay === today - oneDay) return "Yesterday";

  const diffDays = Math.round((today - commitDay) / oneDay);
  if (diffDays < 7) {
    return new Date(date).toLocaleDateString(undefined, { weekday: "long" });
  }

  return new Date(date).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year:
      new Date(date).getFullYear() !== new Date().getFullYear()
        ? "numeric"
        : undefined,
  });
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateMessage(message, max = 75) {
  if (!message) return "No commit message";
  const firstLine = message.split("\n")[0];
  if (firstLine.length <= max) return firstLine;
  return `${firstLine.slice(0, max).trimEnd()}…`;
}

export default function ContributorActivity({ contributorName, allCommits }) {
  const [copiedHash, setCopiedHash] = useState(null);

  const handleCopyHash = (hash, e) => {
    e.stopPropagation();
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  const { groups, totalForContributor } = useMemo(() => {
    const source = (allCommits || []).filter((commit) => {
      if (!contributorName) return true;
      const author = commit.author_name || commit.author;
      return author === contributorName;
    });

    const authored = [...source].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    const recent = authored.slice(0, MAX_COMMITS);

    const ordered = [];
    const indexByLabel = new Map();

    recent.forEach((commit) => {
      const label = dayLabel(commit.date);
      if (!indexByLabel.has(label)) {
        indexByLabel.set(label, ordered.length);
        ordered.push({ label, commits: [] });
      }
      ordered[indexByLabel.get(label)].commits.push(commit);
    });

    return { groups: ordered, totalForContributor: authored.length };
  }, [contributorName, allCommits]);

  if (!groups.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200/80 bg-white/50 py-12 text-center backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          <History size={20} />
        </div>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          No commit activity found
        </p>
        <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
          {contributorName
            ? `No recorded commits for ${contributorName}`
            : "No commits logged for this repository yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {groups.map((group) => (
        <div key={group.label} className="relative">
          {/* Section Date Badge */}
          <div className="sticky top-0 z-10 mb-4 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-indigo-200/60 bg-indigo-50/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 backdrop-blur-md dark:border-indigo-500/20 dark:bg-indigo-950/60 dark:text-indigo-400">
              {group.label}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-800" />
          </div>

          {/* Timeline List */}
          <ol className="relative ml-3 space-y-4 border-l-2 border-slate-100 dark:border-slate-800/80">
            {group.commits.map((commit) => {
              const shortHash = commit.hash ? commit.hash.substring(0, 7) : "";
              const isCopied = copiedHash === commit.hash;
              const authorName = commit.author_name || commit.author || "";

              return (
                <li
                  key={commit.hash || `${commit.author}-${commit.date}`}
                  className="group relative pl-6"
                >
                  {/* Timeline Node Icon */}
                  <div className="absolute -left-[13px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-indigo-600 ring-4 ring-slate-50/50 group-hover:scale-110 group-hover:text-indigo-500 group-hover:ring-indigo-100 dark:bg-slate-900 dark:text-indigo-400 dark:ring-slate-900 dark:group-hover:ring-indigo-950/50 transition-all duration-200">
                    <GitCommit size={14} />
                  </div>

                  {/* Commit Content Box */}
                  <div className="rounded-2xl border border-slate-100 bg-white/70 p-3.5 shadow-sm backdrop-blur-sm transition-all duration-200 group-hover:border-slate-200/80 group-hover:bg-white group-hover:shadow-md group-hover:shadow-slate-200/40 dark:border-slate-800/60 dark:bg-slate-900/50 dark:group-hover:border-slate-700 dark:group-hover:bg-slate-800/80 dark:group-hover:shadow-none">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-semibold leading-relaxed text-slate-800 dark:text-slate-200">
                        {truncateMessage(commit.message)}
                      </p>

                      <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        <Clock size={10} />
                        {formatTime(commit.date)}
                      </span>
                    </div>

                    {/* Metadata Strip */}
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100/60 dark:border-slate-800/40">
                      <div className="flex items-center gap-2">
                        {/* Copyable Hash Badge */}
                        {shortHash && (
                          <button
                            type="button"
                            onClick={(e) => handleCopyHash(commit.hash, e)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200/60 bg-slate-50/80 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300"
                            title="Click to copy commit hash"
                          >
                            <span>{shortHash}</span>
                            {isCopied ? (
                              <Check size={10} className="text-emerald-500" />
                            ) : (
                              <Copy size={10} className="opacity-60" />
                            )}
                          </button>
                        )}

                        {/* Author tag when in global feed view */}
                        {!contributorName && authorName && (
                          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            <User size={10} className="text-slate-400" />
                            <span className="truncate max-w-[100px]">
                              {authorName}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Additions / Deletions */}
                      <div className="flex items-center gap-2 font-mono text-[10px] font-bold tabular-nums">
                        {typeof commit.additions === "number" && (
                          <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                            <Plus size={9} />
                            {commit.additions}
                          </span>
                        )}
                        {typeof commit.deletions === "number" && (
                          <span className="flex items-center gap-0.5 text-rose-500 dark:text-rose-400">
                            <Minus size={9} />
                            {commit.deletions}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ))}

      {/* Pagination Footer */}
      {totalForContributor > MAX_COMMITS && (
        <div className="pt-2 text-center">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50/80 px-3 py-1 font-mono text-[10px] font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
            Showing latest {MAX_COMMITS} of {totalForContributor} commits
          </span>
        </div>
      )}
    </div>
  );
}