import React, { useMemo } from "react";
import {
  Users,
  UserCheck,
  Star,
  GitCommit,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

function formatNumber(value = 0) {
  return new Intl.NumberFormat("en-US").format(value);
}

function computeTrend(current, previous) {
  if (previous === undefined || previous === null) return null;

  if (previous === 0) {
    if (current === 0) {
      return {
        pct: 0,
        direction: "flat",
      };
    }

    return {
      pct: 100,
      direction: "up",
    };
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
    className: "text-emerald-600 bg-emerald-50",
  },
  down: {
    icon: TrendingDown,
    className: "text-rose-600 bg-rose-50",
  },
  flat: {
    icon: Minus,
    className: "text-gray-500 bg-gray-100",
  },
};

const CARD_COLORS = {
  total: {
    gradient:
      "from-indigo-500 via-violet-500 to-purple-600",
    light: "bg-indigo-50",
    icon: "text-indigo-600",
    accent: "bg-indigo-500",
  },

  active: {
    gradient:
      "from-emerald-500 via-green-500 to-teal-500",
    light: "bg-emerald-50",
    icon: "text-emerald-600",
    accent: "bg-emerald-500",
  },

  commits: {
    gradient:
      "from-amber-400 via-orange-500 to-red-500",
    light: "bg-orange-50",
    icon: "text-orange-600",
    accent: "bg-orange-500",
  },

  avg: {
    gradient:
      "from-sky-500 via-cyan-500 to-blue-600",
    light: "bg-sky-50",
    icon: "text-sky-600",
    accent: "bg-sky-500",
  },
};

const ContributorStats = ({
  contributors = [],
  previousContributors = null,
}) => {
  const current = useMemo(
    () => summarize(contributors),
    [contributors]
  );

  const previous = useMemo(
    () =>
      previousContributors
        ? summarize(previousContributors)
        : null,
    [previousContributors]
  );

  const topCommitters = useMemo(() => {
    return [...contributors]
      .sort(
        (a, b) =>
          (b.commits || 0) - (a.commits || 0)
      )
      .slice(0, 6);
  }, [contributors]);

  const maxCommits = Math.max(
    1,
    ...topCommitters.map(
      (c) => c.commits || 0
    )
  );

  const activeShare =
    current.totalContributors > 0
      ? (current.activeContributors /
          current.totalContributors) *
        100
      : 0;

  const stats = [
    {
      key: "total",
      title: "Total Contributors",
      value: formatNumber(
        current.totalContributors
      ),
      icon: Users,
      trend: computeTrend(
        current.totalContributors,
        previous?.totalContributors
      ),
    },

    {
      key: "active",
      title: "Active Contributors",
      value: formatNumber(
        current.activeContributors
      ),
      icon: UserCheck,
      trend: computeTrend(
        current.activeContributors,
        previous?.activeContributors
      ),
    },

    {
      key: "commits",
      title: "Total Commits",
      value: formatNumber(
        current.totalCommits
      ),
      icon: Star,
      trend: computeTrend(
        current.totalCommits,
        previous?.totalCommits
      ),
    },

    {
      key: "avg",
      title: "Average Commits",
      value: current.averageCommits,
      icon: GitCommit,
      trend: computeTrend(
        Number(current.averageCommits),
        previous
          ? Number(previous.averageCommits)
          : undefined
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const color =
          CARD_COLORS[stat.key];

        const trendInfo = stat.trend
          ? TREND_STYLES[
              stat.trend.direction
            ]
          : null;

        const TrendIcon =
          trendInfo?.icon;

        return (
          <div
            key={stat.key}
            className="group relative overflow-hidden rounded-3xl bg-white border border-gray-200 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
          >
            {/* Top Gradient */}
            <div
              className={`h-2 bg-gradient-to-r ${color.gradient}`}
            />

            <div className="p-6">

              {/* Header */}
              <div className="flex items-start justify-between">

                <div>

                  <p className="text-sm font-medium text-gray-500">
                    {stat.title}
                  </p>

                  <h2 className="mt-2 text-4xl font-bold tracking-tight text-gray-900">
                    {stat.value}
                  </h2>

                  {stat.trend ? (
                    <div
                      className={`inline-flex items-center gap-1 mt-4 rounded-full px-3 py-1 text-xs font-semibold ${trendInfo.className}`}
                    >
                      <TrendIcon size={13} />

                      {stat.trend.direction ===
                      "flat"
                        ? "No change"
                        : `${stat.trend.pct.toFixed(
                            1
                          )}%`}
                    </div>
                  ) : (
                    <div className="mt-4 text-xs text-gray-400">
                      No previous data
                    </div>
                  )}
                </div>

                <div
                  className={`w-16 h-16 rounded-2xl ${color.light} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}
                >
                  <Icon
                    size={30}
                    className={color.icon}
                  />
                </div>

              </div>

              {/* Bottom Section */}
              <div className="mt-6">
                                {stat.key === "active" ? (
                  <>
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                      <span>Repository Activity</span>
                      <span>{activeShare.toFixed(0)}%</span>
                    </div>

                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color.accent} transition-all duration-700`}
                        style={{
                          width: `${Math.min(
                            100,
                            activeShare
                          )}%`,
                        }}
                      />
                    </div>

                    <p className="mt-3 text-xs text-gray-400">
                      {current.activeContributors} active of{" "}
                      {current.totalContributors} contributors
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-end gap-2 h-14">
                      {topCommitters.length > 0 ? (
                        topCommitters.map(
                          (
                            contributor,
                            index
                          ) => (
                            <div
                              key={
                                contributor.email ||
                                contributor.name ||
                                index
                              }
                              className={`flex-1 rounded-t-full transition-all duration-300 ${
                                index === 0
                                  ? color.accent
                                  : "bg-gray-200"
                              }`}
                              style={{
                                height: `${Math.max(
                                  12,
                                  ((contributor.commits ||
                                    0) /
                                    maxCommits) *
                                    100
                                )}%`,
                              }}
                              title={`${
                                contributor.name
                              }: ${
                                contributor.commits
                              } commits`}
                            />
                          )
                        )
                      ) : (
                        <p className="text-xs text-gray-300">
                          No commit data
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        Top Performer
                      </span>

                      <span className="text-xs font-semibold text-gray-700 truncate max-w-[120px]">
                        {topCommitters[0]?.name ||
                          "-"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/*
 * Calculate contributor statistics
 */

function summarize(list = []) {
  const totalContributors = list.length;

  const totalCommits = list.reduce(
    (sum, contributor) =>
      sum + (contributor.commits || 0),
    0
  );

  const now = Date.now();

  const THIRTY_DAYS =
    30 * 24 * 60 * 60 * 1000;

  const activeContributors = list.filter(
    (contributor) => {
      if (!contributor.lastContribution)
        return false;

      const contributionDate = new Date(
        contributor.lastContribution
      ).getTime();

      return (
        !Number.isNaN(contributionDate) &&
        now - contributionDate <=
          THIRTY_DAYS
      );
    }
  ).length;

  const averageCommits =
    totalContributors > 0
      ? (
          totalCommits /
          totalContributors
        ).toFixed(1)
      : "0.0";

  return {
    totalContributors,
    totalCommits,
    activeContributors,
    averageCommits,
  };
}

export default ContributorStats;
          