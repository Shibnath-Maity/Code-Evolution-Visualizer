// import logo from "../assets/logo.png";

// function Navbar() {
//   return (
//     <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center">
//       {/* Left */}
//       <div className="flex items-center gap-3">
//         <img src={logo} alt="Logo" className="h-10 w-10" />

//         <div>
//           <h1 className="font-bold text-xl">
//             Code Evolution Visualizer
//           </h1>
//           <p className="text-xs text-gray-500">
//             Analyze Git repositories
//           </p>
//         </div>
//       </div>

//       {/* Right */}
//       <div className="flex gap-8 font-medium">
//         <a href="#" className="hover:text-blue-600">Dashboard</a>
//         <a href="#" className="hover:text-blue-600">Timeline</a>
//         <a href="#" className="hover:text-blue-600">Commits</a>
//         <a href="#" className="hover:text-blue-600">About</a>
//       </div>
//     </nav>
//   );
// }

// export default Navbar;
import { useState } from "react";
import logo from "../assets/logo.png";
import {
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
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Repositories", icon: FolderGit2 },
  { label: "Commits", icon: GitCommit },
  { label: "Contributors", icon: Users },
  { label: "Hotspots", icon: Flame },
  { label: "Timeline", icon: Clock },
  { label: "AI Insights", icon: Sparkles },
  { label: "Settings", icon: Settings },
];

function Navbar({ activeItem = "Dashboard", onNavigate }) {
  const [active, setActive] = useState(activeItem);

  const handleClick = (label) => {
    setActive(label);
    onNavigate?.(label);
  };

  return (
    <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center flex-wrap gap-4">
      {/* Left: logo + title */}
      <div className="flex items-center gap-3">
        <img src={logo} alt="Logo" className="h-10 w-10" />
        <div>
          <h1 className="font-bold text-xl">Code Evolution Visualizer</h1>
          <p className="text-xs text-gray-500">Analyze Git repositories</p>
        </div>
      </div>

      {/* Right: nav items */}
      <div className="flex gap-1 font-medium flex-wrap">
        {NAV_ITEMS.map(({ label, icon: Icon }) => {
          const isActive = active === label;
          return (
            <button
              key={label}
              onClick={() => handleClick(label)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
                }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default Navbar;
