// CommitCalendar.jsx
import React, { useMemo, useState, useEffect } from "react";
import { ActivityCalendar } from "react-activity-calendar";
import { Flame, Trophy, X, GitCommit, Calendar as CalendarIcon, Zap } from "lucide-react";
import { TYPE_DOT } from "../constants/commitTypes";

// Modern custom theme scales with CSS variables / smooth hues
const THEME = {
  light: ["#f1f5f9", "#cbd5e1", "#818cf8", "#4f46e5", "#3730a3"],
  dark: ["#0f172a", "#1e293b", "#4f46e5", "#6366f1", "#818cf8"],
};

const LEVELS = [
  { max: 0, level: 0 },
  { max: 2, level: 1 },
  { max: 5, level: 2 },
  { max: 10, level: 3 },
];
const MAX_LEVEL = 4;

function commitsToLevel(count) {
  for (const item of LEVELS) if (count <= item.max) return item.level;
  return MAX_LEVEL;
}

function toLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const TODAY_KEY = toLocalDateKey(new Date());

function formatDayHeading(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return isNaN(d) ? "" : d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function buildDayIndex(timeline) {
  const index = {};
  for (const commit of timeline) {
    if (!commit.date) continue;
    const key = commit.date.substring(0, 10);
    if (!index[key]) index[key] = { count: 0, commits: [] };
    index[key].count += 1;
    index[key].commits.push(commit);
  }
  return index;
}

function generateYearData(dayIndex) {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 1);
  const data = [];
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const key = toLocalDateKey(d);
    const count = dayIndex[key]?.count || 0;
    data.push({ date: key, count, level: commitsToLevel(count) });
  }
  return data;
}

function computeStreaks(yearData) {
  let longest = 0;
  let running = 0;
  for (const day of yearData) {
    running = day.count > 0 ? running + 1 : 0;
    if (running > longest) longest = running;
  }
  let current = 0;
  for (let i = yearData.length - 1; i >= 0; i--) {
    if (yearData[i].count > 0) current++;
    else if (i === yearData.length - 1) continue;
    else break;
  }
  return { current, longest };
}

export default function CommitCalendar({ timeline = [] }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const { data, dayIndex, stats, year } = useMemo(() => {
    const dayIndex = buildDayIndex(timeline);
    const yearData = generateYearData(dayIndex);

    let activeDays = 0;
    let maxCommits = 0;
    for (const day of yearData) {
      if (day.count > 0) activeDays++;
      if (day.count > maxCommits) maxCommits = day.count;
    }

    const totalCommits = timeline.length;
    const averageCommits = activeDays === 0 ? 0 : (totalCommits / activeDays).toFixed(1);
    const streaks = computeStreaks(yearData);

    return {
      data: yearData,
      dayIndex,
      year: new Date().getFullYear(),
      stats: { totalCommits, activeDays, maxCommits, averageCommits, ...streaks },
    };
  }, [timeline]);

  const selected = selectedDate ? dayIndex[selectedDate] : null;

  useEffect(() => {
    if (selected) {
      setPanelOpen(false);
      const id = requestAnimationFrame(() => setPanelOpen(true));
      return () => cancelAnimationFrame(id);
    }
    setPanelOpen(false);
  }, [selectedDate]);

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl transition-all">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/60 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <GitCommit size={18} />
            </span>
            <h2 className="text-lg font-semibold text-slate-100 tracking-tight">
              {stats.totalCommits.toLocaleString()} commits in {year}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 pl-10">
            {stats.activeDays} active days out of {data.length} tracked
          </p>
        </div>

        {/* Quick Stat Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {stats.current > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
              <Flame size={14} className="animate-pulse" />
              <span>{stats.current} Day Streak</span>
            </div>
          )}
          {stats.longest > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
              <Trophy size={14} />
              <span>{stats.longest} Best Streak</span>
            </div>
          )}
        </div>
      </div>

      {timeline.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-2xl">
          <CalendarIcon className="mb-2 opacity-40" size={32} />
          <p>No commit activity recorded yet.</p>
        </div>
      ) : (
        <>
          {/* Calendar Display */}
          <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
            <ActivityCalendar
              data={data}
              maxLevel={MAX_LEVEL}
              blockSize={12}
              blockMargin={4}
              fontSize={12}
              colorScheme="dark"
              hideColorLegend={false}
              hideMonthLabels={false}
              theme={THEME}
              renderBlock={(block, activity) => {
                const isToday = activity.date === TODAY_KEY;
                const isSelected = selectedDate === activity.date;

                return React.cloneElement(block, {
                  className: `${block.props.className || ""} transition-all duration-200 ease-in-out hover:scale-125 hover:z-10 cursor-pointer [transform-box:fill-box] [transform-origin:center]`,
                  onClick: () => setSelectedDate(activity.count > 0 ? activity.date : null),
                  title: `${activity.count} commit${activity.count !== 1 ? "s" : ""} on ${activity.date}`,
                  ...(isToday && { stroke: "#818cf8", strokeWidth: 1.5 }),
                  ...(isSelected && { stroke: "#38bdf8", strokeWidth: 2 }),
                });
              }}
            />
          </div>

          {/* Additional Analytics Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800/60">
            <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-800/80">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Max / Day</span>
              <p className="text-lg font-semibold text-slate-200 mt-0.5">{stats.maxCommits}</p>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-800/80">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Avg / Active Day</span>
              <p className="text-lg font-semibold text-slate-200 mt-0.5">{stats.averageCommits}</p>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-slate-800/30 rounded-xl p-3 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Pace</span>
                <p className="text-lg font-semibold text-slate-200 mt-0.5">
                  {stats.current > 0 ? "Active" : "Idle"}
                </p>
              </div>
              <Zap size={20} className={stats.current > 0 ? "text-emerald-400" : "text-slate-600"} />
            </div>
          </div>

          {/* Interactive Commit Details Panel */}
          {selected && (
            <div
              className={`mt-6 rounded-2xl border border-slate-700/60 bg-slate-800/40 backdrop-blur-md p-5 transition-all duration-300 ease-out shadow-xl ${
                panelOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
              }`}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                  <p className="text-sm font-semibold text-slate-100">
                    {formatDayHeading(selectedDate)}
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-medium">
                    {selected.count} {selected.count === 1 ? "commit" : "commits"}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
                  aria-label="Close details"
                >
                  <X size={16} />
                </button>
              </div>

              <ul className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {selected.commits.map((c, i) => (
                  <li
                    key={c.hash || i}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-700/30 transition-colors"
                  >
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ring-4 ring-slate-900 ${
                        TYPE_DOT[c.type] || "bg-indigo-400"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-200 leading-snug break-words">
                        {c.message || "No commit message provided"}
                      </p>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                        {c.hash && (
                          <span className="font-mono bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700/50 text-indigo-300">
                            {c.hash.substring(0, 7)}
                          </span>
                        )}
                        {c.author && <span className="text-slate-300">{c.author}</span>}
                        {c.date && <span>• {formatTime(c.date)}</span>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}