/**
 * Turn Processor
 * Handles yearly progression: production, consumption, population, building states
 */

import type { GameState } from './GameState';
import { calculateNeeds, calculatePopulationChange, allocateWorkforce } from './PopulationManager';
import { getBuildingById } from '../config/BuildingConfig';
import type { ResourceAmounts } from '../core/Resources';

export interface TurnResult {
    year: number;
    populationChange: number;
    foodProduced: number;
    foodConsumed: number;
    incomeGenerated: number;
    spoilage: number;
    events: string[];
}

/**
 * Process one year (turn) of gameplay
 */
export function processTurn(gameState: GameState): TurnResult {
    const events: string[] = [];

    // 1. Calculate needs before processing
    const needs = calculateNeeds(gameState);

    // 2. Allocate workforce
    const workforce = allocateWorkforce(gameState);

    // 3. Production Phase
    const buildings = gameState.buildings.getAllBuildings();
    let foodProduced = 0;
    let incomeGenerated = 0;
    const gatherBonus: Partial<ResourceAmounts> = { food: 0, wood: 0, stone: 0, metal: 0 };

    for (const building of buildings) {
        const def = getBuildingById(building.definitionId);
        if (!def) continue;

        // Industrial production
        if (def.type === 'INDUSTRIAL' && def.production) {
            const efficiency = def.states[building.state].efficiency;
            foodProduced += Math.floor(def.production * efficiency);

            // Gather bonus
            if (def.gatherBonus) {
                for (const [key, val] of Object.entries(def.gatherBonus)) {
                    if (val) (gatherBonus as any)[key] += Math.floor(val * efficiency);
                }
            }
        }

        // Commercial income
        if (def.type === 'COMMERCIAL' && def.income) {
            const efficiency = def.states[building.state].efficiency;
            incomeGenerated += Math.floor(def.income * efficiency);
        }

        // Residential gather bonus
        if (def.type === 'RESIDENTIAL' && def.gatherBonus) {
            const efficiency = def.states[building.state].efficiency;
            for (const [key, val] of Object.entries(def.gatherBonus)) {
                if (val) (gatherBonus as any)[key] += Math.floor(val * efficiency);
            }
        }
    }

    // Add gatherer production (population-based)
    const gathererFood = workforce.gatherers * 2;
    const gathererWood = workforce.gatherers * 1;
    foodProduced += gathererFood;
    gatherBonus.wood = (gatherBonus.wood || 0) + gathererWood;

    // Apply production
    gameState.resources.add({
        food: foodProduced,
        ...gatherBonus
    });

    // 4. Consumption Phase
    const foodConsumed = gameState.population; // 1 food per person
    gameState.resources.subtract({ food: foodConsumed });

    // Apply upkeep
    for (const building of buildings) {
        const def = getBuildingById(building.definitionId);
        if (def && def.upkeep) {
            gameState.resources.subtract(def.upkeep);
        }
    }

    // 5. Spoilage (20% food, 10% with storage)
    const spoilage = gameState.resources.applySpoilage();
    if (spoilage > 0) {
        events.push(`${spoilage} food spoiled`);
    }

    // 6. Population Phase
    const popChange = calculatePopulationChange(gameState, needs);
    gameState.population = Math.max(0, gameState.population + popChange);

    if (popChange > 0) {
        events.push(`+${popChange} population growth`);
    } else if (popChange < 0) {
        events.push(`${popChange} population lost`);
    }

    // 7. Update building states based on population/workers
    for (const building of buildings) {
        const def = getBuildingById(building.definitionId);
        if (!def) continue;

        if (def.type === 'RESIDENTIAL' && def.states[0].populationRange) {
            // Calculate how much of building's capacity is filled
            const totalCapacity = buildings
                .filter(b => getBuildingById(b.definitionId)?.type === 'RESIDENTIAL')
                .reduce((sum, b) => {
                    const d = getBuildingById(b.definitionId);
                    return sum + (d?.populationMax || 0);
                }, 0);

            const fillRatio = totalCapacity > 0 ? gameState.population / totalCapacity : 0;
            const buildingPop = Math.floor((def.populationMax || 0) * fillRatio);

            // Determine state based on population in building
            for (let i = 3; i >= 0; i--) {
                const range = def.states[i].populationRange;
                if (range && buildingPop >= range[0]) {
                    building.state = i as 0 | 1 | 2 | 3;
                    break;
                }
            }
        } else {
            // Commercial/Industrial: based on worker ratio
            const workerRatio = workforce.commercialWorkers / (workforce.commercialWorkers + workforce.industrialWorkers + 1);
            if (workerRatio >= 0.7) {
                building.state = 3;
            } else if (workerRatio >= 0.4) {
                building.state = 2;
            } else if (workerRatio > 0) {
                building.state = 1;
            } else {
                building.state = 0;
            }
        }
    }

    // 8. Advance year
    gameState.year++;

    // 9. Update stats
    gameState.totalIncome = incomeGenerated;
    gameState.totalProduction = foodProduced;
    gameState.totalJobs = workforce.commercialWorkers + workforce.industrialWorkers;
    gameState.employedWorkers = workforce.roadWorkers + workforce.commercialWorkers + workforce.industrialWorkers;

    return {
        year: gameState.year,
        populationChange: popChange,
        foodProduced,
        foodConsumed,
        incomeGenerated,
        spoilage,
        events
    };
}
