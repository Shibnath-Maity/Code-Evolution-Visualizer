const Groq = require("groq-sdk");
const { searchDocuments } = require("./ragService");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const DEBUG = process.env.DEBUG_ASSISTANT === "true";

if (!GROQ_API_KEY) {
  console.warn("⚠️ GROQ_API_KEY is not configured.");
}

const groq = GROQ_API_KEY
  ? new Groq({ apiKey: GROQ_API_KEY })
  : null;

// ==========================================
// Configuration
// ==========================================

const CHAT_MODEL =
  process.env.ASSISTANT_CHAT_MODEL || "llama-3.3-70b-versatile";

// Keep retrieval small to reduce Groq token usage.
const RESULT_COUNT =
  Number(process.env.ASSISTANT_RESULT_COUNT) || 6;

// Limit each retrieved chunk.
const MAX_CHARS_PER_SOURCE =
  Number(process.env.ASSISTANT_MAX_CHARS_PER_SOURCE) || 2000;

// Limit total context sent to Groq.
const MAX_TOTAL_CONTEXT_CHARS =
  Number(process.env.ASSISTANT_MAX_TOTAL_CONTEXT_CHARS) || 10000;

const MAX_QUESTION_LENGTH = 2000;

const GROQ_TIMEOUT_MS =
  Number(process.env.ASSISTANT_GROQ_TIMEOUT_MS) || 30000;

const MAX_RETRIES = 1;

const CACHE_TTL_MS =
  Number(process.env.ASSISTANT_CACHE_TTL_MS) || 5 * 60 * 1000;

const MAX_CACHE_ENTRIES = 200;

// ==========================================
// Logger
// ==========================================

function log(...args) {
  if (DEBUG) {
    console.log(...args);
  }
}

// ==========================================
// In-memory response cache
// ==========================================

const responseCache = new Map();

function cacheKey(question, repositoryId) {
  return `${repositoryId}::${question.trim().toLowerCase()}`;
}

function getFromCache(key) {
  const entry = responseCache.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    responseCache.delete(key);
    return null;
  }

  // Refresh recency.
  responseCache.delete(key);
  responseCache.set(key, entry);

  return entry.value;
}

function setInCache(key, value) {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;

    if (oldestKey) {
      responseCache.delete(oldestKey);
    }
  }

  responseCache.set(key, {
    value,
    timestamp: Date.now(),
  });
}

// ==========================================
// Truncate large documents
// ==========================================

function truncate(text, maxChars) {
  if (!text || text.length <= maxChars) {
    return text || "";
  }

  return (
    text.slice(0, maxChars) +
    `\n... [truncated, ${text.length - maxChars} more characters]`
  );
}

// ==========================================
// Sort retrieved chunks by relevance
// ==========================================

function sortByRelevance(documents, metadatas, distances) {
  const order = documents
    .map((_, index) => index)
    .sort(
      (a, b) =>
        (distances[a] ?? Infinity) -
        (distances[b] ?? Infinity)
    );

  return {
    documents: order.map((index) => documents[index]),
    metadatas: order.map((index) => metadatas[index]),
    distances: order.map((index) => distances[index]),
  };
}

// ==========================================
// Remove duplicate chunks from same file
//
// This prevents sending too many chunks from
// the same document to Groq.
// ==========================================

