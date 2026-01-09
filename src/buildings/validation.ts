/**
 * Civil Zones - Building Validation
 * Validates building placement and costs
 */

import type { 
    BuildingTool, 
    Building, 
    BuildingSize,
    ElevationCostInfo,
    TileElevationInfo 
} from './types.js';
import { BUILDING_SIZES, SMALL_BUILDINGS, STORAGE_PIT_TYPES } from './types.js';

// ═══════════════════════════════════════════════════════════════════
// TILE INTERFACE (minimal for validation)
// ═══════════════════════════════════════════════════════════════════

interface TileLike {
    type: string;
    explored?: boolean;
    zone?: string | null;
    building?: any;
    road?: boolean;
    stoneDeposit?: any;
    elevation?: number;
}

interface GameLike {
    tiles: TileLike[][];
    blds: Building[];
    food: number;
    wood: number;
    stone?: number;
    metal?: number;
    gold?: number;
    pop?: number;
    res?: number;
    simcityMode?: boolean;
    hasClanChief?: boolean;
    hasDock?: boolean;
}

interface ConfigLike {
    W: number;
    H: number;
    COST?: { ROAD?: number; WELL?: number; BULL?: number };
    BUILDING_DB?: Record<string, { size?: BuildingSize; cost?: any }>;
    ELEVATION_SYSTEM?: {
        ENABLED?: boolean;
        COST_THRESHOLD?: number;
        COST_INCREASE_PER_LEVEL?: number;
    };
}

// ═══════════════════════════════════════════════════════════════════
// SIZE HELPERS
// ═══════════════════════════════════════════════════════════════════

/** Get building size */
export function getBuildingSize(tool: BuildingTool): BuildingSize {
    return BUILDING_SIZES[tool] || { w: 1, h: 1 };
}

/** Check if building is small (1x1) */
export function isSmallBuilding(tool: BuildingTool): boolean {
    return SMALL_BUILDINGS.includes(tool);
}

/** Get existing building size from blds array */
export function getExistingBuildingSize(
    building: Building,
    buildingDB?: Record<string, { size?: BuildingSize }>
): BuildingSize {
    // Check config first
    if (buildingDB?.[building.t]?.size) {
        return buildingDB[building.t].size!;
    }
    
    // Default sizes by type
    if (isSmallBuilding(building.t as BuildingTool)) {
        return { w: 1, h: 1 };
    }
    if (building.t === 'DOCK') {
        return { w: 3, h: 2 };
    }
    return { w: 2, h: 2 };
}

// ═══════════════════════════════════════════════════════════════════
// PLACEMENT VALIDATION
// ═══════════════════════════════════════════════════════════════════

/** Check if tile type blocks building */
export function isTileBlocked(tile: TileLike): boolean {
    const t = tile.type;
    return t === 'WATER' || t === 'DEEP' || t === 'RIVER' || t === 'STONE';
}

/** Check if tile is unexplored */
export function isUnexplored(tile: TileLike): boolean {
    return !tile.explored;
}

/** Check if tile has existing structure */
export function hasExistingStructure(tile: TileLike): boolean {
    return !!(tile.zone || tile.building || tile.road);
}

/** Check bounds */
export function isInBounds(
    gx: number, 
    gy: number, 
    width: number, 
    height: number,
    mapWidth: number,
    mapHeight: number
): boolean {
    return gx >= 0 && gy >= 0 && (gx + width) <= mapWidth && (gy + height) <= mapHeight;
}

/** Check if position overlaps with existing buildings */
export function overlapsBuildings(
    gx: number,
    gy: number,
    width: number,
    height: number,
    buildings: Building[],
    buildingDB?: Record<string, { size?: BuildingSize }>
): boolean {
    for (const b of buildings) {
        const bSize = getExistingBuildingSize(b, buildingDB);
        
        // AABB overlap check
        if (gx < b.x + bSize.w && gx + width > b.x &&
            gy < b.y + bSize.h && gy + height > b.y) {
            return true;
        }
    }
    return false;
}

