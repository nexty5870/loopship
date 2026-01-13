/**
 * loopship init - Generate PRD from feature description
 * Uses ai-dev-tasks prompts to create structured PRD and task list
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runAgent, isAgentAvailable } from "../lib/agent.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOLS_DIR = path.join(__dirname, "../../tools/ai-dev-tasks");

export async function init(description, options = {}) {
  const { agent = "claude", manual = false } = options;

  if (!description?.trim()) {
    console.error("❌ Please provide a feature description or .md file path");
    console.error("   Usage: loopship init \"Add user authentication with OAuth\"");
    console.error("          loopship init ./my-prd.md");
    console.error("          loopship init PRD.md --agent claude");
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
    console.error("   Try running: npm install");
    console.error("   Or manually: git clone https://github.com/snarktank/ai-dev-tasks tools/ai-dev-tasks");
    process.exit(1);
  }

  // If a .md file was provided, automatically generate prd.json (unless --manual flag is set)
  if (sourceFile && !manual) {
    const success = await autoGeneratePrdJson(sourceFile, featureDescription, generateTasksPrompt, agent);
    if (success) {
      return;
    }
    console.log("");
    console.log("⚠️  Auto-generation failed, falling back to manual workflow");
    console.log("");
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

/**
 * Auto-generate prd.json from existing PRD.md file
 */
async function autoGeneratePrdJson(prdPath, prdContent, generateTasksPrompt, agent = "claude") {
  console.log("🤖 Auto-generating prd.json from PRD.md...");
  console.log("");

  // Create a specialized prompt for converting PRD/feature description to prd.json
  const conversionPrompt = `You are tasked with converting a feature description or PRD (Product Requirements Document) into a structured JSON format for the LoopShip automation tool.

# Input Content:

${prdContent}

---

# Task Generation Framework:

${generateTasksPrompt}

---

# Instructions:

1. Read and understand the content above (it may be a structured PRD or a brief feature description)
2. If it's a brief description, expand it into proper user stories
3. Extract/create user stories, features, and acceptance criteria
4. Generate a prd.json file with the following structure:

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

# Output:

Output ONLY the JSON content wrapped in triple backticks with json language identifier. Do not include any explanation or additional text.`;

  // Check if agent is available
  const available = await isAgentAvailable(agent);
  if (!available) {
    console.error(`❌ ${agent} agent not available`);
    console.error(`   Install it first: npm install -g @anthropic-ai/claude-code`);
    return false;
  }

  try {
    // Run the agent
    const result = await runAgent(conversionPrompt, {
      agent,
      cwd: path.dirname(prdPath),
      timeout: 3 * 60 * 1000, // 3 minutes
      onOutput: (text) => {
        process.stdout.write(text);
      },
    });

    if (!result.success) {
      console.error("❌ Agent failed to generate prd.json");
      return false;
    }

    // Extract JSON from the output
    const jsonMatch = result.output.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      console.error("❌ Could not find JSON in agent output");
      console.error("   Output did not contain valid JSON block");
      return false;
    }

    const jsonContent = jsonMatch[1].trim();

    // Validate JSON
    let prdData;
    try {
      prdData = JSON.parse(jsonContent);
    } catch (err) {
      console.error("❌ Invalid JSON generated by agent");
      console.error(`   Error: ${err.message}`);
      return false;
    }

    // Save prd.json
    const prdJsonPath = path.join(path.dirname(prdPath), "prd.json");
    await fs.writeFile(prdJsonPath, JSON.stringify(prdData, null, 2));

    console.log("");
    console.log("✅ Generated prd.json successfully");
    console.log(`   Saved to: ${prdJsonPath}`);
    console.log("");
    console.log(`📊 Created ${prdData.stories?.length || 0} stories`);
    console.log("");
    console.log("🚀 Ready to run:");
    console.log("   loopship run");
    console.log("");

    return true;
  } catch (err) {
    console.error("❌ Error generating prd.json");
    console.error(`   ${err.message}`);
    return false;
  }
}
