import { GitCommit, Plus, Minus } from "lucide-react";

export default function HotspotStats({ totals }) {
  const stats = [
    {
      label: "Total changes",
      value: totals?.changes ?? 0,
      icon: GitCommit,
      textColor: "text-slate-100",
      iconColor: "text-slate-400",
      iconBg: "bg-slate-800/70 border-slate-700/60",
      span: true,
    },
    {
      label: "Additions",
      value: totals?.additions ?? 0,
      prefix: "+",
      icon: Plus,
      textColor: "text-emerald-400",
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Deletions",
      value: totals?.deletions ?? 0,
      prefix: "-",
      icon: Minus,
      textColor: "text-rose-400",
      iconColor: "text-rose-400",
      iconBg: "bg-rose-500/10 border-rose-500/20",
    },
  ];

  return (
    <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-3">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2.5 transition-colors hover:border-slate-700 hover:bg-slate-900 sm:px-4 ${
              stat.span ? "col-span-2 sm:col-span-1" : ""
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${stat.iconBg}`}
            >
              <Icon size={14} strokeWidth={2} className={stat.iconColor} />
            </div>
            <div className="min-w-0">
              <div
                className={`font-mono text-base font-semibold leading-none tabular-nums sm:text-lg ${stat.textColor}`}
              >
                {stat.prefix}
                {Number(stat.value).toLocaleString()}
              </div>
              <div className="mt-1 truncate text-[10.5px] font-medium uppercase tracking-wide text-slate-500">
                {stat.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}