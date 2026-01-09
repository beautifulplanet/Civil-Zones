/**
 * Civil Zones - World Generation Types
 * Type definitions for terrain, tiles, and world creation
 */

// ═══════════════════════════════════════════════════════════════════
// TERRAIN TYPES
// ═══════════════════════════════════════════════════════════════════

/** All terrain types in the game */
export type WorldTerrainType = 
    | 'GRASS' 
    | 'FOREST' 
    | 'SAND' 
    | 'WATER' 
    | 'DEEP' 
    | 'RIVER' 
    | 'STONE' 
    | 'ROCK' 
    | 'SNOW';

/** Terrain that entities can spawn on */
export type SpawnableTerrain = 'GRASS' | 'FOREST' | 'SAND' | 'ROCK' | 'SNOW';

/** Terrain that blocks player movement */
export type ImpassableTerrain = 'WATER' | 'DEEP' | 'STONE';

// ═══════════════════════════════════════════════════════════════════
// TILE TYPES
// ═══════════════════════════════════════════════════════════════════

/** Resource deposit on a tile */
export interface TileResource {
    type: 'STONE';
    amount: number;
    metal_yield: number;
}

/** Stone deposit (Mario-style rock with metal) */
export interface StoneDeposit {
    metal: number;
}

/** Entity data on a tile */
export interface WorldTileEntity {
    type: 'BERRY' | 'NOMAD' | 'WOLF';
    [key: string]: any;
}

/** Building data on a tile */
export interface TileBuilding {
    type?: string;
    pop?: number;
    level?: number;
    growth?: number;
    desirability?: number;
}

/** Complete tile data */
export interface WorldTile {
    type: WorldTerrainType;
    elevation: number;
    originalType: WorldTerrainType;
    road: boolean;
    tree: boolean;
    pol: number;                    // Pollution level
    bld: any;                       // Legacy building reference
    explored: boolean;
    zone: 'R' | 'C' | 'I' | null;
    building: TileBuilding | null;
    resource: TileResource | null;
    stoneDeposit: StoneDeposit | null;
    entity: WorldTileEntity | null;
    berry?: boolean;                // Legacy berry flag
    nomad?: boolean;                // Legacy nomad flag
    isPoison?: boolean;             // Berry poison flag
    isHostile?: boolean;            // Nomad hostile flag
    carriedFood?: number;           // Nomad carried food
}

// ═══════════════════════════════════════════════════════════════════
// GENERATION CONFIG
// ═══════════════════════════════════════════════════════════════════

/** World size configuration */
export interface WorldSizeConfig {
    W: number;                      // Width in tiles
    H: number;                      // Height in tiles
    TILE: number;                   // Tile size in pixels
}

/** Elevation system configuration */
export interface ElevationConfig {
    SEA_LEVEL_BASE: number;         // Starting sea level
    SEA_LEVEL_MIN: number;          // Minimum sea level
    SEA_LEVEL_MAX: number;          // Maximum sea level
}

/** High ground patch */
export interface HighGroundPatch {
    x: number;
    y: number;
}

/** Terrain generation options */
export interface TerrainGenOptions {
    seed: number;
    width: number;
    height: number;
    seaLevel: number;
    highGroundPatches?: HighGroundPatch[];
    patchSize?: number;
}

// ═══════════════════════════════════════════════════════════════════
// PLAYER SPAWN
// ═══════════════════════════════════════════════════════════════════

/** Player spawn position result */
export interface SpawnResult {
    x: number;
    y: number;
    method: 'center' | 'wide' | 'emergency' | 'forced';
    reachable: number;
}

/** Player entity */
export interface PlayerEntity {
    x: number;
    y: number;
    health: number;
    direction: 'up' | 'down' | 'left' | 'right';
}

// ═══════════════════════════════════════════════════════════════════
// NOISE CONFIG
// ═══════════════════════════════════════════════════════════════════

/** Noise generation parameters */
export interface NoiseParams {
    frequency: number;
    octaves?: number;
    offsetX?: number;
    offsetY?: number;
}

/** Default noise parameters for terrain features */
export const DEFAULT_NOISE_PARAMS = {
    terrain: { frequency: 0.02, octaves: 5 },
    ocean: { frequency: 0.008, octaves: 5 },
    lake: { frequency: 0.08, octaves: 5, offsetX: 500, offsetY: 500 },
    mountain: { frequency: 0.015, octaves: 5, offsetX: 1000, offsetY: 1000 },
    river: { frequency: 0.05, octaves: 5, offsetX: 100, offsetY: 100 }
};

// ═══════════════════════════════════════════════════════════════════
// WORLD GENERATION DEFAULTS
// ═══════════════════════════════════════════════════════════════════

/** Default world generation configuration */
export const DEFAULT_WORLD_CONFIG = {
    PATCH_SIZE: 8,                  // High ground patch size
    PATCHES_PER_AREA: 2500,         // ~1 patch per 50x50 area
    ELEVATION_BIAS: 2.5,            // Upward terrain bias
    RIVER_WIDTH: 0.015,             // River threshold
    MOUNTAIN_THRESHOLD: 0.68,       // Mountain noise threshold
    MOUNTAIN_HEIGHT_MIN: 0.55,      // Minimum height for mountains
    LAKE_THRESHOLD: 0.03,           // Lake noise threshold (very rare)
    TREE_CHANCE: 0.2                // Tree spawn chance on valid terrain
};
