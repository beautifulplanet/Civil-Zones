# Part 4: Full Tutorial & Deep Dive

*The IKEA manual. Step-by-step setup, complete systems reference, architecture deep dive. Everything you need to understand, modify, or rebuild any part of this project.*

> **This is a standalone version of Part 4 from the [main README](../README.md).** For the complete document, see the [full README](../README.md).

---

## Table of Contents

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

This installs 4 dev dependencies:
- **TypeScript 5.9.3** — Compiler with strict mode + `erasableSyntaxOnly`
- **Vite 7.2.4** — Dev server with HMR + production bundler
- **Vitest 4.0.18** — Test runner (ESM-native, fast)
- **@vitest/coverage-v8** — V8 code coverage reporting

**Zero runtime dependencies.** The game ships no npm packages to the browser.

Done. Two commands.

---

## A3. Run the Game

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

You should see:
- An infinite isometric world with procedural terrain (grass, forests, water, sand, stone, dirt)
- Your nomad avatar at position (50, 50) — chosen for a high probability of land
- Animals roaming nearby: 18 deer, 30 rabbits, 8 boars, 5 bears, 12 bison
- 25 nomads scattered across the landscape (friendly/hostile mix)
- A HUD panel showing resources, thirst, tribe size, and settlement requirements

**Goal in WANDER mode:** Gather food, recruit nomads, stay hydrated, then settle a city.

**Goal in CITY mode:** Place buildings (Residential, Commercial, Industrial), manage population, and grow your civilization through the Stone Age.

---

## A4. Run Tests

```bash
# Watch mode (re-runs on file change)
npm test

# Single run — 290 tests across 23 files
npm run test:run

# With coverage report — generates terminal + HTML report
npm run test:coverage
```

**Expected output:**

```
 ✓ src/core/math.test.ts (9 tests)
 ✓ src/core/noise.test.ts (7 tests)
 ✓ src/core/Resources.test.ts (12 tests)
 ✓ src/core/ResourceManager.test.ts (14 tests)
 ✓ src/config/BuildingConfig.test.ts (11 tests)
 ✓ src/config/CombatConfig.test.ts (13 tests)
 ✓ src/config/ZoneBonuses.test.ts (18 tests)
 ✓ src/game/GameState.test.ts (7 tests)
 ✓ src/game/PopulationManager.test.ts (15 tests)
 ✓ src/game/TurnProcessor.test.ts (7 tests)
 ✓ src/world/Tile.test.ts (10 tests)
 ✓ src/world/Chunk.test.ts (5 tests)
 ✓ src/world/ChunkManager.test.ts (8 tests)
 ✓ src/world/TerrainGenerator.test.ts (12 tests)
 ✓ src/world/Building.test.ts (7 tests)
 ✓ src/world/BuildingManager.test.ts (14 tests)
 ✓ src/world/Entity.test.ts (17 tests)
 ✓ src/world/Player.test.ts (6 tests)
 ✓ src/ui/WarningSystem.test.ts (17 tests)
 ✓ src/simulation/types.test.ts (17 tests)
 ✓ src/simulation/ShallowWater.test.ts (22 tests)
 ✓ src/simulation/FloodMechanics.test.ts (20 tests)
 ✓ src/simulation/WaterSources.test.ts (22 tests)

 Test Files  23 passed (23)
      Tests  290 passed (290)
   Duration  ~7s
```

---

## A5. Build for Production

```bash
npm run build        # tsc type-check + vite build → dist/
npm run preview      # Serve the built output locally
```

`npm run build` runs two steps:
1. `tsc` — Full TypeScript compilation check (catches type errors)
2. `vite build` — Bundle, tree-shake, minify → `dist/`

Output is a static `dist/` folder deployable to any CDN or static host.

---

## A6. Project Configuration Deep Dive

### TypeScript (`tsconfig.json`)

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",              // Modern JS — class fields, top-level await
    "module": "ESNext",              // Native ES modules
    "moduleResolution": "bundler",   // Vite-compatible resolution
    "strict": true,                  // strictNullChecks, noImplicitAny, etc.
    "erasableSyntaxOnly": true,      // TS 5.9 spec — no parameter properties
    "noUnusedLocals": true,          // Dead code prevention
    "noUnusedParameters": true,      // Dead code prevention
    "noFallthroughCasesInSwitch": true, // Switch exhaustiveness
    "verbatimModuleSyntax": true,    // Explicit `type` imports
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
}
```

**`erasableSyntaxOnly`** is notable: TypeScript 5.9 introduced this flag to enforce that all TypeScript-specific syntax can be erased (removed) to produce valid JavaScript. This means:
- No `private` in constructor parameters (`constructor(private x: number)` is forbidden)
- Must use explicit field declaration + constructor assignment pattern instead
- Aligns with the TC39 Type Annotations proposal

### Vite (`vite.config.ts`)

```typescript
export default defineConfig({
    root: './',
    base: './',       // Relative paths — deployable from any URL
    server: { port: 5173 },
    build: { target: 'esnext' }  // No transpilation overhead
});
```

### Vitest (`vitest.config.ts`)

```typescript
export default defineConfig({
  test: {
    globals: true,          // No import { describe, it, expect }
    environment: 'node',    // Fastest — no DOM mocking
    coverage: {
      provider: 'v8',       // V8 built-in coverage (fast, accurate)
      thresholds: {
        statements: 60, branches: 50, functions: 60, lines: 60
      },
      exclude: [
        'src/main.ts',              // DOM orchestrator
        'src/rendering/**',         // Canvas2D API calls
        'src/ui/Minimap.ts',        // Canvas2D API calls
        'src/simulation/WaterWorker.ts', // Web Worker API
        'src/simulation/index.ts',  // Barrel exports
        '**/*.test.ts',             // Test files
        'src/style.css'             // Styles
      ]
    }
  }
});
```

---

## B1. System Overview in 60 Seconds

One `<canvas>` element. Zero frameworks. Four module groups:

1. **World** (7 files, ~991 lines) — Procedural chunk-based terrain, tiles, entities, buildings, player
2. **Game** (3 files, ~409 lines) — State machine, turn processor, population manager, resource economy
3. **Simulation** (6 files, ~938 lines) — Pipe-based shallow water solver, flood damage, weather, Web Worker
4. **Rendering** (3 files, ~1,447 lines) — Isometric Canvas2D renderer, water overlay, camera

Plus **Config** (3 files, ~896 lines) and **UI** (2 files, ~263 lines).

**Orchestrator:** `main.ts` (634 lines) wires everything together — creates the canvas, initializes systems, handles input, runs the game loop, and manages the WANDER ↔ CITY phase transition.

**Key insight:** The game runs entirely client-side with zero server communication. The water simulation runs in a Web Worker for 60fps rendering while computing physics off-thread.

---

## B2. The Two-Phase State Machine

The game has two distinct phases controlled by `GamePhase: 'WANDER' | 'CITY'`:

### WANDER Mode — Nomad Survival

```
Player spawns at (50, 50)
  │
  ├── Move by clicking tiles
  ├── Hunt animals (HP-based combat)
  ├── Recruit nomads (75% friendly)
  ├── Gather berries (food) and trees (wood)
  ├── Manage thirst (−1 per step, death at 0)
  ├── Dig wells (25 food + 50 wood)
  │
  └── Meet requirements:
      • Population ≥ 5
      • Food ≥ 100
      • Wood ≥ 40
      • Water access (water tile or well)
      │
      └── Click "SETTLE CITY" → transition
```

### CITY Mode — Zone-Based Building

```
City founded at player location
  │
  ├── Place buildings (R/C/I, Well, Road)
  ├── End turn (Space) → 9-phase economic cycle
  ├── Population grows based on housing, food, water, jobs
  ├── Buildings evolve through 4 states
  ├── Water simulation runs each turn
  │
  └── Goal: Grow civilization through the Stone Age
