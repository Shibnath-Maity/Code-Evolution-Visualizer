import React from "react";
import {
  GitCommit,
  Users,
  Flame,
  TrendingUp,
  Files,
  Activity,
} from "lucide-react";

// Mapping fallback icons by metric type
const ICON_MAP = {
  commits: GitCommit,
  contributors: Users,
  hotspots: Flame,
  files: Files,
};

// Subtle ambient backlight glows matching theme accent colors
const GLOW_MAP = {
  commits: "from-blue-500/20 to-indigo-500/0",
  contributors: "from-emerald-500/20 to-teal-500/0",
  files: "from-purple-500/20 to-fuchsia-500/0",
  hotspots: "from-amber-500/20 to-rose-500/0",
};

export default function StatCard({
  title = "Statistics",
  value = 0,
  type = "commits",
  icon: CustomIcon,
  trend = "",
}) {
  // Determine icon to display: passed prop > type map > fallback Activity icon
  const IconComponent = CustomIcon || ICON_MAP[type] || Activity;
  const ambientGlow = GLOW_MAP[type] || "from-indigo-500/20 to-slate-500/0";

  // Format numbers nicely (e.g., 1200 -> 1,200)
  const formattedValue =
    typeof value === "number" ? value.toLocaleString() : value;

  return (
    <div className="relative group overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800/80 p-5 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-slate-700/80 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between">
      
      {/* Background Ambient Glow */}
      <div
        className={`absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${ambientGlow} blur-2xl transition-all duration-500 group-hover:scale-125 group-hover:opacity-100 opacity-60 pointer-events-none`}
      />

      <div>
        {/* Top Header Row */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
            {title}
          </p>

          {/* Icon Badge */}
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-indigo-400 group-hover:text-indigo-300 group-hover:border-indigo-500/30 group-hover:bg-slate-950 transition-all shadow-inner shrink-0">
            <IconComponent size={18} aria-hidden="true" />
          </div>
        </div>

        {/* Value Display */}
        <h3 className="text-3xl font-black font-mono text-white tracking-tight group-hover:text-indigo-100 transition-colors">
          {formattedValue}
        </h3>
      </div>

      {/* Bottom Row: Trend & Decorative Sparkline */}
      <div className="mt-5 flex items-end justify-between gap-2 pt-2 border-t border-slate-800/40">
        {trend ? (
          <div className="inline-flex items-center gap-1.5 bg-slate-950/60 border border-slate-800/80 rounded-lg px-2.5 py-1 text-[11px] font-mono font-medium text-slate-300">
            <TrendingUp size={12} className="text-emerald-400 shrink-0" aria-hidden="true" />
            <span className="truncate">{trend}</span>
          </div>
        ) : (
          <div />
        )}

        {/* Minimalist SVG Sparkline */}
        <svg
          className="h-8 w-16 text-indigo-500/40 group-hover:text-indigo-400/80 transition-colors shrink-0"
          viewBox="0 0 100 50"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M0 38 C25 15 45 42 75 18 S100 8 100 8"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle
            cx="100"
            cy="8"
            r="4"
            fill="currentColor"
            className="animate-pulse"
          />
        </svg>
      </div>
    </div>
  );
}