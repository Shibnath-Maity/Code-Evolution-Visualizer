import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Activity, GitCommit, CalendarDays, TrendingUp } from "lucide-react";

const RANGE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "7", label: "7 Days" },
  { value: "30", label: "30 Days" },
  { value: "90", label: "90 Days" },
];

// Helper to parse "YYYY-MM-DD" reliably as local midnight
function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatAxisDate(value) {
  const date = parseLocalDate(value);
  return isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatFullDate(value) {
  const date = parseLocalDate(value);
  return isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
}

function buildContinuousData(timeline) {
  const counts = {};
  let earliest = null;

  for (const [date, count] of Object.entries(timeline)) {
    counts[date] = count;
    const d = parseLocalDate(date);
    if (!earliest || d < earliest) earliest = d;
  }
  if (!earliest) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const data = [];

  const current = new Date(earliest);
  while (current <= today) {
    const key = toLocalDateKey(current);
    data.push({ date: key, commits: counts[key] || 0 });
    current.setDate(current.getDate() + 1);
  }
  return data;
}

// Glassmorphism Tooltip
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg border border-slate-200/50 dark:border-slate-700/50 p-3">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
        {formatFullDate(label)}
      </p>
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
        <p className="text-sm font-bold text-slate-900 dark:text-white">
          {payload[0].value} {payload[0].value === 1 ? "commit" : "commits"}
        </p>
      </div>
    </div>
  );
}

// Reusable Stat Block Component
function StatBlock({ icon: Icon, label, value, subtext }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">
          {label}
        </p>
        <div className="flex items-baseline gap-1.5">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white leading-none">
            {value}
          </h4>
          {subtext && (
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {subtext}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommitActivityGraph({ timeline = {} }) {
  const [range, setRange] = useState("all");

  const graphData = useMemo(() => buildContinuousData(timeline), [timeline]);

  const filteredData = useMemo(() => {
    if (range === "all") return graphData;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - Number(range));
    return graphData.filter((item) => parseLocalDate(item.date) >= cutoff);
  }, [graphData, range]);

  const stats = useMemo(() => {
    if (!filteredData.length) return null;
    const total = filteredData.reduce((sum, d) => sum + d.commits, 0);
    const activeDays = filteredData.filter((d) => d.commits > 0).length;
    const peak = filteredData.reduce(
      (max, d) => (d.commits > max.commits ? d : max),
      filteredData[0]
    );
    const average = activeDays === 0 ? 0 : total / activeDays;
    return { total, activeDays, peak, average };
  }, [filteredData]);

  if (!graphData.length) {
    return (
      <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <Activity size={24} className="text-slate-400 dark:text-slate-500" />
        </div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          No Activity Yet
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Commit activity will populate here once you start pushing code.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-7">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/20">
            <Activity size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
            Commit Activity
          </h2>
        </div>

        {/* Segmented Control */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl overflow-x-auto hide-scrollbar">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`relative px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${
                range === opt.value
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <StatBlock
            icon={GitCommit}
            label="Total Commits"
            value={stats.total}
          />
          <StatBlock
            icon={CalendarDays}
            label="Active Days"
            value={stats.activeDays}
            subtext={`/ ${filteredData.length} days`}
          />
          <StatBlock
            icon={TrendingUp}
            label="Peak Day"
            value={stats.peak.commits}
            subtext={formatAxisDate(stats.peak.date)}
          />
        </div>
      )}

      {/* Chart */}
      {!filteredData.length ? (
        <div className="h-[300px] flex flex-col items-center justify-center text-center rounded-2xl bg-slate-50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800">
          <Activity size={28} className="text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No commits found in this date range.
          </p>
        </div>
      ) : (
        <div className="w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filteredData}
              margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="commitActivityGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatAxisDate}
                tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                minTickGap={30}
                dy={10}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              {stats && stats.average > 0 && (
                <ReferenceLine
                  y={stats.average}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                  ifOverflow="extendDomain"
                />
              )}
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "#6366f1",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                  opacity: 0.4,
                }}
              />
              <Area
                type="monotone"
                dataKey="commits"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#commitActivityGradient)"
                dot={false}
                activeDot={{
                  r: 6,
                  fill: "#6366f1",
                  stroke: "#ffffff",
                  strokeWidth: 3,
                  className: "drop-shadow-md",
                }}
                animationDuration={500}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}