```

**Transition:** One-way. `gameState.phase = 'CITY'` is set when requirements met and player clicks Settle. The UI switches: city buttons appear, wander buttons hide, end turn becomes available.

**State container** (`GameState.ts`):

```typescript
interface GameState {
  phase: GamePhase;          // 'WANDER' | 'CITY'
  year: number;              // Turns in CITY mode
  population: number;        // Total people
  thirst: number;            // 0-100, WANDER only
  hasWell: boolean;          // WANDER mode well tracking
  settlementX: number;       // City center X
  settlementY: number;       // City center Y
  maxFood: number;           // WANDER inventory limit (300)
  maxWood: number;           // WANDER inventory limit (300)
  resources: ResourceManager;
  buildings: BuildingManager;
}
```

---

## B3. Isometric Coordinate System

2:1 isometric projection with tile dimensions 64×32 pixels.

### Constants

```typescript
TILE_WIDTH  = 64;
TILE_HEIGHT = 32;
TILE_HALF_W = 32;  // Used in projection math
TILE_HALF_H = 16;
```

### World → Screen Transform

```typescript
function worldToScreen(worldX: number, worldY: number): Point {
  return {
    x: (worldX - worldY) * TILE_HALF_W,
    y: (worldX + worldY) * TILE_HALF_H
  };
}
```

### Screen → World Transform (Inverse)

```typescript
function screenToWorld(screenX: number, screenY: number): Point {
  return {
    x: (screenX / TILE_HALF_W + screenY / TILE_HALF_H) / 2,
    y: (screenY / TILE_HALF_H - screenX / TILE_HALF_W) / 2
  };
}
```

### Canvas → World (with camera)

```typescript
function canvasToWorld(canvasX: number, canvasY: number, camera: CameraState, viewport: Size): Point {
  // Remove viewport centering
  const screenX = (canvasX - viewport.width / 2) / camera.zoom + camera.x * TILE_HALF_W;
  const screenY = (canvasY - viewport.height / 2) / camera.zoom + camera.y * TILE_HALF_H;
  return screenToWorld(screenX, screenY);
}
```

### Isometric Diamond Shape

```
        ╱╲
      ╱    ╲        Width: 64px (TILE_WIDTH)
    ╱   Tile  ╲     Height: 32px (TILE_HEIGHT)
    ╲        ╱
      ╲    ╱
        ╲╱
```

Each tile is drawn as a 4-point polygon: top, right, bottom, left.

---

## B4. Procedural Terrain Generation

`TerrainGenerator` (104 lines) uses FBM noise to create infinite terrain:

### Noise Layers

```
elevation = fbm(x × 0.02, y × 0.02, octaves=4)   // 0.0–1.0
moisture  = fbm(x × 0.03, y × 0.03, octaves=3)   // 0.0–1.0
variant   = noise(x × 0.05, y × 0.05)             // Detail variation
```

### Biome Assignment

```
if elevation < 0.15 → WATER
if elevation < 0.25 → SAND
if elevation > 0.70 → STONE
if moisture  > 0.55 → FOREST
if variant-based    → DIRT (patches)
else                → GRASS (4 shade variants)
```

### Resource Distribution

| Resource | Tiles | Chance |
|---|---|---|
| Berries | GRASS, FOREST | ~20% |
| Trees | FOREST | ~70% |
| Trees | GRASS | ~30% |
| Iron ore | Near STONE | Based on noise |
| Gold ore | STONE | Rare |
| Stone deposits | Widespread | Based on noise |

### FBM (Fractal Brownian Motion)

Each octave adds higher-frequency detail:

```
Octave 0: ▁▂▃▄▅▆▇▇▆▅▄▃▂▁    (low frequency, high amplitude)
Octave 1: ▁▃▅▃▁▃▅▃▁▃▅▃▁     (2× frequency, 0.5× amplitude)
Octave 2: ▁▅▁▅▁▅▁▅▁▅▁▅▁     (4× frequency, 0.25× amplitude)
Octave 3: ▁▇▁▇▁▇▁▇▁▇▁▇▁     (8× frequency, 0.125× amplitude)
Sum:      ▁▃▄▆▅▇▆▅▃▅▆▅▃▂▁   (natural-looking terrain)
```

---

## B5. Entity System & Behaviors

438 lines implementing a full entity lifecycle with config-driven behavior state machines.

### Entity Types

| Entity | Type Constant | HP | Behavior | Food Reward |
|---|---|---|---|---|
| Deer | `ANIMAL_DEER` | 2 | Flee (fast) | 15–35 |
| Rabbit | `ANIMAL_RABBIT` | 1 | Flee (very fast) | 5–20 |
| Boar | `ANIMAL_BOAR` | 3 | **Charge** | 10–40 |
| Bear | `ANIMAL_BEAR` | 3 | **Aggressive** | 20–50 |
| Bison | `ANIMAL_BISON` | 3 | Flee (medium) | 15–35 |
| Nomad | `NOMAD` | — | Wave/Dance/Chase | — |

### Entity Interface

```typescript
interface Entity {
  id: number;
  type: EntityType;
  x: number; y: number;
  targetX: number; targetY: number;
  health: number;
  maxHealth: number;
  state: EntityState;    // 'idle' | 'moving' | 'fleeing' | 'charging' | 'dying'
  isHostile?: boolean;   // Nomads: 25% hostile
  behavior?: string;     // Nomads: 'chase' | 'wave' | 'dance'
  speed: number;
  direction: number;     // Facing angle
  deathTimer?: number;
}
```

### Behavior State Machine

```
         ┌──────────────────────────────────────┐
         │                                      │
         ▼                                      │
  ┌────────────┐     player nearby?     ┌──────────────┐
  │   IDLE     │ ────── yes ──────────→ │   FLEEING    │
  │  (wander)  │                        │  (run away)  │
  └─────┬──────┘                        └──────────────┘
        │                                      ▲
        │ target set?                          │
        ▼                                      │
  ┌────────────┐                               │
  │  MOVING    │ ── player detected ───────────┘
  │(to target) │
  └────────────┘
        │
        │ boar/bear special:
        ▼
  ┌────────────┐
  │  CHARGING  │ ── boar: rush toward player
  │ (attack)   │ ── bear: aggressive counterattack
  └────────────┘
        │
        │ health ≤ 0:
        ▼
  ┌────────────┐
  │   DYING    │ ── fade out, then remove
  │ (300ms)    │
  └────────────┘
```

### Proximity Reactions

| Entity | Flee Radius | Reaction |
|---|---|---|
| Deer | 8 tiles | Flee opposite direction |
| Rabbit | 10 tiles | Flee very fast |
| Boar | 5 tiles | **Charge toward player** |
| Bear | 3 tiles | **Stand ground, counterattack** |
| Bison | 6 tiles | Flee medium speed |

### Nomad Behaviors

| Behavior | Animation | Frequency |
|---|---|---|
| Wave | Wave club overhead | Common |
| Dance | Dance in place | Uncommon |
| Chase | Chase nearest animal | When animal nearby |

---

## B6. Zone-Based City Building

### Building Organization

| Zone | IDs | Count | Purpose |
|---|---|---|---|
| Residential | R1–R6 | 6 | Housing (population capacity) |
| Commercial | C1–C6 | 6 | Jobs + income generation |
| Industrial | I1–I6 | 6 | Resource production + gathering |
| Special | WELL, ROAD, CHIEF_HUT | 3 | Infrastructure + unlocks |

### Building State Evolution

Every building has 4 states with increasing efficiency:

| State | Index | Efficiency | Meaning |
|---|---|---|---|
| Vacant/Abandoned | 0 | 0.0× | Un-staffed or empty |
| Developing | 1 | 0.5× | Partially operational |
| Established | 2 | 1.0× | Fully operational |
| Premium/Thriving | 3 | 1.5× | Exceeding capacity |

Residential buildings evolve based on population fill:

```
R1 Hobo Camp (max 15):
  State 0: 0 people     → "Abandoned Transient Camp"    (0.0×)
  State 1: 1–5 people   → "Makeshift Transient Shelter" (0.5×)
  State 2: 6–10 people  → "Hobo Camp"                   (1.0×)
  State 3: 11–15 people → "Fortified Encampment"        (1.5×)
