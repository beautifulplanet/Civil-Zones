# Part 1: Summary

> **This is a standalone version of Part 1 from the [main README](../README.md).** For the complete document, see the [full README](../README.md).

---

## What This Is

A Stone Age civilization builder. Two gameplay phases: WANDER (nomad survival with real-time movement) and CITY (turn-based zone building). Renders on a single `<canvas>` using Canvas2D with isometric projection.

**Prototype — not production-ready.** See the [main README](../README.md) for current status and roadmap.

## What It Contains

- Two-phase gameplay: WANDER mode (nomad survival) → CITY mode (zone-based city building)
- Procedural isometric world: chunk-based terrain with noise-driven biomes (grass, forest, sand, stone, water, dirt)
- Pipe-based shallow water simulation: solver based on Mei et al. 2007, runs in a Web Worker
- Entity system: 5 animal types + nomads with simple behavior state machines (flee, charge, wander)
- Building system: 21 building types with zone bonuses and 4-state evolution
- Canvas2D renderer: procedural shapes (no sprite assets yet), isometric 2:1 projection
- Zero runtime dependencies

---

## Why It's Interesting (for Interviewers)

| Talking Point | Detail |
|---|---|
| CFD / Numerical Methods | Pipe-based shallow water model: 4-directional flux, CFL-stable timestep, Manning's friction, mass-conserving |
| Systems programming | SoA typed arrays (Float32Array × 9), Web Worker with Transferable ArrayBuffer protocol for off-thread sim |
| Full-stack game design | Two-phase state machine, turn-based economy, 21 building types with 4-state evolution, zone bonus adjacency |
| Procedural generation | FBM noise terrain, infinite chunk loading, 6 tile types, ore/resource distribution |
| Testing discipline | 290 tests across 23 files, 82.78% line coverage, Vitest + v8 coverage |
| Isometric rendering | Custom 2:1 isometric projection, frustum culling, entity animation, water overlay with flow arrows |
| Performance engineering | Web Worker off-thread simulation, SoA cache-friendly layout, chunk-based lazy loading |

---

## Key Numbers

| Metric | Value |
|---|---|
| Source code | 31 files, ~5,945 lines |
| Test code | 23 files, ~2,994 lines |
| Total | ~8,939 lines TypeScript |
| Test count | 290 tests, all passing |
| Coverage | 82.78% lines, 93.28% functions |
| Building types | 21 (R1–R6, C1–C6, I1–I6, WELL, ROAD, CHIEF_HUT) |
| Tile types | 6 (Grass, Water, Sand, Stone, Forest, Dirt) |
| Entity types | 6 (Deer, Rabbit, Boar, Bear, Bison, Nomad) |
| Water sim fields | 9 Float32Arrays + 1 Uint8Array per grid |
| Runtime dependencies | 0 |

---

## Gameplay Overview

### WANDER Mode (Phase 1)

You start as a nomad exploring an infinite procedural world. Survive by:
- **Hunting animals** — deer, rabbits, boars, bears, bison with HP-based combat
- **Gathering resources** — berries for food, trees for wood
- **Recruiting nomads** — 75% friendly (join tribe), 25% hostile (attack)
- **Managing thirst** — decreases per step, death at 0, find water or dig wells
- **Meeting settlement requirements** — 5+ tribe members, 100 food, 40 wood, water access

### CITY Mode (Phase 2)

After settling, build a civilization through zone-based development:
- **Residential buildings** (R1–R6) — Housing for 15–240 people per building
- **Commercial buildings** (C1–C6) — Jobs and income (5–320 gold/turn)
- **Industrial buildings** (I1–I6) — Resource production and gathering bonuses
- **Infrastructure** — Wells (water), Roads (+25% efficiency), Chief's Hut (unlocks L4–L6)
- **Turn-based economy** — 1 turn = 1 year with 9-phase processing loop

---

## Technical Highlights

### Shallow Water Simulation

Real pipe-based CFD solver implementing:
- 4-directional flux computation from hydraulic head differences
- Negative-depth prevention via flux scaling (unconditionally mass-conserving)
- CFL-stable adaptive timestep: $\Delta t = 0.9 \times L / \sqrt{g \cdot h_{max}}$
- Manning's roughness friction per tile type (grass=0.030, forest=0.100, water=0.010)
- Seasonal weather system (4 seasons with varying rain probability and evaporation)
- Flood damage mechanics (efficiency loss = depth × 1.5, capped at 90%)
- Dam/levee and drainage channel terrain modification

### Web Worker Architecture

Water simulation runs off the main thread via Web Worker with zero-copy `Transferable` ArrayBuffer protocol. Main thread maintains 60fps rendering while the worker computes N solver steps per message.

### Isometric Engine

Custom Canvas2D renderer (1,224 lines) with procedural graphics:
- 2:1 isometric projection (64×32px tiles)
- Dithered tile fills with highlight/shadow edges
- Animated entities with behavioral state machines
- Frustum-culled water overlay with velocity flow arrows

---

## Quick Links

| Document | Purpose |
|---|---|
| [Full README](../README.md) | Everything — Parts 1–4 combined |
| [Part 2: Tech Stack](PART2_TECH_STACK.md) | Architecture and stack decisions |
| [Part 3: Quick Start](PART3_QUICK_START.md) | Clone, install, run in 2 minutes |
| [Part 4: Full Tutorial](PART4_FULL_TUTORIAL.md) | Complete systems manual + FAQ |

---

*TypeScript. Canvas2D. 290 tests. Zero runtime dependencies.*
