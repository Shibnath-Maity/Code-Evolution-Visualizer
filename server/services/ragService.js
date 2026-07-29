const axios = require("axios");
const { ChromaClient } = require("chromadb");

const OLLAMA_URL = "http://localhost:11434";

// ==========================================
// Connect to ChromaDB
// ==========================================

const chroma = new ChromaClient({
  host: "127.0.0.1",
  port: 8000,
  ssl: false,
});

// ==========================================
// Create Embedding using Ollama
// ==========================================

async function createEmbedding(text) {
  try {
    const response = await axios.post(
      `${OLLAMA_URL}/api/embed`,
      {
        model: "nomic-embed-text",
        input: text,
      }
    );

    return response.data.embeddings[0];

  } catch (error) {
    console.error(
      "Embedding Error:",
      error.response?.data || error.message
    );

    throw error;
  }
}

// ==========================================
// Get / Create Chroma Collection
// ==========================================

async function getCollection() {
  const collection =
    await chroma.getOrCreateCollection({
      name: "repository_knowledge",
      embeddingFunction: null,
    });

  return collection;
}

// ==========================================
// Add Document to ChromaDB
// ==========================================

async function addDocument(
  id,
  text,
  metadata = {}
) {
  try {
    const collection = await getCollection();

    const embedding = await createEmbedding(text);

    console.log("📦 Metadata being stored:");
    console.log(metadata);

    await collection.add({
      ids: [id],
      documents: [text],
      embeddings: [embedding],
      metadatas: [metadata],
    });

    console.log(
      `Document added to ChromaDB: ${id}`
    );

  } catch (error) {
    console.error(
      "ChromaDB Add Error:",
      error.message
    );

    throw error;
  }
}

// ==========================================
// Search Repository Knowledge
// ==========================================

async function searchDocuments(
  query,
  repositoryId,
  limit = 8
) {
  try {
    const collection = await getCollection();

    // ==========================================
    // 1. Create embedding for user question
    // ==========================================

    const queryEmbedding =
      await createEmbedding(query);

    // ==========================================
    // 2. Retrieve many candidates
    // ==========================================

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: 30,
      where: {
        repositoryId: repositoryId,
      },
    });

    const documents =
      results.documents?.[0] || [];

    const metadatas =
      results.metadatas?.[0] || [];

    const distances =
      results.distances?.[0] || [];

    console.log(
      `📚 Chroma retrieved ${documents.length} candidates`
    );

    // ==========================================
    // No results
    // ==========================================

    if (documents.length === 0) {
      return {
        documents: [[]],
        metadatas: [[]],
        distances: [[]],
      };
    }

    // ==========================================
    // 3. Normalize query
    // ==========================================

    const q = query
      .toLowerCase()
      .replace(/\\/g, "/")
      .trim();

    // ==========================================
    // 4. Detect question type
    // ==========================================

const isOverview =
  q.includes("overview") ||
  q.includes("repository overview") ||
  q.includes("project overview") ||
  q.includes("repository structure") ||
  q.includes("project structure") ||
  q.includes("main components") ||
  q.includes("main parts") ||
  q.includes("what does this repo contain") ||
  q.includes("what does this repository contain") ||
  q.includes("what does this project contain") ||
  q.includes("how is this repository organized") ||
  q.includes("how is this project organized");   

    const isTechnology =
      q.includes("technology") ||
      q.includes("technologies") ||
      q.includes("framework") ||
      q.includes("frameworks") ||
      q.includes("library") ||
      q.includes("libraries") ||
      q.includes("database") ||
      q.includes("databases") ||
      q.includes("language") ||
      q.includes("languages") ||
      q.includes("tech stack") ||
      q.includes("stack");

    const isDependency =
      q.includes("dependency") ||
      q.includes("dependencies") ||
      q.includes("package") ||
      q.includes("packages") ||
      q.includes("external library") ||
      q.includes("external libraries");

    const isApi =
      q.includes("api") ||
      q.includes("endpoint") ||
      q.includes("endpoints") ||
      q.includes("route") ||
      q.includes("routes") ||
      q.includes("controller") ||
      q.includes("controllers");

    const isArchitecture =
      q.includes("architecture") ||
      q.includes("flow") ||
      q.includes("components interact") ||
      q.includes("how does the project work") ||
      q.includes("how does this project work") ||
      q.includes("how do the components interact");

    const isFileQuestion =
      q.includes("file") ||
      q.includes("files") ||
      q.includes("folder") ||
      q.includes("directory") ||
      q.includes("directories");

    // ==========================================
    // 5. Extract query words
    // ==========================================

    const queryWords = q
      .split(/[^a-zA-Z0-9_.-]+/)
      .filter(word => word.length > 2);

    // ==========================================
    // 6. Try to detect an exact filename
    // ==========================================

    const possibleFileName =
      queryWords.find(word =>
        /\.(js|jsx|ts|tsx|java|py|c|cpp|h|hpp|html|css|scss|json|md|xml|yml|yaml|sql)$/
          .test(word)
      );
