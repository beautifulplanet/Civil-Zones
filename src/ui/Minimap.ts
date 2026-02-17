/**
 * Minimap System
 * Shows explored areas in a corner overlay
 */

export class Minimap {
    private exploredTiles: Set<string> = new Set();
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private size: number = 120;
    private scale: number = 2; // Pixels per tile

    constructor() {
        // Create minimap canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'minimap';
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.canvas.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: ${this.size}px;
            height: ${this.size}px;
            border: 2px solid #444;
            border-radius: 4px;
            background: #1a1a1a;
            pointer-events: none;
            z-index: 1000;
            image-rendering: pixelated;
        `;

        const context = this.canvas.getContext('2d');
        if (!context) throw new Error('Could not get minimap context');
        this.ctx = context;

        document.body.appendChild(this.canvas);
    }

    /**
     * Mark tiles around player as explored
     */
    public explore(playerX: number, playerY: number, radius: number = 8): void {
        const px = Math.floor(playerX);
        const py = Math.floor(playerY);

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const key = `${px + dx},${py + dy}`;
                this.exploredTiles.add(key);
            }
        }
    }

    /**
     * Render the minimap
     */
    public render(playerX: number, playerY: number, getTile: (x: number, y: number) => { type: number } | null): void {
        const ctx = this.ctx;
        const px = Math.floor(playerX);
        const py = Math.floor(playerY);
        const halfTiles = Math.floor(this.size / this.scale / 2);

        // Clear with dark background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, this.size, this.size);

        // Draw tiles
        for (let dx = -halfTiles; dx <= halfTiles; dx++) {
            for (let dy = -halfTiles; dy <= halfTiles; dy++) {
                const worldX = px + dx;
                const worldY = py + dy;
                const key = `${worldX},${worldY}`;

                const screenX = (dx + halfTiles) * this.scale;
                const screenY = (dy + halfTiles) * this.scale;

                if (this.exploredTiles.has(key)) {
                    // Get tile type for coloring
                    const tile = getTile(worldX, worldY);
                    if (tile) {
                        // Color based on tile type
                        switch (tile.type) {
                            case 0: ctx.fillStyle = '#306030'; break; // GRASS
                            case 1: ctx.fillStyle = '#2060a0'; break; // WATER
                            case 2: ctx.fillStyle = '#b0a060'; break; // SAND
                            case 3: ctx.fillStyle = '#606060'; break; // STONE
                            case 4: ctx.fillStyle = '#1a4020'; break; // FOREST
                            case 5: ctx.fillStyle = '#6a4a10'; break; // DIRT
                            default: ctx.fillStyle = '#333'; break;
                        }
                    } else {
                        ctx.fillStyle = '#222';
                    }
                } else {
                    // Fog of war - very dark
                    ctx.fillStyle = '#0f0f0f';
                }

                ctx.fillRect(screenX, screenY, this.scale, this.scale);
            }
        }

        // Draw player marker (white dot in center)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.size / 2, this.size / 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Border around player view
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.size / 2 - 10, this.size / 2 - 10, 20, 20);
    }

    /**
     * Show/hide minimap
     */
    public setVisible(visible: boolean): void {
        this.canvas.style.display = visible ? 'block' : 'none';
    }
}
