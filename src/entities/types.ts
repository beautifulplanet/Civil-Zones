/**
 * Civil Zones - Entity Types
 * Type definitions for animals, nomads, and berries
 */

// Import base types from canonical locations
import type { TerrainType, TileEntity as BaseTileEntity } from '../types/tiles.js';

// Re-export for convenience (with original names for internal use)
export type { TerrainType, BaseTileEntity };

// ═══════════════════════════════════════════════════════════════════
// ANIMAL TYPES
// ═══════════════════════════════════════════════════════════════════

/** Animal type names */
export type AnimalTypeName = 'DEER' | 'BISON' | 'MAMMOTH' | 'TURTLE' | 'WOLF';

/** Animal type configuration */
export interface AnimalTypeConfig {
    name: AnimalTypeName;
    hitToKill: number;           // Hits required to defeat
    foodReward: number | [number, number]; // Fixed or [min, max] range
    popCost: number;             // Population cost to kill (wolves cost pop)
    color: string;               // Display color
    speed: number;               // Movement speed (0.1-1.0)
    spawnRate: number;           // Spawn weight (0.0-1.0)
    terrain: TerrainType[];      // Valid spawn terrain
}

/** Animal instance (entity-specific) */
export interface EntityAnimal {
    x: number;
    y: number;
    hits: number;                // Damage taken
    type: AnimalTypeName;
    moving?: boolean;            // Currently moving
    targetX?: number;            // Movement target
    targetY?: number;
}

/** Animal combat result */
export interface AnimalCombatResult {
    defeated: boolean;
    foodGained: number;
    popLost: number;
    herdDamage: number;
    message: string;
    isHerd: boolean;
    gameOver?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// NOMAD TYPES
// ═══════════════════════════════════════════════════════════════════

/** Nomad encounter type */
export type NomadEncounterType = 'FRIENDLY' | 'HOSTILE' | 'NEUTRAL';

/** Nomad instance */
export interface Nomad {
    x: number;
    y: number;
    encountered?: boolean;
    type?: NomadEncounterType;
}

/** Nomad encounter result */
export interface NomadEncounterResult {
    type: NomadEncounterType;
    popGained: number;
    popLost: number;
    loot: {
        food: number;
        wood: number;
        stone: number;
    };
    mapReveal: boolean;
    message: string;
}

/** Loot range configuration */
export interface LootRange {
    min: number;
    max: number;
}

// ═══════════════════════════════════════════════════════════════════
// BERRY TYPES
// ═══════════════════════════════════════════════════════════════════

/** Berry bush instance */
export interface BerryBush {
    x: number;
    y: number;
    depleted?: boolean;
}

/** Berry gathering result */
export interface BerryGatherResult {
    success: boolean;
    poisoned: boolean;
    foodGained: number;
    popLost: number;
    message: string;
}

// ═══════════════════════════════════════════════════════════════════
// ENTITY TILE DATA
// ═══════════════════════════════════════════════════════════════════

/** Entity data stored on a tile (entity-specific) */
export interface EntityTileData {
    type: 'BERRY' | 'NOMAD' | 'WOLF';
    depleted?: boolean;
    encountered?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION CONSTANTS
// ═══════════════════════════════════════════════════════════════════

/** Default animal configurations */
export const DEFAULT_ANIMAL_TYPES: AnimalTypeConfig[] = [
    { 
        name: 'DEER', 
        hitToKill: 2, 
        foodReward: [1, 30], 
        popCost: 0, 
        color: '#C89858', 
        speed: 1, 
        spawnRate: 0.45, 
        terrain: ['GRASS', 'FOREST'] 
    },
    { 
        name: 'BISON', 
        hitToKill: 3, 
        foodReward: [5, 30], 
        popCost: 0, 
        color: '#A06830', 
        speed: 0.5, 
        spawnRate: 0.30, 
        terrain: ['GRASS', 'FOREST'] 
    },
    { 
        name: 'MAMMOTH', 
        hitToKill: 5, 
        foodReward: [15, 30], 
        popCost: 0, 
        color: '#806040', 
        speed: 0.3, 
        spawnRate: 0.10, 
        terrain: ['GRASS', 'FOREST'] 
    },
    { 
        name: 'TURTLE', 
        hitToKill: 1, 
        foodReward: [3, 15], 
        popCost: 0, 
        color: '#4A7A4A', 
        speed: 0.1, 
        spawnRate: 0.15, 
        terrain: ['SAND'] 
    },
    { 
        name: 'WOLF', 
        hitToKill: 2, 
        foodReward: 5, 
        popCost: 1, 
        color: '#666666', 
        speed: 1.5, 
        spawnRate: 0, // Wolves spawn separately
        terrain: ['GRASS', 'FOREST'] 
    }
];

/** Default animal spawn configuration */
export const DEFAULT_ANIMAL_CONFIG = {
    SPAWN_COUNT: 1064,          // Total animals on map
    PACK_DAMAGE: 1,             // Pop lost when fighting herd
    BEACH_SPAWN_COUNT: 150      // Extra turtles on beaches
};

/** Default nomad configuration */
export const DEFAULT_NOMAD_CONFIG = {
    SPAWN_COUNT: 1500,          // Total nomads on map
    FRIENDLY_CHANCE: 0.84,      // 84% friendly
    HOSTILE_CHANCE: 0.16,       // 16% hostile
    POP_GAIN: 1,                // Population gained from friendly
    HOSTILE_DAMAGE: { min: 1, max: 3 }, // Pop lost to hostile
    LOOT_FOOD: { min: 5, max: 25 },
    LOOT_WOOD: { min: 0, max: 15 },
    LOOT_STONE: { min: 0, max: 5 },
    MAP_REVEAL_RADIUS: 15       // Tiles revealed on friendly encounter
};

/** Default berry configuration */
export const DEFAULT_BERRY_CONFIG = {
    SPAWN_COUNT: 400,           // Berry bushes on map
    FOOD_VALUE: 10,             // Food gained (90% chance)
    POISON_CHANCE: 0.10,        // 10% chance of poison
    POISON_DAMAGE: 1            // Pop lost if poisoned
};

// ═══════════════════════════════════════════════════════════════════
// HELPER TYPES
// ═══════════════════════════════════════════════════════════════════

/** Spawn position with validation */
export interface SpawnPosition {
    x: number;
    y: number;
    valid: boolean;
    terrain?: TerrainType;
}

/** Entity spawn options */
export interface SpawnOptions {
    minDistanceFromPlayer?: number;
    maxAttempts?: number;
    allowOverlap?: boolean;
    terrainFilter?: TerrainType[];
}
