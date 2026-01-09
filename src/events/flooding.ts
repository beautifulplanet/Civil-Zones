/**
 * Civil Zones - Flooding System
 * Sea level changes and flood mechanics
 */

import type { 
    FloodResult, 
    FloodedBuilding, 
    GeologyState,
    SeaLevelConfig 
} from './types.js';

// ═══════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════

interface TileLike {
    type: string;
    originalType?: string;
    elevation: number;
    building?: { type?: string; pop?: number } | null;
    zone?: string | null;
    bld?: any;
    tree?: boolean;
    road?: boolean;
    stoneDeposit?: any;
    berry?: boolean;
}

interface BuildingLike {
    t: string;          // Type: 'WELL', 'COM', 'IND', 'RES'
    x: number;
    y: number;
    pop?: number;
}

interface PlayerLike {
    x: number;
    y: number;
}

interface ConfigLike {
    W: number;
    H: number;
    SEA_LEVEL_MIN?: number;
    SEA_LEVEL_MAX?: number;
    FLOOD_WARNING_MARGIN?: number;
}

interface GameLike {
    tiles: TileLike[][];
    blds: BuildingLike[];
    player: PlayerLike;
    pop: number;
    geology: GeologyState;
    wellCount?: number;
}

// ═══════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

/** Default sea level configuration */
export const DEFAULT_SEA_LEVEL_CONFIG: SeaLevelConfig = {
    SEA_LEVEL_MIN: 1.0,
    SEA_LEVEL_MAX: 6.0,
    FLOOD_WARNING_MARGIN: 1
};

// ═══════════════════════════════════════════════════════════════════
// SEA LEVEL HELPERS
// ═══════════════════════════════════════════════════════════════════

/** Get building size (1x1 or 2x2) */
function getBuildingSize(buildingType: string): number {
    if (buildingType === 'WELL' || buildingType === 'COM' || buildingType === 'IND') {
        return 1;
    }
    return 2; // RES and other buildings are 2x2
}

/** Check if a position is within a building's footprint */
function isWithinBuilding(
    x: number, 
    y: number, 
    building: BuildingLike
): boolean {
    const size = getBuildingSize(building.t);
    return x >= building.x && 
           x < building.x + size && 
           y >= building.y && 
           y < building.y + size;
}

// ═══════════════════════════════════════════════════════════════════
// FLOOD RISK ASSESSMENT
// ═══════════════════════════════════════════════════════════════════

/** Check if a tile is at flood risk */
export function isFloodRisk(
    elevation: number,
    currentSeaLevel: number,
    warningMargin: number = DEFAULT_SEA_LEVEL_CONFIG.FLOOD_WARNING_MARGIN
): 'safe' | 'warning' | 'danger' | 'flooding' {
    const diff = elevation - currentSeaLevel;
    
    if (diff < 0) return 'flooding';          // Already underwater
    if (diff <= warningMargin) return 'danger';  // Will flood soon
    if (diff <= warningMargin * 2) return 'warning'; // Could flood
    return 'safe';
}

/** Get elevation difference from sea level */
export function getElevationDiff(
    elevation: number,
    seaLevel: number
): number {
    return elevation - seaLevel;
}

/** Format elevation safety message */
export function formatElevationMessage(
    elevation: number,
    seaLevel: number
): string {
    const diff = getElevationDiff(elevation, seaLevel);
    if (diff < 0) {
        return 'FLOODING!';
    }
    return `+${diff.toFixed(1)} safe`;
}

// ═══════════════════════════════════════════════════════════════════
// FLOOD PROCESSING
// ═══════════════════════════════════════════════════════════════════

