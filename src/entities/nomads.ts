/**
 * Civil Zones - Nomad Interactions
 * Functions for nomad encounters and rewards
 */

import type { 
    Nomad, 
    NomadEncounterType, 
    NomadEncounterResult,
    LootRange 
} from './types.js';
import { DEFAULT_NOMAD_CONFIG } from './types.js';

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
    nomadsFound: number;
    loreSeen?: Record<string, boolean>;
}

interface ConfigLike {
    NOMAD?: {
        FRIENDLY_CHANCE?: number;
        HOSTILE_CHANCE?: number;
        POP_GAIN?: number;
        HOSTILE_DAMAGE?: LootRange;
        LOOT_FOOD?: LootRange;
        LOOT_WOOD?: LootRange;
        LOOT_STONE?: LootRange;
        MAP_REVEAL_RADIUS?: number;
        CAPACITY_GAIN?: number;
    };
}

interface TileEntityNomad {
    type: 'NOMAD';
    is_hostile: boolean;
    damage: number;
    pop: number;
    loot: {
        food: number;
        wood: number;
        metal: number;
        stone?: number;
    };
}

// ═══════════════════════════════════════════════════════════════════
// NOMAD GENERATION
// ═══════════════════════════════════════════════════════════════════

/** Generate random value in range */
function randomInRange(range: LootRange): number {
    return range.min + Math.floor(Math.random() * (range.max - range.min + 1));
}

/** Determine if nomad is hostile */
export function isNomadHostile(config?: ConfigLike): boolean {
    const hostileChance = config?.NOMAD?.HOSTILE_CHANCE || DEFAULT_NOMAD_CONFIG.HOSTILE_CHANCE;
    return Math.random() < hostileChance;
}

/** Generate nomad encounter data */
export function generateNomadEncounter(
    config?: ConfigLike
): TileEntityNomad {
    const cfg = config?.NOMAD || DEFAULT_NOMAD_CONFIG;
    const isHostile = isNomadHostile(config);
    
    if (isHostile) {
        const damage = randomInRange(cfg.HOSTILE_DAMAGE || DEFAULT_NOMAD_CONFIG.HOSTILE_DAMAGE);
        return {
            type: 'NOMAD',
            is_hostile: true,
            damage,
            pop: 0,
            loot: { food: 0, wood: 0, metal: 0, stone: 0 }
        };
    }
    
    // Friendly nomad with loot
    const foodRange = cfg.LOOT_FOOD || DEFAULT_NOMAD_CONFIG.LOOT_FOOD;
    const woodRange = cfg.LOOT_WOOD || DEFAULT_NOMAD_CONFIG.LOOT_WOOD;
    const stoneRange = cfg.LOOT_STONE || DEFAULT_NOMAD_CONFIG.LOOT_STONE;
    
    return {
        type: 'NOMAD',
        is_hostile: false,
        damage: 0,
        pop: cfg.POP_GAIN || DEFAULT_NOMAD_CONFIG.POP_GAIN,
        loot: {
            food: randomInRange(foodRange),
            wood: randomInRange(woodRange),
            metal: Math.floor(Math.random() * 10), // 0-9 metal
            stone: randomInRange(stoneRange)
        }
    };
}

// ═══════════════════════════════════════════════════════════════════
// NOMAD ENCOUNTER PROCESSING
// ═══════════════════════════════════════════════════════════════════

/** Process hostile nomad encounter */
export function processHostileEncounter(
    game: GameLike,
    damage: number
): NomadEncounterResult {
    game.pop = Math.max(0, game.pop - damage);
    
    return {
        type: 'HOSTILE',
        popGained: 0,
        popLost: damage,
        loot: { food: 0, wood: 0, stone: 0 },
        mapReveal: false,
        message: `⚔️ HOSTILE NOMAD! Ambush! -${damage} Population`
    };
}

