import { describe, it, expect } from 'vitest';
import {
  assessFloodDamage,
  applyFloodDamage,
  applyDamToTerrain,
  applyDrainageChannel,
  FLOOD_DAMAGE_THRESHOLD,
  DAMAGE_SCALE,
  MAX_DAMAGE,
} from '../simulation/FloodMechanics';
import { createWaterGrid, DEFAULT_WATER_CONFIG } from '../simulation/types';
import { simulateStep, computeStableDt } from '../simulation/ShallowWater';
import type { Building } from '../world/Building';

/** Helper to create a mock building at given position */
function mockBuilding(x: number, y: number, id?: string): Building {
  return {
    id: id ?? `B_${x}_${y}`,
    definitionId: 'R1',
    x,
    y,
    state: 2,
    yearBuilt: 1,
    efficiency: 1.0,
  };
}

// ─── assessFloodDamage ───────────────────────────────────────

describe('assessFloodDamage', () => {
  it('returns empty array when no buildings are flooded', () => {
    const grid = createWaterGrid(5, 5);
    const buildings = [mockBuilding(1, 1), mockBuilding(2, 2)];

    const results = assessFloodDamage(buildings, grid, 0, 0);

    expect(results).toHaveLength(0);
  });

  it('detects flooding when depth exceeds threshold', () => {
    const grid = createWaterGrid(5, 5);
    grid.depth[1 * 5 + 1] = 0.1; // 10cm at (1,1)
    const buildings = [mockBuilding(1, 1)];

    const results = assessFloodDamage(buildings, grid, 0, 0);

    expect(results).toHaveLength(1);
    expect(results[0].buildingId).toBe('B_1_1');
    expect(results[0].waterDepth).toBeCloseTo(0.1);
    expect(results[0].damage).toBeCloseTo(0.1 * DAMAGE_SCALE);
  });

  it('ignores depth below threshold', () => {
    const grid = createWaterGrid(5, 5);
    grid.depth[1 * 5 + 1] = 0.04; // 4cm < 5cm threshold
    const buildings = [mockBuilding(1, 1)];

    const results = assessFloodDamage(buildings, grid, 0, 0);

    expect(results).toHaveLength(0);
  });

  it('caps damage at MAX_DAMAGE', () => {
    const grid = createWaterGrid(5, 5);
    grid.depth[0] = 10.0; // huge depth
    const buildings = [mockBuilding(0, 0)];

    const results = assessFloodDamage(buildings, grid, 0, 0);

    expect(results[0].damage).toBe(MAX_DAMAGE);
  });

  it('applies grid origin offset correctly', () => {
    const grid = createWaterGrid(5, 5);
    grid.depth[2 * 5 + 3] = 0.5; // grid cell (3,2) flooded
    // Building at world (13,12), grid origin at (10,10)
    // → grid coords = (13-10, 12-10) = (3, 2) ✓
    const buildings = [mockBuilding(13, 12)];

    const results = assessFloodDamage(buildings, grid, 10, 10);

    expect(results).toHaveLength(1);
    expect(results[0].waterDepth).toBeCloseTo(0.5);
  });

  it('skips buildings outside the grid', () => {
    const grid = createWaterGrid(5, 5);
    grid.depth.fill(1.0); // everything flooded

    const buildings = [
      mockBuilding(-1, 0),  // outside
      mockBuilding(0, -1),  // outside
      mockBuilding(5, 0),   // outside
      mockBuilding(0, 5),   // outside
    ];

    const results = assessFloodDamage(buildings, grid, 0, 0);

    expect(results).toHaveLength(0);
  });

  it('handles multiple buildings with varying damage', () => {
    const grid = createWaterGrid(5, 5);
    grid.depth[0 * 5 + 0] = 0.1;  // 15% damage
    grid.depth[1 * 5 + 1] = 0.3;  // 45% damage
    grid.depth[2 * 5 + 2] = 0.0;  // no damage

    const buildings = [
      mockBuilding(0, 0, 'low'),
      mockBuilding(1, 1, 'mid'),
      mockBuilding(2, 2, 'dry'),
    ];

    const results = assessFloodDamage(buildings, grid, 0, 0);

    expect(results).toHaveLength(2); // only 2 flooded
    const low = results.find(r => r.buildingId === 'low')!;
    const mid = results.find(r => r.buildingId === 'mid')!;
    expect(low.damage).toBeLessThan(mid.damage);
  });
});

// ─── applyFloodDamage ────────────────────────────────────────

describe('applyFloodDamage', () => {
  it('reduces building efficiency by damage amount', () => {
    const buildings = [mockBuilding(0, 0, 'B1')];
    const damages = [{ buildingId: 'B1', waterDepth: 0.2, damage: 0.3 }];

    applyFloodDamage(buildings, damages);

    expect(buildings[0].efficiency).toBeCloseTo(0.7);
  });

  it('floors efficiency at 0.1 (10%)', () => {
    const buildings = [mockBuilding(0, 0, 'B1')];
    buildings[0].efficiency = 0.5;
    const damages = [{ buildingId: 'B1', waterDepth: 1.0, damage: MAX_DAMAGE }];

    applyFloodDamage(buildings, damages);

    expect(buildings[0].efficiency).toBe(0.1);
  });

  it('does not modify undamaged buildings', () => {
    const buildings = [
      mockBuilding(0, 0, 'B1'),
      mockBuilding(1, 1, 'B2'),
    ];
    const damages = [{ buildingId: 'B1', waterDepth: 0.2, damage: 0.3 }];

    applyFloodDamage(buildings, damages);

    expect(buildings[1].efficiency).toBe(1.0); // B2 untouched
  });
});

