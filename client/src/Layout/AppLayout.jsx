import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="ml-72 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-screen-2xl p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AppLayout;