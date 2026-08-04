import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, AlertCircle, Loader2, Copy, Download, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";

const ASK_ENDPOINT =
  import.meta.env?.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/contributor/ask`
    : "http://localhost:5000/api/contributor/ask";

const MAX_QUESTION_LENGTH = 300;

const SUGGESTIONS = [
  "Summarize this contributor's overall impact",
  "What features did they contribute the most?",
  "Which parts of the codebase do they own?",
  "What are this contributor's strongest technical skills?",
  "Explain their most important recent commits",
  "What coding patterns or practices do they commonly follow?",
  "Which files are modified most frequently by this contributor?",
  "Have they worked on bug fixes or new features?",
  "What potential risks or improvement areas do you notice?",
  "Give an overall performance review.",
];

// Sized to fill a grid cell (h-full, internal scroll) instead of a
// free-standing page card, so it drops straight into the dashboard grid.
export default function ContributorAI({ contributorName, allCommits }) {
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [answer, setAnswer] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [duration, setDuration] = useState(0);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef(null);
  const textareaRef = useRef(null);

  // Reset conversation state when switching contributors so stale
  // answers don't linger under the wrong name.
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

  async function askAI() {
    const trimmed = question.trim();
    if (!trimmed || status === "loading") return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setErrorMessage("");
    setAnswer("");
    setCopied(false);

    try {
      const response = await fetch(ASK_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributorName,
          question: trimmed,
          allCommits,
        }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to get AI response.");
      }

      setAnswer(data.answer);
      setDuration(data.duration || 0);
      setStatus("idle");
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error(err);
      setErrorMessage(err.message || "Something went wrong. Please try again.");
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
    <div className="bg-white rounded-2xl shadow-sm p-4 h-full flex flex-col overflow-hidden">
      <div className="mb-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="text-indigo-600 shrink-0" size={18} />
          <h2 className="text-sm font-bold text-slate-900 truncate">
            Ask AI About {contributorName}
          </h2>
          <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">
            Gemini
          </span>
        </div>
        <p className="mt-1 text-[11px] text-gray-500">
          Answers are generated only from this contributor's commit history.
        </p>
      </div>

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
        placeholder={`Ask anything about ${contributorName || "this contributor"}...`}
        disabled={isLoading}
        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-gray-50 disabled:text-gray-400 shrink-0"
      />

      <div className="flex items-center justify-between mt-1.5 shrink-0">
        <span
          className={`text-[10px] shrink-0 ${
            remaining < 20 ? "text-red-500" : "text-gray-400"
          }`}
        >
          {remaining} characters left
        </span>
      </div>

      <div className="flex items-center gap-3 mt-2 shrink-0">
        <button
          onClick={askAI}
          disabled={isLoading || !question.trim()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : (
            <Send size={14} aria-hidden="true" />
          )}
          {isLoading ? "Analyzing..." : "Ask AI"}
        </button>
        <span className="text-[11px] text-gray-400 hidden sm:inline">
          Enter to send, Shift+Enter for a new line
        </span>
      </div>

      {/* Everything below scrolls internally so this card stays h-full in the grid */}
      <div className="flex-1 min-h-0 overflow-y-auto mt-3 pr-1 -mr-1">
        <div className="flex flex-wrap gap-1.5 mb-1">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setQuestion(suggestion);
                textareaRef.current?.focus();
              }}
              disabled={isLoading}
              className="text-[11px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-full transition disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {status === "error" && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 bg-red-50 text-red-600 rounded-lg p-3 text-xs"
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>{errorMessage}</p>
          </div>
        )}

        {answer && status !== "error" && (
          <div
            aria-live="polite"
            className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50 p-3"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles size={14} className="text-indigo-600 shrink-0" aria-hidden="true" />
                <h3 className="text-xs font-semibold text-slate-900">AI Review</h3>
                {duration > 0 && (
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                    · {(duration / 1000).toFixed(2)}s
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={copyAnswer}
                  className="flex items-center gap-1 text-[11px] bg-white border border-indigo-100 px-2 py-1 rounded-md text-slate-600 hover:bg-indigo-100/50 transition"
                >
                  {copied ? (
                    <Check size={12} aria-hidden="true" />
                  ) : (
                    <Copy size={12} aria-hidden="true" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={downloadReview}
                  className="flex items-center gap-1 text-[11px] bg-white border border-indigo-100 px-2 py-1 rounded-md text-slate-600 hover:bg-indigo-100/50 transition"
                >
                  <Download size={12} aria-hidden="true" />
                  Download
                </button>
              </div>
            </div>

            <div className="prose prose-sm max-w-none prose-indigo text-xs text-slate-700">
              <ReactMarkdown>{answer}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
