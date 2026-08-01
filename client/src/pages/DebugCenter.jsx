import { useState, useCallback } from "react";
import {
  Bug,
  Search,
  AlertTriangle,
  FileCode2,
  GitCommit,
  ShieldCheck,
  Wrench,
  Copy,
  Check,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import axios from "axios";
const SEVERITY_STYLES = {
  Critical: "bg-rose-50 text-rose-700 ring-rose-600/20",
  High: "bg-red-50 text-red-700 ring-red-600/20",
  Medium: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Low: "bg-slate-100 text-slate-700 ring-slate-500/20",
};

function analyzeStub(errorText) {
  // Placeholder for a real API call (e.g. axios.post('/api/analyze', { errorText }))
  // Swap this out for your backend integration; keep the same result shape.
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        bugType: "Null Pointer Exception",
        severity: "High",
        confidence: 92,
        file: "src/services/auth.js",
        line: 128,
        rootCause:
          "The 'user' object can become undefined when JWT verification fails before accessing user.id.",
        affectedFiles: [
          "src/services/auth.js",
          "src/middleware/auth.js",
          "src/routes/login.js",
        ],
        relatedCommits: [
          "fix: handle invalid JWT",
          "refactor authentication middleware",
          "improve login validation",
        ],
        fix: "Add a null check before accessing user.id.",
        patch: `if (!user) {
  return res.status(401).json({
    message: "Unauthorized"
  });
}

const id = user.id;`,
      });
    }, 1200);
  });
}

function SectionCard({ icon: Icon, iconClassName, title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 p-6">
      <h2 className="font-semibold text-lg mb-4 flex items-center gap-2 text-slate-900">
        <Icon size={20} className={iconClassName} />
        {title}
      </h2>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 p-12 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
        <Sparkles className="text-indigo-500" size={22} />
      </div>
      <h3 className="text-slate-900 font-semibold mb-1">No analysis yet</h3>
      <p className="text-slate-500 text-sm max-w-sm mx-auto">
        Paste an error message or stack trace above and select Analyze to get
        a root-cause breakdown and suggested fix.
      </p>
    </div>
  );
}


function DebugCenter() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [failMsg, setFailMsg] = useState("");
  const [copied, setCopied] = useState(false);
