import React, { useMemo } from "react";
import {
  ShieldCheck,
  Wrench,
  Brain,
  TestTube2,
  BookOpen,
  Boxes,
  Activity,
} from "lucide-react";

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

// Single source of truth for score -> color/label tiers. Previously
// getScoreColor and getScoreLabel had independently-defined thresholds
// that had drifted apart (e.g. a score of 72 rendered a yellow/"caution"
// color next to a "Good" label). Deriving both from one ordered list
// keeps them in sync by construction.
const TIERS = [
  { min: 90, label: "Excellent", text: "text-emerald-600", bar: "bg-emerald-500", ring: "text-emerald-500" },
  { min: 80, label: "Healthy", text: "text-emerald-600", bar: "bg-emerald-500", ring: "text-emerald-500" },
  { min: 70, label: "Good", text: "text-yellow-600", bar: "bg-yellow-500", ring: "text-yellow-500" },
  { min: 60, label: "Needs Attention", text: "text-yellow-600", bar: "bg-yellow-500", ring: "text-yellow-500" },
  { min: 40, label: "At Risk", text: "text-orange-600", bar: "bg-orange-500", ring: "text-orange-500" },
  { min: 0, label: "Critical", text: "text-red-600", bar: "bg-red-500", ring: "text-red-500" },
];

function getTier(score) {
  return TIERS.find((tier) => score >= tier.min) || TIERS[TIERS.length - 1];
}

function ScoreBar({ score }) {
  const tier = getTier(score);
  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${tier.bar}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

function ScoreItem({ icon: Icon, title, score, description, notAnalyzed = false }) {
  const tier = getTier(score);
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Icon className="w-5 h-5 text-indigo-600" />
          </div>

          <div>
            <h3 className="font-semibold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>

        {notAnalyzed ? (
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Not analyzed
          </span>
        ) : (
          <span className={`text-lg font-bold ${tier.text}`}>{score}</span>
        )}
      </div>

      {notAnalyzed ? (
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full w-full bg-slate-200" />
        </div>
      ) : (
        <ScoreBar score={score} />
      )}
    </div>
  );
}

// Weights for metrics that are actually derived from repository data.
// Security is intentionally excluded: there's no dedicated security
// analyzer yet, so it's shown as an informational placeholder only and
// must never influence the overall score. These weights sum to 1.
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
    /*
     * -----------------------------------------
     * 1. MAINTAINABILITY
     * -----------------------------------------
     *
     * Uses:
     * - number of files
     * - code churn
     * - hotspots
     */

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

    /*
     * -----------------------------------------
     * 2. COMPLEXITY
     * -----------------------------------------
     */

    const churnCount = Array.isArray(codeEvolution) ? codeEvolution.length : 0;

    let complexity = 80;

    if (churnCount > 100) {
      complexity -= 15;
    } else if (churnCount > 50) {
      complexity -= 8;
    }

    complexity = clamp(complexity);

    /*
     * -----------------------------------------
     * 3. SECURITY
     * -----------------------------------------
     *
     * We currently don't have a dedicated security analyzer. Rather than
     * presenting a fixed constant as if it were measured, this is surfaced
     * to the UI as `securityAnalyzed: false` so it renders as "Not analyzed"
     * and is excluded from the overall weighted score below.
     */

    const security = null;
    const securityAnalyzed = false;

    /*
     * -----------------------------------------
     * 4. TESTING
     * -----------------------------------------
     */

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

    /*
     * -----------------------------------------
     * 5. DOCUMENTATION
     * -----------------------------------------
     */

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

    /*
     * -----------------------------------------
     * 6. ARCHITECTURE
     * -----------------------------------------
     */

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

    /*
     * -----------------------------------------
     * OVERALL SCORE
     * -----------------------------------------
     * Only metrics backed by real analysis contribute here.
     */

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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* HEADER */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Activity className="w-6 h-6 text-indigo-600" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Project Health Score
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Overall quality and engineering health
            </p>
          </div>
        </div>
      </div>

      {/* SCORE */}
      <div className="p-8 flex flex-col items-center">
        <div
          className="relative w-44 h-44"
          role="img"
          aria-label={`Overall project health score: ${scores.overall} out of 100, rated ${overallTier.label}`}
        >
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-100"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={
                circumference - (circumference * scores.overall) / 100
              }
              className={overallTier.ring}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${overallTier.text}`}>
              {scores.overall}
            </span>
            <span className="text-sm text-slate-500">/ 100</span>
          </div>
        </div>

        <h3 className={`mt-4 text-xl font-bold ${overallTier.text}`}>
          {overallTier.label}
        </h3>

        <p className="text-sm text-slate-500 mt-1">
          Based on repository analysis
        </p>
      </div>

      {/* INDIVIDUAL SCORES */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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
          description="Code evolution and structural complexity"
        />

        <ScoreItem
          icon={ShieldCheck}
          title="Security"
          score={scores.security}
          notAnalyzed={!scores.securityAnalyzed}
          description="No dedicated security analyzer yet"
        />

        <ScoreItem
          icon={TestTube2}
          title="Testing"
          score={scores.testing}
          description="Test coverage indicators"
        />

        <ScoreItem
          icon={BookOpen}
          title="Documentation"
          score={scores.documentation}
          description="Repository documentation"
        />

        <ScoreItem
          icon={Boxes}
          title="Architecture"
          score={scores.architecture}
          description="Repository structure and organization"
        />
      </div>

      {/* FOOTER */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Scores are calculated from the repository metrics currently
          available to Code Evolution Visualizer. Security is not yet
          analyzed and is excluded from the overall score.
        </p>
      </div>
    </div>
  );
}