import { describe, it, expect } from 'vitest';
import { CHUNK_SIZE, createTestChunk } from './Chunk';
import { TileType } from './Tile';

describe('CHUNK_SIZE', () => {
    it('is 64', () => {
        expect(CHUNK_SIZE).toBe(64);
    });
});

describe('createTestChunk', () => {
    it('creates chunk with correct coordinates', () => {
        const chunk = createTestChunk(3, 5);
        expect(chunk.cx).toBe(3);
        expect(chunk.cy).toBe(5);
    });

    it('creates 64x64 tile grid', () => {
        const chunk = createTestChunk(0, 0);
        expect(chunk.tiles.length).toBe(64);
        expect(chunk.tiles[0].length).toBe(64);
    });

    it('tiles are explored', () => {
        const chunk = createTestChunk(0, 0);
        expect(chunk.tiles[0][0].explored).toBe(true);
    });

    it('tiles alternate between GRASS and SAND (checkerboard)', () => {
        const chunk = createTestChunk(0, 0);
        // At (0,0) with cx=0,cy=0: (0+0+0+0)%2 = 0 → GRASS
        expect(chunk.tiles[0][0].type).toBe(TileType.GRASS);
        // At (1,0): (1+0+0+0)%2 = 1 → SAND
        expect(chunk.tiles[1][0].type).toBe(TileType.SAND);
        // At (0,1): (0+1+0+0)%2 = 1 → SAND
        expect(chunk.tiles[0][1].type).toBe(TileType.SAND);
    });

    it('elevation is 0 for test chunks', () => {
        const chunk = createTestChunk(0, 0);
        expect(chunk.tiles[0][0].elevation).toBe(0);
    });
});
