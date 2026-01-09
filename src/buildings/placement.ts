/**
 * Civil Zones - Building Placement
 * Functions for placing buildings and roads
 */

import type { BuildingTool, Building, ZoneTile, BuildingSize } from './types.js';
import { BUILDING_SIZES } from './types.js';
import { calculateZoneBonus, getZoneBonusDescription } from './zones.js';

// ═══════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════

interface TileLike {
    type: string;
    road?: boolean;
    tree?: boolean;
    zone?: string | null;
    building?: ZoneTile | null;
    entity?: any;
    explored?: boolean;
    stoneDeposit?: any;
    elevation?: number;
}

interface ConfigLike {
    W: number;
    H: number;
    COST: Record<string, number>;
    BUILDING_LEVELS?: Array<{
        name: string;
        food: number;
        wood?: number;
        stone?: number;
        capacity: number;
    }>;
    ZONE_BONUSES?: any;
}

interface GameLike {
    tiles: TileLike[][];
    blds: Building[];
    food: number;
    wood: number;
    stone: number;
    res?: number;
    simcityMode?: boolean;
    roadTileCount?: number;
    year?: number;
    lastRoadPos?: { x: number; y: number } | null;
    lockedResources?: {
        residential?: boolean;
        commercial?: boolean;
        industrial?: boolean;
    };
}

interface PlacementResult {
    success: boolean;
    message: string;
    cost?: {
        food: number;
        wood: number;
        stone: number;
    };
    bonusText?: string;
}

// ═══════════════════════════════════════════════════════════════════
// SIMPLE VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════════

/** Check if tile blocks construction */
function isTileBlocked(tile: TileLike): boolean {
    return tile.type === 'WATER' || 
           tile.type === 'DEEP' || 
           tile.type === 'RIVER' || 
           tile.type === 'STONE';
}

/** Check if tile has existing structure */
function hasExistingStructure(tile: TileLike): boolean {
    return !!(tile.zone || tile.building || tile.road);
}

/** Simple validation for single tile placement */
function isValidTilePlacement(tile: TileLike): boolean {
    if (isTileBlocked(tile)) return false;
    if (!tile.explored) return false;
    if (tile.zone || tile.building) return false;
    if (tile.road) return false;
    return true;
}

/** Simple validation for road placement */
function isValidRoadTilePlacement(tile: TileLike): boolean {
    if (isTileBlocked(tile)) return false;
    if (!tile.explored) return false;
    if (tile.stoneDeposit) return false;
    if (tile.road) return false;
    return true;
}

/** Get elevation cost multiplier */
function getElevationCostMult(tile: TileLike, threshold: number = 4, rate: number = 0.1): number {
    const elevation = tile.elevation ?? 0;
    if (elevation <= threshold) return 1.0;
    return 1.0 + (elevation - threshold) * rate;
}

// ═══════════════════════════════════════════════════════════════════
// BRESENHAM LINE ALGORITHM
// ═══════════════════════════════════════════════════════════════════

export interface Point {
    x: number;
    y: number;
}

/** Get tiles in a line between two points (Bresenham's algorithm) */
export function getLineTiles(x0: number, y0: number, x1: number, y1: number): Point[] {
    const tiles: Point[] = [];
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    
    let cx = x0;
    let cy = y0;
    
    while (true) {
        tiles.push({ x: cx, y: cy });
        if (cx === x1 && cy === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; cx += sx; }
        if (e2 < dx) { err += dx; cy += sy; }
    }
    return tiles;
}

// ═══════════════════════════════════════════════════════════════════
// ROAD PLACEMENT
// ═══════════════════════════════════════════════════════════════════

