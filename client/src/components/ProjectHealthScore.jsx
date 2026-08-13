import React, { useMemo } from "react";
import {
  ShieldCheck,
  Wrench,
  Brain,
  TestTube2,
  BookOpen,
  Boxes,
  Activity,
  AlertCircle,
} from "lucide-react";

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

// Single source of truth for score -> tier mapping with dark theme support
const TIERS = [
  { min: 90, label: "Excellent", text: "text-emerald-400", bar: "bg-emerald-500", ring: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { min: 80, label: "Healthy", text: "text-emerald-400", bar: "bg-emerald-500", ring: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { min: 70, label: "Good", text: "text-amber-400", bar: "bg-amber-500", ring: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { min: 60, label: "Needs Attention", text: "text-amber-400", bar: "bg-amber-500", ring: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { min: 40, label: "At Risk", text: "text-orange-400", bar: "bg-orange-500", ring: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  { min: 0, label: "Critical", text: "text-rose-400", bar: "bg-rose-500", ring: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
];

function getTier(score) {
  return TIERS.find((tier) => score >= tier.min) || TIERS[TIERS.length - 1];
}

function ScoreBar({ score }) {
  const tier = getTier(score);
  return (
    <div className="w-full h-1.5 bg-slate-950/80 rounded-full overflow-hidden border border-slate-800/50">
      <div
        className={`h-full rounded-full transition-all duration-1000 ${tier.bar}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

function ScoreItem({ icon: Icon, title, score, description, notAnalyzed = false }) {
  const tier = getTier(score);
  return (
    <div className="bg-slate-950/50 hover:bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-indigo-400 shrink-0">
            <Icon size={18} />
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-200">{title}</h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{description}</p>
          </div>
        </div>

        {notAnalyzed ? (
          <span className="text-[10px] font-mono font-medium text-slate-500 uppercase tracking-wider bg-slate-900/80 border border-slate-800 px-2 py-0.5 rounded-md shrink-0">
            Pending
          </span>
        ) : (
          <span className={`text-base font-black font-mono ${tier.text} shrink-0`}>
            {score}
          </span>
        )}
      </div>

      {notAnalyzed ? (
        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/40">
          <div className="h-full w-full bg-slate-800/40" />
        </div>
      ) : (
        <ScoreBar score={score} />
      )}
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
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-xl overflow-hidden space-y-6">
      {/* HEADER */}
      <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Activity size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Project Health Score
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Overall quality and code health metrics
            </p>
          </div>
        </div>

        <span className={`text-xs font-mono font-semibold px-3 py-1 rounded-full border ${overallTier.bg} ${overallTier.text}`}>
          {overallTier.label}
        </span>
      </div>

      {/* SCORE CIRCLE & DISPLAY */}
      <div className="px-6 flex flex-col items-center justify-center">
        <div
          className="relative w-44 h-44 flex items-center justify-center"
          role="img"
          aria-label={`Overall project health score: ${scores.overall} out of 100, rated ${overallTier.label}`}
        >
          {/* Subtle Outer Glow */}
          <div className="absolute inset-4 rounded-full bg-indigo-500/5 blur-xl pointer-events-none" />

          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-slate-950"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={
                circumference - (circumference * scores.overall) / 100
              }
              className={`${overallTier.ring} transition-all duration-1000 ease-out`}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`text-4xl font-black font-mono tracking-tight ${overallTier.text}`}>
              {scores.overall}
            </span>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
              / 100
            </span>
          </div>
        </div>

        <div className="text-center mt-2 space-y-1">
          <h3 className={`text-sm font-bold tracking-wider uppercase font-mono ${overallTier.text}`}>
            {overallTier.label} Status
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Derived from repository AST and evolution analytics
          </p>
        </div>
      </div>

      {/* INDIVIDUAL SCORES GRID */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <ScoreItem
          icon={Wrench}
          title="Maintainability"
          score={scores.maintainability}
          description="Code stability and change patterns"
        />

        <ScoreItem
          icon={Brain}
          title="Complexity"
          score={scores.complexity}
          description="Code churn and file dependencies"
        />

        <ScoreItem
          icon={ShieldCheck}
          title="Security"
          score={scores.security}
          notAnalyzed={!scores.securityAnalyzed}
          description="Awaiting security module"
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
      <div className="px-6 py-3.5 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
        <AlertCircle size={14} className="text-indigo-400 shrink-0" />
        <p className="truncate">
          Security analysis is currently excluded from overall calculation.
        </p>
      </div>
    </div>
  );
}