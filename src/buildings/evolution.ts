/**
 * Civil Zones - Building Evolution
 * Building variant evolution based on desirability
 */

import type { ZoneTile, Building } from './types.js';

// ═══════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════

interface TileLike {
    type: string;
    road?: boolean;
    tree?: boolean;
    water?: boolean;
    zone?: string | null;
    building?: ZoneTile | null;
    entity?: any;
    explored?: boolean;
    stoneDeposit?: any;
    elevation?: number;
}

interface WorkforceLike {
    roadWorkers?: number;
    roadsNeeded?: number;
}

interface GameLike {
    tiles: TileLike[][];
    blds: Building[];
    workforce?: WorkforceLike;
    evolutionFrameCounter?: number;
    gameState?: string;
}

interface ConfigLike {
    W: number;
    H: number;
    BUILDING_LEVELS?: Array<{
        name: string;
        variants?: Array<{ name: string; icon: string; bonusMult: number }>;
    }>;
}

interface VariantConfig {
    name: string;
    icon: string;
    bonusMult: number;
}

// ═══════════════════════════════════════════════════════════════════
// VARIANT DETERMINATION
// ═══════════════════════════════════════════════════════════════════

/** Desirability thresholds for variants */
export const VARIANT_THRESHOLDS = {
    ABANDONED: 0.1,
    LOW: 0.4,
    MEDIUM: 0.7
};

/** Get variant (0-3) based on desirability */
export function getVariantFromDesirability(desirability: number): number {
    if (desirability < VARIANT_THRESHOLDS.ABANDONED) return 0; // Abandoned
    if (desirability < VARIANT_THRESHOLDS.LOW) return 1; // Low
    if (desirability < VARIANT_THRESHOLDS.MEDIUM) return 2; // Medium
    return 3; // High
}

/** Get variant name from config */
export function getVariantName(
    config: ConfigLike,
    buildingLevel: number,
    variant: number
): string {
    const levelConfig = config.BUILDING_LEVELS?.[buildingLevel];
    if (levelConfig?.variants && levelConfig.variants[variant]) {
        return levelConfig.variants[variant].name;
    }
    return 'Building';
}

/** Get variant icons for state display */
export const VARIANT_ICONS = ['🕳️', '🏚️', '🏠', '🏘️'];

// ═══════════════════════════════════════════════════════════════════
// LEVEL 1 DESIRABILITY (Special Calculation)
// ═══════════════════════════════════════════════════════════════════

/** Calculate desirability for Level 1 buildings */
export function calculateLevel1Desirability(
    game: GameLike,
    config: ConfigLike,
    x: number,
    y: number
): number {
    const { tiles, blds, workforce } = game;
    const { W, H } = config;
    
    let score = 0.25; // Lower baseline for Level 1
    
    // === WATER PROXIMITY (+0.15 bonus) ===
    let waterDist = 999;
    waterLoop: 
    for (let dx = -5; dx <= 5; dx++) {
        for (let dy = -5; dy <= 5; dy++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
            const tile = tiles[nx][ny];
            if (tile.type === 'WATER' || tile.type === 'RIVER' || tile.water) {
                const dist = Math.abs(dx) + Math.abs(dy);
                waterDist = Math.min(waterDist, dist);
                if (dist === 0) break waterLoop;
            }
        }
    }
    if (waterDist <= 3) score += 0.15;
    else if (waterDist <= 5) score += 0.08;
    
    // === ROAD PROXIMITY (+0.10 bonus scaled by maintenance) ===
    let hasAdjacentRoad = false;
    for (let dx = -1; dx <= 1 && !hasAdjacentRoad; dx++) {
        for (let dy = -1; dy <= 1 && !hasAdjacentRoad; dy++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
            if (tiles[nx][ny].road) {
                hasAdjacentRoad = true;
            }
        }
    }
    if (hasAdjacentRoad) {
        let roadMaintenance = 1.0;
        if (workforce && workforce.roadsNeeded && workforce.roadsNeeded > 0) {
            roadMaintenance = Math.min(1.0, (workforce.roadWorkers || 0) / workforce.roadsNeeded);
        }
        score += 0.10 * roadMaintenance;
    }
    
    // === COMMERCIAL NEARBY (+0.08 bonus within 8 tiles) ===
    const commercialNearby = blds.some(b => 
        b.t === 'COM' && Math.abs(b.x - x) + Math.abs(b.y - y) <= 8
    );
    if (commercialNearby) score += 0.08;
    
    // === INDUSTRIAL NEARBY (+0.15 bonus - primitive people want to live near butcher/hunter) ===
    const industrialNearby = blds.some(b => 
        b.t === 'IND' && Math.abs(b.x - x) + Math.abs(b.y - y) <= 8
    );
    if (industrialNearby) score += 0.15;
    
    // === BERRIES NEARBY (+0.20 bonus) ===
    let berryCount = 0;
    for (let dx = -3; dx <= 3; dx++) {
        for (let dy = -3; dy <= 3; dy++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
            if (tiles[nx][ny].type === 'BERRY') berryCount++;
        }
    }
    if (berryCount >= 1) score += 0.20;
    
    return Math.max(0, Math.min(1, score));
}

