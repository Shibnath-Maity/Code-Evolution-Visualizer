import { useState } from "react";
import {
  Search,
  GitBranch,
  Star,
  GitFork,
  Clock,
  Circle,
} from "lucide-react";

const REPOSITORIES = [
  {
    name: "leetcode-java",
    owner: "Shibnath-Maity",
    description:
      "My Java solutions to LeetCode problems with clean code and optimized approaches.",
    language: "Java",
    languageColor: "bg-orange-500",
    stars: 0,
    forks: 0,
    updatedAt: "2 hours ago",
    avatarUrl: "https://i.pravatar.cc/40?img=12",
  },
  {
    name: "portfolio-website",
    owner: "Shibnath-Maity",
    description: "Personal portfolio built with React, Tailwind and Vite.",
    language: "JavaScript",
    languageColor: "bg-yellow-400",
    stars: 4,
    forks: 1,
    updatedAt: "1 day ago",
    avatarUrl: "https://i.pravatar.cc/40?img=12",
  },
  {
    name: "code-evolution-visualizer",
    owner: "Shibnath-Maity",
    description:
      "Visualize how a GitHub repository evolves over time — commits, contributors and hotspots.",
    language: "TypeScript",
    languageColor: "bg-blue-500",
    stars: 12,
    forks: 3,
    updatedAt: "3 days ago",
    avatarUrl: "https://i.pravatar.cc/40?img=12",
  },
];

function RepositoryCard({ repo }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-slate-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={repo.avatarUrl}
            alt={repo.owner}
            className="h-9 w-9 rounded-full"
          />
          <div>
            <h3 className="font-semibold text-slate-900 leading-tight">
              {repo.name}
            </h3>
            <p className="text-xs text-slate-400">@{repo.owner}</p>
          </div>
        </div>
      <GitBranch className="h-5 w-5 text-slate-300" />
      </div>

      <p className="text-sm text-slate-500 mb-5 line-clamp-2">
        {repo.description}
      </p>

      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Circle className={`h-2.5 w-2.5 fill-current ${repo.languageColor.replace("bg-", "text-")}`} />
          {repo.language}
        </span>
        <span className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5" />
          {repo.stars}
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="h-3.5 w-3.5" />
          {repo.forks}
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <Clock className="h-3.5 w-3.5" />
          {repo.updatedAt}
        </span>
      </div>
    </div>
  );
}

function Repositories() {
  const [query, setQuery] = useState("");

  const filtered = REPOSITORIES.filter((repo) =>
    `${repo.name} ${repo.description} ${repo.language}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900">Repositories</h1>
      <p className="text-slate-500 mt-2 mb-8">
        Manage and explore your analyzed GitHub repositories.
      </p>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 border border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search repositories by name, language, or description..."
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
          />
        </div>
      </div>

      {/* Repository Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((repo) => (
            <RepositoryCard key={repo.name} repo={repo} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400 text-sm">
          No repositories match "{query}".
        </div>
      )}
    </div>
  );
}

export default Repositories;