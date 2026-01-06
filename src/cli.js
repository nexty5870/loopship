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

Usage:
  loopship init <description>     Generate PRD from feature description
  loopship run [options]          Start the Ralph loop
  loopship verify [options]       Run browser verification

Commands:
  init <description>
    Generate a PRD and task list from a natural language description
    Uses ai-dev-tasks prompts under the hood

  run [--orchestrator <model>] [--workers <models>] [--max-iterations <n>]
    Start the autonomous coding loop
    --orchestrator    Model for task routing (default: claude)
    --workers         Comma-separated worker models (default: claude)
    --max-iterations  Max loop iterations (default: 25)
    --browser         Enable browser verification for UI tasks

  verify [--url <url>]
    Run browser verification manually
    --url    URL to verify (default: http://localhost:3000)

Examples:
  loopship init "Add user authentication with OAuth"
  loopship run --orchestrator opus --workers glm,minimax
  loopship verify --url http://localhost:3000/login

Credits:
  - Ralph Loop by @GeoffreyHuntley
  - PRD Generator by @ryancarson (ai-dev-tasks)
  - Browser Verification by @SawyerHood (dev-browser)
`;

const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  switch (command) {
    case "init":
      await init(args.join(" "));
      break;

    case "run": {
      const { values } = parseArgs({
        args,
        options: {
          orchestrator: { type: "string", default: "claude" },
          workers: { type: "string", default: "claude" },
          "max-iterations": { type: "string", default: "25" },
          browser: { type: "boolean", default: false },
        },
        allowPositionals: true,
      });
      await run({
        orchestrator: values.orchestrator,
        workers: values.workers.split(","),
        maxIterations: parseInt(values["max-iterations"], 10),
        browser: values.browser,
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