// ═══════════════════════════════════════════════════════════════════
// STANDARD DESIRABILITY (Levels 2+)
// ═══════════════════════════════════════════════════════════════════

/** Calculate desirability for standard buildings */
export function calculateTileDesirability(
    game: GameLike,
    config: ConfigLike,
    x: number,
    y: number,
    buildingLevel?: number
): number {
    // Use Level 1 special calculation
    if (buildingLevel === 1) {
        return calculateLevel1Desirability(game, config, x, y);
    }
    
    const { tiles, blds } = game;
    const { W, H } = config;
    
    let score = 0.35; // Base score
    
    // === WATER PROXIMITY (+0.30 max) ===
    let waterDist = 999;
    waterLoop:
    for (let dx = -5; dx <= 5; dx++) {
        for (let dy = -5; dy <= 5; dy++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
                const tile = tiles[nx][ny];
                if (tile.type === 'WATER' || tile.type === 'RIVER' || tile.water) {
                    const dist = Math.abs(dx) + Math.abs(dy);
                    waterDist = Math.min(waterDist, dist);
                    if (dist === 0) break waterLoop;
                }
            }
        }
    }
    if (waterDist <= 5) {
        score += 0.30 * (1 - (waterDist / 6));
    }
    
    // === WELL PROXIMITY (+0.25 max) ===
    let nearestWell = 999;
    for (const well of blds) {
        if (well.t !== 'WELL') continue;
        const dist = Math.abs(x - well.x) + Math.abs(y - well.y);
        if (dist > 8) continue;
        nearestWell = Math.min(nearestWell, dist);
        if (dist === 0) break;
    }
    if (nearestWell <= 8) {
        score += 0.25 * (1 - (nearestWell / 9));
    }
    
    // === ROAD CONNECTIVITY (+0.20 max) ===
    let roadDist = 999;
    roadLoop:
    for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
                if (tiles[nx][ny].road) {
                    const dist = Math.abs(dx) + Math.abs(dy);
                    roadDist = Math.min(roadDist, dist);
                    if (dist === 0) break roadLoop;
                }
            }
        }
    }
    if (roadDist <= 2) {
        score += 0.20 * (1 - (roadDist / 3));
    }
    
    // === COMMERCIAL PROXIMITY (+0.12 max) ===
    let nearestCom = 999;
    for (const com of blds) {
        if (com.t !== 'COM') continue;
        const dist = Math.abs(x - com.x) + Math.abs(y - com.y);
        if (dist > 10) continue;
        nearestCom = Math.min(nearestCom, dist);
        if (dist === 0) break;
    }
    if (nearestCom <= 10) {
        score += 0.12 * (1 - (nearestCom / 11));
    }
    
    // === INDUSTRIAL DISTANCE (Pollution penalty: up to -0.20) ===
    let nearestInd = 999;
    for (const ind of blds) {
        if (ind.t !== 'IND') continue;
        const dist = Math.abs(x - ind.x) + Math.abs(y - ind.y);
        if (dist >= 15) continue;
        nearestInd = Math.min(nearestInd, dist);
    }
    if (nearestInd < 15) {
        const penalty = nearestInd < 3 ? -0.20 : -0.20 * (1 - ((nearestInd - 3) / 12));
        score += penalty;
    }
    
    // === POPULATION DENSITY (+0.08 max, penalties for isolation/overcrowding) ===
    let neighbors = 0;
    for (let dx = -2; dx <= 2 && neighbors <= 10; dx++) {
        for (let dy = -2; dy <= 2 && neighbors <= 10; dy++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
                if (tiles[nx][ny].zone === 'R') {
                    neighbors++;
                }
            }
        }
    }
    
    // Sweet spot: 2-6 neighbors
    if (neighbors >= 2 && neighbors <= 6) {
        score += 0.08;
    } else if (neighbors > 6) {
        score -= Math.min(0.10, (neighbors - 6) * 0.02);
    } else if (neighbors === 0) {
        score -= 0.15; // Isolation penalty
    }
    
    // === TREES (+0.05 max) ===
    let trees = 0;
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
                if (tiles[nx][ny].tree) trees++;
            }
        }
    }
    score += Math.min(0.05, trees * 0.015);
    
    return Math.max(0, Math.min(1, score));
}

