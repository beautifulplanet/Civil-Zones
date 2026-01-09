/**
 * Civil Zones - Building Types
 * Type definitions for buildings and zones
 */

// ═══════════════════════════════════════════════════════════════════
// BUILDING TYPES
// ═══════════════════════════════════════════════════════════════════

/** Building tool/type identifier */
export type BuildingTool = 
    | 'RES'           // Residential zone
    | 'COM'           // Commercial zone
    | 'IND'           // Industrial zone
    | 'ROAD'          // Road/path
    | 'WELL'          // Water well
    | 'CHIEF'         // Chief's Hut (2x2)
    | 'CLAN_CHIEF'    // Clan Chief's Hut (2x2, milestone)
    | 'DOCK'          // Dock (3x2, milestone)
    | 'BASKET'        // Basket storage (2x2)
    | 'POTTERY'       // Pottery storage (2x2)
    | 'GRANARY'       // Granary/Resource Pit (2x2)
    | 'PALACE'        // Palace (2x2)
    | 'BULL';         // Bulldozer

/** Zone type identifier */
export type ZoneType = 'R' | 'C' | 'I';

/** Building size configuration */
export interface BuildingSize {
    w: number;  // Width in tiles
    h: number;  // Height in tiles
}

/** Building variant (evolution state) */
export type BuildingVariant = 0 | 1 | 2 | 3;

// ═══════════════════════════════════════════════════════════════════
// BUILDING INSTANCE
// ═══════════════════════════════════════════════════════════════════

/** Building instance data */
export interface Building {
    t: BuildingTool;          // Building type
    x: number;                // Grid X position
    y: number;                // Grid Y position
    lvl?: number;             // Building level (optional for WELL, etc.)
    efficiency?: number;      // Efficiency multiplier (0.3-2.5)
    age?: number;             // Age in game ticks
    conn?: boolean;           // Road connected
    onDeposit?: boolean;      // Built on resource deposit
    desirability?: number;    // Desirability score (0-1)
    variant?: BuildingVariant; // Visual variant
    population?: number;      // Current population (residential)
    waterProximity?: number;  // Water bonus (0-1)
    forestProximity?: boolean; // Near forest
}

/** Residential zone building */
export interface ResidentialBuilding {
    level: number;
    variant: BuildingVariant;
    population?: number;
    desirability?: number;
    growth?: number;
    age?: number;
    lastBirthYear?: number;
    pop?: number;
    capacity?: number;
}

/** Zone tile data (for tiles[x][y].building) */
export interface ZoneTile {
    level: number;
    growth: number;
    desirability: number;
    age: number;
    lastBirthYear: number;
    pop: number;
    capacity: number;
    variant: BuildingVariant;
    population?: number;
}

// ═══════════════════════════════════════════════════════════════════
// BUILDING CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

/** Building level configuration */
export interface BuildingLevelConfig {
    name: string;
    capacity: number;
    food: number;
    wood?: number;
    stone?: number;
    metal?: number;
    reqPop?: number;
    variants?: BuildingVariantConfig[];
}

/** Building variant configuration */
export interface BuildingVariantConfig {
    name: string;
    minDesirability: number;
    maxDesirability: number;
}

/** Variant display configuration */
export interface VariantConfig {
    name: string;
    icon: string;
    bonusMult: number;
}

/** State threshold configuration */
export interface StateThreshold {
    min: number;
    max: number;
    name: string;
    icon: string;
    incomeClass: string;
    incomeMult?: number;
    lifespanBonus: number;
}

/** Industrial level configuration */
export interface IndustrialLevelConfig {
    name: string;
    capacity: number;
    food: number;
    wood: number;
    stone?: number;
    metal?: number;
}

/** Commercial level configuration */
export interface CommercialLevelConfig {
    name: string;
    food: number;
    wood: number;
    stone?: number;
    production: number;
}

/** Storage building configuration */
export interface StorageBuildingConfig {
    name: string;
    cost: number;
    cap: number;
    reqPop: number;
}

