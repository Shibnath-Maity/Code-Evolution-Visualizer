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
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
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
// on every render, and so styling stays in one place. Tuned for a premium,
// readable analysis report rather than default markdown output.
const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="text-[13.5px] font-semibold text-white mt-5 mb-2.5 first:mt-0 pb-2 border-b border-white/[0.08]">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-[13px] font-semibold text-white mt-5 mb-2 first:mt-0 flex items-center gap-2">
      <span className="w-1 h-3.5 rounded-full bg-sky-400/70" aria-hidden="true" />
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[12px] font-semibold text-[#C7CCD6] mt-4 mb-1.5 first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-[12.5px] text-[#B7BFCC] leading-relaxed mb-3 last:mb-0 break-words">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="text-[12.5px] text-[#B7BFCC] mb-3 pl-4 space-y-1.5 list-disc marker:text-[#4C5666]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="text-[12.5px] text-[#B7BFCC] mb-3 pl-4 space-y-1.5 list-decimal marker:text-[#4C5666]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed break-words">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="text-[#C7CCD6]">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sky-400 hover:text-sky-300 underline underline-offset-2 decoration-sky-700/60 break-all"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-sky-400/40 pl-3 py-0.5 mb-3 text-[12.5px] text-[#8B94A5] italic">
      {children}
    </blockquote>
  ),
  code: ({ inline, className, children }) => {
    if (inline) {
      return (
        <code className="px-1 py-0.5 rounded-[4px] bg-white/[0.06] border border-white/[0.06] text-sky-300 text-[11px] font-mono break-words">
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
    <pre className="mb-3 rounded-[10px] border border-white/[0.08] bg-[#0A0D12] p-3 overflow-x-auto max-w-full">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto rounded-[10px] border border-white/[0.08] max-w-full">
      <table className="text-[11px] w-full border-collapse min-w-[380px] tabular-nums">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-white/[0.04]">{children}</thead>,
  th: ({ children }) => (
    <th className="text-left font-medium text-[#C7CCD6] px-2.5 py-1.5 border-b border-white/[0.08] whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="text-[#B7BFCC] px-2.5 py-2 border-b border-white/[0.05] align-top leading-relaxed">
      {children}
    </td>
  ),
  hr: () => <hr className="border-white/[0.08] my-4" />,
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
    <div className="bg-white/[0.02] border border-white/[0.08] rounded-[12px] p-3 sm:p-4 h-full min-h-0 flex flex-col overflow-hidden text-[#E7EAEF]">
      {/* Header */}
      <div className="mb-3 shrink-0 flex items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-[8px] bg-sky-400/10 border border-sky-400/20 text-sky-400 shrink-0">
            <Sparkles size={15} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[13.5px] font-semibold text-white truncate">
              Contributor Intelligence
            </h2>
            <p className="text-[11px] text-[#7C8698] truncate">
              Insights for <span className="text-[#C7CCD6] font-medium">{contributorName || "Contributor"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Input Box */}
      <div className="relative shrink-0 rounded-[10px] border border-white/[0.08] bg-[#0A0D12] transition-colors focus-within:border-sky-400/50 focus-within:ring-1 focus-within:ring-sky-400/25">
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
          className="w-full bg-transparent p-2.5 text-[12.5px] text-[#E7EAEF] placeholder-[#5C6779] outline-none resize-none disabled:opacity-50"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 pb-2 pt-1.5 border-t border-white/[0.06]">
          <span
            id="contributor-ai-char-count"
            className={`text-[10px] tabular-nums ${remaining < 20 ? "text-rose-400 font-medium" : "text-[#5C6779]"}`}
          >
            {remaining} left
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <span className="hidden md:flex items-center gap-1 text-[10px] text-[#5C6779]">
              <CornerDownLeft size={10} aria-hidden="true" /> to send
            </span>
            <button
              type="button"
              onClick={() => askAI()}
              disabled={isLoading || !question.trim()}
              aria-label="Ask AI"
              className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-[#04121D] px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed min-h-[34px]"
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
            <p className="text-[12.5px] text-[#7C8698] leading-relaxed">
              Ask a question about this contributor's commits, ownership, technical strengths, or
              development patterns.
            </p>
            <div>
              <p className="text-[10px] font-medium text-[#5C6779] mb-1.5">Suggested prompts</p>
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
                    className="flex items-center gap-1.5 text-[11px] text-[#C7CCD6] bg-white/[0.03] hover:bg-white/[0.06] hover:text-sky-300 border border-white/[0.08] hover:border-sky-400/30 px-2.5 py-2 sm:py-1.5 rounded-[8px] transition-colors duration-150 disabled:opacity-50"
                  >
                    <MessageSquareText size={11} className="text-[#5C6779] shrink-0" aria-hidden="true" />
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
            className="flex items-start gap-3 rounded-[10px] border border-white/[0.08] bg-white/[0.02] p-3.5"
          >
            <Loader2 size={15} className="animate-spin text-sky-400 mt-0.5 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-[#E7EAEF]">Analyzing contributor...</p>
              <p className="text-[11px] text-[#7C8698] mt-0.5">
                Reviewing commits and contribution patterns
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div
            role="alert"
            className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/25 text-rose-300 rounded-[10px] p-3 text-[12.5px]"
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-400" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="leading-relaxed break-words">{errorMessage}</p>
              {lastQuestion && (
                <button
                  type="button"
                  onClick={() => askAI(lastQuestion)}
                  className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-200 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-2 py-1.5 rounded-[8px] transition-colors duration-150"
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
          <div aria-live="polite" className="rounded-[10px] border border-white/[0.08] bg-white/[0.02]">
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles size={13} className="text-sky-400 shrink-0" aria-hidden="true" />
                <h3 className="text-[12.5px] font-semibold text-[#E7EAEF] truncate">Analysis Summary</h3>
                {duration > 0 && (
                  <span className="text-[10px] text-[#5C6779] shrink-0 tabular-nums">
                    {(duration / 1000).toFixed(2)}s
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={copyAnswer}
                  aria-label="Copy analysis to clipboard"
                  className="flex items-center gap-1 text-[11px] bg-white/[0.04] hover:bg-white/[0.08] text-[#C7CCD6] px-2 py-1.5 rounded-[8px] transition-colors duration-150 border border-white/[0.08]"
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
                  className="flex items-center gap-1 text-[11px] bg-white/[0.04] hover:bg-white/[0.08] text-[#C7CCD6] px-2 py-1.5 rounded-[8px] transition-colors duration-150 border border-white/[0.08]"
                >
                  <Download size={12} aria-hidden="true" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <div className="px-3.5 py-3.5 max-w-none min-w-0">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={markdownComponents}
              >
                {answer}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}