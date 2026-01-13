/**
 * Civil Zones - Game Renderer
 * Main rendering engine that draws the game world
 * Victorian Map Theme - Hand-drawn cartographic style
 */

import { TERRAIN_COLORS } from './colors.js';
import { terrainRenderer } from './terrain-renderer.js';
import { roadRenderer } from './road-renderer.js';
import { playerRenderer } from './player-renderer.js';
import { entityRenderer } from './entity-renderer.js';
import { buildingRenderer } from './building-renderer.js';
import type { Camera, Viewport, TileRange } from './camera.js';
import { getVisibleTileRange } from './camera.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface RenderTile {
    type: string;
    elevation: number;
    explored: boolean;
    road?: boolean;
    zone?: string;
    tree?: boolean;
    building?: unknown;
    entity?: unknown;
}

export interface RenderBuilding {
    t: string;      // Type
    x: number;
    y: number;
    lvl: number;
    pop?: number;
    variant?: number;
    efficiency?: number;
}

export interface RenderPlayer {
    x: number;
    y: number;
    direction: string;
    hp: number;
    maxHp: number;
    bashTime?: number;     // Timestamp when bash started
    walkCycle?: number;    // Walking animation cycle (0-2π)
    isMoving?: boolean;    // Whether player is currently walking
}

export interface RenderEntity {
    type: string;
    x: number;
    y: number;
    amount?: number;
}

export interface GameRenderState {
    tiles: RenderTile[][];
    buildings: RenderBuilding[];
    player: RenderPlayer | null;
    entities: RenderEntity[];
    animals: Array<{ 
        x: number; 
        y: number; 
        type: string; 
        hits: number;
        prevX?: number;
        prevY?: number;
        moveProgress?: number;
        walkCycle?: number;
        state?: string;
    }>;
    nomads: Array<{
        x: number;
        y: number;
        is_hostile: boolean;
        prevX?: number;
        prevY?: number;
        moveProgress?: number;
        walkCycle?: number;
        state: string;
    }>;
    wanderWells: Array<{ x: number; y: number }>;
    gamePhase: 'WANDER' | 'CITY';
    viewMode: string;
    year: number;
}

