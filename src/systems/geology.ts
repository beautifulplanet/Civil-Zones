/**
 * Civil Zones - Geological System
 * Handles sea level changes, ice ages, and flooding mechanics
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Geological period configuration */
export interface GeologicalPeriod {
    name: string;
    duration: number;   // In centuries
    seaLevel: number;   // Target sea level (0-10)
}

/** Current geological state */
export interface GeologyState {
    currentSeaLevel: number;        // Current water level (0-10)
    periodIndex: number;            // Current geological period index
    centuriesInPeriod: number;      // Centuries spent in current period
    lastUpdateYear: number;         // Last year water was checked
    tilesFlooded: number;           // Count of tiles lost to rising water
    tilesDrained: number;           // Count of tiles gained from receding water
    currentPeriodName: string;      // Display name of current period
    populationDrowned?: number;     // Total population lost to flooding
}

/** Elevation system configuration */
export interface ElevationConfig {
    ENABLED: boolean;
    UPDATE_INTERVAL_YEARS: number;
    SEA_LEVEL_MIN: number;
    SEA_LEVEL_MAX: number;
    FLOOD_WARNING_MARGIN: number;
    COST_THRESHOLD: number;
    COST_INCREASE_PER_LEVEL: number;
    GEOLOGICAL_PERIODS: GeologicalPeriod[];
}

/** Tile elevation info */
export interface TileElevationInfo {
    elevation: number;
    seaLevel: number;
    status: 'safe' | 'warning' | 'danger' | 'underwater';
    description: string;
    floodRisk: boolean;
}

