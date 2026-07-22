import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function TimelineChart({ timeline }) {
  const data = Object.entries(timeline || {}).map(([date, commits]) => ({
    date,
    commits,
  }));

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-10">
      <h2 className="text-2xl font-bold mb-5">
        Commit Timeline
      </h2>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="date" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="commits"
            stroke="#2563eb"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TimelineChart;