/** Place a single road tile */
export function placeRoadTile(
    game: GameLike,
    config: ConfigLike,
    x: number,
    y: number,
    showError: boolean = false
): PlacementResult {
    // Bounds check
    if (x < 0 || x >= config.W || y < 0 || y >= config.H) {
        return { success: false, message: 'Out of bounds' };
    }
    
    const tile = game.tiles[x]?.[y];
    if (!tile) {
        return { success: false, message: 'Invalid tile' };
    }
    
    // Validation
    if (!isValidRoadTilePlacement(tile)) {
        if (tile.type === 'WATER' || tile.type === 'DEEP' || tile.type === 'RIVER' || tile.type === 'STONE') {
            return { success: false, message: "Can't build on water/stone" };
        }
        if (!tile.explored) {
            return { success: false, message: "Cannot build in fog - explore first!" };
        }
        if (tile.stoneDeposit) {
            return { success: false, message: 'Stone deposit blocking' };
        }
        if (tile.road) {
            return { success: false, message: 'Road already exists' };
        }
        return { success: false, message: 'Invalid spot for road' };
    }
    
    // Cost check
    const cost = config.COST.ROAD || 1;
    if (game.simcityMode && (game.res || 0) < cost) {
        return { success: false, message: `Need $${cost} funds` };
    } else if (!game.simcityMode && game.food < cost) {
        return { success: false, message: `Need ${cost} food` };
    }
    
    // Place the road
    tile.road = true;
    tile.tree = false;
    if (tile.entity) {
        tile.entity = null; // Roads destroy resources
    }
    
    game.roadTileCount = (game.roadTileCount || 0) + 1;
    
    // Deduct cost
    if (game.simcityMode) {
        game.res = (game.res || 0) - cost;
    } else {
        game.food -= cost;
    }
    
    return { success: true, message: '🛣️ Road built', cost: { food: cost, wood: 0, stone: 0 } };
}

/** Place roads in a line between two points */
export function placeRoadLine(
    game: GameLike,
    config: ConfigLike,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
): { placed: number; total: number; message: string } {
    const tiles = getLineTiles(fromX, fromY, toX, toY);
    let placed = 0;
    
    for (const point of tiles) {
        const result = placeRoadTile(game, config, point.x, point.y, false);
        if (result.success) {
            placed++;
        }
    }
    
    const message = placed > 0 
        ? `🛣️ ${placed} road tiles placed`
        : '❌ No roads placed';
    
    return { placed, total: tiles.length, message };
}

// ═══════════════════════════════════════════════════════════════════
// ZONE PLACEMENT
// ═══════════════════════════════════════════════════════════════════

/** Place a residential zone */
export function placeResidential(
    game: GameLike,
    config: ConfigLike,
    gx: number,
    gy: number,
    selectedLevel: number = 0
): PlacementResult {
    // Validation
    const tile = game.tiles[gx]?.[gy];
    if (!tile) {
        return { success: false, message: '❌ Invalid tile' };
    }
    
    if (!isValidTilePlacement(tile)) {
        if (tile.type === 'WATER' || tile.type === 'DEEP' || tile.type === 'RIVER') {
            return { success: false, message: "❌ Can't build on water!" };
        }
        if (tile.type === 'STONE') {
            return { success: false, message: "❌ Can't build on stone mountains!" };
        }
        if (tile.zone || tile.building) {
            return { success: false, message: '❌ Tile already has a building!' };
        }
        if (tile.road) {
            return { success: false, message: "❌ Can't build on roads!" };
        }
        return { success: false, message: '❌ Invalid Spot' };
    }
    
    // Get level config
    const levelConfig = config.BUILDING_LEVELS?.[selectedLevel];
    if (!levelConfig) {
        return { success: false, message: '❌ Invalid building level!' };
    }
    
    // Calculate elevation cost
    const elevCostMult = getElevationCostMult(tile, 4, 0.1);
    const adjFoodCost = Math.ceil(levelConfig.food * elevCostMult);
    const adjWoodCost = Math.ceil((levelConfig.wood || 0) * elevCostMult);
    const adjStoneCost = Math.ceil((levelConfig.stone || 0) * elevCostMult);
    
    // Check resources
    if (game.food < adjFoodCost) {
        return { success: false, message: `Need ${adjFoodCost} Food for ${levelConfig.name}` };
    }
    if (adjWoodCost > 0 && game.wood < adjWoodCost) {
        return { success: false, message: `Need ${adjWoodCost} Wood for ${levelConfig.name}` };
    }
    if (adjStoneCost > 0 && game.stone < adjStoneCost) {
        return { success: false, message: `Need ${adjStoneCost} Stone for ${levelConfig.name}` };
    }
    
    // Deduct resources
    game.food -= adjFoodCost;
    if (adjWoodCost > 0) game.wood -= adjWoodCost;
    if (adjStoneCost > 0) game.stone -= adjStoneCost;
    
    // Calculate zone bonus
    const zoneBonus = calculateZoneBonus(game, config, gx, gy, 'R');
    const bonusInfo = getZoneBonusDescription(game, config, gx, gy, 'R');
    
    // Place the zone
    tile.zone = 'R';
    tile.building = {
        level: selectedLevel,
        growth: 0,
        desirability: zoneBonus,
        age: 0,
        lastBirthYear: game.year || 0,
        pop: 0,
        capacity: levelConfig.capacity,
        variant: 1
    };
    tile.tree = false;
    
    return {
        success: true,
        message: `🏠 ${levelConfig.name} built! ${bonusInfo.text} Cap: ${levelConfig.capacity}`,
        cost: { food: adjFoodCost, wood: adjWoodCost, stone: adjStoneCost },
        bonusText: bonusInfo.text
    };
}

