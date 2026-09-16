import React, { useMemo } from "react";
import {
  ShieldCheck,
  Wrench,
  GitBranch,
  TestTube2,
  BookOpen,
  Boxes,
  Activity,
  Info,
} from "lucide-react";

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

// Single source of truth for score -> tier mapping
const TIERS = [
  { min: 90, label: "Excellent", text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500", ring: "text-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  { min: 80, label: "Healthy", text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500", ring: "text-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  { min: 70, label: "Good", text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500", ring: "text-amber-500", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  { min: 60, label: "Needs Attention", text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500", ring: "text-amber-500", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  { min: 40, label: "At Risk", text: "text-orange-600 dark:text-orange-400", bar: "bg-orange-500", ring: "text-orange-500", badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" },
  { min: 0, label: "Critical", text: "text-rose-600 dark:text-rose-400", bar: "bg-rose-500", ring: "text-rose-500", badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
];

function getTier(score) {
  return TIERS.find((tier) => score >= tier.min) || TIERS[TIERS.length - 1];
}

function ScoreBar({ score, trackClassName = "" }) {
  const tier = getTier(score);
  return (
    <div
      className={`w-full h-1.5 min-w-0 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ${trackClassName}`}
      role="progressbar"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${tier.bar}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

function ScoreItem({ icon: Icon, title, score, description, notAnalyzed = false }) {
  const tier = notAnalyzed ? null : getTier(score);

  return (
    <div
      className="min-w-0 border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-150"
    >
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex items-start gap-2.5 min-w-0">
          <Icon size={16} className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
              {description}
            </p>
          </div>
        </div>

        {notAnalyzed ? (
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded shrink-0">
            Pending
          </span>
        ) : (
          <span className={`text-sm font-semibold font-mono tabular-nums shrink-0 ${tier.text}`}>
            {score}
          </span>
        )}
      </div>

      <div className="mt-3">
        {notAnalyzed ? (
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full w-full bg-slate-200 dark:bg-slate-700/50 [background-image:repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(148,163,184,0.3)_4px,rgba(148,163,184,0.3)_8px)]" />
          </div>
        ) : (
          <ScoreBar score={score} />
        )}
      </div>
    </div>
  );
}

const WEIGHTS = {
  maintainability: 0.25,
  complexity: 0.1875,
  testing: 0.1875,
  documentation: 0.1875,
  architecture: 0.1875,
};

export default function ProjectHealthScore({
  fileAnalysis,
  codeEvolution,
  architecture,
}) {
  const scores = useMemo(() => {
    /* MAINTAINABILITY */
    const totalFiles = fileAnalysis?.totalFiles || 0;
    const mostChangedFiles = fileAnalysis?.mostChangedFiles || [];

    let maintainability = 75;
    if (totalFiles > 0) {
      if (mostChangedFiles.length < totalFiles * 0.2) {
        maintainability += 10;
      }
      if (mostChangedFiles.length > totalFiles * 0.5) {
        maintainability -= 15;
      }
    }
    maintainability = clamp(maintainability);

    /* COMPLEXITY */
    const churnCount = Array.isArray(codeEvolution) ? codeEvolution.length : 0;
    let complexity = 80;
    if (churnCount > 100) {
      complexity -= 15;
    } else if (churnCount > 50) {
      complexity -= 8;
    }
    complexity = clamp(complexity);

    /* SECURITY */
    const security = null;
    const securityAnalyzed = false;

    /* TESTING */
    const allFiles = fileAnalysis?.allFiles || [];
    const testFiles = allFiles.filter((file) => {
      const name = typeof file === "string" ? file : file?.name || file?.path || "";
      return /test/i.test(name) || /spec/i.test(name);
    });

    let testing = 35;
    if (totalFiles > 0) {
      const testRatio = testFiles.length / totalFiles;
      if (testRatio >= 0.2) {
        testing = 90;
      } else if (testRatio >= 0.1) {
        testing = 75;
      } else if (testRatio >= 0.05) {
        testing = 60;
      } else if (testFiles.length > 0) {
        testing = 50;
      }
    }
    testing = clamp(testing);

    /* DOCUMENTATION */
    const documentationFiles = allFiles.filter((file) => {
      const name = typeof file === "string" ? file : file?.name || file?.path || "";
      return /\.(md|mdx|txt)$/i.test(name);
    });

    let documentation = 40;
    if (documentationFiles.length > 0) {
      documentation = 70;
    }
    if (documentationFiles.length >= 3) {
      documentation = 85;
    }
    documentation = clamp(documentation);

    /* ARCHITECTURE */
    let architectureScore = 65;
    if (architecture) {
      const folders = architecture.folders || [];
      const files = architecture.files || [];

      if (folders.length >= 3) {
        architectureScore += 10;
      }
      if (files.length > 0) {
        architectureScore += 5;
      }
    }
    architectureScore = clamp(architectureScore);

    /* OVERALL SCORE */
    const overall = clamp(
      maintainability * WEIGHTS.maintainability +
        complexity * WEIGHTS.complexity +
        testing * WEIGHTS.testing +
        documentation * WEIGHTS.documentation +
        architectureScore * WEIGHTS.architecture
    );

    return {
      overall,
      maintainability,
      complexity,
      security,
      securityAnalyzed,
      testing,
      documentation,
      architecture: architectureScore,
    };
  }, [fileAnalysis, codeEvolution, architecture]);

  const overallTier = getTier(scores.overall);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="w-full max-w-full min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 lg:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <Activity size={16} className="text-indigo-500 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
              Project Health
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
              Repository quality overview
            </p>
          </div>
        </div>

        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-md border shrink-0 ${overallTier.badge}`}
        >
          {overallTier.label}
        </span>
      </div>

      {/* OVERALL SCORE */}
      <div className="px-4 sm:px-5 lg:px-6 py-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 sm:gap-8">
          <div className="text-center sm:text-left w-full sm:w-auto">
            <div className="flex items-baseline justify-center sm:justify-start gap-1">
              <span className={`text-4xl font-semibold font-mono tabular-nums tracking-tight ${overallTier.text}`}>
                {scores.overall}
              </span>
              <span className="text-sm text-slate-400 dark:text-slate-500 font-mono">
                /100
              </span>
            </div>
            <p className={`text-xs font-medium mt-1 ${overallTier.text}`}>
              {overallTier.label}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs">
              Weighted across maintainability, complexity, testing,
              documentation, and architecture.
            </p>
          </div>

          <div
            className="relative w-24 h-24 shrink-0 mx-auto sm:mx-0 sm:ml-auto"
            role="img"
            aria-label={`Overall project health score: ${scores.overall} out of 100, rated ${overallTier.label}`}
          >
            <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-slate-100 dark:text-slate-800"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={
                  circumference - (circumference * scores.overall) / 100
                }
                className={`${overallTier.ring} transition-[stroke-dashoffset] duration-700 ease-out`}
              />
            </svg>
          </div>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="p-4 sm:p-5 lg:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <ScoreItem
          icon={Wrench}
          title="Maintainability"
          score={scores.maintainability}
          description="Code stability and change patterns"
        />

        <ScoreItem
          icon={GitBranch}
          title="Complexity"
          score={scores.complexity}
          description="Code churn and file dependencies"
        />

        <ScoreItem
          icon={ShieldCheck}
          title="Security"
          score={scores.security}
          notAnalyzed={!scores.securityAnalyzed}
          description="Security analysis unavailable"
        />

        <ScoreItem
          icon={TestTube2}
          title="Testing"
          score={scores.testing}
          description="Test file ratio indicators"
        />

        <ScoreItem
          icon={BookOpen}
          title="Documentation"
          score={scores.documentation}
          description="Repository markdown coverage"
        />

        <ScoreItem
          icon={Boxes}
          title="Architecture"
          score={scores.architecture}
          description="Structural organization balance"
        />
      </div>

      {/* FOOTER */}
      <div className="px-4 sm:px-5 lg:px-6 py-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Info size={12} className="shrink-0" aria-hidden="true" />
        <p className="min-w-0 break-words">
          Security analysis is currently excluded from the overall score.
        </p>
      </div>
    </div>
  );
}