// ═══════════════════════════════════════════════════════════════════
// POPULATION SCALING
// ═══════════════════════════════════════════════════════════════════

/** Calculate Level 1 population based on variant and desirability */
export function calculateLevel1Population(desirability: number, variant: number): number {
    let newPopulation: number;
    
    if (variant === 0) {
        // Abandoned: 0 people
        newPopulation = 0;
    } else if (variant === 1) {
        // Small Nest: 1-5 people
        newPopulation = 1 + Math.floor((desirability - 0.1) / 0.3 * 4);
    } else if (variant === 2) {
        // Tree Platform: 6-10 people
        newPopulation = 6 + Math.floor((desirability - 0.4) / 0.3 * 4);
    } else {
        // Sturdy Treehouse: 11-15 people
        newPopulation = 11 + Math.floor((desirability - 0.7) / 0.3 * 4);
    }
    
    return Math.max(0, Math.min(15, newPopulation));
}

// ═══════════════════════════════════════════════════════════════════
// EVOLUTION UPDATE
// ═══════════════════════════════════════════════════════════════════

interface EvolutionResult {
    x: number;
    y: number;
    oldVariant: number;
    newVariant: number;
    upgraded: boolean;
    variantName: string;
}

/** Update building evolution for all residential tiles */
export function updateBuildingEvolution(
    game: GameLike,
    config: ConfigLike,
    maxChecksPerFrame: number = 20
): EvolutionResult[] {
    const results: EvolutionResult[] = [];
    const { tiles } = game;
    const { W, H } = config;
    
    // Frame counter for optimization
    if (!game.evolutionFrameCounter) game.evolutionFrameCounter = 0;
    game.evolutionFrameCounter++;
    
    // Only update every 300 frames (5 seconds at 60fps)
    if (game.evolutionFrameCounter < 300) return results;
    game.evolutionFrameCounter = 0;
    
    // Don't run in nomad mode
    if (game.gameState !== 'CITY') return results;
    
    let checksThisFrame = 0;
    
    for (let x = 0; x < W && checksThisFrame < maxChecksPerFrame; x++) {
        for (let y = 0; y < H && checksThisFrame < maxChecksPerFrame; y++) {
            const tile = tiles[x][y];
            if (tile.zone !== 'R' || !tile.building) continue;
            
            checksThisFrame++;
            const bld = tile.building;
            
            // Calculate local desirability
            const desirability = calculateTileDesirability(game, config, x, y, bld.level);
            
            // Store desirability
            bld.desirability = desirability;
            
            // Determine variant
            const oldVariant = bld.variant || 0;
            let newVariant: number;
            
            if (bld.level === 1) {
                // Level 1 special thresholds
                newVariant = getVariantFromDesirability(desirability);
                // Calculate population for Level 1
                bld.population = calculateLevel1Population(desirability, newVariant);
            } else {
                // Standard variant calculation
                newVariant = getVariantFromDesirability(desirability);
            }
            
            // Check if variant changed
            if (newVariant !== oldVariant) {
                bld.variant = newVariant as 0 | 1 | 2 | 3;
                
                const variantName = getVariantName(config, bld.level || 1, newVariant);
                
                results.push({
                    x,
                    y,
                    oldVariant,
                    newVariant,
                    upgraded: newVariant > oldVariant,
                    variantName
                });
            }
        }
    }
    
    return results;
}

// ═══════════════════════════════════════════════════════════════════
// BONUS MULTIPLIERS
// ═══════════════════════════════════════════════════════════════════

/** Get bonus multiplier for a variant */
export function getVariantBonusMultiplier(variant: number): number {
    switch (variant) {
        case 0: return 0;     // Abandoned - no bonus
        case 1: return 0.5;   // Low - 50%
        case 2: return 1.0;   // Medium - 100%
        case 3: return 1.5;   // High - 150%
        default: return 1.0;
    }
}

/** Get income multiplier for a variant */
export function getVariantIncomeMultiplier(variant: number): number {
    switch (variant) {
        case 0: return 0;
        case 1: return 0.5;
        case 2: return 1.0;
        case 3: return 1.5;
        default: return 1.0;
    }
}

/** Get lifespan bonus for a variant */
export function getVariantLifespanBonus(variant: number): number {
    switch (variant) {
        case 0: return 0;
        case 1: return 0;
        case 2: return 1;
        case 3: return 2;
        default: return 0;
    }
}
