import { useState, useRef, useEffect } from "react";
import {
  Bug,
  Search,
  AlertTriangle,
  FileCode2,
  ShieldCheck,
  Wrench,
  Copy,
  Check,
  Loader2,
  Sparkles,
  X,
  Trash2,
  Zap,
  Download,
  RefreshCw,
  BookOpen,
  History,
  Layers,
  TrendingDown,
  Info,
  Code2,
  Activity,
  FileCheck2,
  HelpCircle,
} from "lucide-react";
import axios from "axios";
import IssueSolver from "../components/IssueSolver";
import { useAnalysis } from "../context/AnalysisContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ---------------------------------------------------------------------------
// Design tokens
// Panel: near-black instrument-console background, phosphor-amber accent
// (instead of the usual acid-green), mono type for data, grotesk for UI copy.
// Requires "JetBrains Mono" + "Inter" loaded (e.g. via a <link> in index.html
// or @font-face) — falls back to system mono/sans if unavailable.
// ---------------------------------------------------------------------------

const SEVERITY_STYLES = {
  Critical: "bg-[#2A1216] text-[#FF6B6B] ring-[#FF6B6B]/30 border-[#3A181C]",
  High: "bg-[#2A1710] text-[#FF8A5D] ring-[#FF8A5D]/30 border-[#3A1F14]",
  Medium: "bg-[#2A2110] text-[#FFB020] ring-[#FFB020]/30 border-[#3A2C14]",
  Low: "bg-[#161A24] text-[#8A93A8] ring-[#8A93A8]/20 border-[#232838]",
};

const CATEGORY_ICONS = {
  "Runtime Error": { icon: AlertTriangle, color: "text-[#FFB020] bg-[#2A2110]" },
  "Null Pointer": { icon: Bug, color: "text-[#FF6B6B] bg-[#2A1216]" },
  "Syntax Error": { icon: Code2, color: "text-[#C792FF] bg-[#1F1729]" },
  "Build Error": { icon: Wrench, color: "text-[#6FA8FF] bg-[#111C2E]" },
  "Dependency Error": { icon: Layers, color: "text-[#6FA8FF] bg-[#111C2E]" },
  "Memory Leak": { icon: Activity, color: "text-[#FF6B6B] bg-[#2A1216]" },
  "Performance Issue": { icon: TrendingDown, color: "text-[#FF8A5D] bg-[#2A1710]" },
  "Security Issue": { icon: ShieldCheck, color: "text-[#5FD9A0] bg-[#0F241C]" },
};

const LOADING_STEPS = [
  "Parsing call stack & stack trace...",
  "Categorizing exception pattern...",
  "Querying vector store for similar past bugs...",
  "Tracing repository git history...",
  "Evaluating affected files & symbol graphs...",
  "Calculating root cause probability...",
  "Synthesizing automated code fix...",
  "Generating unified diff patch...",
];

// One shared stylesheet for the panel's signature motion: a slow traveling
// scan-line across the header trace, and a soft phosphor glow used on the
// primary CTA and active tab indicator. Kept minimal and deliberate.
function PanelStyles() {
  return (
    <style>{`
      @keyframes dc-trace {
        0% { stroke-dashoffset: 240; }
        100% { stroke-dashoffset: 0; }
      }
      @keyframes dc-scan {
        0% { transform: translateX(-100%); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateX(100%); opacity: 0; }
      }
      @keyframes dc-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
      .dc-trace-line {
        stroke-dasharray: 6 6;
        animation: dc-trace 6s linear infinite;
      }
      .dc-scan-sweep {
        animation: dc-scan 2.4s ease-in-out infinite;
      }
      .dc-cursor {
        animation: dc-blink 1s step-end infinite;
      }
      @media (prefers-reduced-motion: reduce) {
        .dc-trace-line, .dc-scan-sweep, .dc-cursor { animation: none; }
      }
    `}</style>
  );
}

function TraceDivider() {
  return (
    <svg viewBox="0 0 400 16" className="w-full h-4" preserveAspectRatio="none" aria-hidden="true">
      <line
        x1="0" y1="8" x2="400" y2="8"
        stroke="#FFB020" strokeOpacity="0.35" strokeWidth="1"
        className="dc-trace-line"
      />
    </svg>
  );
}

