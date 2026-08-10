import React, { useMemo } from "react";
import {
  Users,
  UserCheck,
  GitCommit,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Layers,
} from "lucide-react";

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
    direction:
      pct > 0.05
        ? "up"
        : pct < -0.05
        ? "down"
        : "flat",
  };
}

const TREND_STYLES = {
  up: {
    icon: TrendingUp,
    badgeClass: "text-emerald-700 bg-emerald-50 border-emerald-200/80",
  },
  down: {
    icon: TrendingDown,
    badgeClass: "text-rose-700 bg-rose-50 border-rose-200/80",
  },
  flat: {
    icon: Minus,
    badgeClass: "text-slate-600 bg-slate-100 border-slate-200/80",
  },
};

const CARD_CONFIG = {
  total: {
    icon: Users,
    glow: "from-blue-500/15 via-indigo-500/5 to-transparent",
    iconBg: "bg-blue-500/10 text-blue-600 ring-blue-500/20",
    barColor: "bg-blue-500",
  },
  active: {
    icon: UserCheck,
    glow: "from-emerald-500/15 via-teal-500/5 to-transparent",
    iconBg: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20",
    barColor: "bg-emerald-500",
  },
  commits: {
    icon: GitCommit,
    glow: "from-violet-500/15 via-purple-500/5 to-transparent",
    iconBg: "bg-violet-500/10 text-violet-600 ring-violet-500/20",
    barColor: "bg-violet-500",
  },
  avg: {
    icon: Layers,
    glow: "from-amber-500/15 via-orange-500/5 to-transparent",
    iconBg: "bg-amber-500/10 text-amber-600 ring-amber-500/20",
    barColor: "bg-amber-500",
  },
};

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

    const contributionDate = new Date(
      contributor.lastContribution
    ).getTime();

    return (
      !Number.isNaN(contributionDate) &&
      now - contributionDate <= THIRTY_DAYS
    );
  }).length;

  const averageCommits =
    totalContributors > 0
      ? (totalCommits / totalContributors).toFixed(1)
      : "0.0";

  return {
    totalContributors,
    totalCommits,
    activeContributors,
    averageCommits,
  };
}

const ContributorStats = ({
  contributors = [],
  previousContributors = null,
}) => {
  const current = useMemo(() => summarize(contributors), [contributors]);

  const previous = useMemo(
    () => (previousContributors ? summarize(previousContributors) : null),
    [previousContributors]
  );

  const topCommitters = useMemo(() => {
    return [...contributors]
      .sort((a, b) => (b.commits || 0) - (a.commits || 0))
      .slice(0, 6);
  }, [contributors]);

  const maxCommits = Math.max(
    1,
    ...topCommitters.map((c) => c.commits || 0)
  );

  const activeShare =
    current.totalContributors > 0
      ? (current.activeContributors / current.totalContributors) * 100
      : 0;

  const stats = [
    {
      key: "total",
      title: "Total Contributors",
      value: formatNumber(current.totalContributors),
      trend: computeTrend(
        current.totalContributors,
        previous?.totalContributors
      ),
    },
    {
      key: "active",
      title: "Active Contributors",
      value: formatNumber(current.activeContributors),
      trend: computeTrend(
        current.activeContributors,
        previous?.activeContributors
      ),
    },
    {
      key: "commits",
      title: "Total Commits",
      value: formatNumber(current.totalCommits),
      trend: computeTrend(
        current.totalCommits,
        previous?.totalCommits
      ),
    },
    {
      key: "avg",
      title: "Average Commits",
      value: current.averageCommits,
      trend: computeTrend(
        Number(current.averageCommits),
        previous ? Number(previous.averageCommits) : undefined
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {stats.map((stat) => {
        const config = CARD_CONFIG[stat.key];
        const Icon = config.icon;

        const trendInfo = stat.trend
          ? TREND_STYLES[stat.trend.direction]
          : null;
        const TrendIcon = trendInfo?.icon;

        return (
          <div
            key={stat.key}
            className="group relative overflow-hidden bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-slate-300 transition-all duration-300 hover:-translate-y-1"
          >
            {/* Soft Ambient Background Glow on Hover */}
            <div
              className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${config.glow} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
            />

            <div className="relative z-10 flex flex-col justify-between h-full">
              {/* Card Header: Icon & Title */}
              <div>
                <div className="flex items-center justify-between">
                  <div
                    className={`p-2.5 rounded-xl ring-1 ${config.iconBg} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon size={20} strokeWidth={2.2} />
                  </div>

                  {stat.trend ? (
                    <div
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${trendInfo.badgeClass}`}
                    >
                      <TrendIcon size={12} strokeWidth={2.5} />
                      <span>
                        {stat.trend.direction === "flat"
                          ? "0%"
                          : `${stat.trend.pct.toFixed(1)}%`}
                      </span>
                    </div>
                  ) : (
                    <span className="px-2.5 py-0.5 text-[11px] font-medium text-slate-400 bg-slate-100 rounded-full">
                      Baseline
                    </span>
                  )}
                </div>

                {/* Metric Value */}
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {stat.title}
                  </p>
                  <h3 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                    {stat.value}
                  </h3>
                </div>
              </div>

              {/* Bottom Visual Widget Section */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                {stat.key === "active" ? (
                  <div>
                    <div className="flex justify-between items-center text-xs font-medium text-slate-500 mb-1.5">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Engagement Rate
                      </span>
                      <span className="font-bold text-slate-700">
                        {activeShare.toFixed(0)}%
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden p-0.5 ring-1 ring-slate-200/50">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                        style={{
                          width: `${Math.min(100, activeShare)}%`,
                        }}
                      />
                    </div>

                    <p className="mt-2 text-[11px] text-slate-400 font-medium truncate">
                      {current.activeContributors} active out of{" "}
                      {current.totalContributors} members
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-end gap-1.5 h-10 px-0.5">
                      {topCommitters.length > 0 ? (
                        topCommitters.map((contributor, index) => {
                          const heightPct = Math.max(
                            15,
                            ((contributor.commits || 0) / maxCommits) * 100
                          );

                          return (
                            <div
                              key={
                                contributor.email ||
                                contributor.name ||
                                index
                              }
                              className="flex-1 group/bar relative flex flex-col justify-end h-full"
                            >
                              <div
                                className={`w-full rounded-t-sm transition-all duration-300 ${
                                  index === 0
                                    ? config.barColor
                                    : "bg-slate-200 group-hover/bar:bg-slate-300"
                                }`}
                                style={{ height: `${heightPct}%` }}
                              />
                            </div>
                          );
                        })
                      ) : (
                        <div className="w-full flex items-center justify-center text-xs text-slate-300">
                          No activity data
                        </div>
                      )}
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium flex items-center gap-1">
                        <Sparkles size={11} className="text-slate-400" />
                        Top Performer
                      </span>
                      <span className="font-bold text-slate-700 truncate max-w-[100px]">
                        {topCommitters[0]?.name || "-"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ContributorStats;