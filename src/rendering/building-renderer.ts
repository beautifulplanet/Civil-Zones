/**
 * Civil Zones - Building Renderer
 * ═══════════════════════════════════════════════════════════════════════════════
 * Renders various building types in Victorian map / RollerCoaster Tycoon style
 * Includes isometric projection helpers and detailed primitives
 * Ported from index.html building drawing sections
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { CFG } from '../config/game-config.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface BuildingRenderData {
    t: string;           // Building type (RES, COM, IND, WELL, etc.)
    x: number;
    y: number;
    lvl: number;         // Level (1-5 typically)
    variant?: number;    // Visual variant (0-3)
    pop?: number;        // Population count
    workers?: number;
    efficiency?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VICTORIAN COLOR PALETTE
// ═══════════════════════════════════════════════════════════════════════════════

const VIC = {
    PARCHMENT: '#E8DCC8',
    PARCHMENT_DARK: '#D4C4A8',
    INK: '#3A3020',
    SEPIA: '#704020',
    EARTH_LIGHT: '#C4A882',
    EARTH_MED: '#A89070',
    EARTH_DARK: '#8B7355',
    WOOD_LIGHT: '#A67B5B',
    WOOD_MED: '#8B6914',
    WOOD_DARK: '#6D4C41',
    STONE_LIGHT: '#9A9A8A',
    STONE_MED: '#7A7A6A',
    STONE_DARK: '#5A5A4A',
    FIRE_HOT: '#D4652F',
    FIRE_WARM: '#D4A03D',
    FIRE_EMBER: '#8B3020',
    PELT_LIGHT: '#B8956E',
    PELT_MED: '#A67B5B',
    PELT_DARK: '#5C4033',
    ABANDONED: '#6A6A5A',
    // Water colors
    WATER_LIGHT: '#8AC4D0',
    WATER_MED: '#6BA4B0',
    WATER_DARK: '#4B8490'
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// BUILDING RENDERER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class BuildingRenderer {
    private time: number = 0;
    
    /**
     * Update animation time - clamp to prevent overflow
     */
    update(deltaTime: number): void {
        this.time += deltaTime;
        // Wrap time to prevent floating point issues
        if (this.time > 10000) {
            this.time = this.time % 10000;
        }
    }
    
    /**
     * Get isometric X coordinate
     */
    private isoX(cx: number, px: number, py: number): number {
        return cx + (px - py) * 0.5;
    }
    
    /**
     * Get isometric Y coordinate with height
     */
    private isoY(cy: number, px: number, py: number, pz: number): number {
        return cy + (px + py) * 0.25 - pz * 0.5;
    }
    
    /**
     * Draw an isometric box (RCT style)
     */
    private drawIsoBox(
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        bx: number,
        by: number,
        bz: number,
        w: number,
        d: number,
        h: number,
        topColor: string,
        leftColor: string,
        rightColor: string
    ): void {
        // Top face
        ctx.fillStyle = topColor;
        ctx.beginPath();
        ctx.moveTo(this.isoX(cx, bx, by), this.isoY(cy, bx, by, bz + h));
        ctx.lineTo(this.isoX(cx, bx + w, by), this.isoY(cy, bx + w, by, bz + h));
        ctx.lineTo(this.isoX(cx, bx + w, by + d), this.isoY(cy, bx + w, by + d, bz + h));
        ctx.lineTo(this.isoX(cx, bx, by + d), this.isoY(cy, bx, by + d, bz + h));
        ctx.closePath();
        ctx.fill();
        
        // Left face (darker)
        ctx.fillStyle = leftColor;
        ctx.beginPath();
        ctx.moveTo(this.isoX(cx, bx, by), this.isoY(cy, bx, by, bz + h));
        ctx.lineTo(this.isoX(cx, bx, by + d), this.isoY(cy, bx, by + d, bz + h));
        ctx.lineTo(this.isoX(cx, bx, by + d), this.isoY(cy, bx, by + d, bz));
        ctx.lineTo(this.isoX(cx, bx, by), this.isoY(cy, bx, by, bz));
        ctx.closePath();
        ctx.fill();
        
        // Right face (medium)
        ctx.fillStyle = rightColor;
        ctx.beginPath();
        ctx.moveTo(this.isoX(cx, bx, by + d), this.isoY(cy, bx, by + d, bz + h));
        ctx.lineTo(this.isoX(cx, bx + w, by + d), this.isoY(cy, bx + w, by + d, bz + h));
        ctx.lineTo(this.isoX(cx, bx + w, by + d), this.isoY(cy, bx + w, by + d, bz));
        ctx.lineTo(this.isoX(cx, bx, by + d), this.isoY(cy, bx, by + d, bz));
        ctx.closePath();
        ctx.fill();
    }
    
    /**
     * Draw ground shadow ellipse
     */
    private drawGroundShadow(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number
    ): void {
        ctx.fillStyle = 'rgba(58,48,32,0.2)';
        ctx.beginPath();
        ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Draw animated fire
     */
    private drawFire(
        ctx: CanvasRenderingContext2D,
        fx: number,
        fy: number,
        size: number,
        intensity: number
    ): void {
        const flicker = Math.sin(this.time * 4) * size * 0.08;
        
        // Base glow
        ctx.fillStyle = VIC.FIRE_HOT;
        ctx.beginPath();
        ctx.ellipse(fx, fy + size * 0.15, size * 0.8, size * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Main flame
        ctx.beginPath();
        ctx.moveTo(fx - size * 0.6, fy + size * 0.2);
        ctx.quadraticCurveTo(fx - size * 0.3, fy - size * 0.8 + flicker, fx, fy - size * 0.4);
        ctx.quadraticCurveTo(fx + size * 0.3, fy - size - flicker, fx + size * 0.6, fy + size * 0.2);
        ctx.closePath();
        ctx.fill();
        
        // Inner flame
        ctx.fillStyle = VIC.FIRE_WARM;
        ctx.beginPath();
        ctx.moveTo(fx - size * 0.3, fy + size * 0.1);
        ctx.quadraticCurveTo(fx, fy - size * 0.5 + flicker, fx + size * 0.3, fy + size * 0.1);
        ctx.closePath();
        ctx.fill();
        
        // Hot core (high intensity)
        if (intensity >= 3) {
            ctx.fillStyle = VIC.PARCHMENT;
            ctx.beginPath();
            ctx.ellipse(fx, fy - size * 0.1, size * 0.2, size * 0.12, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    /**
     * Draw rough stone
     */
    private drawStone(
        ctx: CanvasRenderingContext2D,
        sx: number,
        sy: number,
        size: number,
        angle: number,
        isAbandoned: boolean
    ): void {
        // Shadow
        ctx.fillStyle = 'rgba(58,48,32,0.3)';
        ctx.beginPath();
        ctx.ellipse(sx + 1, sy + 2, size, size * 0.6, angle, 0, Math.PI * 2);
        ctx.fill();
        
        // Stone body
        ctx.fillStyle = isAbandoned ? VIC.STONE_DARK : VIC.STONE_MED;
        ctx.beginPath();
        ctx.ellipse(sx, sy, size * 1.1, size * 0.65, angle, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = isAbandoned ? VIC.STONE_MED : VIC.STONE_LIGHT;
        ctx.beginPath();
        ctx.ellipse(sx - size * 0.2, sy - size * 0.2, size * 0.4, size * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // COMMERCIAL BUILDINGS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Draw commercial building (trading/market)
     */
    drawCommercial(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number,
        level: number,
        variant: number = 1
    ): void {
        const cx = x + T / 2;
        const cy = y + T / 2;
        const isAbandoned = variant === 0;
        
        // Ground shadow
        this.drawGroundShadow(ctx, cx, cy + T * 0.15, T * 0.4, T * 0.18);
        
        if (level === 1) {
            // Level 1: Pebble Trade Fire - Stone circle with central fire
            this.drawComLevel1(ctx, cx, cy, T, variant);
        } else if (level === 2) {
            // Level 2: Barter Hut - Small covered trading post
            this.drawComLevel2(ctx, cx, cy, T, variant);
        } else {
            // Level 3+: Market Stall
            this.drawComLevel3(ctx, cx, cy, T, variant);
        }
    }
    
    private drawComLevel1(
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        T: number,
        variant: number
    ): void {
        const isAbandoned = variant === 0;
        
        // Packed earth ground
        ctx.fillStyle = isAbandoned ? '#8A8070' : '#C4A882';
        ctx.beginPath();
        ctx.ellipse(cx, cy, T * 0.44, T * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Ground texture
        ctx.fillStyle = isAbandoned ? '#7A7060' : '#B89870';
        ctx.beginPath();
        ctx.ellipse(cx - T * 0.15, cy + T * 0.08, T * 0.12, T * 0.06, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Charred inner area
        ctx.fillStyle = isAbandoned ? '#4A4540' : '#5D4D40';
        ctx.beginPath();
        ctx.ellipse(cx, cy, T * 0.24, T * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Ash ring
        ctx.fillStyle = isAbandoned ? '#5A5550' : '#6A5A50';
        ctx.beginPath();
        ctx.ellipse(cx, cy, T * 0.18, T * 0.11, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Stone circle
        const stoneColors = ['#8A8A7A', '#7A7A6A', '#9A9A8A', '#6A6A5A', '#858575'];
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
            const sx = Math.cos(angle) * T * 0.34;
            const sy = Math.sin(angle) * T * 0.2;
            const stoneSize = T * (0.055 + (i % 3) * 0.012);
            
            // Stone shadow
            ctx.fillStyle = 'rgba(58,48,32,0.4)';
            ctx.beginPath();
            ctx.ellipse(cx + sx + 2, cy + sy + 3, stoneSize * 1.1, stoneSize * 0.6, angle * 0.3, 0, Math.PI * 2);
            ctx.fill();
            
            // Stone body
            ctx.fillStyle = isAbandoned ? '#5A5A4A' : stoneColors[i % 5];
            ctx.beginPath();
            ctx.ellipse(cx + sx, cy + sy, stoneSize * 1.15, stoneSize * 0.7, angle * 0.3, 0, Math.PI * 2);
            ctx.fill();
            
            // Stone highlight
            ctx.fillStyle = isAbandoned ? '#7A7A6A' : '#BBBBAA';
            ctx.beginPath();
            ctx.ellipse(cx + sx - stoneSize * 0.2, cy + sy - stoneSize * 0.2, stoneSize * 0.4, stoneSize * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Central fire (if not abandoned)
        if (!isAbandoned) {
            this.drawFire(ctx, cx, cy - T * 0.05, T * 0.12, variant);
        } else {
            // Ash pile for abandoned
            ctx.fillStyle = '#4A4A4A';
            ctx.beginPath();
            ctx.ellipse(cx, cy, T * 0.1, T * 0.06, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    private drawComLevel2(
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        T: number,
        variant: number
    ): void {
        const isAbandoned = variant === 0;
        
        // Ground base
        ctx.fillStyle = isAbandoned ? '#7A7060' : '#C4A882';
        ctx.beginPath();
        ctx.ellipse(cx, cy + T * 0.1, T * 0.4, T * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Support posts
        ctx.fillStyle = isAbandoned ? '#5A5A4A' : '#8B6914';
        const postPositions = [-0.25, 0.25];
        for (const px of postPositions) {
            ctx.fillRect(cx + px * T - T * 0.025, cy - T * 0.1, T * 0.05, T * 0.25);
        }
        
        // Thatched roof
        ctx.fillStyle = isAbandoned ? '#6A6A5A' : '#7A8B45';
        ctx.beginPath();
        ctx.moveTo(cx - T * 0.35, cy);
        ctx.lineTo(cx, cy - T * 0.25);
        ctx.lineTo(cx + T * 0.35, cy);
        ctx.closePath();
        ctx.fill();
        
        // Roof detail lines
        ctx.strokeStyle = isAbandoned ? '#5A5A4A' : '#5A6B30';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const rx = cx - T * 0.25 + i * T * 0.125;
            ctx.beginPath();
            ctx.moveTo(rx, cy);
            ctx.lineTo(cx, cy - T * 0.22);
            ctx.stroke();
        }
        
        // Trading goods on ground
        if (!isAbandoned) {
            // Basket
            ctx.fillStyle = '#A67B5B';
            ctx.beginPath();
            ctx.ellipse(cx - T * 0.1, cy + T * 0.12, T * 0.08, T * 0.05, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Pile of goods
            ctx.fillStyle = '#8B7355';
            ctx.beginPath();
            ctx.ellipse(cx + T * 0.1, cy + T * 0.1, T * 0.06, T * 0.04, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    private drawComLevel3(
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        T: number,
        variant: number
    ): void {
        const isAbandoned = variant === 0;
        
        // Market stall base
        ctx.fillStyle = isAbandoned ? '#6A6A5A' : '#A89070';
        ctx.fillRect(cx - T * 0.35, cy - T * 0.1, T * 0.7, T * 0.25);
        
        // Counter/table
        ctx.fillStyle = isAbandoned ? '#5A5A4A' : '#8B6914';
        ctx.fillRect(cx - T * 0.3, cy - T * 0.15, T * 0.6, T * 0.08);
        
        // Awning posts
        ctx.fillStyle = isAbandoned ? '#5A5A4A' : '#6D4C41';
        ctx.fillRect(cx - T * 0.28, cy - T * 0.35, T * 0.04, T * 0.25);
        ctx.fillRect(cx + T * 0.24, cy - T * 0.35, T * 0.04, T * 0.25);
        
        // Cloth awning
        ctx.fillStyle = isAbandoned ? '#7A7A6A' : '#B85450';
        ctx.beginPath();
        ctx.moveTo(cx - T * 0.35, cy - T * 0.1);
        ctx.lineTo(cx - T * 0.35, cy - T * 0.3);
        ctx.quadraticCurveTo(cx, cy - T * 0.4, cx + T * 0.35, cy - T * 0.3);
        ctx.lineTo(cx + T * 0.35, cy - T * 0.1);
        ctx.closePath();
        ctx.fill();
        
        // Awning stripes
        if (!isAbandoned) {
            ctx.fillStyle = '#E8DCC8';
            for (let i = 0; i < 3; i++) {
                const stripeX = cx - T * 0.25 + i * T * 0.2;
                ctx.fillRect(stripeX, cy - T * 0.28, T * 0.08, T * 0.18);
            }
        }
        
        // Goods on display
        if (!isAbandoned) {
            // Pottery
            ctx.fillStyle = '#C4A882';
            ctx.beginPath();
            ctx.ellipse(cx - T * 0.15, cy - T * 0.18, T * 0.04, T * 0.06, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Basket
            ctx.fillStyle = '#A67B5B';
            ctx.beginPath();
            ctx.ellipse(cx + T * 0.1, cy - T * 0.16, T * 0.05, T * 0.04, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // INDUSTRIAL BUILDINGS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Draw industrial building (workshop/forge)
     */
    drawIndustrial(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number,
        level: number,
        variant: number = 1
    ): void {
        const cx = x + T / 2;
        const cy = y + T / 2;
        
        // Ground shadow
        this.drawGroundShadow(ctx, cx, cy + T * 0.15, T * 0.4, T * 0.18);
        
        if (level === 1) {
            this.drawIndLevel1(ctx, cx, cy, T, variant);
        } else if (level === 2) {
            this.drawIndLevel2(ctx, cx, cy, T, variant);
        } else {
            this.drawIndLevel3(ctx, cx, cy, T, variant);
        }
    }
    
    private drawIndLevel1(
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        T: number,
        variant: number
    ): void {
        const isAbandoned = variant === 0;
        
        // Stone crafting area
        ctx.fillStyle = isAbandoned ? '#6A6A5A' : '#8A8A7A';
        ctx.beginPath();
        ctx.ellipse(cx, cy + T * 0.05, T * 0.35, T * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Work stone (anvil equivalent)
        ctx.fillStyle = isAbandoned ? '#5A5A4A' : '#6A6A5A';
        ctx.beginPath();
        ctx.ellipse(cx, cy - T * 0.05, T * 0.12, T * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = isAbandoned ? '#4A4A3A' : '#5A5A4A';
        ctx.beginPath();
        ctx.ellipse(cx, cy - T * 0.08, T * 0.1, T * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Stone tools scattered
        if (!isAbandoned) {
            // Hammer stone
            this.drawStone(ctx, cx - T * 0.2, cy + T * 0.08, T * 0.04, 0.3, false);
            // Flint pieces
            this.drawStone(ctx, cx + T * 0.18, cy + T * 0.05, T * 0.03, -0.2, false);
            this.drawStone(ctx, cx + T * 0.22, cy + T * 0.12, T * 0.025, 0.5, false);
        }
        
        // Work-in-progress stone
        if (!isAbandoned) {
            ctx.fillStyle = '#7A7A6A';
            ctx.beginPath();
            ctx.moveTo(cx - T * 0.05, cy - T * 0.12);
            ctx.lineTo(cx + T * 0.05, cy - T * 0.12);
            ctx.lineTo(cx + T * 0.03, cy - T * 0.02);
            ctx.lineTo(cx - T * 0.03, cy - T * 0.02);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    private drawIndLevel2(
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        T: number,
        variant: number
    ): void {
        const isAbandoned = variant === 0;
        
        // Workshop shed
        ctx.fillStyle = isAbandoned ? '#5A5A4A' : '#8B6914';
        ctx.fillRect(cx - T * 0.3, cy - T * 0.1, T * 0.6, T * 0.3);
        
        // Roof
        ctx.fillStyle = isAbandoned ? '#6A6A5A' : '#6D4C41';
        ctx.beginPath();
        ctx.moveTo(cx - T * 0.35, cy - T * 0.05);
        ctx.lineTo(cx, cy - T * 0.3);
        ctx.lineTo(cx + T * 0.35, cy - T * 0.05);
        ctx.closePath();
        ctx.fill();
        
        // Door opening
        ctx.fillStyle = '#2A2A1A';
        ctx.fillRect(cx - T * 0.08, cy, T * 0.16, T * 0.18);
        
        // Forge fire glow (if active)
        if (!isAbandoned && variant >= 2) {
            ctx.fillStyle = '#D4652F';
            ctx.beginPath();
            ctx.arc(cx, cy + T * 0.05, T * 0.06, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Smoke from chimney
        if (!isAbandoned) {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.4)';
            const smokeOffset = Math.sin(this.time * 2) * T * 0.02;
            ctx.beginPath();
            ctx.arc(cx + T * 0.15 + smokeOffset, cy - T * 0.35, T * 0.04, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + T * 0.18 + smokeOffset * 1.5, cy - T * 0.42, T * 0.03, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    private drawIndLevel3(
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        T: number,
        variant: number
    ): void {
        const isAbandoned = variant === 0;
        
        // Main forge building
        ctx.fillStyle = isAbandoned ? '#5A5A4A' : '#8B7355';
        ctx.fillRect(cx - T * 0.35, cy - T * 0.15, T * 0.7, T * 0.35);
        
        // Stone foundation
        ctx.fillStyle = isAbandoned ? '#4A4A3A' : '#7A7A6A';
        ctx.fillRect(cx - T * 0.38, cy + T * 0.15, T * 0.76, T * 0.08);
        
        // Peaked roof
        ctx.fillStyle = isAbandoned ? '#6A6A5A' : '#5A4A3A';
        ctx.beginPath();
        ctx.moveTo(cx - T * 0.4, cy - T * 0.1);
        ctx.lineTo(cx, cy - T * 0.38);
        ctx.lineTo(cx + T * 0.4, cy - T * 0.1);
        ctx.closePath();
        ctx.fill();
        
        // Chimney
        ctx.fillStyle = isAbandoned ? '#5A5A4A' : '#6A5A4A';
        ctx.fillRect(cx + T * 0.15, cy - T * 0.45, T * 0.1, T * 0.2);
        
        // Door
        ctx.fillStyle = '#2A2A1A';
        ctx.fillRect(cx - T * 0.1, cy - T * 0.05, T * 0.2, T * 0.25);
        
        // Windows
        ctx.fillStyle = isAbandoned ? '#3A3A2A' : '#D4A03D';
        ctx.fillRect(cx - T * 0.28, cy - T * 0.08, T * 0.08, T * 0.1);
        ctx.fillRect(cx + T * 0.2, cy - T * 0.08, T * 0.08, T * 0.1);
        
        // Smoke
        if (!isAbandoned) {
            ctx.fillStyle = 'rgba(80, 80, 80, 0.5)';
            const smokeTime = this.time * 1.5;
            for (let i = 0; i < 3; i++) {
                const offset = Math.sin(smokeTime + i * 0.5) * T * 0.03;
                ctx.beginPath();
                ctx.arc(cx + T * 0.2 + offset, cy - T * 0.5 - i * T * 0.08, T * (0.04 - i * 0.008), 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // WELL (Natural Water Pit - Orthographic View)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Draw a well as a natural water pit with spring water
     * Orthographic top-down view showing depth
     */
    drawWell(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number
    ): void {
        const cx = x + T / 2;
        const cy = y + T / 2;
        const time = this.time;
        
        // ─────────────────────────────────────────────────────────
        // OUTER DIRT/EARTH RIM - The dug-out edges of the pit
        // ─────────────────────────────────────────────────────────
        // Dark earth shadow around pit
        ctx.fillStyle = '#5A4A3A';
        ctx.beginPath();
        ctx.ellipse(cx, cy + T * 0.02, T * 0.42, T * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Brown earth rim
        ctx.fillStyle = '#7A6A52';
        ctx.beginPath();
        ctx.ellipse(cx, cy, T * 0.40, T * 0.33, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Lighter inner earth (showing depth)
        ctx.fillStyle = '#6A5A42';
        ctx.beginPath();
        ctx.ellipse(cx, cy - T * 0.02, T * 0.35, T * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // ─────────────────────────────────────────────────────────
        // STONE LINED EDGES - Natural rocks around the water
        // ─────────────────────────────────────────────────────────
        const stonePositions = [
            { x: -0.28, y: -0.15, size: 0.08 },
            { x: 0.25, y: -0.12, size: 0.07 },
            { x: -0.22, y: 0.18, size: 0.09 },
            { x: 0.20, y: 0.20, size: 0.08 },
            { x: -0.08, y: -0.22, size: 0.06 },
            { x: 0.12, y: -0.20, size: 0.07 },
            { x: 0.28, y: 0.05, size: 0.06 },
            { x: -0.30, y: 0.02, size: 0.07 },
        ];
        
        for (const stone of stonePositions) {
            // Stone shadow
            ctx.fillStyle = '#4A3A2A';
            ctx.beginPath();
            ctx.ellipse(
                cx + stone.x * T + T * 0.01, 
                cy + stone.y * T + T * 0.01, 
                stone.size * T, 
                stone.size * T * 0.7, 
                0, 0, Math.PI * 2
            );
            ctx.fill();
            
            // Stone body
            ctx.fillStyle = '#8A8A7A';
            ctx.beginPath();
            ctx.ellipse(
                cx + stone.x * T, 
                cy + stone.y * T, 
                stone.size * T, 
                stone.size * T * 0.7, 
                0, 0, Math.PI * 2
            );
            ctx.fill();
            
            // Stone highlight
            ctx.fillStyle = '#9A9A8A';
            ctx.beginPath();
            ctx.ellipse(
                cx + stone.x * T - T * 0.01, 
                cy + stone.y * T - T * 0.01, 
                stone.size * T * 0.5, 
                stone.size * T * 0.35, 
                0, 0, Math.PI * 2
            );
            ctx.fill();
        }
        
        // ─────────────────────────────────────────────────────────
        // DEEP WATER - The dark spring water in the pit
        // ─────────────────────────────────────────────────────────
        // Darkest depth (bottom of pit)
        ctx.fillStyle = '#2A3A4A';
        ctx.beginPath();
        ctx.ellipse(cx, cy, T * 0.28, T * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Mid-depth water
        ctx.fillStyle = '#3A4A5A';
        ctx.beginPath();
        ctx.ellipse(cx, cy - T * 0.01, T * 0.25, T * 0.19, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Surface water (lighter, shows it's filled)
        ctx.fillStyle = '#4A5A6A';
        ctx.beginPath();
        ctx.ellipse(cx, cy - T * 0.02, T * 0.22, T * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // ─────────────────────────────────────────────────────────
        // WATER SURFACE EFFECTS - Ripples and reflections
        // ─────────────────────────────────────────────────────────
        // Animated ripple rings (spring bubbling up)
        const ripplePhase = (time * 0.8) % 1;
        const rippleAlpha = 1 - ripplePhase;
        
        ctx.strokeStyle = `rgba(138, 196, 208, ${rippleAlpha * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(
            cx - T * 0.05, 
            cy - T * 0.02, 
            T * 0.05 + ripplePhase * T * 0.1, 
            T * 0.03 + ripplePhase * T * 0.06, 
            0, 0, Math.PI * 2
        );
        ctx.stroke();
        
        // Second ripple (offset timing)
        const ripplePhase2 = ((time * 0.8) + 0.5) % 1;
        const rippleAlpha2 = 1 - ripplePhase2;
        ctx.strokeStyle = `rgba(138, 196, 208, ${rippleAlpha2 * 0.4})`;
        ctx.beginPath();
        ctx.ellipse(
            cx + T * 0.03, 
            cy - T * 0.01, 
            T * 0.04 + ripplePhase2 * T * 0.08, 
            T * 0.025 + ripplePhase2 * T * 0.05, 
            0, 0, Math.PI * 2
        );
        ctx.stroke();
        
        // ─────────────────────────────────────────────────────────
        // WATER SHINE/REFLECTIONS
        // ─────────────────────────────────────────────────────────
        // Main shine spot
        ctx.fillStyle = 'rgba(180, 220, 240, 0.5)';
        ctx.beginPath();
        ctx.ellipse(cx - T * 0.08, cy - T * 0.06, T * 0.06, T * 0.035, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Secondary shine
        ctx.fillStyle = 'rgba(200, 230, 250, 0.4)';
        ctx.beginPath();
        ctx.ellipse(cx + T * 0.05, cy - T * 0.04, T * 0.04, T * 0.025, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Bright highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.ellipse(cx - T * 0.1, cy - T * 0.07, T * 0.025, T * 0.015, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // ─────────────────────────────────────────────────────────
        // SMALL DETAILS - Grass/moss around edges
        // ─────────────────────────────────────────────────────────
        const grassPositions = [
            { x: -0.35, y: 0.10 },
            { x: 0.33, y: -0.08 },
            { x: -0.30, y: -0.18 },
            { x: 0.28, y: 0.15 },
        ];
        
        ctx.fillStyle = '#5A7A45';
        for (const grass of grassPositions) {
            ctx.beginPath();
            ctx.moveTo(cx + grass.x * T, cy + grass.y * T);
            ctx.lineTo(cx + grass.x * T - T * 0.02, cy + grass.y * T - T * 0.04);
            ctx.lineTo(cx + grass.x * T + T * 0.02, cy + grass.y * T - T * 0.03);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // RESIDENTIAL BUILDINGS (Simplified)
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Draw residential building (tent/hut/cabin) - Matching original game style
     */
    drawResidential(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number,
        level: number,
        variant: number = 1,
        pop?: number,
        capacity?: number
    ): void {
        const cx = x + T / 2;
        const cy = y + T / 2;
        
        // Draw ground base for all residential
        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.ellipse(cx, cy + T * 0.15, T * 0.4, T * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        if (level <= 1) {
            // LEVEL 1: PIT/BASIC TENT - matching original
            this.drawResLevel1(ctx, cx, cy, T, variant, pop, capacity);
        } else if (level === 2) {
            // LEVEL 2: LEATHER TENT
            this.drawResLevel2(ctx, cx, cy, T, variant);
        } else if (level === 3) {
            // LEVEL 3: MUD BRICK HUT
            this.drawResLevel3Hut(ctx, cx, cy, T, variant);
        } else {
            // LEVEL 4+: LOG CABIN
            this.drawResLevel4Cabin(ctx, cx, cy, T, variant);
        }
    }
    
    private drawResLevel1(
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        T: number,
        variant: number,
        pop?: number,
        capacity?: number
    ): void {
        // Tent color based on variant
        const tentColors = ['#5D4037', '#8B7355', '#A08060', '#D4A574'];
        const tentColor = tentColors[Math.min(variant, tentColors.length - 1)];
        
        // Draw tent shape
        ctx.fillStyle = tentColor;
        ctx.beginPath();
        ctx.moveTo(cx, cy - T * 0.35);
        ctx.lineTo(cx - T * 0.3, cy + T * 0.15);
        ctx.lineTo(cx + T * 0.3, cy + T * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Mud trim ring around base
        ctx.strokeStyle = '#6D4C41';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy + T * 0.16, T * 0.28, T * 0.10, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Flags: yellow for Straw Pit (variant===2), red when full
        const isFull = pop !== undefined && capacity !== undefined && pop >= capacity && capacity > 0;
        let flagColor: string | null = null;
        if (isFull) {
            flagColor = '#E53935'; // Red when full
        } else if (variant === 2) {
            flagColor = '#FFD54F'; // Yellow for Straw Pit
        }
        
        if (flagColor) {
            // Flag pole at tent tip
            const apexX = cx;
            const apexY = cy - T * 0.35;
            ctx.strokeStyle = '#3E2723';
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.moveTo(apexX, apexY);
            const poleTopY = apexY - T * 0.24;
            ctx.lineTo(apexX, poleTopY);
            ctx.stroke();
            
            // Waving flag
            const wBase = T * 0.24;
            const hBase = T * 0.08;
            const windPhase = this.time * 2 + cx * 0.3 + cy * 0.2;
            const windPhaseY = this.time * 3 + cx * 0.4;
            const flapX = apexX + wBase * (1 + 0.25 * Math.sin(windPhase));
            const flapY = poleTopY - hBase * (0.5 + 0.4 * Math.cos(windPhaseY));
            ctx.fillStyle = flagColor;
            ctx.beginPath();
            ctx.moveTo(apexX, poleTopY);
            ctx.lineTo(flapX, flapY);
            ctx.lineTo(apexX, poleTopY - hBase);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    private drawResLevel2(
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        T: number,
        variant: number
    ): void {
        // LEVEL 2: LEATHER TENT
        const tentColors = ['#5D4037', '#8B7355', '#A08060', '#D4A574'];
        const tentColor = tentColors[Math.min(variant, tentColors.length - 1)];
        
        // Tent body (cone shape)
        ctx.fillStyle = tentColor;
        ctx.beginPath();
        ctx.moveTo(cx, cy - T * 0.35);
        ctx.lineTo(cx - T * 0.3, cy + T * 0.15);
        ctx.lineTo(cx + T * 0.3, cy + T * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Tent poles sticking out top
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - T * 0.05, cy - T * 0.35);
        ctx.lineTo(cx - T * 0.08, cy - T * 0.45);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + T * 0.05, cy - T * 0.35);
        ctx.lineTo(cx + T * 0.08, cy - T * 0.45);
        ctx.stroke();
        
        // Door opening (darker)
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.moveTo(cx, cy - T * 0.05);
        ctx.lineTo(cx - T * 0.08, cy + T * 0.12);
        ctx.lineTo(cx + T * 0.08, cy + T * 0.12);
        ctx.closePath();
        ctx.fill();
        
        // Decorative stripes for higher variants
        if (variant >= 2) {
            ctx.strokeStyle = '#8D6E63';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - T * 0.2, cy);
            ctx.lineTo(cx + T * 0.2, cy);
            ctx.stroke();
        }
    }
    
    private drawResLevel3Hut(
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        T: number,
        variant: number
    ): void {
        // LEVEL 3: MUD BRICK HUT
        const hutColors = ['#5D4037', '#8D6E63', '#A1887F', '#BCAAA4'];
        const hutColor = hutColors[Math.min(variant, hutColors.length - 1)];
        
        // Dome body
        ctx.fillStyle = hutColor;
        ctx.beginPath();
        ctx.arc(cx, cy, T * 0.3, Math.PI, 0, false);
        ctx.lineTo(cx + T * 0.3, cy + T * 0.1);
        ctx.lineTo(cx - T * 0.3, cy + T * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Door
        ctx.fillStyle = '#3E2723';
        ctx.beginPath();
        ctx.arc(cx, cy + T * 0.05, T * 0.08, Math.PI, 0, false);
        ctx.lineTo(cx + T * 0.08, cy + T * 0.1);
        ctx.lineTo(cx - T * 0.08, cy + T * 0.1);
        ctx.closePath();
        ctx.fill();
        
        // Smoke hole on top for higher variants
        if (variant >= 2) {
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(cx, cy - T * 0.25, T * 0.04, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    private drawResLevel4Cabin(
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        T: number,
        variant: number
    ): void {
        // LEVEL 4+: LOG CABIN
        const woodColors = ['#4E342E', '#6D4C41', '#8D6E63', '#A1887F'];
        const woodColor = woodColors[Math.min(variant, woodColors.length - 1)];
        
        // Cabin base
        ctx.fillStyle = woodColor;
        ctx.fillRect(cx - T * 0.3, cy - T * 0.15, T * 0.6, T * 0.35);
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - T * 0.3, cy - T * 0.15, T * 0.6, T * 0.35);
        
        // Log lines
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(cx - T * 0.3, cy - T * 0.1 + i * T * 0.07);
            ctx.lineTo(cx + T * 0.3, cy - T * 0.1 + i * T * 0.07);
            ctx.stroke();
        }
        
        // Roof
        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.moveTo(cx - T * 0.35, cy - T * 0.15);
        ctx.lineTo(cx, cy - T * 0.38);
        ctx.lineTo(cx + T * 0.35, cy - T * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Door
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(cx - T * 0.06, cy, T * 0.12, T * 0.2);
        
        // Window for higher variants
        if (variant >= 2) {
            ctx.fillStyle = '#FFEB3B';
            ctx.fillRect(cx + T * 0.12, cy - T * 0.05, T * 0.08, T * 0.08);
            ctx.strokeStyle = '#3E2723';
            ctx.lineWidth = 1;
            ctx.strokeRect(cx + T * 0.12, cy - T * 0.05, T * 0.08, T * 0.08);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // MAIN DRAW METHOD
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Draw any building type
     */
    drawBuilding(
        ctx: CanvasRenderingContext2D,
        building: BuildingRenderData,
        T: number
    ): void {
        const x = building.x * T;
        const y = building.y * T;
        const level = building.lvl || 1;
        const variant = building.variant ?? 1;
        
        switch (building.t) {
            case 'RES':
                this.drawResidential(ctx, x, y, T, level, variant, building.pop, 4 + level * 2);
                break;
            case 'COM':
                this.drawCommercial(ctx, x, y, T, level, variant);
                break;
            case 'IND':
                this.drawIndustrial(ctx, x, y, T, level, variant);
                break;
            case 'WELL':
                this.drawWell(ctx, x, y, T);
                break;
            default:
                // Generic building fallback
                this.drawGenericBuilding(ctx, x, y, T, building.t);
        }
    }
    
    /**
     * Draw generic building placeholder
     */
    drawGenericBuilding(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number,
        type: string
    ): void {
        const cx = x + T / 2;
        const cy = y + T / 2;
        
        // Shadow
        this.drawGroundShadow(ctx, cx, cy + T * 0.15, T * 0.35, T * 0.18);
        
        // Simple box
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(x + T * 0.1, y + T * 0.1, T * 0.8, T * 0.8);
        
        // Roof
        ctx.fillStyle = '#6D4C41';
        ctx.beginPath();
        ctx.moveTo(x + T * 0.05, y + T * 0.15);
        ctx.lineTo(x + T / 2, y - T * 0.1);
        ctx.lineTo(x + T * 0.95, y + T * 0.15);
        ctx.closePath();
        ctx.fill();
        
        // Label
        ctx.fillStyle = '#E8DCC8';
        ctx.font = `${T * 0.2}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(type.substring(0, 3), cx, cy);
    }
}

// Export singleton instance
export const buildingRenderer = new BuildingRenderer();
