import { useEffect, useMemo, useState, useCallback } from "react";
import HotspotDetails from "../components/HotspotDetails";
import HotspotStats from "../components/Hotspots/HotspotStats";
import HotspotToolbar from "../components/Hotspots/HotspotToolbar";
import HotspotListItem from "../components/Hotspots/HotspotListItem";
import HotspotPagination, { getPageNumbers } from "../components/Hotspots/HotspotPagination";
import HotspotEmptyState from "../components/Hotspots/HotspotEmptyState";

import { useAnalysis } from "../context/AnalysisContext";
import { Sparkles } from "lucide-react";
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
  // Convert Windows backslashes (\) to standard web slashes (/)
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
    () => scoredHotspots.reduce((max, item) => Math.max(max, item.score || 0), 0),
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
      const insight = insightMap.get(item.file);
      setSelectedFile({
        ...item,
        aiInsight: insight || DEFAULT_AI_INSIGHT,
      });
    },
    [insightMap]
  );

  // Auto-select selection strategy: retain previously selected file if available, or select top filtered item
  useEffect(() => {
    setCurrentPage(1);

    if (scoredHotspots.length > 0) {
      const previousFile = selectedFile?.file;
      const same = scoredHotspots.find((h) => h.file === previousFile);

      if (same) {
        setSelectedFile({
          ...same,
          aiInsight: insightMap.get(same.file) || DEFAULT_AI_INSIGHT,
        });
      } else {
        const first = filteredHotspots[0] || scoredHotspots[0];
        setSelectedFile({
          ...first,
          aiInsight: insightMap.get(first.file) || DEFAULT_AI_INSIGHT,
        });
      }
    } else {
      setSelectedFile(null);
    }
  }, [analysis, scoredHotspots, insightMap]);

  // Auto-synchronize selection with search & sort view filter changes
  useEffect(() => {
    if (!filteredHotspots.length) {
      setSelectedFile(null);
      return;
    }

    const exists = filteredHotspots.some(
      (item) => item.file === selectedFile?.file
    );

    if (!exists) {
      handleSelectHotspot(filteredHotspots[0]);
    }
  }, [filteredHotspots, selectedFile, handleSelectHotspot]);

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-8 py-6 w-full flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="mb-4 shrink-0 flex items-center gap-3">
          <div className="bg-orange-100 p-2.5 rounded-xl">
            <Sparkles size={24} className="text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Code Hotspots</h1>
            <p className="text-gray-500 text-sm">Files that change most frequently</p>
          </div>
        </div>

        {!analysis ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <FaGithub size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-slate-700">No repository selected</p>
            <p className="text-sm text-gray-500 mt-1">
              Analyze a repository first to see its hotspots.
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col">
            {/* Stats Overview */}
            {scoredHotspots.length > 0 && <HotspotStats totals={totals} />}

            {/* Split Content View */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Left Column: List & Filters (~60%) */}
              <div className="lg:col-span-3 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm overflow-hidden">
                <HotspotToolbar
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  sortKey={sortKey}
                  setSortKey={setSortKey}
                />

                <div className="px-5 py-3 border-b shrink-0 flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">Most Changed Files</h2>
                </div>

                <div className="flex-1 overflow-y-auto divide-y">
                  {filteredHotspots.length === 0 ? (
                    <HotspotEmptyState searchTerm={searchTerm} />
                  ) : (
                    paginatedHotspots.map((item, i) => {
                      const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + i;
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
                  <HotspotPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredHotspots.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    pageNumbers={pageNumbers}
                    onPageChange={setCurrentPage}
                  />
                )}
              </div>

              {/* Right Column: AI Insights & Details (~40%) */}
              <div className="lg:col-span-2 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm overflow-hidden">
                {selectedFile ? (
                  <HotspotDetails
                    selectedHotspot={selectedFile}
                    repositoryId={repositoryId}
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