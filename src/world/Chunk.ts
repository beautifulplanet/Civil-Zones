/**
 * Chunk Definition
 * A 64x64 block of tiles.
 */

import type { Tile } from './Tile';
import { TileType } from './Tile';

export const CHUNK_SIZE = 64;

export interface Chunk {
    cx: number; // Chunk X coordinate
    cy: number; // Chunk Y coordinate
    tiles: Tile[][]; // [x][y] - 64x64
}

/**
 * Generate a new blank chunk (placeholder for real terrain gen)
 */
export function createTestChunk(cx: number, cy: number): Chunk {
    const tiles: Tile[][] = [];

    for (let x = 0; x < CHUNK_SIZE; x++) {
        tiles[x] = [];
        for (let y = 0; y < CHUNK_SIZE; y++) {
            // Simple check pattern to verify coordinates
            const isCheck = (x + y + cx + cy) % 2 === 0;

            tiles[x][y] = {
                type: isCheck ? TileType.GRASS : TileType.SAND,
                elevation: 0,
                explored: true
            };
        }
    }

    return { cx, cy, tiles };
}