export interface RendererConfig {
    tileSize: number;
    mapWidth: number;
    mapHeight: number;
    showGrid: boolean;
    showFogOfWar: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GAME RENDERER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class GameRenderer {
    private ctx: CanvasRenderingContext2D;
    private config: RendererConfig;
    private time: number = 0;
    
    // Performance: Cache frequently used values
    private cachedPatterns: Map<string, CanvasPattern | null> = new Map();
    
    constructor(ctx: CanvasRenderingContext2D, config: RendererConfig) {
        this.ctx = ctx;
        this.config = config;
    }
    
    /**
     * Update map dimensions for expandable world
     */
    updateMapSize(width: number, height: number): void {
        this.config.mapWidth = width;
        this.config.mapHeight = height;
    }
    
    /**
     * Main render function - call this every frame
     */
    render(
        state: GameRenderState,
        camera: Camera,
        viewport: Viewport,
        deltaTime: number
    ): void {
        // Guard against invalid state
        if (!state.tiles || state.tiles.length === 0) return;
        
        // Increment time for animations - use a reasonable rate
        // Original: this.time += 0.05 at 30fps
        // We clamp deltaTime to prevent huge jumps
        const clampedDelta = Math.min(deltaTime, 100);
        this.time += clampedDelta * 0.0015;
        // Wrap to prevent overflow
        if (this.time > 10000) this.time = this.time % 10000;
        
        const ctx = this.ctx;
        const T = this.config.tileSize;
        
        // Get device pixel ratio for HiDPI handling
        const dpr = window.devicePixelRatio || 1;
        
        // Get visible tile range for culling
        const range = getVisibleTileRange(camera, viewport, T, this.config.mapWidth, this.config.mapHeight);
        
        // === CRITICAL: Reset ALL canvas state and apply DPR scaling ===
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#1a1512';  // Dark parchment background
        ctx.fillRect(0, 0, viewport.width * dpr, viewport.height * dpr);
        
        // Apply DPR scale first
        ctx.scale(dpr, dpr);
        
        // Apply camera transform
        ctx.translate(viewport.width / 2, viewport.height / 2);
        ctx.scale(camera.z, camera.z);
        ctx.translate(-camera.x, -camera.y);
        
        // Render layers in order
        // Check if we're in ELEVATION view mode
        if (state.viewMode === 'ELEVATION') {
            this.renderElevationView(state, range, T);
        } else {
            this.renderTerrain(state, range, T);
        }
        this.renderRoads(state, range, T);
        this.renderWanderWells(state, range, T);
        this.renderEntities(state, range, T);
        this.renderBuildings(state, range, T, camera);
        this.renderAnimals(state, range, T);
        this.renderNomads(state, range, T);  // Nomads on top of animals
        
        if (state.player) {
            this.renderPlayer(state.player, T);
        }
        
        this.renderFogOfWar(state, range, T);
        
        // Render rounded map edges (aged parchment border)
        this.renderMapEdges(T);
        
        if (this.config.showGrid && camera.z >= 1.0) {
            this.renderGrid(range, T);
        }
        
        // Reset transform at end (cleaner than save/restore)
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // MAP EDGES - Rounded corners with aged parchment vignette
    // PERFORMANCE: Skip when zoomed out (edges not visible anyway)
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Cache for edge gradients - avoid recreating every frame
    private edgeGradientCache: {
        tileSize: number;
        top?: CanvasGradient;
        bottom?: CanvasGradient;
        left?: CanvasGradient;
        right?: CanvasGradient;
    } = { tileSize: 0 };
    
    private renderMapEdges(T: number): void {
        const ctx = this.ctx;
        const mapW = this.config.mapWidth * T;
        const mapH = this.config.mapHeight * T;
        const cornerRadius = T * 8;
        const edgeFade = T * 6;
        
        // Rebuild gradient cache if tile size changed (zoom changed)
        if (this.edgeGradientCache.tileSize !== T) {
            this.edgeGradientCache.tileSize = T;
            
            const topGrad = ctx.createLinearGradient(0, 0, 0, edgeFade);
            topGrad.addColorStop(0, 'rgba(26, 21, 18, 0.9)');
            topGrad.addColorStop(0.3, 'rgba(26, 21, 18, 0.5)');
            topGrad.addColorStop(1, 'rgba(26, 21, 18, 0)');
            this.edgeGradientCache.top = topGrad;
            
            const bottomGrad = ctx.createLinearGradient(0, mapH, 0, mapH - edgeFade);
            bottomGrad.addColorStop(0, 'rgba(26, 21, 18, 0.9)');
            bottomGrad.addColorStop(0.3, 'rgba(26, 21, 18, 0.5)');
            bottomGrad.addColorStop(1, 'rgba(26, 21, 18, 0)');
            this.edgeGradientCache.bottom = bottomGrad;
            
            const leftGrad = ctx.createLinearGradient(0, 0, edgeFade, 0);
            leftGrad.addColorStop(0, 'rgba(26, 21, 18, 0.9)');
            leftGrad.addColorStop(0.3, 'rgba(26, 21, 18, 0.5)');
            leftGrad.addColorStop(1, 'rgba(26, 21, 18, 0)');
            this.edgeGradientCache.left = leftGrad;
            
            const rightGrad = ctx.createLinearGradient(mapW, 0, mapW - edgeFade, 0);
            rightGrad.addColorStop(0, 'rgba(26, 21, 18, 0.9)');
            rightGrad.addColorStop(0.3, 'rgba(26, 21, 18, 0.5)');
            rightGrad.addColorStop(1, 'rgba(26, 21, 18, 0)');
            this.edgeGradientCache.right = rightGrad;
        }
        
        // Use cached gradients
        ctx.fillStyle = this.edgeGradientCache.top!;
        ctx.fillRect(0, 0, mapW, edgeFade);
        
        ctx.fillStyle = this.edgeGradientCache.bottom!;
        ctx.fillRect(0, mapH - edgeFade, mapW, edgeFade);
        
        ctx.fillStyle = this.edgeGradientCache.left!;
        ctx.fillRect(0, 0, edgeFade, mapH);
        
        ctx.fillStyle = this.edgeGradientCache.right!;
        ctx.fillRect(mapW - edgeFade, 0, edgeFade, mapH);
        
        // Corner overlays (simple rectangles instead of expensive radial gradients)
        this.drawCornerVignette(ctx, 0, 0, cornerRadius, 'top-left');
        this.drawCornerVignette(ctx, mapW, 0, cornerRadius, 'top-right');
        this.drawCornerVignette(ctx, 0, mapH, cornerRadius, 'bottom-left');
        this.drawCornerVignette(ctx, mapW, mapH, cornerRadius, 'bottom-right');
        
        // Decorative border line
        ctx.strokeStyle = 'rgba(139, 105, 20, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(T * 2, T * 2, mapW - T * 4, mapH - T * 4, cornerRadius - T * 2);
        ctx.stroke();
        
        // Inner gold highlight line
        ctx.strokeStyle = 'rgba(212, 160, 64, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(T * 3, T * 3, mapW - T * 6, mapH - T * 6, cornerRadius - T * 3);
        ctx.stroke();
    }
    
    private drawCornerVignette(
        ctx: CanvasRenderingContext2D, 
        x: number, 
        y: number, 
        radius: number,
        corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    ): void {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.5);
        gradient.addColorStop(0, 'rgba(26, 21, 18, 0.95)');
        gradient.addColorStop(0.4, 'rgba(26, 21, 18, 0.6)');
        gradient.addColorStop(0.7, 'rgba(26, 21, 18, 0.2)');
        gradient.addColorStop(1, 'rgba(26, 21, 18, 0)');
        
        ctx.fillStyle = gradient;
        
        // Draw a quarter circle for the corner
        ctx.beginPath();
        switch (corner) {
            case 'top-left':
                ctx.moveTo(x, y);
                ctx.lineTo(x + radius * 1.5, y);
                ctx.lineTo(x + radius * 1.5, y + radius * 1.5);
                ctx.lineTo(x, y + radius * 1.5);
                break;
            case 'top-right':
                ctx.moveTo(x, y);
                ctx.lineTo(x - radius * 1.5, y);
                ctx.lineTo(x - radius * 1.5, y + radius * 1.5);
                ctx.lineTo(x, y + radius * 1.5);
                break;
            case 'bottom-left':
                ctx.moveTo(x, y);
                ctx.lineTo(x + radius * 1.5, y);
                ctx.lineTo(x + radius * 1.5, y - radius * 1.5);
                ctx.lineTo(x, y - radius * 1.5);
                break;
            case 'bottom-right':
                ctx.moveTo(x, y);
                ctx.lineTo(x - radius * 1.5, y);
                ctx.lineTo(x - radius * 1.5, y - radius * 1.5);
                ctx.lineTo(x, y - radius * 1.5);
                break;
        }
        ctx.closePath();
        ctx.fill();
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ELEVATION VIEW - Topographic map style
    // ═══════════════════════════════════════════════════════════════════════════
    
    private renderElevationView(state: GameRenderState, range: TileRange, T: number): void {
        const ctx = this.ctx;
        const { startCol, endCol, startRow, endRow } = range;
        
        for (let x = startCol; x <= endCol; x++) {
            for (let y = startRow; y <= endRow; y++) {
                const tile = state.tiles[x]?.[y];
                if (!tile) continue;
                
                const px = x * T;
                const py = y * T;
                
                if (!tile.explored) {
                    ctx.fillStyle = '#2A2520';
                    ctx.fillRect(px, py, T, T);
                    continue;
                }
                
                // Elevation color gradient - low (blue/green) to high (brown/white)
                const elev = tile.elevation;
                let color: string;
                
                if (tile.type === 'WATER' || tile.type === 'RIVER' || tile.type === 'DEEP') {
                    // Water - blue tones based on depth
                    const depth = 1 - elev;
                    const r = Math.floor(30 + depth * 30);
                    const g = Math.floor(60 + depth * 60);
                    const b = Math.floor(120 + depth * 80);
                    color = `rgb(${r},${g},${b})`;
                } else if (elev < 0.2) {
                    // Low - green marsh
                    color = `rgb(60,${Math.floor(100 + elev * 200)},60)`;
                } else if (elev < 0.4) {
                    // Low-mid - yellow-green
                    const t = (elev - 0.2) / 0.2;
                    color = `rgb(${Math.floor(60 + t * 100)},${Math.floor(140 + t * 60)},${Math.floor(60 - t * 30)})`;
                } else if (elev < 0.6) {
                    // Mid - tan/brown
                    const t = (elev - 0.4) / 0.2;
                    color = `rgb(${Math.floor(160 + t * 40)},${Math.floor(140 - t * 20)},${Math.floor(80 - t * 20)})`;
                } else if (elev < 0.8) {
                    // High - brown/gray
                    const t = (elev - 0.6) / 0.2;
                    color = `rgb(${Math.floor(140 - t * 20)},${Math.floor(120 - t * 20)},${Math.floor(100 + t * 20)})`;
                } else {
                    // Peak - white/snow
                    const t = (elev - 0.8) / 0.2;
                    const v = Math.floor(180 + t * 75);
                    color = `rgb(${v},${v},${Math.floor(v + 10)})`;
                }
                
                ctx.fillStyle = color;
                ctx.fillRect(px, py, T, T);
                
                // Contour lines every 0.1 elevation
                const elevBand = Math.floor(elev * 10);
                const nextTileE = state.tiles[x + 1]?.[y]?.elevation ?? elev;
                const belowTileE = state.tiles[x]?.[y + 1]?.elevation ?? elev;
                
                if (Math.floor(nextTileE * 10) !== elevBand || Math.floor(belowTileE * 10) !== elevBand) {
                    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    if (Math.floor(nextTileE * 10) !== elevBand) {
                        ctx.moveTo(px + T, py);
                        ctx.lineTo(px + T, py + T);
                    }
                    if (Math.floor(belowTileE * 10) !== elevBand) {
                        ctx.moveTo(px, py + T);
                        ctx.lineTo(px + T, py + T);
                    }
                    ctx.stroke();
                }
                
                // Show elevation value on every 5th tile (sparse grid)
                if (x % 5 === 0 && y % 5 === 0 && T > 20) {
                    const elevValue = Math.floor(elev * 100);
                    ctx.font = `bold ${Math.max(8, T * 0.25)}px monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    // Dark outline for readability
                    ctx.fillStyle = 'rgba(0,0,0,0.6)';
                    ctx.fillText(String(elevValue), px + T/2 + 1, py + T/2 + 1);
                    // White text
                    ctx.fillStyle = elev > 0.5 ? '#FFF' : '#222';
                    ctx.fillText(String(elevValue), px + T/2, py + T/2);
                }
            }
        }
        
        // Draw legend in corner
        this.drawElevationLegend();
    }
    
    private drawElevationLegend(): void {
        const ctx = this.ctx;
        const legendX = 20;
        const legendY = 80;
        const legendW = 30;
        const legendH = 150;
        
        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(legendX - 5, legendY - 25, legendW + 50, legendH + 35);
        
        // Title
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'left';
        ctx.fillText('Elevation', legendX, legendY - 10);
        
        // Gradient bar
        const gradient = ctx.createLinearGradient(0, legendY + legendH, 0, legendY);
        gradient.addColorStop(0, 'rgb(60,100,60)');     // Low - green
        gradient.addColorStop(0.2, 'rgb(160,200,30)');  // Yellow-green
        gradient.addColorStop(0.4, 'rgb(200,160,60)');  // Tan
        gradient.addColorStop(0.6, 'rgb(140,120,100)'); // Brown
        gradient.addColorStop(0.8, 'rgb(180,180,190)'); // Gray
        gradient.addColorStop(1.0, 'rgb(255,255,255)'); // White peak
        
        ctx.fillStyle = gradient;
        ctx.fillRect(legendX, legendY, legendW, legendH);
        
        // Border
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(legendX, legendY, legendW, legendH);
        
        // Labels
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'left';
        ctx.fillText('100', legendX + legendW + 5, legendY + 5);
        ctx.fillText('50', legendX + legendW + 5, legendY + legendH/2);
        ctx.fillText('0', legendX + legendW + 5, legendY + legendH - 2);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TERRAIN RENDERING - Victorian Map Style
    // ═══════════════════════════════════════════════════════════════════════════
    
    private renderTerrain(state: GameRenderState, range: TileRange, T: number): void {
        const ctx = this.ctx;
        const { startCol, endCol, startRow, endRow } = range;
        
        // Update terrain renderer animation time
        terrainRenderer.update(0.016); // ~60fps delta
        
        for (let x = startCol; x <= endCol; x++) {
            for (let y = startRow; y <= endRow; y++) {
                const tile = state.tiles[x]?.[y];
                if (!tile) continue;
                
                // Deterministic seed for consistent variation
                const seed = (x * 7 + y * 13) % 100;
                
                // Use the Victorian terrain renderer
                terrainRenderer.drawTile(ctx, {
                    type: tile.type,
                    elevation: tile.elevation,
                    explored: tile.explored,
                    tree: tile.tree
                }, x, y, T, seed);
            }
        }
        
        // Second pass: Smooth terrain transitions (elevation and type boundaries)
        this.renderTerrainTransitions(state, range, T);
        
        // Third pass: Smooth water edges with rounded transitions
        this.renderWaterEdges(state, range, T);
    }
    
    // Smooth terrain transitions - organic rounded edges between different terrain types
    private renderTerrainTransitions(state: GameRenderState, range: TileRange, T: number): void {
        const ctx = this.ctx;
        const { startCol, endCol, startRow, endRow } = range;
        
        // Define terrain priority (higher = more prominent, extends into lower)
        const terrainPriority: Record<string, number> = {
            'STONE': 5, 'ROCK': 5,
            'SAND': 4,
            'SNOW': 3,
            'FOREST': 2, 'PINE': 2,
            'GRASS': 1,
            'EARTH': 0
        };
        
        // Colors for blend edges
        const blendColors: Record<string, string> = {
            'STONE': '#6B5D4C', 'ROCK': '#7A6B58',
            'SAND': '#D4C4A8',
            'SNOW': '#E8E8E0',
            'FOREST': '#A8B888', 'PINE': '#7A9868',
            'GRASS': '#C9D4A0',
            'EARTH': '#B8A080'
        };
        
        for (let x = startCol; x <= endCol; x++) {
            for (let y = startRow; y <= endRow; y++) {
                const tile = state.tiles[x]?.[y];
                if (!tile?.explored) continue;
                
                // Skip water tiles (handled separately)
                if (['WATER', 'RIVER', 'DEEP'].includes(tile.type)) continue;
                
                const myPriority = terrainPriority[tile.type] ?? 0;
                const px = x * T;
                const py = y * T;
                const seed = (x * 7 + y * 13) % 100;
                
                // Check all 4 neighbors
                const neighbors = [
                    { tile: state.tiles[x]?.[y - 1], dir: 'up' },
                    { tile: state.tiles[x]?.[y + 1], dir: 'down' },
                    { tile: state.tiles[x - 1]?.[y], dir: 'left' },
                    { tile: state.tiles[x + 1]?.[y], dir: 'right' }
                ];
                
                for (const { tile: neighbor, dir } of neighbors) {
                    if (!neighbor?.explored) continue;
                    if (['WATER', 'RIVER', 'DEEP'].includes(neighbor.type)) continue;
                    
                    const neighborPriority = terrainPriority[neighbor.type] ?? 0;
                    
                    // Professional terrain blending - simple feathered edge strips
                    // Like Civilization, Age of Empires - clean alpha gradients
                    if (neighborPriority > myPriority) {
                        const blendColor = blendColors[neighbor.type] || '#C9D4A0';
                        const edgeWidth = T * 0.35; // 35% of tile for soft blend
                        
                        // Create gradient for smooth transition
                        let grad: CanvasGradient;
                        
                        if (dir === 'up') {
                            grad = ctx.createLinearGradient(px, py, px, py + edgeWidth);
                            grad.addColorStop(0, blendColor);
                            grad.addColorStop(1, 'transparent');
                            ctx.fillStyle = grad;
                            ctx.globalAlpha = 0.5;
                            ctx.fillRect(px, py, T, edgeWidth);
                        } else if (dir === 'down') {
                            grad = ctx.createLinearGradient(px, py + T, px, py + T - edgeWidth);
                            grad.addColorStop(0, blendColor);
                            grad.addColorStop(1, 'transparent');
                            ctx.fillStyle = grad;
                            ctx.globalAlpha = 0.5;
                            ctx.fillRect(px, py + T - edgeWidth, T, edgeWidth);
                        } else if (dir === 'left') {
                            grad = ctx.createLinearGradient(px, py, px + edgeWidth, py);
                            grad.addColorStop(0, blendColor);
                            grad.addColorStop(1, 'transparent');
                            ctx.fillStyle = grad;
                            ctx.globalAlpha = 0.5;
                            ctx.fillRect(px, py, edgeWidth, T);
                        } else if (dir === 'right') {
                            grad = ctx.createLinearGradient(px + T, py, px + T - edgeWidth, py);
                            grad.addColorStop(0, blendColor);
                            grad.addColorStop(1, 'transparent');
                            ctx.fillStyle = grad;
                            ctx.globalAlpha = 0.5;
                            ctx.fillRect(px + T - edgeWidth, py, edgeWidth, T);
                        }
                        
                        ctx.globalAlpha = 1.0;
                    }
                }
            }
        }
    }
    
    // Smooth water edges - draw rounded transitions where water meets land
    private renderWaterEdges(state: GameRenderState, range: TileRange, T: number): void {
        const ctx = this.ctx;
        const { startCol, endCol, startRow, endRow } = range;
        const waterTypes = ['WATER', 'RIVER', 'DEEP'];
        
        for (let x = startCol; x <= endCol; x++) {
            for (let y = startRow; y <= endRow; y++) {
                const tile = state.tiles[x]?.[y];
                if (!tile?.explored) continue;
                
                // Only process water tiles
                if (!waterTypes.includes(tile.type)) continue;
                
                const px = x * T;
                const py = y * T;
                
                // Check neighbors for land
                const up = state.tiles[x]?.[y - 1];
                const down = state.tiles[x]?.[y + 1];
                const left = state.tiles[x - 1]?.[y];
                const right = state.tiles[x + 1]?.[y];
                
                const upIsLand = up && !waterTypes.includes(up.type);
                const downIsLand = down && !waterTypes.includes(down.type);
                const leftIsLand = left && !waterTypes.includes(left.type);
                const rightIsLand = right && !waterTypes.includes(right.type);
                
                // PERFORMANCE: Use simple alpha fill instead of expensive gradients per tile
                // Sandy shore color with transparency
                ctx.fillStyle = 'rgba(196, 184, 150, 0.35)';
                
                if (upIsLand) {
                    ctx.fillRect(px, py, T, T * 0.25);
                }
                if (downIsLand) {
                    ctx.fillRect(px, py + T * 0.75, T, T * 0.25);
                }
                if (leftIsLand) {
                    ctx.fillRect(px, py, T * 0.25, T);
                }
                if (rightIsLand) {
                    ctx.fillRect(px + T * 0.75, py, T * 0.25, T);
                }
            }
        }
    }
    
    private getTerrainColor(type: string, elevation: number): string {
        // Type-based colors with elevation-driven variation like a topographic map
        
        // Special handling for water types
        if (type === 'WATER' || type === 'RIVER' || type === 'DEEP') {
            const depth = Math.max(0, 0.5 - elevation);
            const r = Math.floor(40 + depth * 40);
            const g = Math.floor(80 + depth * 60);
            const b = Math.floor(140 + depth * 80);
            return `rgb(${r},${g},${b})`;
        }
        
        // Apply topographic color variation to land
        if (type === 'GRASS' || type === 'EARTH' || type === 'SAVANNA') {
            if (elevation < 0.15) {
                // Very low - marsh green
                return `rgb(70,${Math.floor(110 + elevation * 200)},65)`;
            } else if (elevation < 0.3) {
                // Low - lush green
                const t = (elevation - 0.15) / 0.15;
                return `rgb(${Math.floor(70 + t * 30)},${Math.floor(130 + t * 30)},${Math.floor(50 + t * 20)})`;
            } else if (elevation < 0.5) {
                // Mid - yellow-green to tan
                const t = (elevation - 0.3) / 0.2;
                return `rgb(${Math.floor(100 + t * 60)},${Math.floor(140 - t * 10)},${Math.floor(60 - t * 20)})`;
            } else if (elevation < 0.7) {
                // High - tan/brown highlands
                const t = (elevation - 0.5) / 0.2;
                return `rgb(${Math.floor(160 - t * 20)},${Math.floor(130 - t * 20)},${Math.floor(80 + t * 20)})`;
            } else {
                // Very high - rocky gray
                const t = (elevation - 0.7) / 0.3;
                const v = Math.floor(130 + t * 50);
                return `rgb(${v},${Math.floor(v - 5)},${Math.floor(v + 10)})`;
            }
        }
        
        // Sand gets lighter at higher elevations (dunes)
        if (type === 'SAND' || type === 'BEACH') {
            const brightness = Math.floor(200 + elevation * 40);
            return `rgb(${brightness},${Math.floor(brightness - 20)},${Math.floor(brightness - 60)})`;
        }
        
        // Stone/rock - darker at low elevation, lighter at peaks
        if (type === 'STONE' || type === 'ROCK') {
            const v = Math.floor(100 + elevation * 80);
            return `rgb(${v},${Math.floor(v - 10)},${Math.floor(v - 5)})`;
        }
        
        // Default - use base color with subtle shading
        const baseColor = TERRAIN_COLORS[type as keyof typeof TERRAIN_COLORS] || TERRAIN_COLORS.GRASS;
        const shade = Math.floor((elevation - 0.5) * 30);
        return this.adjustBrightness(baseColor, shade);
    }
    
    private adjustBrightness(hex: string, amount: number): string {
        // Simple brightness adjustment
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, Math.max(0, (num >> 16) + amount));
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
        const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
        return `rgb(${r},${g},${b})`;
    }
    
    private drawTree(x: number, y: number, T: number): void {
        const ctx = this.ctx;
        const cx = x + T / 2;
        const cy = y + T / 2;
        
        // Simple triangle tree
        ctx.fillStyle = '#4A6B3A';
        ctx.beginPath();
        ctx.moveTo(cx, cy - T * 0.35);
        ctx.lineTo(cx - T * 0.25, cy + T * 0.2);
        ctx.lineTo(cx + T * 0.25, cy + T * 0.2);
        ctx.closePath();
        ctx.fill();
        
        // Trunk
        ctx.fillStyle = '#5A4030';
        ctx.fillRect(cx - T * 0.05, cy + T * 0.15, T * 0.1, T * 0.15);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ROAD RENDERING - Realistic connected paths
    // ═══════════════════════════════════════════════════════════════════════════
    
    private renderRoads(state: GameRenderState, range: TileRange, T: number): void {
        const ctx = this.ctx;
        const { startCol, endCol, startRow, endRow } = range;
        
        for (let x = startCol; x <= endCol; x++) {
            for (let y = startRow; y <= endRow; y++) {
                const tile = state.tiles[x]?.[y];
                if (!tile?.road) continue;
                
                // Get neighbor connections
                const neighbors = roadRenderer.getNeighbors(
                    state.tiles,
                    x,
                    y,
                    this.config.mapWidth,
                    this.config.mapHeight
                );
                
                // Draw connected road segment
                roadRenderer.drawRoad(ctx, x, y, T, neighbors);
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // WANDER WELLS - Proper stone wells built during exploration
    // ═══════════════════════════════════════════════════════════════════════════
    
    private renderWanderWells(state: GameRenderState, range: TileRange, T: number): void {
        if (!state.wanderWells || state.wanderWells.length === 0) return;
        
        const ctx = this.ctx;
        
        for (const well of state.wanderWells) {
            // Skip if not in visible range
            if (well.x < range.startCol || well.x > range.endCol ||
                well.y < range.startRow || well.y > range.endRow) continue;
            
            // Skip if not explored
            const tile = state.tiles[well.x]?.[well.y];
            if (!tile?.explored) continue;
            
            const px = well.x * T;
            const py = well.y * T;
            const cx = px + T / 2;
            const cy = py + T / 2;
            
            // Draw proper stone well - round stone structure
            // Stone base/shadow
            ctx.fillStyle = '#3a3530';
            ctx.beginPath();
            ctx.ellipse(cx, cy + T * 0.05, T * 0.38, T * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Stone wall outer ring
            ctx.fillStyle = '#8B7355';
            ctx.beginPath();
            ctx.ellipse(cx, cy, T * 0.35, T * 0.22, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Stone wall inner ring (darker)
            ctx.fillStyle = '#6B5344';
            ctx.beginPath();
            ctx.ellipse(cx, cy, T * 0.28, T * 0.18, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Dark well hole
            ctx.fillStyle = '#1a1a2a';
            ctx.beginPath();
            ctx.ellipse(cx, cy, T * 0.2, T * 0.12, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Water inside the well
            ctx.fillStyle = '#4A90B8';
            ctx.beginPath();
            ctx.ellipse(cx, cy + T * 0.02, T * 0.18, T * 0.1, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Water shimmer
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.ellipse(cx - T * 0.05, cy, T * 0.06, T * 0.03, -Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Stone texture bumps on the rim
            ctx.fillStyle = '#9A8A7A';
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const sx = cx + Math.cos(angle) * T * 0.32;
                const sy = cy + Math.sin(angle) * T * 0.19;
                ctx.beginPath();
                ctx.arc(sx, sy, T * 0.04, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Well post (wooden)
            ctx.fillStyle = '#5C4033';
            ctx.fillRect(cx + T * 0.25, cy - T * 0.35, T * 0.06, T * 0.4);
            ctx.fillRect(cx - T * 0.31, cy - T * 0.35, T * 0.06, T * 0.4);
            
            // Cross beam
            ctx.fillStyle = '#4A3528';
            ctx.fillRect(cx - T * 0.32, cy - T * 0.38, T * 0.64, T * 0.05);
            
            // Rope/bucket hint
            ctx.strokeStyle = '#8B7355';
            ctx.lineWidth = T * 0.02;
            ctx.beginPath();
            ctx.moveTo(cx, cy - T * 0.35);
            ctx.lineTo(cx, cy - T * 0.1);
            ctx.stroke();
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ENTITY RENDERING (Berries only now - nomads moved to separate array)
    // ═══════════════════════════════════════════════════════════════════════════
    
    private renderEntities(state: GameRenderState, range: TileRange, T: number): void {
        const ctx = this.ctx;
        
        for (const entity of state.entities) {
            if (entity.x < range.startCol || entity.x > range.endCol ||
                entity.y < range.startRow || entity.y > range.endRow) continue;
            
            if (entity.type === 'BERRY') {
                // Yoshi's Island style cute berries
                entityRenderer.drawBerry(
                    ctx,
                    entity.x,
                    entity.y,
                    T,
                    false // is_poisonous - would come from entity data
                );
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // NOMAD RENDERING - Walking stick figures that chase animals!
    // ═══════════════════════════════════════════════════════════════════════════
    
    private renderNomads(state: GameRenderState, range: TileRange, T: number): void {
        const ctx = this.ctx;
        
        for (const nomad of state.nomads) {
            // Smooth interpolated position for classic walking feel
            let renderX = nomad.x;
            let renderY = nomad.y;
            
            if (nomad.prevX !== undefined && nomad.prevY !== undefined && 
                nomad.moveProgress !== undefined && nomad.moveProgress < 1) {
                // Linear interpolation for smooth gliding movement
                const t = nomad.moveProgress;
                renderX = nomad.prevX + (nomad.x - nomad.prevX) * t;
                renderY = nomad.prevY + (nomad.y - nomad.prevY) * t;
            }
            
            if (renderX < range.startCol - 1 || renderX > range.endCol + 1 ||
                renderY < range.startRow - 1 || renderY > range.endRow + 1) continue;
            
            // Draw nomad with walking animation - pass isHostile for red indicator!
            entityRenderer.drawWalkingNomad(
                ctx, renderX, renderY, T, 
                performance.now(), 
                nomad.walkCycle || 0,
                nomad.state === 'CHASING',
                nomad.is_hostile
            );
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // BUILDING RENDERING - Using BuildingRenderer
    // ═══════════════════════════════════════════════════════════════════════════
    
    private renderBuildings(state: GameRenderState, range: TileRange, T: number, camera: Camera): void {
        // Update building renderer animation time
        buildingRenderer.update(0.016); // ~60fps delta
        
        for (const b of state.buildings) {
            if (b.x < range.startCol - 2 || b.x > range.endCol + 2 ||
                b.y < range.startRow - 2 || b.y > range.endRow + 2) continue;
            
            // Use the detailed building renderer
            buildingRenderer.drawBuilding(this.ctx, {
                t: b.t,
                x: b.x,
                y: b.y,
                lvl: b.lvl,
                variant: b.variant,
                pop: b.pop,
                efficiency: b.efficiency
            }, T);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ANIMAL RENDERING
    // ═══════════════════════════════════════════════════════════════════════════
    
    private renderAnimals(state: GameRenderState, range: TileRange, T: number): void {
        const ctx = this.ctx;
        
        for (const animal of state.animals) {
            // Smooth interpolated position for classic walking feel
            let renderX = animal.x;
            let renderY = animal.y;
            
            if (animal.prevX !== undefined && animal.prevY !== undefined && 
                animal.moveProgress !== undefined && animal.moveProgress < 1) {
                // Linear interpolation for smooth gliding movement
                const t = animal.moveProgress;
                renderX = animal.prevX + (animal.x - animal.prevX) * t;
                renderY = animal.prevY + (animal.y - animal.prevY) * t;
            }
            
            if (renderX < range.startCol - 1 || renderX > range.endCol + 1 ||
                renderY < range.startRow - 1 || renderY > range.endRow + 1) continue;
            
            // Use entityRenderer for detailed animal drawings
            const animTime = performance.now();
            const walkCycle = animal.walkCycle || 0;
            const isFleeing = animal.state === 'FLEEING';
            
            switch (animal.type) {
                case 'DEER':
                    entityRenderer.drawWalkingDeer(ctx, renderX, renderY, T, animTime, walkCycle, isFleeing);
                    break;
                case 'TURTLE':
                    entityRenderer.drawTurtle(ctx, renderX, renderY, T);
                    break;
                case 'BOAR':
                    entityRenderer.drawWalkingBoar(ctx, renderX, renderY, T, animTime, walkCycle, isFleeing);
                    break;
                case 'RABBIT':
                    entityRenderer.drawWalkingRabbit(ctx, renderX, renderY, T, animTime, walkCycle, isFleeing);
                    break;
                case 'MAMMOTH':
                    entityRenderer.drawWalkingMammoth(ctx, renderX, renderY, T, animTime, walkCycle, isFleeing);
                    break;
                case 'BISON':
                    entityRenderer.drawWalkingBison(ctx, renderX, renderY, T, animTime, walkCycle, isFleeing);
                    break;
                case 'WOLF':
                    entityRenderer.drawWalkingWolf(ctx, renderX, renderY, T, animTime, walkCycle, isFleeing);
                    break;
                case 'FOX':
                    entityRenderer.drawWalkingFox(ctx, renderX, renderY, T, animTime, walkCycle, isFleeing);
                    break;
                case 'BEAR':
                    entityRenderer.drawWalkingBear(ctx, renderX, renderY, T, animTime, walkCycle, isFleeing);
                    break;
                case 'FISH':
                    entityRenderer.drawFish(ctx, renderX, renderY, T, animTime);
                    break;
                // NEW ANIMALS!
                case 'ELK':
                    entityRenderer.drawWalkingElk(ctx, renderX, renderY, T, animTime, walkCycle, isFleeing);
                    break;
                case 'GOAT':
                    entityRenderer.drawWalkingGoat(ctx, renderX, renderY, T, animTime, walkCycle, isFleeing);
                    break;
                case 'SHEEP':
                    entityRenderer.drawWalkingSheep(ctx, renderX, renderY, T, animTime, walkCycle, isFleeing);
                    break;
                case 'MOOSE':
                    entityRenderer.drawWalkingMoose(ctx, renderX, renderY, T, animTime, walkCycle, isFleeing);
                    break;
                case 'BIRD':
                    entityRenderer.drawWalkingBird(ctx, renderX, renderY, T, animTime, walkCycle, isFleeing);
                    break;
                case 'LLAMA':
                    entityRenderer.drawWalkingLlama(ctx, renderX, renderY, T, animTime, walkCycle, isFleeing);
                    break;
                default:
                    // Fallback ellipse for unknown types
                    const px = renderX * T + T / 2;
                    const py = renderY * T + T / 2;
                    ctx.fillStyle = '#8B7355';
                    ctx.beginPath();
                    ctx.ellipse(px, py, T * 0.2, T * 0.15, 0, 0, Math.PI * 2);
                    ctx.fill();
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PLAYER RENDERING - Logical Larry the cute caveman
    // ═══════════════════════════════════════════════════════════════════════════
    
    private renderPlayer(player: RenderPlayer, T: number): void {
        const ctx = this.ctx;
        
        // Use the detailed player renderer for Logical Larry
        playerRenderer.drawPlayer(ctx, {
            x: player.x,
            y: player.y,
            direction: player.direction as 'up' | 'down' | 'left' | 'right',
            hp: player.hp,
            maxHp: player.maxHp,
            bashTime: player.bashTime,
            walkCycle: player.walkCycle,
            isMoving: player.isMoving
        }, T, performance.now());
        
        // Draw health bar if damaged
        if (player.hp < player.maxHp) {
            playerRenderer.drawHealthBar(ctx, {
                x: player.x,
                y: player.y,
                direction: player.direction as 'up' | 'down' | 'left' | 'right',
                hp: player.hp,
                maxHp: player.maxHp
            }, T);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // FOG OF WAR - Classic Thought Bubble Style (Like Comic Books!)
    // ═══════════════════════════════════════════════════════════════════════════
    
    private renderFogOfWar(state: GameRenderState, range: TileRange, T: number): void {
        if (!this.config.showFogOfWar) return;
        
        const ctx = this.ctx;
        const { startCol, endCol, startRow, endRow } = range;
        
        // First pass: Solid fog for unexplored tiles (dark background)
        ctx.fillStyle = 'rgba(30, 25, 20, 0.98)';
        for (let x = startCol; x <= endCol; x++) {
            for (let y = startRow; y <= endRow; y++) {
                const tile = state.tiles[x]?.[y];
                if (!tile?.explored) {
                    ctx.fillRect(x * T, y * T, T, T);
                }
            }
        }
        
        // PERFORMANCE: Simplified fog boundary - single pass with fewer circles
        // ═══════════════════════════════════════════════════════════════════════════
        // THOUGHT BUBBLE FOG - Comic book style cloud puffs
        // ═══════════════════════════════════════════════════════════════════════════
        
        const bubbleRadius = T * 0.45; // Size of each bubble puff
        const fogColor = 'rgba(55, 48, 42, 0.95)'; // Slightly lighter for cloud look
        const bubbleHighlight = 'rgba(75, 68, 62, 0.9)'; // Subtle highlight
        
        // Collect all fog boundary positions
        const boundaryPoints: Array<{x: number, y: number, dirs: number[]}> = [];
        
        for (let x = startCol; x <= endCol; x++) {
            for (let y = startRow; y <= endRow; y++) {
                const tile = state.tiles[x]?.[y];
                if (!tile?.explored) continue;
                
                const cx = x * T + T / 2;
                const cy = y * T + T / 2;
                
                // Check each direction for fog
                const fogUp = !state.tiles[x]?.[y - 1]?.explored;
                const fogDown = !state.tiles[x]?.[y + 1]?.explored;
                const fogLeft = !state.tiles[x - 1]?.[y]?.explored;
                const fogRight = !state.tiles[x + 1]?.[y]?.explored;
                
                if (fogUp || fogDown || fogLeft || fogRight) {
                    const dirs: number[] = [];
                    if (fogUp) dirs.push(0);    // up
                    if (fogRight) dirs.push(1); // right
                    if (fogDown) dirs.push(2);  // down
                    if (fogLeft) dirs.push(3);  // left
                    boundaryPoints.push({x: cx, y: cy, dirs});
                }
            }
        }
        
        // Draw layered thought bubble puffs
        // Layer 1: Outer glow/shadow
        ctx.fillStyle = 'rgba(30, 25, 20, 0.6)';
        for (const pt of boundaryPoints) {
            for (const d of pt.dirs) {
                const offset = T * 0.4;
                const ox = d === 1 ? offset : d === 3 ? -offset : 0;
                const oy = d === 2 ? offset : d === 0 ? -offset : 0;
                // Main bubble
                ctx.beginPath();
                ctx.arc(pt.x + ox, pt.y + oy, bubbleRadius + 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Layer 2: Main cloud puffs
        ctx.fillStyle = fogColor;
        for (const pt of boundaryPoints) {
            // Center puff
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, bubbleRadius * 0.8, 0, Math.PI * 2);
            ctx.fill();
            
            // Edge puffs towards fog
            for (const d of pt.dirs) {
                const offset = T * 0.35;
                const ox = d === 1 ? offset : d === 3 ? -offset : 0;
                const oy = d === 2 ? offset : d === 0 ? -offset : 0;
                
                // Main direction puff
                ctx.beginPath();
                ctx.arc(pt.x + ox, pt.y + oy, bubbleRadius, 0, Math.PI * 2);
                ctx.fill();
                
                // Corner puffs for rounder look
                const cornerOff = T * 0.25;
                if (d === 0 || d === 2) {
                    ctx.beginPath();
                    ctx.arc(pt.x - cornerOff, pt.y + oy * 0.7, bubbleRadius * 0.7, 0, Math.PI * 2);
                    ctx.arc(pt.x + cornerOff, pt.y + oy * 0.7, bubbleRadius * 0.7, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.beginPath();
                    ctx.arc(pt.x + ox * 0.7, pt.y - cornerOff, bubbleRadius * 0.7, 0, Math.PI * 2);
                    ctx.arc(pt.x + ox * 0.7, pt.y + cornerOff, bubbleRadius * 0.7, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        
        // Layer 3: Subtle highlights on bubbles (gives 3D depth)
        ctx.fillStyle = bubbleHighlight;
        for (const pt of boundaryPoints) {
            for (const d of pt.dirs) {
                const offset = T * 0.3;
                const ox = d === 1 ? offset : d === 3 ? -offset : 0;
                const oy = d === 2 ? offset : d === 0 ? -offset : 0;
                ctx.beginPath();
                ctx.arc(pt.x + ox - 2, pt.y + oy - 2, bubbleRadius * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // GRID OVERLAY
    // ═══════════════════════════════════════════════════════════════════════════
    
    private renderGrid(range: TileRange, T: number): void {
        const ctx = this.ctx;
        const { startCol, endCol, startRow, endRow } = range;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 0.5;
        
        ctx.beginPath();
        for (let x = startCol; x <= endCol + 1; x++) {
            ctx.moveTo(x * T, startRow * T);
            ctx.lineTo(x * T, (endRow + 1) * T);
        }
        for (let y = startRow; y <= endRow + 1; y++) {
            ctx.moveTo(startCol * T, y * T);
            ctx.lineTo((endCol + 1) * T, y * T);
        }
        ctx.stroke();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

export function createGameRenderer(
    ctx: CanvasRenderingContext2D,
    config?: Partial<RendererConfig>
): GameRenderer {
    const defaultConfig: RendererConfig = {
        tileSize: 48,
        mapWidth: 500,   // Starting size - expandable to 2000!
        mapHeight: 500,
        showGrid: true,
        showFogOfWar: true
    };
    
    return new GameRenderer(ctx, { ...defaultConfig, ...config });
}
