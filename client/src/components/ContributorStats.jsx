import React, { useMemo } from "react";
import { Users, UserCheck, GitCommit, Layers, ArrowUp, ArrowDown, Minus } from "lucide-react";

function formatNumber(value = 0) {
  return new Intl.NumberFormat("en-US").format(value);
}

function computeTrend(current, previous) {
  if (previous === undefined || previous === null) return null;

  if (previous === 0) {
    if (current === 0) return { pct: 0, direction: "flat" };
    return { pct: 100, direction: "up" };
  }

  const pct = ((current - previous) / previous) * 100;

  return {
    pct: Math.abs(pct),
    direction: pct > 0.05 ? "up" : pct < -0.05 ? "down" : "flat",
  };
}

function summarize(list = []) {
  const totalContributors = list.length;

  const totalCommits = list.reduce(
    (sum, contributor) => sum + (contributor.commits || 0),
    0
  );

  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  const activeContributors = list.filter((contributor) => {
    if (!contributor.lastContribution) return false;
    const contributionDate = new Date(contributor.lastContribution).getTime();
    return !Number.isNaN(contributionDate) && now - contributionDate <= THIRTY_DAYS;
  }).length;

  const averageCommits =
    totalContributors > 0 ? (totalCommits / totalContributors).toFixed(1) : "0.0";

  return { totalContributors, totalCommits, activeContributors, averageCommits };
}

// ---------------------------------------------------------------------------
// Trend badge: compact, quiet, never louder than the metric it describes.
// Direction is conveyed through icon + text, not color alone.
// ---------------------------------------------------------------------------

const TREND_STYLES = {
  up: { Icon: ArrowUp, className: "text-emerald-600 dark:text-emerald-400" },
  down: { Icon: ArrowDown, className: "text-rose-600 dark:text-rose-400" },
  flat: { Icon: Minus, className: "text-slate-500 dark:text-slate-400" },
};

function TrendBadge({ trend }) {
  if (!trend) {
    return (
      <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
        No prior period
      </span>
    );
  }

  const { Icon, className } = TREND_STYLES[trend.direction];
  const label =
    trend.direction === "flat"
      ? "No change vs previous period"
      : `${trend.direction === "up" ? "Increased" : "Decreased"} ${trend.pct.toFixed(
          1
        )}% vs previous period`;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${className}`}>
      <Icon size={12} strokeWidth={2.5} aria-hidden="true" />
      <span aria-hidden="true">
        {trend.direction === "flat" ? "0%" : `${trend.pct.toFixed(1)}%`}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Compact commit activity indicator — top committers as small bars.
// ---------------------------------------------------------------------------

function CommitActivity({ contributors }) {
  const topCommitters = useMemo(
    () => [...contributors].sort((a, b) => (b.commits || 0) - (a.commits || 0)).slice(0, 6),
    [contributors]
  );

  const maxCommits = Math.max(1, ...topCommitters.map((c) => c.commits || 0));

  if (topCommitters.length === 0) {
    return (
      <p className="text-xs text-slate-400 dark:text-slate-500 py-2">
        No commit activity yet
      </p>
    );
  }

  return (
    <div>
      <div
        className="flex items-end gap-1 h-8"
        role="img"
        aria-label={`Top committer ${topCommitters[0]?.name || "unknown"} with ${
          topCommitters[0]?.commits || 0
        } commits`}
      >
        {topCommitters.map((contributor, index) => {
          const heightPct = Math.max(12, ((contributor.commits || 0) / maxCommits) * 100);
          return (
            <div
              key={contributor.email || contributor.name || index}
              className="flex-1 h-full flex items-end"
              title={`${contributor.name || "Unknown"}: ${formatNumber(
                contributor.commits || 0
              )} commits`}
            >
              <div
                className={`w-full rounded-sm ${
                  index === 0
                    ? "bg-blue-600 dark:bg-blue-500"
                    : "bg-slate-200 dark:bg-slate-700"
                }`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">Top contributor</span>
        <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[9rem] text-right">
          {topCommitters[0]?.name || "—"}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Engagement rate — thin, quiet progress bar. No decorative pulsing.
// ---------------------------------------------------------------------------

function EngagementRate({ active, total }) {
  const share = total > 0 ? (active / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-slate-500 dark:text-slate-400">Engagement rate</span>
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {share.toFixed(0)}%
        </span>
      </div>

      <div
        className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(share)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Contributor engagement rate"
      >
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${Math.min(100, share)}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        {formatNumber(active)} of {formatNumber(total)} contributors active
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card shell
// ---------------------------------------------------------------------------

const ICONS = { total: Users, active: UserCheck, commits: GitCommit, avg: Layers };

function StatCard({ statKey, title, value, trend, footer }) {
  const Icon = ICONS[statKey];

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-colors hover:border-slate-300 dark:hover:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500/50">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          <Icon size={16} strokeWidth={2} aria-hidden="true" />
        </span>
        <TrendBadge trend={trend} />
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          {value}
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">{footer}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component — same props, same calculations.
// ---------------------------------------------------------------------------

const ContributorStats = ({ contributors = [], previousContributors = null }) => {
  const current = useMemo(() => summarize(contributors), [contributors]);

  const previous = useMemo(
    () => (previousContributors ? summarize(previousContributors) : null),
    [previousContributors]
  );

  const stats = [
    {
      key: "total",
      title: "Total contributors",
      value: formatNumber(current.totalContributors),
      trend: computeTrend(current.totalContributors, previous?.totalContributors),
      footer: (
        <EngagementRate active={current.activeContributors} total={current.totalContributors} />
      ),
    },
    {
      key: "active",
      title: "Active contributors",
      value: formatNumber(current.activeContributors),
      trend: computeTrend(current.activeContributors, previous?.activeContributors),
      footer: (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Contributed within the last 30 days
        </p>
      ),
    },
    {
      key: "commits",
      title: "Total commits",
      value: formatNumber(current.totalCommits),
      trend: computeTrend(current.totalCommits, previous?.totalCommits),
      footer: <CommitActivity contributors={contributors} />,
    },
    {
      key: "avg",
      title: "Average commits",
      value: current.averageCommits,
      trend: computeTrend(
        Number(current.averageCommits),
        previous ? Number(previous.averageCommits) : undefined
      ),
      footer: (
        <p className="text-xs text-slate-500 dark:text-slate-400">Per contributor, all time</p>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.key}
          statKey={stat.key}
          title={stat.title}
          value={stat.value}
          trend={stat.trend}
          footer={stat.footer}
        />
      ))}
    </div>
  );
};

export default ContributorStats;