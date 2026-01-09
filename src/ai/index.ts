/**
 * Civil Zones - AI System
 * Central export point for all AI modules
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export type {
    AIGameState,
    AIWanderState,
    AIAction,
    AITarget,
    BuildRatio,
    StrategyStep,
    SequenceStrategy,
    RatioStrategy,
    StrategyType,
    QTable,
    QLearningParams,
    QLearningStats,
    LearningPhase,
    DeathCause,
    DeathRecord,
    MacroStepCondition,
    MacroStep,
    MacroPlaybook,
    TacticStats,
    SavedPlaybook,
    PlaybookStep,
    ExploreStats,
    DeathLocation,
    ExpansionStats,
    PopTierStrategy,
    BlockerDiagnosis
} from './types.js';

export {
    DEFAULT_QLEARNING_PARAMS,
    AI_ACTIONS,
    AI_UPDATE_INTERVAL,
    BLUEPRINT_UPDATE_INTERVAL
} from './types.js';

// ═══════════════════════════════════════════════════════════════════
// STATE READING
// ═══════════════════════════════════════════════════════════════════

export {
    readGameState,
    readWanderState,
    checkNearWater,
    findNearestWater,
    countExploredTiles,
    getCityExpansionStats,
    diagnoseBlockers,
    getPopTierStrategy
} from './state.js';

// ═══════════════════════════════════════════════════════════════════
// Q-LEARNING
// ═══════════════════════════════════════════════════════════════════

export {
    getQ,
    updateQ,
    pruneQTable,
    getBestAction,
    chooseActionEpsilonGreedy,
    encodeWanderState,
    encodeCityState,
    bucket,
    calculateReward,
    createStats,
    updateStats,
    determineLearningPhase,
    getPhaseExplorationRate,
    recordDeath,
    analyzeDeaths,
    saveQTable,
    loadQTable,
    exportQTableToFile,
    importQTableFromFile
} from './qlearning.js';

// ═══════════════════════════════════════════════════════════════════
// STRATEGIES
// ═══════════════════════════════════════════════════════════════════

export {
    DEFAULT_PLAYBOOKS,
    STARTER_STRATEGY,
    BALANCED_STRATEGY,
    HOUSING_HEAVY_STRATEGY,
    initTacticStats,
    selectTactic,
    recordTacticResult,
    macroConditionsMet,
    resolveMacroAction,
    getNextBuildFromRatio,
    isCityBalanced
} from './strategies.js';

// ═══════════════════════════════════════════════════════════════════
// EXPLORATION
// ═══════════════════════════════════════════════════════════════════

export {
    TARGET_PRIORITY,
    findBestTarget,
    findExploreTarget,
    createExploreStats,
    recordTileVisit,
    recordExplorationDeath,
    recordResourceCollection,
    getExplorationCoverage,
    getDangerZones,
    MovementTracker,
    getRandomDirection,
    getWeightedDirection
} from './exploration.js';
