import { GitCommit, Plus, Minus } from "lucide-react";

export default function HotspotStats({ totals }) {
  const stats = [
    {
      label: "Total changes",
      value: totals?.changes ?? 0,
      icon: GitCommit,
      textColor: "text-white",
      iconColor: "text-slate-400",
      iconBg: "bg-slate-800/80 border-slate-700/50",
    },
    {
      label: "Total additions",
      value: totals?.additions ?? 0,
      prefix: "+",
      icon: Plus,
      textColor: "text-emerald-400",
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Total deletions",
      value: totals?.deletions ?? 0,
      prefix: "-",
      icon: Minus,
      textColor: "text-rose-400",
      iconColor: "text-rose-400",
      iconBg: "bg-rose-500/10 border-rose-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 shrink-0">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="group relative overflow-hidden bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-4 transition-all duration-200 hover:border-slate-700/80 hover:bg-slate-900/80 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-400 tracking-wide">
                {stat.label}
              </span>
              <div
                className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${stat.iconBg}`}
              >
                <Icon size={14} className={stat.iconColor} />
              </div>
            </div>

            <div className="mt-2 flex items-baseline gap-1">
              <span className={`text-xl font-extrabold tracking-tight ${stat.textColor}`}>
                {stat.prefix}
                {Number(stat.value).toLocaleString()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}