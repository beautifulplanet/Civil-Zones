/**
 * Terrain Generator
 * Generates chunks based on noise.
 */

import { CHUNK_SIZE } from './Chunk';
import type { Chunk } from './Chunk';
import { TileType } from './Tile';
import type { Tile } from './Tile';
import { Noise } from '../core/noise';

export class TerrainGenerator {
    constructor(seed: number = 1337) {
        Noise.init(seed);
    }

    public generateChunk(cx: number, cy: number): Chunk {
        const tiles: Tile[][] = [];

        for (let x = 0; x < CHUNK_SIZE; x++) {
            tiles[x] = [];
            for (let y = 0; y < CHUNK_SIZE; y++) {
                // World coordinates
                const wx = cx * CHUNK_SIZE + x;
                const wy = cy * CHUNK_SIZE + y;

                // 1. Base Elevation (Continents/Oceans)
                // Low frequency noise
                const elevation = Noise.fbm(wx * 0.005, wy * 0.005, 4);

                // 2. Moisture/Forest (Vegetation)
                const moisture = Noise.fbm(wx * 0.01 + 500, wy * 0.01 + 500, 2);

                // 3. Terrain variation noise (for grass variants and dirt patches)
                const variantNoise = Noise.fbm(wx * 0.03 + 300, wy * 0.03 + 300, 2);

                let type: TileType = TileType.GRASS;
                let terrainVariant = 0;

                // Determine tile type based on height/moisture
                // Water threshold lowered to 0.15 for ~10% water coverage
                if (elevation < 0.15) {
                    type = TileType.WATER; // Ocean/Lake (rare, ~10%)
                } else if (elevation < 0.20) {
                    type = TileType.SAND;  // Beach
                } else if (elevation > 0.7) {
                    type = TileType.STONE; // Mountain
                } else {
                    // Land (Grass/Forest/Dirt)
                    if (moisture > 0.6) {
                        type = TileType.FOREST;
                    } else if (variantNoise < 0.2) {
                        // Dirt patches (~15% of grassland)
                        type = TileType.DIRT;
                    } else {
                        type = TileType.GRASS;
                        // Assign grass variant based on noise (0-3)
                        terrainVariant = Math.floor(variantNoise * 4) % 4;
                    }
                }

                // 4. Resources (Berries/Trees)
                const resourceNoise = Noise.fbm(wx * 0.02 + 1000, wy * 0.02 + 1000, 1);
                let hasBerries = false;
                let hasTrees = false;

                if (type === TileType.GRASS && resourceNoise > 0.7) {
                    hasBerries = true;
                } else if ((type === TileType.FOREST || type === TileType.GRASS) && resourceNoise > 0.5) {
                    hasTrees = true;
                }

                // 5. Ore deposits on stone/mountain tiles
                let hasOre = false;
                let oreType: 'iron' | 'gold' | 'stone' | undefined = undefined;

                if (type === TileType.STONE) {
                    const oreNoise = Noise.fbm(wx * 0.03 + 2000, wy * 0.03 + 2000, 1);
                    if (oreNoise > 0.75) {
                        hasOre = true;
                        // Gold is rarer than iron
                        oreType = oreNoise > 0.85 ? 'gold' : 'iron';
                    } else if (oreNoise > 0.6) {
                        hasOre = true;
                        oreType = 'stone';
                    }
                }

                tiles[x][y] = {
                    type,
                    elevation: Math.floor(elevation * 255),
                    explored: true, // Reveal all for now
                    terrainVariant,
                    hasBerries,
                    hasTrees,
                    hasOre,
                    oreType
                };
            }
        }

        return { cx, cy, tiles };
    }
}
