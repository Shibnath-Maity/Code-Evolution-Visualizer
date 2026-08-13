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
  Sparkles,
  Zap,
  Code2,
} from "lucide-react";

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5 uppercase tracking-wider font-mono">
        <Icon size={13} className="text-indigo-400" />
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse bg-slate-800/80 rounded-xl ${className}`} />;
}

function CommitDetailsLoading() {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="space-y-2">
        <SkeletonBlock className="h-6 w-48" />
        <SkeletonBlock className="h-4 w-64" />
      </div>
      <div className="space-y-4 pt-2">
        <SkeletonBlock className="h-12 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-10 w-full" />
        </div>
        <SkeletonBlock className="h-32 w-full" />
        <SkeletonBlock className="h-48 w-full" />
      </div>
    </div>
  );
}

function CommitDetailsEmpty() {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-10 text-center">
      <div className="inline-flex p-3 rounded-2xl bg-slate-800/60 text-slate-400 mb-3 border border-slate-700/50">
        <GitCommit size={28} />
      </div>
      <h2 className="text-lg font-bold text-white">No Commit Selected</h2>
      <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
        Select any commit card from the timeline to inspect its full code diff, changed files, and AI summary.
      </p>
    </div>
  );
}

function levelBadgeStyle(level) {
  switch (level?.toLowerCase()) {
    case "high":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    case "medium":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "low":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    default:
      return "bg-slate-800 text-slate-400 border-slate-700/60";
  }
}

function levelBadgeLabel(level) {
  if (!level) return "Unknown";
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

function LevelStat({ label, value }) {
  return (
    <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3">
      <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">{label}</p>
      <span
        className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${levelBadgeStyle(
          value
        )}`}
      >
        {levelBadgeLabel(value)}
      </span>
    </div>
  );
}

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
      current = { path: null, lines: [line] };
      blocks.push(current);
    }
  }

  return blocks;
}

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
      // Ignore copy error
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950 mb-4 last:mb-0 min-w-0 w-full shadow-inner">
      {/* File Header */}
      <div className="flex items-center justify-between bg-slate-900/90 px-4 py-2.5 border-b border-slate-800/80">
        <span className="flex items-center gap-2 text-slate-300 text-xs font-mono truncate">
          <Code2 size={14} className="text-indigo-400 shrink-0" />
          <span className="truncate">{path || "diff"}</span>
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-all shrink-0 cursor-pointer"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* Line-by-Line Code View */}
      <pre className="bg-slate-950 p-2 overflow-x-auto text-xs font-mono leading-6 m-0 min-w-0 custom-scrollbar">
        {annotated.map((row, i) => {
          let rowStyle = "text-slate-300";
          if (row.type === "add") rowStyle = "text-emerald-300 bg-emerald-500/10";
          else if (row.type === "remove") rowStyle = "text-rose-300 bg-rose-500/10";
          else if (row.type === "hunk") rowStyle = "text-indigo-400 bg-indigo-500/10 font-bold";
          else if (row.type === "meta") rowStyle = "text-slate-500 italic";

          return (
            <div key={i} className={`flex items-center rounded-sm ${rowStyle}`}>
              <span className="w-10 shrink-0 text-right pr-3 text-slate-600 select-none font-mono text-[11px]">
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

function CollapsibleSection({ title, icon: Icon, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-6 first:mt-0 min-w-0 border-t border-slate-800/60 pt-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left group cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-indigo-400" />}
          <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
            {title}
          </h3>
        </div>
        <div className="p-1 rounded-lg bg-slate-800/50 group-hover:bg-slate-800 text-slate-400 group-hover:text-white transition-all">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>
      {open && <div className="mt-4">{children}</div>}
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
  const [copiedHash, setCopiedHash] = useState(false);

  const diffBlocks = useMemo(() => splitDiffByFile(commitDiff), [commitDiff]);

  const handleCopyHash = async (hash) => {
    if (!hash) return;
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 1500);
    } catch {
      // Ignore copy error
    }
  };

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
    <div className="space-y-6 min-w-0 w-full font-sans">
      
      {/* Top Details Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl backdrop-blur-xl">
        
        {/* Hash Badge with Copy Action */}
        <DetailRow icon={GitCommit} label="Commit Hash">
          <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-2.5">
            <span className="font-mono text-xs text-indigo-300 break-all select-all">
              {selectedCommit.hash}
            </span>
            <button
              onClick={() => handleCopyHash(selectedCommit.hash)}
              className="ml-3 flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-lg transition-all shrink-0 cursor-pointer"
            >
              {copiedHash ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copiedHash ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </DetailRow>

        {/* Author + Date Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailRow icon={User} label="Author">
            <p className="text-xs font-semibold text-slate-200 bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-2">
              {selectedCommit.author}
            </p>
          </DetailRow>
          <DetailRow icon={Calendar} label="Timestamp">
            <p className="text-xs font-mono text-slate-300 bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-2">
              {new Date(selectedCommit.date).toLocaleString()}
            </p>
          </DetailRow>
        </div>

        {/* Message */}
        <DetailRow icon={FileText} label="Message">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <p className="font-medium text-slate-100 text-sm leading-relaxed">
              {selectedCommit.message}
            </p>
          </div>
        </DetailRow>

        {/* Code Modification Stat Chips */}
        {(selectedCommit.additions !== undefined ||
          selectedCommit.deletions !== undefined) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
              <Plus size={13} />
              {selectedCommit.additions || 0} additions
            </span>
            <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-xl">
              <Minus size={13} />
              {selectedCommit.deletions || 0} deletions
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-300 bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-xl">
              <FileText size={13} className="text-slate-400" />
              {files.length} files changed
            </span>
          </div>
        )}
      </div>

      {/* AI Summary Section */}
      <div className="bg-gradient-to-b from-indigo-950/40 via-slate-900/80 to-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
              <Brain size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                AI Commit Summary
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">Automated intelligent code review</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
            <Sparkles size={11} /> Powered by Groq
          </span>
        </div>

        {loadingSummary ? (
          <div className="space-y-3 pt-2">
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
            <SkeletonBlock className="h-20 w-full" />
          </div>
        ) : aiSummary ? (
          <div className="space-y-4 pt-1">
            
            {/* Overview Summary */}
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5">
              {aiSummary.summary || "No summary generated for this commit."}
            </p>

            {/* Purpose */}
            <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Purpose</p>
              <p className="text-xs font-medium text-slate-200">
                {aiSummary.purpose || "Not specified"}
              </p>
            </div>

            {/* Level Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <LevelStat label="Impact" value={aiSummary.impact} />
              <LevelStat label="Risk" value={aiSummary.risk} />
              <LevelStat label="Complexity" value={aiSummary.complexity} />
              <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3">
                <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Review Time</p>
                <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                  {aiSummary.reviewTime || "Unknown"}
                </span>
              </div>
            </div>

            {/* Breaking Changes & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3">
                <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Breaking Change</p>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${
                    aiSummary.breakingChange
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  }`}
                >
                  {aiSummary.breakingChange ? "Yes (Action Required)" : "No"}
                </span>
              </div>

              {aiSummary.tags?.length > 0 && (
                <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {aiSummary.tags.map((tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                        className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-md text-[11px] font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 text-slate-400 text-xs text-center font-mono">
            AI summary is not available for this commit.
          </div>
        )}
      </div>

      {/* Changed Files List Section */}
      <CollapsibleSection
        title={`Files Changed (${files.length})`}
        icon={FileText}
        defaultOpen={false}
      >
        <div className="space-y-2">
          {visibleFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-300 hover:border-slate-700 transition-colors"
            >
              <FileText size={14} className="text-indigo-400 shrink-0" />
              <span className="truncate">{file}</span>
            </div>
          ))}
        </div>

        {hasMoreFiles && (
          <button
            onClick={() => setFilesExpanded((v) => !v)}
            className="mt-3 flex items-center gap-1.5 text-xs font-mono font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
          >
            {filesExpanded ? (
              <>
                Show less <ChevronUp size={14} />
              </>
            ) : (
              <>
                Show {files.length - 5} more files <ChevronDown size={14} />
              </>
            )}
          </button>
        )}
      </CollapsibleSection>

      {/* Code Diff Viewer Section */}
      <CollapsibleSection title="Unified Code Diff" icon={Zap} defaultOpen>
        {loadingDiff ? (
          <div className="space-y-3">
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
            <SkeletonBlock className="h-32 w-full" />
          </div>
        ) : diffBlocks.length > 0 ? (
          diffBlocks.map((block, i) => (
            <DiffFileBlock key={block.path || i} path={block.path} lines={block.lines} />
          ))
        ) : (
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-6 text-center text-slate-500 font-mono text-xs">
            No code diff changes found for this commit.
          </div>
        )}
      </CollapsibleSection>

    </div>
  );
}

export default CommitDetails;