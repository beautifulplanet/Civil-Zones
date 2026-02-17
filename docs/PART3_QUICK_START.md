# Part 3: Quick Start

*2 minutes. Clone, install, play.*

> **This is a standalone version of Part 3 from the [main README](../README.md).** For the complete document, see the [full README](../README.md).

---

## Prerequisites

| Tool | Version | Required? | What it's for |
|---|---|---|---|
| Node.js | 18+ | **Yes** | Dev server, test runner, build tool |
| npm | 9+ | **Yes** | Package management (comes with Node) |
| Git | 2.30+ | **Yes** | Clone the repo |
| Modern browser | Chrome/Firefox/Edge | **Yes** | Canvas2D rendering |

**That's all.** No Rust. No Python. No Docker. No database. No server. Zero runtime dependencies.

---

## Install & Run

```bash
git clone https://github.com/beautifulplanet/civil-zones.git
cd civil-zones
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). That's it.

Two commands to install. One command to run.

---

## What You'll See

1. An infinite procedurally generated isometric world with grass, forests, water, sand, and stone
2. Your nomad avatar at the center of the screen
3. Animals wandering nearby — deer 🦌, rabbits 🐇, boars 🐗, bears 🐻, bison 🦬
4. Nomads scattered across the landscape — some friendly 👋, some hostile ⚔️
5. A HUD panel (top-left) showing resources, thirst, tribe size, and settlement requirements

---

## Controls

### WANDER Mode (Phase 1 — Nomad Survival)

| Input | Action |
|---|---|
| **Click tile** | Move player to that tile |
| **Click animal** | Hunt (HP-based combat, tribe size → hit chance) |
| **Click nomad** | Recruit (75% friendly) or hostile encounter (25%) |
| **Click water tile** | Drink (restore thirst to 100) |
| **Click berries** | Gather food (20–100, random) |
| **Click trees** | Chop wood (10–30, random) |
| **Drag** | Pan camera |
| **Scroll** | Zoom in/out (0.02× – 3.0×) |
| 💧 Dig Well button | Build well (25 food + 50 wood, restores thirst) |
| 🏛️ SETTLE CITY button | Transition to CITY mode (when requirements met) |

**Survival tips:**
- Thirst decreases by 1 per step — find water or die
- Boars charge and bears counterattack — pick your fights
- Recruit nomads to grow your tribe (bigger tribe → better hit chance)
- Meet settlement requirements: 5+ tribe, 100 food, 40 wood, water access

### CITY Mode (Phase 2 — Civilization Building)

| Input | Action |
|---|---|
| **R / C / I** | Select Residential / Commercial / Industrial zone |
| **W** | Select Well |
| **D** | Select Road |
| **1–6** | Select building level |
| **Click tile** | Place selected building |
| **Space** | End turn (advance 1 year) |
| **Drag** | Pan camera |
| **Scroll** | Zoom |

**Building types:**

| Zone | Key | Buildings | Purpose |
|---|---|---|---|
| Residential | R | 🏕️ R1 → 🏘️ R6 | Housing (15–240 pop) |
| Commercial | C | 🔥 C1 → 🐻 C6 | Jobs + Income (5–320 gold) |
| Industrial | I | 🦅 I1 → 🦬 I6 | Production + Gathering |
| Well | W | 💧 | Water access, desirability |
| Road | D | 🛤️ | +25% zone bonus |

---

## Run Tests

```bash
# Watch mode (re-runs on file change)
npm test

# Single run — 290 tests across 23 files
npm run test:run

# With coverage report
npm run test:coverage
```

**Expected output:**

```
 Test Files  23 passed (23)
      Tests  290 passed (290)
   Duration  ~7s
```

**Coverage:**

```
Statements   : 82.44% ( 742/900 )
Branches     : 70.15% ( 362/516 )
Functions    : 93.28% ( 125/134 )
Lines        : 82.78% ( 678/819 )
```

---

## Build for Production

```bash
npm run build        # TypeScript check + Vite build → dist/
npm run preview      # Serve the built output locally
```

Output is a static `dist/` folder. Deploy to any static host:
- **Vercel:** `vercel --prod`
- **Netlify:** drag-and-drop `dist/`
- **GitHub Pages:** push `dist/` to `gh-pages` branch
- **Any CDN:** upload `dist/` contents

---

## npm Scripts Reference

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `vite` | Start dev server with HMR on port 5173 |
| `npm run build` | `tsc && vite build` | Type-check then bundle to `dist/` |
| `npm run preview` | `vite preview` | Serve production build locally |
| `npm test` | `vitest` | Watch mode test runner |
| `npm run test:run` | `vitest run` | Single test run |
| `npm run test:coverage` | `vitest run --coverage` | Tests + coverage report |

---

## Project Structure (Quick Overview)

```
civil-zones/
├── index.html              # Entry point — <canvas> + UI
├── package.json            # Scripts, zero runtime deps
├── tsconfig.json           # TypeScript 5.9 strict
├── vite.config.ts          # Vite config
├── vitest.config.ts        # Test + coverage config
│
└── src/
    ├── main.ts             # Game orchestrator (634 lines)
    ├── config/             # Building defs, combat, zone bonuses
    ├── core/               # Types, math, noise, resources
    ├── game/               # State, turns, population
    ├── rendering/          # Isometric renderer, water overlay, camera
    ├── simulation/         # Water physics (CFD), flood, weather, worker
    ├── ui/                 # Minimap, warnings
    └── world/              # Tiles, chunks, entities, buildings, player
```

> **Need more detail?** See [Part 4: Full Tutorial](PART4_FULL_TUTORIAL.md) for step-by-step explanations of every system, or the [full README](../README.md).

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `npm install` fails | Ensure Node.js 18+ (`node --version`) |
| Port 5173 in use | Kill other Vite instances or change port in `vite.config.ts` |
| Blank canvas | Check browser console for errors. Ensure no ad blocker interference. |
| Tests fail | Run `npx tsc --noEmit` first to check for TypeScript errors |
| Coverage below threshold | Expected — some modules are excluded (rendering, worker) |

---

## Quick Links

| Document | Purpose |
|---|---|
| [Full README](../README.md) | Everything — Parts 1–4 combined |
| [Part 1: Summary](PART1_SUMMARY.md) | 30-second project overview |
| [Part 2: Tech Stack](PART2_TECH_STACK.md) | Architecture and decisions |
| [Part 4: Full Tutorial](PART4_FULL_TUTORIAL.md) | Complete systems manual + FAQ |

---

*Built with TypeScript and Canvas2D. 290 tests. Pipe-based CFD water simulation. Zero runtime dependencies. One `<canvas>`.*
