import React, { useMemo, useState, useCallback } from "react";
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

    // Folders first
    if (aFolder !== bFolder) {
      return aFolder ? -1 : 1;
    }

    return (a.name || "").localeCompare(b.name || "");
  });
}

function countNodes(node) {
  if (!node) {
    return {
      folderCount: 0,
      fileCount: 0,
    };
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

// Extension -> { icon, color } so common file types get distinct,
// recognizable treatment instead of one flat blue icon for everything.
const FILE_TYPE_MAP = {
  json: { icon: FileJson, color: "text-amber-500" },
  md: { icon: FileText, color: "text-slate-400" },
  txt: { icon: FileText, color: "text-slate-400" },
  png: { icon: FileImage, color: "text-pink-500" },
  jpg: { icon: FileImage, color: "text-pink-500" },
  jpeg: { icon: FileImage, color: "text-pink-500" },
  svg: { icon: FileImage, color: "text-pink-500" },
  gif: { icon: FileImage, color: "text-pink-500" },
  yml: { icon: Settings2, color: "text-teal-500" },
  yaml: { icon: Settings2, color: "text-teal-500" },
  toml: { icon: Settings2, color: "text-teal-500" },
  env: { icon: Settings2, color: "text-teal-500" },
  js: { icon: Braces, color: "text-yellow-500" },
  jsx: { icon: Braces, color: "text-sky-500" },
  ts: { icon: Braces, color: "text-blue-500" },
  tsx: { icon: Braces, color: "text-blue-500" },
  css: { icon: Braces, color: "text-indigo-400" },
};

function getFileVisual(name = "") {
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  return FILE_TYPE_MAP[ext] || { icon: FileCode2, color: "text-slate-400" };
}

/* -------------------------------------------------------
   Tree Node
------------------------------------------------------- */

const TreeNode = React.memo(function TreeNode({
  node,
  level = 0,
  forceOpen,
}) {
  const isFolder = isFolderNode(node);
  const [openState, setOpenState] = useState(level === 0);
  const open = forceOpen !== undefined ? forceOpen : openState;

  const children = useMemo(() => {
    const folders = Array.isArray(node?.folders) ? node.folders : [];
    const files = Array.isArray(node?.files) ? node.files : [];
    return sortChildren([...folders, ...files]);
  }, [node?.folders, node?.files]);

  const toggle = () => {
    if (!isFolder) return;
    setOpenState((previous) => !previous);
  };

  const handleKeyDown = (event) => {
    if (!isFolder) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    }
  };

  const fileVisual = !isFolder ? getFileVisual(node?.name) : null;
  const FileIcon = fileVisual?.icon;

  return (
    <div className="relative">
      {/* Vertical guide line for nested levels */}
      {level > 0 && (
        <span
          className="absolute top-0 bottom-0 w-px bg-slate-100"
          style={{ left: `${(level - 1) * 20 + 21}px` }}
          aria-hidden="true"
        />
      )}

      {/* Node */}
      <div
        className="
          group relative flex items-center gap-2
          py-1.5 pr-3 rounded-lg
          hover:bg-slate-50
          cursor-pointer select-none
          transition-colors duration-150
          focus:outline-none
          focus-visible:ring-2
          focus-visible:ring-indigo-300
        "
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={toggle}
        onKeyDown={isFolder ? handleKeyDown : undefined}
        role={isFolder ? "button" : undefined}
        tabIndex={isFolder ? 0 : -1}
        aria-expanded={isFolder ? open : undefined}
      >
        {/* Arrow */}
        <span className="w-4 h-4 shrink-0 flex items-center justify-center">
          {isFolder && (
            <ChevronRight
              className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                open ? "rotate-90" : ""
              }`}
            />
          )}
        </span>

        {/* Icon */}
        {isFolder ? (
          open ? (
            <FolderOpen className="h-4 w-4 text-indigo-500 shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-indigo-400 shrink-0" />
          )
        ) : (
          <FileIcon className={`h-4 w-4 shrink-0 ${fileVisual.color}`} />
        )}

        {/* Name */}
        <span
          className={`text-sm truncate font-mono ${
            isFolder
              ? "text-slate-700 font-medium group-hover:text-slate-900"
              : "text-slate-600 group-hover:text-slate-800"
          }`}
          title={node?.name || "Unnamed"}
        >
          {node?.name || "Unnamed"}
        </span>

        {isFolder && children.length > 0 && (
          <span className="ml-auto text-[11px] text-slate-300 tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
            {children.length}
          </span>
        )}
      </div>

      {/* Children */}
      {isFolder && open && children.length > 0 && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.path || `${child.name}-${child.type}`}
              node={child}
              level={level + 1}
              forceOpen={forceOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
});

/* -------------------------------------------------------
   Repository Structure
------------------------------------------------------- */

export default function RepositoryStructure({ architecture }) {
  /*
    IMPORTANT:
    Hooks must always run before conditional returns.

    Board passes the FULL architecture object
    ({ tree, flow, framework, score, ... }), not just
    the tree, so we unwrap it here before reading
    folders/files off it.
  */
  const tree = architecture?.tree || architecture;

  const [expandSignal, setExpandSignal] = useState(undefined); // undefined | true | false

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

  /* ---------------------------------------------------
     No architecture available
  --------------------------------------------------- */

  if (!architecture) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50">
            <FolderTree className="h-5 w-5 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">
            Repository Structure
          </h2>
        </div>

        <p className="text-sm text-slate-500 mt-3">
          Architecture data is not available yet. Analyze the repository first.
        </p>
      </div>
    );
  }

  const hasContent = root.folders.length > 0 || root.files.length > 0;

  /* ---------------------------------------------------
     UI
  --------------------------------------------------- */

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-br from-indigo-50/70 via-white to-white border-b border-slate-100">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-indigo-100/80 shrink-0">
              <FolderTree className="h-5 w-5 text-indigo-600" />
            </div>

            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-slate-900">
                Repository Structure
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Visual structure of your repository
              </p>
            </div>
          </div>

          {/* Counters + actions */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100">
              <Folder className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-xs font-semibold text-indigo-700 tabular-nums">
                {totalFolders}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100">
              <FileCode2 className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-semibold text-blue-700 tabular-nums">
                {totalFiles}
              </span>
            </div>

            {hasContent && (
              <div className="flex items-center gap-1 ml-1 pl-2 border-l border-slate-200">
                <button
                  type="button"
                  onClick={expandAll}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  aria-label="Expand all"
                  title="Expand all"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  aria-label="Collapse all"
                  title="Collapse all"
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tree */}
      <div className="p-3 max-h-[600px] overflow-y-auto">
        {hasContent ? (
          <TreeNode
            key={expandSignal === undefined ? "default" : String(expandSignal)}
            node={root}
            forceOpen={expandSignal}
          />
        ) : (
          <div className="py-10 text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center">
              <Folder className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-sm text-slate-500">
              This repository appears to be empty.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}