/**
 * Civil Zones - Turn Processing
 * Year advancement and turn resolution
 */

import type { 
    TimeState, 
    TurnResult, 
    TurnEvent,
    TurnEventType,
    PopulationChange,
    GameOverReason 
} from './types.js';
import { DEFAULT_TIME_CONFIG } from './types.js';

// ═══════════════════════════════════════════════════════════════════
// TIME STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

/** Create initial time state */
export function createTimeState(
    startYear: number = DEFAULT_TIME_CONFIG.startYear,
    startAge: number = DEFAULT_TIME_CONFIG.startAge
): TimeState {
    return {
        year: startYear,
        age: startAge,
        paused: false,
        speed: 1
    };
}

/** Advance year by one */
export function advanceYear(state: TimeState): TimeState {
    return {
        ...state,
        year: state.year + 1
    };
}

/** Set game age/epoch */
export function setAge(state: TimeState, age: number): TimeState {
    return {
        ...state,
        age
    };
}

/** Toggle pause state */
export function togglePause(state: TimeState): TimeState {
    return {
        ...state,
        paused: !state.paused
    };
}

/** Set game speed */
export function setSpeed(state: TimeState, speed: number): TimeState {
    return {
        ...state,
        speed: Math.max(0.1, Math.min(10, speed))
    };
}

// ═══════════════════════════════════════════════════════════════════
// TURN EVENT HELPERS
// ═══════════════════════════════════════════════════════════════════

/** Create a turn event */
export function createTurnEvent(
    type: TurnEventType,
    message: string,
    severity: TurnEvent['severity'] = 'info',
    value?: number
): TurnEvent {
    return { type, message, severity, value };
}

/** Create year advance event */
export function yearAdvanceEvent(year: number): TurnEvent {
    return createTurnEvent(
        'YEAR_ADVANCE',
        `Year ${year}`,
        'info',
        year
    );
}

/** Create food spoilage event */
export function foodSpoilageEvent(amount: number, hasStorage: boolean): TurnEvent {
    const msg = hasStorage 
        ? `🍂 ${amount} food rotted! (10% rate with storage)`
        : `🍂 ${amount} food rotted! Need storage buildings!`;
    return createTurnEvent('FOOD_SPOILAGE', msg, 'warning', amount);
}

/** Create starvation event */
export function starvationEvent(deaths: number): TurnEvent {
    return createTurnEvent(
        'STARVATION',
        `💀 FAMINE! ${deaths} people starved to death!`,
        'danger',
        deaths
    );
}

/** Create growth event */
export function growthEvent(births: number): TurnEvent {
    return createTurnEvent(
        'GROWTH',
        `👶 ${births} new tribe members born!`,
        'success',
        births
    );
}

/** Create water shortage event */
export function waterShortageEvent(deaths: number, wells: number, capacity: number, pop: number): TurnEvent {
    return createTurnEvent(
        'WATER_SHORTAGE',
        `💧 Water shortage! ${deaths} died. Have ${wells} wells (${capacity} capacity), pop: ${pop}`,
        'danger',
        deaths
    );
}

/** Create overcrowding event */
export function overcrowdingEvent(homeless: number, deaths: number, foodStolen: number): TurnEvent {
    return createTurnEvent(
        'OVERCROWDING',
        `🏚️ OVERCROWDED! ${homeless} homeless: -${deaths} died, -${foodStolen} food stolen!`,
        'warning',
        deaths
    );
}

/** Create plague event */
export function plagueEvent(deaths: number, economicLoss: number): TurnEvent {
    return createTurnEvent(
        'PLAGUE',
        `☠️ PLAGUE OUTBREAK! ${deaths} dead! Economy Collapsed!`,
        'danger',
        deaths
    );
}

/** Create building abandon event */
export function buildingAbandonEvent(count: number): TurnEvent {
    return createTurnEvent(
        'BUILDING_ABANDON',
        `💀 ${count} settlement${count > 1 ? 's' : ''} abandoned due to neglect!`,
        'warning',
        count
    );
}

// ═══════════════════════════════════════════════════════════════════
// TURN RESULT HELPERS
// ═══════════════════════════════════════════════════════════════════

/** Create successful turn result */
export function createTurnResult(
    year: number,
    events: TurnEvent[] = []
): TurnResult {
    return {
        year,
        success: true,
        events,
        gameOver: false
    };
}

/** Create game over turn result */
export function createGameOverResult(
    year: number,
    reason: string,
    events: TurnEvent[] = []
): TurnResult {
    return {
        year,
        success: false,
        events,
        gameOver: true,
        gameOverReason: reason
    };
}

// ═══════════════════════════════════════════════════════════════════
// POPULATION CALCULATIONS
// ═══════════════════════════════════════════════════════════════════

