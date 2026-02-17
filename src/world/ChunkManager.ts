/**
 * Chunk Manager
 * Handles loading, unloading, and retrieving chunks.
 */

import { CHUNK_SIZE } from './Chunk';
import { TerrainGenerator } from './TerrainGenerator';
import type { Chunk } from './Chunk';
import type { Tile } from './Tile';

export class ChunkManager {
    private chunks: Map<string, Chunk> = new Map();
    private terrainGen = new TerrainGenerator();

    private getChunkKey(cx: number, cy: number): string {
        return `${cx},${cy}`;
    }

    /**
     * Get a tile at world coordinates (x, y)
     * Returns null if chunk is not loaded
     */
    public getTile(worldX: number, worldY: number): Tile | null {
        const cx = Math.floor(worldX / CHUNK_SIZE);
        const cy = Math.floor(worldY / CHUNK_SIZE);

        const chunk = this.getChunk(cx, cy);
        if (!chunk) return null;

        // Local coordinates within chunk
        const lx = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const ly = ((worldY % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

        return chunk.tiles[lx][ly];
    }

    /**
     * Get or create a chunk
     * In a real game, this would load from DB or generate async
     */
    public getChunk(cx: number, cy: number): Chunk {
        const key = this.getChunkKey(cx, cy);
        let chunk = this.chunks.get(key);

        if (!chunk) {
            chunk = this.terrainGen.generateChunk(cx, cy);
            this.chunks.set(key, chunk);
        }

        return chunk;
    }

    /**
     * Ensure chunks are loaded around a center point
     */
    public updateLoadedChunks(_centerChunkX: number, _centerChunkY: number, _radius: number): void {
        // For now, simpler implementation: just clean up very distant chunks?
        // Actually, with the synchronous getChunk above, we lazy load on render.
        // We can add cleanup logic here later.
    }
}
