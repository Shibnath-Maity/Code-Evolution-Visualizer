import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaGithub } from "react-icons/fa";
import {
  GitBranch,
  BarChart3,
  Users,
  Flame,
  Clock,
  Sparkles,
  ArrowRight,
  Search,
  Layers,
  LineChart,
} from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";
import API from "../services/api";

const FEATURES = [
  {
    icon: GitBranch,
    title: "Repository Analysis",
    description:
      "Analyze GitHub repositories and understand how your codebase has evolved.",
  },
  {
    icon: BarChart3,
    title: "Commit Analytics",
    description:
      "Explore commits, changes, activity patterns and development history.",
  },
  {
    icon: Users,
    title: "Contributor Insights",
    description:
      "Understand who contributed and how development activity is distributed.",
  },
  {
    icon: Flame,
    title: "Code Hotspots",
    description:
      "Find files that change frequently and may need refactoring.",
  },
  {
    icon: Clock,
    title: "Project Timeline",
    description:
      "See your repository's evolution through an interactive timeline.",
  },
  {
    icon: Sparkles,
    title: "AI Insights",
    description:
      "Get intelligent recommendations about code quality and repository health.",
  },
];

const STATS = [
  { value: "12K+", label: "Repositories analyzed" },
  { value: "2.4M+", label: "Commits processed" },
  { value: "98%", label: "Analysis accuracy" },
  { value: "< 30s", label: "Average scan time" },
];

const STEPS = [
  {
    icon: Search,
    title: "Paste a repository URL",
    description: "Drop in any public GitHub repository — no setup or install needed.",
  },
  {
    icon: Layers,
    title: "We analyze the history",
    description: "Commits, contributors, hotspots and timeline are processed in seconds.",
  },
  {
    icon: LineChart,
    title: "Explore the insights",
    description: "Dive into interactive dashboards and AI-powered recommendations.",
  },
];