// ═══════════════════════════════════════════════════════════════════
// ZONE BONUSES
// ═══════════════════════════════════════════════════════════════════

/** Zone bonus factors */
export interface ZoneBonusFactors {
    roadAccess: number;
    noRoadPenalty: number;
    waterNearby: number;
    wellNearby: number;
    treeNearby: number;
    stoneNearby: number;
    clusterBonus: number;
    industrialPenalty: number;
    isolationPenalty: number;
    chiefBonus: number;
}

/** Zone bonus result */
export interface ZoneBonusResult {
    bonuses: string[];
    penalties: string[];
    total: number;
    text: string;
}

// ═══════════════════════════════════════════════════════════════════
// ELEVATION SYSTEM
// ═══════════════════════════════════════════════════════════════════

/** Elevation cost info */
export interface ElevationCostInfo {
    multiplier: number;
    text: string;
    elevation: number;
}

/** Tile elevation info */
export interface TileElevationInfo {
    elevation: number;
    seaLevel: number;
    status: 'safe' | 'warning' | 'danger' | 'underwater' | 'high';
    description: string;
    heightAboveSea: number;
}

// ═══════════════════════════════════════════════════════════════════
// BUILDING CONSTANTS
// ═══════════════════════════════════════════════════════════════════

/** Building sizes by type */
export const BUILDING_SIZES: Record<BuildingTool, BuildingSize> = {
    RES: { w: 1, h: 1 },
    COM: { w: 1, h: 1 },
    IND: { w: 1, h: 1 },
    ROAD: { w: 1, h: 1 },
    WELL: { w: 1, h: 1 },
    CHIEF: { w: 2, h: 2 },
    CLAN_CHIEF: { w: 2, h: 2 },
    DOCK: { w: 3, h: 2 },
    BASKET: { w: 2, h: 2 },
    POTTERY: { w: 2, h: 2 },
    GRANARY: { w: 2, h: 2 },
    PALACE: { w: 2, h: 2 },
    BULL: { w: 1, h: 1 }
};

/** Small (1x1) building types */
export const SMALL_BUILDINGS: BuildingTool[] = ['WELL', 'COM', 'IND', 'RES', 'ROAD'];

/** Large (2x2) building types */
export const LARGE_BUILDINGS: BuildingTool[] = ['CHIEF', 'CLAN_CHIEF', 'BASKET', 'POTTERY', 'GRANARY', 'PALACE'];

/** Storage building types (deprecated) */
export const STORAGE_PIT_TYPES = ['FOOD_PIT', 'WOOD_PIT', 'STONE_PIT', 'METAL_PIT'] as const;

/** Default efficiency values */
export const DEFAULT_EFFICIENCY = {
    MIN: 0.3,
    MAX: 3.0,
    NO_ROAD_PENALTY: 0.5,
    DECAY_RATE: 0.01,
    WATER_BONUS_MAX: 0.3,
    FOREST_BONUS: 0.2
};

/** Default zone bonus values */
export const DEFAULT_ZONE_BONUSES = {
    ROAD_ACCESS_BONUS: 0.3,
    NO_ROAD_PENALTY: 0.3,
    RES_WATER_BONUS: 0.2,
    RES_WELL_BONUS: 0.15,
    RES_TREE_BONUS: 0.1,
    RES_CLUSTER_BONUS: 0.05,
    RES_INDUSTRIAL_PENALTY: 0.2,
    COM_ROAD_JUNCTION_BONUS: 0.15,
    COM_RES_NEARBY_BONUS: 0.2,
    COM_ISOLATION_PENALTY: 0.2,
    COM_INDUSTRIAL_NEARBY: 0.1,
    IND_WATER_BONUS: 0.15,
    IND_FOREST_BONUS: 0.2,
    IND_STONE_BONUS: 0.25,
    IND_CLUSTER_BONUS: 0.1,
    IND_RES_NEARBY_PENALTY: 0.15,
    CHIEF_CULTURE_RADIUS: 50,
    CHIEF_BONUS: 0.3
};
