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
    <div className="flex shrink-0 flex-col gap-2 border-t border-slate-800 bg-slate-900/60 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      {/* Range display */}
      <div className="order-2 text-center font-mono text-[11px] text-slate-500 sm:order-1 sm:text-left">
        <span className="text-slate-300">{start}</span>–
        <span className="text-slate-300">{end}</span> of{" "}
        <span className="text-slate-300">{totalItems}</span>
      </div>

      {/* Navigation controls */}
      <div className="order-1 flex items-center justify-center gap-1 sm:order-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || totalPages === 0}
          aria-label="Previous page"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-800 text-slate-400 transition-colors hover:enabled:border-slate-700 hover:enabled:bg-slate-800 hover:enabled:text-slate-200 disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500/60"
        >
          <ChevronLeft size={14} strokeWidth={2} />
        </button>

        <div className="flex max-w-[45vw] items-center gap-0.5 overflow-x-auto no-scrollbar sm:max-w-none">
          {pageNumbers.map((p, i) =>
            p === "..." ? (
              <span
                key={`dots-${i}`}
                className="flex h-8 w-6 shrink-0 items-center justify-center text-xs text-slate-600"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={p === currentPage ? "page" : undefined}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-mono text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500/60 ${
                  currentPage === p
                    ? "border border-orange-500/30 bg-orange-500/10 text-orange-400"
                    : "border border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          aria-label="Next page"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-800 text-slate-400 transition-colors hover:enabled:border-slate-700 hover:enabled:bg-slate-800 hover:enabled:text-slate-200 disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500/60"
        >
          <ChevronRight size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export { getPageNumbers };