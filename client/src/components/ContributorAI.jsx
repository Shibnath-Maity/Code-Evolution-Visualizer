import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Send,
  AlertCircle,
  Loader2,
  Copy,
  Download,
  Check,
  MessageSquareText,
  CornerDownLeft,
  RotateCcw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import API from "../services/api";

const MAX_QUESTION_LENGTH = 300;

const SUGGESTIONS = [
  "Summarize overall impact",
  "Top feature contributions",
  "Codebase ownership & files",
  "Strongest technical skills",
  "Recent key commits",
  "Patterns & practices",
  "Potential risks & improvements",
  "Overall performance review",
];

// Markdown renderers kept outside the component so they aren't recreated
// on every render, and so styling stays in one place.
const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="text-sm font-semibold text-slate-100 mt-4 mb-2 first:mt-0 pb-1.5 border-b border-slate-800">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-[13px] font-semibold text-slate-100 mt-4 mb-2 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xs font-semibold text-slate-200 mt-3 mb-1.5 first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-xs text-slate-300 leading-relaxed mb-2.5 last:mb-0 break-words">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="text-xs text-slate-300 mb-2.5 pl-4 space-y-1 list-disc marker:text-slate-600">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="text-xs text-slate-300 mb-2.5 pl-4 space-y-1 list-decimal marker:text-slate-600">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed break-words">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
  em: ({ children }) => <em className="text-slate-200">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 decoration-indigo-700 break-all"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-indigo-500/40 pl-3 py-0.5 mb-2.5 text-xs text-slate-400 italic">
      {children}
    </blockquote>
  ),
  code: ({ inline, className, children }) => {
    if (inline) {
      return (
        <code className="px-1 py-0.5 rounded bg-slate-800 text-indigo-300 text-[11px] font-mono break-words">
          {children}
        </code>
      );
    }
    return (
      <code className={`font-mono text-[11px] leading-relaxed ${className || ""}`}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-2.5 rounded-lg border border-slate-800 bg-slate-950 p-3 overflow-x-auto max-w-full">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mb-2.5 overflow-x-auto rounded-lg border border-slate-800 max-w-full">
      <table className="text-[11px] w-full border-collapse min-w-[380px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-900">{children}</thead>,
  th: ({ children }) => (
    <th className="text-left font-medium text-slate-300 px-2.5 py-1.5 border-b border-slate-800 whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="text-slate-300 px-2.5 py-1.5 border-b border-slate-800/60 align-top">
      {children}
    </td>
  ),
  hr: () => <hr className="border-slate-800 my-3" />,
};

export default function ContributorAI({ contributorName, allCommits }) {
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [answer, setAnswer] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [duration, setDuration] = useState(0);
  const [copied, setCopied] = useState(false);
  const [lastQuestion, setLastQuestion] = useState("");
  const abortRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    setQuestion("");
    setAnswer("");
    setErrorMessage("");
    setStatus("idle");
    setDuration(0);
    setCopied(false);
    setLastQuestion("");
    abortRef.current?.abort();
  }, [contributorName]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function askAI(queryToSubmit) {
    const targetQuestion = typeof queryToSubmit === "string" ? queryToSubmit : question;
    const trimmed = targetQuestion.trim();
    if (!trimmed || status === "loading") return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setErrorMessage("");
    setAnswer("");
    setCopied(false);
    setLastQuestion(trimmed);

    try {
      const response = await API.post(
        "/api/contributor/ask",
        {
          contributorName,
          question: trimmed,
          allCommits,
        },
        { signal: controller.signal }
      );

      const data = response.data;
      if (!data.success) {
        throw new Error(data.message || "Failed to get AI response.");
      }

      setAnswer(data.answer);
      setDuration(data.duration || 0);
      setStatus("idle");
    } catch (err) {
      if (err.name === "CanceledError" || err.name === "AbortError") return;
      console.error(err);
      setErrorMessage(
        err.response?.data?.message || err.message || "Something went wrong. Please try again."
      );
      setStatus("error");
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askAI();
    }
  }

  async function copyAnswer() {
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }

  function downloadReview() {
    const blob = new Blob([answer], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(contributorName || "contributor")
      .replace(/\s+/g, "-")
      .toLowerCase()}-ai-review.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const remaining = MAX_QUESTION_LENGTH - question.length;
  const isLoading = status === "loading";

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl shadow-sm p-3 sm:p-4 h-full min-h-0 flex flex-col overflow-hidden text-slate-100">
      {/* Header */}
      <div className="mb-3 shrink-0 flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
            <Sparkles size={16} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-sm font-semibold text-slate-100 truncate">
                Contributor Intelligence
              </h2>
              <span className="shrink-0 text-[10px] font-medium bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 px-1.5 py-0.5 rounded">
                Gemini
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              Insights for <span className="text-slate-300 font-medium">{contributorName || "Contributor"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Input Box */}
      <div className="relative shrink-0 rounded-lg border border-slate-800 bg-slate-950/70 transition-colors focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/30">
        <label htmlFor="contributor-ai-question" className="sr-only">
          Ask a question about {contributorName || "this contributor"}
        </label>
        <textarea
          id="contributor-ai-question"
          ref={textareaRef}
          rows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value.slice(0, MAX_QUESTION_LENGTH))}
          onKeyDown={handleKeyDown}
          placeholder={`Ask about ${contributorName || "this contributor"}...`}
          disabled={isLoading}
          aria-describedby="contributor-ai-char-count"
          className="w-full bg-transparent p-2.5 text-xs text-slate-200 placeholder-slate-500 outline-none resize-none disabled:opacity-50"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 pb-2 pt-1.5 border-t border-slate-800/70">
          <span
            id="contributor-ai-char-count"
            className={`text-[10px] tabular-nums ${remaining < 20 ? "text-rose-400 font-medium" : "text-slate-500"}`}
          >
            {remaining} left
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <span className="hidden md:flex items-center gap-1 text-[10px] text-slate-500">
              <CornerDownLeft size={10} aria-hidden="true" /> to send
            </span>
            <button
              type="button"
              onClick={() => askAI()}
              disabled={isLoading || !question.trim()}
              aria-label="Ask AI"
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={13} className="animate-spin" aria-hidden="true" />
              ) : (
                <Send size={13} aria-hidden="true" />
              )}
              <span>{isLoading ? "Analyzing" : "Ask"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto mt-3 pr-0.5 space-y-3">
        {/* Empty state + suggestions */}
        {!answer && !isLoading && status !== "error" && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 leading-relaxed">
              Ask a question about this contributor's commits, ownership, technical strengths, or
              development patterns.
            </p>
            <div>
              <p className="text-[10px] font-medium text-slate-500 mb-1.5">Suggested prompts</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setQuestion(suggestion);
                      askAI(suggestion);
                    }}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-800/60 hover:bg-slate-800 hover:text-indigo-300 border border-slate-700/60 hover:border-indigo-500/40 px-2.5 py-1.5 rounded-md transition-colors disabled:opacity-50"
                  >
                    <MessageSquareText size={11} className="text-slate-500 shrink-0" aria-hidden="true" />
                    <span className="truncate max-w-[220px]">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3.5"
          >
            <Loader2 size={15} className="animate-spin text-indigo-400 mt-0.5 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200">Analyzing contributor...</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Reviewing commits and contribution patterns
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div
            role="alert"
            className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/25 text-rose-300 rounded-lg p-3 text-xs"
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-400" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="leading-relaxed break-words">{errorMessage}</p>
              {lastQuestion && (
                <button
                  type="button"
                  onClick={() => askAI(lastQuestion)}
                  className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-200 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-2 py-1 rounded-md transition-colors"
                >
                  <RotateCcw size={11} aria-hidden="true" />
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        {/* Output Answer Block */}
        {answer && status !== "error" && (
          <div aria-live="polite" className="rounded-lg border border-slate-800 bg-slate-950/50">
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles size={13} className="text-indigo-400 shrink-0" aria-hidden="true" />
                <h3 className="text-xs font-semibold text-slate-200 truncate">Analysis Summary</h3>
                {duration > 0 && (
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {(duration / 1000).toFixed(2)}s
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={copyAnswer}
                  aria-label="Copy analysis to clipboard"
                  className="flex items-center gap-1 text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-md transition-colors border border-slate-700/60"
                >
                  {copied ? (
                    <Check size={12} className="text-emerald-400" aria-hidden="true" />
                  ) : (
                    <Copy size={12} aria-hidden="true" />
                  )}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
                <button
                  type="button"
                  onClick={downloadReview}
                  aria-label="Download analysis as markdown file"
                  className="flex items-center gap-1 text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-md transition-colors border border-slate-700/60"
                >
                  <Download size={12} aria-hidden="true" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <div className="px-3.5 py-3 max-w-none min-w-0">
              <ReactMarkdown components={markdownComponents}>{answer}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}