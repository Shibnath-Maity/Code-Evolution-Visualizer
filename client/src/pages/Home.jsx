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

 const handleAnalyze = (e) => {
  e.preventDefault();

  if (!repoUrl.trim()) {
    alert("Please enter a GitHub repository URL");
    return;
  }

  navigate("/dashboard", {
    state: {
      repoUrl: repoUrl.trim(),
    },
  });
};

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950 opacity-90" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 py-8">

          {/* Nav */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-indigo-600 flex items-center justify-center">
                <FaGithub className="h-6 w-6" />
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
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-medium"
              >
                Dashboard
              </Link>
            </nav>
          </div>

          {/* Hero content */}
          <div className="max-w-4xl mx-auto text-center py-8">

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-sm text-indigo-200 mb-6">
              <Sparkles className="h-4 w-4" />
              Understand how your code evolves
            </div>

            <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
              Visualize the
              <span className="text-indigo-400"> evolution </span>
              of your code.
            </h2>

            <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
              Analyze your GitHub repositories, explore commits,
              discover hotspots, understand contributors and get
              AI-powered insights.
            </p>

            {/* Analyze box */}
            <form
              onSubmit={handleAnalyze}
              className="mt-10 max-w-2xl mx-auto bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-3"
            >
              <div className="flex flex-col sm:flex-row gap-3">

                <div className="flex items-center gap-3 flex-1 bg-slate-900/80 rounded-xl px-4 py-3">
                  <FaGithub className="h-5 w-5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/repository"
                    className="w-full bg-transparent outline-none text-sm text-white placeholder:text-slate-500"
                  />
                </div>

                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-semibold"
                >
                  Analyze
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>

            <p className="text-xs text-slate-500 mt-4">
              No installation required • Paste a public GitHub repository
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16 pt-10 border-t border-white/10">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group p-6 rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-lg transition"
              >
                <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg mt-5">{title}</h3>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {STEPS.map(({ icon: Icon, title, description }, i) => (
              <div key={title} className="relative text-center">
                <div className="h-14 w-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-200">
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
      <section className="bg-slate-950 py-20 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            See how your project evolved.
          </h2>
          <p className="text-slate-400 mt-4">
            Start with a GitHub repository and explore its complete
            development journey.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-semibold"
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

