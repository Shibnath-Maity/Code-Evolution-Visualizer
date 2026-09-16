import { GitCommit, Users, Flame, Files, Activity } from "lucide-react";

// Fallback icons by metric type, used when no `icon` prop is passed.
const ICON_MAP = {
  commits: GitCommit,
  contributors: Users,
  hotspots: Flame,
  files: Files,
};

// Metric-specific accent: icon color + a restrained ambient glow.
const ACCENT_MAP = {
  commits: {
    icon: "text-indigo-400",
    glow: "bg-indigo-500/[0.10]",
  },
  contributors: {
    icon: "text-emerald-400",
    glow: "bg-emerald-500/[0.10]",
  },
  files: {
    icon: "text-violet-400",
    glow: "bg-violet-500/[0.10]",
  },
  hotspots: {
    icon: "text-amber-400",
    glow: "bg-amber-500/[0.10]",
  },
};

const DEFAULT_ACCENT = { icon: "text-slate-400", glow: "bg-slate-500/[0.10]" };

export default function StatCard({ title = "Statistic", value = 0, type = "commits", icon: CustomIcon }) {
  const IconComponent = CustomIcon || ICON_MAP[type] || Activity;
  const accent = ACCENT_MAP[type] || DEFAULT_ACCENT;

  const formattedValue = typeof value === "number" ? value.toLocaleString() : value;

  return (
    <div className="group relative min-w-0 overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 sm:p-5 transition-all duration-200 hover:border-slate-700 hover:-translate-y-0.5 hover:bg-slate-900/70">
      {/* Restrained ambient glow, tinted per metric type */}
      <div
        className={`pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full ${accent.glow} blur-2xl transition-opacity duration-300 opacity-70 group-hover:opacity-100`}
        aria-hidden="true"
      />

      <div className="relative min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <IconComponent size={14} className={`shrink-0 ${accent.icon}`} aria-hidden="true" />
          <p className="text-xs font-medium text-slate-400 truncate">{title}</p>
        </div>

        <p className="mt-2.5 text-2xl sm:text-3xl font-semibold text-white tracking-tight tabular-nums truncate">
          {formattedValue}
        </p>
      </div>
    </div>
  );
}