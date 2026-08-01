const axios = require("axios");
const { ChromaClient } = require("chromadb");

const OLLAMA_URL = "http://localhost:11434";
const COLLECTION_NAME = "repository_knowledge";

// ==========================================
// Connect to ChromaDB
// ==========================================

const chroma = new ChromaClient({
  host: "127.0.0.1",
  port: 8000,
  ssl: false,
});

// ==========================================
// Config: manifest files & scoring weights
// (single source of truth, was duplicated
// 3x in the original)
// ==========================================

const MANIFEST_FILES = new Set([
  "package.json",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "requirements.txt",
  "pyproject.toml",
  "cargo.toml",
  "go.mod",
]);

const CODE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".java",
  ".py",
]);

const CONFIG_EXTENSIONS = new Set([
  ".json",
  ".xml",
  ".yaml",
  ".yml",
]);

const WEIGHTS = {
  semantic: 5,
  keywordInText: 1,
  keywordInFile: 4,
  keywordInFileName: 5,
  keywordInDirectory: 3,
  exactFileNameMatch: 100,
  fileEndsWithName: 80,
  exactPathMentioned: 80,
  fileNameMentioned: 50,
  summaryOverview: 40,
  summaryTechnology: 35,
  summaryFileQuestion: 30,
  summaryArchitecture: 30,
  summaryGeneric: 5,
  readmeCore: 15,
  readmeDependency: 8,
  techSummaryBoost: 25,
  techManifestBoost: 30,
  techConfigExtBoost: 5,
  dependencyManifestBoost: 50,
  dependencyReadmeBoost: 10,
  apiPathMatch: 15,
  apiFileNameMatch: 15,
  apiExtensionMatch: 5,
  architectureSummary: 30,
  architectureCorePath: 10,
  architectureReadme: 15,
  fileQuestionSummary: 30,
  fileQuestionHasFileName: 3,
  sourceCodeGeneric: 3,
  codeReviewSource: 30,
  codeReviewExtension: 20,
  // Step 2: repository summaries are useful context for code-review
  // questions too (they orient the LLM on architecture before it looks
  // at individual files), so this is now a boost instead of a penalty.
  codeReviewSummaryBoost: 35,
};

const CANDIDATE_POOL_SIZE =
  Number(process.env.RAG_CANDIDATE_POOL_SIZE) || 30;

// ==========================================
// Create Embedding using Ollama
// ==========================================
async function createEmbedding(text) {
  if (!text || !text.trim()) {
    throw new Error("Cannot create embedding: empty text.");
  }

  try {
    console.log("Embedding input:", text);

    const response = await axios.post(`${OLLAMA_URL}/api/embed`, {
      model: "nomic-embed-text",
      input: text,
    });

    const embedding = response.data.embeddings?.[0];

    if (!embedding) {
      console.error("Ollama returned:", response.data);
      throw new Error("Embedding not returned by Ollama.");
    }

    return embedding;
  } catch (error) {
    console.error("Embedding Error:", error.response?.data || error.message);
    throw error;
  }
}

// ==========================================
// Get / Create Chroma Collection
// ==========================================

async function getCollection() {
  return chroma.getOrCreateCollection({
    name: COLLECTION_NAME,
    embeddingFunction: null,
  });
}

// ==========================================
// Add Document to ChromaDB
// ==========================================

async function addDocument(id, text, metadata = {}) {
  try {
    const collection = await getCollection();
    const embedding = await createEmbedding(text);

    console.log("📦 Metadata being stored:", metadata);

    await collection.add({
      ids: [id],
      documents: [text],
      embeddings: [embedding],
      metadatas: [metadata],
    });

    console.log(`Document added to ChromaDB: ${id}`);
  } catch (error) {
    console.error("ChromaDB Add Error:", error.message);
    throw error;
  }
}

// ==========================================
// Query classification helpers
// ==========================================

function normalizeQuery(query) {
  return query.toLowerCase().replace(/\\/g, "/").trim();
}

