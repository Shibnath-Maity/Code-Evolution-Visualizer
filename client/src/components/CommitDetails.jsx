import { useEffect, useMemo, useState } from "react";
import {
  Brain,
  GitCommit,
  User,
  Calendar,
  FileText,
  FileJson,
  FileCode,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Zap,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/* Small building blocks                                                  */
/* ---------------------------------------------------------------------- */

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
        <Icon size={12} className="text-slate-500" />
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse bg-slate-800/70 rounded ${className}`} />;
}

function CommitDetailsLoading() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-5">
      <div className="space-y-2">
        <SkeletonBlock className="h-5 w-48" />
        <SkeletonBlock className="h-3 w-64" />
      </div>
      <div className="space-y-3 pt-1">
        <SkeletonBlock className="h-9 w-full" />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonBlock className="h-9 w-full" />
          <SkeletonBlock className="h-9 w-full" />
        </div>
        <SkeletonBlock className="h-24 w-full" />
        <SkeletonBlock className="h-40 w-full" />
      </div>
    </div>
  );
}

function CommitDetailsEmpty() {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-10 text-center">
      <div className="inline-flex p-2.5 rounded-lg bg-slate-800/60 text-slate-500 mb-3 border border-slate-700/60">
        <GitCommit size={22} />
      </div>
      <h2 className="text-sm font-semibold text-slate-200">No commit selected</h2>
      <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
        Select a commit from the timeline to inspect its diff, changed files, and summary.
      </p>
    </div>
  );
}

function levelBadgeStyle(level) {
  switch (level?.toLowerCase()) {
    case "high":
      return "bg-rose-500/10 text-rose-400 border-rose-500/25";
    case "medium":
      return "bg-amber-500/10 text-amber-400 border-amber-500/25";
    case "low":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
    default:
      return "bg-slate-800 text-slate-400 border-slate-700";
  }
}

function levelBadgeLabel(level) {
  if (!level) return "Unknown";
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

function LevelStat({ label, value }) {
  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-md p-2.5">
      <p className="text-[10px] font-mono text-slate-500 mb-1.5">{label}</p>
      <span
        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${levelBadgeStyle(
          value
        )}`}
      >
        {levelBadgeLabel(value)}
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Diff parsing helpers                                                   */
/* ---------------------------------------------------------------------- */

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

// Counts real additions/deletions in a file's diff lines, ignoring
// metadata lines (diff --git, index, ---, +++) which also start with
// characters that could be mistaken for +/- markers.
function computeFileStats(lines) {
  let additions = 0;
  let deletions = 0;

  for (const line of lines) {
    if (
      line.startsWith("diff ") ||
      line.startsWith("index ") ||
      line.startsWith("---") ||
      line.startsWith("+++") ||
      line.startsWith("@@")
    ) {
      continue;
    }
    if (line.startsWith("+")) additions++;
    else if (line.startsWith("-")) deletions++;
  }

  return { additions, deletions };
}

