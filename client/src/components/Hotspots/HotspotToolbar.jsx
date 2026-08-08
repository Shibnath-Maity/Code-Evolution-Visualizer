import { Search, ArrowUpDown } from "lucide-react";

const SORT_OPTIONS = [
  { key: "score", label: "Score" },
  { key: "changes", label: "Changes" },
  { key: "additions", label: "Additions" },
  { key: "deletions", label: "Deletions" },
];

export default function HotspotToolbar({ searchTerm, setSearchTerm, sortKey, setSortKey }) {
  return (
    <div className="p-4 border-b shrink-0 flex items-center gap-3 flex-wrap justify-between">
      <div className="relative flex-1 min-w-[200px]">
        <Search
          size={17}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-200 rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
        />
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-gray-400 flex items-center gap-1 mr-1">
          <ArrowUpDown size={12} />
          Sort
        </span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortKey(opt.key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              sortKey === opt.key
                ? "bg-orange-500 text-white"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}