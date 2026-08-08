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
import { Users, AlertCircle } from "lucide-react";

function Contributors() {
  const { analysis } = useAnalysis();

  const [activeContributor, setActiveContributor] = useState(null);
  const [rangeDays, setRangeDays] = useState(90);

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
      setActiveContributor(contributorList[0]?.name || contributorList[0]?.author || null);
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
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-[1700px] mx-auto px-6 py-5 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-xl">
              <Users size={22} className="text-indigo-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Contributors
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                People who contributed to this repository
              </p>
            </div>
          </div>

          {analysis && (
            <TimeRangeFilter
              value={rangeDays}
              onChange={setRangeDays}
            />
          )}
        </div>

        {!analysis ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-500">
            <AlertCircle
              size={24}
              className="mx-auto mb-3 text-red-400"
            />
            Please analyze a repository first.
          </div>
        ) : (
          <>
            {/* Stats */}
            <ContributorStats
              contributors={contributorList}
              allCommits={statsCommits}
            />

            {/* Row 1 */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-7">
                <TopContributors
                  contributors={contributorList}
                  aggregates={aggregates}
                  activeContributor={activeContributor}
                  onSelect={setActiveContributor}
                />
              </div>

              <div className="xl:col-span-5">
                <ContributionDistribution
                  contributors={contributorList}
                />
              </div>
            </div>

            {activeContributor && (
              <>
                {/* Summary */}
                <ContributorSummaryBar
                  contributorName={activeContributor}
                  allCommits={allCommits}
                  rank={activeRank}
                />

                {/* AI + Recent Commits */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  <div className="xl:col-span-8">
                    <ContributorAI
                      contributorName={activeContributor}
                      allCommits={allCommits}
                    />
                  </div>

                  <div className="xl:col-span-4">
                    {/* <RecentCommitsPanel
                      contributorName={activeContributor}
                      allCommits={allCommits}
                    /> */}
                  </div>
                </div>

                {/* Insight Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <TechnicalFocusCard />
                  <TopLanguagesCard />
                  <MostModifiedFilesCard />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Contributors;