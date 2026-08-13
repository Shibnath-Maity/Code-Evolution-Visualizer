import React, { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from "recharts";
import { PieChart as PieIcon, Flame, BarChart3, Users, Sparkles } from "lucide-react";

// Modern, accessible high-contrast palette
const MODERN_COLORS = [
  "#6366f1", // Indigo
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Violet
  "#3b82f6", // Blue
  "#f43f5e", // Rose
];

// Active segment glow ring when hovering donut slices
const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="transition-all duration-300 ease-out"
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 9}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.35}
        cornerRadius={4}
      />
    </g>
  );
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;

  return (
    <div className="z-50 min-w-[160px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-xl shadow-slate-900/10 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90 dark:shadow-black/40">
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 shrink-0"
          style={{ backgroundColor: item.color }}
        />
        <span className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
          {item.name}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-3 text-xs font-mono">
        <span className="text-slate-500 dark:text-slate-400">Commits</span>
        <div className="flex items-baseline gap-1">
          <span className="font-bold text-slate-900 dark:text-white tabular-nums">
            {item.value}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            ({item.percent}%)
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ContributionDistribution({ contributors = [] }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [viewMode, setViewMode] = useState("chart"); // 'chart' | 'bars'

  const { data, totalCommits } = useMemo(() => {
    const validContributors = contributors.filter((c) => (c.commits || 0) > 0);
    const total = validContributors.reduce((sum, c) => sum + (c.commits || 0), 0);

    const formattedData = validContributors.map((c, index) => {
      const commits = c.commits || 0;
      const percentNum = total > 0 ? (commits / total) * 100 : 0;
      return {
        name: c.name || "Unknown",
        value: commits,
        percent: percentNum.toFixed(1),
        rawPercent: percentNum,
        color: MODERN_COLORS[index % MODERN_COLORS.length],
      };
    });

    return { data: formattedData, totalCommits: total };
  }, [contributors]);

  const activeItem = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-2xl transition-all dark:border-slate-800/80 dark:bg-slate-900/60 dark:shadow-none">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl" />

      {/* Header */}
      <div className="relative mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/20 dark:bg-indigo-400/10 dark:text-indigo-400 dark:ring-indigo-400/20">
            <PieIcon size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Contribution Breakdown
            </h2>
            <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Users size={12} className="shrink-0" />
              <span>
                {contributors.length} {contributors.length === 1 ? "contributor" : "contributors"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center rounded-xl bg-slate-100/80 p-1 dark:bg-slate-800/80">
            <button
              onClick={() => setViewMode("chart")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                viewMode === "chart"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <PieIcon size={13} />
              <span>Donut</span>
            </button>
            <button
              onClick={() => setViewMode("bars")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                viewMode === "bars"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <BarChart3 size={13} />
              <span>List</span>
            </button>
          </div>

          {/* Total Badge */}
          {totalCommits > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              <Flame size={14} className="fill-amber-500 text-amber-500" />
              <span className="font-mono tabular-nums">{totalCommits}</span>
              <span className="hidden sm:inline">commits</span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800/60 dark:text-slate-500">
            <Sparkles size={20} />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No contributions tracked yet
          </p>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            Commit history will render automatically when logged.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Visual Section */}
          {viewMode === "chart" ? (
            <div className="relative h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="68%"
                    outerRadius="88%"
                    paddingAngle={3}
                    cornerRadius={8}
                    stroke="none"
                    activeIndex={activeIndex ?? -1}
                    activeShape={renderActiveShape}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        style={{
                          transition: "opacity 300ms ease, transform 300ms ease",
                          opacity:
                            activeIndex === null || activeIndex === index ? 1 : 0.35,
                          cursor: "pointer",
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Stat Hub */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center justify-center rounded-full bg-white/50 dark:bg-slate-900/50 p-4 backdrop-blur-xs">
                  <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono tabular-nums">
                    {activeItem ? activeItem.value : totalCommits}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {activeItem ? activeItem.name : "Total Commits"}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Interactive Legend List */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {data.map((item, index) => {
              const isHovered = activeIndex === index;
              return (
                <div
                  key={item.name}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`group relative flex flex-col justify-between rounded-2xl p-3 transition-all duration-200 cursor-pointer border ${
                    isHovered
                      ? "border-slate-300/80 bg-slate-100/80 shadow-md shadow-slate-200/50 dark:border-slate-700/80 dark:bg-slate-800/80 dark:shadow-none scale-[1.01]"
                      : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0 transition-transform group-hover:scale-125"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                      <span className="text-slate-400 dark:text-slate-500 tabular-nums">
                        {item.value}
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                        {item.percent}%
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Progress Bar */}
                  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${item.rawPercent}%`,
                        backgroundColor: item.color,
                        opacity: activeIndex === null || isHovered ? 1 : 0.4,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}