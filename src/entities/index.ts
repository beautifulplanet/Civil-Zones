/**
 * Civil Zones - Entities Module
 * Animals, nomads, berries, and entity spawning
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════
export type {
    // Animals
    AnimalTypeName,
    AnimalTypeConfig,
    EntityAnimal,
    AnimalCombatResult,
    
    // Nomads
    NomadEncounterType,
    Nomad,
    NomadEncounterResult,
    LootRange,
    
    // Berries
    BerryBush,
    BerryGatherResult,
    
    // Entity tile data
    EntityTileData,
    
    // Spawning
    SpawnPosition,
    SpawnOptions
} from './types.js';

export {
    // Constants
    DEFAULT_ANIMAL_TYPES,
    DEFAULT_ANIMAL_CONFIG,
    DEFAULT_NOMAD_CONFIG,
    DEFAULT_BERRY_CONFIG
} from './types.js';

// ═══════════════════════════════════════════════════════════════════
// SPAWNING
// ═══════════════════════════════════════════════════════════════════
export {
    // Position helpers
    getRandomPosition,
    isValidSpawnPosition,
    getValidTerrain,
    
    // Animal spawning
    selectAnimalType,
    getValidAnimalTypes,
    spawnAnimals,
    spawnBeachTurtles,
    initializeAnimals,
    
    // Nomad spawning
    spawnNomads,
    
    // Berry spawning
    spawnBerries,
    
    // Utility functions
    getAnimalAt,
    getAdjacentAnimals,
    isHerdLocation,
    countAnimalsByType
} from './spawning.js';

// ═══════════════════════════════════════════════════════════════════
// COMBAT
// ═══════════════════════════════════════════════════════════════════
export {
    // Config helpers
    getAnimalConfig,
    formatAnimalName,
    calculateFoodReward,
    
    // Combat functions
    hitAnimal,
    calculateHerdDamage,
    attackAnimal,
    
    // Lore
    checkFirstKillLore,
    
    // Utilities
    canAttack,
    getAttackDangerLevel,
    previewCombat
} from './combat.js';

// ═══════════════════════════════════════════════════════════════════
// NOMADS
// ═══════════════════════════════════════════════════════════════════
export {
    // Generation
    isNomadHostile,
    generateNomadEncounter,
    
    // Encounter processing
    processHostileEncounter,
    processFriendlyEncounter,
    encounterNomad,
    
    // Lore
    checkFirstNomadLore,
    
    // Utilities
    getEncounterTypeDescription,
    previewNomadEncounter,
    getNomadOdds
} from './nomads.js';

// ═══════════════════════════════════════════════════════════════════
// BERRIES
// ═══════════════════════════════════════════════════════════════════
export {
    // Generation
    isBerryPoisonous,
    generateBerryEntity,
    
    // Gathering
    processPoisonBerry,
    processSafeBerry,
    gatherBerry,
    
    // Lore
    checkFirstBerryLore,
    
    // Utilities
    canGatherBerry,
    previewBerryGather,
    getBerryOdds
} from './berries.js';
