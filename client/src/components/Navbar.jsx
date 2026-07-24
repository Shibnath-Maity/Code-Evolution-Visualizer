import logo from "../assets/logo.png";

function Navbar() {
  return (
    <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center">
      {/* Left */}
      <div className="flex items-center gap-3">
        <img src={logo} alt="Logo" className="h-10 w-10" />

        <div>
          <h1 className="font-bold text-xl">
            Code Evolution Visualizer
          </h1>
          <p className="text-xs text-gray-500">
            Analyze Git repositories
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex gap-8 font-medium">
        <a href="#" className="hover:text-blue-600">Dashboard</a>
        <a href="#" className="hover:text-blue-600">Timeline</a>
        <a href="#" className="hover:text-blue-600">Commits</a>
        <a href="#" className="hover:text-blue-600">About</a>
      </div>
    </nav>
  );
}

export default Navbar;