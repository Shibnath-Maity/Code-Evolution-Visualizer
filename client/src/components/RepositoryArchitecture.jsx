import React, { useMemo, useState } from "react";
import {
  Folder,
  FolderOpen,
  FileCode2,
  ChevronRight,
  ChevronDown,
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

  const folders = Array.isArray(node.folders)
    ? node.folders
    : [];

  const files = Array.isArray(node.files)
    ? node.files
    : [];

  let folderCount = folders.length;
  let fileCount = files.length;

  for (const folder of folders) {
    const nested = countNodes(folder);

    folderCount += nested.folderCount;
    fileCount += nested.fileCount;
  }

  return {
    folderCount,
    fileCount,
  };
}

/* -------------------------------------------------------
   Tree Node
------------------------------------------------------- */

const TreeNode = React.memo(function TreeNode({
  node,
  level = 0,
}) {
  const isFolder = isFolderNode(node);

  const [open, setOpen] = useState(level === 0);

  const children = useMemo(() => {
    const folders = Array.isArray(node?.folders)
      ? node.folders
      : [];

    const files = Array.isArray(node?.files)
      ? node.files
      : [];

    return sortChildren([
      ...folders,
      ...files,
    ]);
  }, [node?.folders, node?.files]);

  const toggle = () => {
    if (!isFolder) return;

    setOpen((previous) => !previous);
  };

  const handleKeyDown = (event) => {
    if (!isFolder) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    }
  };

  return (
    <div>
      {/* Node */}
      <div
        className="
          flex items-center gap-2
          py-2 px-3
          rounded-lg
          hover:bg-slate-50
          cursor-pointer
          focus:outline-none
          focus:ring-2
          focus:ring-indigo-200
        "
        style={{
          paddingLeft: `${level * 24 + 12}px`,
        }}
        onClick={toggle}
        onKeyDown={
          isFolder ? handleKeyDown : undefined
        }
        role={isFolder ? "button" : undefined}
        tabIndex={isFolder ? 0 : -1}
        aria-expanded={
          isFolder ? open : undefined
        }
      >
        {/* Arrow + Icon */}
        {isFolder ? (
          <>
            {open ? (
              <ChevronDown
                className="h-4 w-4 text-slate-400 shrink-0"
              />
            ) : (
              <ChevronRight
                className="h-4 w-4 text-slate-400 shrink-0"
              />
            )}

            {open ? (
              <FolderOpen
                className="h-4 w-4 text-amber-500 shrink-0"
              />
            ) : (
              <Folder
                className="h-4 w-4 text-amber-500 shrink-0"
              />
            )}
          </>
        ) : (
          <>
            <span className="w-4 shrink-0" />

            <FileCode2
              className="h-4 w-4 text-blue-500 shrink-0"
            />
          </>
        )}

        {/* Name */}
        <span
          className="text-sm text-slate-700 truncate"
          title={node?.name || "Unnamed"}
        >
          {node?.name || "Unnamed"}
        </span>
      </div>

      {/* Children */}
      {isFolder && open && children.length > 0 && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={
                child.path ||
                `${child.name}-${child.type}`
              }
              node={child}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
});

/* -------------------------------------------------------
   Repository Architecture
------------------------------------------------------- */

export default function RepositoryArchitecture({
  architecture,
}) {
  /*
    IMPORTANT:
    Hooks must always run before conditional returns.
  */

  const root = useMemo(
    () => ({
      name: architecture?.name || "Repository",
      path: architecture?.path || "",
      type: "folder",
      folders: Array.isArray(architecture?.folders)
        ? architecture.folders
        : [],
      files: Array.isArray(architecture?.files)
        ? architecture.files
        : [],
    }),
    [architecture]
  );

  const {
    folderCount: totalFolders,
    fileCount: totalFiles,
  } = useMemo(
    () => countNodes(root),
    [root]
  );

  /* ---------------------------------------------------
     No architecture available
  --------------------------------------------------- */

  if (!architecture) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-indigo-600" />

          <h2 className="text-xl font-semibold text-slate-900">
            Repository Architecture
          </h2>
        </div>

        <p className="text-sm text-slate-500 mt-2">
          Architecture data is not available yet.
          Analyze the repository first.
        </p>
      </div>
    );
  }

  /* ---------------------------------------------------
     Empty architecture
  --------------------------------------------------- */

  const hasContent =
    root.folders.length > 0 ||
    root.files.length > 0;

  /* ---------------------------------------------------
     UI
  --------------------------------------------------- */

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center justify-between gap-4">

          {/* Title */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FolderOpen
                className="h-5 w-5 text-indigo-600 shrink-0"
              />

              <h2 className="text-xl font-semibold text-slate-900">
                Repository Architecture
              </h2>
            </div>

            <p className="text-sm text-slate-500 mt-1">
              Visual structure of your repository
            </p>
          </div>

          {/* Counters */}
          <div className="flex gap-3 shrink-0">

            {/* Folders */}
            <div className="px-3 py-2 rounded-lg bg-indigo-50">
              <span className="text-xs text-indigo-500">
                Folders
              </span>

              <p className="text-sm font-semibold text-indigo-700">
                {totalFolders}
              </p>
            </div>

            {/* Files */}
            <div className="px-3 py-2 rounded-lg bg-blue-50">
              <span className="text-xs text-blue-500">
                Files
              </span>

              <p className="text-sm font-semibold text-blue-700">
                {totalFiles}
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Tree */}
      <div className="p-4 max-h-[600px] overflow-y-auto">

        {hasContent ? (
          <TreeNode node={root} />
        ) : (
          <div className="py-8 text-center">
            <Folder
              className="h-10 w-10 text-slate-300 mx-auto"
            />

            <p className="text-sm text-slate-500 mt-3">
              This repository appears to be empty.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}