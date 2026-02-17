import { describe, it, expect } from 'vitest';
import {
  createWaterGrid,
  totalWaterVolume,
  maxWaterDepth,
  gridIndex,
  DEFAULT_WATER_CONFIG,
  MANNING_COEFFICIENTS,
} from '../simulation/types';
import { TileType } from '../world/Tile';

describe('createWaterGrid', () => {
  it('creates a grid with correct dimensions', () => {
    const grid = createWaterGrid(10, 8);
    expect(grid.width).toBe(10);
    expect(grid.height).toBe(8);
  });

  it('allocates correctly sized typed arrays', () => {
    const grid = createWaterGrid(10, 8);
    const n = 10 * 8;
    expect(grid.terrain.length).toBe(n);
    expect(grid.terrainType.length).toBe(n);
    expect(grid.depth.length).toBe(n);
    expect(grid.fluxRight.length).toBe(n);
    expect(grid.fluxLeft.length).toBe(n);
    expect(grid.fluxUp.length).toBe(n);
    expect(grid.fluxDown.length).toBe(n);
    expect(grid.velX.length).toBe(n);
    expect(grid.velY.length).toBe(n);
  });

  it('initializes all values to zero', () => {
    const grid = createWaterGrid(5, 5);
    for (let i = 0; i < 25; i++) {
      expect(grid.terrain[i]).toBe(0);
      expect(grid.depth[i]).toBe(0);
      expect(grid.fluxRight[i]).toBe(0);
      expect(grid.velX[i]).toBe(0);
    }
  });

  it('throws on invalid dimensions', () => {
    expect(() => createWaterGrid(0, 5)).toThrow('Invalid grid dimensions');
    expect(() => createWaterGrid(5, -1)).toThrow('Invalid grid dimensions');
  });

  it('handles 1x1 grid', () => {
    const grid = createWaterGrid(1, 1);
    expect(grid.depth.length).toBe(1);
  });
});

describe('totalWaterVolume', () => {
  it('returns 0 for empty grid', () => {
    const grid = createWaterGrid(5, 5);
    expect(totalWaterVolume(grid)).toBe(0);
  });

  it('computes correct volume with cellSize 1', () => {
    const grid = createWaterGrid(3, 3);
    grid.depth[0] = 1.0;
    grid.depth[4] = 2.0;
    expect(totalWaterVolume(grid, 1.0)).toBeCloseTo(3.0, 6);
  });

  it('scales volume by cell area', () => {
    const grid = createWaterGrid(2, 2);
    grid.depth.fill(1.0);
    // cellSize=2 → cellArea=4 → 4 cells × 1m depth × 4m² = 16m³
    expect(totalWaterVolume(grid, 2.0)).toBeCloseTo(16.0, 6);
  });
});

describe('maxWaterDepth', () => {
  it('returns 0 for dry grid', () => {
    const grid = createWaterGrid(5, 5);
    expect(maxWaterDepth(grid)).toBe(0);
  });

  it('finds the maximum depth', () => {
    const grid = createWaterGrid(5, 5);
    grid.depth[3] = 0.5;
    grid.depth[10] = 2.3;
    grid.depth[20] = 1.1;
    expect(maxWaterDepth(grid)).toBeCloseTo(2.3, 6);
  });
});

describe('gridIndex', () => {
  it('returns correct linear index', () => {
    const grid = createWaterGrid(10, 10);
    expect(gridIndex(grid, 0, 0)).toBe(0);
    expect(gridIndex(grid, 5, 3)).toBe(35);
    expect(gridIndex(grid, 9, 9)).toBe(99);
  });

  it('returns -1 for out of bounds', () => {
    const grid = createWaterGrid(10, 10);
    expect(gridIndex(grid, -1, 0)).toBe(-1);
    expect(gridIndex(grid, 0, -1)).toBe(-1);
    expect(gridIndex(grid, 10, 0)).toBe(-1);
    expect(gridIndex(grid, 0, 10)).toBe(-1);
  });
});

describe('MANNING_COEFFICIENTS', () => {
  it('has values for all tile types', () => {
    expect(MANNING_COEFFICIENTS[TileType.GRASS]).toBe(0.030);
    expect(MANNING_COEFFICIENTS[TileType.WATER]).toBe(0.010);
    expect(MANNING_COEFFICIENTS[TileType.SAND]).toBe(0.025);
    expect(MANNING_COEFFICIENTS[TileType.STONE]).toBe(0.035);
    expect(MANNING_COEFFICIENTS[TileType.FOREST]).toBe(0.100);
    expect(MANNING_COEFFICIENTS[TileType.DIRT]).toBe(0.020);
  });

  it('all coefficients are positive', () => {
    for (const [, n] of Object.entries(MANNING_COEFFICIENTS)) {
      expect(n).toBeGreaterThan(0);
    }
  });
});

describe('DEFAULT_WATER_CONFIG', () => {
  it('has standard gravity', () => {
    expect(DEFAULT_WATER_CONFIG.gravity).toBe(9.81);
  });

  it('has reasonable defaults', () => {
    expect(DEFAULT_WATER_CONFIG.pipeArea).toBeGreaterThan(0);
    expect(DEFAULT_WATER_CONFIG.cellSize).toBeGreaterThan(0);
    expect(DEFAULT_WATER_CONFIG.rainRate).toBeGreaterThan(0);
    expect(DEFAULT_WATER_CONFIG.evapRate).toBeGreaterThan(0);
    expect(DEFAULT_WATER_CONFIG.dryThreshold).toBeGreaterThan(0);
  });

  it('rain rate exceeds evaporation rate', () => {
    expect(DEFAULT_WATER_CONFIG.rainRate).toBeGreaterThan(DEFAULT_WATER_CONFIG.evapRate);
  });
});
