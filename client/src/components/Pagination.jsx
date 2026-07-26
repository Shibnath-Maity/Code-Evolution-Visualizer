import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

// Builds a compact page list like:
// 1 … 4 5 [6] 7 8 … 24
function buildPageList(currentPage, totalPages, siblingCount = 1) {
  const totalNumbers = siblingCount * 2 + 5;

  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(
    currentPage + siblingCount,
    totalPages
  );

  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < totalPages - 1;

  const pages = [1];

  if (showLeftDots) {
    pages.push("left-ellipsis");
  }

  for (let p = leftSibling; p <= rightSibling; p++) {
    if (p !== 1 && p !== totalPages) {
      pages.push(p);
    }
  }

  if (showRightDots) {
    pages.push("right-ellipsis");
  }

  pages.push(totalPages);

  return pages;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  const pages = buildPageList(currentPage, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-2 mt-8 flex-wrap"
    >
      {/* Previous */}
      <button
        onClick={() =>
          onPageChange(Math.max(currentPage - 1, 1))
        }
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={15} />
        Previous
      </button>

      {/* Page numbers */}
      {pages.map((page, index) =>
        typeof page === "number" ? (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            aria-label={`Go to page ${page}`}
            aria-current={
              currentPage === page ? "page" : undefined
            }
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
              currentPage === page
                ? "bg-blue-600 text-white"
                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {page}
          </button>
        ) : (
          <span
            key={`${page}-${index}`}
            aria-hidden="true"
            className="w-9 h-9 flex items-center justify-center text-gray-300"
          >
            <MoreHorizontal size={16} />
          </span>
        )
      )}

      {/* Next */}
      <button
        onClick={() =>
          onPageChange(
            Math.min(currentPage + 1, totalPages)
          )
        }
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next
        <ChevronRight size={15} />
      </button>
    </nav>
  );
}