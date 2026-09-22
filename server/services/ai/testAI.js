require("dotenv").config();

const aiGateway = require("./aiGateway");

async function test() {
  try {
    const result = await aiGateway.generate(
      "Reply with exactly: AI Gateway Working"
    );

    console.log("\n==========================");
    console.log("RESULT:", result.content);
    console.log("PROVIDER:", result.provider);
    console.log("MODEL:", result.model);
    console.log("==========================");
  } catch (error) {
    console.error("FINAL ERROR:", error);
  }
}

test();