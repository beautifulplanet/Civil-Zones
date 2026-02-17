/**
 * Water Renderer — Isometric Water Overlay
 *
 * Renders the shallow water simulation as a translucent overlay
 * on top of the isometric terrain. Uses depth-based coloring
 * and optional flow arrows when zoomed in.
 *
 * Rendering approach:
 *   - Skip dry cells (depth < threshold)
 *   - Alpha scales with depth (deeper = more opaque)
 *   - Blue channel brightens with depth for visual clarity
 *   - Flow arrows show velocity direction at high zoom
 *
 * Coordinate mapping:
 *   Water grid cell (gx, gy) maps to world tile (originX + gx, originY + gy)
 *   using the standard worldToCanvas() isometric projection.
 */

import type { WaterGrid } from '../simulation/types';
import type { CameraState, Size, Point } from '../core/types';
import { worldToCanvas, TILE_HALF_W, TILE_HALF_H } from '../core/math';

// ─── Configuration ───────────────────────────────────────────

export interface WaterRenderConfig {
  /** Minimum depth to render (cells below are "dry") */
  minRenderDepth: number;
  /** Maximum alpha for deepest water */
  maxAlpha: number;
  /** Depth at which alpha reaches maximum */
  depthForMaxAlpha: number;
  /** Minimum zoom level to show flow arrows */
  arrowZoomThreshold: number;
  /** Maximum arrow length in pixels */
  maxArrowLength: number;
  /** Arrow color */
  arrowColor: string;
}

export const DEFAULT_RENDER_CONFIG: WaterRenderConfig = {
  minRenderDepth: 0.01,
  maxAlpha: 0.8,
  depthForMaxAlpha: 0.4,
  arrowZoomThreshold: 1.5,
  maxArrowLength: 12,
  arrowColor: 'rgba(255, 255, 255, 0.6)',
};

// ─── Color Computation ──────────────────────────────────────

/**
 * Compute RGBA color for a water cell based on depth.
 *
 * Shallow water: light, transparent blue
 * Deep water: darker, opaque blue
 */
export function waterColor(depth: number, config: WaterRenderConfig): string {
  const t = Math.min(1, depth / config.depthForMaxAlpha);
  const alpha = t * config.maxAlpha;
  const blue = Math.floor(150 + t * 105); // 150 → 255
  const green = Math.floor(100 - t * 40); // 100 → 60
  return `rgba(30, ${green}, ${blue}, ${alpha.toFixed(3)})`;
}

// ─── Renderer ────────────────────────────────────────────────

export class WaterRenderer {
  private ctx: CanvasRenderingContext2D;
  private config: WaterRenderConfig;

  constructor(
    ctx: CanvasRenderingContext2D,
    config?: Partial<WaterRenderConfig>,
  ) {
    this.ctx = ctx;
    this.config = { ...DEFAULT_RENDER_CONFIG, ...config };
  }

  /**
   * Render water overlay for a simulation grid.
   *
   * @param grid    - WaterGrid with current depth/velocity data
   * @param originX - World X of grid cell (0,0)
   * @param originY - World Y of grid cell (0,0)
   * @param camera  - Current camera state
   * @param viewport - Canvas dimensions
   */
  render(
    grid: WaterGrid,
    originX: number,
    originY: number,
    camera: CameraState,
    viewport: Size,
  ): void {
    const { ctx, config } = this;
    const showArrows = camera.zoom > config.arrowZoomThreshold;

    // Scaled tile dimensions
    const tileHalfW = TILE_HALF_W * camera.zoom;
    const tileHalfH = TILE_HALF_H * camera.zoom;

    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const idx = y * grid.width + x;
        const depth = grid.depth[idx];

        if (depth < config.minRenderDepth) continue;

        // Get screen position for this grid cell
        const pos = worldToCanvas(
          originX + x,
          originY + y,
          camera,
          viewport,
        );

        // Frustum culling — skip cells outside viewport
        if (
          pos.x + tileHalfW < 0 ||
          pos.x - tileHalfW > viewport.width ||
          pos.y + tileHalfH < 0 ||
          pos.y - tileHalfH > viewport.height
        ) {
          continue;
        }

        // Draw isometric diamond
        ctx.fillStyle = waterColor(depth, config);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y - tileHalfH);
        ctx.lineTo(pos.x + tileHalfW, pos.y);
        ctx.lineTo(pos.x, pos.y + tileHalfH);
        ctx.lineTo(pos.x - tileHalfW, pos.y);
        ctx.closePath();
        ctx.fill();

        // Flow arrows when zoomed in
        if (showArrows) {
          this.drawFlowArrow(pos, grid.velX[idx], grid.velY[idx]);
        }
      }
    }
  }

  /**
   * Draw a flow direction arrow at the cell center.
   * Arrow length is proportional to flow speed.
   */
  private drawFlowArrow(pos: Point, vx: number, vy: number): void {
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed < 0.01) return;

    const { ctx, config } = this;
    const len = Math.min(config.maxArrowLength, speed * 20);
    const angle = Math.atan2(vy, vx);

    const endX = pos.x + Math.cos(angle) * len;
    const endY = pos.y + Math.sin(angle) * len;

    // Arrow shaft
    ctx.strokeStyle = config.arrowColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Arrowhead
    const headLen = 3;
    const headAngle = Math.PI / 6;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLen * Math.cos(angle - headAngle),
      endY - headLen * Math.sin(angle - headAngle),
    );
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLen * Math.cos(angle + headAngle),
      endY - headLen * Math.sin(angle + headAngle),
    );
    ctx.stroke();
  }
}
