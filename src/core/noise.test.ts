import { describe, it, expect } from 'vitest';
import { NoiseGenerator, Noise } from './noise';

describe('NoiseGenerator', () => {
    describe('hash', () => {
        it('returns deterministic values for same input', () => {
            const ng = new NoiseGenerator();
            ng.init(42);
            const a = ng.hash(1, 2);
            const b = ng.hash(1, 2);
            expect(a).toBe(b);
        });

        it('returns values in [0, 1)', () => {
            const ng = new NoiseGenerator();
            ng.init(42);
            for (let i = 0; i < 50; i++) {
                const v = ng.hash(i * 7, i * 13);
                expect(v).toBeGreaterThanOrEqual(0);
                expect(v).toBeLessThan(1);
            }
        });

        it('different inputs produce different outputs', () => {
            const ng = new NoiseGenerator();
            ng.init(42);
            const a = ng.hash(0, 0);
            const b = ng.hash(1, 0);
            const c = ng.hash(0, 1);
            // Extremely unlikely all three are the same
            expect(a === b && b === c).toBe(false);
        });
    });

    describe('mix', () => {
        it('t=0 returns a', () => {
            const ng = new NoiseGenerator();
            expect(ng.mix(10, 20, 0)).toBe(10);
        });

        it('t=1 returns b', () => {
            const ng = new NoiseGenerator();
            expect(ng.mix(10, 20, 1)).toBe(20);
        });

        it('t=0.5 returns midpoint', () => {
            const ng = new NoiseGenerator();
            expect(ng.mix(10, 20, 0.5)).toBe(15);
        });
    });

    describe('val (smooth noise)', () => {
        it('returns values in [0, 1] range', () => {
            const ng = new NoiseGenerator();
            ng.init(42);
            for (let x = 0; x < 10; x++) {
                for (let y = 0; y < 10; y++) {
                    const v = ng.val(x * 0.1, y * 0.1);
                    expect(v).toBeGreaterThanOrEqual(0);
                    expect(v).toBeLessThanOrEqual(1);
                }
            }
        });

        it('is deterministic', () => {
            const ng = new NoiseGenerator();
            ng.init(42);
            const a = ng.val(3.5, 7.2);
            const b = ng.val(3.5, 7.2);
            expect(a).toBe(b);
        });
    });

    describe('fbm', () => {
        it('returns values in reasonable range', () => {
            const ng = new NoiseGenerator();
            ng.init(42);
            for (let i = 0; i < 20; i++) {
                const v = ng.fbm(i * 0.1, i * 0.3, 5);
                expect(v).toBeGreaterThanOrEqual(0);
                expect(v).toBeLessThanOrEqual(1);
            }
        });

        it('different seeds produce different results', () => {
            const ng1 = new NoiseGenerator();
            ng1.init(42);
            const ng2 = new NoiseGenerator();
            ng2.init(99);
            const a = ng1.fbm(5, 5, 4);
            const b = ng2.fbm(5, 5, 4);
            expect(a).not.toBe(b);
        });

        it('accepts octave parameter', () => {
            const ng = new NoiseGenerator();
            ng.init(42);
            const lo = ng.fbm(5, 5, 1);
            const hi = ng.fbm(5, 5, 8);
            // More octaves generally produce different (more detailed) values
            expect(typeof lo).toBe('number');
            expect(typeof hi).toBe('number');
        });
    });

    describe('singleton Noise', () => {
        it('is a NoiseGenerator instance', () => {
            expect(Noise).toBeInstanceOf(NoiseGenerator);
        });
    });
});
