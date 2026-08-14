import React, { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  FolderOpen,
  FileCode2,
  FileJson,
  FileText,
  FileImage,
  Settings2,
  Braces,
  ChevronRight,
  FolderTree,
  Maximize2,
  Minimize2,
  Terminal,
} from "lucide-react";

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */

function isFolderNode(node) {
  if (!node) return false;
  return (
    node.type === "folder" ||
    Array.isArray(node.folders) ||
    Array.isArray(node.files)
  );
}

function sortChildren(children) {
  return [...children].sort((a, b) => {
    const aFolder = isFolderNode(a);
    const bFolder = isFolderNode(b);

    if (aFolder !== bFolder) {
      return aFolder ? -1 : 1;
    }

    return (a.name || "").localeCompare(b.name || "");
  });
}

function countNodes(node) {
  if (!node) {
    return { folderCount: 0, fileCount: 0 };
  }

  const folders = Array.isArray(node.folders) ? node.folders : [];
  const files = Array.isArray(node.files) ? node.files : [];

  let folderCount = folders.length;
  let fileCount = files.length;

  for (const folder of folders) {
    const nested = countNodes(folder);
    folderCount += nested.folderCount;
    fileCount += nested.fileCount;
  }

  return { folderCount, fileCount };
}

// Sleek high-contrast color scheme for dark UI
const FILE_TYPE_MAP = {
  json: { icon: FileJson, color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  md: { icon: FileText, color: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20" },
  txt: { icon: FileText, color: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20" },
  png: { icon: FileImage, color: "text-pink-400 bg-pink-400/10 border-pink-400/20" },
  jpg: { icon: FileImage, color: "text-pink-400 bg-pink-400/10 border-pink-400/20" },
  jpeg: { icon: FileImage, color: "text-pink-400 bg-pink-400/10 border-pink-400/20" },
  svg: { icon: FileImage, color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  gif: { icon: FileImage, color: "text-pink-400 bg-pink-400/10 border-pink-400/20" },
  yml: { icon: Settings2, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  yaml: { icon: Settings2, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  toml: { icon: Settings2, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  env: { icon: Settings2, color: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
  js: { icon: Braces, color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  jsx: { icon: Braces, color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
  ts: { icon: Braces, color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  tsx: { icon: Braces, color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20" },
  css: { icon: Braces, color: "text-sky-400 bg-sky-400/10 border-sky-400/20" },
};

function getFileVisual(name = "") {
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  return FILE_TYPE_MAP[ext] || { icon: FileCode2, color: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20" };
}

/* -------------------------------------------------------
   Tree Node (Animated & Interactive)
------------------------------------------------------- */

const TreeNode = React.memo(function TreeNode({
  node,
  level = 0,
  forceOpen,
  selectedPath,
  onSelectNode,
}) {
  const isFolder = isFolderNode(node);
  const [openState, setOpenState] = useState(level === 0);
  const open = forceOpen !== undefined ? forceOpen : openState;

  const nodePath = node?.path || `${node?.name}-${level}`;
  const isSelected = selectedPath === nodePath;

  const children = useMemo(() => {
    const folders = Array.isArray(node?.folders) ? node.folders : [];
    const files = Array.isArray(node?.files) ? node.files : [];
    return sortChildren([...folders, ...files]);
  }, [node?.folders, node?.files]);

  const toggle = (e) => {
    e.stopPropagation();
    onSelectNode?.(nodePath);
    if (isFolder) {
      setOpenState((prev) => !prev);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle(event);
    }
  };

  const fileVisual = !isFolder ? getFileVisual(node?.name) : null;
  const FileIcon = fileVisual?.icon;

  return (
    <div className="relative select-none font-mono">
      {/* Dynamic Vertical Level Guide Line */}
      {level > 0 && (
        <span
          className="absolute top-0 bottom-0 w-[1px] bg-gradient-to-b from-zinc-700/50 via-zinc-800/30 to-transparent transition-colors"
          style={{ left: `${(level - 1) * 20 + 22}px` }}
          aria-hidden="true"
        />
      )}

      {/* Row Item */}
      <motion.div
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`
          group relative flex items-center gap-2.5 my-0.5 py-1.5 pr-3 rounded-lg
          cursor-pointer transition-all duration-150 text-xs
          focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400
          ${
            isSelected
              ? "bg-indigo-500/15 text-indigo-200 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent"
          }
        `}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={isFolder ? open : undefined}
      >
        {/* Active Pill Indicator */}
        {isSelected && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-1 top-1.5 bottom-1.5 w-1 bg-indigo-500 rounded-full shadow-[0_0_8px_#6366f1]"
          />
        )}

        {/* Chevron */}
        <span className="w-4 h-4 shrink-0 flex items-center justify-center">
          {isFolder && (
            <motion.div
              animate={{ rotate: open ? 90 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <ChevronRight className={`h-3.5 w-3.5 ${isSelected ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"}`} />
            </motion.div>
          )}
        </span>

        {/* Dynamic Icon */}
        <div className="shrink-0 flex items-center justify-center">
          {isFolder ? (
            open ? (
              <FolderOpen className="h-4 w-4 text-indigo-400 drop-shadow-[0_0_6px_rgba(129,140,248,0.4)]" />
            ) : (
              <Folder className="h-4 w-4 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
            )
          ) : (
            <span className={`p-1 rounded border ${fileVisual.color}`}>
              <FileIcon className="h-3 w-3" />
            </span>
          )}
        </div>

        {/* File / Folder Name */}
        <span className={`truncate tracking-tight ${isFolder ? "font-semibold" : "font-normal"}`}>
          {node?.name || "Unnamed"}
        </span>

        {/* Badge Item Count for Folders */}
        {isFolder && children.length > 0 && (
          <span className="ml-auto text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-zinc-800/80 text-zinc-500 border border-zinc-700/50 group-hover:text-zinc-300 transition-colors">
            {children.length}
          </span>
        )}
      </motion.div>

      {/* Accordion Collapse / Expand */}
      <AnimatePresence initial={false}>
        {isFolder && open && children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            {children.map((child) => (
              <TreeNode
                key={child.path || `${child.name}-${child.type}`}
                node={child}
                level={level + 1}
                forceOpen={forceOpen}
                selectedPath={selectedPath}
                onSelectNode={onSelectNode}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

/* -------------------------------------------------------
   Main Container Component
------------------------------------------------------- */

export default function RepositoryStructure({ architecture }) {
  const tree = architecture?.tree || architecture;
  const [expandSignal, setExpandSignal] = useState(undefined);
  const [selectedPath, setSelectedPath] = useState(null);

  const root = useMemo(
    () => ({
      name: tree?.name || "Repository",
      path: tree?.path || "",
      type: "folder",
      folders: Array.isArray(tree?.folders) ? tree.folders : [],
      files: Array.isArray(tree?.files) ? tree.files : [],
    }),
    [tree]
  );

  const { folderCount: totalFolders, fileCount: totalFiles } = useMemo(
    () => countNodes(root),
    [root]
  );

  const expandAll = useCallback(() => setExpandSignal(true), []);
  const collapseAll = useCallback(() => setExpandSignal(false), []);

  /* --- Empty State --- */
  if (!architecture) {
    return (
      <div className="bg-zinc-950/80 backdrop-blur-xl rounded-2xl border border-zinc-800/80 p-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <FolderTree className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 tracking-tight font-mono">
              Repository Structure
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              No architectural metadata available. Please run analysis.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hasContent = root.folders.length > 0 || root.files.length > 0;

  return (
    <div className="bg-zinc-950/90 backdrop-blur-2xl rounded-2xl border border-zinc-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* Top Header Bar */}
      <div className="p-4 bg-zinc-900/60 border-b border-zinc-800/80">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          
          {/* Title with Terminal Accent */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
              <Terminal className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-100 font-mono tracking-tight">
                  {root.name}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 font-sans">
                Explorer & File Architecture
              </p>
            </div>
          </div>

          {/* Stats Badges & Controls */}
          <div className="flex items-center gap-2 shrink-0 font-mono">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-zinc-300">
              <Folder className="h-3.5 w-3.5 text-indigo-400" />
              <span className="tabular-nums">{totalFolders}</span>
            </span>

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-zinc-300">
              <FileCode2 className="h-3.5 w-3.5 text-cyan-400" />
              <span className="tabular-nums">{totalFiles}</span>
            </span>

            {hasContent && (
              <div className="flex items-center gap-1 ml-1 pl-2 border-l border-zinc-800">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={expandAll}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                  title="Expand All"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={collapseAll}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                  title="Collapse All"
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Tree View Area */}
      <div className="p-3 max-h-[550px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {hasContent ? (
          <TreeNode
            key={expandSignal === undefined ? "default" : String(expandSignal)}
            node={root}
            forceOpen={expandSignal}
            selectedPath={selectedPath}
            onSelectNode={setSelectedPath}
          />
        ) : (
          <div className="py-12 text-center font-mono">
            <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
              <Folder className="h-5 w-5" />
            </div>
            <p className="text-xs text-zinc-500">Repository empty or clean.</p>
          </div>
        )}
      </div>
    </div>
  );
}