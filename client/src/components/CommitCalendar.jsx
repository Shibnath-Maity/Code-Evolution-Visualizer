// CommitCalendar.jsx
import React, { useMemo, useState, useEffect } from "react";
import { ActivityCalendar } from "react-activity-calendar";
import { Flame, Trophy, X } from "lucide-react";
import { TYPE_DOT } from "../constants/commitTypes"; // shared with Timeline.jsx — see note below

const THEME = {
  light: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
  dark: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
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

  // Trigger the panel's enter transition on the next frame after mount,
  // so the initial state (opacity-0, translated) actually paints first.
  useEffect(() => {
    if (selected) {
      setPanelOpen(false);
      const id = requestAnimationFrame(() => setPanelOpen(true));
      return () => cancelAnimationFrame(id);
    }
    setPanelOpen(false);
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-[15px] font-semibold text-slate-900 mb-1">
        {stats.totalCommits} commit{stats.totalCommits !== 1 ? "s" : ""} in {year}
      </h2>

      {timeline.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">No commit activity found.</div>
      ) : (
        <>
          <p className="text-[13px] text-gray-500 mb-4 flex flex-wrap items-center gap-x-1.5">
            <span>{stats.activeDays} active days</span>
            <Dot />
            <span>{stats.maxCommits} max/day</span>
            <Dot />
            <span>{stats.averageCommits} avg/day</span>
            {stats.current > 0 && (
              <>
                <Dot />
                <span className="inline-flex items-center gap-1 text-orange-600 font-medium">
                  <Flame size={12} /> {stats.current}-day streak
                </span>
              </>
            )}
            {stats.longest > 0 && (
              <>
                <Dot />
                <span className="inline-flex items-center gap-1 text-indigo-600 font-medium">
                  <Trophy size={12} /> {stats.longest} longest
                </span>
              </>
            )}
          </p>

          <ActivityCalendar
            data={data}
            maxLevel={MAX_LEVEL}
            blockSize={12}
            blockMargin={4}
            fontSize={12}
              colorScheme="light"
            hideColorLegend={false}
            hideMonthLabels={false}
            theme={THEME}
            renderBlock={(block, activity) => {
              const isToday = activity.date === TODAY_KEY;
              return React.cloneElement(block, {
                className: `${block.props.className || ""} transition-transform duration-150 ease-out hover:scale-125 cursor-pointer [transform-box:fill-box] [transform-origin:center]`,
                onClick: () => setSelectedDate(activity.count > 0 ? activity.date : null),
                title: `${activity.count} commit${activity.count !== 1 ? "s" : ""} on ${activity.date}`,
                ...(isToday && { stroke: "#6366f1", strokeWidth: 1.5 }),
              });
            }}
          />

          {selected && (
            <div
              className={`mt-5 rounded-lg border border-gray-200 bg-gray-50/60 p-4 transition-all duration-200 ease-out ${
                panelOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-semibold text-slate-800">
                  {formatDayHeading(selectedDate)} · {selected.count} commit
                  {selected.count !== 1 ? "s" : ""}
                </p>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  <X size={14} />
                </button>
              </div>
              <ul className="space-y-2.5">
                {selected.commits.map((c, i) => (
                  <li key={c.hash || i} className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${TYPE_DOT[c.type] || "bg-indigo-500"}`}
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] text-slate-700 leading-snug">
                        {c.message || "No commit message"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                        {c.hash && <span className="font-mono">{c.hash.substring(0, 7)}</span>}
                        {c.author && <span>{c.author}</span>}
                        {c.date && <span>{formatTime(c.date)}</span>}
                      </p>
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

function Dot() {
  return <span className="text-gray-300">·</span>;
}