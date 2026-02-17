import { describe, it, expect } from 'vitest';
import { calculateNeeds, allocateWorkforce, calculatePopulationChange } from './PopulationManager';
import type { GameState } from './GameState';
import type { Building } from '../world/Building';
import { ResourceManager } from '../core/ResourceManager';

// ---------------------------------------------------------------------------
// Helpers: minimal mock GameState + buildings
// ---------------------------------------------------------------------------
function mockBuilding(overrides: Partial<Building & { _defId?: string }> = {}): Building {
    return {
        id: overrides.id ?? 'b1',
        definitionId: overrides.definitionId ?? 'LEAN_TO',
        x: overrides.x ?? 0,
        y: overrides.y ?? 0,
        state: overrides.state ?? 2,
        yearBuilt: overrides.yearBuilt ?? 1,
        efficiency: overrides.efficiency ?? 1,
    };
}

function mockGameState(opts: {
    population?: number;
    food?: number;
    buildings?: Building[];
} = {}): GameState {
    const buildings = opts.buildings ?? [];
    return {
        phase: 'CITY',
        year: 1,
        population: opts.population ?? 10,
        thirst: 100,
        hasWell: false,
        settlementX: 0,
        settlementY: 0,
        maxFood: 300,
        maxWood: 300,
        resources: new ResourceManager({ food: opts.food ?? 100 }),
        buildings: {
            getAllBuildings: () => buildings,
        } as any,
        totalIncome: 0,
        totalProduction: 0,
        totalJobs: 0,
        employedWorkers: 0,
    };
}

// ---------------------------------------------------------------------------
// calculateNeeds
// ---------------------------------------------------------------------------
describe('calculateNeeds', () => {
    it('returns all 100s for zero population', () => {
        const gs = mockGameState({ population: 0 });
        const needs = calculateNeeds(gs);
        expect(needs.housing).toBe(100);
        expect(needs.water).toBe(100);
        expect(needs.food).toBe(100);
        expect(needs.jobs).toBe(100);
        expect(needs.overall).toBe(100);
    });

    it('housing scales with residential capacity', () => {
        // R1 (Hobo Camp) has populationMax = 15
        const gs = mockGameState({
            population: 10,
            buildings: [mockBuilding({ definitionId: 'R1' })],
        });
        const needs = calculateNeeds(gs);
        // 15 capacity / 10 pop * 100 = 150 → capped at 100
        expect(needs.housing).toBe(100);
    });

    it('water needs consider well count × 100', () => {
        const gs = mockGameState({
            population: 50,
            buildings: [mockBuilding({ definitionId: 'WELL' })],
        });
        const needs = calculateNeeds(gs);
        // wellCount=1 → capacity=100, pop=50 → (100/50)*100 = 200 → capped 100
        expect(needs.water).toBe(100);
    });

    it('food satisfaction scales with food/pop ratio', () => {
        // formula: min(100, (food / pop) * 10)
        const gs = mockGameState({ population: 10, food: 50 });
        const needs = calculateNeeds(gs);
        expect(needs.food).toBe(50); // (50/10)*10 = 50
    });

    it('overall is average of four needs', () => {
        const gs = mockGameState({ population: 0 });
        const needs = calculateNeeds(gs);
        expect(needs.overall).toBe((needs.housing + needs.water + needs.food + needs.jobs) / 4);
    });
});

// ---------------------------------------------------------------------------
// allocateWorkforce
// ---------------------------------------------------------------------------
describe('allocateWorkforce', () => {
    it('returns all zeros for zero population', () => {
        const gs = mockGameState({ population: 0 });
        const wf = allocateWorkforce(gs);
        expect(wf.roadWorkers).toBe(0);
        expect(wf.commercialWorkers).toBe(0);
        expect(wf.industrialWorkers).toBe(0);
        expect(wf.gatherers).toBe(0);
    });

    it('remaining workers become gatherers', () => {
        const gs = mockGameState({ population: 10 }); // 60% = 6 working
        const wf = allocateWorkforce(gs);
        // no roads, no commercial, no industrial → all gatherers
        expect(wf.gatherers).toBe(6);
    });
});

// ---------------------------------------------------------------------------
// calculatePopulationChange
// ---------------------------------------------------------------------------
describe('calculatePopulationChange', () => {
    it('grows at 5%+2 when overall >= 80 (with wells to prevent dehydration)', () => {
        // Need 1 well per 100 pop to avoid dehydration penalty
        const gs = mockGameState({
            population: 100,
            food: 10000,
            buildings: [mockBuilding({ definitionId: 'WELL' })],
        });
        const needs = { housing: 100, water: 100, food: 100, jobs: 100, overall: 100 };
        const change = calculatePopulationChange(gs, needs);
        // floor(100 * 0.05) + 2 = 7
        expect(change).toBe(7);
    });

    it('grows at 2%+1 when overall 50-79 (with wells)', () => {
        const gs = mockGameState({
            population: 100,
            food: 10000,
            buildings: [mockBuilding({ definitionId: 'WELL' })],
        });
        const needs = { housing: 60, water: 60, food: 60, jobs: 60, overall: 60 };
        const change = calculatePopulationChange(gs, needs);
        // floor(100 * 0.02) + 1 = 3
        expect(change).toBe(3);
    });

    it('no growth when overall 30-49 (with wells)', () => {
        const gs = mockGameState({
            population: 100,
            food: 10000,
            buildings: [mockBuilding({ definitionId: 'WELL' })],
        });
        const needs = { housing: 40, water: 40, food: 40, jobs: 40, overall: 40 };
        const change = calculatePopulationChange(gs, needs);
        expect(change).toBe(0);
    });

    it('loses 10% when overall < 30 (with wells)', () => {
        const gs = mockGameState({
            population: 100,
            food: 10000,
            buildings: [mockBuilding({ definitionId: 'WELL' })],
        });
        const needs = { housing: 10, water: 10, food: 10, jobs: 10, overall: 10 };
        const change = calculatePopulationChange(gs, needs);
        // -floor(100 * 0.1) = -10
        expect(change).toBe(-10);
    });

    it('starvation kills 20% when food < pop (with wells)', () => {
        // food=5 < pop=100 → starvation deaths = floor(100*0.2) = 20
        const gs = mockGameState({
            population: 100,
            food: 5,
            buildings: [mockBuilding({ definitionId: 'WELL' })],
        });
        const needs = { housing: 100, water: 100, food: 100, jobs: 100, overall: 100 };
        const change = calculatePopulationChange(gs, needs);
        // base: 7 (happy) - 20 (starvation) = -13
        expect(change).toBe(-13);
    });

    it('dehydration kills 10% when pop > wells×100', () => {
        // pop=200, no wells → wellCount=0, pop > 0 → dehydration = floor(200*0.1) = 20
        const gs = mockGameState({ population: 200, food: 10000 });
        const needs = { housing: 100, water: 100, food: 100, jobs: 100, overall: 100 };
        const change = calculatePopulationChange(gs, needs);
        // base: floor(200*0.05)+2 = 12, - dehydration 20 = -8
        expect(change).toBe(-8);
    });
});
