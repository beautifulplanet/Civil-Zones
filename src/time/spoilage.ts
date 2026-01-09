/**
 * Civil Zones - Resource Spoilage
 * Food rot, wood decay, and resource degradation
 */

import type { SpoilageRates, TurnEvent } from './types.js';
import { DEFAULT_SPOILAGE_RATES } from './types.js';
import { createTurnEvent } from './turns.js';

// ═══════════════════════════════════════════════════════════════════
// SPOILAGE CALCULATIONS
// ═══════════════════════════════════════════════════════════════════

/** Calculate resource spoilage */
export function calculateSpoilage(
    current: number,
    capacity: number,
    rate: number
): { spoiled: number; remaining: number } {
    if (current <= capacity) {
        return { spoiled: 0, remaining: current };
    }
    
    const excess = current - capacity;
    const spoiled = Math.floor(excess * rate);
    const remaining = Math.max(0, current - spoiled);
    
    return { spoiled, remaining };
}

/** Calculate food spoilage */
export function calculateFoodSpoilage(
    food: number,
    storageCapacity: number,
    hasAdvancedStorage: boolean = false,
    rates: SpoilageRates = DEFAULT_SPOILAGE_RATES
): { spoiled: number; remaining: number; event?: TurnEvent } {
    const rate = hasAdvancedStorage ? rates.foodWithStorage : rates.food;
    const result = calculateSpoilage(food, storageCapacity, rate);
    
    // Only create event if significant spoilage
    let event: TurnEvent | undefined;
    if (result.spoiled > 100 && Math.random() < 0.3) {
        event = createTurnEvent(
            'FOOD_SPOILAGE',
            hasAdvancedStorage 
                ? `🍂 ${result.spoiled} food rotted! (10% rate with Nuts Storage Reed House)`
                : `🍂 ${result.spoiled} food rotted! Need storage buildings!`,
            'warning',
            result.spoiled
        );
    }
    
    return { ...result, event };
}

/** Calculate wood decay */
export function calculateWoodDecay(
    wood: number,
    storageCapacity: number,
    rates: SpoilageRates = DEFAULT_SPOILAGE_RATES
): { decayed: number; remaining: number; event?: TurnEvent } {
    const result = calculateSpoilage(wood, storageCapacity, rates.wood);
    
    let event: TurnEvent | undefined;
    if (result.spoiled > 50 && Math.random() < 0.2) {
        event = createTurnEvent(
            'FOOD_SPOILAGE', // Using same type for simplicity
            `🪵 ${result.spoiled} wood rotted!`,
            'warning',
            result.spoiled
        );
    }
    
    return { decayed: result.spoiled, remaining: result.remaining, event };
}

/** Calculate stone loss */
export function calculateStoneLoss(
    stone: number,
    storageCapacity: number,
    rates: SpoilageRates = DEFAULT_SPOILAGE_RATES
): { lost: number; remaining: number; event?: TurnEvent } {
    const result = calculateSpoilage(stone, storageCapacity, rates.stone);
    
    let event: TurnEvent | undefined;
    if (result.spoiled > 20 && Math.random() < 0.1) {
        event = createTurnEvent(
            'FOOD_SPOILAGE',
            `🪨 ${result.spoiled} stone scattered!`,
            'warning',
            result.spoiled
        );
    }
    
    return { lost: result.spoiled, remaining: result.remaining, event };
}

/** Calculate metal rust */
export function calculateMetalRust(
    metal: number,
    storageCapacity: number,
    rates: SpoilageRates = DEFAULT_SPOILAGE_RATES
): { rusted: number; remaining: number; event?: TurnEvent } {
    const result = calculateSpoilage(metal, storageCapacity, rates.metal);
    
    let event: TurnEvent | undefined;
    if (result.spoiled > 10 && Math.random() < 0.1) {
        event = createTurnEvent(
            'FOOD_SPOILAGE',
            `⚙️ ${result.spoiled} metal rusted! Build Metal Pit!`,
            'warning',
            result.spoiled
        );
    }
    
    return { rusted: result.spoiled, remaining: result.remaining, event };
}

// ═══════════════════════════════════════════════════════════════════
// BATCH SPOILAGE PROCESSING
// ═══════════════════════════════════════════════════════════════════

/** Resource amounts */
export interface ResourceAmounts {
    food: number;
    wood: number;
    stone: number;
    metal: number;
}

/** Storage capacities */
export interface StorageCapacities {
    food: number;
    wood: number;
    stone: number;
    metal: number;
}

/** Spoilage result for all resources */
export interface AllSpoilageResult {
    remaining: ResourceAmounts;
    spoiled: ResourceAmounts;
    events: TurnEvent[];
}

/** Process all resource spoilage */
export function processAllSpoilage(
    resources: ResourceAmounts,
    capacities: StorageCapacities,
    hasAdvancedFoodStorage: boolean = false,
    rates: SpoilageRates = DEFAULT_SPOILAGE_RATES
): AllSpoilageResult {
    const events: TurnEvent[] = [];
    
    const foodResult = calculateFoodSpoilage(
        resources.food, 
        capacities.food, 
        hasAdvancedFoodStorage, 
        rates
    );
    if (foodResult.event) events.push(foodResult.event);
    
    const woodResult = calculateWoodDecay(resources.wood, capacities.wood, rates);
    if (woodResult.event) events.push(woodResult.event);
    
    const stoneResult = calculateStoneLoss(resources.stone, capacities.stone, rates);
    if (stoneResult.event) events.push(stoneResult.event);
    
    const metalResult = calculateMetalRust(resources.metal, capacities.metal, rates);
    if (metalResult.event) events.push(metalResult.event);
    
    return {
        remaining: {
            food: foodResult.remaining,
            wood: woodResult.remaining,
            stone: stoneResult.remaining,
            metal: metalResult.remaining
        },
        spoiled: {
            food: foodResult.spoiled,
            wood: woodResult.decayed,
            stone: stoneResult.lost,
            metal: metalResult.rusted
        },
        events
    };
}

// ═══════════════════════════════════════════════════════════════════
// UPKEEP CALCULATIONS
// ═══════════════════════════════════════════════════════════════════

/** Calculate building upkeep */
export function calculateBuildingUpkeep(
    buildingCount: number,
    abandonedCount: number,
    normalRate: number = 0.5,
    abandonedRate: number = 1.0
): number {
    const normalBuildings = buildingCount - abandonedCount;
    const normalUpkeep = normalBuildings * normalRate;
    const abandonedUpkeep = abandonedCount * abandonedRate;
    return Math.ceil(normalUpkeep + abandonedUpkeep);
}

/** Process upkeep deduction */
export function processUpkeep(
    wood: number,
    upkeepCost: number
): { remaining: number; shortage: number } {
    if (wood >= upkeepCost) {
        return { remaining: wood - upkeepCost, shortage: 0 };
    }
    return { remaining: 0, shortage: upkeepCost - wood };
}
