import { GitCommit, Plus, Minus } from "lucide-react";

export default function HotspotStats({ totals }) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-4 shrink-0">
      <div className="bg-white rounded-2xl shadow-sm px-5 py-3">
        <p className="text-xs text-gray-400 mb-1">Total changes</p>
        <p className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
          <GitCommit size={15} className="text-gray-400" />
          {totals.changes}
        </p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm px-5 py-3">
        <p className="text-xs text-gray-400 mb-1">Total additions</p>
        <p className="text-lg font-bold text-green-600 flex items-center gap-1.5">
          <Plus size={15} />
          {totals.additions}
        </p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm px-5 py-3">
        <p className="text-xs text-gray-400 mb-1">Total deletions</p>
        <p className="text-lg font-bold text-red-600 flex items-center gap-1.5">
          <Minus size={15} />
          {totals.deletions}
        </p>
      </div>
    </div>
  );
}