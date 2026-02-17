import { describe, it, expect } from 'vitest';
import {
    ANIMAL_CONFIG,
    NOMAD_CONFIG,
    COMBAT_CONFIG,
    INVENTORY_CONFIG,
    calculateFoodReward,
    calculateHitChance,
} from './CombatConfig';

describe('ANIMAL_CONFIG constants', () => {
    it('has all five animal types', () => {
        const expected = ['ANIMAL_RABBIT', 'ANIMAL_DEER', 'ANIMAL_BOAR', 'ANIMAL_BEAR', 'ANIMAL_BISON'];
        for (const key of expected) {
            expect(ANIMAL_CONFIG[key]).toBeDefined();
        }
    });

    it('rabbit is low risk with flee behavior', () => {
        const rabbit = ANIMAL_CONFIG['ANIMAL_RABBIT'];
        expect(rabbit.behavior).toBe('flee');
        expect(rabbit.risk).toBe('low');
        expect(rabbit.hp).toBe(1);
    });

    it('boar charges (high risk)', () => {
        const boar = ANIMAL_CONFIG['ANIMAL_BOAR'];
        expect(boar.behavior).toBe('charge');
        expect(boar.risk).toBe('high');
    });

    it('food reward ranges are [min, max] with min < max', () => {
        for (const [, cfg] of Object.entries(ANIMAL_CONFIG)) {
            expect(cfg.foodReward[0]).toBeLessThanOrEqual(cfg.foodReward[1]);
        }
    });
});

describe('calculateFoodReward', () => {
    it('returns 0 for unknown animal', () => {
        expect(calculateFoodReward('ANIMAL_UNICORN')).toBe(0);
    });

    it('returns value within range for rabbit', () => {
        const [min, max] = ANIMAL_CONFIG['ANIMAL_RABBIT'].foodReward;
        for (let i = 0; i < 50; i++) {
            const reward = calculateFoodReward('ANIMAL_RABBIT');
            expect(reward).toBeGreaterThanOrEqual(min);
            expect(reward).toBeLessThanOrEqual(max);
        }
    });
});

describe('calculateHitChance', () => {
    it('base chance with 0 tribe = 60%', () => {
        expect(calculateHitChance(0)).toBeCloseTo(0.6, 5);
    });

    it('scales +10% per nomad', () => {
        expect(calculateHitChance(1)).toBeCloseTo(0.7, 5);
        expect(calculateHitChance(2)).toBeCloseTo(0.8, 5);
    });

    it('caps at 95%', () => {
        expect(calculateHitChance(100)).toBeCloseTo(0.95, 5);
    });
});

describe('NOMAD_CONFIG', () => {
    it('hostile + friendly chances sum to 100%', () => {
        expect(NOMAD_CONFIG.hostileChance + NOMAD_CONFIG.friendlyChance).toBeCloseTo(1.0, 5);
    });
});

describe('COMBAT_CONFIG', () => {
    it('hitChanceBase is 60%', () => {
        expect(COMBAT_CONFIG.hitChanceBase).toBe(0.6);
    });

    it('herd damage threshold is 2', () => {
        expect(COMBAT_CONFIG.herdDamageThreshold).toBe(2);
    });
});

describe('INVENTORY_CONFIG', () => {
    it('maxFood and maxWood are 300', () => {
        expect(INVENTORY_CONFIG.maxFood).toBe(300);
        expect(INVENTORY_CONFIG.maxWood).toBe(300);
    });
});
