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
// Renders nothing when there's no previous-period data to compare against.
// ---------------------------------------------------------------------------

const TREND_STYLES = {
  up: { Icon: ArrowUp, className: "text-emerald-400" },
  down: { Icon: ArrowDown, className: "text-rose-400" },
  flat: { Icon: Minus, className: "text-[#7C8698]" },
};

function TrendBadge({ trend }) {
  if (!trend) return null;

  const { Icon, className } = TREND_STYLES[trend.direction];
  const label =
    trend.direction === "flat"
      ? "No change vs previous period"
      : `${trend.direction === "up" ? "Increased" : "Decreased"} ${trend.pct.toFixed(
          1
        )}% vs previous period`;

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium tabular-nums ${className}`}>
      <Icon size={11} strokeWidth={2.5} aria-hidden="true" />
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
      <p className="text-[11px] text-[#7C8698] py-2">
        No commit activity yet
      </p>
    );
  }

  return (
    <div>
      <div
        className="flex items-end gap-1 h-7 sm:h-8"
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
              className="flex-1 h-full flex items-end min-w-0"
              title={`${contributor.name || "Unknown"}: ${formatNumber(
                contributor.commits || 0
              )} commits`}
            >
              <div
                className={`w-full rounded-[2px] ${
                  index === 0 ? "bg-sky-400" : "bg-white/[0.08]"
                }`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
        <span className="text-[#7C8698] shrink-0">Top contributor</span>
        <span className="font-medium text-[#C7CCD6] truncate max-w-[8rem] text-right">
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
      <div className="flex items-center justify-between text-[11px] mb-1.5">
        <span className="text-[#7C8698]">Engagement rate</span>
        <span className="font-medium text-[#C7CCD6] tabular-nums">
          {share.toFixed(0)}%
        </span>
      </div>

      <div
        className="h-1 rounded-full bg-white/[0.08] overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(share)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Contributor engagement rate"
      >
        <div
          className="h-full rounded-full bg-emerald-400"
          style={{ width: `${Math.min(100, share)}%` }}
        />
      </div>

      <p className="mt-2 text-[11px] text-[#7C8698] tabular-nums">
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
    <div className="h-full flex flex-col rounded-[12px] border border-white/[0.08] bg-[#10151C] p-4 sm:p-5 transition-colors duration-150 hover:border-white/[0.14] focus-within:ring-2 focus-within:ring-sky-400/40">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-[8px] bg-white/[0.05] text-[#8B94A5]">
          <Icon size={15} strokeWidth={2} aria-hidden="true" />
        </span>
        <TrendBadge trend={trend} />
      </div>

      <div className="mt-4">
        <p className="text-[11.5px] font-medium text-[#7C8698]">{title}</p>
        <p className="mt-1 text-[26px] sm:text-2xl font-semibold tracking-[-0.01em] text-white tabular-nums">
          {value}
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.06] mt-auto">{footer}</div>
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
        <p className="text-[11px] text-[#7C8698]">
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
        <p className="text-[11px] text-[#7C8698]">Per contributor, all time</p>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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