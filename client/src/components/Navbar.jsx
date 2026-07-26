import { NavLink } from "react-router-dom";
import logo from "../assets/logo.png";

import {
    Home,
  LayoutDashboard,
  FolderGit2,
  GitCommit,
  Users,
  Flame,
  Clock,
  Sparkles,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
    { label: "Home", icon: Home, path: "/" },
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Repositories", icon: FolderGit2, path: "/repositories" },
  { label: "Commits", icon: GitCommit, path: "/commits" },
  { label: "Contributors", icon: Users, path: "/contributors" },
  { label: "Hotspots", icon: Flame, path: "/hotspots" },
  { label: "Timeline", icon: Clock, path: "/timeline" },
  { label: "AI Insights", icon: Sparkles, path: "/ai-insights" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

function Navbar() {
  return (
    <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center flex-wrap gap-4">

      {/* Logo + title */}
      <div className="flex items-center gap-3">
        <img
          src={logo}
          alt="Code Evolution Visualizer"
          className="h-10 w-10"
        />

        <div>
          <h1 className="font-bold text-xl">
            Code Evolution Visualizer
          </h1>

          <p className="text-xs text-gray-500">
            Analyze Git repositories
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
              `flex items-center gap-2 px-3 py-2 rounded-lg
              text-sm transition-colors
              ${
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
    </nav>
  );
}

export default Navbar;