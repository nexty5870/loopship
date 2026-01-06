/**
 * loopship verify - Browser verification via dev-browser
 * Takes screenshots and verifies UI state
 */

import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEV_BROWSER_DIR = path.join(__dirname, "../../tools/dev-browser");

export async function verify(options) {
  const { url } = options;

  console.log("🌐 LoopShip Verify");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🔗 URL: ${url}`);
  console.log("");

  // Check if dev-browser is installed
  const skillPath = path.join(DEV_BROWSER_DIR, "skills", "dev-browser");
  try {
    await fs.access(skillPath);
  } catch {
    console.error("❌ dev-browser not found");
    console.error("   Run: git clone https://github.com/SawyerHood/dev-browser tools/dev-browser");
    process.exit(1);
  }

  // Generate verification prompt for AI
  const verifyPrompt = `
# Browser Verification Task

Load the dev-browser skill and verify the following URL:

**URL:** ${url}

## Steps

1. Load the dev-browser skill
2. Navigate to: ${url}
3. Wait for page to fully load
4. Take a screenshot
5. Describe what you see
6. Report any issues or confirm the page looks correct

## Expected Behavior

Describe what you expect to see on this page based on the current stories in prd.json.

## Output

Provide:
1. Screenshot of the page
2. Description of UI elements visible
3. Any errors or issues found
4. Pass/Fail verdict with reasoning
`;

  const verifyPath = path.join(process.cwd(), ".loopship-verify-prompt.md");
  await fs.writeFile(verifyPath, verifyPrompt);

  console.log("📄 Generated verification prompt");
  console.log(`   Saved to: ${verifyPath}`);
  console.log("");
  console.log("🤖 To run verification:");
  console.log("");
  console.log("   # With Claude Code:");
  console.log(`   cat ${verifyPath} | claude --dangerously-skip-permissions`);
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("💡 dev-browser will:");
  console.log("   1. Launch a browser instance");
  console.log("   2. Navigate to the URL");
  console.log("   3. Take a screenshot for AI analysis");
  console.log("   4. Return DOM snapshot for interaction");
  console.log("");

  // Show dev-browser setup instructions if needed
  console.log("📦 If dev-browser isn't set up yet:");
  console.log(`   cd ${DEV_BROWSER_DIR}`);
  console.log("   npm install");
  console.log("   npm run start-server");
  console.log("");
}
