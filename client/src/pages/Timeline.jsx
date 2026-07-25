import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { GitCommit, GitBranch, GitMerge, Tag, ChevronDown } from "lucide-react";

const ACTIVITY_DATA = [
  { date: "May 18", commits: 5 },
  { date: "May 22", commits: 9 },
  { date: "May 26", commits: 16 },
  { date: "May 30", commits: 7 },
  { date: "Jun 03", commits: 4 },
  { date: "Jun 07", commits: 12 },
  { date: "Jun 11", commits: 6 },
  { date: "Jun 15", commits: 9 },
];

const EVENTS = [
  {
    type: "commit",
    title: "Updated dashboard UI and stats cards",
    meta: "a1b2c3d • Shibnath Maity",
    date: "2 hours ago",
  },
  {
    type: "merge",
    title: "Merged branch 'feature/timeline-chart' into main",
    meta: "Shibnath Maity",
    date: "Yesterday",
  },
  {
    type: "tag",
    title: "Tagged release v1.2.0",
    meta: "Shibnath Maity",
    date: "2 days ago",
  },
  {
    type: "branch",
    title: "Created branch 'feature/timeline-chart'",
    meta: "Shibnath Maity",
    date: "3 days ago",
  },
  {
    type: "commit",
    title: "Initial commit",
    meta: "e4f5g6h • Shibnath Maity",
    date: "May 18, 2024",
  },
];

const EVENT_ICONS = {
  commit: { icon: GitCommit, accent: "bg-blue-500" },
  merge: { icon: GitMerge, accent: "bg-purple-500" },
  branch: { icon: GitBranch, accent: "bg-emerald-500" },
  tag: { icon: Tag, accent: "bg-orange-500" },
};

function TimelineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="commitGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="commits"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#commitGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function TimelineEvent({ event, isLast }) {
  const { icon: Icon, accent } = EVENT_ICONS[event.type];

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${accent}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        {!isLast && <div className="w-px flex-1 bg-slate-200 my-1" />}
      </div>

      <div className={`min-w-0 ${isLast ? "" : "pb-6"}`}>
        <p className="text-sm font-medium text-slate-900">{event.title}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
          <span>{event.meta}</span>
          <span>•</span>
          <span>{event.date}</span>
        </div>
      </div>
    </div>
  );
}

function Timeline() {
  const [range, setRange] = useState("Last 30 Days");

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900">Repository Timeline</h1>
      <p className="text-slate-500 mt-2 mb-8">
        See how your project evolved over time.
      </p>

      {/* Timeline Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-900">Commit Activity</h2>
            <p className="text-xs text-slate-400">Repository commit activity over time</p>
          </div>
          <button
            onClick={() =>
              setRange((r) => (r === "Last 30 Days" ? "Last 90 Days" : "Last 30 Days"))
            }
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {range}
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        <TimelineChart data={ACTIVITY_DATA} />
      </div>

      {/* Timeline Events */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="font-semibold text-slate-900 mb-6">Recent Activity</h2>
        {EVENTS.map((event, i) => (
          <TimelineEvent key={i} event={event} isLast={i === EVENTS.length - 1} />
        ))}
      </div>
    </div>
  );
}

export default Timeline;