/**
 * Resource Types and Management
 * Core resource system for Civil Zones
 */

export interface ResourceAmounts {
    food: number;
    wood: number;
    stone: number;
    metal: number;
    gold: number;
}

export interface ResourceCapacity {
    food: number;
    wood: number;
    stone: number;
    metal: number;
    gold: number;
}

export function createEmptyResources(): ResourceAmounts {
    return {
        food: 0,
        wood: 0,
        stone: 0,
        metal: 0,
        gold: 0
    };
}

export function createDefaultCapacity(): ResourceCapacity {
    return {
        food: 1000,
        wood: 1000,
        stone: 500,
        metal: 100,
        gold: 10
    };
}

export function canAfford(current: ResourceAmounts, cost: Partial<ResourceAmounts>): boolean {
    if ((cost.food ?? 0) > current.food) return false;
    if ((cost.wood ?? 0) > current.wood) return false;
    if ((cost.stone ?? 0) > current.stone) return false;
    if ((cost.metal ?? 0) > current.metal) return false;
    if ((cost.gold ?? 0) > current.gold) return false;
    return true;
}

export function subtractResources(current: ResourceAmounts, cost: Partial<ResourceAmounts>): ResourceAmounts {
    return {
        food: current.food - (cost.food || 0),
        wood: current.wood - (cost.wood || 0),
        stone: current.stone - (cost.stone || 0),
        metal: current.metal - (cost.metal || 0),
        gold: current.gold - (cost.gold || 0)
    };
}

export function addResources(current: ResourceAmounts, addition: Partial<ResourceAmounts>): ResourceAmounts {
    return {
        food: current.food + (addition.food || 0),
        wood: current.wood + (addition.wood || 0),
        stone: current.stone + (addition.stone || 0),
        metal: current.metal + (addition.metal || 0),
        gold: current.gold + (addition.gold || 0)
    };
}

export function clampToCapacity(resources: ResourceAmounts, capacity: ResourceCapacity): ResourceAmounts {
    return {
        food: Math.min(resources.food, capacity.food),
        wood: Math.min(resources.wood, capacity.wood),
        stone: Math.min(resources.stone, capacity.stone),
        metal: Math.min(resources.metal, capacity.metal),
        gold: Math.min(resources.gold, capacity.gold)
    };
}
