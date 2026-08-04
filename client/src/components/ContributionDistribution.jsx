import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";

const COLORS = [
  "#4f46e5", // indigo-600
  "#a5b4fc", // indigo-300
  "#818cf8", // indigo-400
  "#c7d2fe", // indigo-200
  "#6366f1", // indigo-500
  "#e0e7ff", // indigo-100
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-lg px-3 py-2 text-sm">
      <p className="font-semibold text-slate-900">{item.name}</p>
      <p className="text-gray-500">
        {item.value} commits · {item.payload.percent}%
      </p>
    </div>
  );
}

export default function ContributionDistribution({ contributors = [] }) {
  const data = useMemo(() => {
    const total = contributors.reduce((sum, c) => sum + (c.commits || 0), 0);
    return contributors
      .filter((c) => (c.commits || 0) > 0)
      .map((c) => ({
        name: c.name || "Unknown",
        value: c.commits || 0,
        percent: total > 0 ? ((c.commits / total) * 100).toFixed(1) : "0.0",
      }));
  }, [contributors]);

  const total = contributors.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-1">
        <PieIcon size={18} className="text-indigo-600" />
        <h2 className="text-lg font-bold text-slate-900">Contribution Distribution</h2>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-gray-400 py-10 text-center">No contribution data yet.</p>
      ) : (
        <div className="mt-2">
          <div className="relative h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="88%"
                  paddingAngle={data.length > 1 ? 2 : 0}
                  stroke="none"
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-slate-900">{total}</span>
              <span className="text-xs text-gray-400">Contributors</span>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {data.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-slate-700 truncate">{item.name}</span>
                </div>
                <span className="text-gray-400 shrink-0">{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
