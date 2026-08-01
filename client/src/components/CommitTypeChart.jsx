import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

const TYPE_STYLE = {
  Feature: { color: "#6366f1" },
  Fix: { color: "#f97316" },
  Documentation: { color: "#06b6d4" },
  Refactor: { color: "#eab308" },
  Other: { color: "#94a3b8" },
};

const CATEGORY_ORDER = [
  "Feature",
  "Fix",
  "Documentation",
  "Refactor",
  "Other",
];

function getCommitType(message = "") {
  const msg = message.toLowerCase().trim();

  const conventional = msg.match(
    /^([a-z]+)(\([^)]*\))?[:\-\s]/
  );

  const token = conventional
    ? conventional[1]
    : msg.split(/\s+/)[0];

  if (/^feat/.test(token)) return "Feature";
  if (/^fix/.test(token)) return "Fix";
  if (/^docs?/.test(token)) return "Documentation";
  if (/^refactor/.test(token)) return "Refactor";

  return "Other";
}

function CustomTooltip({
  active,
  payload,
}) {
  if (!active || !payload?.length) return null;

  const { type, count, percent } =
    payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3">
      <p className="font-semibold text-slate-900">
        {type}
      </p>

      <p className="text-sm text-gray-500">
        {count} commits ({percent}%)
      </p>
    </div>
  );
}

export default function CommitTypeChart({
  commits = [],
}) {
  const data = useMemo(() => {
    const counts = {
      Feature: 0,
      Fix: 0,
      Documentation: 0,
      Refactor: 0,
      Other: 0,
    };

    commits.forEach((commit) => {
      counts[getCommitType(commit.message)]++;
    });

    const total = commits.length || 1;

    return CATEGORY_ORDER.map((type) => ({
      type,
      count: counts[type],
      percent: Math.round(
        (counts[type] / total) * 100
      ),
    })).filter((item) => item.count > 0);
  }, [commits]);

  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col justify-center items-center">
        <PieChartIcon
          size={40}
          className="text-gray-300 mb-3"
        />

        <h2 className="text-xl font-semibold">
          Commit Types
        </h2>

        <p className="text-gray-500 mt-2">
          No commit data available.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900">
          Commit Types
        </h2>

        <p className="text-sm text-gray-500">
          Distribution of commits by category
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8">

        {/* Donut */}
        <div className="relative w-full lg:w-[270px] h-[270px] shrink-0">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={105}
                paddingAngle={3}
                stroke="none"
              >
                {data.map((item) => (
                  <Cell
                    key={item.type}
                    fill={
                      TYPE_STYLE[item.type].color
                    }
                  />
                ))}
              </Pie>

              <Tooltip
                content={<CustomTooltip />}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold text-slate-900">
              {commits.length}
            </span>

            <span className="text-sm text-gray-500">
              Commits
            </span>
          </div>

        </div>

        {/* Legend */}
        <div className="w-full lg:flex-1 space-y-4">

          {data.map((item) => (
            <div
              key={item.type}
              className="flex items-center"
            >
              <span
                className="w-3 h-3 rounded-full mr-3"
                style={{
                  background:
                    TYPE_STYLE[item.type].color,
                }}
              />

              <span className="flex-1 text-gray-700">
                {item.type}
              </span>

              <span className="font-semibold text-slate-900">
                {item.count}
              </span>

              <span className="ml-4 text-gray-500 text-sm">
                {item.percent}%
              </span>
            </div>
          ))}

        </div>

      </div>
    </div>
  );
}