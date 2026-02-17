/**
 * Pipe-Based Shallow Water Solver
 *
 * Implements the pipe model from Mei et al. (2007) for real-time
 * shallow water simulation on a uniform Cartesian grid.
 *
 * Algorithm (per timestep):
 *   Phase 1 — Update flux through 4 pipes per cell based on hydraulic head
 *   Phase 2 — Scale flux to prevent negative water depth
 *   Phase 3 — Update water depth from net flux (continuity equation)
 *   Phase 4 — Compute velocity field from flux (for rendering + friction)
 *   Phase 5 — Apply Manning's friction to flux
 *
 * Stability:
 *   CFL condition: dt ≤ dx / (2·√(g·h_max))
 *   Flux scaling prevents negative depth (unconditionally stable with scaling)
 *
 * References:
 *   Mei, X., Decaudin, P., Hu, B. (2007). "Fast Hydraulic Erosion
 *   Simulation and Visualization on GPU." Pacific Graphics.
 *   Manning, R. (1891). "On the flow of water in open channels and pipes."
 */

import type { WaterGrid, WaterConfig } from './types';

// ─── Core Solver ─────────────────────────────────────────────

/**
 * Advance the shallow water simulation by one timestep.
 *
 * Uses the pipe model: each cell has 4 virtual pipes to its
 * cardinal neighbors. Flux through pipes is driven by hydraulic
 * head difference (terrain elevation + water depth).
 *
 * @param grid   - Mutable WaterGrid (modified in place)
 * @param config - Simulation constants
 * @param dt     - Timestep in seconds (should satisfy CFL condition)
 */
export function simulateStep(grid: WaterGrid, config: WaterConfig, dt: number): void {
  const { width: w, height: h } = grid;
  const { gravity: g, pipeArea: A, pipeLength: L, cellSize: dx } = config;
  const cellArea = dx * dx;
  const gAdt_L = dt * A * g / L; // precomputed constant

  // ── Phase 1 + 2: Update flux and scale to prevent negative depth ──

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const totalHead = grid.terrain[idx] + grid.depth[idx];

      // Right neighbor (+x)
      if (x < w - 1) {
        const nIdx = idx + 1;
        const dH = totalHead - (grid.terrain[nIdx] + grid.depth[nIdx]);
        grid.fluxRight[idx] = Math.max(0, grid.fluxRight[idx] + gAdt_L * dH);
      } else {
        grid.fluxRight[idx] = 0; // closed boundary
      }

      // Left neighbor (-x)
      if (x > 0) {
        const nIdx = idx - 1;
        const dH = totalHead - (grid.terrain[nIdx] + grid.depth[nIdx]);
        grid.fluxLeft[idx] = Math.max(0, grid.fluxLeft[idx] + gAdt_L * dH);
      } else {
        grid.fluxLeft[idx] = 0;
      }

      // Down neighbor (+y)
      if (y < h - 1) {
        const nIdx = idx + w;
        const dH = totalHead - (grid.terrain[nIdx] + grid.depth[nIdx]);
        grid.fluxDown[idx] = Math.max(0, grid.fluxDown[idx] + gAdt_L * dH);
      } else {
        grid.fluxDown[idx] = 0;
      }

      // Up neighbor (-y)
      if (y > 0) {
        const nIdx = idx - w;
        const dH = totalHead - (grid.terrain[nIdx] + grid.depth[nIdx]);
        grid.fluxUp[idx] = Math.max(0, grid.fluxUp[idx] + gAdt_L * dH);
      } else {
        grid.fluxUp[idx] = 0;
      }

      // Phase 2: Scale outflow to prevent removing more water than exists
      const totalOut = grid.fluxRight[idx] + grid.fluxLeft[idx]
                     + grid.fluxDown[idx] + grid.fluxUp[idx];

      if (totalOut > 0) {
        const maxOut = grid.depth[idx] * cellArea / dt;
        if (totalOut > maxOut) {
          const scale = maxOut / totalOut;
          grid.fluxRight[idx] *= scale;
          grid.fluxLeft[idx]  *= scale;
          grid.fluxDown[idx]  *= scale;
          grid.fluxUp[idx]    *= scale;
        }
      }
    }
  }

  // ── Phase 3: Update water depth from net flux (continuity) ──

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;

      // Inflow from neighbors' pipes pointing toward this cell
      let inflow = 0;
      if (x > 0)     inflow += grid.fluxRight[idx - 1];   // left neighbor's right pipe
      if (x < w - 1) inflow += grid.fluxLeft[idx + 1];    // right neighbor's left pipe
      if (y > 0)     inflow += grid.fluxDown[idx - w];     // upper neighbor's down pipe
      if (y < h - 1) inflow += grid.fluxUp[idx + w];       // lower neighbor's up pipe

      const outflow = grid.fluxRight[idx] + grid.fluxLeft[idx]
                    + grid.fluxDown[idx] + grid.fluxUp[idx];

      grid.depth[idx] += dt * (inflow - outflow) / cellArea;
      grid.depth[idx] = Math.max(0, grid.depth[idx]); // safety clamp
    }
  }

  // ── Phase 4: Compute velocity from flux ──

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;

      if (grid.depth[idx] < config.dryThreshold) {
        grid.velX[idx] = 0;
        grid.velY[idx] = 0;
        continue;
      }

      const d = grid.depth[idx];
      grid.velX[idx] = (grid.fluxRight[idx] - grid.fluxLeft[idx]) / (d * dx);
      grid.velY[idx] = (grid.fluxDown[idx] - grid.fluxUp[idx]) / (d * dx);
    }
  }
}

