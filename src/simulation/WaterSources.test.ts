import { describe, it, expect } from 'vitest';
import {
  createWeatherState,
  seasonFromTurn,
  rollRainfall,
  applyPointSources,
  applyWeather,
  createSpring,
  createRiverInlet,
  SEASONAL_EVAP,
  SEASONAL_RAIN_CHANCE,
} from '../simulation/WaterSources';
import { createWaterGrid, DEFAULT_WATER_CONFIG } from '../simulation/types';

/** Sum all depths in grid */
function totalDepth(grid: ReturnType<typeof createWaterGrid>): number {
  let sum = 0;
  for (let i = 0; i < grid.depth.length; i++) sum += grid.depth[i];
  return sum;
}

// ─── Weather State ───────────────────────────────────────────

describe('createWeatherState', () => {
  it('returns dry defaults', () => {
    const w = createWeatherState();
    expect(w.isRaining).toBe(false);
    expect(w.rainIntensity).toBe(1.0);
    expect(w.evapIntensity).toBe(1.0);
  });
});

// ─── Seasons ─────────────────────────────────────────────────

describe('seasonFromTurn', () => {
  it('maps turns 1-4 to seasons 0-3', () => {
    expect(seasonFromTurn(1)).toBe(0); // spring
    expect(seasonFromTurn(2)).toBe(1); // summer
    expect(seasonFromTurn(3)).toBe(2); // fall
    expect(seasonFromTurn(4)).toBe(3); // winter
  });

  it('wraps around after 4 turns', () => {
    expect(seasonFromTurn(5)).toBe(0);
    expect(seasonFromTurn(8)).toBe(3);
    expect(seasonFromTurn(12)).toBe(3);
    expect(seasonFromTurn(13)).toBe(0);
  });

  it('handles turn 0 and negatives gracefully', () => {
    // Turn 0 wraps to season 3 (winter)
    expect(seasonFromTurn(0)).toBe(3);
  });
});

// ─── Rain Roll ───────────────────────────────────────────────

describe('rollRainfall', () => {
  it('rains when random < chance', () => {
    // Fall has 0.5 chance
    expect(rollRainfall(2, 0.3)).toBe(true);
  });

  it('does not rain when random >= chance', () => {
    // Summer has 0.2 chance
    expect(rollRainfall(1, 0.5)).toBe(false);
  });

  it('edge case: random exactly at threshold', () => {
    // Spring has 0.4 chance; 0.4 >= 0.4 → no rain
    expect(rollRainfall(0, 0.4)).toBe(false);
  });

  it('fall has highest rain chance', () => {
    // Fall (index 2) = 0.5, highest in SEASONAL_RAIN_CHANCE
    const maxChance = Math.max(...SEASONAL_RAIN_CHANCE);
    expect(SEASONAL_RAIN_CHANCE[2]).toBe(maxChance);
  });
});

// ─── Seasonal Constants ──────────────────────────────────────

describe('SEASONAL_EVAP', () => {
  it('has 4 entries', () => {
    expect(SEASONAL_EVAP).toHaveLength(4);
  });

  it('summer has highest evaporation', () => {
    expect(SEASONAL_EVAP[1]).toBe(1.5);
  });

  it('winter has lowest evaporation', () => {
    expect(SEASONAL_EVAP[3]).toBe(0.3);
  });
});

// ─── Point Sources ───────────────────────────────────────────