function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const navigate = useNavigate();
  const { setAnalysis, setRepositoryId, loading, setLoading, clearAnalysis } =
    useAnalysis();

  const handleAnalyze = async (e) => {
    e.preventDefault();

    if (!repoUrl.trim()) {
      alert("Please enter a GitHub repository URL");
      return;
    }

    if (loading) return; // guard against double submit

    const trimmedUrl = repoUrl.trim();
    setLoading(true);

    try {
      clearAnalysis();

      const response = await API.post("/repository/analytics", {
        url: trimmedUrl,
      });

      const repo = await API.get("/repository/repo-info", {
        params: {
          url: trimmedUrl,
        },
      });

      const payload = response.data?.data ?? response.data;

      // Store initial fast analysis payload & metadata
      setAnalysis({
        ...payload,
        repoUrl: trimmedUrl,
        repository: repo.data,
      });

      // Triggers central polling loop inside AnalysisContext
      setRepositoryId(payload.repositoryId);

      // Navigate immediately to dashboard while background jobs complete
      navigate("/dashboard");
    } catch (error) {
      console.error("Analysis failed:", error);
      alert(
        error.response?.data?.message || "Analysis failed. Please check the URL and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white [perspective:1600px]">

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950 opacity-90" />

        {/* 3D floor grid */}
        <div
          className="absolute inset-x-0 bottom-0 h-[420px] opacity-30 [transform-style:preserve-3d]"
          style={{
            transform: "rotateX(62deg) translateY(40%) scale(2)",
            transformOrigin: "bottom center",
            backgroundImage:
              "linear-gradient(rgba(129,140,248,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(129,140,248,0.5) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "linear-gradient(to top, black 0%, black 30%, transparent 90%)",
            WebkitMaskImage:
              "linear-gradient(to top, black 0%, black 30%, transparent 90%)",
          }}
        />

        {/* Floating depth orbs */}
        <div
          className="absolute top-24 left-[8%] h-40 w-40 rounded-full bg-indigo-500/30 blur-3xl"
          style={{ transform: "translateZ(80px)" }}
        />
        <div
          className="absolute top-40 right-[10%] h-56 w-56 rounded-full bg-purple-500/20 blur-3xl"
          style={{ transform: "translateZ(40px)" }}
        />

        <div className="relative max-w-7xl mx-auto px-6 py-8">

          {/* Nav */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div
                className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center transition-transform duration-300 hover:[transform:rotateY(20deg)_rotateX(-10deg)] [transform-style:preserve-3d]"
                style={{
                  boxShadow:
                    "0 1px 0 rgba(255,255,255,0.4) inset, 0 -3px 6px rgba(0,0,0,0.35) inset, 0 12px 24px -8px rgba(79,70,229,0.7)",
                }}
              >
                <FaGithub className="h-6 w-6 drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">Code Evolution</h1>
                <p className="text-xs text-slate-400 leading-tight">Visualizer</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <FaGithub className="h-4 w-4" />
                GitHub
              </a>
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 font-medium hover:-translate-y-0.5"
                style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.15) inset, 0 6px 14px -6px rgba(0,0,0,0.6)" }}
              >
                Dashboard
              </Link>
            </nav>
          </div>

          {/* Hero content */}
          <div className="max-w-4xl mx-auto text-center py-8">

            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-sm text-indigo-200 mb-6"
              style={{ boxShadow: "0 4px 10px -4px rgba(0,0,0,0.5)" }}
            >
              <Sparkles className="h-4 w-4" />
              Understand how your code evolves
            </div>

            <h2
              className="text-5xl md:text-7xl font-bold tracking-tight leading-tight"
              style={{ textShadow: "0 1px 0 rgba(255,255,255,0.15), 0 12px 30px rgba(0,0,0,0.55)" }}
            >
              Visualize the
              <span
                className="text-indigo-400"
                style={{ textShadow: "0 1px 0 rgba(199,210,254,0.4), 0 14px 28px rgba(99,102,241,0.55)" }}
              >
                {" "}evolution{" "}
              </span>
              of your code.
            </h2>

            <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
              Analyze your GitHub repositories, explore commits,
              discover hotspots, understand contributors and get
              AI-powered insights.
            </p>

            {/* Analyze form */}
            <form
              onSubmit={handleAnalyze}
              className="mt-10 max-w-2xl mx-auto bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-3 transition-transform duration-300 hover:-translate-y-1"
              style={{
                boxShadow:
                  "0 1px 0 rgba(255,255,255,0.2) inset, 0 30px 60px -20px rgba(0,0,0,0.7), 0 10px 20px -10px rgba(79,70,229,0.35)",
              }}
            >
              <div className="flex flex-col sm:flex-row gap-3">

                <div
                  className="flex items-center gap-3 flex-1 bg-slate-900/80 rounded-xl px-4 py-3"
                  style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.5) inset" }}
                >
                  <FaGithub className="h-5 w-5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/repository"
                    disabled={loading}
                    className="w-full bg-transparent outline-none text-sm text-white placeholder:text-slate-500 disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 transition-all duration-150 font-semibold disabled:opacity-60 disabled:cursor-not-allowed active:translate-y-0.5"
                  style={{
                    boxShadow:
                      "0 1px 0 rgba(255,255,255,0.35) inset, 0 -2px 4px rgba(0,0,0,0.3) inset, 0 10px 20px -6px rgba(79,70,229,0.7)",
                  }}
                >
                  {loading ? "Analyzing..." : "Analyze"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </form>

            <p className="text-xs text-slate-500 mt-4">
              No installation required • Paste a public GitHub repository
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16 pt-10 border-t border-white/10 [transform-style:preserve-3d]">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="text-center rounded-xl py-4 bg-white/[0.03] border border-white/5 transition-transform duration-300 hover:-translate-y-1 hover:[transform:translateY(-4px)_rotateX(6deg)]"
                style={{ boxShadow: "0 10px 24px -14px rgba(0,0,0,0.6)" }}
              >
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white text-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
              Powerful analytics
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">
              Everything you need to understand your repository
            </h2>
            <p className="text-slate-500 mt-4">
              Turn your Git history into useful visual insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 [perspective:1200px]">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group p-6 rounded-2xl border border-slate-200 bg-white transition-all duration-300 ease-out hover:border-indigo-200 hover:[transform:translateY(-6px)_rotateX(4deg)_rotateY(-2deg)] [transform-style:preserve-3d]"
                style={{ boxShadow: "0 8px 20px -14px rgba(15,23,42,0.25)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 30px 45px -20px rgba(79,70,229,0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 8px 20px -14px rgba(15,23,42,0.25)";
                }}
              >
                <div
                  className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 flex items-center justify-center group-hover:from-indigo-600 group-hover:to-indigo-700 group-hover:text-white transition-all duration-300"
                  style={{
                    boxShadow:
                      "0 1px 0 rgba(255,255,255,0.6) inset, 0 6px 12px -6px rgba(79,70,229,0.4)",
                    transform: "translateZ(20px)",
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3
                  className="font-semibold text-lg mt-5"
                  style={{ transform: "translateZ(12px)" }}
                >
                  {title}
                </h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-slate-50 py-20 text-slate-900">
        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
              Simple process
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">
              From URL to insights in three steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative [perspective:1200px]">
            {STEPS.map(({ icon: Icon, title, description }, i) => (
              <div
                key={title}
                className="relative text-center transition-transform duration-300 hover:[transform:translateY(-4px)]"
              >
                <div
                  className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center mx-auto"
                  style={{
                    boxShadow:
                      "0 1px 0 rgba(255,255,255,0.4) inset, 0 -3px 6px rgba(0,0,0,0.25) inset, 0 18px 30px -12px rgba(79,70,229,0.65)",
                  }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-xs font-semibold text-indigo-600 mt-4">
                  STEP {i + 1}
                </div>
                <h3 className="font-semibold text-lg mt-2">{title}</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-xs mx-auto">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-950 py-20 text-center relative overflow-hidden">
        <div
          className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/20 blur-3xl"
        />
        <div className="relative max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            See how your project evolved.
          </h2>
          <p className="text-slate-400 mt-4">
            Start with a GitHub repository and explore its complete
            development journey.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 transition-all duration-150 font-semibold active:translate-y-0.5"
            style={{
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.35) inset, 0 -2px 4px rgba(0,0,0,0.3) inset, 0 14px 28px -10px rgba(79,70,229,0.7)",
            }}
          >
            Open Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            © 2026 Code Evolution Visualizer
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default Home;