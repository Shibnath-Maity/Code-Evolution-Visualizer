import { memo, useCallback, useMemo } from "react";
import { GitPullRequest, ExternalLink, GitBranch } from "lucide-react";

function relativeTime(date) {
  if (!date) return "Unknown date";

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function getStatus(pullRequest) {
  if (pullRequest.merged) {
    return { label: "Merged", className: "bg-purple-50 text-purple-700" };
  }
  if (pullRequest.state === "open") {
    return { label: "Open", className: "bg-green-50 text-green-700" };
  }
  return { label: "Closed", className: "bg-gray-100 text-gray-600" };
}

function PullRequestCard({ pullRequest }) {
  // Derive everything from pullRequest in one pass so a re-render caused by
  // unrelated parent state doesn't redo date parsing / string formatting.
  const derived = useMemo(() => {
    if (!pullRequest) return null;

    const updatedDate = pullRequest.updatedAt
      ? new Date(pullRequest.updatedAt)
      : null;

    return {
      timeLabel: relativeTime(updatedDate),
      status: getStatus(pullRequest),
      initials: getInitials(pullRequest.author),
    };
  }, [pullRequest]);

  // Stable handler reference; avoids creating a new closure every render.
  const stopPropagation = useCallback((e) => e.stopPropagation(), []);

  if (!pullRequest || !derived) return null;

  const { timeLabel, status, initials } = derived;

  return (
    <div className="rounded-xl px-4 py-3 -mx-4 hover:bg-gray-50 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-gray-400">
          <GitPullRequest
            size={12}
            className="inline mr-1 -mt-0.5 text-purple-500"
          />
          {timeLabel}
        </p>

        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-slate-800 mt-1 flex items-start gap-2">
        <GitPullRequest
          size={16}
          className="text-purple-500 shrink-0 mt-0.5"
        />

        <span>
          <span className="text-gray-400 font-medium">
            #{pullRequest.number}
          </span>{" "}
          {pullRequest.title || "Untitled pull request"}
        </span>
      </h3>

      {/* Author */}
      <div className="flex items-center gap-2 mt-2">
        {pullRequest.authorAvatar ? (
          <img
            src={pullRequest.authorAvatar}
            alt={pullRequest.author || "Author"}
            className="w-5 h-5 rounded-full"
            loading="lazy"
          />
        ) : (
          <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center shrink-0">
            {initials}
          </span>
        )}

        <p className="text-sm text-gray-600">
          {pullRequest.author || "Unknown author"}
        </p>
      </div>

      {/* Branches */}
      {(pullRequest.sourceBranch || pullRequest.targetBranch) && (
        <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500">
          <GitBranch size={13} className="text-gray-400" />

          <span className="px-2 py-1 bg-gray-100 rounded-md">
            {pullRequest.sourceBranch || "unknown"}
          </span>

          <span>→</span>

          <span className="px-2 py-1 bg-gray-100 rounded-md">
            {pullRequest.targetBranch || "unknown"}
          </span>
        </div>
      )}

      {/* Statistics */}
      <div className="flex items-center gap-3 mt-3 text-xs">
        <span className="text-green-600">+{pullRequest.additions || 0}</span>
        <span className="text-red-500">-{pullRequest.deletions || 0}</span>
        <span className="text-gray-400">
          {pullRequest.changedFiles || 0} files
        </span>
      </div>

      {/* GitHub link */}
      {pullRequest.url && (
        <a
          href={pullRequest.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={stopPropagation}
          className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-purple-600 hover:text-purple-700"
        >
          View on GitHub
          <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
}

// Shallow-compares props; skips re-rendering when this card is used in a
// list and sibling cards re-render for unrelated reasons.
export default memo(PullRequestCard);