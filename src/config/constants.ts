/**
 * Civil Zones - Game Constants
 * Core configuration values for the game engine
 */

import type { 
    InventoryConfig, 
    VisualStatesConfig, 
    MapConfig,
    CivilizationLevel 
} from '../types/index.js';

// ═══════════════════════════════════════════════════════════════════════════════
// MAP & RENDERING
// ═══════════════════════════════════════════════════════════════════════════════

export const MAP_CONFIG: MapConfig = {
    TILE: 48,    // Tile size in pixels
    W: 250,      // Map width in tiles
    H: 250       // Map height in tiles
};

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTORY SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export const INVENTORY: InventoryConfig = {
    BACKPACK_BASE: 150,         // Starting backpack capacity
    BACKPACK_PER_POP: 100,      // Additional capacity per population
    SACK_CAPACITY: 1000,        // Fixed rare item storage (Stone & Metal)
    OVERFLOW_DELETE: true       // Overflow items are deleted instantly
};

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL STATES
// ═══════════════════════════════════════════════════════════════════════════════

export const VISUAL_STATES: VisualStatesConfig = {
    ABANDONED_YEARS: 10,        // Years at 0 occupancy before abandoned
    LIGHT_MAX: 0.30,            // 1-30% occupancy
    MEDIUM_MAX: 0.80,           // 31-80% occupancy
    EXTREME_MIN: 0.81           // 81-100% occupancy
};

// ═══════════════════════════════════════════════════════════════════════════════
// BULLDOZE & CONSTRUCTION
// ═══════════════════════════════════════════════════════════════════════════════

export const BULLDOZE_REFUND = 0.10;  // 10% of construction cost returned
export const ZONE_COST = 50;
export const CHIEF_COST = 10000;
export const CHIEF_RADIUS = 50;
export const CHIEF_BONUS = 2.0;

// ═══════════════════════════════════════════════════════════════════════════════
// GROWTH & DECAY
// ═══════════════════════════════════════════════════════════════════════════════

export const GROWTH_THRESHOLD = 1.0;
export const DECAY_THRESHOLD = 0.7;

export const EFFICIENCY = {
    NO_ROAD_PENALTY: 0.05,
    WATER_BONUS_MAX: 0.5,
    FOREST_BONUS: 0.2,
    DECAY_RATE: 0.02,
    MIN_EFFICIENCY: 0.1
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// DESIRABILITY SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export const DESIRABILITY = {
    NEIGHBOR_BONUS: 0.10,
    TREE_BONUS: 0.25,
    WATER_BONUS: 0.50,
    WATER_RANGE: 5,
    ISOLATION_PENALTY: 0.50,
    ISOLATION_RANGE: 2,
    WEALTH_FOOD_MULTIPLIER: 1.2,
    PATH_BONUS: 0.10,
    WELL_BONUS: 0.15,
    INDUSTRIAL_BONUS: 0.15
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// ZONE BONUSES (SimCity SNES Style)
// ═══════════════════════════════════════════════════════════════════════════════

export const ZONE_BONUSES = {
    // Road Access (critical for all zones)
    ROAD_ACCESS_BONUS: 0.50,
    NO_ROAD_PENALTY: 0.30,
    
    // Residential bonuses
    RES_WATER_BONUS: 0.30,
    RES_TREE_BONUS: 0.20,
    RES_CLUSTER_BONUS: 0.10,
    RES_INDUSTRIAL_PENALTY: 0.25,
    RES_WELL_BONUS: 0.15,
    
    // Commercial bonuses
    COM_RES_NEARBY_BONUS: 0.40,
    COM_ROAD_JUNCTION_BONUS: 0.20,
    COM_INDUSTRIAL_NEARBY: 0.15
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// GOLD SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export const GOLD_EXCHANGE_RATE = 5000;  // 5000 metal = 1 gold

// ═══════════════════════════════════════════════════════════════════════════════
// CIVILIZATION ERAS
// ═══════════════════════════════════════════════════════════════════════════════

export const ERAS: readonly CivilizationLevel[] = [
    { level: 0, name: 'Wanderer', popRequired: 0, description: 'Nomadic existence' },
    { level: 1, name: 'Settlement', popRequired: 2, description: 'First permanent homes' },
    { level: 2, name: 'Village', popRequired: 20, description: 'Small community forms' },
    { level: 3, name: 'Town', popRequired: 100, description: 'Organized society' },
    { level: 4, name: 'City', popRequired: 500, description: 'Urban development begins' },
    { level: 5, name: 'Metro', popRequired: 2000, description: 'Metropolitan expansion' },
    { level: 6, name: 'Province', popRequired: 7000, description: 'Regional power' },
    { level: 7, name: 'Region', popRequired: 20000, description: 'Multi-city governance' },
    { level: 8, name: 'State', popRequired: 60000, description: 'Organized state' },
    { level: 9, name: 'Nation', popRequired: 180000, description: 'National identity' },
    { level: 10, name: 'Empire', popRequired: 500000, description: 'Imperial expansion' },
    { level: 11, name: 'Dominion', popRequired: 1400000, description: 'Continental power' },
    { level: 12, name: 'Realm', popRequired: 4200000, description: 'Vast territories' },
    { level: 13, name: 'Dynasty', popRequired: 13000000, description: 'Generational rule' },
    { level: 14, name: 'Hegemony', popRequired: 38000000, description: 'Regional dominance' },
    { level: 15, name: 'Superpower', popRequired: 115000000, description: 'Global influence' },
    { level: 16, name: 'World Power', popRequired: 345000000, description: 'World leadership' },
    { level: 17, name: 'Hyperpower', popRequired: 1000000000, description: 'Unmatched might' },
    { level: 18, name: 'Civilization', popRequired: 3100000000, description: 'Peak civilization' },
    { level: 19, name: 'Eternal', popRequired: 10000000000, description: 'Immortal legacy' }
] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// BUILDING CATEGORY GROUPINGS
// ═══════════════════════════════════════════════════════════════════════════════

export const BUILDING_CATEGORIES = {
    RESIDENTIAL: ['RES_1', 'RES_2', 'RES_3', 'RES_4', 'RES_5', 'RES_6'],
    INDUSTRIAL: ['IND_1', 'IND_2', 'IND_3', 'IND_4', 'IND_5', 'IND_6'],
    COMMERCIAL: ['COM_1', 'COM_2', 'COM_3', 'COM_4', 'COM_5', 'COM_6'],
    INFRASTRUCTURE: ['WELL'],
    MILESTONE: ['CLAN_CHIEF', 'DOCK'],
    SPECIAL: ['CHIEF']
} as const;
