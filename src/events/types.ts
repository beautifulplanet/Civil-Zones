/**
 * Civil Zones - Event Types
 * Type definitions for lore events and flooding
 */

// ═══════════════════════════════════════════════════════════════════
// LORE EVENT TYPES
// ═══════════════════════════════════════════════════════════════════

/** Lore event illustration types */
export type LoreIllustration = 
    | 'wanderer' 
    | 'well' 
    | 'hut' 
    | 'hunting' 
    | 'road' 
    | 'hunt_success' 
    | 'settlement' 
    | 'storage' 
    | 'trading' 
    | 'nomad' 
    | 'turtle' 
    | 'flood' 
    | 'berry';

/** Lore event IDs */
export type LoreEventId = 
    | 'GAME_START'
    | 'FIRST_WELL'
    | 'FIRST_RESIDENTIAL'
    | 'FIRST_HUNTING_GROUND'
    | 'FIRST_ROAD'
    | 'FIRST_KILL'
    | 'FIRST_SETTLEMENT'
    | 'FIRST_STORAGE'
    | 'FIRST_COMMERCIAL'
    | 'FIRST_NOMAD'
    | 'FIRST_TURTLE'
    | 'FLOOD_WARNING'
    | 'FIRST_BERRY';

/** Lore event definition */
export interface LoreEvent {
    title: string;
    text: string;
    illustration: LoreIllustration;
}

/** Lore seen tracking */
export type LoreSeen = Partial<Record<LoreEventId, boolean>>;

// ═══════════════════════════════════════════════════════════════════
// FLOOD TYPES
// ═══════════════════════════════════════════════════════════════════

/** Flooded building record */
export interface FloodedBuilding {
    x: number;
    y: number;
    type: string;
    pop?: number;
}

/** Flood statistics */
export interface FloodStats {
    tilesFlooded: number;
    tilesDrained: number;
    buildingsLost: FloodedBuilding[];
    populationDrowned: number;
    wellsLost: number;
}

/** Flood result from applying sea level change */
export interface FloodResult {
    flooded: number;
    drained: number;
    buildingsLost: FloodedBuilding[];
    populationDrowned: number;
    wellsLost: number;
    playerDrowned: boolean;
}

/** Sea level configuration */
export interface SeaLevelConfig {
    SEA_LEVEL_MIN: number;
    SEA_LEVEL_MAX: number;
    FLOOD_WARNING_MARGIN: number;
}

// ═══════════════════════════════════════════════════════════════════
// GEOLOGY TYPES
// ═══════════════════════════════════════════════════════════════════

/** Geology state for flooding */
export interface GeologyState {
    currentSeaLevel: number;
    currentPeriodName?: string;
    tilesFlooded: number;
    tilesDrained: number;
    populationDrowned: number;
}
