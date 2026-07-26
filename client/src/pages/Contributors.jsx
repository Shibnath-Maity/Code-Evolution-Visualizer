import { useEffect, useState } from "react";
import {
  Users,
  GitCommit,
  Trophy,
  Search,
} from "lucide-react";
import API from "../services/api";
import ContributorDetails from "../components/ContributorDetails";
function Contributors() {
  const [contributors, setContributors] = useState({});
  const [allCommits, setAllCommits] = useState([]);
const [selectedContributor, setSelectedContributor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const repoUrl = localStorage.getItem("repoUrl");

  useEffect(() => {
    if (!repoUrl) return;

    const fetchContributors = async () => {
      try {
        setLoading(true);

        const response = await API.post("/repository/analytics", {
          url: repoUrl,
        });

        setContributors(response.data.contributors || {});
        setAllCommits(response.data.allCommits || []);
      } catch (error) {
        console.error("Failed to load contributors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContributors();
  }, [repoUrl]);

  const contributorList = Object.entries(contributors)
    .map(([name, commits]) => ({
      name,
      commits,
    }))
    .sort((a, b) => b.commits - a.commits);

  const filteredContributors = contributorList.filter((contributor) =>
    contributor.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const totalCommits = contributorList.reduce(
    (total, contributor) => total + contributor.commits,
    0
  );

  const topContributor = contributorList[0];

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-3 rounded-xl">
              <Users
                size={28}
                className="text-indigo-600"
              />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Contributors
              </h1>

              <p className="text-gray-500 mt-1">
                People who contributed to this repository
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          {/* Contributors */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">
                  Total Contributors
                </p>

                <h2 className="text-3xl font-bold text-slate-900 mt-2">
                  {contributorList.length}
                </h2>
              </div>

              <div className="bg-indigo-100 p-3 rounded-xl">
                <Users
                  size={22}
                  className="text-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Total commits */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">
                  Total Commits
                </p>

                <h2 className="text-3xl font-bold text-slate-900 mt-2">
                  {totalCommits}
                </h2>
              </div>

              <div className="bg-green-100 p-3 rounded-xl">
                <GitCommit
                  size={22}
                  className="text-green-600"
                />
              </div>
            </div>
          </div>

          {/* Top contributor */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <p className="text-sm text-gray-500">
                  Top Contributor
                </p>

                <h2 className="text-xl font-bold text-slate-900 mt-2 truncate">
                  {topContributor?.name || "N/A"}
                </h2>

                {topContributor && (
                  <p className="text-sm text-gray-500 mt-1">
                    {topContributor.commits} commits
                  </p>
                )}
              </div>

              <div className="bg-yellow-100 p-3 rounded-xl">
                <Trophy
                  size={22}
                  className="text-yellow-600"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
          <div className="relative max-w-md">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search contributors..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="
                w-full
                border
                border-gray-200
                rounded-xl
                py-3
                pl-10
                pr-4
                text-sm
                outline-none
                focus:border-indigo-400
                focus:ring-4
                focus:ring-indigo-100
              "
            />

          </div>
        </div>

        {/* Contributors */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

          <div className="px-6 py-5 border-b">
            <h2 className="text-xl font-bold text-slate-900">
              All Contributors
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading contributors...
            </div>
          ) : filteredContributors.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No contributors found.
            </div>
          ) : (
            <div className="divide-y">

              {filteredContributors.map(
                (contributor, index) => {

                  const percentage =
                    totalCommits > 0
                      ? (
                          (contributor.commits /
                            totalCommits) *
                          100
                        ).toFixed(1)
                      : 0;

                  return (
                   <div
  key={contributor.name}
  onClick={() => setSelectedContributor(contributor.name)}
  className="
    px-6
    py-5
    hover:bg-gray-50
    transition
    cursor-pointer
  "
>

                      <div className="flex items-center justify-between gap-4">

                        {/* User */}
                        <div className="flex items-center gap-4 min-w-0">

                          <div
                            className="
                              w-11
                              h-11
                              rounded-full
                              bg-indigo-100
                              text-indigo-700
                              flex
                              items-center
                              justify-center
                              font-bold
                              shrink-0
                            "
                          >
                            {contributor.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">

                            <h3 className="font-semibold text-slate-900 truncate">
                              {contributor.name}
                            </h3>

                            <p className="text-sm text-gray-500">
                              Contributor #{index + 1}
                            </p>

                          </div>

                        </div>

                        {/* Commits */}
                        <div className="text-right shrink-0">

                          <p className="font-bold text-slate-900">
                            {contributor.commits}
                          </p>

                          <p className="text-xs text-gray-500">
                            commits
                          </p>

                        </div>

                      </div>

                      {/* Progress */}
                      <div className="mt-4">

                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Contribution</span>
                          <span>{percentage}%</span>
                        </div>

                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">

                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>
         <ContributorDetails
          selectedContributor={selectedContributor}
          allCommits={allCommits}
          onClose={() => setSelectedContributor(null)}
        />


      </div>
    </div>
  );
}

export default Contributors;