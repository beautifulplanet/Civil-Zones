import { describe, it, expect } from 'vitest';
import {
  simulateStep,
  computeStableDt,
  fullStep,
  addRainfall,
  applyEvaporation,
  addPointSource,
  applyFriction,
} from '../simulation/ShallowWater';
import {
  createWaterGrid,
  DEFAULT_WATER_CONFIG,
} from '../simulation/types';
import type { WaterGrid } from '../simulation/types';
import { TileType } from '../world/Tile';

/** Helper: sum of all water depth (volume when cellSize=1) */
function totalDepth(grid: WaterGrid): number {
  let sum = 0;
  for (let i = 0; i < grid.depth.length; i++) sum += grid.depth[i];
  return sum;
}

// ─── Mass Conservation ───────────────────────────────────────

describe('ShallowWater — mass conservation', () => {
  it('total water is preserved after a single step (flat terrain)', () => {
    const grid = createWaterGrid(10, 10);
    grid.terrain.fill(0);
    grid.depth[55] = 1.0; // 1m water at center

    const before = totalDepth(grid);
    simulateStep(grid, DEFAULT_WATER_CONFIG, 0.01);
    const after = totalDepth(grid);

    expect(after).toBeCloseTo(before, 6);
  });

  it('total water is preserved after many steps', () => {
    const grid = createWaterGrid(10, 10);
    grid.terrain.fill(0);
    grid.depth[55] = 2.0;
    grid.depth[22] = 0.5;

    const before = totalDepth(grid);
    for (let i = 0; i < 100; i++) {
      const dt = computeStableDt(grid, DEFAULT_WATER_CONFIG);
      simulateStep(grid, DEFAULT_WATER_CONFIG, dt);
    }
    const after = totalDepth(grid);

    expect(after).toBeCloseTo(before, 4);
  });

  it('total water is preserved with sloped terrain', () => {
    const grid = createWaterGrid(5, 5);
    // Linear slope: row 0 = 5m, row 4 = 1m
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        grid.terrain[y * 5 + x] = 5 - y;
      }
    }
    grid.depth[2] = 1.0; // water on top of slope

    const before = totalDepth(grid);
    for (let i = 0; i < 50; i++) {
      simulateStep(grid, DEFAULT_WATER_CONFIG, 0.01);
    }
    const after = totalDepth(grid);

    expect(after).toBeCloseTo(before, 4);
  });
});

// ─── Equilibrium ─────────────────────────────────────────────

describe('ShallowWater — equilibrium', () => {
  it('flat water surface does not flow', () => {
    const grid = createWaterGrid(5, 5);
    grid.terrain.fill(0);
    grid.depth.fill(1.0); // uniform 1m water

    simulateStep(grid, DEFAULT_WATER_CONFIG, 0.01);

    for (let i = 0; i < 25; i++) {
      expect(grid.depth[i]).toBeCloseTo(1.0, 4);
    }
  });

  it('water at equal hydraulic head does not flow', () => {
    // Terrain: staircase where water fills to same surface level
    const grid = createWaterGrid(3, 1);
    grid.terrain[0] = 0;
    grid.terrain[1] = 1;
    grid.terrain[2] = 2;
    // All water surfaces at height 3
    grid.depth[0] = 3;
    grid.depth[1] = 2;
    grid.depth[2] = 1;

    simulateStep(grid, DEFAULT_WATER_CONFIG, 0.01);

    // Depths should remain approximately the same (equal head)
    expect(grid.depth[0]).toBeCloseTo(3, 2);
    expect(grid.depth[1]).toBeCloseTo(2, 2);
    expect(grid.depth[2]).toBeCloseTo(1, 2);
  });
});

// ─── Flow Direction ──────────────────────────────────────────

