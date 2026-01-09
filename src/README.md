# Civil Zones - TypeScript Module System

A modular TypeScript architecture for the Civil Zones historical zoning simulator, migrated using the **Strangler Fig Pattern** for incremental adoption.

## Overview

- **76 TypeScript modules** across **14 directories**
- Strict TypeScript with ES2022 target
- Zero breaking changes to existing game
- Full type safety and IntelliSense support

## Module Structure

```
src/
├── index.ts              # Main entry point (re-exports all modules)
├── types/       (4)      # Core type definitions
├── config/      (5)      # Game configuration & building database
├── core/        (5)      # Utilities (noise, terrain, spatial)
├── systems/     (6)      # Game systems (population, demand, geology)
├── rendering/   (5)      # Graphics (colors, camera, effects)
├── game/        (5)      # Game controller (state, save/load)
├── input/       (5)      # Input handling (keyboard, mouse, gamepad)
├── ui/          (6)      # User interface (toast, menus, HUD)
├── ai/          (6)      # AI system (Q-learning, strategies)
├── buildings/   (6)      # Building system (zones, placement)
├── entities/    (6)      # Entities (animals, nomads, berries)
├── events/      (4)      # Events (flooding, lore)
├── world/       (5)      # World generation (terrain, spawning)
└── time/        (4)      # Time system (turns, spoilage)
```

## Module Details

### types/ - Core Type Definitions
| File | Purpose |
|------|---------|
| `resources.ts` | Resource types: food, wood, stone, metal, goods |
| `buildings.ts` | Building definitions, zone types, evolution tiers |
| `game-state.ts` | Game state, player data, victory conditions |
| `tiles.ts` | Map tiles, terrain types, tile properties |

### config/ - Game Configuration
| File | Purpose |
|------|---------|
| `constants.ts` | Game constants: TILE_SIZE, MAP dimensions, speeds |
| `building-db.ts` | Building database aggregator |
| `buildings/residential.ts` | Houses, apartments, mansions |
| `buildings/commercial.ts` | Shops, markets, taverns |
| `buildings/industrial.ts` | Workshops, factories, mines |
| `buildings/special.ts` | Wells, farms, walls, storage |

### core/ - Core Utilities
| File | Purpose |
|------|---------|
| `noise.ts` | Perlin/Simplex noise for terrain generation |
| `utils.ts` | Helper functions: clamp, lerp, random |
| `terrain.ts` | Terrain analysis and pathfinding |
| `spatial.ts` | Spatial algorithms, grid operations |

### systems/ - Game Systems
| File | Purpose |
|------|---------|
| `population.ts` | Population growth, migration, death |
| `demand.ts` | Resource demand calculation |
| `geology.ts` | Resource deposits, mining yields |
| `workforce.ts` | Worker assignment, productivity |
| `needs.ts` | Citizen needs: food, water, shelter |

### rendering/ - Graphics
| File | Purpose |
|------|---------|
| `colors.ts` | Color palettes, terrain colors |
| `camera.ts` | Camera control, viewport management |
| `draw-utils.ts` | Canvas drawing helpers |
| `effects.ts` | Visual effects: particles, animations |

### game/ - Game Controller
| File | Purpose |
|------|---------|
| `state.ts` | Game state management |
| `player.ts` | Player actions, commands |
| `inventory.ts` | Resource inventory management |
| `save-load.ts` | Save/load game functionality |

### input/ - Input Handling
| File | Purpose |
|------|---------|
| `keyboard.ts` | Keyboard shortcuts, hotkeys |
| `mouse.ts` | Mouse clicks, drag, scroll |
| `controller.ts` | Gamepad support |
| `types.ts` | Input state types |

### ui/ - User Interface
| File | Purpose |
|------|---------|
| `toast.ts` | Toast notifications |
| `menus.ts` | Game menus, dialogs |
| `hud.ts` | Heads-up display |
| `logging.ts` | Game event logging |
| `types.ts` | UI component types |

### ai/ - AI System
| File | Purpose |
|------|---------|
| `qlearning.ts` | Q-learning implementation |
| `strategies.ts` | AI decision strategies |
| `exploration.ts` | Map exploration logic |
| `state.ts` | AI state management |
| `types.ts` | AI type definitions |

### buildings/ - Building System
| File | Purpose |
|------|---------|
| `zones.ts` | Zone management (R/C/I) |
| `placement.ts` | Building placement validation |
| `validation.ts` | Construction requirements |
| `evolution.ts` | Building upgrades |
| `types.ts` | Building type definitions |

### entities/ - Entity System
| File | Purpose |
|------|---------|
| `spawning.ts` | Entity spawning logic |
| `combat.ts` | Combat mechanics |
| `nomads.ts` | Nomad behavior |
| `berries.ts` | Berry bush mechanics |
| `types.ts` | Entity type definitions |

### events/ - Event System
| File | Purpose |
|------|---------|
| `flooding.ts` | Flood mechanics |
| `lore.ts` | Lore event generation |
| `types.ts` | Event type definitions |

### world/ - World Generation
| File | Purpose |
|------|---------|
| `terrain.ts` | Terrain generation algorithms |
| `noise.ts` | World noise configuration |
| `spawning.ts` | Resource/entity spawning |
| `types.ts` | World type definitions |

### time/ - Time System
| File | Purpose |
|------|---------|
| `turns.ts` | Turn processing, year advancement |
| `spoilage.ts` | Resource decay (food 20%, wood 10%) |
| `types.ts` | Time state, turn results |

## Usage

### Build
```bash
npx tsc
```

### Import Modules
```typescript
// Import specific items
import { 
    ResourceType, 
    TILE_SIZE, 
    calculatePopulationGrowth 
} from './dist/index.js';

// Import everything
import * as CivilZones from './dist/index.js';

// Import from specific module
import { createNoiseGenerator } from './dist/core/noise.js';
```

## Architecture Notes

- **Strangler Fig Pattern**: New TypeScript modules wrap existing functionality
- **No Breaking Changes**: Original `index.html` game works unchanged
- **Gradual Migration**: Each module can be integrated incrementally
- **Type Safety**: Full TypeScript strict mode with explicit types

## Version

- Game Version: 48.0.0
- Module Count: 76
- Build Date: 2026-01-09
