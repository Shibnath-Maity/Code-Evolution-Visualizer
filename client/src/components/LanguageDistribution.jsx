import React, { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Code2, PieChart as PieIcon, Layers, ChevronRight } from "lucide-react";

/* ==========================================================
   THEME & COLOR MAPPINGS
========================================================== */

const LANGUAGE_COLORS = {
  JavaScript: "#f7df1e",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  HTML: "#e34c26",
  CSS: "#563d7c",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#dea584",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Shell: "#89e051",
  Vue: "#41b883",
  React: "#61dafb",
  SCSS: "#c6538c",
};

const PALETTE = [
  "#6366f1",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#f43f5e",
  "#3b82f6",
  "#a855f7",
];

function getLanguageColor(name, index) {
  return LANGUAGE_COLORS[name] || PALETTE[index % PALETTE.length];
}

/* ==========================================================
   DATA PARSING
========================================================== */

function buildChartData(languages) {
  const totals = new Map();

  for (const item of languages || []) {
    const rawName = item.language || item.name;
    const name = typeof rawName === "string" ? rawName.trim() : rawName;
    const value = Number(item.files || item.count || item.value || 0);

    if (!name || !Number.isFinite(value) || value <= 0) continue;

    totals.set(name, (totals.get(name) || 0) + value);
  }

  return [...totals.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/* ==========================================================
   CUSTOM TOOLTIP
========================================================== */

function CustomTooltip({ active, payload, total }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0];
  const name = data.name;
  const value = data.value;
  const color = data.payload.fill;
  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";

  return (
    <div className="bg-slate-900/95 border border-slate-800 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-2xl space-y-1">
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-semibold text-slate-200">{name}</span>
      </div>
      <div className="text-xs font-mono text-slate-400 pl-4">
        {value.toLocaleString()} files{" "}
        <span className="text-slate-500">({percentage}%)</span>
      </div>
    </div>
  );
}

/* ==========================================================
   MAIN COMPONENT
========================================================== */

export default function LanguageDistribution({ languageAnalysis }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const languages = languageAnalysis?.languages || [];

  const data = useMemo(() => buildChartData(languages), [languages]);

  const total = useMemo(
    () => data.reduce((sum, item) => sum + item.value, 0),
    [data]
  );

  const colorByName = useMemo(() => {
    const map = new Map();
    data.forEach((item, index) => {
      map.set(item.name, getLanguageColor(item.name, index));
    });
    return map;
  }, [data]);

  if (!data.length) {
    return (
      <div className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-6 flex flex-col items-center justify-center text-center h-[380px] gap-2">
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mb-1">
          <Code2 size={24} />
        </div>
        <h3 className="text-sm font-semibold text-slate-300">
          No language data available
        </h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Execute repository breakdown analysis to render programming language distribution metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <PieIcon size={18} className="text-indigo-400" />
            Language Distribution
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Breakdown across {data.length} language{data.length > 1 ? "s" : ""} detected in codebase
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
          <Layers size={14} className="text-indigo-400" />
          <span>{total.toLocaleString()} Files Total</span>
        </div>
      </div>

      {/* Main Grid: Chart + Custom Scrollable Legend */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Donut Chart Canvas */}
        <div className="md:col-span-6 relative w-full h-[280px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={105}
                innerRadius={68}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                isAnimationActive={data.length <= 40}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={colorByName.get(entry.name)}
                    stroke="#020617"
                    strokeWidth={2}
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      opacity:
                        activeIndex === null || activeIndex === index ? 1 : 0.4,
                      filter:
                        activeIndex === index
                          ? `drop-shadow(0 0 8px ${colorByName.get(entry.name)}80)`
                          : "none",
                      transform:
                        activeIndex === index ? "scale(1.03)" : "scale(1)",
                      transformOrigin: "center center",
                    }}
                  />
                ))}
              </Pie>

              <Tooltip content={<CustomTooltip total={total} />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Donut Hole Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
              {activeIndex !== null
                ? data[activeIndex]?.value.toLocaleString()
                : total.toLocaleString()}
            </span>
            <span className="text-[11px] font-medium text-slate-400 mt-0.5 max-w-[100px] truncate text-center">
              {activeIndex !== null ? data[activeIndex]?.name : "Total Files"}
            </span>
          </div>
        </div>

        {/* Custom Legend with Progress Bars */}
        <div className="md:col-span-6 space-y-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
          {data.map((item, index) => {
            const color = colorByName.get(item.name);
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            const isHovered = activeIndex === index;

            return (
              <div
                key={item.name}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                  isHovered
                    ? "bg-slate-900 border-slate-700 shadow-lg"
                    : "bg-slate-900/40 border-slate-800/60 hover:border-slate-700/80 hover:bg-slate-900/70"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform"
                      style={{
                        backgroundColor: color,
                        transform: isHovered ? "scale(1.2)" : "scale(1)",
                      }}
                    />
                    <span className="font-semibold text-slate-200 truncate">
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 font-mono text-slate-400">
                    <span>{item.value.toLocaleString()}</span>
                    <span className="text-[11px] font-semibold text-slate-300">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                {/* Progress track */}
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Screen Reader Accessibility */}
      <p className="sr-only">
        Language distribution breakdown:{" "}
        {data
          .map(
            (item) =>
              `${item.name}: ${item.value} files (${((item.value / total) * 100).toFixed(1)}%)`
          )
          .join(", ")}
      </p>
    </div>
  );
}