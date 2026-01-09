/**
 * Civil Zones - Zone Bonuses
 * Calculate efficiency bonuses for building placement
 */

import type { ZoneType, ZoneBonusResult, Building } from './types.js';
import { DEFAULT_ZONE_BONUSES } from './types.js';

// ═══════════════════════════════════════════════════════════════════
// TILE/GAME INTERFACE
// ═══════════════════════════════════════════════════════════════════

interface TileLike {
    type: string;
    road?: boolean;
    zone?: string | null;
    tree?: boolean;
    stoneDeposit?: any;
}

interface GameLike {
    tiles: TileLike[][];
    blds: Building[];
    lockedResources?: {
        residential?: boolean;
        commercial?: boolean;
        industrial?: boolean;
    };
}

interface ConfigLike {
    W: number;
    H: number;
    ZONE_BONUSES?: typeof DEFAULT_ZONE_BONUSES;
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/** Count tiles matching condition in radius */
export function countNearbyTiles(
    tiles: TileLike[][],
    gx: number,
    gy: number,
    range: number,
    checkFn: (tile: TileLike) => boolean,
    mapWidth: number,
    mapHeight: number
): number {
    let count = 0;
    for (let dx = -range; dx <= range; dx++) {
        for (let dy = -range; dy <= range; dy++) {
            if (dx === 0 && dy === 0) continue;
            const nx = gx + dx;
            const ny = gy + dy;
            if (nx >= 0 && nx < mapWidth && ny >= 0 && ny < mapHeight) {
                if (checkFn(tiles[nx][ny])) count++;
            }
        }
    }
    return count;
}

/** Check if any tile matches in radius */
export function hasNearbyTile(
    tiles: TileLike[][],
    gx: number,
    gy: number,
    range: number,
    checkFn: (tile: TileLike) => boolean,
    mapWidth: number,
    mapHeight: number
): boolean {
    return countNearbyTiles(tiles, gx, gy, range, checkFn, mapWidth, mapHeight) > 0;
}

/** Check if building is within distance */
export function isBuildingNearby(
    building: Building,
    gx: number,
    gy: number,
    maxDist: number
): boolean {
    const dist = Math.abs(building.x - gx) + Math.abs(building.y - gy);
    return dist <= maxDist;
}

/** Check if building is within euclidean distance */
export function isBuildingInRadius(
    building: Building,
    gx: number,
    gy: number,
    radius: number
): boolean {
    const dist = Math.sqrt(Math.pow(building.x - gx, 2) + Math.pow(building.y - gy, 2));
    return dist <= radius;
}

// ═══════════════════════════════════════════════════════════════════
// ZONE BONUS CALCULATION
// ═══════════════════════════════════════════════════════════════════

/** Calculate zone bonus for placement */
export function calculateZoneBonus(
    game: GameLike,
    config: ConfigLike,
    gx: number,
    gy: number,
    zoneType: ZoneType
): number {
    const B = config.ZONE_BONUSES || DEFAULT_ZONE_BONUSES;
    let bonus = 1.0;
    
    const { tiles, blds } = game;
    const { W, H } = config;
    
    // === ROAD ACCESS (critical for all zones) ===
    const roadCount = countNearbyTiles(tiles, gx, gy, 1, t => !!t.road, W, H);
    if (roadCount > 0) {
        bonus += B.ROAD_ACCESS_BONUS;
        // Extra bonus for road junctions (commercial loves these)
        if (roadCount >= 3 && zoneType === 'C') {
            bonus += B.COM_ROAD_JUNCTION_BONUS;
        }
    } else {
        // Check if road is at least within 3 tiles
        const hasRoadNearby = hasNearbyTile(tiles, gx, gy, 3, t => !!t.road, W, H);
        if (!hasRoadNearby) {
            bonus -= B.NO_ROAD_PENALTY;
        }
    }
    
    // === WATER PROXIMITY ===
    const hasWater = hasNearbyTile(
        tiles, gx, gy, 3,
        t => t.type === 'WATER' || t.type === 'RIVER',
        W, H
    );
    if (hasWater) {
        if (zoneType === 'R') bonus += B.RES_WATER_BONUS;
        else if (zoneType === 'I') bonus += B.IND_WATER_BONUS;
    }
    
    // === WELL PROXIMITY ===
    const wellNearby = blds.some(b => b.t === 'WELL' && isBuildingNearby(b, gx, gy, 3));
    if (wellNearby && zoneType === 'R') {
        bonus += B.RES_WELL_BONUS;
    }
    
    // === TREE/FOREST PROXIMITY ===
    const treeCount = countNearbyTiles(
        tiles, gx, gy, 2,
        t => !!(t.tree || t.type === 'FOREST'),
        W, H
    );
    if (treeCount > 0) {
        if (zoneType === 'R') bonus += B.RES_TREE_BONUS;
        else if (zoneType === 'I') bonus += B.IND_FOREST_BONUS * Math.min(treeCount / 3, 1);
    }
    
    // === STONE PROXIMITY (Industrial loves this) ===
    const stoneNearby = hasNearbyTile(
        tiles, gx, gy, 3,
        t => t.type === 'STONE' || !!t.stoneDeposit,
        W, H
    );
    if (stoneNearby && zoneType === 'I') {
        bonus += B.IND_STONE_BONUS;
    }
    
    // === RESIDENTIAL BONUSES/PENALTIES ===
    if (zoneType === 'R') {
        // Clustering bonus
        const resCount = countNearbyTiles(tiles, gx, gy, 1, t => t.zone === 'R', W, H);
        bonus += resCount * B.RES_CLUSTER_BONUS;
        
        // Industrial penalty (pollution)
        const indNearby = blds.some(b => b.t === 'IND' && isBuildingNearby(b, gx, gy, 2));
        if (indNearby) bonus -= B.RES_INDUSTRIAL_PENALTY;
    }
    
    // === COMMERCIAL BONUSES/PENALTIES ===
    if (zoneType === 'C') {
        // Needs customers (residential)
        const resNearby = countNearbyTiles(tiles, gx, gy, 5, t => t.zone === 'R', W, H);
        if (resNearby >= 3) {
            bonus += B.COM_RES_NEARBY_BONUS;
        } else if (resNearby === 0) {
            bonus -= B.COM_ISOLATION_PENALTY;
        }
        
        // Industrial workers nearby
        const indNearby = blds.some(b => b.t === 'IND' && isBuildingNearby(b, gx, gy, 5));
        if (indNearby) bonus += B.COM_INDUSTRIAL_NEARBY;
    }
    
    // === INDUSTRIAL BONUSES/PENALTIES ===
    if (zoneType === 'I') {
        // Clustering bonus (industrial parks)
        const indCount = blds.filter(b => b.t === 'IND' && isBuildingNearby(b, gx, gy, 2)).length;
        bonus += indCount * B.IND_CLUSTER_BONUS;
        
        // Penalty if too close to residential
        const resTooClose = countNearbyTiles(tiles, gx, gy, 2, t => t.zone === 'R', W, H);
        if (resTooClose > 0) bonus -= B.IND_RES_NEARBY_PENALTY;
    }
    
    // === CHIEF'S HUT BONUS ===
    const chiefNearby = blds.some(b => 
        b.t === 'CHIEF' && isBuildingInRadius(b, gx, gy, B.CHIEF_CULTURE_RADIUS)
    );
    if (chiefNearby) bonus += B.CHIEF_BONUS;
    
    // === LOCKED RESOURCE BONUSES (from settlement) ===
    if (game.lockedResources) {
        if (zoneType === 'R' && game.lockedResources.residential) {
            bonus += 0.25; // +25% for having berries locked
        }
        if (zoneType === 'C' && game.lockedResources.commercial) {
            bonus += 0.25; // +25% for having trees locked
        }
        if (zoneType === 'I' && game.lockedResources.industrial) {
            bonus += 0.25; // +25% for having animals locked
        }
    }
    
    // Clamp to reasonable range
    return Math.max(0.3, Math.min(2.5, bonus));
}

// ═══════════════════════════════════════════════════════════════════
// ZONE BONUS DESCRIPTION
// ═══════════════════════════════════════════════════════════════════

/** Get text description of zone bonuses */
export function getZoneBonusDescription(
    game: GameLike,
    config: ConfigLike,
    gx: number,
    gy: number,
    zoneType: ZoneType
): ZoneBonusResult {
    const { tiles } = game;
    const { W, H } = config;
    
    const bonuses: string[] = [];
    const penalties: string[] = [];
    
    // Road check
    const roadCount = countNearbyTiles(tiles, gx, gy, 1, t => !!t.road, W, H);
    if (roadCount > 0) {
        bonuses.push('🛣️ Road Access');
    } else {
        penalties.push('❌ No Road');
    }
    
    // Water check
    const hasWater = hasNearbyTile(
        tiles, gx, gy, 3,
        t => t.type === 'WATER' || t.type === 'RIVER',
        W, H
    );
    if (hasWater) {
        bonuses.push('💧 Near Water');
    }
    
    const totalBonus = calculateZoneBonus(game, config, gx, gy, zoneType);
    const percentage = Math.round((totalBonus - 1) * 100);
    const prefix = percentage >= 0 ? '+' : '';
    
    return {
        bonuses,
        penalties,
        total: totalBonus,
        text: `${prefix}${percentage}% Efficiency`
    };
}

// ═══════════════════════════════════════════════════════════════════
// DESIRABILITY CALCULATION
// ═══════════════════════════════════════════════════════════════════

/** Calculate desirability for residential placement */
export function calculateDesirability(
    game: GameLike,
    config: ConfigLike,
    x: number,
    y: number,
    size: number = 1,
    chiefRadius: number = 50,
    chiefBonus: number = 1.5
): number {
    const { tiles, blds } = game;
    const { W, H } = config;
    
    let score = 1.0;
    let neighborCount = 0;
    let hasTree = false;
    let hasWater = false;
    let hasChief = false;
    
    // Check neighbors (adjacent residential zones)
    for (let dx = -1; dx <= size; dx++) {
        for (let dy = -1; dy <= size; dy++) {
            if (dx === 0 && dy === 0) continue;
            const checkX = x + dx;
            const checkY = y + dy;
            if (checkX >= 0 && checkX < W && checkY >= 0 && checkY < H) {
                const tile = tiles[checkX][checkY];
                if (tile.zone === 'R') neighborCount++;
                if (tile.tree || tile.type === 'FOREST') hasTree = true;
            }
        }
    }
    
    // Check water proximity (within 3 tiles)
    for (let dx = -3; dx <= 3 + size; dx++) {
        for (let dy = -3; dy <= 3 + size; dy++) {
            const checkX = x + dx;
            const checkY = y + dy;
            if (checkX >= 0 && checkX < W && checkY >= 0 && checkY < H) {
                const tile = tiles[checkX][checkY];
                if (tile.type === 'WATER' || tile.type === 'RIVER') {
                    hasWater = true;
                }
            }
        }
    }
    
    // Check Chief's Hut proximity
    for (const chief of blds.filter(b => b.t === 'CHIEF')) {
        if (isBuildingInRadius(chief, x, y, chiefRadius)) {
            hasChief = true;
            break;
        }
    }
    
    // Apply bonuses (using configurable values)
    const neighborBonus = 0.15;
    const treeBonus = 0.25;
    const waterBonus = 0.35;
    const isolationPenalty = 0.3;
    
    score += neighborCount * neighborBonus;
    if (hasTree) score += treeBonus;
    if (hasWater) score += waterBonus;
    if (hasChief) score *= chiefBonus;
    
    // Isolation penalty - check if any buildings within 2 tiles
    let isolated = true;
    for (let dx = -2; dx <= 2 + size; dx++) {
        for (let dy = -2; dy <= 2 + size; dy++) {
            if (dx === 0 && dy === 0) continue;
            const checkX = x + dx;
            const checkY = y + dy;
            
            if (checkX >= 0 && checkX < W && checkY >= 0 && checkY < H) {
                if (tiles[checkX][checkY].zone) {
                    isolated = false;
                    break;
                }
            }
            
            // Check for 2x2 buildings
            const nearBuilding = blds.find(b =>
                checkX >= b.x && checkX < b.x + 2 &&
                checkY >= b.y && checkY < b.y + 2
            );
            if (nearBuilding) {
                isolated = false;
                break;
            }
        }
        if (!isolated) break;
    }
    
    if (isolated) score -= isolationPenalty;
    
    return Math.max(0.5, score);
}

// ═══════════════════════════════════════════════════════════════════
// CLUSTER ANALYSIS
// ═══════════════════════════════════════════════════════════════════

/** Get cluster multiplier based on neighbor count */
export function getClusterMultiplier(neighbors: number): number {
    // 0 neighbors = 0.3x (very slow)
    // 1 = 0.5x
    // 2 = 0.8x
    // 3 = 1.0x
    // 4+ = 1.5x
    if (neighbors === 0) return 0.3;
    if (neighbors === 1) return 0.5;
    if (neighbors === 2) return 0.8;
    if (neighbors === 3) return 1.0;
    return 1.5;
}

/** Count residential neighbors for a tile */
export function countResidentialNeighbors(
    tiles: TileLike[][],
    x: number,
    y: number,
    mapWidth: number,
    mapHeight: number
): number {
    let neighbors = 0;
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < mapWidth && ny >= 0 && ny < mapHeight) {
                if (tiles[nx][ny].zone === 'R') neighbors++;
            }
        }
    }
    return neighbors;
}
