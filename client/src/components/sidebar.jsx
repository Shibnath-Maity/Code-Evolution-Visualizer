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
import { useEffect, useState } from "react";
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

// Shared class fragments so the markup below stays readable and any future
// tweak to nav-item or section styling only needs to happen in one place.
// Nav items are 44px tall below the lg breakpoint (comfortable touch target
// for phones/tablets) and settle to a tighter 40px once a mouse is the
// primary input, on the persistent desktop sidebar.
const navItemBase =
  "group relative flex h-11 lg:h-10 items-center gap-2.5 rounded-lg px-2.5 text-[14px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50";
const navItemInactive =
  "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100";
const navItemActive =
  "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400";

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

  // Lock page scroll while the off-canvas drawer is open so the backdrop
  // can't be scrolled past and the page behind it can't pan horizontally.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

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
      {/* ================= MOBILE / TABLET TOP BAR ================= */}
      {/* Sits under 1024px, where the sidebar becomes an off-canvas drawer. */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-[60px] items-center justify-between border-b border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-950 sm:px-4 lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <img
            src={logo}
            alt="RepoIQ logo"
            className="h-8 w-8 shrink-0 rounded-md"
          />
          <span className="truncate text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">
            RepoIQ <span className="text-cyan-600 dark:text-cyan-400">AI</span>
          </span>
        </div>

        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* ================= MOBILE / TABLET OVERLAY ================= */}
      <div
        onClick={closeMobileMenu}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-slate-950/20 transition-opacity duration-200 lg:hidden ${
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* ================= SIDEBAR ================= */}
      {/* Below 1024px this is a fixed off-canvas drawer capped at 85% of the
          viewport so it can never overflow very narrow phones; at 1024px+
          it becomes the persistent, fixed-width application sidebar. */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-[100dvh] w-[min(280px,85vw)]
          flex-col border-r border-slate-200
          bg-white text-slate-700
          transition-transform duration-200 ease-out
          dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:w-[260px] lg:translate-x-0
        `}
      >
        {/* ================= LOGO ================= */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              src={logo}
              alt="RepoIQ logo"
              className="h-7 w-7 shrink-0 rounded-md"
            />

            <div className="min-w-0">
              <h1 className="truncate text-[17px] font-semibold leading-tight tracking-tight text-slate-900 dark:text-white">
                RepoIQ <span className="text-cyan-600 dark:text-cyan-400">AI</span>
              </h1>
              <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                Repository Analysis
              </p>
            </div>
          </div>

          {/* Mobile / tablet close button */}
          <button
            onClick={closeMobileMenu}
            aria-label="Close navigation"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-200 lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        {/* ================= NAVIGATION ================= */}
        {/* Scrolls independently of the header/footer if it ever grows
            taller than the viewport. */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-4">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                <h2 className="mb-1.5 px-2.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  {section.label}
                </h2>

                <div className="space-y-0.5">
                  {section.items.map(({ label, icon: Icon, path, end }) => (
                    <NavLink
                      key={label}
                      to={path}
                      end={end}
                      onClick={closeMobileMenu}
                      className={({ isActive }) =>
                        `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            size={17}
                            strokeWidth={2}
                            className={`shrink-0 ${
                              isActive
                                ? "text-cyan-600 dark:text-cyan-400"
                                : "text-slate-400 dark:text-slate-500"
                            }`}
                          />
                          <span className="truncate">{label}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* ================= USER ================= */}
        <div className="shrink-0 border-t border-slate-200 p-3 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {getInitials(user?.name)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-slate-800 dark:text-slate-200">
                {user?.name || "User"}
              </p>
              <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                {user?.email || "user@example.com"}
              </p>
            </div>

            <button
              onClick={logout}
              aria-label="Log out"
              title="Log out"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors duration-150 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 dark:text-slate-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 lg:h-9 lg:w-9"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= DESKTOP CONTENT SPACING ================= */}
      {/* Reserves the sidebar's width in normal flow so the app's main
          content is pushed over rather than hidden underneath it. */}
      <div className="hidden lg:block lg:w-[260px] lg:shrink-0" />

      {/* ================= MOBILE / TABLET CONTENT SPACING ================= */}
      <div className="h-[60px] lg:hidden" />
    </>
  );
}

export default Sidebar;