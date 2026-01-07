/**
 * Reporter - Progress reporting for the loop
 * Handles console output, file logging, and optional webhooks
 */

import fs from "node:fs/promises";
import path from "node:path";

export class Reporter {
  constructor(options = {}) {
    this.verbose = options.verbose ?? false;
    this.quiet = options.quiet ?? false;
    this.logFile = options.logFile ?? null;
    this.webhook = options.webhook ?? null;
    this.startTime = null;
    this.storiesCompleted = 0;
    this.storiesFailed = 0;
  }

  /**
   * Log to console (unless quiet)
   */
  log(message, level = "info") {
    if (this.quiet) return;
    
    const prefix = {
      info: "",
      success: "✅ ",
      error: "❌ ",
      warn: "⚠️  ",
      story: "📖 ",
      agent: "🤖 ",
    }[level] || "";

    console.log(`${prefix}${message}`);
  }

  /**
   * Loop started
   */
  start({ agent, maxIterations }) {
    this.startTime = Date.now();
    
    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🚀 LoopShip - Ralph Loop Starting");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🤖 Agent: ${agent}`);
    console.log(`🔄 Max iterations: ${maxIterations}`);
    console.log(`⏱️  Started: ${new Date().toLocaleTimeString()}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
  }

  /**
   * Starting a story
   */
  storyStart(story, { iteration, attempt, remaining }) {
    console.log("");
    console.log(`┌─────────────────────────────────────────────────`);
    console.log(`│ 📖 Story ${story.id}: ${story.title}`);
    console.log(`│ 🔄 Iteration ${iteration} | Attempt ${attempt} | ${remaining} remaining`);
    if (story.requiresBrowser) {
      console.log(`│ 🌐 Requires browser verification`);
    }
    console.log(`└─────────────────────────────────────────────────`);
    console.log("");
  }

  /**
   * Agent output (streaming)
   */
  output(text) {
    if (this.verbose) {
      process.stdout.write(text);
    }
  }

  /**
   * Story iteration ended
   */
  storyEnd(story, result) {
    if (this.verbose) {
      console.log("");
      console.log(`   ⏱️  Duration: ${(result.duration / 1000).toFixed(1)}s`);
      console.log(`   📤 Exit code: ${result.exitCode}`);
    }
  }

  /**
   * Story passed
   */
  storyPass(story, duration) {
    this.storiesCompleted++;
    console.log("");
    console.log(`   ✅ Story ${story.id} PASSED (${(duration / 1000).toFixed(1)}s)`);
    console.log("");
  }

  /**
   * Story failed
   */
  storyFail(story, result) {
    this.storiesFailed++;
    console.log("");
    console.log(`   ❌ Story ${story.id} FAILED`);
    if (!result.success) {
      console.log(`   📤 Agent exited with code ${result.exitCode}`);
    }
    console.log(`   🔄 Will retry...`);
    console.log("");
  }

  /**
   * Story skipped (max retries)
   */
  skip(story, reason) {
    console.log("");
    console.log(`   ⏭️  Skipping story ${story.id}: ${reason}`);
    console.log("");
  }

  /**
   * Error occurred
   */
  error(message) {
    console.error("");
    console.error(`❌ Error: ${message}`);
    console.error("");
  }

  /**
   * All stories complete
   */
  complete(prd) {
    const duration = Date.now() - this.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 ALL STORIES COMPLETE!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📋 Project: ${prd.project}`);
    console.log(`✅ Stories completed: ${this.storiesCompleted}`);
    console.log(`❌ Stories failed: ${this.storiesFailed}`);
    console.log(`⏱️  Total time: ${minutes}m ${seconds}s`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");

    // Send webhook if configured
    this.sendWebhook({
      event: "complete",
      project: prd.project,
      storiesCompleted: this.storiesCompleted,
      duration,
    });
  }

  /**
   * Max iterations reached
   */
  maxIterationsReached(max) {
    const duration = Date.now() - this.startTime;

    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("⚠️  MAX ITERATIONS REACHED");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🔄 Iterations: ${max}`);
    console.log(`✅ Stories completed: ${this.storiesCompleted}`);
    console.log(`❌ Stories failed/blocked: ${this.storiesFailed}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
    console.log("💡 Some stories may need manual intervention.");
    console.log("   Check progress.txt for details.");
    console.log("");

    this.sendWebhook({
      event: "max_iterations",
      storiesCompleted: this.storiesCompleted,
      storiesFailed: this.storiesFailed,
      duration,
    });
  }

  /**
   * Send webhook notification (if configured)
   */
  async sendWebhook(data) {
    if (!this.webhook) return;

    try {
      await fetch(this.webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      // Silently fail - webhooks are optional
    }
  }
}
