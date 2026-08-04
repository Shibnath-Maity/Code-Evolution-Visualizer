import { useMemo } from "react";
import { GitCommit } from "lucide-react";

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
    year: new Date(date).getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function truncateMessage(message, max = 70) {
  if (!message) return "No commit message";
  const firstLine = message.split("\n")[0];
  if (firstLine.length <= max) return firstLine;
  return `${firstLine.slice(0, max).trimEnd()}…`;
}

// If contributorName is provided, activity is scoped to that person;
// otherwise it shows the full repository feed.
export default function ContributorActivity({ contributorName, allCommits }) {
  const { groups, totalForContributor } = useMemo(() => {
    const source = (allCommits || []).filter((commit) => {
      if (!contributorName) return true;
      const author = commit.author_name || commit.author;
      return author === contributorName;
    });

    const authored = [...source].sort((a, b) => new Date(b.date) - new Date(a.date));
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
      <p className="text-sm text-gray-400 py-10 text-center">
        No commits found{contributorName ? ` for ${contributorName}` : ""} yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide mb-2">
            {group.label}
          </p>

          <ol className="relative border-l-2 border-gray-100 ml-1 space-y-3">
            {group.commits.map((commit) => (
              <li key={commit.hash || `${commit.author}-${commit.date}`} className="pl-4">
                <span
                  className="absolute -left-[5px] mt-1 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-white"
                  aria-hidden="true"
                />
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900 leading-snug">
                    {truncateMessage(commit.message)}
                  </p>
                  <span className="shrink-0 text-[11px] text-gray-400 mt-0.5">
                    {formatTime(commit.date)}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 mt-1">
                  {commit.hash && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 font-mono">
                      <GitCommit size={11} aria-hidden="true" />
                      {commit.hash.substring(0, 7)}
                    </span>
                  )}
                  {typeof commit.additions === "number" && (
                    <span className="text-[11px] text-emerald-600">+{commit.additions}</span>
                  )}
                  {typeof commit.deletions === "number" && (
                    <span className="text-[11px] text-red-500">-{commit.deletions}</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}

      {totalForContributor > MAX_COMMITS && (
        <p className="text-[11px] text-gray-400 text-center pt-1">
          Showing the {MAX_COMMITS} most recent commits
        </p>
      )}
    </div>
  );
}
