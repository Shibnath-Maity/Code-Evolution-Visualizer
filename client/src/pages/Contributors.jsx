import { useEffect, useMemo, useState } from "react";

import TopContributors from "../components/TopContributors";
import ContributorStats from "../components/ContributorStats";
import ContributorDetails from "../components/ContributorDetails";
import ContributorActivity from "../components/ContributorActivity";
import { Users, Search, AlertCircle } from "lucide-react";
import ContributorAI from "../components/ContributorAI";
// import API from "../services/api";
// import ReactMarkdown from "react-markdown";
function getInitial(name) {
  return (name || "U").charAt(0).toUpperCase();
}

function relativeTime(date) {
  if (!date) return "";

  const diff = Date.now() - new Date(date).getTime();

  const mins = Math.floor(diff / 60000);

  if (mins < 60) return `${mins} min ago`;

  const hrs = Math.floor(mins / 60);

  if (hrs < 24) return `${hrs} hr ago`;

  const days = Math.floor(hrs / 24);

  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;

  return new Date(date).toLocaleDateString();
}
function Contributors() {
  const [contributors, setContributors] = useState({});
  const [allCommits, setAllCommits] = useState([]);
  const [selectedContributor, setSelectedContributor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeContributor, setActiveContributor] = useState(null);
  // const repoUrl = localStorage.getItem("repoUrl");

  // Fetch contributors
 useEffect(() => {
  const analysis = JSON.parse(
    localStorage.getItem("repositoryAnalysis")
  );

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


  // Sorted contributor list, total commits, and filtered results —
  // recomputed only when the underlying data or search term changes.
  const { filteredContributors, totalCommits } = useMemo(() => {
    const list = Object.values(contributors).sort(
      (a, b) => (b.commits || 0) - (a.commits || 0)
    );

    const total = list.reduce((sum, c) => sum + (c.commits || 0), 0);

    const filtered = list.filter((c) =>
      (c.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return { filteredContributors: filtered, totalCommits: total };
  }, [contributors, searchTerm]);

 const contributorList = useMemo(() => {
  return Object.values(contributors).sort(
    (a, b) => (b.commits || 0) - (a.commits || 0)
  );
}, [contributors]);

const contributorSummary = useMemo(() => {
  const totalContributors = contributorList.length;
  const totalCommits = contributorList.reduce(
    (sum, c) => sum + (c.commits || 0),
    0
  );

  const topContributor = contributorList[0];

  const averageCommits =
    totalContributors === 0
      ? 0
      : (totalCommits / totalContributors).toFixed(1);

  return {
    totalContributors,
    totalCommits,
    averageCommits,
    topContributor,
  };
}, [contributorList]);
const contributorLastCommit = useMemo(() => {
  const map = {};

  allCommits.forEach((commit) => {
    if (!commit.author || !commit.date) return;

    if (
      !map[commit.author] ||
      new Date(commit.date) > new Date(map[commit.author].date)
    ) {
      map[commit.author] = commit;
    }
  });

  return map;
}, [allCommits]);
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-3 rounded-xl">
              <Users size={28} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Contributors</h1>
              <p className="text-gray-500 mt-1">
                People who contributed to this repository
              </p>
            </div>
          </div>
        </div>

        <ContributorStats contributors={contributorList} />

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Search contributors..."
              aria-label="Search contributors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div className="mb-6">
          <TopContributors contributors={contributorList} />
        </div>

        {/* All Contributors */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b">
  <div className="flex items-center justify-between flex-wrap gap-3">

    <div>
      <h2 className="text-xl font-bold text-slate-900">
        All Contributors
      </h2>

      <p className="text-sm text-gray-500 mt-1">
        {contributorSummary.totalContributors} contributors
        <span className="mx-2">•</span>

        {contributorSummary.totalCommits} commits

        <span className="mx-2">•</span>

        Avg {contributorSummary.averageCommits} commits/person
      </p>
    </div>

    {contributorSummary.topContributor && (
      <div className="text-sm text-gray-500">
        🏆 Top Contributor:
        <span className="font-semibold text-slate-900 ml-1">
          {contributorSummary.topContributor.name}
        </span>
      </div>
    )}

  </div>
</div>

          {error ? (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
              <AlertCircle size={24} className="text-red-400" />
              <p>{error}</p>
            </div>
          ) : loading ? (
            <div className="p-8 text-center text-gray-500">Loading contributors...</div>
          ) : filteredContributors.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No contributors found.</div>
          ) : (
            <div className="divide-y">
              {filteredContributors.map((contributor, index) => {
                const commits = contributor.commits || 0;
                const percentage =
                  totalCommits > 0 ? ((commits / totalCommits) * 100).toFixed(1) : 0;
                const key = contributor.name || `contributor-${index}`;

                return (
                  <div
                    key={key}
                    role="button"
                    tabIndex={0}
                   onClick={() => {
  setSelectedContributor(contributor.name);
  setActiveContributor(contributor.name);
}}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedContributor(contributor.name);
                        setActiveContributor(contributor.name);
                      }
                    }}
                    aria-label={`View details for ${contributor.name || "unknown contributor"}`}
                    className="px-6 py-5 hover:bg-gray-50 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-300"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0"
                          aria-hidden="true"
                        >
                          {getInitial(contributor.name)}
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 truncate">
                            {contributor.name || "Unknown Contributor"}
                          </h3>
                        <div className="space-y-1">
  <p className="text-sm text-gray-500">
    {index === 0 && "🥇 Top Contributor"}
    {index === 1 && "🥈 Second Contributor"}
    {index === 2 && "🥉 Third Contributor"}
    {index > 2 && `Rank #${index + 1}`}
  </p>

  {contributorLastCommit[contributor.name] && (
    <p className="text-xs text-gray-400">
      Last commit •{" "}
      {relativeTime(contributorLastCommit[contributor.name].date)}
    </p>
  )}
</div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-bold text-slate-900">{commits}</p>
                        <p className="text-xs text-gray-500">commits</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Contribution</span>
                        <span>{percentage}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
{activeContributor && (
  <>
    <ContributorActivity
      contributorName={activeContributor}
      allCommits={allCommits}
    />
    <ContributorAI
      contributorName={activeContributor}
      allCommits={allCommits}
    />
  </>
)}
       <ContributorDetails
          selectedContributor={selectedContributor}
          allCommits={allCommits}
          onClose={() => {
            setSelectedContributor(null);
            setActiveContributor(null);
          }}
        />   
      </div>
    </div>
  );
}

export default Contributors;