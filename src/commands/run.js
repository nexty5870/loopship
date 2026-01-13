/**
 * loopship run - Start the Ralph loop
 * Orchestrates AI agents to complete stories from prd.json
 */

import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runLoop } from "../lib/loop.js";
import { Reporter } from "../lib/reporter.js";
import { LoopServer } from "../lib/server.js";
import { isAgentAvailable, AGENTS } from "../lib/agent.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    ui = false,
    uiPort = 3099,
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
  if (ui) console.log(`🖥️  Live UI: will start at http://localhost:5173`);
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

  // Start UI server and Vite dev server if requested
  let server = null;
  let viteProcess = null;
  if (ui) {
    server = new LoopServer({ port: uiPort });
    try {
      await server.start();
    } catch (err) {
      console.error(`❌ Failed to start UI server: ${err.message}`);
      process.exit(1);
    }

    // Start Vite dev server
    viteProcess = await startViteDevServer();
    if (!viteProcess) {
      console.error("⚠️  Failed to start Vite dev server, but continuing...");
    }
  }

  // Create reporter with server
  const reporter = new Reporter({
    verbose,
    webhook,
    server,
  });

  // Run the loop!
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔄 Starting loop... (Ctrl+C to stop)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log("\n🛑 Shutting down...");
    if (server) {
      await server.stop();
    }
    if (viteProcess) {
      viteProcess.kill();
    }
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  try {
    const result = await runLoop({
      cwd,
      agent,
      maxIterations,
      maxRetries,
      timeout: timeout * 60 * 1000, // Convert to ms
      reporter,
    });

    // Stop server and Vite
    if (server) {
      await server.stop();
    }
    if (viteProcess) {
      viteProcess.kill();
    }

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

    // Stop server and Vite on error
    if (server) {
      await server.stop();
    }
    if (viteProcess) {
      viteProcess.kill();
    }

    process.exit(1);
  }
}

/**
 * Start the Vite dev server for the UI
 * @returns {Promise<ChildProcess|null>} The Vite process or null if failed
 */
async function startViteDevServer() {
  const uiDir = path.join(__dirname, "../../ui");

  // Check if UI directory exists
  try {
    await fs.access(uiDir);
  } catch (err) {
    console.error("⚠️  UI directory not found, skipping Vite dev server");
    return null;
  }

  // Check if node_modules exists in UI directory
  const nodeModulesPath = path.join(uiDir, "node_modules");
  try {
    await fs.access(nodeModulesPath);
  } catch (err) {
    console.log("📦 Installing UI dependencies...");
    // Run npm install
    const installProc = spawn("npm", ["install"], {
      cwd: uiDir,
      stdio: "inherit",
    });

    await new Promise((resolve, reject) => {
      installProc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`npm install failed with code ${code}`));
      });
      installProc.on("error", reject);
    });
  }

  // Start Vite dev server
  console.log("🌐 Starting UI dev server...");
  const viteProc = spawn("npm", ["run", "dev"], {
    cwd: uiDir,
    stdio: "pipe", // Capture output to avoid cluttering the terminal
    env: { ...process.env, FORCE_COLOR: "0" },
  });

  // Wait a bit for Vite to start
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Check if process is still running
  if (viteProc.exitCode !== null) {
    console.error("⚠️  Vite dev server exited unexpectedly");
    return null;
  }

  console.log("✅ UI available at http://localhost:5173");
  console.log("");

  return viteProc;
}
