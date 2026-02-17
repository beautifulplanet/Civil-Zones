/**
 * Game State
 * Central state management for Civil Zones
 */

import { ResourceManager } from '../core/ResourceManager';
import { BuildingManager } from '../world/BuildingManager';
import type { ChunkManager } from '../world/ChunkManager';

export type GamePhase = 'WANDER' | 'CITY';

export interface GameState {
    // Core state
    phase: GamePhase;
    year: number;
    population: number;
    thirst: number; // 0-100, critical survival mechanic

    // Settlement tracking (WANDER mode)
    hasWell: boolean; // Player has built a water well
    settlementX: number; // City center X when settled
    settlementY: number; // City center Y when settled

    // Inventory limits (WANDER mode per game-data-spec §3.1)
    maxFood: number;  // 300 max
    maxWood: number;  // 300 max

    // Managers
    resources: ResourceManager;
    buildings: BuildingManager;

    // City stats
    totalIncome: number;
    totalProduction: number;
    totalJobs: number;
    employedWorkers: number;
}

export function createGameState(chunkManager: ChunkManager): GameState {
    return {
        phase: 'WANDER', // Start in WANDER mode
        year: 1,
        population: 1, // Starting with just the player
        thirst: 100, // Full thirst

        // Settlement tracking
        hasWell: false,
        settlementX: 0,
        settlementY: 0,

        // Inventory limits per game-data-spec §3.1
        maxFood: 300,
        maxWood: 300,

        resources: new ResourceManager({
            food: 50,
            wood: 50,
            stone: 0,
            metal: 0,
            gold: 0
        }),
        buildings: new BuildingManager(chunkManager),

        totalIncome: 0,
        totalProduction: 0,
        totalJobs: 0,
        employedWorkers: 0
    };
}

