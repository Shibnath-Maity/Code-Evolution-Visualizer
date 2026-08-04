import { Cpu, Code2, Files, ArrowRight } from "lucide-react";

const BAR_COLORS = ["bg-indigo-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];

function EmptyState({ label }) {
  return <p className="text-[11px] text-gray-400 py-4">{label}</p>;
}

// These three cards need per-file or per-language data that raw commit
// objects (hash, author, date, message, additions, deletions) don't carry.
// Pass `focus`, `languages`, or `files` in from your backend once it
// exposes that breakdown; until then they render a clean empty state
// instead of fabricated numbers.

export function TechnicalFocusCard({ focus = [] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Cpu size={15} className="text-indigo-600" />
        <h3 className="text-sm font-bold text-slate-900">Technical Focus</h3>
      </div>
      {focus.length === 0 ? (
        <EmptyState label="Connect file-level commit data to show focus areas." />
      ) : (
        <div className="space-y-2.5">
          {focus.map((f, i) => (
            <div key={f.label} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-24 truncate">{f.label}</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                  style={{ width: `${f.pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-9 text-right">{f.pct}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TopLanguagesCard({ languages = [] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Code2 size={15} className="text-indigo-600" />
        <h3 className="text-sm font-bold text-slate-900">Top Languages</h3>
      </div>
      {languages.length === 0 ? (
        <EmptyState label="Connect language stats to populate this card." />
      ) : (
        <div className="space-y-2.5">
          {languages.map((l, i) => (
            <div key={l.name} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-700 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${BAR_COLORS[i % BAR_COLORS.length]}`} />
                <span className="truncate">{l.name}</span>
              </span>
              <span className="text-gray-400 shrink-0">{l.pct}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MostModifiedFilesCard({ files = [], onViewAll }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Files size={15} className="text-indigo-600" />
        <h3 className="text-sm font-bold text-slate-900">Most Modified Files</h3>
      </div>
      {files.length === 0 ? (
        <EmptyState label="Connect per-file diff stats to populate this card." />
      ) : (
        <div className="space-y-2.5">
          {files.map((f, i) => (
            <div key={f.path} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-mono truncate flex-1 min-w-0">{f.path}</span>
              <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0">
                <div
                  className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                  style={{ width: `${f.pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-9 text-right shrink-0">{f.pct}%</span>
            </div>
          ))}
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="flex items-center gap-1 text-xs text-indigo-600 font-medium pt-1"
            >
              View all files <ArrowRight size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
