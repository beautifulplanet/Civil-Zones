/**
 * Camera Controller
 * Manages view position and zoom.
 */

import type { CameraState, Size } from '../core/types';
import { TILE_WIDTH, TILE_HEIGHT } from '../core/math';

export class Camera {
    public state: CameraState;
    public viewport: Size;

    constructor(viewportWidth: number, viewportHeight: number) {
        this.viewport = { width: viewportWidth, height: viewportHeight };
        this.state = {
            x: 0,
            y: 0,
            zoom: 1.0
        };
    }

    public resize(width: number, height: number): void {
        this.viewport = { width, height };
    }

    public pan(dx: number, dy: number): void {
        // dx/dy are screen pixels. Convert to world units based on zoom.
        this.state.x -= dx / this.state.zoom / (TILE_WIDTH / 2); // Approximate movement scaling
        this.state.y -= dy / this.state.zoom / (TILE_HEIGHT / 2);
    }

    public zoomAt(_screenX: number, _screenY: number, delta: number): void {
        const zoomSpeed = 0.1;
        const newZoom = Math.max(0.02, Math.min(3.0, this.state.zoom + delta * zoomSpeed));

        this.state.zoom = newZoom;
    }
}
