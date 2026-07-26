import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

// Fixed color per category (not per array index) so "Fix" is always
// the same color whether or not other categories are present in the
// data — previously colors were assigned by index into the filtered
// array, so the same type could render a different color depending on
// which other types happened to have zero commits.
const TYPE_STYLE = {
  Feature: { color: "#6366f1" },
  Fix: { color: "#f97316" },
  Documentation: { color: "#06b6d4" },
  Refactor: { color: "#eab308" },
  Other: { color: "#94a3b8" },
};

const CATEGORY_ORDER = ["Feature", "Fix", "Documentation", "Refactor", "Other"];

// Matches conventional-commit-style prefixes ("feat:", "fix(scope):",
// "docs -", etc.) as well as plain English openers ("Fixed a bug",
// "Refactored the parser"), rather than only exact startsWith matches.
function getCommitType(message = "") {
  const msg = message.toLowerCase().trim();
  const conventional = msg.match(/^([a-z]+)(\([^)]*\))?[:\-\s]/);
  const token = conventional ? conventional[1] : msg.split(/\s+/)[0];

  if (/^feat/.test(token)) return "Feature";
  if (/^fix/.test(token)) return "Fix";
  if (/^docs?/.test(token)) return "Documentation";
  if (/^refactor/.test(token)) return "Refactor";
  return "Other";
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { type, count, percent } = payload[0].payload;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3">
      <p className="text-sm font-semibold text-slate-900">{type}</p>
      <p className="text-xs text-gray-400 mt-0.5">
        {count} commits · {percent}%
      </p>
    </div>
  );
}

export default function CommitTypeChart({ commits = [] }) {
  const data = useMemo(() => {
    const counts = { Feature: 0, Fix: 0, Documentation: 0, Refactor: 0, Other: 0 };

    commits.forEach((commit) => {
      counts[getCommitType(commit.message)]++;
    });

    const total = commits.length || 1;

    return CATEGORY_ORDER.map((type) => ({
      type,
      count: counts[type],
      percent: Math.round((counts[type] / total) * 100),
    })).filter((entry) => entry.count > 0);
  }, [commits]);

  const total = commits.length;

  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center py-10">
        <PieChartIcon size={28} className="mx-auto mb-3 text-gray-300" />
        <h2 className="text-xl font-semibold text-slate-900">Commit Types</h2>
        <p className="text-sm text-gray-500 mt-2">No commit data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Commit Types</h2>
        <p className="text-sm text-gray-500 mt-1">Distribution of commits by type</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Donut with centered total */}
        <div className="relative w-full sm:w-1/2 h-[240px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={65}
                paddingAngle={3}
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell key={entry.type} fill={TYPE_STYLE[entry.type].color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-2xl font-bold text-slate-900">{total}</p>
            <p className="text-xs text-gray-400">commits</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 w-full sm:w-1/2">
          {data.map((entry) => (
            <div key={entry.type} className="flex items-center gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: TYPE_STYLE[entry.type].color }}
              />
              <span className="text-sm text-slate-700 flex-1">{entry.type}</span>
              <span className="text-sm font-semibold text-slate-900">{entry.count}</span>
              <span className="text-xs text-gray-400 w-10 text-right">
                {entry.percent}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}