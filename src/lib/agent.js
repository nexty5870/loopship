/**
 * Agent abstraction - spawns Claude Code or Codex CLI
 * Returns when the agent completes its task
 */

import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Available agent types
 */
export const AGENTS = {
  claude: {
    name: "Claude Code",
    command: "claude",
    args: ["--dangerously-skip-permissions", "--print"],
    inputFlag: null, // reads from stdin
  },
  codex: {
    name: "Codex CLI",
    command: "codex",
    args: ["--quiet"],
    inputFlag: null,
  },
};

/**
 * Run an agent with a prompt
 * @param {string} prompt - The prompt to send
 * @param {object} options - Options
 * @param {string} options.agent - Agent type: 'claude' | 'codex'
 * @param {string} options.cwd - Working directory
 * @param {number} options.timeout - Timeout in ms (default: 5 min)
 * @param {function} options.onOutput - Callback for output chunks
 * @returns {Promise<{success: boolean, output: string, duration: number}>}
 */
export async function runAgent(prompt, options = {}) {
  const {
    agent = "claude",
    cwd = process.cwd(),
    timeout = 5 * 60 * 1000,
    onOutput = () => {},
  } = options;

  const agentConfig = AGENTS[agent];
  if (!agentConfig) {
    throw new Error(`Unknown agent: ${agent}. Available: ${Object.keys(AGENTS).join(", ")}`);
  }

  const startTime = Date.now();
  let output = "";

  return new Promise((resolve, reject) => {
    const proc = spawn(agentConfig.command, agentConfig.args, {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, FORCE_COLOR: "0" },
    });

    // Send prompt to stdin
    proc.stdin.write(prompt);
    proc.stdin.end();

    // Collect output
    proc.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      onOutput(text, "stdout");
    });

    proc.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      onOutput(text, "stderr");
    });

    // Timeout handling
    const timer = setTimeout(() => {
      proc.kill("SIGTERM");
      reject(new Error(`Agent timed out after ${timeout / 1000}s`));
    }, timeout);

    proc.on("close", (code) => {
      clearTimeout(timer);
      const duration = Date.now() - startTime;
      resolve({
        success: code === 0,
        output,
        duration,
        exitCode: code,
      });
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/**
 * Check if an agent is available
 * @param {string} agent - Agent type
 * @returns {Promise<boolean>}
 */
export async function isAgentAvailable(agent) {
  const agentConfig = AGENTS[agent];
  if (!agentConfig) return false;

  return new Promise((resolve) => {
    const proc = spawn("which", [agentConfig.command]);
    proc.on("close", (code) => resolve(code === 0));
    proc.on("error", () => resolve(false));
  });
}
