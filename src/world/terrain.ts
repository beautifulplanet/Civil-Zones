/**
 * Civil Zones - Terrain Generation
 * Generate terrain tiles with elevation and features
 */

import type { 
    WorldTile, 
    WorldTerrainType, 
    HighGroundPatch,
    TerrainGenOptions,
    TileResource
} from './types.js';
import { 
    initNoise, 
    terrainNoise, 
    oceanNoise, 
    lakeNoise, 
    mountainNoise, 
    isRiverAt 
} from './noise.js';
import { DEFAULT_WORLD_CONFIG } from './types.js';

// ═══════════════════════════════════════════════════════════════════
// HIGH GROUND PATCHES
// ═══════════════════════════════════════════════════════════════════

/** Generate high ground patches for safe building zones */
export function generateHighGroundPatches(
    width: number,
    height: number,
    patchSize: number = DEFAULT_WORLD_CONFIG.PATCH_SIZE,
    patchesPerArea: number = DEFAULT_WORLD_CONFIG.PATCHES_PER_AREA
): HighGroundPatch[] {
    const patches: HighGroundPatch[] = [];
    const numPatches = Math.floor((width * height) / patchesPerArea);
    
    for (let i = 0; i < numPatches; i++) {
        // Random positions but avoid edges
        const px = Math.floor(Math.random() * (width - patchSize - 10)) + 5;
        const py = Math.floor(Math.random() * (height - patchSize - 10)) + 5;
        patches.push({ x: px, y: py });
    }
    
    return patches;
}

/** Check if position is within a high ground patch */
export function isInHighGroundPatch(
    x: number, 
    y: number, 
    patches: HighGroundPatch[],
    patchSize: number = DEFAULT_WORLD_CONFIG.PATCH_SIZE
): boolean {
    for (const patch of patches) {
        if (x >= patch.x && x < patch.x + patchSize && 
            y >= patch.y && y < patch.y + patchSize) {
            return true;
        }
    }
    return false;
}

// ═══════════════════════════════════════════════════════════════════
// ELEVATION CALCULATION
// ═══════════════════════════════════════════════════════════════════

/** Calculate elevation from height noise */
export function calculateElevation(
    heightNoise: number,
    bias: number = DEFAULT_WORLD_CONFIG.ELEVATION_BIAS
): number {
    // Convert height noise (0-1) to elevation (0-10) with upward bias
    // bias of 2.5 means more land at higher elevations
    let elevation = Math.round((heightNoise * 100 + bias * 10)) / 10;
    return Math.min(10, Math.max(0, elevation));
}

/** Generate high ground elevation for patches */
export function generateHighGroundElevation(): number {
    return 7 + Math.random() * 1.5; // 7.0 to 8.5 (always safe from flooding)
}

// ═══════════════════════════════════════════════════════════════════
// TERRAIN TYPE DETERMINATION
// ═══════════════════════════════════════════════════════════════════

/** Determine terrain type from noise values */
export function determineTerrainType(
    x: number,
    y: number,
    elevation: number,
    seaLevel: number,
    heightNoise: number,
    isHighGround: boolean
): { type: WorldTerrainType; elevation: number } {
    const mtnNoise = mountainNoise(x, y);
    const lkNoise = lakeNoise(x, y);
    const isRiver = isRiverAt(x, y, DEFAULT_WORLD_CONFIG.RIVER_WIDTH);
    
    let type: WorldTerrainType = 'GRASS';
    let finalElevation = elevation;
    
    // IMPASSABLE STONE MOUNTAINS (highest elevation)
    if (mtnNoise > DEFAULT_WORLD_CONFIG.MOUNTAIN_THRESHOLD && 
        heightNoise > DEFAULT_WORLD_CONFIG.MOUNTAIN_HEIGHT_MIN) {
        type = 'STONE';
        finalElevation = 9 + Math.floor(Math.random() * 2); // 9-10
    }
    // ELEVATION-BASED WATER: Tiles below sea level are water
    else if (elevation < seaLevel - 1.5) {
        type = 'DEEP';
        finalElevation = Math.max(0, elevation);
    } 
    else if (elevation < seaLevel - 0.5) {
        type = 'WATER';
    }
    // Generate inland lakes (very rare)
    else if (lkNoise < DEFAULT_WORLD_CONFIG.LAKE_THRESHOLD && 
             elevation >= seaLevel && 
             elevation < seaLevel + 0.5 &&
             !isHighGround) {
        type = 'WATER';
        finalElevation = seaLevel - 0.5;
    }
    // Standard elevation-based terrain
    else if (elevation <= seaLevel) {
        type = 'SAND'; // Beaches at sea level
    } 
    else if (elevation < 5.5) {
        type = 'GRASS'; // Lowland grass (3-5.5)
    } 
    else if (elevation < 7) {
        type = 'GRASS'; // Highland grass (5.5-7)
    } 
    else if (elevation < 8) {
        type = 'FOREST'; // Hills with forest (7-8)
    } 
    else if (elevation < 9.5) {
        type = 'ROCK'; // Mountain slopes (8-9.5)
    } 
    else {
        type = 'SNOW';
    }
    
    // Carve Rivers (avoid deep ocean and high ground)
    if (isRiver && type !== 'DEEP' && type !== 'WATER' && !isHighGround) {
        type = 'RIVER';
        finalElevation = seaLevel;
    }
    
    return { type, elevation: finalElevation };
}