describe('applyPointSources', () => {
  it('adds water from active sources', () => {
    const grid = createWaterGrid(5, 5);
    const spring = createSpring(2, 2, 0.5);

    applyPointSources(grid, [spring], 1.0);

    expect(grid.depth[2 * 5 + 2]).toBe(0.5);
  });

  it('skips inactive sources', () => {
    const grid = createWaterGrid(5, 5);
    const spring = createSpring(2, 2, 0.5);
    spring.active = false;

    applyPointSources(grid, [spring], 1.0);

    expect(totalDepth(grid)).toBe(0);
  });

  it('handles multiple sources', () => {
    const grid = createWaterGrid(5, 5);
    const s1 = createSpring(0, 0, 0.1);
    const s2 = createRiverInlet(4, 4, 0.5);

    applyPointSources(grid, [s1, s2], 1.0);

    expect(grid.depth[0]).toBeCloseTo(0.1, 6);
    expect(grid.depth[4 * 5 + 4]).toBeCloseTo(0.5, 6);
  });

  it('scales volume by dt', () => {
    const grid = createWaterGrid(5, 5);
    const spring = createSpring(1, 1, 1.0);

    applyPointSources(grid, [spring], 0.5); // half second

    expect(grid.depth[1 * 5 + 1]).toBeCloseTo(0.5, 6);
  });
});

// ─── Weather Application ─────────────────────────────────────

describe('applyWeather', () => {
  it('adds rain when raining', () => {
    const grid = createWaterGrid(5, 5);
    const weather = createWeatherState();
    weather.isRaining = true;

    applyWeather(grid, DEFAULT_WATER_CONFIG, weather, 1.0);

    // Rain adds, evap subtracts from that; net should be positive
    const total = totalDepth(grid);
    expect(total).toBeGreaterThan(0);
  });

  it('only evaporates when not raining', () => {
    const grid = createWaterGrid(3, 3);
    grid.depth.fill(1.0);
    const weather = createWeatherState();
    weather.isRaining = false;

    const before = totalDepth(grid);
    applyWeather(grid, DEFAULT_WATER_CONFIG, weather, 1.0);

    expect(totalDepth(grid)).toBeLessThan(before);
  });

  it('respects rain intensity multiplier', () => {
    const grid1 = createWaterGrid(3, 3);
    const grid2 = createWaterGrid(3, 3);

    const w1 = createWeatherState();
    w1.isRaining = true;
    w1.rainIntensity = 1.0;

    const w2 = createWeatherState();
    w2.isRaining = true;
    w2.rainIntensity = 3.0;

    applyWeather(grid1, DEFAULT_WATER_CONFIG, w1, 1.0);
    applyWeather(grid2, DEFAULT_WATER_CONFIG, w2, 1.0);

    // Higher intensity → more water
    expect(totalDepth(grid2)).toBeGreaterThan(totalDepth(grid1));
  });

  it('respects evaporation intensity multiplier', () => {
    const grid1 = createWaterGrid(3, 3);
    grid1.depth.fill(1.0);
    const grid2 = createWaterGrid(3, 3);
    grid2.depth.fill(1.0);

    const w1 = createWeatherState();
    w1.evapIntensity = 1.0;

    const w2 = createWeatherState();
    w2.evapIntensity = 3.0;

    applyWeather(grid1, DEFAULT_WATER_CONFIG, w1, 1.0);
    applyWeather(grid2, DEFAULT_WATER_CONFIG, w2, 1.0);

    // Higher evap → less water remaining
    expect(totalDepth(grid2)).toBeLessThan(totalDepth(grid1));
  });
});

// ─── Source Factories ────────────────────────────────────────

describe('createSpring', () => {
  it('creates an active spring with default flow rate', () => {
    const s = createSpring(3, 4);
    expect(s.x).toBe(3);
    expect(s.y).toBe(4);
    expect(s.flowRate).toBe(0.01);
    expect(s.active).toBe(true);
    expect(s.label).toBe('Spring');
  });

  it('accepts custom flow rate', () => {
    const s = createSpring(0, 0, 0.5);
    expect(s.flowRate).toBe(0.5);
  });
});

describe('createRiverInlet', () => {
  it('creates a river inlet with higher default flow', () => {
    const r = createRiverInlet(1, 2);
    expect(r.flowRate).toBe(0.1);
    expect(r.label).toBe('River Inlet');
  });
});
