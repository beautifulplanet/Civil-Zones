/**
 * Civil Zones - Mouse/Pointer Input Handler
 * Handles mouse clicks, drags, and wheel events
 */

import type {
    CameraState,
    CameraBounds,
    PointerState,
    ToolType,
    RoadDragState,
    InputConfig,
    TileClickCallback,
    PanCallback,
    ZoomCallback,
    BuildCallback,
    DEFAULT_INPUT_CONFIG
} from './types.js';

// ═══════════════════════════════════════════════════════════════════
// COORDINATE CONVERSION
// ═══════════════════════════════════════════════════════════════════

/** Convert screen coordinates to world coordinates */
export function screenToWorld(
    screenX: number,
    screenY: number,
    camera: CameraState,
    canvasWidth: number,
    canvasHeight: number
): { x: number; y: number } {
    const wx = (screenX - canvasWidth / 2) / camera.z + camera.x;
    const wy = (screenY - canvasHeight / 2) / camera.z + camera.y;
    return { x: wx, y: wy };
}

/** Convert world coordinates to tile coordinates */
export function worldToTile(worldX: number, worldY: number, tileSize: number): { x: number; y: number } {
    return {
        x: Math.floor(worldX / tileSize),
        y: Math.floor(worldY / tileSize)
    };
}

/** Convert screen coordinates directly to tile coordinates */
export function screenToTile(
    screenX: number,
    screenY: number,
    camera: CameraState,
    canvasWidth: number,
    canvasHeight: number,
    tileSize: number
): { x: number; y: number } {
    const world = screenToWorld(screenX, screenY, camera, canvasWidth, canvasHeight);
    return worldToTile(world.x, world.y, tileSize);
}

// ═══════════════════════════════════════════════════════════════════
// CAMERA OPERATIONS
// ═══════════════════════════════════════════════════════════════════

/** Clamp camera position within bounds */
export function clampCamera(camera: CameraState, bounds: CameraBounds): CameraState {
    return {
        x: Math.max(bounds.minX, Math.min(bounds.maxX, camera.x)),
        y: Math.max(bounds.minY, Math.min(bounds.maxY, camera.y)),
        z: Math.max(bounds.minZoom, Math.min(bounds.maxZoom, camera.z))
    };
}

/** Apply pan delta to camera */
export function panCamera(
    camera: CameraState,
    deltaX: number,
    deltaY: number,
    bounds: CameraBounds
): CameraState {
    const newCam = {
        x: camera.x - deltaX / camera.z,
        y: camera.y - deltaY / camera.z,
        z: camera.z
    };
    return clampCamera(newCam, bounds);
}

/** Apply zoom to camera */
export function zoomCamera(
    camera: CameraState,
    factor: number,
    bounds: CameraBounds
): CameraState {
    const newCam = {
        ...camera,
        z: Math.max(bounds.minZoom, Math.min(bounds.maxZoom, camera.z * factor))
    };
    return newCam;
}

// ═══════════════════════════════════════════════════════════════════
// CLICK DETECTION UTILITIES
// ═══════════════════════════════════════════════════════════════════

/** Check if click is on canvas (not UI element) */
export function isClickOnCanvas(target: EventTarget | null, canvas: HTMLCanvasElement): boolean {
    return target === canvas;
}

