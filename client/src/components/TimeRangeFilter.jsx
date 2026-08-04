import { useState } from "react";
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
  const current = RANGE_OPTIONS.find((r) => r.days === value) || RANGE_OPTIONS[1];

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-2 bg-white hover:bg-gray-50 transition"
        >
          <Calendar size={13} className="text-gray-400" />
          {current.label}
          <ChevronDown size={13} className="text-gray-400" />
        </button>
        {open && (
          <div className="absolute right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-20 w-40">
            {RANGE_OPTIONS.map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => {
                  onChange(r.days);
                  setOpen(false);
                }}
                className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-indigo-50 ${
                  r.days === value ? "text-indigo-600 font-medium" : "text-gray-600"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        aria-label="More filters"
        className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition text-gray-400"
      >
        <SlidersHorizontal size={14} />
      </button>
    </div>
  );
}
