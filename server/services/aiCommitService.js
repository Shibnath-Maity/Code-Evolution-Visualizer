const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

// Groq (like most providers) has a context window. A raw diff on a large
// commit can blow past it, causing the request to fail outright instead of
// degrading gracefully. Truncate and tell the model it was truncated.
const MAX_DIFF_CHARS = 12000;

const ALLOWED_LEVELS = ["Low", "Medium", "High"];

const FALLBACK_SUMMARY = {
  title: "AI Summary Unavailable",
  summary: "Unable to generate summary.",
  purpose: "Unknown",
  category: "Unknown",
  affectedArea: "Repository",
  impact: "Low",
  risk: "Low",
  reviewTime: "Unknown",
  complexity: "Low",
  confidence: 0,
  breakingChange: false,
  codeQuality: "Needs Review",
  tags: [],
};

function truncateDiff(diff) {
  if (!diff) return "(no diff provided)";
  if (diff.length <= MAX_DIFF_CHARS) return diff;
  return (
    diff.slice(0, MAX_DIFF_CHARS) +
    `\n\n[... diff truncated, ${diff.length - MAX_DIFF_CHARS} more characters omitted ...]`
  );
}

function normalizeLevel(value, fallback = "Low") {
  const match = ALLOWED_LEVELS.find(
    (level) => level.toLowerCase() === String(value).toLowerCase()
  );
  return match || fallback;
}

// The model is asked to return strict JSON, but "asked to" and "did" are
// different things — response_format reduces malformed JSON, it doesn't
// guarantee the fields are the right type or the enums are valid values.
// This normalizes whatever comes back into the shape callers rely on, so a
// downstream component never renders a raw/unexpected value in a badge.
function normalizeSummary(raw) {
return {
  title:
    typeof raw.title === "string"
      ? raw.title.trim()
      : FALLBACK_SUMMARY.title,

  summary:
    typeof raw.summary === "string"
      ? raw.summary.trim()
      : FALLBACK_SUMMARY.summary,

  purpose:
    typeof raw.purpose === "string"
      ? raw.purpose.trim()
      : FALLBACK_SUMMARY.purpose,

  category:
    typeof raw.category === "string"
      ? raw.category.trim()
      : FALLBACK_SUMMARY.category,

  affectedArea:
    typeof raw.affectedArea === "string"
      ? raw.affectedArea.trim()
      : FALLBACK_SUMMARY.affectedArea,

  impact: normalizeLevel(raw.impact),

  risk: normalizeLevel(raw.risk),

  reviewTime:
    typeof raw.reviewTime === "string"
      ? raw.reviewTime.trim()
      : FALLBACK_SUMMARY.reviewTime,

  complexity: normalizeLevel(raw.complexity),

  confidence:
    Number.isInteger(raw.confidence)
      ? Math.min(100, Math.max(0, raw.confidence))
      : 0,

  breakingChange: raw.breakingChange === true,

  codeQuality:
    typeof raw.codeQuality === "string"
      ? raw.codeQuality.trim()
      : FALLBACK_SUMMARY.codeQuality,

  tags: Array.isArray(raw.tags)
    ? raw.tags.filter(Boolean).slice(0, 8)
    : [],
};
}

async function generateCommitSummary(commit) {
  try {
    const files = Array.isArray(commit?.files) ? commit.files : [];

    const prompt = `
You are a Senior Software Engineer.

Analyze the following Git commit.

Commit Message:
${commit?.message || "(no message provided)"}

Author:
${commit?.author || "(unknown author)"}

Commit Date:
${commit?.date || "(unknown date)"}

Files Changed:
${files.length ? files.join("\n") : "(no files listed)"}

Git Diff:
${truncateDiff(commit?.diff)}

Return ONLY valid JSON.

{
  "title":"",
  "summary":"",
  "purpose":"",
  "category":"",
  "affectedArea":"",
  "impact":"Low | Medium | High",
  "risk":"Low | Medium | High",
  "reviewTime":"",
  "complexity":"Low | Medium | High",
  "confidence":0,
  "breakingChange":false,
  "codeQuality":"",
  "tags":[]
}

Rules:

- title: Short professional title (max 8 words)
- summary: Explain the commit in 2 concise sentences.
- purpose: Why was this commit created?
- category: Choose ONE of:
  Feature, Bug Fix, Refactor, Performance,
  Security, Documentation, Testing, CI/CD,
  Dependency, Configuration

- affectedArea: Choose ONE of:
  Frontend, Backend, API, Database,
  DevOps, Security, Testing,
  Repository, Architecture

- impact:
  Low = minor change
  Medium = moderate feature/refactor
  High = major functionality

- risk:
  Low = very safe
  Medium = requires testing
  High = may introduce regressions

- reviewTime:
  Estimate review time like "2 min", "5 min", "12 min"

- complexity:
  Low, Medium or High

- confidence:
  Integer between 0 and 100

- breakingChange:
  true only if previous functionality
  or API compatibility changes.

- codeQuality:
  Excellent
  Good
  Needs Review

- tags:
  Return 3-6 technical keywords.
`;

    const response = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an expert software engineer. Respond ONLY with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) throw new Error("Groq returned an empty response");

    const parsed = JSON.parse(content);
    return normalizeSummary(parsed);
  } catch (error) {
    console.error("Groq Commit Summary Error:", error);
    return { ...FALLBACK_SUMMARY };
  }
}

module.exports = {
  generateCommitSummary,
};