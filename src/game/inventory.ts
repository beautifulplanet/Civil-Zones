/**
 * Civil Zones - Inventory System
 * Handles resource storage, capacity, and transfers
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Main inventory for wandering phase */
export interface WanderInventory {
    capacity: number;   // Base 150, +100 per nomad
    food: number;
    wood: number;
    metal: number;
    stone: number;
}

/** Pocket inventory for passive finds (separate, immutable) */
export interface PocketInventory {
    metal: number;
    stone: number;
    capacity: number;   // Max 1000 (anti-cheat cap)
}

/** City resources (Epoch 1+) */
export interface CityResources {
    food: number;
    wood: number;
    metal: number;
    stone: number;
    water: number;
    gold: number;
}

/** Resource type for type-safe access */
export type ResourceType = 'food' | 'wood' | 'metal' | 'stone' | 'water' | 'gold';

/** Inventory transfer result */
export interface TransferResult {
    success: boolean;
    amountTransferred: number;
    overflow: number;
    message?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT VALUES
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_WANDER_INVENTORY: WanderInventory = {
    capacity: 450,  // 150 base + 300 (3 extra people × 100)
    food: 300,      // Starting supplies for 4 people
    wood: 300,      // Starting supplies for 4 people
    metal: 0,
    stone: 0
};

export const DEFAULT_POCKET_INVENTORY: PocketInventory = {
    metal: 0,
    stone: 0,
    capacity: 1000
};

export const DEFAULT_CITY_RESOURCES: CityResources = {
    food: 0,
    wood: 0,
    metal: 0,
    stone: 0,
    water: 100,
    gold: 0
};

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTORY OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a new wander inventory
 */
export function createWanderInventory(
    nomadCount: number = 3,
    startingFood: number = 300,
    startingWood: number = 300
): WanderInventory {
    const BASE_CAPACITY = 150;
    const CAPACITY_PER_NOMAD = 100;
    
    return {
        capacity: BASE_CAPACITY + (nomadCount * CAPACITY_PER_NOMAD),
        food: startingFood,
        wood: startingWood,
        metal: 0,
        stone: 0
    };
}

/**
 * Get total items in inventory
 */
export function getInventoryTotal(inventory: WanderInventory): number {
    return inventory.food + inventory.wood + inventory.metal + inventory.stone;
}

/**
 * Get available space in inventory
 */
export function getAvailableSpace(inventory: WanderInventory): number {
    return Math.max(0, inventory.capacity - getInventoryTotal(inventory));
}

/**
 * Check if inventory has space for amount
 */
export function hasSpace(inventory: WanderInventory, amount: number): boolean {
    return getAvailableSpace(inventory) >= amount;
}

/**
 * Add resource to inventory with overflow handling
 */
export function addToInventory(
    inventory: WanderInventory,
    resource: keyof Omit<WanderInventory, 'capacity'>,
    amount: number
): TransferResult {
    const space = getAvailableSpace(inventory);
    
    if (space <= 0) {
        return {
            success: false,
            amountTransferred: 0,
            overflow: amount,
            message: 'Inventory full!'
        };
    }
    
    if (space >= amount) {
        inventory[resource] += amount;
        return {
            success: true,
            amountTransferred: amount,
            overflow: 0
        };
    }
    
    // Partial pickup
    inventory[resource] += space;
    return {
        success: true,
        amountTransferred: space,
        overflow: amount - space,
        message: `Partial pickup: ${space}/${amount}`
    };
}

/**
 * Remove resource from inventory
 */
export function removeFromInventory(
    inventory: WanderInventory,
    resource: keyof Omit<WanderInventory, 'capacity'>,
    amount: number
): TransferResult {
    const current = inventory[resource];
    
    if (current >= amount) {
        inventory[resource] -= amount;
        return {
            success: true,
            amountTransferred: amount,
            overflow: 0
        };
    }
    
    // Not enough resources
    inventory[resource] = 0;
    return {
        success: false,
        amountTransferred: current,
        overflow: amount - current,
        message: `Not enough ${resource}!`
    };
}

/**
 * Check if inventory has enough resources
 */
export function hasResources(
    inventory: WanderInventory,
    food: number = 0,
    wood: number = 0,
    metal: number = 0,
    stone: number = 0
): boolean {
    return (
        inventory.food >= food &&
        inventory.wood >= wood &&
        inventory.metal >= metal &&
        inventory.stone >= stone
    );
}

/**
 * Increase inventory capacity (when recruiting nomads)
 */
export function increaseCapacity(inventory: WanderInventory, amount: number = 100): void {
    inventory.capacity += amount;
}

// ═══════════════════════════════════════════════════════════════════════════════
// POCKET INVENTORY OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Add to pocket inventory (for passive finds)
 */
export function addToPocket(
    pocket: PocketInventory,
    resource: 'metal' | 'stone',
    amount: number
): TransferResult {
    const total = pocket.metal + pocket.stone;
    const space = pocket.capacity - total;
    
    if (space <= 0) {
        return {
            success: false,
            amountTransferred: 0,
            overflow: amount,
            message: 'Pocket full!'
        };
    }
    
    const toAdd = Math.min(amount, space);
    pocket[resource] += toAdd;
    
    return {
        success: true,
        amountTransferred: toAdd,
        overflow: amount - toAdd
    };
}

/**
 * Get total pocket inventory
 */
export function getPocketTotal(pocket: PocketInventory): number {
    return pocket.metal + pocket.stone;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CITY RESOURCE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create city resources from wander inventory
 */
export function createCityResources(
    inventory: WanderInventory,
    populationBonus: number = 0
): CityResources {
    const bonusMultiplier = 1 + (populationBonus / 100);
    
    return {
        food: Math.floor(inventory.food * bonusMultiplier),
        wood: Math.floor(inventory.wood * bonusMultiplier),
        metal: inventory.metal,
        stone: inventory.stone,
        water: 100,
        gold: 0
    };
}

/**
 * Add resources to city
 */
export function addCityResource(
    resources: CityResources,
    type: ResourceType,
    amount: number
): void {
    resources[type] += amount;
}

/**
 * Remove resources from city
 */
export function removeCityResource(
    resources: CityResources,
    type: ResourceType,
    amount: number
): boolean {
    if (resources[type] >= amount) {
        resources[type] -= amount;
        return true;
    }
    return false;
}

/**
 * Check if city has resources for a cost
 */
export function canAfford(
    resources: CityResources,
    cost: Partial<CityResources>
): boolean {
    for (const [type, amount] of Object.entries(cost)) {
        if (amount && resources[type as ResourceType] < amount) {
            return false;
        }
    }
    return true;
}

/**
 * Deduct cost from city resources
 */
export function deductCost(
    resources: CityResources,
    cost: Partial<CityResources>
): boolean {
    if (!canAfford(resources, cost)) {
        return false;
    }
    
    for (const [type, amount] of Object.entries(cost)) {
        if (amount) {
            resources[type as ResourceType] -= amount;
        }
    }
    
    return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISPLAY HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Format resource amount for display
 */
export function formatResource(amount: number): string {
    if (amount >= 1000000) {
        return (amount / 1000000).toFixed(1) + 'M';
    }
    if (amount >= 1000) {
        return (amount / 1000).toFixed(1) + 'K';
    }
    return Math.floor(amount).toString();
}

/**
 * Get inventory fill percentage
 */
export function getInventoryFillPercent(inventory: WanderInventory): number {
    return (getInventoryTotal(inventory) / inventory.capacity) * 100;
}

/**
 * Get resource color by type
 */
export function getResourceColor(type: ResourceType): string {
    const colors: Record<ResourceType, string> = {
        food: '#8B4513',    // Brown (meat)
        wood: '#228B22',    // Forest green
        metal: '#C0C0C0',   // Silver
        stone: '#708090',   // Slate gray
        water: '#4169E1',   // Royal blue
        gold: '#FFD700'     // Gold
    };
    return colors[type];
}

/**
 * Get resource emoji by type
 */
export function getResourceEmoji(type: ResourceType): string {
    const emojis: Record<ResourceType, string> = {
        food: '🍖',
        wood: '🪵',
        metal: '⚙️',
        stone: '🪨',
        water: '💧',
        gold: '🪙'
    };
    return emojis[type];
}