function includesAny(text, phrases) {
  return phrases.some((phrase) => text.includes(phrase));
}

function classifyQuestion(q) {
  const isOverview = includesAny(q, [
    "overview",
    "repository overview",
    "project overview",
    "repository structure",
    "project structure",
    "main components",
    "main parts",
    "what does this repo contain",
    "what does this repository contain",
    "what does this project contain",
    "how is this repository organized",
    "how is this project organized",
  ]);

  const isTechnology = includesAny(q, [
    "technology",
    "technologies",
    "framework",
    "frameworks",
    "library",
    "libraries",
    "database",
    "databases",
    "language",
    "languages",
    "tech stack",
    "stack",
  ]);

  const isDependency = includesAny(q, [
    "dependency",
    "dependencies",
    "package",
    "packages",
    "external library",
    "external libraries",
  ]);

  const isApi = includesAny(q, [
    "api",
    "endpoint",
    "endpoints",
    "route",
    "routes",
    "controller",
    "controllers",
  ]);

  const isArchitecture = includesAny(q, [
    "architecture",
    "flow",
    "components interact",
    "how does the project work",
    "how does this project work",
    "how do the components interact",
  ]);

  const isFileQuestion = includesAny(q, [
    "file",
    "files",
    "folder",
    "directory",
    "directories",
  ]);

  const isCodeReview = includesAny(q, [
    "improvement",
    "improve",
    "refactor",
    "review",
    "code quality",
    "best practice",
    "bug",
    "optimize",
    "suggest",
    "issue",
    "issues",
    "problem",
    "problems",
    "security",
    "performance",
    "maintainability",
    "readability",
    "clean code",
  ]);

  return {
    isOverview,
    isTechnology,
    isDependency,
    isApi,
    isArchitecture,
    isFileQuestion,
    isCodeReview,
  };
}

function extractQueryWords(q) {
  return q.split(/[^a-zA-Z0-9_.-]+/).filter((word) => word.length > 2);
}

const FILE_EXTENSION_PATTERN =
  /\.(js|jsx|ts|tsx|java|py|c|cpp|h|hpp|html|css|scss|json|md|xml|yml|yaml|sql)$/;

function findMentionedFileName(queryWords) {
  return queryWords.find((word) => FILE_EXTENSION_PATTERN.test(word));
}

// ==========================================
// Scoring
// ==========================================