```

### Level Unlocking

| Level | Pop Required | Special Requirement |
|---|---|---|
| 1 | 0 | — |
| 2 | 40–50 | — |
| 3 | 150–200 | — |
| 4 | 500 | CHIEF_HUT built |
| 5 | 1,000 | CHIEF_HUT built |
| 6 | 2,000 | CHIEF_HUT built |

The CHIEF_HUT costs 100,000 food + 100,000 wood + 1 gold. It provides +2.0 desirability in a 50-tile radius and unlocks all Level 4–6 buildings.

### Placement Validation

`BuildingManager.placeBuilding()` checks:
1. Tile exists in ChunkManager
2. Tile is walkable (not WATER)
3. No existing building at that location
4. Zone bonus is calculated and stored on the building instance

---

## B7. Resource Economy & Turn Processing

### 5 Resources

| Resource | Icon | Primary Source | Primary Sink |
|---|---|---|---|
| Food | 🍖 | Hunting, berries, industrial | Population consumption (1/person/year) |
| Wood | 🪵 | Tree chopping, industrial | Building construction, upkeep |
| Stone | 🪨 | Deposits, industrial | Building construction (L2+) |
| Metal | 🛠️ | Mining, advanced industrial | Advanced buildings |
| Gold | 🥇 | Metal conversion (500K:1) | CHIEF_HUT, prestige |

### Capacity Defaults

| Resource | Capacity |
|---|---|
| Food | 10,000 |
| Wood | 10,000 |
| Stone | 5,000 |
| Metal | 1,000 |
| Gold | 100 |

### Turn Processor — 9-Phase Loop

Each "End Turn" (1 year) runs:

| Phase | Operation | Module |
|---|---|---|
| 1 | Calculate population needs (housing, water, food, jobs) | PopulationManager |
| 2 | Allocate workforce by priority | PopulationManager |
| 3 | Produce resources from industrial + gather bonuses | TurnProcessor |
| 4 | Consume food (1 per person per year) | ResourceManager |
| 5 | Apply spoilage (20% food, 10% wood) | ResourceManager |
| 6 | Calculate population change (births − starvation − dehydration) | PopulationManager |
| 7 | Update building states based on occupancy | TurnProcessor |
| 8 | Advance year counter | TurnProcessor |
| 9 | Generate stats report + events | TurnProcessor |

### Workforce Allocation Priority

1. **Roads** — Maintenance workers
2. **Commercial** — Income-generating jobs
3. **Industrial** — Resource production
4. **Remaining** → Gatherers (bonus food/wood from assigned buildings)

---

## B8. Shallow Water Simulation (CFD)

Pipe-based shallow water model based on Mei et al. (2007). Implementation: `ShallowWater.ts` (299 lines).

### The Pipe Model Concept

Instead of solving the full shallow water equations ($\partial h / \partial t + \nabla \cdot (h\mathbf{v}) = 0$), the pipe model represents flow between adjacent cells as flux through virtual pipes connecting cell centers.

```
        ┌───────┐   fUp    ┌───────┐
        │       │ ←──────→ │       │
        │ (i,j) │          │(i,j+1)│
        │       │          │       │
        └───┬───┘          └───────┘
     fLeft  │  fRight
        ┌───▼───┐
        │       │
        │(i+1,j)│
        │       │
        └───────┘
```

Each cell has 4 fluxes (right, up, left, down). Flux is driven by hydraulic head difference between cells.

### Algorithm (5 Phases per Step)

**Phase 1 — Flux update:**

For each cell $(i,j)$ and direction $d$:

$$f_d^{n+1} = \max\left(0, \; f_d^n + \Delta t \cdot A \cdot g \cdot \frac{\Delta h_d}{L}\right)$$

Where:
- $\Delta h_d = (h_i + z_i) - (h_j + z_j)$ = hydraulic head difference
- $A = L \times 1$ = pipe cross-section area
- $g = 9.81$ m/s² = gravity
- $L$ = cell size (default 1.0m)

**Phase 2 — Flux scaling (mass conservation):**

If total outflow would drain the cell below zero:

$$k = \min\left(1, \; \frac{h \cdot L^2}{\Delta t \cdot (f_R + f_U + f_L + f_D)}\right)$$

All outgoing fluxes are multiplied by $k$. This guarantees non-negative depth.

**Phase 3 — Depth update (continuity equation):**

$$h^{n+1} = h^n + \frac{\Delta t}{L^2} \left( \sum f_{in} - \sum f_{out} \right)$$

Where $f_{in}$ = flux entering from neighbors, $f_{out}$ = flux leaving to neighbors.

**Phase 4 — Velocity (for rendering):**

$$v_x = \frac{f_R - f_L}{2Lh}, \quad v_y = \frac{f_U - f_D}{2Lh}$$

Averaged across faces for mid-cell velocity estimate.

**Phase 5 — Manning friction:**

Velocity decays based on Manning's roughness coefficient $n$:

$$\text{decay} = 1 - \Delta t \cdot g \cdot \frac{n^2}{h^{4/3}} \cdot |\mathbf{v}|$$

### Manning's Coefficients

| Tile Type | $n$ | Description |
|---|---|---|
| GRASS | 0.030 | Light vegetation |
| WATER | 0.010 | Open channel |
| SAND | 0.025 | Smooth bed |
| STONE | 0.035 | Rocky surface |
| FOREST | 0.100 | Heavy vegetation (dominant friction) |
| DIRT | 0.020 | Bare earth |

### CFL Stability

Timestep is dynamically computed to satisfy the Courant–Friedrichs–Lewy condition:

$$\Delta t_{stable} = 0.9 \times \frac{L}{\sqrt{g \cdot h_{max}}}$$

The 0.9 safety factor prevents instability at the theoretical limit.

### Data Layout (SoA)

```typescript
interface WaterGrid {
  width: number;
  height: number;
  terrain:   Float32Array;  // Ground elevation [m]
  depth:     Float32Array;  // Water depth [m]
  fluxRight: Float32Array;  // → pipe flux [m³/s]
  fluxUp:    Float32Array;  // ↑ pipe flux [m³/s]
  fluxLeft:  Float32Array;  // ← pipe flux [m³/s]
  fluxDown:  Float32Array;  // ↓ pipe flux [m³/s]
  velX:      Float32Array;  // Velocity X [m/s]
  velY:      Float32Array;  // Velocity Y [m/s]
  tileTypes: Uint8Array;    // TileType enum
}
```

9 Float32Arrays (4 bytes each) + 1 Uint8Array (1 byte) = **37 bytes per cell**.

| Grid Size | Memory |
|---|---|
| 64 × 64 | ~150 KB |
| 128 × 128 | ~600 KB |
| 256 × 256 | ~2.4 MB |
| 512 × 512 | ~9.6 MB |

### Mass Conservation

The flux scaling in Phase 2 guarantees that water is never created or destroyed. This is verified by integration tests: total water volume before and after N steps differs by less than floating-point epsilon.

### Full Step Function

`fullStep()` combines all operations:

```typescript
function fullStep(grid: WaterGrid, config: WaterConfig, dt: number, rainRate?: number): void {
  if (rainRate) addRainfall(grid, config, rainRate);
  simulateStep(grid, config, dt);
  applyFriction(grid, config, dt);
  applyEvaporation(grid, config, dt);
}
```

---

## B9. Water Rendering Pipeline

`WaterRenderer.ts` draws a translucent isometric overlay on top of the terrain:

### Rendering Steps

1. **Skip check:** Return immediately if water grid not initialized
2. **Compute visible bounds:** Camera viewport → world tile range (frustum culling)
3. **Per visible cell with depth > threshold:**
   - Compute isometric screen position via `worldToScreen()`
   - Compute RGBA color from depth (light blue → dark blue gradient)
   - Draw filled isometric diamond with translucent fill
4. **Flow arrows** (when `camera.zoom > 1.5`):
   - Arrow direction from `(velX, velY)` velocity field
   - Arrow length proportional to velocity magnitude
   - 2-line arrow head for direction indication

### Depth → Color Mapping

```typescript
function waterColor(depth: number): [r, g, b, a] {
  const t = Math.min(1, depth / 2.0);  // Normalize 0–2m → 0.0–1.0
  return [
    100 - 80 * t,   // R: 100 (shallow) → 20 (deep)
    180 - 120 * t,  // G: 180 → 60
    255 - 75 * t,   // B: 255 → 180
    0.3 + 0.6 * t   // A: 0.3 (shallow) → 0.9 (deep)
  ];
}
```

**Visual result:**
- 0.0m: invisible
- 0.1m: faint light blue, mostly transparent
- 1.0m: medium blue, semi-opaque
- 2.0m+: deep dark blue, nearly opaque

---

## B10. Web Worker Architecture

`WaterWorker.ts` (115 lines) runs the water solver off the main thread.

### Message Protocol

| Message | Direction | Payload |
|---|---|---|
| `init` | Main → Worker | grid dimensions, terrain, depth, tileTypes, config |
| `step` | Main → Worker | stepCount (N), rain flag |
| `ready` | Worker → Main | Acknowledgment after init |
| `result` | Worker → Main | depth, velX, velY (3 Float32Array buffers) |

### Zero-Copy Transfer

```typescript
// Worker sends results:
const result: ResultMessage = {
  type: 'result',
  depth: new Float32Array(grid.depth).buffer,
  velX: new Float32Array(grid.velX).buffer,
  velY: new Float32Array(grid.velY).buffer
};

