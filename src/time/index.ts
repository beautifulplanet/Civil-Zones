/**
 * Civil Zones - Time Module
 * Turn processing, year progression, and resource spoilage
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════
export type {
    // Turn result
    TurnResult,
    TurnEvent,
    TurnEventType,
    
    // Production
    ProductionRates,
    ConsumptionRates,
    SpoilageRates,
    
    // Population
    PopulationChange,
    
    // Game over
    GameOverReason,
    GameOverResult,
    
    // Config
    TimeConfig
} from './types.js';

// Re-export with prefix to avoid conflicts
export type { TimeState as TurnTimeState } from './types.js';
export type { DeathCause as TurnDeathCause } from './types.js';

export {
    // Constants
    DEFAULT_TIME_CONFIG,
    DEFAULT_SPOILAGE_RATES,
    DEFAULT_POPULATION_CONFIG
} from './types.js';

// ═══════════════════════════════════════════════════════════════════
// TURNS
// ═══════════════════════════════════════════════════════════════════
export {
    // Time state management
    createTimeState,
    advanceYear,
    setAge,
    togglePause,
    setSpeed,
    
    // Turn event helpers
    createTurnEvent,
    yearAdvanceEvent,
    foodSpoilageEvent,
    starvationEvent,
    growthEvent,
    waterShortageEvent,
    overcrowdingEvent,
    plagueEvent,
    buildingAbandonEvent,
    
    // Turn result helpers
    createTurnResult,
    createGameOverResult,
    
    // Population calculations
    calculateGrowth,
    calculateStarvation,
    calculateDehydration,
    calculateOvercrowding,
    calculatePlague,
    
    // Game over helpers
    getGameOverMessage,
    shouldGameEnd,
    
    // Time formatting
    formatYear,
    getEpochName,
    isMilestoneYear
} from './turns.js';

// ═══════════════════════════════════════════════════════════════════
// SPOILAGE
// ═══════════════════════════════════════════════════════════════════
export type {
    ResourceAmounts,
    StorageCapacities,
    AllSpoilageResult
} from './spoilage.js';

export {
    // Individual spoilage
    calculateSpoilage,
    calculateFoodSpoilage,
    calculateWoodDecay,
    calculateStoneLoss,
    calculateMetalRust,
    
    // Batch processing
    processAllSpoilage,
    
    // Upkeep
    calculateBuildingUpkeep,
    processUpkeep
} from './spoilage.js';
