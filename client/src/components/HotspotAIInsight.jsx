import React from "react";
import {
  Brain,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Lightbulb,
  TriangleAlert,
  CircleCheck,
} from "lucide-react";

const RISK_CONFIG = {
  High: {
    badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
    accent: "border-l-red-400 dark:border-l-red-700",
    icon: ShieldAlert,
    iconColor: "text-red-500",
  },
  Medium: {
    badge: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-900",
    accent: "border-l-yellow-400 dark:border-l-yellow-700",
    icon: ShieldQuestion,
    iconColor: "text-yellow-500",
  },
  Low: {
    badge: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900",
    accent: "border-l-green-400 dark:border-l-green-700",
    icon: ShieldCheck,
    iconColor: "text-green-500",
  },
};

const FALLBACK_RISK = {
  badge: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  accent: "border-l-slate-300 dark:border-l-slate-600",
  icon: ShieldQuestion,
  iconColor: "text-slate-400",
};

function SectionHeading({ icon: Icon, iconColor, children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`w-5 h-5 ${iconColor}`} aria-hidden="true" />
      <h3 className="font-semibold text-slate-700 dark:text-slate-200">
        {children}
      </h3>
    </div>
  );
}

function LoadingState() {
  return (
    <div
      className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm"
      role="status"
      aria-live="polite"
      aria-label="Loading AI hotspot analysis"
    >
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-6 h-6 text-violet-500" aria-hidden="true" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          AI Hotspot Analysis
        </h2>
      </div>
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-4/6 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-24 rounded-lg bg-slate-200 dark:bg-slate-700" />
      </div>
      <span className="sr-only">Loading analysis…</span>
    </div>
  );
}

export default function HotspotAIInsight({ insight }) {
  if (!insight) {
    return <LoadingState />;
  }

  const risk = RISK_CONFIG[insight.riskLevel] || FALLBACK_RISK;
  const RiskIcon = risk.icon;
  const recommendations = insight.recommendations ?? [];

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-700 border-l-4 ${risk.accent} bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-6 h-6 text-violet-500" aria-hidden="true" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          AI Hotspot Analysis
        </h2>
      </div>

      {/* Risk */}
      <div className="mb-6">
        <SectionHeading icon={RiskIcon} iconColor={risk.iconColor}>
          Risk Level
        </SectionHeading>
        <span
          className={`inline-block px-4 py-1 rounded-full text-sm font-semibold border ${risk.badge}`}
        >
          {insight.riskLevel ?? "Unknown"}
        </span>
      </div>

      {/* Summary */}
      {insight.summary && (
        <div className="mb-6">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Summary
          </h3>
          <p className="leading-7 text-slate-600 dark:text-slate-300">
            {insight.summary}
          </p>
        </div>
      )}

      {/* Recommendations */}
      <div className="mb-6">
        <SectionHeading icon={Lightbulb} iconColor="text-yellow-500">
          Recommendations
        </SectionHeading>
        {recommendations.length > 0 ? (
          <ul className="space-y-3">
            {recommendations.map((item, index) => (
              <li
                key={item.id ?? index}
                className="flex items-start gap-2 rounded-lg bg-slate-50 dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700"
              >
                <CircleCheck
                  className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500"
                  aria-hidden="true"
                />
                <span className="text-slate-700 dark:text-slate-200">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500 italic">
            No specific recommendations available.
          </p>
        )}
      </div>

      {/* Impact */}
      {insight.impact && (
        <div>
          <SectionHeading icon={TriangleAlert} iconColor="text-orange-500">
            Potential Impact
          </SectionHeading>
          <p className="leading-7 text-slate-600 dark:text-slate-300">
            {insight.impact}
          </p>
        </div>
      )}
    </div>
  );
}