// ==========================================
// Detect whether this is a specific-file question
// ==========================================

const isSpecificFileQuestion =
  !!possibleFileName ||
  q.includes("implementation of") ||
  q.includes("code in") ||
  q.includes("explain the code") ||
  q.includes("explain this file");
    // ==========================================
    // 7. Rank candidates
    // ==========================================

    const ranked = documents.map(
      (document, index) => {

        const metadata =
          metadatas[index] || {};

        const distance =
          distances[index] ?? 1;

        const text =
          document.toLowerCase();

        const file =
          (metadata.file || "")
            .toLowerCase()
            .replace(/\\/g, "/");

        const fileName =
          (metadata.fileName || "")
            .toLowerCase();

        const directory =
          (metadata.directory || "")
            .toLowerCase()
            .replace(/\\/g, "/");

        const extension =
          (metadata.extension || "")
            .toLowerCase();

        const type =
          (metadata.type || "")
            .toLowerCase();

        const language =
          (metadata.language || "")
            .toLowerCase();

        let score = 0;
// ========================================
// Exact file retrieval boost
// ========================================

if (isSpecificFileQuestion && possibleFileName) {
  if (fileName === possibleFileName) {
    score += 100;
  }

  if (file.endsWith("/" + possibleFileName)) {
    score += 80;
  }
}
        // ========================================
        // A. Semantic similarity
        // ========================================

        score += (1 - distance) * 5;

        // ========================================
        // B. Keyword matching
        // ========================================

        for (const word of queryWords) {

          if (text.includes(word)) {
            score += 1;
          }

          if (file.includes(word)) {
            score += 4;
          }

          if (fileName.includes(word)) {
            score += 5;
          }

          if (directory.includes(word)) {
            score += 3;
          }
        }

        // ========================================
        // C. Exact filename match
        // ========================================

        if (
          possibleFileName &&
          fileName === possibleFileName
        ) {
          score += 60;
        }

        // ========================================
        // D. Exact path match
        // ========================================

        if (
          file &&
          q.includes(file)
        ) {
          score += 80;
        }

        // ========================================
        // E. Exact filename mentioned anywhere
        // ========================================

        if (
          fileName &&
          q.includes(fileName)
        ) {
          score += 50;
        }

        // ========================================
        // F. Repository Summary
        // ========================================

        if (
          type === "repository_summary"
        ) {

          if (isOverview) {
            score += 40;
          }

          if (isTechnology) {
            score += 35;
          }

          if (isFileQuestion) {
            score += 30;
          }

          if (isArchitecture) {
            score += 30;
          }

          // Don't give summary too much
          // priority for specific code questions
          if (
            !isOverview &&
            !isTechnology &&
            !isFileQuestion &&
            !isArchitecture
          ) {
            score += 5;
          }
        }

        // ========================================
        // G. README boost
        // ========================================

        if (
          fileName === "readme.md"
        ) {

          if (
            isOverview ||
            isTechnology ||
            isArchitecture
          ) {
            score += 15;
          }

          if (isDependency) {
            score += 8;
          }
        }

        // ========================================
        // H. Technology question
        // ========================================

        if (isTechnology) {

          if (
            type === "repository_summary"
          ) {
            score += 25;
          }

          if (
            fileName === "package.json" ||
            fileName === "pom.xml" ||
            fileName === "build.gradle" ||
            fileName === "build.gradle.kts" ||
            fileName === "requirements.txt" ||
            fileName === "pyproject.toml" ||
            fileName === "cargo.toml" ||
            fileName === "go.mod"
          ) {
            score += 30;
          }

          if (
            extension === ".json" ||
            extension === ".xml" ||
            extension === ".yaml" ||
            extension === ".yml"
          ) {
            score += 5;
          }
        }

        // ========================================
        // I. Dependency question
        // ========================================

        if (isDependency) {

          if (
            fileName === "package.json" ||
            fileName === "pom.xml" ||
            fileName === "build.gradle" ||
            fileName === "build.gradle.kts" ||
            fileName === "requirements.txt" ||
            fileName === "pyproject.toml" ||
            fileName === "cargo.toml" ||
            fileName === "go.mod"
          ) {
            score += 50;
          }

          if (
            fileName === "readme.md"
          ) {
            score += 10;
          }
        }

        // ========================================
        // J. API question
        // ========================================

        if (isApi) {

          if (
            file.includes("route") ||
            file.includes("routes") ||
            file.includes("controller") ||
            file.includes("controllers") ||
            file.includes("api") ||
            file.includes("server") ||
            file.includes("app")
          ) {
            score += 15;
          }

          if (
            fileName.includes("route") ||
            fileName.includes("controller") ||
            fileName.includes("server") ||
            fileName.includes("app")
          ) {
            score += 15;
          }

          if (
            extension === ".js" ||
            extension === ".jsx" ||
            extension === ".ts" ||
            extension === ".tsx" ||
            extension === ".java" ||
            extension === ".py"
          ) {
            score += 5;
          }
        }

        // ========================================
        // K. Architecture question
        // ========================================

        if (isArchitecture) {

          if (
            type === "repository_summary"
          ) {
            score += 30;
          }

          if (
            file.includes("server") ||
            file.includes("app") ||
            file.includes("src") ||
            file.includes("controller") ||
            file.includes("controllers") ||
            file.includes("service") ||
            file.includes("services") ||
            file.includes("route") ||
            file.includes("routes")
          ) {
            score += 10;
          }

          if (
            fileName === "readme.md"
          ) {
            score += 15;
          }
        }

        // ========================================
        // L. File / directory question
        // ========================================

        if (isFileQuestion) {

          if (
            type === "repository_summary"
          ) {
            score += 30;
          }

          if (
            fileName
          ) {
            score += 3;
          }
        }

        // ========================================
        // M. Source code boost
        // ========================================

        if (
          type === "source" &&
          !isOverview &&
          !isTechnology &&
          !isDependency &&
          !isArchitecture &&
          !isFileQuestion
        ) {
          score += 3;
        }

        return {
          document,
          metadata,
          distance,
          score,
        };
      }
    );

    // ==========================================
    // 8. Sort highest score first
    // ==========================================

    ranked.sort(
      (a, b) => b.score - a.score
    );

    // ==========================================
    // 9. Select top results
    // ==========================================

