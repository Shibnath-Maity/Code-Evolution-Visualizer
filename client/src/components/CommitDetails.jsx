import { useMemo, useState } from "react";
import {
  Brain,
  X,
  GitCommit,
  User,
  Calendar,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
} from "lucide-react";

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="mb-5">
      <p className="text-sm font-semibold text-gray-500 flex items-center gap-1.5">
        <Icon size={14} className="text-gray-400" />
        {label}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />;
}

function CommitDetailsLoading() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="space-y-2 mb-6">
        <SkeletonBlock className="h-6 w-40" />
        <SkeletonBlock className="h-4 w-56" />
      </div>
      <div className="space-y-4">
        <SkeletonBlock className="h-10 w-full" />
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-4 w-40" />
        <SkeletonBlock className="h-24 w-full" />
      </div>
    </div>
  );
}

function CommitDetailsEmpty() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-slate-900">Commit Details</h2>
      <p className="text-gray-500 mt-1 text-sm">
        Detailed information about this commit
      </p>
      <div className="mt-10 mb-6 flex flex-col items-center justify-center text-center text-gray-400">
        <GitCommit size={28} className="mb-3" />
        <p className="text-sm">Select a commit from the list to view details.</p>
      </div>
    </div>
  );
}

// Case-insensitive on purpose: the backend normalizes to "High"/"Medium"/"Low",
// but this shouldn't silently fall back to the gray "unknown" style just
// because casing drifts somewhere upstream.
function levelBadgeStyle(level) {
  switch (level?.toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-700";
    case "medium":
      return "bg-yellow-100 text-yellow-700";
    case "low":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-500";
  }
}

