import { SearchX, Flame, CircleAlert } from "lucide-react";

export default function HotspotEmptyState({ searchTerm }) {
  if (searchTerm) {
    return (
      <div className="flex flex-col items-center justify-center p-8 py-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
        <div className="p-3 bg-white rounded-2xl shadow-xs border border-slate-100 mb-3 text-slate-400">
          <SearchX size={24} />
        </div>
        <p className="text-sm font-semibold text-slate-800">No matching hotspots found</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          No files match your search query <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[11px]">"{searchTerm}"</span>.
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
    <div className="flex flex-col items-center justify-center p-8 py-12 text-center rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50/30 to-slate-50/80 shadow-xs">
      <div className="p-3.5 bg-orange-50 text-orange-500 rounded-2xl border border-orange-100 shadow-xs mb-4">
        <Flame size={24} />
      </div>

      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
        No Hotspot Data Available
      </h3>
      <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
        We couldn't detect any high-churn or risk hotspots for this repository.
      </p>

      {/* Modern Checklist Card */}
      <div className="mt-6 w-full max-w-sm bg-white border border-slate-100/80 rounded-xl p-4 shadow-2xs text-left">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <CircleAlert size={12} className="text-slate-400" /> Possible Reasons
        </p>
        <ul className="space-y-2">
          {reasons.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 leading-snug">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}