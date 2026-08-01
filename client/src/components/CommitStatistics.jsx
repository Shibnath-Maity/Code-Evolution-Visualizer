import React from "react";
import {
  GitCommit,
  Users,
  FileText,
  Plus,
  Minus,
  Folder,
  Calendar,
} from "lucide-react";

function StatisticRow({ icon: Icon, label, value, color = "" }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2 text-gray-600">
        <Icon size={16} />
        <span className="text-sm">{label}</span>
      </div>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
}

// Reads the first present field from a list of candidate names. Two
// different backend response shapes have been seen for this data
// (`filesChanged` vs. `totalFilesChanged`, etc.) and it hasn't been
// confirmed which one is actually live, so this accepts either rather
// than hardcoding one and silently rendering "0" if the other is real.
function pick(source, ...keys) {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key];
  }
  return undefined;
}

function CommitStatistics({ stats }) {
  if (!stats) return null;

  const totalCommits = toNumber(stats.totalCommits);
  const authors = toNumber(stats.authors);
  const filesChanged = toNumber(pick(stats, "filesChanged", "totalFilesChanged"));
  const additions = toNumber(pick(stats, "additions", "totalAdditions"));
  const deletions = toNumber(pick(stats, "deletions", "totalDeletions"));
  const avgFilesPerCommit = toNumber(
    pick(stats, "avgFilesPerCommit", "averageFilesChanged")
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-5">
        Commit Statistics
      </h2>

      <div className="space-y-1">
        <StatisticRow
          icon={GitCommit}
          label="Total Commits"
          value={totalCommits.toLocaleString()}
        />
        <StatisticRow
          icon={Users}
          label="Authors"
          value={authors.toLocaleString()}
        />
        <StatisticRow
          icon={FileText}
          label="Files Changed"
          value={filesChanged.toLocaleString()}
        />
        <StatisticRow
          icon={Plus}
          label="Additions"
          value={`+${additions.toLocaleString()}`}
          color="text-green-600"
        />
        <StatisticRow
          icon={Minus}
          label="Deletions"
          value={`-${deletions.toLocaleString()}`}
          color="text-red-600"
        />
        <StatisticRow
          icon={Folder}
          label="Avg. Files / Commit"
          value={avgFilesPerCommit.toFixed(2)}
        />
        <StatisticRow
          icon={Calendar}
          label="First Commit"
          value={formatDate(stats.firstCommit)}
        />
        <StatisticRow
          icon={Calendar}
          label="Latest Commit"
          value={formatDate(stats.latestCommit)}
        />
      </div>
    </div>
  );
}

export default CommitStatistics;
