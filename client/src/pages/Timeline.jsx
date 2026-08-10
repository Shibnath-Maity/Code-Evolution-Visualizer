import { useMemo, useState, useEffect, memo } from "react";
import { GitCommit, GitPullRequest, Clock, Copy, Check, History, ChevronDown } from "lucide-react";
import CommitActivityGraph from "../components/CommitActivityGraph";
import CommitCalendar from "../components/CommitCalendar";
import PullRequestCard from "../components/PullRequestCard";
import { TYPE_DOT } from "../constants/commitTypes";
import { useAnalysis } from "../context/AnalysisContext";
import API from "../services/api";

const PAGE_SIZE = 10;

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
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function dayLabel(date) {
  if (!date) return "Unknown date";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
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

const CommitHash = memo(function CommitHash({ hash }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1200);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!hash) return null;

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
    } catch {
      // ignore copy failures
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs font-mono text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors mt-2"
      title="Copy full hash"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {hash.substring(0, 7)}
    </button>
  );
});

export default function Timeline() {
  const { analysis } = useAnalysis();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [pullRequests, setPullRequests] = useState([]);
  const [prLoading, setPrLoading] = useState(false);

  const rawCommits = useMemo(() => analysis?.timeline ?? [], [analysis]);

  // Extract owner and repository from analysis object
  const repoUrl =
    analysis?.repoUrl ||
    analysis?.repository?.htmlUrl ||
    analysis?.repository?.url ||
    "";

  const repoInfo = useMemo(() => {
    if (!repoUrl) return null;
    try {
      const cleanUrl = repoUrl.replace(/\.git$/, "").replace(/\/$/, "");
      const parts = new URL(cleanUrl).pathname.split("/").filter(Boolean);
      if (parts.length < 2) return null;
      return { owner: parts[0], repo: parts[1] };
    } catch {
      return null;
    }
  }, [repoUrl]);

  // Fetch pull requests when repository changes
  useEffect(() => {
    if (!repoInfo?.owner || !repoInfo?.repo) {
      setPullRequests([]);
      return;
    }

    const fetchPullRequests = async () => {
      try {
        setPrLoading(true);
        const response = await API.get("/repository/pull-requests", {
          params: {
            owner: repoInfo.owner,
            repo: repoInfo.repo,
          },
        });
        setPullRequests(response.data?.pullRequests || []);
      } catch (error) {
        console.error("Failed to fetch pull requests:", error);
        setPullRequests([]);
      } finally {
        setPrLoading(false);
      }
    };

    fetchPullRequests();
  }, [repoInfo?.owner, repoInfo?.repo]);

  // Reset pagination on repository change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [analysis?.repositoryId ?? analysis?.repoUrl]);

  // Activity Graph mapping (commits by date)
  const graphTimeline = useMemo(
    () =>
      rawCommits.reduce((acc, commit) => {
        const date = commit.date?.slice(0, 10);
        if (!date) return acc;
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {}),
    [rawCommits]
  );

  // Commit-only timeline formatted & sorted chronologically
  const commitTimeline = useMemo(() => {
    return rawCommits
      .map((commit) => ({
        ...commit,
        _date: commit.date ? new Date(commit.date) : null,
        initials: getInitials(commit.author),
      }))
      .sort((a, b) => {
        const dateA = a._date?.getTime() || 0;
        const dateB = b._date?.getTime() || 0;
        return dateB - dateA;
      });
  }, [rawCommits]);

  // Group commits by day
  const groupedCommits = useMemo(() => {
    const visible = commitTimeline.slice(0, visibleCount);
    const groups = [];
    let currentKey = null;

    for (const commit of visible) {
      const key = commit._date ? commit._date.toDateString() : "unknown";
      if (key !== currentKey) {
        groups.push({ key, label: dayLabel(commit._date), commits: [commit] });
        currentKey = key;
      } else {
        groups[groups.length - 1].commits.push(commit);
      }
    }
    return groups;
  }, [commitTimeline, visibleCount]);

  if (!rawCommits.length && !pullRequests.length && !prLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-md mx-auto my-12">
        <History size={32} className="mx-auto mb-3 text-gray-300" />
        <h2 className="text-lg font-semibold text-slate-800">No Activity Found</h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          This repository doesn't contain any activity yet, or the analysis hasn't finished.
        </p>
      </div>
    );
  }

  const hasMoreCommits = visibleCount < commitTimeline.length;

  return (
    <div className="space-y-6">
      {/* Activity Overview Header Visualizations */}
      <CommitCalendar timeline={rawCommits} />
      <CommitActivityGraph timeline={graphTimeline} />

      {/* SECTION 1: Commit Timeline */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Commit Timeline</h2>
          <span className="text-sm text-gray-400">
            {commitTimeline.length} commits
          </span>
        </div>

        <div>
          {groupedCommits.map((group) => (
            <div key={group.key} className="mb-8 last:mb-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">
                {group.label}
              </p>

              <div className="relative border-l-2 border-gray-100 ml-4">
                {group.commits.map((commit) => {
                  const dotColor = TYPE_DOT[commit.type] || "bg-indigo-500";

                  return (
                    <div
                      key={commit.hash}
                      className="mb-6 last:mb-0 ml-6 relative group"
                    >
                      <span
                        className={`absolute -left-[31px] top-1 w-3.5 h-3.5 ${dotColor} rounded-full border-4 border-white shadow`}
                      />

                      <div className="rounded-xl px-4 py-3 -mx-4 group-hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <p
                            className="text-xs text-gray-400"
                            title={commit._date ? commit._date.toLocaleString() : undefined}
                          >
                            <Clock size={11} className="inline mr-1 -mt-0.5" />
                            {relativeTime(commit._date)}
                          </p>

                          {commit.type && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              {commit.type}
                            </span>
                          )}
                        </div>

                        <h3 className="font-semibold text-slate-800 mt-1 flex items-center gap-2">
                          <GitCommit size={15} className="text-gray-300 shrink-0" />
                          {commit.message || "No commit message"}
                        </h3>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {commit.initials}
                          </span>

                          <p className="text-sm text-gray-600">
                            {commit.author || "Unknown author"}
                          </p>
                        </div>

                        <CommitHash hash={commit.hash} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {hasMoreCommits && (
          <button
            onClick={() =>
              setVisibleCount((v) => Math.min(v + PAGE_SIZE, commitTimeline.length))
            }
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors mt-4"
          >
            Show more <ChevronDown size={15} />
          </button>
        )}
      </div>

      {/* SECTION 2: Standalone Pull Requests */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <GitPullRequest className="text-purple-600" size={20} />
            <h2 className="text-xl font-semibold text-slate-900">Pull Requests</h2>
          </div>
          <span className="text-sm text-gray-400">
            {pullRequests.length} PRs
          </span>
        </div>

        {prLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-gray-400">
            <GitPullRequest size={16} className="mr-2 animate-pulse text-purple-500" />
            Loading pull requests...
          </div>
        ) : pullRequests.length === 0 ? (
          <div className="text-center py-10">
            <GitPullRequest size={28} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-600">No pull requests found</p>
            <p className="text-xs text-gray-400 mt-1">
              This repository doesn't have any pull requests available.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pullRequests.map((pr) => (
              <PullRequestCard key={pr.id || pr.number} pullRequest={pr} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}