import React from "react";
import {
  Brain,
  Target,
  TrendingUp,
  ShieldAlert,
  Tag,
} from "lucide-react";

const LEVEL_STYLES = {
  high: "bg-red-500/20 text-red-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  low: "bg-green-500/20 text-green-400",
};
const UNKNOWN_STYLE = "bg-slate-500/20 text-slate-400";

// Previously this fell through to the "green/low" style for ANY unrecognized
// or missing value (e.g. risk === undefined rendered as a blank green
// badge, which reads as "low risk" even when the field is just missing).
// Now unrecognized/missing values get their own neutral style and label.
function badgeStyle(value) {
  const key = value?.toLowerCase();
  return LEVEL_STYLES[key] || UNKNOWN_STYLE;
}

function badgeLabel(value) {
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function LevelCard({ icon, label, value }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <span className={`px-3 py-1 rounded-full text-sm ${badgeStyle(value)}`}>
        {badgeLabel(value)}
      </span>
    </div>
  );
}

export default function AICommitSummary({ loading, summary }) {
  if (loading) {
    return (
      <div className="bg-[#0f172a] rounded-xl border border-slate-700 p-6 mt-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-slate-700 rounded w-40"></div>
          <div className="h-4 bg-slate-700 rounded"></div>
          <div className="h-4 bg-slate-700 rounded w-5/6"></div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="h-12 bg-slate-700 rounded"></div>
            <div className="h-12 bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const tags = Array.isArray(summary.tags) ? summary.tags : [];

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-700 p-6 mt-6">
      <div className="flex items-center gap-2 mb-5">
        <Brain className="text-violet-400" />
        <h2 className="text-xl font-semibold">AI Commit Summary</h2>
      </div>

      <p className="text-slate-300 leading-7">
        {summary.summary || "No summary available for this commit."}
      </p>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={18} />
            <span className="font-medium">Purpose</span>
          </div>
          <p className="text-slate-400">
            {summary.purpose || "Not specified"}
          </p>
        </div>

        <LevelCard
          icon={<TrendingUp size={18} />}
          label="Impact"
          value={summary.impact}
        />

        <LevelCard
          icon={<ShieldAlert size={18} />}
          label="Risk"
          value={summary.risk}
        />

        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={18} />
            <span className="font-medium">Tags</span>
          </div>
          {tags.length ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="bg-violet-600/20 text-violet-300 px-2 py-1 rounded-md text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No tags</p>
          )}
        </div>
      </div>
    </div>
  );
}