self.postMessage(result, [result.depth, result.velX, result.velY]);
//                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                        Transferable list — ownership moves to main thread
//                        No copying, no serialization
```

After transfer:
- Worker's references to these buffers become **detached** (length 0)
- Worker creates fresh buffers for the next simulation step
- Main thread uses the received buffers for rendering

### Worker Lifecycle

```
Main Thread                          Web Worker
    │                                    │
    │──── new Worker('WaterWorker.ts') ──→│  (created)
    │                                    │
    │──── {type:'init', terrain, ...} ──→│  createWaterGrid()
    │                                    │  grid initialized
    │←──── {type:'ready'} ──────────────│
    │                                    │
    │──── {type:'step', steps:10} ──────→│  fullStep() × 10
    │                                    │  (solver runs N times)
    │←──── {type:'result', buffers} ────│  Transferable!
    │                                    │
    │  (render water overlay)            │  (new buffers allocated)
    │                                    │
    │──── {type:'step', steps:10} ──────→│  ...repeat...
```

---

## C1. World Generation — Chunks, Tiles, and Noise

### Chunk System

The world is divided into 64×64 tile chunks. `ChunkManager` (61 lines) generates and caches chunks lazily:

```typescript
const CHUNK_SIZE = 64;  // 64 × 64 = 4,096 tiles per chunk

// World coordinate → chunk coordinate
chunkX = Math.floor(worldX / CHUNK_SIZE);
chunkY = Math.floor(worldY / CHUNK_SIZE);

// Chunk key for Map lookup
key = `${chunkX},${chunkY}`;
```

When `getTile(x, y)` is called for a tile in an unloaded chunk, `ChunkManager`:
1. Computes chunk coordinates
2. Checks cache (`Map<string, Chunk>`)
3. If miss: generates chunk via `TerrainGenerator`
4. Caches and returns the tile

**Memory:** Each chunk stores 4,096 `Tile` objects. No chunk eviction (infinite growth bounded by exploration).

### Noise Generator

`NoiseGenerator` (79 lines) implements a hash-based noise function:

```typescript
class NoiseGenerator {
  private seed: number;

  // Hash function: deterministic pseudo-random from (x, y)
  private hash(x: number, y: number): number {
    // Bit manipulation to produce uniform distribution
  }

  // Smooth noise with bilinear interpolation
  noise(x: number, y: number): number {
    // Floor to grid, interpolate 4 corners
  }

