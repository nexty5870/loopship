# LoopShip UI — Product Requirements Document

## Vision

A premium, minimal dark UI for monitoring and controlling the LoopShip Ralph loop. Think Linear meets terminal — clean, purposeful, no visual clutter.

## Design Principles

1. **Dark-first**: Near-black background (#0a0a0a), not dark gray
2. **One accent**: Amber-500 for primary actions and active states
3. **Restrained palette**: Zinc scale for surfaces and borders
4. **Typography**: Inter for UI, Geist Mono for code/output
5. **Whitespace**: Generous, intentional spacing
6. **Subtle motion**: Purposeful transitions, no gratuitous animation
7. **Information density**: Show what matters, hide what doesn't

## Anti-Patterns (Avoid)

- Gradient backgrounds
- Multiple accent colors
- Chunky cards with heavy shadows
- Bright colors on dark backgrounds
- Decorative icons everywhere
- "AI-generated" color schemes

## Core Features

### Story List
- Shows all stories from prd.json
- Status: pending → running → passed/failed/blocked
- Visual: small dot indicator, not big badges
- Currently running story has subtle pulse

### Output Panel  
- Live stream of agent output
- Monospace font (Geist Mono)
- Auto-scroll with scroll-lock option
- Basic syntax highlighting for paths, errors, success

### Controls
- Start/Stop the loop
- Status indicator (Idle / Running Story X/Y / Complete)
- Keyboard shortcuts

### Progress
- X/Y stories complete
- Elapsed time
- Per-story timing on hover

## Technical Stack

- **Vite** — Fast dev, minimal config
- **React** — UI components
- **Tailwind CSS** — Utility-first, customized palette
- **WebSocket** — Live updates from loop (ws://localhost:3099)

## Layout

```
┌──────────────────────────────────────────────────────────┐
│ LoopShip                    │ ● Connected                │
│ ─────────                   ├────────────────────────────│
│ Dashboard                   │ [▶ Start]     Idle         │
│ History                     ├────────────────────────────│
│                             │ Stories          3/8 ━━━━░░│
│                             │ ● 1. Scaffold      ✓ 23s   │
│                             │ ● 2. Layout        ✓ 45s   │
│                             │ ◉ 3. Story list    running │
│                             │ ○ 4. Output panel          │
│                             │ ○ 5. Controls              │
│                             ├────────────────────────────│
│                             │ Output                     │
│                             │ ┌──────────────────────────│
│                             │ │ $ Implementing story 3   │
│                             │ │ Created StoryList.jsx    │
│                             │ │ Added mock data...       │
│                             │ │ ▌                        │
│                             │ └──────────────────────────│
└──────────────────────────────────────────────────────────┘
```

## Stories

See `prd.json` for structured story list with acceptance criteria.

## Future (Not in v1)

- History view (past loop runs)
- Multiple project support
- Cloud sync
- Notifications (system/webhook)
