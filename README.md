# Civil Zones

A Stone Age civilization builder. Two gameplay phases: WANDER (nomad survival with real-time movement) and CITY (turn-based zone building). Renders on a single `<canvas>` using Canvas2D with isometric projection.

## Project Status

**Prototype — not production-ready.**

- Core systems work: terrain generation, water simulation, economy loop, entity behaviors, zone-based building
- Graphics are procedural Canvas2D shapes, not sprites — the game needs art before it's presentable
- Development is paused while working on sprite designs and evaluating art direction
- All code changes will be reviewed against the roadmap below before implementation

## What Exists

| Area | State | Notes |
|---|---|---|
| Terrain generation | Working | FBM noise, 6 tile types, infinite chunk loading |
| Water simulation | Working | Pipe-based shallow water solver, runs in Web Worker |
| Entity system | Working | 5 animal types + nomads, simple state machines (flee/charge/wander) |
| Building system | Working | 21 building types, zone bonuses, 4-state evolution |
| Economy | Working | Turn-based resource loop, population needs, workforce |
| Rendering | Functional | Procedural shapes only — no sprite assets exist yet |
| Player character | Functional | Procedural red circle, no sprite |
| Save/Load | Not started | — |
| Sound | Not started | — |

## What's Missing (Roadmap)

These items need review and planning before implementation begins:

1. **Sprite artwork** — player, animals, buildings, tiles (blocking — this is why development paused)
2. **Save/Load system** — serialization of game state to localStorage or file
3. **Disaster system** — floods, fires, seasonal events
4. **Smarter entity behaviors** — pathfinding, group behaviors (current system is basic state machines)
5. **UI polish** — menus, tooltips, better HUD layout
6. **Sound/music** — no audio exists
7. **2D version branch** — port to top-down 2D (planned as `2d-canvas` branch)
8. **Vanilla JS port** — plain JavaScript version without TypeScript (planned as `vanilla-js` branch)

## Branches

| Branch | Purpose | Status |
|---|---|---|
| `isometric-ts` | Current isometric TypeScript version | Prototype — this branch |
| `2d-canvas` | Top-down 2D version | Planned — not started |
| `vanilla-js` | Plain JavaScript port | Planned — not started |

## Numbers

| Metric | Value |
|---|---|
| Source files | 31 files, ~5,945 lines |
| Test files | 23 files, ~2,994 lines |
| Total | ~8,939 lines TypeScript |
| Tests | 290, all passing |
| Line coverage | 82.78% |
| Runtime dependencies | 0 |

---

## Documentation

Detailed documentation is split into standalone files:

| Doc | What it covers |
|---|---|
| [docs/PART1_SUMMARY.md](docs/PART1_SUMMARY.md) | Project overview |
| [docs/PART2_TECH_STACK.md](docs/PART2_TECH_STACK.md) | Tech stack, architecture diagrams, design decisions |
| [docs/PART3_QUICK_START.md](docs/PART3_QUICK_START.md) | How to clone, install, run, test |
| [docs/PART4_FULL_TUTORIAL.md](docs/PART4_FULL_TUTORIAL.md) | Deep dive into every system |

---

# Part 2: Tech Stack & Architecture

*1 minute. What's used, how it fits together, and the key design decisions.*

### Stack

| Layer | Technology | Why |
|---|---|---|
| Language | TypeScript 5.9.3 (strict mode) | Type safety, `erasableSyntaxOnly` for spec compliance |
| Bundler | Vite 7.2.4 | Fast HMR, ESNext target, zero-config dev server |
| Rendering | Canvas2D (custom engine) | Full control over pixel-level isometric rendering, no WebGL overhead |
| Testing | Vitest 4.0.18 + @vitest/coverage-v8 | Fast, ESM-native, v8 code coverage with branch-level reporting |
| Water Sim | Custom pipe model (TypeScript) | Shallow water equations, SoA typed arrays, CFL stability |
| Off-thread | Web Worker + Transferable buffers | Zero-copy data transfer for simulation ↔ main thread |
| Target | ES2022, DOM, DOM.Iterable | Modern browser APIs, no polyfills |
| Deploy | Static files — any CDN or `npx vite preview` | Zero server cost, instant deploys |

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                    main.ts                            │    │
│  │         (634 lines — game orchestrator)                │    │
│  │  Phase: WANDER ←→ CITY   Input handling   Game loop   │    │
│  └───┬──────────┬──────────┬──────────┬─────────────────┘    │
│      │          │          │          │                       │
│  ┌───▼───┐  ┌──▼───┐  ┌──▼───┐  ┌──▼──────────────┐        │
│  │ World │  │ Game │  │ UI   │  │ Rendering        │        │
│  │       │  │      │  │      │  │                   │        │
│  │Chunk  │  │State │  │Mini  │  │Renderer (1224 ln) │        │
│  │Manager│  │Turn  │  │map   │  │WaterRenderer      │        │
│  │Terrain│  │Pop   │  │Warn  │  │Camera             │        │
│  │Entity │  │Resrc │  │      │  │                   │        │
│  │Player │  │      │  │      │  │                   │        │
│  │Tile   │  │      │  │      │  │                   │        │
│  │Build  │  │      │  │      │  │                   │        │
│  └───────┘  └──────┘  └──────┘  └───────────────────┘        │
│      │                                                        │
│  ┌───▼────────────────────────────────────────────┐           │
│  │              Simulation Module                  │           │
│  │                                                 │           │
│  │  ShallowWater.ts — Pipe model solver (CFL)      │           │
│  │  FloodMechanics.ts — Damage, dams, drainage     │           │
│  │  WaterSources.ts — Weather, springs, rivers      │           │
│  │  WaterWorker.ts — Off-thread Web Worker          │           │
│  │  types.ts — SoA grid, config, Manning's n        │           │
│  └─────────────────────────────────────────────────┘           │
└────────────────────────────────────────────────────────────────┘
```

### Two-Phase State Machine

```
                    ┌─────────────────────┐
                    │      WANDER         │
                    │                     │
                    │  • Move as nomad    │
                    │  • Hunt animals     │
                    │  • Recruit nomads   │
                    │  • Gather food/wood │
                    │  • Manage thirst    │
                    │  • Dig wells        │
                    └─────────┬───────────┘
                              │
                    Pop ≥ 5, Food ≥ 100,
                    Wood ≥ 40, Water access
                              │
                    ┌─────────▼───────────┐
                    │       CITY          │
                    │                     │
                    │  • Zone buildings   │
                    │  • Turn-based years │
                    │  • Pop management   │
                    │  • Resource economy │
                    │  • Building states  │
                    │  • Water simulation │
                    └─────────────────────┘
