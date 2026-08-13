import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 antialiased">
      {/* -------------------------------------------------------------------
          Mobile / Tablet Overlay Backdrop
         ------------------------------------------------------------------- */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* -------------------------------------------------------------------
          Sidebar Container
         ------------------------------------------------------------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white border-r border-slate-200/80 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <Sidebar onCloseMobile={() => setIsSidebarOpen(false)} />
      </aside>

      {/* -------------------------------------------------------------------
          Main Content Wrapper
         ------------------------------------------------------------------- */}
      <div className="flex flex-1 flex-col lg:pl-72">
        {/* Mobile / Tablet Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md sm:px-6 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
              aria-label="Open sidebar"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
            <span className="font-semibold text-slate-900">Dashboard</span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-screen-2xl p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;