import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PieChart as PieChartIcon, GitCommit, Tag } from "lucide-react";

// Modern dark-theme color palette
const TYPE_STYLE = {
  Feature: { color: "#818cf8", bg: "rgba(129, 140, 248, 0.15)", label: "Feature" },
  Fix: { color: "#fb923c", bg: "rgba(251, 146, 60, 0.15)", label: "Fix" },
  Documentation: { color: "#22d3ee", bg: "rgba(34, 211, 238, 0.15)", label: "Documentation" },
  Refactor: { color: "#facc15", bg: "rgba(250, 204, 21, 0.15)", label: "Refactor" },
  Other: { color: "#94a3b8", bg: "rgba(148, 163, 184, 0.15)", label: "Other" },
};

const CATEGORY_ORDER = [
  "Feature",
  "Fix",
  "Documentation",
  "Refactor",
  "Other",
];

function getCommitType(message = "") {
  const msg = message.toLowerCase().trim();

  const conventional = msg.match(
    /^([a-z]+)(\([^)]*\))?[:\-\s]/
  );

  const token = conventional
    ? conventional[1]
    : msg.split(/\s+/)[0];

  if (/^feat/.test(token)) return "Feature";
  if (/^fix/.test(token)) return "Fix";
  if (/^docs?/.test(token)) return "Documentation";
  if (/^refactor/.test(token)) return "Refactor";

  return "Other";
}

// Glassmorphic Dark Tooltip
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const { type, count, percent } = payload[0].payload;
  const style = TYPE_STYLE[type] || TYPE_STYLE.Other;

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-4 py-3 rounded-xl shadow-2xl text-xs font-mono">
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: style.color }}
        />
        <p className="font-sans font-bold text-white text-sm">
          {type}
        </p>
      </div>

      <p className="text-slate-300 flex items-center justify-between gap-4">
        <span className="text-slate-400">Commits:</span>
        <span className="font-bold text-white">{count}</span>
      </p>
      <p className="text-slate-300 flex items-center justify-between gap-4 mt-0.5">
        <span className="text-slate-400">Share:</span>
        <span className="font-bold" style={{ color: style.color }}>
          {percent}%
        </span>
      </p>
    </div>
  );
}

export default function CommitTypeChart({ commits = [] }) {
  const data = useMemo(() => {
    const counts = {
      Feature: 0,
      Fix: 0,
      Documentation: 0,
      Refactor: 0,
      Other: 0,
    };

    commits.forEach((commit) => {
      counts[getCommitType(commit.message)]++;
    });

    const total = commits.length || 1;

    return CATEGORY_ORDER.map((type) => ({
      type,
      count: counts[type],
      percent: Math.round((counts[type] / total) * 100),
    })).filter((item) => item.count > 0);
  }, [commits]);

  if (!data.length) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 h-full flex flex-col justify-center items-center backdrop-blur-xl text-center">
        <div className="p-4 bg-slate-800/50 rounded-2xl text-slate-500 mb-3 border border-slate-700/50">
          <PieChartIcon size={32} />
        </div>
        <h2 className="text-base font-bold text-white">Commit Category Breakdown</h2>
        <p className="text-xs text-slate-500 mt-1">No commit type data available to render.</p>
      </div>
    );
  }

  return (
    <div className="relative group bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 h-full flex flex-col shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Subtle background ambient light */}
      <div className="absolute -top-20 -left-20 w-52 h-52 bg-indigo-500/10 blur-[70px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Commit Types
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Distribution of commits by conventional categories
          </p>
        </div>

        <div className="px-2.5 py-1 bg-slate-800/60 border border-slate-700/60 rounded-xl text-[11px] font-mono text-slate-300">
          {data.length} Categories
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-6 relative z-10">
        
        {/* Donut Chart with Centered Metric */}
        <div className="relative w-full lg:w-[240px] h-[240px] shrink-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={98}
                paddingAngle={4}
                stroke="none"
              >
                {data.map((item) => (
                  <Cell
                    key={item.type}
                    fill={TYPE_STYLE[item.type]?.color || TYPE_STYLE.Other.color}
                    className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Stat Counter */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <GitCommit className="h-5 w-5 text-indigo-400 mb-0.5 animate-pulse" />
            <span className="text-2xl font-bold text-white tracking-tight">
              {commits.length}
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Total Commits
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="w-full lg:flex-1 space-y-2.5">
          {data.map((item) => {
            const style = TYPE_STYLE[item.type] || TYPE_STYLE.Other;
            return (
              <div
                key={item.type}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 transition-all group/item"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: style.color }}
                  />
                  <span className="text-xs font-medium text-slate-300 truncate group-hover/item:text-white transition-colors">
                    {item.type}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Subtle Mini Progress Bar */}
                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percent}%`,
                        backgroundColor: style.color,
                      }}
                    />
                  </div>

                  <span className="text-xs font-bold font-mono text-white min-w-[28px] text-right">
                    {item.count}
                  </span>
                  <span
                    className="text-[11px] font-mono min-w-[36px] text-right px-1.5 py-0.5 rounded-md"
                    style={{
                      color: style.color,
                      backgroundColor: style.bg,
                    }}
                  >
                    {item.percent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}