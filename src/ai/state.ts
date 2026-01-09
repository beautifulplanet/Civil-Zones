/**
 * Civil Zones - AI State Reader
 * Reads game state for AI decision making
 */

import type { AIGameState, AIWanderState, ExpansionStats, BlockerDiagnosis } from './types.js';

// ═══════════════════════════════════════════════════════════════════
// GAME STATE INTERFACE (for type safety without circular deps)
// ═══════════════════════════════════════════════════════════════════

interface GameLike {
    pop?: number;
    food?: number;
    wood?: number;
    stone?: number;
    metal?: number;
    gold?: number;
    year?: number;
    housingCap?: number;
    wellCount?: number;
    zoneCount?: number;
    thirst?: number;
    thirstCounter?: number;
    gameState?: 'WANDER' | 'CITY';
    inventory?: { food: number; wood: number };
    player?: { x: number; y: number };
    tiles?: any[][];
    blds?: Array<{ t: string; x?: number; y?: number }>;
    calculateRCIDemand?: () => { r: number; c: number; i: number };
    workforce?: { gatherers: number; shortage: number };
    settlementPos?: { x: number; y: number };
}

// ═══════════════════════════════════════════════════════════════════
// STATE READING
// ═══════════════════════════════════════════════════════════════════

/** Read full game state for AI decision making */
export function readGameState(game: GameLike): AIGameState {
    const pop = game.pop || 0;
    const food = game.food || 0;
    const wood = game.wood || 0;
    const stone = game.stone || 0;
    const metal = game.metal || 0;
    const gold = game.gold || 0;
    const year = game.year || 0;
    const housingCap = game.housingCap || 0;
    
    // Building counts
    const wells = game.blds ? game.blds.filter(b => b.t === 'WELL').length : 0;
    const resZones = game.zoneCount || 0;
    const comZones = game.blds ? game.blds.filter(b => b.t === 'COM').length : 0;
    const indZones = game.blds ? game.blds.filter(b => b.t === 'IND').length : 0;
    const roadCount = game.blds ? game.blds.filter(b => b.t === 'ROAD').length : 0;
    const paths = game.tiles ? game.tiles.flat().filter((t: any) => t?.path).length : 0;
    
    // Water calculations
    const waterCapacity = wells * 100;
    const waterPercent = waterCapacity > 0 ? Math.round((pop / waterCapacity) * 100) : 0;
    const wellsNeeded = Math.ceil(pop / 100);
    const needsWells = pop > 0 && waterCapacity < pop;
    
    // Housing calculations
    const needsHousing = pop >= housingCap - 5;
    const housingNeeded = Math.max(0, pop - housingCap + 10);
    const homeless = Math.max(0, pop - housingCap);
    
    // Food calculations
    const foodPerPerson = pop > 0 ? food / pop : 0;
    const isStarving = food < pop * 2;
    const isThirsty = needsWells;
    
    // RCI Demand
    const rci = game.calculateRCIDemand ? game.calculateRCIDemand() : { r: 50, c: 50, i: 50 };
    const rDemand = rci.r;
    const cDemand = rci.c;
    const iDemand = rci.i;
    const highestDemand: 'R' | 'C' | 'I' = 
        rDemand >= cDemand && rDemand >= iDemand ? 'R' : 
        (cDemand >= iDemand ? 'C' : 'I');
    
    // Workforce
    const workforce = game.workforce || { gatherers: 0, shortage: 0 };
    const workerShortage = workforce.shortage > 0;
    
    return {
        pop, food, wood, stone, metal, gold, year,
        housingCap, wells, waterCapacity, waterPercent,
        resZones, comZones, indZones, paths, roadCount,
        needsWells, wellsNeeded, needsHousing, housingNeeded,
        foodPerPerson, isStarving, isThirsty,
        rDemand, cDemand, iDemand, highestDemand,
        workerShortage, homeless
    };
}

