import { useState } from "react";
import API from "../services/api";
import axios from "axios";
import {
  Search,
  GitBranch,

  Star,
  GitFork,
  Clock,
  Circle,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

const REPOSITORIES = [
  {
    id:1,
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
    id:2,
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
    id:3,
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

const GITHUB_URL_REGEX = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/;
//Repository card
function RepositoryCard({ repo }) {

  const color = (repo.languageColor || "bg-gray-500").replace(
    "bg-",
    "text-"
  );

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
          <Circle className={`h-2.5 w-2.5 fill-current ${color}`} />
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
  const [repoUrl, setRepoUrl] = useState("");
  const [repositories, setRepositories] = useState(REPOSITORIES);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");

  // ADD repo
  const addRepository = async () => {
    const trimmedUrl = repoUrl.trim();

    if (!trimmedUrl) {
      setError("Please enter a GitHub repository URL.");
      return;
    }

    if (!GITHUB_URL_REGEX.test(trimmedUrl)) {
      setError("Enter a valid GitHub repository URL, e.g. https://github.com/user/repo");
      return;
    }

    // const alreadyAdded = repositories.some(
    //   (repo) => `https://github.com/${repo.owner}/${repo.name}`.toLowerCase() === trimmedUrl.toLowerCase()
    // );
    // if (alreadyAdded) {
    //   setError("This repository has already been added.");
    //   return;
    // }

    setError("");
    setIsAdding(true);

  try {
  console.log("Fetching repository:", trimmedUrl);

  const response = await API.get("/repository/repo-info", {
    params: {
      url: trimmedUrl,
    },
  });

  console.log("Repository data:", response.data);

  const newRepo = response.data;

  // Check duplicate using GitHub ID
  const alreadyExists = repositories.some(
    (repo) => repo.id === newRepo.id
  );

  if (alreadyExists) {
    setError("Repository already added.");
    return;
  }

  setRepositories((prev) => [newRepo, ...prev]);
  setRepoUrl("");

} catch (err) {
  console.error("Failed to add repository:", err);
  console.error("Backend:", err.response?.data);

  setError(
    err.response?.data?.message ||
      "Failed to fetch repository. Please check the URL and try again."
  );
} finally {
  setIsAdding(false);
}};

  const filtered = repositories.filter((repo) =>
   `${repo.name} ${repo.owner} ${repo.description} ${repo.language}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900">Repositories</h1>
      <p className="text-slate-500 mt-2 mb-8">
        Manage and explore your analyzed GitHub repositories.
      </p>

      {/* Add Repository */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 border border-slate-100">
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50">
            <FaGithub className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => {
                setRepoUrl(e.target.value);
                if (error) setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && addRepository()}
              placeholder="Paste GitHub repository URL..."
              className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
            />
          </div>

          <button
            onClick={addRepository}
            disabled={!repoUrl.trim() || isAdding}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {isAdding ? "Adding..." : "Add Repository"}
          </button>
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-500 mt-2 ml-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        )}
      </div>

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
  <RepositoryCard
    key={repo.id || `${repo.owner}-${repo.name}`}
    repo={repo}
  />
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