/** Calculate population growth */
export function calculateGrowth(
    currentPop: number,
    housingCapacity: number,
    food: number,
    foodConsumed: number,
    growthRate: number = 0.05
): PopulationChange {
    // Only grow if surplus food and under capacity
    if (food <= foodConsumed * 1.5 || currentPop >= housingCapacity) {
        return { growth: 0, deaths: 0, births: 0, net: 0 };
    }
    
    const births = Math.max(1, Math.ceil(currentPop * growthRate));
    const cappedBirths = Math.min(births, housingCapacity - currentPop);
    
    return {
        growth: cappedBirths,
        deaths: 0,
        births: cappedBirths,
        net: cappedBirths,
        reason: 'Well-fed population'
    };
}

/** Calculate starvation deaths */
export function calculateStarvation(
    currentPop: number,
    deathRate: number = 0.20
): PopulationChange {
    const deaths = Math.ceil(currentPop * deathRate);
    return {
        growth: 0,
        deaths,
        births: 0,
        net: -deaths,
        reason: 'Starvation'
    };
}

/** Calculate water shortage deaths */
export function calculateDehydration(
    currentPop: number,
    waterCapacity: number,
    deathRate: number = 0.20
): PopulationChange {
    const peopleWithoutWater = Math.max(0, currentPop - waterCapacity);
    if (peopleWithoutWater === 0) {
        return { growth: 0, deaths: 0, births: 0, net: 0 };
    }
    
    const deaths = Math.ceil(peopleWithoutWater * deathRate);
    return {
        growth: 0,
        deaths,
        births: 0,
        net: -deaths,
        reason: 'Dehydration'
    };
}

/** Calculate overcrowding effects */
export function calculateOvercrowding(
    currentPop: number,
    housingCapacity: number,
    exposureRate: number = 0.15
): PopulationChange {
    const homeless = Math.max(0, currentPop - housingCapacity);
    if (homeless === 0) {
        return { growth: 0, deaths: 0, births: 0, net: 0 };
    }
    
    const deaths = Math.ceil(homeless * exposureRate);
    return {
        growth: 0,
        deaths,
        births: 0,
        net: -deaths,
        reason: 'Exposure'
    };
}

/** Calculate plague outbreak */
export function calculatePlague(
    currentPop: number,
    homeless: number,
    plagueChanceMultiplier: number = 2,
    plagueDeathRate: number = 0.30
): { triggered: boolean; change: PopulationChange } {
    const overcrowdingPct = homeless / currentPop;
    const plagueChance = overcrowdingPct * plagueChanceMultiplier;
    
    if (Math.random() >= plagueChance) {
        return { 
            triggered: false, 
            change: { growth: 0, deaths: 0, births: 0, net: 0 } 
        };
    }
    
    const deaths = Math.ceil(currentPop * plagueDeathRate);
    return {
        triggered: true,
        change: {
            growth: 0,
            deaths,
            births: 0,
            net: -deaths,
            reason: 'Plague'
        }
    };
}

// ═══════════════════════════════════════════════════════════════════
// GAME OVER HELPERS
// ═══════════════════════════════════════════════════════════════════

/** Get game over reason string */
export function getGameOverMessage(reason: GameOverReason): string {
    switch (reason) {
        case 'NO_FOOD':
            return 'Your people starved to death!';
        case 'NO_WATER':
            return 'Your people died of thirst!';
        case 'NO_POPULATION':
            return 'Your civilization has perished!';
        case 'FLOOD':
            return 'Rising waters drowned your people!';
        case 'PLAGUE':
            return 'A great plague wiped out your people!';
        default:
            return 'Your civilization has ended.';
    }
}

/** Check if game should end */
export function shouldGameEnd(
    population: number,
    food: number,
    hasWater: boolean
): { end: boolean; reason?: GameOverReason } {
    if (population <= 0) {
        return { end: true, reason: 'NO_POPULATION' };
    }
    if (food <= 0 && population > 0) {
        return { end: true, reason: 'NO_FOOD' };
    }
    if (!hasWater && population > 0) {
        return { end: true, reason: 'NO_WATER' };
    }
    return { end: false };
}

// ═══════════════════════════════════════════════════════════════════
// TIME FORMATTING
// ═══════════════════════════════════════════════════════════════════

/** Format year for display */
export function formatYear(year: number): string {
    if (year < 0) {
        return `${Math.abs(year)} BCE`;
    }
    return `Year ${year}`;
}

/** Get epoch name */
export function getEpochName(age: number): string {
    switch (age) {
        case 0: return 'Paleolithic';
        case 1: return 'City Age';
        case 2: return 'Industrial Age';
        default: return `Age ${age}`;
    }
}

/** Check if milestone year */
export function isMilestoneYear(year: number, interval: number = 10): boolean {
    return year % interval === 0;
}
