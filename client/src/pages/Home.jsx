import { useState, useEffect, useRef } from "react";
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
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: BarChart3,
    title: "Commit Analytics",
    description:
      "Explore commits, changes, activity patterns, and development history.",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: Users,
    title: "Contributor Insights",
    description:
      "Understand who contributed and how development activity is distributed.",
    color: "from-teal-500 to-cyan-500",
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
    color: "from-cyan-400 to-teal-500",
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

/** Fires `visible=true` the first time the element scrolls into view, then stays true. */
function useInView(options = { threshold: 0.15 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, options);

    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, visible];
}

/** Wraps children in a fade-up reveal that triggers on scroll, with an optional stagger delay. */
function Reveal({ children, delay = 0, className = "" }) {
  const [ref, visible] = useInView();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const { setAnalysis, setRepositoryId, loading, setLoading, clearAnalysis } =
    useAnalysis();

  useEffect(() => {
    // Trigger the hero load-in sequence on mount
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

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

  // Helper for staggered hero fade-ins
  const fadeUp = (delayMs, extraTransform = "") => ({
    opacity: mounted ? 1 : 0,
    transform: mounted
      ? `translateY(0) ${extraTransform}`
      : `translateY(24px) ${extraTransform}`,
    transition: `opacity 0.8s cubic-bezier(0.22,1,0.36,1) ${delayMs}ms, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${delayMs}ms`,
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-cyan-500 selection:text-white font-sans antialiased">

      {/* Local keyframes for ambient motion */}
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-3%, 4%) scale(1.05); }
        }
        @keyframes floatSlowReverse {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(4%, -3%) scale(1.08); }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .rq-anim { animation: none !important; transition: none !important; }
        }
      `}</style>

      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="rq-anim absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-cyan-200/40 via-sky-200/30 to-indigo-100/40 blur-[130px] rounded-full"
          style={{ animation: "floatSlow 18s ease-in-out infinite" }}
        />
        <div
          className="rq-anim absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-cyan-300/20 blur-[140px] rounded-full"
          style={{ animation: "floatSlowReverse 22s ease-in-out infinite" }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-6 pb-20 md:pb-28">
        <div className="max-w-7xl mx-auto px-6">

          {/* Header / Nav */}
          <header
            className="rq-anim flex items-center justify-between mb-16 md:mb-24 backdrop-blur-xl bg-white/70 p-3 px-6 rounded-2xl border border-slate-200/80 sticky top-6 z-50 shadow-xl shadow-slate-200/50"
            style={fadeUp(0)}
          >
            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 group-hover:scale-105 group-hover:rotate-6 transition-transform duration-300">
                <FaGithub className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 leading-none group-hover:text-cyan-600 transition-colors">
                  RepoIQ AI
                </span>
                <span className="text-[11px] text-slate-500 font-mono tracking-tight mt-0.5">
                  code visualizer
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              <a href="#features" className="relative hover:text-slate-900 transition-colors group/nav">
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-cyan-500 transition-all duration-300 group-hover/nav:w-full" />
              </a>
              <a href="#how-it-works" className="relative hover:text-slate-900 transition-colors group/nav">
                How it works
                <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-cyan-500 transition-all duration-300 group-hover/nav:w-full" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:text-slate-900 hover:-translate-y-0.5 transition-all"
              >
                <FaGithub className="h-4 w-4" />
                GitHub
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Login
              </Link>

              <Link
                to="/dashboard"
                className="relative inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white transition-all duration-300 bg-cyan-500 rounded-xl hover:bg-cyan-600 hover:shadow-lg hover:shadow-cyan-500/30 hover:-translate-y-0.5 shadow-md shadow-cyan-500/20 active:scale-95"
              >
                Dashboard
              </Link>
            </div>
          </header>

          {/* Hero Body */}
          <div className="max-w-4xl mx-auto text-center pt-6">
            <div
              className="rq-anim inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold text-cyan-700 mb-8 backdrop-blur-sm shadow-sm"
              style={fadeUp(80)}
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-500 animate-pulse" />
              <span>Next-Gen Git History Analytics</span>
            </div>

            <h1
              className="rq-anim text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]"
              style={fadeUp(160)}
            >
              Visualize how your <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 via-sky-500 to-indigo-600 bg-[length:200%_auto] animate-[gradientShift_6s_ease_infinite]">
                codebase evolves.
              </span>
            </h1>

            <p
              className="rq-anim mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed"
              style={fadeUp(240)}
            >
              Analyze your GitHub repositories, explore commits, discover hotspots, understand contributors, and get AI-powered insights.
            </p>

            {/* Input Form */}
            <div className="rq-anim mt-10 max-w-2xl mx-auto" style={fadeUp(320)}>
              <form
                onSubmit={handleAnalyze}
                className="relative group p-2 rounded-2xl bg-white border border-slate-200 focus-within:border-cyan-500/50 focus-within:ring-4 focus-within:ring-cyan-500/10 transition-all duration-300 shadow-xl shadow-slate-200/60 hover:shadow-2xl hover:shadow-cyan-500/10"
              >
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex items-center gap-3 flex-1 px-4 py-2.5">
                    <FaGithub className="h-5 w-5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/username/repository"
                      disabled={loading}
                      className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none disabled:opacity-50 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-sm transition-all duration-300 shadow-md shadow-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/40 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shrink-0 group/btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <span>Analyze</span>
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
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
            <div
              className="rq-anim grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-20 pt-10 border-t border-slate-200/80"
              style={fadeUp(400)}
            >
              {STATS.map((stat, i) => (
                <div
                  key={stat.label}
                  className="rq-anim p-4 rounded-2xl bg-white/70 border border-slate-200/80 backdrop-blur-sm shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-cyan-200 transition-all duration-300"
                  style={fadeUp(440 + i * 80)}
                >
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-cyan-600 uppercase tracking-widest">
              Powerful Analytics
            </h2>
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 mt-3 tracking-tight">
              Everything you need to understand your repository
            </p>
            <p className="text-slate-600 mt-4 text-base">
              Turn your Git history into useful visual insights and actionable recommendations.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, description, color }, i) => (
              <Reveal key={title} delay={i * 90}>
                <div className="group relative p-8 rounded-2xl bg-slate-50/50 border border-slate-200/80 hover:border-cyan-300 transition-all duration-300 hover:-translate-y-1.5 shadow-sm hover:shadow-xl hover:shadow-cyan-500/5 overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500`} />

                  <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-cyan-600 shadow-sm group-hover:scale-110 group-hover:-rotate-6 group-hover:border-cyan-300 transition-all duration-300">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="font-semibold text-lg text-slate-900 mt-6 tracking-tight">
                    {title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    {description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-cyan-600 uppercase tracking-widest">
              Simple Process
            </h2>
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 mt-3 tracking-tight">
              From URL to insights in three steps
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {STEPS.map(({ icon: Icon, title, description }, i) => (
              <Reveal key={title} delay={i * 120}>
                <div className="group relative flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-lg hover:shadow-cyan-500/5 hover:-translate-y-1 transition-all duration-300">
                  <div className="h-14 w-14 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold mb-3">
                    Step {i + 1}
                  </span>
                  <h3 className="font-semibold text-lg text-slate-900">{title}</h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    {description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="relative z-10 py-20 border-t border-slate-200/80 bg-gradient-to-b from-slate-50 to-cyan-50/40">
        <Reveal className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            See how your project evolved.
          </h2>
          <p className="text-slate-600 mt-4 max-w-xl mx-auto">
            Start with a GitHub repository and explore its complete development journey.
          </p>
          <div className="mt-8">
            <Link
              to="/dashboard"
              className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-sm transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-0.5 active:scale-95"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-white border-t border-slate-200/80 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-mono">
            © {new Date().getFullYear()} RepoIQ AI. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-slate-600 font-medium">
            <a href="#features" className="hover:text-slate-900 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
              How it works
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-900 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-4 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 font-mono">
            Developed by{" "}
            <span className="text-slate-600 font-medium">Shibnath Maity</span>
            {" · "}
            <a
              href="mailto:mshibnath169@gmail.com"
              className="hover:text-cyan-600 transition-colors"
            >
              mshibnath169@gmail.com
            </a>
          </p>
        </div>
      </footer>

    </div>
  );
}

export default Home;