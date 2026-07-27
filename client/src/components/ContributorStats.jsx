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
      return { pct: 0, direction: "flat" };
    }

    return { pct: 100, direction: "up" };
  }

  const pct = ((current - previous) / previous) * 100;

  const direction =
    pct > 0.05 ? "up" : pct < -0.05 ? "down" : "flat";

  return {
    pct: Math.abs(pct),
    direction,
  };
}

const TREND_STYLES = {
  up: {
    icon: TrendingUp,
    className: "text-emerald-600",
  },
  down: {
    icon: TrendingDown,
    className: "text-rose-500",
  },
  flat: {
    icon: Minus,
    className: "text-gray-400",
  },
};

const ContributorStats = ({
  contributors = [],
  previousContributors = null,
}) => {
  /*
   * Current repository statistics
   */
  const current = useMemo(
    () => summarize(contributors),
    [contributors]
  );

  /*
   * Previous period statistics.
   * Optional — only used if you provide previousContributors.
   */
  const previous = useMemo(
    () =>
      previousContributors
        ? summarize(previousContributors)
        : null,
    [previousContributors]
  );

  /*
   * Top contributors for the small chart
   */
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
      (contributor) => contributor.commits || 0
    )
  );

  /*
   * Percentage of contributors active
   */
  const activeShare =
    current.totalContributors > 0
      ? (current.activeContributors /
          current.totalContributors) *
        100
      : 0;

  /*
   * Cards
   */
  const stats = [
    {
      key: "total",
      title: "Total Contributors",
      value: formatNumber(current.totalContributors),
      icon: Users,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      trend: computeTrend(
        current.totalContributors,
        previous?.totalContributors
      ),
    },

    {
      key: "active",
      title: "Active Contributors",
      value: formatNumber(current.activeContributors),
      icon: UserCheck,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      trend: computeTrend(
        current.activeContributors,
        previous?.activeContributors
      ),
    },

    {
      key: "commits",
      title: "Contributions (Commits)",
      value: formatNumber(current.totalCommits),
      icon: Star,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      trend: computeTrend(
        current.totalCommits,
        previous?.totalCommits
      ),
    },

    {
      key: "avg",
      title: "Avg. Commits / Contributor",
      value: current.averageCommits,
      icon: GitCommit,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      trend: computeTrend(
        Number(current.averageCommits),
        previous
          ? Number(previous.averageCommits)
          : undefined
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;

        const trendInfo = stat.trend
          ? TREND_STYLES[stat.trend.direction]
          : null;

        const TrendIcon = trendInfo?.icon;

        return (
          <div
            key={stat.key}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-3">
                  {stat.title}
                </p>

                <h3 className="text-3xl font-bold text-gray-900 tabular-nums">
                  {stat.value}
                </h3>

                {/* Trend */}
                {stat.trend ? (
                  <div
                    className={`flex items-center gap-1 mt-3 text-sm ${trendInfo.className}`}
                  >
                    <TrendIcon size={15} />

                    <span className="tabular-nums">
                      {stat.trend.direction === "flat"
                        ? "No change"
                        : `${stat.trend.pct.toFixed(1)}%`}{" "}
                      vs. last period
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-gray-400">
                    No prior period data
                  </div>
                )}
              </div>

              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0`}
              >
                <Icon
                  size={24}
                  className={stat.iconColor}
                />
              </div>
            </div>

            {/* Bottom visual */}
            {stat.key === "active" ? (
              <div className="mt-5">
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        activeShare
                      )}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-xs text-gray-400 tabular-nums">
                  {activeShare.toFixed(0)}% of contributors active
                </p>
              </div>
            ) : (
              <div className="mt-5 flex items-end gap-1 h-8">
                {topCommitters.length > 0 ? (
                  topCommitters.map((contributor, index) => (
                    <div
                      key={
                        contributor.email ||
                        contributor.name ||
                        index
                      }
                      title={`${contributor.name || "Unknown"}: ${
                        contributor.commits || 0
                      } commits`}
                      className={`flex-1 rounded-full ${
                        index === 0
                          ? "bg-indigo-400"
                          : "bg-gray-200"
                      }`}
                      style={{
                        height: `${Math.max(
                          12,
                          ((contributor.commits || 0) /
                            maxCommits) *
                            100
                        )}%`,
                      }}
                    />
                  ))
                ) : (
                  <p className="text-xs text-gray-300">
                    No commit data yet
                  </p>
                )}
              </div>
            )}
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
    (total, contributor) =>
      total + (contributor.commits || 0),
    0
  );

  /*
   * Active = contributed within the last 30 days
   */
  const now = Date.now();

  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  const activeContributors = list.filter(
    (contributor) => {
      if (!contributor.lastContribution) {
        return false;
      }

      const contributionDate = new Date(
        contributor.lastContribution
      ).getTime();

      return (
        !Number.isNaN(contributionDate) &&
        now - contributionDate <= THIRTY_DAYS
      );
    }
  ).length;

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

export default ContributorStats;