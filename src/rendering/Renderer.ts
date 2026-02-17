/**
 * Main Renderer
 * Orchestrates drawing the game world with Sega Genesis-style graphics.
 * Features: isometric tiles, dithering, highlight/shadow edges, retro aesthetic
 */

import type { Camera } from './Camera';
import type { ChunkManager } from '../world/ChunkManager';
import type { Player } from '../world/Player';
import type { BuildingManager } from '../world/BuildingManager';
import type { EntityManager } from '../world/Entity';
import { TILE_WIDTH, TILE_HEIGHT, worldToCanvas } from '../core/math';
import { getTilePalette, TileType, GRASS_VARIANTS } from '../world/Tile';
import type { Tile } from '../world/Tile';

export class Renderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private camera: Camera;
    private chunkManager: ChunkManager;
    private player: Player;
    private buildingManager: BuildingManager | null = null;
    private entityManager: EntityManager | null = null;

    // Animation frame counter for water shimmer
    private frameCount = 0;

    constructor(canvas: HTMLCanvasElement, camera: Camera, chunkManager: ChunkManager, player: Player) {
        this.canvas = canvas;
        const context = canvas.getContext('2d', { alpha: false }); // Optimize for no alpha
        if (!context) throw new Error("Could not get 2D context");
        this.ctx = context;
        this.ctx.imageSmoothingEnabled = false; // Pixel art style - critical!

        this.camera = camera;
        this.chunkManager = chunkManager;
        this.player = player;
    }

    public setBuildingManager(buildingManager: BuildingManager): void {
        this.buildingManager = buildingManager;
    }

    public setEntityManager(entityManager: EntityManager): void {
        this.entityManager = entityManager;
    }

    public render(): void {
        this.frameCount++;

        // 1. Clear Screen with dark blue (Genesis-style background)
        this.ctx.fillStyle = '#101820';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. Determine visible range
        const radius = 20;
        const centerX = Math.floor(this.camera.state.x);
        const centerY = Math.floor(this.camera.state.y);

        // 3. Render tiles with painter's algorithm (back to front)
        for (let y = centerY - radius; y <= centerY + radius; y++) {
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                this.drawTile(x, y);
            }
        }

        // Draw buildings
        this.drawBuildings();

        // Draw entities (animals, nomads)
        this.drawEntities();

        // Draw player
        this.drawPlayer();

        // Optional: Debug crosshair (subtle)
        this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2 - 8, this.canvas.height / 2);
        this.ctx.lineTo(this.canvas.width / 2 + 8, this.canvas.height / 2);
        this.ctx.moveTo(this.canvas.width / 2, this.canvas.height / 2 - 8);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height / 2 + 8);
        this.ctx.stroke();
    }

    private drawTile(x: number, y: number): void {
        const tile = this.chunkManager.getTile(x, y);
        if (!tile) return;

        const screenPos = worldToCanvas(x, y, this.camera.state, this.camera.viewport);

        // Cull if offscreen
        const margin = TILE_WIDTH * this.camera.state.zoom * 2;
        if (screenPos.x < -margin || screenPos.x > this.canvas.width + margin ||
            screenPos.y < -margin || screenPos.y > this.canvas.height + margin) {
            return;
        }

        const sizeW = TILE_WIDTH * this.camera.state.zoom;
        const sizeH = TILE_HEIGHT * this.camera.state.zoom;

        // Use grass variant palette if applicable
        let palette = getTilePalette(tile.type);
        if (tile.type === TileType.GRASS && tile.terrainVariant !== undefined) {
            palette = GRASS_VARIANTS[tile.terrainVariant % GRASS_VARIANTS.length];
        }

        // Calculate points for isometric diamond
        const top = { x: screenPos.x, y: screenPos.y - sizeH / 2 };
        const right = { x: screenPos.x + sizeW / 2, y: screenPos.y };
        const bottom = { x: screenPos.x, y: screenPos.y + sizeH / 2 };
        const left = { x: screenPos.x - sizeW / 2, y: screenPos.y };

        // ===== MAIN TILE FILL =====
        // Use dithering pattern for texture based on position
        const ditherPattern = (x + y) % 2 === 0;

        // Elevation-based color variation (0-255 elevation)
        // Higher = lighter, lower = darker
        const elevationFactor = (tile.elevation - 128) / 256; // -0.5 to +0.5

        // Mix base color with elevation adjustment
        let fillColor = ditherPattern ? palette.base : palette.dither;

        // Apply elevation tint
        fillColor = this.adjustColorByElevation(fillColor, elevationFactor);

        // Water gets animated shimmer
        if (tile.type === TileType.WATER) {
            const shimmer = Math.sin((this.frameCount + x * 10 + y * 7) * 0.05) > 0.3;
            fillColor = shimmer ? palette.highlight : palette.base;
        }

        this.ctx.fillStyle = fillColor;
        this.ctx.beginPath();
        this.ctx.moveTo(top.x, top.y);
        this.ctx.lineTo(right.x, right.y);
        this.ctx.lineTo(bottom.x, bottom.y);
        this.ctx.lineTo(left.x, left.y);
        this.ctx.closePath();
        this.ctx.fill();

        // ===== HIGHLIGHT EDGE (Top-left) =====
        this.ctx.strokeStyle = palette.highlight;
        this.ctx.lineWidth = Math.max(1, this.camera.state.zoom * 1.5);
        this.ctx.beginPath();
        this.ctx.moveTo(left.x, left.y);
        this.ctx.lineTo(top.x, top.y);
        this.ctx.stroke();

        // ===== SHADOW EDGE (Bottom-right) =====
        this.ctx.strokeStyle = palette.shadow;
        this.ctx.lineWidth = Math.max(1, this.camera.state.zoom * 1.5);
        this.ctx.beginPath();
        this.ctx.moveTo(right.x, right.y);
        this.ctx.lineTo(bottom.x, bottom.y);
        this.ctx.stroke();

        // ===== OUTLINE =====
        this.ctx.strokeStyle = palette.outline;
        this.ctx.lineWidth = Math.max(0.5, this.camera.state.zoom * 0.5);
        this.ctx.beginPath();
        this.ctx.moveTo(top.x, top.y);
        this.ctx.lineTo(right.x, right.y);
        this.ctx.lineTo(bottom.x, bottom.y);
        this.ctx.lineTo(left.x, left.y);
        this.ctx.closePath();
        this.ctx.stroke();

        // ===== DITHERING DETAILS =====
        // Add extra visual detail based on tile type
        if (this.camera.state.zoom > 0.6) {
            this.drawTileDetails(tile, screenPos, sizeW, sizeH, palette);
        }

        // ===== RESOURCES - PIXEL ART STYLE =====
        if (tile.hasBerries) {
            this.drawBerryBush(screenPos, sizeW, sizeH);
        }
        if (tile.hasTrees) {
            this.drawPixelTree(screenPos, sizeW, sizeH);
        }
        if (tile.hasOre) {
            this.drawOreDeposit(screenPos, sizeW, sizeH, tile.oreType || 'stone');
        }
    }

    private drawTileDetails(tile: Tile, screenPos: { x: number; y: number }, sizeW: number, sizeH: number, palette: { highlight: string; shadow: string; dither: string }): void {
        const ctx = this.ctx;

        switch (tile.type) {
            case TileType.GRASS:
            case TileType.FOREST:
                // Animated grass blades that sway when player is nearby
                ctx.strokeStyle = palette.highlight;
                ctx.lineWidth = 1;

                // Calculate distance from player for sway effect
                const playerPos = this.player.getPosition();
                const tileWorldX = screenPos.x; // Already in screen coords
                const tileWorldY = screenPos.y;

                // Get world distance (approximate via screen distance)
                const playerScreen = worldToCanvas(playerPos.x, playerPos.y, this.camera.state, this.camera.viewport);
                const distToPlayer = Math.sqrt(
                    Math.pow(playerScreen.x - tileWorldX, 2) +
                    Math.pow(playerScreen.y - tileWorldY, 2)
                );

                // Sway amount based on proximity (closer = more sway, like parting grass)
                const maxSwayDist = 80 * this.camera.state.zoom;
                const proximity = Math.max(0, 1 - distToPlayer / maxSwayDist);

                // Direction from player determines which way grass leans
                const dirX = tileWorldX - playerScreen.x;
                const dirMag = Math.abs(dirX) + 0.1;
                const swayDir = dirX / dirMag;

                // Time-based animation + player proximity effect
                const baseWave = Math.sin(this.frameCount * 0.08 + screenPos.x * 0.1 + screenPos.y * 0.07);
                const proximityWave = swayDir * proximity * 8;
                const sway = baseWave * 2 + proximityWave;

                // Draw multiple grass blades with varying heights
                for (let i = 0; i < 5; i++) {
                    const offsetX = (i - 2) * sizeW * 0.1;
                    const offsetY = sizeH * 0.1;
                    const bladeHeight = sizeH * (0.12 + (i % 3) * 0.04);
                    const bladeSway = sway * (0.5 + i * 0.15);

                    ctx.beginPath();
                    ctx.moveTo(screenPos.x + offsetX, screenPos.y + offsetY);
                    ctx.quadraticCurveTo(
                        screenPos.x + offsetX + bladeSway * 0.5,
                        screenPos.y + offsetY - bladeHeight * 0.5,
                        screenPos.x + offsetX + bladeSway,
                        screenPos.y + offsetY - bladeHeight
                    );
                    ctx.stroke();
                }
                break;

            case TileType.WATER:
                // Animated wave lines
                ctx.strokeStyle = palette.highlight;
                ctx.lineWidth = 1;
                const waveOffset = Math.sin(this.frameCount * 0.1) * 2;
                ctx.beginPath();
                ctx.moveTo(screenPos.x - sizeW * 0.2 + waveOffset, screenPos.y);
                ctx.lineTo(screenPos.x + sizeW * 0.2 + waveOffset, screenPos.y);
                ctx.stroke();
                break;

            case TileType.SAND:
                // Draw sand dots
                ctx.fillStyle = palette.shadow;
                for (let i = 0; i < 2; i++) {
                    const dotX = screenPos.x + (Math.random() - 0.5) * sizeW * 0.3;
                    const dotY = screenPos.y + (Math.random() - 0.5) * sizeH * 0.3;
                    ctx.fillRect(dotX, dotY, 1, 1);
                }
                break;

            case TileType.STONE:
                // Draw rock cracks
                ctx.strokeStyle = palette.shadow;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(screenPos.x - sizeW * 0.1, screenPos.y - sizeH * 0.1);
                ctx.lineTo(screenPos.x + sizeW * 0.05, screenPos.y + sizeH * 0.1);
                ctx.stroke();
                break;

            case TileType.FOREST:
                // Draw tree shadow hint
                ctx.fillStyle = palette.shadow;
                ctx.beginPath();
                ctx.ellipse(screenPos.x, screenPos.y + sizeH * 0.2, sizeW * 0.15, sizeH * 0.1, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
    }

    /**
     * Adjust a hex color by elevation factor (-0.5 to +0.5)
     */
    private adjustColorByElevation(hexColor: string, factor: number): string {
        // Parse hex color
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);

        // Adjust by factor (positive = lighter, negative = darker)
        const adjust = Math.floor(factor * 60); // -30 to +30
        const clamp = (v: number) => Math.max(0, Math.min(255, v + adjust));

        const nr = clamp(r);
        const ng = clamp(g);
        const nb = clamp(b);

        return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
    }

    private drawPlayer(): void {
        const pos = this.player.getPosition();
        const screenPos = worldToCanvas(pos.x, pos.y, this.camera.state, this.camera.viewport);
        const sizeH = TILE_HEIGHT * this.camera.state.zoom;

        // Draw shadow
        this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
        this.ctx.beginPath();
        this.ctx.ellipse(screenPos.x, screenPos.y, sizeH * 0.4, sizeH * 0.2, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Player body (Genesis-style sprite colors)
        const playerY = screenPos.y - sizeH * 0.6;

        // Body
        this.ctx.fillStyle = '#E04040'; // Bright red
        this.ctx.strokeStyle = '#802020'; // Dark red outline
        this.ctx.lineWidth = 2;

        // Draw capsule body
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, playerY, sizeH * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Highlight on body
        this.ctx.fillStyle = '#FF6060';
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x - sizeH * 0.1, playerY - sizeH * 0.1, sizeH * 0.15, 0, Math.PI * 2);
        this.ctx.fill();

        // Face/eyes
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x - sizeH * 0.1, playerY - sizeH * 0.05, sizeH * 0.08, 0, Math.PI * 2);
        this.ctx.arc(screenPos.x + sizeH * 0.1, playerY - sizeH * 0.05, sizeH * 0.08, 0, Math.PI * 2);
        this.ctx.fill();

        // Pupils
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x - sizeH * 0.08, playerY - sizeH * 0.05, sizeH * 0.04, 0, Math.PI * 2);
        this.ctx.arc(screenPos.x + sizeH * 0.12, playerY - sizeH * 0.05, sizeH * 0.04, 0, Math.PI * 2);
        this.ctx.fill();
    }

    private drawBuildings(): void {
        if (!this.buildingManager) return;

        const buildings = this.buildingManager.getAllBuildings();
        for (const building of buildings) {
            const definition = this.buildingManager.getBuildingDefinition(building);
            if (!definition) continue;

            const screenPos = worldToCanvas(building.x, building.y, this.camera.state, this.camera.viewport);

            // Cull if offscreen
            const margin = TILE_WIDTH * this.camera.state.zoom;
            if (screenPos.x < -margin || screenPos.x > this.canvas.width + margin ||
                screenPos.y < -margin || screenPos.y > this.canvas.height + margin) {
                continue;
            }

            const sizeH = TILE_HEIGHT * this.camera.state.zoom;

            // Draw shadow under building
            this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
            this.ctx.beginPath();
            this.ctx.ellipse(screenPos.x, screenPos.y, sizeH * 0.6, sizeH * 0.3, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw building emoji with outline effect
            const fontSize = Math.max(16, sizeH * 1.5);
            this.ctx.font = `${fontSize}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Shadow/outline
            this.ctx.shadowColor = '#000000';
            this.ctx.shadowBlur = 3;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
            this.ctx.fillText(definition.emoji, screenPos.x, screenPos.y - sizeH * 0.5);

            // Reset shadow
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;

            // Draw building state label when zoomed in
            if (this.camera.state.zoom > 0.8) {
                this.ctx.font = `bold ${Math.max(10, sizeH * 0.35)}px Arial`;
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 3;
                const stateName = definition.states[building.state]?.name || '';
                this.ctx.strokeText(stateName, screenPos.x, screenPos.y + sizeH * 0.8);
                this.ctx.fillText(stateName, screenPos.x, screenPos.y + sizeH * 0.8);
            }
        }
    }

    /**
     * Draw a pixel art berry bush
     */
    private drawBerryBush(screenPos: { x: number; y: number }, sizeW: number, sizeH: number): void {
        const ctx = this.ctx;
        const scale = this.camera.state.zoom;
        const x = screenPos.x;
        const y = screenPos.y - sizeH * 0.2;

        // Bush base (dark green)
        ctx.fillStyle = '#206020';
        ctx.beginPath();
        ctx.ellipse(x, y, sizeW * 0.25, sizeH * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bush highlight
        ctx.fillStyle = '#40A040';
        ctx.beginPath();
        ctx.ellipse(x - sizeW * 0.05, y - sizeH * 0.05, sizeW * 0.15, sizeH * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Berries (purple/red dots)
        const berryColors = ['#E040E0', '#FF4080', '#C020A0'];
        for (let i = 0; i < 5; i++) {
            const bx = x + (Math.sin(i * 1.3) * sizeW * 0.15);
            const by = y + (Math.cos(i * 1.7) * sizeH * 0.1);
            ctx.fillStyle = berryColors[i % berryColors.length];
            ctx.beginPath();
            ctx.arc(bx, by, Math.max(2, scale * 3), 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Draw an ancient tree (massive oak or spooky halloween style)
     * Features: thick gnarled trunk, spreading canopy, variation per tile
     */
    private drawPixelTree(screenPos: { x: number; y: number }, sizeW: number, sizeH: number): void {
        const ctx = this.ctx;
        const x = screenPos.x;
        const y = screenPos.y;

        // Use position for consistent random variation per tree
        const seed = Math.abs(Math.floor(x * 7 + y * 13)) % 100;
        const isSpooky = seed < 20; // 20% spooky trees
        const treeScale = 1.5 + (seed % 30) / 100; // Size variation 1.5-1.8
        const treeHeight = sizeH * treeScale;

        // Shadow (larger for big trees)
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(x, y + sizeH * 0.05, sizeW * 0.4, sizeH * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        if (isSpooky) {
            // ===== SPOOKY HALLOWEEN TREE =====
            // Twisted dark trunk
            ctx.fillStyle = '#2A1A10';
            ctx.beginPath();
            ctx.moveTo(x - sizeW * 0.08, y);
            ctx.lineTo(x - sizeW * 0.12, y - treeHeight * 0.3);
            ctx.quadraticCurveTo(x - sizeW * 0.15, y - treeHeight * 0.5, x - sizeW * 0.05, y - treeHeight * 0.6);
            ctx.lineTo(x + sizeW * 0.05, y - treeHeight * 0.6);
            ctx.quadraticCurveTo(x + sizeW * 0.15, y - treeHeight * 0.5, x + sizeW * 0.12, y - treeHeight * 0.3);
            ctx.lineTo(x + sizeW * 0.08, y);
            ctx.closePath();
            ctx.fill();

            // Trunk texture lines
            ctx.strokeStyle = '#1A0A00';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y - treeHeight * 0.1);
            ctx.lineTo(x - sizeW * 0.02, y - treeHeight * 0.4);
            ctx.moveTo(x + sizeW * 0.04, y - treeHeight * 0.15);
            ctx.lineTo(x + sizeW * 0.02, y - treeHeight * 0.35);
            ctx.stroke();

            // Bare gnarled branches (no leaves)
            ctx.strokeStyle = '#3A2A15';
            ctx.lineWidth = Math.max(2, sizeW * 0.03);
            ctx.lineCap = 'round';

            // Left branches
            ctx.beginPath();
            ctx.moveTo(x - sizeW * 0.08, y - treeHeight * 0.5);
            ctx.quadraticCurveTo(x - sizeW * 0.35, y - treeHeight * 0.55, x - sizeW * 0.45, y - treeHeight * 0.7);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x - sizeW * 0.05, y - treeHeight * 0.55);
            ctx.quadraticCurveTo(x - sizeW * 0.25, y - treeHeight * 0.75, x - sizeW * 0.35, y - treeHeight * 0.9);
            ctx.stroke();

            // Right branches
            ctx.beginPath();
            ctx.moveTo(x + sizeW * 0.08, y - treeHeight * 0.5);
            ctx.quadraticCurveTo(x + sizeW * 0.35, y - treeHeight * 0.55, x + sizeW * 0.5, y - treeHeight * 0.65);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + sizeW * 0.05, y - treeHeight * 0.55);
            ctx.quadraticCurveTo(x + sizeW * 0.3, y - treeHeight * 0.8, x + sizeW * 0.4, y - treeHeight * 0.95);
            ctx.stroke();

            // Small twigs
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x - sizeW * 0.35, y - treeHeight * 0.65);
            ctx.lineTo(x - sizeW * 0.4, y - treeHeight * 0.8);
            ctx.moveTo(x + sizeW * 0.4, y - treeHeight * 0.6);
            ctx.lineTo(x + sizeW * 0.48, y - treeHeight * 0.75);
            ctx.stroke();

        } else {
            // ===== ANCIENT OAK TREE =====
            // Thick trunk with roots
            ctx.fillStyle = '#4A3020';

            // Root flares at base
            ctx.beginPath();
            ctx.moveTo(x - sizeW * 0.2, y);
            ctx.quadraticCurveTo(x - sizeW * 0.15, y - sizeH * 0.05, x - sizeW * 0.1, y - sizeH * 0.1);
            ctx.lineTo(x - sizeW * 0.08, y - treeHeight * 0.4);
            ctx.lineTo(x + sizeW * 0.08, y - treeHeight * 0.4);
            ctx.lineTo(x + sizeW * 0.1, y - sizeH * 0.1);
            ctx.quadraticCurveTo(x + sizeW * 0.15, y - sizeH * 0.05, x + sizeW * 0.2, y);
            ctx.closePath();
            ctx.fill();

            // Trunk bark texture
            ctx.fillStyle = '#5A4030';
            ctx.fillRect(x - sizeW * 0.04, y - treeHeight * 0.35, sizeW * 0.03, treeHeight * 0.2);
            ctx.fillRect(x + sizeW * 0.02, y - treeHeight * 0.25, sizeW * 0.02, treeHeight * 0.15);

            // MASSIVE BUSHY CANOPY - multiple overlapping circles
            const canopyLayers = [
                // Bottom layer (darkest, widest)
                { cx: 0, cy: -0.45, rx: 0.45, ry: 0.25, color: '#1A4010' },
                { cx: -0.15, cy: -0.5, rx: 0.3, ry: 0.2, color: '#1A4010' },
                { cx: 0.15, cy: -0.5, rx: 0.3, ry: 0.2, color: '#1A4010' },
                // Middle layer
                { cx: 0, cy: -0.55, rx: 0.4, ry: 0.22, color: '#255015' },
                { cx: -0.2, cy: -0.6, rx: 0.28, ry: 0.18, color: '#255015' },
                { cx: 0.2, cy: -0.6, rx: 0.28, ry: 0.18, color: '#255015' },
                // Top layer (lightest)
                { cx: 0, cy: -0.65, rx: 0.35, ry: 0.2, color: '#306020' },
                { cx: -0.12, cy: -0.7, rx: 0.22, ry: 0.15, color: '#306020' },
                { cx: 0.12, cy: -0.7, rx: 0.22, ry: 0.15, color: '#306020' },
                // Highlight puffs on top
                { cx: 0, cy: -0.75, rx: 0.2, ry: 0.12, color: '#408030' },
                { cx: -0.08, cy: -0.78, rx: 0.12, ry: 0.08, color: '#50A040' },
                { cx: 0.1, cy: -0.76, rx: 0.1, ry: 0.07, color: '#50A040' },
            ];

            for (const layer of canopyLayers) {
                ctx.fillStyle = layer.color;
                ctx.beginPath();
                ctx.ellipse(
                    x + sizeW * layer.cx,
                    y + treeHeight * layer.cy,
                    sizeW * layer.rx,
                    treeHeight * layer.ry,
                    0, 0, Math.PI * 2
                );
                ctx.fill();
            }

            // Add some texture dots on canopy
            ctx.fillStyle = '#60B050';
            for (let i = 0; i < 8; i++) {
                const dotX = x + (Math.sin(seed + i * 0.8) * sizeW * 0.3);
                const dotY = y - treeHeight * (0.5 + Math.cos(seed + i * 1.2) * 0.15);
                ctx.beginPath();
                ctx.arc(dotX, dotY, Math.max(1, sizeW * 0.02), 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    /**
     * Draw ore deposit on stone tiles
     */
    private drawOreDeposit(screenPos: { x: number; y: number }, sizeW: number, sizeH: number, oreType: string): void {
        const ctx = this.ctx;
        const x = screenPos.x;
        const y = screenPos.y;
        const scale = this.camera.state.zoom;

        // Ore colors based on type
        const colors: Record<string, { base: string; highlight: string; sparkle: string }> = {
            'iron': { base: '#606080', highlight: '#8080A0', sparkle: '#C0C0E0' },
            'gold': { base: '#C0A020', highlight: '#E0C040', sparkle: '#FFFF80' },
            'stone': { base: '#707070', highlight: '#909090', sparkle: '#B0B0B0' }
        };

        const palette = colors[oreType] || colors['stone'];

        // Draw ore chunks
        for (let i = 0; i < 3; i++) {
            const ox = x + (i - 1) * sizeW * 0.15;
            const oy = y + Math.sin(i * 2) * sizeH * 0.1;
            const size = Math.max(4, scale * 6);

            // Base chunk
            ctx.fillStyle = palette.base;
            ctx.beginPath();
            ctx.moveTo(ox, oy - size);
            ctx.lineTo(ox + size * 0.8, oy);
            ctx.lineTo(ox, oy + size * 0.5);
            ctx.lineTo(ox - size * 0.8, oy);
            ctx.closePath();
            ctx.fill();

            // Highlight
            ctx.fillStyle = palette.highlight;
            ctx.beginPath();
            ctx.moveTo(ox - size * 0.3, oy - size * 0.5);
            ctx.lineTo(ox, oy - size);
            ctx.lineTo(ox + size * 0.3, oy - size * 0.3);
            ctx.closePath();
            ctx.fill();
        }

        // Sparkle effect (animated)
        const sparklePhase = (this.frameCount + Math.floor(x) + Math.floor(y)) % 30;
        if (sparklePhase < 5) {
            ctx.fillStyle = palette.sparkle;
            const sparkleX = x + Math.sin(sparklePhase * 0.5) * sizeW * 0.2;
            const sparkleY = y - sizeH * 0.1;
            const sparkleSize = Math.max(2, scale * 3);

            // Star sparkle
            ctx.beginPath();
            ctx.moveTo(sparkleX, sparkleY - sparkleSize);
            ctx.lineTo(sparkleX + sparkleSize * 0.3, sparkleY);
            ctx.lineTo(sparkleX, sparkleY + sparkleSize);
            ctx.lineTo(sparkleX - sparkleSize * 0.3, sparkleY);
            ctx.closePath();
            ctx.fill();
        }
    }

    /**
     * Draw all entities (animals, nomads)
     */
    private drawEntities(): void {
        if (!this.entityManager) return;

        const entities = this.entityManager.getEntities();
        for (const entity of entities) {
            const screenPos = worldToCanvas(entity.x, entity.y, this.camera.state, this.camera.viewport);

            // Cull if offscreen
            const margin = TILE_WIDTH * this.camera.state.zoom * 2;
            if (screenPos.x < -margin || screenPos.x > this.canvas.width + margin ||
                screenPos.y < -margin || screenPos.y > this.canvas.height + margin) {
                continue;
            }

            const sizeH = TILE_HEIGHT * this.camera.state.zoom;

            // Draw based on entity type
            switch (entity.type) {
                case 'ANIMAL_DEER':
                    this.drawDeer(screenPos, sizeH, entity.isMoving);
                    break;
                case 'ANIMAL_RABBIT':
                    this.drawRabbit(screenPos, sizeH, entity.isMoving);
                    break;
                case 'ANIMAL_BOAR':
                    this.drawBoar(screenPos, sizeH, entity.isMoving, entity.state === 'charging');
                    break;
                case 'ANIMAL_BEAR':
                    this.drawBear(screenPos, sizeH, entity.isMoving);
                    break;
                case 'ANIMAL_BISON':
                    this.drawBison(screenPos, sizeH, entity.isMoving);
                    break;
                case 'NOMAD':
                    this.drawNomad(screenPos, sizeH, entity.isMoving, entity.isHostile, entity.nomadBehavior, entity.animFrame);
                    break;
            }

            // Draw dying effect (fade out)
            if (entity.state === 'dying' && entity.deathTimer !== undefined) {
                const alpha = entity.deathTimer / 60; // Fade from 1 to 0
                this.ctx.fillStyle = `rgba(255, 0, 0, ${0.3 * alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(screenPos.x, screenPos.y - sizeH * 0.3, sizeH * 0.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }

    /**
     * Draw a deer (brown, 4-legged)
     */
    private drawDeer(screenPos: { x: number; y: number }, sizeH: number, isMoving: boolean): void {
        const ctx = this.ctx;
        const x = screenPos.x;
        const y = screenPos.y;
        const scale = 1.2; // Make deer larger

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y, sizeH * 0.3 * scale, sizeH * 0.12 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        const bodyY = y - sizeH * 0.35 * scale;
        ctx.fillStyle = '#8B4513'; // Brown
        ctx.beginPath();
        ctx.ellipse(x, bodyY, sizeH * 0.3 * scale, sizeH * 0.18 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body highlight
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.ellipse(x, bodyY - sizeH * 0.06 * scale, sizeH * 0.2 * scale, sizeH * 0.08 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Neck
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(x + sizeH * 0.22 * scale, bodyY - sizeH * 0.1 * scale, sizeH * 0.08 * scale, sizeH * 0.12 * scale, -0.5, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#996633';
        ctx.beginPath();
        ctx.ellipse(x + sizeH * 0.32 * scale, bodyY - sizeH * 0.18 * scale, sizeH * 0.12 * scale, sizeH * 0.09 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye (white with black pupil)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x + sizeH * 0.36 * scale, bodyY - sizeH * 0.2 * scale, sizeH * 0.03 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x + sizeH * 0.37 * scale, bodyY - sizeH * 0.2 * scale, sizeH * 0.015 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(x + sizeH * 0.28 * scale, bodyY - sizeH * 0.28 * scale, sizeH * 0.03 * scale, sizeH * 0.06 * scale, -0.4, 0, Math.PI * 2);
        ctx.ellipse(x + sizeH * 0.35 * scale, bodyY - sizeH * 0.28 * scale, sizeH * 0.03 * scale, sizeH * 0.06 * scale, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Legs (4 legs, animated if moving)
        ctx.fillStyle = '#654321';
        const legOffset = isMoving ? Math.sin(this.frameCount * 0.3) * sizeH * 0.06 : 0;
        const legWidth = sizeH * 0.035 * scale;
        const legLength = sizeH * 0.25 * scale;

        // Back legs
        ctx.fillRect(x - sizeH * 0.18 * scale - legOffset, bodyY + sizeH * 0.12 * scale, legWidth, legLength);
        ctx.fillRect(x - sizeH * 0.08 * scale + legOffset, bodyY + sizeH * 0.12 * scale, legWidth, legLength);
        // Front legs
        ctx.fillRect(x + sizeH * 0.08 * scale + legOffset, bodyY + sizeH * 0.12 * scale, legWidth, legLength);
        ctx.fillRect(x + sizeH * 0.18 * scale - legOffset, bodyY + sizeH * 0.12 * scale, legWidth, legLength);

        // Tail
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x - sizeH * 0.28 * scale, bodyY, sizeH * 0.05 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Antlers (only visible for larger deer)
        if (sizeH > 20) {
            ctx.strokeStyle = '#DEB887';
            ctx.lineWidth = Math.max(1, scale);
            ctx.beginPath();
            ctx.moveTo(x + sizeH * 0.3 * scale, bodyY - sizeH * 0.26 * scale);
            ctx.lineTo(x + sizeH * 0.25 * scale, bodyY - sizeH * 0.4 * scale);
            ctx.lineTo(x + sizeH * 0.2 * scale, bodyY - sizeH * 0.35 * scale);
            ctx.moveTo(x + sizeH * 0.35 * scale, bodyY - sizeH * 0.26 * scale);
            ctx.lineTo(x + sizeH * 0.4 * scale, bodyY - sizeH * 0.4 * scale);
            ctx.lineTo(x + sizeH * 0.45 * scale, bodyY - sizeH * 0.35 * scale);
            ctx.stroke();
        }
    }

    /**
     * Draw a rabbit (small, tan colored)
     */
    private drawRabbit(screenPos: { x: number; y: number }, sizeH: number, isMoving: boolean): void {
        const ctx = this.ctx;
        const x = screenPos.x;
        const y = screenPos.y;
        const scale = 0.6; // Rabbits are smaller

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(x, y, sizeH * 0.15 * scale, sizeH * 0.08 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        const bodyY = y - sizeH * 0.2 * scale;
        const hop = isMoving ? Math.abs(Math.sin(this.frameCount * 0.4)) * sizeH * 0.1 : 0;
        ctx.fillStyle = '#D2B48C'; // Tan
        ctx.beginPath();
        ctx.ellipse(x, bodyY - hop, sizeH * 0.15 * scale, sizeH * 0.12 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#D2B48C';
        ctx.beginPath();
        ctx.arc(x + sizeH * 0.1 * scale, bodyY - hop - sizeH * 0.08 * scale, sizeH * 0.08 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.ellipse(x + sizeH * 0.08 * scale, bodyY - hop - sizeH * 0.2 * scale, sizeH * 0.03 * scale, sizeH * 0.08 * scale, -0.2, 0, Math.PI * 2);
        ctx.ellipse(x + sizeH * 0.14 * scale, bodyY - hop - sizeH * 0.2 * scale, sizeH * 0.03 * scale, sizeH * 0.08 * scale, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Tail (white puff)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x - sizeH * 0.12 * scale, bodyY - hop, sizeH * 0.04 * scale, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw a boar (brown/grey, tusks, aggressive) 
     */
    private drawBoar(screenPos: { x: number; y: number }, sizeH: number, isMoving: boolean, isCharging: boolean): void {
        const ctx = this.ctx;
        const x = screenPos.x;
        const y = screenPos.y;
        const scale = 1.0;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(x, y, sizeH * 0.35 * scale, sizeH * 0.15 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body - stocky barrel shape
        const bodyY = y - sizeH * 0.25 * scale;
        const chargeOffset = isCharging ? Math.sin(this.frameCount * 0.5) * sizeH * 0.05 : 0;
        ctx.fillStyle = '#5C5040'; // Dark brown-grey
        ctx.beginPath();
        ctx.ellipse(x + chargeOffset, bodyY, sizeH * 0.35 * scale, sizeH * 0.22 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mohawk/back ridge
        ctx.fillStyle = '#3A3025';
        ctx.beginPath();
        ctx.moveTo(x - sizeH * 0.2, bodyY - sizeH * 0.15);
        ctx.lineTo(x, bodyY - sizeH * 0.25);
        ctx.lineTo(x + sizeH * 0.15, bodyY - sizeH * 0.18);
        ctx.lineTo(x + sizeH * 0.15, bodyY - sizeH * 0.12);
        ctx.lineTo(x - sizeH * 0.2, bodyY - sizeH * 0.1);
        ctx.closePath();
        ctx.fill();

        // Head
        ctx.fillStyle = '#5C5040';
        ctx.beginPath();
        ctx.ellipse(x + sizeH * 0.28 * scale + chargeOffset, bodyY + sizeH * 0.05 * scale, sizeH * 0.15 * scale, sizeH * 0.12 * scale, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Snout
        ctx.fillStyle = '#7A6A5A';
        ctx.beginPath();
        ctx.ellipse(x + sizeH * 0.38 * scale + chargeOffset, bodyY + sizeH * 0.1 * scale, sizeH * 0.08 * scale, sizeH * 0.06 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tusks
        ctx.fillStyle = '#F0E0C0';
        ctx.beginPath();
        ctx.moveTo(x + sizeH * 0.35 + chargeOffset, bodyY + sizeH * 0.05);
        ctx.lineTo(x + sizeH * 0.45 + chargeOffset, bodyY - sizeH * 0.05);
        ctx.lineTo(x + sizeH * 0.38 + chargeOffset, bodyY + sizeH * 0.02);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + sizeH * 0.35 + chargeOffset, bodyY + sizeH * 0.12);
        ctx.lineTo(x + sizeH * 0.45 + chargeOffset, bodyY + sizeH * 0.08);
        ctx.lineTo(x + sizeH * 0.38 + chargeOffset, bodyY + sizeH * 0.1);
        ctx.closePath();
        ctx.fill();

        // Eyes (angry red when charging)
        ctx.fillStyle = isCharging ? '#FF3030' : '#200000';
        ctx.beginPath();
        ctx.arc(x + sizeH * 0.32 + chargeOffset, bodyY - sizeH * 0.02, sizeH * 0.025, 0, Math.PI * 2);
        ctx.fill();

        // Short legs
        ctx.fillStyle = '#3A3025';
        const legOffset = isMoving ? Math.sin(this.frameCount * 0.4) * sizeH * 0.04 : 0;
        ctx.fillRect(x - sizeH * 0.2 - legOffset, bodyY + sizeH * 0.15, sizeH * 0.05, sizeH * 0.12);
        ctx.fillRect(x - sizeH * 0.08 + legOffset, bodyY + sizeH * 0.15, sizeH * 0.05, sizeH * 0.12);
        ctx.fillRect(x + sizeH * 0.08 + legOffset, bodyY + sizeH * 0.15, sizeH * 0.05, sizeH * 0.12);
        ctx.fillRect(x + sizeH * 0.2 - legOffset, bodyY + sizeH * 0.15, sizeH * 0.05, sizeH * 0.12);
    }

    /**
     * Draw a bear (large, dark brown, powerful)
     */
    private drawBear(screenPos: { x: number; y: number }, sizeH: number, isMoving: boolean): void {
        const ctx = this.ctx;
        const x = screenPos.x;
        const y = screenPos.y;
        const scale = 1.4; // Bears are big

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(x, y, sizeH * 0.4 * scale, sizeH * 0.18 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body - large and round
        const bodyY = y - sizeH * 0.35 * scale;
        ctx.fillStyle = '#4A3428'; // Dark brown
        ctx.beginPath();
        ctx.ellipse(x, bodyY, sizeH * 0.4 * scale, sizeH * 0.28 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body highlight
        ctx.fillStyle = '#5A4438';
        ctx.beginPath();
        ctx.ellipse(x, bodyY - sizeH * 0.08 * scale, sizeH * 0.25 * scale, sizeH * 0.12 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head 
        ctx.fillStyle = '#4A3428';
        ctx.beginPath();
        ctx.arc(x + sizeH * 0.32 * scale, bodyY - sizeH * 0.1 * scale, sizeH * 0.18 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Muzzle (lighter)
        ctx.fillStyle = '#6A5448';
        ctx.beginPath();
        ctx.ellipse(x + sizeH * 0.42 * scale, bodyY, sizeH * 0.1 * scale, sizeH * 0.08 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = '#1A1010';
        ctx.beginPath();
        ctx.ellipse(x + sizeH * 0.48 * scale, bodyY - sizeH * 0.02, sizeH * 0.035, sizeH * 0.025, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.fillStyle = '#4A3428';
        ctx.beginPath();
        ctx.arc(x + sizeH * 0.22 * scale, bodyY - sizeH * 0.28 * scale, sizeH * 0.06 * scale, 0, Math.PI * 2);
        ctx.arc(x + sizeH * 0.42 * scale, bodyY - sizeH * 0.26 * scale, sizeH * 0.06 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (small, beady)
        ctx.fillStyle = '#100808';
        ctx.beginPath();
        ctx.arc(x + sizeH * 0.36 * scale, bodyY - sizeH * 0.12 * scale, sizeH * 0.025 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Thick legs
        ctx.fillStyle = '#3A2820';
        const legOffset = isMoving ? Math.sin(this.frameCount * 0.25) * sizeH * 0.06 : 0;
        const legWidth = sizeH * 0.08 * scale;
        const legHeight = sizeH * 0.25 * scale;
        ctx.fillRect(x - sizeH * 0.25 * scale - legOffset, bodyY + sizeH * 0.2 * scale, legWidth, legHeight);
        ctx.fillRect(x - sizeH * 0.08 * scale + legOffset, bodyY + sizeH * 0.2 * scale, legWidth, legHeight);
        ctx.fillRect(x + sizeH * 0.08 * scale + legOffset, bodyY + sizeH * 0.2 * scale, legWidth, legHeight);
        ctx.fillRect(x + sizeH * 0.22 * scale - legOffset, bodyY + sizeH * 0.2 * scale, legWidth, legHeight);
    }

    /**
     * Draw a bison (large, shaggy, horned)
     */
    private drawBison(screenPos: { x: number; y: number }, sizeH: number, isMoving: boolean): void {
        const ctx = this.ctx;
        const x = screenPos.x;
        const y = screenPos.y;
        const scale = 1.3; // Bison are big

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(x, y, sizeH * 0.4 * scale, sizeH * 0.16 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body - massive shoulder hump
        const bodyY = y - sizeH * 0.3 * scale;
        ctx.fillStyle = '#4A3A2A'; // Dark brown
        ctx.beginPath();
        ctx.ellipse(x - sizeH * 0.1, bodyY, sizeH * 0.35 * scale, sizeH * 0.25 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shoulder hump (signature bison feature)
        ctx.fillStyle = '#3A2A1A';
        ctx.beginPath();
        ctx.ellipse(x - sizeH * 0.15, bodyY - sizeH * 0.12, sizeH * 0.2 * scale, sizeH * 0.18 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shaggy fur texture
        ctx.fillStyle = '#2A1A10';
        for (let i = 0; i < 6; i++) {
            const furX = x - sizeH * 0.25 + i * sizeH * 0.08;
            ctx.beginPath();
            ctx.moveTo(furX, bodyY + sizeH * 0.15);
            ctx.lineTo(furX - sizeH * 0.02, bodyY + sizeH * 0.25);
            ctx.lineTo(furX + sizeH * 0.02, bodyY + sizeH * 0.25);
            ctx.closePath();
            ctx.fill();
        }

        // Head
        ctx.fillStyle = '#4A3A2A';
        ctx.beginPath();
        ctx.ellipse(x + sizeH * 0.25 * scale, bodyY + sizeH * 0.08 * scale, sizeH * 0.15 * scale, sizeH * 0.12 * scale, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Beard
        ctx.fillStyle = '#2A1A10';
        ctx.beginPath();
        ctx.ellipse(x + sizeH * 0.3 * scale, bodyY + sizeH * 0.18 * scale, sizeH * 0.08 * scale, sizeH * 0.1 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Horns (curved)
        ctx.strokeStyle = '#C0B090';
        ctx.lineWidth = Math.max(2, sizeH * 0.04);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + sizeH * 0.18, bodyY - sizeH * 0.05);
        ctx.quadraticCurveTo(x + sizeH * 0.08, bodyY - sizeH * 0.2, x + sizeH * 0.15, bodyY - sizeH * 0.25);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + sizeH * 0.32, bodyY - sizeH * 0.05);
        ctx.quadraticCurveTo(x + sizeH * 0.42, bodyY - sizeH * 0.2, x + sizeH * 0.35, bodyY - sizeH * 0.25);
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#100808';
        ctx.beginPath();
        ctx.arc(x + sizeH * 0.28 * scale, bodyY + sizeH * 0.02 * scale, sizeH * 0.02, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.fillStyle = '#3A2A1A';
        const legOffset = isMoving ? Math.sin(this.frameCount * 0.3) * sizeH * 0.05 : 0;
        ctx.fillRect(x - sizeH * 0.25 - legOffset, bodyY + sizeH * 0.18, sizeH * 0.06, sizeH * 0.2);
        ctx.fillRect(x - sizeH * 0.1 + legOffset, bodyY + sizeH * 0.18, sizeH * 0.06, sizeH * 0.2);
        ctx.fillRect(x + sizeH * 0.05 + legOffset, bodyY + sizeH * 0.18, sizeH * 0.06, sizeH * 0.2);
        ctx.fillRect(x + sizeH * 0.18 - legOffset, bodyY + sizeH * 0.18, sizeH * 0.06, sizeH * 0.2);
    }

    /**
     * Draw a nomad as animated stick figure with club
     * Supports: walking, waving club angrily, dancing
     */
    private drawNomad(screenPos: { x: number; y: number }, sizeH: number, isMoving: boolean, isHostile?: boolean, behavior?: string, animFrame?: number): void {
        const ctx = this.ctx;
        const x = screenPos.x;
        const y = screenPos.y;
        const frame = animFrame ?? this.frameCount;

        // Stick figure colors
        const bodyColor = isHostile ? '#600000' : '#2A1A10';
        const skinColor = '#DEB887';

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y, sizeH * 0.2, sizeH * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        const walkBob = isMoving ? Math.sin(frame * 0.2) * sizeH * 0.03 : 0;
        const headY = y - sizeH * 0.8 + walkBob;
        const bodyY = y - sizeH * 0.4 + walkBob;
        const hipY = y - sizeH * 0.15 + walkBob;

        ctx.strokeStyle = bodyColor;
        ctx.lineWidth = Math.max(2, sizeH * 0.06);
        ctx.lineCap = 'round';

        // === LEGS (stick style) ===
        const legSwing = isMoving ? Math.sin(frame * 0.25) * sizeH * 0.12 : 0;
        const danceJump = behavior === 'dancing' ? Math.abs(Math.sin(frame * 0.15)) * sizeH * 0.1 : 0;

        // Left leg
        ctx.beginPath();
        ctx.moveTo(x, hipY - danceJump);
        ctx.lineTo(x - sizeH * 0.1 - legSwing, y - danceJump);
        ctx.stroke();

        // Right leg
        ctx.beginPath();
        ctx.moveTo(x, hipY - danceJump);
        ctx.lineTo(x + sizeH * 0.1 + legSwing, y - danceJump);
        ctx.stroke();

        // === BODY (torso line) ===
        ctx.beginPath();
        ctx.moveTo(x, hipY - danceJump);
        ctx.lineTo(x, headY - sizeH * 0.15 - danceJump);
        ctx.stroke();

        // === ARMS with special animations ===
        const shoulderY = headY + sizeH * 0.05 - danceJump;

        if (behavior === 'waving') {
            // WAVE CLUB ANGRILY - right arm up, shaking club
            const waveAngle = Math.sin(frame * 0.4) * 0.5;

            // Left arm down
            ctx.beginPath();
            ctx.moveTo(x, shoulderY);
            ctx.lineTo(x - sizeH * 0.2, bodyY + sizeH * 0.1);
            ctx.stroke();

            // Right arm up (waving)
            ctx.beginPath();
            ctx.moveTo(x, shoulderY);
            ctx.lineTo(x + sizeH * 0.15 + Math.sin(frame * 0.3) * sizeH * 0.05, shoulderY - sizeH * 0.25);
            ctx.stroke();

            // CLUB in hand (shaking)
            ctx.strokeStyle = '#5A3A1A';
            ctx.lineWidth = Math.max(3, sizeH * 0.08);
            ctx.beginPath();
            const clubX = x + sizeH * 0.15 + Math.sin(frame * 0.3) * sizeH * 0.05;
            const clubY = shoulderY - sizeH * 0.25;
            ctx.moveTo(clubX, clubY);
            ctx.lineTo(clubX + Math.sin(waveAngle) * sizeH * 0.15, clubY - sizeH * 0.25 + Math.cos(waveAngle) * sizeH * 0.05);
            ctx.stroke();

            // Club head (bigger end)
            ctx.fillStyle = '#4A2A0A';
            ctx.beginPath();
            const clubEndX = clubX + Math.sin(waveAngle) * sizeH * 0.15;
            const clubEndY = clubY - sizeH * 0.25 + Math.cos(waveAngle) * sizeH * 0.05;
            ctx.arc(clubEndX, clubEndY, sizeH * 0.06, 0, Math.PI * 2);
            ctx.fill();

        } else if (behavior === 'dancing') {
            // DANCE - both arms up and moving
            const danceArm = Math.sin(frame * 0.2) * sizeH * 0.15;

            ctx.beginPath();
            ctx.moveTo(x, shoulderY);
            ctx.lineTo(x - sizeH * 0.2 - danceArm, shoulderY - sizeH * 0.2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x, shoulderY);
            ctx.lineTo(x + sizeH * 0.2 + danceArm, shoulderY - sizeH * 0.2);
            ctx.stroke();

        } else {
            // Normal walking/idle arms
            const armSwing = isMoving ? Math.sin(frame * 0.25) * sizeH * 0.1 : 0;

            ctx.beginPath();
            ctx.moveTo(x, shoulderY);
            ctx.lineTo(x - sizeH * 0.15 - armSwing, bodyY + sizeH * 0.05);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x, shoulderY);
            ctx.lineTo(x + sizeH * 0.15 + armSwing, bodyY + sizeH * 0.05);
            ctx.stroke();

            // Club held at side 
            ctx.strokeStyle = '#5A3A1A';
            ctx.lineWidth = Math.max(3, sizeH * 0.06);
            ctx.beginPath();
            ctx.moveTo(x + sizeH * 0.15 + armSwing, bodyY + sizeH * 0.05);
            ctx.lineTo(x + sizeH * 0.2 + armSwing, bodyY + sizeH * 0.25);
            ctx.stroke();
        }

        // === HEAD (circle) ===
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(x, headY - danceJump, sizeH * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = bodyColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x - sizeH * 0.03, headY - sizeH * 0.02 - danceJump, sizeH * 0.015, 0, Math.PI * 2);
        ctx.arc(x + sizeH * 0.03, headY - sizeH * 0.02 - danceJump, sizeH * 0.015, 0, Math.PI * 2);
        ctx.fill();

        // Angry eyebrows if hostile or waving
        if (isHostile || behavior === 'waving') {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x - sizeH * 0.05, headY - sizeH * 0.05 - danceJump);
            ctx.lineTo(x - sizeH * 0.02, headY - sizeH * 0.03 - danceJump);
            ctx.moveTo(x + sizeH * 0.05, headY - sizeH * 0.05 - danceJump);
            ctx.lineTo(x + sizeH * 0.02, headY - sizeH * 0.03 - danceJump);
            ctx.stroke();
        }

        // Hostile indicator
        if (isHostile) {
            ctx.fillStyle = '#FF4040';
            ctx.font = `${Math.max(10, sizeH * 0.25)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('⚠', x, headY - sizeH * 0.2 - danceJump);
        }
    }
}