function scoreCandidate({ document, metadata, distance, queryWords, q, signals, possibleFileName }) {
  const text = document.toLowerCase();
  const file = (metadata.file || "").toLowerCase().replace(/\\/g, "/");
  const fileName = (metadata.fileName || "").toLowerCase();
  const directory = (metadata.directory || "").toLowerCase().replace(/\\/g, "/");
  const extension = (metadata.extension || "").toLowerCase();
  const type = (metadata.type || "").toLowerCase();

  const {
    isOverview,
    isTechnology,
    isDependency,
    isApi,
    isArchitecture,
    isFileQuestion,
    isCodeReview,
    isSpecificFileQuestion,
  } = signals;

  let score = 0;

  // Semantic similarity
  const semanticSimilarity = Math.max(0, 1 - distance);
  score += semanticSimilarity * WEIGHTS.semantic;

  // Keyword matching
  for (const word of queryWords) {
    if (text.includes(word)) score += WEIGHTS.keywordInText;
    if (file.includes(word)) score += WEIGHTS.keywordInFile;
    if (fileName.includes(word)) score += WEIGHTS.keywordInFileName;
    if (directory.includes(word)) score += WEIGHTS.keywordInDirectory;
  }

  // Exact file targeting (single boost path — the original applied this
  // twice: once for isSpecificFileQuestion, once again unconditionally)
  if (possibleFileName && fileName === possibleFileName) {
    score += isSpecificFileQuestion
      ? WEIGHTS.exactFileNameMatch
      : WEIGHTS.exactFileNameMatch * 0.6;
  } else if (isSpecificFileQuestion && possibleFileName && file.endsWith("/" + possibleFileName)) {
    score += WEIGHTS.fileEndsWithName;
  }

  if (file && q.includes(file)) score += WEIGHTS.exactPathMentioned;
  if (fileName && q.includes(fileName)) score += WEIGHTS.fileNameMentioned;

  // Repository summary
  if (type === "repository_summary") {
    if (isOverview) score += WEIGHTS.summaryOverview;
    if (isTechnology) score += WEIGHTS.summaryTechnology;
    if (isFileQuestion) score += WEIGHTS.summaryFileQuestion;
    if (isArchitecture) score += WEIGHTS.summaryArchitecture;

    if (!isOverview && !isTechnology && !isFileQuestion && !isArchitecture) {
      score += WEIGHTS.summaryGeneric;
    }
  }

  // README boost
  if (fileName === "readme.md") {
    if (isOverview || isTechnology || isArchitecture) score += WEIGHTS.readmeCore;
    if (isDependency) score += WEIGHTS.readmeDependency;
  }

  // Technology question
  if (isTechnology) {
    if (type === "repository_summary") score += WEIGHTS.techSummaryBoost;
    if (MANIFEST_FILES.has(fileName)) score += WEIGHTS.techManifestBoost;
    if (CONFIG_EXTENSIONS.has(extension)) score += WEIGHTS.techConfigExtBoost;
  }

  // Dependency question
  if (isDependency) {
    if (MANIFEST_FILES.has(fileName)) score += WEIGHTS.dependencyManifestBoost;
    if (fileName === "readme.md") score += WEIGHTS.dependencyReadmeBoost;
  }

  // API question
  if (isApi) {
    const pathHints = ["route", "routes", "controller", "controllers", "api", "server", "app"];
    if (pathHints.some((hint) => file.includes(hint))) score += WEIGHTS.apiPathMatch;

    const nameHints = ["route", "controller", "server", "app"];
    if (nameHints.some((hint) => fileName.includes(hint))) score += WEIGHTS.apiFileNameMatch;

    if (CODE_EXTENSIONS.has(extension)) score += WEIGHTS.apiExtensionMatch;
  }

  // Architecture question
  if (isArchitecture) {
    if (type === "repository_summary") score += WEIGHTS.architectureSummary;

    const corePaths = ["server", "app", "src", "controller", "controllers", "service", "services", "route", "routes"];
    if (corePaths.some((hint) => file.includes(hint))) score += WEIGHTS.architectureCorePath;

    if (fileName === "readme.md") score += WEIGHTS.architectureReadme;
  }

  // File / directory question
  if (isFileQuestion) {
    if (type === "repository_summary") score += WEIGHTS.fileQuestionSummary;
    if (fileName) score += WEIGHTS.fileQuestionHasFileName;
  }

  // Plain source code, no special intent detected
  if (
    type === "source" &&
    !isOverview &&
    !isTechnology &&
    !isDependency &&
    !isArchitecture &&
    !isFileQuestion
  ) {
    score += WEIGHTS.sourceCodeGeneric;
  }

  // Code review question
  if (isCodeReview) {
    if (type === "source") score += WEIGHTS.codeReviewSource;
    if (CODE_EXTENSIONS.has(extension)) score += WEIGHTS.codeReviewExtension;
    // Step 2: boost (not penalize) repository summaries on code-review
    // questions, so the LLM gets architecture context alongside source.
    if (type === "repository_summary") score += WEIGHTS.codeReviewSummaryBoost;
  }

  return score;
}

function logRanking(finalResults) {
  console.log("\n🎯 Ranked Results:");

  finalResults.forEach((item, index) => {
    const displayName =
      item.metadata?.type === "repository_summary"
        ? "REPOSITORY_SUMMARY"
        : item.metadata?.file || "unknown";

    console.log(`${index + 1}. ${displayName}`);
    console.log(`   Type: ${item.metadata?.type || "unknown"}`);
    console.log(`   Score: ${item.score.toFixed(3)}`);
    console.log(`   Distance: ${item.distance}`);
  });
}

