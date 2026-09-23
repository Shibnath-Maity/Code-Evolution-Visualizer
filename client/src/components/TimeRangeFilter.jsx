import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronDown, SlidersHorizontal } from "lucide-react";

export const RANGE_OPTIONS = [
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last 6 months", days: 180 },
  { label: "Last 12 months", days: 365 },
  { label: "All time", days: null },
];

export default function TimeRangeFilter({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const current = RANGE_OPTIONS.find((r) => r.days === value) || RANGE_OPTIONS[1];

  // Close on outside click and on Escape — a dropdown that only opens
  // isn't actually workable.
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <div className="relative flex-1 sm:flex-initial" ref={containerRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto text-[12.5px] font-medium text-[#C7CCD6] border border-white/[0.08] rounded-[8px] px-3 py-2.5 sm:py-2 bg-[#10151C] hover:bg-white/[0.04] hover:border-white/[0.14] transition-colors duration-150 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
        >
          <span className="flex items-center gap-2 min-w-0">
            <Calendar size={13} className="text-[#7C8698] shrink-0" />
            <span className="truncate">{current.label}</span>
          </span>
          <ChevronDown
            size={13}
            className={`text-[#7C8698] shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div
            role="listbox"
            className="absolute right-0 mt-1.5 bg-[#151B24] border border-white/[0.08] rounded-[10px] shadow-lg shadow-black/40 py-1 z-20 w-full sm:w-44"
          >
            {RANGE_OPTIONS.map((r) => {
              const selected = r.days === value;
              return (
                <button
                  key={r.label}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(r.days);
                    setOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 text-[12.5px] transition-colors duration-100 ${
                    selected
                      ? "text-sky-400 font-medium bg-sky-400/[0.06]"
                      : "text-[#C7CCD6] hover:bg-white/[0.05]"
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        aria-label="More filters"
        className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center shrink-0 border border-white/[0.08] rounded-[8px] bg-[#10151C] hover:bg-white/[0.04] hover:border-white/[0.14] transition-colors duration-150 text-[#7C8698] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
      >
        <SlidersHorizontal size={14} />
      </button>
    </div>
  );
}