```

### Water Simulation Pipeline

```
Each Turn:
  ┌──────────────┐     ┌──────────────┐     ┌────────────────┐
  │ Weather Roll │────→│ Apply Sources │────→│ Solver Steps   │
  │ (seasonal)   │     │ (rain, wells) │     │ (N × fullStep) │
  └──────────────┘     └──────────────┘     └───────┬────────┘
                                                     │
  ┌──────────────┐     ┌──────────────┐     ┌───────▼────────┐
  │ Render Water │←────│Flood Damage  │←────│ Friction/Evap  │
  │ (overlay)    │     │ (buildings)  │     │ (Manning's n)  │
  └──────────────┘     └──────────────┘     └────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| Canvas2D, not WebGL/Three.js | Game is tile-based 2D. Canvas2D is simpler, no shader complexity, pixel-level control |
| Zero runtime deps | Reduces attack surface, bundle size, and maintenance burden. TypeScript + Vite only. |
| SoA over AoS for water grid | 9 parallel Float32Arrays > array of structs. CPU cache lines load contiguous floats for vectorized loops |
| Web Worker for simulation | Water solver is O(N) per step. Off-thread keeps 60fps rendering on main thread |
| Chunk-based infinite world | 64×64 tile chunks generated lazily. Only loaded chunks consume memory |
| Turn-based, not real-time | Allows deep simulation per turn without frame-time pressure |
| Pipe model, not full SWE | Pipe model (Mei et al.) is stable, simple, mass-conserving, and GPU-friendly — ideal for a game |
| `erasableSyntaxOnly` | TypeScript 5.9 spec compliance — no parameter properties, explicit field patterns |

---

# Part 3: Quick Start

*2 minutes. Clone, install, play.*

### Prerequisites

- **Node.js 18+** (includes npm)

That's it. No Rust, no Python, no database, no server. Zero runtime dependencies.

### Install & Run

```bash
git clone https://github.com/beautifulplanet/civil-zones.git
cd civil-zones
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). That's it.

### What You'll See

1. A procedurally generated isometric world with grass, forests, water, sand, and stone
2. A nomad avatar you control by clicking tiles
3. Animals wandering (deer, rabbits, boars, bears, bison) and nomads (friendly/hostile)
4. A HUD showing food, wood, thirst, tribe size, and settlement requirements

### Controls

| Input | Action |
|---|---|
| **Click tile** | Move player / interact (gather, hunt, recruit) |
| **Click animal** | Hunt (HP-based combat, tribe size → hit chance) |
| **Click nomad** | Recruit (75%) or hostile encounter (25%) |
| **Click water** | Drink (restore thirst to 100) |
| **Click berries** | Gather food (20–100) |
| **Click trees** | Chop wood (10–30) |
| **Drag** | Pan camera |
| **Scroll** | Zoom (0.02x – 3.0x) |
| **R / C / I** | Select Residential / Commercial / Industrial |
| **W / D** | Select Well / Road |
| **1–6** | Select building level |
| **Space** | End turn (CITY mode) |

### Run Tests

```bash
npm test                 # Watch mode
npm run test:run         # Single run (290 tests)
npm run test:coverage    # Coverage report (82.78% lines)
```

### Build for Production

```bash
npm run build            # TypeScript check + Vite → dist/
npm run preview          # Serve production build locally
```

> **Need more detail?** See [Part 4: Full Tutorial](#part-4-full-tutorial--deep-dive) for step-by-step explanations, or the [standalone tutorial doc](docs/PART4_FULL_TUTORIAL.md).

---

# Part 4: Full Tutorial & Deep Dive

*The IKEA manual. Step-by-step setup, complete systems reference, architecture deep dive. Everything you need to understand, modify, or rebuild any part of this project.*

> **This section is large.** Use the table of contents below to jump to what you need.
> It's also available as a [standalone document → docs/PART4_FULL_TUTORIAL.md](docs/PART4_FULL_TUTORIAL.md) with its own table of contents.

---

## Part 4 — Table of Contents

### Section A: Setup Guide (IKEA-Style)

- [A1. System Requirements](#a1-system-requirements)
- [A2. Clone & Install](#a2-clone--install)
- [A3. Run the Game](#a3-run-the-game)
- [A4. Run Tests](#a4-run-tests)
- [A5. Build for Production](#a5-build-for-production)
- [A6. Project Configuration Deep Dive](#a6-project-configuration-deep-dive)

### Section B: Interview-Ready Technical Walkthrough

- [B1. System Overview in 60 Seconds](#b1-system-overview-in-60-seconds)
- [B2. The Two-Phase State Machine](#b2-the-two-phase-state-machine)
- [B3. Isometric Coordinate System](#b3-isometric-coordinate-system)
- [B4. Procedural Terrain Generation](#b4-procedural-terrain-generation)
- [B5. Entity System & Behaviors](#b5-entity-system--behaviors)
- [B6. Zone-Based City Building](#b6-zone-based-city-building)
- [B7. Resource Economy & Turn Processing](#b7-resource-economy--turn-processing)
- [B8. Shallow Water Simulation (CFD)](#b8-shallow-water-simulation-cfd)
- [B9. Water Rendering Pipeline](#b9-water-rendering-pipeline)
- [B10. Web Worker Architecture](#b10-web-worker-architecture)

### Section C: Complete Systems Manual

- [C1. World Generation — Chunks, Tiles, and Noise](#c1-world-generation--chunks-tiles-and-noise)
- [C2. Tile Types and Palettes](#c2-tile-types-and-palettes)
- [C3. The Isometric Renderer (1,224 lines)](#c3-the-isometric-renderer-1224-lines)
- [C4. Camera System](#c4-camera-system)
- [C5. Entity System — Animals, Nomads, and Behaviors](#c5-entity-system--animals-nomads-and-behaviors)
- [C6. Combat System](#c6-combat-system)
- [C7. Building System — 21 Types, 4 States](#c7-building-system--21-types-4-states)
- [C8. Zone Bonuses & Adjacency](#c8-zone-bonuses--adjacency)
- [C9. Population Manager](#c9-population-manager)
- [C10. Resource System — 5 Resources](#c10-resource-system--5-resources)
- [C11. Turn Processor — 9-Phase Game Loop](#c11-turn-processor--9-phase-game-loop)
- [C12. Warning System](#c12-warning-system)
- [C13. Minimap](#c13-minimap)
- [C14. Shallow Water Solver — Pipe Model](#c14-shallow-water-solver--pipe-model)
- [C15. Flood Mechanics — Damage, Dams, Drainage](#c15-flood-mechanics--damage-dams-drainage)
- [C16. Water Sources — Weather, Springs, Rivers](#c16-water-sources--weather-springs-rivers)
- [C17. Web Worker — Off-Thread Simulation](#c17-web-worker--off-thread-simulation)
- [C18. Water Renderer — Isometric Overlay](#c18-water-renderer--isometric-overlay)

### Section D: System Design FAQ

- [D1. Why Canvas2D instead of WebGL/Three.js?](#d1-why-canvas2d-instead-of-webglthreejs)
- [D2. Why zero runtime dependencies?](#d2-why-zero-runtime-dependencies)
- [D3. Why a pipe model instead of full shallow water equations?](#d3-why-a-pipe-model-instead-of-full-shallow-water-equations)
- [D4. Why SoA instead of AoS for the water grid?](#d4-why-soa-instead-of-aos-for-the-water-grid)
- [D5. Why a Web Worker for simulation?](#d5-why-a-web-worker-for-simulation)
- [D6. How would you scale the world to millions of tiles?](#d6-how-would-you-scale-the-world-to-millions-of-tiles)
- [D7. Why turn-based instead of real-time?](#d7-why-turn-based-instead-of-real-time)
- [D8. How do you test a Canvas2D game?](#d8-how-do-you-test-a-canvas2d-game)
- [D9. What would you do differently if you started over?](#d9-what-would-you-do-differently-if-you-started-over)
- [D10. How does the building state evolution work?](#d10-how-does-the-building-state-evolution-work)

### Section E: Project Structure

- [E1. File Map](#e1-file-map)

### Section F: Testing & Coverage Reference

- [F1. Test Architecture](#f1-test-architecture)
- [F2. Coverage Report](#f2-coverage-report)
- [F3. Test Categories](#f3-test-categories)

---

## A1. System Requirements

| Tool | Version | Required? | What it's for |
|---|---|---|---|
| Node.js | 18+ | **Yes** | Dev server, test runner, build tool |
| npm | 9+ | **Yes** | Package management (comes with Node) |
| Git | 2.30+ | **Yes** | Clone the repo |
| Modern browser | Chrome/Firefox/Edge | **Yes** | Canvas2D rendering |

**That's all.** No Rust. No Python. No Docker. No database. No server. The entire game runs in the browser from static files.

---

## A2. Clone & Install

**Step 1: Clone**

```bash
git clone https://github.com/beautifulplanet/civil-zones.git
cd civil-zones
```

**Step 2: Install dependencies**

```bash
npm install
```

This installs: TypeScript 5.9.3 (compiler), Vite 7.2.4 (dev server & bundler), Vitest 4.0.18 (test runner), @vitest/coverage-v8 (coverage). **Zero runtime dependencies.**

Done. Two commands.

---

## A3. Run the Game

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

You should see:
- An infinite isometric world with procedural terrain
- Your nomad avatar at the center
- Animals (deer 🦌, rabbits 🐇, boars 🐗, bears 🐻, bison 🦬) roaming nearby
- Nomads (friendly 👋 or hostile ⚔️) scattered across the landscape
- A HUD panel showing resources, thirst, tribe size, and settlement requirements

**Goal in WANDER mode:** Gather food, recruit nomads, stay hydrated, then settle a city.

**Goal in CITY mode:** Place buildings (Residential, Commercial, Industrial), manage population, and grow your civilization.

---

## A4. Run Tests

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

## A5. Build for Production

```bash
npm run build        # tsc + vite build → dist/
npm run preview      # Serve the built output locally
```

Output is a static `dist/` folder deployable to any CDN (Vercel, Netlify, Cloudflare Pages, GitHub Pages).

---

## A6. Project Configuration Deep Dive

### TypeScript (`tsconfig.json`)

| Setting | Value | Why |
|---|---|---|
| `target` | ES2022 | Modern JS features, no polyfills |
| `module` | ESNext | Native ES modules |
| `moduleResolution` | bundler | Vite-compatible resolution |
| `strict` | true | All strict type checks enabled |
| `erasableSyntaxOnly` | true | TS 5.9 spec — no parameter properties |
| `noUnusedLocals` | true | Dead code prevention |
| `noUnusedParameters` | true | Dead code prevention |
| `noFallthroughCasesInSwitch` | true | Switch exhaustiveness |
| `verbatimModuleSyntax` | true | Explicit `type` imports |

### Vite (`vite.config.ts`)

| Setting | Value | Why |
|---|---|---|
| `base` | `./` | Relative paths — works from any URL |
| `server.port` | 5173 | Default Vite port |
| `build.target` | esnext | No transpilation overhead |

### Vitest (`vitest.config.ts`)

| Setting | Value | Why |
|---|---|---|
| `globals` | true | No `import { describe }` boilerplate |
| `environment` | node | Fastest. No DOM mocking needed for logic tests |
| Coverage thresholds | 60% stmts/lines/functions, 50% branches | Enforced minimums |
| Excluded from coverage | `main.ts`, `rendering/**`, `ui/Minimap.ts`, `WaterWorker.ts`, `index.ts` | Browser-only or barrel exports |

---

## B1. System Overview in 60 Seconds

One `<canvas>` element. Zero frameworks. Four module groups:

1. **World** (7 files) — Procedural chunk-based terrain, tiles, entities, buildings, player
2. **Game** (3 files) — State machine, turn processor, population manager, resource economy
3. **Simulation** (6 files) — Pipe-based shallow water solver, flood damage, weather, Web Worker
4. **Rendering** (3 files) — Isometric Canvas2D renderer (1,224 lines), water overlay, camera

**Key insight:** The game runs entirely client-side with zero server communication. The simulation module runs in a Web Worker for 60fps rendering while computing water physics off-thread.

---

## B2. The Two-Phase State Machine

The game has two distinct phases controlled by `GamePhase: 'WANDER' | 'CITY'`.

**WANDER Mode:**
- Direct character control (click to move)
- Real-time animal behaviors (flee, charge, patrol)
- Thirst system (decreases per step, death at 0)
- Resource gathering (berries → food, trees → wood)
- Nomad recruitment (75% friendly, 25% hostile)
- Settlement requirements checklist (pop, food, wood, water)

**CITY Mode:**
- Turn-based (1 turn = 1 year)
- Zone placement (R/C/I buildings, wells, roads)
- 9-phase turn processor (needs → workforce → production → consumption → spoilage → growth → state updates → year → stats)
- Building state evolution (Vacant → Developing → Established → Premium)
- Zone bonus adjacency calculations

**Transition:** Triggered by "Settle" button when requirements met. One-way — no going back to WANDER.

---

## B3. Isometric Coordinate System

2:1 isometric projection with tile dimensions 64×32 pixels:

```
TILE_WIDTH  = 64    TILE_HEIGHT = 32

Screen coordinates (pixels):
  sx = (worldX - worldY) × TILE_HALF_W × zoom + viewportW/2 - camX × zoom
  sy = (worldX + worldY) × TILE_HALF_H × zoom + viewportH/2 - camY × zoom

World coordinates (tiles):
  Inverse of the above — see canvasToWorld() in math.ts
```

The isometric diamond shape per tile:

```
        ╱╲
      ╱    ╲        Width: 64px
    ╱   Tile  ╲     Height: 32px
    ╲        ╱
      ╲    ╱
        ╲╱
```

---

## B4. Procedural Terrain Generation

`TerrainGenerator` uses FBM (Fractal Brownian Motion) noise with multiple octaves:

```
elevation = fbm(x × 0.02, y × 0.02, octaves=4)   // 0.0 – 1.0
moisture  = fbm(x × 0.03, y × 0.03, octaves=3)   // 0.0 – 1.0
variant   = noise(x × 0.05, y × 0.05)             // Detail variation

Tile type:
  elevation < 0.15  → WATER
  elevation < 0.25  → SAND
  elevation > 0.70  → STONE
  moisture > 0.55   → FOREST
  variant-based     → DIRT patches
  default           → GRASS (4 shade variants)
```

Resources distributed by tile type:
- Berries on GRASS/FOREST tiles (20% chance)
- Trees on FOREST tiles (70%) and GRASS (30%)
- Ore deposits: Iron near STONE, Gold rare on STONE, Stone deposits widespread

---

## B5. Entity System & Behaviors

438-line entity system with config-driven behavior state machines:

| Entity | HP | Behavior | Food Reward | Risk |
|---|---|---|---|---|
| Deer 🦌 | 2 | Flee (fast) | 15–35 | Low |
| Rabbit 🐇 | 1 | Flee (very fast) | 5–20 | Low |
| Boar 🐗 | 3 | **Charge** (attacks back) | 10–40 | High |
| Bear 🐻 | 3 | **Aggressive** (30% counter) | 20–50 | High |
| Bison 🦬 | 3 | Flee (medium) | 15–35 | Medium |
| Nomad 👤 | — | Wave / Dance / Chase animals | — | 25% hostile |

**Combat math:** Hit chance = `0.3 + tribeSize × 0.1` (capped at 0.95). Each hit deals 1 HP. Dangerous animals counterattack on miss (30% chance → 1 population lost).

**Behavior states:** `idle` → `moving` → `fleeing` / `charging` → `dying`. Entities react to player proximity (flee radius per type). Nomads have unique behaviors: wave club, dance, chase nearby animals.

---

## B6. Zone-Based City Building

21 building types across 6 levels, organized by zone:

| Zone | IDs | Purpose | Key Stat |
|---|---|---|---|
| Residential | R1–R6 | Housing | `populationMax`: 15 → 240 |
| Commercial | C1–C6 | Jobs + Income | `income`: 5 → 320 gold/turn |
| Industrial | I1–I6 | Production + Gathering | `production`: 10 → 240 |
| Special | WELL, ROAD, CHIEF_HUT | Infrastructure | Desirability, unlocks |

**Building states** (4-state evolution):
| State | Name | Efficiency |
|---|---|---|
| 0 | Vacant/Abandoned | 0.0× |
| 1 | Developing | 0.5× |
| 2 | Established | 1.0× |
| 3 | Premium/Thriving | 1.5× |

Residential buildings evolve based on population fill. Each building has a unique name per state (e.g., R1: "Abandoned Transient Camp" → "Makeshift Transient Shelter" → "Hobo Camp" → "Fortified Transient Encampment").

**Level 4+ buildings** require the CHIEF_HUT milestone building (cost: 100,000 food + 100,000 wood + 1 gold).

---

## B7. Resource Economy & Turn Processing

**5 resources:** Food 🍖, Wood 🪵, Stone 🪨, Metal 🛠️, Gold 🥇

**Turn processor** runs a 9-phase loop each year:

| Phase | Operation |
|---|---|
| 1 | Calculate population needs (housing, water, food, jobs) |
| 2 | Allocate workforce by priority (Road → Commercial → Industrial → Gatherers) |
| 3 | Produce resources from industrial buildings + gather bonuses |
| 4 | Consume food (1 per person per year) |
| 5 | Apply spoilage (20% food if no storage, 10% wood) |
| 6 | Calculate population change (births - starvation - dehydration) |
| 7 | Update building states based on occupancy |
| 8 | Advance year counter |
| 9 | Generate stats report |

**Zone bonuses** (adjacency system): Road access +25%, water proximity +15%, well proximity +10%, residential clustering +5% per neighbor, industrial near stone +15%. Isolation penalty −20% if no neighbors within 3 tiles.

---

## B8. Shallow Water Simulation (CFD)

Pipe-based shallow water model based on Mei et al. (2007). The core algorithm:

**Per simulation step (5 phases):**

1. **Flux update:** For each cell, compute flux through 4 pipes (N/S/E/W) based on hydraulic head difference:

$$f_{new} = \max(0, f_{old} + \Delta t \cdot A \cdot g \cdot \Delta h / L)$$

2. **Flux scaling:** If outflow would drain cell below zero, scale all outgoing flux:

$$k = \min(1, \frac{h \cdot L^2}{\Delta t \cdot \sum f_{out}})$$

3. **Depth update:** Apply continuity equation (mass conservation):

$$h_{new} = h_{old} + \frac{\Delta t}{L^2} (\sum f_{in} - \sum f_{out})$$

4. **Velocity computation:** Average flux across cell faces for rendering:

$$v_x = \frac{f_{right} - f_{left}}{2 \cdot L \cdot h}, \quad v_y = \frac{f_{top} - f_{bottom}}{2 \cdot L \cdot h}$$

5. **Friction:** Manning's roughness formula decays velocity per tile type:

| Tile Type | Manning's $n$ | Description |
|---|---|---|
| GRASS | 0.030 | Light vegetation |
| WATER | 0.010 | Open channel |
| SAND | 0.025 | Smooth bed |
| STONE | 0.035 | Rocky surface |
| FOREST | 0.100 | Heavy vegetation |
| DIRT | 0.020 | Bare earth |

**CFL stability:** Timestep is dynamically computed:

$$\Delta t = 0.9 \times \frac{L}{\sqrt{g \cdot h_{max}}}$$

**Mass conservation verified by tests:** Total water volume is preserved within floating-point tolerance.

---

## B9. Water Rendering Pipeline

`WaterRenderer` draws a translucent isometric overlay:

1. **Frustum culling:** Only render cells within the camera viewport
2. **Depth-based coloring:** Shallow water = light blue (rgba 100,180,255), deep water = dark blue (rgba 20,60,180)
3. **Alpha scaling:** Opacity increases with depth (0.3 → 0.9)
4. **Flow arrows:** When zoomed in (>1.5×), directional arrows show velocity field
5. **Isometric projection:** Each water cell rendered as a filled diamond matching the tile grid

---

## B10. Web Worker Architecture

`WaterWorker.ts` runs the simulation off the main thread:

```
Main Thread                    Web Worker
┌──────────┐                  ┌──────────────┐
│          │  InitMessage     │              │
│  Game    │ ─────────────→   │  ShallowWater│
│  Loop    │  (terrain,       │  Solver      │
│          │   depth,         │              │
│          │   config)        │              │
│          │                  │              │
│          │  StepMessage     │              │
│          │ ─────────────→   │  fullStep()  │
│          │  (N steps,       │  × N         │
│          │   rain flag)     │              │
│          │                  │              │
│          │  ResultMessage   │              │
│          │ ←─────────────   │              │
│          │  (depth, velX,   │              │
│          │   velY buffers)  │              │
│  Render  │  [Transferable]  │              │
└──────────┘                  └──────────────┘
```

**Zero-copy transfer:** Depth, velocity X, and velocity Y buffers are sent as `Transferable` ArrayBuffers — no serialization, no copying. The worker creates new buffers for the next step while the main thread uses the transferred ones for rendering.

---

## C1. World Generation — Chunks, Tiles, and Noise

### Chunk System

The world is divided into 64×64 tile chunks. `ChunkManager` generates chunks lazily on first access:

```typescript
CHUNK_SIZE = 64;  // 64 × 64 = 4,096 tiles per chunk

// Chunk key: "chunkX,chunkY"
// World tile (100, 200) → chunk (1, 3), local (36, 8)
```

Chunks are cached in a `Map<string, Chunk>`. No chunk unloading (infinite memory growth bounded by exploration radius).

### Noise Generator

`NoiseGenerator` uses a simple hash-based noise function with FBM layering:

```typescript
// Pseudocode for terrain height
fbm(x, y, octaves) {
  let value = 0, amplitude = 1, frequency = 1;
  for (i = 0; i < octaves; i++) {
    value += noise(x * frequency, y * frequency) * amplitude;
    amplitude *= 0.5;   // Each octave contributes less
    frequency *= 2.0;   // Each octave is higher frequency
  }
  return value / totalAmplitude;  // Normalize to 0–1
}
```

---

## C2. Tile Types and Palettes

6 tile types with Sega Genesis-style 4-color palettes:

| Type | Enum | Base Color | Highlight | Shadow | Dither |
|---|---|---|---|---|---|
| GRASS | 0 | `#4a8c3f` | `#5ca04e` | `#3a7030` | `#448035` |
| WATER | 1 | `#2266aa` | `#3388cc` | `#1a5588` | `#2070b0` |
| SAND | 2 | `#c8b060` | `#d8c470` | `#b09848` | `#c0a858` |
| STONE | 3 | `#808080` | `#989898` | `#686868` | `#787878` |
| FOREST | 4 | `#2d6b2e` | `#3d8040` | `#1d5020` | `#286028` |
| DIRT | 5 | `#8b6f47` | `#a08050` | `#705838` | `#806040` |

GRASS has 4 variants for visual variety (light, medium, dark, yellow-green), selected by a variant noise layer.

Each tile also has optional properties: `hasBerries`, `hasTrees`, `oreType` (iron/gold/stone), `oreAmount`.

---

## C3. The Isometric Renderer (1,224 lines)

The `Renderer` class handles all drawing via Canvas2D. Key methods:

| Method | Lines | Purpose |
|---|---|---|
| `render()` | ~40 | Main loop: clear, draw tiles, buildings, entities, player |
| `drawTile()` | ~100 | Isometric diamond with dither pattern, highlight edge, shadow edge |
| `drawBuilding()` | ~80 | Dispatches to type-specific building renderer |
| `drawResidential()` | ~120 | R1–R6 with state-dependent detail (tent poles, hides, smoke) |
| `drawCommercial()` | ~100 | C1–C6 with fire effects, pelts, canopy details |
| `drawIndustrial()` | ~100 | I1–I6 with tools, carcasses, drying racks |
| `drawWell()` | ~40 | Stone ring, bucket, rope detail |
| `drawRoad()` | ~30 | Flattened diamond with edge markings |
| `drawEntity()` | ~80 | Dispatches to type-specific entity renderer |
| `drawDeer/Bear/etc.` | ~50 each | Pixel-art animals with directional facing and state animations |
| `drawNomad()` | ~60 | Humanoid with club, behavior-dependent animation |
| `drawPlayer()` | ~40 | Player avatar with directional facing |

**Rendering order:** Back-to-front (painter's algorithm) by isometric Y, then X. Entities and buildings rendered after their ground tile.

**Tile drawing technique:** Each tile is a filled isometric diamond with:
1. Base color fill
2. Checkerboard dither overlay (every other pixel)
3. Top-left highlight edge (2px lighter)
4. Bottom-right shadow edge (2px darker)
5. Outline stroke

---

## C4. Camera System

41-line `Camera` class:

| Property | Default | Range |
|---|---|---|
| `x`, `y` | 0, 0 | Any world coordinate |
| `zoom` | 1.0 | 0.02 – 3.0 |

**Pan:** Screen delta → world delta conversion accounting for zoom level.

**Zoom:** Zoom-to-cursor — adjusts camera position so the point under the cursor stays fixed:

```typescript
zoomAt(screenX, screenY, direction) {
  const factor = direction > 0 ? 1.1 : 0.9;
  const newZoom = clamp(this.zoom * factor, 0.02, 3.0);
  // Adjust camera so cursor worldpoint stays fixed
  this.zoom = newZoom;
}
```

---

## C5. Entity System — Animals, Nomads, and Behaviors

438 lines implementing a full entity lifecycle:

**Entity creation:** Factory function `createEntity()` pulls stats from `ANIMAL_CONFIG`:

```typescript
interface Entity {
  id: number;
  type: EntityType;      // 'ANIMAL_DEER' | ... | 'NOMAD'
  x: number; y: number;
  health: number;
  maxHealth: number;
  state: EntityState;    // 'idle' | 'moving' | 'fleeing' | 'charging' | 'dying'
  isHostile?: boolean;   // Nomads only (25% chance)
  behavior?: string;     // Nomad behavior: 'chase' | 'wave' | 'dance'
}
```

**EntityManager** (class, 438 lines total):
- `spawnEntitiesInArea()` — Bulk spawn with per-type counts
- `update()` — Per-frame behavior: movement toward target, flee/charge reactions
- `getEntityAt()` — Spatial lookup with radius hitbox
- `fleeFrom()` — Set flee direction away from threat
- `removeEntity()` — Death/recruitment removal

**Behaviors per type:**
| Behavior | Trigger | Action |
|---|---|---|
| Flee | Player within flee radius | Run opposite direction |
| Charge | Boar: player within 5 tiles | Rush toward player |
| Aggressive | Bear: player within 3 tiles | Attack on contact |
| Wander | No threats nearby | Random movement |
| Wave | Nomad: idle | Wave club animation |
| Dance | Nomad: idle (variant) | Dance animation |
| Chase | Nomad: animal nearby | Chase nearest animal |

---

## C6. Combat System

Defined in `CombatConfig.ts` (127 lines):

**Hit chance formula:**

$$P(\text{hit}) = \min(0.95, \; 0.3 + \text{tribeSize} \times 0.1)$$

**Animal stats:**

| Animal | HP | Min Food | Max Food | Flee Radius | Behavior |
|---|---|---|---|---|---|
| Deer | 2 | 15 | 35 | 8 | Flee |
| Rabbit | 1 | 5 | 20 | 10 | Flee |
| Boar | 3 | 10 | 40 | 5 | Charge |
| Bear | 3 | 20 | 50 | 3 | Aggressive |
| Bison | 3 | 15 | 35 | 6 | Flee |

**Counterattack:** On miss vs. boar/bear, 30% chance of losing 1 population.

**Nomad encounters:**
- 75% friendly → recruit to tribe (+1 pop)
- 25% hostile → lose 1–2 population

**Inventory limits (WANDER mode):** 300 food, 300 wood maximum.

---

## C7. Building System — 21 Types, 4 States

### Complete Building Database

**Residential (R1–R6):**

| ID | Name | Cost (F/W/S) | Pop Max | Income | Unlock Pop |
|---|---|---|---|---|---|
| R1 | Hobo Camp | 100/100/0 | 15 | 1 | 0 |
| R2 | Straw Pit Shelter | 300/300/50 | 30 | 3 | 50 |
| R3 | Cave Dwelling | 900/900/200 | 60 | 8 | 200 |
| R4 | Wigwam Village | 2,000/2,000/40 | 90 | 16 | 500 🏠 |
| R5 | Papyrus Hut | 8,000/8,000/80 | 150 | 32 | 1,000 🏠 |
| R6 | Stuga Village | 20,000/20,000/100 | 240 | 64 | 2,000 🏠 |

**Commercial (C1–C6):**

| ID | Name | Cost (F/W/S) | Jobs | Income | Desirability |
|---|---|---|---|---|---|
| C1 | Pebble Trade Fire | 150/150/0 | 8 | 5 | 0.2 |
| C2 | Squirrel Trade Camp | 400/400/50 | 20 | 15 | 0.3 |
| C3 | Fire Meet Camp | 1,200/1,200/200 | 50 | 40 | 0.4 |
| C4 | Barter Barrel | 1,600/1,600/32 | 16 | 80 | 0.35 🏠 |
| C5 | Blanket Market | 6,400/6,400/64 | 40 | 160 | 0.45 🏠 |
| C6 | Bear Market | 16,000/16,000/80 | 100 | 320 | 0.55 🏠 |

**Industrial (I1–I6):**

| ID | Name | Cost (F/W/S) | Jobs | Production | Food Bonus |
|---|---|---|---|---|---|
| I1 | Bird Hunting Range | 200/200/0 | 10 | 10 | +5 |
| I2 | Grub Digging Pit | 500/500/100 | 25 | 25 | +10 |
| I3 | Stone Knapping Site | 1,500/1,500/500 | 60 | 60 | +15 |
| I4 | Turtle Hunting Ground | 2,400/2,400/48 | 20 | 50 | +30 🏠 |
| I5 | Bear Pit | 9,600/9,600/96 | 50 | 120 | +60 🏠 |
| I6 | Buffalo Grounds | 24,000/24,000/120 | 120 | 240 | +120 🏠 |

**Special:**

| ID | Name | Cost | Purpose |
|---|---|---|---|
| WELL | Water Well | 50F + 200W | Water access, +0.15 desirability (r=6) |
| ROAD | Road | 10W | Movement, +25% zone bonus |
| CHIEF_HUT | Clan Chief's Hut | 100K F + 100K W + 1G | Unlocks Level 4–6, +2.0 desirability (r=50) |

🏠 = Requires CHIEF_HUT

---

## C8. Zone Bonuses & Adjacency

`ZoneBonuses.ts` calculates placement efficiency multipliers:

| Bonus | Condition | Multiplier |
|---|---|---|
| Road access | Road within 2 tiles | +25% |
| Water proximity | Water tile within 3 tiles | +15% |
| Well proximity | Well within 4 tiles | +10% |
| Residential cluster | Adjacent residential building | +5% per neighbor |
| Industrial + Stone | Stone tile within 3 tiles | +15% |
| Commercial + Road | Road within 1 tile | +10% |
| Isolation penalty | No buildings within 3 tiles | −20% |

The final efficiency is `max(0, 1.0 + sum(bonuses))` and stored on the building instance at placement time.

---

## C9. Population Manager

`PopulationManager.ts` (170 lines) handles three concerns:

**1. Needs Calculation:**
- Housing need: total residential `populationMax` vs. current population
- Water need: wells within range of residential buildings
- Food need: food in storage vs. population × 1 per year
- Job need: total commercial + industrial `jobs` vs. workforce

**2. Workforce Allocation** (priority order):
1. Roads (maintenance)
2. Commercial buildings (income generation)
3. Industrial buildings (resource production)
4. Remaining → gatherers (bonus food/wood)

**3. Population Growth:**
- Growth when needs satisfied: +2–5% per year
- Starvation: population loss proportional to food deficit
- Dehydration: population loss if no water access
- Minimum population: 1 (game over prevention)

---

## C10. Resource System — 5 Resources

### Resource Types

| Resource | Icon | Primary Source | Primary Sink |
|---|---|---|---|
| Food | 🍖 | Hunting, berries, industrial | Population consumption (1/person/year) |
| Wood | 🪵 | Tree chopping, industrial | Building construction, upkeep |
| Stone | 🪨 | Deposits, industrial | Building construction (L2+) |
| Metal | 🛠️ | Mining, advanced industrial | Advanced buildings |
| Gold | 🥇 | Metal conversion (500K:1) | CHIEF_HUT, prestige buildings |

### Resource Manager

`ResourceManager` wraps pure functions in `Resources.ts`:

- `add(amounts)` — Clamped to capacity
- `subtract(amounts)` — Floor at 0
- `canAfford(cost)` — Check all 5 resources
- `applySpoilage()` — 20% food loss, 10% wood loss per turn
- `applyConsumption(pop)` — 1 food per person per year

### Capacity Defaults

| Resource | Starting Capacity |
|---|---|
| Food | 10,000 |
| Wood | 10,000 |
| Stone | 5,000 |
| Metal | 1,000 |
| Gold | 100 |

---

## C11. Turn Processor — 9-Phase Game Loop

`TurnProcessor.ts` runs the complete economic cycle:

```typescript
function processTurn(state: GameState): TurnResult {
  // Phase 1: Calculate needs
  const needs = calculateNeeds(state.buildings, state.population);

  // Phase 2: Allocate workforce
  const workforce = allocateWorkforce(state.buildings, state.population);

  // Phase 3: Produce resources
  const produced = calculateProduction(state.buildings, workforce);
  state.resources.add(produced);

  // Phase 4: Consume food
  const consumed = state.population;  // 1 food per person
  state.resources.subtract({ food: consumed });

  // Phase 5: Spoilage
  state.resources.applySpoilage();

  // Phase 6: Population change
  const popChange = calculatePopulationChange(needs, state);
  state.population += popChange;

  // Phase 7: Update building states
  updateBuildingStates(state.buildings, state.population);

  // Phase 8: Advance year
  state.year++;

  // Phase 9: Generate report
  return { year: state.year, events, stats... };
}
```

---

## C12. Warning System

`WarningSystem.ts` generates priority-tagged warnings:

| Warning | Trigger | Color | Flash |
|---|---|---|---|
| Thirst OK | 70–100 | — | No |
| Thirst Caution | 50–70 | Yellow | No |
| Thirst Warning | 30–50 | Orange | No |
| Thirst Danger | 10–30 | Red | Yes |
| Thirst Critical | 0–10 | Red | Yes (pulsing) |
| Food Low | <50 food | Orange | No |
| Danger | Any critical <10% | Red | Yes |

Each warning is a typed object: `{ message, color, priority, flash }`.

---

## C13. Minimap

`Minimap.ts` (122 lines) renders a 200×200px corner overlay:

- **Fog of war:** Only explored tiles visible (exploration radius = 10 tiles around player)
- **Color coding:** Matches tile type colors (green=grass, blue=water, etc.)
- **Player marker:** Red dot at current position
- **Viewport rectangle:** White outline showing main camera view
- **Visibility toggle:** Hidden in CITY mode, visible in WANDER mode

---

## C14. Shallow Water Solver — Pipe Model

The complete solver is in `ShallowWater.ts` (299 lines). This section explains the math.

### Pipe Model (Mei et al. 2007)

Instead of solving the full shallow water equations ($\partial h/\partial t + \nabla \cdot (h\mathbf{v}) = 0$), the pipe model represents flow between adjacent cells as flux through virtual pipes.

**Advantages:**
- Unconditionally mass-conserving (flux scaling prevents negative depth)
- Simple implementation (no Riemann solvers)
- Naturally handles dry cells (zero flux when dry)

### Data Layout (SoA)

```typescript
interface WaterGrid {
  width: number;
  height: number;
  terrain:    Float32Array;  // Ground elevation
  depth:      Float32Array;  // Water depth
  fluxRight:  Float32Array;  // → pipe flux
  fluxUp:     Float32Array;  // ↑ pipe flux
  fluxLeft:   Float32Array;  // ← pipe flux
  fluxDown:   Float32Array;  // ↓ pipe flux
  velX:       Float32Array;  // Velocity X (for rendering)
  velY:       Float32Array;  // Velocity Y (for rendering)
  tileTypes:  Uint8Array;    // TileType enum (for Manning's n)
}
```

9 Float32Arrays + 1 Uint8Array = 37 bytes per cell. A 128×128 grid = ~600 KB.

### Algorithm per Step

**Phase 1 — Flux update:**
For each cell $(i,j)$ and each direction $d$:

$$f_d^{n+1} = \max\left(0, \; f_d^n + \Delta t \cdot A \cdot g \cdot \frac{\Delta h_d}{L}\right)$$

where $\Delta h_d$ = hydraulic head difference = $(h_i + z_i) - (h_j + z_j)$, $A$ = pipe cross-section area = $L \times 1$, $g = 9.81$, $L$ = cell size.

**Phase 2 — Flux scaling:**
If total outflow exceeds available water:

$$k = \min\left(1, \; \frac{h \cdot L^2}{\Delta t \cdot (f_R + f_U + f_L + f_D)}\right)$$

All outgoing fluxes multiplied by $k$.

**Phase 3 — Depth update (continuity):**

$$h^{n+1} = h^n + \frac{\Delta t}{L^2} \left( f_{in,R} + f_{in,U} + f_{in,L} + f_{in,D} - f_{out,R} - f_{out,U} - f_{out,L} - f_{out,D} \right)$$

**Phase 4 — Velocity (for rendering only):**

$$v_x = \frac{f_R^{out} - f_L^{out} + f_R^{in} - f_L^{in}}{2Lh}, \quad v_y = \frac{f_U^{out} - f_D^{out} + f_U^{in} - f_D^{in}}{2Lh}$$

**Phase 5 — Manning friction:**
Velocity decays based on Manning's roughness $n$:

$$\text{decay} = 1 - \Delta t \cdot g \cdot \frac{n^2}{h^{4/3}} \cdot |\mathbf{v}|$$

### CFL Stability

The timestep is dynamically computed to satisfy the Courant–Friedrichs–Lewy condition:

$$\Delta t_{stable} = 0.9 \times \frac{L}{\sqrt{g \cdot h_{max}}}$$

Safety factor 0.9 prevents instability at the theoretical limit.

---

## C15. Flood Mechanics — Damage, Dams, Drainage

`FloodMechanics.ts` (169 lines) connects water simulation to gameplay:

### Flood Damage

| Constant | Value | Purpose |
|---|---|---|
| `FLOOD_DAMAGE_THRESHOLD` | 0.05m | Minimum depth to cause damage |
| `DAMAGE_SCALE` | 1.5 | Efficiency loss per meter of water |
| `MAX_DAMAGE` | 0.9 | Maximum efficiency loss (90%) |

**Damage formula:**

$$\text{damage} = \min(0.9, \; (h - 0.05) \times 1.5)$$

Buildings in flooded cells lose efficiency proportional to water depth.

### Terrain Modification

**Dams/Levees:** `applyDamToTerrain(grid, x, y, height)` — Raises terrain elevation to create barriers.

**Drainage Channels:** `applyDrainageChannel(grid, x, y, depth, width)` — Lowers terrain and sets flow multiplier to attract water away from buildings.

---

## C16. Water Sources — Weather, Springs, Rivers

`WaterSources.ts` (134 lines) manages water input to the simulation:

### Seasonal Weather

| Season | Index | Rain Chance | Evap Multiplier |
|---|---|---|---|
| Spring | 0 | 40% | 1.0× |
| Summer | 1 | 20% | 1.5× |
| Autumn | 2 | 50% | 0.8× |
| Winter | 3 | 30% | 0.3× |

Season determined by turn number: `season = Math.floor((turn % 4))`.

**Rain roll:** Each turn, `rollRainfall()` generates a `WeatherState`:
- `isRaining`: boolean (per-season probability)
- `rainIntensity`: 0.5–1.5× base rain rate
- `evapIntensity`: seasonal evap multiplier

### Point Sources

```typescript
createSpring(x, y)       // 0.01 m³/s — persistent water source
createRiverInlet(x, y)   // 0.1 m³/s — high-volume water input
```

`applyPointSources()` adds water depth at source locations each step.

`applyWeather()` calls `addRainfall()` and `applyEvaporation()` with seasonal parameters.

---

## C17. Web Worker — Off-Thread Simulation

`WaterWorker.ts` (115 lines) runs the solver in a dedicated thread:

### Message Protocol

| Message | Direction | Payload |
|---|---|---|
| `InitMessage` | Main → Worker | terrain, depth, config (width, height, all grid arrays) |
| `StepMessage` | Main → Worker | stepCount (N steps to run), optional rain flag |
| `ResultMessage` | Worker → Main | depth, velX, velY (3 Float32Arrays as Transferable) |
| `ReadyMessage` | Worker → Main | Acknowledgment after init |

### Transferable ArrayBuffer Protocol

```typescript
// Worker sends results with zero-copy transfer
const depthBuffer = new Float32Array(grid.depth).buffer;
const velXBuffer  = new Float32Array(grid.velX).buffer;
const velYBuffer  = new Float32Array(grid.velY).buffer;

self.postMessage(
  { type: 'result', depth: depthBuffer, velX: velXBuffer, velY: velYBuffer },
  [depthBuffer, velXBuffer, velYBuffer]  // Transferable — ownership moves, no copy
);
```

After transfer, the worker's references to these buffers become detached. New buffers are created for the next simulation step.

---

## C18. Water Renderer — Isometric Overlay

`WaterRenderer.ts` (184 lines) renders the simulation results:

### Rendering Pipeline

1. **Skip if no data:** Early return if water grid not initialized
2. **Compute visible bounds:** Camera viewport → world tile range
3. **For each visible cell with depth > threshold:**
   a. Compute isometric screen position
   b. Compute color from depth (light blue → dark blue gradient)
   c. Draw filled isometric diamond with translucent fill
4. **Flow arrows** (when zoom > 1.5×):
   - Arrow direction from `velX`, `velY`
   - Arrow length proportional to velocity magnitude
   - Drawn as 2-line arrow heads

### Depth → Color Mapping

```typescript
function waterColor(depth: number): [number, number, number, number] {
  const t = Math.min(1, depth / 2.0);  // Normalize: 0m–2m → 0.0–1.0
  return [
    Math.floor(100 - 80 * t),   // R: 100→20
    Math.floor(180 - 120 * t),  // G: 180→60
    Math.floor(255 - 75 * t),   // B: 255→180
    0.3 + 0.6 * t               // A: 0.3→0.9
  ];
}
```

---

## D1. Why Canvas2D instead of WebGL/Three.js?

**The game is 2D tile-based.** WebGL/Three.js adds complexity (shaders, geometry buffers, projection matrices) that provides no benefit for filled isometric diamonds and pixel art.

Canvas2D advantages for this project:
- Direct pixel control (`fillRect`, `strokePath`, `fillText`)
- No shader compilation, no GPU state management
- Simpler debugging (no GPU pipeline opacity)
- ~1,224 lines of renderer code. WebGL equivalent would be 3,000+.
- Works on every browser including mobile Safari without WebGL fallbacks

**When I'd switch:** If adding 3D elevation, lighting, or particle systems at scale.

---

## D2. Why zero runtime dependencies?

| Factor | With deps | Without deps |
|---|---|---|
| Bundle size | +200–500KB (React, Pixi, etc.) | 0KB overhead |
| Attack surface | npm audit: 0–∞ vulns | 0 vulns |
| Upgrade cost | Breaking changes per dep | None |
| Build speed | Slower (more to transpile) | Near-instant |
| Understanding | Must learn dep APIs | Full code ownership |

The game's rendering is too custom for a framework (Sega-style dithered isometric tiles). The simulation is too specialized for a physics library. TypeScript's type system + Vite's bundler is all that's needed.

---

## D3. Why a pipe model instead of full shallow water equations?

| Property | Pipe Model | Full SWE |
|---|---|---|
| Mass conservation | Guaranteed (flux scaling) | Requires careful numerics |
| Dry cell handling | Natural (zero flux) | Needs wetting/drying logic |
| Implementation | ~300 lines | ~1,000+ lines |
| Stability | Unconditional (with CFL) | Requires Riemann solvers |
| Accuracy | Good for games | Needed for engineering |
| GPU-friendly | Yes (per-cell, no gather) | Depends on scheme |

The pipe model is the standard choice for game-quality water simulation. It's used in terrain erosion, flood simulators, and real-time strategy games. Full SWE accuracy is not needed for a civilization builder.

**Reference:** Mei, Decaudin, Hu (2007). "Fast Hydraulic Erosion Simulation and Visualization on GPU."

---

## D4. Why SoA instead of AoS for the water grid?

**Array of Structs (AoS):**
```typescript
// Bad for cache: accessing all depths touches every struct
cells[i].depth, cells[i+1].depth, cells[i+2].depth...
// Each cell is 37 bytes apart in memory
```

**Struct of Arrays (SoA):**
```typescript
// Good for cache: all depths are contiguous in memory
depth[i], depth[i+1], depth[i+2]...
// Each depth is 4 bytes apart (Float32)
```

When the solver updates all depths in a loop, SoA ensures the CPU cache line (64 bytes) contains 16 consecutive depth values. AoS would load one depth plus 33 bytes of unrelated data per cache line.

For a 128×128 grid (16,384 cells), this is the difference between ~1,024 cache misses (SoA) and ~16,384 cache misses (AoS).

---

## D5. Why a Web Worker for simulation?

The main thread must maintain 60fps (16.67ms per frame). A 128×128 grid with 10 solver steps takes ~2–5ms. That's fine. But:

- Larger grids (256×256, 512×512) scale quadratically
- Multiple simulation steps per turn increase cost
- Any frame budget spike causes visible stuttering

The Web Worker guarantees smooth rendering regardless of simulation complexity. The Transferable ArrayBuffer protocol means the data transfer cost is O(1) — just pointer reassignment, no copying.

---

## D6. How would you scale the world to millions of tiles?

**Current:** All visited chunks stay in memory. Works for small exploration radii.

**At scale:**
1. **LRU chunk cache** — Evict chunks not visited in N turns. 128-chunk cache = 128 × 4,096 tiles = 524K tiles.
2. **Chunk serialization** — Save evicted chunks to IndexedDB. Reload on revisit.
3. **LOD rendering** — Far chunks rendered as single-color diamonds (1 draw call vs 4,096).
4. **Simulation culling** — Water sim only runs on chunks near the player/city.
5. **Quad-tree spatial index** — For entity and building queries beyond O(N) scan.

---

## D7. Why turn-based instead of real-time?

Turn-based (1 turn = 1 year) allows:
- Deep simulation per turn (9-phase economic loop, water sim, population dynamics) without frame-time pressure
- Strategic decision-making (place buildings, review stats, plan next turn)
- Deterministic replay (identical inputs → identical outputs)
- Simpler testing (no timing dependencies, no race conditions)

Real-time would require throttling all simulation to fit in 16.67ms frames, reducing simulation fidelity.

---

## D8. How do you test a Canvas2D game?

| Layer | What's tested | How |
|---|---|---|
| Core math | Coordinate transforms | Pure function unit tests |
| Resources | Economy arithmetic | canAfford, add, subtract tests |
| Buildings | Config, state, placement | Factory + validation tests |
| Population | Growth, death, workforce | Deterministic scenario tests |
| Turns | Full economic cycle | Integration tests with mock state |
| Water sim | Mass conservation, flow | Physics invariant tests |
| Flood | Damage, dams, drainage | Terrain modification tests |
| Weather | Seasons, rain, sources | Seasonal cycle tests |
| Entities | Combat, behaviors, spawning | Behavior + stat tests |
| Warnings | Thirst/food thresholds | Threshold boundary tests |
| Terrain | Biome distribution | Noise output range tests |

**Not tested (excluded from coverage):**
- `Renderer.ts` — Canvas2D API calls (would require headless canvas or pixel comparison)
- `WaterRenderer.ts` — Same reason
- `Minimap.ts` — Same reason
- `main.ts` — DOM wiring orchestrator
- `WaterWorker.ts` — Web Worker API (browser-only)

**Priority:** Correctness (simulation) > Economy (game logic) > Behaviors (entities) > Rendering (visual).

---

## D9. What would you do differently if you started over?

**Keep:**
- TypeScript strict mode + Vite + Vitest
- Canvas2D for 2D tile rendering
- Pipe model for water simulation
- SoA typed arrays
- Zero runtime deps

**Change:**
- **ECS architecture** — Entity Component System instead of class-based Entity. Better for 10K+ entities.
- **Event bus** — Decouple game systems via pub/sub instead of direct imports.
- **State machine library** — Formalize WANDER/CITY transitions with entry/exit hooks.
- **Chunk budget manager** — LRU cache from day one.
- **GPU compute (WebGPU)** — When available, move water sim to compute shaders for 100× throughput.
- **Save/load** — IndexedDB persistence for game state from the start.

---

## D10. How does the building state evolution work?

Each building has 4 states with increasing efficiency. Evolution is driven by population (residential) or turn count (commercial/industrial).

**Residential:** State determined by how many people live in the building relative to its population ranges:

```
R1 Hobo Camp (max 15):
  State 0: 0 people     → "Abandoned Transient Camp"    (0.0× efficiency)
  State 1: 1–5 people   → "Makeshift Transient Shelter" (0.5× efficiency)
  State 2: 6–10 people  → "Hobo Camp"                   (1.0× efficiency)
  State 3: 11–15 people → "Fortified Encampment"        (1.5× efficiency)
```

**Non-residential:** Default to state 2 (Established, 1.0×). Upgrades to state 3 (Premium, 1.5×) based on desirability and neighboring building quality.

**Efficiency impact:** All production, income, and gathering bonuses are multiplied by the building's efficiency. A 1.5× Premium building produces 50% more than an Established one.

---

## E1. File Map

```
civil-zones/
├── index.html                  # Entry point — single <canvas> + UI overlay
├── preview.html                # Production preview (loads dist/)
├── package.json                # npm scripts, zero runtime deps
├── tsconfig.json               # TypeScript 5.9 strict config
├── vite.config.ts              # Vite dev server + build config
├── vitest.config.ts            # Test runner + coverage config
│
├── src/
│   ├── main.ts                 # Game orchestrator (634 lines)
│   ├── style.css               # Minimal dark theme (32 lines)
│   │
│   ├── config/                 # Game data & configuration
│   │   ├── BuildingConfig.ts   # 21 building definitions (558 lines)
│   │   ├── CombatConfig.ts     # Animal stats, hit chance (127 lines)
│   │   └── ZoneBonuses.ts      # Adjacency bonus calculator (211 lines)
│   │
│   ├── core/                   # Shared utilities
│   │   ├── types.ts            # Point, Size, Rect, CameraState (30 lines)
│   │   ├── math.ts             # Isometric transforms (88 lines)
│   │   ├── noise.ts            # FBM noise generator (79 lines)
│   │   ├── Resources.ts        # Resource arithmetic (79 lines)
│   │   └── ResourceManager.ts  # Stateful resource wrapper (88 lines)
│   │
│   ├── game/                   # Game state & logic
│   │   ├── GameState.ts        # Central state container (70 lines)
│   │   ├── PopulationManager.ts # Needs, workforce, growth (170 lines)
│   │   └── TurnProcessor.ts    # 9-phase economic loop (169 lines)
│   │
│   ├── rendering/              # Visual output
│   │   ├── Camera.ts           # Pan/zoom controller (39 lines)
│   │   ├── Renderer.ts         # Isometric pixel art engine (1,224 lines)
│   │   └── WaterRenderer.ts    # Water overlay + flow arrows (184 lines)
│   │
│   ├── simulation/             # Water physics (CFD)
│   │   ├── types.ts            # SoA grid, config, Manning's n (168 lines)
│   │   ├── ShallowWater.ts     # Pipe model solver (299 lines)
│   │   ├── FloodMechanics.ts   # Damage, dams, drainage (169 lines)
│   │   ├── WaterSources.ts     # Weather, springs, rivers (134 lines)
│   │   ├── WaterWorker.ts      # Off-thread Web Worker (115 lines)
│   │   └── index.ts            # Barrel exports (53 lines)
│   │
│   ├── ui/                     # User interface
│   │   ├── Minimap.ts          # Corner overlay minimap (122 lines)
│   │   └── WarningSystem.ts    # Priority-tagged warnings (141 lines)
│   │
│   └── world/                  # World state & entities
│       ├── Tile.ts             # 6 tile types + palettes (125 lines)
│       ├── Chunk.ts            # 64×64 tile chunk (38 lines)
│       ├── ChunkManager.ts     # Lazy chunk loading (61 lines)
│       ├── TerrainGenerator.ts # FBM procedural terrain (104 lines)
│       ├── Building.ts         # Building instance data (37 lines)
│       ├── BuildingManager.ts  # Placement + validation (143 lines)
│       ├── Entity.ts           # Entity system + behaviors (438 lines)
│       └── Player.ts           # Player avatar (52 lines)
│
├── src/                        # Test files (co-located)
│   ├── config/
│   │   ├── BuildingConfig.test.ts
│   │   ├── CombatConfig.test.ts
│   │   └── ZoneBonuses.test.ts
│   ├── core/
│   │   ├── math.test.ts
│   │   ├── noise.test.ts
│   │   ├── ResourceManager.test.ts
│   │   └── Resources.test.ts
│   ├── game/
│   │   ├── GameState.test.ts
│   │   ├── PopulationManager.test.ts
│   │   └── TurnProcessor.test.ts
│   ├── simulation/
│   │   ├── types.test.ts
│   │   ├── ShallowWater.test.ts
│   │   ├── FloodMechanics.test.ts
│   │   └── WaterSources.test.ts
│   ├── ui/
│   │   └── WarningSystem.test.ts
│   └── world/
│       ├── Building.test.ts
│       ├── BuildingManager.test.ts
│       ├── Chunk.test.ts
│       ├── ChunkManager.test.ts
│       ├── Entity.test.ts
│       ├── Player.test.ts
│       ├── TerrainGenerator.test.ts
│       └── Tile.test.ts
│
└── public/                     # Static assets (favicon)
```

**Source:** 31 files, ~5,945 lines
**Tests:** 23 files, ~2,994 lines
**Total:** ~8,939 lines TypeScript

---

## F1. Test Architecture

### Test Organization

Tests are co-located with source files: `Foo.ts` → `Foo.test.ts` in the same directory.

### Test Runner

Vitest 4.0.18 with globals enabled (no `import { describe }` needed):

```typescript
describe('ResourceManager', () => {
  it('should track resources', () => {
    const rm = new ResourceManager();
    rm.add({ food: 100 });
    expect(rm.getResources().food).toBe(100);
  });
});
```

### Coverage Provider

`@vitest/coverage-v8` — V8's built-in code coverage (statement, branch, function, line level).

**Enforced thresholds:**
| Metric | Minimum |
|---|---|
| Statements | 60% |
| Branches | 50% |
| Functions | 60% |
| Lines | 60% |

Build fails if coverage drops below thresholds.

---

## F2. Coverage Report

```
File                      | % Stmts | % Branch | % Funcs | % Lines
======================== | ======= | ======== | ======= | =======
config/BuildingConfig.ts  |   88.88 |    77.77 |  100.00 |   88.23
config/CombatConfig.ts    |  100.00 |   100.00 |  100.00 |  100.00
config/ZoneBonuses.ts     |   94.44 |    72.22 |  100.00 |   94.44
core/math.ts              |   85.71 |   100.00 |   75.00 |   85.71
core/noise.ts             |   96.00 |    50.00 |  100.00 |   96.00
core/ResourceManager.ts   |   89.47 |    85.71 |   90.00 |   89.47
core/Resources.ts         |  100.00 |   100.00 |  100.00 |  100.00
game/GameState.ts         |  100.00 |   100.00 |  100.00 |  100.00
game/PopulationManager.ts |   64.28 |    51.85 |   75.00 |   61.53
game/TurnProcessor.ts     |   56.25 |    50.00 |  100.00 |   56.25
simulation/FloodMech.ts   |  100.00 |   100.00 |  100.00 |  100.00
simulation/ShallowWater.ts|  100.00 |    97.72 |  100.00 |  100.00
simulation/types.ts       |  100.00 |   100.00 |  100.00 |  100.00
simulation/WaterSources.ts|  100.00 |    88.88 |  100.00 |  100.00
ui/WarningSystem.ts       |   72.72 |    60.71 |   80.00 |   72.72
world/Building.ts         |  100.00 |   100.00 |  100.00 |  100.00
world/BuildingManager.ts  |   76.47 |    50.00 |   85.71 |   76.47
world/Chunk.ts            |  100.00 |   100.00 |  100.00 |  100.00
world/ChunkManager.ts     |   85.71 |    75.00 |  100.00 |   85.71
world/Entity.ts           |   60.00 |    45.45 |   76.92 |   56.14
world/Player.ts           |   90.00 |    75.00 |  100.00 |   90.00
world/TerrainGenerator.ts |   82.35 |    58.33 |  100.00 |   82.35
world/Tile.ts             |  100.00 |   100.00 |  100.00 |  100.00
======================== | ======= | ======== | ======= | =======
ALL                       |   82.44 |    70.15 |   93.28 |   82.78
```

**100% coverage modules:** Resources, GameState, Building, Chunk, Tile, CombatConfig, all 4 simulation files.

---

## F3. Test Categories

### By Module (290 tests total)

| Module | File | Tests | Coverage Focus |
|---|---|---|---|
| **config** | BuildingConfig.test.ts | 11 | All 21 buildings, lookup, state calc |
| | CombatConfig.test.ts | 13 | Hit chance, food reward, hostility |
| | ZoneBonuses.test.ts | 18 | All bonus types, edge cases |
| **core** | math.test.ts | 9 | Iso transforms, round-trip |
| | noise.test.ts | 7 | Range, determinism, FBM |
| | Resources.test.ts | 12 | Arithmetic, capacity, afford |
| | ResourceManager.test.ts | 14 | Spoilage, consumption, clamping |
| **game** | GameState.test.ts | 7 | Factory, defaults, phase |
| | PopulationManager.test.ts | 15 | Needs, workforce, growth/death |
| | TurnProcessor.test.ts | 7 | Full turn cycle, events |
| **simulation** | types.test.ts | 17 | Grid creation, volume, index |
| | ShallowWater.test.ts | 22 | Mass conservation, CFL, friction, equilibrium |
| | FloodMechanics.test.ts | 20 | Damage, dams, drainage, thresholds |
| | WaterSources.test.ts | 22 | Seasons, rain, springs, rivers, weather |
| **ui** | WarningSystem.test.ts | 17 | Thirst levels, food, combat messages |
| **world** | Building.test.ts | 7 | Factory, defaults |
| | BuildingManager.test.ts | 14 | Placement, validation, queries |
| | Chunk.test.ts | 5 | Creation, test pattern |
| | ChunkManager.test.ts | 8 | Lazy loading, caching |
| | Entity.test.ts | 17 | Combat, behaviors, spawning, rewards |
| | Player.test.ts | 6 | Movement, position |
| | TerrainGenerator.test.ts | 12 | Biome distribution, resources |
| | Tile.test.ts | 10 | Types, palettes, walkability |

### Test Types

| Type | Count | Description |
|---|---|---|
| Unit | ~240 | Single function/class in isolation |
| Integration | ~35 | Multi-module interactions (TurnProcessor, BuildingManager + ZoneBonuses) |
| Physics invariant | ~15 | Mass conservation, equilibrium, CFL stability |

---

## License

[MIT](LICENSE)

---

*Built with TypeScript and Canvas2D. 290 tests. Pipe-based CFD water simulation. Zero runtime dependencies. One `<canvas>`.*
