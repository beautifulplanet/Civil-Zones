import { describe, it, expect } from 'vitest';
import { Player } from './Player';

describe('Player', () => {
    it('initializes at given position', () => {
        const p = new Player(5, 10);
        expect(p.x).toBe(5);
        expect(p.y).toBe(10);
    });

    it('getPosition returns current coords', () => {
        const p = new Player(3, 7);
        const pos = p.getPosition();
        expect(pos.x).toBe(3);
        expect(pos.y).toBe(7);
    });

    it('moveTo sets target and update moves toward it', () => {
        const p = new Player(0, 0);
        p.moveTo(10, 0);

        // After one update, player should have moved toward (10,0)
        p.update();
        expect(p.x).toBeGreaterThan(0);
        expect(p.y).toBe(0);
    });

    it('reaches target after enough updates', () => {
        const p = new Player(0, 0);
        p.moveTo(1, 0);

        // Speed is 0.4 tiles/frame, distance is 1 → should arrive in ~3 frames
        for (let i = 0; i < 10; i++) p.update();
        expect(p.x).toBe(1);
        expect(p.y).toBe(0);
    });

    it('stays put when no target set', () => {
        const p = new Player(5, 5);
        p.update();
        p.update();
        expect(p.x).toBe(5);
        expect(p.y).toBe(5);
    });

    it('handles diagonal movement', () => {
        const p = new Player(0, 0);
        p.moveTo(10, 10);
        p.update();
        // Both x and y should increase
        expect(p.x).toBeGreaterThan(0);
        expect(p.y).toBeGreaterThan(0);
        // Should move equal amounts (diagonal)
        expect(p.x).toBeCloseTo(p.y, 10);
    });
});