// ==========================================
// Search Repository Knowledge
// ==========================================

async function searchDocuments(
  query,
  repositoryId,
  limit = 8,
  targetFile = null
) {
  try {
    const collection = await getCollection();
    const queryEmbedding = await createEmbedding(query);

    console.log("========== QUERY EMBEDDING ==========");
    console.log("Exists:", !!queryEmbedding);
    console.log("Is Array:", Array.isArray(queryEmbedding));
    console.log("Length:", queryEmbedding?.length);
    console.log("First 5:", queryEmbedding?.slice(0, 5));

    console.log("Calling ChromaDB query...");
  let where;

if (targetFile) {
  where = {
    $and: [
      { repositoryId },
      { fileName: targetFile }
    ]
  };
} else {
  where = {
    repositoryId
  };
}
    // Step 1: pull a wide candidate pool from Chroma and let our own
    // scoring/ranking narrow it down, instead of asking Chroma for only
    // `limit` (8) results up front — that starved the ranker of anything
    // to rank. Targeted single-file lookups stay tight since there's
    // nothing to rank there.
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: targetFile ? 3 : CANDIDATE_POOL_SIZE,
      where,
    });

    console.log("ChromaDB query successful!");
    const documents = results.documents?.[0] || [];
    const metadatas = results.metadatas?.[0] || [];
    const distances = results.distances?.[0] || [];

    console.log(`📚 Chroma retrieved ${documents.length} candidates`);

    if (documents.length === 0) {
      return { documents: [[]], metadatas: [[]], distances: [[]] };
    }

    const q = normalizeQuery(query);
    const questionType = classifyQuestion(q);
    const queryWords = extractQueryWords(q);
    const possibleFileName = findMentionedFileName(queryWords);

    const signals = {
      ...questionType,
      isSpecificFileQuestion:
        !!possibleFileName ||
        q.includes("implementation of") ||
        q.includes("code in") ||
        q.includes("explain the code") ||
        q.includes("explain this file"),
    };

    const ranked = documents
      .map((document, index) => {
        const metadata = metadatas[index] || {};
        const distance = distances[index] ?? 1;

        const score = scoreCandidate({
          document,
          metadata,
          distance,
          queryWords,
          q,
          signals,
          possibleFileName,
        });

        return { document, metadata, distance, score };
      })
      .sort((a, b) => b.score - a.score);

    // Step 3: for repository-wide questions, guarantee the repository
    // summary is present at the top even if its score didn't happen to
    // win the ranking — the LLM needs that orienting context before
    // diving into individual files.
    if (
      signals.isOverview ||
      signals.isArchitecture ||
      signals.isTechnology ||
      signals.isCodeReview
    ) {
      const summaryIndex = ranked.findIndex(
        (r) => r.metadata.type === "repository_summary"
      );

      if (summaryIndex > 0) {
        const [summary] = ranked.splice(summaryIndex, 1);
        ranked.unshift(summary);
      }
    }

    let finalLimit = limit;

    if (signals.isOverview) finalLimit = 12;
    if (signals.isCodeReview) finalLimit = 15;
    if (signals.isArchitecture) finalLimit = 12;

    const finalResults = ranked.slice(0, finalLimit);

    logRanking(finalResults);

    return {
      documents: [finalResults.map((item) => item.document)],
      metadatas: [finalResults.map((item) => item.metadata)],
      distances: [finalResults.map((item) => item.distance)],
    };
  } catch (error) {
    console.error("ChromaDB Search Error:", error.message);
    throw error;
  }
}

// ==========================================
// Delete ChromaDB Collection
// ==========================================

async function deleteCollection() {
  try {
    await chroma.deleteCollection({ name: COLLECTION_NAME });
    console.log("🗑️ Collection deleted");
  } catch (error) {
    console.log("Collection delete error:", error.message);
  }
}

// ==========================================
// Exports
// ==========================================

module.exports = {
  createEmbedding,
  getCollection,
  addDocument,
  searchDocuments,
  deleteCollection,
};