function EmptyState() {
  return (
    <div className="bg-[#0F1420] rounded-xl ring-1 ring-[#232838] p-10 text-center max-w-2xl mx-auto relative overflow-hidden">
      <div className="mx-auto w-14 h-14 rounded-full bg-[#2A2110] flex items-center justify-center mb-4 ring-1 ring-[#FFB020]/20">
        <Sparkles className="text-[#FFB020]" size={26} />
      </div>
      <p className="font-mono text-[10px] tracking-[0.2em] text-[#7C879C] uppercase mb-2">
        debug://idle — awaiting input
      </p>
      <h3 className="text-[#E8ECF4] font-bold text-xl mb-2">AI Bug Solver &amp; Diagnostic Center</h3>
      <p className="text-[#8891A6] text-sm mb-6">
        Paste an error trace, runtime exception, or build log to trigger deep repository analysis.
      </p>

      {/* Supported Tech Badges */}
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {["JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "Spring Boot", "C++", "Stack Traces", "Build Logs"].map((tech) => (
          <span
            key={tech}
            className="bg-[#161A24] text-[#8891A6] text-xs px-2.5 py-1 rounded-md font-mono ring-1 ring-[#232838]"
          >
            {tech}
          </span>
        ))}
      </div>

      <div className="bg-[#0B0E14] rounded-lg p-5 text-left ring-1 ring-[#232838] grid sm:grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-mono font-semibold text-[#5FD9A0] uppercase tracking-[0.15em] mb-2">Automated Checks</p>
          <ul className="space-y-2 text-xs text-[#C4CAD9] font-medium">
            <li className="flex items-center gap-2"><Check size={14} className="text-[#5FD9A0]" /> Root Cause &amp; Call Stack Parsing</li>
            <li className="flex items-center gap-2"><Check size={14} className="text-[#5FD9A0]" /> Vector Similarity against Past Bugs</li>
            <li className="flex items-center gap-2"><Check size={14} className="text-[#5FD9A0]" /> Historical Git Commit Tracing</li>
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-mono font-semibold text-[#FFB020] uppercase tracking-[0.15em] mb-2">Fix Deliverables</p>
          <ul className="space-y-2 text-xs text-[#C4CAD9] font-medium">
            <li className="flex items-center gap-2"><Check size={14} className="text-[#5FD9A0]" /> Unified Code Diff (.diff download)</li>
            <li className="flex items-center gap-2"><Check size={14} className="text-[#5FD9A0]" /> Risk &amp; Impact Assessment</li>
            <li className="flex items-center gap-2"><Check size={14} className="text-[#5FD9A0]" /> "Why This Fix Works" Educational Guide</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtext, icon: Icon, colorClass, ledClass }) {
  return (
    <div className="bg-[#0F1420] rounded-xl ring-1 ring-[#232838] p-4 flex items-center justify-between">
      <div>
        <p className="text-[10px] font-mono font-semibold text-[#7C879C] uppercase tracking-[0.15em] mb-1.5 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${ledClass || "bg-[#5FD9A0]"}`} />
          {title}
        </p>
        <p className="text-xl font-bold text-[#E8ECF4] font-mono">{value}</p>
        {subtext && <p className="text-xs text-[#7C879C] mt-0.5">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon size={22} />
      </div>
    </div>
  );
}

export default function DebugCenter() {
  const [activeTab, setActiveTab] = useState("bug");
  const [resultTab, setResultTab] = useState("overview");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [failMsg, setFailMsg] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [responseTime, setResponseTime] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [history, setHistory] = useState([]);

  const { repositoryId } = useAnalysis();

  const inputRef = useRef(null);
  const resultRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (activeTab === "bug") {
      inputRef.current?.focus();
    }
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (!copyStatus) return;
    const timer = setTimeout(() => setCopyStatus(""), 2000);
    return () => clearTimeout(timer);
  }, [copyStatus]);

  useEffect(() => {
    if (!loading) {
      setLoadingStepIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStepIdx((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 600);
    return () => clearInterval(interval);
  }, [loading]);

  const handleAnalyze = async () => {
    if (loading) return;

    if (!error.trim()) {
      setFailMsg("Please enter an error message or stack trace first.");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setFailMsg("");
    setCopyStatus("");
    setResponseTime(null);
    setLoading(true);

    const startTime = performance.now();

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${API_BASE_URL}/repository/bug-solver`,
        {
          error: error.trim(),
          repositoryId,
        },
        {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data?.data) {
        throw new Error("Received invalid payload structure from server.");
      }

      const endTime = performance.now();
      const clientDuration = Math.round(endTime - startTime);
      const data = response.data.data;
      const duration = response.data.processingTimeMs ?? clientDuration;

      const analysisPayload = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        query: error.trim(),
        data,
        processingTimeMs: duration,
        model: response.data.model || "Gemini 3.1 Flash",
      };

      setResponseTime(duration);
      setResult(analysisPayload);
      setHistory((prev) => [analysisPayload, ...prev.slice(0, 4)]);
      setIsDirty(false);
      setResultTab("overview");

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      if (axios.isCancel(err) || err.name === "CanceledError") return;

      console.error(err);
      let message = "Failed to analyze the bug.";
      if (err.code === "ERR_NETWORK") {
        message = "Cannot connect to backend server. Verify your backend connection.";
      } else if (err.response?.status === 401) {
        message = "Access denied. Please log in again.";
      } else if (err.response?.status === 500) {
        message = "Internal server error occurred on the bug solver API.";
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.message) {
        message = err.message;
      }

      setFailMsg(message);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e) => {
    if (!loading && (e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const handleInputChange = (e) => {
    setError(e.target.value);
    setIsDirty(true);
    if (failMsg) setFailMsg("");
  };

  const handleClearAll = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setError("");
    setResult(null);
    setFailMsg("");
    setResponseTime(null);
    setLoading(false);
    setIsDirty(false);
    inputRef.current?.focus();
  };

  const restoreFromHistory = (item) => {
    setError(item.query);
    setResult(item);
    setResponseTime(item.processingTimeMs);
    setIsDirty(false);
    setResultTab("overview");
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleCopyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(label);
    } catch {
      setFailMsg(`Could not copy ${label}. Copy manually.`);
    }
  };

  const downloadPatchFile = () => {
    if (!result?.data?.patch) return;

    const patch = result.data.patch;
    const fileName = patch.file || "fix.diff";

    const oldLines = (patch.oldCode || "").split("\n");
    const newLines = (patch.newCode || "").split("\n");

    const diffContent = [
      `--- a/${fileName}`,
      `+++ b/${fileName}`,
      `@@ -1,${oldLines.length} +1,${newLines.length} @@`,
      ...oldLines.map((line) => `- ${line}`),
      ...newLines.map((line) => `+ ${line}`),
    ].join("\n");

    const blob = new Blob([diffContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fix-${Date.now()}.diff`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resData = result?.data;
  const categoryMeta =
    CATEGORY_ICONS[resData?.bugType] || { icon: AlertTriangle, color: "text-[#FFB020] bg-[#2A2110]" };
  const CategoryIcon = categoryMeta.icon;

  // Only render evidence the backend actually returned — never
  // fabricate stack frames, confidence reasons, risk data, or stats.
  const confidenceReasons = Array.isArray(resData?.confidenceReasons)
    ? resData.confidenceReasons
    : [];

  const stackBreakdown = Array.isArray(resData?.stackBreakdown)
    ? resData.stackBreakdown
    : [];

  const patchStats = resData?.patchStats || {
    filesModified: resData?.patch?.file ? 1 : 0,
    linesAdded: resData?.patch?.newCode
      ? resData.patch.newCode.split("\n").length
      : 0,
    linesDeleted: resData?.patch?.oldCode
      ? resData.patch.oldCode.split("\n").length
      : 0,
    functionsChanged: 0,
  };

  const riskAssessment = resData?.riskAssessment || null;

  // Backend returns "whyThisFixWorks" and "learning" — not "explanation".
  const learnExplanation = resData?.whyThisFixWorks || resData?.explanation || "";
  const learnTakeaway = resData?.learning || "";

  const generateFullReportMarkdown = () => {
    if (!resData) return "";
    return `
# Bug Analysis Report
**Timestamp:** ${result.timestamp}
**Bug Type:** ${resData.bugType || "Runtime Exception"}
**Severity:** ${resData.severity || "Medium"}
**Confidence:** ${resData.confidence}%

## Root Cause
${resData.rootCause}

## Affected Files
${(resData.affectedFiles || [resData.file]).map((f) => `- ${f}`).join("\n")}

## Recommended Fix
${resData.fix}

\`\`\`diff
--- ${resData.patch?.file || "file"}
+++ ${resData.patch?.file || "file"}
${resData.patch?.oldCode?.split("\n").map((l) => `- ${l}`).join("\n")}
${resData.patch?.newCode?.split("\n").map((l) => `+ ${l}`).join("\n")}
\`\`\`

## Why This Fix Works
${learnExplanation || "Not available."}

## Learning
${learnTakeaway || "Not available."}
`.trim();
  };

  const severityLed =
    resData?.severity === "Critical" || resData?.severity === "High"
      ? "bg-[#FF6B6B]"
      : resData?.severity === "Low"
      ? "bg-[#7C879C]"
      : "bg-[#FFB020]";

  return (
    <div className="min-h-screen bg-[#0B0E14] p-6 font-sans" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <PanelStyles />

      {/* Header */}
      <div className="mb-6">
        <p className="font-mono text-[11px] tracking-[0.25em] text-[#FFB020] uppercase mb-2">
          debug://root-cause-analysis
        </p>
        <h1 className="text-3xl font-bold flex items-center gap-3 text-[#E8ECF4]">
          <span className="p-2 rounded-lg bg-[#2A1216] ring-1 ring-[#FF6B6B]/20">
            <Bug className="text-[#FF6B6B]" size={26} />
          </span>
          Debug Center
        </h1>
        <p className="text-[#8891A6] mt-2 text-sm">
          Autonomous root cause analysis, stack tracing, and patch generation.
        </p>
        <TraceDivider />
      </div>

      {/* Main Tabs — segmented channel selector */}
      <div className="inline-flex gap-1 mb-6 p-1 rounded-lg bg-[#0F1420] ring-1 ring-[#232838]">
        <button
          onClick={() => setActiveTab("bug")}
          className={`px-5 py-2 rounded-md font-medium text-sm transition-colors font-mono ${
            activeTab === "bug"
              ? "bg-[#FFB020] text-[#0B0E14] shadow-[0_0_16px_rgba(255,176,32,0.35)]"
              : "text-[#8891A6] hover:text-[#C4CAD9]"
          }`}
        >
          Bug Solver
        </button>

        <button
          onClick={() => setActiveTab("issue")}
          className={`px-5 py-2 rounded-md font-medium text-sm transition-colors font-mono ${
            activeTab === "issue"
              ? "bg-[#FFB020] text-[#0B0E14] shadow-[0_0_16px_rgba(255,176,32,0.35)]"
              : "text-[#8891A6] hover:text-[#C4CAD9]"
          }`}
        >
          GitHub Issue Solver
        </button>
      </div>

      {activeTab === "bug" ? (
        <>
          {/* Main Input Box */}
          <div className="bg-[#0F1420] rounded-xl ring-1 ring-[#232838] p-6 mb-6">
            <div className="relative flex flex-col sm:flex-row gap-3 items-start">
              <div className="relative w-full">
                <textarea
                  ref={inputRef}
                  rows={5}
                  value={error}
                  disabled={loading}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Paste stack traces, exception messages, runtime errors, or build logs... (Ctrl + Enter to analyze)"
                  className="w-full bg-[#0B0E14] border border-[#232838] text-[#E8ECF4] placeholder:text-[#5A6376] rounded-lg pl-4 pr-10 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB020] focus:border-[#FFB020] transition-shadow font-mono text-sm resize-y disabled:bg-[#0F1420] disabled:text-[#5A6376]"
                />

                {error && !loading && (
                  <button
                    onClick={handleClearAll}
                    title="Clear input and reset view"
                    className="absolute top-3 right-3 text-[#5A6376] hover:text-[#C4CAD9] p-1 rounded-md transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <button
                onClick={handleAnalyze}
                disabled={loading || !error.trim()}
                className="w-full sm:w-auto self-stretch sm:self-auto bg-[#FFB020] hover:bg-[#FFC352] disabled:bg-[#3A2F1A] disabled:text-[#5A6376] disabled:cursor-not-allowed text-[#0B0E14] px-6 py-3 sm:py-0 rounded-lg flex items-center justify-center gap-2 font-semibold font-mono transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB020] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1420]"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    Analyze
                  </>
                )}
              </button>
            </div>

            {/* Input dirty indicator */}
            {isDirty && result && !loading && (
              <div className="mt-3 flex items-center justify-between text-xs text-[#FFB020] bg-[#2A2110] ring-1 ring-[#FFB020]/20 rounded-lg px-3 py-2">
                <span>Input trace changed. Re-analyze to refresh diagnosis.</span>
                <button
                  onClick={handleAnalyze}
                  className="font-semibold underline hover:text-[#FFC352] flex items-center gap-1"
                >
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>
            )}

            {/* Error Banner */}
            {failMsg && (
              <div className="mt-3 flex items-center gap-2 text-sm text-[#FF8A8A] bg-[#2A1216] ring-1 ring-[#FF6B6B]/20 rounded-lg px-3 py-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span className="flex-1">{failMsg}</span>
                <button onClick={() => setFailMsg("")} className="text-[#FF8A8A] hover:text-[#FFB3B3] p-1">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Recent History Pills */}
          {history.length > 0 && (
            <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 text-xs">
              <span className="flex items-center gap-1 text-[#5A6376] font-mono font-semibold uppercase tracking-wider shrink-0">
                <History size={14} /> Recent:
              </span>
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => restoreFromHistory(item)}
                  className={`shrink-0 px-3 py-1.5 rounded-full border transition font-mono max-w-[200px] truncate ${
                    result?.id === item.id
                      ? "bg-[#2A2110] border-[#FFB020]/40 text-[#FFB020] font-medium"
                      : "bg-[#0F1420] border-[#232838] text-[#8891A6] hover:bg-[#161A24]"
                  }`}
                >
                  {item.data.bugType || "Exception"} ({item.timestamp})
                </button>
              ))}
            </div>
          )}

          {!result && !loading && <EmptyState />}

          {/* Progressive Reasoning Animation — terminal boot sequence */}
          {loading && (
            <div className="bg-[#0F1420] rounded-xl ring-1 ring-[#232838] p-8 max-w-lg mx-auto relative overflow-hidden">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#FFB020] dc-cursor" />
                <h3 className="font-mono text-sm text-[#C4CAD9] tracking-wide">AI REASONING SEQUENCE</h3>
              </div>

              {/* segmented progress trace synced to the active step */}
              <div className="flex gap-1 mb-6 mt-4">
                {LOADING_STEPS.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      idx <= loadingStepIdx ? "bg-[#FFB020]" : "bg-[#232838]"
                    }`}
                  />
                ))}
              </div>

              <div className="space-y-3 font-mono">
                {LOADING_STEPS.map((step, idx) => {
                  const isDone = idx < loadingStepIdx;
                  const isCurrent = idx === loadingStepIdx;

                  return (
                    <div key={step} className="flex items-center gap-3 text-xs">
                      {isDone ? (
                        <Check size={14} className="text-[#5FD9A0] shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 size={14} className="animate-spin text-[#FFB020] shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-[#232838] shrink-0" />
                      )}
                      <span
                        className={
                          isDone
                            ? "text-[#5A6376] line-through"
                            : isCurrent
                            ? "text-[#FFB020]"
                            : "text-[#5A6376]"
                        }
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* ambient scanline sweeping the panel */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-[#FFB020]/5 to-transparent dc-scan-sweep" />
            </div>
          )}

          {/* Analysis Results View */}
          {result && !loading && resData && (
            <div ref={resultRef} className="space-y-6">
              {/* TOP METRICS ROW */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  title="Error Class"
                  value={resData.bugType || "Runtime Exception"}
                  subtext={resData.file ? `In ${resData.file.split("/").pop()}` : "Global Scope"}
                  icon={CategoryIcon}
                  colorClass={categoryMeta.color}
                  ledClass="bg-[#6FA8FF]"
                />
                <MetricCard
                  title="Severity"
                  value={resData.severity || "Medium"}
                  subtext="Impact Score"
                  icon={AlertTriangle}
                  colorClass={
                    resData.severity === "Critical" || resData.severity === "High"
                      ? "text-[#FF6B6B] bg-[#2A1216]"
                      : "text-[#FFB020] bg-[#2A2110]"
                  }
                  ledClass={severityLed}
                />
                <MetricCard
                  title="AI Confidence"
                  value={`${resData.confidence ?? 0}%`}
                  subtext="Certainty Score"
                  icon={ShieldCheck}
                  colorClass="text-[#5FD9A0] bg-[#0F241C]"
                  ledClass="bg-[#5FD9A0]"
                />
                <MetricCard
                  title="Processing Time"
                  value={`${(responseTime / 1000).toFixed(1)}s`}
                  subtext={`Model: ${result.model}`}
                  icon={Zap}
                  colorClass="text-[#FFB020] bg-[#2A2110]"
                  ledClass="bg-[#FFB020]"
                />
              </div>

              {/* ACTION TOOLBAR */}
              <div className="bg-[#0F1420] rounded-xl p-4 ring-1 ring-[#232838] flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-[#C4CAD9] text-xs uppercase tracking-wider">Quick Actions</span>
                  {copyStatus && (
                    <span className="text-xs bg-[#0F241C] text-[#5FD9A0] px-2 py-0.5 rounded font-medium">
                      ✓ Copied {copyStatus}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleCopyToClipboard(resData.fix || "", "Fix Description")}
                    className="px-3 py-1.5 bg-[#161A24] hover:bg-[#1E2433] text-[#C4CAD9] rounded-lg font-medium text-xs flex items-center gap-1.5 transition ring-1 ring-[#232838]"
                  >
                    <Copy size={13} /> Copy Fix
                  </button>
                  <button
                    onClick={() => handleCopyToClipboard(resData.rootCause || "", "Root Cause")}
                    className="px-3 py-1.5 bg-[#161A24] hover:bg-[#1E2433] text-[#C4CAD9] rounded-lg font-medium text-xs flex items-center gap-1.5 transition ring-1 ring-[#232838]"
                  >
                    <Copy size={13} /> Copy Root Cause
                  </button>
                  <button
                    onClick={() => handleCopyToClipboard(generateFullReportMarkdown(), "Full Report")}
                    className="px-3 py-1.5 bg-[#2A2110] hover:bg-[#3A2C14] text-[#FFB020] rounded-lg font-medium text-xs flex items-center gap-1.5 transition ring-1 ring-[#FFB020]/20"
                  >
                    <FileCheck2 size={13} /> Copy Full Markdown Report
                  </button>
                  <button
                    onClick={downloadPatchFile}
                    className="px-3 py-1.5 bg-[#FFB020] hover:bg-[#FFC352] text-[#0B0E14] rounded-lg font-semibold text-xs flex items-center gap-1.5 transition"
                  >
                    <Download size={13} /> Download Patch (.diff)
                  </button>
                </div>
              </div>

              {/* SECTION NAVIGATION TABS */}
              <div className="border-b border-[#232838] flex gap-6 text-sm font-medium font-mono overflow-x-auto">
                {[
                  { id: "overview", label: "Overview & Causes" },
                  { id: "stack", label: "Stack Trace Breakdown" },
                  { id: "patch", label: "Code Patch & Stats" },
                  { id: "impact", label: "Impact & Similarity" },
                  { id: "learn", label: "AI Insights & Learn" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setResultTab(tab.id)}
                    className={`pb-3 border-b-2 transition whitespace-nowrap ${
                      resultTab === tab.id
                        ? "border-[#FFB020] text-[#FFB020] font-semibold"
                        : "border-transparent text-[#7C879C] hover:text-[#C4CAD9]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: OVERVIEW & CAUSES */}
              {resultTab === "overview" && (
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Root Cause Card */}
                  <div className="lg:col-span-2 bg-[#0F1420] rounded-xl ring-1 ring-[#232838] p-6">
                    <h2 className="font-semibold text-lg text-[#E8ECF4] flex items-center gap-2 mb-4">
                      <ShieldCheck className="text-[#5FD9A0]" size={20} /> Root Cause Analysis
                    </h2>
                    <p className="text-[#C4CAD9] leading-relaxed text-sm whitespace-pre-line">
                      {resData.rootCause || "No root cause details provided."}
                    </p>

                    <div className="mt-6 pt-6 border-t border-[#232838]">
                      <h3 className="font-medium text-sm text-[#E8ECF4] mb-2">Recommended Fix Action</h3>
                      <p className="text-[#8891A6] text-sm leading-relaxed">{resData.fix}</p>
                    </div>
                  </div>

                  {/* Confidence Breakdown Sidebar */}
                  <div className="bg-[#0F1420] rounded-xl ring-1 ring-[#232838] p-6 space-y-6">
                    <div>
                      <h3 className="font-semibold text-sm text-[#E8ECF4] mb-3 flex items-center gap-1.5">
                        <Info size={16} className="text-[#FFB020]" /> Confidence Breakdown
                      </h3>
                      {confidenceReasons.length > 0 ? (
                        <div className="space-y-2">
                          {confidenceReasons.map((reason, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-[#8891A6]">
                              <Check size={14} className="text-[#5FD9A0] shrink-0 mt-0.5" />
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#5A6376]">
                          No additional confidence evidence was returned.
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-[#232838]">
                      <h3 className="font-semibold text-sm text-[#E8ECF4] mb-2">Fix Risk Assessment</h3>
                      {riskAssessment ? (
                        <div className="bg-[#0B0E14] p-3 rounded-lg ring-1 ring-[#232838] text-xs space-y-1.5">
                          <div className="flex justify-between font-medium">
                            <span className="text-[#8891A6]">Risk Level:</span>
                            <span className="text-[#E8ECF4] font-bold font-mono">
                              {riskAssessment.level || "Unknown"}
                            </span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span className="text-[#8891A6]">Rollback Chance:</span>
                            <span className="text-[#E8ECF4] font-mono">
                              {riskAssessment.rollbackChance || "Unknown"}
                            </span>
                          </div>
                          <p className="text-[#7C879C] pt-1 leading-normal">
                            {riskAssessment.reason || "No risk assessment available."}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-[#5A6376] bg-[#0B0E14] p-3 rounded-lg ring-1 ring-[#232838]">
                          Risk assessment is not available from the supplied repository evidence.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STACK TRACE BREAKDOWN */}
              {resultTab === "stack" && (
                <div className="bg-[#0F1420] rounded-xl ring-1 ring-[#232838] p-6 space-y-6">
                  <div>
                    <h2 className="font-semibold text-lg text-[#E8ECF4] mb-1">Parsed Call Stack</h2>
                    <p className="text-[#7C879C] text-xs">Visual execution flow leading to the exception frame.</p>
                  </div>

                  {stackBreakdown.length > 0 ? (
                    <div className="space-y-3 relative before:absolute before:left-[19px] before:top-3 before:bottom-3 before:w-0.5 before:bg-[#232838]">
                      {stackBreakdown.map((frame, idx) => {
                        const isErrorFrame = idx === stackBreakdown.length - 1;
                        return (
                          <div key={idx} className="relative flex items-center gap-4 pl-10">
                            <div
                              className={`absolute left-2.5 w-4 h-4 rounded-full border-2 bg-[#0F1420] flex items-center justify-center ${
                                isErrorFrame ? "border-[#FF6B6B]" : "border-[#FFB020]"
                              }`}
                            />
                            <div
                              className={`flex-1 p-3.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                                isErrorFrame
                                  ? "bg-[#2A1216]/60 border-[#3A181C] text-[#FF8A8A]"
                                  : "bg-[#0B0E14] border-[#232838] text-[#C4CAD9]"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{frame.functionName || "anonymous"}</span>
                                <span className="text-[#5A6376]">in</span>
                                <span className="underline">{frame.file}</span>
                              </div>
                              <span className="font-semibold text-[#7C879C]">Line {frame.line || "?"}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-[#0B0E14] rounded-lg p-4 text-sm text-[#7C879C] ring-1 ring-[#232838]">
                      Stack trace breakdown is not available from the supplied evidence.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CODE PATCH & STATS */}
              {resultTab === "patch" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-[#0F1420] p-4 rounded-xl ring-1 ring-[#232838] text-center">
                      <p className="text-[10px] text-[#7C879C] uppercase font-mono font-medium tracking-wider">Modified Files</p>
                      <p className="text-xl font-bold text-[#E8ECF4] font-mono mt-1">{patchStats.filesModified}</p>
                    </div>
                    <div className="bg-[#0F1420] p-4 rounded-xl ring-1 ring-[#232838] text-center">
                      <p className="text-[10px] text-[#7C879C] uppercase font-mono font-medium tracking-wider">Lines Added</p>
                      <p className="text-xl font-bold text-[#5FD9A0] font-mono mt-1">+{patchStats.linesAdded}</p>
                    </div>
                    <div className="bg-[#0F1420] p-4 rounded-xl ring-1 ring-[#232838] text-center">
                      <p className="text-[10px] text-[#7C879C] uppercase font-mono font-medium tracking-wider">Lines Deleted</p>
                      <p className="text-xl font-bold text-[#FF6B6B] font-mono mt-1">-{patchStats.linesDeleted}</p>
                    </div>
                    <div className="bg-[#0F1420] p-4 rounded-xl ring-1 ring-[#232838] text-center">
                      <p className="text-[10px] text-[#7C879C] uppercase font-mono font-medium tracking-wider">Functions Impacted</p>
                      <p className="text-xl font-bold text-[#FFB020] font-mono mt-1">{patchStats.functionsChanged}</p>
                    </div>
                  </div>

                  {resData.patch && (resData.patch.oldCode || resData.patch.newCode) ? (
                    <div className="bg-[#0B0E14] rounded-xl overflow-hidden ring-1 ring-[#232838] font-mono text-xs">
                      <div className="bg-[#0F1420] px-4 py-3 flex items-center justify-between border-b border-[#232838] text-[#C4CAD9]">
                        <span className="font-semibold flex items-center gap-2">
                          <FileCode2 size={14} className="text-[#FFB020]" />
                          {resData.patch.file || "diff"}
                        </span>
                        <button
                          onClick={downloadPatchFile}
                          className="hover:text-[#FFB020] flex items-center gap-1 text-[#7C879C] font-sans text-xs transition-colors"
                        >
                          <Download size={13} /> Save Diff
                        </button>
                      </div>

                      <div className="p-4 overflow-x-auto space-y-1">
                        {resData.patch.oldCode && (
                          <div className="bg-[#2A1216]/40 text-[#FF8A8A] p-2 rounded border-l-2 border-[#FF6B6B] whitespace-pre">
                            <span className="select-none text-[#FF6B6B] mr-2">-</span>
                            {resData.patch.oldCode}
                          </div>
                        )}
                        {resData.patch.newCode && (
                          <div className="bg-[#0F241C]/40 text-[#7EEAB8] p-2 rounded border-l-2 border-[#5FD9A0] whitespace-pre">
                            <span className="select-none text-[#5FD9A0] mr-2">+</span>
                            {resData.patch.newCode}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#0B0E14] rounded-lg p-4 text-sm text-[#7C879C] ring-1 ring-[#232838]">
                      No verified code patch is available for this diagnosis.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: IMPACT & SIMILARITY */}
              {resultTab === "impact" && (
                <div className="bg-[#0F1420] rounded-xl ring-1 ring-[#232838] p-6 space-y-4">
                  <h2 className="font-semibold text-[#E8ECF4] text-base">Impacted Files &amp; Dependencies</h2>
                  <div className="divide-y divide-[#1E2433]">
                    {(resData.affectedFiles || [resData.file || "Unknown File"]).map((f, i) => (
                      <div key={i} className="py-3 flex items-center justify-between text-sm">
                        <span className="font-mono text-[#C4CAD9] flex items-center gap-2">
                          <FileCode2 size={16} className="text-[#FFB020]" />
                          {f}
                        </span>
                        <span className="text-xs bg-[#161A24] text-[#8891A6] px-2 py-1 rounded font-mono ring-1 ring-[#232838]">
                          Direct Reference
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: AI INSIGHTS & LEARN */}
              {resultTab === "learn" && (
                <div className="bg-[#0F1420] rounded-xl ring-1 ring-[#232838] p-6 space-y-6">
                  <div>
                    <h2 className="font-semibold text-[#E8ECF4] text-base flex items-center gap-2 mb-2">
                      <BookOpen size={18} className="text-[#FFB020]" />
                      Why This Fix Works
                    </h2>
                    <p className="text-[#8891A6] text-sm leading-relaxed whitespace-pre-line">
                      {learnExplanation || "No educational explanation available for this diagnostic patch."}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#232838]">
                    <h2 className="font-semibold text-[#E8ECF4] text-base flex items-center gap-2 mb-2">
                      <HelpCircle size={18} className="text-[#FFB020]" />
                      Key Takeaway
                    </h2>
                    <p className="text-[#8891A6] text-sm leading-relaxed whitespace-pre-line">
                      {learnTakeaway || "No takeaway available for this diagnostic patch."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <IssueSolver />
      )}
    </div>
  );
}