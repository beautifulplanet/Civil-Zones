# Civil Zones

A Stone Age civilization builder played entirely in the browser — explore as a nomad, survive the wilderness, settle, and build a city with evolving zones and population dynamics.

**Stack:** TypeScript · Vite · Canvas2D · Perlin Noise FBM · A\* Pathfinding · Q-Learning AI

## Impact

- **Two-phase game engine** — WANDER (survival/exploration) transitions into CITY (SimCity-style RCI zoning with desirability-driven building evolution). Both phases share one procedurally generated world.
- **28,500+ lines of TypeScript** across 85 source files organized into 15 modules — rendering, AI, entities, buildings, events, population systems, and more.
- **Procedural world generation** — Perlin Noise FBM for terrain elevation, river carving from highlands to lowlands, balanced entity spawning, fog of war with dynamic reveal.
- **Population simulation** — growth, starvation, dehydration, exposure, plague (weighted by overcrowding), resource spoilage, and workforce assignment. Not a toy — the math kills your city if you mismanage it.
- **AI experiment** — Q-Learning agent that plays the game autonomously, persists learning across sessions via localStorage. Built to test AI as a development tool.

## Evidence

| Claim | Proof |
|-------|-------|
| 85 TypeScript source files | `Get-ChildItem src -Recurse -File -Filter "*.ts" \| Measure-Object` |
| 28,500+ lines of TypeScript | Same command with `Get-Content \| Measure-Object -Line` |
| 15 source modules | `Get-ChildItem src -Directory` |
| Perlin Noise terrain generation | `src/world/terrain.ts`, `src/core/noise.ts` |
| A\* pathfinding | `src/core/spatial.ts` |
| Q-Learning AI | `src/ai/qlearning.ts`, `src/ai/strategies.ts` |
| Building evolution (6 levels) | `src/buildings/evolution.ts`, `src/config/buildings/residential.ts` |
| Population dynamics | `src/systems/population.ts`, `src/systems/needs.ts`, `src/time/spoilage.ts` |
| 14-layer rendering pipeline | `src/rendering/game-renderer.ts` |
| Save/load system | `src/game/save-load.ts` |

## How to Read This README

| You are... | Start here | Time |
|------------|-----------|------|
| Hiring manager wanting highlights | Impact ↑ | 30 sec |
| Engineer evaluating architecture | Architecture ↓ | 2 min |
| Curious about game design | Game Mechanics ↓ | 5 min |
| Want to run it | Quick Start ↓ | 1 min |

## Ownership & Quality

Solo project built to test AI-assisted development at scale. I use AI tooling for code generation, but I design the systems, review every change, and own all decisions. This project was deliberately used as an experiment — some things were built to test AI limits, some mistakes were made on purpose.

**Honest gaps:** No automated tests. Q-Learning AI produced weak results — too complex for the pipeline, needs a different approach. Graphics are functional, not polished. This is project #6 of 6 and the lowest priority.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │              Canvas2D (48px tiles)                │       │
│  │  14-layer back-to-front rendering pipeline       │       │
│  │  Smooth camera follow (lerp), 30 FPS cap         │       │
│  └──────────────────────┬───────────────────────────┘       │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────┐       │
│  │             CivilZonesEngine (main.ts)            │       │
│  │  Game loop · State machine · Phase transitions    │       │
│  └──┬──────┬──────┬──────┬──────┬──────┬──────┬─────┘       │
│     │      │      │      │      │      │      │             │
│  ┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐        │
│  │World││Enti-││Build││Popu-││ AI  ││Input││ UI  │        │
│  │ Gen ││ties ││ings ││lati-││ Q-L ││Ctrl ││Ctrl │        │
│  │     ││     ││     ││ on  ││     ││     ││     │        │
│  └─────┘└─────┘└─────┘└─────┘└─────┘└─────┘└─────┘        │
│  terrain  animals  RCI     growth   learn  WASD   HUD      │
│  rivers   nomads   evolve  starve   train  click  toast    │
│  noise    combat   desir.  plague   play   A*     lore     │
│  fog      berries  roads   spoil   persist drag   save     │
└─────────────────────────────────────────────────────────────┘
                         │
                    localStorage
                 (save files + Q-table)
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Canvas2D over WebGL/Three.js | Tile-based 2D game. Canvas2D is simpler, faster to iterate, and sufficient for the visual style. |
| Two-phase state machine | Clean separation of survival mechanics (WANDER) and city-building mechanics (CITY). UI, input, and rendering switch entirely at the transition point. |
| Perlin Noise FBM for terrain | Produces natural-looking elevation maps. Rivers carved as a post-processing step from high to low ground. |
| A\* for click-to-move | Player can click anywhere on the map and pathfind there. Respects terrain walkability (water/stone are hard blockers). |
| Q-Learning over scripted AI | Experimental — wanted the AI to learn optimal strategies across sessions. Bellman equation with epsilon-greedy exploration. Persisted to localStorage so learning survives page reloads. |
| 500ms entity update throttle | Animals and nomads don't need 30 FPS AI updates. Throttling to 500ms keeps performance stable on large maps. |
| Dynamic map expansion | Start at 500×500, expand in 100-tile chunks up to 2000×2000 when the player approaches edges. Avoids generating a massive world upfront. |
| Resource spoilage | Food decays 20%/turn, wood 10%, stone 5%, metal 3%. Forces continuous production — you can't just stockpile and idle. |

