/**
 * loopship run - Start the Ralph loop
 * Orchestrates AI agents to complete stories from prd.json
 */

import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

export async function run(options) {
  const { orchestrator, workers, maxIterations, browser } = options;

  console.log("🚀 LoopShip Run");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🎯 Orchestrator: ${orchestrator}`);
  console.log(`👷 Workers: ${workers.join(", ")}`);
  console.log(`🔄 Max iterations: ${maxIterations}`);
  console.log(`🌐 Browser verification: ${browser ? "enabled" : "disabled"}`);
  console.log("");

  // Load prd.json
  let prd;
  try {
    const prdPath = path.join(process.cwd(), "prd.json");
    prd = JSON.parse(await fs.readFile(prdPath, "utf-8"));
  } catch (err) {
    console.error("❌ Could not load prd.json");
    console.error("   Run: loopship init \"your feature\" first");
    process.exit(1);
  }

  // Load prompt.md
  let promptTemplate;
  try {
    promptTemplate = await fs.readFile(
      path.join(process.cwd(), "prompt.md"),
      "utf-8"
    );
  } catch (err) {
    // Use default prompt
    promptTemplate = DEFAULT_PROMPT;
    await fs.writeFile(path.join(process.cwd(), "prompt.md"), promptTemplate);
    console.log("📝 Created default prompt.md");
  }

  // Ensure progress.txt exists
  try {
    await fs.access(path.join(process.cwd(), "progress.txt"));
  } catch {
    await fs.writeFile(
      path.join(process.cwd(), "progress.txt"),
      `# Progress Log\n\nProject: ${prd.project}\nStarted: ${new Date().toISOString()}\n\n## Learnings\n\n`
    );
    console.log("📝 Created progress.txt");
  }

  console.log(`📋 Project: ${prd.project}`);
  console.log(`🌿 Branch: ${prd.branchName}`);
  console.log("");

  // Count remaining stories
  const remaining = prd.stories.filter((s) => !s.passes);
  console.log(`📊 Stories: ${remaining.length} remaining / ${prd.stories.length} total`);
  console.log("");

  if (remaining.length === 0) {
    console.log("✅ All stories complete!");
    return;
  }

  // List stories
  console.log("📋 Stories:");
  for (const story of prd.stories) {
    const status = story.passes ? "✅" : "⏳";
    const browserIcon = story.requiresBrowser ? " 🌐" : "";
    console.log(`   ${status} ${story.id}. ${story.title}${browserIcon}`);
  }
  
  const browserCount = prd.stories.filter(s => s.requiresBrowser && !s.passes).length;
  if (browserCount > 0) {
    console.log(`\n   🌐 = requires browser verification (${browserCount} stories)`);
  }
  console.log("");

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔄 Starting Ralph Loop...");
  console.log("");

  // Build the orchestration prompt
  const orchPrompt = buildOrchestrationPrompt(prd, promptTemplate, {
    orchestrator,
    workers,
    browser,
  });

  // For now, output the prompt for manual execution
  // In future: spawn the actual AI process
  const orchPath = path.join(process.cwd(), ".loopship-run-prompt.md");
  await fs.writeFile(orchPath, orchPrompt);

  console.log("📄 Generated orchestration prompt");
  console.log(`   Saved to: ${orchPath}`);
  console.log("");
  console.log("🤖 To start the loop:");
  console.log("");
  console.log("   # Single iteration with Claude:");
  console.log(`   cat ${orchPath} | claude --dangerously-skip-permissions`);
  console.log("");
  console.log("   # Full Ralph loop:");
  console.log("   ./ralph.sh");
  console.log("");
  
  if (browser) {
    console.log("🌐 Browser verification enabled.");
    console.log("   Agent will use dev-browser for UI screenshots.");
    console.log("");
  }
}

function buildOrchestrationPrompt(prd, template, options) {
  const { orchestrator, workers, browser } = options;

  const workerSection =
    workers.length > 1
      ? `
## Multi-Model Routing

You are the orchestrator (${orchestrator}). You can delegate tasks to worker models:
${workers.map((w) => `- ${w}`).join("\n")}

For simple implementation tasks, delegate to workers.
For complex reasoning or architecture decisions, handle yourself.
`
      : "";

  const browserStories = prd.stories.filter(s => s.requiresBrowser && !s.passes);
  const browserSection = browser && browserStories.length > 0
    ? `
## Browser Verification Required

The following stories require visual verification with dev-browser:
${browserStories.map(s => `- Story ${s.id}: "${s.title}" → verify at ${s.verifyUrl || '/'}`).join('\n')}

For these stories, you MUST:
1. Load the dev-browser skill: "Load the dev-browser skill"
2. Navigate to the verifyUrl specified in the story
3. Take a screenshot
4. Verify the UI matches the acceptance criteria
5. Only mark as passing after visual confirmation

Do NOT mark a requiresBrowser story as passing without a screenshot verification.
`
    : "";

  return `
# LoopShip Orchestration

${template}

${workerSection}

${browserSection}

## Current PRD

\`\`\`json
${JSON.stringify(prd, null, 2)}
\`\`\`

## Instructions

1. Find the next story where \`passes\` is false
2. Implement it (or delegate to a worker)
3. Run verification (tests, typecheck, browser if UI)
4. If passing: commit, update prd.json, log to progress.txt
5. If failing: log error, attempt fix or skip

Begin with the next incomplete story.
`;
}

const DEFAULT_PROMPT = `# Ralph Iteration Prompt

You are an autonomous coding agent running in a loop. Each iteration:

1. **Read prd.json** - Find the next story where \`passes\` is not \`true\`
2. **Implement the story** - Write the code needed
3. **Run verification:**
   - Run \`npm run typecheck\` and \`npm test\` (if available)
   - If story has \`requiresBrowser: true\`:
     a. Load the dev-browser skill
     b. Navigate to the \`verifyUrl\` specified in the story
     c. Take a screenshot
     d. Verify UI matches acceptance criteria
     e. Only proceed if visual check passes
4. **If passing:**
   - Commit with message: "feat: [story title]"
   - Update prd.json: set \`passes: true\` for this story
   - Append learnings to progress.txt
5. **If failing:**
   - Log the error to progress.txt
   - Try to fix, or move to next story

## Important Rules

- One story per iteration
- Small, focused commits
- If stuck for 3 attempts, mark story as blocked and move on
- Update progress.txt with patterns you discover
- ALWAYS verify UI stories with dev-browser before marking as done
`;