function fileExtension(path) {
  if (!path) return "";
  const name = path.split("/").pop() || "";
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

const CODE_EXTENSIONS = new Set([
  "js", "jsx", "ts", "tsx", "mjs", "cjs", "py", "rb", "go", "rs", "java",
  "c", "cpp", "h", "hpp", "cs", "php", "swift", "kt", "css", "scss", "html",
]);

function FileTypeIcon({ path, size = 14, className = "" }) {
  const ext = fileExtension(path);
  if (ext === "json") return <FileJson size={size} className={className} />;
  if (CODE_EXTENSIONS.has(ext)) return <FileCode size={size} className={className} />;
  return <FileText size={size} className={className} />;
}

/* ---------------------------------------------------------------------- */
/* Diff viewer                                                            */
/* ---------------------------------------------------------------------- */

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
    <div className="border border-slate-800 rounded-md overflow-hidden bg-slate-950 min-w-0 w-full">
      {/* File header */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-slate-900 px-3 py-2 border-b border-slate-800">
        <span className="flex items-center gap-2 text-slate-300 text-xs font-mono truncate min-w-0" title={path || "diff"}>
          <FileTypeIcon path={path} className="text-slate-500 shrink-0" />
          <span className="truncate">{path || "diff"}</span>
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Diff copied" : "Copy diff to clipboard"}
          className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-mono text-slate-400 hover:text-slate-100 bg-slate-800/70 hover:bg-slate-800 border border-slate-700 rounded transition-colors shrink-0 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* Line-by-line code view */}
      <pre className="bg-slate-950 p-0 overflow-x-auto text-[12px] font-mono leading-5 m-0 min-w-0 max-h-[560px] overflow-y-auto custom-scrollbar">
        {annotated.map((row, i) => {
          let rowStyle = "text-slate-300";
          if (row.type === "add") rowStyle = "text-emerald-300 bg-emerald-500/10";
          else if (row.type === "remove") rowStyle = "text-rose-300 bg-rose-500/10";
          else if (row.type === "hunk") rowStyle = "text-indigo-400 bg-indigo-500/5";
          else if (row.type === "meta") rowStyle = "text-slate-600";

          return (
            <div key={i} className={`flex ${rowStyle}`}>
              <span className="w-9 shrink-0 text-right pr-2 text-slate-600 select-none text-[11px] leading-5">
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

/* ---------------------------------------------------------------------- */
/* Changed files navigation                                               */
/* ---------------------------------------------------------------------- */

function ChangedFilesList({ files, selectedIndex, onSelect, className = "" }) {
  return (
    <div className={className}>
      <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between shrink-0">
        <h3 className="text-xs font-semibold text-slate-300">Changed files</h3>
        <span className="text-[11px] font-mono text-slate-500">{files.length}</span>
      </div>
      <ul className="overflow-y-auto custom-scrollbar" role="listbox" aria-label="Changed files">
        {files.map((file, index) => {
          const isSelected = index === selectedIndex;
          return (
            <li key={file.path || index}>
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                title={file.path || "Unnamed file"}
                onClick={() => onSelect(index)}
                className={`w-full flex items-start gap-2 px-3 py-2 text-left border-l-2 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-indigo-500 ${
                  isSelected
                    ? "border-indigo-500 bg-slate-800/70 text-slate-100"
                    : "border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                }`}
              >
                <FileTypeIcon
                  path={file.path}
                  className={`mt-0.5 shrink-0 ${isSelected ? "text-indigo-400" : "text-slate-500"}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-mono truncate">
                    {file.path || "Unnamed file"}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-[11px] font-mono">
                    <span className="text-emerald-400">+{file.additions}</span>
                    <span className="text-rose-400">-{file.deletions}</span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MobileFileSelect({ files, selectedIndex, onSelect }) {
  const current = files[selectedIndex];
  return (
    <div className="md:hidden flex items-center justify-between gap-3 border border-slate-800 rounded-md bg-slate-900 px-2.5 py-2">
      <div className="relative flex-1 min-w-0">
        <select
          aria-label="Select changed file"
          value={selectedIndex}
          onChange={(e) => onSelect(Number(e.target.value))}
          className="w-full appearance-none bg-transparent text-xs font-mono text-slate-200 pr-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 cursor-pointer"
        >
          {files.map((file, index) => (
            <option key={file.path || index} value={index} className="bg-slate-900">
              {file.path || "Unnamed file"}
            </option>
          ))}
        </select>
        <ChevronDown size={13} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-500" />
      </div>
      {current && (
        <span className="flex items-center gap-2 text-[11px] font-mono shrink-0">
          <span className="text-emerald-400">+{current.additions}</span>
          <span className="text-rose-400">-{current.deletions}</span>
        </span>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Collapsible section                                                    */
/* ---------------------------------------------------------------------- */

function CollapsibleSection({ title, icon: Icon, defaultOpen = true, children, headerExtra }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between text-left px-3 py-2.5 bg-slate-900 hover:bg-slate-900/70 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-indigo-500"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} className="text-slate-500" />}
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        </div>
        <div className="flex items-center gap-3">
          {headerExtra}
          {open ? <ChevronUp size={15} className="text-slate-500" /> : <ChevronDown size={15} className="text-slate-500" />}
        </div>
      </button>
      {open && <div className="p-2.5 border-t border-slate-800">{children}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Main component                                                         */
/* ---------------------------------------------------------------------- */

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
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  // Parse the diff into per-file blocks and attach add/remove counts to
  // each one so the file navigator can show stats without touching the
  // parsing logic itself.
  const diffBlocks = useMemo(() => {
    return splitDiffByFile(commitDiff).map((block) => ({
      ...block,
      ...computeFileStats(block.lines),
    }));
  }, [commitDiff]);

  // Whenever the underlying diff changes (new commit selected), jump back
  // to the first file rather than keeping a stale index around.
  useEffect(() => {
    setSelectedFileIndex(0);
  }, [commitDiff]);

  const selectedBlock =
    diffBlocks.length > 0 ? diffBlocks[Math.min(selectedFileIndex, diffBlocks.length - 1)] : null;

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
    <div className="space-y-4 min-w-0 w-full font-sans">
      {/* Commit summary card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
        <DetailRow icon={GitCommit} label="Commit">
          <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-md px-2.5 py-2">
            <span className="font-mono text-xs text-slate-300 break-all select-all">
              {selectedCommit.hash}
            </span>
            <button
              type="button"
              onClick={() => handleCopyHash(selectedCommit.hash)}
              aria-label={copiedHash ? "Commit hash copied" : "Copy commit hash"}
              className="ml-3 flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors shrink-0 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500"
            >
              {copiedHash ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copiedHash ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </DetailRow>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DetailRow icon={User} label="Author">
            <p className="text-xs font-medium text-slate-200 bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 truncate">
              {selectedCommit.author}
            </p>
          </DetailRow>
          <DetailRow icon={Calendar} label="Timestamp">
            <p className="text-xs font-mono text-slate-300 bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5">
              {new Date(selectedCommit.date).toLocaleString()}
            </p>
          </DetailRow>
        </div>

        <DetailRow icon={FileText} label="Message">
          <div className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-2">
            <p className="font-medium text-slate-200 text-sm leading-relaxed">
              {selectedCommit.message}
            </p>
          </div>
        </DetailRow>

        {(selectedCommit.additions !== undefined || selectedCommit.deletions !== undefined) && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5 font-mono text-[11px]">
            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
              <Plus size={12} />
              {selectedCommit.additions || 0}
            </span>
            <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded">
              <Minus size={12} />
              {selectedCommit.deletions || 0}
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-400 bg-slate-800/60 border border-slate-700 px-2 py-1 rounded">
              <FileText size={12} />
              {files.length} files changed
            </span>
          </div>
        )}
      </div>

      {/* AI summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={15} className="text-indigo-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-200">AI commit summary</h3>
              <p className="text-[11px] text-slate-500">Automated code review</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-500 border border-slate-800 px-2 py-0.5 rounded">
            Groq
          </span>
        </div>

        {loadingSummary ? (
          <div className="space-y-2.5 pt-1">
            <SkeletonBlock className="h-3.5 w-full" />
            <SkeletonBlock className="h-3.5 w-5/6" />
            <SkeletonBlock className="h-16 w-full" />
          </div>
        ) : aiSummary ? (
          <div className="space-y-3">
            <p className="text-slate-300 text-xs leading-relaxed bg-slate-950 border border-slate-800 rounded-md p-3">
              {aiSummary.summary || "No summary generated for this commit."}
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-md p-2.5">
              <p className="text-[10px] font-mono text-slate-500 mb-1">Purpose</p>
              <p className="text-xs font-medium text-slate-300">
                {aiSummary.purpose || "Not specified"}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <LevelStat label="Impact" value={aiSummary.impact} />
              <LevelStat label="Risk" value={aiSummary.risk} />
              <LevelStat label="Complexity" value={aiSummary.complexity} />
              <div className="bg-slate-950/60 border border-slate-800 rounded-md p-2.5">
                <p className="text-[10px] font-mono text-slate-500 mb-1.5">Review time</p>
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
                  {aiSummary.reviewTime || "Unknown"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="bg-slate-950/60 border border-slate-800 rounded-md p-2.5">
                <p className="text-[10px] font-mono text-slate-500 mb-1.5">Breaking change</p>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${
                    aiSummary.breakingChange
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/25"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                  }`}
                >
                  {aiSummary.breakingChange ? "Yes — action required" : "No"}
                </span>
              </div>

              {aiSummary.tags?.length > 0 && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-md p-2.5">
                  <p className="text-[10px] font-mono text-slate-500 mb-1.5">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {aiSummary.tags.map((tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                        className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded text-[11px] font-mono"
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
          <div className="bg-slate-950 border border-slate-800 rounded-md p-3 text-slate-500 text-xs text-center">
            AI summary is not available for this commit.
          </div>
        )}
      </div>

      {/* Changed files list (simple names, from selectedCommit.files) */}
      <CollapsibleSection
        title={`Files changed (${files.length})`}
        icon={FileText}
        defaultOpen={false}
      >
        <div className="space-y-1">
          {visibleFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-[11px] text-slate-400"
            >
              <FileTypeIcon path={file} className="text-slate-500 shrink-0" />
              <span className="truncate" title={file}>{file}</span>
            </div>
          ))}
        </div>

        {hasMoreFiles && (
          <button
            type="button"
            onClick={() => setFilesExpanded((v) => !v)}
            className="mt-2 flex items-center gap-1.5 text-[11px] font-mono font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500 rounded"
          >
            {filesExpanded ? (
              <>Show less <ChevronUp size={13} /></>
            ) : (
              <>Show {files.length - 5} more <ChevronDown size={13} /></>
            )}
          </button>
        )}
      </CollapsibleSection>

      {/* Diff viewer with per-file navigation */}
      <div className="border border-slate-800 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2.5 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-200">Diff</h3>
          </div>
          {diffBlocks.length > 0 && (
            <span className="text-[11px] font-mono text-slate-500">
              {diffBlocks.length} {diffBlocks.length === 1 ? "file" : "files"}
            </span>
          )}
        </div>

        {loadingDiff ? (
          <div className="p-3 space-y-2.5">
            <SkeletonBlock className="h-3.5 w-full" />
            <SkeletonBlock className="h-3.5 w-5/6" />
            <SkeletonBlock className="h-28 w-full" />
          </div>
        ) : diffBlocks.length > 0 ? (
          <div className="md:flex md:items-stretch">
            <ChangedFilesList
              files={diffBlocks}
              selectedIndex={selectedFileIndex}
              onSelect={setSelectedFileIndex}
              className="hidden md:flex md:flex-col md:w-[280px] md:shrink-0 md:border-r md:border-slate-800 md:max-h-[600px]"
            />

            <div className="flex-1 min-w-0 p-2.5 space-y-2.5">
              <MobileFileSelect
                files={diffBlocks}
                selectedIndex={selectedFileIndex}
                onSelect={setSelectedFileIndex}
              />

              {selectedBlock && (
                <DiffFileBlock path={selectedBlock.path} lines={selectedBlock.lines} />
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 font-mono text-xs">
            No code diff changes found for this commit.
          </div>
        )}
      </div>
    </div>
  );
}

export default CommitDetails;