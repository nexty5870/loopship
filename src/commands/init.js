/**
 * loopship init - Generate PRD from feature description
 * Uses ai-dev-tasks prompts to create structured PRD and task list
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOLS_DIR = path.join(__dirname, "../../tools/ai-dev-tasks");

export async function init(description) {
  if (!description?.trim()) {
    console.error("❌ Please provide a feature description or .md file path");
    console.error("   Usage: loopship init \"Add user authentication with OAuth\"");
    console.error("          loopship init ./my-prd.md");
    process.exit(1);
  }

  // Check if argument is a .md file path
  let featureDescription = description;
  let sourceFile = null;

  if (description.trim().endsWith(".md")) {
    const filePath = path.resolve(process.cwd(), description.trim());
    try {
      featureDescription = await fs.readFile(filePath, "utf-8");
      sourceFile = filePath;
    } catch (err) {
      // File doesn't exist, treat as regular description
    }
  }

  console.log("🚀 LoopShip Init");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (sourceFile) {
    console.log(`📝 Feature from: ${sourceFile}`);
  } else {
    console.log(`📝 Feature: ${featureDescription}`);
  }
  console.log("");

  // Load the PRD creation prompt
  const createPrdPath = path.join(TOOLS_DIR, "create-prd.md");
  const generateTasksPath = path.join(TOOLS_DIR, "generate-tasks.md");

  let createPrdPrompt, generateTasksPrompt;
  
  try {
    createPrdPrompt = await fs.readFile(createPrdPath, "utf-8");
    generateTasksPrompt = await fs.readFile(generateTasksPath, "utf-8");
  } catch (err) {
    console.error("❌ Could not load ai-dev-tasks prompts");
    console.error("   Run: git clone https://github.com/snarktank/ai-dev-tasks tools/ai-dev-tasks");
    process.exit(1);
  }

  // Generate the combined prompt for the AI
  const fullPrompt = `
# Feature Request

${featureDescription}

---

# Instructions

Use the following PRD creation framework to generate a structured PRD:

${createPrdPrompt}

---

After creating the PRD, use this task generation framework:

${generateTasksPrompt}

---

# Output Format

1. First, output the PRD as a markdown document
2. Then, output the tasks in this JSON format for prd.json:

\`\`\`json
{
  "project": "project-name",
  "branchName": "feat/feature-name",
  "description": "Brief description",
  "stories": [
    {
      "id": "1",
      "title": "Story title",
      "description": "What to implement",
      "priority": 1,
      "acceptance": ["Criteria 1", "Criteria 2"],
      "requiresBrowser": false,
      "verifyUrl": null,
      "passes": false
    }
  ]
}
\`\`\`

## Browser Verification

For stories that involve UI changes, set:
- \`requiresBrowser: true\`
- \`verifyUrl: "/path/to/verify"\` (the URL path to check)

The dev-browser skill will be used to:
1. Navigate to the verifyUrl
2. Take a screenshot
3. Verify the UI matches acceptance criteria
4. Only mark as passing after visual confirmation

Examples of stories requiring browser:
- UI component changes
- Page layouts
- Visual styling
- User flows

Examples NOT requiring browser:
- API endpoints
- Database changes
- Business logic
- CLI tools
`;

  // Save the prompt for manual use or AI piping
  const promptPath = path.join(process.cwd(), ".loopship-init-prompt.md");
  await fs.writeFile(promptPath, fullPrompt);
  
  console.log("📄 Generated init prompt");
  console.log(`   Saved to: ${promptPath}`);
  console.log("");
  console.log("🤖 To generate PRD, pipe to your AI agent:");
  console.log("");
  console.log("   # With Claude Code:");
  console.log(`   cat ${promptPath} | claude --dangerously-skip-permissions`);
  console.log("");
  console.log("   # With Amp:");
  console.log(`   cat ${promptPath} | amp`);
  console.log("");
  console.log("   # Or copy and paste into your preferred AI");
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("💡 After AI generates output:");
  console.log("   1. Save PRD to PRD.md");
  console.log("   2. Save tasks JSON to prd.json");
  console.log("   3. Run: loopship run");
  console.log("");
  console.log("📝 LoopShip will create loopship-progress.md automatically");
  console.log("   This file persists progress across sessions.");
}
