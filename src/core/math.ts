/**
 * Isometric Math Utilities
 * Handles conversion between World coordinates (grid) and Screen coordinates (pixels).
 * 
 * Projection: 2:1 Isometric
 * A 64x64 square becomes a 128x64 diamond.
 */

import type { Point, CameraState, Size } from './types';

// Constants
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32; // 2:1 ratio
export const TILE_HALF_W = TILE_WIDTH / 2;
export const TILE_HALF_H = TILE_HEIGHT / 2;

/**
 * Convert World Grid coordinates (x,y) to Screen Pixel coordinates (px,py)
 * 2:1 Isometric Projection
 */
export function worldToScreen(worldX: number, worldY: number): Point {
    // Standard isometric formula
    // screenX = (x - y) * halfWidth
    // screenY = (x + y) * halfHeight
    return {
        x: (worldX - worldY) * TILE_HALF_W,
        y: (worldX + worldY) * TILE_HALF_H
    };
}

/**
 * Convert Screen Pixel coordinates (px,py) to World Grid coordinates (x,y)
 * Inverse Isometric Projection
 */
export function screenToWorld(screenX: number, screenY: number): Point {
    // Inverse formula
    // worldX = (screenY / halfHeight + screenX / halfWidth) / 2
    // worldY = (screenY / halfHeight - screenX / halfWidth) / 2

    // We strictly use integer grid coordinates for logic, but return float here
    // Callers should Math.floor() if they need the specific tile index
    return {
        x: (screenY / TILE_HALF_H + screenX / TILE_HALF_W) / 2,
        y: (screenY / TILE_HALF_H - screenX / TILE_HALF_W) / 2
    };
}

/**
 * Apply Camera transform to a screen point to get the actual canvas drawing position
 * Canvas Origin (0,0) is drawing at the Camera's (x,y) World position
 */
export function worldToCanvas(
    worldX: number,
    worldY: number,
    camera: CameraState,
    viewport: Size
): Point {
    const screen = worldToScreen(worldX, worldY);

    // Camera transform:
    // 1. Convert Camera World Pos -> Screen Pos
    // 2. Center that Screen Pos in the Viewport

    const camScreen = worldToScreen(camera.x, camera.y);

    return {
        x: (screen.x - camScreen.x) * camera.zoom + (viewport.width / 2),
        y: (screen.y - camScreen.y) * camera.zoom + (viewport.height / 2)
    };
}

/**
 * Convert a Canvas pixel (e.g. mouse click) back to a World coordinate
 */
export function canvasToWorld(
    canvasX: number,
    canvasY: number,
    camera: CameraState,
    viewport: Size
): Point {
    const camScreen = worldToScreen(camera.x, camera.y);

    // Reverse the camera transform
    const screenX = (canvasX - viewport.width / 2) / camera.zoom + camScreen.x;
    const screenY = (canvasY - viewport.height / 2) / camera.zoom + camScreen.y;

    return screenToWorld(screenX, screenY);
}