/** Apply sea level change and process flooding */
export function applySeaLevelChange(
    game: GameLike,
    config: ConfigLike,
    markDirty?: (x: number, y: number, radius: number) => void
): FloodResult {
    const seaLevel = game.geology.currentSeaLevel;
    let flooded = 0;
    let drained = 0;
    const buildingsLost: FloodedBuilding[] = [];
    let populationDrowned = 0;
    let wellsLost = 0;
    const bldsToRemove: number[] = [];
    let playerDrowned = false;
    
    for (let x = 0; x < config.W; x++) {
        for (let y = 0; y < config.H; y++) {
            const tile = game.tiles[x][y];
            
            // Skip tiles that are always water (deep ocean) or always land (mountains)
            if (tile.elevation <= 0 || tile.elevation >= 8) continue;
            
            // Check if tile should be underwater at current sea level
            // FRACTIONAL comparison means tiles flood gradually, not all at once!
            if (tile.elevation < seaLevel && tile.type !== 'WATER' && tile.type !== 'DEEP') {
                // FLOOD THIS TILE - DESTROY ALL STRUCTURES
                
                // Check for tile-based buildings first - KILL POPULATION IMMEDIATELY
                if (tile.building || tile.zone) {
                    if (tile.building && tile.building.pop) {
                        populationDrowned += tile.building.pop;
                    }
                    buildingsLost.push({
                        x, 
                        y, 
                        type: tile.building?.type || tile.zone || 'unknown',
                        pop: tile.building?.pop || 0
                    });
                }
                
                // Check for blds array buildings at this location
                if (game.blds) {
                    for (let i = 0; i < game.blds.length; i++) {
                        const b = game.blds[i];
                        if (isWithinBuilding(x, y, b)) {
                            if (!bldsToRemove.includes(i)) {
                                bldsToRemove.push(i);
                                if (b.t === 'WELL') wellsLost++;
                                if (b.t === 'RES' && b.pop) {
                                    populationDrowned += b.pop;
                                }
                            }
                        }
                    }
                }
                
                // Check if player is on this tile - instant death!
                if (game.player && game.player.x === x && game.player.y === y) {
                    populationDrowned += game.pop;
                    playerDrowned = true;
                }
                
                // DESTROY ALL STRUCTURES ON THIS TILE
                tile.type = 'WATER';
                tile.tree = false;
                tile.road = false;
                tile.building = null;
                tile.zone = null;
                tile.bld = null;
                tile.stoneDeposit = null;
                tile.berry = false;
                flooded++;
                
                if (markDirty) markDirty(x, y, 1);
            } 
            else if (tile.elevation >= seaLevel && (tile.type === 'WATER' || tile.type === 'DEEP')) {
                // DRAIN THIS TILE (was water, now above sea level)
                // Only drain shallow water tiles (not deep ocean which has elevation 0-1)
                if (tile.elevation > 1) {
                    tile.type = tile.originalType || 'SAND';
                    drained++;
                    if (markDirty) markDirty(x, y, 1);
                }
            }
        }
    }
    
    // Remove flooded buildings from blds array (in reverse order to maintain indices)
    if (bldsToRemove.length > 0) {
        bldsToRemove.sort((a, b) => b - a);
        for (const idx of bldsToRemove) {
            const removedBld = game.blds[idx];
            buildingsLost.push({
                x: removedBld.x, 
                y: removedBld.y, 
                type: removedBld.t
            });
            game.blds.splice(idx, 1);
        }
    }
    
    return {
        flooded,
        drained,
        buildingsLost,
        populationDrowned,
        wellsLost,
        playerDrowned
    };
}

// ═══════════════════════════════════════════════════════════════════
// FLOOD MESSAGE GENERATION
// ═══════════════════════════════════════════════════════════════════

/** Generate flood catastrophe message */
export function generateFloodMessage(
    populationDrowned: number,
    periodName: string
): { message: string; duration: number; severity: 'catastrophe' | 'severe' | 'minor' } {
    if (populationDrowned > 100) {
        return {
            message: `📰 CATASTROPHE! ${populationDrowned} perished in the great flood! The ${periodName} brought destruction. Where you build matters...`,
            duration: 8000,
            severity: 'catastrophe'
        };
    } else if (populationDrowned > 20) {
        return {
            message: `🌊💀 ${populationDrowned} drowned in rising waters! Some areas may be safer than others...`,
            duration: 6000,
            severity: 'severe'
        };
    } else {
        return {
            message: `🌊 ${populationDrowned} lost to rising waters. Perhaps higher ground would be wiser...`,
            duration: 5000,
            severity: 'minor'
        };
    }
}

/** Generate wells lost message */
export function generateWellsLostMessage(wellsLost: number): string {
    return `💧🌊 ${wellsLost} well${wellsLost > 1 ? 's' : ''} swallowed by the sea!`;
}

// ═══════════════════════════════════════════════════════════════════
// SEA LEVEL UPDATES
// ═══════════════════════════════════════════════════════════════════

/** Update sea level toward target */
export function updateSeaLevel(
    currentLevel: number,
    targetLevel: number,
    riseRate: number = 0.1,
    fallRate: number = 0.1,
    config: SeaLevelConfig = DEFAULT_SEA_LEVEL_CONFIG
): number {
    if (currentLevel < targetLevel) {
        // Water rising
        return Math.min(config.SEA_LEVEL_MAX, currentLevel + riseRate);
    } else if (currentLevel > targetLevel) {
        // Water receding
        return Math.max(config.SEA_LEVEL_MIN, currentLevel - fallRate);
    }
    return currentLevel;
}

/** Check if sea level is rising */
export function isSeaLevelRising(
    currentLevel: number,
    targetLevel: number
): boolean {
    return currentLevel < targetLevel;
}

/** Get sea level change direction */
export function getSeaLevelDirection(
    currentLevel: number,
    targetLevel: number
): 'rising' | 'falling' | 'stable' {
    if (currentLevel < targetLevel) return 'rising';
    if (currentLevel > targetLevel) return 'falling';
    return 'stable';
}

// ═══════════════════════════════════════════════════════════════════
// FLOOD STATISTICS
// ═══════════════════════════════════════════════════════════════════

/** Update geology stats after flooding */
export function updateGeologyStats(
    geology: GeologyState,
    result: FloodResult
): GeologyState {
    return {
        ...geology,
        tilesFlooded: geology.tilesFlooded + result.flooded,
        tilesDrained: geology.tilesDrained + result.drained,
        populationDrowned: geology.populationDrowned + result.populationDrowned
    };
}

/** Create initial geology state */
export function createInitialGeologyState(
    initialSeaLevel: number = DEFAULT_SEA_LEVEL_CONFIG.SEA_LEVEL_MIN
): GeologyState {
    return {
        currentSeaLevel: initialSeaLevel,
        tilesFlooded: 0,
        tilesDrained: 0,
        populationDrowned: 0
    };
}