/** Validate building placement */
export function isValidPlacement(
    game: GameLike,
    config: ConfigLike,
    gx: number,
    gy: number,
    tool: BuildingTool
): { valid: boolean; reason?: string } {
    const size = getBuildingSize(tool);
    
    // Bounds check
    if (!isInBounds(gx, gy, size.w, size.h, config.W, config.H)) {
        return { valid: false, reason: 'Out of bounds' };
    }
    
    // Check all tiles in footprint
    for (let x = gx; x < gx + size.w; x++) {
        for (let y = gy; y < gy + size.h; y++) {
            const tile = game.tiles[x][y];
            
            if (isTileBlocked(tile)) {
                return { valid: false, reason: "Can't build on water/stone" };
            }
            
            if (isUnexplored(tile)) {
                return { valid: false, reason: 'Cannot build in fog - explore first!' };
            }
            
            // Stone deposits block non-industrial
            if (tile.stoneDeposit && tool !== 'IND') {
                return { valid: false, reason: 'Stone deposit blocking' };
            }
            
            if (hasExistingStructure(tile)) {
                return { valid: false, reason: 'Space occupied' };
            }
        }
    }
    
    // Check building overlap
    if (overlapsBuildings(gx, gy, size.w, size.h, game.blds, config.BUILDING_DB)) {
        return { valid: false, reason: 'Building overlap' };
    }
    
    return { valid: true };
}

/** Validate road placement (single tile) */
export function isValidRoadPlacement(
    game: GameLike,
    config: ConfigLike,
    rx: number,
    ry: number
): { valid: boolean; reason?: string } {
    // Bounds check
    if (rx < 0 || rx >= config.W || ry < 0 || ry >= config.H) {
        return { valid: false, reason: 'Out of bounds' };
    }
    
    const tile = game.tiles[rx]?.[ry];
    if (!tile) {
        return { valid: false, reason: 'Invalid tile' };
    }
    
    if (isTileBlocked(tile)) {
        return { valid: false, reason: "Can't build on water/stone" };
    }
    
    if (isUnexplored(tile)) {
        return { valid: false, reason: 'Cannot build in fog - explore first!' };
    }
    
    if (tile.stoneDeposit) {
        return { valid: false, reason: 'Stone deposit blocking' };
    }
    
    if (tile.road) {
        return { valid: false, reason: 'Road already exists' };
    }
    
    return { valid: true };
}

// ═══════════════════════════════════════════════════════════════════
// COST VALIDATION
// ═══════════════════════════════════════════════════════════════════

/** Cost requirement */
export interface CostRequirement {
    food?: number;
    wood?: number;
    stone?: number;
    metal?: number;
    gold?: number;
}

/** Check if player can afford cost */
export function canAfford(game: GameLike, cost: CostRequirement, simcityMode: boolean = false): boolean {
    if (simcityMode) {
        // SimCity mode uses generic "res" funds
        const totalCost = (cost.food || 0) + (cost.wood || 0) + (cost.stone || 0) + (cost.metal || 0);
        return (game.res || 0) >= totalCost;
    }
    
    if (cost.food && game.food < cost.food) return false;
    if (cost.wood && game.wood < cost.wood) return false;
    if (cost.stone && (game.stone || 0) < cost.stone) return false;
    if (cost.metal && (game.metal || 0) < cost.metal) return false;
    if (cost.gold && (game.gold || 0) < cost.gold) return false;
    
    return true;
}

/** Get missing resource for cost */
export function getMissingResource(game: GameLike, cost: CostRequirement): string | null {
    if (cost.food && game.food < cost.food) return `Need ${cost.food} Food`;
    if (cost.wood && game.wood < cost.wood) return `Need ${cost.wood} Wood`;
    if (cost.stone && (game.stone || 0) < cost.stone) return `Need ${cost.stone} Stone`;
    if (cost.metal && (game.metal || 0) < cost.metal) return `Need ${cost.metal} Metal`;
    if (cost.gold && (game.gold || 0) < cost.gold) return `Need ${cost.gold} Gold`;
    return null;
}

/** Deduct cost from game resources */
export function deductCost(game: GameLike, cost: CostRequirement, simcityMode: boolean = false): void {
    if (simcityMode) {
        const totalCost = (cost.food || 0) + (cost.wood || 0) + (cost.stone || 0) + (cost.metal || 0);
        game.res = (game.res || 0) - totalCost;
    } else {
        if (cost.food) game.food -= cost.food;
        if (cost.wood) game.wood -= cost.wood;
        if (cost.stone) game.stone = (game.stone || 0) - cost.stone;
        if (cost.metal) game.metal = (game.metal || 0) - cost.metal;
        if (cost.gold) game.gold = (game.gold || 0) - cost.gold;
    }
}

