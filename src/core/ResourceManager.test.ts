import { describe, it, expect } from 'vitest';
import { ResourceManager } from './ResourceManager';

describe('ResourceManager', () => {
    describe('constructor', () => {
        it('initializes with empty resources by default', () => {
            const rm = new ResourceManager();
            const r = rm.getResources();
            expect(r.food).toBe(0);
            expect(r.wood).toBe(0);
        });

        it('accepts partial initial resources', () => {
            const rm = new ResourceManager({ food: 50, wood: 30 });
            const r = rm.getResources();
            expect(r.food).toBe(50);
            expect(r.wood).toBe(30);
            expect(r.stone).toBe(0);
        });
    });

    describe('canAfford / subtract', () => {
        it('returns true when affordable', () => {
            const rm = new ResourceManager({ food: 100 });
            expect(rm.canAfford({ food: 50 })).toBe(true);
        });

        it('returns false when not affordable', () => {
            const rm = new ResourceManager({ food: 10 });
            expect(rm.canAfford({ food: 50 })).toBe(false);
        });

        it('subtract returns true and deducts when affordable', () => {
            const rm = new ResourceManager({ food: 100 });
            const ok = rm.subtract({ food: 40 });
            expect(ok).toBe(true);
            expect(rm.getResources().food).toBe(60);
        });

        it('subtract returns false and does not deduct when not affordable', () => {
            const rm = new ResourceManager({ food: 10 });
            const ok = rm.subtract({ food: 50 });
            expect(ok).toBe(false);
            expect(rm.getResources().food).toBe(10);
        });
    });

    describe('add + capping', () => {
        it('adds resources and clamps to capacity', () => {
            const rm = new ResourceManager({ food: 990 });
            rm.add({ food: 50 });
            expect(rm.getResources().food).toBe(1000); // capped at default 1000
        });

        it('adds without capping when under limit', () => {
            const rm = new ResourceManager({ food: 100 });
            rm.add({ food: 50 });
            expect(rm.getResources().food).toBe(150);
        });
    });

    describe('setCapacity', () => {
        it('clamp existing resources to new capacity', () => {
            const rm = new ResourceManager({ food: 500 });
            rm.setCapacity({ food: 200 });
            expect(rm.getResources().food).toBe(200);
        });
    });

    describe('applySpoilage', () => {
        it('spoils 20% food without storage', () => {
            const rm = new ResourceManager({ food: 100 });
            const spoiled = rm.applySpoilage();
            expect(spoiled).toBe(20);
            expect(rm.getResources().food).toBe(80);
        });

        it('spoils 10% food with storage', () => {
            const rm = new ResourceManager({ food: 100 });
            rm.setHasStorage(true);
            const spoiled = rm.applySpoilage();
            expect(spoiled).toBe(10);
            expect(rm.getResources().food).toBe(90);
        });

        it('returns 0 when no food', () => {
            const rm = new ResourceManager();
            const spoiled = rm.applySpoilage();
            expect(spoiled).toBe(0);
        });
    });

    describe('consumeAnnualFood', () => {
        it('returns true when enough food (1 per person)', () => {
            const rm = new ResourceManager({ food: 100 });
            const survived = rm.consumeAnnualFood(50);
            expect(survived).toBe(true);
            expect(rm.getResources().food).toBe(50);
        });

        it('returns false on starvation and zeroes food', () => {
            const rm = new ResourceManager({ food: 10 });
            const survived = rm.consumeAnnualFood(50);
            expect(survived).toBe(false);
            expect(rm.getResources().food).toBe(0);
        });
    });

    describe('getResources returns defensive copy', () => {
        it('mutation of returned object does not affect internal state', () => {
            const rm = new ResourceManager({ food: 100 });
            const r = rm.getResources();
            (r as any).food = 999;
            expect(rm.getResources().food).toBe(100);
        });
    });
});
