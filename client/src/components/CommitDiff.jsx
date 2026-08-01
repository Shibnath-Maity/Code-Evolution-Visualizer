import { useEffect, useState } from "react";
import axios from "axios";
import { FileCode, Copy, Check, ChevronDown, ChevronUp, Loader2, AlertCircle } from "lucide-react";

/**
 * Parses a unified diff string into per-file blocks with typed lines
 * so each line can be styled (added / removed / context / hunk header).
 */
function parseDiff(raw) {
  if (!raw) return [];

  const lines = raw.split("\n");
  const files = [];
  let current = null;

  lines.forEach((line) => {
    if (line.startsWith("diff --git")) {
      current = { path: line.replace("diff --git a/", "").split(" b/")[0], lines: [] };
      files.push(current);
      return;
    }
    if (!current) {
      current = { path: "changes", lines: [] };
      files.push(current);
    }
    if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("index ")) return;

    let type = "context";
    if (line.startsWith("@@")) type = "hunk";
    else if (line.startsWith("+")) type = "add";
    else if (line.startsWith("-")) type = "del";

    current.lines.push({ type, text: line });
  });

  return files;
}

const lineStyles = {
  hunk: "bg-[#F0F4FF] text-[#6D6DDB]",
  add: "bg-[#ECFDF3] text-[#16A34A]",
  del: "bg-[#FEF2F2] text-[#DC2626]",
  context: "text-[#374151]",
};

function CommitDiff({ hash }) {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | error | done
  const [openFiles, setOpenFiles] = useState({});
  const [copiedPath, setCopiedPath] = useState(null);

  useEffect(() => {
    if (!hash) return;

    const controller = new AbortController();

    async function fetchDiff() {
      setStatus("loading");
      try {
        const res = await axios.get(
          `http://localhost:5000/repository/commit/${hash}/diff`,
          { signal: controller.signal }
        );
        const parsed = parseDiff(res.data.data);
        setFiles(parsed);
        setOpenFiles(Object.fromEntries(parsed.map((f, i) => [i, i === 0])));
        setStatus("done");
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error(err);
        setStatus("error");
      }
    }

    fetchDiff();
    return () => controller.abort();
  }, [hash]);

  function toggleFile(i) {
    setOpenFiles((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  async function copyFile(path, i) {
    const text = files[i].lines.map((l) => l.text).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 1500);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-semibold text-[15px] text-[#0F172A]">Diff Viewer</h2>

      {status === "loading" && (
        <div className="flex items-center gap-2 text-[13px] text-[#6B7280] py-6 justify-center">
          <Loader2 className="animate-spin" size={16} />
          Loading diff&hellip;
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 text-[13px] text-[#DC2626] bg-[#FEF2F2] border border-[#FCA5A5]/40 rounded-lg px-3 py-2.5">
          <AlertCircle size={15} />
          Couldn&apos;t load the diff for this commit. Try again.
        </div>
      )}

      {status === "done" && files.length === 0 && (
        <div className="text-[13px] text-[#9CA3AF] py-4 text-center">No changes to show.</div>
      )}

      {status === "done" &&
        files.map((file, i) => (
          <div key={file.path + i} className="rounded-lg border border-[#EEF0F3] overflow-hidden">
            <button
              onClick={() => toggleFile(i)}
              className="w-full flex items-center justify-between bg-[#F8FAFC] px-3 py-2 border-b border-[#EEF0F3]"
            >
              <span className="flex items-center gap-1.5 text-[12px] text-[#374151] font-mono truncate">
                <FileCode size={13} />
                {file.path}
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <span
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyFile(file.path, i);
                  }}
                  className="flex items-center gap-1 text-[11px] text-[#4B5563] border border-[#E5E7EB] rounded px-2 py-1 bg-white hover:bg-[#F3F4F6]"
                >
                  {copiedPath === file.path ? <Check size={11} /> : <Copy size={11} />}
                  {copiedPath === file.path ? "Copied" : "Copy"}
                </span>
                {openFiles[i] ? <ChevronUp size={15} className="text-[#9CA3AF]" /> : <ChevronDown size={15} className="text-[#9CA3AF]" />}
              </span>
            </button>

            {openFiles[i] && (
              <pre className="font-mono text-[11.5px] leading-6 bg-white m-0 overflow-x-auto">
                {file.lines.map((l, idx) => (
                  <div key={idx} className={`px-3 whitespace-pre ${lineStyles[l.type]}`}>
                    {l.text || "\u00A0"}
                  </div>
                ))}
              </pre>
            )}
          </div>
        ))}
    </div>
  );
}

export default CommitDiff;