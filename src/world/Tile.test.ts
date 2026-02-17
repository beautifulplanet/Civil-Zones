import { describe, it, expect } from 'vitest';
import { TileType, isWalkable, getTilePalette, getTileColor, TILE_PALETTES, GRASS_VARIANTS } from './Tile';

describe('TileType enum', () => {
    it('has correct numeric values', () => {
        expect(TileType.GRASS).toBe(0);
        expect(TileType.WATER).toBe(1);
        expect(TileType.SAND).toBe(2);
        expect(TileType.STONE).toBe(3);
        expect(TileType.FOREST).toBe(4);
        expect(TileType.DIRT).toBe(5);
    });
});

describe('isWalkable', () => {
    it('WATER is not walkable', () => {
        expect(isWalkable(TileType.WATER)).toBe(false);
    });

    it('all other types are walkable', () => {
        expect(isWalkable(TileType.GRASS)).toBe(true);
        expect(isWalkable(TileType.SAND)).toBe(true);
        expect(isWalkable(TileType.STONE)).toBe(true);
        expect(isWalkable(TileType.FOREST)).toBe(true);
        expect(isWalkable(TileType.DIRT)).toBe(true);
    });
});

describe('TILE_PALETTES', () => {
    it('has a palette for every tile type', () => {
        for (const key of Object.values(TileType)) {
            expect(TILE_PALETTES[key as TileType]).toBeDefined();
        }
    });

    it('each palette has required color keys', () => {
        for (const palette of Object.values(TILE_PALETTES)) {
            expect(palette).toHaveProperty('base');
            expect(palette).toHaveProperty('highlight');
            expect(palette).toHaveProperty('shadow');
            expect(palette).toHaveProperty('dither');
            expect(palette).toHaveProperty('outline');
        }
    });
});

describe('GRASS_VARIANTS', () => {
    it('has 4 variants', () => {
        expect(GRASS_VARIANTS).toHaveLength(4);
    });
});

describe('getTilePalette', () => {
    it('returns correct palette for WATER', () => {
        const palette = getTilePalette(TileType.WATER);
        expect(palette.base).toBe('#2080E0');
    });

    it('falls back to GRASS for unknown type', () => {
        const palette = getTilePalette(999 as any);
        expect(palette).toEqual(TILE_PALETTES[TileType.GRASS]);
    });
});

describe('getTileColor', () => {
    it('returns base color string', () => {
        const color = getTileColor(TileType.SAND);
        expect(typeof color).toBe('string');
        expect(color).toBe('#E0C060');
    });
});