/** Place a commercial zone */
export function placeCommercial(
    game: GameLike,
    config: ConfigLike,
    gx: number,
    gy: number,
    selectedLevel: number = 0
): PlacementResult {
    const tile = game.tiles[gx]?.[gy];
    if (!tile) {
        return { success: false, message: '❌ Invalid tile' };
    }
    
    if (!isValidTilePlacement(tile)) {
        return { success: false, message: '❌ Invalid placement' };
    }
    
    // Get building data
    const buildingData = config.BUILDING_LEVELS?.[selectedLevel];
    if (!buildingData) {
        return { success: false, message: '❌ Invalid building level!' };
    }
    
    // Calculate elevation cost
    const elevCostMult = getElevationCostMult(tile, 4, 0.1);
    const adjFoodCost = Math.ceil(buildingData.food * elevCostMult);
    const adjWoodCost = Math.ceil((buildingData.wood || 0) * elevCostMult);
    const adjStoneCost = Math.ceil((buildingData.stone || 0) * elevCostMult);
    
    // Check resources
    if (game.food < adjFoodCost) {
        return { success: false, message: `Need ${adjFoodCost} Food` };
    }
    if (adjWoodCost > 0 && game.wood < adjWoodCost) {
        return { success: false, message: `Need ${adjWoodCost} Wood` };
    }
    if (adjStoneCost > 0 && game.stone < adjStoneCost) {
        return { success: false, message: `Need ${adjStoneCost} Stone` };
    }
    
    // Calculate zone bonus
    const zoneBonus = calculateZoneBonus(game, config, gx, gy, 'C');
    const bonusInfo = getZoneBonusDescription(game, config, gx, gy, 'C');
    
    // Deduct resources
    game.food -= adjFoodCost;
    if (adjWoodCost > 0) game.wood -= adjWoodCost;
    if (adjStoneCost > 0) game.stone -= adjStoneCost;
    
    // Clear tree and place
    tile.tree = false;
    
    game.blds.push({
        t: 'COM',
        x: gx,
        y: gy,
        lvl: selectedLevel,
        efficiency: zoneBonus,
        age: 0,
        variant: 1
    });
    
    let costStr = `-${adjFoodCost} food, -${adjWoodCost} wood`;
    if (adjStoneCost > 0) costStr += `, -${adjStoneCost} stone`;
    
    return {
        success: true,
        message: `🏪 ${buildingData.name} built! ${bonusInfo.text} (${costStr})`,
        cost: { food: adjFoodCost, wood: adjWoodCost, stone: adjStoneCost },
        bonusText: bonusInfo.text
    };
}

