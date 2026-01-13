#!/usr/bin/env node
/**
 * Post-install script to clone ai-dev-tasks prompts
 * This ensures the prompts are available after npm install
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toolsDir = path.join(__dirname, "../tools");
const aiDevTasksDir = path.join(toolsDir, "ai-dev-tasks");

console.log("🔧 Setting up LoopShip dependencies...");

// Ensure tools directory exists
if (!fs.existsSync(toolsDir)) {
  fs.mkdirSync(toolsDir, { recursive: true });
}

// Check if ai-dev-tasks already has the required files
const requiredFiles = ["create-prd.md", "generate-tasks.md"];
const hasRequiredFiles = requiredFiles.every((file) =>
  fs.existsSync(path.join(aiDevTasksDir, file))
);

if (hasRequiredFiles) {
  console.log("✅ ai-dev-tasks prompts already present");
  process.exit(0);
}

// Clone or update ai-dev-tasks
try {
  if (fs.existsSync(path.join(aiDevTasksDir, ".git"))) {
    console.log("📦 Updating ai-dev-tasks prompts...");
    execSync("git pull", {
      cwd: aiDevTasksDir,
      stdio: "inherit",
    });
  } else {
    console.log("📦 Cloning ai-dev-tasks prompts...");
    // Remove directory if it exists but is empty/incomplete
    if (fs.existsSync(aiDevTasksDir)) {
      fs.rmSync(aiDevTasksDir, { recursive: true, force: true });
    }
    execSync(
      `git clone https://github.com/snarktank/ai-dev-tasks "${aiDevTasksDir}"`,
      { stdio: "inherit" }
    );
  }
  console.log("✅ ai-dev-tasks prompts ready");
} catch (error) {
  console.error("⚠️  Could not set up ai-dev-tasks prompts");
  console.error("   You can manually clone them later:");
  console.error(
    "   git clone https://github.com/snarktank/ai-dev-tasks tools/ai-dev-tasks"
  );
  // Don't fail the install if this fails
  process.exit(0);
}
