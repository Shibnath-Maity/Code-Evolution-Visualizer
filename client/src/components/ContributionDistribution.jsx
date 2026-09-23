import React, { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from "recharts";
import { PieChart as PieIcon, BarChart3, Users } from "lucide-react";

// Restrained, high-contrast palette — used only for chart slices, bars, and dots
const COLORS = [
  "#38bdf8", // Sky
  "#6366f1", // Indigo
  "#0891b2", // Cyan
  "#059669", // Emerald
  "#d97706", // Amber
  "#db2777", // Pink
  "#7c3aed", // Violet
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
    <div className="min-w-[150px] rounded-[8px] border border-white/[0.08] bg-[#151B24] px-3 py-2 text-xs shadow-lg shadow-black/40">
      <div className="mb-1 flex items-center gap-2">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: item.color }}
        />
        <span className="truncate font-medium text-[#E7EAEF]">
          {item.name}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-3 font-mono tabular-nums text-[#7C8698]">
        <span>{item.value} commits</span>
        <span className="font-semibold text-[#E7EAEF]">
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
    <div className="bg-[#10151C] p-4 sm:p-5">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <PieIcon size={17} strokeWidth={1.75} className="shrink-0 text-[#7C8698]" />
          <div className="min-w-0">
            <h2 className="truncate text-[13.5px] font-semibold text-white">
              Contribution breakdown
            </h2>
            <p className="flex items-center gap-1 text-[12px] text-[#7C8698] tabular-nums">
              <Users size={11} className="shrink-0" />
              {contributors.length} {contributors.length === 1 ? "contributor" : "contributors"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <div
            role="group"
            aria-label="View mode"
            className="flex items-center rounded-[8px] border border-white/[0.08] p-0.5"
          >
            <button
              type="button"
              aria-pressed={viewMode === "chart"}
              onClick={() => setViewMode("chart")}
              className={`flex items-center gap-1.5 rounded-[6px] px-2.5 py-2 sm:py-1.5 text-xs font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                viewMode === "chart"
                  ? "bg-white/[0.08] text-white"
                  : "text-[#7C8698] hover:text-[#C7CCD6]"
              }`}
            >
              <PieIcon size={13} />
              Donut
            </button>
            <button
              type="button"
              aria-pressed={viewMode === "bars"}
              onClick={() => setViewMode("bars")}
              className={`flex items-center gap-1.5 rounded-[6px] px-2.5 py-2 sm:py-1.5 text-xs font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                viewMode === "bars"
                  ? "bg-white/[0.08] text-white"
                  : "text-[#7C8698] hover:text-[#C7CCD6]"
              }`}
            >
              <BarChart3 size={13} />
              List
            </button>
          </div>

          {totalCommits > 0 && (
            <div className="whitespace-nowrap rounded-[8px] bg-white/[0.05] border border-white/[0.08] px-2.5 py-1.5 font-mono text-xs font-medium text-[#C7CCD6] tabular-nums">
              {totalCommits} commits
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[10px] border border-dashed border-white/[0.08] py-10 text-center">
          <p className="text-sm font-medium text-[#C7CCD6]">
            No contributions tracked yet
          </p>
          <p className="mt-0.5 text-xs text-[#7C8698]">
            Commit history will show up here once it's logged.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {viewMode === "chart" && (
            <div className="relative mx-auto h-44 w-44 sm:h-56 sm:w-56">
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
                <span className="font-mono text-2xl font-bold tabular-nums text-white sm:text-3xl">
                  {activeItem ? activeItem.value : totalCommits}
                </span>
                <span className="max-w-[80%] truncate text-[11px] font-medium text-[#7C8698]">
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
                  className={`flex flex-col gap-1.5 rounded-[8px] border px-3 py-2.5 text-left transition-colors duration-150 min-h-[40px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                    isActive
                      ? "border-white/[0.14] bg-white/[0.05]"
                      : "border-transparent hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate font-medium text-[#C7CCD6]">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 font-mono tabular-nums text-[#7C8698]">
                      <span>{item.value}</span>
                      <span className="font-semibold text-[#C7CCD6]">
                        {item.percent}%
                      </span>
                    </div>
                  </div>

                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
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