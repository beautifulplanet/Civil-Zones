import { describe, it, expect } from 'vitest';
import { createGameState } from './GameState';
import { ChunkManager } from '../world/ChunkManager';

describe('createGameState', () => {
    it('starts in WANDER phase', () => {
        const cm = new ChunkManager();
        const gs = createGameState(cm);
        expect(gs.phase).toBe('WANDER');
    });

    it('starts at year 1 with population 1', () => {
        const cm = new ChunkManager();
        const gs = createGameState(cm);
        expect(gs.year).toBe(1);
        expect(gs.population).toBe(1);
    });

    it('starts with 100 thirst', () => {
        const cm = new ChunkManager();
        const gs = createGameState(cm);
        expect(gs.thirst).toBe(100);
    });

    it('starts with 50 food and 50 wood', () => {
        const cm = new ChunkManager();
        const gs = createGameState(cm);
        const r = gs.resources.getResources();
        expect(r.food).toBe(50);
        expect(r.wood).toBe(50);
        expect(r.stone).toBe(0);
        expect(r.metal).toBe(0);
        expect(r.gold).toBe(0);
    });

    it('inventory limits are 300/300', () => {
        const cm = new ChunkManager();
        const gs = createGameState(cm);
        expect(gs.maxFood).toBe(300);
        expect(gs.maxWood).toBe(300);
    });

    it('has no well, settlement at origin', () => {
        const cm = new ChunkManager();
        const gs = createGameState(cm);
        expect(gs.hasWell).toBe(false);
        expect(gs.settlementX).toBe(0);
        expect(gs.settlementY).toBe(0);
    });

    it('stats start at zero', () => {
        const cm = new ChunkManager();
        const gs = createGameState(cm);
        expect(gs.totalIncome).toBe(0);
        expect(gs.totalProduction).toBe(0);
        expect(gs.totalJobs).toBe(0);
        expect(gs.employedWorkers).toBe(0);
    });
});