describe('ShallowWater — flow direction', () => {
  it('water flows from high terrain to low terrain', () => {
    const grid = createWaterGrid(5, 1);
    grid.terrain[0] = 4;
    grid.terrain[1] = 3;
    grid.terrain[2] = 2;
    grid.terrain[3] = 1;
    grid.terrain[4] = 0;
    grid.depth[0] = 1.0; // water on top of hill

    for (let i = 0; i < 200; i++) {
      const dt = Math.min(0.05, computeStableDt(grid, DEFAULT_WATER_CONFIG));
      simulateStep(grid, DEFAULT_WATER_CONFIG, dt);
    }

    // After many steps, most water should be at the bottom
    expect(grid.depth[4]).toBeGreaterThan(grid.depth[0]);
  });

  it('water spreads symmetrically on flat terrain', () => {
    const grid = createWaterGrid(5, 5);
    grid.terrain.fill(0);
    grid.depth[12] = 1.0; // center cell (2,2)

    simulateStep(grid, DEFAULT_WATER_CONFIG, 0.01);

    // Symmetric neighbors should have same depth
    const right = grid.depth[13]; // (3,2)
    const left  = grid.depth[11]; // (1,2)
    const down  = grid.depth[17]; // (2,3)
    const up    = grid.depth[7];  // (2,1)

    expect(right).toBeCloseTo(left, 6);
    expect(right).toBeCloseTo(up, 6);
    expect(right).toBeCloseTo(down, 6);
    expect(right).toBeGreaterThan(0);
  });

  it('water does not flow uphill', () => {
    const grid = createWaterGrid(3, 1);
    grid.terrain[0] = 0; // low
    grid.terrain[1] = 5; // wall
    grid.terrain[2] = 0; // low
    grid.depth[0] = 1.0;

    for (let i = 0; i < 50; i++) {
      simulateStep(grid, DEFAULT_WATER_CONFIG, 0.01);
    }

    // Water should stay on the left side (wall blocks)
    expect(grid.depth[2]).toBeCloseTo(0, 4);
    expect(grid.depth[0]).toBeGreaterThan(0.9);
  });
});

// ─── CFL Stability ───────────────────────────────────────────

describe('ShallowWater — CFL stability', () => {
  it('computes a safe timestep for deep water', () => {
    const grid = createWaterGrid(10, 10);
    grid.depth[0] = 10.0;

    const dt = computeStableDt(grid, DEFAULT_WATER_CONFIG);

    expect(dt).toBeGreaterThan(0);
    expect(dt).toBeLessThan(1);
    // CFL: dx / (2·√(g·h)) = 1 / (2·√(9.81·10)) ≈ 0.0505
    // With 0.9 safety: ≈ 0.045
    expect(dt).toBeCloseTo(0.045, 2);
  });

  it('returns large dt when no water present', () => {
    const grid = createWaterGrid(10, 10);
    const dt = computeStableDt(grid, DEFAULT_WATER_CONFIG);
    expect(dt).toBe(0.1);
  });

  it('smaller max depth gives larger dt', () => {
    const grid1 = createWaterGrid(5, 5);
    grid1.depth[0] = 1.0;

    const grid2 = createWaterGrid(5, 5);
    grid2.depth[0] = 10.0;

    const dt1 = computeStableDt(grid1, DEFAULT_WATER_CONFIG);
    const dt2 = computeStableDt(grid2, DEFAULT_WATER_CONFIG);

    expect(dt1).toBeGreaterThan(dt2);
  });
});

// ─── Depth Never Goes Negative ───────────────────────────────

describe('ShallowWater — non-negative depth', () => {
  it('depth never goes negative even with aggressive dt', () => {
    const grid = createWaterGrid(5, 5);
    grid.terrain.fill(0);
    grid.depth[12] = 0.001; // tiny amount

    // Use overly large dt (violates CFL) — still should clamp to 0
    simulateStep(grid, DEFAULT_WATER_CONFIG, 1.0);

    for (let i = 0; i < 25; i++) {
      expect(grid.depth[i]).toBeGreaterThanOrEqual(0);
    }
  });
});

// ─── Water Sources ───────────────────────────────────────────

describe('ShallowWater — sources', () => {
  it('addRainfall increases total water', () => {
    const grid = createWaterGrid(10, 10);
    const before = totalDepth(grid);

    addRainfall(grid, 0.001, 1.0); // 1mm/s for 1s

    const after = totalDepth(grid);
    expect(after).toBeGreaterThan(before);
    expect(after).toBeCloseTo(100 * 0.001, 6); // 100 cells × 0.001m
  });

  it('applyEvaporation decreases total water', () => {
    const grid = createWaterGrid(10, 10);
    grid.depth.fill(1.0);
    const before = totalDepth(grid);

    applyEvaporation(grid, 0.001, 1.0);

    const after = totalDepth(grid);
    expect(after).toBeLessThan(before);
    expect(after).toBeCloseTo(100 * 0.999, 4);
  });

  it('applyEvaporation does not go negative', () => {
    const grid = createWaterGrid(5, 5);
    grid.depth[0] = 0.0001;

    applyEvaporation(grid, 1.0, 1.0); // huge evaporation

    expect(grid.depth[0]).toBe(0);
  });

  it('addPointSource adds water at correct cell', () => {
    const grid = createWaterGrid(5, 5);

    addPointSource(grid, 2, 3, 0.5);

    expect(grid.depth[3 * 5 + 2]).toBe(0.5);
    // Other cells unchanged
    expect(grid.depth[0]).toBe(0);
  });

  it('addPointSource ignores out-of-bounds', () => {
    const grid = createWaterGrid(5, 5);

    addPointSource(grid, -1, 0, 1.0);
    addPointSource(grid, 5, 0, 1.0);

    expect(totalDepth(grid)).toBe(0);
  });
});

