/**
 * Ralph Loop - The autonomous coding loop
 * Iterates through stories until all pass or max iterations reached
 */

import fs from "node:fs/promises";
import path from "node:path";
import { runAgent, isAgentAvailable } from "./agent.js";
import { Reporter } from "./reporter.js";

/**
 * Build the prompt for a single story iteration
 */
function buildStoryPrompt(prd, story, context = {}) {
  const { progressLog = "", attempt = 1, prdMarkdown = null } = context;
  
  const prdContext = prdMarkdown
    ? `
## Full PRD Context

Read PRD.md for additional context about this project:

\`\`\`markdown
${prdMarkdown}
\`\`\`

`
    : "";

  const browserInstructions = story.requiresBrowser
    ? `
## Browser Verification Required

This story requires visual verification. After implementing:

1. **Start the dev server** (if not already running):
   \`\`\`bash
   npm run dev &
   # Wait for it to be ready
   sleep 3
   \`\`\`

2. **Use the browser skill to verify:**
   \`\`\`bash
   npx tsx ~/.claude/skills/browser/cli.ts navigate ${story.verifyUrl || "http://localhost:5173"}
   npx tsx ~/.claude/skills/browser/cli.ts screenshot story-${story.id}.png
   \`\`\`

3. **Check the screenshot** and verify the UI matches these acceptance criteria
4. **Only mark as done** after visual confirmation passes

Do NOT mark requiresBrowser stories as passing without actually taking and reviewing a screenshot.
`
    : "";

  const retryContext = attempt > 1
    ? `\n## Retry Attempt ${attempt}\n\nPrevious attempt failed. Check loopship-progress.md for error details and learnings from the failed attempt.\n`
    : "";

  return `# LoopShip - Story Implementation

You are implementing a single story from a PRD. Complete this story, then stop.

## Project Context

**Project:** ${prd.project}
**Branch:** ${prd.branchName}
**Description:** ${prd.description}
${prdContext}

## Current Story

**ID:** ${story.id}
**Title:** ${story.title}
**Description:** ${story.description}
**Priority:** ${story.priority}

### Acceptance Criteria
${story.acceptance.map((c, i) => `${i + 1}. ${c}`).join("\n")}

${browserInstructions}
${retryContext}

## Instructions

1. **Implement the story** - Write the necessary code
2. **Verify it works:**
   - Run \`npm test\` if tests exist
   - Run \`npm run typecheck\` if TypeScript
   ${story.requiresBrowser ? "- Take browser screenshot and verify UI" : ""}
3. **If successful:**
   - Commit with message: \`feat(story-${story.id}): ${story.title.toLowerCase().replace(/[^a-z0-9 ]/g, '').substring(0, 50)}\`
   - Update prd.json: set story ${story.id} \`passes: true\`
   - Update loopship-progress.md with:
     - ✅ Story ${story.id} completed
     - What you implemented
     - Any learnings or gotchas for future sessions
4. **If it fails:**
   - Update loopship-progress.md with:
     - ❌ Story ${story.id} failed (attempt ${context.attempt || 1})
     - What went wrong
     - What needs fixing
   - Do NOT set passes: true

## Files to Update

- **prd.json** - Mark story as passing when done
- **loopship-progress.md** - Log progress, learnings, and blockers (this persists across sessions!)

## Session Continuity

**Read loopship-progress.md first** - it contains progress from previous sessions, learnings, and any blockers.

### Recent Progress (last 80 lines)

${progressLog || "(No progress yet - this is the first run)"}

---

Begin implementing story ${story.id}: "${story.title}"
`;
}

/**
 * Load the PRD from disk
 */
async function loadPrd(cwd) {
  const prdPath = path.join(cwd, "prd.json");
  const content = await fs.readFile(prdPath, "utf-8");
  return JSON.parse(content);
}

/**
 * Load PRD.md if it exists (human-readable context)
 */
async function loadPrdMarkdown(cwd) {
  try {
    const prdMdPath = path.join(cwd, "PRD.md");
    const content = await fs.readFile(prdMdPath, "utf-8");
    // Return first 100 lines for context (avoid huge prompts)
    const lines = content.split("\n");
    return lines.slice(0, 100).join("\n") + (lines.length > 100 ? "\n\n[...truncated]" : "");
  } catch {
    return null;
  }
}

/**
 * Load progress log from loopship-progress.md
 */
async function loadProgress(cwd) {
  try {
    const progressPath = path.join(cwd, "loopship-progress.md");
    const content = await fs.readFile(progressPath, "utf-8");
    // Return last 80 lines for context
    const lines = content.split("\n");
    return lines.slice(-80).join("\n");
  } catch {
    return "";
  }
}

/**
 * Initialize or update loopship-progress.md
 */
