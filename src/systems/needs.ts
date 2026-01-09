/**
 * Civil Zones - Needs System
 * Tracks population needs satisfaction (housing, water, food, jobs, paths)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Individual need tracking */
export interface Need {
    have: number;       // Current amount satisfied
    need: number;       // Total needed
    satisfied: number;  // Ratio 0.0-1.0
}

/** All population needs */
export interface NeedsState {
    housing: Need;
    water: Need;
    food: Need;
    jobs: Need;
    paths: Need;
    overall: number;    // Combined satisfaction (0.0 - 1.0)
}

/** Resource production/consumption rates */
export interface ResourceRates {
    foodPerPop: number;     // Food consumed per person per year
    waterPerPop: number;    // Water consumed per person per year
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_RESOURCE_RATES: ResourceRates = {
    foodPerPop: 1,      // 1 food per person per year
    waterPerPop: 2      // 2 water per person per year
};

// Need weights for overall satisfaction calculation
const NEED_WEIGHTS = {
    housing: 0.3,
    water: 0.25,
    food: 0.25,
    jobs: 0.15,
    paths: 0.05
};

// ═══════════════════════════════════════════════════════════════════════════════
// NEEDS CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create initial needs state
 */
export function createNeedsState(): NeedsState {
    return {
        housing: { have: 0, need: 0, satisfied: 1.0 },
        water: { have: 0, need: 0, satisfied: 1.0 },
        food: { have: 0, need: 0, satisfied: 1.0 },
        jobs: { have: 0, need: 0, satisfied: 1.0 },
        paths: { have: 0, need: 0, satisfied: 1.0 },
        overall: 1.0
    };
}

/**
 * Calculate housing need satisfaction
 */
export function calculateHousingNeed(
    population: number,
    housingCapacity: number
): Need {
    const need = population;
    const have = Math.min(housingCapacity, population);
    const satisfied = need > 0 ? have / need : 1.0;
    
    return { have, need, satisfied: Math.min(1.0, satisfied) };
}

/**
 * Calculate water need satisfaction
 */
export function calculateWaterNeed(
    population: number,
    waterAvailable: number,
    rates: ResourceRates = DEFAULT_RESOURCE_RATES
): Need {
    const need = population * rates.waterPerPop;
    const have = Math.min(waterAvailable, need);
    const satisfied = need > 0 ? have / need : 1.0;
    
    return { have, need, satisfied: Math.min(1.0, satisfied) };
}

/**
 * Calculate food need satisfaction
 */
export function calculateFoodNeed(
    population: number,
    foodAvailable: number,
    rates: ResourceRates = DEFAULT_RESOURCE_RATES
): Need {
    const need = population * rates.foodPerPop;
    const have = Math.min(foodAvailable, need);
    const satisfied = need > 0 ? have / need : 1.0;
    
    return { have, need, satisfied: Math.min(1.0, satisfied) };
}

/**
 * Calculate job satisfaction
 */
export function calculateJobNeed(
    population: number,
    jobCapacity: number
): Need {
    const need = population;
    const have = Math.min(jobCapacity, population);
    const satisfied = need > 0 ? have / need : 1.0;
    
    return { have, need, satisfied: Math.min(1.0, satisfied) };
}

/**
 * Calculate path/road connectivity satisfaction
 * Simplified: based on road tiles per building
 */
export function calculatePathNeed(
    buildingCount: number,
    roadTileCount: number,
    idealRoadsPerBuilding: number = 4
): Need {
    const need = buildingCount * idealRoadsPerBuilding;
    const have = roadTileCount;
    const satisfied = need > 0 ? Math.min(1.0, have / need) : 1.0;
    
    return { have, need, satisfied };
}

/**
 * Calculate overall needs satisfaction
 * Uses weighted average of all needs
 */
export function calculateOverallSatisfaction(state: NeedsState): number {
    const weighted = 
        state.housing.satisfied * NEED_WEIGHTS.housing +
        state.water.satisfied * NEED_WEIGHTS.water +
        state.food.satisfied * NEED_WEIGHTS.food +
        state.jobs.satisfied * NEED_WEIGHTS.jobs +
        state.paths.satisfied * NEED_WEIGHTS.paths;
    
    return Math.min(1.0, Math.max(0, weighted));
}

/**
 * Calculate all needs at once
 */
export function calculateAllNeeds(
    population: number,
    housingCapacity: number,
    waterAvailable: number,
    foodAvailable: number,
    jobCapacity: number,
    buildingCount: number,
    roadTileCount: number,
    rates: ResourceRates = DEFAULT_RESOURCE_RATES
): NeedsState {
    const state: NeedsState = {
        housing: calculateHousingNeed(population, housingCapacity),
        water: calculateWaterNeed(population, waterAvailable, rates),
        food: calculateFoodNeed(population, foodAvailable, rates),
        jobs: calculateJobNeed(population, jobCapacity),
        paths: calculatePathNeed(buildingCount, roadTileCount),
        overall: 0
    };
    
    state.overall = calculateOverallSatisfaction(state);
    
    return state;
}

// ═══════════════════════════════════════════════════════════════════════════════
// POPULATION GROWTH
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate population change based on needs satisfaction
 * Returns positive for growth, negative for decline
 */
export function calculatePopulationChange(
    currentPop: number,
    needsState: NeedsState,
    baseGrowthRate: number = 0.02,
    maxGrowthRate: number = 0.05,
    declineRate: number = 0.03
): number {
    const satisfaction = needsState.overall;
    
    // Growth requires high satisfaction
    if (satisfaction >= 0.8) {
        // Full growth potential
        const growthRate = baseGrowthRate + (satisfaction - 0.8) * (maxGrowthRate - baseGrowthRate) / 0.2;
        return Math.floor(currentPop * growthRate);
    } else if (satisfaction >= 0.5) {
        // Slow growth
        const growthRate = baseGrowthRate * (satisfaction - 0.5) / 0.3;
        return Math.floor(currentPop * growthRate);
    } else if (satisfaction >= 0.3) {
        // Stagnation
        return 0;
    } else {
        // Population decline
        const lossRate = declineRate * (0.3 - satisfaction) / 0.3;
        return -Math.ceil(currentPop * lossRate);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISPLAY HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get satisfaction level text
 */
export function getSatisfactionLevel(satisfaction: number): string {
    if (satisfaction >= 0.9) return 'Excellent';
    if (satisfaction >= 0.7) return 'Good';
    if (satisfaction >= 0.5) return 'Fair';
    if (satisfaction >= 0.3) return 'Poor';
    return 'Critical';
}

/**
 * Get satisfaction color
 */
export function getSatisfactionColor(satisfaction: number): string {
    if (satisfaction >= 0.9) return '#4CAF50';  // Green
    if (satisfaction >= 0.7) return '#8BC34A';  // Light green
    if (satisfaction >= 0.5) return '#FFC107';  // Amber
    if (satisfaction >= 0.3) return '#FF9800';  // Orange
    return '#F44336';                            // Red
}

/**
 * Get the most critical need
 */
export function getCriticalNeed(state: NeedsState): { name: string; need: Need } | null {
    const needs: [string, Need][] = [
        ['Housing', state.housing],
        ['Water', state.water],
        ['Food', state.food],
        ['Jobs', state.jobs],
        ['Paths', state.paths]
    ];
    
    let critical: [string, Need] | null = null;
    let lowestSatisfaction = 1.0;
    
    for (const [name, need] of needs) {
        if (need.satisfied < lowestSatisfaction && need.satisfied < 0.8) {
            lowestSatisfaction = need.satisfied;
            critical = [name, need];
        }
    }
    
    return critical ? { name: critical[0], need: critical[1] } : null;
}

/**
 * Format need as percentage string
 */
export function formatNeedPercentage(need: Need): string {
    return `${Math.round(need.satisfied * 100)}%`;
}

/**
 * Get need status emoji
 */
export function getNeedEmoji(satisfaction: number): string {
    if (satisfaction >= 0.9) return '✅';
    if (satisfaction >= 0.7) return '🟢';
    if (satisfaction >= 0.5) return '🟡';
    if (satisfaction >= 0.3) return '🟠';
    return '🔴';
}
