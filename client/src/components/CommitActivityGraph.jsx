import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity, TrendingUp, Flame } from "lucide-react";

const RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 3 months" },
];

function formatAxisDate(value) {
  const date = new Date(value);
  if (isNaN(date)) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatFullDate(value) {
  const date = new Date(value);
  if (isNaN(date)) return value;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3">
      <p className="text-xs text-gray-400 mb-1">{formatFullDate(label)}</p>
      <p className="text-sm font-semibold text-slate-900">
        {payload[0].value} {payload[0].value === 1 ? "commit" : "commits"}
      </p>
    </div>
  );
}

export default function CommitActivityGraph({ timeline = {} }) {
  const [range, setRange] = useState("all");

  const graphData = useMemo(
    () =>
      Object.entries(timeline)
        .map(([date, count]) => ({ date, commits: count }))
        .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [timeline]
  );

  const filteredData = useMemo(() => {
    if (range === "all") return graphData;

    const days = Number(range);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return graphData.filter((item) => new Date(item.date) >= cutoff);
  }, [graphData, range]);

  // Stats now derive from filteredData so they always match what's
  // actually plotted on the chart for the selected range — previously
  // these were computed from graphData (all-time) regardless of range,
  // which meant the numbers above the chart didn't match what the
  // chart itself was showing whenever a narrower range was selected.
  const stats = useMemo(() => {
    if (!filteredData.length) return null;
    const total = filteredData.reduce((sum, item) => sum + item.commits, 0);
    const peak = filteredData.reduce(
      (max, item) => (item.commits > max.commits ? item : max),
      filteredData[0]
    );
    const average = total / filteredData.length;
    return { total, peak, average };
  }, [filteredData]);

  if (!graphData.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center py-10">
        <Activity size={28} className="mx-auto mb-3 text-gray-300" />
        <h2 className="text-xl font-semibold text-slate-900">Commit Activity</h2>
        <p className="text-sm text-gray-500 mt-2">No commit activity available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Commit Activity</h2>
          <p className="text-sm text-gray-500 mt-1">Repository commits over time</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 bg-white outline-none focus:ring-2 focus:ring-indigo-200"
          >
            {RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <span className="text-sm text-gray-400">{stats?.total || 0} commits</span>
        </div>
      </div>

      {/* Quick stats — reflect the selected range, not all-time */}
      {stats && (
        <div className="flex items-center gap-5 mb-6 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <TrendingUp size={13} className="text-indigo-500" />
            Avg {stats.average.toFixed(1)}/active day
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <Flame size={13} className="text-orange-500" />
            Peak {stats.peak.commits} on {formatAxisDate(stats.peak.date)}
          </span>
        </div>
      )}

      {/* No data in the selected range */}
      {!filteredData.length ? (
        <div className="h-[320px] flex flex-col items-center justify-center text-center">
          <Activity size={32} className="text-gray-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-800">No commit activity</h3>
          <p className="text-sm text-gray-500 mt-1">
            No commits found for this time period.
          </p>
        </div>
      ) : (
        <div className="w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filteredData}
              margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
            >
              <defs>
                <linearGradient id="commitActivityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

              <XAxis
                dataKey="date"
                tickFormatter={formatAxisDate}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                minTickGap={24}
              />

              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                width={32}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="commits"
                stroke="#6366f1"
                strokeWidth={3}
                fill="url(#commitActivityGradient)"
                dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}