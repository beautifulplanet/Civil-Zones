/**
 * Civil Zones - AI Exploration
 * Exploration and pathfinding helpers for AI
 */

import type { AITarget, ExploreStats, DeathLocation } from './types.js';

// ═══════════════════════════════════════════════════════════════════
// TARGET FINDING
// ═══════════════════════════════════════════════════════════════════

interface GameLike {
    player?: { x: number; y: number };
    tiles?: any[][];
}

/** Priority values for different targets */
export const TARGET_PRIORITY = {
    WATER: 100,   // Water is critical when thirsty
    BERRY: 80,    // Berries are high priority
    ANIMAL: 60,   // Animals provide food but cost pop
    NOMAD: 70,    // Recruiting nomads
    EXPLORE: 20   // Default exploration
};

/** Find best target in range */
export function findBestTarget(
    game: GameLike,
    searchRadius: number = 15,
    isThirsty: boolean = false
): AITarget | null {
    if (!game.player || !game.tiles) return null;
    
    const px = game.player.x;
    const py = game.player.y;
    const width = game.tiles.length;
    const height = game.tiles[0]?.length || 0;
    
    let bestTarget: AITarget | null = null;
    let bestScore = -Infinity;
    
    for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        for (let dy = -searchRadius; dy <= searchRadius; dy++) {
            const x = px + dx;
            const y = py + dy;
            
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            
            const tile = game.tiles[x][y];
            if (!tile?.explored) continue;
            
            const distance = Math.abs(dx) + Math.abs(dy);
            let target: AITarget | null = null;
            
            // Check for water (high priority when thirsty)
            if ((tile.type === 'WATER' || tile.type === 'RIVER') && isThirsty) {
                target = { x, y, type: 'WATER', priority: TARGET_PRIORITY.WATER, distance };
            }
            // Check for berries
            else if (tile.berry) {
                target = { x, y, type: 'BERRY', priority: TARGET_PRIORITY.BERRY, distance };
            }
            // Check for animals
            else if (tile.animal) {
                target = { x, y, type: 'ANIMAL', priority: TARGET_PRIORITY.ANIMAL, distance };
            }
            // Check for nomads
            else if (tile.nomad) {
                target = { x, y, type: 'NOMAD', priority: TARGET_PRIORITY.NOMAD, distance };
            }
            
            if (target) {
                // Score based on priority and distance (closer is better)
                const score = target.priority - distance * 2;
                if (score > bestScore) {
                    bestScore = score;
                    bestTarget = target;
                }
            }
        }
    }
    
    return bestTarget;
}

/** Find unexplored tile to explore */
export function findExploreTarget(
    game: GameLike,
    searchRadius: number = 20,
    avoidDanger: Set<string> | null = null
): AITarget | null {
    if (!game.player || !game.tiles) return null;
    
    const px = game.player.x;
    const py = game.player.y;
    const width = game.tiles.length;
    const height = game.tiles[0]?.length || 0;
    
    // Find nearest unexplored tile
    for (let radius = 1; radius <= searchRadius; radius++) {
        const candidates: AITarget[] = [];
        
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                // Only check perimeter
                if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
                
                const x = px + dx;
                const y = py + dy;
                
                if (x < 0 || x >= width || y < 0 || y >= height) continue;
                
                const tile = game.tiles[x][y];
                
                // Skip explored tiles
                if (tile?.explored) continue;
                
                // Skip water tiles (can't walk on them)
                if (tile?.type === 'WATER' || tile?.type === 'DEEP') continue;
                
                // Avoid danger zones if provided
                const key = `${x},${y}`;
                if (avoidDanger?.has(key)) continue;
                
                const distance = Math.abs(dx) + Math.abs(dy);
                candidates.push({
                    x, y,
                    type: 'EXPLORE',
                    priority: TARGET_PRIORITY.EXPLORE,
                    distance
                });
            }
        }
        
        if (candidates.length > 0) {
            // Pick random from candidates at this radius
            return candidates[Math.floor(Math.random() * candidates.length)];
        }
    }
    
    return null;
}

// ═══════════════════════════════════════════════════════════════════
// EXPLORATION STATISTICS
// ═══════════════════════════════════════════════════════════════════

/** Create initial exploration stats */
export function createExploreStats(): ExploreStats {
    return {
        tilesVisited: new Set(),
        totalTiles: 0,
        resourcesCollected: 0,
        berriesCollected: 0,
        woodCollected: 0,
        nomadsRecruited: 0,
        animalsHunted: 0,
        deaths: 0,
        totalSteps: 0,
        stepsThisRun: 0,
        runsCompleted: 0,
        deathLocations: [],
        dangerZones: {},
        startTime: null
    };
}

/** Record tile visit */
export function recordTileVisit(stats: ExploreStats, x: number, y: number): void {
    const key = `${x},${y}`;
    stats.tilesVisited.add(key);
    stats.totalSteps++;
    stats.stepsThisRun++;
}

