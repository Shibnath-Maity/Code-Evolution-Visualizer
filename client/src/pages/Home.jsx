import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaGithub } from "react-icons/fa";
import {
  GitBranch,
  GitCommit,
  BarChart3,
  Users,
  Flame,
  Clock,
  Sparkles,
  ArrowRight,
  Search,
  LineChart,
  Loader2,
  Menu,
  X,
} from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";
import API from "../services/api";
import logo from "../assets/logo.png";

const FEATURES = [
  {
    icon: GitBranch,
    title: "Repository Analysis",
    description:
      "Understand repository structure, activity, and development history.",
  },
  {
    icon: BarChart3,
    title: "Commit Analytics",
    description:
      "Explore commit patterns, changes, and development activity over time.",
  },
  {
    icon: Users,
    title: "Contributor Insights",
    description:
      "See contribution patterns and how development work is distributed.",
  },
  {
    icon: Flame,
    title: "Code Hotspots",
    description:
      "Identify frequently changed files that may need attention.",
  },
  {
    icon: Clock,
    title: "Project Timeline",
    description:
      "Trace how the repository evolved across its development history.",
  },
  {
    icon: Sparkles,
    title: "AI Insights",
    description:
      "Get contextual recommendations based on repository data.",
  },
];

const STEPS = [
  {
    number: "01",
    icon: Search,
    title: "Paste repository",
    description: "Drop in any public GitHub repository — no setup required.",
  },
  {
    number: "02",
    icon: GitCommit,
    title: "Analyze history",
    description: "Commits, contributors, hotspots, and timeline are processed.",
  },
  {
    number: "03",
    icon: LineChart,
    title: "Explore insights",
    description: "Review dashboards and recommendations for your codebase.",
  },
];

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
];

// Example data for the hero product preview. Purely illustrative — this is
// not live data pulled from an actual analysis.
const PREVIEW_REPO = "github.com/user/project";
const PREVIEW_STATS = [
  { label: "commits", value: "1,284" },
  { label: "contributors", value: "38" },
  { label: "files", value: "124" },
];
const PREVIEW_ACTIVITY = [32, 24, 46, 38, 58, 44, 66, 52, 40, 60, 74, 56, 68, 82, 64];
const PREVIEW_HOTSPOTS = [
  { file: "auth.js", pct: 92 },
  { file: "api.js", pct: 68 },
  { file: "dashboard.jsx", pct: 45 },
];
const PREVIEW_HEALTH = 87;

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
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Hero product preview — a small, realistic mockup of a RepoIQ dashboard
 * (repo header, key stats, a commit-activity chart, a hotspot list, and a
 * health score). This replaces the previous orbiting/glowing visualization
 * with something that actually communicates what the product shows you.
 * All figures are illustrative examples, not live data.
 */
