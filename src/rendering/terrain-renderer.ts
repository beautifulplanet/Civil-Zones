/**
 * Civil Zones - Victorian Map Style Terrain Renderer
 * ═══════════════════════════════════════════════════════════════════════════════
 * Hand-drawn cartographic style with sepia tones, ink lines, parchment texture
 * Ported from index.html Renderer.draw() terrain section
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { CFG } from '../config/game-config.js';

export interface TerrainTile {
    type: string;
    elevation: number;
    explored: boolean;
    tree?: boolean;
    stoneDeposit?: { metal: number };
}

export interface TerrainRenderOptions {
    showGrid: boolean;
    showElevation: boolean;
    viewMode: string;
}

/**
 * Victorian Map Style Terrain Renderer
 */
export class TerrainRenderer {
    private time: number = 0;
    
    constructor() {}
    
    /**
     * Update animation time - clamp to prevent overflow
     */
    update(deltaTime: number): void {
        this.time += deltaTime * 0.05;
        // Wrap time to prevent floating point issues over long sessions
        if (this.time > 10000) {
            this.time = this.time % 10000;
        }
    }
    
    /**
     * Draw a single terrain tile with Victorian map styling
     */
    drawTile(
        ctx: CanvasRenderingContext2D,
        tile: TerrainTile,
        x: number,
        y: number,
        T: number,
        seed: number
    ): void {
        const px = x * T;
        const py = y * T;
        
        // === FOG OF WAR - Aged parchment unexplored areas ===
        if (!tile.explored) {
            ctx.fillStyle = CFG.COLORS.FOG;
            ctx.fillRect(px, py, T, T);
            // Ink border edge effect
            ctx.strokeStyle = 'rgba(60,40,20,0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(px, py, T, T);
            return;
        }
        
        // === BASE TERRAIN COLOR ===
        const baseColor = CFG.COLORS[tile.type as keyof typeof CFG.COLORS] || CFG.COLORS.GRASS;
        ctx.fillStyle = baseColor;
        ctx.fillRect(px, py, T, T);
        
        // === TERRAIN-SPECIFIC VICTORIAN STYLING ===
        this.drawTerrainDetails(ctx, tile, px, py, T, seed);
        
        // === PARCHMENT AGING - Subtle spots ===
        if (seed % 11 === 0) {
            ctx.fillStyle = 'rgba(80,60,40,0.04)';
            ctx.fillRect(px + seed % (T - 4), py + (seed * 3) % (T - 4), 2, 2);
        }
    }
    
