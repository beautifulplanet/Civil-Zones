/**
 * Water Sources — Rain, Evaporation, Springs, Rivers
 *
 * Manages water input/output for the simulation grid.
 * Supports spatial rainfall patterns, seasonal variation,
 * and persistent water sources like springs or river inlets.
 *
 * This module wraps the low-level addRainfall/applyEvaporation
 * functions from ShallowWater.ts with higher-level game concepts.
 */

import type { WaterGrid, WaterConfig } from './types';
import { addRainfall, applyEvaporation, addPointSource } from './ShallowWater';

// ─── Types ───────────────────────────────────────────────────

export interface WaterSource {
  /** Grid X position */
  x: number;
  /** Grid Y position */
  y: number;
  /** Flow rate in m³/s */
  flowRate: number;
  /** Whether this source is currently active */
  active: boolean;
  /** Optional label for UI */
  label?: string;
}

export interface WeatherState {
  /** Whether it's currently raining */
  isRaining: boolean;
  /** Rain intensity multiplier (1.0 = config default) */
  rainIntensity: number;
  /** Evaporation multiplier (1.0 = config default), higher in summer */
  evapIntensity: number;
}

/** Seasonal evaporation multipliers (index 0-3 = spring, summer, fall, winter) */
export const SEASONAL_EVAP: readonly number[] = [1.0, 1.5, 0.8, 0.3];

/** Seasonal rain probability (index 0-3) */
export const SEASONAL_RAIN_CHANCE: readonly number[] = [0.4, 0.2, 0.5, 0.3];

// ─── Weather ─────────────────────────────────────────────────

/**
 * Create default (dry, no rain) weather state.
 */
export function createWeatherState(): WeatherState {
  return {
    isRaining: false,
    rainIntensity: 1.0,
    evapIntensity: 1.0,
  };
}

/**
 * Get the season index (0-3) from the game year turn.
 * Each year has 4 seasons. Turn 1 = spring, etc.
 */
export function seasonFromTurn(turn: number): number {
  return ((turn - 1) % 4 + 4) % 4; // 0-3, handles negatives
}

/**
 * Roll whether it rains this turn based on season.
 *
 * @param season - 0=spring, 1=summer, 2=fall, 3=winter
 * @param random - Random value [0,1) for deterministic testing
 * @returns Whether rain should occur
 */
export function rollRainfall(season: number, random: number): boolean {
  const chance = SEASONAL_RAIN_CHANCE[season] ?? 0.3;
  return random < chance;
}

// ─── Source Management ──────────────────────────────────────

/**
 * Apply all active point sources to the grid for one timestep.
 *
 * @param grid    - WaterGrid
 * @param sources - Array of water sources (springs, rivers)
 * @param dt      - Timestep in seconds
 * @param cellSize - Grid cell size for volume conversion
 */
export function applyPointSources(
  grid: WaterGrid,
  sources: readonly WaterSource[],
  dt: number,
  cellSize: number = 1.0,
): void {
  for (const src of sources) {
    if (!src.active) continue;
    const volume = src.flowRate * dt;
    addPointSource(grid, src.x, src.y, volume, cellSize);
  }
}

/**
 * Apply weather-driven rainfall and evaporation for one timestep.
 *
 * @param grid    - WaterGrid
 * @param config  - WaterConfig (base rates)
 * @param weather - Current weather state
 * @param dt      - Timestep in seconds
 */
export function applyWeather(
  grid: WaterGrid,
  config: WaterConfig,
  weather: WeatherState,
  dt: number,
): void {
  if (weather.isRaining) {
    addRainfall(grid, config.rainRate * weather.rainIntensity, dt);
  }
  applyEvaporation(grid, config.evapRate * weather.evapIntensity, dt);
}

/**
 * Create a spring water source at the given position.
 */
export function createSpring(x: number, y: number, flowRate: number = 0.01): WaterSource {
  return { x, y, flowRate, active: true, label: 'Spring' };
}

/**
 * Create a river inlet source.
 * Rivers have higher flow rate than springs.
 */
export function createRiverInlet(x: number, y: number, flowRate: number = 0.1): WaterSource {
  return { x, y, flowRate, active: true, label: 'River Inlet' };
}
