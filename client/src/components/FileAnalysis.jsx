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
  ShieldAlert,
  Layers,
  Cpu,
  Code2,
  Workflow,
  Wrench,
  Link2,
} from "lucide-react";

import API from "../services/api";

const ITEMS_PER_PAGE = 10;

const SORT_OPTIONS = [
  { key: "churn", label: "Churn" },
  { key: "changes", label: "Changes" },
  { key: "additions", label: "Additions" },
  { key: "deletions", label: "Deletions" },
];

const RANK_BADGES = [
  "border-amber-500/30 bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
  "border-slate-400/30 bg-slate-400/10 text-slate-300 ring-1 ring-slate-400/20",
  "border-orange-500/30 bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20",
];

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

function safeText(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(safeText).filter(Boolean).join(", ");
  }
  if (typeof value === "object") {
    if (value.name && value.description) {
      return `${value.name}: ${value.description}`;
    }
    if (value.name) return String(value.name);
    if (value.description) return String(value.description);
    return JSON.stringify(value);
  }
  return String(value);
}

function riskLevel(churn, maxChurn) {
  if (maxChurn === 0) {
    return {
      label: "Low Risk",
      style: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    };
  }

  const ratio = churn / maxChurn;

  if (ratio > 0.66) {
    return {
      label: "High Risk",
      style: "border-rose-500/20 bg-rose-500/10 text-rose-400",
    };
  }

  if (ratio > 0.33) {
    return {
      label: "Medium Risk",
      style: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    };
  }

  return {
    label: "Low Risk",
    style: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  };
}

/* -------------------------------------------------------
   HELPERS FOR AI RESULT
------------------------------------------------------- */

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-indigo-400">
      {Icon && <Icon size={14} className="text-indigo-400" />}
      <span>{title}</span>
    </div>
  );
}

