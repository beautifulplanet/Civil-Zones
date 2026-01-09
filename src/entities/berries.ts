/**
 * Civil Zones - Berry Gathering
 * Functions for berry bush interactions
 */

import type { BerryGatherResult } from './types.js';
import { DEFAULT_BERRY_CONFIG } from './types.js';

// ═══════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════

interface InventoryLike {
    food: number;
    wood: number;
    stone: number;
    metal: number;
    capacity: number;
}

interface GameLike {
    pop: number;
    inventory: InventoryLike;
    totalFoodCollected: number;
    loreSeen?: Record<string, boolean>;
}

interface ConfigLike {
    BERRIES?: {
        FOOD_VALUE?: number;
        POISON_CHANCE?: number;
        POISON_DAMAGE?: number;
    };
}

interface TileEntityBerry {
    type: 'BERRY';
    amount: number;
    is_poisonous: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// BERRY GENERATION
// ═══════════════════════════════════════════════════════════════════

/** Determine if berry is poisonous */
export function isBerryPoisonous(config?: ConfigLike): boolean {
    const poisonChance = config?.BERRIES?.POISON_CHANCE || DEFAULT_BERRY_CONFIG.POISON_CHANCE;
    return Math.random() < poisonChance;
}

/** Generate berry entity data */
export function generateBerryEntity(
    config?: ConfigLike
): TileEntityBerry {
    const cfg = config?.BERRIES || DEFAULT_BERRY_CONFIG;
    const isPoisonous = isBerryPoisonous(config);
    
    return {
        type: 'BERRY',
        amount: cfg.FOOD_VALUE || DEFAULT_BERRY_CONFIG.FOOD_VALUE,
        is_poisonous: isPoisonous
    };
}

// ═══════════════════════════════════════════════════════════════════
// BERRY GATHERING
// ═══════════════════════════════════════════════════════════════════

/** Process poisonous berry encounter */
export function processPoisonBerry(
    game: GameLike,
    config?: ConfigLike
): BerryGatherResult {
    const damage = config?.BERRIES?.POISON_DAMAGE || DEFAULT_BERRY_CONFIG.POISON_DAMAGE;
    game.pop = Math.max(0, game.pop - damage);
    
    return {
        success: false,
        poisoned: true,
        foodGained: 0,
        popLost: damage,
        message: `☠️ POISON BERRY! -${damage} Population - YUCK!`
    };
}

/** Process safe berry gathering */
export function processSafeBerry(
    game: GameLike,
    amount: number
): BerryGatherResult {
    const totalInventory = game.inventory.food + game.inventory.wood + 
                           game.inventory.metal + game.inventory.stone;
    const spaceAvailable = game.inventory.capacity - totalInventory;
    
    // Check if inventory is completely full
    if (spaceAvailable <= 0) {
        return {
            success: false,
            poisoned: false,
            foodGained: 0,
            popLost: 0,
            message: `⚠️ Inventory full! (${Math.floor(totalInventory)}/${game.inventory.capacity}) - Cannot collect berry`
        };
    }
    
    // Collect as much as possible
    const foodToCollect = Math.min(amount, spaceAvailable);
    game.inventory.food += foodToCollect;
    game.totalFoodCollected += foodToCollect;
    
    const message = foodToCollect === amount
        ? `🫐 Found Berry! +${amount} food (${Math.floor(game.inventory.food)}/${game.inventory.capacity}) - YUM!`
        : `🫐 Found Berry! +${foodToCollect}/${amount} food (Inventory Full!) - YUM!`;
    
    return {
        success: true,
        poisoned: false,
        foodGained: foodToCollect,
        popLost: 0,
        message
    };
}

/** Gather from a berry bush (main function) */
export function gatherBerry(
    game: GameLike,
    entity: TileEntityBerry,
    config?: ConfigLike
): BerryGatherResult {
    if (entity.is_poisonous) {
        return processPoisonBerry(game, config);
    }
    return processSafeBerry(game, entity.amount);
}

// ═══════════════════════════════════════════════════════════════════
// LORE TRACKING
// ═══════════════════════════════════════════════════════════════════

/** Check and trigger first berry lore */
export function checkFirstBerryLore(
    game: GameLike
): { trigger: string | null } {
    if (!game.loreSeen) game.loreSeen = {};
    
    if (!game.loreSeen.FIRST_BERRY) {
        game.loreSeen.FIRST_BERRY = true;
        return { trigger: 'FIRST_BERRY' };
    }
    
    return { trigger: null };
}

// ═══════════════════════════════════════════════════════════════════
// BERRY UTILITIES
// ═══════════════════════════════════════════════════════════════════

/** Check if inventory has space for berries */
export function canGatherBerry(game: GameLike): boolean {
    const totalInventory = game.inventory.food + game.inventory.wood + 
                           game.inventory.metal + game.inventory.stone;
    return game.inventory.capacity > totalInventory;
}

/** Get berry gathering preview (for UI) */
export function previewBerryGather(
    entity: TileEntityBerry,
    game: GameLike,
    config?: ConfigLike
): {
    potentialFood: number;
    poisonRisk: number;
    spaceAvailable: number;
    willFit: boolean;
} {
    const totalInventory = game.inventory.food + game.inventory.wood + 
                           game.inventory.metal + game.inventory.stone;
    const spaceAvailable = game.inventory.capacity - totalInventory;
    const poisonChance = config?.BERRIES?.POISON_CHANCE || DEFAULT_BERRY_CONFIG.POISON_CHANCE;
    
    return {
        potentialFood: entity.amount,
        poisonRisk: Math.round(poisonChance * 100),
        spaceAvailable,
        willFit: spaceAvailable >= entity.amount
    };
}

/** Get berry odds for display */
export function getBerryOdds(config?: ConfigLike): {
    safePercent: number;
    poisonPercent: number;
    foodValue: number;
    poisonDamage: number;
} {
    const cfg = config?.BERRIES || DEFAULT_BERRY_CONFIG;
    const poisonChance = cfg.POISON_CHANCE || DEFAULT_BERRY_CONFIG.POISON_CHANCE;
    
    return {
        safePercent: Math.round((1 - poisonChance) * 100),
        poisonPercent: Math.round(poisonChance * 100),
        foodValue: cfg.FOOD_VALUE || DEFAULT_BERRY_CONFIG.FOOD_VALUE,
        poisonDamage: cfg.POISON_DAMAGE || DEFAULT_BERRY_CONFIG.POISON_DAMAGE
    };
}
