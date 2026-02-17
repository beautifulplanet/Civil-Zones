/**
 * Flood Mechanics — Game Integration
 *
 * Connects the pipe-based shallow water simulation to Civil Zones
 * game mechanics: building damage from flooding, dam/levee terrain
 * modification, and drainage channel effects.
 *
 * Damage model:
 *   efficiency_loss = min(0.9, depth × 1.5)
 *   → 5cm water = 7.5% loss, 30cm = 45% loss, 60cm+ = 90% (capped)
 *
 * Dam model:
 *   Raises terrain elevation along a line of tiles,
 *   physically blocking water flow in the pipe solver.
 */

import type { Building } from '../world/Building';
import type { WaterGrid } from './types';

// ─── Flood Damage ────────────────────────────────────────────

/** Minimum water depth (m) to cause building damage */
export const FLOOD_DAMAGE_THRESHOLD = 0.05;

/** Damage multiplier: damage = min(MAX_DAMAGE, depth × DAMAGE_SCALE) */
export const DAMAGE_SCALE = 1.5;

/** Maximum efficiency loss (90%) — buildings never fully destroyed by water */
export const MAX_DAMAGE = 0.9;

/**
 * Damage result for a single building.
 */
export interface FloodDamageResult {
  /** Building instance ID */
  buildingId: string;
  /** Water depth at building location (m) */
  waterDepth: number;
  /** Efficiency loss: 0 = no damage, 0.9 = max damage */
  damage: number;
}

/**
 * Assess flood damage for all buildings on the water grid.
 *
 * Each building's world position is mapped to the grid coordinate
 * system using gridOriginX/Y. Buildings outside the grid are skipped.
 *
 * @param buildings    - Array of placed buildings
 * @param waterGrid    - Current water simulation state
 * @param gridOriginX  - World X of grid cell (0,0)
 * @param gridOriginY  - World Y of grid cell (0,0)
 * @returns Array of damage results (only buildings with damage > 0)
 */
export function assessFloodDamage(
  buildings: Building[],
  waterGrid: WaterGrid,
  gridOriginX: number,
  gridOriginY: number,
): FloodDamageResult[] {
  const results: FloodDamageResult[] = [];

  for (const b of buildings) {
    const gx = b.x - gridOriginX;
    const gy = b.y - gridOriginY;

    // Skip buildings outside the water grid
    if (gx < 0 || gx >= waterGrid.width || gy < 0 || gy >= waterGrid.height) continue;

    const idx = gy * waterGrid.width + gx;
    const depth = waterGrid.depth[idx];

    if (depth > FLOOD_DAMAGE_THRESHOLD) {
      const damage = Math.min(MAX_DAMAGE, depth * DAMAGE_SCALE);
      results.push({
        buildingId: b.id,
        waterDepth: depth,
        damage,
      });
    }
  }

  return results;
}

/**
 * Apply flood damage to building efficiency values.
 * Reduces efficiency by the damage amount (floor at 0.1 = 10%).
 *
 * @param buildings - Buildings to modify (mutated in place)
 * @param damages   - Damage results from assessFloodDamage
 */
export function applyFloodDamage(
  buildings: Building[],
  damages: FloodDamageResult[],
): void {
  const damageMap = new Map(damages.map(d => [d.buildingId, d.damage]));

  for (const b of buildings) {
    const dmg = damageMap.get(b.id);
    if (dmg !== undefined) {
      b.efficiency = Math.max(0.1, b.efficiency - dmg);
    }
  }
}

// ─── Dam / Levee ─────────────────────────────────────────────

/**
 * Raise terrain elevation along a line of tiles to model a dam or levee.
 * The pipe solver will naturally route water around raised terrain.
 *
 * @param waterGrid   - Grid to modify (terrain mutated in place)
 * @param startX      - Grid X of dam start
 * @param startY      - Grid Y of dam start
 * @param length      - Number of tiles
 * @param direction   - 'horizontal' (along X) or 'vertical' (along Y)
 * @param heightRaise - How much to raise terrain (m)
 */
export function applyDamToTerrain(
  waterGrid: WaterGrid,
  startX: number,
  startY: number,
  length: number,
  direction: 'horizontal' | 'vertical',
  heightRaise: number,
): void {
  for (let i = 0; i < length; i++) {
    const x = direction === 'horizontal' ? startX + i : startX;
    const y = direction === 'vertical' ? startY + i : startY;

    if (x >= 0 && x < waterGrid.width && y >= 0 && y < waterGrid.height) {
      const idx = y * waterGrid.width + x;
      waterGrid.terrain[idx] += heightRaise;
    }
  }
}

// ─── Drainage ────────────────────────────────────────────────

/**
 * Lower terrain elevation to model a drainage channel.
 * Lower terrain attracts water flow via hydraulic head difference.
 *
 * @param waterGrid    - Grid to modify
 * @param startX       - Grid X start
 * @param startY       - Grid Y start
 * @param length       - Number of tiles
 * @param direction    - Direction of channel
 * @param depthLower   - How much to lower terrain (m, positive value)
 */
export function applyDrainageChannel(
  waterGrid: WaterGrid,
  startX: number,
  startY: number,
  length: number,
  direction: 'horizontal' | 'vertical',
  depthLower: number,
): void {
  for (let i = 0; i < length; i++) {
    const x = direction === 'horizontal' ? startX + i : startX;
    const y = direction === 'vertical' ? startY + i : startY;

    if (x >= 0 && x < waterGrid.width && y >= 0 && y < waterGrid.height) {
      const idx = y * waterGrid.width + x;
      waterGrid.terrain[idx] -= depthLower;
    }
  }
}
