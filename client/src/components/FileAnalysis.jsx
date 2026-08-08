import { useMemo, useState } from "react";
import {
  FileCode2,
  Plus,
  Minus,
  GitBranch,
  ArrowUpDown,
  Flame,
  FolderOpen,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import API from "../services/api";

const ITEMS_PER_PAGE = 10;

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

// Helper to safely retrieve file path across various backend object keys
function getFilePath(file) {
  if (!file) return "";
  return (
    file.file ||
    file.filePath ||
    file.path ||
    file.filename ||
    file.name ||
    ""
  );
}

function riskLevel(churn, maxChurn) {
  if (maxChurn === 0) {
    return {
      label: "Low",
      style: "bg-emerald-50 text-emerald-600",
    };
  }

  const ratio = churn / maxChurn;

  if (ratio > 0.66) {
    return {
      label: "High",
      style: "bg-red-50 text-red-600",
    };
  }

  if (ratio > 0.33) {
    return {
      label: "Medium",
      style: "bg-amber-50 text-amber-600",
    };
  }

  return {
    label: "Low",
    style: "bg-emerald-50 text-emerald-600",
  };
}

/* -------------------------------------------------------
   HELPERS FOR AI RESULT
------------------------------------------------------- */

function SectionTitle({ title }) {
  return (
    <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 mb-2">
      {title}
    </p>
  );
}

function BulletList({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2 text-sm text-slate-700">
          <span className="text-indigo-500 mt-1">•</span>
          <span>
            {typeof item === "string" ? item : JSON.stringify(item)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------
   AI RESULT DISPLAY
------------------------------------------------------- */

function AIExplanation({ explanation }) {
  if (!explanation) return null;

  if (typeof explanation === "string") {
    return (
      <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-indigo-600" />
          <h4 className="font-semibold text-slate-800">AI File Analysis</h4>
        </div>
        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
          {explanation}
        </p>
      </div>
    );
  }

  const {
    purpose,
    summary,
    role,
    responsibilities,
    workflow,
    components,
    importantFunctions,
    dependencies,
    designPatterns,
    dataFlow,
    risks,
    risk,
    improvements,
    relatedFiles,
    complexity,
    maintainability,
    bestPractices,
  } = explanation;

  return (
    <div className="mt-4 rounded-xl border border-indigo-100 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-indigo-50 border-b border-indigo-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <Sparkles size={18} />
          </div>

          <div>
            <h4 className="font-bold text-slate-800">AI File Analysis</h4>
            <p className="text-xs text-slate-500">
              Architectural and code understanding
            </p>
          </div>

          {role && (
            <span className="ml-auto px-3 py-1 rounded-full bg-white border border-indigo-200 text-xs font-semibold text-indigo-600">
              {role}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Purpose */}
        {purpose && (
          <div>
            <SectionTitle title="Purpose" />
            <p className="text-sm text-slate-700 leading-relaxed">{purpose}</p>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div>
            <SectionTitle title="Overview" />
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {summary}
            </p>
          </div>
        )}

        {/* Responsibilities */}
        {Array.isArray(responsibilities) && responsibilities.length > 0 && (
          <div>
            <SectionTitle title="Responsibilities" />
            <BulletList items={responsibilities} />
          </div>
        )}

        {/* Workflow */}
        {Array.isArray(workflow) && workflow.length > 0 && (
          <div>
            <SectionTitle title="Workflow" />
            <ol className="space-y-2">
              {workflow.map((item, index) => (
                <li key={index} className="flex gap-3 text-sm text-slate-700">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Components */}
        {Array.isArray(components) && components.length > 0 && (
          <div>
            <SectionTitle title="Components" />
            <div className="space-y-2">
              {components.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg bg-slate-50 border border-slate-100 p-3"
                >
                  <p className="font-semibold text-sm text-slate-800">
                    {item.name}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Important Functions */}
        {Array.isArray(importantFunctions) && importantFunctions.length > 0 && (
          <div>
            <SectionTitle title="Important Functions" />
            <div className="space-y-2">
              {importantFunctions.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg bg-purple-50/50 border border-purple-100 p-3"
                >
                  <p className="font-semibold text-sm text-slate-800">
                    {item.name}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dependencies */}
        {Array.isArray(dependencies) && dependencies.length > 0 && (
          <div>
            <SectionTitle title="Dependencies" />
            <div className="flex flex-wrap gap-2">
              {dependencies.map((item, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Design Patterns */}
        {Array.isArray(designPatterns) && designPatterns.length > 0 && (
          <div>
            <SectionTitle title="Design Patterns" />
            <BulletList items={designPatterns} />
          </div>
        )}

        {/* Data Flow */}
        {Array.isArray(dataFlow) && dataFlow.length > 0 && (
          <div>
            <SectionTitle title="Data Flow" />
            <ol className="space-y-2">
              {dataFlow.map((item, index) => (
                <li key={index} className="flex gap-3 text-sm text-slate-700">
                  <span className="text-indigo-600 font-bold">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Risk Analysis */}
        {(risk || (Array.isArray(risks) && risks.length > 0)) && (
          <div>
            <SectionTitle title="Risk Analysis" />
            {risk && (
              <div className="flex items-center gap-2 mb-3">
                {String(risk).toLowerCase() === "high" ? (
                  <AlertTriangle size={18} className="text-red-500" />
                ) : (
                  <CheckCircle2 size={18} className="text-emerald-500" />
                )}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    String(risk).toLowerCase() === "high"
                      ? "bg-red-50 text-red-600"
                      : String(risk).toLowerCase() === "medium"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {risk}
                </span>
              </div>
            )}
            {Array.isArray(risks) && risks.length > 0 && (
              <BulletList items={risks} />
            )}
          </div>
        )}

        {/* Improvements */}
        {Array.isArray(improvements) && improvements.length > 0 && (
          <div>
            <SectionTitle title="Recommended Improvements" />
            <BulletList items={improvements} />
          </div>
        )}

        {/* Related Files */}
        {Array.isArray(relatedFiles) && relatedFiles.length > 0 && (
          <div>
            <SectionTitle title="Related Files" />
            <div className="flex flex-wrap gap-2">
              {relatedFiles.map((item, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Complexity + Maintainability */}
        {(complexity || maintainability) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {complexity && (
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-2">
                  Complexity
                </p>
                <p className="text-sm text-slate-700">{complexity}</p>
              </div>
            )}

            {maintainability && (
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-2">
                  Maintainability
                </p>
                <p className="text-sm text-slate-700">{maintainability}</p>
              </div>
            )}
          </div>
        )}

        {/* Best Practices */}
        {Array.isArray(bestPractices) && bestPractices.length > 0 && (
          <div>
            <SectionTitle title="Best Practices" />
            <BulletList items={bestPractices} />
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   MAIN FILE ANALYSIS COMPONENT
------------------------------------------------------- */

function FileAnalysis({ fileAnalysis, repositoryId }) {
  const [sortKey, setSortKey] = useState("churn");
  const [analyzingFile, setAnalyzingFile] = useState(null);
  const [expandedFile, setExpandedFile] = useState(null);
  const [aiResults, setAiResults] = useState({});
  const [aiErrors, setAiErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  // Pull allFiles (fallback to mostChangedFiles if allFiles isn't available)
  const files = useMemo(() => {
    const raw =
      fileAnalysis?.allFiles || fileAnalysis?.mostChangedFiles || [];

    console.log("📦 All File Data:", raw);

    const withChurn = raw.map((file) => ({
      ...file,
      churn:
        file.churn ??
        (file.additions || 0) + (file.deletions || 0),
    }));

    return [...withChurn].sort(
      (a, b) => (b[sortKey] || 0) - (a[sortKey] || 0)
    );
  }, [fileAnalysis, sortKey]);

  // Reset pagination to page 1 whenever sorting or dataset changes
  const handleSortChange = (key) => {
    setSortKey(key);
    setCurrentPage(1);
  };

  if (!fileAnalysis) {
    return null;
  }

  const maxChurn = files.reduce((max, f) => Math.max(max, f.churn), 0);
  const totalAdditions = files.reduce((sum, f) => sum + (f.additions || 0), 0);
  const totalDeletions = files.reduce((sum, f) => sum + (f.deletions || 0), 0);
  const totalChurn = totalAdditions + totalDeletions;

  // Pagination bounds
  const totalPages = Math.ceil(files.length / ITEMS_PER_PAGE) || 1;
  const paginatedFiles = files.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  /* -------------------------------------------------------
     Analyze individual file
  ------------------------------------------------------- */
  const handleAnalyzeFile = async (file) => {
    const filePath = getFilePath(file);

    if (!filePath) {
      console.error("❌ No valid file path resolved:", file);
      return;
    }

    if (!repositoryId) {
      setAiErrors((prev) => ({
        ...prev,
        [filePath]:
          "Repository ID is missing. Please select or re-analyze the repository.",
      }));
      return;
    }

    if (aiResults[filePath]) {
      setExpandedFile((current) => (current === filePath ? null : filePath));
      return;
    }

    try {
      setAnalyzingFile(filePath);
      setAiErrors((prev) => ({ ...prev, [filePath]: null }));

      const response = await API.post("/repository/file-explanation", {
        filePath,
        repositoryId,
      });

      const result = response.data?.data ?? response.data;

      setAiResults((prev) => ({
        ...prev,
        [filePath]: result,
      }));

      setExpandedFile(filePath);
    } catch (error) {
      console.error("File AI Analysis Error:", error);
      setAiErrors((prev) => ({
        ...prev,
        [filePath]:
          error.response?.data?.message || "Unable to analyze this file.",
      }));
    } finally {
      setAnalyzingFile(null);
    }
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileCode2 size={20} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                File Analysis
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Explore repository files and get AI-powered analysis.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full">
          <FileCode2 size={18} />
          <span className="font-semibold">
            {fileAnalysis.totalFiles || files.length} files
          </span>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-14 text-gray-400">
          <FolderOpen size={32} className="mb-3 text-gray-300" />
          <p className="font-medium text-gray-500">
            No file analysis available
          </p>
          <p className="text-sm mt-1">
            Analyze a repository to see file statistics.
          </p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
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
                onClick={() => handleSortChange(opt.key)}
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

          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 rounded-lg text-sm font-semibold text-gray-500">
            <div className="col-span-4">File</div>
            <div className="col-span-2 text-center">Changes</div>
            <div className="col-span-1 text-center">Additions</div>
            <div className="col-span-1 text-center">Deletions</div>
            <div className="col-span-1 text-center">Churn</div>
            <div className="col-span-1 text-center">Risk</div>
            <div className="col-span-2 text-center">AI</div>
          </div>

          {/* Files List */}
          <div className="space-y-3 mt-3">
            {paginatedFiles.map((file, pageIdx) => {
              const globalIndex =
                (currentPage - 1) * ITEMS_PER_PAGE + pageIdx;
              const risk = riskLevel(file.churn, maxChurn);

              const churnPct =
                maxChurn > 0
                  ? Math.round((file.churn / maxChurn) * 100)
                  : 0;

              const filePath = getFilePath(file);
              const isAnalyzing = analyzingFile === filePath;
              const hasResult = !!aiResults[filePath];
              const isExpanded = expandedFile === filePath;
              const error = aiErrors[filePath];

              return (
                <div
                  key={`${filePath || globalIndex}-${globalIndex}`}
                  className="border border-gray-100 rounded-xl overflow-hidden hover:border-purple-100 transition"
                >
                  {/* Main file row */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-4 py-4 hover:bg-gray-50 transition">
                    {/* File */}
                    <div className="md:col-span-4 flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                          globalIndex < 3
                            ? RANK_STYLES[globalIndex]
                            : "bg-purple-50 text-purple-600"
                        }`}
                      >
                        {globalIndex < 3 ? (
                          globalIndex + 1
                        ) : (
                          <FileCode2 size={16} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className="font-semibold text-slate-800 truncate"
                          title={filePath || "Unknown path"}
                        >
                          {filePath || (
                            <span className="text-gray-400 italic">
                              Unknown Path
                            </span>
                          )}
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
                    <div className="md:col-span-1 text-center">
                      <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                        <Plus size={15} />
                        {file.additions || 0}
                      </span>
                    </div>

                    {/* Deletions */}
                    <div className="md:col-span-1 text-center">
                      <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                        <Minus size={15} />
                        {file.deletions || 0}
                      </span>
                    </div>

                    {/* Churn */}
                    <div className="md:col-span-1 text-center">
                      <span className="font-bold text-slate-700">
                        {file.churn}
                      </span>
                    </div>

                    {/* Risk */}
                    <div className="md:col-span-1 text-center">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${risk.style}`}
                      >
                        {risk.label}
                      </span>
                    </div>

                    {/* Analyze Action */}
                    <div className="md:col-span-2 flex justify-center">
                      <button
                        type="button"
                        disabled={isAnalyzing}
                        onClick={() => handleAnalyzeFile(file)}
                        className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          hasResult
                            ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                            : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                        } ${isAnalyzing ? "opacity-70 cursor-wait" : ""}`}
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />
                            Analyzing
                          </>
                        ) : hasResult ? (
                          <>
                            {isExpanded ? (
                              <ChevronUp size={15} />
                            ) : (
                              <ChevronDown size={15} />
                            )}
                            AI Analysis
                          </>
                        ) : (
                          <>
                            <Sparkles size={15} />
                            Analyze
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error display */}
                  {error && (
                    <div className="mx-4 mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  {/* AI result display */}
                  {isExpanded && aiResults[filePath] && (
                    <div className="px-4 pb-4">
                      <AIExplanation explanation={aiResults[filePath]} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-6">
              <p className="text-xs text-gray-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-700">
                  {Math.min(currentPage * ITEMS_PER_PAGE, files.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {files.length}
                </span>{" "}
                files
              </p>

              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.max(p - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                        currentPage === page
                          ? "bg-purple-600 text-white"
                          : "text-gray-600 hover:bg-gray-100 border border-transparent"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default FileAnalysis;