// ─── Friction ────────────────────────────────────────────────

describe('ShallowWater — Manning friction', () => {
  it('friction reduces flux', () => {
    const grid = createWaterGrid(5, 1);
    grid.terrain.fill(0);
    grid.depth.fill(1.0);
    grid.terrainType.fill(TileType.GRASS); // n = 0.030
    // Set some initial flux
    grid.fluxRight[0] = 1.0;
    grid.fluxRight[1] = 1.0;
    // Compute velocity for friction calculation
    grid.velX[0] = 1.0;
    grid.velX[1] = 1.0;

    const fluxBefore = grid.fluxRight[0];
    applyFriction(grid, DEFAULT_WATER_CONFIG, 0.01);

    expect(grid.fluxRight[0]).toBeLessThan(fluxBefore);
    expect(grid.fluxRight[0]).toBeGreaterThan(0); // not zero
  });

  it('forest terrain has more friction than grassland', () => {
    // Two identical grids, one grass, one forest
    const grassGrid = createWaterGrid(3, 1);
    grassGrid.terrain.fill(0);
    grassGrid.depth.fill(1.0);
    grassGrid.terrainType.fill(TileType.GRASS);
    grassGrid.fluxRight[0] = 1.0;
    grassGrid.velX[0] = 1.0;

    const forestGrid = createWaterGrid(3, 1);
    forestGrid.terrain.fill(0);
    forestGrid.depth.fill(1.0);
    forestGrid.terrainType.fill(TileType.FOREST);
    forestGrid.fluxRight[0] = 1.0;
    forestGrid.velX[0] = 1.0;

    applyFriction(grassGrid, DEFAULT_WATER_CONFIG, 0.01);
    applyFriction(forestGrid, DEFAULT_WATER_CONFIG, 0.01);

    // Forest (n=0.100) should slow flux more than grass (n=0.030)
    expect(forestGrid.fluxRight[0]).toBeLessThan(grassGrid.fluxRight[0]);
  });
});

// ─── Full Step ───────────────────────────────────────────────

describe('ShallowWater — fullStep', () => {
  it('full step with rain increases water', () => {
    const grid = createWaterGrid(5, 5);
    grid.terrain.fill(0);

    fullStep(grid, DEFAULT_WATER_CONFIG, 0.01, true);

    const after = totalDepth(grid);
    // Rain adds water, evap removes small amount; net positive
    expect(after).toBeGreaterThan(0);
  });

  it('full step without rain only evaporates', () => {
    const grid = createWaterGrid(5, 5);
    grid.terrain.fill(0);
    grid.depth.fill(1.0);

    const before = totalDepth(grid);
    fullStep(grid, DEFAULT_WATER_CONFIG, 0.01, false);
    const after = totalDepth(grid);

    // No rain + evaporation → less water
    expect(after).toBeLessThan(before);
  });
});

// ─── Integration: pool filling ───────────────────────────────

describe('ShallowWater — integration', () => {
  it('water fills a bowl to equilibrium', () => {
    // Bowl: edges at height 2, center at height 0
    const grid = createWaterGrid(5, 5);
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const distFromCenter = Math.max(Math.abs(x - 2), Math.abs(y - 2));
        grid.terrain[y * 5 + x] = distFromCenter >= 2 ? 2 : 0;
      }
    }
    // Drop water in center
    grid.depth[12] = 2.0;

    for (let i = 0; i < 2000; i++) {
      const dt = Math.min(0.05, computeStableDt(grid, DEFAULT_WATER_CONFIG));
      simulateStep(grid, DEFAULT_WATER_CONFIG, dt);
    }

    // Interior cells (those with terrain=0) should have roughly equal depth
    const interiorCells = [6, 7, 8, 11, 12, 13, 16, 17, 18];
    const depths = interiorCells.map(i => grid.depth[i]);
    const avgDepth = depths.reduce((a, b) => a + b, 0) / depths.length;

    for (const d of depths) {
      expect(d).toBeCloseTo(avgDepth, 0); // within 0.5m (equilibration takes time)
    }
  });
});