/** Read wander mode state */
export function readWanderState(game: GameLike): AIWanderState {
    const pop = game.pop || 0;
    const food = game.inventory?.food || 0;
    const wood = game.inventory?.wood || 0;
    const thirst = game.thirst || 100;
    const thirstCounter = game.thirstCounter || 0;
    
    // Check if near water
    const nearWater = checkNearWater(game);
    
    // Count explored tiles
    const exploredTiles = countExploredTiles(game);
    
    return { pop, food, wood, thirst, thirstCounter, nearWater, exploredTiles };
}

// ═══════════════════════════════════════════════════════════════════
// WATER DETECTION
// ═══════════════════════════════════════════════════════════════════

/** Check if player is near water (within settlement distance) */
export function checkNearWater(game: GameLike, distance: number = 5): boolean {
    if (!game.player || !game.tiles) return false;
    
    const px = game.player.x;
    const py = game.player.y;
    const width = game.tiles.length;
    const height = game.tiles[0]?.length || 0;
    
    for (let dx = -distance; dx <= distance; dx++) {
        for (let dy = -distance; dy <= distance; dy++) {
            const x = px + dx;
            const y = py + dy;
            
            if (x >= 0 && x < width && y >= 0 && y < height) {
                const tile = game.tiles[x][y];
                if (tile && (tile.type === 'WATER' || tile.type === 'RIVER' || tile.type === 'DEEP')) {
                    return true;
                }
            }
        }
    }
    return false;
}

/** Find nearest water source */
export function findNearestWater(game: GameLike, maxRadius: number = 20): { x: number; y: number } | null {
    if (!game.player || !game.tiles) return null;
    
    const px = game.player.x;
    const py = game.player.y;
    const width = game.tiles.length;
    const height = game.tiles[0]?.length || 0;
    
    let bestDist = Infinity;
    let bestPos: { x: number; y: number } | null = null;
    
    for (let radius = 1; radius <= maxRadius; radius++) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                // Only check perimeter
                if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
                
                const x = px + dx;
                const y = py + dy;
                
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    const tile = game.tiles[x][y];
                    if (tile?.explored && (tile.type === 'WATER' || tile.type === 'RIVER')) {
                        const dist = Math.abs(dx) + Math.abs(dy);
                        if (dist < bestDist) {
                            bestDist = dist;
                            bestPos = { x, y };
                        }
                    }
                }
            }
        }
        if (bestPos) break;
    }
    
    return bestPos;
}

// ═══════════════════════════════════════════════════════════════════
// EXPLORATION
// ═══════════════════════════════════════════════════════════════════

/** Count explored tiles around player */
export function countExploredTiles(game: GameLike, radius: number = 3): number {
    if (!game.player || !game.tiles) return 0;
    
    const cx = game.player.x;
    const cy = game.player.y;
    const width = game.tiles.length;
    const height = game.tiles[0]?.length || 0;
    
    let count = 0;
    for (let x = cx - radius; x <= cx + radius; x++) {
        for (let y = cy - radius; y <= cy + radius; y++) {
            if (x >= 0 && y >= 0 && x < width && y < height) {
                const tile = game.tiles[x][y];
                if (tile?.explored) count++;
            }
        }
    }
    return count;
}

// ═══════════════════════════════════════════════════════════════════
// CITY EXPANSION
// ═══════════════════════════════════════════════════════════════════

/** Get city expansion statistics */
export function getCityExpansionStats(game: GameLike, aiSettlementPos?: { x: number; y: number }): ExpansionStats {
    if (!game.blds || game.blds.length === 0) {
        return { radius: 0, roadFrontier: 0, quadrants: 0 };
    }
    
    // Determine origin point
    let origin = game.settlementPos || aiSettlementPos;
    if (!origin) {
        if (game.player) {
            origin = { x: game.player.x, y: game.player.y };
        } else {
            const first = game.blds[0];
            origin = { x: first?.x || 0, y: first?.y || 0 };
        }
    }
    
    let maxDist = 0;
    let roadFrontier = 0;
    const quadrants = new Set<string>();
    
    for (const b of game.blds) {
        if (b.x === undefined || b.y === undefined) continue;
        
        const dx = b.x - origin.x;
        const dy = b.y - origin.y;
        const manhattan = Math.abs(dx) + Math.abs(dy);
        
        if (manhattan > maxDist) maxDist = manhattan;
        if (b.t === 'ROAD' && manhattan > roadFrontier) roadFrontier = manhattan;
        
        if (manhattan > 0) {
            const quad = dx >= 0 
                ? (dy >= 0 ? 'SE' : 'NE')
                : (dy >= 0 ? 'SW' : 'NW');
            quadrants.add(quad);
        }
    }
    
    return { radius: maxDist, roadFrontier, quadrants: quadrants.size };
}

