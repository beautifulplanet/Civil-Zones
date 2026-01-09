/**
 * Civil Zones - World Module
 * Terrain generation, noise, and world initialization
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════
export type {
    // Terrain types
    WorldTerrainType,
    SpawnableTerrain,
    ImpassableTerrain,
    
    // Tile types
    TileResource,
    WorldTileEntity,
    WorldTile,
    
    // Generation config
    WorldSizeConfig,
    TerrainGenOptions,
    
    // Player spawn
    SpawnResult,
    PlayerEntity,
    
    // Noise config
    NoiseParams
} from './types.js';

// Re-export with prefixes to avoid conflicts
export type { StoneDeposit as WorldStoneDeposit } from './types.js';
export type { TileBuilding as WorldTileBuilding } from './types.js';
export type { ElevationConfig as WorldElevationConfig } from './types.js';
export type { HighGroundPatch as WorldHighGroundPatch } from './types.js';

export {
    // Constants
    DEFAULT_NOISE_PARAMS,
    DEFAULT_WORLD_CONFIG
} from './types.js';

// ═══════════════════════════════════════════════════════════════════
// NOISE
// ═══════════════════════════════════════════════════════════════════
export {
    // Core noise
    initNoise,
    getSeed,
    hash,
    mix,
    valueNoise,
    fbm,
    fbmNormalized,
    
    // Terrain-specific noise
    terrainNoise,
    oceanNoise,
    lakeNoise,
    mountainNoise,
    riverNoise,
    isRiverAt,
    
    // Utility
    randomSeed,
    customNoise
} from './noise.js';

// ═══════════════════════════════════════════════════════════════════
// TERRAIN GENERATION
// ═══════════════════════════════════════════════════════════════════
export {
    // High ground
    generateHighGroundPatches,
    isInHighGroundPatch,
    
    // Elevation
    calculateElevation,
    generateHighGroundElevation,
    
    // Terrain determination
    determineTerrainType,
    
    // Tile creation
    createTile,
    
    // World generation
    generateTerrain,
    getTerrainStats,
    getLandWaterRatio
} from './terrain.js';

// ═══════════════════════════════════════════════════════════════════
// SPAWNING (prefixed to avoid conflicts)
// ═══════════════════════════════════════════════════════════════════
export {
    // Validation
    isValidSpawnPosition as worldIsValidSpawnPosition,
    countReachableTiles as worldCountReachableTiles,
    
    // Spawn finding
    findSpawnLocation,
    createPlayer as worldCreatePlayer,
    
    // Exploration
    exploreArea,
    isTileExplored,
    getExploredCount
} from './spawning.js';
