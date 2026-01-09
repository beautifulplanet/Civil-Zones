/**
 * Civil Zones - Time System Types
 * Type definitions for game time, turns, and year progression
 */

// ═══════════════════════════════════════════════════════════════════
// TIME STATE
// ═══════════════════════════════════════════════════════════════════

/** Game time state */
export interface TimeState {
    year: number;
    age: number;              // Epoch/era (0 = Paleolithic, 1 = City)
    paused: boolean;
    speed: number;            // Game speed multiplier
}

/** Turn result */
export interface TurnResult {
    year: number;
    success: boolean;
    events: TurnEvent[];
    gameOver: boolean;
    gameOverReason?: string;
}

/** Turn event that occurred */
export interface TurnEvent {
    type: TurnEventType;
    message: string;
    value?: number;
    severity: 'info' | 'warning' | 'danger' | 'success';
}

/** Types of events that can occur during a turn */
export type TurnEventType = 
    | 'YEAR_ADVANCE'
    | 'FOOD_SPOILAGE'
    | 'STARVATION'
    | 'GROWTH'
    | 'WATER_SHORTAGE'
    | 'OVERCROWDING'
    | 'PLAGUE'
    | 'FLOOD'
    | 'GEOLOGICAL'
    | 'BUILDING_ABANDON'
    | 'UPKEEP';

// ═══════════════════════════════════════════════════════════════════
// PRODUCTION & CONSUMPTION
// ═══════════════════════════════════════════════════════════════════

/** Resource production rates */
export interface ProductionRates {
    foodPerPerson: number;
    woodPerGatherer: number;
    stonePerMiner: number;
    metalPerSmelter: number;
}

/** Resource consumption rates */
export interface ConsumptionRates {
    foodPerPerson: number;
    woodUpkeepPerBuilding: number;
}

/** Spoilage/rot rates */
export interface SpoilageRates {
    food: number;           // Default 0.20 (20%)
    foodWithStorage: number; // 0.10 with Nuts Storage
    wood: number;           // 0.10 (10%)
    stone: number;          // 0.05 (5%)
    metal: number;          // 0.03 (3%)
}

// ═══════════════════════════════════════════════════════════════════
// POPULATION
// ═══════════════════════════════════════════════════════════════════

/** Population change result */
export interface PopulationChange {
    growth: number;
    deaths: number;
    births: number;
    net: number;
    reason?: string;
}

/** Death causes */
export type DeathCause = 
    | 'STARVATION'
    | 'DEHYDRATION'
    | 'PLAGUE'
    | 'FLOOD'
    | 'EXPOSURE'
    | 'OVERCROWDING';

// ═══════════════════════════════════════════════════════════════════
// GAME OVER
// ═══════════════════════════════════════════════════════════════════

/** Game over reasons */
export type GameOverReason = 
    | 'NO_FOOD'
    | 'NO_WATER'
    | 'NO_POPULATION'
    | 'FLOOD'
    | 'PLAGUE';

/** Game over result */
export interface GameOverResult {
    reason: GameOverReason;
    year: number;
    peakPopulation: number;
    finalPopulation: number;
    message: string;
}

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

/** Time system configuration */
export interface TimeConfig {
    startYear: number;
    startAge: number;
    yearsPerGeologicalUpdate: number;
}

/** Default time configuration */
export const DEFAULT_TIME_CONFIG: TimeConfig = {
    startYear: 0,
    startAge: 0,
    yearsPerGeologicalUpdate: 100
};

/** Default spoilage rates */
export const DEFAULT_SPOILAGE_RATES: SpoilageRates = {
    food: 0.20,
    foodWithStorage: 0.10,
    wood: 0.10,
    stone: 0.05,
    metal: 0.03
};

/** Default population constants */
export const DEFAULT_POPULATION_CONFIG = {
    GROWTH_RATE: 0.05,           // 5% growth when well-fed
    STARVATION_DEATH_RATE: 0.20, // 20% die when starving
    EXPOSURE_DEATH_RATE: 0.15,   // 15% homeless die per year
    PLAGUE_DEATH_RATE: 0.30,     // 30% die in plague
    PLAGUE_CHANCE_MULTIPLIER: 2, // 2x homeless % = plague chance
    DEHYDRATION_DEATH_RATE: 0.20, // 20% without water die
    WATER_PER_WELL: 100          // Each well supports 100 people
};