  // Fractal Brownian Motion — sum of scaled noise octaves
  fbm(x: number, y: number, octaves: number): number {
    let value = 0, amplitude = 1, frequency = 1;
    for (let i = 0; i < octaves; i++) {
      value += this.noise(x * frequency, y * frequency) * amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value / totalAmplitude;
  }
}
```

---

## C2. Tile Types and Palettes

6 tile types with Sega Genesis-style 4-color palettes:

### TileType Enum

```typescript
const TileType = {
  GRASS:  0,
  WATER:  1,
  SAND:   2,
  STONE:  3,
  FOREST: 4,
  DIRT:   5
} as const;
```

### Color Palettes

Each tile type has 5 colors: base, highlight, shadow, dither, outline.

| Type | Base | Highlight | Shadow | Dither | Purpose |
|---|---|---|---|---|---|
| GRASS | `#4a8c3f` | `#5ca04e` | `#3a7030` | `#448035` | Default terrain |
| WATER | `#2266aa` | `#3388cc` | `#1a5588` | `#2070b0` | Lakes, rivers |
| SAND | `#c8b060` | `#d8c470` | `#b09848` | `#c0a858` | Beaches, deserts |
| STONE | `#808080` | `#989898` | `#686868` | `#787878` | Mountains, cliffs |
| FOREST | `#2d6b2e` | `#3d8040` | `#1d5020` | `#286028` | Dense vegetation |
| DIRT | `#8b6f47` | `#a08050` | `#705838` | `#806040` | Paths, clearings |

### Grass Variants

4 subtle shade variations for visual variety, selected by variant noise:

| Variant | Base | Description |
|---|---|---|
| 0 | `#4a8c3f` | Default green |
| 1 | `#458537` | Slightly darker |
| 2 | `#509340` | Slightly lighter |
| 3 | `#4d8f42` | Yellow-green tint |

### Tile Properties

```typescript
interface Tile {
  type: TileType;
  variant: number;      // Grass shade variant (0–3)
  hasBerries: boolean;  // Food gathering source
  hasTrees: boolean;    // Wood gathering source
  oreType?: OreType;    // 'iron' | 'gold' | 'stone'
  oreAmount?: number;   // Remaining ore units
}
```

### Walkability

```typescript
function isWalkable(type: TileType): boolean {
  return type !== TileType.WATER;
}
```

All tile types are walkable except WATER.

---

## C3. The Isometric Renderer (1,224 lines)

The `Renderer` class handles all visual output via Canvas2D.

### Main Render Loop

```
render()
  │
  ├── clearCanvas()
  ├── computeVisibleTileRange()  // Frustum culling
  │
  ├── for each visible tile (back-to-front):
  │     ├── drawTile()           // Isometric diamond + dither + edges
  │     └── if building here:
  │           └── drawBuilding() // Type-specific renderer
  │
  ├── for each entity (sorted by Y):
  │     └── drawEntity()         // Type-specific (deer, bear, nomad...)
  │
  └── drawPlayer()               // Player avatar on top
```

### Tile Drawing Technique

Each tile is rendered in 5 stages:

1. **Base color fill** — Solid fill of isometric diamond shape
2. **Checkerboard dither** — Every other pixel in dither color (Sega Genesis technique)
3. **Top-left highlight edge** — 2px lighter edge for 3D illusion
4. **Bottom-right shadow edge** — 2px darker edge for depth
5. **Outline stroke** — 1px outline color for crisp tile boundaries

### Building Renderers

| Method | Lines | Building Types |
|---|---|---|
| `drawResidential()` | ~120 | R1–R6: tents, pit shelters, caves, wigwams, huts, stugas |
| `drawCommercial()` | ~100 | C1–C6: fire circles, trade posts, markets |
| `drawIndustrial()` | ~100 | I1–I6: hunting ranges, pits, workshops |
| `drawWell()` | ~40 | Stone ring with bucket and rope |
| `drawRoad()` | ~30 | Flattened diamond with edge markings |

Each building renderer draws state-dependent details:
- **State 0:** Ruins, collapsed structures
- **State 1:** Basic framework, sparse detail
- **State 2:** Full rendering, complete structure
- **State 3:** Enhanced detail, decorations, smoke effects

### Entity Renderers

| Method | Lines | Description |
|---|---|---|
| `drawDeer()` | ~50 | Brown body, antlers, directional facing |
| `drawRabbit()` | ~40 | Small gray body, ears, hop animation |
| `drawBoar()` | ~50 | Dark body, tusks, charge animation |
| `drawBear()` | ~50 | Large brown body, standing pose |
| `drawBison()` | ~50 | Massive body, horns, hump |
| `drawNomad()` | ~60 | Humanoid with club, behavior animation |

### Rendering Order

Painter's algorithm (back-to-front): tiles at higher isometric-Y are drawn first. Entities and buildings are drawn after their ground tile. This ensures correct visual overlap without a depth buffer.

---

## C4. Camera System

`Camera` (39 lines) manages viewport position and zoom:

| Property | Default | Range |
|---|---|---|
| `x`, `y` | 0, 0 | Any world coordinate |
| `zoom` | 1.0 | 0.02 – 3.0 |

**Pan:** Converts screen pixel delta to world delta:

```typescript
pan(dx: number, dy: number) {
  this.state.x -= dx / (TILE_HALF_W * this.state.zoom);
  this.state.y -= dy / (TILE_HALF_H * this.state.zoom);
}
```

**Zoom:** Multiplies by 1.1 (in) or 0.9 (out) per scroll step, clamped to range.

**Viewport:** Stores width/height, updated on window resize.

**WANDER mode:** Camera automatically follows player position each frame.

**CITY mode:** Camera is free — user controls via drag/scroll.

---

## C5. Entity System — Animals, Nomads, and Behaviors

`Entity.ts` (438 lines) is the largest single file in the world module.

### Factory Function

```typescript
function createEntity(type: EntityType, x: number, y: number): Entity {
  const config = ANIMAL_CONFIG[type];
  return {
    id: nextEntityId++,
    type, x, y,
    targetX: x, targetY: y,
    health: config.hp,
    maxHealth: config.hp,
    state: 'idle',
    speed: config.speed || 0.05,
    direction: Math.random() * Math.PI * 2,
    isHostile: type === 'NOMAD' ? Math.random() < 0.25 : undefined,
    behavior: type === 'NOMAD' ? pickNomadBehavior() : undefined
  };
}
```

### EntityManager Class

| Method | Purpose |
|---|---|
| `spawnEntitiesInArea(cx, cy, radius, counts)` | Bulk spawn with per-type counts |
| `update(playerX, playerY)` | Per-frame behavior tick for all entities |
| `getEntityAt(x, y, radius)` | Spatial lookup (nearest within radius) |
| `fleeFrom(entity, x, y)` | Set flee direction away from (x, y) |
| `removeEntity(id)` | Remove from active list |

### Per-Frame Update

For each entity:
1. Check distance to player
2. If within flee radius → set state to `fleeing`, direction away from player
3. If boar within charge radius → set state to `charging`, direction toward player
4. If bear within aggro radius → stand ground, prepare counterattack
5. Move toward target at entity speed
6. If dying, decrement death timer, remove when expired
7. Nomads: execute behavior (wave, dance, chase nearest animal)

### Initial Spawn Configuration

```typescript
entityManager.spawnEntitiesInArea(50, 50, 60, {
  deer: 18,
  rabbits: 30,
  boars: 8,
  bears: 5,
  bison: 12,
  nomads: 25
});
```

Total: 98 entities spawned at game start within a 60-tile radius of the player.

---

## C6. Combat System

`CombatConfig.ts` (127 lines) defines all combat rules.

### Hit Chance Formula

$$P(\text{hit}) = \min(0.95, \; 0.3 + \text{tribeSize} \times 0.1)$$

| Tribe Size | Hit Chance |
|---|---|
| 1 | 40% |
| 3 | 60% |
| 5 | 80% |
| 7+ | 95% (cap) |

### Animal Stats

| Animal | HP | Min Food | Max Food | Flee Radius | Behavior |
|---|---|---|---|---|---|
| Deer | 2 | 15 | 35 | 8 tiles | Flee |
| Rabbit | 1 | 5 | 20 | 10 tiles | Flee |
| Boar | 3 | 10 | 40 | 5 tiles | Charge |
| Bear | 3 | 20 | 50 | 3 tiles | Aggressive |
| Bison | 3 | 15 | 35 | 6 tiles | Flee |

### Combat Flow

```
Player clicks animal
  │
  ├── Roll hit chance (tribe size dependent)
  │
  ├── HIT:
  │     ├── Deal 1 damage to animal
  │     ├── If health ≤ 0:
  │     │     ├── Animal dies (enter 'dying' state)
  │     │     ├── Food reward = random(min, max)
  │     │     └── Add to player resources (capped)
  │     └── If health > 0:
  │           └── Animal continues (may flee)
  │
  └── MISS:
        ├── If boar/bear: 30% chance counterattack
        │     └── Lose 1 tribe member
        └── Animal flees
```

### Nomad Encounters

```
Player clicks nomad
  │
  ├── 75% Friendly:
  │     ├── Nomad joins tribe (+1 population)
  │     └── Nomad removed from world
  │
  └── 25% Hostile:
        ├── Lose 1-2 tribe members
        └── Nomad flees
```

### Inventory Limits (WANDER Mode)

| Resource | Max |
|---|---|
| Food | 300 |
| Wood | 300 |

Gathering attempts that exceed capacity are clamped.

---

## C7. Building System — 21 Types, 4 States

### Complete Building Database

#### Residential Buildings (R1–R6)

| ID | Name | Cost (F/W/S) | Pop Max | Income | Gather Bonus | Pop Unlock |
|---|---|---|---|---|---|---|
| R1 | Hobo Camp | 100/100/0 | 15 | 1 | F+2, W+2 | 0 |
| R2 | Straw Pit Shelter | 300/300/50 | 30 | 3 | F+5, W+5, S+1 | 50 |
| R3 | Cave Dwelling | 900/900/200 | 60 | 8 | F+12, W+12, S+3, M+1 | 200 |
| R4 | Wigwam Village | 2K/2K/40 | 90 | 16 | F+20, W+20, S+5 | 500 🏠 |
| R5 | Papyrus Hut | 8K/8K/80 | 150 | 32 | F+40, W+40, S+10, M+3 | 1,000 🏠 |
| R6 | Stuga Village | 20K/20K/100 | 240 | 64 | F+80, W+80, S+20, M+6 | 2,000 🏠 |

#### Commercial Buildings (C1–C6)

| ID | Name | Cost (F/W/S) | Jobs | Income | Desirability | Culture | Pop Unlock |
|---|---|---|---|---|---|---|---|
| C1 | Pebble Trade Fire | 150/150/0 | 8 | 5 | 0.2 (r=4) | — | 10 |
| C2 | Squirrel Trade Camp | 400/400/50 | 20 | 15 | 0.3 (r=5) | — | 40 |
| C3 | Fire Meet Camp | 1.2K/1.2K/200 | 50 | 40 | 0.4 (r=6) | 5 | 150 |
| C4 | Barter Barrel | 1.6K/1.6K/32 | 16 | 80 | 0.35 (r=5) | — | 500 🏠 |
| C5 | Blanket Market | 6.4K/6.4K/64 | 40 | 160 | 0.45 (r=6) | 8 | 1,000 🏠 |
| C6 | Bear Market | 16K/16K/80 | 100 | 320 | 0.55 (r=7) | 15 | 2,000 🏠 |

#### Industrial Buildings (I1–I6)

| ID | Name | Cost (F/W/S) | Jobs | Production | Food Bonus | Pop Unlock |
|---|---|---|---|---|---|---|
| I1 | Bird Hunting Range | 200/200/0 | 10 | 10 | +5 | 2 |
| I2 | Grub Digging Pit | 500/500/100 | 25 | 25 | +10 | 50 |
| I3 | Stone Knapping Site | 1.5K/1.5K/500 | 60 | 60 | +15 | 200 |
| I4 | Turtle Hunting Ground | 2.4K/2.4K/48 | 20 | 50 | +30 | 500 🏠 |
| I5 | Bear Pit | 9.6K/9.6K/96 | 50 | 120 | +60 | 1,000 🏠 |
| I6 | Buffalo Grounds | 24K/24K/120 | 120 | 240 | +120 | 2,000 🏠 |

#### Special Buildings

| ID | Name | Cost | Purpose |
|---|---|---|---|
| WELL | Water Well | 50F + 200W | Water access, +0.15 desirability (r=6) |
| ROAD | Road | 10W | Movement bonus, +25% zone efficiency |
| CHIEF_HUT | Clan Chief's Hut | 100KF + 100KW + 1G | Unlocks L4–6, +2.0 desirability (r=50), +25 culture |

🏠 = Requires CHIEF_HUT built first.

### Building State Names

Every building has a unique name for each of its 4 states:

**Example — R3 Cave Dwelling:**

| State | Name | Efficiency |
|---|---|---|
| 0 | Collapsed Cave Entrance | 0.0× |
| 1 | Shallow Cave Shelter | 0.5× |
| 2 | Cave Dwelling | 1.0× |
| 3 | Deep Cave Complex | 1.5× |

**Example — C3 Fire Meet Camp:**

| State | Name | Efficiency |
|---|---|---|
| 0 | Cold Meeting Ashes | 0.0× |
| 1 | Small Tribal Fire Gathering | 0.5× |
| 2 | Fire Meet Camp | 1.0× |
| 3 | Great Tribal Fire Council | 1.5× |

---

## C8. Zone Bonuses & Adjacency

`ZoneBonuses.ts` (211 lines) calculates efficiency multipliers at building placement time.

### Bonus Types

| Bonus | Condition | Multiplier |
|---|---|---|
| Road access | Road within 2 tiles | +25% |
| Water proximity | WATER tile within 3 tiles | +15% |
| Well proximity | WELL building within 4 tiles | +10% |
| Residential cluster | Adjacent residential building | +5% per neighbor |
| Industrial + Stone | STONE tile within 3 tiles | +15% |
| Commercial + Road | Road within 1 tile | +10% |
| Isolation penalty | No buildings within 3 tiles | −20% |

### Calculation

```typescript
function calculatePlacementBonus(
  buildingDef: BuildingDefinition,
  x: number, y: number,
  chunkManager: ChunkManager,
  buildingManager: BuildingManager
): BonusBreakdown {
  let total = 1.0;  // Start at 100%

  // Check each bonus condition...
  if (hasRoadWithin(x, y, 2)) total += 0.25;
  if (hasWaterWithin(x, y, 3)) total += 0.15;
  // ...

  return { total: Math.max(0, total), breakdown: [...] };
}
```

The resulting efficiency multiplier is stored on the building instance and applied to all production, income, and gathering calculations.

---

## C9. Population Manager

`PopulationManager.ts` (170 lines) handles three systems:

### 1. Needs Calculation

```typescript
interface PopulationNeeds {
  housingCapacity: number;    // Total residential populationMax
  housingRatio: number;       // population / capacity
  waterAccess: boolean;       // Any well in range?
  foodPerCapita: number;      // food / population
  employmentRate: number;     // employed / population
}
```

### 2. Workforce Allocation

Priority-ordered job assignment:

```
Available workers: population
  │
  ├── 1. Roads → maintenance workers
  ├── 2. Commercial → income-producing jobs
  ├── 3. Industrial → resource-producing jobs
  └── 4. Remaining → gatherers (bonus food/wood)
```

### 3. Population Change

Growth formula (simplified):
- **Growth:** When all needs met, +2–5% per year
- **Starvation:** If food deficit, lose proportional population
- **Dehydration:** If no water access, lose 10% population per year
- **Floor:** Population never drops below 1

---

## C10. Resource System — 5 Resources

### Pure Functions (`Resources.ts`, 79 lines)

```typescript
function canAfford(current: ResourceAmounts, cost: Partial<ResourceAmounts>): boolean {
  for (const key of RESOURCE_KEYS) {
    if ((cost[key] ?? 0) > current[key]) return false;
  }
  return true;
}

function addResources(a: ResourceAmounts, b: Partial<ResourceAmounts>): ResourceAmounts { ... }
function subtractResources(a: ResourceAmounts, b: Partial<ResourceAmounts>): ResourceAmounts { ... }
function clampToCapacity(resources: ResourceAmounts, capacity: ResourceCapacity): ResourceAmounts { ... }
```

### Stateful Manager (`ResourceManager.ts`, 88 lines)

```typescript
class ResourceManager {
  private resources: ResourceAmounts;
  private capacity: ResourceCapacity;

  add(amounts: Partial<ResourceAmounts>): void { ... }
  subtract(amounts: Partial<ResourceAmounts>): void { ... }
  canAfford(cost: Partial<ResourceAmounts>): boolean { ... }
  applySpoilage(): void {
    this.resources.food *= 0.80;  // 20% food loss
    this.resources.wood *= 0.90;  // 10% wood loss
  }
  applyConsumption(population: number): void {
    this.resources.food -= population;  // 1 food per person
  }
}
```

---

## C11. Turn Processor — 9-Phase Game Loop

`TurnProcessor.ts` (169 lines) executes the complete yearly economic cycle.

### Phase Sequence

```
processTurn(state: GameState) → TurnResult
  │
  ├── Phase 1: calculateNeeds(buildings, population)
  │     → housingCapacity, waterAccess, foodPerCapita, employmentRate
  │
  ├── Phase 2: allocateWorkforce(buildings, population)
  │     → Road workers, commercial, industrial, gatherers
  │
  ├── Phase 3: calculateProduction(buildings, workforce)
  │     → Food, wood, stone, metal production
  │     → Apply building efficiency multipliers
  │     → state.resources.add(produced)
  │
  ├── Phase 4: consumeFood(population)
  │     → state.resources.subtract({ food: population })
  │
  ├── Phase 5: applySpoilage()
  │     → Food × 0.80 (20% loss)
  │     → Wood × 0.90 (10% loss)
  │
  ├── Phase 6: calculatePopulationChange(needs, state)
  │     → Growth if needs met (+2–5%)
  │     → Starvation if food deficit
  │     → Dehydration if no water
  │     → state.population += change
  │
  ├── Phase 7: updateBuildingStates(buildings, population)
  │     → Residential: determine state by population ranges
  │     → Non-residential: maintain current state
  │
  ├── Phase 8: state.year++
  │
  └── Phase 9: return TurnResult {
        year, foodProduced, foodConsumed,
        incomeGenerated, populationChange, events[]
      }
```

### TurnResult Interface

```typescript
interface TurnResult {
  year: number;
  foodProduced: number;
  foodConsumed: number;
  incomeGenerated: number;
  populationChange: number;
  events: string[];         // Human-readable log messages
}
```

---

## C12. Warning System

`WarningSystem.ts` (141 lines) generates stateless warning objects:

### Thirst Warnings (WANDER Mode)

| Thirst Range | Priority | Color | Flash | Message |
|---|---|---|---|---|
| 70–100 | — | — | No | (no warning) |
| 50–70 | low | Yellow | No | "You feel thirsty" |
| 30–50 | medium | Orange | No | "Thirst intensifies" |
| 10–30 | danger | Red | Yes | "Dehydration warning!" |
| 0–10 | critical | Red | Yes (pulse) | "CRITICAL: Find water NOW!" |

### Other Warnings

| Function | Trigger | Message |
|---|---|---|
| `getFoodWarning(food)` | food < 50 | "Hunger pangs" |
| `getDangerWarning(value, max)` | value < max × 0.1 | "Danger!" |
| `getCombatMessage(result)` | After combat | "Hunted deer! +25 food" |
| `getRecruitmentMessage(type)` | After nomad interaction | "Nomad joined tribe!" |

### Warning Interface

```typescript
interface Warning {
  message: string;
  color: string;     // CSS color
  priority: 'low' | 'medium' | 'danger' | 'critical';
  flash: boolean;    // CSS animation trigger
}
```

---

## C13. Minimap

`Minimap.ts` (122 lines) renders a corner overlay:

### Features

| Feature | Implementation |
|---|---|
| **Size** | 200 × 200 pixels, fixed in corner |
| **Fog of war** | Only explored tiles visible |
| **Exploration** | 10-tile radius around player per frame |
| **Tile colors** | Matches terrain palette (green, blue, yellow, etc.) |
| **Player marker** | Red dot at current position |
| **Viewport rect** | White outline showing main camera view |
| **Visibility** | Visible in WANDER mode, hidden in CITY mode |

### Update Cycle

Each frame in WANDER mode:
1. `explore(playerX, playerY, radius)` — Mark tiles as discovered
2. `render(playerX, playerY, getTile)` — Draw discovered tiles, player, viewport

---

## C14. Shallow Water Solver — Pipe Model

*(Full mathematical treatment — see [B8](#b8-shallow-water-simulation-cfd) for the overview)*

### Implementation Details

#### `simulateStep()` — Core Solver (299 lines total)

The function processes the entire grid in 4 nested loops (one per phase):

```typescript
function simulateStep(grid: WaterGrid, config: WaterConfig, dt: number): void {
  const { width, height, terrain, depth, fluxRight, fluxUp, fluxLeft, fluxDown } = grid;
  const { gravity, cellSize } = config;
  const area = cellSize * cellSize;

  // Phase 1: Update fluxes
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const h = terrain[idx] + depth[idx];  // Hydraulic head

      // Right neighbor
      if (x < width - 1) {
        const nIdx = idx + 1;
        const dh = h - (terrain[nIdx] + depth[nIdx]);
        fluxRight[idx] = Math.max(0, fluxRight[idx] + dt * area * gravity * dh / cellSize);
      }
      // ... up, left, down similarly
    }
  }

  // Phase 2: Scale fluxes to prevent negative depth
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const totalOut = fluxRight[idx] + fluxUp[idx] + fluxLeft[idx] + fluxDown[idx];
      if (totalOut > 0) {
        const maxOut = depth[idx] * area / dt;
        if (totalOut > maxOut) {
          const scale = maxOut / totalOut;
          fluxRight[idx] *= scale;
          fluxUp[idx] *= scale;
          fluxLeft[idx] *= scale;
          fluxDown[idx] *= scale;
        }
      }
    }
  }

  // Phase 3: Update depth from net flux
  // Phase 4: Compute velocity from flux averages
}
```

#### `computeStableDt()` — CFL Condition

```typescript
function computeStableDt(grid: WaterGrid, config: WaterConfig): number {
  let maxDepth = 0;
  for (let i = 0; i < grid.depth.length; i++) {
    if (grid.depth[i] > maxDepth) maxDepth = grid.depth[i];
  }
  if (maxDepth < config.dryThreshold) return config.cellSize;  // No water
  return 0.9 * config.cellSize / Math.sqrt(config.gravity * maxDepth);
}
```

#### `applyFriction()` — Manning's Formula

```typescript
function applyFriction(grid: WaterGrid, config: WaterConfig, dt: number): void {
  for (let i = 0; i < grid.depth.length; i++) {
    if (grid.depth[i] < config.dryThreshold) continue;
    const n = MANNING_COEFFICIENTS[grid.tileTypes[i]] ?? 0.030;
    const speed = Math.sqrt(grid.velX[i] ** 2 + grid.velY[i] ** 2);
    const decay = 1 - dt * config.gravity * n * n / Math.pow(grid.depth[i], 4/3) * speed;
    const factor = Math.max(0, Math.min(1, decay));
    grid.velX[i] *= factor;
    grid.velY[i] *= factor;
  }
}
```

---

## C15. Flood Mechanics — Damage, Dams, Drainage

`FloodMechanics.ts` (169 lines) connects water simulation to gameplay.

### Constants

```typescript
const FLOOD_DAMAGE_THRESHOLD = 0.05;  // Minimum depth (m) to cause damage
const DAMAGE_SCALE = 1.5;             // Efficiency loss per meter of water
const MAX_DAMAGE = 0.9;               // Maximum efficiency loss (90%)
```

### Damage Assessment

```typescript
function assessFloodDamage(
  grid: WaterGrid,
  buildings: Building[]
): FloodDamageResult[] {
  return buildings
    .filter(b => grid.depth[gridIndex(b.x, b.y, grid.width)] > FLOOD_DAMAGE_THRESHOLD)
    .map(b => ({
      building: b,
      depth: grid.depth[gridIndex(b.x, b.y, grid.width)],
      damage: Math.min(MAX_DAMAGE, (depth - FLOOD_DAMAGE_THRESHOLD) * DAMAGE_SCALE)
    }));
}
```

### Damage Application

```typescript
function applyFloodDamage(results: FloodDamageResult[]): void {
  for (const r of results) {
    r.building.efficiency *= (1 - r.damage);
    // A building in 0.5m of water loses: min(0.9, (0.5 - 0.05) × 1.5) = 67.5%
  }
}
```

### Terrain Modification

**Dam/Levee:** Raises terrain elevation to block water flow.

```typescript
function applyDamToTerrain(grid: WaterGrid, x: number, y: number, height: number): void {
  const idx = gridIndex(x, y, grid.width);
  grid.terrain[idx] = Math.max(grid.terrain[idx], grid.terrain[idx] + height);
  // Water pushed away by raised terrain
}
```

**Drainage Channel:** Lowers terrain to attract and redirect water.

```typescript
function applyDrainageChannel(
  grid: WaterGrid, x: number, y: number, channelDepth: number, channelWidth: number
): void {
  // Lower terrain in a line
  // Set flow multiplier to encourage water to follow channel
}
```

---

## C16. Water Sources — Weather, Springs, Rivers

`WaterSources.ts` (134 lines) manages water input to the simulation.

### Seasonal Weather System

| Season | Index | Rain Chance | Evap Multiplier |
|---|---|---|---|
| Spring | 0 | 40% | 1.0× |
| Summer | 1 | 20% | 1.5× |
| Autumn | 2 | 50% | 0.8× |
| Winter | 3 | 30% | 0.3× |

```typescript
function seasonFromTurn(turn: number): number {
  return Math.floor(turn % 4);  // 0=Spring, 1=Summer, 2=Autumn, 3=Winter
}

function rollRainfall(turn: number): WeatherState {
  const season = seasonFromTurn(turn);
  const isRaining = Math.random() < SEASONAL_RAIN_CHANCE[season];
  return {
    isRaining,
    rainIntensity: isRaining ? 0.5 + Math.random() : 0,
    evapIntensity: SEASONAL_EVAP[season]
  };
}
```

### Point Sources

```typescript
function createSpring(x: number, y: number): WaterSource {
  return { x, y, rate: 0.01, type: 'spring' };  // 0.01 m³/s
}

function createRiverInlet(x: number, y: number): WaterSource {
  return { x, y, rate: 0.1, type: 'river' };   // 0.1 m³/s (10× spring)
}
```

### Weather Application

```typescript
function applyWeather(grid: WaterGrid, config: WaterConfig, weather: WeatherState): void {
  if (weather.isRaining) {
    addRainfall(grid, config, config.rainRate * weather.rainIntensity);
  }
  applyEvaporation(grid, config, config.evapRate * weather.evapIntensity);
}
```

---

## C17. Web Worker — Off-Thread Simulation

`WaterWorker.ts` (115 lines) — see [B10](#b10-web-worker-architecture) for the full architecture diagram.

### Message Types

```typescript
interface InitMessage {
  type: 'init';
  width: number;
  height: number;
  terrain: ArrayBuffer;
  depth: ArrayBuffer;
  tileTypes: ArrayBuffer;
  config: WaterConfig;
}

interface StepMessage {
  type: 'step';
  stepCount: number;
  rain?: boolean;
}

interface ResultMessage {
  type: 'result';
  depth: ArrayBuffer;
  velX: ArrayBuffer;
  velY: ArrayBuffer;
}
```

### Worker Handler

```typescript
self.onmessage = (e: MessageEvent<WorkerInMessage>) => {
  const msg = e.data;

  if (msg.type === 'init') {
    // Create water grid from received buffers
    grid = createWaterGrid(msg.width, msg.height);
    grid.terrain = new Float32Array(msg.terrain);
    grid.depth = new Float32Array(msg.depth);
    grid.tileTypes = new Uint8Array(msg.tileTypes);
    config = msg.config;
    self.postMessage({ type: 'ready' });
  }

  if (msg.type === 'step') {
    const dt = computeStableDt(grid!, config!);
    for (let i = 0; i < msg.stepCount; i++) {
      fullStep(grid!, config!, dt, msg.rain ? config!.rainRate : undefined);
    }
    // Send results with zero-copy transfer
    const result = {
      type: 'result' as const,
      depth: new Float32Array(grid!.depth).buffer,
      velX: new Float32Array(grid!.velX).buffer,
      velY: new Float32Array(grid!.velY).buffer
    };
    self.postMessage(result, [result.depth, result.velX, result.velY]);
  }
};
```

---

## C18. Water Renderer — Isometric Overlay

`WaterRenderer.ts` (184 lines) renders the simulation as a translucent layer.

### WaterRenderer Class

```typescript
class WaterRenderer {
  private ctx: CanvasRenderingContext2D;
  private config: WaterRenderConfig;

  render(grid: WaterGrid, camera: CameraState, viewport: Size): void {
    // 1. Compute visible tile range from camera
    const { startX, startY, endX, endY } = getVisibleRange(camera, viewport);

    // 2. For each visible cell
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const idx = gridIndex(x, y, grid.width);
        if (grid.depth[idx] < this.config.minDepth) continue;

        // 3. Compute color from depth
        const [r, g, b, a] = waterColor(grid.depth[idx]);

        // 4. Draw isometric diamond
        const screen = worldToCanvas(x, y, camera, viewport);
        this.ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
        this.drawDiamond(screen.x, screen.y);

        // 5. Flow arrows at high zoom
        if (camera.zoom > 1.5) {
          this.drawFlowArrow(screen, grid.velX[idx], grid.velY[idx]);
        }
      }
    }
  }
}
```

### Configuration

```typescript
interface WaterRenderConfig {
  minDepth: number;       // Below this, don't render (default: 0.01m)
  maxDepthColor: number;  // Depth at which color saturates (default: 2.0m)
  arrowScale: number;     // Velocity arrow length multiplier
  arrowMinSpeed: number;  // Below this speed, no arrow
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

**When I'd switch:** If adding 3D elevation, real-time lighting, or particle systems at scale. WebGPU compute shaders would also accelerate the water simulation.

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

The pipe model is the standard choice for game-quality water simulation. It's used in terrain erosion, flood simulators, and real-time strategy games.

**Reference:** Mei, Decaudin, Hu (2007). "Fast Hydraulic Erosion Simulation and Visualization on GPU."

---

## D4. Why SoA instead of AoS for the water grid?

**Array of Structs (AoS) — bad for cache:**
```typescript
cells[i].depth, cells[i+1].depth, cells[i+2].depth...
// Each cell is 37 bytes apart → 1 useful value per cache line load
```

**Struct of Arrays (SoA) — good for cache:**
```typescript
depth[i], depth[i+1], depth[i+2]...
// Each depth is 4 bytes apart → 16 useful values per cache line load
```

For a 128×128 grid, SoA has ~16× fewer cache misses during per-field iteration.

---

## D5. Why a Web Worker for simulation?

The main thread must maintain 60fps (16.67ms per frame). The water solver scales O(N) per grid cell per step. At larger grid sizes or more steps per turn, simulation could cause frame drops.

The Transferable ArrayBuffer protocol ensures zero-copy data transfer:
- No `JSON.stringify` / `JSON.parse`
- No structured clone
- Just pointer reassignment (O(1))
- Worker allocates fresh buffers for next step

---

## D6. How would you scale the world to millions of tiles?

**Current:** All visited chunks stay in memory.

**At scale:**
1. **LRU chunk cache** — Evict least-recently-used chunks (128-chunk budget = 524K tiles)
2. **IndexedDB persistence** — Save evicted chunks, reload on revisit
3. **LOD rendering** — Far chunks as single-color diamonds
4. **Simulation culling** — Water sim only on chunks near player/city
5. **Quad-tree spatial index** — For entity/building queries at O(log N)

---

## D7. Why turn-based instead of real-time?

Turn-based allows:
- Deep 9-phase economic simulation without frame budget
- Water sim runs N steps per turn (not per frame)
- Deterministic replay (identical inputs → outputs)
- Simpler testing (no timing, no race conditions)
- Strategic planning between turns

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

**Not tested (excluded):** Renderer.ts, WaterRenderer.ts, Minimap.ts (Canvas2D API), main.ts (DOM orchestrator), WaterWorker.ts (browser-only Worker API).

---

## D9. What would you do differently if you started over?

**Keep:** TypeScript strict + Vite + Vitest, Canvas2D for 2D, pipe model, SoA typed arrays, zero deps.

**Change:**
- **ECS architecture** for entities (better at 10K+ entities)
- **Event bus** for decoupling game systems
- **State machine library** for phase transitions
- **LRU chunk cache** from day one
- **WebGPU compute shaders** for water sim (100× throughput)
- **IndexedDB save/load** from the start

---

## D10. How does the building state evolution work?

### Residential (population-driven)

The building's state is determined by how many people live in it:

```
R4 Wigwam Village (max 90):
  0 people   → State 0: "Collapsed Wigwam Frames"    (0.0×)
  1–30       → State 1: "Small Wigwam Camp"           (0.5×)
  31–60      → State 2: "Wigwam Village"              (1.0×)
  61–90      → State 3: "Grand Wigwam Circle"         (1.5×)
```

### Non-Residential (default state)

Commercial and Industrial buildings default to State 2 (Established, 1.0×). They upgrade to State 3 based on desirability score and neighboring building quality.

### Efficiency Impact

All production, income, and gathering bonuses are multiplied by building efficiency:

```
I3 Stone Knapping Site (production: 60)
  State 1 (0.5×) → 30 production
  State 2 (1.0×) → 60 production
  State 3 (1.5×) → 90 production
```

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
├── src/ (test files — co-located)
│   ├── config/
│   │   ├── BuildingConfig.test.ts    (11 tests)
│   │   ├── CombatConfig.test.ts      (13 tests)
│   │   └── ZoneBonuses.test.ts       (18 tests)
│   ├── core/
│   │   ├── math.test.ts              (9 tests)
│   │   ├── noise.test.ts             (7 tests)
│   │   ├── Resources.test.ts         (12 tests)
│   │   └── ResourceManager.test.ts   (14 tests)
│   ├── game/
│   │   ├── GameState.test.ts         (7 tests)
│   │   ├── PopulationManager.test.ts (15 tests)
│   │   └── TurnProcessor.test.ts     (7 tests)
│   ├── simulation/
│   │   ├── types.test.ts             (17 tests)
│   │   ├── ShallowWater.test.ts      (22 tests)
│   │   ├── FloodMechanics.test.ts    (20 tests)
│   │   └── WaterSources.test.ts      (22 tests)
│   ├── ui/
│   │   └── WarningSystem.test.ts     (17 tests)
│   └── world/
│       ├── Building.test.ts          (7 tests)
│       ├── BuildingManager.test.ts   (14 tests)
│       ├── Chunk.test.ts             (5 tests)
│       ├── ChunkManager.test.ts      (8 tests)
│       ├── Entity.test.ts            (17 tests)
│       ├── Player.test.ts            (6 tests)
│       ├── TerrainGenerator.test.ts  (12 tests)
│       └── Tile.test.ts              (10 tests)
│
├── docs/
│   ├── PART1_SUMMARY.md        # Standalone summary
│   ├── PART2_TECH_STACK.md     # Standalone tech stack
│   ├── PART3_QUICK_START.md    # Standalone quick start
│   └── PART4_FULL_TUTORIAL.md  # This document
│
└── public/                     # Static assets (favicon)
```

**Source:** 31 files, ~5,945 lines
**Tests:** 23 files, ~2,994 lines
**Total:** ~8,939 lines TypeScript

---

## F1. Test Architecture

### Organization

Tests are co-located with source files: `Foo.ts` → `Foo.test.ts` in the same directory.

### Runner & Coverage

- **Vitest 4.0.18** — ESM-native, globals enabled
- **@vitest/coverage-v8** — V8 built-in coverage (fast, accurate)
- **Environment:** `node` (fastest — no JSDOM overhead)

### Enforced Thresholds

| Metric | Minimum | Current |
|---|---|---|
| Statements | 60% | 82.44% |
| Branches | 50% | 70.15% |
| Functions | 60% | 93.28% |
| Lines | 60% | 82.78% |

`npm run build` fails if coverage drops below thresholds.

### Excluded from Coverage

| File/Pattern | Reason |
|---|---|
| `src/main.ts` | DOM orchestrator — no testable logic |
| `src/rendering/**` | Canvas2D API calls — would need headless canvas |
| `src/ui/Minimap.ts` | Canvas2D overlay |
| `src/simulation/WaterWorker.ts` | Web Worker API (browser-only) |
| `src/simulation/index.ts` | Barrel re-exports only |

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

### 100% Coverage Modules

These modules have complete statement, branch, function, and line coverage:
- `core/Resources.ts` — Resource arithmetic
- `game/GameState.ts` — State factory
- `world/Building.ts` — Building instance factory
- `world/Chunk.ts` — Chunk creation
- `world/Tile.ts` — Tile types and palettes
- `config/CombatConfig.ts` — Combat calculations
- `simulation/types.ts` — Grid creation and utilities
- `simulation/ShallowWater.ts` — Core water solver (97.72% branches)
- `simulation/FloodMechanics.ts` — Flood damage system
- `simulation/WaterSources.ts` — Weather and sources (88.88% branches)

---

## F3. Test Categories

### By Module (290 tests total)

| Module | File | Tests | Focus |
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
| | WaterSources.test.ts | 22 | Seasons, rain, springs, rivers |
| **ui** | WarningSystem.test.ts | 17 | Thirst levels, food, combat messages |
| **world** | Building.test.ts | 7 | Factory, defaults |
| | BuildingManager.test.ts | 14 | Placement, validation, queries |
| | Chunk.test.ts | 5 | Creation, test pattern |
| | ChunkManager.test.ts | 8 | Lazy loading, caching |
| | Entity.test.ts | 17 | Combat, behaviors, spawning, rewards |
| | Player.test.ts | 6 | Movement, position |
| | TerrainGenerator.test.ts | 12 | Biome distribution, resources |
| | Tile.test.ts | 10 | Types, palettes, walkability |

### By Test Type

| Type | Count | Description |
|---|---|---|
| Unit | ~240 | Single function/class in isolation |
| Integration | ~35 | Multi-module interactions |
| Physics invariant | ~15 | Mass conservation, equilibrium, CFL stability |

### Notable Test Examples

**Mass conservation (ShallowWater.test.ts):**
```typescript
it('should conserve total water volume', () => {
  const grid = createWaterGrid(10, 10);
  // Add water to center
  grid.depth[gridIndex(5, 5, 10)] = 1.0;
  const volumeBefore = totalWaterVolume(grid);

  // Run 100 simulation steps
  for (let i = 0; i < 100; i++) {
    simulateStep(grid, DEFAULT_WATER_CONFIG, 0.01);
  }

  const volumeAfter = totalWaterVolume(grid);
  expect(volumeAfter).toBeCloseTo(volumeBefore, 5);  // Within FP epsilon
});
```

**Bowl equilibrium (ShallowWater.test.ts):**
```typescript
it('should reach equilibrium in a bowl', () => {
  const grid = createWaterGrid(10, 10);
  // Create bowl terrain (high edges, low center)
  // Add water
  // Run 2000 steps
  // Assert all water depths are equal (flat surface)
});
```

---

## Quick Links

| Document | Purpose |
|---|---|
| [Full README](../README.md) | Everything — Parts 1–4 combined |
| [Part 1: Summary](PART1_SUMMARY.md) | 30-second project overview |
| [Part 2: Tech Stack](PART2_TECH_STACK.md) | Architecture and decisions |
| [Part 3: Quick Start](PART3_QUICK_START.md) | Clone, install, run |

---

*Built with TypeScript and Canvas2D. 290 tests. Pipe-based CFD water simulation. Zero runtime dependencies. One `<canvas>`.*
