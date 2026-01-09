/**
 * Civil Zones - Terrain Generator
 * Procedural terrain generation with elevation-based water system
 */

import type { 
    Tile, 
    TerrainType, 
    HighGroundPatch,
    TerrainGenConfig 
} from '../types/index.js';
import { Noise } from './noise.js';
import { clamp, randomFloat } from './utils.js';

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: TerrainGenConfig = {
    seed: 1,
    width: 250,
    height: 250,
    seaLevelBase: 3,
    patchSize: 8,
    numPatches: 25  // ~1 per 50x50 area
};

// ═══════════════════════════════════════════════════════════════════════════════
// TERRAIN GENERATOR CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class TerrainGenerator {
    private config: TerrainGenConfig;
    private highGroundPatches: HighGroundPatch[] = [];

    constructor(config: Partial<TerrainGenConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Generate high ground patches (safe zones that never flood)
     */
    private generateHighGroundPatches(): void {
        this.highGroundPatches = [];
        const { width, height, patchSize, numPatches } = this.config;
        
        for (let i = 0; i < numPatches; i++) {
            const px = Math.floor(Math.random() * (width - patchSize - 10)) + 5;
            const py = Math.floor(Math.random() * (height - patchSize - 10)) + 5;
            this.highGroundPatches.push({ x: px, y: py });
        }
    }

    /**
     * Check if coordinates are in a high ground patch
     */
    private isInHighGroundPatch(x: number, y: number): boolean {
        const { patchSize } = this.config;
        
        for (const patch of this.highGroundPatches) {
            if (x >= patch.x && x < patch.x + patchSize &&
                y >= patch.y && y < patch.y + patchSize) {
                return true;
            }
        }
        return false;
    }

    /**
     * Determine terrain type based on elevation and noise
     */
    private determineTerrainType(
        x: number, 
        y: number, 
        elevation: number,
        seaLevel: number
    ): TerrainType {
        // Mountain noise
        const mountainNoise = Noise.fbm(x * 0.015 + 1000, y * 0.015 + 1000) / 1.8;
        const baseHeight = Noise.fbm(x * 0.02, y * 0.02) / 1.8;
        
        // Lake noise (inland water bodies)
        const lakeNoise = Noise.fbm(x * 0.08 + 500, y * 0.08 + 500) / 1.8;
        
        // River noise
        const riverNoise = Noise.fbm(x * 0.05 + 100, y * 0.05 + 100) / 1.8;
        const isRiver = Math.abs(riverNoise - 0.5) < 0.015;

        // Impassable stone mountains
        if (mountainNoise > 0.68 && baseHeight > 0.55) {
            return 'STONE';
        }
        
        // Deep water
        if (elevation < seaLevel - 1.5) {
            return 'DEEP';
        }
        
        // Shallow water
        if (elevation < seaLevel - 0.5) {
            return 'WATER';
        }
        
        // Inland lakes
        if (lakeNoise < 0.03 && elevation >= seaLevel && elevation < seaLevel + 0.5) {
            return 'WATER';
        }
        
        // Rivers (avoid deep ocean and high ground)
        if (isRiver && !this.isInHighGroundPatch(x, y)) {
            return 'RIVER';
        }
        
        // Beaches
        if (elevation <= seaLevel) {
            return 'SAND';
        }
        
        // Elevation-based terrain
        if (elevation < 7) {
            return 'GRASS';
        }
        if (elevation < 8) {
            return 'FOREST';
        }
        if (elevation < 9.5) {
            return 'ROCK';
        }
        
        return 'SNOW';
    }

    /**
     * Calculate elevation for a tile
     */
    private calculateElevation(x: number, y: number): number {
        const h = Noise.fbm(x * 0.02, y * 0.02) / 1.8;
        
        // Upward bias for more habitable land
        let elevation = Math.round((h * 100 + 25)) / 10;
        elevation = clamp(elevation, 0, 10);
        
        // High ground patches are always safe
        if (this.isInHighGroundPatch(x, y)) {
            elevation = 7 + randomFloat(0, 1.5);
        }
        
        return elevation;
    }

    /**
     * Generate a complete tile
     */
    private generateTile(x: number, y: number, seaLevel: number): Tile {
        let elevation = this.calculateElevation(x, y);
        let type = this.determineTerrainType(x, y, elevation, seaLevel);
        
        // Adjust elevation for specific terrain types
        if (type === 'STONE') {
            elevation = 9 + Math.floor(Math.random() * 2);
        } else if (type === 'DEEP') {
            elevation = Math.max(0, elevation);
        } else if (type === 'WATER' && elevation >= seaLevel) {
            // Lakes are at water level
            elevation = seaLevel - 0.5;
        } else if (type === 'RIVER') {
            elevation = seaLevel;
        }
        
        // Trees spawn on appropriate terrain
        const canHaveTree = type === 'GRASS' || type === 'FOREST' || type === 'SNOW';
        const hasTree = canHaveTree && Math.random() > 0.8;
        
        const tile: Tile = {
            type,
            originalType: type,
            elevation,
            road: false,
            tree: hasTree,
            pol: 0,
            bld: null,
            explored: false,
            zone: null,
            building: null,
            resource: null,
            stoneDeposit: null,
            entity: null
        };
        
        // Stone tiles contain massive resources
        if (type === 'STONE') {
            tile.resource = {
                type: 'STONE',
                amount: 1000000 + Math.floor(Math.random() * 500000),
                metal_yield: 0.2
            };
        }
        
        return tile;
    }

    /**
     * Generate the complete terrain grid
     */
    generate(seed?: number): Tile[][] {
        if (seed !== undefined) {
            this.config.seed = seed;
        }
        
        Noise.init(this.config.seed);
        this.generateHighGroundPatches();
        
        const { width, height, seaLevelBase } = this.config;
        const tiles: Tile[][] = [];
        
        for (let x = 0; x < width; x++) {
            tiles[x] = [];
            for (let y = 0; y < height; y++) {
                tiles[x][y] = this.generateTile(x, y, seaLevelBase);
            }
        }
        
        return tiles;
    }

    /**
     * Get high ground patches (for UI/debug)
     */
    getHighGroundPatches(): HighGroundPatch[] {
        return [...this.highGroundPatches];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TERRAIN HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if terrain is passable on foot
 */
export function isTerrainPassable(type: TerrainType): boolean {
    return type !== 'WATER' && type !== 'DEEP' && type !== 'STONE';
}

/**
 * Check if terrain is buildable
 */
export function isTerrainBuildable(type: TerrainType): boolean {
    return type === 'GRASS' || type === 'SAND' || type === 'FOREST';
}

/**
 * Check if terrain is water
 */
export function isWater(type: TerrainType): boolean {
    return type === 'WATER' || type === 'DEEP' || type === 'RIVER';
}

/**
 * Get terrain color for rendering
 */
export function getTerrainColor(type: TerrainType): string {
    const colors: Record<TerrainType, string> = {
        'GRASS': '#4a7c23',
        'FOREST': '#2d5016',
        'SAND': '#c2b280',
        'ROCK': '#6b6b6b',
        'STONE': '#4a4a4a',
        'SNOW': '#f0f0f0',
        'WATER': '#4a90d9',
        'DEEP': '#1a5276',
        'RIVER': '#5dade2'
    };
    return colors[type] || '#888888';
}

/**
 * Get terrain movement cost
 */
export function getTerrainMoveCost(type: TerrainType): number {
    const costs: Record<TerrainType, number> = {
        'GRASS': 1,
        'FOREST': 1.5,
        'SAND': 1.2,
        'ROCK': 2,
        'STONE': Infinity,
        'SNOW': 1.5,
        'WATER': Infinity,
        'DEEP': Infinity,
        'RIVER': 2
    };
    return costs[type] || 1;
}
