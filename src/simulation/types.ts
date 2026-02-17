/**
 * Water Simulation Types — Struct-of-Arrays (SoA) layout
 *
 * Implements pipe-based shallow water model (Mei et al., 2007).
 * SoA layout is cache-friendly for tight inner loops and matches
 * GPU compute patterns for potential WebGPU migration.
 *
 * Mathematical basis:
 *   Pipe flux:  f_new = max(0, f_old + dt · A · g · ΔH / L)
 *   Where ΔH = (z_i + h_i) - (z_j + h_j) is hydraulic head difference
 *
 * References:
 *   Mei, X., Decaudin, P., Hu, B. (2007). "Fast Hydraulic Erosion
 *   Simulation and Visualization on GPU." Pacific Graphics.
 */

import { TileType } from '../world/Tile';

// ─── Configuration ───────────────────────────────────────────

export interface WaterConfig {
  /** Gravitational acceleration in m/s² */
  gravity: number;
  /** Cross-section area of virtual pipe (m²) */
  pipeArea: number;
  /** Distance between cell centers (m) */
  pipeLength: number;
  /** Cell size dx = dy in meters */
  cellSize: number;
  /** Manning's roughness coefficients per tile type */
  manningCoefficients: Record<number, number>;
  /** Rainfall rate (m/s) — 0.0001 = 0.1 mm/s moderate rain */
  rainRate: number;
  /** Evaporation rate (m/s) — 0.00001 = 0.01 mm/s */
  evapRate: number;
  /** Minimum depth threshold (m) — cells below this are "dry" */
  dryThreshold: number;
}

/**
 * Manning's roughness coefficients mapped to TileType enum values.
 * Values from standard hydraulic reference tables.
 *
 * | Terrain | n      | Source |
 * |---------|--------|--------|
 * | Grass   | 0.030  | Chow (1959) |
 * | Water   | 0.010  | Open channel |
 * | Sand    | 0.025  | Beach/alluvial |
 * | Stone   | 0.035  | Rock bed |
 * | Forest  | 0.100  | Dense vegetation |
 * | Dirt    | 0.020  | Bare earth |
 */
export const MANNING_COEFFICIENTS: Record<number, number> = {
  [TileType.GRASS]:  0.030,
  [TileType.WATER]:  0.010,
  [TileType.SAND]:   0.025,
  [TileType.STONE]:  0.035,
  [TileType.FOREST]: 0.100,
  [TileType.DIRT]:   0.020,
};

export const DEFAULT_WATER_CONFIG: WaterConfig = {
  gravity: 9.81,
  pipeArea: 1.0,
  pipeLength: 1.0,
  cellSize: 1.0,
  manningCoefficients: { ...MANNING_COEFFICIENTS },
  rainRate: 0.0001,     // 0.1 mm/s = moderate rain
  evapRate: 0.00001,    // 0.01 mm/s
  dryThreshold: 0.001,  // 1mm
};

// ─── Grid ────────────────────────────────────────────────────

/**
 * SoA water simulation grid.
 *
 * All typed arrays are flat 1D, indexed by `y * width + x`.
 * Flux arrays store directional flow through "virtual pipes"
 * connecting each cell to its 4 cardinal neighbors.
 */
export interface WaterGrid {
  width: number;
  height: number;

  // Terrain (read-only after init)
  /** Terrain elevation in meters [w*h] */
  terrain: Float32Array;
  /** Tile type for Manning's coefficient lookup [w*h] */
  terrainType: Uint8Array;

  // Water state (mutated each step)
  /** Water depth in meters [w*h] */
  depth: Float32Array;

  // Flux through 4 pipes per cell (m³/s)
  /** Flow to right neighbor (+x) [w*h] */
  fluxRight: Float32Array;
  /** Flow to left neighbor (-x) [w*h] */
  fluxLeft: Float32Array;
  /** Flow to upper neighbor (-y) [w*h] */
  fluxUp: Float32Array;
  /** Flow to lower neighbor (+y) [w*h] */
  fluxDown: Float32Array;

  // Velocity (computed from flux, for rendering + friction)
  /** x-velocity (m/s) [w*h] */
  velX: Float32Array;
  /** y-velocity (m/s) [w*h] */
  velY: Float32Array;
}

/**
 * Allocate a new zero-initialized WaterGrid.
 * All typed arrays default to zero, representing dry flat terrain.
 */
export function createWaterGrid(width: number, height: number): WaterGrid {
  if (width <= 0 || height <= 0) {
    throw new Error(`Invalid grid dimensions: ${width}x${height}`);
  }
  const n = width * height;
  return {
    width,
    height,
    terrain:     new Float32Array(n),
    terrainType: new Uint8Array(n),
    depth:       new Float32Array(n),
    fluxRight:   new Float32Array(n),
    fluxLeft:    new Float32Array(n),
    fluxUp:      new Float32Array(n),
    fluxDown:    new Float32Array(n),
    velX:        new Float32Array(n),
    velY:        new Float32Array(n),
  };
}

/**
 * Compute total water volume in the grid (sum of depth × cell area).
 * Used for mass conservation validation.
 */
export function totalWaterVolume(grid: WaterGrid, cellSize: number = 1.0): number {
  const cellArea = cellSize * cellSize;
  let total = 0;
  for (let i = 0; i < grid.depth.length; i++) {
    total += grid.depth[i];
  }
  return total * cellArea;
}

/**
 * Find the maximum water depth in the grid.
 */
export function maxWaterDepth(grid: WaterGrid): number {
  let max = 0;
  for (let i = 0; i < grid.depth.length; i++) {
    if (grid.depth[i] > max) max = grid.depth[i];
  }
  return max;
}

/**
 * Get the 1D index for grid coordinates.
 * Returns -1 if out of bounds.
 */
export function gridIndex(grid: WaterGrid, x: number, y: number): number {
  if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) return -1;
  return y * grid.width + x;
}
