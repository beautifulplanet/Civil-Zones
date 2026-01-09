/**
 * Civil Zones - AI Types
 * Type definitions for AI systems
 */

// ═══════════════════════════════════════════════════════════════════
// AI STATE
// ═══════════════════════════════════════════════════════════════════

/** AI-readable game state from UI */
export interface AIGameState {
    // Population & Resources
    pop: number;
    food: number;
    wood: number;
    stone: number;
    metal: number;
    gold: number;
    year: number;
    
    // Housing & Water
    housingCap: number;
    wells: number;
    waterCapacity: number;
    waterPercent: number;
    
    // Building counts
    resZones: number;
    comZones: number;
    indZones: number;
    paths: number;
    roadCount: number;
    
    // Derived needs
    needsWells: boolean;
    wellsNeeded: number;
    needsHousing: boolean;
    housingNeeded: number;
    foodPerPerson: number;
    isStarving: boolean;
    isThirsty: boolean;
    
    // RCI Demand
    rDemand: number;
    cDemand: number;
    iDemand: number;
    highestDemand: 'R' | 'C' | 'I';
    
    // Workforce
    workerShortage: boolean;
    homeless: number;
}

/** Wander mode state */
export interface AIWanderState {
    pop: number;
    food: number;
    wood: number;
    thirst: number;
    thirstCounter: number;
    nearWater: boolean;
    exploredTiles: number;
}

// ═══════════════════════════════════════════════════════════════════
// AI ACTIONS
// ═══════════════════════════════════════════════════════════════════

/** Basic AI actions */
export type AIAction = 
    | 'SETTLE'
    | 'WANDER'
    | 'BUILD_RES'
    | 'BUILD_RES_L2'
    | 'BUILD_RES_L3'
    | 'BUILD_RES_L4'
    | 'BUILD_RES_L5'
    | 'BUILD_RES_L6'
    | 'BUILD_WELL'
    | 'BUILD_IND'
    | 'BUILD_IND_L2'
    | 'BUILD_IND_L3'
    | 'BUILD_IND_L4'
    | 'BUILD_IND_L5'
    | 'BUILD_IND_L6'
    | 'BUILD_COM'
    | 'BUILD_COM_L2'
    | 'BUILD_COM_L3'
    | 'BUILD_COM_L4'
    | 'BUILD_COM_L5'
    | 'BUILD_COM_L6'
    | 'BUILD_ROAD'
    | 'BUILD_CLAN_CHIEF'
    | 'BUILD_DOCK'
    | 'EXCHANGE_GOLD'
    | 'PASS_YEAR'
    | 'WAIT';

/** AI target for pathfinding */
export interface AITarget {
    x: number;
    y: number;
    type: 'BERRY' | 'ANIMAL' | 'NOMAD' | 'WATER' | 'EXPLORE' | 'BUILD';
    priority: number;
    distance?: number;
}

// ═══════════════════════════════════════════════════════════════════
// STRATEGIES
// ═══════════════════════════════════════════════════════════════════

/** Build ratio configuration */
export interface BuildRatio {
    R: number;  // Residential
    C: number;  // Commercial
    I: number;  // Industrial
}

/** Strategy step for sequence-based strategies */
export interface StrategyStep {
    type: 'RES' | 'COM' | 'IND' | 'WELL' | 'ROAD' | 'WAIT';
    count?: number;
    years?: number;
}

/** Sequence-based build strategy */
export interface SequenceStrategy {
    name: string;
    sequence: StrategyStep[];
    step: number;
    subStep: number;
    waitStartYear: number;
}

/** Ratio-based build strategy */
export interface RatioStrategy {
    name: string;
    ratio: BuildRatio;
    roadsPerBuilding: number;
}

/** Strategy type identifier */
export type StrategyType = 'STARTER' | 'BALANCED' | 'HOUSING_HEAVY';

// ═══════════════════════════════════════════════════════════════════
// Q-LEARNING
// ═══════════════════════════════════════════════════════════════════

/** Q-Table: state -> action -> value */
export type QTable = Record<string, Record<string, number>>;

/** Q-Learning hyperparameters */
export interface QLearningParams {
    learningRate: number;
    discountFactor: number;
    explorationRate: number;
    explorationDecay: number;
    minExploration: number;
    maxQTableSize: number;
}

/** Q-Learning training stats */
export interface QLearningStats {
    episode: number;
    totalReward: number;
    episodeRewards: number[];
    bestScore: number;
    gamesPlayed: number;
    citiesBuilt: number;
    bestPopulation: number;
    bestSurvivalYears: number;
    balancedCities: number;
    smartSettlements: number;
    rewardHistory: number[];
}

/** Learning phase for curriculum learning */
export type LearningPhase = 1 | 2 | 3;