/** Place an industrial zone */
export function placeIndustrial(
    game: GameLike,
    config: ConfigLike,
    gx: number,
    gy: number,
    selectedLevel: number = 0
): PlacementResult {
    const tile = game.tiles[gx]?.[gy];
    if (!tile) {
        return { success: false, message: '❌ Invalid tile' };
    }
    
    if (!isValidTilePlacement(tile)) {
        return { success: false, message: '❌ Invalid placement' };
    }
    
    // Get building data
    const buildingData = config.BUILDING_LEVELS?.[selectedLevel];
    if (!buildingData) {
        return { success: false, message: '❌ Invalid building level!' };
    }
    
    // Calculate elevation cost
    const elevCostMult = getElevationCostMult(tile, 4, 0.1);
    const adjFoodCost = Math.ceil(buildingData.food * elevCostMult);
    const adjWoodCost = Math.ceil((buildingData.wood || 0) * elevCostMult);
    const adjStoneCost = Math.ceil((buildingData.stone || 0) * elevCostMult);
    
    // Check resources
    if (game.food < adjFoodCost) {
        return { success: false, message: `Need ${adjFoodCost} Food` };
    }
    if (adjWoodCost > 0 && game.wood < adjWoodCost) {
        return { success: false, message: `Need ${adjWoodCost} Wood` };
    }
    if (adjStoneCost > 0 && game.stone < adjStoneCost) {
        return { success: false, message: `Need ${adjStoneCost} Stone` };
    }
    
    // Calculate zone bonus
    const zoneBonus = calculateZoneBonus(game, config, gx, gy, 'I');
    const bonusInfo = getZoneBonusDescription(game, config, gx, gy, 'I');
    
    // Deduct resources
    game.food -= adjFoodCost;
    if (adjWoodCost > 0) game.wood -= adjWoodCost;
    if (adjStoneCost > 0) game.stone -= adjStoneCost;
    
    // Clear tree and place
    tile.tree = false;
    
    game.blds.push({
        t: 'IND',
        x: gx,
        y: gy,
        lvl: selectedLevel,
        efficiency: zoneBonus,
        age: 0,
        variant: 1
    });
    
    let costStr = `-${adjFoodCost} food, -${adjWoodCost} wood`;
    if (adjStoneCost > 0) costStr += `, -${adjStoneCost} stone`;
    
    return {
        success: true,
        message: `🏭 ${buildingData.name} built! ${bonusInfo.text} (${costStr})`,
        cost: { food: adjFoodCost, wood: adjWoodCost, stone: adjStoneCost },
        bonusText: bonusInfo.text
    };
}

// ═══════════════════════════════════════════════════════════════════
// SPECIAL BUILDINGS
// ═══════════════════════════════════════════════════════════════════

/** Place a well (1x1 building) */
export function placeWell(
    game: GameLike,
    config: ConfigLike,
    gx: number,
    gy: number
): PlacementResult {
    const tile = game.tiles[gx]?.[gy];
    if (!tile) {
        return { success: false, message: '❌ Invalid tile' };
    }
    
    if (!isValidTilePlacement(tile)) {
        return { success: false, message: '❌ Invalid placement' };
    }
    
    const cost = config.COST.WELL || 5;
    if (game.food < cost) {
        return { success: false, message: `Need ${cost} Food for Well` };
    }
    
    game.food -= cost;
    tile.tree = false;
    
    game.blds.push({
        t: 'WELL',
        x: gx,
        y: gy
    });
    
    return {
        success: true,
        message: `💧 Well built! (-${cost} food)`,
        cost: { food: cost, wood: 0, stone: 0 }
    };
}

/** Place a 2x2 building (Chief's Hut, Storage, etc.) */
export function placeLargeBuilding(
    game: GameLike,
    config: ConfigLike,
    gx: number,
    gy: number,
    buildingType: BuildingTool,
    foodCost: number,
    woodCost: number = 0,
    stoneCost: number = 0
): PlacementResult {
    // Check all 4 tiles
    for (let dx = 0; dx < 2; dx++) {
        for (let dy = 0; dy < 2; dy++) {
            const tx = gx + dx;
            const ty = gy + dy;
            if (tx >= config.W || ty >= config.H) {
                return { success: false, message: '❌ Building would extend beyond map!' };
            }
            const tile = game.tiles[tx]?.[ty];
            if (!tile || !isValidTilePlacement(tile)) {
                return { success: false, message: '❌ Invalid placement for one or more tiles!' };
            }
        }
    }
    
    // Check resources
    if (game.food < foodCost) {
        return { success: false, message: `Need ${foodCost} Food` };
    }
    if (woodCost > 0 && game.wood < woodCost) {
        return { success: false, message: `Need ${woodCost} Wood` };
    }
    if (stoneCost > 0 && game.stone < stoneCost) {
        return { success: false, message: `Need ${stoneCost} Stone` };
    }
    
    // Deduct resources
    game.food -= foodCost;
    if (woodCost > 0) game.wood -= woodCost;
    if (stoneCost > 0) game.stone -= stoneCost;
    
    // Clear trees on all 4 tiles
    for (let dx = 0; dx < 2; dx++) {
        for (let dy = 0; dy < 2; dy++) {
            game.tiles[gx + dx][gy + dy].tree = false;
        }
    }
    
    game.blds.push({
        t: buildingType,
        x: gx,
        y: gy
    });
    
    let costStr = `-${foodCost} food`;
    if (woodCost > 0) costStr += `, -${woodCost} wood`;
    if (stoneCost > 0) costStr += `, -${stoneCost} stone`;
    
    return {
        success: true,
        message: `${buildingType} built! (${costStr})`,
        cost: { food: foodCost, wood: woodCost, stone: stoneCost }
    };
}