function levelBadgeLabel(level) {
  if (!level) return "Unknown";
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

function LevelStat({ label, value }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-1.5">{label}</p>
      <span
        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${levelBadgeStyle(
          value
        )}`}
      >
        {levelBadgeLabel(value)}
      </span>
    </div>
  );
}

// Splits a full multi-file unified diff into per-file blocks so each file
// can be shown with its own path header and copy button, matching how git
// actually structures a multi-file diff (each file starts with "diff --git").
function splitDiffByFile(diffText) {
  if (!diffText) return [];

  const lines = diffText.split("\n");
  const blocks = [];
  let current = null;

  for (const line of lines) {
    const match = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
    if (match) {
      current = { path: match[2] || match[1], lines: [line] };
      blocks.push(current);
    } else if (current) {
      current.lines.push(line);
    } else {
      // Diff text with no "diff --git" header at all (e.g. a single-file
      // diff straight from `git show`) — collect into one unnamed block.
      current = { path: null, lines: [line] };
      blocks.push(current);
    }
  }

  return blocks;
}

// Attaches a single running line-number to each row (new-file line number
// for context/added lines, old-file line number for removed lines), reset
// whenever a new "@@ ... @@" hunk header is encountered.
function annotateDiffLines(lines) {
  let oldLine = null;
  let newLine = null;

  return lines.map((line) => {
    if (line.startsWith("@@")) {
      const hunk = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      oldLine = hunk ? parseInt(hunk[1], 10) : null;
      newLine = hunk ? parseInt(hunk[2], 10) : null;
      return { text: line, gutter: "", type: "hunk" };
    }

    if (
      line.startsWith("diff ") ||
      line.startsWith("index ") ||
      line.startsWith("---") ||
      line.startsWith("+++")
    ) {
      return { text: line, gutter: "", type: "meta" };
    }

    if (line.startsWith("+")) {
      const gutter = newLine !== null ? newLine++ : "";
      return { text: line, gutter, type: "add" };
    }

    if (line.startsWith("-")) {
      const gutter = oldLine !== null ? oldLine++ : "";
      return { text: line, gutter, type: "remove" };
    }

    const gutter = newLine !== null ? newLine : "";
    if (oldLine !== null) oldLine++;
    if (newLine !== null) newLine++;
    return { text: line, gutter, type: "context" };
  });
}

function DiffFileBlock({ path, lines }) {
  const [copied, setCopied] = useState(false);
  const annotated = useMemo(() => annotateDiffLines(lines), [lines]);
  const fullText = useMemo(() => lines.join("\n"), [lines]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard write failed silently — button just won't flip to "copied"
    }
  };

  return (
    <div className="rounded-xl overflow-hidden border border-gray-800 mb-4 last:mb-0 min-w-0 w-full">
      <div className="flex items-center justify-between bg-gray-900 px-4 py-2.5 border-b border-gray-800">
        <span className="flex items-center gap-2 text-gray-300 text-sm font-mono truncate">
          <FileText size={14} className="text-gray-500 shrink-0" />
          <span className="truncate">{path || "diff"}</span>
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors shrink-0"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="bg-gray-950 overflow-x-auto text-sm font-mono leading-6 m-0 min-w-0">
        {annotated.map((row, i) => {
          let rowStyle = "text-gray-300";
          if (row.type === "add") rowStyle = "text-green-400 bg-green-500/10";
          else if (row.type === "remove") rowStyle = "text-red-400 bg-red-500/10";
          else if (row.type === "hunk") rowStyle = "text-purple-400";
          else if (row.type === "meta") rowStyle = "text-gray-500";

          return (
            <div key={i} className={`flex ${rowStyle}`}>
              <span className="w-10 shrink-0 text-right pr-3 text-gray-600 select-none">
                {row.gutter}
              </span>
              <span className="px-2 flex-1 whitespace-pre">
                {row.text.length > 0 ? row.text : "\u00A0"}
              </span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}

function CollapsibleSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-6 first:mt-0 min-w-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left mb-3"
      >
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        {open ? (
          <ChevronUp size={18} className="text-gray-400" />
        ) : (
          <ChevronDown size={18} className="text-gray-400" />
        )}
      </button>
      {open && children}
    </div>
  );
}

function CommitDetails({
  selectedCommit,
  loadingDetails,
  loadingDiff,
  loadingSummary,
  aiSummary,
  commitDiff,
  onClose,
}) {
  const [filesExpanded, setFilesExpanded] = useState(false);

  const diffBlocks = useMemo(() => splitDiffByFile(commitDiff), [commitDiff]);

  if (loadingDetails) {
    return <CommitDetailsLoading />;
  }

  if (!selectedCommit) {
    return <CommitDetailsEmpty />;
  }

  const files = selectedCommit.files || [];
  const visibleFiles = filesExpanded ? files : files.slice(0, 5);
  const hasMoreFiles = files.length > 5;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-w-0 w-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-5 pb-5 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Commit Details</h2>
          <p className="text-gray-500 mt-0.5 text-sm">
            Detailed information about this commit
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close commit details"
            className="text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg p-1.5 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Hash */}
      <DetailRow icon={GitCommit} label="Commit hash">
        <p className="font-mono text-xs bg-gray-100 rounded-lg p-2.5 break-all">
          {selectedCommit.hash}
        </p>
      </DetailRow>

      {/* Author + Date side by side */}
      <div className="grid grid-cols-2 gap-x-4">
        <DetailRow icon={User} label="Author">
          <p className="text-sm">{selectedCommit.author}</p>
        </DetailRow>
        <DetailRow icon={Calendar} label="Date">
          <p className="text-sm">{selectedCommit.date}</p>
        </DetailRow>
      </div>

      {/* Message */}
      <DetailRow icon={FileText} label="Message">
        <p className="font-medium text-slate-800 text-sm">
          {selectedCommit.message}
        </p>
      </DetailRow>

      {/* Stat chips */}
      {(selectedCommit.additions !== undefined ||
        selectedCommit.deletions !== undefined) && (
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-semibold">
            <Plus size={12} />
            {selectedCommit.additions || 0} additions
          </span>
          <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-xs font-semibold">
            <Minus size={12} />
            {selectedCommit.deletions || 0} deletions
          </span>
          <span className="inline-flex items-center gap-1 text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full text-xs font-semibold">
            <FileText size={12} />
            {files.length} files changed
          </span>
        </div>
      )}

      {/* AI Summary */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="text-violet-600" size={20} />
            <h3 className="text-lg font-bold text-slate-900">AI Summary</h3>
          </div>
          <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">
            Powered by Groq
          </span>
        </div>

        {loadingSummary ? (
          <div className="space-y-3">
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
            <SkeletonBlock className="h-20 w-full" />
          </div>
        ) : aiSummary ? (
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
            <p className="text-gray-700 text-sm leading-6">
              {aiSummary.summary || "No summary generated for this commit."}
            </p>

            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-1">Purpose</p>
              <p className="text-sm font-medium">
                {aiSummary.purpose || "Not specified"}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              <LevelStat label="Impact" value={aiSummary.impact} />
              <LevelStat label="Risk" value={aiSummary.risk} />
              <LevelStat label="Complexity" value={aiSummary.complexity} />
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1.5">Review Time</p>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {aiSummary.reviewTime || "Unknown"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1.5">Breaking Change</p>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    aiSummary.breakingChange
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {aiSummary.breakingChange ? "Yes" : "No"}
                </span>
              </div>
              {aiSummary.tags?.length > 0 && (
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1.5">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {aiSummary.tags.map((tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                        className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-5 text-gray-500 text-sm">
            AI summary is not available.
          </div>
        )}
      </div>

      {/* Files changed */}
      <CollapsibleSection
        title={`Files Changed${files.length ? ` (${files.length})` : ""}`}
        defaultOpen={false}
      >
        <div className="space-y-2">
          {visibleFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 font-mono text-xs text-slate-700"
            >
              <FileText size={13} className="text-gray-400 shrink-0" />
              <span className="truncate">{file}</span>
            </div>
          ))}
        </div>
        {hasMoreFiles && (
          <button
            onClick={() => setFilesExpanded((v) => !v)}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            {filesExpanded ? (
              <>
                Show less <ChevronUp size={13} />
              </>
            ) : (
              <>
                Show {files.length - 5} more <ChevronDown size={13} />
              </>
            )}
          </button>
        )}
      </CollapsibleSection>

      {/* Diff viewer */}
      <CollapsibleSection title="Diff Viewer" defaultOpen>
        {loadingDiff ? (
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
            <SkeletonBlock className="h-4 w-2/3" />
          </div>
        ) : diffBlocks.length > 0 ? (
          diffBlocks.map((block, i) => (
            <DiffFileBlock key={block.path || i} path={block.path} lines={block.lines} />
          ))
        ) : (
          <p className="text-gray-400 text-sm py-4">
            No diff available for this commit.
          </p>
        )}
      </CollapsibleSection>
    </div>
  );
}

export default CommitDetails;
