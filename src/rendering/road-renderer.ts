/**
 * Civil Zones - Road Renderer
 * ═══════════════════════════════════════════════════════════════════════════════
 * Realistic grey path roads with proper connections and pebble details
 * Ported from index.html drawRoad() function
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { CFG } from '../config/game-config.js';

export interface RoadTile {
    road: boolean;
}

export interface RoadNeighbors {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
}

/**
 * Road Renderer - Draws connected road segments with realistic styling
 */
export class RoadRenderer {
    
    /**
     * Draw a road tile with proper connections to neighbors
     */
    drawRoad(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number,
        neighbors: RoadNeighbors
    ): void {
        const tx = x * T;
        const ty = y * T;
        const cx = tx + T / 2;
        const cy = ty + T / 2;
        const lineWidth = Math.max(8, Math.floor(T * 0.26));
        
        const { up, down, left, right } = neighbors;
        
        // Main center stroke (dark grey)
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = lineWidth + 2;
        ctx.beginPath();
        
        if (up) {
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx, ty);
        }
        if (down) {
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx, ty + T);
        }
        if (left) {
            ctx.moveTo(cx, cy);
            ctx.lineTo(tx, cy);
        }
        if (right) {
            ctx.moveTo(cx, cy);
            ctx.lineTo(tx + T, cy);
        }
        
        // Always draw the short center stub so isolated tiles look rounded
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + 0.01, cy + 0.01);
        ctx.stroke();
        
        // Lighter inner strip to suggest compacted dirt
        ctx.strokeStyle = '#7a7a7a';
        ctx.lineWidth = Math.max(4, Math.floor(lineWidth * 0.5));
        ctx.beginPath();
        
        if (up) {
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx, ty);
        }
        if (down) {
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx, ty + T);
        }
        if (left) {
            ctx.moveTo(cx, cy);
            ctx.lineTo(tx, cy);
        }
        if (right) {
            ctx.moveTo(cx, cy);
            ctx.lineTo(tx + T, cy);
        }
        ctx.stroke();
        
        // Subtle edge shading for realism
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        
        if (up) {
            ctx.beginPath();
            ctx.moveTo(cx - lineWidth / 2, cy);
            ctx.lineTo(cx - lineWidth / 2, ty);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx + lineWidth / 2, cy);
            ctx.lineTo(cx + lineWidth / 2, ty);
            ctx.stroke();
        }
        if (down) {
            ctx.beginPath();
            ctx.moveTo(cx - lineWidth / 2, cy);
            ctx.lineTo(cx - lineWidth / 2, ty + T);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx + lineWidth / 2, cy);
            ctx.lineTo(cx + lineWidth / 2, ty + T);
            ctx.stroke();
        }
        if (left) {
            ctx.beginPath();
            ctx.moveTo(cx, cy - lineWidth / 2);
            ctx.lineTo(tx, cy - lineWidth / 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx, cy + lineWidth / 2);
            ctx.lineTo(tx, cy + lineWidth / 2);
            ctx.stroke();
        }
        if (right) {
            ctx.beginPath();
            ctx.moveTo(cx, cy - lineWidth / 2);
            ctx.lineTo(tx + T, cy - lineWidth / 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx, cy + lineWidth / 2);
            ctx.lineTo(tx + T, cy + lineWidth / 2);
            ctx.stroke();
        }
        
        // Deterministic speckles/pebbles along path (seeded by coords)
        this.drawPebbles(ctx, x, y, T, lineWidth, tx, ty, cx, cy, neighbors);
    }
    
    /**
     * Draw pebble/speckle details on the road
     */
    private drawPebbles(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number,
        lineWidth: number,
        tx: number,
        ty: number,
        cx: number,
        cy: number,
        neighbors: RoadNeighbors
    ): void {
        const { up, down, left, right } = neighbors;
        
        // Deterministic seed based on coordinates
        const seed = ((x * 73856093) ^ (y * 19349663)) >>> 0;
        const rand = (n: number): number => Math.abs(Math.sin(seed + n) * 10000) % 1;
        
        ctx.fillStyle = '#666';
        
        for (let i = 0; i < 4; i++) {
            const t = 0.2 + i * 0.2 + rand(i) * 0.1;
            let px = cx + ((left || right) ? (t - 0.5) * T : 0);
            let py = cy + ((up || down) ? (t - 0.5) * T : 0);
            
            // Offset perpendicular to path
            let ox = (rand(i + 10) - 0.5) * lineWidth * 0.6;
            let oy = (rand(i + 20) - 0.5) * lineWidth * 0.6;
            
            if (left || right) {
                py = cy;
                px = tx + t * T;
                oy = (rand(i + 20) - 0.5) * lineWidth * 0.2;
            }
            if (up || down) {
                px = cx;
                py = ty + t * T;
                ox = (rand(i + 10) - 0.5) * lineWidth * 0.2;
            }
            
            ctx.beginPath();
            ctx.ellipse(
                px + ox,
                py + oy,
                Math.max(1, Math.floor(lineWidth * 0.12)),
                Math.max(1, Math.floor(lineWidth * 0.08)),
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }
    
    /**
     * Get road neighbors from tile array
     */
    getNeighbors(
        tiles: { road?: boolean }[][],
        x: number,
        y: number,
        width: number,
        height: number
    ): RoadNeighbors {
        return {
            up: y > 0 && !!tiles[x]?.[y - 1]?.road,
            down: y < height - 1 && !!tiles[x]?.[y + 1]?.road,
            left: x > 0 && !!tiles[x - 1]?.[y]?.road,
            right: x < width - 1 && !!tiles[x + 1]?.[y]?.road
        };
    }
}

// Export singleton instance
export const roadRenderer = new RoadRenderer();
