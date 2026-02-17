import { describe, it, expect } from 'vitest';
import {
    createEmptyResources,
    createDefaultCapacity,
    canAfford,
    subtractResources,
    addResources,
    clampToCapacity
} from './Resources';

describe('createEmptyResources', () => {
    it('returns all zeros', () => {
        const r = createEmptyResources();
        expect(r.food).toBe(0);
        expect(r.wood).toBe(0);
        expect(r.stone).toBe(0);
        expect(r.metal).toBe(0);
        expect(r.gold).toBe(0);
    });
});

describe('createDefaultCapacity', () => {
    it('returns correct spec caps (1000/1000/500/100/10)', () => {
        const c = createDefaultCapacity();
        expect(c.food).toBe(1000);
        expect(c.wood).toBe(1000);
        expect(c.stone).toBe(500);
        expect(c.metal).toBe(100);
        expect(c.gold).toBe(10);
    });
});

describe('canAfford', () => {
    const wallet = { food: 50, wood: 30, stone: 10, metal: 5, gold: 1 };

    it('returns true when resources are sufficient', () => {
        expect(canAfford(wallet, { food: 50, wood: 30 })).toBe(true);
    });

    it('returns true for empty cost', () => {
        expect(canAfford(wallet, {})).toBe(true);
    });

    it('returns false when any resource is insufficient', () => {
        expect(canAfford(wallet, { food: 51 })).toBe(false);
        expect(canAfford(wallet, { gold: 2 })).toBe(false);
    });

    it('handles zero-cost correctly (not treated as falsy)', () => {
        // This was the original bug: cost.food = 0 was treated as "no cost"
        expect(canAfford(wallet, { food: 0 })).toBe(true);
        expect(canAfford(createEmptyResources(), { food: 0 })).toBe(true);
    });

    it('checks all five resource types independently', () => {
        expect(canAfford(wallet, { stone: 11 })).toBe(false);
        expect(canAfford(wallet, { metal: 6 })).toBe(false);
        expect(canAfford(wallet, { wood: 31 })).toBe(false);
    });
});

describe('subtractResources', () => {
    it('subtracts partial cost from full wallet', () => {
        const wallet = { food: 100, wood: 50, stone: 20, metal: 10, gold: 5 };
        const result = subtractResources(wallet, { food: 30, wood: 20 });
        expect(result.food).toBe(70);
        expect(result.wood).toBe(30);
        expect(result.stone).toBe(20); // unchanged
        expect(result.metal).toBe(10);
        expect(result.gold).toBe(5);
    });

    it('does not mutate original', () => {
        const wallet = { food: 100, wood: 50, stone: 20, metal: 10, gold: 5 };
        subtractResources(wallet, { food: 30 });
        expect(wallet.food).toBe(100);
    });

    it('can go negative (caller responsible for canAfford check)', () => {
        const wallet = createEmptyResources();
        const result = subtractResources(wallet, { food: 10 });
        expect(result.food).toBe(-10);
    });
});

describe('addResources', () => {
    it('adds partial amounts', () => {
        const wallet = { food: 10, wood: 5, stone: 0, metal: 0, gold: 0 };
        const result = addResources(wallet, { food: 20, stone: 15 });
        expect(result.food).toBe(30);
        expect(result.wood).toBe(5);
        expect(result.stone).toBe(15);
    });

    it('does not mutate original', () => {
        const wallet = createEmptyResources();
        addResources(wallet, { food: 50 });
        expect(wallet.food).toBe(0);
    });
});

describe('clampToCapacity', () => {
    it('clamps values that exceed capacity', () => {
        const resources = { food: 2000, wood: 500, stone: 100, metal: 50, gold: 5 };
        const capacity = createDefaultCapacity();
        const result = clampToCapacity(resources, capacity);
        expect(result.food).toBe(1000);
        expect(result.wood).toBe(500);
        expect(result.stone).toBe(100);
    });

    it('does not change values within capacity', () => {
        const resources = { food: 100, wood: 100, stone: 100, metal: 50, gold: 5 };
        const capacity = createDefaultCapacity();
        const result = clampToCapacity(resources, capacity);
        expect(result.food).toBe(100);
        expect(result.wood).toBe(100);
    });

    it('does not mutate original', () => {
        const resources = { food: 5000, wood: 0, stone: 0, metal: 0, gold: 0 };
        const capacity = createDefaultCapacity();
        clampToCapacity(resources, capacity);
        expect(resources.food).toBe(5000);
    });
});
