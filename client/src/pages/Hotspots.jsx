import React, { useEffect, useMemo, useState, useCallback } from "react";
import HotspotDetails from "../components/HotspotDetails";
import HotspotStats from "../components/Hotspots/HotspotStats";
import HotspotToolbar from "../components/Hotspots/HotspotToolbar";
import HotspotListItem from "../components/Hotspots/HotspotListItem";
import HotspotPagination, {
  getPageNumbers,
} from "../components/Hotspots/HotspotPagination";
import HotspotEmptyState from "../components/Hotspots/HotspotEmptyState";

import { useAnalysis } from "../context/AnalysisContext";
import { Sparkles, Flame, GitFork, ArrowUpRight, ShieldAlert } from "lucide-react";
import { FaGithub } from "react-icons/fa";

const ITEMS_PER_PAGE = 10;

const DEFAULT_AI_INSIGHT = {
  riskLevel: "Unknown",
  summary: "AI analysis is not available.",
  recommendations: [],
  impact: "No impact analysis available.",
};

function normalizeFileField(item) {
  const rawPath = item.file || item.path || item.filename || "Unknown file";
  const normalizedPath = rawPath.replace(/\\/g, "/");

  return {
    ...item,
    file: normalizedPath,
  };
}

export default function Hotspots() {
  const { analysis, repositoryId } = useAnalysis();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("score");
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Extract raw hotspots safely from AnalysisContext
  const hotspots = useMemo(() => {
    const raw = analysis?.hotspots;
    if (Array.isArray(raw)) return raw.map(normalizeFileField);
    return (raw?.hotspots || []).map(normalizeFileField);
  }, [analysis]);

  const hotspotInsights = useMemo(
    () => analysis?.hotspotInsights || [],
    [analysis]
  );

  // Fast map for O(1) insight lookups
  const insightMap = useMemo(() => {
    return new Map(hotspotInsights.map((item) => [item.file, item]));
  }, [hotspotInsights]);

  // Fallback calculations for score fields
  const scoredHotspots = useMemo(
    () =>
      hotspots.map((item) => ({
        ...item,
        score: item.score ?? item.changes ?? 0,
      })),
    [hotspots]
  );

  const maxScore = useMemo(
    () =>
      scoredHotspots.reduce(
        (max, item) => Math.max(max, item.score || 0),
        0
      ),
    [scoredHotspots]
  );

  // Filter and secondary sort by file name to prevent re-order flickering
  const filteredHotspots = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const filtered = scoredHotspots.filter((item) =>
      (item.file || "").toLowerCase().includes(search)
    );
    return [...filtered].sort((a, b) => {
      const diff = (b[sortKey] || 0) - (a[sortKey] || 0);
      if (diff !== 0) return diff;
      return a.file.localeCompare(b.file);
    });
  }, [scoredHotspots, searchTerm, sortKey]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredHotspots.length / ITEMS_PER_PAGE)),
    [filteredHotspots]
  );

  // Clamp current page if total pages change due to search/filtering
  useEffect(() => {
    setCurrentPage((page) => Math.min(page, Math.max(1, totalPages)));
  }, [totalPages]);

  const pageNumbers = useMemo(
    () => getPageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  );

  const paginatedHotspots = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHotspots.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHotspots, currentPage]);

  // Aggregated totals memoized against scoredHotspots
  const totals = useMemo(() => {
    return scoredHotspots.reduce(
      (acc, item) => {
        acc.additions += item.additions || 0;
        acc.deletions += item.deletions || 0;
        acc.changes += item.changes || 0;
        return acc;
      },
      { additions: 0, deletions: 0, changes: 0 }
    );
  }, [scoredHotspots]);

  const handleSelectHotspot = useCallback(
    (item) => {
      if (!item) {
        setSelectedFile(null);
        return;
      }
      const insight = insightMap.get(item.file);
      setSelectedFile({
        ...item,
        aiInsight: insight || DEFAULT_AI_INSIGHT,
      });
    },
    [insightMap]
  );

  // Synchronize selection cleanly whenever filter set changes
  useEffect(() => {
    if (!filteredHotspots.length) {
      setSelectedFile(null);
      return;
    }

    const currentSelectedPath = selectedFile?.file;
    const isStillInList = filteredHotspots.some(
      (item) => item.file === currentSelectedPath
    );

    if (!isStillInList) {
      handleSelectHotspot(filteredHotspots[0]);
    }
  }, [filteredHotspots, handleSelectHotspot]);

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden selection:bg-orange-500/20 selection:text-orange-300">
      <div className="max-w-[1700px] mx-auto px-6 py-5 w-full flex flex-col flex-1 min-h-0 gap-4">
        {/* Header Bar */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-orange-500/30 text-orange-400 shadow-lg shadow-orange-500/10">
              <Flame size={22} className="animate-pulse" />
              <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-orange-500 ring-4 ring-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Code Hotspots
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-400">
                  <Sparkles size={10} />
                  AI Insights Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Identify high-churn files and potential architectural bottlenecks
              </p>
            </div>
          </div>

          {repositoryId && (
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-400">
              <GitFork size={13} className="text-slate-500" />
              <span className="font-mono text-slate-300">{repositoryId}</span>
            </div>
          )}
        </div>

        {!analysis ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-900/40 p-10 text-center backdrop-blur-xl shadow-2xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-400 border border-slate-700/50">
                <FaGithub size={28} />
              </div>
              <h3 className="text-base font-semibold text-slate-200">
                No repository selected
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Connect and analyze a GitHub repository to inspect code churn,
                frequent revision paths, and AI risk reports.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col gap-4">
            {/* Stats Overview */}
            {scoredHotspots.length > 0 && <HotspotStats totals={totals} />}

            {/* Split Master-Detail Panel */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: Explorer Panel (~58%) */}
              <div className="lg:col-span-7 flex flex-col min-h-0 rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-xl shadow-xl overflow-hidden">
                <HotspotToolbar
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  sortKey={sortKey}
                  setSortKey={setSortKey}
                />

                <div className="px-5 py-2.5 border-b border-slate-800/80 shrink-0 flex items-center justify-between bg-slate-900/80">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Most Changed Files
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {filteredHotspots.length} file
                    {filteredHotspots.length === 1 ? "" : "s"} matched
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 custom-scrollbar">
                  {filteredHotspots.length === 0 ? (
                    <HotspotEmptyState searchTerm={searchTerm} />
                  ) : (
                    paginatedHotspots.map((item, i) => {
                      const globalIndex =
                        (currentPage - 1) * ITEMS_PER_PAGE + i;
                      const isSelected = selectedFile?.file === item.file;

                      return (
                        <HotspotListItem
                          key={`${item.file}-${globalIndex}`}
                          item={item}
                          globalIndex={globalIndex}
                          maxScore={maxScore}
                          isSelected={isSelected}
                          onSelect={handleSelectHotspot}
                        />
                      );
                    })
                  )}
                </div>

                {filteredHotspots.length > 0 && (
                  <div className="border-t border-slate-800/80 bg-slate-900/90">
                    <HotspotPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredHotspots.length}
                      itemsPerPage={ITEMS_PER_PAGE}
                      pageNumbers={pageNumbers}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </div>

              {/* Right Column: AI Risk & Details Inspector (~42%) */}
              <div className="lg:col-span-5 flex flex-col min-h-0 rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-xl shadow-xl overflow-hidden">
                {selectedFile ? (
                  <HotspotDetails
                    selectedHotspot={selectedFile}
                    repositoryId={repositoryId}
                    onClose={() => setSelectedFile(null)}
                    maxScore={maxScore}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Sparkles size={22} />
                    </div>
                    <p className="text-sm font-medium text-slate-300">
                      No hotspot selected
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-[240px] leading-relaxed">
                      Select a file from the list to analyze its modification
                      history and AI risk breakdown.
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