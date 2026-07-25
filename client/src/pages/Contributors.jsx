import { Users, GitCommit, Trophy } from "lucide-react";

const CONTRIBUTORS = [
  {
    name: "Shibnath Maity",
    username: "Shibnath-Maity",
    avatarUrl: "https://i.pravatar.cc/40?img=12",
    role: "Owner",
    commits: 72,
    additions: 2140,
    deletions: 380,
  },
  {
    name: "Ananya Roy",
    username: "ananya-roy",
    avatarUrl: "https://i.pravatar.cc/40?img=32",
    role: "Contributor",
    commits: 18,
    additions: 540,
    deletions: 96,
  },
  {
    name: "Rahul Sen",
    username: "rahul-sen",
    avatarUrl: "https://i.pravatar.cc/40?img=45",
    role: "Contributor",
    commits: 6,
    additions: 210,
    deletions: 34,
  },
];

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function ContributorRow({ contributor, maxCommits }) {
  const sharePct = Math.round((contributor.commits / maxCommits) * 100);

  return (
    <div className="flex items-center gap-4 px-2 py-4 border-b border-slate-100 last:border-0">
      <img
        src={contributor.avatarUrl}
        alt={contributor.name}
        className="h-10 w-10 rounded-full shrink-0"
      />

      <div className="min-w-[160px]">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">{contributor.name}</p>
          {contributor.role === "Owner" && (
            <span className="text-[10px] uppercase font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              Owner
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400">@{contributor.username}</p>
      </div>

      <div className="flex-1 flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full"
            style={{ width: `${sharePct}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 w-10 text-right">{sharePct}%</span>
      </div>

      <div className="hidden sm:flex items-center gap-3 text-xs shrink-0 w-32 justify-end">
        <span className="text-green-600 font-medium">+{contributor.additions}</span>
        <span className="text-red-500 font-medium">-{contributor.deletions}</span>
      </div>

      <div className="text-sm font-semibold text-slate-700 w-20 text-right shrink-0">
        {contributor.commits} commits
      </div>
    </div>
  );
}

function Contributors() {
  const totalContributors = CONTRIBUTORS.length;
  const totalContributions = CONTRIBUTORS.reduce((sum, c) => sum + c.commits, 0);
  const topContributor = [...CONTRIBUTORS].sort((a, b) => b.commits - a.commits)[0];
  const maxCommits = topContributor.commits;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900">Contributors</h1>
      <p className="text-slate-500 mt-2 mb-8">
        Understand who contributes to your project.
      </p>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="Total Contributors"
          value={totalContributors}
          accent="bg-blue-500"
        />
        <StatCard
          icon={GitCommit}
          label="Total Contributions"
          value={totalContributions}
          accent="bg-emerald-500"
        />
        <StatCard
          icon={Trophy}
          label="Most Active Contributor"
          value={topContributor.name}
          accent="bg-orange-500"
        />
      </div>

      {/* Contributors */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        {CONTRIBUTORS.sort((a, b) => b.commits - a.commits).map((contributor) => (
          <ContributorRow
            key={contributor.username}
            contributor={contributor}
            maxCommits={maxCommits}
          />
        ))}
      </div>
    </div>
  );
}

export default Contributors;