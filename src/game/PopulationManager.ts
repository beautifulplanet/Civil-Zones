/**
 * Population Manager
 * Handles population growth, needs satisfaction, and workforce allocation
 */

import type { GameState } from './GameState';
import { getBuildingById } from '../config/BuildingConfig';

export interface PopulationNeeds {
    housing: number;      // 0-100% - Population / Housing Capacity
    water: number;        // 0-100% - Population / (Wells * 100)
    food: number;         // 0-100% - Food / Population
    jobs: number;         // 0-100% - Jobs Available / Working Population
    overall: number;      // Average of all needs
}

export interface WorkforceAllocation {
    roadWorkers: number;
    commercialWorkers: number;
    industrialWorkers: number;
    gatherers: number;
    unemployed: number;
}

/**
 * Calculate current population needs satisfaction
 */
export function calculateNeeds(gameState: GameState): PopulationNeeds {
    const pop = gameState.population;
    if (pop === 0) {
        return { housing: 100, water: 100, food: 100, jobs: 100, overall: 100 };
    }

    const buildings = gameState.buildings.getAllBuildings();

    // Housing capacity
    let housingCapacity = 0;
    for (const building of buildings) {
        const def = getBuildingById(building.definitionId);
        if (def && def.type === 'RESIDENTIAL' && def.populationMax) {
            housingCapacity += def.populationMax;
        }
    }
    const housing = Math.min(100, (housingCapacity / pop) * 100);

    // Water capacity (wells * 100)
    let wellCount = 0;
    for (const building of buildings) {
        const def = getBuildingById(building.definitionId);
        if (def && def.type === 'WELL') {
            wellCount++;
        }
    }
    const waterCapacity = wellCount * 100;
    const water = pop > 0 ? Math.min(100, (waterCapacity / pop) * 100) : 100;

    // Food satisfaction
    const resources = gameState.resources.getResources();
    const food = Math.min(100, (resources.food / pop) * 10); // 10 food = 100%

    // Jobs
    let totalJobs = 0;
    for (const building of buildings) {
        const def = getBuildingById(building.definitionId);
        if (def && def.jobs) {
            totalJobs += def.jobs;
        }
    }
    const workingPop = Math.floor(pop * 0.6); // 60% of pop is working age
    const jobs = workingPop > 0 ? Math.min(100, (totalJobs / workingPop) * 100) : 100;

    const overall = (housing + water + food + jobs) / 4;

    return { housing, water, food, jobs, overall };
}

/**
 * Allocate workers to buildings
 * Priority: Roads → Commercial → Industrial → Gatherers
 */
export function allocateWorkforce(gameState: GameState): WorkforceAllocation {
    const workingPop = Math.floor(gameState.population * 0.6);
    let remaining = workingPop;

    const buildings = gameState.buildings.getAllBuildings();

    // Count roads (1 worker per 5 road tiles)
    let roadCount = 0;
    for (const building of buildings) {
        const def = getBuildingById(building.definitionId);
        if (def && def.type === 'ROAD') {
            roadCount++;
        }
    }
    const roadWorkers = Math.min(remaining, Math.ceil(roadCount / 5));
    remaining -= roadWorkers;

    // Commercial workers
    let commercialJobs = 0;
    for (const building of buildings) {
        const def = getBuildingById(building.definitionId);
        if (def && def.type === 'COMMERCIAL' && def.jobs) {
            commercialJobs += def.jobs;
        }
    }
    const commercialWorkers = Math.min(remaining, commercialJobs);
    remaining -= commercialWorkers;

    // Industrial workers
    let industrialJobs = 0;
    for (const building of buildings) {
        const def = getBuildingById(building.definitionId);
        if (def && def.type === 'INDUSTRIAL' && def.jobs) {
            industrialJobs += def.jobs;
        }
    }
    const industrialWorkers = Math.min(remaining, industrialJobs);
    remaining -= industrialWorkers;

    // Remaining become gatherers
    const gatherers = remaining;
    const unemployed = 0; // All workers assigned

    return { roadWorkers, commercialWorkers, industrialWorkers, gatherers, unemployed };
}

/**
 * Calculate population growth/death for this turn
 */
export function calculatePopulationChange(gameState: GameState, needs: PopulationNeeds): number {
    const pop = gameState.population;

    // Base growth (if satisfied)
    let change = 0;

    if (needs.overall >= 80) {
        // Happy population grows
        change = Math.floor(pop * 0.05) + 2; // 5% + 2
    } else if (needs.overall >= 50) {
        // Neutral - slight growth
        change = Math.floor(pop * 0.02) + 1;
    } else if (needs.overall >= 30) {
        // Struggling - no growth
        change = 0;
    } else {
        // Crisis - population decline
        change = -Math.floor(pop * 0.1); // Lose 10%
    }

    // Starvation deaths (from game-data-spec: 20% if food < 0)
    const resources = gameState.resources.getResources();
    if (resources.food < pop) {
        const starvationDeaths = Math.floor(pop * 0.2);
        change -= starvationDeaths;
    }

    // Dehydration deaths (pop > wells * 100)
    const buildings = gameState.buildings.getAllBuildings();
    let wellCount = 0;
    for (const b of buildings) {
        const def = getBuildingById(b.definitionId);
        if (def && def.type === 'WELL') wellCount++;
    }
    if (pop > wellCount * 100) {
        const dehydrationDeaths = Math.floor(pop * 0.1);
        change -= dehydrationDeaths;
    }

    return change;
}
