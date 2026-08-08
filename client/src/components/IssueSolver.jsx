import { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import API from "../services/api"; // 1. Custom Axios instance with interceptors
import { useAnalysis } from "../context/AnalysisContext";
import {
  Bug,
  Sparkles,
  Loader2,
  AlertCircle,
  Download,
  FileCode,
  CheckCircle2,
  GitCommit,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

function parseOwnerRepo(url) {
  if (!url) return null;

  if (url.startsWith("git@github.com:")) {
    const path = url.replace("git@github.com:", "").replace(/\.git$/, "");
    const [owner, repo] = path.split("/");
    if (!owner || !repo) return null;
    return { owner, repo };
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com" && parsed.hostname !== "www.github.com") {
      return null;
    }

    const parts = parsed.pathname
      .replace(/^\/|\/$/g, "")
      .replace(/\.git$/, "")
      .split("/");

    if (parts.length < 2) return null;

    return { owner: parts[0], repo: parts[1] };
  } catch {
    return null;
  }
}

export default function IssueSolver() {
  const location = useLocation();
  const params = useParams();

  // 2. Safely extract properties from AnalysisContext
  const { analysis, repositoryId } = useAnalysis();
  const contextRepoUrl = analysis?.repoUrl;
  const contextRepository = analysis?.repository;

  // 3. Fallback strategy: Context -> sessionStorage -> Router Params/State
  const sessionRepoUrl = sessionStorage.getItem("repoUrl");
  const sessionRepoData = sessionStorage.getItem("repositoryData")
    ? JSON.parse(sessionStorage.getItem("repositoryData"))
    : null;

  const repoUrl =
    contextRepoUrl ||
    sessionRepoUrl ||
    location.state?.repoUrl ||
    (params.owner && params.repo ? `https://github.com/${params.owner}/${params.repo}` : "");

  const repository = contextRepository || sessionRepoData || location.state?.repository || null;

  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [solution, setSolution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [solving, setSolving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [solveError, setSolveError] = useState("");

  // Fetch Issues when repoUrl is available
  async function loadIssues() {
    setLoadError("");
    setSolveError("");
    setSolution(null);
    setSelectedIssue(null);
    setIssues([]);

    if (!repoUrl) {
      setLoadError("No repository found. Please analyze a repository from the Home page first.");
      return;
    }

    const parsed = parseOwnerRepo(repoUrl);
    if (!parsed) {
      setLoadError("Invalid GitHub repository URL.");
      return;
    }

    try {
      setLoading(true);
      
      // Axios interceptor handles Authorization headers automatically
      const response = await API.post("/repository/issues", { repoUrl });

      if (response.data.repository) {
        sessionStorage.setItem("repositoryData", JSON.stringify(response.data.repository));
      }
      setIssues(response.data.issues || []);
    } catch (error) {
      console.error(error);
      setLoadError(
        error.response?.data?.message || "Unable to load issues for this repository."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (repoUrl) {
      loadIssues();
    }
  }, [repoUrl]);

  async function solveIssue(issue) {
    setSelectedIssue(issue);
    setSolution(null);
    setSolveError("");

    const parsed = parseOwnerRepo(repoUrl);
    if (!parsed) {
      setSolveError("Invalid repository URL.");
      return;
    }

    try {
      setSolving(true);

      const response = await API.post("/repository/issue-solution", {
        owner: parsed.owner,
        repo: parsed.repo,
        issueNumber: issue.number,
        repositoryId,
      });

      setSolution(response.data.solution);
    } catch (error) {
      console.error(error);
      setSolveError(
        error.response?.data?.message || "Failed to generate AI solution."
      );
    } finally {
      setSolving(false);
    }
  }

  const downloadPDF = () => {
    if (!solution || !selectedIssue) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Issue #${selectedIssue.number}: ${selectedIssue.title}`, 14, 20);

    doc.setFontSize(12);
    doc.text(`Repository: ${repository?.owner}/${repository?.name}`, 14, 28);
    doc.text(`Confidence: ${solution.confidence}% | Complexity: ${solution.complexity}`, 14, 34);

    autoTable(doc, {
      startY: 40,
      head: [["Category", "Details"]],
      body: [
        ["Summary", solution.summary || "N/A"],
        ["Root Cause", solution.rootCause || "N/A"],
        ["Solution", solution.solution || "N/A"],
        ["Affected Files", (solution.affectedFiles || []).join(", ") || "None"],
      ],
      styles: { cellWidth: "wrap" },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 140 } },
    });

    doc.save(`Issue-${selectedIssue.number}-Solution.pdf`);
  };

  function getLanguageColor(language) {
    const colors = {
      JavaScript: "#f1e05a",
      TypeScript: "#3178c6",
      Java: "#b07219",
      Python: "#3572A5",
      C: "#555555",
      "C++": "#f34b7d",
      Go: "#00ADD8",
      Rust: "#dea584",
      HTML: "#e34c26",
      CSS: "#563d7c",
    };
    return colors[language] || "#6b7280";
  }

  return (
    <div className="min-h-screen bg-[#0D1117] text-white">
      {/* Header */}
      <div className="border-b border-[#30363D] bg-[#161B22]">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-600 p-3 rounded-xl">
              <Bug size={30} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI GitHub Issue Solver</h1>
              <p className="text-gray-400 mt-1">
                {repository
                  ? `Issues for ${repository.owner}/${repository.name}, analyzed by Gemini.`
                  : "Analyze GitHub repositories and let Gemini generate repository-aware solutions."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        {!repoUrl && (
          <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 flex gap-3">
            <AlertCircle className="text-yellow-500 shrink-0" />
            <p className="text-gray-300">
              No repository found in context or session. Please analyze a repository from the Home page first.
            </p>
          </div>
        )}

        {loadError && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex gap-3 mb-6">
            <AlertCircle className="text-red-500 shrink-0" />
            <p>{loadError}</p>
          </div>
        )}

        {/* Repository Overview */}
        {repository && (
          <div className="mt-2 bg-[#161B22] border border-[#30363D] rounded-2xl p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <FaGithub size={22} />
                  <h2 className="text-2xl font-bold">
                    {repository.owner}/{repository.name}
                  </h2>
                </div>
                <p className="mt-3 text-gray-400">
                  {repository.description || "No description provided."}
                </p>
              </div>
              <img
                src={repository.avatarUrl || "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"}
                alt="Avatar"
                className="w-16 h-16 rounded-full border border-[#30363D]"
              />
            </div>

            <div className="flex gap-8 mt-6 text-sm">
              <div>⭐ {repository.stars ?? 0}</div>
              <div>forks {repository.forks ?? 0}</div>
              <div>🐞 {issues.length} Issues</div>
              {repository.language && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: getLanguageColor(repository.language) }}
                  />
                  {repository.language}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Issues & Solution Panel */}
        <div className="grid lg:grid-cols-5 gap-8 mt-8">
          {/* Issues List */}
          <div className="lg:col-span-2">
            <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-5">
              <h2 className="font-bold text-xl mb-5">Repository Issues</h2>

              {loading && (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-green-500" size={40} />
                </div>
              )}

              {!loading && repoUrl && issues.length === 0 && (
                <div className="text-center py-16">
                  <Bug size={55} className="mx-auto text-gray-600" />
                  <h3 className="mt-5 text-xl font-semibold">No Issues Found</h3>
                  <p className="text-gray-500 mt-2">
                    This repository doesn't have any open issues.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {issues.map((issue) => (
                  <div
                    key={issue.id || issue.number}
                    className={`rounded-xl border transition-all p-5 cursor-pointer ${
                      selectedIssue?.id === issue.id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-[#30363D] hover:border-green-500 bg-[#0D1117]"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-green-400">#{issue.number}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                              issue.state === "open" ? "bg-green-600" : "bg-red-600"
                            }`}
                          >
                            {issue.state}
                          </span>
                        </div>

                        <h3 className="font-semibold mt-3">{issue.title}</h3>
                        <p className="text-gray-400 mt-2 text-sm line-clamp-3">
                          {issue.body || "No description"}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-4">
                          {(issue.labels || []).map((label, idx) => (
                            <span
                              key={idx}
                              className="bg-[#21262D] text-xs px-3 py-1 rounded-full text-gray-300"
                            >
                              {typeof label === "object" ? label.name : label}
                            </span>
                          ))}
                        </div>

                        <div className="mt-4 text-xs text-gray-500">
                          Opened by <span className="text-white">{issue.author || "Unknown"}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => solveIssue(issue)}
                        disabled={solving && selectedIssue?.id === issue.id}
                        className="ml-4 bg-blue-600 hover:bg-blue-700 text-sm px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-60 transition-colors"
                      >
                        {solving && selectedIssue?.id === issue.id ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            Solving...
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} />
                            Solve
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Solution Card */}
          <div className="lg:col-span-3">
            <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 min-h-[700px]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <Sparkles className="text-yellow-500" />
                  AI Solution
                </h2>
                {solution && (
                  <button
                    onClick={downloadPDF}
                    className="flex items-center gap-2 bg-[#21262D] hover:bg-[#30363D] border border-gray-700 px-3 py-1.5 rounded-lg text-sm transition-colors"
                  >
                    <Download size={16} />
                    Export PDF
                  </button>
                )}
              </div>

              {!selectedIssue && !solution && !solving && (
                <div className="flex flex-col items-center justify-center h-[500px] text-gray-500">
                  <Sparkles size={60} />
                  <h3 className="text-2xl font-semibold mt-5">Select an Issue</h3>
                  <p className="mt-3 text-center">
                    Click <b>Solve</b> on any GitHub issue to let Gemini generate a fix.
                  </p>
                </div>
              )}

              <div className="mt-6">
                {solving && (
                  <div className="flex items-center gap-3 text-blue-400 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                    <Loader2 className="animate-spin shrink-0" size={20} />
                    <p className="text-sm leading-relaxed">
                      AI is inspecting code context, reading commit histories, and writing solution patches...
                    </p>
                  </div>
                )}

                {solveError && (
                  <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300 mb-4">
                    {solveError}
                  </div>
                )}

                {solution && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-green-400 font-semibold mb-2">Summary</h3>
                      <p className="text-gray-300 leading-relaxed">{solution.summary}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#0D1117] p-4 rounded-xl border border-gray-800">
                        <h3 className="text-blue-400 font-semibold mb-1 text-sm">Confidence</h3>
                        <div className="w-full bg-gray-800 rounded-full h-2.5 mt-2">
                          <div
                            className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${solution.confidence}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-gray-400">{solution.confidence}% Match</p>
                      </div>

                      <div className="bg-[#0D1117] p-4 rounded-xl border border-gray-800">
                        <h3 className="text-indigo-400 font-semibold mb-1 text-sm">Complexity</h3>
                        <span className="inline-block mt-1 bg-indigo-600/30 text-indigo-300 text-xs px-2.5 py-1 rounded border border-indigo-500/30 font-medium">
                          {solution.complexity || "Medium"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-red-400 font-semibold mb-2">Root Cause</h3>
                      <p className="text-gray-300 bg-[#0D1117] p-4 rounded-xl border border-gray-800 leading-relaxed">
                        {solution.rootCause}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-yellow-400 font-semibold mb-2">Recommended Solution</h3>
                      <p className="text-gray-300 whitespace-pre-wrap bg-[#0D1117] p-4 rounded-xl border border-gray-800 leading-relaxed">
                        {solution.solution}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-cyan-400 font-semibold mb-2 flex items-center gap-2">
                        <FileCode size={18} />
                        Affected Files
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(solution.affectedFiles || []).map((file, idx) => (
                          <span key={idx} className="bg-gray-800 px-3 py-1 rounded text-sm text-gray-300">
                            {file}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 size={18} />
                        Implementation Steps
                      </h3>
                      <ol className="list-decimal ml-6 space-y-2 text-gray-300">
                        {(solution.implementationSteps || []).map((step, i) => (
                          <li key={i} className="pl-1">{step}</li>
                        ))}
                      </ol>
                    </div>

                    {(solution.relatedCommits || []).length > 0 && (
                      <div>
                        <h3 className="text-purple-400 font-semibold mb-2 flex items-center gap-2">
                          <GitCommit size={18} />
                          Related Commits
                        </h3>
                        <div className="space-y-3">
                          {solution.relatedCommits.map((commit, index) => (
                            <div
                              key={commit.hash || index}
                              className="bg-[#0D1117] border border-gray-800 rounded-lg p-4"
                            >
                              <div className="font-mono text-green-400 text-xs">
                                {commit.hash ? commit.hash.substring(0, 7) : "Commit"}
                              </div>
                              <div className="mt-1 text-white font-medium text-sm">
                                {commit.message}
                              </div>
                              <div className="mt-2 text-xs text-gray-400">
                                {commit.author} {commit.date ? `• ${new Date(commit.date).toLocaleString()}` : ""}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {solution.patch?.file && (
                      <div className="space-y-4 pt-4 border-t border-gray-800">
                        <div>
                          <h3 className="text-orange-400 font-semibold mb-2">Target File</h3>
                          <div className="bg-[#0D1117] p-3 rounded-lg border border-gray-800 font-mono text-sm text-gray-300">
                            {solution.patch.file}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-red-400 font-semibold mb-2">Original Code</h3>
                          <pre className="bg-black/80 p-4 rounded-lg overflow-x-auto text-sm text-red-300 border border-red-900/30">
                            <code>{solution.patch.oldCode}</code>
                          </pre>
                        </div>

                        <div>
                          <h3 className="text-green-400 font-semibold mb-2">Proposed Fix</h3>
                          <pre className="bg-black/80 p-4 rounded-lg overflow-x-auto text-sm text-green-300 border border-green-900/30">
                            <code>{solution.patch.newCode}</code>
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}