/**
 * Combat Configuration
 * Single source of truth for all combat-related stats and behaviors
 * WANDER mode hunting, animal encounters, and nomad interactions
 */

export type AnimalBehavior = 'flee' | 'charge' | 'aggressive' | 'slow';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface AnimalStats {
    readonly hp: number;
    readonly foodReward: readonly [number, number]; // [min, max]
    readonly behavior: AnimalBehavior;
    readonly risk: RiskLevel;
    readonly fleeDistance: number;    // Distance at which animal starts fleeing
    readonly fleeSpeed: number;       // Speed multiplier when fleeing
}

/**
 * Animal configuration - all stats in one place
 * Per game-data-spec.md Section 3.1 Combat System
 */
export const ANIMAL_CONFIG: Record<string, AnimalStats> = {
    'ANIMAL_RABBIT': {
        hp: 1,
        foodReward: [5, 20],
        behavior: 'flee',
        risk: 'low',
        fleeDistance: 4,
        fleeSpeed: 1.5
    },
    'ANIMAL_DEER': {
        hp: 2,
        foodReward: [15, 35],
        behavior: 'flee',
        risk: 'low',
        fleeDistance: 5,
        fleeSpeed: 1.3
    },
    'ANIMAL_BOAR': {
        hp: 3,
        foodReward: [10, 40],
        behavior: 'charge',
        risk: 'high',
        fleeDistance: 3,  // Charges instead of fleeing
        fleeSpeed: 1.4
    },
    'ANIMAL_BEAR': {
        hp: 3,
        foodReward: [20, 50],
        behavior: 'aggressive',
        risk: 'high',
        fleeDistance: 2,  // Very close before reacting
        fleeSpeed: 0.8   // Slow but dangerous
    },
    'ANIMAL_BISON': {
        hp: 3,
        foodReward: [15, 35],
        behavior: 'flee',
        risk: 'medium',
        fleeDistance: 6,
        fleeSpeed: 1.2
    }
} as const;

/**
 * Nomad encounter configuration
 * Per game-data-spec.md Section 3.1
 */
export const NOMAD_CONFIG = {
    hostileChance: 0.25,        // 25% hostile
    friendlyChance: 0.75,       // 75% friendly (join tribe)
    hostileDamage: [1, 2] as readonly [number, number],  // Population loss range
    recruitmentRadius: 1.5      // Distance to trigger interaction
} as const;

/**
 * Combat mechanics
 */
export const COMBAT_CONFIG = {
    attackRange: 1.5,           // Must be this close to attack
    hitChanceBase: 0.6,         // 60% base hit chance
    hitChancePerNomad: 0.10,    // +10% per tribe member
    herdDamageThreshold: 2,     // 2+ animals = herd attack
    herdDamagePercent: 0.15     // 15% population damage from herd
} as const;

/**
 * Inventory limits (WANDER mode)
 */
export const INVENTORY_CONFIG = {
    maxFood: 300,
    maxWood: 300
} as const;

/**
 * Calculate food reward from animal (random within range)
 */
export function calculateFoodReward(animalType: string): number {
    const config = ANIMAL_CONFIG[animalType];
    if (!config) return 0;
    const [min, max] = config.foodReward;
    return Math.floor(min + Math.random() * (max - min + 1));
}

/**
 * Calculate hit chance based on tribe size
 */
export function calculateHitChance(tribeSize: number): number {
    const bonus = Math.min(tribeSize * COMBAT_CONFIG.hitChancePerNomad, 0.4); // Cap at +40%
    return Math.min(COMBAT_CONFIG.hitChanceBase + bonus, 0.95); // Cap at 95%
}

/**
 * Roll for hostile encounter
 */
export function rollHostileEncounter(): boolean {
    return Math.random() < NOMAD_CONFIG.hostileChance;
}

/**
 * Calculate hostile damage (population loss)
 */
export function calculateHostileDamage(): number {
    const [min, max] = NOMAD_CONFIG.hostileDamage;
    return Math.floor(min + Math.random() * (max - min + 1));
}
