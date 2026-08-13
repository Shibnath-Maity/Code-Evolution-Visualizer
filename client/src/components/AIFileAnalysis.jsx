import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";

import API from "../services/api";
import { useAnalysis } from "../context/AnalysisContext";

import {
  Search,
  FileCode2,
  Brain,
  Loader2,
} from "lucide-react";

/* ==========================================================
   HELPERS
========================================================== */

function scoreColor(score) {
  if (score >= 90) return "text-emerald-600";
  if (score >= 80) return "text-green-600";
  if (score >= 70) return "text-yellow-600";
  if (score >= 50) return "text-orange-600";
  return "text-red-600";
}

function badgeColor(risk) {
  switch (risk) {
    case "Low":
      return "bg-emerald-100 text-emerald-700";
    case "Medium":
      return "bg-yellow-100 text-yellow-700";
    case "High":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-red-100 text-red-700";
  }
}

// Safely coerce any AI-returned value (string, number, array, or
// {name, description}-shaped object) into renderable text.
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

    if (value.name) {
      return String(value.name);
    }

    if (value.description) {
      return String(value.description);
    }

    return JSON.stringify(value);
  }

  return String(value);
}

/* ==========================================================
   COMPONENT
========================================================== */

export default function AIFileAnalysis() {
  const { analysis, repositoryId } = useAnalysis();
  const fileAnalysis = analysis?.fileAnalysis;

  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiCache, setAiCache] = useState({});

  // Ref to always access the latest cache without breaking useCallback dependencies
  const aiCacheRef = useRef(aiCache);
  aiCacheRef.current = aiCache;

  // Track the active request path to avoid race conditions when clicking rapidly
  const activeRequestPathRef = useRef(null);

  // Prevent duplicate concurrent requests for the same file
  const pendingRequestsRef = useRef(new Set());

  // Restores persistent session cache when switching repositories
  useEffect(() => {
    if (!repositoryId) {
      setAiCache({});
      return;
    }

    try {
      const cacheKey = `aiFileAnalysis_${repositoryId}`;
      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        setAiCache(JSON.parse(cached));
        console.log("♻️ Restored AI file cache:", repositoryId);
      } else {
        setAiCache({});
      }
    } catch (error) {
      console.warn("⚠️ Failed to restore AI cache:", error);
      setAiCache({});
    }

    setSelectedFile(null);
    setAiResult(null);
  }, [repositoryId]);

  // Normalize files array from static analysis
  const files = useMemo(() => {
    const list = Array.isArray(fileAnalysis)
      ? fileAnalysis
      : fileAnalysis?.allFiles || fileAnalysis?.files || [];

    return list.filter((file) =>
      file?.path?.toLowerCase().includes(search.toLowerCase())
    );
  }, [fileAnalysis, search]);

  const activeFile = selectedFile;

  /* ======================================================
     LOAD AI ANALYSIS (ON CLICK + CACHED & PERSISTED)
  ====================================================== */

  const analyzeFile = useCallback(
    async (file) => {
      if (!file || !repositoryId) {
        console.warn("⚠️ Missing file or repositoryId");
        return;
      }

      const filePath = file.path;
      const cacheKey = `${repositoryId}:${filePath}`;
      const storageKey = `aiFileAnalysis_${repositoryId}`;

      activeRequestPathRef.current = filePath;

      // =====================================================
      // 1. FRONTEND MEMORY CACHE
      // =====================================================

      const memoryCached = aiCacheRef.current[cacheKey];

      if (memoryCached) {
        console.log(`♻️ Frontend cache hit: ${filePath}`);

        setAiResult(memoryCached);
        setLoadingAI(false);

        return;
      }

      // =====================================================
      // 2. PREVENT DUPLICATE REQUESTS
      // =====================================================

      if (pendingRequestsRef.current.has(cacheKey)) {
        console.log(`⏳ Already analyzing: ${filePath}`);
        return;
      }

      pendingRequestsRef.current.add(cacheKey);

      try {
        setLoadingAI(true);
        setAiResult(null);

        console.log(`🤖 Requesting AI analysis: ${filePath}`);

        // =====================================================
        // 3. BACKEND
        // =====================================================

        const response = await API.post(
          "/repository/file-explanation",
          {
            repositoryId,
            filePath,
          }
        );

        const data = response.data?.data ?? response.data;

        if (!data || typeof data !== "object") {
          throw new Error("Invalid AI response received.");
        }

        // =====================================================
        // 4. NORMALIZE AI RESPONSE
        // =====================================================

        const normalize = (value) => {
          if (value == null) return [];

          return Array.isArray(value)
            ? value
            : [value];
        };

        const result = {
          ...data,

          responsibilities: normalize(data.responsibilities),
          workflow: normalize(data.workflow),
          components: normalize(data.components),
          importantFunctions: normalize(data.importantFunctions),
          dependencies: normalize(data.dependencies),
          designPatterns: normalize(data.designPatterns),
          dataFlow: normalize(data.dataFlow),
          risks: normalize(data.risks),
          improvements: normalize(data.improvements),
          relatedFiles: normalize(data.relatedFiles),
          bestPractices: normalize(data.bestPractices),
        };

        // =====================================================
        // 5. UPDATE MEMORY CACHE
        // =====================================================

        setAiCache((prev) => {
          const updatedCache = {
            ...prev,
            [cacheKey]: result,
          };

          // ===================================================
          // 6. PERSIST CACHE FOR THIS REPOSITORY
          // ===================================================

          try {
            sessionStorage.setItem(
              storageKey,
              JSON.stringify(updatedCache)
            );

            console.log(
              `💾 Frontend AI cache saved: ${filePath}`
            );
          } catch (error) {
            console.warn(
              "⚠️ Could not save AI cache:",
              error
            );
          }

          return updatedCache;
        });

        // =====================================================
        // 7. IGNORE OLD REQUEST
        // =====================================================

        if (activeRequestPathRef.current === filePath) {
          setAiResult(result);
        }
      } catch (error) {
        console.error(
          `❌ AI Analysis Error: ${filePath}`,
          error
        );

        if (activeRequestPathRef.current === filePath) {
          setAiResult({
            purpose: "Unable to analyze this file.",
            role: "Unknown",
            summary:
              error.response?.data?.message ||
              "AI analysis failed.",

            responsibilities: [],
            workflow: [],
            components: [],
            importantFunctions: [],
            dependencies: [],
            designPatterns: [],
            dataFlow: [],
            risks: [],
            improvements: [],
            relatedFiles: [],
            complexity: "N/A",
            maintainability: "N/A",
            bestPractices: [],
          });
        }
      } finally {
        pendingRequestsRef.current.delete(cacheKey);

        if (activeRequestPathRef.current === filePath) {
          setLoadingAI(false);
        }
      }
    },
    [repositoryId]
  );

  /* ======================================================
     EMPTY STATE
  ====================================================== */

  if (files.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
        <Brain className="w-12 h-12 mx-auto text-slate-400" />
        <h2 className="text-xl font-bold mt-4">No Files Available</h2>
        <p className="text-slate-500 mt-2">
          Analyze a repository first to view its files.
        </p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* LEFT PANEL: FILE SELECTOR */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-indigo-600" />
            <div>
              <h2 className="font-bold text-lg">AI File Analysis</h2>
              <p className="text-sm text-slate-500">
                Select a file to understand what it actually does.
              </p>
            </div>
          </div>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search file..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="max-h-[720px] overflow-y-auto">
          {files.map((file) => (
            <button
              key={file.path}
              onClick={() => {
                setSelectedFile(file);
                analyzeFile(file);
              }}
              className={`w-full text-left p-4 border-b transition ${
                activeFile?.path === file.path
                  ? "bg-indigo-50"
                  : "hover:bg-slate-50"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-slate-800">{file.name}</div>
                  <div className="text-xs text-slate-500 break-all">
                    {file.path}
                  </div>
                </div>
                <div className={`font-bold ml-2 ${scoreColor(file.score)}`}>
                  {file.score}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL: AI INSIGHTS */}
      <div className="lg:col-span-2">
        {!activeFile ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <FileCode2 className="w-14 h-14 mx-auto text-slate-400" />
            <h2 className="mt-5 text-2xl font-bold">Select a File</h2>
            <p className="mt-3 text-slate-500">
              Choose any repository file to let AI explain its purpose, workflow,
              responsibilities, architecture, and improvement opportunities.
            </p>
          </div>
        ) : (
          <>
            {/* FILE HEADER */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <FileCode2 className="w-8 h-8 text-indigo-600 shrink-0" />
                  <div>
                    <h2 className="text-2xl font-bold">{activeFile.name}</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {activeFile.path}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-5xl font-bold ${scoreColor(
                      activeFile.score
                    )}`}
                  >
                    {activeFile.score}
                  </div>
                  <div className="text-sm text-slate-500">Health Score</div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${badgeColor(
                    activeFile.risk
                  )}`}
                >
                  {activeFile.risk} Risk
                </span>
                <span className="text-slate-500 text-sm">
                  AI Powered Repository Analysis
                </span>
              </div>
            </div>

            {/* AI OVERVIEW */}
            <div className="bg-white rounded-2xl border border-slate-200 mt-6 p-6">
              <div className="flex items-center gap-3 mb-5">
                <Brain className="w-6 h-6 text-indigo-600" />
                <div>
                  <h3 className="text-xl font-bold">AI File Understanding</h3>
                  <p className="text-sm text-slate-500">
                    Generated on demand via Gemini
                  </p>
                </div>
              </div>

              {loadingAI ? (
                <div className="flex items-center gap-3 py-12 justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="text-slate-600">
                    AI is reading this file...
                  </span>
                </div>
              ) : (
                <>
                  {/* PURPOSE */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-slate-900 mb-3">
                      🎯 Purpose
                    </h4>
                    <div className="rounded-xl border bg-slate-50 p-5">
                      <p className="leading-8 text-slate-700">
                        {safeText(aiResult?.purpose) || "No purpose available."}
                      </p>
                    </div>
                  </div>

                  {/* FILE ROLE */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold mb-3">🏷️ File Role</h4>
                    <div className="rounded-xl border bg-indigo-50 p-5">
                      <span className="font-semibold">
                        {safeText(aiResult?.role) || "Unknown"}
                      </span>
                    </div>
                  </div>

                  {/* SUMMARY */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-slate-900 mb-3">
                      📖 What this file does
                    </h4>
                    <div className="rounded-xl border bg-slate-50 p-5">
                      <p className="leading-8 text-slate-700">
                        {safeText(aiResult?.summary) || "No summary available."}
                      </p>
                    </div>
                  </div>

                  {/* RESPONSIBILITIES */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-slate-900 mb-4">
                      ⚙️ Main Responsibilities
                    </h4>
                    <div className="space-y-3">
                      {(aiResult?.responsibilities || []).map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 border rounded-xl p-4"
                        >
                          <div className="mt-1 h-2 w-2 rounded-full bg-indigo-600 shrink-0" />
                          <p className="text-slate-700">{safeText(item)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* WORKFLOW */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-slate-900 mb-4">
                      🔄 Workflow
                    </h4>
                    <div className="space-y-3">
                      {Array.isArray(aiResult?.workflow) ? (
                        aiResult.workflow.map((step, index) => (
                          <div
                            key={index}
                            className="flex gap-4 rounded-xl border p-4"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white font-bold">
                              {index + 1}
                            </div>
                            <p className="text-slate-700 leading-7">{safeText(step)}</p>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-xl border p-4 text-slate-500">
                          {safeText(aiResult?.workflow) || "No workflow available"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* COMPONENTS */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-slate-900 mb-4">
                      🧩 Important Components
                    </h4>
                    {(aiResult?.components || []).length === 0 ? (
                      <div className="rounded-xl border bg-slate-50 p-5 text-slate-500">
                        No important components detected.
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        {aiResult.components.map((component, index) => (
                          <div
                            key={index}
                            className="rounded-xl border p-4 hover:border-indigo-300 transition"
                          >
                            <h5 className="font-semibold text-slate-900">
                              {safeText(component?.name || component)}
                            </h5>

                            {component?.description && (
                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                {safeText(component.description)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* FUNCTIONS */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold mb-4">
                      ⚙️ Important Functions
                    </h4>
                    {(aiResult?.importantFunctions || []).map((fn, index) => (
                      <div key={index} className="border rounded-xl p-4 mb-3">
                        <div className="font-semibold">
                          {safeText(fn?.name || fn)}
                        </div>

                        {fn?.description && (
                          <div className="text-slate-600 mt-2">
                            {safeText(fn.description)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* DEPENDENCIES */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-slate-900 mb-4">
                      📦 External Dependencies
                    </h4>
                    {(aiResult?.dependencies || []).length === 0 ? (
                      <div className="rounded-xl border bg-slate-50 p-5 text-slate-500">
                        No external dependencies detected.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {aiResult.dependencies.map((item, index) => (
                          <span
                            key={index}
                            className="rounded-full bg-indigo-100 text-indigo-700 px-4 py-2 text-sm font-medium"
                          >
                            {safeText(item)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* DESIGN PATTERNS */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold mb-4">
                      🧩 Design Patterns
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(aiResult?.designPatterns || []).map((item, index) => (
                        <span
                          key={index}
                          className="px-3 py-2 rounded-full bg-purple-100 text-purple-700 text-sm"
                        >
                          {safeText(item)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* RISKS */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-slate-900 mb-4">
                      ⚠️ Potential Risks
                    </h4>
                    {(aiResult?.risks || []).length === 0 ? (
                      <div className="rounded-xl border bg-emerald-50 text-emerald-700 p-5">
                        AI did not detect any significant risks.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {aiResult.risks.map((risk, index) => (
                          <div
                            key={index}
                            className="rounded-xl border border-orange-200 bg-orange-50 p-4"
                          >
                            <p className="text-slate-700">{safeText(risk)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* RELATED FILES */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold mb-4">🔗 Related Files</h4>
                    <div className="flex flex-wrap gap-2">
                      {(aiResult?.relatedFiles || []).map((file, index) => (
                        <span
                          key={index}
                          className="px-3 py-2 rounded-full bg-slate-100 text-sm"
                        >
                          {safeText(file)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* METRICS */}
                  <div className="grid md:grid-cols-2 gap-5 mb-8">
                    <div className="rounded-xl border p-5">
                      <h4 className="font-bold mb-3">Complexity</h4>
                      <p>{safeText(aiResult?.complexity) || "N/A"}</p>
                    </div>
                    <div className="rounded-xl border p-5">
                      <h4 className="font-bold mb-3">Maintainability</h4>
                      <p>{safeText(aiResult?.maintainability) || "N/A"}</p>
                    </div>
                  </div>

                  {/* BEST PRACTICES */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold mb-4">
                      ✅ Best Practices
                    </h4>
                    {(aiResult?.bestPractices || []).length === 0 ? (
                      <div className="rounded-xl border bg-slate-50 p-5">
                        No best practices detected.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {aiResult.bestPractices.map((item, index) => (
                          <div
                            key={index}
                            className="rounded-xl border bg-emerald-50 p-4 text-emerald-800"
                          >
                            {safeText(item)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* IMPROVEMENTS */}
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-4">
                      💡 AI Suggested Improvements
                    </h4>
                    {(aiResult?.improvements || []).length === 0 ? (
                      <div className="rounded-xl border bg-slate-50 p-5 text-slate-500">
                        No improvements suggested.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {aiResult.improvements.map((item, index) => (
                          <div
                            key={index}
                            className="flex gap-4 rounded-xl border p-5 hover:bg-slate-50 transition"
                          >
                            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                              {index + 1}
                            </div>
                            <p className="leading-7 text-slate-700">{safeText(item)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}