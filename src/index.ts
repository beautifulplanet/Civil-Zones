/**
 * Civil Zones - Main TypeScript Entry Point
 * ==========================================
 * 
 * A modular TypeScript architecture for the Civil Zones historical zoning simulator.
 * This module system uses the "Strangler Fig Pattern" for incremental migration
 * from the original ~27,000 line JavaScript codebase.
 * 
 * Module Structure (76 files, 14 directories):
 * --------------------------------------------
 * - types/       (4 files)  - Core type definitions: resources, buildings, game-state, tiles
 * - config/      (5 files)  - Game constants, building database (residential/commercial/industrial/special)
 * - core/        (5 files)  - Utilities: noise generation, terrain helpers, spatial algorithms
 * - systems/     (6 files)  - Game systems: population, demand, geology, workforce, needs
 * - rendering/   (5 files)  - Graphics: colors, camera, draw utilities, visual effects
 * - game/        (5 files)  - Game controller: inventory, player, state management, save/load
 * - input/       (5 files)  - Input handling: keyboard, mouse, gamepad controller
 * - ui/          (6 files)  - User interface: toast notifications, menus, HUD, logging
 * - ai/          (6 files)  - AI system: Q-learning, strategies, exploration, state management
 * - buildings/   (6 files)  - Building system: zones, placement, validation, evolution
 * - entities/    (6 files)  - Entity system: animals, nomads, berries, combat, spawning
 * - events/      (4 files)  - Event system: flooding, lore events, random occurrences
 * - world/       (5 files)  - World generation: terrain, noise, spawning algorithms
 * - time/        (4 files)  - Time system: turns, year progression, spoilage, population dynamics
 * 
 * Usage:
 * ------
 * Import specific modules:
 *   import { ResourceType, TILE_SIZE } from './dist/index.js';
 * 
 * Or import everything:
 *   import * as CivilZones from './dist/index.js';
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================
export * from './types/index.js';

// =============================================================================
// CONFIGURATION
// =============================================================================
export * from './config/index.js';

// =============================================================================
// CORE UTILITIES
// =============================================================================
export * from './core/index.js';

// =============================================================================
// GAME SYSTEMS
// =============================================================================
export * from './systems/index.js';

// =============================================================================
// RENDERING
// =============================================================================
export * from './rendering/index.js';

// =============================================================================
// GAME CONTROLLER
// =============================================================================
export * from './game/index.js';

// =============================================================================
// INPUT HANDLING
// =============================================================================
export * from './input/index.js';

// =============================================================================
// USER INTERFACE
// =============================================================================
export * from './ui/index.js';

// =============================================================================
// AI SYSTEM
// =============================================================================
export * from './ai/index.js';

// =============================================================================
// BUILDINGS
// =============================================================================
export * from './buildings/index.js';

// =============================================================================
// ENTITIES
// =============================================================================
export * from './entities/index.js';

// =============================================================================
// EVENTS
// =============================================================================
export * from './events/index.js';

// =============================================================================
// WORLD GENERATION
// =============================================================================
export * from './world/index.js';

// =============================================================================
// TIME SYSTEM
// =============================================================================
export * from './time/index.js';

// =============================================================================
// VERSION INFO
// =============================================================================
export const VERSION = '48.0.0';
export const BUILD_DATE = '2026-01-09';
export const MODULE_COUNT = 76;

/**
 * Future: This will be the game initialization function
 * For now, it just logs that the TypeScript module system is working
 */
export function initGame(): void {
    console.log(`[Civil Zones v${VERSION}] TypeScript module system loaded`);
    console.log(`[Civil Zones] Core utilities, types, and systems ready`);
}
