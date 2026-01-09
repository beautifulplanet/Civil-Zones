/**
 * Civil Zones - Population System
 * Handles population assignment to buildings and workforce management
 */

import type { Tile, TileBuilding } from '../types/index.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Building with population tracking */
interface PopulatedBuilding {
    tile?: Tile;
    bld?: BuildingInstance;
    cap: number;
    overflowCap?: number;
}

/** Building instance from blds array */
interface BuildingInstance {
    t: 'RES' | 'COM' | 'IND';
    x: number;
    y: number;
    lvl: number;
    pop: number;
    capacity?: number;
}

/** Level configuration (expected from CFG) */
interface LevelConfig {
    capacity: number;
    overflowCapacity?: number;
}

/** Game state interface (minimal for population system) */
interface PopulationGameState {
    tiles: Tile[][];
    blds: BuildingInstance[];
    pop: number;
    BUILDING_LEVELS?: LevelConfig[];
    COMMERCIAL_LEVELS?: LevelConfig[];
    INDUSTRIAL_LEVELS?: LevelConfig[];
}

/** Workforce tracking */
export interface WorkforceState {
    total: number;
    wellWorkers: number;
    roadWorkers: number;
    comWorkers: number;
    indWorkers: number;
    gatherers: number;
    wellsNeeded: number;
    roadsNeeded: number;
    comNeeded: number;
    indNeeded: number;
    shortage: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// POPULATION ASSIGNMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Assign population to residential buildings
 * Fills largest buildings first, allows overflow when needed
 */
export function assignPopulationToResidential(
    game: PopulationGameState,
    buildingLevels: LevelConfig[]
): number {
    const residentials: PopulatedBuilding[] = [];
    
    // Find all residential zones
    for (let x = 0; x < game.tiles.length; x++) {
        for (let y = 0; y < game.tiles[0].length; y++) {
            const tile = game.tiles[x][y];
            if (tile.zone === 'R' && tile.building) {
                const buildingLevel = tile.building.level || 1;
                const levelConfig = buildingLevels[buildingLevel] || buildingLevels[1];
                const capacity = levelConfig?.capacity || 20;
                const overflowCapacity = levelConfig?.overflowCapacity || (capacity + 5);
                
                residentials.push({
                    tile,
                    cap: capacity,
                    overflowCap: overflowCapacity
                });
            }
        }
    }
    
    let totalPop = game.pop;
    
    // Reset all building populations
    for (const res of residentials) {
        if (res.tile?.building) {
            res.tile.building.pop = 0;
        }
    }
    
    // Sort by capacity (largest first)
    residentials.sort((a, b) => b.cap - a.cap);
    
    // First pass: fill to normal capacity
    for (const res of residentials) {
        const assign = Math.min(res.cap, totalPop);
        if (res.tile?.building) {
            res.tile.building.pop = assign;
        }
        totalPop -= assign;
        if (totalPop <= 0) break;
    }
    
    // Second pass: allow overflow if needed
    if (totalPop > 0) {
        for (const res of residentials) {
            const currentPop = res.tile?.building?.pop || 0;
            const extraSpace = (res.overflowCap || res.cap) - currentPop;
            
            if (extraSpace > 0) {
                const assign = Math.min(extraSpace, totalPop);
                if (res.tile?.building) {
                    res.tile.building.pop = (res.tile.building.pop || 0) + assign;
                }
                totalPop -= assign;
                if (totalPop <= 0) break;
            }
        }
    }
    
    return totalPop; // Return remaining population (workers available)
}

/**
 * Assign workers to commercial and industrial buildings
 */
export function assignPopulationToZones(
    game: PopulationGameState,
    availablePop: number,
    commercialLevels?: LevelConfig[],
    industrialLevels?: LevelConfig[]
): void {
    const commercials: PopulatedBuilding[] = [];
    const industrials: PopulatedBuilding[] = [];
    
    // Check blds array for COM and IND buildings
    if (game.blds && game.blds.length > 0) {
        for (const bld of game.blds) {
            if (bld.t === 'COM') {
                const buildingLevel = bld.lvl || 1;
                const levelConfig = commercialLevels?.[buildingLevel];
                const capacity = levelConfig?.capacity || bld.capacity || (buildingLevel * 10);
                commercials.push({ bld, cap: capacity });
            }
            if (bld.t === 'IND') {
                const buildingLevel = bld.lvl || 1;
                const levelConfig = industrialLevels?.[buildingLevel];
                const capacity = levelConfig?.capacity || bld.capacity || (buildingLevel * 15);
                industrials.push({ bld, cap: capacity });
            }
        }
    }
    
    // Also check tiles for zone-based commercial/industrial
    for (let x = 0; x < game.tiles.length; x++) {
        for (let y = 0; y < game.tiles[0].length; y++) {
            const tile = game.tiles[x][y];
            
            if ((tile.zone === 'C') && tile.building) {
                const buildingLevel = tile.building.level || 1;
                const levelConfig = commercialLevels?.[buildingLevel];
                const capacity = levelConfig?.capacity || 10;
                commercials.push({ tile, cap: capacity });
            }
            
            if ((tile.zone === 'I') && tile.building) {
                const buildingLevel = tile.building.level || 1;
                const levelConfig = industrialLevels?.[buildingLevel];
                const capacity = levelConfig?.capacity || 10;
                industrials.push({ tile, cap: capacity });
            }
        }
    }
    
    // Reset all building populations
    for (const com of commercials) {
        if (com.bld) com.bld.pop = 0;
        if (com.tile?.building) com.tile.building.pop = 0;
    }
    for (const ind of industrials) {
        if (ind.bld) ind.bld.pop = 0;
        if (ind.tile?.building) ind.tile.building.pop = 0;
    }
    
    // Assign workers to commercial first
    for (const com of commercials) {
        const assign = Math.min(com.cap, availablePop);
        if (com.bld) com.bld.pop = assign;
        if (com.tile?.building) com.tile.building.pop = assign;
        availablePop -= assign;
        if (availablePop <= 0) break;
    }
    
    // Then industrial
    for (const ind of industrials) {
        const assign = Math.min(ind.cap, availablePop);
        if (ind.bld) ind.bld.pop = assign;
        if (ind.tile?.building) ind.tile.building.pop = assign;
        availablePop -= assign;
        if (availablePop <= 0) break;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORKFORCE CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate workforce distribution and needs
 */
export function calculateWorkforce(
    population: number,
    wellCount: number,
    roadTileCount: number,
    commercialCapacity: number,
    industrialCapacity: number
): WorkforceState {
    // Workers per infrastructure type
    const WORKERS_PER_WELL = 2;
    const WORKERS_PER_10_ROADS = 1;
    
    const wellsNeeded = wellCount * WORKERS_PER_WELL;
    const roadsNeeded = Math.ceil(roadTileCount / 10) * WORKERS_PER_10_ROADS;
    
    // Total workforce is population (simplified - could be % of pop)
    const total = population;
    
    // Assign workers in priority order
    const wellWorkers = Math.min(wellsNeeded, total);
    let remaining = total - wellWorkers;
    
    const roadWorkers = Math.min(roadsNeeded, remaining);
    remaining -= roadWorkers;
    
    const comWorkers = Math.min(commercialCapacity, remaining);
    remaining -= comWorkers;
    
    const indWorkers = Math.min(industrialCapacity, remaining);
    remaining -= indWorkers;
    
    const gatherers = remaining;
    
    // Calculate shortage
    const totalNeeded = wellsNeeded + roadsNeeded + commercialCapacity + industrialCapacity;
    const shortage = Math.max(0, totalNeeded - total);
    
    return {
        total,
        wellWorkers,
        roadWorkers,
        comWorkers,
        indWorkers,
        gatherers,
        wellsNeeded,
        roadsNeeded,
        comNeeded: commercialCapacity,
        indNeeded: industrialCapacity,
        shortage
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILDING VARIANT CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

/** State threshold configuration */
interface StateThreshold {
    min: number;
    max: number;
}

/**
 * Calculate building variant based on population/activity ratio
 * Returns 0-3 for abandoned/low/medium/high states
 */
export function calculateBuildingVariant(
    currentPop: number,
    capacity: number,
    stateThresholds?: StateThreshold[]
): number {
    if (capacity === 0) return 0;
    
    // If thresholds provided, use them
    if (stateThresholds && stateThresholds.length >= 4) {
        for (let i = stateThresholds.length - 1; i >= 0; i--) {
            const threshold = stateThresholds[i];
            if (currentPop >= threshold.min && currentPop <= threshold.max) {
                return i;
            }
        }
        // If below all thresholds, return 0 (abandoned)
        return 0;
    }
    
    // Default ratio-based calculation
    const ratio = currentPop / capacity;
    
    if (ratio === 0) return 0;      // Abandoned
    if (ratio <= 0.33) return 1;    // Low
    if (ratio <= 0.66) return 2;    // Medium
    return 3;                        // High
}

/**
 * Get variant for commercial/industrial based on activity ratio (0.0-1.0)
 */
export function calculateActivityVariant(
    activityRatio: number,
    stateThresholds?: StateThreshold[]
): number {
    if (stateThresholds && stateThresholds.length >= 4) {
        for (let i = stateThresholds.length - 1; i >= 0; i--) {
            const threshold = stateThresholds[i];
            if (activityRatio >= threshold.min && activityRatio <= threshold.max) {
                return i;
            }
        }
        return 0;
    }
    
    // Default thresholds
    if (activityRatio === 0) return 0;
    if (activityRatio <= 0.3) return 1;
    if (activityRatio <= 0.7) return 2;
    return 3;
}
