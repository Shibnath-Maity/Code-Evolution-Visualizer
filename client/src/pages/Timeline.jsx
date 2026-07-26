import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { GitCommit, Clock, Copy, Check, History, ChevronDown } from "lucide-react";
import CommitActivityGraph from "../components/CommitActivityGraph";
const PAGE_SIZE = 10;

const TYPE_DOT = {
  feat: "bg-emerald-500",
  fix: "bg-orange-500",
  docs: "bg-blue-500",
  refactor: "bg-amber-500",
  other: "bg-slate-400",
};

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

function initials(name) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function CommitHash({ hash }) {
  const [copied, setCopied] = useState(false);

  if (!hash) return null;

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore copy failures — button just won't flip to "copied"
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
}
export default function Timeline() {
  const [timeline, setTimeline] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
    useEffect(() => {
    const repoUrl = localStorage.getItem("repoUrl");

    if (!repoUrl) {
      setError("No repository selected.");
      setLoading(false);
      return;
    }

    const fetchTimeline = async () => {
      try {
        const response = await axios.post(
          "http://localhost:5000/repository/analytics",
          {
            url: repoUrl,
          }
        );

        console.log("Timeline data:", response.data.timeline);

        setTimeline(response.data.timeline || []);
      } catch (err) {
        console.error("Timeline fetch error:", err);
        setError("Failed to load timeline.");
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, []);

const graphTimeline = useMemo(() => {
  const result = {};

  timeline.forEach((commit) => {
    const date = commit.date?.substring(0, 10);

    if (!date) return;

    result[date] = (result[date] || 0) + 1;
  });

  return result;
}, [timeline]);

  const parsed = useMemo(
    () =>
      timeline.map((commit) => ({
        ...commit,
        _date: commit.date ? new Date(commit.date) : null,
      })),
    [timeline]
  );

  const grouped = useMemo(() => {
    const visible = parsed.slice(0, visibleCount);
    const groups = [];
    let currentKey = null;

    for (const commit of visible) {
      const key = commit._date
        ? commit._date.toDateString()
        : "unknown";
      if (key !== currentKey) {
        groups.push({ key, label: dayLabel(commit._date), commits: [commit] });
        currentKey = key;
      } else {
        groups[groups.length - 1].commits.push(commit);
      }
    }
    return groups;
  }, [parsed, visibleCount]);

  if (!timeline.length) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <History size={28} className="mx-auto mb-3 text-gray-300" />
        <h2 className="text-xl font-semibold text-slate-900 mb-1">Commit Timeline</h2>
        <p className="text-gray-500 text-sm">No timeline data available.</p>
      </div>
    );
  }

  const hasMore = visibleCount < parsed.length;

return (
  <div className="space-y-6">

    {/* Commit Activity Graph */}
  
<CommitActivityGraph timeline={graphTimeline} />
    {/* Existing Commit Timeline */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">
          Commit Timeline
        </h2>

        <span className="text-sm text-gray-400">
          {parsed.length} commits
        </span>
      </div>

      <div>
        {grouped.map((group) => (
          <div key={group.key} className="mb-8 last:mb-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">
              {group.label}
            </p>

            <div className="relative border-l-2 border-gray-100 ml-4">
              {group.commits.map((commit, index) => {
                const dotColor =
                  TYPE_DOT[commit.type] || "bg-indigo-500";

                return (
                  <div
                    key={commit.hash || index}
                    className="mb-6 last:mb-0 ml-6 relative group"
                  >
                    {/* Timeline Dot */}
                    <span
                      className={`absolute -left-[31px] top-1 w-3.5 h-3.5 ${dotColor} rounded-full border-4 border-white shadow`}
                    />

                    <div className="rounded-xl px-4 py-3 -mx-4 group-hover:bg-gray-50 transition-colors">
                      
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <p
                          className="text-xs text-gray-400"
                          title={
                            commit._date
                              ? commit._date.toLocaleString()
                              : undefined
                          }
                        >
                          <Clock
                            size={11}
                            className="inline mr-1 -mt-0.5"
                          />
                          {relativeTime(commit._date)}
                        </p>

                        {commit.type && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {commit.type}
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-slate-800 mt-1 flex items-center gap-2">
                        <GitCommit
                          size={15}
                          className="text-gray-300 shrink-0"
                        />
                        {commit.message || "No commit message"}
                      </h3>

                      <div className="flex items-center gap-2 mt-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {initials(commit.author)}
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

      {hasMore && (
        <button
          onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Show more <ChevronDown size={15} />
        </button>
      )}
    </div>

  </div>
);
}