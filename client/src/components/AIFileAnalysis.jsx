
import React, {
  useMemo,
  useState,
  useEffect,
} from "react";

import API from "../services/api";

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

/* ==========================================================
   COMPONENT
========================================================== */

export default function AIFileAnalysis({
  aiFileAnalysis,
}) {
  const [search, setSearch] = useState("");

 
const [selectedFile, setSelectedFile] = useState(null);

const [loadingAI, setLoadingAI] = useState(false);

const [aiResult, setAiResult] = useState(null);

  const files = useMemo(() => {
    if (!aiFileAnalysis) return [];

    const list =
      aiFileAnalysis.files || [];

    return list.filter((file) =>
      file.path
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [aiFileAnalysis, search]);

  const activeFile =
    selectedFile || files[0];



  /* ======================================================
     LOAD AI ANALYSIS
  ====================================================== */

  async function analyzeFile(file) {
    if (!file) return;

    try {
      setLoadingAI(true);

      // const repositoryId =
      //   localStorage.getItem(
      //     "repositoryId"
      //   );
const repositoryId = localStorage.getItem("repositoryId");
console.log("Selected file:", file);
const response = await API.post(
  "/repository/file-explanation",
  {
    repositoryId,
    filePath: file.path,
  }
);
  
        const data = response.data.data;

const normalize = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

setAiResult({
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
});
    
    } catch (err) {
      console.error(err);

       if (err.response) {
    console.log("Backend Response:");
    console.log(err.response.data);
  }

      setAiResult({
        purpose:
          "Unable to analyze this file.",

        summary:
          "AI analysis failed.",

        responsibilities: [],

        improvements: [],

        workflow: [],

        components: [],
      });
    } finally {
      setLoadingAI(false);
    }
  }

  useEffect(() => {
    if (activeFile) {
      analyzeFile(activeFile);
    }
  }, [activeFile?.path]);

  if (!aiFileAnalysis) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">

        <Brain className="w-12 h-12 mx-auto text-slate-400" />

        <h2 className="text-xl font-bold mt-4">
          AI File Analysis
        </h2>

        <p className="text-slate-500 mt-2">
          Analyze a repository first.
        </p>

      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">

      {/* ===========================================
          LEFT PANEL
      =========================================== */}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

        <div className="p-5 border-b">

          <div className="flex items-center gap-3">

            <Brain className="w-6 h-6 text-indigo-600" />

            <div>

              <h2 className="font-bold text-lg">
                AI File Analysis
              </h2>

              <p className="text-sm text-slate-500">
                Select a file to understand
                what it actually does.
              </p>

            </div>

          </div>

          <div className="relative mt-4">

            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search file..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border"
            />

          </div>

        </div>

        <div className="max-h-[720px] overflow-y-auto">

          {files.map((file) => (

            <button
              key={file.path}
              onClick={() =>
                setSelectedFile(file)
              }
              className={`w-full text-left p-4 border-b transition ${
                activeFile?.path === file.path
                  ? "bg-indigo-50"
                  : "hover:bg-slate-50"
              }`}
            >

              <div className="flex justify-between">

                <div>

                  <div className="font-medium">

                    {file.name}

                  </div>

                  <div className="text-xs text-slate-500">

                    {file.path}

                  </div>

                </div>

                <div
                  className={`font-bold ${scoreColor(
                    file.score
                  )}`}
                >
                  {file.score}
                </div>

              </div>

            </button>

          ))}

        </div>

      </div>
            {/* ===========================================
          RIGHT PANEL
      =========================================== */}

      <div className="lg:col-span-2">

        {!activeFile ? (

          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">

            <FileCode2 className="w-14 h-14 mx-auto text-slate-400" />

            <h2 className="mt-5 text-2xl font-bold">
              Select a File
            </h2>

            <p className="mt-3 text-slate-500">
              Choose any repository file to let AI explain
              its purpose, workflow, responsibilities,
              architecture and improvement opportunities.
            </p>

          </div>

        ) : (

          <>

            {/* ===================================
                FILE HEADER
            =================================== */}

            <div className="bg-white rounded-2xl border border-slate-200 p-6">

              <div className="flex justify-between items-start">

                <div>

                  <div className="flex items-center gap-3">

                    <FileCode2 className="w-8 h-8 text-indigo-600" />

                    <div>

                      <h2 className="text-2xl font-bold">

                        {activeFile.name}

                      </h2>

                      <p className="text-sm text-slate-500 mt-1">

                        {activeFile.path}

                      </p>

                    </div>

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

                  <div className="text-sm text-slate-500">

                    Health Score

                  </div>

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

            {/* ===================================
                AI OVERVIEW
            =================================== */}

            <div className="bg-white rounded-2xl border border-slate-200 mt-6 p-6">

              <div className="flex items-center gap-3 mb-5">

                <Brain className="w-6 h-6 text-indigo-600" />

                <div>

                  <h3 className="text-xl font-bold">

                    AI File Understanding

                  </h3>

                  <p className="text-sm text-slate-500">

                    Generated using Groq Llama

                  </p>

                </div>

              </div>

              {loadingAI ? (

                <div className="flex items-center gap-3 py-12">

                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />

                  <span className="text-slate-600">

                    AI is reading this file...

                  </span>

                </div>

              ) : (

                <>
                                  {/* ===================================
                      PURPOSE
                  =================================== */}

                  <div className="mb-8">

                    <h4 className="text-lg font-bold text-slate-900 mb-3">

                      🎯 Purpose

                    </h4>

                    <div className="rounded-xl border bg-slate-50 p-5">

                      <p className="leading-8 text-slate-700">

                        {aiResult?.purpose ||
                          "No purpose available."}

                      </p>

                    </div>

                  </div>

                  <div className="mb-8">
  <h4 className="text-lg font-bold mb-3">
    🏷️ File Role
  </h4>

  <div className="rounded-xl border bg-indigo-50 p-5">
    <span className="font-semibold">
      {aiResult?.role || "Unknown"}
    </span>
  </div>
</div>

                  {/* ===================================
                      WHAT THIS FILE DOES
                  =================================== */}

                  <div className="mb-8">

                    <h4 className="text-lg font-bold text-slate-900 mb-3">

                      📖 What this file does

                    </h4>

                    <div className="rounded-xl border bg-slate-50 p-5">

                      <p className="leading-8 text-slate-700">

                        {aiResult?.summary ||
                          "No summary available."}

                      </p>

                    </div>

                  </div>

                  {/* ===================================
                      RESPONSIBILITIES
                  =================================== */}

                  <div className="mb-8">

                    <h4 className="text-lg font-bold text-slate-900 mb-4">

                      ⚙️ Main Responsibilities

                    </h4>

                    <div className="space-y-3">

                      {(aiResult?.responsibilities || []).map(
                        (item, index) => (

                          <div
                            key={index}
                            className="flex items-start gap-3 border rounded-xl p-4"
                          >

                            <div className="mt-1 h-2 w-2 rounded-full bg-indigo-600" />

                            <p className="text-slate-700">

                              {item}

                            </p>

                          </div>

                        )
                      )}

                    </div>

                  </div>

                  {/* ===================================
                      WORKFLOW
                  =================================== */}
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

          <div>
            <p className="text-slate-700 leading-7">
              {step}
            </p>
          </div>
        </div>
      ))
    ) : (
      <div className="rounded-xl border p-4 text-slate-500">
        {aiResult?.workflow || "No workflow available"}
      </div>
    )}
  </div>
</div>
      
                                    {/* ===================================
                      IMPORTANT COMPONENTS
                  =================================== */}

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

                              {component.name}

                            </h5>

                            <p className="mt-2 text-sm leading-6 text-slate-600">

                              {component.description}

                            </p>

                          </div>

                        ))}

                      </div>

                    )}

                  </div>


                  <div className="mb-8">
  <h4 className="text-lg font-bold mb-4">
    ⚙️ Important Functions
  </h4>

  {(aiResult?.importantFunctions || []).map((fn, index) => (
    <div
      key={index}
      className="border rounded-xl p-4 mb-3"
    >
      <div className="font-semibold">
        {fn.name}
      </div>

      <div className="text-slate-600 mt-2">
        {fn.description}
      </div>
    </div>
  ))}