// ═══════════════════════════════════════════════════════════════════
// ELEVATION COST
// ═══════════════════════════════════════════════════════════════════

/** Get elevation cost multiplier */
export function getElevationCostMultiplier(
    tile: TileLike,
    config?: ConfigLike
): number {
    if (!config?.ELEVATION_SYSTEM?.ENABLED) return 1.0;
    
    const threshold = config.ELEVATION_SYSTEM.COST_THRESHOLD || 4;
    const increasePerLevel = config.ELEVATION_SYSTEM.COST_INCREASE_PER_LEVEL || 0.10;
    const elevation = Math.floor(tile.elevation || 0);
    
    if (elevation < threshold) return 1.0;
    
    // Each elevation above threshold adds cost
    const levelsAbove = elevation - threshold;
    return 1.0 + (levelsAbove * increasePerLevel);
}

/** Get elevation cost info */
export function getElevationCostInfo(
    tile: TileLike,
    config?: ConfigLike
): ElevationCostInfo {
    const multiplier = getElevationCostMultiplier(tile, config);
    const elevation = Math.floor(tile.elevation || 0);
    
    return {
        multiplier,
        text: '', // Mystery: player doesn't know why some areas cost more
        elevation
    };
}

/** Apply elevation multiplier to cost */
export function applyElevationCost(
    baseCost: CostRequirement,
    multiplier: number
): CostRequirement {
    return {
        food: baseCost.food ? Math.ceil(baseCost.food * multiplier) : undefined,
        wood: baseCost.wood ? Math.ceil(baseCost.wood * multiplier) : undefined,
        stone: baseCost.stone ? Math.ceil(baseCost.stone * multiplier) : undefined,
        metal: baseCost.metal ? Math.ceil(baseCost.metal * multiplier) : undefined,
        gold: baseCost.gold // Gold not affected by elevation
    };
}

// ═══════════════════════════════════════════════════════════════════
// TILE ELEVATION INFO
// ═══════════════════════════════════════════════════════════════════

/** Get tile elevation info for UI */
export function getTileElevationInfo(
    tile: TileLike,
    seaLevel: number
): TileElevationInfo {
    const elevation = tile.elevation || 0;
    
    let status: TileElevationInfo['status'] = 'safe';
    let description = '';
    
    if (elevation < seaLevel) {
        status = 'underwater';
        description = 'Underwater';
    } else if (elevation < seaLevel + 1) {
        status = 'danger';
        description = 'Flood Risk! (coastal)';
    } else if (elevation < seaLevel + 2) {
        status = 'warning';
        description = 'Low ground';
    } else if (elevation >= 8) {
        status = 'high';
        description = 'Mountain peaks';
    } else {
        status = 'safe';
        description = 'Safe elevation';
    }
    
    return {
        elevation,
        seaLevel: Math.floor(seaLevel),
        status,
        description,
        heightAboveSea: elevation - Math.floor(seaLevel)
    };
}

// ═══════════════════════════════════════════════════════════════════
// PREREQUISITE CHECKS
// ═══════════════════════════════════════════════════════════════════

/** Check milestone prerequisites */
export function checkMilestonePrereq(
    game: GameLike,
    tool: BuildingTool
): { met: boolean; reason?: string } {
    if (tool === 'DOCK') {
        if (!game.hasClanChief) {
            return { met: false, reason: 'Build Clan Chief\'s Hut first!' };
        }
        if (game.hasDock) {
            return { met: false, reason: 'First Dock already built!' };
        }
    }
    
    if (tool === 'CLAN_CHIEF') {
        if (game.hasClanChief) {
            return { met: false, reason: 'Clan Chief\'s Hut already built!' };
        }
    }
    
    return { met: true };
}

/** Check population requirement */
export function checkPopulationReq(
    game: GameLike,
    requiredPop: number
): { met: boolean; reason?: string } {
    if ((game.pop || 0) < requiredPop) {
        return { met: false, reason: `Need ${requiredPop} Population` };
    }
    return { met: true };
}
