import { describe, it, expect } from 'vitest';
import { TerrainGenerator } from './TerrainGenerator';
import { CHUNK_SIZE } from './Chunk';
import { TileType } from './Tile';

describe('TerrainGenerator', () => {
    it('generates 64x64 chunk', () => {
        const gen = new TerrainGenerator(42);
        const chunk = gen.generateChunk(0, 0);
        expect(chunk.tiles.length).toBe(CHUNK_SIZE);
        expect(chunk.tiles[0].length).toBe(CHUNK_SIZE);
    });

    it('chunk has correct cx,cy', () => {
        const gen = new TerrainGenerator(42);
        const chunk = gen.generateChunk(3, 5);
        expect(chunk.cx).toBe(3);
        expect(chunk.cy).toBe(5);
    });

    it('tiles have valid type values', () => {
        const gen = new TerrainGenerator(42);
        const chunk = gen.generateChunk(0, 0);
        const validTypes = [TileType.GRASS, TileType.WATER, TileType.SAND, TileType.STONE, TileType.FOREST, TileType.DIRT];
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let y = 0; y < CHUNK_SIZE; y++) {
                expect(validTypes).toContain(chunk.tiles[x][y].type);
            }
        }
    });

    it('tiles have elevation in 0-255', () => {
        const gen = new TerrainGenerator(42);
        const chunk = gen.generateChunk(0, 0);
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let y = 0; y < CHUNK_SIZE; y++) {
                expect(chunk.tiles[x][y].elevation).toBeGreaterThanOrEqual(0);
                expect(chunk.tiles[x][y].elevation).toBeLessThanOrEqual(255);
            }
        }
    });

    it('same seed produces same terrain', () => {
        const gen1 = new TerrainGenerator(42);
        const gen2 = new TerrainGenerator(42);
        const a = gen1.generateChunk(0, 0);
        const b = gen2.generateChunk(0, 0);
        expect(a.tiles[10][10].type).toBe(b.tiles[10][10].type);
        expect(a.tiles[10][10].elevation).toBe(b.tiles[10][10].elevation);
    });

    it('generates a mix of terrain types across multiple chunks', () => {
        const gen = new TerrainGenerator(42);
        const typesSeen = new Set<number>();
        // Generate a few chunks and collect all tile types seen
        for (let cx = 0; cx < 3; cx++) {
            for (let cy = 0; cy < 3; cy++) {
                const chunk = gen.generateChunk(cx, cy);
                for (let x = 0; x < CHUNK_SIZE; x++) {
                    for (let y = 0; y < CHUNK_SIZE; y++) {
                        typesSeen.add(chunk.tiles[x][y].type);
                    }
                }
            }
        }
        // Should have at least GRASS and one other type
        expect(typesSeen.size).toBeGreaterThanOrEqual(2);
    });

    it('tiles have boolean resource flags', () => {
        const gen = new TerrainGenerator(42);
        const chunk = gen.generateChunk(0, 0);
        const tile = chunk.tiles[0][0];
        // Resource flags should be booleans or undefined
        expect(typeof tile.hasBerries === 'boolean' || tile.hasBerries === undefined).toBe(true);
        expect(typeof tile.hasTrees === 'boolean' || tile.hasTrees === undefined).toBe(true);
        expect(typeof tile.explored).toBe('boolean');
    });
});