</div>

                  {/* ===================================
                      DEPENDENCIES
                  =================================== */}

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

                            {item}

                          </span>

                        ))}

                      </div>

                    )}

                  </div>


                  <div className="mb-8">
  <h4 className="text-lg font-bold mb-4">
    🧩 Design Patterns
  </h4>

  <div className="flex flex-wrap gap-2">
    {(aiResult?.designPatterns || []).map((item, index) => (
      <span
        key={index}
        className="px-3 py-2 rounded-full bg-purple-100 text-purple-700"
      >
        {item}
      </span>
    ))}
  </div>
</div>

                  {/* ===================================
                      RISKS
                  =================================== */}

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

                            <p className="text-slate-700">

                              {risk}

                            </p>

                          </div>

                        ))}

                      </div>

                    )}

                  </div>
<div className="mb-8">
  <h4 className="text-lg font-bold mb-4">
    🔗 Related Files
  </h4>

  <div className="flex flex-wrap gap-2">
    {(aiResult?.relatedFiles || []).map((file, index) => (
      <span
        key={index}
        className="px-3 py-2 rounded-full bg-slate-100"
      >
        {file}
      </span>
    ))}
  </div>
</div>


<div className="grid md:grid-cols-2 gap-5 mb-8">

  <div className="rounded-xl border p-5">
    <h4 className="font-bold mb-3">
      Complexity
    </h4>

    <p>
      {aiResult?.complexity}
    </p>
  </div>

  <div className="rounded-xl border p-5">
    <h4 className="font-bold mb-3">
      Maintainability
    </h4>

    <p>
      {aiResult?.maintainability}
    </p>
  </div>

</div>

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
          className="rounded-xl border bg-emerald-50 p-4"
        >
          {item}
        </div>
      ))}
    </div>
  )}
</div>

                  {/* ===================================
                      AI IMPROVEMENTS
                  =================================== */}

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

                            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">

                              {index + 1}

                            </div>

                            <p className="leading-7 text-slate-700">

                              {item}

                            </p>

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