/** Record death during exploration */
export function recordExplorationDeath(
    stats: ExploreStats,
    x: number,
    y: number,
    cause: string
): void {
    stats.deaths++;
    stats.runsCompleted++;
    
    const location: DeathLocation = {
        x, y,
        cause,
        steps: stats.stepsThisRun
    };
    stats.deathLocations.push(location);
    
    // Track danger zone
    const key = `${x},${y}`;
    stats.dangerZones[key] = (stats.dangerZones[key] || 0) + 1;
    
    // Reset steps for next run
    stats.stepsThisRun = 0;
}

/** Record resource collection */
export function recordResourceCollection(
    stats: ExploreStats,
    type: 'berry' | 'wood' | 'nomad' | 'animal',
    amount: number = 1
): void {
    stats.resourcesCollected += amount;
    
    switch (type) {
        case 'berry':
            stats.berriesCollected += amount;
            break;
        case 'wood':
            stats.woodCollected += amount;
            break;
        case 'nomad':
            stats.nomadsRecruited += amount;
            break;
        case 'animal':
            stats.animalsHunted += amount;
            break;
    }
}

/** Get exploration coverage percentage */
export function getExplorationCoverage(stats: ExploreStats): number {
    if (stats.totalTiles === 0) return 0;
    return (stats.tilesVisited.size / stats.totalTiles) * 100;
}

/** Get danger zones for avoidance */
export function getDangerZones(stats: ExploreStats, threshold: number = 2): Set<string> {
    const dangers = new Set<string>();
    
    for (const [key, count] of Object.entries(stats.dangerZones)) {
        if (count >= threshold) {
            dangers.add(key);
        }
    }
    
    return dangers;
}

// ═══════════════════════════════════════════════════════════════════
// MOVEMENT TRACKING
// ═══════════════════════════════════════════════════════════════════

/** Track movement history to detect stuck states */
export class MovementTracker {
    private history: string[] = [];
    private maxHistory: number;
    
    constructor(maxHistory: number = 20) {
        this.maxHistory = maxHistory;
    }
    
    /** Record a move */
    record(x: number, y: number): void {
        const key = `${x},${y}`;
        this.history.push(key);
        
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }
    
    /** Check if position was recently visited */
    wasRecentlyVisited(x: number, y: number, lookback: number = 10): boolean {
        const key = `${x},${y}`;
        const recent = this.history.slice(-lookback, -1);
        return recent.includes(key);
    }
    
    /** Get repetition penalty for current position */
    getRepetitionPenalty(x: number, y: number): number {
        const key = `${x},${y}`;
        let count = 0;
        
        for (const pos of this.history) {
            if (pos === key) count++;
        }
        
        return count;
    }
    
    /** Check if stuck in a loop */
    isStuck(): boolean {
        if (this.history.length < 10) return false;
        
        // Check if last 10 moves are all the same few tiles
        const recent = new Set(this.history.slice(-10));
        return recent.size <= 3;
    }
    
    /** Clear history */
    clear(): void {
        this.history = [];
    }
}

// ═══════════════════════════════════════════════════════════════════
// RANDOM EXPLORATION
// ═══════════════════════════════════════════════════════════════════

/** Get random adjacent direction */
export function getRandomDirection(): { dx: number; dy: number } {
    const directions = [
        { dx: 0, dy: -1 },  // North
        { dx: 1, dy: 0 },   // East
        { dx: 0, dy: 1 },   // South
        { dx: -1, dy: 0 }   // West
    ];
    return directions[Math.floor(Math.random() * directions.length)];
}

/** Get weighted random direction (prefers unexplored) */
export function getWeightedDirection(
    game: GameLike,
    tracker: MovementTracker
): { dx: number; dy: number } {
    if (!game.player || !game.tiles) {
        return getRandomDirection();
    }
    
    const px = game.player.x;
    const py = game.player.y;
    const width = game.tiles.length;
    const height = game.tiles[0]?.length || 0;
    
    const directions = [
        { dx: 0, dy: -1, weight: 1 },  // North
        { dx: 1, dy: 0, weight: 1 },   // East
        { dx: 0, dy: 1, weight: 1 },   // South
        { dx: -1, dy: 0, weight: 1 }   // West
    ];
    
    // Adjust weights based on tile state
    for (const dir of directions) {
        const nx = px + dir.dx;
        const ny = py + dir.dy;
        
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
            dir.weight = 0;
            continue;
        }
        
        const tile = game.tiles[nx][ny];
        
        // Can't walk on water
        if (tile?.type === 'WATER' || tile?.type === 'DEEP') {
            dir.weight = 0;
            continue;
        }
        
        // Prefer unexplored
        if (!tile?.explored) {
            dir.weight += 3;
        }
        
        // Avoid recently visited
        if (tracker.wasRecentlyVisited(nx, ny)) {
            dir.weight = Math.max(0.1, dir.weight - 2);
        }
    }
    
    // Weighted random selection
    const totalWeight = directions.reduce((sum, d) => sum + d.weight, 0);
    if (totalWeight === 0) return getRandomDirection();
    
    let r = Math.random() * totalWeight;
    for (const dir of directions) {
        r -= dir.weight;
        if (r <= 0) {
            return { dx: dir.dx, dy: dir.dy };
        }
    }
    
    return directions[0];
}
