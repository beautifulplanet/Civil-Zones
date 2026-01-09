/**
 * Civil Zones - Tile & Terrain Type Definitions
 * Map tiles, terrain types, and zone definitions
 */

import type { PlacedBuilding } from './buildings.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TERRAIN TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Base terrain types */
export type TerrainType = 
    | 'GRASS'
    | 'FOREST'
    | 'SAND'
    | 'ROCK'
    | 'STONE'
    | 'SNOW'
    | 'WATER'
    | 'DEEP'
    | 'RIVER';

/** Zone types for SimCity-style zoning */
export type ZoneType = 'R' | 'C' | 'I' | null;

// ═══════════════════════════════════════════════════════════════════════════════
// RESOURCE DEPOSITS
// ═══════════════════════════════════════════════════════════════════════════════

/** Resource deposit on a tile */
export interface ResourceDeposit {
    type: 'STONE' | 'METAL' | 'GOLD';
    amount: number;
    metal_yield?: number;  // Hidden metal bonus when worked
}

/** Stone deposit (Mario-style rocks) */
export interface StoneDeposit {
    metal: number;  // Metal contained
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENTITIES ON TILES
// ═══════════════════════════════════════════════════════════════════════════════

/** Entity types that can exist on tiles */
export type EntityType = 
    | 'NOMAD'
    | 'ANIMAL'
    | 'BERRY'
    | 'WOLF';

/** Base entity on a tile */
export interface TileEntity {
    type: EntityType;
    data?: Record<string, unknown>;
}

/** Berry bush entity */
export interface BerryEntity extends TileEntity {
    type: 'BERRY';
    isPoison?: boolean;
    amount?: number;
}

/** Nomad entity */
export interface NomadEntity extends TileEntity {
    type: 'NOMAD';
    isHostile?: boolean;
    carriedFood?: number;
}

/** Animal entity */
export interface AnimalEntity extends TileEntity {
    type: 'ANIMAL';
    animalType: 'DEER' | 'BISON' | 'MAMMOTH';
    health?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TILE DATA
// ═══════════════════════════════════════════════════════════════════════════════

/** Building on tile (simplified for non-DB buildings) */
export interface TileBuilding {
    level: number;
    growth: number;
    desirability: number;
    pop?: number;
    workers?: number;
    variant?: number;
    builtYear?: number;
}

/** Complete tile data structure */
export interface Tile {
    // Terrain
    type: TerrainType;
    originalType: TerrainType;  // For water cycle restoration
    elevation: number;          // 0-10 elevation scale
    
    // Features
    road: boolean;
    tree: boolean;
    pol: number;  // Pollution level
    
    // Building (legacy system)
    bld: PlacedBuilding | null;
    
    // Exploration
    explored: boolean;
    
    // Zoning (SimCity-style)
    zone: ZoneType;
    building: TileBuilding | null;
    
    // Resources
    resource: ResourceDeposit | null;
    stoneDeposit: StoneDeposit | null;
    
    // Entities
    entity: TileEntity | null;
    
    // Legacy entity fields (for backwards compatibility)
    berry?: boolean;
    isPoison?: boolean;
    nomad?: boolean;
    isHostile?: boolean;
    carriedFood?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAP CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/** Geological period for water cycle */
export interface GeologicalPeriod {
    name: string;
    duration: number;  // In centuries
    seaLevel: number;  // Target sea level
}

/** Geological state tracking */
export interface GeologyState {
    currentSeaLevel: number;
    periodIndex: number;
    centuriesInPeriod: number;
    lastUpdateYear: number;
    tilesFlooded: number;
    tilesDrained: number;
    currentPeriodName: string;
}

/** High ground patch for guaranteed safe areas */
export interface HighGroundPatch {
    x: number;
    y: number;
}

/** Terrain generation configuration */
export interface TerrainGenConfig {
    seed: number;
    width: number;
    height: number;
    seaLevelBase: number;
    patchSize: number;
    numPatches: number;
}
