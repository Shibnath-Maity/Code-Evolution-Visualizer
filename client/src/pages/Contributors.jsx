import { useEffect, useMemo, useState } from "react";

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
  const [contributors, setContributors] = useState({});
  const [allCommits, setAllCommits] = useState([]);
  const [activeContributor, setActiveContributor] = useState(null);
  const [rangeDays, setRangeDays] = useState(90);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const analysis = JSON.parse(localStorage.getItem("repositoryAnalysis"));

    if (!analysis) {
      setError("Please analyze a repository first.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setContributors(analysis.contributors || {});
    setAllCommits(analysis.allCommits || []);
    setLoading(false);
  }, []);

  const contributorList = useMemo(
    () =>
      Object.values(contributors).sort(
        (a, b) => (b.commits || 0) - (a.commits || 0)
      ),
    [contributors]
  );

  const statsCommits = useMemo(() => {
    if (!rangeDays) return allCommits;

    const cutoff =
      Date.now() - rangeDays * 24 * 60 * 60 * 1000;

    return allCommits.filter(
      (c) =>
        c.date &&
        new Date(c.date).getTime() >= cutoff
    );
  }, [allCommits, rangeDays]);

  const aggregates = useMemo(() => {
    const map = {};

    allCommits.forEach((commit) => {
      const author = commit.author_name || commit.author;

      if (!author) return;

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
        new Date(commit.date) >
          new Date(map[author].lastActive)
      ) {
        map[author].lastActive = commit.date;
      }
    });

    return map;
  }, [allCommits]);

  useEffect(() => {
    if (!activeContributor && contributorList.length) {
      setActiveContributor(contributorList[0].name);
    }
  }, [contributorList, activeContributor]);

  const activeRank = contributorList.findIndex(
    (c) => c.name === activeContributor
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-[1700px] mx-auto px-6 py-5 space-y-6">

        {/* Header */}

        <div className="flex items-center justify-between flex-wrap gap-4">

          <div className="flex items-center gap-3">

            <div className="bg-indigo-100 p-2.5 rounded-xl">
              <Users
                size={22}
                className="text-indigo-600"
              />
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

          {!error && !loading && (
            <TimeRangeFilter
              value={rangeDays}
              onChange={setRangeDays}
            />
          )}

        </div>

        {error ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-500">

            <AlertCircle
              size={24}
              className="mx-auto mb-3 text-red-400"
            />

            {error}

          </div>
        ) : loading ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            Loading contributors...
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