import { useMemo, useState } from "react";
import {
  FileCode2,
  Plus,
  Minus,
  GitBranch,
  ArrowUpDown,
  Flame,
  FolderOpen,
} from "lucide-react";

const SORT_OPTIONS = [
  { key: "churn", label: "Churn" },
  { key: "changes", label: "Changes" },
  { key: "additions", label: "Additions" },
  { key: "deletions", label: "Deletions" },
];

const RANK_STYLES = [
  "bg-amber-100 text-amber-700",
  "bg-slate-200 text-slate-600",
  "bg-orange-100 text-orange-700",
];

function riskLevel(churn, maxChurn) {
  if (maxChurn === 0) return { label: "Low", style: "bg-emerald-50 text-emerald-600" };
  const ratio = churn / maxChurn;
  if (ratio > 0.66) return { label: "High", style: "bg-red-50 text-red-600" };
  if (ratio > 0.33) return { label: "Medium", style: "bg-amber-50 text-amber-600" };
  return { label: "Low", style: "bg-emerald-50 text-emerald-600" };
}

function FileAnalysis({ fileAnalysis }) {
  const [sortKey, setSortKey] = useState("churn");

  const files = useMemo(() => {
    const raw = fileAnalysis?.mostChangedFiles || [];
    const withChurn = raw.map((file) => ({
      ...file,
      churn: file.churn ?? (file.additions || 0) + (file.deletions || 0),
    }));
    return [...withChurn].sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));
  }, [fileAnalysis, sortKey]);

  if (!fileAnalysis) {
    return null;
  }

  const maxChurn = files.reduce((max, f) => Math.max(max, f.churn), 0);
  const totalAdditions = files.reduce((sum, f) => sum + (f.additions || 0), 0);
  const totalDeletions = files.reduce((sum, f) => sum + (f.deletions || 0), 0);
  const totalChurn = totalAdditions + totalDeletions;

  return (
    <div className="mt-10 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">File Analysis</h2>
          <p className="text-sm text-gray-500 mt-1">
            Most frequently changed files in this repository
          </p>
        </div>

        <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full">
          <FileCode2 size={18} />
          <span className="font-semibold">
            {fileAnalysis.totalFiles || 0} files
          </span>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-14 text-gray-400">
          <FolderOpen size={32} className="mb-3 text-gray-300" />
          <p className="font-medium text-gray-500">No file analysis available</p>
          <p className="text-sm mt-1">
            Analyze a repository to see which files change the most.
          </p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">Total additions</p>
              <p className="text-lg font-bold text-green-600 flex items-center gap-1">
                <Plus size={16} />
                {totalAdditions}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">Total deletions</p>
              <p className="text-lg font-bold text-red-600 flex items-center gap-1">
                <Minus size={16} />
                {totalDeletions}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">Total churn</p>
              <p className="text-lg font-bold text-slate-700 flex items-center gap-1">
                <Flame size={16} className="text-orange-500" />
                {totalChurn}
              </p>
            </div>
          </div>

          {/* Sort controls */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs text-gray-400 flex items-center gap-1 mr-1">
              <ArrowUpDown size={13} />
              Sort by
            </span>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSortKey(opt.key)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                  sortKey === opt.key
                    ? "bg-purple-600 text-white"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 rounded-lg text-sm font-semibold text-gray-500">
            <div className="col-span-4">File</div>
            <div className="col-span-2 text-center">Changes</div>
            <div className="col-span-2 text-center">Additions</div>
            <div className="col-span-2 text-center">Deletions</div>
            <div className="col-span-1 text-center">Churn</div>
            <div className="col-span-1 text-center">Risk</div>
          </div>

          <div className="space-y-3 mt-3">
            {files.map((file, index) => {
              const risk = riskLevel(file.churn, maxChurn);
              const churnPct = maxChurn > 0 ? Math.round((file.churn / maxChurn) * 100) : 0;

              return (
                <div
                  key={`${file.file}-${index}`}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-4 py-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition"
                >
                  {/* File */}
                  <div className="md:col-span-4 flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        index < 3 ? RANK_STYLES[index] : "bg-purple-50 text-purple-600"
                      }`}
                    >
                      {index < 3 ? index + 1 : <FileCode2 size={16} />}
                    </div>

                    <div className="min-w-0">
                      <p
                        className="font-semibold text-slate-800 truncate"
                        title={file.file}
                      >
                        {file.file}
                      </p>
                      <div className="mt-1.5 h-1.5 w-full max-w-[160px] bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-400 rounded-full"
                          style={{ width: `${churnPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Changes */}
                  <div className="md:col-span-2 text-center">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">
                      <GitBranch size={14} />
                      {file.changes || 0}
                    </span>
                  </div>

                  {/* Additions */}
                  <div className="md:col-span-2 text-center">
                    <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                      <Plus size={15} />
                      {file.additions || 0}
                    </span>
                  </div>

                  {/* Deletions */}
                  <div className="md:col-span-2 text-center">
                    <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                      <Minus size={15} />
                      {file.deletions || 0}
                    </span>
                  </div>

                  {/* Churn */}
                  <div className="md:col-span-1 text-center">
                    <span className="font-bold text-slate-700">{file.churn}</span>
                  </div>

                  {/* Risk */}
                  <div className="md:col-span-1 text-center">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${risk.style}`}
                    >
                      {risk.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default FileAnalysis;