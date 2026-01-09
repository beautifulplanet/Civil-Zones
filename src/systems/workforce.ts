/**
 * Civil Zones - Workforce System
 * Manages worker assignment to buildings and resource gathering
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Workforce state for a settlement */
export interface WorkforceState {
    total: number;           // Total available workers (from residential pop)
    wellWorkers: number;     // Assigned to wells
    roadWorkers: number;     // Assigned to road maintenance  
    comWorkers: number;      // Assigned to commercial buildings
    indWorkers: number;      // Assigned to industrial buildings
    gatherers: number;       // Remaining workers (gather/hunt)
    
    // Calculated needs
    wellsNeeded: number;     // Workers needed for all wells
    roadsNeeded: number;     // Workers needed for all roads
    comNeeded: number;       // Workers needed for all commercial
    indNeeded: number;       // Workers needed for all industrial
    shortage: number;        // Worker shortage (positive = need more)
}

/** Workforce configuration */
export interface WorkforceConfig {
    workersPerWell: number;
    workersPerRoadTile: number;
    roadTilesPerWorker: number;  // How many road tiles one worker can maintain
}

/** Infrastructure counts for workforce calculation */
export interface InfrastructureCounts {
    wells: number;
    roadTiles: number;
    commercialCapacity: number;
    industrialCapacity: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_WORKFORCE_CONFIG: WorkforceConfig = {
    workersPerWell: 2,
    workersPerRoadTile: 0.1,    // 1 worker per 10 road tiles
    roadTilesPerWorker: 10
};

// ═══════════════════════════════════════════════════════════════════════════════
// WORKFORCE CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create initial workforce state
 */
export function createWorkforceState(): WorkforceState {
    return {
        total: 0,
        wellWorkers: 0,
        roadWorkers: 0,
        comWorkers: 0,
        indWorkers: 0,
        gatherers: 0,
        wellsNeeded: 0,
        roadsNeeded: 0,
        comNeeded: 0,
        indNeeded: 0,
        shortage: 0
    };
}

/**
 * Calculate workforce allocation based on population and infrastructure
 * Workers are assigned in priority order: wells -> roads -> commercial -> industrial -> gatherers
 */
export function calculateWorkforce(
    population: number,
    infrastructure: InfrastructureCounts,
    config: WorkforceConfig = DEFAULT_WORKFORCE_CONFIG
): WorkforceState {
    const state = createWorkforceState();
    
    // Calculate what's needed
    state.wellsNeeded = infrastructure.wells * config.workersPerWell;
    state.roadsNeeded = Math.ceil(infrastructure.roadTiles / config.roadTilesPerWorker);
    state.comNeeded = infrastructure.commercialCapacity;
    state.indNeeded = infrastructure.industrialCapacity;
    
    state.total = population;
    let remaining = population;
    
    // Assign in priority order
    state.wellWorkers = Math.min(state.wellsNeeded, remaining);
    remaining -= state.wellWorkers;
    
    state.roadWorkers = Math.min(state.roadsNeeded, remaining);
    remaining -= state.roadWorkers;
    
    state.comWorkers = Math.min(state.comNeeded, remaining);
    remaining -= state.comWorkers;
    
    state.indWorkers = Math.min(state.indNeeded, remaining);
    remaining -= state.indWorkers;
    
    state.gatherers = remaining;
    
    // Calculate shortage
    const totalNeeded = state.wellsNeeded + state.roadsNeeded + state.comNeeded + state.indNeeded;
    state.shortage = Math.max(0, totalNeeded - population);
    
    return state;
}

/**
 * Calculate efficiency based on worker assignment
 * Returns 0.0-1.0 where 1.0 = fully staffed
 */
export function calculateWorkforceEfficiency(state: WorkforceState): {
    wells: number;
    roads: number;
    commercial: number;
    industrial: number;
    overall: number;
} {
    const wellEfficiency = state.wellsNeeded > 0 
        ? state.wellWorkers / state.wellsNeeded 
        : 1.0;
        
    const roadEfficiency = state.roadsNeeded > 0 
        ? state.roadWorkers / state.roadsNeeded 
        : 1.0;
        
    const comEfficiency = state.comNeeded > 0 
        ? state.comWorkers / state.comNeeded 
        : 1.0;
        
    const indEfficiency = state.indNeeded > 0 
        ? state.indWorkers / state.indNeeded 
        : 1.0;
    
    // Overall is weighted average
    const totalNeeded = state.wellsNeeded + state.roadsNeeded + state.comNeeded + state.indNeeded;
    const totalAssigned = state.wellWorkers + state.roadWorkers + state.comWorkers + state.indWorkers;
    
    const overall = totalNeeded > 0 ? totalAssigned / totalNeeded : 1.0;
    
    return {
        wells: Math.min(1.0, wellEfficiency),
        roads: Math.min(1.0, roadEfficiency),
        commercial: Math.min(1.0, comEfficiency),
        industrial: Math.min(1.0, indEfficiency),
        overall: Math.min(1.0, overall)
    };
}

/**
 * Calculate resource production based on gatherer count and efficiency
 */
export function calculateGathererProduction(
    gathererCount: number,
    gatheringMultiplier: number = 1.0,
    biomeModifier: number = 1.0
): {
    foodPerYear: number;
    woodPerYear: number;
    metalPerYear: number;
} {
    // Base rates per gatherer per year
    const BASE_FOOD = 5;
    const BASE_WOOD = 3;
    const BASE_METAL = 0.5;
    
    const multiplier = gatheringMultiplier * biomeModifier;
    
    return {
        foodPerYear: gathererCount * BASE_FOOD * multiplier,
        woodPerYear: gathererCount * BASE_WOOD * multiplier,
        metalPerYear: gathererCount * BASE_METAL * multiplier
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISPLAY HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get workforce status text
 */
export function getWorkforceStatusText(state: WorkforceState): string {
    if (state.shortage > 0) {
        return `Need ${state.shortage} more workers!`;
    } else if (state.gatherers === 0 && state.total > 0) {
        return 'All workers assigned - no gatherers';
    } else if (state.gatherers > 0) {
        return `${state.gatherers} gatherers available`;
    }
    return 'No workers';
}

/**
 * Get workforce efficiency color
 */
export function getEfficiencyColor(efficiency: number): string {
    if (efficiency >= 0.9) return '#4CAF50';  // Green
    if (efficiency >= 0.7) return '#8BC34A';  // Light green
    if (efficiency >= 0.5) return '#FFC107';  // Amber
    if (efficiency >= 0.3) return '#FF9800';  // Orange
    return '#F44336';                          // Red
}

/**
 * Format workforce breakdown for display
 */
export function formatWorkforceBreakdown(state: WorkforceState): string[] {
    const lines: string[] = [];
    
    if (state.wellWorkers > 0 || state.wellsNeeded > 0) {
        lines.push(`Wells: ${state.wellWorkers}/${state.wellsNeeded}`);
    }
    if (state.roadWorkers > 0 || state.roadsNeeded > 0) {
        lines.push(`Roads: ${state.roadWorkers}/${state.roadsNeeded}`);
    }
    if (state.comWorkers > 0 || state.comNeeded > 0) {
        lines.push(`Commerce: ${state.comWorkers}/${state.comNeeded}`);
    }
    if (state.indWorkers > 0 || state.indNeeded > 0) {
        lines.push(`Industry: ${state.indWorkers}/${state.indNeeded}`);
    }
    if (state.gatherers > 0) {
        lines.push(`Gatherers: ${state.gatherers}`);
    }
    
    return lines;
}
