import { useMemo } from "react";
import { GitCommit } from "lucide-react";

const MAX_COMMITS = 8;

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

function truncateMessage(message, max = 90) {
  if (!message) return "No commit message";
  const firstLine = message.split("\n")[0];
  if (firstLine.length <= max) return firstLine;
  return `${firstLine.slice(0, max).trimEnd()}…`;
}

export default function ContributorActivity({ contributorName, allCommits }) {
  const { groups, totalForContributor } = useMemo(() => {
    const authored = (allCommits || [])
    
      .sort((a, b) => new Date(b.date) - new Date(a.date));

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
      <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Recent Activity
        </h2>
        <p className="text-sm text-gray-500">
          No commits found for {contributorName || "this contributor"} yet.
        </p>
      </div>
    );
  }

  const hasMore = totalForContributor > groups.flatMap((g) => g.commits).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
        <span className="text-xs font-medium text-gray-400">
          Last {Math.min(MAX_COMMITS, totalForContributor)} of{" "}
          {totalForContributor} commits
        </span>
      </div>

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-3">
              {group.label}
            </p>

            <ol className="relative border-l-2 border-gray-100 ml-1.5 space-y-5">
              {group.commits.map((commit) => (
                <li key={commit.hash || `${commit.author}-${commit.date}`} className="pl-5">
                  <span
                    className="absolute -left-[7px] mt-1.5 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-white"
                    aria-hidden="true"
                  />
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-slate-900 leading-snug">
                      {truncateMessage(commit.message)}
                    </p>
                    <span className="shrink-0 text-xs text-gray-400 mt-0.5">
                      {formatTime(commit.date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1.5">
                    {commit.hash && (
                      <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-mono">
                        <GitCommit size={12} aria-hidden="true" />
                        {commit.hash.substring(0, 7)}
                      </span>
                    )}

                    {typeof commit.additions === "number" && (
                      <span className="text-xs text-emerald-600">
                        +{commit.additions}
                      </span>
                    )}
                    {typeof commit.deletions === "number" && (
                      <span className="text-xs text-red-500">
                        -{commit.deletions}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      {hasMore && (
        <p className="text-xs text-gray-400 mt-5 text-center">
          Showing the {MAX_COMMITS} most recent commits
        </p>
      )}
    </div>
  );
}