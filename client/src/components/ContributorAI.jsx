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
  "Give an overall performance review."
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
    <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
      <div className="mb-5">
        <div className="flex items-center gap-2">
  <Sparkles className="text-indigo-600" size={22} />

  <h2 className="text-xl font-bold text-slate-900">
    Ask AI About {contributorName}
  </h2>

  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
    Gemini
  </span>
</div>
        <p className="mt-2 text-sm text-gray-500">
          AI answers are generated only from this contributor's commit history.
        </p>
      </div>

      <label htmlFor="contributor-ai-question" className="sr-only">
        Ask a question about {contributorName || "this contributor"}
      </label>
      <textarea
        id="contributor-ai-question"
        ref={textareaRef}
        rows={3}
        value={question}
        onChange={(e) => setQuestion(e.target.value.slice(0, MAX_QUESTION_LENGTH))}
        onKeyDown={handleKeyDown}
      placeholder={`Ask anything about ${contributorName || "this contributor"}...`}
        disabled={isLoading}
        className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-gray-50 disabled:text-gray-400"
      />

      <div className="flex items-center justify-between mt-2">
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setQuestion(suggestion);
                textareaRef.current?.focus();
              }}
              disabled={isLoading}
              className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full transition disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
        <span
          className={`text-xs shrink-0 ml-3 ${
            remaining < 20 ? "text-red-500" : "text-gray-400"
          }`}
        >
          {remaining}
        </span>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={askAI}
          disabled={isLoading || !question.trim()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <Send size={16} aria-hidden="true" />
          )}
          {isLoading ? "Analyzing contributor history..." : "Ask AI"}
        </button>
        <span className="text-xs text-gray-400">Enter to send, Shift+Enter for a new line</span>
      </div>

      {status === "error" && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2 bg-red-50 text-red-600 rounded-xl p-4 text-sm"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>{errorMessage}</p>
        </div>
      )}

      {answer && status !== "error" && (
        <div
          aria-live="polite"
          className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50 p-5"
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles size={18} className="text-indigo-600 shrink-0" aria-hidden="true" />
              <h3 className="font-semibold text-slate-900">AI Review</h3>
              {duration > 0 && (
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  · Generated in {(duration / 1000).toFixed(2)}s
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={copyAnswer}
                className="flex items-center gap-1 text-xs bg-white border border-indigo-100 px-2.5 py-1 rounded-lg text-slate-600 hover:bg-indigo-100/50 transition"
              >
                {copied ? (
                  <Check size={13} aria-hidden="true" />
                ) : (
                  <Copy size={13} aria-hidden="true" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                onClick={downloadReview}
                className="flex items-center gap-1 text-xs bg-white border border-indigo-100 px-2.5 py-1 rounded-lg text-slate-600 hover:bg-indigo-100/50 transition"
              >
                <Download size={13} aria-hidden="true" />
                Download
              </button>
            </div>
          </div>

         <div className="prose prose-sm max-w-none prose-indigo text-sm text-slate-700 max-h-[500px] overflow-y-auto pr-2">
            <ReactMarkdown>{answer}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}