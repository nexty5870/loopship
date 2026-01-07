/**
 * WebSocket server for LoopShip UI
 * Broadcasts loop events to connected clients
 */

import { WebSocketServer } from "ws";

export class LoopServer {
  constructor(options = {}) {
    this.port = options.port ?? 3099;
    this.wss = null;
    this.clients = new Set();
    this.state = {
      status: "idle",
      stories: [],
      output: [],
      currentStory: null,
      startTime: null,
      completedCount: 0,
    };
  }

  /**
   * Start the WebSocket server
   */
  start() {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({ port: this.port });

        this.wss.on("connection", (ws) => {
          this.clients.add(ws);
          console.log(`📡 UI client connected (${this.clients.size} total)`);

          // Send current state to new client
          this.send(ws, {
            type: "stories",
            payload: this.state.stories,
          });
          this.send(ws, {
            type: "status",
            payload: { status: this.state.status },
          });

          ws.on("message", (data) => {
            try {
              const msg = JSON.parse(data.toString());
              this.handleMessage(ws, msg);
            } catch (err) {
              console.error("Invalid message:", err.message);
            }
          });

          ws.on("close", () => {
            this.clients.delete(ws);
            console.log(`📡 UI client disconnected (${this.clients.size} total)`);
          });

          ws.on("error", (err) => {
            console.error("WebSocket error:", err.message);
            this.clients.delete(ws);
          });
        });

        this.wss.on("listening", () => {
          console.log(`📡 LoopShip UI server running on ws://localhost:${this.port}`);
          resolve();
        });

        this.wss.on("error", (err) => {
          if (err.code === "EADDRINUSE") {
            console.error(`❌ Port ${this.port} already in use`);
          }
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Stop the server
   */
  stop() {
    return new Promise((resolve) => {
      if (this.wss) {
        // Close all client connections
        for (const client of this.clients) {
          client.close();
        }
        this.clients.clear();

        this.wss.close(() => {
          console.log("📡 UI server stopped");
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Handle incoming messages from UI
   */
  handleMessage(ws, msg) {
    switch (msg.type) {
      case "start":
        // UI requested loop start - emit event for loop to handle
        this.emit("ui:start");
        break;
      case "stop":
        // UI requested loop stop
        this.emit("ui:stop");
        break;
      case "clear":
        this.state.output = [];
        this.broadcast({ type: "output", lines: [] });
        break;
      default:
        console.log("Unknown message type:", msg.type);
    }
  }

  /**
   * Send message to a specific client
   */
  send(ws, data) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(data) {
    const msg = JSON.stringify(data);
    for (const client of this.clients) {
      if (client.readyState === client.OPEN) {
        client.send(msg);
      }
    }
  }

  // --- Event emitter for loop integration ---
  _listeners = {};

  on(event, fn) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(fn);
  }

  emit(event, data) {
    const listeners = this._listeners[event] || [];
    for (const fn of listeners) {
      fn(data);
    }
  }

  // --- Loop event handlers ---

  /**
   * Called when loop starts
   */
  loopStart(prd) {
    this.state = {
      status: "running",
      stories: prd.stories.map((s) => ({
        id: s.id,
        title: s.title,
        status: s.passes ? "passed" : "pending",
        priority: s.priority,
        duration: null,
      })),
      output: [],
      currentStory: null,
      startTime: Date.now(),
      completedCount: prd.stories.filter((s) => s.passes).length,
    };

    // Send stories list
    this.broadcast({
      type: "stories",
      payload: this.state.stories,
    });

    // Send status
    this.broadcast({
      type: "status",
      payload: { status: "running" },
    });
  }

  /**
   * Called when a story starts
   */
  storyStart(story, context) {
    this.state.currentStory = story.id;

    // Update story status
    const storyState = this.state.stories.find((s) => s.id === story.id);
    if (storyState) {
      storyState.status = "running";
      storyState.startTime = Date.now();
    }

    this.broadcast({
      type: "story_start",
      payload: {
        storyId: story.id,
        title: story.title,
        iteration: context.iteration,
        attempt: context.attempt,
        remaining: context.remaining,
      },
    });

    // Add to output
    this.addOutput(`\n▶ Starting story ${story.id}: ${story.title}`, "info");
    this.addOutput(`  Iteration ${context.iteration}, Attempt ${context.attempt}`, "dim");
  }

  /**
   * Called when agent produces output
   */
  agentOutput(text) {
    // Split into lines and add each
    const lines = text.split("\n");
    for (const line of lines) {
      if (line.trim()) {
        this.addOutput(line, this.classifyLine(line));
      }
    }
  }

  /**
   * Classify output line for syntax highlighting
   */
  classifyLine(line) {
    if (line.includes("✓") || line.includes("✅") || line.includes("PASS")) {
      return "success";
    }
    if (line.includes("✗") || line.includes("❌") || line.includes("ERROR") || line.includes("FAIL")) {
      return "error";
    }
    if (line.match(/\.(js|jsx|ts|tsx|json|md|css)/) || line.includes("src/") || line.includes("./")) {
      return "file";
    }
    if (line.startsWith(">") || line.startsWith("$")) {
      return "command";
    }
    return "default";
  }

  /**
   * Add a line to output and broadcast
   */
  addOutput(text, type = "default") {
    const line = {
      id: Date.now() + Math.random(),
      text,
      type,
      timestamp: Date.now(),
    };
    this.state.output.push(line);

    // Keep last 500 lines
    if (this.state.output.length > 500) {
      this.state.output = this.state.output.slice(-500);
    }

    this.broadcast({
      type: "output",
      payload: { text: line.text, type: line.type },
    });
  }

  /**
   * Called when a story completes
   */
  storyEnd(story, result) {
    const storyState = this.state.stories.find((s) => s.id === story.id);
    if (storyState) {
      storyState.status = result.passed ? "passed" : "failed";
      storyState.duration = result.duration;
      if (result.passed) {
        this.state.completedCount++;
      }
    }

    this.state.currentStory = null;

    const icon = result.passed ? "✅" : "❌";
    this.addOutput(`${icon} Story ${story.id} ${result.passed ? "PASSED" : "FAILED"} (${(result.duration / 1000).toFixed(1)}s)`, result.passed ? "success" : "error");

    this.broadcast({
      type: "story_end",
      payload: {
        storyId: story.id,
        passed: result.passed,
        duration: result.duration,
        completedCount: this.state.completedCount,
        totalCount: this.state.stories.length,
      },
    });
  }

  /**
   * Called when loop completes
   */
  loopComplete(result) {
    this.state.status = result.success ? "complete" : "stopped";
    this.state.currentStory = null;

    const duration = Date.now() - this.state.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    this.addOutput(`\n${"━".repeat(50)}`, "dim");
    this.addOutput(result.success ? "🎉 ALL STORIES COMPLETE!" : "⚠️ Loop ended", result.success ? "success" : "warning");
    this.addOutput(`Total time: ${minutes}m ${seconds}s`, "dim");
    this.addOutput(`${"━".repeat(50)}`, "dim");

    this.broadcast({
      type: "loop_complete",
      payload: {
        success: result.success,
        duration,
        completedCount: this.state.completedCount,
        totalCount: this.state.stories.length,
      },
    });
  }
}
