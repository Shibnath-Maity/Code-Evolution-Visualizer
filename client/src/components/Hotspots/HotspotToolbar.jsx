import { Search, ArrowUpDown, X } from "lucide-react";

const SORT_OPTIONS = [
  { key: "score", label: "Score" },
  { key: "changes", label: "Changes" },
  { key: "additions", label: "Additions" },
  { key: "deletions", label: "Deletions" },
];

export default function HotspotToolbar({ searchTerm, setSearchTerm, sortKey, setSortKey }) {
  return (
    <div className="flex shrink-0 flex-col gap-2.5 border-b border-slate-800 bg-slate-900/60 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-4">
      {/* Search input */}
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search
          size={14}
          strokeWidth={2}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          type="text"
          inputMode="search"
          placeholder="Search files…"
          aria-label="Search hotspot files"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9 w-full rounded-md border border-slate-800 bg-slate-950/60 py-1.5 pl-8 pr-8 text-[13px] text-slate-200 outline-none transition-colors placeholder:text-slate-600 hover:border-slate-700 focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/30"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            aria-label="Clear search"
            className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
          >
            <X size={13} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Sort controls */}
      <div className="flex min-w-0 items-center gap-2">
        <ArrowUpDown size={13} strokeWidth={2} className="hidden shrink-0 text-slate-500 sm:block" />
        <div
          role="group"
          aria-label="Sort hotspots by"
          className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-md border border-slate-800 bg-slate-950/60 p-0.5 no-scrollbar"
        >
          {SORT_OPTIONS.map((opt) => {
            const isActive = sortKey === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setSortKey(opt.key)}
                aria-pressed={isActive}
                className={`shrink-0 whitespace-nowrap rounded px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500/60 ${
                  isActive
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-500 hover:text-slate-300"
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