/** Death cause tracking */
export type DeathCause = 'thirst' | 'starvation' | 'collapse' | 'unknown';

/** Death record */
export interface DeathRecord {
    cause: DeathCause;
    year: number;
    pop: number;
    state: string;
}

// ═══════════════════════════════════════════════════════════════════
// PLAYBOOKS & MACROS
// ═══════════════════════════════════════════════════════════════════

/** Macro step condition */
export interface MacroStepCondition {
    minYear?: number;
    maxYear?: number;
    requirePop?: number;
    requireDemand?: 'R' | 'C' | 'I';
    requireNeeds?: ('water' | 'food' | 'housing')[];
    requireHousingNearFull?: boolean;
    requireHomeless?: number;
    requireWorkerShortage?: boolean;
    requireFood?: number;
    requireWood?: number;
    requireFoodPerPop?: number;
    waitYears?: number;
}

/** Macro playbook step */
export interface MacroStep extends MacroStepCondition {
    action: AIAction | 'BUILD_DEMAND';
}

/** Macro playbook */
export interface MacroPlaybook {
    id: string;
    name: string;
    steps: MacroStep[];
}

/** Tactic statistics */
export interface TacticStats {
    attempts: number;
    successes: number;
    totalYears: number;
    maxPop: number;
    avgScore: number;
}

/** Saved playbook from player watching */
export interface SavedPlaybook {
    id: string;
    timestamp: number;
    startYear: number;
    endYear: number;
    maxPop: number;
    playbook: PlaybookStep[];
}

/** Playbook step recorded from player */
export interface PlaybookStep {
    action: AIAction;
    year: number;
    pop: number;
    yearsSinceLastBuild: number;
    context: Partial<AIGameState>;
}

// ═══════════════════════════════════════════════════════════════════
// EXPLORATION TEST
// ═══════════════════════════════════════════════════════════════════

/** Exploration statistics */
export interface ExploreStats {
    tilesVisited: Set<string>;
    totalTiles: number;
    resourcesCollected: number;
    berriesCollected: number;
    woodCollected: number;
    nomadsRecruited: number;
    animalsHunted: number;
    deaths: number;
    totalSteps: number;
    stepsThisRun: number;
    runsCompleted: number;
    deathLocations: DeathLocation[];
    dangerZones: Record<string, number>;
    startTime: number | null;
}

/** Death location record */
export interface DeathLocation {
    x: number;
    y: number;
    cause: string;
    steps: number;
}

// ═══════════════════════════════════════════════════════════════════
// CITY EXPANSION
// ═══════════════════════════════════════════════════════════════════

/** City expansion statistics */
export interface ExpansionStats {
    radius: number;
    roadFrontier: number;
    quadrants: number;
}

/** Population tier strategy */
export interface PopTierStrategy {
    tier: 'startup' | 'growth' | 'expansion' | 'city' | 'metropolis';
    priority: string;
    waterRatio: number;
    comRatio: number;
    indThreshold: number;
    roadsPer: number;
    expandRate: number;
    hint: string;
}

/** Blocker diagnosis */
export interface BlockerDiagnosis {
    issue: 'water' | 'housing' | 'food' | 'wood' | 'no-industrial' | 'cramped';
    severity: 'critical' | 'warning' | 'opportunity';
    fix: AIAction;
}

// ═══════════════════════════════════════════════════════════════════
// AI CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

/** Default Q-Learning parameters */
export const DEFAULT_QLEARNING_PARAMS: QLearningParams = {
    learningRate: 0.25,
    discountFactor: 0.9,
    explorationRate: 0.8,
    explorationDecay: 0.98,
    minExploration: 0.1,
    maxQTableSize: 50000
};

/** All available AI actions */
export const AI_ACTIONS: AIAction[] = [
    'SETTLE', 'WANDER',
    'BUILD_RES', 'BUILD_RES_L2', 'BUILD_RES_L3', 'BUILD_RES_L4', 'BUILD_RES_L5', 'BUILD_RES_L6',
    'BUILD_WELL', 'PASS_YEAR',
    'BUILD_IND', 'BUILD_IND_L2', 'BUILD_IND_L3', 'BUILD_IND_L4', 'BUILD_IND_L5', 'BUILD_IND_L6',
    'BUILD_COM', 'BUILD_COM_L2', 'BUILD_COM_L3', 'BUILD_COM_L4', 'BUILD_COM_L5', 'BUILD_COM_L6',
    'BUILD_ROAD', 'WAIT', 'BUILD_CLAN_CHIEF', 'BUILD_DOCK', 'EXCHANGE_GOLD'
];

/** AI update interval in milliseconds */
export const AI_UPDATE_INTERVAL = 150;

/** Blueprint AI update interval */
export const BLUEPRINT_UPDATE_INTERVAL = 200;
