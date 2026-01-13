/**
 * Civil Zones - Camera System
 * Handles viewport positioning, zoom, and screen-to-world coordinate conversion
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Camera {
    x: number;      // World X position (center of viewport)
    y: number;      // World Y position (center of viewport)
    z: number;      // Zoom level (1.0 = 100%)
}

export interface Viewport {
    width: number;
    height: number;
}

export interface TileRange {
    startCol: number;
    endCol: number;
    startRow: number;
    endRow: number;
}

export interface CameraConfig {
    minZoom: number;
    maxZoom: number;
    zoomSpeed: number;
    panSpeed: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
    minZoom: 0.15,
    maxZoom: 5.0,
    zoomSpeed: 0.1,
    panSpeed: 10
};

// ═══════════════════════════════════════════════════════════════════════════════
// CAMERA CREATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a new camera centered on a position
 */
export function createCamera(x: number = 0, y: number = 0, zoom: number = 1.0): Camera {
    return { x, y, z: zoom };
}

/**
 * Create camera centered on map
 */
export function createCenteredCamera(
    mapWidth: number,
    mapHeight: number,
    tileSize: number,
    zoom: number = 1.0
): Camera {
    return {
        x: (mapWidth * tileSize) / 2,
        y: (mapHeight * tileSize) / 2,
        z: zoom
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COORDINATE CONVERSION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convert screen coordinates to world coordinates
 */
export function screenToWorld(
    screenX: number,
    screenY: number,
    camera: Camera,
    viewport: Viewport
): { x: number; y: number } {
    const worldX = camera.x + (screenX - viewport.width / 2) / camera.z;
    const worldY = camera.y + (screenY - viewport.height / 2) / camera.z;
    
    return { x: worldX, y: worldY };
}

/**
 * Convert world coordinates to screen coordinates
 */
export function worldToScreen(
    worldX: number,
    worldY: number,
    camera: Camera,
    viewport: Viewport
): { x: number; y: number } {
    const screenX = viewport.width / 2 + (worldX - camera.x) * camera.z;
    const screenY = viewport.height / 2 + (worldY - camera.y) * camera.z;
    
    return { x: screenX, y: screenY };
}

/**
 * Convert screen coordinates to tile coordinates
 */
export function screenToTile(
    screenX: number,
    screenY: number,
    camera: Camera,
    viewport: Viewport,
    tileSize: number
): { x: number; y: number } {
    const world = screenToWorld(screenX, screenY, camera, viewport);
    
    return {
        x: Math.floor(world.x / tileSize),
        y: Math.floor(world.y / tileSize)
    };
}

/**
 * Convert tile coordinates to screen coordinates (tile center)
 */
export function tileToScreen(
    tileX: number,
    tileY: number,
    camera: Camera,
    viewport: Viewport,
    tileSize: number
): { x: number; y: number } {
    const worldX = tileX * tileSize + tileSize / 2;
    const worldY = tileY * tileSize + tileSize / 2;
    
    return worldToScreen(worldX, worldY, camera, viewport);
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISIBLE TILE RANGE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate the range of tiles visible in the viewport
 */
export function getVisibleTileRange(
    camera: Camera,
    viewport: Viewport,
    tileSize: number,
    mapWidth: number,
    mapHeight: number
): TileRange {
    // Calculate world bounds of viewport
    const halfWidth = (viewport.width / camera.z) / 2;
    const halfHeight = (viewport.height / camera.z) / 2;
    
    // Convert to tile coordinates with padding
    const startCol = Math.max(0, Math.floor((camera.x - halfWidth) / tileSize));
    const endCol = Math.min(mapWidth, Math.ceil((camera.x + halfWidth) / tileSize));
    const startRow = Math.max(0, Math.floor((camera.y - halfHeight) / tileSize));
    const endRow = Math.min(mapHeight, Math.ceil((camera.y + halfHeight) / tileSize));
    
    return { startCol, endCol, startRow, endRow };
}

/**
 * Check if a tile is visible in the viewport
 */
export function isTileVisible(
    tileX: number,
    tileY: number,
    camera: Camera,
    viewport: Viewport,
    tileSize: number
): boolean {
    const halfWidth = (viewport.width / camera.z) / 2;
    const halfHeight = (viewport.height / camera.z) / 2;
    
    const tileLeft = tileX * tileSize;
    const tileRight = tileLeft + tileSize;
    const tileTop = tileY * tileSize;
    const tileBottom = tileTop + tileSize;
    
    const viewLeft = camera.x - halfWidth;
    const viewRight = camera.x + halfWidth;
    const viewTop = camera.y - halfHeight;
    const viewBottom = camera.y + halfHeight;
    
    return !(tileRight < viewLeft || tileLeft > viewRight ||
             tileBottom < viewTop || tileTop > viewBottom);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAMERA MOVEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Pan camera by screen delta
 */
export function panCamera(
    camera: Camera,
    deltaX: number,
    deltaY: number
): Camera {
    return {
        ...camera,
        x: camera.x + deltaX / camera.z,
        y: camera.y + deltaY / camera.z
    };
}

/**
 * Center camera on a world position
 */
export function centerCameraOn(
    camera: Camera,
    worldX: number,
    worldY: number
): Camera {
    return {
        ...camera,
        x: worldX,
        y: worldY
    };
}

/**
 * Center camera on a tile
 */
export function centerCameraOnTile(
    camera: Camera,
    tileX: number,
    tileY: number,
    tileSize: number
): Camera {
    return {
        ...camera,
        x: tileX * tileSize + tileSize / 2,
        y: tileY * tileSize + tileSize / 2
    };
}

/**
 * Zoom camera around a point
 */
export function zoomCamera(
    camera: Camera,
    delta: number,
    config: CameraConfig = DEFAULT_CAMERA_CONFIG
): Camera {
    const newZoom = Math.max(
        config.minZoom,
        Math.min(config.maxZoom, camera.z + delta * config.zoomSpeed)
    );
    
    return {
        ...camera,
        z: newZoom
    };
}

/**
 * Zoom camera centered on a screen position
 */
export function zoomCameraAt(
    camera: Camera,
    screenX: number,
    screenY: number,
    viewport: Viewport,
    delta: number,
    config: CameraConfig = DEFAULT_CAMERA_CONFIG
): Camera {
    // Get world position under cursor before zoom
    const worldBefore = screenToWorld(screenX, screenY, camera, viewport);
    
    // Apply zoom
    const newZoom = Math.max(
        config.minZoom,
        Math.min(config.maxZoom, camera.z + delta * config.zoomSpeed)
    );
    
    // Get world position under cursor after zoom (with new zoom but old camera pos)
    const tempCamera = { ...camera, z: newZoom };
    const worldAfter = screenToWorld(screenX, screenY, tempCamera, viewport);
    
    // Adjust camera position to keep world point under cursor
    return {
        x: camera.x + (worldBefore.x - worldAfter.x),
        y: camera.y + (worldBefore.y - worldAfter.y),
        z: newZoom
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAMERA CONSTRAINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Clamp camera to map bounds
 */
export function clampCameraToMap(
    camera: Camera,
    viewport: Viewport,
    mapWidth: number,
    mapHeight: number,
    tileSize: number
): Camera {
    const worldWidth = mapWidth * tileSize;
    const worldHeight = mapHeight * tileSize;
    
    const halfViewWidth = (viewport.width / camera.z) / 2;
    const halfViewHeight = (viewport.height / camera.z) / 2;
    
    // Clamp X
    let x = camera.x;
    if (halfViewWidth * 2 >= worldWidth) {
        // View is wider than map - center it
        x = worldWidth / 2;
    } else {
        x = Math.max(halfViewWidth, Math.min(worldWidth - halfViewWidth, x));
    }
    
    // Clamp Y
    let y = camera.y;
    if (halfViewHeight * 2 >= worldHeight) {
        // View is taller than map - center it
        y = worldHeight / 2;
    } else {
        y = Math.max(halfViewHeight, Math.min(worldHeight - halfViewHeight, y));
    }
    
    return { x, y, z: camera.z };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CANVAS TRANSFORM HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Apply camera transform to canvas context
 */
export function applyCameraTransform(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    viewport: Viewport
): void {
    ctx.save();
    ctx.translate(viewport.width / 2, viewport.height / 2);
    ctx.scale(camera.z, camera.z);
    ctx.translate(-camera.x, -camera.y);
}

/**
 * Restore canvas context after camera transform
 */
export function restoreCameraTransform(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
}
