import React, { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from "recharts";
import { PieChart as PieIcon, BarChart3, Users } from "lucide-react";

// Restrained, high-contrast palette — used only for chart slices, bars, and dots
const COLORS = [
  "#6366f1", // Indigo
  "#0891b2", // Cyan
  "#059669", // Emerald
  "#d97706", // Amber
  "#db2777", // Pink
  "#7c3aed", // Violet
  "#2563eb", // Blue
  "#e11d48", // Rose
];

function renderActiveShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 4}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;

  return (
    <div className="min-w-[150px] rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-md dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-1 flex items-center gap-2">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: item.color }}
        />
        <span className="truncate font-medium text-slate-700 dark:text-slate-200">
          {item.name}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-3 font-mono text-slate-500 dark:text-slate-400">
        <span>{item.value} commits</span>
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {item.percent}%
        </span>
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
        color: COLORS[index % COLORS.length],
      };
    });

    return { data: formattedData, totalCommits: total };
  }, [contributors]);

  const activeItem = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <PieIcon size={18} className="shrink-0 text-slate-400 dark:text-slate-500" />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              Contribution breakdown
            </h2>
            <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Users size={12} className="shrink-0" />
              {contributors.length} {contributors.length === 1 ? "contributor" : "contributors"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <div
            role="group"
            aria-label="View mode"
            className="flex items-center rounded-md border border-slate-200 p-0.5 dark:border-slate-700"
          >
            <button
              type="button"
              aria-pressed={viewMode === "chart"}
              onClick={() => setViewMode("chart")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                viewMode === "chart"
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <PieIcon size={13} />
              Donut
            </button>
            <button
              type="button"
              aria-pressed={viewMode === "bars"}
              onClick={() => setViewMode("bars")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                viewMode === "bars"
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <BarChart3 size={13} />
              List
            </button>
          </div>

          {totalCommits > 0 && (
            <div className="whitespace-nowrap rounded-md bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {totalCommits} commits
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-slate-200 py-10 text-center dark:border-slate-800">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            No contributions tracked yet
          </p>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            Commit history will show up here once it's logged.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {viewMode === "chart" && (
            <div className="relative mx-auto h-48 w-48 sm:h-56 sm:w-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="70%"
                    outerRadius="90%"
                    paddingAngle={2}
                    cornerRadius={3}
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
                          transition: "opacity 150ms ease",
                          opacity: activeIndex === null || activeIndex === index ? 1 : 0.4,
                          cursor: "pointer",
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white sm:text-3xl">
                  {activeItem ? activeItem.value : totalCommits}
                </span>
                <span className="max-w-[80%] truncate text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  {activeItem ? activeItem.name : "Total commits"}
                </span>
              </div>
            </div>
          )}

          {/* Contributor list */}
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2">
            {data.map((item, index) => {
              const isActive = activeIndex === index;
              return (
                <button
                  key={item.name}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onFocus={() => setActiveIndex(index)}
                  onBlur={() => setActiveIndex(null)}
                  aria-label={`${item.name}: ${item.value} commits, ${item.percent}%`}
                  className={`flex flex-col gap-1.5 rounded-md border px-3 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                    isActive
                      ? "border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/60"
                      : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 font-mono text-slate-500 dark:text-slate-400">
                      <span>{item.value}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {item.percent}%
                      </span>
                    </div>
                  </div>

                  <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full transition-opacity"
                      style={{
                        width: `${item.rawPercent}%`,
                        backgroundColor: item.color,
                        opacity: activeIndex === null || isActive ? 1 : 0.5,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}