// ─── applyDamToTerrain ───────────────────────────────────────

describe('applyDamToTerrain', () => {
  it('raises terrain horizontally', () => {
    const grid = createWaterGrid(5, 5);
    grid.terrain.fill(1.0);

    applyDamToTerrain(grid, 1, 2, 3, 'horizontal', 0.5);

    expect(grid.terrain[2 * 5 + 1]).toBeCloseTo(1.5); // (1,2)
    expect(grid.terrain[2 * 5 + 2]).toBeCloseTo(1.5); // (2,2)
    expect(grid.terrain[2 * 5 + 3]).toBeCloseTo(1.5); // (3,2)
    expect(grid.terrain[2 * 5 + 0]).toBeCloseTo(1.0); // (0,2) untouched
    expect(grid.terrain[2 * 5 + 4]).toBeCloseTo(1.0); // (4,2) untouched
  });

  it('raises terrain vertically', () => {
    const grid = createWaterGrid(5, 5);
    grid.terrain.fill(0);

    applyDamToTerrain(grid, 2, 1, 3, 'vertical', 1.0);

    expect(grid.terrain[1 * 5 + 2]).toBeCloseTo(1.0); // (2,1)
    expect(grid.terrain[2 * 5 + 2]).toBeCloseTo(1.0); // (2,2)
    expect(grid.terrain[3 * 5 + 2]).toBeCloseTo(1.0); // (2,3)
    expect(grid.terrain[0 * 5 + 2]).toBeCloseTo(0.0); // (2,0) untouched
  });

  it('clips to grid bounds', () => {
    const grid = createWaterGrid(5, 5);

    // Dam starts at edge and extends beyond
    applyDamToTerrain(grid, 3, 0, 5, 'horizontal', 2.0);

    expect(grid.terrain[0 * 5 + 3]).toBeCloseTo(2.0); // (3,0) raised
    expect(grid.terrain[0 * 5 + 4]).toBeCloseTo(2.0); // (4,0) raised
    // cells 5,6,7 out of bounds — no crash
  });

  it('dam actually blocks water flow', () => {
    const grid = createWaterGrid(5, 1);
    grid.terrain.fill(0);
    grid.depth[0] = 2.0; // water on left

    // Place a tall dam at position 2
    applyDamToTerrain(grid, 2, 0, 1, 'horizontal', 5.0);

    for (let i = 0; i < 200; i++) {
      const dt = Math.min(0.05, computeStableDt(grid, DEFAULT_WATER_CONFIG));
      simulateStep(grid, DEFAULT_WATER_CONFIG, dt);
    }

    // Water should not cross the dam
    expect(grid.depth[3]).toBeCloseTo(0, 2);
    expect(grid.depth[4]).toBeCloseTo(0, 2);
    // Water should pool on the left side
    expect(grid.depth[0] + grid.depth[1]).toBeGreaterThan(0.5);
  });
});

// ─── applyDrainageChannel ────────────────────────────────────

describe('applyDrainageChannel', () => {
  it('lowers terrain along a horizontal line', () => {
    const grid = createWaterGrid(5, 5);
    grid.terrain.fill(2.0);

    applyDrainageChannel(grid, 0, 2, 5, 'horizontal', 0.5);

    for (let x = 0; x < 5; x++) {
      expect(grid.terrain[2 * 5 + x]).toBeCloseTo(1.5);
    }
    // Adjacent rows unchanged
    expect(grid.terrain[1 * 5 + 0]).toBeCloseTo(2.0);
  });

  it('lowers terrain along a vertical line', () => {
    const grid = createWaterGrid(5, 5);
    grid.terrain.fill(3.0);

    applyDrainageChannel(grid, 2, 0, 5, 'vertical', 1.0);

    for (let y = 0; y < 5; y++) {
      expect(grid.terrain[y * 5 + 2]).toBeCloseTo(2.0);
    }
  });

  it('clips to grid bounds', () => {
    const grid = createWaterGrid(3, 3);
    grid.terrain.fill(1.0);

    // Starts in-bounds, extends out
    applyDrainageChannel(grid, 1, 1, 10, 'vertical', 0.5);

    expect(grid.terrain[1 * 3 + 1]).toBeCloseTo(0.5);
    expect(grid.terrain[2 * 3 + 1]).toBeCloseTo(0.5);
    // Only 2 cells modified (y=1,2), y=3+ out of bounds
  });
});

// ─── Constants ───────────────────────────────────────────────

describe('FloodMechanics constants', () => {
  it('threshold is 5cm', () => {
    expect(FLOOD_DAMAGE_THRESHOLD).toBe(0.05);
  });

  it('damage scale is 1.5x', () => {
    expect(DAMAGE_SCALE).toBe(1.5);
  });

  it('max damage is 90%', () => {
    expect(MAX_DAMAGE).toBe(0.9);
  });
});
