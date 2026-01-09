/**
 * Civil Zones - Animal Combat
 * Functions for attacking and defeating animals
 */

import type { 
    EntityAnimal, 
    AnimalTypeName, 
    AnimalTypeConfig, 
    AnimalCombatResult 
} from './types.js';
import { DEFAULT_ANIMAL_TYPES, DEFAULT_ANIMAL_CONFIG } from './types.js';
import { getAdjacentAnimals, isHerdLocation } from './spawning.js';

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
    animals: EntityAnimal[];
    pop: number;
    food: number;
    inventory: InventoryLike;
    totalFoodCollected: number;
    gameState: string;
    loreSeen?: Record<string, boolean>;
}

interface ConfigLike {
    ANIMALS?: {
        TYPES: AnimalTypeConfig[];
        PACK_DAMAGE?: number;
    };
}

// ═══════════════════════════════════════════════════════════════════
// ANIMAL CONFIG HELPERS
// ═══════════════════════════════════════════════════════════════════

/** Get animal type configuration */
export function getAnimalConfig(
    animalType: AnimalTypeName,
    config?: ConfigLike
): AnimalTypeConfig | undefined {
    const types = config?.ANIMALS?.TYPES || DEFAULT_ANIMAL_TYPES;
    return types.find(a => a.name === animalType);
}

/** Format animal name for display */
export function formatAnimalName(type: AnimalTypeName): string {
    return type.charAt(0) + type.slice(1).toLowerCase();
}

/** Calculate food reward for an animal */
export function calculateFoodReward(
    animalConfig: AnimalTypeConfig
): number {
    const reward = animalConfig.foodReward;
    
    if (Array.isArray(reward)) {
        // Random range [min, max]
        const [min, max] = reward;
        return min + Math.floor(Math.random() * (max - min + 1));
    }
    
    // Fixed value
    return reward;
}

// ═══════════════════════════════════════════════════════════════════
// COMBAT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/** Hit an animal (increment damage) */
export function hitAnimal(
    animal: EntityAnimal
): { hits: number; defeated: boolean; hitsToKill: number } {
    animal.hits++;
    
    const config = DEFAULT_ANIMAL_TYPES.find(a => a.name === animal.type);
    const hitsToKill = config?.hitToKill || 2;
    
    return {
        hits: animal.hits,
        defeated: animal.hits >= hitsToKill,
        hitsToKill
    };
}

/** Calculate herd damage when fighting near other animals */
export function calculateHerdDamage(
    game: GameLike,
    animalIndex: number,
    config?: ConfigLike
): number {
    const animal = game.animals[animalIndex];
    if (!animal) return 0;
    
    // Only apply herd damage in WANDER mode
    if (game.gameState !== 'WANDER') return 0;
    
    // Check for nearby animals
    const nearbyAnimals = getAdjacentAnimals(
        game.animals, 
        animal.x, 
        animal.y, 
        animalIndex
    );
    
    if (nearbyAnimals.length === 0) return 0;
    
    // Random herd damage 1-3
    const packDamage = config?.ANIMALS?.PACK_DAMAGE || DEFAULT_ANIMAL_CONFIG.PACK_DAMAGE;
    return packDamage + Math.floor(Math.random() * 3);
}

