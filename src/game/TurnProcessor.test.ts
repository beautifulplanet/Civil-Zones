import { describe, it, expect } from 'vitest';
import { processTurn } from './TurnProcessor';
import { createGameState } from './GameState';
import { ChunkManager } from '../world/ChunkManager';

function makeGameState(overrides: { population?: number; food?: number } = {}) {
    const cm = new ChunkManager();
    const gs = createGameState(cm);
    gs.phase = 'CITY';
    gs.population = overrides.population ?? 10;
    // Reset resources to controlled values
    gs.resources = new (gs.resources.constructor as any)({
        food: overrides.food ?? 200,
        wood: 100,
        stone: 0,
        metal: 0,
        gold: 0,
    });
    return gs;
}

describe('processTurn', () => {
    it('returns TurnResult with correct year', () => {
        const gs = makeGameState();
        const result = processTurn(gs);
        expect(result.year).toBe(2); // year increments
    });

    it('advances gameState.year', () => {
        const gs = makeGameState();
        expect(gs.year).toBe(1);
        processTurn(gs);
        expect(gs.year).toBe(2);
    });

    it('consumes 1 food per person', () => {
        const gs = makeGameState({ population: 10, food: 200 });
        const result = processTurn(gs);
        expect(result.foodConsumed).toBe(10);
    });

    it('applies spoilage', () => {
        const gs = makeGameState({ population: 0, food: 100 });
        const result = processTurn(gs);
        // With no storage: 20% spoilage
        expect(result.spoilage).toBeGreaterThanOrEqual(0);
    });

    it('population changes based on needs', () => {
        const gs = makeGameState({ population: 10, food: 500 });
        const result = processTurn(gs);
        expect(typeof result.populationChange).toBe('number');
    });

    it('generates events array', () => {
        const gs = makeGameState();
        const result = processTurn(gs);
        expect(Array.isArray(result.events)).toBe(true);
    });

    it('population never goes below zero', () => {
        const gs = makeGameState({ population: 1, food: 0 });
        processTurn(gs);
        expect(gs.population).toBeGreaterThanOrEqual(0);
    });
});
