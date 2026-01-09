/**
 * Civil Zones - Player System
 * Handles player state, movement, and interactions
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type Direction = 'up' | 'down' | 'left' | 'right';

/** Player state */
export interface Player {
    x: number;
    y: number;
    health: number;
    direction: Direction;
    bashTime?: number;      // Timestamp for bash animation
}

/** Movement result */
export interface MoveResult {
    success: boolean;
    newX: number;
    newY: number;
    message?: string;
    blockedBy?: string;
}

/** Tile passability check result */
export interface PassabilityResult {
    passable: boolean;
    reason?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAYER CREATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a new player at position
 */
export function createPlayer(
    x: number,
    y: number,
    health: number = 3,
    direction: Direction = 'down'
): Player {
    return { x, y, health, direction };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOVEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate new position after movement
 */
export function getNewPosition(
    player: Player,
    dx: number,
    dy: number
): { x: number; y: number } {
    return {
        x: player.x + dx,
        y: player.y + dy
    };
}

/**
 * Get direction from delta movement
 */
export function getDirectionFromDelta(dx: number, dy: number): Direction {
    if (dx > 0) return 'right';
    if (dx < 0) return 'left';
    if (dy > 0) return 'down';
    return 'up';
}

/**
 * Get delta from direction
 */
export function getDeltaFromDirection(direction: Direction): { dx: number; dy: number } {
    switch (direction) {
        case 'up': return { dx: 0, dy: -1 };
        case 'down': return { dx: 0, dy: 1 };
        case 'left': return { dx: -1, dy: 0 };
        case 'right': return { dx: 1, dy: 0 };
    }
}

/**
 * Check if position is within map bounds
 */
export function isInBounds(
    x: number,
    y: number,
    mapWidth: number,
    mapHeight: number
): boolean {
    return x >= 0 && x < mapWidth && y >= 0 && y < mapHeight;
}

/**
 * Check if tile type is passable
 */
export function isTileTypePassable(
    tileType: string,
    isWanderMode: boolean = true
): PassabilityResult {
    // Water tiles are never passable on foot
    if (tileType === 'WATER' || tileType === 'DEEP' || tileType === 'RIVER') {
        return { passable: false, reason: 'Water blocks path' };
    }
    
    // Stone is only passable in city mode
    if (tileType === 'STONE' && isWanderMode) {
        return { passable: false, reason: 'Dense rock formation. Impassable.' };
    }
    
    return { passable: true };
}

/**
 * Move player with validation
 */
export function movePlayer(
    player: Player,
    dx: number,
    dy: number,
    mapWidth: number,
    mapHeight: number,
    getTileType: (x: number, y: number) => string,
    isWanderMode: boolean = true
): MoveResult {
    const newX = player.x + dx;
    const newY = player.y + dy;
    
    // Check bounds
    if (!isInBounds(newX, newY, mapWidth, mapHeight)) {
        return {
            success: false,
            newX: player.x,
            newY: player.y,
            message: 'World boundary reached',
            blockedBy: 'boundary'
        };
    }
    
    // Check tile passability
    const tileType = getTileType(newX, newY);
    const passability = isTileTypePassable(tileType, isWanderMode);
    
    if (!passability.passable) {
        return {
            success: false,
            newX: player.x,
            newY: player.y,
            message: passability.reason,
            blockedBy: tileType
        };
    }
    
    // Update player position and direction
    player.x = newX;
    player.y = newY;
    player.direction = getDirectionFromDelta(dx, dy);
    
    return {
        success: true,
        newX,
        newY
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH & DAMAGE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Apply damage to player
 */
export function damagePlayer(player: Player, amount: number): number {
    player.health = Math.max(0, player.health - amount);
    return player.health;
}

/**
 * Heal player
 */
export function healPlayer(player: Player, amount: number, maxHealth: number = 3): number {
    player.health = Math.min(maxHealth, player.health + amount);
    return player.health;
}

/**
 * Check if player is dead
 */
export function isPlayerDead(player: Player): boolean {
    return player.health <= 0;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPAWN LOGIC
// ═══════════════════════════════════════════════════════════════════════════════

/** Spawn validation result */
export interface SpawnValidation {
    valid: boolean;
    x: number;
    y: number;
    reachableTiles: number;
}

/**
 * Check if position is valid for spawning
 */
export function isValidSpawnTile(tileType: string): boolean {
    return tileType === 'GRASS' || 
           tileType === 'FOREST' || 
           tileType === 'SAND' || 
           tileType === 'SNOW' || 
           tileType === 'ROCK';
}

/**
 * Count reachable land tiles from position using flood fill
 */
export function countReachableTiles(
    startX: number,
    startY: number,
    mapWidth: number,
    mapHeight: number,
    getTileType: (x: number, y: number) => string,
    maxTiles: number = 200
): number {
    const seen = new Set<string>();
    const queue: [number, number][] = [[startX, startY]];
    let count = 0;
    
    while (queue.length > 0 && count < maxTiles) {
        const [x, y] = queue.shift()!;
        const key = `${x},${y}`;
        
        if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) continue;
        if (seen.has(key)) continue;
        
        const tileType = getTileType(x, y);
        if (tileType !== 'GRASS' && tileType !== 'FOREST' && tileType !== 'SAND') continue;
        
        seen.add(key);
        count++;
        
        queue.push([x + 1, y]);
        queue.push([x - 1, y]);
        queue.push([x, y + 1]);
        queue.push([x, y - 1]);
    }
    
    return count;
}

/**
 * Find a valid spawn position
 */
export function findSpawnPosition(
    mapWidth: number,
    mapHeight: number,
    getTileType: (x: number, y: number) => string,
    minReachable: number = 60
): SpawnValidation | null {
    // Phase 1: Try center area (20 tile radius)
    for (let attempt = 0; attempt < 100; attempt++) {
        const x = Math.floor(mapWidth / 2 + (Math.random() - 0.5) * 40);
        const y = Math.floor(mapHeight / 2 + (Math.random() - 0.5) * 40);
        
        if (isValidSpawnTile(getTileType(x, y))) {
            const reachable = countReachableTiles(x, y, mapWidth, mapHeight, getTileType);
            if (reachable >= minReachable) {
                return { valid: true, x, y, reachableTiles: reachable };
            }
        }
    }
    
    // Phase 2: Try wider area (whole map)
    for (let attempt = 0; attempt < 500; attempt++) {
        const x = Math.floor(Math.random() * mapWidth);
        const y = Math.floor(Math.random() * mapHeight);
        
        if (isValidSpawnTile(getTileType(x, y))) {
            const reachable = countReachableTiles(x, y, mapWidth, mapHeight, getTileType);
            if (reachable >= 30) { // Lower threshold for fallback
                return { valid: true, x, y, reachableTiles: reachable };
            }
        }
    }
    
    // Phase 3: Emergency - scan entire map
    for (let x = 0; x < mapWidth; x++) {
        for (let y = 0; y < mapHeight; y++) {
            if (isValidSpawnTile(getTileType(x, y))) {
                return { valid: true, x, y, reachableTiles: 1 };
            }
        }
    }
    
    // Absolute last resort - center
    return {
        valid: false,
        x: Math.floor(mapWidth / 2),
        y: Math.floor(mapHeight / 2),
        reachableTiles: 0
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPLORATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get tiles to reveal in exploration radius
 */
export function getExplorationTiles(
    centerX: number,
    centerY: number,
    radius: number,
    mapWidth: number,
    mapHeight: number
): Array<{ x: number; y: number }> {
    const tiles: Array<{ x: number; y: number }> = [];
    
    for (let x = centerX - radius; x <= centerX + radius; x++) {
        for (let y = centerY - radius; y <= centerY + radius; y++) {
            if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
                const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                if (dist <= radius) {
                    tiles.push({ x, y });
                }
            }
        }
    }
    
    return tiles;
}

// ═══════════════════════════════════════════════════════════════════════════════
// THIRST SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export interface ThirstState {
    level: number;          // 0-100, dies at 0
    stepCounter: number;    // Steps since last drink
}

/**
 * Create initial thirst state
 */
export function createThirstState(): ThirstState {
    return { level: 100, stepCounter: 0 };
}

/**
 * Update thirst after movement
 */
export function updateThirst(state: ThirstState): ThirstState {
    state.stepCounter++;
    state.level = Math.max(0, 100 - state.stepCounter);
    return state;
}

/**
 * Drink water to reset thirst
 */
export function drinkWater(state: ThirstState): ThirstState {
    state.level = 100;
    state.stepCounter = 0;
    return state;
}

/**
 * Check if player is dying of thirst
 */
export function isDyingOfThirst(state: ThirstState): boolean {
    return state.level <= 0;
}

/**
 * Get thirst warning level
 */
export function getThirstWarning(state: ThirstState): 'safe' | 'warning' | 'danger' | 'critical' {
    if (state.level > 50) return 'safe';
    if (state.level > 25) return 'warning';
    if (state.level > 10) return 'danger';
    return 'critical';
}
