import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Bot,
  Send,
  Loader2,
  User,
  Trash2,
  FolderGit2,
  Copy,
  Check,
} from "lucide-react";

const API_URL = "http://localhost:5000";

const SUGGESTED_QUESTIONS = [
  "Give me a repository overview.",
  "What technologies are used in this project?",
  "Explain the project architecture.",
  "Suggest improvements for this repository.",
];

// ==========================================
// Render basic inline markdown: **bold** and
// `inline code`. Code spans are matched first so
// a code span containing literal asterisks isn't
// mistaken for bold syntax.
// ==========================================

function renderInlineMarkdown(line, keyPrefix) {
  const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);

  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
      return (
        <code
          key={`${keyPrefix}-${i}`}
          className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[13px] font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}

const HEADING_STYLES = {
  1: "text-base font-bold text-slate-900 mt-1",
  2: "text-[15px] font-bold text-slate-900 mt-1",
  3: "text-sm font-semibold text-slate-800 mt-1",
  4: "text-sm font-semibold text-slate-700 mt-1",
};

// ==========================================
// Fenced code block, e.g. ```python\n...\n```
// Dark panel with a language label and a copy
// button. This is the piece that was completely
// missing before: a ``` fence just fell through
// to plain-paragraph rendering with the backticks
// printed literally.
// ==========================================

