// ═══════════════════════════════════════════════════════════════════════════════
// CIVIL ZONES: STONE AGE - Renderer
// ═══════════════════════════════════════════════════════════════════════════════
// Canvas rendering with zoom and pan
// ═══════════════════════════════════════════════════════════════════════════════

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Camera
        this.cameraX = 0;
        this.cameraY = 0;
        this.zoom = CFG.ZOOM.DEFAULT;
        
        // Rendering
        this.tileSize = CFG.MAP.TILE_SIZE;
        this.lastFrame = 0;
        this.fps = 0;
        
        // Dragging
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        
        // Selection
        this.selectedTile = null;
        this.hoverTile = null;
        
        // Animation
        this.animFrame = 0;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Setup
    // ─────────────────────────────────────────────────────────────────────────
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupControls();
    }

    resize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    setupControls() {
        // Mouse wheel zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const oldZoom = this.zoom;
            
            if (e.deltaY < 0) {
                this.zoom = Math.min(CFG.ZOOM.MAX, this.zoom * CFG.ZOOM.STEP);
            } else {
                this.zoom = Math.max(CFG.ZOOM.MIN, this.zoom / CFG.ZOOM.STEP);
            }
            
            // Zoom toward mouse position
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const worldX = (mouseX / oldZoom) + this.cameraX;
            const worldY = (mouseY / oldZoom) + this.cameraY;
            
            this.cameraX = worldX - (mouseX / this.zoom);
            this.cameraY = worldY - (mouseY / this.zoom);
        });
        
        // Pan with middle mouse / right click drag
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 1 || e.button === 2) {
                e.preventDefault();
                this.isDragging = true;
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const dx = e.clientX - this.dragStartX;
                const dy = e.clientY - this.dragStartY;
                this.cameraX -= dx / this.zoom;
                this.cameraY -= dy / this.zoom;
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
            }
            
            // Track hover tile
            this.updateHoverTile(e);
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.hoverTile = null;
        });
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Click selection
        this.canvas.addEventListener('click', (e) => {
            this.handleClick(e);
        });
    }

    updateHoverTile(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const worldX = (mouseX / this.zoom) + this.cameraX;
        const worldY = (mouseY / this.zoom) + this.cameraY;
        
        const tileX = Math.floor(worldX / this.tileSize);
        const tileY = Math.floor(worldY / this.tileSize);
        
        this.hoverTile = { x: tileX, y: tileY };
    }

    handleClick(e) {
        if (this.hoverTile) {
            this.selectedTile = { ...this.hoverTile };
            // Dispatch custom event for UI
            const event = new CustomEvent('tileSelected', { 
                detail: this.selectedTile 
            });
            window.dispatchEvent(event);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Center Camera on Player
    // ─────────────────────────────────────────────────────────────────────────
    centerOn(x, y) {
        const screenCenterX = this.canvas.width / 2 / this.zoom;
        const screenCenterY = this.canvas.height / 2 / this.zoom;
        
        this.cameraX = (x * this.tileSize) - screenCenterX + (this.tileSize / 2);
        this.cameraY = (y * this.tileSize) - screenCenterY + (this.tileSize / 2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Main Render Loop
    // ─────────────────────────────────────────────────────────────────────────
    render(game) {
        const now = performance.now();
        this.fps = Math.round(1000 / (now - this.lastFrame));
        this.lastFrame = now;
        this.animFrame++;
        
        const ctx = this.ctx;
        const map = game.map;
        
        // Clear
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply camera transform
        ctx.save();
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.cameraX, -this.cameraY);
        
        // Calculate visible tiles
        const startTileX = Math.max(0, Math.floor(this.cameraX / this.tileSize) - 1);
        const startTileY = Math.max(0, Math.floor(this.cameraY / this.tileSize) - 1);
        const endTileX = Math.min(map.width, startTileX + Math.ceil(this.canvas.width / this.zoom / this.tileSize) + 2);
        const endTileY = Math.min(map.height, startTileY + Math.ceil(this.canvas.height / this.zoom / this.tileSize) + 2);
        
        // Draw tiles
        for (let y = startTileY; y < endTileY; y++) {
            for (let x = startTileX; x < endTileX; x++) {
                this.drawTile(ctx, map, x, y);
            }
        }
        
        // Draw entities
        this.drawEntities(ctx, map, startTileX, startTileY, endTileX, endTileY);
        
        // Draw animals
        this.drawAnimals(ctx, map, startTileX, startTileY, endTileX, endTileY);
        
        // Draw buildings
        this.drawBuildings(ctx, map, startTileX, startTileY, endTileX, endTileY);
        
        // Draw wells
        this.drawWells(ctx, game.wells, startTileX, startTileY, endTileX, endTileY);
        
        // Draw player
        if (game.mode === 'WANDER') {
            this.drawPlayer(ctx, game.player);
        }
        
        // Draw selection/hover highlight
        this.drawHighlight(ctx);
        
        ctx.restore();
        
        // Draw UI overlay (not affected by camera)
        this.drawOverlay(ctx, game);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Draw Tile
    // ─────────────────────────────────────────────────────────────────────────
    drawTile(ctx, map, x, y) {
        const tile = map.getTile(x, y);
        if (!tile) return;
        
        const px = x * this.tileSize;
        const py = y * this.tileSize;
        
        // Fog of war
        if (!map.isRevealed(x, y)) {
            ctx.fillStyle = '#111';
            ctx.fillRect(px, py, this.tileSize, this.tileSize);
            return;
        }
        
        // Base tile color
        ctx.fillStyle = tile.color;
        ctx.fillRect(px, py, this.tileSize, this.tileSize);
        
        // Water animation
        if (tile.type === 'WATER') {
            const wave = Math.sin((this.animFrame + x * 10 + y * 10) / 20) * 0.1;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + wave})`;
            ctx.fillRect(px, py, this.tileSize, this.tileSize);
        }
        
        // Road overlay
        if (tile.road) {
            ctx.fillStyle = 'rgba(139, 119, 101, 0.7)';
            ctx.fillRect(px + 4, py + 4, this.tileSize - 8, this.tileSize - 8);
        }
        
        // Tree
        if (tile.hasTree) {
            ctx.font = `${this.tileSize * 0.7}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🌲', px + this.tileSize / 2, py + this.tileSize / 2);
        }
        
        // Grid lines (subtle)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.strokeRect(px, py, this.tileSize, this.tileSize);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Draw Entities
    // ─────────────────────────────────────────────────────────────────────────
    drawEntities(ctx, map, startX, startY, endX, endY) {
        for (const entity of map.entities) {
            if (entity.collected) continue;
            if (entity.x < startX || entity.x >= endX || entity.y < startY || entity.y >= endY) continue;
            if (!map.isRevealed(entity.x, entity.y)) continue;
            
            const px = entity.x * this.tileSize;
            const py = entity.y * this.tileSize;
            
            ctx.font = `${this.tileSize * 0.6}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            let icon = '❓';
            if (entity.type === 'BERRY') icon = '🍇';
            else if (entity.type === 'NOMAD') icon = '👤';
            else if (entity.type === 'STONE') icon = '🪨';
            
            ctx.fillText(icon, px + this.tileSize / 2, py + this.tileSize / 2);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Draw Animals
    // ─────────────────────────────────────────────────────────────────────────
    drawAnimals(ctx, map, startX, startY, endX, endY) {
        for (const animal of map.animals) {
            if (animal.x < startX || animal.x >= endX || animal.y < startY || animal.y >= endY) continue;
            if (!map.isRevealed(animal.x, animal.y)) continue;
            
            const px = animal.x * this.tileSize;
            const py = animal.y * this.tileSize;
            
            ctx.font = `${this.tileSize * 0.7}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            let icon = '🦌';
            if (animal.type === 'BISON') icon = '🦬';
            else if (animal.type === 'MAMMOTH') icon = '🦣';
            
            ctx.fillText(icon, px + this.tileSize / 2, py + this.tileSize / 2);
            
            // Herd size badge
            if (animal.herdSize > 1) {
                ctx.font = `${this.tileSize * 0.3}px Arial`;
                ctx.fillStyle = '#fff';
                ctx.fillText(`×${animal.herdSize}`, px + this.tileSize * 0.75, py + this.tileSize * 0.8);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Draw Buildings
    // ─────────────────────────────────────────────────────────────────────────
    drawBuildings(ctx, map, startX, startY, endX, endY) {
        for (const building of map.buildings) {
            if (building.x < startX || building.x >= endX || building.y < startY || building.y >= endY) continue;
            
            const px = building.x * this.tileSize;
            const py = building.y * this.tileSize;
            
            const def = CFG.BUILDINGS[building.key];
            const stateInfo = def.states[building.state];
            
            // Building background
            let bgColor = '#666'; // RES
            if (building.type === 'COM') bgColor = '#4169E1';
            else if (building.type === 'IND') bgColor = '#DAA520';
            
            ctx.fillStyle = bgColor;
            ctx.fillRect(px + 2, py + 2, this.tileSize - 4, this.tileSize - 4);
            
            // Icon
            ctx.font = `${this.tileSize * 0.6}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(stateInfo.icon, px + this.tileSize / 2, py + this.tileSize / 2);
            
            // Population indicator (for RES)
            if (building.type === 'RES' && building.population > 0) {
                ctx.font = `${this.tileSize * 0.25}px Arial`;
                ctx.fillStyle = '#fff';
                ctx.fillText(building.population, px + this.tileSize * 0.75, py + this.tileSize * 0.85);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Draw Wells
    // ─────────────────────────────────────────────────────────────────────────
    drawWells(ctx, wells, startX, startY, endX, endY) {
        for (const well of wells) {
            if (well.x < startX || well.x >= endX || well.y < startY || well.y >= endY) continue;
            
            const px = well.x * this.tileSize;
            const py = well.y * this.tileSize;
            
            ctx.font = `${this.tileSize * 0.7}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(CFG.WELL.icon, px + this.tileSize / 2, py + this.tileSize / 2);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Draw Player
    // ─────────────────────────────────────────────────────────────────────────
    drawPlayer(ctx, player) {
        const px = player.x * this.tileSize;
        const py = player.y * this.tileSize;
        
        // Player glow
        const gradient = ctx.createRadialGradient(
            px + this.tileSize / 2, py + this.tileSize / 2, 0,
            px + this.tileSize / 2, py + this.tileSize / 2, this.tileSize
        );
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(px - this.tileSize / 2, py - this.tileSize / 2, this.tileSize * 2, this.tileSize * 2);
        
        // Player icon
        ctx.font = `${this.tileSize * 0.8}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Bounce animation
        const bounce = Math.sin(this.animFrame / 10) * 2;
        ctx.fillText('🧑', px + this.tileSize / 2, py + this.tileSize / 2 + bounce);
        
        // Population badge
        if (player.population > 1) {
            ctx.font = `${this.tileSize * 0.3}px Arial`;
            ctx.fillStyle = '#fff';
            ctx.fillText(`×${player.population}`, px + this.tileSize * 0.8, py + this.tileSize * 0.2);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Draw Selection Highlight
    // ─────────────────────────────────────────────────────────────────────────
    drawHighlight(ctx) {
        // Hover highlight
        if (this.hoverTile) {
            const px = this.hoverTile.x * this.tileSize;
            const py = this.hoverTile.y * this.tileSize;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(px, py, this.tileSize, this.tileSize);
        }
        
        // Selected tile
        if (this.selectedTile) {
            const px = this.selectedTile.x * this.tileSize;
            const py = this.selectedTile.y * this.tileSize;
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.strokeRect(px + 1, py + 1, this.tileSize - 2, this.tileSize - 2);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Draw UI Overlay
    // ─────────────────────────────────────────────────────────────────────────
    drawOverlay(ctx, game) {
        // Mini-map (top-right corner)
        this.drawMinimap(ctx, game);
        
        // FPS counter (debug)
        ctx.font = '12px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(`FPS: ${this.fps}`, 10, this.canvas.height - 10);
        
        // Coordinates
        if (game.mode === 'WANDER') {
            ctx.fillText(`Pos: (${game.player.x}, ${game.player.y})`, 10, this.canvas.height - 25);
        }
    }

    drawMinimap(ctx, game) {
        const map = game.map;
        const size = 150;
        const margin = 10;
        const x = this.canvas.width - size - margin;
        const y = margin;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, size, size);
        ctx.strokeStyle = '#444';
        ctx.strokeRect(x, y, size, size);
        
        // Scale factor
        const scale = size / Math.max(map.width, map.height);
        
        // Draw terrain
        for (let ty = 0; ty < map.height; ty++) {
            for (let tx = 0; tx < map.width; tx++) {
                if (!map.isRevealed(tx, ty)) continue;
                
                const tile = map.getTile(tx, ty);
                if (!tile) continue;
                
                ctx.fillStyle = tile.color;
                ctx.fillRect(x + tx * scale, y + ty * scale, Math.ceil(scale), Math.ceil(scale));
            }
        }
        
        // Draw player position
        if (game.mode === 'WANDER') {
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(
                x + game.player.x * scale - 2,
                y + game.player.y * scale - 2,
                4, 4
            );
        }
        
        // Draw settlement
        if (game.mode === 'CITY') {
            ctx.fillStyle = '#FF4444';
            ctx.fillRect(
                x + game.settlement.x * scale - 3,
                y + game.settlement.y * scale - 3,
                6, 6
            );
        }
        
        // Draw viewport rectangle
        const vpX = this.cameraX / this.tileSize * scale;
        const vpY = this.cameraY / this.tileSize * scale;
        const vpW = (this.canvas.width / this.zoom / this.tileSize) * scale;
        const vpH = (this.canvas.height / this.zoom / this.tileSize) * scale;
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + vpX, y + vpY, vpW, vpH);
    }
}

window.Renderer = Renderer;
