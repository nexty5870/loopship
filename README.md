# LoopShip 🚀

Turn feature descriptions into working code with autonomous AI loops.

**LoopShip** implements the Ralph loop pattern — an autonomous coding loop that takes a PRD (Product Requirements Document) with user stories and implements them one by one using AI agents like Claude Code or Codex.

## ✨ Features

- **PRD-driven development** — Write stories, not code
- **Real Ralph loop** — Autonomous iteration until all stories pass
- **Live UI dashboard** — Watch progress in real-time via WebSocket
- **Multi-agent support** — Claude Code, Codex (more coming)
- **Browser verification** — Optional screenshot verification for UI stories
- **Smart retries** — Exponential backoff, max retries per story

## 🎬 Demo

Built a full Pipecat voice demo (8 stories) in ~40 minutes:
- React + Vite + Tailwind scaffold
- Microphone input with Web Audio API
- Audio playback for TTS responses
- Response time metrics display
- Transcript panel with timestamps
- Python WebSocket server
- Connection controls
- Polish pass

All autonomous. Zero hand-holding.

## 📦 Installation

```bash
# Clone the repo
git clone https://github.com/nexty5870/loopship.git
cd loopship

# Install dependencies
npm install

# Make CLI available
npm link
```

**Requirements:**
- Node.js 20+
- Claude Code (`npm install -g @anthropic-ai/claude-code`) or Codex

## 🚀 Quick Start

### 1. Initialize a PRD

```bash
cd your-project
loopship init "Add user authentication with OAuth"
```

This generates a prompt to create your `prd.json` with structured stories.

### 2. Run the loop

```bash
loopship run
```

Options:
```
--agent <name>        Agent: claude, codex (default: claude)
--max-iterations <n>  Max loop iterations (default: 25)
--max-retries <n>     Max retries per story (default: 3)
--timeout <minutes>   Timeout per story (default: 10)
--verbose             Show agent output in real-time
--ui                  Start WebSocket server for live UI
--ui-port <port>      UI server port (default: 3099)
--dry-run             Preview without executing
```

### 3. Watch progress (optional)

Start the UI:
```bash
cd ui
npm install
npm run dev
```

Then run with `--ui`:
```bash
loopship run --ui --verbose
```

Open http://localhost:5173 to watch stories complete in real-time.

## 📝 PRD Format

```json
{
  "project": "my-app",
  "branchName": "feat/my-feature",
  "description": "What this feature does",
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
```

## 🔄 How It Works

```
┌─────────────────────────────────────────────┐
│                 LoopShip                     │
├─────────────────────────────────────────────┤
│  1. Load prd.json                           │
│  2. Find next incomplete story              │
│  3. Build context-rich prompt               │
│  4. Spawn Claude Code / Codex               │
│  5. Wait for completion                     │
│  6. Check if story marked as done           │
│  7. If done → next story                    │
│  8. If failed → retry (up to 3x)            │
│  9. Repeat until all stories pass           │
└─────────────────────────────────────────────┘
```

## 🖥️ Live UI

The UI connects via WebSocket and shows:
- Story list with status indicators
- Live agent output
- Progress bar with timing
- Start/Stop controls

Events broadcast:
- `stories` — Initial story list
- `story_start` — Story began
- `story_end` — Story completed
- `output` — Agent output line
- `loop_complete` — All done

## 🙏 Credits

- **Ralph Loop** by [@GeoffreyHuntley](https://twitter.com/GeoffreyHuntley)
- **PRD Generator** by [@ryancarson](https://twitter.com/ryancarson) — [ai-dev-tasks](https://github.com/snarktank/ai-dev-tasks)
- **Browser Verification** by [@SawyerHood](https://twitter.com/SawyerHood) — [dev-browser](https://github.com/SawyerHood/dev-browser)

## 📄 License

MIT

---

Built by [@ShvZFR](https://twitter.com/ShvZFR)