// ═══════════════════════════════════════════════════════════════════
// DIAGNOSTICS
// ═══════════════════════════════════════════════════════════════════

/** Diagnose what's blocking city progress */
export function diagnoseBlockers(state: AIGameState): BlockerDiagnosis[] | null {
    const blockers: BlockerDiagnosis[] = [];
    
    // Check water
    if (state.pop > state.waterCapacity * 0.8) {
        blockers.push({
            issue: 'water',
            severity: state.pop > state.waterCapacity ? 'critical' : 'warning',
            fix: 'BUILD_WELL'
        });
    }
    
    // Check housing
    if (state.pop >= state.housingCap - 2) {
        blockers.push({
            issue: 'housing',
            severity: state.pop >= state.housingCap ? 'critical' : 'warning',
            fix: 'BUILD_RES'
        });
    }
    
    // Check food production
    if (state.food < state.pop * 5) {
        blockers.push({
            issue: 'food',
            severity: state.food < state.pop * 2 ? 'critical' : 'warning',
            fix: 'BUILD_COM'
        });
    }
    
    // Check wood production
    if (state.wood < 50 && state.comZones > 0) {
        blockers.push({
            issue: 'wood',
            severity: 'warning',
            fix: 'BUILD_COM'
        });
    }
    
    // Check industrial readiness
    if (state.indZones === 0 && state.pop >= 25 && state.resZones >= 4 && state.comZones >= 1) {
        blockers.push({
            issue: 'no-industrial',
            severity: 'opportunity',
            fix: 'BUILD_IND'
        });
    }
    
    return blockers.length > 0 ? blockers : null;
}

/** Get population tier strategy advice */
export function getPopTierStrategy(pop: number): {
    tier: string;
    priority: string;
    waterRatio: number;
    comRatio: number;
    indThreshold: number;
    roadsPer: number;
    expandRate: number;
    hint: string;
} {
    if (pop < 10) {
        return {
            tier: 'startup',
            priority: 'survival',
            waterRatio: 0.15,
            comRatio: 0.2,
            indThreshold: 999,
            roadsPer: 3,
            expandRate: 0,
            hint: 'Focus on first residential and well'
        };
    } else if (pop < 25) {
        return {
            tier: 'growth',
            priority: 'population',
            waterRatio: 0.12,
            comRatio: 0.25,
            indThreshold: 200,
            roadsPer: 2.5,
            expandRate: 1,
            hint: 'Build residential, add commercial for production'
        };
    } else if (pop < 50) {
        return {
            tier: 'expansion',
            priority: 'diversity',
            waterRatio: 0.1,
            comRatio: 0.33,
            indThreshold: 100,
            roadsPer: 2,
            expandRate: 2,
            hint: 'Balance RCI, push road frontier'
        };
    } else if (pop < 100) {
        return {
            tier: 'city',
            priority: 'efficiency',
            waterRatio: 0.08,
            comRatio: 0.4,
            indThreshold: 50,
            roadsPer: 1.5,
            expandRate: 3,
            hint: 'Maximize industrial, expand into new quadrants'
        };
    } else {
        return {
            tier: 'metropolis',
            priority: 'dominance',
            waterRatio: 0.06,
            comRatio: 0.5,
            indThreshold: 25,
            roadsPer: 1,
            expandRate: 5,
            hint: 'Fill all quadrants, reach Level 3+'
        };
    }
}
