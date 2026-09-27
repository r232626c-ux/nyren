/**
 * AI Router Debug & Monitoring Utility
 * Used for testing the multi-provider system
 */

const { routeAI, checkRouterHealth } = require("../ai/router/aiRouter");
const {
  getAvailableProviders,
} = require("../ai/router/fallbackManager");
const { decideModel } = require("../ai/router/decisionEngine");

/**
 * Test a simple message through all providers
 */
async function testRouterBasic(message = "Hello, how are you?") {
  console.log("\n========== AI Router Test ==========");
  console.log(`Testing message: "${message}"\n`);

  try {
    const startTime = Date.now();

    const result = await routeAI(
      [
        {
          role: "system",
          content: "You are a helpful AI assistant.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      {
        temperature: 0.7,
        max_tokens: 512,
      }
    );

    const duration = Date.now() - startTime;

    console.log(`✓ Status: ${result.status}`);
    console.log(`✓ Provider Used: ${result.provider}`);
    console.log(`✓ Decision Reason: ${result.decision}`);
    console.log(
      `✓ Response Time: ${duration}ms (attempt ${result.attemptNumber}/${result.totalAttempts})`
    );
    console.log(`\nResponse:\n${result.message}\n`);

    return result;
  } catch (err) {
    console.error("✗ Router test failed:", err.message);
    throw err;
  }
}

/**
 * Test different message types and see which provider gets selected
 */
async function testDecisionEngine() {
  console.log("\n========== Decision Engine Test ==========\n");

  const testMessages = [
    {
      text: "Hi",
      description: "Short greeting",
    },
    {
      text: "Can you explain the theory of relativity in detail, step by step?",
      description: "Complex reasoning request",
    },
    {
      text: "What is the current weather?",
      description: "Search-oriented query",
    },
    {
      text:
        "Write a function that sorts an array using quicksort algorithm, explain each step",
      description: "Complex coding with explanation",
    },
  ];

  for (const test of testMessages) {
    try {
      const decision = await decideModel(test.text, {});
      console.log(`${test.description}:`);
      console.log(`  Message length: ${test.text.length}`);
      console.log(`  Selected: ${decision.provider}`);
      console.log(`  Reason: ${decision.reason}\n`);
    } catch (err) {
      console.error(
        `Error testing "${test.description}":`,
        err.message
      );
    }
  }
}

/**
 * Check system health
 */
async function checkSystemHealth() {
  console.log("\n========== System Health Check ==========\n");

  try {
    const health = await checkRouterHealth();
    const available = await getAvailableProviders();

    console.log(`✓ Router Health: ${health.healthy ? "HEALTHY" : "DEGRADED"}`);
    console.log(`✓ Available Providers: ${available.join(", ") || "NONE"}`);
    console.log(`✓ Timestamp: ${health.timestamp}`);

    console.log("\nEnvironment Configuration:");
    console.log(`  GROQ_API_KEY: ${process.env.GROQ_API_KEY ? "✓ Set" : "✗ Missing"}`);
    console.log(
      `  OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? "✓ Set" : "✗ Missing"}`
    );
    console.log(
      `  HUGGINGFACE_API_KEY: ${process.env.HUGGINGFACE_API_KEY ? "✓ Set" : "✗ Missing"}`
    );
    console.log(
      `  OLLAMA_BASE_URL: ${process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"}`
    );

    return health;
  } catch (err) {
    console.error("Health check failed:", err.message);
    throw err;
  }
}

/**
 * Run comprehensive test suite
 */
async function runFullTest() {
  console.log("\n🧠 FULL AI ROUTER TEST SUITE");
  console.log("============================\n");

  try {
    // 1. Health check
    await checkSystemHealth();

    // 2. Decision engine
    await testDecisionEngine();

    // 3. Basic router test
    await testRouterBasic();

    console.log("\n✓ All tests completed successfully!");
  } catch (err) {
    console.error("\n✗ Test suite failed:", err.message);
  }
}

// Export for use in CLI or tests
module.exports = {
  testRouterBasic,
  testDecisionEngine,
  checkSystemHealth,
  runFullTest,
};

// Run if executed directly
if (require.main === module) {
  runFullTest().catch(console.error);
}
