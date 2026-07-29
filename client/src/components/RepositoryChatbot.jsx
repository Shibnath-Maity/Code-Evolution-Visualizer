
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Bot,
  Send,
  Loader2,
  User,
  Trash2,
  FolderGit2,
} from "lucide-react";

const API_URL = "http://localhost:5000";

const SUGGESTED_QUESTIONS = [
  "How does the move zeroes solution work?",
  "Which algorithm is used in move zeroes?",
  "Explain the duplicate number solution.",
  "Which files use two pointer algorithms?",
];

// ==========================================
// Render basic markdown
// ==========================================

function renderInlineMarkdown(line, keyPrefix) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${keyPrefix}-${i}`} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{part}</span>
    )
  );
}

// ==========================================
// Format AI response
// ==========================================

function FormattedMessage({ text }) {
  const lines = text.split("\n");

  const blocks = [];
  let currentList = [];

  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push({
        type: "list",
        items: currentList,
      });

      currentList = [];
    }
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    const bulletMatch = line.match(/^[*-]\s+(.*)/);

    if (bulletMatch) {
      currentList.push(bulletMatch[1]);
    } else {
      flushList();

      blocks.push({
        type: "para",
        text: line,
      });
    }
  });

  flushList();

  return (
    <div className="space-y-2">
      {blocks.map((block, i) =>
        block.type === "list" ? (
          <ul
            key={i}
            className="list-disc list-outside pl-4 space-y-1"
          >
            {block.items.map((item, j) => (
              <li key={j}>
                {renderInlineMarkdown(item, `${i}-${j}`)}
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            {renderInlineMarkdown(block.text, `${i}`)}
          </p>
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
          style={{
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

// ==========================================
// Repository Chatbot
// ==========================================

function RepositoryChatbot({ repositoryData }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  // ==========================================
  // Auto-scroll to latest message
  // ==========================================

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading]);

  // ==========================================
  // Send question to backend
  // ==========================================

  async function sendQuestion(text) {
    const userQuestion = text.trim();

    if (!userQuestion || loading) {
      return;
    }

    // Add user message immediately
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userQuestion,
      },
    ]);

    setQuestion("");
    setError("");
    setLoading(true);

    try {
      // IMPORTANT:
      // Backend route is /assistant/ask
      const response = await axios.post(
        `${API_URL}/assistant/ask`,
        {
          question: userQuestion,
        }
      );

      console.log("Assistant response:", response.data);

      // Add AI response
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            response.data.answer ||
            "I couldn't generate an answer.",
        },
      ]);
    } catch (err) {
      console.error("Assistant error:", err);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't answer that question.",
          isError: true,
        },
      ]);

      setError(
        "The assistant didn't respond. Please try again."
      );
    } finally {
      setLoading(false);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }

  // ==========================================
  // Enter key handling
  // ==========================================

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      sendQuestion(question);
    }
  }

  // ==========================================
  // Textarea resizing
  // ==========================================

  function handleTextareaChange(e) {
    setQuestion(e.target.value);

    const el = e.target;

    el.style.height = "auto";

    el.style.height = `${Math.min(
      el.scrollHeight,
      160
    )}px`;
  }

  // ==========================================
  // Clear conversation
  // ==========================================

  function clearChat() {
    setMessages([]);
    setError("");
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mt-6">

      {/* ======================================
          Header
      ======================================= */}

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
              Ask questions about the code, files,
              algorithms and repository.
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

      {/* ======================================
          Repository status
      ======================================= */}

      {!repositoryData ? (
        <div className="bg-slate-50 rounded-xl p-6 flex flex-col items-center text-center">

          <FolderGit2 className="h-6 w-6 text-slate-400 mb-2" />

          <p className="text-sm text-slate-500">
            Analyze a repository first to chat about it.
          </p>

        </div>
      ) : (
        <>

          {/* ==================================
              Chat messages
          =================================== */}

          <div
            ref={scrollRef}
            className="min-h-[180px] max-h-[420px] overflow-y-auto space-y-4 mb-5 pr-1"
          >

            {/* Empty state */}

            {messages.length === 0 && (
              <div className="bg-slate-50 rounded-xl p-5">

                <div className="flex items-start gap-3">

                  <Bot className="h-5 w-5 text-indigo-600 mt-0.5 shrink-0" />

                  <div>

                    <p className="text-sm font-medium text-slate-800">
                      Hello! 👋
                    </p>

                    <p className="text-sm text-slate-500 mt-1">
                      I've analyzed this repository.
                      Ask me anything about the code
                      and its development.
                    </p>

                    {/* Suggested questions */}

                    <div className="flex flex-wrap gap-2 mt-4">

                      {SUGGESTED_QUESTIONS.map(
                        (item) => (
                          <button
                            key={item}
                            onClick={() =>
                              sendQuestion(item)
                            }
                            disabled={loading}
                            className="text-xs px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {item}
                          </button>
                        )
                      )}

                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* ==================================
                Messages
            =================================== */}

            {messages.map((message, index) => (

              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >

                {/* AI icon */}

                {message.role === "assistant" && (
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      message.isError
                        ? "bg-red-50"
                        : "bg-indigo-50"
                    }`}
                  >
                    <Bot
                      className={`h-4 w-4 ${
                        message.isError
                          ? "text-red-500"
                          : "text-indigo-600"
                      }`}
                    />
                  </div>
                )}

                {/* Message bubble */}

                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "bg-indigo-600 text-white"
                      : message.isError
                      ? "bg-red-50 text-red-600"
                      : "bg-slate-50 text-slate-700"
                  }`}
                >

                  {message.role === "assistant" &&
                  !message.isError ? (
                    <FormattedMessage
                      text={message.content}
                    />
                  ) : (
                    <span className="whitespace-pre-wrap">
                      {message.content}
                    </span>
                  )}

                </div>

                {/* User icon */}

                {message.role === "user" && (
                  <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-slate-600" />
                  </div>
                )}

              </div>

            ))}

            {/* ==================================
                Loading indicator
            =================================== */}

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

          {/* Error */}

          {error && (
            <p className="text-xs text-red-500 mb-2">
              {error}
            </p>
          )}

          {/* ==================================
              Input area
          =================================== */}

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
              disabled={
                !question.trim() || loading
              }
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
            Press Enter to send • Shift + Enter
            for a new line
          </p>

        </>
      )}

    </div>
  );
}

export default RepositoryChatbot;
