import {
  Sparkles,
  Calendar,
  Clock,
  FileCode,
  GitCommitHorizontal,
  ShieldCheck,
  AlertCircle,
  Lightbulb,
} from "lucide-react";

const QUICK_FACTS = [
  { icon: Calendar, label: "Most Active Day", value: "Tuesday", sub: "15 commits" },
  { icon: Clock, label: "Most Active Hour", value: "10 – 11 AM", sub: "8 commits" },
  { icon: FileCode, label: "Most Modified File", value: "Board.jsx", sub: "18 changes" },
  { icon: GitCommitHorizontal, label: "Largest Commit", value: "Diff Viewer", sub: "+245 -12 lines" },
];

const QUALITY_METRICS = [
  { label: "Code Consistency", score: 88 },
  { label: "Commit Message Quality", score: 74 },
  { label: "Test Coverage Signal", score: 52 },
  { label: "Refactor Frequency", score: 66 },
];

const RECOMMENDATIONS = [
  {
    icon: AlertCircle,
    accent: "bg-red-50 text-red-500",
    title: "Reduce churn in Board.jsx",
    description:
      "This file changed 18 times in the last 30 days — consider splitting it into smaller components.",
  },
  {
    icon: Lightbulb,
    accent: "bg-amber-50 text-amber-500",
    title: "Improve commit message clarity",
    description:
      "Several recent commits use vague messages like \"fix\" — more descriptive messages will help future debugging.",
  },
  {
    icon: ShieldCheck,
    accent: "bg-emerald-50 text-emerald-500",
    title: "Add tests around API handling",
    description:
      "Recent fixes to API response handling had no accompanying test changes — consider adding coverage.",
  },
];

function QuickFactCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-start gap-3">
      <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-indigo-600" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-900 truncate">{value}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
    </div>
  );
}

function QualityBar({ label, score }) {
  const color =
    score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-slate-600">{label}</span>
        <span className="text-sm font-medium text-slate-900">{score}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function RecommendationCard({ icon: Icon, accent, title, description }) {
  return (
    <div className="flex gap-3 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>
    </div>
  );
}

function AIInsights() {
  const overallScore = Math.round(
    QUALITY_METRICS.reduce((sum, m) => sum + m.score, 0) / QUALITY_METRICS.length
  );

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl font-bold text-slate-900">AI Insights</h1>
        <span className="text-[10px] uppercase font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
          Beta
        </span>
      </div>
      <p className="text-slate-500 mt-2 mb-8">
        Get AI-powered insights about your repository.
      </p>

      {/* AI Summary */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-slate-100">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <h2 className="text-xl font-semibold text-slate-900">Repository Summary</h2>
        </div>
        <p className="text-slate-500 mt-3 leading-relaxed">
          This repository shows steady, single-contributor development with activity
          concentrated on weekday mornings. Recent commits focus on dashboard UI and
          API handling, with{" "}
          <span className="font-medium text-slate-700">Board.jsx</span> emerging as a
          recurring hotspot. Overall code health is solid, with room to improve test
          coverage and commit message consistency.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
          {QUICK_FACTS.map((fact) => (
            <QuickFactCard key={fact.label} {...fact} />
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-900">Code Quality</h2>
            <span className="text-sm font-semibold text-slate-900">
              {overallScore}
              <span className="text-slate-400 font-normal">/100</span>
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {QUALITY_METRICS.map((metric) => (
              <QualityBar key={metric.label} {...metric} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-900 mb-5">Recommendations</h2>
          <div className="flex flex-col gap-3">
            {RECOMMENDATIONS.map((rec) => (
              <RecommendationCard key={rec.title} {...rec} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIInsights;