import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  GitCommit,
  Users,
  Flame,
  Clock,
  Wrench,
  Sparkles,
  Settings,
  Home,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import logo from "../assets/logo.png";

const NAV_SECTIONS = [
  {
    label: "Workspace",
    items: [
      { label: "Home", icon: Home, path: "/", end: true },
      { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    ],
  },
  {
    label: "Analysis",
    items: [
      { label: "Commits", icon: GitCommit, path: "/commits" },
      { label: "Contributors", icon: Users, path: "/contributors" },
      { label: "Hotspots", icon: Flame, path: "/hotspots" },
      { label: "Timeline", icon: Clock, path: "/timeline" },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "Debug Center", icon: Wrench, path: "/debug-center" },
      { label: "AI Insights", icon: Sparkles, path: "/ai-insights" },
    ],
  },
  {
    label: "System",
    items: [{ label: "Settings", icon: Settings, path: "/settings" }],
  },
];

function getInitials(name) {
  if (!name) return "U";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

function Sidebar() {
  const navigate = useNavigate();
  const user = getUser();

  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  return (
    <>
      {/* ================= MOBILE TOP BAR ================= */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-cyan-100 bg-white/90 px-4 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-cyan-500 shadow-sm">
            <img
              src={logo}
              alt="RepoIQ logo"
              className="h-full w-full object-cover"
            />
          </div>

          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              RepoIQ <span className="text-cyan-600">AI</span>
            </h1>
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-100 bg-cyan-50 text-cyan-700 transition hover:bg-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-cyan-400 dark:hover:bg-slate-800"
        >
          <Menu size={21} />
        </button>
      </header>

      {/* ================= MOBILE OVERLAY ================= */}
      {mobileOpen && (
        <div
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-[280px]
          flex-col border-r
          border-cyan-100/80
          bg-sky-50/95
          text-slate-800
          shadow-xl shadow-cyan-900/5
          backdrop-blur-xl
          transition-transform duration-300
          dark:border-slate-800
          dark:bg-slate-950/95
          dark:text-slate-200
          
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          lg:w-64
          xl:w-72
        `}
      >
        {/* Background Glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-cyan-200/40 via-sky-100/30 to-transparent dark:from-cyan-950/40 dark:via-slate-900/20" />

        {/* ================= LOGO ================= */}
        <div className="relative border-b border-cyan-100/80 p-5 dark:border-slate-800 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cyan-500 shadow-md shadow-cyan-500/25">
                <img
                  src={logo}
                  alt="RepoIQ logo"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  RepoIQ <span className="text-cyan-600">AI</span>
                </h1>

                <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-cyan-700/70 dark:text-cyan-400/70">
                  Repository Analysis
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={closeMobileMenu}
              aria-label="Close navigation"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-cyan-100 hover:text-cyan-700 dark:hover:bg-slate-800 dark:hover:text-cyan-400 lg:hidden"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ================= NAVIGATION ================= */}
        <nav className="relative flex-1 overflow-y-auto px-3 py-5 sm:px-4 sm:py-6">
          <div className="space-y-5 sm:space-y-6">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                <h2 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-cyan-800/60 dark:text-cyan-400/60 sm:text-[11px]">
                  {section.label}
                </h2>

                <div className="space-y-1">
                  {section.items.map(
                    ({ label, icon: Icon, path, end }) => (
                      <NavLink
                        key={label}
                        to={path}
                        end={end}
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                          `group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                            isActive
                              ? "border border-cyan-200/80 bg-white text-cyan-700 shadow-sm shadow-cyan-500/10 dark:border-cyan-800 dark:bg-slate-900 dark:text-cyan-400"
                              : "text-slate-600 hover:bg-cyan-100/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className={`absolute left-0 top-1/2 h-5 w-[3.5px] -translate-y-1/2 rounded-r-full bg-cyan-500 transition-opacity duration-150 ${
                                isActive
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />

                            <Icon
                              size={18}
                              className={
                                isActive
                                  ? "text-cyan-600 dark:text-cyan-400"
                                  : "text-slate-400 group-hover:text-cyan-600 dark:text-slate-500 dark:group-hover:text-cyan-400"
                              }
                            />

                            <span>{label}</span>
                          </>
                        )}
                      </NavLink>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* ================= USER ================= */}
        <div className="relative border-t border-cyan-100/80 p-3 dark:border-slate-800 sm:p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-cyan-100 bg-white/80 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-sm font-semibold text-white shadow-sm shadow-cyan-500/30">
              {getInitials(user?.name)}
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {user?.name || "User"}
              </h3>

              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {user?.email || "user@example.com"}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-2.5 text-sm font-medium text-rose-600 shadow-sm transition-all duration-150 hover:bg-rose-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-600 dark:hover:text-white"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* ================= DESKTOP CONTENT SPACING ================= */}
      <div className="hidden lg:block lg:w-64 xl:w-72" />

      {/* ================= MOBILE CONTENT SPACING ================= */}
      <div className="h-16 lg:hidden" />
    </>
  );
}

export default Sidebar;