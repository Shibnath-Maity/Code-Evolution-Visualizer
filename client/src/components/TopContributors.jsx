import React, { useMemo, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Users } from "lucide-react";

// Deterministic color pick so the same person always gets the same avatar color
const AVATAR_PALETTE = [
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-sky-100", text: "text-sky-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-cyan-100", text: "text-cyan-700" },
];

function avatarColor(seed = "") {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

const RANK_STYLES = {
  0: "bg-amber-400 text-amber-950",
  1: "bg-gray-300 text-gray-700",
  2: "bg-orange-300 text-orange-900",
};

const COLUMNS = [
  { key: "name", label: "Contributor", align: "left" },
  { key: "commits", label: "Commits", align: "right" },
  { key: "linesAdded", label: "Lines Added", align: "right" },
  { key: "linesRemoved", label: "Lines Removed", align: "right" },
  { key: "filesChanged", label: "Files Changed", align: "right" },
  { key: "lastContribution", label: "Last Contribution", align: "right" },
];

function formatNumber(n = 0) {
  return new Intl.NumberFormat("en-US").format(n);
}

const TopContributors = ({ contributors = [] }) => {
  const [sortKey, setSortKey] = useState("commits");
  const [sortDir, setSortDir] = useState("desc");

  const maxChanges = useMemo(
    () =>
      Math.max(
        1,
        ...contributors.map((c) => (c.linesAdded || 0) + (c.linesRemoved || 0))
      ),
    [contributors]
  );

  const sorted = useMemo(() => {
    const list = [...contributors];
    list.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (sortKey === "name" || sortKey === "lastContribution") {
        const cmp = String(av || "").localeCompare(String(bv || ""));
        return sortDir === "asc" ? cmp : -cmp;
      }
      const cmp = (Number(av) || 0) - (Number(bv) || 0);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [contributors, sortKey, sortDir]);

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ colKey }) => {
    if (colKey !== sortKey) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-gray-700" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-gray-700" />
    );
  };

  if (contributors.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Top Contributors</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900">No contributors yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Activity will show up here once commits start landing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Top Contributors</h2>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
          {contributors.length} {contributors.length === 1 ? "person" : "people"}
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 border-b border-gray-100">
              {COLUMNS.map((col, i) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`${i === 0 ? "px-6" : "px-4"} py-4 font-medium ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort(col.key)}
                    className={`group inline-flex items-center gap-1.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                      col.align === "right" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <span>{col.label}</span>
                    <SortIcon colKey={col.key} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((contributor, index) => {
              const colors = avatarColor(contributor.email || contributor.name);
              const changeShare =
                ((contributor.linesAdded || 0) + (contributor.linesRemoved || 0)) /
                maxChanges;
              return (
                <tr
                  key={contributor.email || contributor.name || index}
                  className="border-b border-gray-100 last:border-none hover:bg-gray-50/80 transition-colors"
                >
                  {/* Contributor */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                          RANK_STYLES[index] || "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold ${colors.bg} ${colors.text}`}
                      >
                        {contributor.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {contributor.name || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-500">
                          @{contributor.username || "unknown"}
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* Commits */}
                  <td className="px-4 py-4 text-right">
                    <div className="font-semibold text-gray-900 tabular-nums">
                      {formatNumber(contributor.commits)}
                    </div>
                    <div className="text-xs text-gray-500 tabular-nums">
                      {contributor.commitPercentage || 0}%
                    </div>
                  </td>
                  {/* Lines Added */}
                  <td className="px-4 py-4 text-right font-semibold text-emerald-600 tabular-nums">
                    +{formatNumber(contributor.linesAdded)}
                  </td>
                  {/* Lines Removed */}
                  <td className="px-4 py-4 text-right font-semibold text-rose-500 tabular-nums">
                    −{formatNumber(contributor.linesRemoved)}
                  </td>
                  {/* Files Changed */}
                  <td className="px-4 py-4 text-right font-semibold text-gray-700 tabular-nums">
                    {formatNumber(contributor.filesChanged)}
                  </td>
                  {/* Last Contribution + mini activity bar */}
                  <td className="px-6 py-4 text-right">
                    <div className="text-gray-700">{contributor.lastContribution || "N/A"}</div>
                    <div className="mt-1.5 h-1 w-20 ml-auto rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gray-400"
                        style={{ width: `${Math.max(6, changeShare * 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {sorted.map((contributor, index) => {
          const colors = avatarColor(contributor.email || contributor.name);
          return (
            <div key={contributor.email || contributor.name || index} className="px-4 py-4">
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                    RANK_STYLES[index] || "bg-gray-100 text-gray-400"
                  }`}
                >
                  {index + 1}
                </span>
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold shrink-0 ${colors.bg} ${colors.text}`}
                >
                  {contributor.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {contributor.name || "Unknown"}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    @{contributor.username || "unknown"}
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-y-2 text-xs">
                <div>
                  <span className="text-gray-500">Commits </span>
                  <span className="font-semibold text-gray-900 tabular-nums">
                    {formatNumber(contributor.commits)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500">Files </span>
                  <span className="font-semibold text-gray-700 tabular-nums">
                    {formatNumber(contributor.filesChanged)}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-emerald-600 tabular-nums">
                    +{formatNumber(contributor.linesAdded)}
                  </span>{" "}
                  <span className="font-semibold text-rose-500 tabular-nums">
                    −{formatNumber(contributor.linesRemoved)}
                  </span>
                </div>
                <div className="text-right text-gray-500">
                  {contributor.lastContribution || "N/A"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopContributors;