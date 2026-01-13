# 🏛️ CIVIL ZONES v48.0 - CODEBASE BIBLE
## Immutable Reference Document for AI Continuation

> **CRITICAL**: This document is the authoritative reference for ANY AI (ChatGPT, Claude, etc.) continuing development on this codebase. Read this ENTIRE document before making ANY changes.

---

# 📋 TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Architecture & File Structure](#2-architecture--file-structure)
3. [Core Systems](#3-core-systems)
4. [Rendering Pipeline](#4-rendering-pipeline)
5. [Game State Management](#5-game-state-management)
6. [Entity Systems](#6-entity-systems)
7. [Input Handling](#7-input-handling)
8. [UI System](#8-ui-system)
9. [AI System](#9-ai-system)
10. [Configuration](#10-configuration)
11. [Common Patterns](#11-common-patterns)
12. [Critical Rules](#12-critical-rules)
13. [Debugging Guide](#13-debugging-guide)
14. [Change Log Protocol](#14-change-log-protocol)

---

# 1. PROJECT OVERVIEW

## What is Civil Zones?
A **Stone Age civilization building game** with two distinct phases:
1. **WANDER Mode**: Player explores as a nomad, gathering food/wood, recruiting tribe members
2. **CITY Mode**: Player settles and builds a city with residential, commercial, industrial zones

## Tech Stack
- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite v5.4.21
- **Dev Server**: `npm run dev` → `http://localhost:3000`
- **Entry Point**: `index.html` loads `/src/main.ts` as ES module
- **Target**: Modern browsers (ES2020+)

## Key Files
```
index.html          # Main HTML entry point (DO NOT create game.html - use index.html)
src/main.ts         # Main game engine class (CivilZonesEngine)
src/rendering/      # All rendering code
src/game/           # Game state management
src/ui/             # UI controllers and toast system
src/ai/             # AI learning systems
src/config/         # Configuration constants
```

---

# 2. ARCHITECTURE & FILE STRUCTURE

## Directory Structure
```
Civil Zones/
├── index.html              # SINGLE entry HTML file
├── src/
│   ├── main.ts            # CivilZonesEngine class - MAIN GAME LOOP
│   ├── rendering/
│   │   ├── game-renderer.ts    # Main renderer (orchestrates all rendering)
│   │   ├── terrain-renderer.ts # Victorian map style terrain
│   │   ├── player-renderer.ts  # Player sprite & animations
│   │   ├── entity-renderer.ts  # Animals, nomads, berries
│   │   ├── building-renderer.ts# Buildings (tent→cabin→mansion)
│   │   ├── road-renderer.ts    # Road system
│   │   ├── camera.ts           # Camera & viewport
│   │   ├── colors.ts           # Color constants
│   │   └── index.ts            # Barrel exports
│   ├── game/
│   │   ├── state.ts           # GameState interface & factory
│   │   ├── save-load.ts       # Save/load to localStorage
│   │   └── index.ts
│   ├── ui/
│   │   ├── controller.ts      # DOM element bindings
│   │   ├── toast.ts           # Toast notification system
│   │   ├── hud.ts             # HUD updates
│   │   └── index.ts
│   ├── input/
│   │   ├── controller.ts      # InputController class
│   │   ├── keyboard.ts        # WASD + arrow key handling
│   │   ├── mouse.ts           # Click & drag handling
│   │   └── index.ts
│   ├── ai/
│   │   ├── types.ts           # AI types & actions
│   │   ├── qlearning.ts       # Q-learning implementation
│   │   ├── strategies.ts      # Build strategies
│   │   ├── exploration.ts     # Pathfinding helpers
│   │   ├── state.ts           # AI state reader
│   │   └── index.ts
│   ├── config/
│   │   ├── game-config.ts     # CFG object with all constants
│   │   ├── constants.ts       # Numeric constants
│   │   └── buildings/         # Building definitions
│   ├── types/
│   │   ├── game-state.ts      # TypeScript interfaces
│   │   ├── tiles.ts           # Tile types
│   │   └── buildings.ts       # Building types
│   └── world/
│       ├── terrain.ts         # Terrain generation
│       └── spawning.ts        # Entity spawning
```

## Import Pattern
**ALWAYS use `.js` extension in imports** (even for .ts files):
```typescript
// ✅ CORRECT
import { someFunction } from './module.js';

// ❌ WRONG - will fail
import { someFunction } from './module';
import { someFunction } from './module.ts';
```

---

# 3. CORE SYSTEMS

## Main Game Engine (`src/main.ts`)

The `CivilZonesEngine` class is the heart of the game:

```typescript
class CivilZonesEngine {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    gameState: GameState | null;
    tiles: RenderTile[][];
    camera: Rendering.Camera;
    gameRenderer: Rendering.GameRenderer;
    inputController: Input.InputController;
    
    // Game loop
    gameLoop(timestamp: number): void;
    
    // Player movement
    movePlayer(dx: number, dy: number): void;
    
    // Building placement
    placeBuilding(type: string, x: number, y: number): boolean;
    
    // Entity updates (called every frame)
    updateAnimals(): void;
    updateNomads(): void;
}
```

## Game Loop Flow
```
1. gameLoop(timestamp)
   ├── Check frame time (30 FPS cap)
   ├── updateCamera() - smooth following
   ├── updatePlayer() - pathfinding movement
   ├── updateAnimals() - animal AI
   ├── updateNomads() - nomad AI
   ├── render()
   │   └── gameRenderer.render(buildRenderState())
   └── requestAnimationFrame(gameLoop)
```

## Frame Rate
- **Target**: 30 FPS (FRAME_TIME = 33.33ms)
- **AI Updates**: Every 500ms (AI_UPDATE_INTERVAL)
- **Entity Updates**: Every 500ms

---

# 4. RENDERING PIPELINE

## Render Order (game-renderer.ts)
The rendering happens in this EXACT order (back to front):

```typescript
render(state: GameRenderState) {
    1. Clear canvas
    2. Apply camera transform
    3. renderTerrain()          // Base terrain tiles
    4. renderTerrainTransitions() // Smooth edges between terrain types
    5. renderWaterEdges()       // Rounded water/land transitions
    6. renderRoads()            // Road network
    7. renderWells()            // Water wells
    8. renderEntities()         // Berries, resources
    9. renderBuildings()        // All buildings
    10. renderAnimals()         // Deer, rabbits, fish, boars
    11. renderNomads()          // Friendly/hostile nomads
    12. renderPlayer()          // Player sprite
    13. renderFogOfWar()        // Cloud-edged fog
    14. renderGrid()            // Optional grid overlay
}
```

## Terrain Renderer (`terrain-renderer.ts`)
Victorian map style with:
- Parchment texture
- Japanese Ukiyo-e water (animated waves)
- Hand-drawn stippling

## Building Renderer (`building-renderer.ts`)
Residential evolution:
- Level 1: Leather tent with flags
- Level 2: Larger tent with wooden poles
- Level 3: Mud brick hut with dome roof
- Level 4: Log cabin with pitched roof
- Level 5-6: Larger structures

## Fog of War
Cloud-like edges (architect rendering style):
- Solid fog for unexplored tiles
- Puffy cloud circles along fog boundaries
- Uses deterministic random for consistent look

---

# 5. GAME STATE MANAGEMENT

## GameState Interface (`src/game/state.ts`)
```typescript
interface GameState {
    // Core stats
    pop: number;              // Population
    food: number;             // Food resource
    wood: number;             // Wood resource
    stone: number;            // Stone resource
    gold: number;             // Gold resource
    year: number;             // Current game year
    
    // Mode
    gameState: 'WANDER' | 'CITY';
    
    // Player
    player: {
        x: number;
        y: number;
        hp: number;
        maxHp: number;
        direction: string;    // 'up' | 'down' | 'left' | 'right'
    };
    
    // Inventory (WANDER mode)
    inventory: {
        food: number;
        wood: number;
    };
    
    // Thirst system
    thirst: number;           // 0-100
    thirstCounter: number;    // Steps until thirst decrease
    
    // Entities
    animals: Animal[];
    nomads: Nomad[];
    berries: Berry[];
    
    // Buildings (CITY mode)
    blds: Building[];
    wanderWells: Well[];      // Wells in WANDER mode (max 1!)
    
    // Settlement
    settlementPos: { x: number; y: number } | null;
}
```

## State Transitions
```
WANDER → CITY: When player clicks "Settle" button
- Requires: Near water, sufficient resources
- Creates: settlementPos, initial buildings
```

---

# 6. ENTITY SYSTEMS

## Animals (`updateAnimals()` in main.ts)
```typescript
interface Animal {
    type: 'DEER' | 'RABBIT' | 'BOAR' | 'FISH';
    x: number;
    y: number;
    state: 'IDLE' | 'FLEEING';
    fleeTarget?: { x: number; y: number };
}
```

**Behavior**:
- Deer/Rabbit: Flee from player when within 4 tiles
- Boar: Charges player when within 3 tiles (hostile!)
- Fish: Stay in water, swim randomly

## Nomads (`updateNomads()` in main.ts)
```typescript
interface Nomad {
    x: number;
    y: number;
    state: 'WALKING' | 'CHASING';
    is_hostile: boolean;
    chaseTarget?: { x: number; y: number };
}
```

**Behavior**:
- Friendly nomads: Walk randomly, chase animals, share food with player
- Hostile nomads: Attack player on contact
- **CRITICAL**: Nomads catch animals when within 1.5 tiles (not same tile - prevents overlap)
- Nomads "stalk" prey (40% chance to wait before pouncing)

## Berries
```typescript
interface Berry {
    x: number;
    y: number;
    amount: number;  // Food value when collected
}
```

---

# 7. INPUT HANDLING

## InputController (`src/input/controller.ts`)
```typescript
class InputController {
    // Movement (WASD + Arrows)
    onMove: (dx: number, dy: number) => void;
    
    // Click handling
    onClick: (x: number, y: number, button: number) => void;
    
    // Tool selection
    onToolChange: (tool: string) => void;
}
```

## Movement System
- WASD / Arrow keys for movement
- Click-to-move pathfinding (A* algorithm)
- Player moves one tile per step
- Collision with water/stone tiles blocked

---

# 8. UI SYSTEM

## Toast Notifications (`src/ui/toast.ts`)
```typescript
function showToast(message: string, options?: {
    duration?: number;    // Default: 3000ms
    type?: 'info' | 'success' | 'warning' | 'error';
}): void;
```

**Usage**:
```typescript
import * as UI from './ui/index.js';
UI.showToast('🏹 Nomad caught prey! +5 food', { duration: 2000 });
```

## Building Cards (index.html)
Building cards are defined in HTML with data attributes:
```html
<div class="building-card" data-building="RES" data-level="1">
    <img src="Media/res1-preview.png">
    <div class="card-name">Leather Tent</div>
    <div class="card-cost">🪵 50</div>
</div>
```

---

# 9. AI SYSTEM

## Q-Learning (`src/ai/qlearning.ts`)
The AI uses Q-learning to optimize city building:

```typescript
// State encoding
encodeWanderState(stage, highestUnlock, popBucket, foodOK, woodOK)
encodeCityState({ stage, civLevel, popBucket, ... })

// Action selection
chooseActionEpsilonGreedy(qTable, state, availableActions, explorationRate)

// Learning
updateQ(qTable, state, action, reward, nextState, params)
```

## AI Actions
```typescript
type AIAction = 
    | 'SETTLE' | 'WANDER'
    | 'BUILD_RES' | 'BUILD_RES_L2' | ... | 'BUILD_RES_L6'
    | 'BUILD_COM' | 'BUILD_COM_L2' | ... | 'BUILD_COM_L6'
    | 'BUILD_IND' | 'BUILD_IND_L2' | ... | 'BUILD_IND_L6'
    | 'BUILD_WELL' | 'BUILD_ROAD'
    | 'PASS_YEAR' | 'WAIT';
```

---

# 10. CONFIGURATION

## Game Config (`src/config/game-config.ts`)
```typescript
export const CFG = {
    COLORS: {
        FOG: '#D4C4A0',
        GRASS: '#C9D4A0',
        WATER: '#2A4A6C',
        SAND: '#D4C4A8',
        STONE: '#6B5D4C',
        // ... more colors
    },
    TILE_SIZE: 48,
    PLAYER_SPEED: 1,
    // ... more config
};
```

## Map Constants (main.ts)
```typescript
const INITIAL_MAP_SIZE = 500;     // Starting world size
const MAX_MAP_SIZE = 2000;        // Maximum world size
const EXPANSION_CHUNK = 100;      // Expand by this many tiles
const EXPANSION_DISTANCE = 50;    // Trigger expansion distance
```

---

# 11. COMMON PATTERNS

## Adding a New Feature
1. **Check existing code** - Use grep_search to find similar implementations
2. **Follow existing patterns** - Match the coding style
3. **Add to correct file** - Don't create new files unless necessary
4. **Test with TypeScript** - Run `npx tsc --noEmit` before committing

## Coordinate System
```
(0,0) ────────► X (MAP_WIDTH)
  │
  │
  ▼
  Y (MAP_HEIGHT)
```

- `tiles[x][y]` - Access tile at (x, y)
- `px = x * T` - Convert tile to pixel
- Camera offset: `px - camera.x`

## Entity Spawning
```typescript
// Spawn entity at tile (x, y)
this.gameState.animals.push({
    type: 'DEER',
    x: x,
    y: y,
    state: 'IDLE'
});
```

## Building Placement
```typescript
// Check if placement is valid
if (!this.canPlaceBuilding(type, x, y)) return false;

// Add to buildings array
this.gameState.blds.push({
    t: type,
    x: x,
    y: y,
    lvl: 1,
    pop: 0
});
```

---

# 12. CRITICAL RULES

## ⚠️ NEVER DO THESE:

### 1. **NEVER create game.html**
- Use `index.html` as the ONLY HTML entry point
- Creating game.html causes duplicate page issues

### 2. **NEVER use .ts extension in imports**
```typescript
// ❌ WRONG
import { x } from './file.ts';

// ✅ CORRECT
import { x } from './file.js';
```

### 3. **NEVER modify multiple files without testing**
- Run `npx tsc --noEmit` after EVERY change
- White screen = TypeScript error

### 4. **NEVER add more than 1 well in WANDER mode**
```typescript
// Already enforced in main.ts:
if (this.gameState.wanderWells.length >= 1) {
    UI.showToast('⚠️ Only one water pit allowed while wandering!');
    return;
}
```

### 5. **NEVER let entities overlap visually**
- Nomads catch animals when adjacent (dist < 1.5), NOT on same tile
- Player can't walk through walls/water
- Buildings need spacing

### 6. **NEVER break the render order**
- Fog MUST render last (before grid)
- Player renders AFTER buildings
- Terrain renders FIRST

## ✅ ALWAYS DO THESE:

### 1. **Always use barrel exports**
```typescript
// Import from index.ts
import * as Rendering from './rendering/index.js';
import * as UI from './ui/index.js';
```

### 2. **Always check for null**
```typescript
if (!this.gameState) return;
if (!this.tiles[x]?.[y]) return;
```

### 3. **Always use deterministic randomness for visuals**
```typescript
// Good - consistent based on position
const seed = (x * 7 + y * 13) % 100;

// Bad - changes every frame
const random = Math.random();
```

### 4. **Always throttle expensive operations**
```typescript
// Entity updates every 500ms, not every frame
if (now - this.lastEntityUpdate < 500) return;
```

---

# 13. DEBUGGING GUIDE

## White Screen
1. Open browser DevTools (F12)
2. Check Console for errors
3. Run `npx tsc --noEmit` to find TypeScript errors
4. Common causes:
   - Missing `.js` extension in import
   - Undefined variable
   - Type mismatch

## Entity Not Rendering
1. Check if entity is in the correct array (`animals`, `nomads`, etc.)
2. Check if entity coordinates are in visible range
3. Check render order in `game-renderer.ts`
4. Add console.log to verify entity exists

## Performance Issues
1. Check frame rate with `this.actualFPS`
2. Look for operations running every frame that should be throttled
3. Reduce entity count if needed
4. Check for memory leaks (arrays growing infinitely)

## Save/Load Issues
1. Check localStorage in DevTools → Application → Local Storage
2. Keys: `civil_zones_save`, `civil_zones_qtable`
3. Clear with: `localStorage.clear()`

---

# 14. CHANGE LOG PROTOCOL

When making changes, document them like this:

```markdown
## [Date] - [Feature/Fix Name]

### Changed Files:
- `src/file.ts` (lines X-Y): Description of change

### What:
Brief description of what was changed

### Why:
Explanation of why this change was needed

### Testing:
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Game loads without white screen
- [ ] Feature works as expected
- [ ] No regressions in existing features
```

---

# 📚 QUICK REFERENCE

## Common Commands
```bash
npm run dev         # Start dev server
npm run build       # Production build
npx tsc --noEmit    # Type check without build
```

## Key Constants
| Constant | Value | Location |
|----------|-------|----------|
| TILE_SIZE | 48 | main.ts |
| TARGET_FPS | 30 | main.ts |
| AI_UPDATE_INTERVAL | 500 | main.ts |
| INITIAL_MAP_SIZE | 500 | main.ts |
| MAX_MAP_SIZE | 2000 | main.ts |

## Game Modes
| Mode | Description |
|------|-------------|
| WANDER | Explore, gather, recruit |
| CITY | Build civilization |

## Entity States
| Entity | States |
|--------|--------|
| Animal | IDLE, FLEEING |
| Nomad | WALKING, CHASING |
| Player | (direction-based) |

---

# 🎯 FINAL NOTES

1. **Read before writing** - Always understand existing code first
2. **Small changes** - Make incremental changes, test each one
3. **Match the style** - Follow existing patterns exactly
4. **Test thoroughly** - TypeScript + visual verification
5. **Document changes** - Update this bible if adding new systems

**Last Updated**: January 12, 2026
**Version**: 48.0
**Maintainer**: Elite
