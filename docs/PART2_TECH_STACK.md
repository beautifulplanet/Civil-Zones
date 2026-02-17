# Part 2: Tech Stack & Architecture

*1 minute. What's used, how it fits together, and the key design decisions.*

> **This is a standalone version of Part 2 from the [main README](../README.md).** For the complete document, see the [full README](../README.md).

---

## Stack

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

**Runtime dependencies: 0.** Dev dependencies only: TypeScript, Vite, Vitest, @vitest/coverage-v8.

---

## Architecture

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

---

## Module Breakdown

### World Layer (7 files, ~991 lines)

| File | Lines | Purpose |
|---|---|---|
| Entity.ts | 438 | Entity system + behavior state machines (flee, charge, wander, wave, dance, chase) |
| BuildingManager.ts | 143 | Placement validation, spatial queries, zone bonus wiring |
| Tile.ts | 125 | 6 tile types with Sega Genesis palettes (base/highlight/shadow/dither) |
| TerrainGenerator.ts | 104 | FBM noise → elevation → biome assignment + resource distribution |
| ChunkManager.ts | 61 | Lazy chunk loading/caching with auto-generation |
| Player.ts | 52 | Player avatar with smooth tile-based movement |
| Building.ts | 37 | Building instance data (state, population, efficiency) |
| Chunk.ts | 38 | 64×64 tile chunk definition |

### Game Layer (3 files, ~409 lines)

| File | Lines | Purpose |
|---|---|---|
| PopulationManager.ts | 170 | Needs calculation, workforce allocation, growth/death |
| TurnProcessor.ts | 169 | 9-phase economic cycle per year |
| GameState.ts | 70 | Central state container (phase, resources, buildings, population) |

### Simulation Layer (6 files, ~938 lines)

| File | Lines | Purpose |
|---|---|---|
| ShallowWater.ts | 299 | Pipe model solver — flux, scaling, continuity, velocity, friction |
| WaterRenderer.ts | 184 | Isometric water overlay with depth coloring + flow arrows |
| FloodMechanics.ts | 169 | Damage assessment, dam/levee placement, drainage channels |
| types.ts | 168 | SoA grid (9 Float32Arrays), WaterConfig, Manning coefficients |
| WaterSources.ts | 134 | Seasonal weather, springs, river inlets |
| WaterWorker.ts | 115 | Web Worker with Transferable ArrayBuffer protocol |
| index.ts | 53 | Barrel exports |

### Config Layer (3 files, ~896 lines)

| File | Lines | Purpose |
|---|---|---|
| BuildingConfig.ts | 558 | 21 building definitions with costs, stats, 4-state evolution |
| ZoneBonuses.ts | 211 | Adjacency bonus calculator (road, water, clustering, isolation) |
| CombatConfig.ts | 127 | Animal stats, hit chance formula, nomad encounter rates |

### Rendering Layer (3 files, ~1,447 lines)

| File | Lines | Purpose |
|---|---|---|
| Renderer.ts | 1,224 | Full isometric renderer (tiles, buildings, entities, player) |
| WaterRenderer.ts | 184 | Water overlay with frustum culling |
| Camera.ts | 39 | Pan/zoom controller (0.02×–3.0×) |

### UI Layer (2 files, ~263 lines)

| File | Lines | Purpose |
|---|---|---|
| WarningSystem.ts | 141 | Priority-tagged warnings (thirst, food, combat, recruitment) |
| Minimap.ts | 122 | Corner overlay with fog-of-war, tile colors, player marker |

---

## Two-Phase State Machine

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

---

## Water Simulation Pipeline

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

---

## Web Worker Protocol

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

**Zero-copy transfer:** Buffers are sent as `Transferable` ArrayBuffers — ownership moves, no serialization or copying.

---

## Key Design Decisions

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
| Sega Genesis palette style | 4-color palette per tile type (base/highlight/shadow/dither) for retro aesthetic consistency |
| Co-located tests | `Foo.test.ts` next to `Foo.ts` — easy to find, easy to maintain |

---

## TypeScript Configuration

| Setting | Value | Why |
|---|---|---|
| `target` | ES2022 | Modern JS features, no polyfills |
| `module` | ESNext | Native ES modules |
| `moduleResolution` | bundler | Vite-compatible resolution |
| `strict` | true | All strict type checks enabled |
| `erasableSyntaxOnly` | true | TS 5.9 spec — no parameter properties |
| `noUnusedLocals` | true | Dead code prevention |
| `noUnusedParameters` | true | Dead code prevention |
| `verbatimModuleSyntax` | true | Explicit `type` imports |

---

## Quick Links

| Document | Purpose |
|---|---|
| [Full README](../README.md) | Everything — Parts 1–4 combined |
| [Part 1: Summary](PART1_SUMMARY.md) | 30-second project overview |
| [Part 3: Quick Start](PART3_QUICK_START.md) | Clone, install, run in 2 minutes |
| [Part 4: Full Tutorial](PART4_FULL_TUTORIAL.md) | Complete systems manual + FAQ |

---

*Built with TypeScript and Canvas2D. 290 tests. Pipe-based CFD water simulation. Zero runtime dependencies. One `<canvas>`.*
