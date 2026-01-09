/**
 * Civil Zones - Game State Management
 * Core game state types and transitions
 */

import type { WanderInventory, PocketInventory, CityResources } from './inventory.js';
import type { Player, ThirstState } from './player.js';
import type { WorkforceState } from '../systems/workforce.js';
import type { NeedsState } from '../systems/needs.js';
import type { GeologyState } from '../types/tiles.js';

// ═══════════════════════════════════════════════════════════════════════════════
// GAME PHASES
// ═══════════════════════════════════════════════════════════════════════════════

/** Game phase/epoch */
export type GamePhase = 'WANDER' | 'CITY';

/** View mode for map display */
export type ViewMode = 'NORMAL' | 'POL' | 'DESIRABILITY' | 'ELEVATION';

// ═══════════════════════════════════════════════════════════════════════════════
// ENTITY TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Berry entity */
export interface BerryEntity {
    type: 'BERRY';
    amount: number;
    poison_chance: number;
    is_poisonous: boolean;
    locked?: boolean;
}

/** Nomad entity */
export interface NomadEntity {
    type: 'NOMAD';
    pop: number;
    loot: {
        food: number;
        wood: number;
        metal: number;
        stone: number;
    };
    hostile_chance: number;
    is_hostile: boolean;
    damage: number;
}

/** Stone deposit */
export interface StoneDeposit {
    metal: number;
}

/** Animal entity */
export interface Animal {
    x: number;
    y: number;
    hits: number;
    type: string;
    locked?: boolean;
}

/** Wander well (Epoch 0) */
export interface WanderWell {
    x: number;
    y: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILDING TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Building in blds array */
export interface GameBuilding {
    t: string;          // Type: 'WELL', 'COM', 'IND', 'RES', etc.
    x: number;
    y: number;
    lvl: number;
    pop?: number;
    capacity?: number;
    efficiency?: number;
    age?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SITE TRAITS
// ═══════════════════════════════════════════════════════════════════════════════

export type SiteTrait = 'Riverside' | 'Mineral Rich' | 'Fertile' | 'Paradise';

/** Locked resources from settlement location */
export interface LockedResources {
    residential: boolean;   // Berry locked
    commercial: boolean;    // Tree locked
    industrial: boolean;    // Animal locked
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESSION STATE
// ═══════════════════════════════════════════════════════════════════════════════

export interface ProgressionState {
    settlementUnlocked: boolean;
    industrialUnlocked: boolean;
    hasClanChief: boolean;
    hasDock: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLETE GAME STATE
// ═══════════════════════════════════════════════════════════════════════════════

export interface GameState {
    // Core state
    gamePhase: GamePhase;
    viewMode: ViewMode;
    year: number;
    age: number;
    gameOver: boolean;
    
    // Population
    pop: number;
    peakPop: number;
    housingCap: number;
    waterCap: number;
    
    // Player (Epoch 0)
    player: Player | null;
    thirst: ThirstState;
    
    // Inventory (Epoch 0)
    inventory: WanderInventory;
    pocket: PocketInventory;
    stepCounter: number;
    foodStepCounter: number;
    
    // City resources (Epoch 1+)
    resources: CityResources;
    
    // World entities
    animals: Animal[];
    wanderWells: WanderWell[];
    nomadsFound: number;
    
    // Buildings
    blds: GameBuilding[];
    zoneCount: number;
    roadTileCount: number;
    
    // Systems
    workforce: WorkforceState;
    needs: NeedsState;
    geology: GeologyState;
    
    // Settlement
    settlementPos: { x: number; y: number } | null;
    siteTraits: SiteTrait[];
    lockedResources: LockedResources;
    gatheringMultiplier: number;
    totalFoodCollected: number;
    
    // Progression
    progression: ProgressionState;
    
    // AI/Automation
    aiEnabled: boolean;
    aiState: string;
    aiTarget: { x: number; y: number } | null;
    simcityMode: boolean;
    
    // Lore
    loreEnabled: boolean;
    loreSeen: Record<string, boolean>;
    
    // Event log
    gameLog: string[];
    