async function initProgressFile(cwd, prd) {
  const progressPath = path.join(cwd, "loopship-progress.md");
  
  try {
    // Check if file exists
    await fs.access(progressPath);
    // File exists, append session marker
    const sessionMarker = `\n---\n\n## Session ${new Date().toISOString()}\n\n`;
    await fs.appendFile(progressPath, sessionMarker);
  } catch {
    // Create new file
    const initial = `# LoopShip Progress Log

**Project:** ${prd.project}
**Started:** ${new Date().toISOString()}
**Branch:** ${prd.branchName}

## Overview

${prd.description}

## Stories

${prd.stories.map(s => `- [ ] Story ${s.id}: ${s.title}`).join('\n')}

---

## Session ${new Date().toISOString()}

`;
    await fs.writeFile(progressPath, initial);
  }
}

/**
 * Run the Ralph loop
 * @param {object} options - Loop options
 * @param {string} options.cwd - Working directory
 * @param {string} options.agent - Agent to use ('claude' | 'codex')
 * @param {number} options.maxIterations - Max iterations
 * @param {number} options.maxRetries - Max retries per story
 * @param {number} options.timeout - Timeout per iteration in ms
 * @param {Reporter} options.reporter - Reporter instance
 */
export async function runLoop(options) {
  const {
    cwd = process.cwd(),
    agent = "claude",
    maxIterations = 25,
    maxRetries = 3,
    timeout = 10 * 60 * 1000, // 10 min per story
    reporter = new Reporter(),
  } = options;

  // Check agent availability
  const available = await isAgentAvailable(agent);
  if (!available) {
    reporter.error(`Agent '${agent}' not found. Install it first.`);
    return { success: false, error: "Agent not available" };
  }

  // Load initial PRD for reporter
  let initialPrd;
  try {
    initialPrd = await loadPrd(cwd);
  } catch (err) {
    reporter.error(`Failed to load prd.json: ${err.message}`);
    return { success: false, error: "PRD load failed" };
  }

  // Initialize progress file for multi-session continuity
  await initProgressFile(cwd, initialPrd);

  // Load PRD.md if it exists for richer context
  const prdMarkdown = await loadPrdMarkdown(cwd);
  if (prdMarkdown) {
    reporter.log("📄 Found PRD.md - including in agent context");
  }

  reporter.start({ agent, maxIterations, prd: initialPrd });

  let iteration = 0;
  const storyAttempts = {}; // Track attempts per story

  while (iteration < maxIterations) {
    iteration++;

    // Reload PRD each iteration (agent may have modified it)
    let prd;
    try {
      prd = await loadPrd(cwd);
    } catch (err) {
      reporter.error(`Failed to load prd.json: ${err.message}`);
      return { success: false, error: "PRD load failed" };
    }

    // Find next incomplete story
    const incompleteStories = prd.stories.filter((s) => !s.passes);
    
    if (incompleteStories.length === 0) {
      reporter.complete(prd);
      return { success: true, iterations: iteration };
    }

    // Pick the highest priority incomplete story
    const story = incompleteStories.sort((a, b) => a.priority - b.priority)[0];
    const storyKey = story.id;
    storyAttempts[storyKey] = (storyAttempts[storyKey] || 0) + 1;

    // Skip if max retries exceeded
    if (storyAttempts[storyKey] > maxRetries) {
      reporter.skip(story, `Max retries (${maxRetries}) exceeded`);
      // Mark as blocked in PRD
      story.blocked = true;
      await fs.writeFile(
        path.join(cwd, "prd.json"),
        JSON.stringify(prd, null, 2)
      );
      continue;
    }

    reporter.storyStart(story, {
      iteration,
      attempt: storyAttempts[storyKey],
      remaining: incompleteStories.length,
    });

    // Load progress for context
    const progressLog = await loadProgress(cwd);

    // Build prompt
    const prompt = buildStoryPrompt(prd, story, {
      progressLog,
      attempt: storyAttempts[storyKey],
      prdMarkdown,
    });

    // Run the agent
    try {
      const result = await runAgent(prompt, {
        agent,
        cwd,
        timeout,
        onOutput: (text) => reporter.output(text),
      });

      reporter.storyEnd(story, result);

      // Check if story was marked as passing
      const updatedPrd = await loadPrd(cwd);
      const updatedStory = updatedPrd.stories.find((s) => s.id === story.id);

      if (updatedStory?.passes) {
        reporter.storyPass(story, result.duration);
        // Reset attempts on success
        storyAttempts[storyKey] = 0;
      } else {
        reporter.storyFail(story, result);
      }
    } catch (err) {
      reporter.error(`Agent error: ${err.message}`);
      // Continue to next iteration
    }

    // Small delay between iterations
    await sleep(1000);
  }

  reporter.maxIterationsReached(maxIterations);
  return { success: false, error: "Max iterations reached" };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
