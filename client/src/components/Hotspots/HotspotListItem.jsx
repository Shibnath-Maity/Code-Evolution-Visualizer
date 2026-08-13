import { FileCode2, Plus, Minus, GitCommit, ChevronRight } from "lucide-react";

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
      onClick={() => onSelect(item)}
      className={`group relative px-5 py-4 transition-all duration-200 cursor-pointer border-b border-slate-800/60 last:border-0 select-none ${
        isSelected
          ? "bg-orange-500/10 border-l-4 border-l-orange-500 pl-4"
          : "hover:bg-slate-800/40 border-l-4 border-l-transparent"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        {/* File & Details */}
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-200 ${
              isSelected
                ? "bg-orange-500 text-white border-orange-400 shadow-md scale-105"
                : "bg-slate-800 text-slate-300 border-slate-700/60 group-hover:bg-orange-500/20 group-hover:text-orange-400 group-hover:border-orange-500/30"
            }`}
          >
            <FileCode2 size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/60">
                #{globalIndex + 1}
              </span>

              {/* HIGH CONTRAST FILE NAME */}
              <h3
                className="font-extrabold text-white text-sm truncate tracking-tight group-hover:text-orange-400 transition-colors"
                title={item.file}
              >
                {fileName}
              </h3>

              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${risk.badge}`}
              >
                {risk.label}
              </span>
            </div>

            {/* CLEAR FILE PATH */}
            {filePath && (
              <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                {filePath}/
              </p>
            )}

            {/* Heat level bar */}
            <div className="mt-2.5 flex items-center gap-2">
              <div className="h-1.5 w-full max-w-[180px] bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/30">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${risk.bar}`}
                  style={{ width: `${heatPct}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-400">{heatPct}%</span>
            </div>
          </div>
        </div>

        {/* Change Count & Quick Stats */}
        <div className="text-right shrink-0 flex items-center gap-3">
          <div>
            <p className="text-base font-extrabold text-slate-100 tracking-tight">
              {(item.score || item.changes || 0).toLocaleString()}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              changes
            </p>
          </div>
          <ChevronRight
            size={16}
            className={`text-slate-500 transition-transform duration-200 ${
              isSelected ? "translate-x-0.5 text-orange-400" : "group-hover:text-slate-300 group-hover:translate-x-0.5"
            }`}
          />
        </div>
      </div>

      {/* Code Churn Metrics */}
      <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-dashed border-slate-800/80 text-xs font-semibold">
        <span className="flex items-center gap-1 text-emerald-400">
          <Plus size={11} className="stroke-[3]" />
          {(item.additions || 0).toLocaleString()}
        </span>
        <span className="flex items-center gap-1 text-rose-400">
          <Minus size={11} className="stroke-[3]" />
          {(item.deletions || 0).toLocaleString()}
        </span>
        <span className="flex items-center gap-1 text-slate-400 font-medium ml-auto">
          <GitCommit size={12} className="text-slate-400" />
          {(item.changes || 0).toLocaleString()} commits
        </span>
      </div>
    </div>
  );
}