/** Attack an animal and process combat */
export function attackAnimal(
    game: GameLike,
    animalIndex: number,
    config?: ConfigLike
): AnimalCombatResult {
    const animal = game.animals[animalIndex];
    if (!animal) {
        return {
            defeated: false,
            foodGained: 0,
            popLost: 0,
            herdDamage: 0,
            message: '❌ No animal found',
            isHerd: false
        };
    }
    
    const animalConfig = getAnimalConfig(animal.type, config);
    if (!animalConfig) {
        return {
            defeated: false,
            foodGained: 0,
            popLost: 0,
            herdDamage: 0,
            message: '❌ Unknown animal type',
            isHerd: false
        };
    }
    
    const animalName = formatAnimalName(animal.type);
    
    // Hit the animal
    const hitResult = hitAnimal(animal);
    
    // Not defeated yet - just hit
    if (!hitResult.defeated) {
        return {
            defeated: false,
            foodGained: 0,
            popLost: 0,
            herdDamage: 0,
            message: `💥 Hit ${animalName.toLowerCase()}! (${hitResult.hits}/${hitResult.hitsToKill})`,
            isHerd: false
        };
    }
    
    // Animal defeated!
    const isHerd = isHerdLocation(game.animals, animal.x, animal.y, animalIndex);
    let herdDamage = 0;
    let popCost = animalConfig.popCost || 0;
    let foodReward = calculateFoodReward(animalConfig);
    let foodGained = 0;
    let gameOver = false;
    
    // Calculate herd damage
    if (isHerd && game.gameState === 'WANDER') {
        herdDamage = 1 + Math.floor(Math.random() * 3);
        game.pop = Math.max(0, game.pop - herdDamage);
        
        if (game.pop === 0) {
            game.animals.splice(animalIndex, 1);
            return {
                defeated: true,
                foodGained: 0,
                popLost: herdDamage,
                herdDamage,
                message: '💀 Your tribe has perished attacking a herd!',
                isHerd: true,
                gameOver: true
            };
        }
    }
    
    // Apply base population cost (wolves cost pop)
    if (popCost > 0 && game.pop > 0) {
        game.pop = Math.max(0, game.pop - popCost);
        
        if (game.pop === 0) {
            gameOver = true;
        }
    }
    
    // Calculate total pop lost
    const totalPopLost = popCost + herdDamage;
    
    // Award food
    if (game.gameState === 'WANDER') {
        // Check inventory capacity
        const totalInventory = game.inventory.food + game.inventory.wood + 
                               game.inventory.metal + game.inventory.stone;
        const spaceAvailable = game.inventory.capacity - totalInventory;
        
        if (spaceAvailable >= foodReward) {
            game.inventory.food += foodReward;
            foodGained = foodReward;
        } else if (spaceAvailable > 0) {
            game.inventory.food += spaceAvailable;
            foodGained = spaceAvailable;
        }
    } else {
        // City mode - add to main food storage
        game.food += foodReward;
        foodGained = foodReward;
    }
    
    game.totalFoodCollected += foodGained;
    
    // Remove the animal
    game.animals.splice(animalIndex, 1);
    
    // Build message
    let message = `🎯 ${animalName} defeated!`;
    if (totalPopLost > 0) {
        message += ` (-${totalPopLost} Pop)`;
    }
    if (foodGained > 0) {
        message += ` +${foodGained} Food`;
    } else if (foodGained < foodReward) {
        message += ` Food lost - Inventory Full!`;
    }
    if (!isHerd) {
        message += ' (Safe hunt!)';
    }
    message += ' 🍖';
    
    return {
        defeated: true,
        foodGained,
        popLost: totalPopLost,
        herdDamage,
        message,
        isHerd,
        gameOver
    };
}

// ═══════════════════════════════════════════════════════════════════
// LORE TRACKING
// ═══════════════════════════════════════════════════════════════════

/** Check and trigger first kill lore */
export function checkFirstKillLore(
    game: GameLike,
    animalType: AnimalTypeName
): { trigger: string | null } {
    if (!game.loreSeen) game.loreSeen = {};
    
    // First kill ever
    if (!game.loreSeen.FIRST_KILL) {
        game.loreSeen.FIRST_KILL = true;
        return { trigger: 'FIRST_KILL' };
    }
    
    // First turtle kill
    if (animalType === 'TURTLE' && !game.loreSeen.FIRST_TURTLE) {
        game.loreSeen.FIRST_TURTLE = true;
        return { trigger: 'FIRST_TURTLE' };
    }
    
    return { trigger: null };
}

// ═══════════════════════════════════════════════════════════════════
// COMBAT UTILITIES
// ═══════════════════════════════════════════════════════════════════

/** Check if player can attack (has population) */
export function canAttack(game: GameLike): boolean {
    return game.pop > 0;
}

/** Get danger level of attacking at a position */
export function getAttackDangerLevel(
    animals: EntityAnimal[],
    x: number,
    y: number
): 'safe' | 'herd' | 'dangerous' {
    const adjacent = getAdjacentAnimals(animals, x, y);
    
    if (adjacent.length === 0) return 'safe';
    if (adjacent.length <= 2) return 'herd';
    return 'dangerous';
}

/** Preview combat outcome (for AI/UI) */
export function previewCombat(
    game: GameLike,
    animalIndex: number,
    config?: ConfigLike
): {
    animal: EntityAnimal;
    hitsRemaining: number;
    potentialHerdDamage: [number, number];
    potentialFood: [number, number];
    isHerd: boolean;
} | null {
    const animal = game.animals[animalIndex];
    if (!animal) return null;
    
    const animalConfig = getAnimalConfig(animal.type, config);
    if (!animalConfig) return null;
    
    const isHerd = isHerdLocation(game.animals, animal.x, animal.y, animalIndex);
    const hitsRemaining = animalConfig.hitToKill - animal.hits;
    
    // Food range
    const foodReward = animalConfig.foodReward;
    const potentialFood: [number, number] = Array.isArray(foodReward) 
        ? foodReward 
        : [foodReward, foodReward];
    
    // Herd damage range (1-3 if herd)
    const potentialHerdDamage: [number, number] = isHerd ? [1, 3] : [0, 0];
    
    return {
        animal,
        hitsRemaining,
        potentialHerdDamage,
        potentialFood,
        isHerd
    };
}