/** Process friendly nomad encounter */
export function processFriendlyEncounter(
    game: GameLike,
    entity: TileEntityNomad,
    config?: ConfigLike
): NomadEncounterResult {
    // Increment counters
    game.nomadsFound++;
    game.pop += entity.pop;
    
    // Calculate total loot
    const totalLoot = entity.loot.food + entity.loot.wood + 
                      entity.loot.metal + (entity.loot.stone || 0);
    const currentInventory = game.inventory.food + game.inventory.wood + 
                             game.inventory.metal + game.inventory.stone;
    const spaceAvailable = game.inventory.capacity - currentInventory;
    
    // Transfer what fits (priority: food > wood > metal > stone)
    let foodAdded = 0, woodAdded = 0, metalAdded = 0, stoneAdded = 0;
    
    if (spaceAvailable >= totalLoot) {
        // All loot fits
        game.inventory.food += entity.loot.food;
        game.totalFoodCollected += entity.loot.food;
        game.inventory.wood += entity.loot.wood;
        game.inventory.metal += entity.loot.metal;
        game.inventory.stone += entity.loot.stone || 0;
        foodAdded = entity.loot.food;
        woodAdded = entity.loot.wood;
        metalAdded = entity.loot.metal;
        stoneAdded = entity.loot.stone || 0;
    } else if (spaceAvailable > 0) {
        // Partial loot - prioritize food > wood > metal > stone
        let remaining = spaceAvailable;
        
        foodAdded = Math.min(entity.loot.food, remaining);
        game.inventory.food += foodAdded;
        game.totalFoodCollected += foodAdded;
        remaining -= foodAdded;
        
        if (remaining > 0) {
            woodAdded = Math.min(entity.loot.wood, remaining);
            game.inventory.wood += woodAdded;
            remaining -= woodAdded;
        }
        if (remaining > 0) {
            metalAdded = Math.min(entity.loot.metal, remaining);
            game.inventory.metal += metalAdded;
            remaining -= metalAdded;
        }
        if (remaining > 0) {
            stoneAdded = Math.min(entity.loot.stone || 0, remaining);
            game.inventory.stone += stoneAdded;
        }
    }
    
    // Increase capacity (+100 per nomad)
    const capacityGain = config?.NOMAD?.CAPACITY_GAIN || 100;
    game.inventory.capacity += capacityGain;
    
    const lootMsg = spaceAvailable >= totalLoot 
        ? `+${foodAdded}F +${woodAdded}W +${metalAdded}M +${stoneAdded}S` 
        : `+${foodAdded}F +${woodAdded}W +${metalAdded}M +${stoneAdded}S (Inventory was full!)`;
    
    return {
        type: 'FRIENDLY',
        popGained: entity.pop,
        popLost: 0,
        loot: { food: foodAdded, wood: woodAdded, stone: stoneAdded },
        mapReveal: true,
        message: `👤 OOGA BOOGA! Nomad joined! +${entity.pop} Pop, ${lootMsg}, Capacity: ${game.inventory.capacity}`
    };
}

/** Process nomad encounter (main function) */
export function encounterNomad(
    game: GameLike,
    entity: TileEntityNomad,
    config?: ConfigLike
): NomadEncounterResult {
    if (entity.is_hostile) {
        return processHostileEncounter(game, entity.damage);
    }
    return processFriendlyEncounter(game, entity, config);
}

// ═══════════════════════════════════════════════════════════════════
// LORE TRACKING
// ═══════════════════════════════════════════════════════════════════

/** Check and trigger first nomad lore */
export function checkFirstNomadLore(
    game: GameLike
): { trigger: string | null } {
    if (!game.loreSeen) game.loreSeen = {};
    
    if (!game.loreSeen.FIRST_NOMAD) {
        game.loreSeen.FIRST_NOMAD = true;
        return { trigger: 'FIRST_NOMAD' };
    }
    
    return { trigger: null };
}

// ═══════════════════════════════════════════════════════════════════
// NOMAD UTILITIES
// ═══════════════════════════════════════════════════════════════════

/** Get encounter type description */
export function getEncounterTypeDescription(type: NomadEncounterType): string {
    switch (type) {
        case 'FRIENDLY': return 'A friendly wanderer approaches';
        case 'HOSTILE': return 'An aggressive stranger appears!';
        case 'NEUTRAL': return 'A mysterious figure watches';
        default: return 'An unknown presence';
    }
}

/** Preview nomad encounter (for UI) */
export function previewNomadEncounter(
    isHostile: boolean,
    config?: ConfigLike
): {
    type: NomadEncounterType;
    potentialPopChange: [number, number];
    potentialLoot: boolean;
    danger: 'safe' | 'risky';
} {
    const cfg = config?.NOMAD || DEFAULT_NOMAD_CONFIG;
    
    if (isHostile) {
        const dmgRange = cfg.HOSTILE_DAMAGE || DEFAULT_NOMAD_CONFIG.HOSTILE_DAMAGE;
        return {
            type: 'HOSTILE',
            potentialPopChange: [-dmgRange.max, -dmgRange.min],
            potentialLoot: false,
            danger: 'risky'
        };
    }
    
    const popGain = cfg.POP_GAIN || DEFAULT_NOMAD_CONFIG.POP_GAIN;
    return {
        type: 'FRIENDLY',
        potentialPopChange: [popGain, popGain],
        potentialLoot: true,
        danger: 'safe'
    };
}

/** Calculate nomad encounter odds for display */
export function getNomadOdds(config?: ConfigLike): {
    friendlyPercent: number;
    hostilePercent: number;
} {
    const friendly = config?.NOMAD?.FRIENDLY_CHANCE || DEFAULT_NOMAD_CONFIG.FRIENDLY_CHANCE;
    const hostile = config?.NOMAD?.HOSTILE_CHANCE || DEFAULT_NOMAD_CONFIG.HOSTILE_CHANCE;
    
    return {
        friendlyPercent: Math.round(friendly * 100),
        hostilePercent: Math.round(hostile * 100)
    };
}
