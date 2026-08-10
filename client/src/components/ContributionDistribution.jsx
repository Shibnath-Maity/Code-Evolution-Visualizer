import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieIcon, Flame } from "lucide-react";

const MODERN_COLORS = [
  "#6366f1", // Indigo
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Violet
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  
  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 text-white rounded-xl px-3.5 py-2.5 shadow-xl text-xs space-y-1">
      <div className="flex items-center gap-2 font-medium text-slate-200">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: item.payload.color }}
        />
        {item.name}
      </div>
      <div className="text-slate-400 font-mono">
        <span className="text-slate-100 font-semibold">{item.value}</span> commits ({item.payload.percent}%)
      </div>
    </div>
  );
}

export default function ContributionDistribution({ contributors = [] }) {
  const [activeIndex, setActiveIndex] = useState(null);

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

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <PieIcon size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Contribution Distribution
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {contributors.length} {contributors.length === 1 ? "contributor" : "contributors"} total
            </p>
          </div>
        </div>
        
        {totalCommits > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <Flame size={14} className="text-amber-500" />
            <span>{totalCommits} commits</span>
          </div>
        )}
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <PieIcon size={20} />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No contribution data yet</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Commits will appear here once tracked</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Donut Chart */}
          <div className="relative h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="68%"
                  outerRadius="90%"
                  paddingAngle={4}
                  cornerRadius={6}
                  stroke="none"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className="transition-all duration-300 cursor-pointer"
                      style={{
                        filter: activeIndex === index ? "brightness(1.1) drop-shadow(0px 4px 10px rgba(0,0,0,0.15))" : "none",
                        opacity: activeIndex === null || activeIndex === index ? 1 : 0.4,
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {activeIndex !== null ? data[activeIndex].value : totalCommits}
              </span>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                {activeIndex !== null ? "Commits" : "Total Commits"}
              </span>
            </div>
          </div>

          {/* Interactive Legend with Visual Bars */}
          <div className="space-y-2">
            {data.map((item, index) => {
              const isHovered = activeIndex === index;
              return (
                <div
                  key={item.name}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                    isHovered
                      ? "bg-slate-100/80 dark:bg-slate-800/80"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono">
                      <span className="text-slate-400 dark:text-slate-500">{item.value} commits</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{item.percent}%</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
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