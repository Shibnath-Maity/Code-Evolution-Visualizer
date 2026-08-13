import { ChevronLeft, ChevronRight } from "lucide-react";

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const withEllipsis = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) withEllipsis.push("...");
    withEllipsis.push(p);
  });
  return withEllipsis;
}

export default function HotspotPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  pageNumbers,
  onPageChange,
}) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="border-t border-slate-800/80 shrink-0 px-4 py-3 flex items-center justify-between bg-slate-900/40 backdrop-blur-md">
      {/* Range Display */}
      <div className="text-xs font-medium text-slate-400 select-none">
        Showing <span className="font-semibold text-slate-200">{start}</span>–
        <span className="font-semibold text-slate-200">{end}</span> of{" "}
        <span className="font-semibold text-slate-200">{totalItems}</span>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-1.5 select-none">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || totalPages === 0}
          aria-label="Previous Page"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all duration-200"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page Buttons */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((p, i) =>
            p === "..." ? (
              <span key={`dots-${i}`} className="px-1.5 text-xs text-slate-500 font-mono">
                •••
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-7 h-7 text-xs font-bold rounded-lg transition-all duration-200 ${
                  currentPage === p
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs shadow-orange-500/20"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/80"
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          aria-label="Next Page"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all duration-200"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export { getPageNumbers };