import React, { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  // Close on Escape key
  useEffect(() => {
    if (!isSidebarOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeSidebar();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen, closeSidebar]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [isSidebarOpen]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased transition-colors duration-300">
      {/* Mobile / Tablet Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform
        bg-white dark:bg-slate-900
        border-r border-slate-200/80 dark:border-slate-800
        transition-all duration-300 ease-in-out
        lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}
      >
        <Sidebar onCloseMobile={closeSidebar} />
      </aside>

      {/* Main Wrapper */}
      <div className="flex flex-1 flex-col lg:pl-72">
        {/* Mobile Header */}
        <header
          className="
            sticky top-0 z-30
            flex h-16 items-center justify-between
            border-b border-slate-200/80 dark:border-slate-800
            bg-white/80 dark:bg-slate-900/80
            px-4 backdrop-blur-md
            sm:px-6 lg:hidden
            transition-colors duration-300
          "
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openSidebar}
              className="
                inline-flex items-center justify-center
                rounded-lg p-2
                text-slate-600 dark:text-slate-300
                hover:bg-slate-100 dark:hover:bg-slate-800
                hover:text-slate-900 dark:hover:text-white
                focus:outline-none
                focus:ring-2 focus:ring-slate-400
                transition-colors
              "
              aria-label="Open sidebar"
              aria-expanded={isSidebarOpen}
              aria-controls="app-sidebar"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
            <span className="font-semibold text-slate-900 dark:text-white">
              Dashboard
            </span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <div className="mx-auto max-w-screen-2xl p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;