#!/usr/bin/env node
/**
 * LoopShip CLI
 * Autonomous AI coding loop with multi-model orchestration
 */

import { parseArgs } from "node:util";
import { init } from "./commands/init.js";
import { run } from "./commands/run.js";
import { verify } from "./commands/verify.js";

const HELP = `
🚀 LoopShip - Autonomous AI Coding Loop

Turn feature descriptions into working code with autonomous AI loops.

Usage:
  loopship init <description>     Generate PRD from feature description
  loopship run [options]          Start the Ralph loop
  loopship verify [options]       Run browser verification

Commands:
  init <description>
    Generate a PRD and task list from a natural language description.
    If you provide a PRD.md file, it will automatically generate prd.json.
    Uses ai-dev-tasks prompts under the hood.

    --agent <name>        Agent to use: claude, codex (default: claude)
    --manual              Skip auto-generation, create prompt file only

  run [options]
    Start the autonomous coding loop. The agent will implement stories
    one by one until all pass or max iterations is reached.

    --agent <name>        Agent to use: claude, codex (default: claude)
    --max-iterations <n>  Max loop iterations (default: 25)
    --max-retries <n>     Max retries per story (default: 3)
    --timeout <minutes>   Timeout per story in minutes (default: 10)
    --browser             Enable browser verification for UI tasks
    --verbose             Show agent output in real-time
    --dry-run             Show what would happen without executing
    --webhook <url>       Send completion notification to webhook
    --ui                  Start live UI dashboard (auto-starts Vite + WebSocket)
    --ui-port <port>      WebSocket server port (default: 3099)

  verify [options]
    Run browser verification manually.

    --url <url>           URL to verify (default: http://localhost:3000)

Examples:
  # Generate a PRD
  loopship init "Add user authentication with OAuth"

  # Run the loop with Claude Code
  loopship run

  # Run with Codex and verbose output
  loopship run --agent codex --verbose

  # Dry run to see what would happen
  loopship run --dry-run

  # Run with webhook notification
  loopship run --webhook https://hooks.example.com/loopship

Credits:
  - Ralph Loop by @GeoffreyHuntley
  - PRD Generator by @ryancarson (ai-dev-tasks)
  - Browser Verification by @SawyerHood (dev-browser)
`;

const VERSION = "0.2.0";

const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  switch (command) {
    case "init": {
      const { values, positionals } = parseArgs({
        args,
        options: {
          agent: { type: "string", default: "claude" },
          manual: { type: "boolean", default: false },
        },
        allowPositionals: true,
      });
      await init(positionals.join(" "), {
        agent: values.agent,
        manual: values.manual,
      });
      break;
    }

    case "run": {
      const { values } = parseArgs({
        args,
        options: {
          agent: { type: "string", default: "claude" },
          "max-iterations": { type: "string", default: "25" },
          "max-retries": { type: "string", default: "3" },
          timeout: { type: "string", default: "10" },
          browser: { type: "boolean", default: false },
          verbose: { type: "boolean", short: "v", default: false },
          "dry-run": { type: "boolean", default: false },
          webhook: { type: "string" },
          ui: { type: "boolean", default: false },
          "ui-port": { type: "string", default: "3099" },
        },
        allowPositionals: true,
      });
      await run({
        agent: values.agent,
        maxIterations: parseInt(values["max-iterations"], 10),
        maxRetries: parseInt(values["max-retries"], 10),
        timeout: parseInt(values.timeout, 10),
        browser: values.browser,
        verbose: values.verbose,
        dryRun: values["dry-run"],
        webhook: values.webhook,
        ui: values.ui,
        uiPort: parseInt(values["ui-port"], 10),
      });
      break;
    }

    case "verify": {
      const { values } = parseArgs({
        args,
        options: {
          url: { type: "string", default: "http://localhost:3000" },
        },
        allowPositionals: true,
      });
      await verify({ url: values.url });
      break;
    }

    case "version":
    case "--version":
    case "-V":
      console.log(`loopship v${VERSION}`);
      break;

    case "help":
    case "--help":
    case "-h":
    case undefined:
      console.log(HELP);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