function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard write failed silently — button just won't flip to "copied"
    }
  };

  return (
    <div className="rounded-lg overflow-hidden border border-slate-800 my-1">
      <div className="flex items-center justify-between bg-slate-900 px-3 py-1.5 border-b border-slate-800">
        <span className="text-[11px] font-mono text-slate-400 lowercase">
          {lang || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="bg-slate-950 text-slate-200 text-[12.5px] font-mono leading-6 px-3.5 py-3 overflow-x-auto m-0">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ==========================================
// Format AI response
// ==========================================

// Splits the raw text into alternating prose / fenced-code segments
// first, so code content never gets run through the heading/list/bold
// parsing meant for prose (a "#" inside a Python comment shouldn't turn
// into a heading, for example).
function splitCodeSegments(text) {
  const segments = [];
  const pattern = /```(\w+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "prose", content: text.slice(lastIndex, match.index) });
    }
    segments.push({
      type: "code",
      lang: match[1] || "",
      code: match[2].replace(/\n$/, ""),
    });
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "prose", content: text.slice(lastIndex) });
  }

  return segments;
}

function ProseBlocks({ text }) {
  const lines = text.split("\n");

  const blocks = [];
  let currentList = null; // { type: "bullet" | "number", items: [] }

  const flushList = () => {
    if (currentList && currentList.items.length > 0) {
      blocks.push(currentList);
    }
    currentList = null;
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    // Headings: "#", "##", "###", "####" — previously unhandled, so a
    // line like "## Repository Overview" fell through to the plain
    // paragraph branch and rendered as literal "## Repository Overview"
    // text instead of a heading.
    const headingMatch = line.match(/^(#{1,4})\s+(.*)/);
    if (headingMatch) {
      flushList();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      return;
    }

    const bulletMatch = line.match(/^[*-]\s+(.*)/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== "bullet") {
        flushList();
        currentList = { type: "bullet", items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      return;
    }

    const numberedMatch = line.match(/^\d+[.)]\s+(.*)/);
    if (numberedMatch) {
      if (!currentList || currentList.type !== "number") {
        flushList();
        currentList = { type: "number", items: [] };
      }
      currentList.items.push(numberedMatch[1]);
      return;
    }

    flushList();
    blocks.push({ type: "para", text: line });
  });

  flushList();

  if (!blocks.length) return null;

  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          return (
            <p key={i} className={HEADING_STYLES[block.level] || HEADING_STYLES[4]}>
              {renderInlineMarkdown(block.text, `${i}`)}
            </p>
          );
        }

        if (block.type === "bullet") {
          return (
            <ul key={i} className="list-disc list-outside pl-4 space-y-1">
              {block.items.map((item, j) => (
                <li key={j}>{renderInlineMarkdown(item, `${i}-${j}`)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "number") {
          return (
            <ol key={i} className="list-decimal list-outside pl-4 space-y-1">
              {block.items.map((item, j) => (
                <li key={j}>{renderInlineMarkdown(item, `${i}-${j}`)}</li>
              ))}
            </ol>
          );
        }

        return <p key={i}>{renderInlineMarkdown(block.text, `${i}`)}</p>;
      })}
    </div>
  );
}

function FormattedMessage({ text }) {
  const segments = splitCodeSegments(text);

  return (
    <div className="space-y-2">
      {segments.map((segment, i) =>
        segment.type === "code" ? (
          <CodeBlock key={i} lang={segment.lang} code={segment.code} />
        ) : (
          <ProseBlocks key={i} text={segment.content} />
        )
      )}
    </div>
  );
}

// ==========================================
// Typing indicator
// ==========================================

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// ==========================================
// Repository Chatbot
// ==========================================
function RepositoryChatbot({ repositoryId: repositoryIdProp }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  // The parent page (AIInsights.jsx) passes repositoryId as a prop, which
  // was previously ignored entirely in favor of reading localStorage
  // directly — meaning if the two ever disagreed, this component could
  // show "no repository connected" even though the rest of the page had
  // one loaded, or silently chat about the wrong repository.
  const repositoryId = repositoryIdProp || localStorage.getItem("repositoryId");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading]);

  async function sendQuestion(text) {
    const userQuestion = text.trim();

    if (!userQuestion || loading) {
      return;
    }

    if (!repositoryId) {
      setError("No repository connected — analyze a repository first.");
      return;
    }

    setMessages((prev) => [...prev, { role: "user", content: userQuestion }]);

    setQuestion("");
    setError("");
    setLoading(true);

    try {
      // IMPORTANT:
      // Backend route is /assistant/ask
      const response = await axios.post(`${API_URL}/assistant/ask`, {
        question: userQuestion,
        repositoryId,
      });

      console.log("Assistant response:", response.data);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.data.answer || "I couldn't generate an answer.",
        },
      ]);
    } catch (err) {
      console.error("Assistant error:", err);
      console.error("Response data:", err.response?.data);
      console.error("Response status:", err.response?.status);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't answer that question.",
          isError: true,
        },
      ]);

      setError("The assistant didn't respond. Please try again.");
    } finally {
      setLoading(false);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuestion(question);
    }
  }

  function handleTextareaChange(e) {
    setQuestion(e.target.value);

    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function clearChat() {
    setMessages([]);
    setError("");
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mt-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <Bot className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-900">
              Ask AI About This Repository
            </h2>
            <p className="text-xs text-slate-500">
              Ask questions about the code, files, algorithms and repository.
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition shrink-0"
            title="Clear conversation"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Repository status */}
      {!repositoryId ? (
        <div className="bg-slate-50 rounded-xl p-6 flex flex-col items-center text-center">
          <FolderGit2 className="h-6 w-6 text-slate-400 mb-2" />
          <p className="text-sm text-slate-500">
            Analyze a repository first to chat about it.
          </p>
        </div>
      ) : (
        <>
          {/* Chat messages */}
          <div
            ref={scrollRef}
            className="min-h-[180px] max-h-[420px] overflow-y-auto space-y-4 mb-5 pr-1"
          >
            {messages.length === 0 && (
              <div className="bg-slate-50 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <Bot className="h-5 w-5 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">Hello! 👋</p>
                    <p className="text-sm text-slate-500 mt-1">
                      I've analyzed this repository. Ask me anything about the code
                      and its development.
                    </p>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {SUGGESTED_QUESTIONS.map((item) => (
                        <button
                          key={item}
                          onClick={() => sendQuestion(item)}
                          disabled={loading}
                          className="text-xs px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      message.isError ? "bg-red-50" : "bg-indigo-50"
                    }`}
                  >
                    <Bot
                      className={`h-4 w-4 ${
                        message.isError ? "text-red-500" : "text-indigo-600"
                      }`}
                    />
                  </div>
                )}

                <div
                  className={`max-w-[80%] min-w-0 rounded-xl px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "bg-indigo-600 text-white"
                      : message.isError
                      ? "bg-red-50 text-red-600"
                      : "bg-slate-50 text-slate-700"
                  }`}
                >
                  {message.role === "assistant" && !message.isError ? (
                    <FormattedMessage text={message.content} />
                  ) : (
                    <span className="whitespace-pre-wrap">{message.content}</span>
                  )}
                </div>

                {message.role === "user" && (
                  <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-slate-600" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="bg-slate-50 rounded-xl px-4 py-3">
                  <TypingIndicator />
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

          {/* Input area */}
          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={question}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about this repository..."
              rows={2}
              className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 max-h-40"
            />

            <button
              onClick={() => sendQuestion(question)}
              disabled={!question.trim() || loading}
              className="h-11 w-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-400 mt-2">
            Press Enter to send • Shift + Enter for a new line
          </p>
        </>
      )}
    </div>
  );
}

export default RepositoryChatbot;
