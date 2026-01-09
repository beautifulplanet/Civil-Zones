/**
 * Civil Zones - Events Module
 * Lore events and flooding mechanics
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════
export type {
    // Lore types
    LoreIllustration,
    LoreEventId,
    LoreSeen,
    
    // Flood types
    FloodedBuilding,
    FloodStats,
    FloodResult,
    SeaLevelConfig
} from './types.js';

// Re-export with prefix to avoid conflicts
export type { LoreEvent as EventLoreEvent } from './types.js';
export type { GeologyState as EventGeologyState } from './types.js';

// ═══════════════════════════════════════════════════════════════════
// LORE EVENTS
// ═══════════════════════════════════════════════════════════════════
export {
    // Lore data
    LORE_EVENTS,
    
    // Lore functions
    getLoreEvent,
    hasSeenLore,
    markLoreSeen,
    shouldShowLore,
    getUnseenLore,
    getSeenLoreCount,
    getTotalLoreCount,
    getLoreProgress,
    
    // Illustration helpers
    getAllIllustrations,
    isValidIllustration
} from './lore.js';

// Re-export lore triggers with prefix to avoid conflicts with entities
export { 
    checkFirstKillLore as eventCheckFirstKillLore,
    checkFirstTurtleLore as eventCheckFirstTurtleLore,
    checkFirstNomadLore as eventCheckFirstNomadLore,
    checkFirstBerryLore as eventCheckFirstBerryLore,
    checkFirstWellLore,
    checkFirstSettlementLore,
    checkGameStartLore,
    checkFloodWarningLore
} from './lore.js';

// ═══════════════════════════════════════════════════════════════════
// FLOODING
// ═══════════════════════════════════════════════════════════════════
export {
    // Configuration
    DEFAULT_SEA_LEVEL_CONFIG,
    
    // Flood risk (prefixed to avoid conflict with systems)
    isFloodRisk as eventIsFloodRisk,
    getElevationDiff,
    formatElevationMessage,
    
    // Flood processing
    applySeaLevelChange,
    
    // Messages
    generateFloodMessage,
    generateWellsLostMessage,
    
    // Sea level
    updateSeaLevel,
    isSeaLevelRising,
    getSeaLevelDirection,
    
    // Statistics
    updateGeologyStats,
    createInitialGeologyState
} from './flooding.js';