function BulletList({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
          <span>{safeText(item)}</span>
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
      <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-5 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-indigo-400 animate-pulse" />
          <h4 className="text-sm font-semibold text-slate-100">AI Architectural Assessment</h4>
        </div>
        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono">
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
    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">AI File Intelligence</h4>
            <p className="text-[11px] text-slate-400">Deep structural and behavioral code insights</p>
          </div>
        </div>

        {role && (
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-medium">
            {safeText(role)}
          </span>
        )}
      </div>

      <div className="p-5 space-y-6">
        {/* Purpose */}
        {purpose && (
          <div>
            <SectionHeader icon={Cpu} title="Core Purpose" />
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 border border-slate-800/80 p-3.5 rounded-lg">
              {safeText(purpose)}
            </p>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div>
            <SectionHeader icon={Layers} title="Overview" />
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
              {safeText(summary)}
            </p>
          </div>
        )}

        {/* Responsibilities */}
        {Array.isArray(responsibilities) && responsibilities.length > 0 && (
          <div>
            <SectionHeader icon={CheckCircle2} title="Responsibilities" />
            <BulletList items={responsibilities} />
          </div>
        )}

        {/* Workflow */}
        {Array.isArray(workflow) && workflow.length > 0 && (
          <div>
            <SectionHeader icon={Workflow} title="Execution Workflow" />
            <ol className="space-y-2">
              {workflow.map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-xs text-slate-300">
                  <span className="shrink-0 w-5 h-5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{safeText(item)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Components & Functions */}
        {(Array.isArray(components) && components.length > 0) ||
        (Array.isArray(importantFunctions) && importantFunctions.length > 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.isArray(components) && components.length > 0 && (
              <div>
                <SectionHeader icon={Layers} title="Sub-Components" />
                <div className="space-y-2">
                  {components.map((item, index) => (
                    <div key={index} className="rounded-lg bg-slate-950/60 border border-slate-800 p-3">
                      <p className="font-semibold text-xs text-slate-200">
                        {safeText(item?.name || item)}
                      </p>
                      {item?.description && (
                        <p className="text-[11px] text-slate-400 mt-1">
                          {safeText(item.description)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(importantFunctions) && importantFunctions.length > 0 && (
              <div>
                <SectionHeader icon={Code2} title="Key Functions" />
                <div className="space-y-2">
                  {importantFunctions.map((item, index) => (
                    <div key={index} className="rounded-lg bg-indigo-950/20 border border-indigo-900/40 p-3">
                      <p className="font-mono text-xs font-semibold text-indigo-300">
                        {safeText(item?.name || item)}
                      </p>
                      {item?.description && (
                        <p className="text-[11px] text-slate-400 mt-1">
                          {safeText(item.description)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Dependencies */}
        {Array.isArray(dependencies) && dependencies.length > 0 && (
          <div>
            <SectionHeader icon={Link2} title="Dependencies" />
            <div className="flex flex-wrap gap-1.5">
              {dependencies.map((item, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300 text-[11px] font-mono"
                >
                  {safeText(item)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Risk Analysis */}
        {(risk || (Array.isArray(risks) && risks.length > 0)) && (
          <div className="rounded-xl bg-rose-950/10 border border-rose-900/30 p-4">
            <SectionHeader icon={ShieldAlert} title="Security & Stability Risk" />
            {risk && (
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border border-rose-500/30 bg-rose-500/10 text-rose-400">
                  {safeText(risk)}
                </span>
              </div>
            )}
            {Array.isArray(risks) && risks.length > 0 && <BulletList items={risks} />}
          </div>
        )}

        {/* Improvements & Best Practices */}
        {Array.isArray(improvements) && improvements.length > 0 && (
          <div>
            <SectionHeader icon={Wrench} title="Suggested Improvements" />
            <BulletList items={improvements} />
          </div>
        )}

        {/* Metrics Grid */}
        {(complexity || maintainability) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {complexity && (
              <div className="rounded-lg bg-slate-950/40 border border-slate-800 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1">
                  Complexity Score
                </p>
                <p className="text-xs text-slate-300 font-mono">{safeText(complexity)}</p>
              </div>
            )}

            {maintainability && (
              <div className="rounded-lg bg-slate-950/40 border border-slate-800 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1">
                  Maintainability Index
                </p>
                <p className="text-xs text-slate-300 font-mono">{safeText(maintainability)}</p>
              </div>
            )}
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

  const files = useMemo(() => {
    const raw = fileAnalysis?.allFiles || fileAnalysis?.mostChangedFiles || [];

    const withChurn = raw.map((file) => ({
      ...file,
      churn: file.churn ?? (file.additions || 0) + (file.deletions || 0),
    }));

    return [...withChurn].sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));
  }, [fileAnalysis, sortKey]);

  const handleSortChange = (key) => {
    setSortKey(key);
    setCurrentPage(1);
  };

  if (!fileAnalysis) return null;

  const maxChurn = files.reduce((max, f) => Math.max(max, f.churn), 0);
  const totalAdditions = files.reduce((sum, f) => sum + (f.additions || 0), 0);
  const totalDeletions = files.reduce((sum, f) => sum + (f.deletions || 0), 0);
  const totalChurn = totalAdditions + totalDeletions;

  const totalPages = Math.ceil(files.length / ITEMS_PER_PAGE) || 1;
  const paginatedFiles = files.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleAnalyzeFile = async (file) => {
    const filePath = getFilePath(file);

    if (!filePath) return;

    if (!repositoryId) {
      setAiErrors((prev) => ({
        ...prev,
        [filePath]: "Repository ID is missing. Please re-analyze the repository.",
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
      setAiErrors((prev) => ({
        ...prev,
        [filePath]: error.response?.data?.message || "Unable to analyze this file.",
      }));
    } finally {
      setAnalyzingFile(null);
    }
  };

  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-200 backdrop-blur-xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
            <FileCode2 size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">File Intelligence</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect codebase churn metrics and run AI architectural diagnostics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 px-3.5 py-1.5 rounded-full text-xs font-semibold text-indigo-300 self-start sm:self-auto">
          <FileCode2 size={15} />
          <span>{fileAnalysis.totalFiles || files.length} Total Files</span>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 border border-dashed border-slate-800 rounded-xl">
          <FolderOpen size={36} className="mb-3 text-slate-600" />
          <p className="text-sm font-semibold text-slate-300">No file metrics available</p>
          <p className="text-xs text-slate-500 mt-1">Analyze a repository to view structural data.</p>
        </div>
      ) : (
        <>
          {/* Summary Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl bg-slate-950/40 border border-slate-800/80 p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Additions</span>
              <p className="text-lg font-bold text-emerald-400 flex items-center gap-1 mt-1 font-mono">
                <Plus size={16} />
                {totalAdditions.toLocaleString()}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950/40 border border-slate-800/80 p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Deletions</span>
              <p className="text-lg font-bold text-rose-400 flex items-center gap-1 mt-1 font-mono">
                <Minus size={16} />
                {totalDeletions.toLocaleString()}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950/40 border border-slate-800/80 p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Code Churn</span>
              <p className="text-lg font-bold text-amber-400 flex items-center gap-1.5 mt-1 font-mono">
                <Flame size={16} className="text-amber-500" />
                {totalChurn.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 mr-2 font-medium">
              <ArrowUpDown size={13} className="text-indigo-400" />
              Sort by:
            </span>

            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleSortChange(opt.key)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                  sortKey === opt.key
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                    : "bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Desktop Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-semibold text-slate-400 mb-2">
            <div className="col-span-4">File Path</div>
            <div className="col-span-2 text-center">Commits</div>
            <div className="col-span-1 text-center">Add</div>
            <div className="col-span-1 text-center">Del</div>
            <div className="col-span-1 text-center">Churn</div>
            <div className="col-span-1 text-center">Risk</div>
            <div className="col-span-2 text-center">Action</div>
          </div>

          {/* Files List */}
          <div className="space-y-2">
            {paginatedFiles.map((file, pageIdx) => {
              const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + pageIdx;
              const risk = riskLevel(file.churn, maxChurn);
              const churnPct = maxChurn > 0 ? Math.round((file.churn / maxChurn) * 100) : 0;
              const filePath = getFilePath(file);
              const isAnalyzing = analyzingFile === filePath;
              const hasResult = !!aiResults[filePath];
              const isExpanded = expandedFile === filePath;
              const error = aiErrors[filePath];

              return (
                <div
                  key={`${filePath || globalIndex}-${globalIndex}`}
                  className="bg-slate-950/30 border border-slate-800/80 rounded-xl overflow-hidden hover:border-slate-700 transition"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-4 py-3.5">
                    {/* File Path */}
                    <div className="md:col-span-4 flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          globalIndex < 3
                            ? RANK_BADGES[globalIndex]
                            : "bg-slate-800/80 text-slate-400 border border-slate-700/50"
                        }`}
                      >
                        {globalIndex + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className="font-mono text-xs font-medium text-slate-200 truncate"
                          title={filePath || "Unknown path"}
                        >
                          {filePath || <span className="text-slate-500 italic">Unknown Path</span>}
                        </p>

                        <div className="mt-1.5 h-1 w-full max-w-[140px] bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${churnPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Changes */}
                    <div className="md:col-span-2 text-center flex items-center md:justify-center justify-between text-xs">
                      <span className="text-slate-400 md:hidden">Changes:</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/50 text-indigo-300 font-mono">
                        <GitBranch size={13} />
                        {file.changes || 0}
                      </span>
                    </div>

                    {/* Additions */}
                    <div className="md:col-span-1 text-center flex items-center md:justify-center justify-between text-xs">
                      <span className="text-slate-400 md:hidden">Additions:</span>
                      <span className="text-emerald-400 font-mono font-medium">
                        +{file.additions || 0}
                      </span>
                    </div>

                    {/* Deletions */}
                    <div className="md:col-span-1 text-center flex items-center md:justify-center justify-between text-xs">
                      <span className="text-slate-400 md:hidden">Deletions:</span>
                      <span className="text-rose-400 font-mono font-medium">
                        -{file.deletions || 0}
                      </span>
                    </div>

                    {/* Churn */}
                    <div className="md:col-span-1 text-center flex items-center md:justify-center justify-between text-xs">
                      <span className="text-slate-400 md:hidden">Churn:</span>
                      <span className="font-mono text-slate-300 font-semibold">{file.churn}</span>
                    </div>

                    {/* Risk */}
                    <div className="md:col-span-1 text-center flex items-center md:justify-center justify-between">
                      <span className="text-slate-400 text-xs md:hidden">Risk:</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${risk.style}`}>
                        {risk.label}
                      </span>
                    </div>

                    {/* Action Button */}
                    <div className="md:col-span-2 flex justify-center pt-2 md:pt-0">
                      <button
                        type="button"
                        disabled={isAnalyzing}
                        onClick={() => handleAnalyzeFile(file)}
                        className={`w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          hasResult
                            ? "bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
                        } ${isAnalyzing ? "opacity-70 cursor-wait" : ""}`}
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 size={13} className="animate-spin text-indigo-300" />
                            <span>Analyzing...</span>
                          </>
                        ) : hasResult ? (
                          <>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            <span>AI Insights</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} />
                            <span>Analyze</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error State */}
                  {error && (
                    <div className="mx-4 mb-3 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
                      {error}
                    </div>
                  )}

                  {/* AI Explanation Content */}
                  {isExpanded && aiResults[filePath] && (
                    <div className="px-4 pb-4 border-t border-slate-800/60 pt-2">
                      <AIExplanation explanation={aiResults[filePath]} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800 pt-4 mt-6 gap-3">
              <p className="text-xs text-slate-400">
                Showing <span className="font-semibold text-slate-200">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                <span className="font-semibold text-slate-200">{Math.min(currentPage * ITEMS_PER_PAGE, files.length)}</span> of{" "}
                <span className="font-semibold text-slate-200">{files.length}</span> items
              </p>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium font-mono transition ${
                      currentPage === page
                        ? "bg-indigo-600 text-white border border-indigo-500"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
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