function ProductPreview() {
  return (
    <div className="relative w-full max-w-md mx-auto lg:mx-0">
      {/* one restrained ambient glow, nothing more */}
      <div className="absolute -inset-8 -z-10 bg-[radial-gradient(closest-side,rgba(59,130,246,0.12),transparent)]" />

      <div className="rounded-xl bg-[#0E1624] border border-[#1C2838] shadow-[0_24px_60px_-28px_rgba(0,0,0,0.7)] overflow-hidden">
        {/* panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1C2838]">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src={logo} alt="" className="h-5 w-5 object-contain shrink-0 opacity-90" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">Repository</p>
              <p className="text-sm text-[#F8FAFC] font-medium font-mono truncate">
                {PREVIEW_REPO}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 pl-3">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-[#94A3B8]">Analyzed</span>
          </div>
        </div>
        <p className="px-5 pt-3 text-[10px] text-[#5B6B80]">Repository overview</p>

        <div className="px-5 pb-5 pt-3 space-y-6">
          {/* key stats */}
          <div className="grid grid-cols-3 gap-3">
            {PREVIEW_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-[#1C2838] bg-[#0A101C] px-3 py-3 text-center"
              >
                <p className="text-lg sm:text-xl font-semibold text-[#F8FAFC] tabular-nums">
                  {stat.value}
                </p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* commit activity */}
          <div>
            <p className="text-xs font-medium text-[#94A3B8] mb-2.5">Commit activity</p>
            <div className="flex items-end gap-[3px] h-14">
              {PREVIEW_ACTIVITY.map((h, i) => (
                <div
                  key={i}
                  className="rq-bar flex-1 rounded-[1.5px] bg-[#3B82F6]/60"
                  style={{ height: `${h}%`, animationDelay: `${i * 35}ms` }}
                />
              ))}
            </div>
          </div>

          {/* hotspots */}
          <div>
            <p className="text-xs font-medium text-[#94A3B8] mb-2.5">Code hotspots</p>
            <div className="space-y-2">
              {PREVIEW_HOTSPOTS.map((h) => (
                <div key={h.file} className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-[#0A101C] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#60A5FA]/70"
                      style={{ width: `${h.pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-[#94A3B8] w-24 text-right truncate">
                    {h.file}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* health score */}
          <div className="flex items-center justify-between pt-1 border-t border-[#1C2838]">
            <span className="text-xs text-[#94A3B8]">Repository health</span>
            <span className="text-sm font-semibold text-[#F8FAFC] tabular-nums">
              {PREVIEW_HEALTH}<span className="text-[#94A3B8] font-normal">/100</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { setAnalysis, setRepositoryId, loading, setLoading, clearAnalysis } =
    useAnalysis();

  useEffect(() => {
    // Trigger the hero load-in sequence on mount
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

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

  // Helper for the hero's one-time fade-up sequence
  const fadeUp = (delayMs) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(14px)",
    transition: `opacity 0.5s ease ${delayMs}ms, transform 0.5s ease ${delayMs}ms`,
  });

  return (
    <div
      className="min-h-screen bg-[#070B14] text-[#F8FAFC] selection:bg-[#3B82F6]/30 selection:text-white antialiased overflow-x-hidden relative"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        @keyframes barGrow {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        .rq-bar {
          transform-origin: bottom;
          animation: barGrow 0.6s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes menuSlideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .rq-bar { animation: none !important; transform: none !important; }
        }
      `}</style>

      {/* Background: faint grid + a single restrained radial highlight behind the hero */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1C2838_1px,transparent_1px),linear-gradient(to_bottom,#1C2838_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_55%_45%_at_50%_0%,#000_60%,transparent_100%)] opacity-[0.1]" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-[#1C2838] bg-[#070B14]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img src={logo} alt="RepoIQ AI" className="h-7 w-7 object-contain" />
            <span className="font-semibold text-[#F8FAFC] text-[15px] tracking-tight">
              RepoIQ AI
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-7 text-sm text-[#94A3B8]">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-[#F8FAFC] transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-[#F8FAFC] transition-colors"
            >
              <FaGithub className="h-4 w-4" />
              GitHub
            </a>
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-3.5 py-2 text-sm font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            >
              Login
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#3B82F6] rounded-[10px] hover:bg-[#2f6fe0] transition-colors"
            >
              Dashboard
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="lg:hidden flex items-center justify-center h-10 w-10 rounded-[10px] border border-[#1C2838] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[#2A3A4D] transition-colors shrink-0"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div
            id="mobile-menu"
            className="lg:hidden border-t border-[#1C2838] bg-[#070B14]/98 backdrop-blur-md"
            style={{ animation: "menuSlideIn 0.15s ease-out" }}
          >
            <nav className="flex flex-col p-2 text-sm text-[#94A3B8]">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3.5 rounded-[10px] hover:bg-[#0E1624] hover:text-[#F8FAFC] transition-colors min-h-[44px] flex items-center"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3.5 rounded-[10px] hover:bg-[#0E1624] hover:text-[#F8FAFC] transition-colors min-h-[44px] flex items-center gap-2"
              >
                <FaGithub className="h-4 w-4" />
                GitHub
              </a>
              <div className="h-px bg-[#1C2838] my-1.5" />
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3.5 rounded-[10px] hover:bg-[#0E1624] hover:text-[#F8FAFC] transition-colors min-h-[44px] flex items-center"
              >
                Login
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="mx-2 mb-2 mt-1 px-4 py-3 text-center rounded-[10px] bg-[#3B82F6] hover:bg-[#2f6fe0] text-white transition-colors min-h-[44px] flex items-center justify-center"
              >
                Dashboard
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative z-10 pt-12 sm:pt-14 md:pt-16 pb-16 sm:pb-20 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[46%_54%] gap-12 lg:gap-14 items-center">

            {/* Left: copy + input */}
            <div>
              <div
                className="flex items-center gap-2 text-xs text-[#94A3B8] mb-5"
                style={fadeUp(0)}
              >
                <FaGithub className="h-3.5 w-3.5" />
                <span>GitHub repository intelligence</span>
              </div>

              <h1
                className="text-[2rem] leading-[1.22] sm:text-4xl md:text-[3.25rem] md:leading-[1.18] font-bold tracking-tight text-[#F8FAFC]"
                style={fadeUp(80)}
              >
                Understand Your Codebase.
                <br />
                From Git History to <span className="text-[#60A5FA]">AI Insights.</span>
              </h1>

              <p
                className="mt-5 text-base text-[#94A3B8] max-w-md leading-[1.6]"
                style={fadeUp(140)}
              >
                Analyze GitHub repositories, explore code evolution, identify
                hotspots, and turn repository history into actionable insights.
              </p>

              {/* Repository input */}
              <div className="mt-8 max-w-md" style={fadeUp(200)}>
                <form
                  onSubmit={handleAnalyze}
                  className="flex flex-col sm:flex-row gap-2 rounded-[10px] bg-[#0E1624] border border-[#1C2838] p-1.5 focus-within:border-[#3B82F6]/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5 flex-1 px-3 py-2 min-w-0">
                    <FaGithub className="h-4 w-4 text-[#94A3B8] shrink-0" />
                    <input
                      type="text"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="github.com/user/repository"
                      disabled={loading}
                      className="w-full min-w-0 bg-transparent text-sm text-[#F8FAFC] placeholder-[#5B6B80] focus:outline-none disabled:opacity-50 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 min-h-[40px] rounded-[8px] bg-[#3B82F6] hover:bg-[#2f6fe0] text-white font-medium text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
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
                </form>
              </div>

              {/* Quiet trust line */}
              <p
                className="mt-5 text-xs text-[#5B6B80] max-w-md"
                style={fadeUp(260)}
              >
                <span className="text-[#94A3B8]">✓ Public repositories</span>
                <span className="mx-2">·</span>
                <span>No installation</span>
                <span className="mx-2">·</span>
                <span>Fast repository analysis</span>
              </p>
            </div>

            {/* Right: product preview */}
            <div style={fadeUp(160)}>
              <ProductPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-16 sm:py-20 md:py-24 border-t border-[#1C2838]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal className="max-w-2xl mb-12 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#F8FAFC] tracking-tight">
              Understand your repository from every angle
            </h2>
            <p className="text-[#94A3B8] mt-3 text-sm sm:text-base">
              Turn Git history into a clear picture of how your codebase actually works.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {FEATURES.map(({ icon: Icon, title, description }, i) => (
              <Reveal key={title} delay={i * 60}>
                <div className="group h-full p-6 rounded-xl bg-[#0E1624] border border-[#1C2838] hover:border-[#2A3A4D] transition-all duration-200 hover:-translate-y-0.5">
                  <div className="h-9 w-9 rounded-lg bg-[#0A101C] border border-[#1C2838] flex items-center justify-center text-[#94A3B8] group-hover:text-[#60A5FA] transition-colors">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="font-semibold text-[15px] text-[#F8FAFC] mt-4">
                    {title}
                  </h3>
                  <p className="text-sm text-[#94A3B8] mt-2 leading-relaxed">
                    {description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 py-16 sm:py-20 md:py-24 border-t border-[#1C2838]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal className="max-w-2xl mb-14 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#F8FAFC] tracking-tight">
              From URL to insights in three steps
            </h2>
          </Reveal>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {/* connecting line (desktop) */}
            <div className="hidden md:block absolute top-5 left-[16.6%] right-[16.6%] h-px bg-[#1C2838]" />
            {/* connecting line (mobile) */}
            <div className="md:hidden absolute top-5 bottom-5 left-5 w-px bg-[#1C2838]" />

            {STEPS.map(({ number, icon: Icon, title, description }, i) => (
              <Reveal key={title} delay={i * 80}>
                <div className="relative flex md:flex-col items-start md:items-start gap-4 md:gap-0 pl-14 md:pl-0">
                  <div className="absolute left-0 top-0 md:relative h-10 w-10 rounded-lg bg-[#0E1624] border border-[#1C2838] flex items-center justify-center text-[#60A5FA] z-10 shrink-0 md:mb-5">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-mono text-[#5B6B80] mb-1">{number}</p>
                    <h3 className="font-semibold text-[15px] text-[#F8FAFC]">{title}</h3>
                    <p className="text-sm text-[#94A3B8] mt-1.5 leading-relaxed max-w-xs">
                      {description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-16 sm:py-20 md:py-24 border-t border-[#1C2838]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="rounded-2xl bg-[#0E1624] border border-[#1C2838] px-6 py-12 sm:px-10 sm:py-16 text-center">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#F8FAFC] tracking-tight">
                Ready to explore your repository?
              </h2>
              <p className="text-[#94A3B8] mt-3 max-w-md mx-auto text-sm sm:text-base">
                Paste a GitHub repository and see what its history can tell you.
              </p>
              <div className="mt-8">
                <Link
                  to="/dashboard"
                  className="group inline-flex items-center gap-2 px-6 py-3 rounded-[10px] bg-[#3B82F6] hover:bg-[#2f6fe0] text-white font-medium text-sm transition-colors"
                >
                  <span>Analyze a repository</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#1C2838] py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="RepoIQ AI" className="h-5 w-5 object-contain" />
            <span className="font-semibold text-sm text-[#F8FAFC]">RepoIQ AI</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#94A3B8]">
            <a href="#features" className="hover:text-[#F8FAFC] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[#F8FAFC] transition-colors">
              How it works
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#F8FAFC] transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 pt-6 border-t border-[#1C2838] flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <p className="text-xs text-[#5B6B80] font-mono">
            © {new Date().getFullYear()} RepoIQ AI. All rights reserved.
          </p>
          <p className="text-[11px] text-[#5B6B80] font-mono tracking-wide break-words">
            Developed by{" "}
            <span className="text-[#94A3B8] font-medium">Shibnath Maity</span>
            <span className="mx-2 opacity-50">·</span>
            <a
              href="mailto:mshibnath169@gmail.com"
              className="hover:text-[#F8FAFC] transition-colors"
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