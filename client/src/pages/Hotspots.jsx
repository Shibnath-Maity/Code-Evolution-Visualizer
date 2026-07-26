import { useEffect, useMemo, useState } from "react";
import HotspotDetails from "../components/HotspotDetails";
import {
  Flame,
  Search,
  FileText,
  GitCommit,
  Plus,
  Minus,
  AlertTriangle,
  RefreshCw,
  ArrowUpDown,
  
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

import API from "../services/api";

const SORT_OPTIONS = [
  { key: "score", label: "Score" },
  { key: "changes", label: "Changes" },
  { key: "additions", label: "Additions" },
  { key: "deletions", label: "Deletions" },
];

function riskLevel(score, maxScore) {
  if (!maxScore) return { label: "Low", style: "bg-emerald-50 text-emerald-600" };
  const ratio = score / maxScore;
  if (ratio > 0.66) return { label: "High", style: "bg-red-50 text-red-600" };
  if (ratio > 0.33) return { label: "Medium", style: "bg-amber-50 text-amber-600" };
  return { label: "Low", style: "bg-emerald-50 text-emerald-600" };
}

function SkeletonRow() {
  return (
    <div className="px-6 py-5 animate-pulse">
      <div className="flex justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-1/5" />
          </div>
        </div>
        <div className="h-6 w-10 bg-gray-100 rounded shrink-0" />
      </div>
    </div>
  );
}

function Hotspots() {
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("score");
const [selectedFile, setSelectedFile] = useState(null);
  const repoUrl = localStorage.getItem("repoUrl");

  const fetchHotspots = async () => {
    if (!repoUrl) return;

    try {
      setLoading(true);
      setError(null);

      const response = await API.post("/repository/analytics", {
        url: repoUrl,
      });

      setHotspots(response.data.hotspots || []);
    } catch (err) {
      console.error("Failed to load hotspots:", err);
      setError(
        err.response?.data?.message ||
          "Something went wrong while analyzing hotspots. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotspots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoUrl]);

  const scoredHotspots = useMemo(
    () =>
      hotspots.map((item) => ({
        ...item,
        score: item.score ?? item.changes ?? 0,
      })),
    [hotspots]
  );

  const maxScore = useMemo(
    () => scoredHotspots.reduce((max, item) => Math.max(max, item.score || 0), 0),
    [scoredHotspots]
  );

  const filteredHotspots = useMemo(() => {
    const filtered = scoredHotspots.filter((item) =>
      item.file?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return [...filtered].sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));
  }, [scoredHotspots, searchTerm, sortKey]);

  const totals = useMemo(
    () => ({
      additions: hotspots.reduce((sum, i) => sum + (i.additions || 0), 0),
      deletions: hotspots.reduce((sum, i) => sum + (i.deletions || 0), 0),
      changes: hotspots.reduce((sum, i) => sum + (i.changes || 0), 0),
    }),
    [hotspots]
  );

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-xl">
              <Flame size={28} className="text-orange-600" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-slate-900">Code Hotspots</h1>
              <p className="text-gray-500 mt-1">Files that change most frequently</p>
            </div>
          </div>
        </div>

        {/* No repo selected */}
        {!repoUrl ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <FaGithub size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-slate-700">No repository selected</p>
            <p className="text-sm text-gray-500 mt-1">
              Analyze a repository first to see its hotspots.
            </p>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            {!loading && !error && hotspots.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                <div className="bg-white rounded-2xl shadow-sm px-5 py-4">
                  <p className="text-xs text-gray-400 mb-1">Total changes</p>
                  <p className="text-xl font-bold text-slate-900 flex items-center gap-1.5">
                    <GitCommit size={16} className="text-gray-400" />
                    {totals.changes}
                  </p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm px-5 py-4">
                  <p className="text-xs text-gray-400 mb-1">Total additions</p>
                  <p className="text-xl font-bold text-green-600 flex items-center gap-1.5">
                    <Plus size={16} />
                    {totals.additions}
                  </p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm px-5 py-4">
                  <p className="text-xs text-gray-400 mb-1">Total deletions</p>
                  <p className="text-xl font-bold text-red-600 flex items-center gap-1.5">
                    <Minus size={16} />
                    {totals.deletions}
                  </p>
                </div>
              </div>
            )}

            {/* Search + sort */}
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 flex items-center gap-3 flex-wrap justify-between">
              <div className="relative max-w-md flex-1 min-w-[220px]">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
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
                        ? "bg-orange-500 text-white"
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hotspots list */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Most Changed Files</h2>
                {!loading && !error && (
                  <button
                    onClick={fetchHotspots}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 transition-colors"
                  >
                    <RefreshCw size={14} />
                    Refresh
                  </button>
                )}
              </div>

              {loading ? (
                <div className="divide-y">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </div>
              ) : error ? (
                <div className="p-10 text-center">
                  <AlertTriangle size={28} className="mx-auto mb-3 text-red-400" />
                  <p className="font-medium text-slate-700">{error}</p>
                  <button
                    onClick={fetchHotspots}
                    className="mt-4 inline-flex items-center gap-1.5 bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <RefreshCw size={14} />
                    Try again
                  </button>
                </div>
              ) : filteredHotspots.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {searchTerm
                    ? `No files match "${searchTerm}".`
                    : "No hotspot files found."}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredHotspots.map((item, index) => {
                    const risk = riskLevel(item.score, maxScore);
                    const heatPct = maxScore > 0 ? Math.round((item.score / maxScore) * 100) : 0;

                    return (
//                      <div
//   key={item.file || index}
//   onClick={() => setSelectedFile(item)}
//   className="px-6 py-5 hover:bg-gray-50 transition cursor-pointer"
// >
<div
  key={item.file || index}
  onClick={() => {
    console.log("HOTSPOT CLICKED:", item);
    setSelectedFile(item);
  }}
  className="px-6 py-5 hover:bg-gray-50 transition cursor-pointer"
>
                        <div className="flex justify-between gap-4">
                          {/* File */}
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                              <FileText size={19} />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3
                                  className="font-semibold text-slate-900 truncate"
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
                              <p className="text-sm text-gray-500">Rank #{index + 1}</p>
                              <div className="mt-2 h-1.5 w-full max-w-[220px] bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-orange-400 rounded-full"
                                  style={{ width: `${heatPct}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Changes */}
                          <div className="text-right shrink-0">
                            <p className="text-xl font-bold text-orange-600">
                              {item.score || item.changes || 0}
                            </p>
                            <p className="text-xs text-gray-500">changes</p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-6 mt-4 text-sm">
                          <span className="flex items-center gap-1 text-green-600">
                            <Plus size={14} />
                            {item.additions || 0}
                          </span>

                          <span className="flex items-center gap-1 text-red-600">
                            <Minus size={14} />
                            {item.deletions || 0}
                          </span>

                          <span className="flex items-center gap-1 text-gray-500">
                            <GitCommit size={14} />
                            {item.changes || 0} commits
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
       <HotspotDetails
        selectedHotspot={selectedFile}
        onClose={() => setSelectedFile(null)}
      />
    </div>
  );
}

export default Hotspots;