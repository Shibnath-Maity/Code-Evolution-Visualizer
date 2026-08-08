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
  Bot,
} from "lucide-react";

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

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-72 flex-col bg-slate-950 text-white shadow-2xl">
      {/* Background Glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-indigo-600/15 to-transparent" />

      {/* ================= Logo ================= */}
      <div className="relative border-b border-slate-800/80 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-950/50">
            <Bot className="h-6 w-6 text-white" strokeWidth={2.25} />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight">
              RepoIQ <span className="text-indigo-400">AI</span>
            </h1>
            <p className="truncate text-[11px] uppercase tracking-wider text-slate-500">
              Repository Analysis
            </p>
          </div>
        </div>
      </div>

      {/* ================= Navigation ================= */}
      <nav className="relative flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <h2 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {section.label}
              </h2>

              <div className="space-y-1">
                {section.items.map(({ label, icon: Icon, path, end }) => (
                  <NavLink
                    key={label}
                    to={path}
                    end={end}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        isActive
                          ? "bg-gradient-to-r from-indigo-600/25 to-indigo-600/5 text-white"
                          : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-500 transition-opacity duration-150 ${
                            isActive ? "opacity-100" : "opacity-0"
                          }`}
                        />

                        <Icon
                          size={18}
                          className={
                            isActive
                              ? "text-indigo-400"
                              : "text-slate-500 group-hover:text-slate-300"
                          }
                        />

                        <span className="font-medium">{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* ================= User ================= */}
      <div className="relative border-t border-slate-800/80 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-semibold">
            {getInitials(user?.name)}
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">
              {user?.name || "User"}
            </h3>
            <p className="truncate text-xs text-slate-500">
              {user?.email || "user@example.com"}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-900/50 bg-red-600/10 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors duration-150 hover:bg-red-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;