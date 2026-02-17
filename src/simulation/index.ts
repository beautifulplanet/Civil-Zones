/**
 * Water Simulation — Barrel Exports
 *
 * Public API for the pipe-based shallow water simulation.
 */

// Types & grid factory
export type { WaterGrid, WaterConfig } from './types';
export {
  createWaterGrid,
  totalWaterVolume,
  maxWaterDepth,
  gridIndex,
  DEFAULT_WATER_CONFIG,
  MANNING_COEFFICIENTS,
} from './types';

// Core solver
export {
  simulateStep,
  computeStableDt,
  fullStep,
  addRainfall,
  applyEvaporation,
  addPointSource,
  applyFriction,
} from './ShallowWater';

// Flood mechanics
export {
  assessFloodDamage,
  applyFloodDamage,
  applyDamToTerrain,
  applyDrainageChannel,
  FLOOD_DAMAGE_THRESHOLD,
  DAMAGE_SCALE,
  MAX_DAMAGE,
} from './FloodMechanics';
export type { FloodDamageResult } from './FloodMechanics';

// Water sources & weather
export type { WaterSource, WeatherState } from './WaterSources';
export {
  createWeatherState,
  seasonFromTurn,
  rollRainfall,
  applyPointSources,
  applyWeather,
  createSpring,
  createRiverInlet,
  SEASONAL_EVAP,
  SEASONAL_RAIN_CHANCE,
} from './WaterSources';
