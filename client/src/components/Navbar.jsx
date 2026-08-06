import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

import {
  Home,
  LayoutDashboard,
  Wrench,
  GitCommit,
  Users,
  Flame,
  Clock,
  Sparkles,
  Settings,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Commits", icon: GitCommit, path: "/commits" },
  { label: "Contributors", icon: Users, path: "/contributors" },
  { label: "Hotspots", icon: Flame, path: "/hotspots" },
  { label: "Timeline", icon: Clock, path: "/timeline" },
  { label: "Debug Center", icon: Wrench, path: "/debug-center" },
  { label: "AI Insights", icon: Sparkles, path: "/ai-insights" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("repositoryId");
    localStorage.removeItem("repoUrl");
    localStorage.removeItem("repoPath");
    localStorage.removeItem("dashboardData");
    localStorage.removeItem("repositoryAnalysis");

    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center flex-wrap gap-4">

      {/* Logo */}
      <div className="flex items-center gap-3">
        <img
          src={logo}
          alt="RepoIQ AI"
          className="h-10 w-10"
        />

        <div>
          <h1 className="font-bold text-xl">
            RepoIQ AI
          </h1>

          <p className="text-xs text-gray-500">
            AI-Powered Repository Intelligence
          </p>
        </div>
      </div>
            {/* Navigation */}
      <div className="flex gap-1 font-medium flex-wrap">

        {NAV_ITEMS.map(({ label, icon: Icon, path }) => (

          <NavLink
            key={label}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>

        ))}

      </div>
            {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 transition"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>

    </nav>
  );
}

export default Navbar;