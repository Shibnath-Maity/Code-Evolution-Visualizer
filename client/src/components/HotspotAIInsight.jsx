import React from "react";
import { useAnalysis } from "../context/AnalysisContext";
import {
  Brain,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Lightbulb,
  TriangleAlert,
  CircleCheck,
} from "lucide-react";

/* ==========================================================
   CONFIG & HELPERS
========================================================== */

const RISK_CONFIG = {
  High: {
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    accent: "border-l-rose-500",
    icon: ShieldAlert,
    iconColor: "text-rose-400",
  },
  Medium: {
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    accent: "border-l-amber-500",
    icon: ShieldQuestion,
    iconColor: "text-amber-400",
  },
  Low: {
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    accent: "border-l-emerald-500",
    icon: ShieldCheck,
    iconColor: "text-emerald-400",
  },
};

const FALLBACK_RISK = {
  badge: "bg-slate-500/10 text-slate-400 border-slate-600/30",
  accent: "border-l-slate-700",
  icon: ShieldQuestion,
  iconColor: "text-slate-500",
};

function SectionHeading({ icon: Icon, iconColor, children }) {
  return (
    <div className="mb-2 flex items-center gap-1.5">
      <Icon size={12} strokeWidth={2} className={iconColor} aria-hidden="true" />
      <h3 className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">
        {children}
      </h3>
    </div>
  );
}

function LoadingState() {
  return (
    <div
      className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5"
      role="status"
      aria-live="polite"
      aria-label="Loading AI hotspot analysis"
    >
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-sky-500/20 bg-sky-500/10 text-sky-400">
          <Brain size={14} strokeWidth={2} aria-hidden="true" />
        </div>
        <h2 className="text-[13px] font-semibold tracking-tight text-slate-100">
          AI Hotspot Analysis
        </h2>
      </div>
      <div className="animate-pulse space-y-3.5 motion-reduce:animate-none">
        <div className="h-5 w-20 rounded-full bg-slate-800/70" />
        <div className="space-y-2">
          <div className="h-3.5 w-full rounded bg-slate-800/70" />
          <div className="h-3.5 w-5/6 rounded bg-slate-800/70" />
          <div className="h-3.5 w-4/6 rounded bg-slate-800/70" />
        </div>
        <div className="h-20 rounded-lg bg-slate-800/70" />
      </div>
      <span className="sr-only">Loading analysis…</span>
    </div>
  );
}

/* ==========================================================
   MAIN COMPONENT
========================================================== */

export default function HotspotAIInsight({ insight: propInsight }) {
  const { analysis, loading } = useAnalysis();

  // Safely extract insight without treating arrays as valid insights
  const activeInsight =
    propInsight ||
    analysis?.hotspotsInsight ||
    (analysis?.hotspots && !Array.isArray(analysis.hotspots)
      ? analysis.hotspots
      : null);

  if (loading) {
    return <LoadingState />;
  }

  if (!activeInsight) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-slate-500">
          <Brain size={15} strokeWidth={2} className="text-sky-400/80" />
          <p className="text-[13px] font-medium">No AI insight available for this selection.</p>
        </div>
      </div>
    );
  }

  // Normalize risk key string (e.g., "high" -> "High")
  const rawRisk = activeInsight.riskLevel || activeInsight.risk_level || "";
  const normalizedRiskKey = rawRisk
    ? rawRisk.charAt(0).toUpperCase() + rawRisk.slice(1).toLowerCase()
    : "Unknown";

  const risk = RISK_CONFIG[normalizedRiskKey] || FALLBACK_RISK;
  const RiskIcon = risk.icon;
  const recommendations = activeInsight.recommendations ?? [];

  return (
    <div
      className={`rounded-xl border border-slate-800 border-l-2 ${risk.accent} bg-slate-900/40 p-4 transition-colors sm:p-5`}
    >
      {/* Header */}
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-sky-500/20 bg-sky-500/10 text-sky-400">
          <Brain size={14} strokeWidth={2} aria-hidden="true" />
        </div>
        <h2 className="text-[13px] font-semibold tracking-tight text-slate-100">
          AI Hotspot Analysis
        </h2>
      </div>

      {/* Risk Level */}
      <div className="mb-5">
        <SectionHeading icon={RiskIcon} iconColor={risk.iconColor}>
          Risk level
        </SectionHeading>
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide border ${risk.badge}`}
        >
          {rawRisk || "Unknown"}
        </span>
      </div>

      {/* Summary */}
      {activeInsight.summary && (
        <div className="mb-5">
          <h3 className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">
            Summary
          </h3>
          <p className="rounded-lg border border-slate-800 bg-slate-950/40 p-3.5 text-[13px] leading-relaxed text-slate-300">
            {activeInsight.summary}
          </p>
        </div>
      )}

      {/* Recommendations */}
      <div className="mb-5">
        <SectionHeading icon={Lightbulb} iconColor="text-emerald-400">
          Recommendations
        </SectionHeading>
        {recommendations.length > 0 ? (
          <ul className="space-y-1.5">
            {recommendations.map((item, index) => (
              <li
                key={item.id ?? index}
                className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-[13px] leading-relaxed text-slate-300"
              >
                <CircleCheck
                  size={15}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0 text-emerald-400/80"
                  aria-hidden="true"
                />
                <span>
                  {typeof item === "string" ? item : item.text || item.description}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-slate-800 bg-slate-950/40 p-3.5 text-center text-[13px] italic text-slate-500">
            No specific recommendations available.
          </p>
        )}
      </div>

      {/* Potential Impact */}
      {activeInsight.impact && (
        <div>
          <SectionHeading icon={TriangleAlert} iconColor="text-amber-400">
            Potential impact
          </SectionHeading>
          <p className="rounded-lg border border-slate-800 bg-slate-950/40 p-3.5 text-[13px] leading-relaxed text-slate-300">
            {activeInsight.impact}
          </p>
        </div>
      )}
    </div>
  );
}