// ═══════════════════════════════════════════════════════════════════
// TILE GENERATION
// ═══════════════════════════════════════════════════════════════════

/** Create a single tile with all data */
export function createTile(
    x: number,
    y: number,
    seaLevel: number,
    patches: HighGroundPatch[]
): WorldTile {
    const heightNoise = terrainNoise(x, y);
    const isHighGround = isInHighGroundPatch(x, y, patches);
    
    // Calculate base elevation
    let elevation = calculateElevation(heightNoise);
    
    // Force high elevation in safe patches
    if (isHighGround) {
        elevation = generateHighGroundElevation();
    }
    
    // Determine terrain type
    const terrain = determineTerrainType(
        x, y, elevation, seaLevel, heightNoise, isHighGround
    );
    
    // Determine if tile has a tree
    const canHaveTree = terrain.type === 'GRASS' || 
                        terrain.type === 'FOREST' || 
                        terrain.type === 'SNOW';
    const hasTree = canHaveTree && Math.random() > (1 - DEFAULT_WORLD_CONFIG.TREE_CHANCE);
    
    // Create resource for STONE tiles
    let resource: TileResource | null = null;
    if (terrain.type === 'STONE') {
        resource = {
            type: 'STONE',
            amount: 1000000 + Math.floor(Math.random() * 500000), // 1M-1.5M stone
            metal_yield: 0.2
        };
    }
    
    return {
        type: terrain.type,
        elevation: terrain.elevation,
        originalType: terrain.type,
        road: false,
        tree: hasTree,
        pol: 0,
        bld: null,
        explored: false,
        zone: null,
        building: null,
        resource,
        stoneDeposit: null,
        entity: null
    };
}

// ═══════════════════════════════════════════════════════════════════
// WORLD GENERATION
// ═══════════════════════════════════════════════════════════════════

/** Generate complete tile grid */
export function generateTerrain(options: TerrainGenOptions): WorldTile[][] {
    const { seed, width, height, seaLevel, highGroundPatches, patchSize } = options;
    
    // Initialize noise
    initNoise(seed);
    
    // Generate high ground patches if not provided
    const patches = highGroundPatches || generateHighGroundPatches(
        width, 
        height, 
        patchSize || DEFAULT_WORLD_CONFIG.PATCH_SIZE
    );
    
    // Create tile grid
    const tiles: WorldTile[][] = [];
    
    for (let x = 0; x < width; x++) {
        tiles[x] = [];
        for (let y = 0; y < height; y++) {
            tiles[x][y] = createTile(x, y, seaLevel, patches);
        }
    }
    
    return tiles;
}

/** Get terrain statistics for a generated world */
export function getTerrainStats(tiles: WorldTile[][]): Record<WorldTerrainType, number> {
    const stats: Partial<Record<WorldTerrainType, number>> = {};
    
    for (let x = 0; x < tiles.length; x++) {
        for (let y = 0; y < tiles[x].length; y++) {
            const type = tiles[x][y].type;
            stats[type] = (stats[type] || 0) + 1;
        }
    }
    
    return stats as Record<WorldTerrainType, number>;
}

/** Calculate percentage of land vs water */
export function getLandWaterRatio(tiles: WorldTile[][]): { land: number; water: number } {
    let land = 0;
    let water = 0;
    
    for (let x = 0; x < tiles.length; x++) {
        for (let y = 0; y < tiles[x].length; y++) {
            const type = tiles[x][y].type;
            if (type === 'WATER' || type === 'DEEP' || type === 'RIVER') {
                water++;
            } else {
                land++;
            }
        }
    }
    
    const total = land + water;
    return {
        land: Math.round((land / total) * 100),
        water: Math.round((water / total) * 100)
    };
}
