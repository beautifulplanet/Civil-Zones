/**
 * Civil Zones - Input System Types
 * Type definitions for input handling
 */

// ═══════════════════════════════════════════════════════════════════
// CAMERA STATE
// ═══════════════════════════════════════════════════════════════════

/** Camera position and zoom */
export interface CameraState {
    x: number;          // World X position (center)
    y: number;          // World Y position (center)
    z: number;          // Zoom level
}

/** Camera constraints */
export interface CameraBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZoom: number;
    maxZoom: number;
}

// ═══════════════════════════════════════════════════════════════════
// MOUSE/POINTER STATE
// ═══════════════════════════════════════════════════════════════════

/** Current mouse/pointer state */
export interface PointerState {
    screenX: number;    // Screen coordinates
    screenY: number;
    worldX: number;     // World coordinates
    worldY: number;
    tileX: number;      // Tile coordinates
    tileY: number;
    isDragging: boolean;
    dragStartX: number;
    dragStartY: number;
    button: number;     // Which button is pressed (0=left, 1=middle, 2=right)
}

/** Pointer event data */
export interface PointerEvent {
    screenX: number;
    screenY: number;
    button: number;
    deltaX?: number;    // For wheel events
    deltaY?: number;
    target: EventTarget | null;
}

// ═══════════════════════════════════════════════════════════════════
// KEYBOARD STATE
// ═══════════════════════════════════════════════════════════════════

/** Direction keys for movement */
export type MovementKey = 'w' | 'a' | 's' | 'd' | 'q' | 'e' | 'z' | 'c' |
                          'W' | 'A' | 'S' | 'D' | 'Q' | 'E' | 'Z' | 'C' |
                          'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

/** Action keys */
export type ActionKey = 'Enter' | ' ' | 'Escape' | 'b' | 'B' | 'v' | 'V' | 'Shift';

/** Keyboard modifier state */
export interface ModifierState {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
    meta: boolean;
}

/** Keyboard event data */
export interface KeyboardEvent {
    key: string;
    code: string;
    modifiers: ModifierState;
    repeat: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// TOOL STATE
// ═══════════════════════════════════════════════════════════════════

/** Available tools/building modes */
export type ToolType = 
    | 'NONE'
    | 'PAN'
    | 'RES'      // Residential
    | 'COM'      // Commercial
    | 'IND'      // Industrial
    | 'ROAD'     // Road
    | 'WELL'     // Water well
    | 'FARM'     // Farm
    | 'MINE'     // Mine
    | 'FOREST'   // Forestry
    | 'DOCK'     // Dock
    | 'CHIEF'    // Chief's hut
    | 'STORAGE'  // Storage
    | 'DELETE';  // Demolish

/** Tool state for building mode */
export interface ToolState {
    currentTool: ToolType;
    selectedLevel: number;
    isActive: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// DRAG STATE (for roads, etc.)
// ═══════════════════════════════════════════════════════════════════

/** Road drag state */
export interface RoadDragState {
    isDragging: boolean;
    builtPositions: Set<string>;  // "x,y" format
    tileCount: number;
}

// ═══════════════════════════════════════════════════════════════════
// INPUT HANDLER CALLBACKS
// ═══════════════════════════════════════════════════════════════════

/** Callback for movement input */
export type MoveCallback = (dx: number, dy: number) => void;

/** Callback for tool/build click */
export type BuildCallback = (tool: ToolType, x: number, y: number) => void;

/** Callback for camera pan */
export type PanCallback = (dx: number, dy: number) => void;

/** Callback for zoom */
export type ZoomCallback = (factor: number) => void;

/** Callback for action keys */
export type ActionCallback = (action: string) => void;

/** Callback for tile click */
export type TileClickCallback = (x: number, y: number, button: number) => void;

// ═══════════════════════════════════════════════════════════════════
// INPUT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

/** Input system configuration */
export interface InputConfig {
    /** Tile size in pixels */
    tileSize: number;
    
    /** Camera bounds */
    bounds: CameraBounds;
    
    /** Zoom step multiplier */
    zoomStep: number;
    
    /** Initial camera position */
    startCamera: CameraState;
    
    /** Menu panel IDs to check for click-through prevention */
    menuPanelIds: string[];
}

/** Default input configuration */
export const DEFAULT_INPUT_CONFIG: InputConfig = {
    tileSize: 16,
    bounds: {
        minX: 0,
        maxX: 6400,
        minY: 0,
        maxY: 6400,
        minZoom: 0.5,
        maxZoom: 4.0
    },
    zoomStep: 1.15,
    startCamera: { x: 3200, y: 3200, z: 2.0 },
    menuPanelIds: [
        'building-menu-panel',
        'industrial-menu-panel',
        'commercial-menu-panel',
        'storage-menu-panel',
        'special-menu-panel',
        'road-menu-panel',
        'milestone-menu-panel'
    ]
};
