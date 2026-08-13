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
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";
import API from "../services/api";

const FEATURES = [
  {
    icon: GitBranch,
    title: "Repository Analysis",
    description:
      "Analyze GitHub repositories and understand how your codebase has evolved.",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: BarChart3,
    title: "Commit Analytics",
    description:
      "Explore commits, changes, activity patterns, and development history.",
    color: "from-indigo-500 to-purple-500",
  },
  {
    icon: Users,
    title: "Contributor Insights",
    description:
      "Understand who contributed and how development activity is distributed.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Flame,
    title: "Code Hotspots",
    description:
      "Find files that change frequently and may need refactoring or attention.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Clock,
    title: "Project Timeline",
    description:
      "See your repository's evolution through an interactive temporal map.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Sparkles,
    title: "AI Insights",
    description:
      "Get intelligent recommendations about code quality and repository health.",
    color: "from-cyan-500 to-blue-500",
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
    title: "Paste Repository URL",
    description: "Drop in any public GitHub repository — no setup or installation needed.",
  },
  {
    icon: Layers,
    title: "Deep History Scan",
    description: "Commits, contributors, hotspots, and timeline are processed instantly.",
  },
  {
    icon: LineChart,
    title: "Explore Visual Insights",
    description: "Dive into interactive dashboards and AI-powered health recommendations.",
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

    if (loading) return;

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

      setAnalysis({
        ...payload,
        repoUrl: trimmedUrl,
        repository: repo.data,
      });

      setRepositoryId(payload.repositoryId);
      navigate("/dashboard");
    } catch (error) {
      console.error("Analysis failed:", error);
      alert(
        error.response?.data?.message ||
          "Analysis failed. Please check the URL and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans antialiased">
      
      {/* Dynamic Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 blur-[140px] rounded-full" />
      </div>

      {/* Grid Pattern Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
      />

      {/* Hero Section */}
      <section className="relative z-10 pt-6 pb-20 md:pb-28">
        <div className="max-w-7xl mx-auto px-6">

          {/* Header / Nav */}
          <header className="flex items-center justify-between mb-16 md:mb-24 backdrop-blur-md bg-slate-900/40 p-3 px-6 rounded-2xl border border-slate-800/80 sticky top-6 z-50 shadow-2xl">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <FaGithub className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-100 leading-none group-hover:text-indigo-300 transition-colors">
                  RepoIQ AI
                </span>
                <span className="text-[11px] text-slate-400 font-mono tracking-tight mt-0.5">
                  code visualizer
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
              <a href="#features" className="hover:text-white transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-white transition-colors">
                How it works
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <FaGithub className="h-4 w-4" />
                GitHub
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Login
              </Link>

              <Link
                to="/dashboard"
                className="relative inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white transition-all bg-indigo-600 rounded-xl hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                Dashboard
              </Link>
            </div>
          </header>

          {/* Hero Body */}
          <div className="max-w-4xl mx-auto text-center pt-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300 mb-8 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
              <span>Next-Gen Git History Analytics</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
              Visualize how your <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                codebase evolves.
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
              Analyze your GitHub repositories, explore commits, discover hotspots, understand contributors, and get AI-powered insights.
            </p>

            {/* Input Form */}
            <div className="mt-10 max-w-2xl mx-auto">
              <form
                onSubmit={handleAnalyze}
                className="relative group p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all shadow-2xl backdrop-blur-xl"
              >
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex items-center gap-3 flex-1 px-4 py-2.5">
                    <FaGithub className="h-5 w-5 text-slate-500 shrink-0" />
                    <input
                      type="text"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/username/repository"
                      disabled={loading}
                      className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none disabled:opacity-50 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/25 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <span>Analyze</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="flex items-center justify-center gap-6 text-xs text-slate-500 mt-4">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  No installation needed
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Public repos supported
                </span>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-20 pt-10 border-t border-slate-800/80">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm"
                >
                  <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 bg-slate-900/50 border-t border-slate-800/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Powerful Analytics
            </h2>
            <p className="text-3xl sm:text-4xl font-bold text-white mt-3 tracking-tight">
              Everything you need to understand your repository
            </p>
            <p className="text-slate-400 mt-4 text-base">
              Turn your Git history into useful visual insights and actionable recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="group relative p-8 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all duration-300 hover:-translate-y-1 shadow-xl overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500`} />
                
                <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:border-indigo-500/30 transition-all">
                  <Icon className="h-6 w-6" />
                </div>
                
                <h3 className="font-semibold text-lg text-white mt-6 tracking-tight">
                  {title}
                </h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Simple Process
            </h2>
            <p className="text-3xl sm:text-4xl font-bold text-white mt-3 tracking-tight">
              From URL to insights in three steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {STEPS.map(({ icon: Icon, title, description }, i) => (
              <div
                key={title}
                className="relative flex flex-col items-center text-center p-8 rounded-2xl bg-slate-900/30 border border-slate-800/60"
              >
                <div className="h-14 w-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-lg mb-6">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold mb-3">
                  Step {i + 1}
                </span>
                <h3 className="font-semibold text-lg text-white">{title}</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="relative z-10 py-20 border-t border-slate-800/80 bg-gradient-to-b from-slate-950 to-indigo-950/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            See how your project evolved.
          </h2>
          <p className="text-slate-400 mt-4 max-w-xl mx-auto">
            Start with a GitHub repository and explore its complete development journey.
          </p>
          <div className="mt-8">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-xl shadow-indigo-600/30 active:scale-95"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-950 border-t border-slate-800/60 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-mono">
            © {new Date().getFullYear()} RepoIQ AI. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-slate-400 font-medium">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How it works
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default Home;