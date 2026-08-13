import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Calendar, GitCommit } from "lucide-react";

// Custom modern dark Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-4 py-3 rounded-xl shadow-2xl text-xs font-mono">
        <p className="text-slate-400 font-sans mb-1 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-indigo-400" />
          {label}
        </p>
        <p className="text-sm font-bold text-white flex items-center gap-1.5">
          <GitCommit className="h-4 w-4 text-indigo-400" />
          <span className="text-indigo-300">{payload[0].value}</span> commits
        </p>
      </div>
    );
  }
  return null;
};

function TimelineChart({ timeline }) {
  // Format & memoize data to prevent re-computation on renders
  const { data, totalCommits } = useMemo(() => {
    const entries = Object.entries(timeline || {});
    const chartData = entries.map(([date, commits]) => ({
      date,
      commits,
    }));
    const sum = chartData.reduce((acc, curr) => acc + (curr.commits || 0), 0);
    return { data: chartData, totalCommits: sum };
  }, [timeline]);

  // Empty state handling
  if (!data.length) {
    return (
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 text-center text-slate-500 backdrop-blur-xl">
        <p className="text-sm font-mono">No timeline commit data available.</p>
      </div>
    );
  }

  return (
    <div className="relative group bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Commit Activity Timeline
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Historical distribution of repository commits over time.
          </p>
        </div>

        {/* Quick summary metric */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs font-mono self-start sm:self-auto">
          <span className="text-slate-400">Total Recorded:</span>
          <span className="font-bold text-indigo-300">{totalCommits.toLocaleString()} commits</span>
        </div>
      </div>

      {/* Recharts Area Container */}
      <div className="w-full h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              {/* Gradient for smooth graph glow */}
              <linearGradient id="commitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              opacity={0.4}
              vertical={false}
            />

            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={10}
            />

            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="commits"
              stroke="#818cf8"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#commitGradient)"
              activeDot={{
                r: 6,
                fill: "#6366f1",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default TimelineChart;