---

## Game Mechanics

### Phase 1: WANDER (Survival)

You control a nomad band of 4 on a procedurally generated map covered in fog of war.

**Movement:** WASD/Arrow keys for direct movement, or click anywhere for A\* pathfinding. Cannot walk through water or stone.

**Survival loops:**
- **Thirst** rises as you walk. Stay near water or dig a well (hard cap: 1 well in WANDER). Thirst at 100 = population starts dying.
- **Food** is consumed per step. Gather berries (90% safe, 10% poison — costs population), hunt animals, or chop wood.
- **Inventory** has a 450-unit base capacity + 100 per recruited nomad. Overflow is lost.

**Animals** (update every 500ms):
| Animal | Behavior | Combat |
|--------|----------|--------|
| Deer / Rabbit | Flee within 4 tiles | Multiple hits to kill. Herd damage: 1–3 random pop loss. |
| Boar | Charges within 3 tiles (hostile) | Deals damage on contact. |
| Fish | Swims randomly in water | Cannot be hunted on land. |
| Wolves | — | Fixed population cost on kill. |

**Nomads** roam the world:
- **Friendly:** Walk randomly, hunt animals, share food on contact. Recruitable (increases pop + carry capacity).
- **Hostile:** Chase player on sight. Deal damage on contact.
- Nomads stalk prey 40% of the time before pouncing — gives them realistic hunting behavior.

**Settlement requirements:** Population ≥ 10, Food ≥ 50, Wood ≥ 30. Press Space to settle. A lore event fires: *"A Settlement is Born — No more wandering. This patch of earth... THIS belongs to us!"*

### Phase 2: CITY (Building)

SimCity-style RCI zoning on the same map.

**Building categories:**

| Type | Levels | Examples | Mechanic |
|------|--------|----------|----------|
| Residential | 6 | Leather tent → Log compound | Houses population. Auto-evolves based on desirability. |
| Commercial | 5 | Pebble trade fire → Blanket market | Generates gold/trade. |
| Industrial | 3 | Grub digging pit → Stone keeping | Produces raw materials. |
| Well | — | Water source | Supports 100 population each. |
| Road | 3 | Dirt path → Paved | Click-drag placement. Boosts desirability. |
| Campfire | — | Gathering spot | Boosts nearby desirability. |
| Hunting Ground | — | Passive food production | — |

**Desirability system:** Every tile has a desirability score. Water, campfires, wells, and roads increase it. Industrial buildings decrease it. High desirability → buildings automatically evolve to higher visual/capacity levels. Low desirability → buildings downgrade. View mode toggles: Normal, Desirability heatmap, Elevation, Political.

**Population dynamics (per turn):**

| Event | Rate | Trigger |
|-------|------|---------|
| Growth | +5% | Food available + housing capacity |
| Starvation | -20% of pop | No food |
| Dehydration | -20% of unwatered pop | Pop exceeds well capacity (100/well) |
| Exposure | -15% of homeless | Pop exceeds housing capacity |
| Plague | -30% of total pop | Random, weighted by `(homeless / pop) × 2` |
| Food spoilage | -20% per turn | Always (halved with storage buildings) |
| Wood spoilage | -10% per turn | Always |
| Stone spoilage | -5% per turn | Always |
| Metal spoilage | -3% per turn | Always |

**Workforce system:** Buildings require workers to function at full capacity. Worker shortages reduce output. Citizens have needs (food, water, shelter) evaluated each turn.

**RCI Demand Bars:** Three vertical bars show what the city needs — high R-demand means build more housing, high C-demand means build more commerce. Classic SimCity feedback loop.

**Flooding:** Environmental events that damage buildings near water and kill population. Death screen: *"They built too close to the water."*

### Rendering Pipeline (14 layers, back to front)

```
 1. Clear canvas
 2. Camera transform (smooth lerp pan/zoom)
 3. Terrain tiles (Victorian parchment texture, Ukiyo-e water waves)
 4. Terrain transitions (smooth edges between types)
 5. Water edges (rounded land/water borders)
 6. Roads
 7. Wells
 8. Entities (berries, stone deposits)
 9. Buildings (level-dependent sprites)
10. Animals (walk-cycle animation per type)
11. Nomads (friendly/hostile, walk-cycle animation)
12. Player sprite (cave-painting style, direction-aware)
13. Fog of War (cloud-puffed edges over unexplored tiles)
14. Grid overlay (toggleable)
```

### Q-Learning AI

The AI plays the game autonomously using reinforcement learning.

**State encoding:** Game state is compressed into a compact key — phase, population bucket, food/wood status, highest building unlock — for Q-table lookup.

**Action space:** `SETTLE`, `WANDER`, `BUILD_RES` (levels 1–6), `BUILD_COM` (levels 1–6), `BUILD_IND` (levels 1–6), `BUILD_WELL`, `BUILD_ROAD`, `BUILD_CLAN_CHIEF`, `BUILD_DOCK`, `EXCHANGE_GOLD`, `PASS_YEAR`, `WAIT`.

**Learning:** Bellman equation with epsilon-greedy exploration. Exploration rate decays: `baseRate × 0.99^episode + phaseBonus`. Three learning phases: survive and settle → build balanced cities → optimize. Death causes are tracked to learn avoidance (thirst deaths → build wells earlier).

**Persistence:** Q-table saved to `localStorage` as `civil_zones_qtable`. Learning survives page reloads and accumulates across sessions.

**Honest assessment:** The Q-learning produced weak results. The state space is too large for tabular Q-learning with sparse rewards. A different approach (e.g., reward shaping, function approximation, or scripted heuristics) would be needed to make this competitive.

### Lore System

One-time story popups at milestone events:

| Trigger | Title | Text |
|---------|-------|------|
| Game start | *The Dream* | "Early man had a dream one night..." |
| First berry | *The Berry Bush* | "90% of the time, it's fine! The other 10%..." |
| First nomad | *A Stranger Approaches* | "Friend or foe?" |
| First well | *Fresh Water!* | "Underground rivers!" |
| First house | *A Proper Shelter* | "We are no longer wanderers. We are SETTLERS." |
| Settlement | *A Settlement is Born* | "History was about to begin." |
| First road | *The Beaten Path* | "Why walk through thorns when you can walk on dirt?" |
| First hunt | *The Hunting Grounds* | "Chase the deer, catch one meal. Let the deer come to you..." |

### Game Over — Newspaper Screen

When population hits 0, a *"Prehistoric Times"* newspaper is rendered on canvas with:
- **Cause-specific headlines:** Thirst → *"TRIBE PERISHES FROM DEHYDRATION"*, Starvation → *"FAMINE CLAIMS ENTIRE TRIBE"*, Hunting → *"HUNTING EXPEDITION TURNS DEADLY"*, Flood → *"FLOOD DEVASTATES ANCIENT SETTLEMENT"*
- **Canvas illustration** based on highest building level (fossilized bones → collapsed lean-to → ruined stone house)
- **Archaeological stats:** Peak population, years survived, tech level, buildings, wells, resources

---

## Key Numbers

| Constant | Value | Meaning |
|----------|-------|---------|
| TypeScript source files | 85 | Across 15 modules |
| Lines of TypeScript | ~28,500 | `src/` directory |
| `TILE_SIZE` | 48px | Each tile is 48×48 pixels |
| `TARGET_FPS` | 30 | Frame rate cap |
| `ENTITY_UPDATE_INTERVAL` | 500ms | Animal/nomad AI tick rate |
| `AI_UPDATE_INTERVAL` | 500ms | Q-Learning decision rate |
| `INITIAL_MAP_SIZE` | 500 tiles | Starting world (500×500) |
| `MAX_MAP_SIZE` | 2000 tiles | Maximum world (2000×2000) |
| `EXPANSION_CHUNK` | 100 tiles | Map grows in 100-tile increments |
| `EXPANSION_DISTANCE` | 50 tiles | Triggers when player is 50 tiles from edge |
| `INVENTORY_BASE` | 450 | Starting carry capacity |
| `CAPACITY_PER_NOMAD` | 100 | Each recruit adds 100 carry |
| `FOOD_SPOILAGE` | 20%/turn | Food decay rate |
| `WOOD_SPOILAGE` | 10%/turn | Wood decay rate |
| `WATER_PER_WELL` | 100 | Each well supports 100 people |
| `SETTLE_MIN_POP` | 10 | Minimum people to settle |
| `SETTLE_MIN_FOOD` | 50 | Minimum food to settle |
| `SETTLE_MIN_WOOD` | 30 | Minimum wood to settle |
| `MAX_WANDER_WELLS` | 1 | Hard cap on wells while wandering |
| Residential levels | 6 | Tent → Log compound |
| Commercial levels | 5 | Pebble trade → Blanket market |
| Industrial levels | 3 | Grub pit → Stone keeping |

---

## Quick Start

```bash
git clone https://github.com/beautifulplanet/Civil-Zones.git
cd Civil-Zones
npm install
npm run dev
```

Open `http://localhost:3000`. That's it.

**Controls:**
| Input | Action |
|-------|--------|
| WASD / Arrows | Move nomad |
| Click | Pathfind to tile (A\*) |
| Space | Settle (when requirements met) |
| Scroll | Zoom in/out |
| Drag | Pan camera |

---

## Project Structure

```
Civil-Zones/
├── src/
│   ├── main.ts                    # CivilZonesEngine — main game loop
│   ├── index.ts                   # Entry point
│   ├── rendering/                 # 14-layer Canvas2D pipeline
│   │   ├── game-renderer.ts       # Orchestrates all rendering
│   │   ├── terrain-renderer.ts    # Victorian parchment terrain, Ukiyo-e water
│   │   ├── building-renderer.ts   # Level-dependent building sprites
│   │   ├── entity-renderer.ts     # Animals, nomads, berries
│   │   ├── player-renderer.ts     # Cave-painting style player sprite
│   │   ├── road-renderer.ts       # Road system
│   │   ├── camera.ts              # Viewport, smooth follow (lerp)
│   │   ├── colors.ts              # Color constants
│   │   ├── effects.ts             # Visual effects
│   │   └── draw-utils.ts          # Drawing helpers
│   ├── game/
│   │   ├── state.ts               # GameState interface + factory
│   │   ├── save-load.ts           # localStorage save/load + file export/import
│   │   ├── player.ts              # Player state
│   │   └── inventory.ts           # Inventory management
│   ├── ai/
│   │   ├── qlearning.ts           # Q-Learning implementation (Bellman equation)
│   │   ├── strategies.ts          # Build strategies
│   │   ├── exploration.ts         # Pathfinding helpers
│   │   ├── state.ts               # State encoder for Q-table
│   │   └── types.ts               # AI types + action definitions
│   ├── entities/
│   │   ├── combat.ts              # Attack system, herd damage, pop cost
│   │   ├── nomads.ts              # Friendly/hostile nomad behavior
│   │   ├── berries.ts             # Berry gathering (90/10 safe/poison)
│   │   ├── spawning.ts            # Entity distribution
│   │   └── types.ts               # Entity interfaces
│   ├── buildings/
│   │   ├── evolution.ts           # Desirability-driven auto-evolution
│   │   ├── placement.ts           # Building placement logic
│   │   ├── validation.ts          # Placement rules
│   │   ├── zones.ts               # RCI zone management
│   │   └── types.ts               # Building interfaces
│   ├── systems/
│   │   ├── population.ts          # Growth, starvation, dehydration, plague
│   │   ├── needs.ts               # Citizen needs (food, water, shelter)
│   │   ├── workforce.ts           # Worker assignment + productivity
│   │   ├── demand.ts              # RCI demand calculation
│   │   └── geology.ts             # Terrain properties
│   ├── events/
│   │   ├── flooding.ts            # Flood events, building damage
│   │   ├── lore.ts                # Milestone story popups
│   │   └── types.ts               # Event interfaces
│   ├── time/
│   │   ├── turns.ts               # Turn processing, year advancement
│   │   ├── spoilage.ts            # Resource decay per turn
│   │   └── types.ts               # Time system interfaces
│   ├── input/
│   │   ├── controller.ts          # InputController class
│   │   ├── keyboard.ts            # WASD + arrow handling
│   │   ├── mouse.ts               # Click, drag, tool dispatch
│   │   └── types.ts               # Input interfaces
│   ├── ui/
│   │   ├── controller.ts          # DOM bindings, building cards, video popups
│   │   ├── hud.ts                 # HUD updates (resources, pop, demand bars)
│   │   ├── toast.ts               # Toast notification system
│   │   ├── menus.ts               # Menu management
│   │   └── logging.ts             # UI-level logging
│   ├── world/
│   │   ├── terrain.ts             # Terrain generation (Perlin FBM + rivers)
│   │   ├── noise.ts               # Noise functions
│   │   ├── spawning.ts            # Entity spawn distribution
│   │   └── types.ts               # World interfaces
│   ├── config/
│   │   ├── game-config.ts         # Master config object
│   │   ├── constants.ts           # All numeric constants
│   │   ├── building-db.ts         # Building database
│   │   └── buildings/             # Per-category building definitions
│   │       ├── residential.ts     # 6 residential levels
│   │       ├── commercial.ts      # 5 commercial levels
│   │       ├── industrial.ts      # 3 industrial levels
│   │       └── special.ts         # Special structures
│   ├── core/
│   │   ├── noise.ts               # Perlin noise implementation
│   │   ├── spatial.ts             # A* pathfinding
│   │   ├── terrain.ts             # Terrain utilities
│   │   └── utils.ts               # General utilities
│   └── types/
│       ├── game-state.ts          # Master GameState interface
│       ├── buildings.ts           # Building type definitions
│       ├── tiles.ts               # Tile type definitions
│       └── resources.ts           # Resource type definitions
│
├── Media/                         # Building images + video intros
│   ├── Residential/               # Tent → Log compound visuals
│   ├── Commercial/                # Trade post → Market visuals
│   └── Industrial/                # Pit → Quarry visuals
│
├── CODEBASE_BIBLE.md              # Internal architecture reference (651 lines)
├── index.html                     # Entry point
├── package.json                   # Vite + TypeScript
├── tsconfig.json                  # Strict TypeScript config
└── vite.config.ts                 # Vite build config
```