// ─── Friction ────────────────────────────────────────────────

/**
 * Apply Manning's friction to flux arrays (damping).
 *
 * Manning's equation for friction slope:
 *   S_f = n² · v · |v| / R_h^(4/3)
 *
 * For wide shallow flow, R_h ≈ h (hydraulic radius ≈ depth).
 * We apply friction as a multiplicative decay to each flux pipe.
 *
 * @param grid   - WaterGrid with velocity already computed
 * @param config - Has manningCoefficients per terrain type
 * @param dt     - Timestep for friction integration
 */
export function applyFriction(grid: WaterGrid, config: WaterConfig, dt: number): void {
  const { width: w, height: h } = grid;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const depth = grid.depth[idx];

      if (depth < config.dryThreshold) continue;

      const n = config.manningCoefficients[grid.terrainType[idx]] ?? 0.03;
      const speed = Math.sqrt(grid.velX[idx] ** 2 + grid.velY[idx] ** 2);

      if (speed < 1e-8) continue;

      // R_h ≈ depth for wide channel
      const rh = depth;
      // Friction factor: dimensionless decay per timestep
      // S_f = n² · speed / R_h^(4/3)
      // friction_decay = 1 / (1 + g · n² · speed · dt / R_h^(4/3))
      const frictionFactor = 1.0 / (1.0 + config.gravity * n * n * speed * dt / Math.pow(rh, 4.0 / 3.0));

      grid.fluxRight[idx] *= frictionFactor;
      grid.fluxLeft[idx]  *= frictionFactor;
      grid.fluxDown[idx]  *= frictionFactor;
      grid.fluxUp[idx]    *= frictionFactor;
    }
  }
}

// ─── Water Sources ───────────────────────────────────────────

/**
 * Add rainfall uniformly across the grid.
 *
 * @param grid - WaterGrid (depth modified in place)
 * @param rate - Rainfall rate in m/s (overrides config if provided)
 * @param dt   - Timestep in seconds
 */
export function addRainfall(grid: WaterGrid, rate: number, dt: number): void {
  const increment = rate * dt;
  for (let i = 0; i < grid.depth.length; i++) {
    grid.depth[i] += increment;
  }
}

/**
 * Apply evaporation across the grid (only from wet cells).
 *
 * @param grid - WaterGrid (depth modified in place)
 * @param rate - Evaporation rate in m/s
 * @param dt   - Timestep in seconds
 */
export function applyEvaporation(grid: WaterGrid, rate: number, dt: number): void {
  const decrement = rate * dt;
  for (let i = 0; i < grid.depth.length; i++) {
    if (grid.depth[i] > 0) {
      grid.depth[i] = Math.max(0, grid.depth[i] - decrement);
    }
  }
}

/**
 * Add a point water source (spring, river inlet, etc.).
 *
 * @param grid   - WaterGrid
 * @param x, y   - Grid coordinates
 * @param volume - Volume to add in m³
 * @param cellSize - Cell size for volume → depth conversion
 */
export function addPointSource(
  grid: WaterGrid,
  x: number,
  y: number,
  volume: number,
  cellSize: number = 1.0,
): void {
  if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) return;
  const idx = y * grid.width + x;
  grid.depth[idx] += volume / (cellSize * cellSize);
}

// ─── Stability ───────────────────────────────────────────────

/**
 * Compute the maximum stable timestep using the CFL condition.
 *
 *   dt ≤ dx / (2 · √(g · h_max))
 *
 * Returns a safe timestep with a small safety factor (0.9).
 * If no water exists, returns a default large dt.
 *
 * @param grid   - WaterGrid to analyze
 * @param config - Simulation config (gravity, cellSize)
 * @returns Maximum stable dt in seconds
 */
export function computeStableDt(grid: WaterGrid, config: WaterConfig): number {
  let maxDepth = 0;
  for (let i = 0; i < grid.depth.length; i++) {
    if (grid.depth[i] > maxDepth) maxDepth = grid.depth[i];
  }

  if (maxDepth < config.dryThreshold) return 0.1; // no water → safe large dt

  // CFL: dt ≤ dx / (2·√(g·h_max)), with 0.9 safety factor
  const cfl = config.cellSize / (2 * Math.sqrt(config.gravity * maxDepth));
  return 0.9 * cfl;
}

// ─── Full Simulation Step (with friction + sources) ──────────

/**
 * Run a complete simulation step: sources, pipe solver, friction.
 * This is the high-level function used by the game loop.
 *
 * @param grid    - WaterGrid
 * @param config  - WaterConfig
 * @param dt      - Timestep
 * @param raining - Whether rainfall is active this step
 */
export function fullStep(
  grid: WaterGrid,
  config: WaterConfig,
  dt: number,
  raining: boolean = false,
): void {
  // 1. Add sources
  if (raining) {
    addRainfall(grid, config.rainRate, dt);
  }

  // 2. Core pipe model solve
  simulateStep(grid, config, dt);

  // 3. Apply friction
  applyFriction(grid, config, dt);

  // 4. Evaporation
  applyEvaporation(grid, config.evapRate, dt);
}
