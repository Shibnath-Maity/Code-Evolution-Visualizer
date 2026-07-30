const { ChromaClient } = require("chromadb");

const chroma = new ChromaClient({
  host: "127.0.0.1",
  port: 8000,
  ssl: false,
});

async function resetChroma() {
  try {
    await chroma.deleteCollection({
      name: "repository_knowledge",
    });

    console.log("🗑️ Old collection deleted");
    console.log("✅ ChromaDB reset successfully");

  } catch (error) {
    console.error("❌ Reset failed:");
    console.error(error.message);
  }
}

resetChroma();