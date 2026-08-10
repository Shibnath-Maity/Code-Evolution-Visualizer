import { useState, useEffect, useMemo } from "react";
import { useAnalysis } from "../context/AnalysisContext";

import TopContributors from "../components/TopContributors";
import ContributorStats from "../components/ContributorStats";
import ContributionDistribution from "../components/ContributionDistribution";
import ContributorAI from "../components/ContributorAI";
import ContributorSummaryBar from "../components/ContributorSummaryBar";
// import RecentCommitsPanel from "../components/RecentCommitsPanel";
import {
  TechnicalFocusCard,
  TopLanguagesCard,
  MostModifiedFilesCard,
} from "../components/ContributorInsightCards";
import TimeRangeFilter from "../components/TimeRangeFilter";
import { Users, AlertCircle, Sparkles, UserCheck } from "lucide-react";

function Contributors() {
  const { analysis } = useAnalysis();

  const [activeContributor, setActiveContributor] = useState(null);
  const [rangeDays, setRangeDays] = useState(90);

  // Toggle flag if you plan to re-enable RecentCommitsPanel later
  const showRecentCommits = false;

  // Memoize extracted objects to maintain reference stability across renders
  const contributors = useMemo(
    () => analysis?.contributors ?? {},
    [analysis]
  );
  const allCommits = useMemo(
    () => analysis?.allCommits ?? [],
    [analysis]
  );

  const contributorList = useMemo(
    () =>
      Object.values(contributors).sort(
        (a, b) => (b.commits || 0) - (a.commits || 0)
      ),
    [contributors]
  );

  // Reset active contributor whenever contributorList changes (e.g., repository switched)
  useEffect(() => {
    if (contributorList.length > 0) {
      setActiveContributor(
        contributorList[0]?.name || contributorList[0]?.author || null
      );
    } else {
      setActiveContributor(null);
    }
  }, [contributorList]);

  // Reset time range filter when switching repositories
  useEffect(() => {
    setRangeDays(90);
  }, [analysis]);

  // Memoize cutoff timestamp to avoid repeated Date calculations during array filter
  const cutoff = useMemo(() => {
    if (!rangeDays) return null;
    return Date.now() - rangeDays * 24 * 60 * 60 * 1000;
  }, [rangeDays]);

  const statsCommits = useMemo(() => {
    if (!cutoff) return allCommits;

    return allCommits.filter(
      (c) => c.date && new Date(c.date).getTime() >= cutoff
    );
  }, [allCommits, cutoff]);

  const aggregates = useMemo(() => {
    return allCommits.reduce((map, commit) => {
      const author = commit.author_name || commit.author || commit.name;

      if (!author) return map;

      if (!map[author]) {
        map[author] = {
          additions: 0,
          deletions: 0,
          lastActive: null,
        };
      }

      map[author].additions += commit.additions || 0;
      map[author].deletions += commit.deletions || 0;

      if (
        !map[author].lastActive ||
        new Date(commit.date) > new Date(map[author].lastActive)
      ) {
        map[author].lastActive = commit.date;
      }

      return map;
    }, {});
  }, [allCommits]);

  // Guard activeRank to ensure it defaults to 0 instead of -1 if contributor is missing
  const activeRank = useMemo(
    () =>
      Math.max(
        0,
        contributorList.findIndex(
          (c) => (c.name || c.author) === activeContributor
        )
      ),
    [contributorList, activeContributor]
  );

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white pb-12">
      {/* Background ambient lighting effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
                <Users size={24} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Contributors
                </h1>
                {contributorList.length > 0 && (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                    {contributorList.length} Active
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5 font-medium">
                Individual metrics, code impacts, and repository insights
              </p>
            </div>
          </div>

          {analysis && (
            <div className="self-start sm:self-auto bg-white p-1 rounded-xl shadow-xs border border-slate-200">
              <TimeRangeFilter
                value={rangeDays}
                onChange={setRangeDays}
              />
            </div>
          )}
        </header>

        {!analysis ? (
          /* Empty State */
          <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-sm p-12 text-center max-w-lg mx-auto my-16 space-y-4">
            <div className="bg-red-50 text-red-500 p-4 rounded-2xl w-fit mx-auto ring-1 ring-red-100">
              <AlertCircle size={28} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                No Repository Selected
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Please analyze a repository to view contributor breakdown, code patterns, and commit history.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <section className="transition-all duration-300">
              <ContributorStats
                contributors={contributorList}
                allCommits={statsCommits}
              />
            </section>

            {/* Core Distribution & Leaderboards */}
            <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow p-1">
                <TopContributors
                  contributors={contributorList}
                  aggregates={aggregates}
                  activeContributor={activeContributor}
                  onSelect={setActiveContributor}
                />
              </div>

              <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow p-1">
                <ContributionDistribution
                  contributors={contributorList}
                />
              </div>
            </section>

            {/* Active Contributor Drill-down */}
            {activeContributor && (
              <section className="space-y-6 pt-4">
                {/* Active Contributor Indicator Banner */}
                <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
                      <UserCheck size={20} />
                    </div>
                    <div>
                      <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">
                        Selected Contributor
                      </span>
                      <h2 className="text-xl font-bold tracking-tight text-white">
                        {activeContributor}
                      </h2>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-xs font-medium bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                    <Sparkles size={14} className="text-indigo-300" />
                    <span>Rank #{activeRank + 1}</span>
                  </div>
                </div>

                {/* Summary Bar */}
                <ContributorSummaryBar
                  contributorName={activeContributor}
                  allCommits={allCommits}
                  rank={activeRank}
                />

                {/* AI & Recent Activity Row */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  <div
                    className={
                      showRecentCommits
                        ? "xl:col-span-8"
                        : "xl:col-span-12"
                    }
                  >
                    <ContributorAI
                      contributorName={activeContributor}
                      allCommits={allCommits}
                    />
                  </div>

                  {showRecentCommits && (
                    <div className="xl:col-span-4">
                      {/* <RecentCommitsPanel
                        contributorName={activeContributor}
                        allCommits={allCommits}
                      /> */}
                    </div>
                  )}
                </div>

                {/* Insight Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <TechnicalFocusCard />
                  <TopLanguagesCard />
                  <MostModifiedFilesCard />
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Contributors;