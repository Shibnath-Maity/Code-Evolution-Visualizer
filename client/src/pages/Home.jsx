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
import ConstellationField from "../components/ui/constellation-field";

const HERO_VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4";

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

// Small glass pills referencing what the product actually surfaces.
// Deliberately restrained — never competing with the headline, hidden on mobile.
const CAPABILITY_PILLS = [
  { icon: GitBranch, label: "Repository Analysis" },
  { icon: BarChart3, label: "Commit Analytics" },
  { icon: Flame, label: "Code Hotspots" },
  { icon: Users, label: "Contributor Insights" },
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
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { setAnalysis, setRepositoryId, loading, setLoading, clearAnalysis } =
    useAnalysis();

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

  return (
    <div
      className="min-h-screen bg-[#030A12] text-white antialiased overflow-x-hidden"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap');

        :root {
          --font-display: 'Instrument Serif', serif;
          --font-body: 'Inter', system-ui, sans-serif;
        }

        .liquid-glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow:
            inset 0 1px 1px rgba(255, 255, 255, 0.1),
            0 10px 34px rgba(0, 0, 0, 0.28);
          position: relative;
        }

        @keyframes fade-rise {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-rise { animation: fade-rise 0.8s ease-out both; }
        .animate-fade-rise-delay { animation: fade-rise 0.8s ease-out 0.18s both; }
        .animate-fade-rise-delay-2 { animation: fade-rise 0.8s ease-out 0.34s both; }
        .animate-fade-rise-delay-3 { animation: fade-rise 0.8s ease-out 0.5s both; }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-rise,
          .animate-fade-rise-delay,
          .animate-fade-rise-delay-2,
          .animate-fade-rise-delay-3 {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }

        /* Fluid typography — scales continuously from 320px up through
           ultrawide instead of jumping at breakpoints. */
        .text-hero {
          font-size: clamp(2.25rem, 1.35rem + 4.4vw, 6.5rem);
        }
        .text-section-heading {
          font-size: clamp(1.5rem, 1.15rem + 1.5vw, 2.5rem);
        }
        .text-body {
          font-size: clamp(0.9rem, 0.83rem + 0.3vw, 1.0625rem);
        }

        /* Belt-and-suspenders: nothing in the page should ever be wider
           than the viewport, at any breakpoint. */
        html, body {
          max-width: 100%;
          overflow-x: hidden;
        }
      `}</style>

      {/* Constellation field behind the entire page — fixed so it stays in
          place while scrolling. Sits behind the hero video and shows
          through the Features / How it works / CTA / footer sections below. */}
      <ConstellationField
        mode="dark"
        speed={0.45}
        size={0.75}
        length={0.75}
        density={0.65}
        strokeWidth={0.7}
        opacity={0.32}
        hue={-10}
        saturation={0.8}
        brightness={0.7}
        className="fixed inset-0 z-0 h-full w-full pointer-events-none"
      />

      {/* ============================== HERO ============================== */}
      <section className="relative flex min-h-screen flex-col overflow-hidden">
        {/* Fullscreen looping video background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 z-0 h-full w-full object-cover"
        >
          <source src={HERO_VIDEO_SRC} type="video/mp4" />
        </video>

        {/* Minimal readability treatment only — the video carries the depth */}
        <div className="absolute inset-0 z-[1] bg-[#030A12]/45" />
        <div className="absolute inset-x-0 bottom-0 z-[1] h-40 bg-gradient-to-t from-[#030A12]/80 to-transparent" />

        {/* Navigation */}
        <header className="relative z-20">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 sm:py-6 lg:px-8">
            <Link to="/" className="flex shrink-0 items-center gap-2.5">
              <img src={logo} alt="RepoIQ AI" className="h-7 w-7 object-contain" />
              <span
                className="text-lg tracking-tight text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                RepoIQ AI
              </span>
            </Link>

            <nav className="hidden items-center gap-8 md:flex">
              <a
                href="#top"
                className="text-sm text-white transition-colors hover:text-white"
              >
                Home
              </a>
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-white/60 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
              >
                <FaGithub className="h-3.5 w-3.5" />
                GitHub
              </a>
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <Link
                to="/login"
                className="px-3 py-2 text-sm text-white/60 transition-colors hover:text-white"
              >
                Login
              </Link>
              <Link
                to="/dashboard"
                className="liquid-glass rounded-full px-5 py-2.5 text-sm text-white transition-transform hover:scale-[1.03]"
              >
                Dashboard
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="liquid-glass flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white md:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {menuOpen && (
            <div
              id="mobile-menu"
              className="liquid-glass mx-4 rounded-2xl md:hidden"
              style={{ animation: "fade-rise 0.2s ease-out" }}
            >
              <nav className="flex flex-col p-2 text-sm">
                <a
                  href="#top"
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-[44px] items-center rounded-xl px-4 py-3.5 text-white"
                >
                  Home
                </a>
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-[44px] items-center rounded-xl px-4 py-3.5 text-white/70 hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-3.5 text-white/70 hover:text-white"
                >
                  <FaGithub className="h-4 w-4" />
                  GitHub
                </a>
                <div className="my-1.5 h-px bg-white/10" />
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-[44px] items-center rounded-xl px-4 py-3.5 text-white/70 hover:text-white"
                >
                  Login
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="mx-2 mb-2 mt-1 flex min-h-[44px] items-center justify-center rounded-xl bg-white/10 px-4 py-3 text-center text-white"
                >
                  Dashboard
                </Link>
              </nav>
            </div>
          )}
        </header>

        {/* Hero content */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-10 text-center sm:px-8">
          <div className="liquid-glass animate-fade-rise inline-flex items-center gap-2 rounded-full px-4 py-2">
            <Sparkles className="h-3.5 w-3.5 text-white/80" />
            <span className="text-[11px] font-medium tracking-wide text-white/80">
              AI-powered repository intelligence
            </span>
          </div>

          <h1
            className="text-hero animate-fade-rise-delay mt-6 max-w-5xl font-normal leading-[0.95] tracking-[-0.03em] text-white sm:mt-8"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Understand your codebase.
            <br />
            <em className="not-italic text-white/55">Analyze it with AI.</em>
          </h1>

          <p className="text-body animate-fade-rise-delay-2 mt-6 max-w-2xl leading-relaxed text-white/65 sm:mt-8">
            Turn Git history, code changes, contributors, and repository
            activity into clear engineering insights — powered by AI.
          </p>

          {/* Repository analyzer */}
          <div className="animate-fade-rise-delay-2 mt-8 w-full max-w-xl sm:mt-10">
            <form
              onSubmit={handleAnalyze}
              className="liquid-glass flex flex-col items-stretch gap-2 rounded-2xl p-2 sm:flex-row"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3">
                <FaGithub className="h-4 w-4 shrink-0 text-white/40" />
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="github.com/user/repository"
                  disabled={loading}
                  className="w-full min-w-0 bg-transparent font-mono text-sm text-white placeholder-white/35 focus:outline-none disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group/btn flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.16] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing repository...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
            <p className="mt-2.5 pl-1 text-[11px] text-white/35">
              <span className="font-mono">⌘ Enter</span> to analyze
            </p>
          </div>

          {/* Trust indicators */}
          <div className="animate-fade-rise-delay-3 mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-white/50">
            <span className="inline-flex items-center gap-1.5">
              <span>✓</span> Public repositories
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span>✓</span> No installation
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span>✓</span> AI-powered insights
            </span>
          </div>

          {/* Subtle capability pills — never competes with the headline, hidden on mobile */}
          <div className="animate-fade-rise-delay-3 mt-12 hidden flex-wrap items-center justify-center gap-2 sm:flex">
            {CAPABILITY_PILLS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="liquid-glass flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] text-white/55"
              >
                <Icon className="h-3 w-3" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== FEATURES ============================== */}
      <section id="features" className="relative border-t border-white/[0.08] py-14 sm:py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <Reveal className="mb-10 max-w-2xl sm:mb-16">
            <h2
              className="text-section-heading tracking-tight text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Understand your repository from every angle
            </h2>
            <p className="text-body mt-3 text-white/55">
              Turn Git history into a clear picture of how your codebase
              actually works.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }, i) => (
              <Reveal key={title} delay={i * 60}>
                <div className="liquid-glass h-full rounded-2xl p-6 transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/70">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="mt-4 text-[15px] font-medium text-white">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">
                    {description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== HOW IT WORKS ============================== */}
      <section id="how-it-works" className="relative border-t border-white/[0.08] py-14 sm:py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <Reveal className="mb-10 max-w-2xl sm:mb-16">
            <h2
              className="text-section-heading tracking-tight text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              From URL to insights in three steps
            </h2>
          </Reveal>

          <div className="relative grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            <div className="absolute left-[16.6%] right-[16.6%] top-5 hidden h-px bg-white/[0.08] md:block" />
            <div className="absolute bottom-5 left-5 top-5 w-px bg-white/[0.08] md:hidden" />

            {STEPS.map(({ number, icon: Icon, title, description }, i) => (
              <Reveal key={title} delay={i * 80}>
                <div className="relative flex items-start gap-4 pl-14 md:flex-col md:gap-0 md:pl-0">
                  <div className="absolute left-0 top-0 z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/70 md:relative md:mb-5">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-xs text-white/35">{number}</p>
                    <h3 className="text-[15px] font-medium text-white">{title}</h3>
                    <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-white/55">
                      {description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== CTA ============================== */}
      <section className="relative border-t border-white/[0.08] py-14 sm:py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-5 sm:px-6 lg:px-8">
          <Reveal>
            <div className="liquid-glass rounded-3xl px-5 py-10 text-center sm:px-10 sm:py-16">
              <h2
                className="text-section-heading tracking-tight text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Ready to explore your repository?
              </h2>
              <p className="text-body mx-auto mt-3 max-w-md text-white/55">
                Paste a GitHub repository and see what its history can tell
                you.
              </p>
              <div className="mt-8">
                <Link
                  to="/dashboard"
                  className="group inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.16] sm:w-auto"
                >
                  <span>Analyze a repository</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================== FOOTER ============================== */}
      <footer className="relative border-t border-white/[0.08] py-8 sm:py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <img src={logo} alt="RepoIQ AI" className="h-5 w-5 object-contain" />
            <span
              className="text-sm text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              RepoIQ AI
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/55">
            <a href="#features" className="transition-colors hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-white">
              How it works
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-white"
            >
              GitHub
            </a>
          </div>
        </div>
        <div className="mx-auto mt-6 flex max-w-7xl flex-col items-center justify-between gap-3 border-t border-white/[0.08] px-5 pt-6 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
          <p className="font-mono text-xs text-white/35">
            © {new Date().getFullYear()} RepoIQ AI. All rights reserved.
          </p>
          <p className="break-words font-mono text-[11px] tracking-wide text-white/35">
            Developed by{" "}
            <span className="font-medium text-white/55">Shibnath Maity</span>
            <span className="mx-2 opacity-50">·</span>
            <a
              href="mailto:mshibnath169@gmail.com"
              className="transition-colors hover:text-white"
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