import { GitCommit, Users, Flame, TrendingUp } from "lucide-react";

const icons = {
  commits: GitCommit,
  contributors: Users,
  hotspots: Flame,
};

function StatCard({ title, value, type, color, trend }) {
  const Icon = icons[type];

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-xl ${color} transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl`}
    >
      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-6">
        <Icon size={28} aria-hidden="true" />
      </div>

      <p className="text-sm font-medium text-white/80">{title}</p>
      <h3 className="text-4xl font-bold mt-1">{value}</h3>

      {trend && (
        <div className="mt-5 inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-medium">
          <TrendingUp size={14} aria-hidden="true" />
          {trend}
        </div>
      )}

      {/* Decorative line */}
      <svg
        className="absolute right-4 bottom-4 opacity-40"
        width="100"
        height="50"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M0 35 C25 8 45 45 75 18 S100 0 100 0"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="100" cy="0" r="4" fill="white" />
      </svg>
    </div>
  );
}

export default StatCard;