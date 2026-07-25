import { useState } from "react";
import { Search, GitCommit, Clock, ChevronDown } from "lucide-react";

const COMMITS = [
  {
    hash: "a1b2c3d",
    message: "Updated dashboard UI and stats cards",
    author: "Shibnath Maity",
    avatarUrl: "https://i.pravatar.cc/40?img=12",
    date: "2 hours ago",
    additions: 84,
    deletions: 12,
  },
  {
    hash: "d4e5f6a",
    message: "Fixed API response handling",
    author: "Shibnath Maity",
    avatarUrl: "https://i.pravatar.cc/40?img=12",
    date: "Yesterday",
    additions: 31,
    deletions: 9,
  },
  {
    hash: "f7a8b9c",
    message: "Added commit timeline chart",
    author: "Shibnath Maity",
    avatarUrl: "https://i.pravatar.cc/40?img=12",
    date: "2 days ago",
    additions: 156,
    deletions: 4,
  },
  {
    hash: "c1d2e3f",
    message: "Improved repository analysis logic",
    author: "Shibnath Maity",
    avatarUrl: "https://i.pravatar.cc/40?img=12",
    date: "3 days ago",
    additions: 62,
    deletions: 27,
  },
  {
    hash: "e4f5g6h",
    message: "Initial commit",
    author: "Shibnath Maity",
    avatarUrl: "https://i.pravatar.cc/40?img=12",
    date: "May 18, 2024",
    additions: 320,
    deletions: 0,
  },
];

function CommitCard({ commit }) {
  return (
    <div className="flex items-center gap-4 px-2 py-4 border-b border-slate-100 last:border-0">
      <img
        src={commit.avatarUrl}
        alt={commit.author}
        className="h-9 w-9 rounded-full shrink-0"
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">
          {commit.message}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
          <span>{commit.author}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {commit.date}
          </span>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-3 text-xs shrink-0">
        <span className="text-green-600 font-medium">+{commit.additions}</span>
        <span className="text-red-500 font-medium">-{commit.deletions}</span>
      </div>

      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md shrink-0">
        <GitCommit className="h-3 w-3" />
        {commit.hash}
      </div>
    </div>
  );
}

function Commits() {
  const [query, setQuery] = useState("");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);

  const filtered = COMMITS.filter((commit) =>
    `${commit.message} ${commit.author} ${commit.hash}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  const sorted = sortNewestFirst ? filtered : [...filtered].reverse();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900">Commits</h1>
      <p className="text-slate-500 mt-2 mb-8">
        Explore the complete commit history of your repository.
      </p>

      {/* Search / Filter */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 border border-slate-100 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commits by message, author, or hash..."
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
          />
        </div>

        <button
          onClick={() => setSortNewestFirst((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
        >
          {sortNewestFirst ? "Newest first" : "Oldest first"}
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Commit List */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
        {sorted.length > 0 ? (
          sorted.map((commit) => <CommitCard key={commit.hash} commit={commit} />)
        ) : (
          <div className="text-center py-16 text-slate-400 text-sm">
            No commits match "{query}".
          </div>
        )}
      </div>
    </div>
  );
}

export default Commits;