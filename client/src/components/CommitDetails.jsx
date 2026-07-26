import { useState } from "react";
import {
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

function DiffLine({ line }) {
  let style = "text-gray-300";
  if (line.startsWith("+") && !line.startsWith("+++")) style = "text-green-400 bg-green-500/10";
  else if (line.startsWith("-") && !line.startsWith("---")) style = "text-red-400 bg-red-500/10";
  else if (line.startsWith("@@")) style = "text-purple-400";
  else if (line.startsWith("diff ") || line.startsWith("index ")) style = "text-gray-500";

  return (
    <div className={`px-2 -mx-2 ${style}`}>
      {line.length > 0 ? line : "\u00A0"}
    </div>
  );
}

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
    <div className="mt-8 bg-white rounded-2xl shadow-sm p-8">
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-48" />
          <SkeletonBlock className="h-4 w-64" />
        </div>
      </div>
      <div className="space-y-5">
        <SkeletonBlock className="h-12 w-full" />
        <SkeletonBlock className="h-5 w-40" />
        <SkeletonBlock className="h-5 w-32" />
        <SkeletonBlock className="h-16 w-full" />
      </div>
    </div>
  );
}

function CommitDetails({
  selectedCommit,
  loadingDetails,
  loadingDiff,
  commitDiff,
  onClose,
}) {
  const [copied, setCopied] = useState(false);
  const [filesExpanded, setFilesExpanded] = useState(false);

  if (loadingDetails) {
    return <CommitDetailsLoading />;
  }

  if (!selectedCommit) {
    return null;
  }

  const files = selectedCommit.files || [];
  const visibleFiles = filesExpanded ? files : files.slice(0, 5);
  const hasMoreFiles = files.length > 5;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(commitDiff);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard write failed silently — button just won't flip to "copied"
    }
  };

  const diffLines = (commitDiff || "").split("\n");

  return (
    <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Commit Details</h2>
          <p className="text-gray-500 mt-1">
            Detailed information about this commit
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close commit details"
          className="text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg p-1.5 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Hash */}
      <DetailRow icon={GitCommit} label="Commit hash">
        <p className="font-mono text-sm bg-gray-100 rounded-lg p-3 break-all">
          {selectedCommit.hash}
        </p>
      </DetailRow>

      {/* Author + Date side by side */}
      <div className="grid sm:grid-cols-2 gap-x-6">
        <DetailRow icon={User} label="Author">
          <p>{selectedCommit.author}</p>
        </DetailRow>
        <DetailRow icon={Calendar} label="Date">
          <p>{selectedCommit.date}</p>
        </DetailRow>
      </div>

      {/* Message */}
      <DetailRow icon={FileText} label="Message">
        <p className="font-medium text-slate-800">{selectedCommit.message}</p>
      </DetailRow>

      {/* Stat badges, if available */}
      {(selectedCommit.additions !== undefined ||
        selectedCommit.deletions !== undefined) && (
        <div className="flex items-center gap-3 mb-5">
          <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-sm font-semibold">
            <Plus size={13} />
            {selectedCommit.additions || 0}
          </span>
          <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-sm font-semibold">
            <Minus size={13} />
            {selectedCommit.deletions || 0}
          </span>
        </div>
      )}

      {/* Files changed */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-gray-500 mb-2">
          Files changed {files.length > 0 && `(${files.length})`}
        </p>
        <div className="space-y-2">
          {visibleFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 font-mono text-sm text-slate-700"
            >
              <FileText size={14} className="text-gray-400 shrink-0" />
              <span className="truncate">{file}</span>
            </div>
          ))}
        </div>
        {hasMoreFiles && (
          <button
            onClick={() => setFilesExpanded((v) => !v)}
            className="mt-2 flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {filesExpanded ? (
              <>
                Show less <ChevronUp size={14} />
              </>
            ) : (
              <>
                Show {files.length - 5} more <ChevronDown size={14} />
              </>
            )}
          </button>
        )}
      </div>

      {/* Summary */}
      {selectedCommit.summary && (
        <DetailRow icon={FileText} label="Changes">
          <p>{selectedCommit.summary}</p>
        </DetailRow>
      )}

      {/* Diff */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-bold text-slate-900">Commit diff</h3>
          <button
            onClick={handleCopy}
            disabled={!commitDiff || loadingDiff}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy diff"}
          </button>
        </div>

        {loadingDiff ? (
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
            <SkeletonBlock className="h-4 w-2/3" />
            <SkeletonBlock className="h-4 w-3/4" />
          </div>
        ) : commitDiff ? (
          <pre className="bg-gray-950 rounded-xl p-5 overflow-x-auto text-sm font-mono leading-6">
            {diffLines.map((line, i) => (
              <DiffLine key={i} line={line} />
            ))}
          </pre>
        ) : (
          <p className="text-gray-400 text-sm py-4">No diff available for this commit.</p>
        )}
      </div>
    </div>
  );
}

export default CommitDetails;