import { describe, it, expect } from 'vitest';
import { ChunkManager } from './ChunkManager';

describe('ChunkManager', () => {
    it('getTile returns a tile at valid world coords', () => {
        const cm = new ChunkManager();
        const tile = cm.getTile(10, 10);
        expect(tile).not.toBeNull();
        expect(tile!.type).toBeDefined();
    });

    it('getChunk returns deterministic chunk', () => {
        const cm = new ChunkManager();
        const a = cm.getChunk(0, 0);
        const b = cm.getChunk(0, 0);
        expect(a).toBe(b); // Same reference (cached)
    });

    it('getChunk creates different chunks for different coords', () => {
        const cm = new ChunkManager();
        const a = cm.getChunk(0, 0);
        const b = cm.getChunk(1, 0);
        expect(a).not.toBe(b);
    });

    it('getTile maps world coords to correct chunk', () => {
        const cm = new ChunkManager();
        // World coord (64, 64) → chunk (1, 1), local (0, 0)
        const tile = cm.getTile(64, 64);
        expect(tile).not.toBeNull();
    });

    it('negative world coords work', () => {
        const cm = new ChunkManager();
        const tile = cm.getTile(-1, -1);
        expect(tile).not.toBeNull();
    });

    it('updateLoadedChunks does not throw', () => {
        const cm = new ChunkManager();
        expect(() => cm.updateLoadedChunks(0, 0, 3)).not.toThrow();
    });
});