function removeDuplicateChunks(documents, metadatas, distances) {
  const seen = new Set();

  const filteredDocuments = [];
  const filteredMetadatas = [];
  const filteredDistances = [];

  for (let i = 0; i < documents.length; i++) {
    const metadata = metadatas[i] || {};

    const file = metadata.file || `Unknown-${i}`;

    // Include chunk number so different useful chunks
    // from the same file can still be kept.
    const chunk =
      metadata.chunk !== undefined
        ? metadata.chunk
        : "unknown";

    const key = `${file}::${chunk}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    filteredDocuments.push(documents[i]);
    filteredMetadatas.push(metadata);
    filteredDistances.push(distances[i] ?? null);
  }

  return {
    documents: filteredDocuments,
    metadatas: filteredMetadatas,
    distances: filteredDistances,
  };
}

// ==========================================
// Build repository context
// ==========================================

function buildContext(documents, metadatas) {
  const chunks = [];

  let totalChars = 0;

  for (let index = 0; index < documents.length; index++) {
    const metadata = metadatas[index] || {};

    const truncatedDoc = truncate(
      documents[index],
      MAX_CHARS_PER_SOURCE
    );

    const block = [
      `========== SOURCE ${index + 1} ==========`,
      `File: ${metadata.file || "Unknown"}`,
      `Directory: ${metadata.directory || "Unknown"}`,
      `Language: ${metadata.language || "Unknown"}`,
      `Extension: ${metadata.extension || "Unknown"}`,
      `Type: ${metadata.type || "source"}`,
      `Chunk: ${
        metadata.chunk !== undefined
          ? `${metadata.chunk + 1}/${
              metadata.totalChunks || "?"
            }`
          : "Unknown"
      }`,
      "",
      truncatedDoc,
      "==========================================",
    ].join("\n");

    if (
      totalChars + block.length > MAX_TOTAL_CONTEXT_CHARS &&
      chunks.length > 0
    ) {
      log(
        `✂️ Context budget reached: ${chunks.length}/${documents.length} chunks`
      );

      break;
    }

    chunks.push(block);
    totalChars += block.length;
  }

  return chunks.join("\n\n");
}

// ==========================================
// System instruction
// ==========================================

const SYSTEM_INSTRUCTION = `
You are the AI assistant inside a Code Evolution Visualizer.

Your job is to answer questions about ONE specific software repository.

The repository context provided to you is your primary source of truth.

==========================================
STRICT GROUNDING RULES
==========================================

1. Use repository context whenever answering repository-specific questions.

2. NEVER invent:
   - files
   - folders
   - functions
   - classes
   - variables
   - APIs
   - dependencies
   - frameworks
   - architecture
   - database systems
   - implementation details

3. Do not assume that a common technology exists just because the
   repository appears to use a particular programming language.

4. If the retrieved context does not contain enough evidence, say:

"I don't have enough repository context to verify this."

5. Do not pretend that you inspected files that were not included
   in the context.

6. If only a portion of a file was retrieved, explicitly mention
   that the answer is based on the retrieved portion.

7. When possible, mention the exact file responsible for the behavior.

8. Distinguish clearly between:
   - facts directly visible in the repository
   - reasonable explanations of visible code

9. Do not provide generic programming advice unless the user
   explicitly asks for recommendations.

==========================================
FILES / DATASETS / TABLES
==========================================

10. When the user asks for FILES, return actual repository file
    paths only.

11. Never describe database tables, datasets, columns, concepts,
    or directories as files.

12. When the user asks for TECHNOLOGIES, return technologies,
    frameworks, libraries, runtimes, and dependencies only.

13. When the user asks for DATABASE TABLES or DATASETS, identify
    them as tables or datasets, not files.

14. Never convert a table name, dataset name, column name, or
    documentation concept into a file path unless the repository
    context explicitly shows that it is a file.

15. When asked which files perform a specific task, only return
    files for which the retrieved context provides direct evidence.

==========================================
CODE REVIEW
==========================================

16. Only report code issues when the retrieved source provides
    direct evidence.

17. Never report an issue using uncertain language such as:
    - might
    - could
    - possibly
    - appears to
    - seems to
    - likely
    - probably
    - may

18. For unused imports, only report them when the retrieved
    source clearly shows that the imported name is never referenced.

19. If the retrieved context is insufficient to verify an issue,
    say:

"I don't have enough repository context to confirm this issue."

20. If only part of a file was retrieved, never claim that you
    inspected the entire file.

Use:

"The retrieved portion of <file> shows..."

==========================================
ANSWER QUALITY
==========================================

Give useful, natural answers.

Do NOT simply repeat retrieved code.

Explain what the code means.

For code explanations, explain:

- What it does
- Important functions
- Important variables
- Control flow
- How the pieces interact
- Related files when they are actually present

For architecture questions:

- Identify actual components present
- Explain how they interact
- Mention relevant files
- Describe the data flow

For technology questions:

- Identify technologies directly supported by repository evidence
- Mention where they appear

For commit/development questions:

- Use repository analytics or commit information provided
- Do not invent historical events

==========================================
PROGRAMMING LANGUAGES
==========================================

When asked for programming languages, return only actual programming
languages.

Do NOT classify these as programming languages:

- requirements.txt
- dependency files
- package manifests
- YAML
- Markdown
- TOML

YAML, Markdown and TOML are configuration/documentation formats.

==========================================
DATABASE TABLES
==========================================

When asked for database tables, only identify a name as a database
table when the repository context explicitly identifies it as a table.

If a dataset name is mentioned but its type is unclear, say:

"The retrieved context mentions this dataset, but does not explicitly
identify it as a database table."

==========================================
TECHNOLOGY CLAIMS
==========================================

Do not infer capabilities that are not explicitly supported by
repository context.

For example, if Hugging Face is only shown as a dataset host,
do not claim that it provides model serving for this repository.

==========================================
RESPONSE STYLE
==========================================

Be concise but useful.

Use headings when they improve readability.

Use bullet points for multiple items.

Use code formatting when mentioning:

- files
- functions
- variables
- commands
- APIs

Prefer explanations that a software engineering student can understand.

Do not start every response with unnecessary phrases such as:

"Based on the repository context..."

==========================================
SOURCES
==========================================

At the end of the answer include:

Sources:
- file/path
- file/path

Only list files that actually contributed to the answer.

==========================================
IMPORTANT
==========================================

The retrieved repository context may be incomplete.

If the answer cannot be verified from the provided context,
be honest rather than guessing.
`;

// ==========================================
// Promise timeout
// ==========================================

function withTimeout(promise, ms, message) {
  let timeoutHandle;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(message));
    }, ms);
  });

  return Promise.race([
    promise,
    timeoutPromise,
  ]).finally(() => {
    clearTimeout(timeoutHandle);
  });
}

// ==========================================
// Generate Groq answer
// ==========================================

async function generateGroqAnswer(question, context) {
  if (!groq) {
    throw new Error(
      "Groq API is not configured. Please set GROQ_API_KEY in .env."
    );
  }

  const prompt = `
USER QUESTION
==========================================

${question}

==========================================

REPOSITORY CONTEXT
==========================================

${context}

==========================================

Answer the user's question using ONLY the repository context.

If the context is insufficient, say so instead of guessing.
`;

  let lastError;

  for (
    let attempt = 0;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
    try {
      const completion = await withTimeout(
        groq.chat.completions.create({
          model: CHAT_MODEL,

          messages: [
            {
              role: "system",
              content: SYSTEM_INSTRUCTION,
            },
            {
              role: "user",
              content: prompt,
            },
          ],

          temperature: 0.2,

          // Reduced from 2048 to save tokens.
          max_tokens: 1200,
        }),

        GROQ_TIMEOUT_MS,

        `Groq request timed out after ${GROQ_TIMEOUT_MS}ms`
      );

      const answer =
        completion.choices?.[0]?.message?.content?.trim();

      if (!answer) {
        throw new Error(
          "Groq returned an empty response."
        );
      }

      return answer;

    } catch (error) {
      lastError = error;

      // Never retry rate-limit errors.
      const isRateLimit =
        error.status === 429 ||
        error.code === "rate_limit_exceeded";

      const isRetryable =
        attempt < MAX_RETRIES &&
        !isRateLimit &&
        (
          error.status >= 500 ||
          error.message?.includes("fetch") ||
          error.message?.includes("timed out")
        );

      if (!isRetryable) {
        break;
      }

      log(
        `⏳ Retrying Groq call (attempt ${
          attempt + 2
        }/${MAX_RETRIES + 1})...`
      );

      await new Promise((resolve) =>
        setTimeout(
          resolve,
          500 * (attempt + 1)
        )
      );
    }
  }

  throw lastError;
}

// ==========================================
// Ask Repository Assistant
// ==========================================

async function askRepositoryAssistant(
  question,
  repositoryId
) {
  if (!question || !question.trim()) {
    throw new Error("Question is required.");
  }

  if (!repositoryId || !String(repositoryId).trim()) {
    throw new Error("Repository ID is required.");
  }

  const trimmedQuestion = question
    .trim()
    .slice(0, MAX_QUESTION_LENGTH);

  // ========================================
  // CACHE
  // ========================================

  const key = cacheKey(
    trimmedQuestion,
    repositoryId
  );

  const cached = getFromCache(key);

  if (cached) {
    log(
      "⚡ Cache hit for question:",
      trimmedQuestion
    );

    return cached;
  }

  log(
    "\n🤖 User Question:",
    trimmedQuestion
  );

  log(
    "📦 Repository ID:",
    repositoryId
  );

  try {
    // ========================================
    // STEP 1: Retrieve relevant chunks
    // ========================================

    const searchResults =
      await searchDocuments(
        trimmedQuestion,
        repositoryId,
        RESULT_COUNT
      );

    let documents =
      searchResults.documents?.[0] || [];

    let metadatas =
      searchResults.metadatas?.[0] || [];

    let distances =
      searchResults.distances?.[0] || [];

    if (documents.length === 0) {
      const emptyResult = {
        answer:
          "I couldn't find relevant information in the indexed repository.",
        sources: [],
      };

      setInCache(key, emptyResult);

      return emptyResult;
    }

    log(
      `🔎 Retrieved ${documents.length} chunks`
    );

    // ========================================
    // STEP 2: Sort by relevance
    // ========================================

    ({
      documents,
      metadatas,
      distances,
    } = sortByRelevance(
      documents,
      metadatas,
      distances
    ));

    // ========================================
    // STEP 3: Remove duplicate chunks
    // ========================================

    ({
      documents,
      metadatas,
      distances,
    } = removeDuplicateChunks(
      documents,
      metadatas,
      distances
    ));

    log(
      `📚 Using ${documents.length} unique chunks`
    );

    log(
      "\n📂 Retrieved Files by relevance:"
    );

    metadatas.forEach(
      (metadata, index) => {
        log(
          `${index + 1}. ${
            metadata.file || "Unknown"
          }`
        );
      }
    );

    // ========================================
    // STEP 4: Build context
    // ========================================

    const context = buildContext(
      documents,
      metadatas
    );

    log(
      `📖 Context size: ${context.length} characters`
    );

    // ========================================
    // STEP 5: Ask Groq
    // ========================================

    log(
      "🧠 Sending repository context to Groq..."
    );

    const answer =
      await generateGroqAnswer(
        trimmedQuestion,
        context
      );

    log(
      "✅ Groq answer generated"
    );

    // ========================================
    // STEP 6: Build sources
    // ========================================

    const sources = [
      ...new Map(
        metadatas.map(
          (metadata, index) => [
            metadata.file ||
              `Unknown-${index}`,

            {
              file:
                metadata.file ||
                "Unknown",

              directory:
                metadata.directory ||
                "Unknown",

              language:
                metadata.language ||
                "Unknown",

              type:
                metadata.type ||
                "source",

              problem:
                metadata.problem ||
                "Unknown",

              chunk:
                metadata.chunk ??
                null,

              distance:
                distances[index] ??
                null,
            },
          ]
        )
      ).values(),
    ];

    // ========================================
    // STEP 7: Cache result
    // ========================================

    const result = {
      answer,
      sources,
    };

    setInCache(
      key,
      result
    );

    return result;

  } catch (error) {

    console.error(
      "❌ Assistant Error:",
      error.response?.data ||
        error.error ||
        error.message ||
        error
    );

    throw error;
  }
}

// ==========================================
// Export
// ==========================================

module.exports = {
  askRepositoryAssistant,
};