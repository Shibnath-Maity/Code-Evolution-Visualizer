const {
  deleteCollection,
  getCollection,
} = require("./services/ragService");

async function reset() {
  try {
    console.log("🗑️ Deleting old collection...");

    await deleteCollection();

    console.log("📦 Creating fresh collection...");

    await getCollection();

    console.log("✅ ChromaDB collection reset successfully");

  } catch (error) {
    console.error("❌ Reset failed:", error);
  }
}

reset();