/** Flood event data */
export interface FloodEvent {
    year: number;
    tilesFlooded: number;
    buildingsLost: number;
    populationDrowned: number;
    periodName: string;
    seaLevel: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/** Default geological periods (based on real ice age cycles) */
export const DEFAULT_GEOLOGICAL_PERIODS: GeologicalPeriod[] = [
    { name: "Warm Interglacial", duration: 100, seaLevel: 3 },   // 10,000 years warmth
    { name: "Early Glaciation", duration: 50, seaLevel: 2.5 },   // 5,000 years cooling
    { name: "Ice Age Peak", duration: 80, seaLevel: 1.5 },       // 8,000 years of ice
    { name: "Glacial Melt", duration: 30, seaLevel: 3.5 },       // 3,000 years of melt
    { name: "Flood Period", duration: 20, seaLevel: 4 },         // 2,000 years high water
    { name: "Stabilization", duration: 50, seaLevel: 3 }         // 5,000 years normalizing
];

/** Default elevation system config */
export const DEFAULT_ELEVATION_CONFIG: ElevationConfig = {
    ENABLED: true,
    UPDATE_INTERVAL_YEARS: 100,
    SEA_LEVEL_MIN: 1,
    SEA_LEVEL_MAX: 6,
    FLOOD_WARNING_MARGIN: 1,
    COST_THRESHOLD: 4,
    COST_INCREASE_PER_LEVEL: 0.10,
    GEOLOGICAL_PERIODS: DEFAULT_GEOLOGICAL_PERIODS
};

// ═══════════════════════════════════════════════════════════════════════════════
// GEOLOGICAL CYCLE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create initial geology state
 */
export function createGeologyState(config: ElevationConfig = DEFAULT_ELEVATION_CONFIG): GeologyState {
    const initialPeriod = config.GEOLOGICAL_PERIODS[0];
    return {
        currentSeaLevel: initialPeriod.seaLevel,
        periodIndex: 0,
        centuriesInPeriod: 0,
        lastUpdateYear: 0,
        tilesFlooded: 0,
        tilesDrained: 0,
        currentPeriodName: initialPeriod.name,
        populationDrowned: 0
    };
}

/**
 * Check if geological update should occur
 */
export function shouldUpdateGeology(
    currentYear: number,
    lastUpdateYear: number,
    updateInterval: number
): boolean {
    return currentYear - lastUpdateYear >= updateInterval;
}

/**
 * Advance to next geological period
 * Returns new period info or null if staying in current period
 */
export function advanceGeologicalPeriod(
    state: GeologyState,
    periods: GeologicalPeriod[]
): GeologicalPeriod | null {
    state.centuriesInPeriod++;
    
    const currentPeriod = periods[state.periodIndex];
    if (state.centuriesInPeriod >= currentPeriod.duration) {
        // Move to next period
        state.periodIndex = (state.periodIndex + 1) % periods.length;
        state.centuriesInPeriod = 0;
        
        const newPeriod = periods[state.periodIndex];
        state.currentPeriodName = newPeriod.name;
        
        return newPeriod;
    }
    
    return null;
}

/**
 * Calculate sea level change step
 * Returns the amount to change sea level by (positive = rising, negative = falling)
 */
export function calculateSeaLevelChange(
    currentLevel: number,
    targetLevel: number,
    config: ElevationConfig
): number {
    const CHANGE_RATE = 0.1; // Per century
    
    if (currentLevel < targetLevel) {
        const newLevel = Math.min(config.SEA_LEVEL_MAX, currentLevel + CHANGE_RATE);
        return newLevel - currentLevel;
    } else if (currentLevel > targetLevel) {
        const newLevel = Math.max(config.SEA_LEVEL_MIN, currentLevel - CHANGE_RATE);
        return newLevel - currentLevel;
    }
    
    return 0;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLOOD RISK ASSESSMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if a tile is at flood risk
 */
export function isFloodRisk(
    tileElevation: number,
    seaLevel: number,
    warningMargin: number
): boolean {
    return tileElevation <= seaLevel + warningMargin && tileElevation > seaLevel;
}

/**
 * Check if a tile should be flooded
 */
export function shouldFlood(tileElevation: number, seaLevel: number): boolean {
    return tileElevation > 0 && tileElevation < seaLevel;
}

/**
 * Check if a tile should drain (was underwater, now above sea level)
 */
export function shouldDrain(
    tileElevation: number,
    seaLevel: number,
    tileType: string
): boolean {
    // Only drain shallow water tiles (not deep ocean)
    return (
        tileElevation >= seaLevel &&
        (tileType === 'WATER' || tileType === 'DEEP') &&
        tileElevation > 1
    );
}

/**
 * Get elevation info for a tile
 */
export function getTileElevationInfo(
    elevation: number,
    seaLevel: number,
    warningMargin: number
): TileElevationInfo {
    let status: TileElevationInfo['status'];
    let description: string;
    
    if (elevation < seaLevel) {
        status = 'underwater';
        description = 'Underwater';
    } else if (elevation < seaLevel + warningMargin) {
        status = 'danger';
        description = 'Flood risk! Build higher.';
    } else if (elevation < seaLevel + warningMargin * 2) {
        status = 'warning';
        description = 'Low elevation - monitor water levels';
    } else {
        status = 'safe';
        description = 'Safe elevation';
    }
    
    return {
        elevation,
        seaLevel,
        status,
        description,
        floodRisk: status === 'danger' || status === 'warning'
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ELEVATION COST CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate cost multiplier for building at elevation
 * Higher elevations cost more to build on
 */
export function getElevationCostMultiplier(
    elevation: number,
    costThreshold: number,
    costIncreasePerLevel: number
): number {
    const elev = Math.floor(elevation);
    
    if (elev < costThreshold) return 1.0;
    
    // Each elevation above threshold adds 10% cost
    const levelsAbove = elev - costThreshold;
    return 1.0 + (levelsAbove * costIncreasePerLevel);
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISPLAY HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get period transition message
 */
export function getPeriodTransitionMessage(
    oldSeaLevel: number,
    newPeriod: GeologicalPeriod
): { icon: string; message: string } {
    const newLevel = newPeriod.seaLevel;
    
    if (newLevel > oldSeaLevel) {
        return {
            icon: '🌊',
            message: `${newPeriod.name} begins! Waters are rising as ice melts...`
        };
    } else if (newLevel < oldSeaLevel) {
        return {
            icon: '❄️',
            message: `${newPeriod.name} begins! Waters recede as glaciers grow...`
        };
    } else {
        return {
            icon: '🌍',
            message: `${newPeriod.name} begins.`
        };
    }
}

/**
 * Get flood warning message based on severity
 */
export function getFloodWarningMessage(populationLost: number, periodName: string): string {
    if (populationLost > 100) {
        return `📰 CATASTROPHE! ${populationLost} perished in the great flood! The ${periodName} brought destruction. Where you build matters...`;
    } else if (populationLost > 20) {
        return `🌊💀 ${populationLost} drowned in rising waters! Some areas may be safer than others...`;
    } else {
        return `🌊 ${populationLost} lost to rising waters. Perhaps higher ground would be wiser...`;
    }
}

/**
 * Get elevation display color based on flood risk
 */
export function getElevationColor(info: TileElevationInfo): string {
    switch (info.status) {
        case 'underwater': return '#1565C0';  // Deep blue
        case 'danger': return '#F44336';       // Red
        case 'warning': return '#FF9800';      // Orange
        case 'safe': return '#4CAF50';         // Green
        default: return '#9E9E9E';             // Gray
    }
}
