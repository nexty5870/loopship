# LoopShip 🚀

An open-source web UI for autonomous AI coding loops.

**LoopShip** wraps the Ralph loop pattern into a beautiful interface, letting you:
- Generate PRDs from natural language
- Visualize task progress in real-time
- Route tasks to multiple AI models (Opus, GLM, MiniMax)
- Verify UI changes with browser automation

## How It Works

```
Your feature idea
       ↓
PRD Generator → prd.json
       ↓
Ralph Loop (orchestrator)
       ↓
AI Workers (implement stories)
       ↓
Verification (tests + browser)
       ↓
Git commits
```

## Credits & Inspiration

This project builds on the shoulders of giants:

- **Ralph Loop** by [@GeoffreyHuntley](https://twitter.com/GeoffreyHuntley) — The autonomous coding loop pattern
- **PRD Generator** by [@ryancarson](https://twitter.com/ryancarson) — [ai-dev-tasks](https://github.com/snarktank/ai-dev-tasks) for structured task generation
- **Browser Verification** by [@SawyerHood](https://twitter.com/SawyerHood) — [dev-browser](https://github.com/SawyerHood/dev-browser) for LLM-friendly browser automation

## Architecture

- **Orchestrator**: Claude Opus (complex reasoning, task routing)
- **Workers**: GLM 4.7 / MiniMax M2.1 (code implementation)
- **Verification**: Typecheck, tests, browser screenshots
- **Memory**: Git history + progress.txt

## Status

🚧 **Work in Progress** — Building in public!

## License

MIT

---

Built by [@ShvZFR](https://twitter.com/ShvZFR)