/** Check if point is inside a rectangle */
export function isPointInRect(
    x: number,
    y: number,
    rect: { left: number; right: number; top: number; bottom: number }
): boolean {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

/** Check if click is blocked by open menu panel */
export function isClickBlockedByMenu(
    clientX: number,
    clientY: number,
    menuPanelIds: string[]
): boolean {
    for (const panelId of menuPanelIds) {
        const panel = document.getElementById(panelId);
        if (panel && panel.style.display !== 'none' && panel.style.display !== '') {
            const rect = panel.getBoundingClientRect();
            if (isPointInRect(clientX, clientY, rect)) {
                return true;
            }
        }
    }
    return false;
}

// ═══════════════════════════════════════════════════════════════════
// ROAD DRAG STATE
// ═══════════════════════════════════════════════════════════════════

/** Create initial road drag state */
export function createRoadDragState(): RoadDragState {
    return {
        isDragging: false,
        builtPositions: new Set(),
        tileCount: 0
    };
}

/** Start road drag */
export function startRoadDrag(state: RoadDragState, x: number, y: number): RoadDragState {
    const newState = {
        isDragging: true,
        builtPositions: new Set<string>(),
        tileCount: 0
    };
    newState.builtPositions.add(`${x},${y}`);
    return newState;
}

/** Add position to road drag */
export function addRoadDragPosition(state: RoadDragState, x: number, y: number): RoadDragState {
    const key = `${x},${y}`;
    if (state.builtPositions.has(key)) {
        return state;
    }
    const newBuilt = new Set(state.builtPositions);
    newBuilt.add(key);
    return {
        isDragging: true,
        builtPositions: newBuilt,
        tileCount: state.tileCount + 1
    };
}

/** End road drag */
export function endRoadDrag(): RoadDragState {
    return createRoadDragState();
}

// ═══════════════════════════════════════════════════════════════════
// MOUSE HANDLER CLASS
// ═══════════════════════════════════════════════════════════════════

export interface MouseHandlerConfig {
    /** Canvas element to attach to */
    canvas: HTMLCanvasElement;
    
    /** Get current camera state */
    getCamera: () => CameraState;
    
    /** Update camera state */
    setCamera: (camera: CameraState) => void;
    
    /** Get current tool */
    getTool: () => ToolType;
    
    /** Input configuration */
    config: InputConfig;
    
    /** Called when tile is clicked (left click) */
    onTileClick?: TileClickCallback;
    
    /** Called when building with tool */
    onBuild?: BuildCallback;
    
    /** Called on zoom */
    onZoom?: ZoomCallback;
    
    /** Place road silently (for drag building) */
    placeRoadSilent?: (x: number, y: number) => boolean;
    
    /** Show toast message */
    showToast?: (message: string) => void;
    
    /** Get canvas dimensions */
    getCanvasDimensions: () => { width: number; height: number };
}

export class MouseHandler {
    private config: MouseHandlerConfig;
    private pointerState: PointerState;
    private roadDragState: RoadDragState;
    private enabled: boolean = false;
    
    // Bound event handlers
    private boundMouseDown: (e: MouseEvent) => void;
    private boundMouseUp: (e: MouseEvent) => void;
    private boundMouseMove: (e: MouseEvent) => void;
    private boundWheel: (e: WheelEvent) => void;
    private boundContextMenu: (e: MouseEvent) => void;

    constructor(config: MouseHandlerConfig) {
        this.config = config;
        this.pointerState = this.createInitialPointerState();
        this.roadDragState = createRoadDragState();
        
        this.boundMouseDown = this.handleMouseDown.bind(this);
        this.boundMouseUp = this.handleMouseUp.bind(this);
        this.boundMouseMove = this.handleMouseMove.bind(this);
        this.boundWheel = this.handleWheel.bind(this);
        this.boundContextMenu = (e) => e.preventDefault();
    }

    private createInitialPointerState(): PointerState {
        return {
            screenX: 0,
            screenY: 0,
            worldX: 0,
            worldY: 0,
            tileX: 0,
            tileY: 0,
            isDragging: false,
            dragStartX: 0,
            dragStartY: 0,
            button: 0
        };
    }

    /** Get current tile position */
    getTilePosition(): { x: number; y: number } {
        return { x: this.pointerState.tileX, y: this.pointerState.tileY };
    }

    /** Start listening for mouse events */
    enable(): void {
        if (this.enabled) return;
        const canvas = this.config.canvas;
        
        canvas.addEventListener('mousedown', this.boundMouseDown);
        window.addEventListener('mouseup', this.boundMouseUp);
        window.addEventListener('mousemove', this.boundMouseMove);
        canvas.addEventListener('wheel', this.boundWheel, { passive: false });
        canvas.addEventListener('contextmenu', this.boundContextMenu);
        
        this.enabled = true;
    }

    /** Stop listening for mouse events */
    disable(): void {
        if (!this.enabled) return;
        const canvas = this.config.canvas;
        
        canvas.removeEventListener('mousedown', this.boundMouseDown);
        window.removeEventListener('mouseup', this.boundMouseUp);
        window.removeEventListener('mousemove', this.boundMouseMove);
        canvas.removeEventListener('wheel', this.boundWheel);
        canvas.removeEventListener('contextmenu', this.boundContextMenu);
        
        this.enabled = false;
    }

    private updatePointerPosition(e: MouseEvent): void {
        const canvas = this.config.canvas;
        const rect = canvas.getBoundingClientRect();
        const camera = this.config.getCamera();
        const dims = this.config.getCanvasDimensions();
        const tileSize = this.config.config.tileSize;
        
        this.pointerState.screenX = e.clientX - rect.left;
        this.pointerState.screenY = e.clientY - rect.top;
        
        const world = screenToWorld(
            this.pointerState.screenX,
            this.pointerState.screenY,
            camera,
            dims.width,
            dims.height
        );
        this.pointerState.worldX = world.x;
        this.pointerState.worldY = world.y;
        
        const tile = worldToTile(world.x, world.y, tileSize);
        this.pointerState.tileX = tile.x;
        this.pointerState.tileY = tile.y;
    }

    private handleMouseDown(e: MouseEvent): void {
        const canvas = this.config.canvas;
        
        // Check if click is on canvas
        if (!isClickOnCanvas(e.target, canvas)) {
            return;
        }
        
        // Check if blocked by menu
        if (isClickBlockedByMenu(e.clientX, e.clientY, this.config.config.menuPanelIds)) {
            return;
        }
        
        this.updatePointerPosition(e);
        
        // Left click
        if (e.button === 0) {
            const tool = this.config.getTool();
            
            if (tool !== 'NONE' && tool !== 'PAN') {
                // Road drag mode
                if (tool === 'ROAD') {
                    this.roadDragState = startRoadDrag(
                        this.roadDragState,
                        this.pointerState.tileX,
                        this.pointerState.tileY
                    );
                    
                    // Place first road tile
                    if (this.config.placeRoadSilent?.(
                        this.pointerState.tileX,
                        this.pointerState.tileY
                    )) {
                        this.roadDragState.tileCount++;
                    }
                    return;
                }
                
                // Building mode
                this.config.onBuild?.(
                    tool,
                    this.pointerState.tileX,
                    this.pointerState.tileY
                );
            } else {
                // Click to move/interact
                this.config.onTileClick?.(
                    this.pointerState.tileX,
                    this.pointerState.tileY,
                    0
                );
            }
        }
        // Middle or right click: pan camera
        else if (e.button === 1 || e.button === 2) {
            this.pointerState.isDragging = true;
            this.pointerState.dragStartX = e.clientX;
            this.pointerState.dragStartY = e.clientY;
            this.pointerState.button = e.button;
            document.body.style.cursor = 'grabbing';
        }
    }

    private handleMouseUp(e: MouseEvent): void {
        // End camera drag
        this.pointerState.isDragging = false;
        document.body.style.cursor = 'default';
        
        // End road drag with summary
        if (this.roadDragState.isDragging) {
            if (this.roadDragState.tileCount > 0 && this.config.showToast) {
                if (this.roadDragState.tileCount === 1) {
                    this.config.showToast('🛣️ Road placed! (Drag to draw roads)');
                } else {
                    this.config.showToast(`🛣️ Built ${this.roadDragState.tileCount} road tiles!`);
                }
            }
            this.roadDragState = endRoadDrag();
        }
    }

    private handleMouseMove(e: MouseEvent): void {
        this.updatePointerPosition(e);
        
        // Camera pan drag
        if (this.pointerState.isDragging) {
            const deltaX = e.clientX - this.pointerState.dragStartX;
            const deltaY = e.clientY - this.pointerState.dragStartY;
            
            const camera = this.config.getCamera();
            const newCamera = panCamera(camera, deltaX, deltaY, this.config.config.bounds);
            this.config.setCamera(newCamera);
            
            this.pointerState.dragStartX = e.clientX;
            this.pointerState.dragStartY = e.clientY;
        }
        
        // Road drag building
        if (this.roadDragState.isDragging && this.config.getTool() === 'ROAD') {
            const key = `${this.pointerState.tileX},${this.pointerState.tileY}`;
            if (!this.roadDragState.builtPositions.has(key)) {
                if (this.config.placeRoadSilent?.(
                    this.pointerState.tileX,
                    this.pointerState.tileY
                )) {
                    this.roadDragState = addRoadDragPosition(
                        this.roadDragState,
                        this.pointerState.tileX,
                        this.pointerState.tileY
                    );
                } else {
                    // Track position even if build failed to avoid spam
                    this.roadDragState.builtPositions.add(key);
                }
            }
        }
        
        // Update debug display (optional)
        const debug = document.getElementById('debug');
        if (debug) {
            debug.innerText = `Pos: ${this.pointerState.tileX}, ${this.pointerState.tileY}`;
        }
    }

    private handleWheel(e: WheelEvent): void {
        e.preventDefault();
        
        const factor = e.deltaY < 0 
            ? this.config.config.zoomStep 
            : 1 / this.config.config.zoomStep;
        
        const camera = this.config.getCamera();
        const newCamera = zoomCamera(camera, factor, this.config.config.bounds);
        this.config.setCamera(newCamera);
        
        this.config.onZoom?.(factor);
    }
}

// ═══════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/** Create a mouse handler with standard game controls */
export function createMouseHandler(config: MouseHandlerConfig): MouseHandler {
    return new MouseHandler(config);
}