## Version History

This codebase has been through 48+ iterations across multiple technology stacks:

| Version | Stack | Notes |
|---------|-------|-------|
| v01–v02 | JavaScript (vanilla) | Original prototype |
| v03 | HTML/JS | Backup of working 2D version |
| v04 | Java/JavaFX | Port attempt (abandoned) |
| v05–v11 | JavaScript (various) | Rapid iteration series |
| v12–v13 | TypeScript | Rewrite + experiment |
| v14 | Canvas2D (fresh start) | Clean architecture |
| v15 | TypeScript (isometric) | Isometric experiment (separate branch) |
| **v48** | **TypeScript + Vite + Canvas2D** | **Current — stable, 85 files, 28,500+ LOC** |

The repository has three branches reflecting these experiments: `main` (2D Canvas, v48), `isometric-ts` (isometric rewrite), `vanilla-js` (original JS prototype).

## What This Project Is (and Isn't)

**What it is:**
- A learning project used to test AI as a no-code development tool
- A genuine game with real systems — the population dynamics, desirability, and resource spoilage create emergent gameplay
- 28,500 lines of structured TypeScript with clear module boundaries
- An exercise in iterating fast across 48+ versions and multiple tech stacks

**What it isn't:**
- Production-ready (no tests, Q-learning needs rework)
- My strongest project (that's [SafePaw](https://github.com/beautifulplanet/SafePaw) or [Promotion Chess](https://github.com/beautifulplanet/Promotion-Variant-Chess))
- A graphics showcase (the art is functional, not polished)

## Known Limitations

- **No automated tests.** This is the biggest gap. The game was iterated too fast for test coverage to keep up.
- **Q-Learning AI is weak.** Tabular Q-learning with sparse rewards doesn't scale to this state space. Needs function approximation or reward shaping.
- **No multiplayer.** Single-player only.
- **Performance on very large maps.** 2000×2000 tiles with many entities can drop below 30 FPS on lower-end hardware.
- **Legacy files in repo.** Some Java files from the v04 port remain in `src/main/java/`. These are inactive — the game runs entirely from TypeScript.

## License

MIT
