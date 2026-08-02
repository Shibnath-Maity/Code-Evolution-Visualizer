// CommitActivityGraph.jsx
import { useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { Activity } from "lucide-react";

const RANGE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "7", label: "7D" },
  { value: "30", label: "30D" },
  { value: "90", label: "90D" },
];

function toLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatAxisDate(value) {
  const date = new Date(value);
  return isNaN(date) ? value : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatFullDate(value) {
  const date = new Date(value);
  return isNaN(date)
    ? value
    : date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

// Fills every day between the first commit and today with 0 where there's
// no activity, so the line reflects real continuity instead of skipping
// silently between commit days.
function buildContinuousData(timeline) {
  const counts = {};
  let earliest = null;

  for (const [date, count] of Object.entries(timeline)) {
    counts[date] = count;
    const d = new Date(date);
    if (!earliest || d < earliest) earliest = d;
  }
  if (!earliest) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const data = [];

  for (let d = new Date(earliest); d <= today; d.setDate(d.getDate() + 1)) {
    const key = toLocalDateKey(d);
    data.push({ date: key, commits: counts[key] || 0 });
  }
  return data;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-white shadow-md border border-gray-100 px-3 py-2">
      <p className="text-[11px] text-gray-400 mb-0.5">{formatFullDate(label)}</p>
      <p className="text-[13px] font-semibold text-slate-900">
        {payload[0].value} {payload[0].value === 1 ? "commit" : "commits"}
      </p>
    </div>
  );
}

export default function CommitActivityGraph({ timeline = {} }) {
  const [range, setRange] = useState("all");

  const graphData = useMemo(() => buildContinuousData(timeline), [timeline]);

  const filteredData = useMemo(() => {
    if (range === "all") return graphData;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(range));
    return graphData.filter((item) => new Date(item.date) >= cutoff);
  }, [graphData, range]);

  const stats = useMemo(() => {
    if (!filteredData.length) return null;
    const total = filteredData.reduce((sum, d) => sum + d.commits, 0);
    const activeDays = filteredData.filter((d) => d.commits > 0).length;
    const peak = filteredData.reduce((max, d) => (d.commits > max.commits ? d : max), filteredData[0]);
    const average = activeDays === 0 ? 0 : total / activeDays;
    return { total, activeDays, peak, average };
  }, [filteredData]);

  if (!graphData.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center py-10">
        <Activity size={24} className="mx-auto mb-3 text-gray-300" />
        <h2 className="text-[15px] font-semibold text-slate-900">Commit Activity</h2>
        <p className="text-[13px] text-gray-500 mt-1">No commit activity available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h2 className="text-[15px] font-semibold text-slate-900">Commit Activity</h2>

        <div className="flex gap-1.5">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                range === opt.value
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-500"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {stats && (
        <p className="text-[13px] text-gray-500 mb-5 flex flex-wrap items-center gap-x-1.5">
          <span>{stats.total} commits</span>
          <Dot />
          <span>{stats.activeDays} active days</span>
          <Dot />
          <span>
            {stats.peak.commits} peak · {formatAxisDate(stats.peak.date)}
          </span>
          {stats.average > 0 && (
            <>
              <Dot />
              <span>{stats.average.toFixed(1)} avg/active day</span>
            </>
          )}
        </p>
      )}

      {!filteredData.length ? (
        <div className="h-[340px] flex flex-col items-center justify-center text-center">
          <Activity size={28} className="text-gray-300 mb-3" />
          <p className="text-[13px] text-gray-500">No commits in this range.</p>
        </div>
      ) : (
        <div className="w-full h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="commitActivityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tickFormatter={formatAxisDate}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                minTickGap={28}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              {stats && stats.average > 0 && (
                <ReferenceLine
                  y={stats.average}
                  stroke="#cbd5e1"
                  strokeDasharray="4 4"
                  ifOverflow="extendDomain"
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="commits"
                stroke="#6366f1"
                strokeWidth={1.75}
                fill="url(#commitActivityGradient)"
                dot={false}
                activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
                animationDuration={300}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function Dot() {
  return <span className="text-gray-300">·</span>;
}