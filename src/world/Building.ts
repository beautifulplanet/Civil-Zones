/**
 * Building Instance
 * Represents a placed building in the world
 */

import type { BuildingDefinition, BuildingState } from '../config/BuildingConfig';

export interface Building {
    id: string; // Unique instance ID
    definitionId: string; // Reference to BuildingConfig
    x: number; // World tile X
    y: number; // World tile Y
    state: BuildingState; // 0=Abandoned, 1=Growing, 2=Active, 3=Thriving
    population?: number; // For residential buildings
    workers?: number; // For commercial/industrial
    yearBuilt: number; // Game year constructed
    efficiency: number; // Placement bonus multiplier (from ZoneBonuses)
}

export function createBuilding(
    definition: BuildingDefinition,
    x: number,
    y: number,
    year: number
): Building {
    return {
        id: `${definition.id}_${x}_${y}_${Date.now()}`,
        definitionId: definition.id,
        x,
        y,
        state: 1, // Start at "Growing" state
        population: definition.populationMax ? 0 : undefined,
        workers: definition.jobs ? 0 : undefined,
        yearBuilt: year,
        efficiency: 1.0 // Default; updated by ZoneBonuses after placement
    };
}