// ═══════════════════════════════════════════════════════════════════
// DEMOLITION
// ═══════════════════════════════════════════════════════════════════

interface DemolishResult {
    success: boolean;
    message: string;
    refund?: {
        food: number;
        wood: number;
        stone: number;
    };
}

/** Demolish building at position */
export function demolish(
    game: GameLike,
    config: ConfigLike,
    gx: number,
    gy: number
): DemolishResult {
    const tile = game.tiles[gx]?.[gy];
    if (!tile) {
        return { success: false, message: 'Invalid tile' };
    }
    
    // Check for road
    if (tile.road) {
        tile.road = false;
        game.roadTileCount = Math.max(0, (game.roadTileCount || 0) - 1);
        return { success: true, message: '🛣️ Road demolished' };
    }
    
    // Check for buildings in blds array
    let bldHit = -1;
    for (let i = 0; i < game.blds.length; i++) {
        const b = game.blds[i];
        // COM, IND, WELL are 1x1, others are 2x2
        const bz = (b.t === 'WELL' || b.t === 'COM' || b.t === 'IND') ? 1 : 2;
        if (gx >= b.x && gx < b.x + bz && gy >= b.y && gy < b.y + bz) {
            bldHit = i;
            break;
        }
    }
    
    if (bldHit !== -1) {
        const removedBld = game.blds[bldHit];
        game.blds.splice(bldHit, 1);
        return { success: true, message: `🔨 ${removedBld.t} demolished` };
    }
    
    // Check for zoned buildings
    if (tile.zone || tile.building) {
        const bld = tile.building;
        let refund = { food: 0, wood: 0, stone: 0 };
        
        // 10% salvage rate
        if (bld && bld.level !== undefined && config.BUILDING_LEVELS) {
            const levelConfig = config.BUILDING_LEVELS[bld.level];
            if (levelConfig) {
                const refundRate = 0.10;
                refund.food = Math.floor(levelConfig.food * refundRate);
                refund.wood = Math.floor((levelConfig.wood || 0) * refundRate);
                refund.stone = Math.floor((levelConfig.stone || 0) * refundRate);
                
                game.food += refund.food;
                game.wood += refund.wood;
                game.stone += refund.stone;
            }
        }
        
        tile.zone = null;
        tile.building = null;
        
        const hasRefund = refund.food > 0 || refund.wood > 0 || refund.stone > 0;
        if (hasRefund) {
            const parts: string[] = [];
            if (refund.food > 0) parts.push(`${refund.food} food`);
            if (refund.wood > 0) parts.push(`${refund.wood} wood`);
            if (refund.stone > 0) parts.push(`${refund.stone} stone`);
            return { 
                success: true, 
                message: `♻️ Salvaged 10%: ${parts.join(', ')}`,
                refund
            };
        }
        
        return { success: true, message: '🔨 Demolished (no salvage value)' };
    }
    
    return { success: false, message: 'Nothing to demolish here' };
}

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/** Get building size for a type */
export function getBuildingSize(buildingType: string): BuildingSize {
    const key = buildingType.toUpperCase() as BuildingTool;
    return BUILDING_SIZES[key] || { w: 1, h: 1 };
}

/** Check if position overlaps with existing building */
export function checkBuildingOverlap(
    blds: Building[],
    gx: number,
    gy: number,
    width: number = 1,
    height: number = 1
): Building | null {
    for (const b of blds) {
        const bSize = getBuildingSize(b.t);
        // Check if rectangles overlap
        if (gx < b.x + bSize.w && gx + width > b.x &&
            gy < b.y + bSize.h && gy + height > b.y) {
            return b;
        }
    }
    return null;
}
