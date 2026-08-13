import { Search, ArrowUpDown, X } from "lucide-react";

const SORT_OPTIONS = [
  { key: "score", label: "Score" },
  { key: "changes", label: "Changes" },
  { key: "additions", label: "Additions" },
  { key: "deletions", label: "Deletions" },
];

export default function HotspotToolbar({ searchTerm, setSearchTerm, sortKey, setSortKey }) {
  return (
    <div className="p-4 border-b border-slate-800/80 shrink-0 flex items-center gap-3 flex-wrap justify-between bg-slate-900/40 backdrop-blur-md">
      {/* Search Input Bar */}
      <div className="relative flex-1 min-w-[220px]">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900/90 border border-slate-800 rounded-xl py-2 pl-9 pr-9 text-xs font-medium text-slate-100 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 hover:border-slate-700"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Sort Buttons Group */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-1">
          <ArrowUpDown size={12} className="text-slate-400" />
          Sort
        </span>
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
          {SORT_OPTIONS.map((opt) => {
            const isActive = sortKey === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setSortKey(opt.key)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 select-none ${
                  isActive
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs shadow-orange-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}