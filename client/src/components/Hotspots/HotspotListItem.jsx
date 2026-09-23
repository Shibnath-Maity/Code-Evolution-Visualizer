import { Plus, Minus, GitCommit } from "lucide-react";

const HIGH_THRESHOLD = 0.66;
const MEDIUM_THRESHOLD = 0.33;

function riskLevel(score, maxScore) {
  if (!maxScore) return { label: "Low", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", bar: "bg-emerald-500" };
  const ratio = (score || 0) / maxScore;
  if (ratio > HIGH_THRESHOLD) return { label: "High", badge: "bg-rose-500/10 text-rose-400 border-rose-500/20", bar: "bg-rose-500" };
  if (ratio > MEDIUM_THRESHOLD) return { label: "Medium", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20", bar: "bg-amber-500" };
  return { label: "Low", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", bar: "bg-emerald-500" };
}

function getHeat(score, maxScore) {
  if (!maxScore) return 0;
  return Math.min(100, Math.round(((score || 0) / maxScore) * 100));
}

export default function HotspotListItem({ item, globalIndex, maxScore, isSelected, onSelect }) {
  const risk = riskLevel(item.score, maxScore);
  const heatPct = getHeat(item.score, maxScore);

  const fileName = item.file?.split("/").pop() || item.file;
  const filePath = item.file?.split("/").slice(0, -1).join("/") || "";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-current={isSelected ? "true" : undefined}
      title={item.file}
      onClick={() => onSelect(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(item);
        }
      }}
      className={`group relative flex cursor-pointer select-none items-center gap-3 border-l-2 px-3 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-orange-500/50 sm:px-4 ${
        isSelected
          ? "border-l-orange-500 bg-orange-500/[0.06]"
          : "border-l-transparent hover:bg-slate-800/40"
      }`}
    >
      <span className="hidden w-6 shrink-0 text-right font-mono text-[11px] text-slate-600 sm:block">
        {globalIndex + 1}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 items-baseline gap-1 truncate font-mono text-[13px] leading-tight">
            {filePath && <span className="truncate text-slate-500">{filePath}/</span>}
            <span
              className={`truncate font-medium transition-colors ${
                isSelected ? "text-orange-300" : "text-slate-200 group-hover:text-orange-300"
              }`}
            >
              {fileName}
            </span>
          </div>
          <span
            className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9.5px] font-semibold leading-none ${risk.badge}`}
          >
            {risk.label}
          </span>
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1 w-full max-w-[140px] overflow-hidden rounded-full bg-slate-800/80">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${risk.bar}`}
              style={{ width: `${heatPct}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-slate-500">{heatPct}%</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 font-mono text-[11px] tabular-nums">
        <div className="hidden items-center gap-2 sm:flex">
          <span className="flex items-center gap-0.5 text-emerald-400/90">
            <Plus size={10} strokeWidth={2.5} />
            {(item.additions || 0).toLocaleString()}
          </span>
          <span className="flex items-center gap-0.5 text-rose-400/90">
            <Minus size={10} strokeWidth={2.5} />
            {(item.deletions || 0).toLocaleString()}
          </span>
          <span className="flex items-center gap-0.5 text-slate-500">
            <GitCommit size={10} />
            {(item.changes || 0).toLocaleString()}
          </span>
        </div>

        <span
          className={`min-w-[2.75rem] rounded-md border px-1.5 py-0.5 text-center font-semibold ${
            isSelected
              ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
              : "border-slate-700/60 bg-slate-800/50 text-slate-400"
          }`}
        >
          {(item.score || item.changes || 0).toLocaleString()}
        </span>
      </div>
    </div>
  );
}