const handleAnalyze = async () => {
  if (!error.trim()) return;

  setLoading(true);

  try {
  const response = await axios.post(
  "http://localhost:5000/repository/bug-solver",
  {
    error,
  }
);

   setResult(response.data.data);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) handleAnalyze();
  };

  const copyPatch = async () => {
    if (!result) return;
    try {
     await navigator.clipboard.writeText(
`File: ${result.patch.file}

Old Code:

${result.patch.oldCode}

New Code:

${result.patch.newCode}`
);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setFailMsg("Couldn't copy to clipboard. Copy the patch manually.");
    }
  };

  const severityClass =
    (result && SEVERITY_STYLES[result.severity]) || SEVERITY_STYLES.Medium;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
          <Bug className="text-red-500" />
          Debug Center
        </h1>
        <p className="text-slate-600 mt-2">
          Analyze bugs using AI, commit history, and repository context.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 p-6 mb-6">
        <div className="flex gap-3">
          <input
            value={error}
            onChange={(e) => setError(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste an error or stack trace..."
            aria-label="Error or stack trace"
            aria-invalid={Boolean(failMsg)}
            className="flex-1 border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
          />

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white px-6 rounded-lg flex items-center gap-2 font-medium transition-colors"
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

        {failMsg && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-700 bg-red-50 ring-1 ring-red-600/20 rounded-lg px-3 py-2">
            <AlertTriangle size={16} className="shrink-0" />
            {failMsg}
            <button
              onClick={() => setFailMsg("")}
              aria-label="Dismiss error"
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {!result && !loading && <EmptyState />}

      {loading && !result && (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 p-12 text-center text-slate-500">
          <Loader2 className="animate-spin mx-auto mb-3 text-indigo-500" size={24} />
          Analyzing your error against the codebase and commit history...
        </div>
      )}

      {result && (
        <>
          {/* Top Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            <SectionCard
              icon={AlertTriangle}
              iconClassName="text-red-500"
              title="Bug Details"
            >
              <div className="space-y-3 text-slate-700">
                <p>
                  <span className="font-medium text-slate-900">Type:</span>{" "}
                  {result.bugType}
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">Severity:</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${severityClass}`}
                  >
                    {result.severity}
                  </span>
                </p>
                <p>
                  <span className="font-medium text-slate-900">File:</span>{" "}
                  <code className="bg-slate-100 rounded px-1.5 py-0.5 text-sm">
                    {result.file}
                  </code>
                </p>
                <p>
                  <span className="font-medium text-slate-900">Line:</span>{" "}
                  {result.line}
                </p>
                <p>
                  <span className="font-medium text-slate-900">
                    Confidence:
                  </span>{" "}
                  {result.confidence}%
                </p>
              </div>
            </SectionCard>

            <SectionCard
              icon={ShieldCheck}
              iconClassName="text-green-600"
              title="Root Cause"
            >
              <p className="text-slate-700 leading-7">{result.rootCause}</p>
            </SectionCard>
          </div>

          {/* Middle Grid */}
          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <SectionCard icon={FileCode2} iconClassName="text-slate-500" title="Affected Files">
              <ul className="space-y-2">
                {result.affectedFiles.map((file) => (
                  <li
                    key={file}
                    className="bg-slate-50 ring-1 ring-slate-900/5 rounded-lg px-3 py-2 text-sm font-mono text-slate-700"
                  >
                    {file}
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard icon={GitCommit} iconClassName="text-slate-500" title="Related Commits">
             <ul className="space-y-2">
  {result.relatedCommits.map((commit, index) => (
    <li
      key={commit.hash || index}
      className="bg-slate-50 ring-1 ring-slate-900/5 rounded-lg px-3 py-2"
    >
      <div className="font-medium text-slate-800">
        {commit.message}
      </div>

      <div className="text-xs text-slate-500 mt-1">
        {commit.hash}
      </div>

      <div className="text-xs text-slate-400">
        {commit.date}
      </div>
    </li>
  ))}
</ul>
            </SectionCard>
          </div>

          {/* Fix */}
         {/* Fix */}
<div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 p-6 mt-6">
  <h2 className="font-semibold text-lg mb-4 flex items-center gap-2 text-slate-900">
    <Wrench className="text-indigo-600" size={20} />
    Suggested Fix
  </h2>

  <p className="mb-6 text-slate-700">{result.fix}</p>

  {result.patch && (
    <div className="space-y-5">

      <div>
        <p className="font-semibold text-slate-800 mb-2">
          📄 File
        </p>

        <code className="bg-slate-100 px-3 py-2 rounded-lg block">
          {result.patch.file}
        </code>
      </div>

      <div>
        <p className="font-semibold text-red-600 mb-2">
          ❌ Old Code
        </p>

        <pre className="bg-slate-900 text-red-300 rounded-xl p-4 overflow-auto text-sm">
{result.patch.oldCode}
        </pre>
      </div>

      <div>
        <p className="font-semibold text-green-600 mb-2">
          ✅ New Code
        </p>

        <pre className="bg-slate-900 text-green-300 rounded-xl p-4 overflow-auto text-sm">
{result.patch.newCode}
        </pre>
      </div>

    </div>
  )}

  <button
    onClick={copyPatch}
    className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg flex items-center gap-2"
  >
    {copied ? (
      <>
        <Check size={16} />
        Copied
      </>
    ) : (
      <>
        <Copy size={16} />
        Copy Patch
      </>
    )}
  </button>
</div>
        </>
      )}
    </div>
  );
}

export default DebugCenter;