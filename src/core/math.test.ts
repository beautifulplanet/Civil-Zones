import { describe, it, expect } from 'vitest';
import {
    worldToScreen,
    screenToWorld,
    worldToCanvas,
    canvasToWorld,
    TILE_WIDTH,
    TILE_HEIGHT,
    TILE_HALF_W,
    TILE_HALF_H,
} from './math';

describe('constants', () => {
    it('TILE_WIDTH = 64, TILE_HEIGHT = 32 (2:1 ratio)', () => {
        expect(TILE_WIDTH).toBe(64);
        expect(TILE_HEIGHT).toBe(32);
        expect(TILE_HALF_W).toBe(32);
        expect(TILE_HALF_H).toBe(16);
    });
});

describe('worldToScreen', () => {
    it('origin maps to origin', () => {
        const p = worldToScreen(0, 0);
        expect(p.x).toBe(0);
        expect(p.y).toBe(0);
    });

    it('(1,0) maps to (halfW, halfH)', () => {
        const p = worldToScreen(1, 0);
        expect(p.x).toBe(TILE_HALF_W);
        expect(p.y).toBe(TILE_HALF_H);
    });

    it('(0,1) maps to (-halfW, halfH)', () => {
        const p = worldToScreen(0, 1);
        expect(p.x).toBe(-TILE_HALF_W);
        expect(p.y).toBe(TILE_HALF_H);
    });

    it('(1,1) maps to (0, 2*halfH)', () => {
        const p = worldToScreen(1, 1);
        expect(p.x).toBe(0);
        expect(p.y).toBe(2 * TILE_HALF_H);
    });
});

describe('screenToWorld (inverse)', () => {
    it('round-trip through worldToScreen → screenToWorld', () => {
        const pts = [[0, 0], [3, 5], [-2, 7], [10, 10]];
        for (const [wx, wy] of pts) {
            const screen = worldToScreen(wx, wy);
            const back = screenToWorld(screen.x, screen.y);
            expect(back.x).toBeCloseTo(wx, 10);
            expect(back.y).toBeCloseTo(wy, 10);
        }
    });
});

describe('worldToCanvas / canvasToWorld (camera transforms)', () => {
    const camera = { x: 0, y: 0, zoom: 1 };
    const viewport = { width: 800, height: 600 };

    it('world origin maps to viewport center', () => {
        const p = worldToCanvas(0, 0, camera, viewport);
        expect(p.x).toBe(400);
        expect(p.y).toBe(300);
    });

    it('canvasToWorld inverts worldToCanvas', () => {
        const wx = 5, wy = 3;
        const canvas = worldToCanvas(wx, wy, camera, viewport);
        const back = canvasToWorld(canvas.x, canvas.y, camera, viewport);
        expect(back.x).toBeCloseTo(wx, 10);
        expect(back.y).toBeCloseTo(wy, 10);
    });

    it('zoom affects output', () => {
        const cam2x = { x: 0, y: 0, zoom: 2 };
        const a = worldToCanvas(1, 0, camera, viewport);
        const b = worldToCanvas(1, 0, cam2x, viewport);
        // At 2x zoom, distance from center doubles
        expect(Math.abs(b.x - 400)).toBeCloseTo(2 * Math.abs(a.x - 400), 5);
        expect(Math.abs(b.y - 300)).toBeCloseTo(2 * Math.abs(a.y - 300), 5);
    });
});
