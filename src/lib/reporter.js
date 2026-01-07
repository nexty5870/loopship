/**
 * Reporter - Progress reporting for the loop
 * Handles console output and broadcasts to UI server
 */

export class Reporter {
  constructor(options = {}) {
    this.verbose = options.verbose ?? false;
    this.quiet = options.quiet ?? false;
    this.server = options.server ?? null; // LoopServer instance
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
  start({ agent, maxIterations, prd }) {
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

    // Notify UI
    if (this.server && prd) {
      this.server.loopStart(prd);
    }
  }

  /**
   * Starting a story
   */
  storyStart(story, context) {
    const { iteration, attempt, remaining } = context;

    console.log("");
    console.log(`┌─────────────────────────────────────────────────`);
    console.log(`│ 📖 Story ${story.id}: ${story.title}`);
    console.log(`│ 🔄 Iteration ${iteration} | Attempt ${attempt} | ${remaining} remaining`);
    if (story.requiresBrowser) {
      console.log(`│ 🌐 Requires browser verification`);
    }
    console.log(`└─────────────────────────────────────────────────`);
    console.log("");

    // Notify UI
    if (this.server) {
      this.server.storyStart(story, context);
    }
  }

  /**
   * Agent output (streaming)
   */
  output(text) {
    if (this.verbose) {
      process.stdout.write(text);
    }

    // Send to UI
    if (this.server) {
      this.server.agentOutput(text);
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

    // Notify UI
    if (this.server) {
      this.server.storyEnd(story, { passed: true, duration });
    }
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

    // Notify UI
    if (this.server) {
      this.server.storyEnd(story, { passed: false, duration: result.duration });
    }
  }

  /**
   * Story skipped (max retries)
   */
  skip(story, reason) {
    console.log("");
    console.log(`   ⏭️  Skipping story ${story.id}: ${reason}`);
    console.log("");

    // Notify UI
    if (this.server) {
      this.server.addOutput(`⏭️ Skipping story ${story.id}: ${reason}`, "warning");
    }
  }

  /**
   * Error occurred
   */
  error(message) {
    console.error("");
    console.error(`❌ Error: ${message}`);
    console.error("");

    // Notify UI
    if (this.server) {
      this.server.addOutput(`❌ Error: ${message}`, "error");
    }
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

    // Notify UI
    if (this.server) {
      this.server.loopComplete({ success: true });
    }
  }

  /**
   * Max iterations reached
   */
  maxIterationsReached(max) {
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

    // Notify UI
    if (this.server) {
      this.server.loopComplete({ success: false });
    }
  }
}
