/**
 * Civil Zones - Player Spawning
 * Find safe spawn locations for the player
 */

import type { 
    WorldTile, 
    SpawnResult, 
    PlayerEntity,
    SpawnableTerrain 
} from './types.js';

// ═══════════════════════════════════════════════════════════════════
// SPAWN VALIDATION
// ═══════════════════════════════════════════════════════════════════

/** Valid terrain types for player spawning */
const VALID_SPAWN_TERRAIN: SpawnableTerrain[] = ['GRASS', 'FOREST', 'SAND', 'ROCK', 'SNOW'];

/** Valid terrain types for flood fill counting */
const REACHABLE_TERRAIN: SpawnableTerrain[] = ['GRASS', 'FOREST', 'SAND'];

/** Check if a position is valid for spawning */
export function isValidSpawnPosition(
    tiles: WorldTile[][],
    x: number,
    y: number
): boolean {
    if (x < 0 || x >= tiles.length || y < 0 || y >= tiles[0].length) {
        return false;
    }
    const type = tiles[x][y].type;
    return VALID_SPAWN_TERRAIN.includes(type as SpawnableTerrain);
}

/** Check if terrain is reachable for flood fill */
function isReachableTerrain(type: string): boolean {
    return REACHABLE_TERRAIN.includes(type as SpawnableTerrain);
}

// ═══════════════════════════════════════════════════════════════════
// FLOOD FILL COUNTING
// ═══════════════════════════════════════════════════════════════════

/** Count reachable land tiles from a position using flood fill */
export function countReachableTiles(
    tiles: WorldTile[][],
    startX: number,
    startY: number,
    maxTiles: number = 200
): number {
    const W = tiles.length;
    const H = tiles[0].length;
    const seen: boolean[][] = Array.from({ length: W }, () => Array(H).fill(false));
    const queue: [number, number][] = [[startX, startY]];
    let count = 0;
    
    while (queue.length > 0 && count < maxTiles) {
        const [cx, cy] = queue.shift()!;
        
        if (cx < 0 || cy < 0 || cx >= W || cy >= H) continue;
        if (seen[cx][cy]) continue;
        
        const type = tiles[cx][cy].type;
        if (!isReachableTerrain(type)) continue;
        
        seen[cx][cy] = true;
        count++;
        
        // Add neighbors
        queue.push([cx + 1, cy]);
        queue.push([cx - 1, cy]);
        queue.push([cx, cy + 1]);
        queue.push([cx, cy - 1]);
    }
    
    return count;
}

// ═══════════════════════════════════════════════════════════════════
// SPAWN LOCATION FINDING
// ═══════════════════════════════════════════════════════════════════

/** Try to find spawn in center area */
function findCenterSpawn(
    tiles: WorldTile[][],
    centerX: number,
    centerY: number,
    radius: number = 40,
    minReachable: number = 60,
    maxAttempts: number = 100
): SpawnResult | null {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const x = Math.floor(centerX + (Math.random() - 0.5) * radius);
        const y = Math.floor(centerY + (Math.random() - 0.5) * radius);
        
        if (isValidSpawnPosition(tiles, x, y)) {
            const reachable = countReachableTiles(tiles, x, y, 200);
            if (reachable >= minReachable) {
                return { x, y, method: 'center', reachable };
            }
        }
    }
    return null;
}

/** Try to find spawn anywhere on map */
function findWideSpawn(
    tiles: WorldTile[][],
    minReachable: number = 30,
    maxAttempts: number = 500
): SpawnResult | null {
    const W = tiles.length;
    const H = tiles[0].length;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const x = Math.floor(Math.random() * W);
        const y = Math.floor(Math.random() * H);
        
        if (isValidSpawnPosition(tiles, x, y)) {
            const reachable = countReachableTiles(tiles, x, y, 200);
            if (reachable >= minReachable) {
                return { x, y, method: 'wide', reachable };
            }
        }
    }
    return null;
}

/** Emergency scan for ANY valid land tile */
function findEmergencySpawn(tiles: WorldTile[][]): SpawnResult | null {
    for (let x = 0; x < tiles.length; x++) {
        for (let y = 0; y < tiles[0].length; y++) {
            if (isValidSpawnPosition(tiles, x, y)) {
                return { x, y, method: 'emergency', reachable: 1 };
            }
        }
    }
    return null;
}

/** Forced spawn at center (last resort) */
function forceCenterSpawn(width: number, height: number): SpawnResult {
    return {
        x: Math.floor(width / 2),
        y: Math.floor(height / 2),
        method: 'forced',
        reachable: 0
    };
}

// ═══════════════════════════════════════════════════════════════════
// MAIN SPAWN FUNCTION
// ═══════════════════════════════════════════════════════════════════

/** Find the best spawn location for player */
export function findSpawnLocation(tiles: WorldTile[][]): SpawnResult {
    const W = tiles.length;
    const H = tiles[0].length;
    const centerX = Math.floor(W / 2);
    const centerY = Math.floor(H / 2);
    
    // Phase 1: Try center area (best experience)
    const centerSpawn = findCenterSpawn(tiles, centerX, centerY);
    if (centerSpawn) {
        console.log('✅ Player spawn at', centerSpawn.x, centerSpawn.y, '(center search)');
        return centerSpawn;
    }
    
    // Phase 2: Try wider area
    const wideSpawn = findWideSpawn(tiles);
    if (wideSpawn) {
        console.log('✅ Player spawn at', wideSpawn.x, wideSpawn.y, '(wide search)');
        return wideSpawn;
    }
    
    // Phase 3: Emergency - scan entire map
    console.warn('⚠️ Emergency spawn search...');
    const emergencySpawn = findEmergencySpawn(tiles);
    if (emergencySpawn) {
        console.log('✅ Player spawn at', emergencySpawn.x, emergencySpawn.y, '(emergency)');
        return emergencySpawn;
    }
    
    // Phase 4: Absolute last resort
    console.error('❌ No valid spawn found! Forcing center spawn.');
    return forceCenterSpawn(W, H);
}

/** Create player entity at spawn location */
export function createPlayer(spawn: SpawnResult): PlayerEntity {
    return {
        x: spawn.x,
        y: spawn.y,
        health: 3,
        direction: 'down'
    };
}

// ═══════════════════════════════════════════════════════════════════
// EXPLORE AREA
// ═══════════════════════════════════════════════════════════════════

/** Mark tiles as explored in a radius */
export function exploreArea(
    tiles: WorldTile[][],
    centerX: number,
    centerY: number,
    radius: number
): number {
    let explored = 0;
    const W = tiles.length;
    const H = tiles[0].length;
    
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            const x = centerX + dx;
            const y = centerY + dy;
            
            if (x >= 0 && x < W && y >= 0 && y < H) {
                if (!tiles[x][y].explored) {
                    tiles[x][y].explored = true;
                    explored++;
                }
            }
        }
    }
    
    return explored;
}

/** Check if tile is explored */
export function isTileExplored(tiles: WorldTile[][], x: number, y: number): boolean {
    if (x < 0 || x >= tiles.length || y < 0 || y >= tiles[0].length) {
        return false;
    }
    return tiles[x][y].explored;
}

/** Get count of explored tiles */
export function getExploredCount(tiles: WorldTile[][]): number {
    let count = 0;
    for (let x = 0; x < tiles.length; x++) {
        for (let y = 0; y < tiles[x].length; y++) {
            if (tiles[x][y].explored) count++;
        }
    }
    return count;
}
