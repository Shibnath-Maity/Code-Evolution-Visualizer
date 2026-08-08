import { FileText, Plus, Minus, GitCommit } from "lucide-react";

const HIGH_THRESHOLD = 0.66;
const MEDIUM_THRESHOLD = 0.33;

function riskLevel(score, maxScore) {
  if (!maxScore) return { label: "Low", style: "bg-emerald-50 text-emerald-600" };
  const ratio = (score || 0) / maxScore;
  if (ratio > HIGH_THRESHOLD) return { label: "High", style: "bg-red-50 text-red-600" };
  if (ratio > MEDIUM_THRESHOLD) return { label: "Medium", style: "bg-amber-50 text-amber-600" };
  return { label: "Low", style: "bg-emerald-50 text-emerald-600" };
}

function getHeat(score, maxScore) {
  if (!maxScore) return 0;
  return Math.round(((score || 0) / maxScore) * 100);
}

export default function HotspotListItem({ item, globalIndex, maxScore, isSelected, onSelect }) {
  const risk = riskLevel(item.score, maxScore);
  const heatPct = getHeat(item.score, maxScore);

  return (
    <div
      onClick={() => onSelect(item)}
      className={`px-5 py-3.5 hover:bg-gray-50 transition cursor-pointer ${
        isSelected ? "bg-orange-50/60" : ""
      }`}
    >
      <div className="flex justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <FileText size={17} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className="font-semibold text-slate-900 text-sm truncate max-w-[260px]"
                title={item.file}
              >
                {item.file}
              </h3>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${risk.style}`}
              >
                {risk.label} risk
              </span>
            </div>
            <p className="text-xs text-gray-500">Rank #{globalIndex + 1}</p>
            <div className="mt-1.5 h-1.5 w-full max-w-[220px] bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-400 rounded-full"
                style={{ width: `${heatPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-orange-600">
            {item.score || item.changes || 0}
          </p>
          <p className="text-[11px] text-gray-500">changes</p>
        </div>
      </div>

      <div className="flex gap-5 mt-2.5 text-xs">
        <span className="flex items-center gap-1 text-green-600">
          <Plus size={12} />
          {item.additions || 0}
        </span>
        <span className="flex items-center gap-1 text-red-600">
          <Minus size={12} />
          {item.deletions || 0}
        </span>
        <span className="flex items-center gap-1 text-gray-500">
          <GitCommit size={12} />
          {item.changes || 0} commits
        </span>
      </div>
    </div>
  );
}