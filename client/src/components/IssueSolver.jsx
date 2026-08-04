import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Bug,
  Sparkles,
  Loader2,
  
  AlertCircle,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/repository";

/**
 * Parse GitHub Repository URL
 *
 * Supports:
 * https://github.com/facebook/react
 * https://github.com/facebook/react.git
 * https://github.com/facebook/react/
 * git@github.com:facebook/react.git
 */
function parseOwnerRepo(url) {
  if (!url) return null;

  // SSH URL
  if (url.startsWith("git@github.com:")) {
    const path = url
      .replace("git@github.com:", "")
      .replace(/\.git$/, "");

    const [owner, repo] = path.split("/");

    if (!owner || !repo) return null;

    return { owner, repo };
  }

  try {
    const parsed = new URL(url);

    if (
      parsed.hostname !== "github.com" &&
      parsed.hostname !== "www.github.com"
    ) {
      return null;
    }

    const parts = parsed.pathname
      .replace(/^\/|\/$/g, "")
      .replace(/\.git$/, "")
      .split("/");

    if (parts.length < 2) return null;

    return {
      owner: parts[0],
      repo: parts[1],
    };
  } catch {
    return null;
  }
}

export default function IssueSolver() {
  const location = useLocation();

  // Repo info now comes from the Home page (via navigate state),
  // falling back to localStorage — Board.jsx saves repoUrl there,
  // so this has to read from the same place or it'll never find it.
  const repoUrl =
    location.state?.repoUrl ||
    localStorage.getItem("repoUrl") ||
    "";

  const initialRepository =
    location.state?.repository ||
    (() => {
      const cached = localStorage.getItem("repoInfo");
      return cached ? JSON.parse(cached) : null;
    })();

  const [issues, setIssues] = useState([]);

  const [selectedIssue, setSelectedIssue] =
    useState(null);

  const [solution, setSolution] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [solving, setSolving] =
    useState(false);

  const [loadError, setLoadError] =
    useState("");

  const [solveError, setSolveError] =
    useState("");

  const [repository, setRepository] =
    useState(initialRepository);

  // Persist whatever we received so a page refresh still works
  useEffect(() => {
    if (location.state?.repoUrl) {
      localStorage.setItem("repoUrl", location.state.repoUrl);
    }
    if (location.state?.repository) {
      localStorage.setItem(
        "repoInfo",
        JSON.stringify(location.state.repository)
      );
    }
  }, [location.state]);

  // ==========================================
  // Fetch Issues for the already-analyzed repo
  // ==========================================
  async function loadIssues() {
    setLoadError("");
    setSolveError("");
    setSolution(null);
    setSelectedIssue(null);
    setIssues([]);

    if (!repoUrl) {
      setLoadError(
        "No repository found. Please analyze a repository from the Home page first."
      );
      return;
    }

    const parsed = parseOwnerRepo(repoUrl);

    if (!parsed) {
      setLoadError("Invalid GitHub repository URL.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${API}/issues`, {
        repoUrl,
      });

      setRepository(response.data.repository);
      setIssues(response.data.issues || []);
    } catch (error) {
      console.error(error);

      setLoadError(
        error.response?.data?.message ||
          "Unable to load issues for this repository."
      );
    } finally {
      setLoading(false);
    }
  }

  // Auto-load issues as soon as we know which repo to use
  useEffect(() => {
    if (repoUrl) {
      loadIssues();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoUrl]);

  // ==========================================
  // Solve Selected Issue
  // ==========================================
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
const response = await axios.post(
  `${API}/issue-solution`,
  {
    owner: parsed.owner,
    repo: parsed.repo,
    issueNumber: issue.number,
  }
);

console.log("Backend Response:", response.data);

setSolution(response.data.solution);
    } catch (error) {
      console.error(error);

      setSolveError(
        error.response?.data?.message ||
          "Failed to generate AI solution."
      );
    } finally {
      setSolving(false);
    }
  }

  // ==========================================
  // Repository Badge Color
  // ==========================================
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

  // ==========================================
  // Render
  // ==========================================
  return (
    <div className="min-h-screen bg-[#0D1117] text-white">

  {/* ================= Header ================= */}

  <div className="border-b border-[#30363D] bg-[#161B22]">

    <div className="max-w-7xl mx-auto px-8 py-6">

      <div className="flex items-center gap-4">

        <div className="bg-green-600 p-3 rounded-xl">

          <Bug size={30} />

        </div>

        <div>

          <h1 className="text-3xl font-bold">

            AI GitHub Issue Solver

          </h1>

          <p className="text-gray-400 mt-1">

            {repository
              ? `Issues for ${repository.owner}/${repository.name}, analyzed by Gemini.`
              : "Analyze GitHub repositories and let Gemini generate repository-aware solutions."}

          </p>

        </div>

      </div>

    </div>

  </div>

  {/* ================= Main ================= */}

  <div className="max-w-7xl mx-auto p-8">

    {/* No repository yet */}

    {!repoUrl && (

      <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 flex gap-3">

        <AlertCircle className="text-yellow-500 shrink-0" />

        <p className="text-gray-300">

          No repository has been analyzed yet. Go back to the
          Home page, analyze a repository, then come back here
          to see and solve its issues.

        </p>

      </div>

    )}

    {/* Error */}

    {loadError && (

      <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex gap-3">

        <AlertCircle className="text-red-500"/>

        <p>{loadError}</p>

      </div>

    )}

    {/* Repository Card */}

    {repository && (

      <div className="mt-8 bg-[#161B22] border border-[#30363D] rounded-2xl p-6">

        <div className="flex justify-between items-start">

          <div>

            <div className="flex items-center gap-3">

              <FaGithub size={22}/>

              <h2 className="text-2xl font-bold">

                {repository.owner}/{repository.name}

              </h2>

            </div>

            <p className="mt-3 text-gray-400">

              {repository.description || "No description"}

            </p>

          </div>

          <img
            src={
              repository.avatarUrl ||
              "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
            }
            className="w-16 h-16 rounded-full border border-[#30363D]"
          />

        </div>

        <div className="flex gap-8 mt-6 text-sm">

          <div>

            ⭐ {repository.stars}

          </div>

          <div>

            🍴 {repository.forks}

          </div>

          <div>

            🐞 {issues.length} Issues

          </div>

          <div className="flex items-center gap-2">

            <div
              className="w-3 h-3 rounded-full"
              style={{
                background:
                  getLanguageColor(repository.language),
              }}
            />

            {repository.language}

          </div>

        </div>

      </div>

    )}

    {/* ================= Layout ================= */}

    <div className="grid lg:grid-cols-5 gap-8 mt-8">

      {/* Left */}

      <div className="lg:col-span-2">

        <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-5">

          <h2 className="font-bold text-xl mb-5">

            Repository Issues

          </h2>
                    {/* Loading */}

          {loading && (

            <div className="flex justify-center py-10">

              <Loader2
                className="animate-spin text-green-500"
                size={40}
              />

            </div>

          )}

          {/* Empty State */}

          {!loading && repoUrl && issues.length === 0 && (

            <div className="text-center py-16">

              <Bug
                size={55}
                className="mx-auto text-gray-600"
              />

              <h3 className="mt-5 text-xl font-semibold">

                No Issues Found

              </h3>

              <p className="text-gray-500 mt-2">

                This repository doesn't have any open issues,
                or they haven't loaded yet.

              </p>

            </div>

          )}

          {/* Issues */}

          <div className="space-y-4">

            {issues.map((issue) => (

              <div
                key={issue.id}
                className={`rounded-xl border transition-all p-5 cursor-pointer

                ${
                  selectedIssue?.id === issue.id
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-[#30363D] hover:border-green-500 bg-[#0D1117]"
                }`}
              >

                <div className="flex justify-between items-start">

                  <div className="flex-1">

                    <div className="flex items-center gap-2">

                      <span className="font-mono text-green-400">

                        #{issue.number}

                      </span>

                      <span
                        className={`text-xs px-2 py-1 rounded-full

                        ${
                          issue.state === "open"
                            ? "bg-green-600"
                            : "bg-red-600"
                        }`}
                      >
                        {issue.state}
                      </span>

                    </div>

                    <h3 className="font-semibold mt-3">

                      {issue.title}

                    </h3>

                    <p className="text-gray-400 mt-3 line-clamp-3">

                      {issue.body || "No description"}

                    </p>

                    {/* Labels */}

                    <div className="flex flex-wrap gap-2 mt-4">

                      {issue.labels?.map((label) => (

                        <span
                          key={label}
                          className="bg-[#21262D] text-xs px-3 py-1 rounded-full"
                        >
                          {label}
                        </span>

                      ))}

                    </div>

                    <div className="mt-5 text-sm text-gray-500">

                      Opened by{" "}

                      <span className="text-white">

                        {issue.author}

                      </span>

                    </div>

                  </div>

                  <button
                    onClick={() => solveIssue(issue)}
                    disabled={
                      solving &&
                      selectedIssue?.id === issue.id
                    }
                    className="ml-6 bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg flex items-center gap-2 disabled:opacity-60"
                  >
                    {solving &&
                    selectedIssue?.id === issue.id ? (
                      <>
                        <Loader2
                          className="animate-spin"
                          size={16}
                        />
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

      {/* ================= Right Panel ================= */}

      <div className="lg:col-span-3">

        <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 min-h-[700px]">

          <h2 className="text-xl font-bold flex items-center gap-3">

            <Sparkles className="text-yellow-500"/>

            AI Solution
          </h2>

          {/* Placeholder */}

          {!selectedIssue && !solution && !solving && (

            <div className="flex flex-col items-center justify-center h-[500px] text-gray-500">

              <Sparkles size={60}/>

              <h3 className="text-2xl font-semibold mt-5">

                Select an Issue

              </h3>

              <p className="mt-3">

                Click <b>Solve</b> on any GitHub issue
                to let Gemini analyze it.

              </p>

            </div>

          )}

          {/* ===========================
    Solution Panel
=========================== */}

          <div className="mt-6">

            {solving && (
              <div className="flex items-center gap-3 text-blue-400">
                <Loader2 className="animate-spin" size={20} />
                AI is reading the GitHub issue, searching repository knowledge, analyzing related commits, and generating a solution...
              </div>
            )}

            {solveError && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 text-red-300 mb-4">
                {solveError}
              </div>
            )}

            {solution && (
              <div className="space-y-6">

                <div>
                  <h3 className="text-green-400 font-semibold mb-2">
                    Summary
                  </h3>

                  <p className="text-gray-300">
                    {solution.summary}
                  </p>
                </div>

                <div>
                  <h3 className="text-blue-400 font-semibold mb-2">
                    Confidence
                  </h3>

                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full"
                      style={{
                        width: `${solution.confidence}%`,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-sm text-gray-400">
                    {solution.confidence}%
                  </p>
                </div>

                <div>
                  <h3 className="text-indigo-400 font-semibold mb-2">
                    Complexity
                  </h3>

                  <span className="bg-indigo-600 px-3 py-1 rounded">
                    {solution.complexity}
                  </span>
                </div>

                <div>
                  <h3 className="text-red-400 font-semibold mb-2">
                    Root Cause
                  </h3>

                  <p className="text-gray-300">
                    {solution.rootCause}
                  </p>
                </div>

                <div>
                  <h3 className="text-yellow-400 font-semibold mb-2">
                    Solution
                  </h3>

                  <p className="text-gray-300 whitespace-pre-wrap">
                    {solution.solution}
                  </p>
                </div>

                <div>
                  <h3 className="text-cyan-400 font-semibold mb-2">
                    Affected Files
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {solution.affectedFiles?.map((file) => (
                      <span
                        key={file}
                        className="bg-gray-800 px-3 py-1 rounded text-sm"
                      >
                        {file}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-green-400 font-semibold mb-2">
                    Implementation Steps
                  </h3>

                  <ol className="list-decimal ml-6 space-y-2 text-gray-300">
                    {solution.implementationSteps?.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h3 className="text-purple-400 font-semibold mb-2">
                    Related Commits
                  </h3>

                  <div className="space-y-3">
                    {solution.relatedCommits?.map((commit) => (
                      <div
                        key={commit.hash}
                        className="bg-[#0D1117] border border-gray-700 rounded-lg p-4"
                      >
                        <div className="font-mono text-green-400">
                          {commit.hash.substring(0, 7)}
                        </div>

                        <div className="mt-2 text-white font-medium">
                          {commit.message}
                        </div>

                        <div className="mt-2 text-sm text-gray-400">
                          {commit.author}
                        </div>

                        <div className="text-xs text-gray-500">
                          {new Date(commit.date).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {solution.patch?.file && (
                  <>
                    <div>
                      <h3 className="text-orange-400 font-semibold mb-2">
                        File
                      </h3>

                      <div className="bg-[#0D1117] p-3 rounded border border-gray-800">
                        {solution.patch.file}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-red-400 font-semibold mb-2">
                        Old Code
                      </h3>

                      <pre className="bg-black p-4 rounded overflow-x-auto text-sm">
                        <code>{solution.patch.oldCode}</code>
                      </pre>
                    </div>

                    <div>
                      <h3 className="text-green-400 font-semibold mb-2">
                        New Code
                      </h3>

                      <pre className="bg-black p-4 rounded overflow-x-auto text-sm">
                        <code>{solution.patch.newCode}</code>
                      </pre>
                    </div>
                  </>
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