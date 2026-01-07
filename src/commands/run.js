/**
 * loopship run - Start the Ralph loop
 * Orchestrates AI agents to complete stories from prd.json
 */

import fs from "node:fs/promises";
import path from "node:path";
import { runLoop } from "../lib/loop.js";
import { Reporter } from "../lib/reporter.js";
import { isAgentAvailable, AGENTS } from "../lib/agent.js";

export async function run(options) {
  const {
    agent = "claude",
    maxIterations = 25,
    maxRetries = 3,
    timeout = 10,
    browser = false,
    verbose = false,
    dryRun = false,
    webhook = null,
  } = options;

  const cwd = process.cwd();

  // Header
  console.log("");
  console.log("🚀 LoopShip Run");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Check agent availability
  const available = await isAgentAvailable(agent);
  if (!available) {
    console.error(`❌ Agent '${agent}' not found in PATH`);
    console.error("");
    console.error("   Install Claude Code:");
    console.error("   npm install -g @anthropic-ai/claude-code");
    console.error("");
    console.error("   Or install Codex:");
    console.error("   npm install -g @openai/codex");
    console.error("");
    process.exit(1);
  }

  const agentInfo = AGENTS[agent];
  console.log(`🤖 Agent: ${agentInfo.name} (${agent})`);
  console.log(`🔄 Max iterations: ${maxIterations}`);
  console.log(`🔁 Max retries per story: ${maxRetries}`);
  console.log(`⏱️  Timeout per story: ${timeout} minutes`);
  console.log(`🌐 Browser verification: ${browser ? "enabled" : "disabled"}`);
  if (verbose) console.log(`📝 Verbose output: enabled`);
  if (webhook) console.log(`🔔 Webhook: ${webhook}`);
  console.log("");

  // Load and validate prd.json
  let prd;
  try {
    const prdPath = path.join(cwd, "prd.json");
    prd = JSON.parse(await fs.readFile(prdPath, "utf-8"));
  } catch (err) {
    console.error("❌ Could not load prd.json");
    console.error("   Run: loopship init \"your feature\" first");
    console.error("");
    process.exit(1);
  }

  // Validate PRD structure
  if (!prd.stories || !Array.isArray(prd.stories)) {
    console.error("❌ Invalid prd.json: missing 'stories' array");
    process.exit(1);
  }

  console.log(`📋 Project: ${prd.project || "unnamed"}`);
  console.log(`🌿 Branch: ${prd.branchName || "main"}`);
  console.log(`📝 Description: ${prd.description || "(none)"}`);
  console.log("");

  // Show stories
  const remaining = prd.stories.filter((s) => !s.passes);
  const completed = prd.stories.filter((s) => s.passes);
  
  console.log(`📊 Progress: ${completed.length}/${prd.stories.length} stories complete`);
  console.log("");

  if (remaining.length === 0) {
    console.log("✅ All stories already complete!");
    console.log("");
    return;
  }

  console.log("📋 Stories:");
  for (const story of prd.stories) {
    const status = story.passes ? "✅" : story.blocked ? "🚫" : "⏳";
    const browserIcon = story.requiresBrowser ? " 🌐" : "";
    console.log(`   ${status} ${story.id}. ${story.title}${browserIcon}`);
  }
  console.log("");

  // Ensure progress.txt exists
  const progressPath = path.join(cwd, "progress.txt");
  try {
    await fs.access(progressPath);
  } catch {
    await fs.writeFile(
      progressPath,
      `# Progress Log\n\nProject: ${prd.project || "unnamed"}\nStarted: ${new Date().toISOString()}\n\n## Learnings\n\n`
    );
    console.log("📝 Created progress.txt");
    console.log("");
  }

  // Dry run mode - just show what would happen
  if (dryRun) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🧪 DRY RUN - Would execute:");
    console.log("");
    for (const story of remaining) {
      console.log(`   📖 Story ${story.id}: ${story.title}`);
      console.log(`      → ${agent} would implement this`);
      if (story.requiresBrowser) {
        console.log(`      → Browser would verify: ${story.verifyUrl || "/"}`);
      }
    }
    console.log("");
    console.log("Run without --dry-run to execute.");
    console.log("");
    return;
  }

  // Create reporter
  const reporter = new Reporter({
    verbose,
    webhook,
  });

  // Run the loop!
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔄 Starting loop... (Ctrl+C to stop)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    const result = await runLoop({
      cwd,
      agent,
      maxIterations,
      maxRetries,
      timeout: timeout * 60 * 1000, // Convert to ms
      reporter,
    });

    if (result.success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error("");
    console.error(`❌ Loop crashed: ${err.message}`);
    console.error("");
    if (verbose) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}