let finalLimit = limit;

if (
  isOverview ||
  isTechnology ||
  isDependency ||
  isApi ||
  isArchitecture
) {
  finalLimit = 10;
}

const finalResults =
  ranked.slice(0, finalLimit);
    // ==========================================
    // 10. Debug ranking
    // ==========================================

    console.log("\n🎯 Ranked Results:");

finalResults.forEach((item, index) => {

  const displayName =
    item.metadata?.type === "repository_summary"
      ? "REPOSITORY_SUMMARY"
      : item.metadata?.file || "unknown";

  console.log(
    `${index + 1}. ${displayName}`
  );

  console.log(
    `   Type: ${
      item.metadata?.type || "unknown"
    }`
  );

  console.log(
    `   Score: ${item.score.toFixed(3)}`
  );

  console.log(
    `   Distance: ${item.distance}`
  );
});
      
    // ==========================================
    // 11. Return results
    // ==========================================

    return {
      documents: [
        finalResults.map(
          item => item.document
        ),
      ],

      metadatas: [
        finalResults.map(
          item => item.metadata
        ),
      ],

      distances: [
        finalResults.map(
          item => item.distance
        ),
      ],
    };

  } catch (error) {

    console.error(
      "ChromaDB Search Error:",
      error.message
    );

    throw error;
  }
}

// ==========================================
// Delete ChromaDB Collection
// ==========================================

async function deleteCollection() {
  try {

    await chroma.deleteCollection({
      name: "repository_knowledge",
    });

    console.log(
      "🗑️ Collection deleted"
    );

  } catch (error) {

    console.log(
      "Collection delete error:",
      error.message
    );
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