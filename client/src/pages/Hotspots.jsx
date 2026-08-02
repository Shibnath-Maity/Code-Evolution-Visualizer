// Hotspots.jsx
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
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

const SORT_OPTIONS = [
  { key: "score", label: "Score" },
  { key: "changes", label: "Changes" },
  { key: "additions", label: "Additions" },
  { key: "deletions", label: "Deletions" },
];

const ITEMS_PER_PAGE = 10;

function riskLevel(score, maxScore) {
  if (!maxScore) return { label: "Low", style: "bg-emerald-50 text-emerald-600" };
  const ratio = score / maxScore;
  if (ratio > 0.66) return { label: "High", style: "bg-red-50 text-red-600" };
  if (ratio > 0.33) return { label: "Medium", style: "bg-amber-50 text-amber-600" };
  return { label: "Low", style: "bg-emerald-50 text-emerald-600" };
}

function SkeletonRow() {
  return (
    <div className="px-5 py-3.5 animate-pulse">
      <div className="flex justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-gray-100 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-gray-100 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-1/5" />
          </div>
        </div>
        <div className="h-6 w-10 bg-gray-100 rounded shrink-0" />
      </div>
    </div>
  );
}

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const withEllipsis = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) withEllipsis.push("...");
    withEllipsis.push(p);
  });
  return withEllipsis;
}

function Hotspots() {
  const [hotspots, setHotspots] = useState([]);
  const [hotspotInsights, setHotspotInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("score");
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const repoUrl = localStorage.getItem("repoUrl");

  const fetchHotspots = () => {
    const analysis = JSON.parse(localStorage.getItem("repositoryAnalysis"));

    if (!analysis) {
      setError("Please analyze a repository first.");
      return;
    }

    setLoading(true);
    setError(null);

    const hotspotData = Array.isArray(analysis.hotspots)
      ? analysis.hotspots
      : analysis.hotspots?.hotspots || [];

    setHotspots(hotspotData);
    setHotspotInsights(analysis.hotspotInsights || []);
    setCurrentPage(1);
    setSelectedFile(null);

    setLoading(false);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filteredHotspots.length / ITEMS_PER_PAGE));

  const paginatedHotspots = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHotspots.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHotspots, currentPage]);

  const totals = useMemo(
    () => ({
      additions: hotspots.reduce((sum, i) => sum + (i.additions || 0), 0),
      deletions: hotspots.reduce((sum, i) => sum + (i.deletions || 0), 0),
      changes: hotspots.reduce((sum, i) => sum + (i.changes || 0), 0),
    }),
    [hotspots]
  );

  const handleSelectHotspot = (item) => {
    const insight = hotspotInsights.find((h) => h.file === item.file);

    setSelectedFile({
      ...item,
      aiInsight: insight || {
        riskLevel: "Unknown",
        summary: "AI analysis is not available for this hotspot.",
        recommendations: [],
        impact: "No impact analysis available.",
      },
    });
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-8 py-6 w-full flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="mb-4 shrink-0 flex items-center gap-3">
          <div className="bg-orange-100 p-2.5 rounded-xl">
            <Flame size={24} className="text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Code Hotspots</h1>
            <p className="text-gray-500 text-sm">Files that change most frequently</p>
          </div>
        </div>

        {!repoUrl ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <FaGithub size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-slate-700">No repository selected</p>
            <p className="text-sm text-gray-500 mt-1">
              Analyze a repository first to see its hotspots.
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col">
            {/* Summary stats */}
            {!loading && !error && hotspots.length > 0 && (
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
            )}

            {/* Main split area: list (left) + analysis (right), fills remaining screen height */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* LEFT: list ~55% */}
              <div className="lg:col-span-3 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Search + sort */}
                <div className="p-4 border-b shrink-0 flex items-center gap-3 flex-wrap justify-between">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Search files..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-gray-400 flex items-center gap-1 mr-1">
                      <ArrowUpDown size={12} />
                      Sort
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

                <div className="px-5 py-3 border-b shrink-0 flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">Most Changed Files</h2>
                  {!loading && !error && (
                    <button
                      onClick={fetchHotspots}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-600 transition-colors"
                    >
                      <RefreshCw size={13} />
                      Refresh
                    </button>
                  )}
                </div>

                {/* Scrollable list body */}
                <div className="flex-1 overflow-y-auto divide-y">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : error ? (
                    <div className="p-10 text-center">
                      <AlertTriangle size={26} className="mx-auto mb-3 text-red-400" />
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
                    <div className="p-8 text-center text-gray-500 text-sm">
                      {searchTerm
                        ? `No files match "${searchTerm}".`
                        : "No hotspot files found."}
                    </div>
                  ) : (
                    paginatedHotspots.map((item, i) => {
                      const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + i;
                      const risk = riskLevel(item.score, maxScore);
                      const heatPct =
                        maxScore > 0 ? Math.round((item.score / maxScore) * 100) : 0;
                      const isSelected = selectedFile?.file === item.file;

                      return (
                        <div
                          key={item.file || globalIndex}
                          onClick={() => handleSelectHotspot(item)}
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
                    })
                  )}
                </div>

                {/* Pagination */}
                {!loading && !error && filteredHotspots.length > 0 && (
                  <div className="border-t shrink-0 px-4 py-3 flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredHotspots.length)} of{" "}
                      {filteredHotspots.length}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      {getPageNumbers(currentPage, totalPages).map((p, i) =>
                        p === "..." ? (
                          <span key={`dots-${i}`} className="px-1.5 text-xs text-gray-400">
                            …
                          </span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setCurrentPage(p)}
                            className={`w-7 h-7 text-xs font-medium rounded-lg transition-colors ${
                              currentPage === p
                                ? "bg-orange-500 text-white"
                                : "text-gray-500 hover:bg-gray-100"
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: analysis panel ~45% */}
              <div className="lg:col-span-2 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm overflow-hidden">
                {selectedFile ? (
                  <HotspotDetails
                    selectedHotspot={selectedFile}
                    onClose={() => setSelectedFile(null)}
                    maxScore={maxScore}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="bg-orange-50 p-4 rounded-full mb-4">
                      <Sparkles size={26} className="text-orange-500" />
                    </div>
                    <p className="font-semibold text-slate-700">No hotspot selected</p>
                    <p className="text-sm text-gray-400 mt-1.5 max-w-[220px]">
                      Click a hotspot to see AI-powered hotspot details
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Hotspots;