    // Performance
    dirtyRegions: Set<string>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATE CREATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create initial game state
 */
export function createInitialGameState(): GameState {
    return {
        // Core state
        gamePhase: 'WANDER',
        viewMode: 'NORMAL',
        year: 0,
        age: 0,
        gameOver: false,
        
        // Population
        pop: 4,
        peakPop: 4,
        housingCap: 0,
        waterCap: 0,
        
        // Player
        player: null,
        thirst: { level: 100, stepCounter: 0 },
        
        // Inventory
        inventory: {
            capacity: 450,
            food: 300,
            wood: 300,
            metal: 0,
            stone: 0
        },
        pocket: {
            metal: 0,
            stone: 0,
            capacity: 1000
        },
        stepCounter: 0,
        foodStepCounter: 0,
        
        // City resources
        resources: {
            food: 0,
            wood: 0,
            metal: 0,
            stone: 0,
            water: 100,
            gold: 0
        },
        
        // World entities
        animals: [],
        wanderWells: [],
        nomadsFound: 0,
        
        // Buildings
        blds: [],
        zoneCount: 0,
        roadTileCount: 0,
        
        // Systems
        workforce: {
            total: 0,
            wellWorkers: 0,
            roadWorkers: 0,
            comWorkers: 0,
            indWorkers: 0,
            gatherers: 0,
            wellsNeeded: 0,
            roadsNeeded: 0,
            comNeeded: 0,
            indNeeded: 0,
            shortage: 0
        },
        needs: {
            housing: { have: 0, need: 0, satisfied: 1.0 },
            water: { have: 0, need: 0, satisfied: 1.0 },
            food: { have: 0, need: 0, satisfied: 1.0 },
            jobs: { have: 0, need: 0, satisfied: 1.0 },
            paths: { have: 0, need: 0, satisfied: 1.0 },
            overall: 1.0
        },
        geology: {
            currentSeaLevel: 3,
            periodIndex: 0,
            centuriesInPeriod: 0,
            lastUpdateYear: 0,
            tilesFlooded: 0,
            tilesDrained: 0,
            currentPeriodName: 'Warm Interglacial'
        },
        
        // Settlement
        settlementPos: null,
        siteTraits: [],
        lockedResources: {
            residential: false,
            commercial: false,
            industrial: false
        },
        gatheringMultiplier: 1.0,
        totalFoodCollected: 0,
        
        // Progression
        progression: {
            settlementUnlocked: false,
            industrialUnlocked: false,
            hasClanChief: false,
            hasDock: false
        },
        
        // AI/Automation
        aiEnabled: false,
        aiState: 'EXPLORE',
        aiTarget: null,
        simcityMode: false,
        
        // Lore
        loreEnabled: false,
        loreSeen: {},
        
        // Event log
        gameLog: [],
        
        // Performance
        dirtyRegions: new Set()
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATE TRANSITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Transition from WANDER to CITY mode
 */
export function transitionToCity(
    state: GameState,
    settlementX: number,
    settlementY: number,
    populationBonus: number = 0
): void {
    // Set game phase
    state.gamePhase = 'CITY';
    state.settlementPos = { x: settlementX, y: settlementY };
    
    // Transfer inventory to city resources
    const bonusMultiplier = 1 + (populationBonus / 100);
    state.resources.food = Math.floor(state.inventory.food * bonusMultiplier);
    state.resources.wood = Math.floor(state.inventory.wood * bonusMultiplier);
    state.resources.metal = state.inventory.metal;
    state.resources.stone = state.inventory.stone;
    
    // Set gathering multiplier based on population
    state.gatheringMultiplier = Math.min(3.0, 0.5 + (state.pop * 0.1));
}

/**
 * Log a game event
 */
export function logGameEvent(state: GameState, message: string): void {
    const logEntry = `Year ${state.year}: ${message}`;
    state.gameLog.push(logEntry);
    
    // Keep log size manageable
    if (state.gameLog.length > 100) {
        state.gameLog.shift();
    }
}

/**
 * Mark region as dirty for re-rendering
 */
export function markDirty(state: GameState, x: number, y: number, size: number = 1): void {
    for (let dx = 0; dx < size; dx++) {
        for (let dy = 0; dy < size; dy++) {
            state.dirtyRegions.add(`${x + dx},${y + dy}`);
        }
    }
}

/**
 * Clear dirty regions
 */
export function clearDirtyRegions(state: GameState): void {
    state.dirtyRegions.clear();
}

/**
 * Update peak population
 */
export function updatePeakPop(state: GameState): void {
    if (state.pop > state.peakPop) {
        state.peakPop = state.pop;
    }
}

/**
 * Check if game is over
 */
export function checkGameOver(state: GameState): string | null {
    if (state.pop <= 0) {
        if (state.gamePhase === 'WANDER' && state.inventory.food <= 0) {
            return 'STARVATION';
        }
        return 'POPULATION_LOSS';
    }
    
    if (state.player && state.player.health <= 0) {
        return 'HUNTING';
    }
    
    if (state.gamePhase === 'WANDER' && state.thirst.level <= 0) {
        return 'THIRST';
    }
    
    return null;
}
