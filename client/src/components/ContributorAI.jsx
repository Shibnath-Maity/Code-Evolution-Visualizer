import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, AlertCircle, Loader2, Copy, Download, Check, MessageSquareText, CornerDownLeft } from "lucide-react";
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

export default function ContributorAI({ contributorName, allCommits }) {
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [answer, setAnswer] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [duration, setDuration] = useState(0);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    setQuestion("");
    setAnswer("");
    setErrorMessage("");
    setStatus("idle");
    setDuration(0);
    setCopied(false);
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
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl p-5 h-full flex flex-col overflow-hidden text-slate-100">
      {/* Header */}
      <div className="mb-4 shrink-0 flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
            <Sparkles size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-100 truncate flex items-center gap-2">
              Contributor Intelligence
              <span className="text-[10px] uppercase tracking-wider bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-medium">
                Gemini
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              Insights tailored for <span className="text-slate-200 font-medium">{contributorName || "Contributor"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Input Box Container */}
      <div className="relative shrink-0 rounded-xl border border-slate-800 bg-slate-950/60 transition-all focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20">
        <textarea
          id="contributor-ai-question"
          ref={textareaRef}
          rows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value.slice(0, MAX_QUESTION_LENGTH))}
          onKeyDown={handleKeyDown}
          placeholder={`Ask about ${contributorName || "this contributor"}'s contributions...`}
          disabled={isLoading}
          className="w-full bg-transparent p-3 text-xs text-slate-200 placeholder-slate-500 outline-none resize-none disabled:opacity-50"
        />

        {/* Textarea Toolbar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1 border-t border-slate-800/40">
          <span className={`text-[10px] ${remaining < 20 ? "text-rose-400 font-medium" : "text-slate-500"}`}>
            {remaining} left
          </span>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 hidden sm:flex items-center gap-1">
              Press <CornerDownLeft size={10} /> to send
            </span>
            <button
              onClick={() => askAI()}
              disabled={isLoading || !question.trim()}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-indigo-950"
            >
              {isLoading ? (
                <Loader2 size={13} className="animate-spin" aria-hidden="true" />
              ) : (
                <Send size={13} aria-hidden="true" />
              )}
              <span>{isLoading ? "Analyzing..." : "Ask"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto mt-4 pr-1 space-y-3 custom-scrollbar">
        {/* Suggestion Chips */}
        {!answer && !isLoading && status !== "error" && (
          <div className="space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 px-0.5">
              Suggested Prompts
            </p>
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
                  className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-800/60 hover:bg-slate-800 hover:text-indigo-300 border border-slate-700/50 hover:border-indigo-500/30 px-2.5 py-1.5 rounded-lg transition-all duration-150 disabled:opacity-50"
                >
                  <MessageSquareText size={11} className="text-slate-400" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-slate-800 rounded"></div>
              <div className="h-3 w-12 bg-slate-800 rounded"></div>
            </div>
            <div className="space-y-2 pt-1">
              <div className="h-2.5 bg-slate-800/80 rounded w-full"></div>
              <div className="h-2.5 bg-slate-800/80 rounded w-5/6"></div>
              <div className="h-2.5 bg-slate-800/80 rounded w-4/6"></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div
            role="alert"
            className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl p-3.5 text-xs"
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-400" aria-hidden="true" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Output Answer Block */}
        {answer && status !== "error" && (
          <div
            aria-live="polite"
            className="rounded-xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/20 to-slate-950/40 p-4 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/60">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-400" aria-hidden="true" />
                <h3 className="text-xs font-semibold text-slate-200">Analysis Summary</h3>
                {duration > 0 && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    · {(duration / 1000).toFixed(2)}s
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={copyAnswer}
                  className="flex items-center gap-1 text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-md transition border border-slate-700/50"
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
                  className="flex items-center gap-1 text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-md transition border border-slate-700/50"
                >
                  <Download size={12} aria-hidden="true" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <div className="prose prose-invert prose-xs max-w-none text-slate-300 leading-relaxed">
              <ReactMarkdown>{answer}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}