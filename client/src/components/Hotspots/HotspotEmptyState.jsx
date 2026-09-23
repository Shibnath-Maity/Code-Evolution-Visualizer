import { SearchX, Flame, CircleAlert } from "lucide-react";

export default function HotspotEmptyState({ searchTerm }) {
  if (searchTerm) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 bg-slate-900/30 px-6 py-10 text-center">
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-500">
          <SearchX size={16} strokeWidth={2} />
        </div>
        <p className="text-[13px] font-semibold text-slate-200">No matching hotspots</p>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
          No files match{" "}
          <span className="rounded border border-slate-800 bg-slate-900/80 px-1.5 py-0.5 font-mono text-[11px] text-slate-400">
            "{searchTerm}"
          </span>
        </p>
      </div>
    );
  }

  const reasons = [
    "The repository has very little commit history.",
    "File-level analytics were not generated.",
    "Hotspots require completed file-change analytics.",
    "The initial repository analysis is still processing.",
  ];

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-900/30 px-6 py-10 text-center">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/10 text-orange-400">
        <Flame size={16} strokeWidth={2} />
      </div>

      <h3 className="text-[13px] font-semibold tracking-tight text-slate-200">
        No hotspot data available
      </h3>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
        No high-churn or risk hotspots were detected for this repository.
      </p>

      {/* Possible reasons */}
      <div className="mt-5 w-full max-w-sm rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 text-left">
        <p className="mb-2.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">
          <CircleAlert size={11} strokeWidth={2} /> Possible reasons
        </p>
        <ul className="space-y-1.5">
          {reasons.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs leading-snug text-slate-400">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-600" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}