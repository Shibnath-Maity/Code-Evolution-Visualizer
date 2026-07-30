const { deleteCollection } = require("./services/ragService");

async function main() {
  try {
    await deleteCollection();
    console.log("✅ ChromaDB collection deleted successfully");
  } catch (error) {
    console.error("❌ Failed to delete collection:");
    console.error(error.message);
  }
}

main();