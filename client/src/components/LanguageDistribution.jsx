import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#84cc16",
  "#3b82f6",
  "#e11d48",
  "#0ea5e9",
  "#a855f7",
  "#65a30d",
  "#fb7185",
  "#10b981",
  "#f43f5e",
  "#d97706",
  "#7c3aed",
];

const MIN_LABEL_PERCENT = 0.02;

function buildChartData(languages) {
  const totals = new Map();

  for (const item of languages) {
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

export default function LanguageDistribution({ languageAnalysis }) {
  const languages = languageAnalysis?.languages || [];

  const data = useMemo(() => buildChartData(languages), [languages]);

  const total = useMemo(
    () => data.reduce((sum, item) => sum + item.value, 0),
    [data]
  );

  // Stable color per language, keyed by name rather than array index, so a
  // language keeps its color even if the underlying data set is re-sorted
  // or filtered elsewhere.
  const colorByName = useMemo(() => {
    const map = new Map();
    data.forEach((item, index) => {
      map.set(item.name, COLORS[index % COLORS.length]);
    });
    return map;
  }, [data]);

  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-semibold text-slate-900">
          Language Distribution
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          No language data available.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">
          Language Distribution
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Distribution of programming languages used in this repository
        </p>
      </div>

      <div className="relative w-full h-[430px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              outerRadius={145}
              innerRadius={78}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              isAnimationActive={data.length <= 40}
              label={({ name, percent }) =>
                percent >= MIN_LABEL_PERCENT
                  ? `${name} ${(percent * 100).toFixed(1)}%`
                  : ""
              }
              labelLine={({ percent }) => percent >= MIN_LABEL_PERCENT}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={colorByName.get(entry.name)} />
              ))}
            </Pie>

            <Tooltip
              formatter={(value, name) => [
                `${value} files (${((value / total) * 100).toFixed(1)}%)`,
                name,
              ]}
            />

            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              formatter={(value) => {
                const entry = data.find((d) => d.name === value);
                const pct = entry ? ((entry.value / total) * 100).toFixed(1) : "0.0";
                return `${value} (${pct}%)`;
              }}
              wrapperStyle={{
                paddingTop: "15px",
                fontSize: "13px",
                lineHeight: "22px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label. pointer-events-none (fixed from the invalid
            "pointerEvents-none" class) so it never intercepts hover/tooltip
            events over the donut hole or legend. */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-slate-900">{total}</span>
          <span className="text-sm text-slate-500">Files</span>
        </div>
      </div>

      <p className="sr-only">
        Language distribution:{" "}
        {data
          .map(
            (item) =>
              `${item.name} ${((item.value / total) * 100).toFixed(1)}%`
          )
          .join(", ")}
      </p>
    </div>
  );
}