import React from "react";
import { Cpu, Code2, Files, ArrowRight, FileCode2, Inbox } from "lucide-react";

// Vibrant gradient definitions for dynamic rendering
const COLOR_PALETTE = [
  {
    bg: "bg-indigo-500",
    text: "text-indigo-600 dark:text-indigo-400",
    badge: "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300",
    gradient: "from-indigo-500 to-violet-500",
  },
  {
    bg: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    bg: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    bg: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    bg: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    badge: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300",
    gradient: "from-rose-500 to-pink-500",
  },
];

function EmptyState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-8 text-center dark:border-slate-800">
      <Inbox size={24} className="mb-2 text-slate-300 dark:text-slate-600" />
      <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
        {label}
      </p>
    </div>
  );
}

/**
 * Common Card Shell for consistent visual visual hierarchy
 */
function CardShell({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
      {/* Background ambient radial light */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent blur-2xl" />

      <div className="relative mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/20 dark:bg-indigo-400/10 dark:text-indigo-400 dark:ring-indigo-400/20">
          <Icon size={18} />
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="relative">{children}</div>
    </div>
  );
}

// ==========================================================
// TECHNICAL FOCUS
// ==========================================================

export function TechnicalFocusCard({ focus = [] }) {
  return (
    <CardShell
      icon={Cpu}
      title="Technical Focus"
      subtitle="Repository code complexity distribution"
    >
      {focus.length === 0 ? (
        <EmptyState label="No technical metrics available." />
      ) : (
        <div className="space-y-3.5">
          {focus.map((item, index) => {
            const palette = COLOR_PALETTE[index % COLOR_PALETTE.length];
            return (
              <div key={item.label} className="group flex items-center gap-3">
                <span className="w-28 truncate text-xs font-semibold text-slate-700 transition-colors group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white">
                  {item.label}
                </span>

                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${palette.gradient} transition-all duration-500 ease-out`}
                    style={{ width: `${Math.max(Number(item.pct || 0), 2)}%` }}
                  />
                </div>

                <span className="w-11 text-right font-mono text-xs font-bold tabular-nums text-slate-500 dark:text-slate-400">
                  {item.pct}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </CardShell>
  );
}

// ==========================================================
// TOP LANGUAGES
// ==========================================================

export function TopLanguagesCard({ languages = [] }) {
  return (
    <CardShell
      icon={Code2}
      title="Top Languages"
      subtitle="Languages used in this repository"
    >
      {languages.length === 0 ? (
        <EmptyState label="No language data available." />
      ) : (
        <div className="space-y-4">
          {/* Segmented Distribution Bar */}
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            {languages.map((language, index) => {
              const palette = COLOR_PALETTE[index % COLOR_PALETTE.length];
              return (
                <div
                  key={language.name}
                  className={`h-full bg-gradient-to-r ${palette.gradient} transition-all duration-300 hover:opacity-85`}
                  style={{ width: `${language.pct}%` }}
                  title={`${language.name}: ${language.pct}%`}
                />
              );
            })}
          </div>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-2 gap-2">
            {languages.map((language, index) => {
              const palette = COLOR_PALETTE[index % COLOR_PALETTE.length];
              return (
                <div
                  key={language.name}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-2.5 py-1.5 dark:border-slate-800/60 dark:bg-slate-800/40"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${palette.bg}`}
                    />
                    <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {language.name}
                    </span>
                  </div>

                  <span className="font-mono text-xs font-bold tabular-nums text-slate-400 dark:text-slate-500">
                    {language.pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </CardShell>
  );
}

// ==========================================================
// MOST MODIFIED FILES
// ==========================================================

export function MostModifiedFilesCard({ files = [], onViewAll }) {
  return (
    <CardShell
      icon={Files}
      title="Most Modified Files"
      subtitle="Files with the highest change frequency"
    >
      {files.length === 0 ? (
        <EmptyState label="No file modification data available." />
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            {files.map((file, index) => {
              const palette = COLOR_PALETTE[index % COLOR_PALETTE.length];
              // Extract extension for visual badge tag
              const ext = file.path.split(".").pop()?.toUpperCase() || "FILE";

              return (
                <div
                  key={file.path}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-100/80 bg-slate-50/40 p-2.5 transition-all hover:border-slate-200 hover:bg-white hover:shadow-md hover:shadow-slate-200/50 dark:border-slate-800/60 dark:bg-slate-900/40 dark:hover:border-slate-700 dark:hover:bg-slate-800/60 dark:hover:shadow-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <FileCode2
                      size={15}
                      className="shrink-0 text-slate-400 group-hover:text-indigo-500 dark:text-slate-500"
                    />

                    <span
                      className="truncate font-mono text-xs font-medium text-slate-700 transition-colors group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white"
                      title={file.path}
                    >
                      {file.path}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Visual Progress Bar Component */}
                    <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${palette.gradient}`}
                        style={{
                          width: `${Math.max(Number(file.pct || 0), 4)}%`,
                        }}
                      />
                    </div>

                    <span className="w-9 text-right font-mono text-xs font-bold tabular-nums text-slate-600 dark:text-slate-300">
                      {file.changes}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="group flex w-full items-center justify-center gap-1.5 rounded-xl border border-transparent py-2 text-xs font-bold text-indigo-600 transition-all hover:bg-indigo-50/80 hover:text-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
            >
              <span>View all files</span>
              <ArrowRight
                size={13}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </button>
          )}
        </div>
      )}
    </CardShell>
  );
}