    /**
     * Draw terrain-specific details
     */
    private drawTerrainDetails(
        ctx: CanvasRenderingContext2D,
        tile: TerrainTile,
        px: number,
        py: number,
        T: number,
        seed: number
    ): void {
        const type = tile.type;
        
        if (type === 'GRASS') {
            // Parchment green with subtle stippling
            ctx.fillStyle = '#C9D4A0';
            ctx.fillRect(px, py, T, T);
            
            // Hand-drawn stipple dots (cartographic grass)
            if (seed % 7 === 0) {
                ctx.fillStyle = 'rgba(100,120,60,0.35)';
                ctx.fillRect(px + T * 0.3, py + T * 0.4, 1, 1);
                ctx.fillRect(px + T * 0.6, py + T * 0.7, 1, 1);
            }
            
            // Draw tree if marked (GRASS can also have trees)
            if (tile.tree) {
                this.drawTree(ctx, px, py, T, type, seed);
            }
            
        } else if (type === 'SAND') {
            // Sandy parchment with fine dots
            ctx.fillStyle = '#D4C4A8';
            ctx.fillRect(px, py, T, T);
            
            // Simplified stipple for sand
            if (seed % 8 === 0) {
                ctx.fillStyle = 'rgba(160,140,100,0.25)';
                ctx.fillRect(px + (seed % 10), py + ((seed * 2) % 10), 2, 2);
            }
            
        } else if (type === 'WATER' || type === 'RIVER' || type === 'DEEP') {
            // ═══════════════════════════════════════════════════════════════════
            // JAPANESE UKIYO-E STYLE WATER - Like Hokusai's Great Wave
            // Deep indigo blues with flowing white wave patterns
            // ═══════════════════════════════════════════════════════════════════
            
            // Base color - deep Japanese indigo
            const baseIndigo = type === 'DEEP' ? '#1A3A5C' : type === 'WATER' ? '#2A4A6C' : '#3A5A7C';
            ctx.fillStyle = baseIndigo;
            ctx.fillRect(px, py, T, T);
            
            // Secondary layer - slightly lighter swirl
            const midColor = type === 'DEEP' ? '#2A4A6C' : type === 'WATER' ? '#3A5A7C' : '#4A6A8C';
            ctx.fillStyle = midColor;
            const wavePhase = this.time * 0.3 + (px + py) * 0.02;
            const waveOffset = Math.sin(wavePhase) * T * 0.15;
            ctx.beginPath();
            ctx.ellipse(px + T * 0.5 + waveOffset, py + T * 0.5, T * 0.35, T * 0.25, wavePhase * 0.1, 0, Math.PI * 2);
            ctx.fill();
            
            // Japanese wave curves (flowing lines)
            ctx.strokeStyle = 'rgba(100, 140, 180, 0.4)';
            ctx.lineWidth = 1.5;
            const numWaves = 2;
            for (let w = 0; w < numWaves; w++) {
                const waveY = py + T * (0.3 + w * 0.35);
                const phase = this.time * 0.5 + w * 1.5 + px * 0.05;
                ctx.beginPath();
                ctx.moveTo(px, waveY + Math.sin(phase) * 3);
                ctx.quadraticCurveTo(
                    px + T * 0.25, waveY + Math.sin(phase + 1) * 4,
                    px + T * 0.5, waveY + Math.sin(phase + 2) * 3
                );
                ctx.quadraticCurveTo(
                    px + T * 0.75, waveY + Math.sin(phase + 3) * 4,
                    px + T, waveY + Math.sin(phase + 4) * 3
                );
                ctx.stroke();
            }
            
            // White foam/crest highlights (Hokusai style)
            ctx.fillStyle = 'rgba(220, 235, 250, 0.35)';
            const foamPhase = this.time * 0.4 + seed * 0.1;
            if (Math.sin(foamPhase + px * 0.1) > 0.7) {
                const foamX = px + T * (0.2 + Math.sin(foamPhase) * 0.3);
                const foamY = py + T * (0.3 + Math.cos(foamPhase * 0.7) * 0.2);
                ctx.beginPath();
                ctx.arc(foamX, foamY, T * 0.08, 0, Math.PI * 2);
                ctx.arc(foamX + T * 0.1, foamY + T * 0.05, T * 0.06, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Subtle sparkle/shimmer points
            if ((seed + Math.floor(this.time * 2)) % 7 === 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                const sparkleX = px + T * (0.2 + (seed % 5) * 0.15);
                const sparkleY = py + T * (0.3 + ((seed * 3) % 4) * 0.15);
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Edge darkening for depth (vignette effect)
            if (type === 'DEEP') {
                ctx.fillStyle = 'rgba(10, 25, 45, 0.15)';
                ctx.fillRect(px, py, T, T * 0.1);
                ctx.fillRect(px, py + T * 0.9, T, T * 0.1);
            }
            
        } else if (type === 'STONE' || type === 'ROCK') {
            // Rocky terrain - natural mountain look with gradients and texture
            // Base color varies by seed for natural variation
            const stoneHue = 35 + (seed % 15);  // Brown-grey variations
            const stoneSat = 8 + (seed % 10);
            const stoneLight = type === 'STONE' ? 35 + (seed % 10) : 50 + (seed % 15);
            ctx.fillStyle = `hsl(${stoneHue}, ${stoneSat}%, ${stoneLight}%)`;
            ctx.fillRect(px, py, T, T);
            
            // Add natural rock texture with organic shapes
            // Larger rock formations
            ctx.fillStyle = `hsl(${stoneHue + 5}, ${stoneSat - 2}%, ${stoneLight + 8}%)`;
            const rockCount = 2 + (seed % 3);
            for (let i = 0; i < rockCount; i++) {
                const rx = px + T * (0.1 + ((seed * (i + 1)) % 7) / 10);
                const ry = py + T * (0.1 + ((seed * (i + 2)) % 7) / 10);
                const rw = T * (0.25 + (seed % 4) / 15);
                const rh = T * (0.2 + ((seed * 2) % 4) / 18);
                ctx.beginPath();
                ctx.ellipse(rx + rw/2, ry + rh/2, rw/2, rh/2, (seed * i) % 3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Dark crevices for depth
            ctx.strokeStyle = `hsl(${stoneHue}, ${stoneSat}%, ${stoneLight - 20}%)`;
            ctx.lineWidth = 1;
            if (seed % 3 === 0) {
                ctx.beginPath();
                ctx.moveTo(px + T * 0.1, py + T * 0.3);
                ctx.quadraticCurveTo(px + T * 0.5, py + T * (0.2 + (seed % 3) / 10), px + T * 0.8, py + T * 0.35);
                ctx.stroke();
            }
            if (seed % 4 === 0) {
                ctx.beginPath();
                ctx.moveTo(px + T * 0.2, py + T * 0.7);
                ctx.quadraticCurveTo(px + T * 0.4, py + T * 0.65, px + T * 0.7, py + T * 0.75);
                ctx.stroke();
            }
            
            // Highlight edges for 3D effect
            ctx.fillStyle = `rgba(255, 255, 255, 0.1)`;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + T, py);
            ctx.lineTo(px + T * 0.8, py + T * 0.15);
            ctx.lineTo(px + T * 0.2, py + T * 0.1);
            ctx.closePath();
            ctx.fill();
            
            // Shadow at bottom
            ctx.fillStyle = `rgba(0, 0, 0, 0.15)`;
            ctx.beginPath();
            ctx.moveTo(px, py + T);
            ctx.lineTo(px + T, py + T);
            ctx.lineTo(px + T * 0.85, py + T * 0.85);
            ctx.lineTo(px + T * 0.15, py + T * 0.9);
            ctx.closePath();
            ctx.fill();
            
        } else if (type === 'FOREST' || type === 'PINE') {
            // Forest floor - muted green
            ctx.fillStyle = '#A8B888';
            ctx.fillRect(px, py, T, T);
            
            // Draw tree if marked
            if (tile.tree) {
                this.drawTree(ctx, px, py, T, type, seed);
            }
            
        } else if (type === 'SNOW') {
            // Snow - near white
            ctx.fillStyle = '#E8E8E0';
            ctx.fillRect(px, py, T, T);
            
            // Draw snowy trees
            if (tile.tree) {
                this.drawTree(ctx, px, py, T, 'SNOW', seed);
            }
        }
        
        // Draw stone deposit if present
        if (tile.stoneDeposit) {
            this.drawStoneDeposit(ctx, px, py, T, tile.stoneDeposit.metal);
        }
    }
    
    /**
     * Draw animated water shimmer
     */
    private drawWaterAnimation(
        ctx: CanvasRenderingContext2D,
        px: number,
        py: number,
        T: number
    ): void {
        const scale = T / 64;
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 2 * scale;
        const offset = Math.sin(this.time + px / T) * 5 * scale;
        ctx.beginPath();
        ctx.moveTo(px + 10 * scale, py + T / 2 + offset);
        ctx.quadraticCurveTo(px + T / 2, py + 20 * scale + offset, px + 54 * scale, py + T / 2 + offset);
        ctx.stroke();
    }
    
    /**
     * Draw detailed trees - tiny at zoom out, detailed when zoomed in
     * Inspired by ancient map illustrations and Japanese nature art
     */
    private drawTree(
        ctx: CanvasRenderingContext2D,
        px: number,
        py: number,
        T: number,
        type: string,
        seed: number
    ): void {
        const cx = px + T / 2;
        const cy = py + T / 2;
        const scale = T / 64;
        const isDetailed = T >= 40; // More detail when zoomed in
        const numTrees = isDetailed ? (1 + (seed % 2)) : (2 + (seed % 3));
        
        if (type === 'PINE' || type === 'SNOW') {
            // ═══════════════════════════════════════════════════════════
            // CONIFEROUS TREES - Detailed pine/fir trees
            // ═══════════════════════════════════════════════════════════
            for (let i = 0; i < numTrees; i++) {
                const tx = px + T * 0.2 + (seed + i * 31) % (T * 0.6);
                const ty = py + T * 0.3 + ((seed + i * 17) % (T * 0.4));
                const treeHeight = (8 + (seed % 4)) * scale;
                const treeWidth = treeHeight * 0.5;
                
                if (isDetailed) {
                    // DETAILED pine tree
                    // Trunk
                    ctx.fillStyle = '#5D4E3A';
                    ctx.fillRect(tx - scale, ty + treeHeight * 0.5, scale * 2, treeHeight * 0.5);
                    
                    // Multiple tiers of branches
                    const tiers = 4;
                    for (let t = 0; t < tiers; t++) {
                        const tierY = ty + treeHeight * (t * 0.2);
                        const tierWidth = treeWidth * (1 - t * 0.15);
                        
                        // Main branch layer
                        ctx.fillStyle = type === 'SNOW' ? '#4A6050' : '#3A5040';
                        ctx.beginPath();
                        ctx.moveTo(tx, tierY - treeHeight * 0.1);
                        ctx.lineTo(tx - tierWidth, tierY + treeHeight * 0.15);
                        ctx.lineTo(tx + tierWidth, tierY + treeHeight * 0.15);
                        ctx.closePath();
                        ctx.fill();
                        
                        // Highlight layer
                        ctx.fillStyle = type === 'SNOW' ? '#5A7060' : '#4A6050';
                        ctx.beginPath();
                        ctx.moveTo(tx, tierY - treeHeight * 0.1);
                        ctx.lineTo(tx - tierWidth * 0.5, tierY + treeHeight * 0.08);
                        ctx.lineTo(tx, tierY + treeHeight * 0.05);
                        ctx.closePath();
                        ctx.fill();
                    }
                    
                    // Snow caps if snowy
                    if (type === 'SNOW') {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                        for (let t = 0; t < 3; t++) {
                            const snowY = ty + treeHeight * (t * 0.2);
                            ctx.beginPath();
                            ctx.arc(tx, snowY - treeHeight * 0.05, scale * 2, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                } else {
                    // Simple tiny triangle
                    ctx.fillStyle = type === 'SNOW' ? '#4A6050' : '#3A5040';
                    ctx.beginPath();
                    ctx.moveTo(tx, ty - treeHeight * 0.5);
                    ctx.lineTo(tx - treeWidth, ty + treeHeight * 0.3);
                    ctx.lineTo(tx + treeWidth, ty + treeHeight * 0.3);
                    ctx.closePath();
                    ctx.fill();
                }
            }
        } else {
            // ═══════════════════════════════════════════════════════════
            // DECIDUOUS TREES - Detailed oak/maple style
            // ═══════════════════════════════════════════════════════════
            for (let i = 0; i < numTrees; i++) {
                const tx = px + T * 0.15 + (seed + i * 23) % (T * 0.7);
                const ty = py + T * 0.25 + ((seed + i * 19) % (T * 0.5));
                const treeSize = (4 + (seed % 3)) * scale;
                
                if (isDetailed) {
                    // DETAILED deciduous tree
                    // Trunk with texture
                    ctx.fillStyle = '#6B5340';
                    const trunkWidth = treeSize * 0.25;
                    const trunkHeight = treeSize * 1.2;
                    ctx.fillRect(tx - trunkWidth / 2, ty, trunkWidth, trunkHeight);
                    
                    // Trunk highlights
                    ctx.fillStyle = '#7A6350';
                    ctx.fillRect(tx - trunkWidth / 4, ty + trunkHeight * 0.1, trunkWidth / 3, trunkHeight * 0.8);
                    
                    // Multiple canopy layers for depth
                    const canopyColors = ['#4A6B30', '#5A7B40', '#6A8B50', '#5A7B40'];
                    
                    // Shadow layer
                    ctx.fillStyle = '#3A5020';
                    ctx.beginPath();
                    ctx.ellipse(tx + scale, ty + scale * 0.5, treeSize * 1.1, treeSize * 0.9, 0, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Main canopy (multiple overlapping circles)
                    for (let c = 0; c < 4; c++) {
                        const offsetX = (c === 1 ? -treeSize * 0.3 : c === 2 ? treeSize * 0.3 : 0);
                        const offsetY = (c === 3 ? treeSize * 0.25 : c === 0 ? -treeSize * 0.2 : 0);
                        const size = treeSize * (c === 0 ? 0.8 : 0.65);
                        
                        ctx.fillStyle = canopyColors[c];
                        ctx.beginPath();
                        ctx.arc(tx + offsetX, ty - treeSize * 0.3 + offsetY, size, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    
                    // Highlight spots (sunlit leaves)
                    ctx.fillStyle = '#8AA860';
                    ctx.beginPath();
                    ctx.arc(tx - treeSize * 0.2, ty - treeSize * 0.5, treeSize * 0.2, 0, Math.PI * 2);
                    ctx.arc(tx + treeSize * 0.1, ty - treeSize * 0.3, treeSize * 0.15, 0, Math.PI * 2);
                    ctx.fill();
                    
                } else {
                    // Simple tiny circle
                    // Trunk
                    ctx.strokeStyle = 'rgba(100,80,50,0.8)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(tx, ty);
                    ctx.lineTo(tx, ty + treeSize);
                    ctx.stroke();
                    
                    // Canopy
                    ctx.fillStyle = 'rgba(60,80,50,0.9)';
                    ctx.beginPath();
                    ctx.arc(tx, ty - treeSize * 0.3, treeSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }
    
    /**
     * Draw stone deposit with metal value coloring
     */
    private drawStoneDeposit(
        ctx: CanvasRenderingContext2D,
        px: number,
        py: number,
        T: number,
        metalValue: number
    ): void {
        const cx = px + T / 2;
        const cy = py + T * 0.7;
        const scale = T / 64;
        
        // Color based on metal value (gray -> blue -> purple -> gold)
        const minMetal = CFG.STONE_DEPOSITS.MIN_METAL;
        const maxMetal = CFG.STONE_DEPOSITS.MAX_METAL;
        const ratio = (metalValue - minMetal) / (maxMetal - minMetal);
        
        let r: number, g: number, b: number;
        if (ratio < 0.33) {
            // Gray to Blue
            const t = ratio / 0.33;
            r = Math.floor(120 + (80 - 120) * t);
            g = Math.floor(120 + (160 - 120) * t);
            b = Math.floor(120 + (240 - 120) * t);
        } else if (ratio < 0.66) {
            // Blue to Purple
            const t = (ratio - 0.33) / 0.33;
            r = Math.floor(80 + (180 - 80) * t);
            g = Math.floor(160 + (80 - 160) * t);
            b = Math.floor(240 + (200 - 240) * t);
        } else {
            // Purple to Gold
            const t = (ratio - 0.66) / 0.34;
            r = Math.floor(180 + (255 - 180) * t);
            g = Math.floor(80 + (215 - 80) * t);
            b = Math.floor(200 + (0 - 200) * t);
        }
        
        const baseColor = `rgb(${r},${g},${b})`;
        const darkColor = `rgb(${Math.floor(r * 0.6)},${Math.floor(g * 0.6)},${Math.floor(b * 0.6)})`;
        const lightColor = `rgb(${Math.min(255, Math.floor(r * 1.4))},${Math.min(255, Math.floor(g * 1.4))},${Math.min(255, Math.floor(b * 1.4))})`;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(cx + 4 * scale, cy + 10 * scale, 18 * scale, 8 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Main rock body - black outline
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 22 * scale, 20 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Main rock body - colored
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 20 * scale, 18 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Dark patch (bottom right)
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.ellipse(cx + 8 * scale, cy + 6 * scale, 8 * scale, 7 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Bright highlight (top left)
        ctx.fillStyle = lightColor;
        ctx.beginPath();
        ctx.ellipse(cx - 6 * scale, cy - 6 * scale, 8 * scale, 7 * scale, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Shine spot (Mario-style)
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.ellipse(cx - 8 * scale, cy - 8 * scale, 4 * scale, 3 * scale, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Smaller shine
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(cx + 4 * scale, cy - 4 * scale, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Draw sand texture with grain
     */
    drawGrain(ctx: CanvasRenderingContext2D, px: number, py: number, T: number): void {
        const scale = T / 64;
        ctx.fillStyle = 'rgba(180,160,120,0.3)';
        for (let i = 0; i < 5; i++) {
            const gx = px + Math.random() * T;
            const gy = py + Math.random() * T;
            ctx.beginPath();
            ctx.arc(gx, gy, scale, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    /**
     * Draw desirability heatmap overlay
     */
    drawDesirabilityOverlay(
        ctx: CanvasRenderingContext2D,
        px: number,
        py: number,
        T: number,
        desirability: number
    ): void {
        let r: number, g: number, b: number;
        const alpha = 0.5;
        
        if (desirability < 0.3) {
            r = 255;
            g = Math.floor(desirability * 850);
            b = 0;
        } else if (desirability < 0.7) {
            r = Math.floor(255 - (desirability - 0.3) * 600);
            g = 255;
            b = 0;
        } else if (desirability < 1.2) {
            r = 0;
            g = 255;
            b = Math.floor((desirability - 0.7) * 510);
        } else {
            r = 0;
            g = Math.floor(255 - (desirability - 1.2) * 200);
            b = 255;
        }
        
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fillRect(px, py, T, T);
    }
    
    /**
     * Draw elevation overlay for flood risk
     */
    drawElevationOverlay(
        ctx: CanvasRenderingContext2D,
        px: number,
        py: number,
        T: number,
        elevation: number,
        seaLevel: number,
        type: string
    ): void {
        const diff = elevation - seaLevel;
        let overlayColor: string;
        
        if (type === 'WATER' || type === 'DEEP' || type === 'RIVER') {
            overlayColor = 'rgba(0, 50, 150, 0.4)';
        } else if (diff < 0) {
            // BELOW SEA LEVEL - RED
            overlayColor = 'rgba(255, 0, 0, 0.5)';
        } else if (diff < 0.5) {
            // VERY HIGH RISK - ORANGE
            overlayColor = 'rgba(255, 100, 0, 0.45)';
        } else if (diff < 1.0) {
            // WARNING - YELLOW
            overlayColor = 'rgba(255, 200, 0, 0.4)';
        } else if (diff < 2.0) {
            // SAFE - GREEN
            overlayColor = 'rgba(0, 180, 0, 0.3)';
        } else {
            // HIGH GROUND - BLUE
            overlayColor = 'rgba(0, 100, 255, 0.25)';
        }
        
        ctx.fillStyle = overlayColor;
        ctx.fillRect(px, py, T, T);
        
        // Show elevation number
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(elevation.toFixed(1), px + T / 2, py + T / 2);
    }
}

// Export singleton instance
export const terrainRenderer = new TerrainRenderer();
