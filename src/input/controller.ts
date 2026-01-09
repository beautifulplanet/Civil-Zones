/**
 * Civil Zones - Input Controller
 * Unified input controller that combines keyboard and mouse handling
 */

import type {
    CameraState,
    CameraBounds,
    ToolType,
    ToolState,
    InputConfig,
    MoveCallback,
    BuildCallback,
    ActionCallback,
    TileClickCallback,
    DEFAULT_INPUT_CONFIG
} from './types.js';
import { KeyboardHandler, isShiftHeld } from './keyboard.js';
import { MouseHandler, clampCamera, createMouseHandler } from './mouse.js';

// ═══════════════════════════════════════════════════════════════════
// INPUT CONTROLLER
// ═══════════════════════════════════════════════════════════════════

export interface InputControllerConfig {
    /** Canvas element */
    canvas: HTMLCanvasElement;
    
    /** Input configuration */
    inputConfig?: InputConfig;
    
    /** Initial camera state */
    initialCamera?: CameraState;
    
    // Callbacks
    onMove?: MoveCallback;
    onBuild?: BuildCallback;
    onAction?: ActionCallback;
    onTileClick?: TileClickCallback;
    onCameraChange?: (camera: CameraState) => void;
    
    // Game state queries
    shouldBlockInput?: () => boolean;
    isLimitedInput?: () => boolean;
    
    // Road building
    placeRoadSilent?: (x: number, y: number) => boolean;
    
    // UI feedback
    showToast?: (message: string) => void;
    
    // Canvas dimensions
    getCanvasDimensions?: () => { width: number; height: number };
}

export class InputController {
    private config: InputControllerConfig;
    private inputConfig: InputConfig;
    private camera: CameraState;
    private toolState: ToolState;
    private keyboardHandler: KeyboardHandler;
    private mouseHandler: MouseHandler;
    private enabled: boolean = false;

    constructor(config: InputControllerConfig) {
        this.config = config;
        
        // Use default config or provided
        this.inputConfig = config.inputConfig || {
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
        
        // Initialize camera
        this.camera = config.initialCamera || { ...this.inputConfig.startCamera };
        
        // Initialize tool state
        this.toolState = {
            currentTool: 'PAN',
            selectedLevel: 1,
            isActive: false
        };
        
        // Create keyboard handler
        this.keyboardHandler = new KeyboardHandler({
            onMove: (dx, dy) => this.config.onMove?.(dx, dy),
            onAction: (action) => this.config.onAction?.(action),
            onModifierChange: (modifiers) => {
                // Could trigger UI updates for shift-held state
            },
            shouldBlockInput: config.shouldBlockInput,
            isLimitedInput: config.isLimitedInput
        });
        
        // Create mouse handler
        this.mouseHandler = createMouseHandler({
            canvas: config.canvas,
            getCamera: () => this.camera,
            setCamera: (cam) => {
                this.camera = cam;
                this.config.onCameraChange?.(cam);
            },
            getTool: () => this.toolState.currentTool,
            config: this.inputConfig,
            onTileClick: config.onTileClick,
            onBuild: config.onBuild,
            placeRoadSilent: config.placeRoadSilent,
            showToast: config.showToast,
            getCanvasDimensions: config.getCanvasDimensions || (() => ({
                width: config.canvas.width,
                height: config.canvas.height
            }))
        });
    }

    // ═══════════════════════════════════════════════════════════════════
    // CAMERA CONTROL
    // ═══════════════════════════════════════════════════════════════════

    /** Get current camera state */
    getCamera(): CameraState {
        return { ...this.camera };
    }

    /** Set camera position */
    setCamera(camera: Partial<CameraState>): void {
        this.camera = clampCamera(
            { ...this.camera, ...camera },
            this.inputConfig.bounds
        );
        this.config.onCameraChange?.(this.camera);
    }

    /** Center camera on world position */
    centerOn(worldX: number, worldY: number): void {
        this.setCamera({ x: worldX, y: worldY });
    }

    /** Center camera on tile */
    centerOnTile(tileX: number, tileY: number): void {
        const worldX = (tileX + 0.5) * this.inputConfig.tileSize;
        const worldY = (tileY + 0.5) * this.inputConfig.tileSize;
        this.centerOn(worldX, worldY);
    }

    /** Set zoom level */
    setZoom(z: number): void {
        this.setCamera({ z });
    }

    // ═══════════════════════════════════════════════════════════════════
    // TOOL CONTROL
    // ═══════════════════════════════════════════════════════════════════

    /** Get current tool */
    getTool(): ToolType {
        return this.toolState.currentTool;
    }

    /** Set current tool */
    setTool(tool: ToolType): void {
        this.toolState.currentTool = tool;
        this.toolState.isActive = tool !== 'NONE' && tool !== 'PAN';
    }

    /** Get selected building level */
    getSelectedLevel(): number {
        return this.toolState.selectedLevel;
    }

    /** Set selected building level */
    setSelectedLevel(level: number): void {
        this.toolState.selectedLevel = level;
    }

    /** Check if shift is held (for diagonal road drawing) */
    isShiftHeld(): boolean {
        return isShiftHeld();
    }

    // ═══════════════════════════════════════════════════════════════════
    // POINTER POSITION
    // ═══════════════════════════════════════════════════════════════════

    /** Get current tile position under pointer */
    getTilePosition(): { x: number; y: number } {
        return this.mouseHandler.getTilePosition();
    }

    // ═══════════════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════

    /** Enable input handling */
    enable(): void {
        if (this.enabled) return;
        this.keyboardHandler.enable();
        this.mouseHandler.enable();
        this.enabled = true;
    }

    /** Disable input handling */
    disable(): void {
        if (!this.enabled) return;
        this.keyboardHandler.disable();
        this.mouseHandler.disable();
        this.enabled = false;
    }

    /** Check if input is enabled */
    isEnabled(): boolean {
        return this.enabled;
    }

    /** Update callbacks (useful for dynamic game state) */
    updateCallbacks(callbacks: Partial<Pick<
        InputControllerConfig,
        'onMove' | 'onBuild' | 'onAction' | 'onTileClick' | 'onCameraChange'
    >>): void {
        Object.assign(this.config, callbacks);
        
        // Update keyboard handler
        this.keyboardHandler.updateConfig({
            onMove: callbacks.onMove,
            onAction: callbacks.onAction
        });
    }
}

// ═══════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/** Create an input controller for the game */
export function createInputController(config: InputControllerConfig): InputController {
    return new InputController(config);
}

/** Create input controller with minimal config */
export function createSimpleInputController(
    canvas: HTMLCanvasElement,
    onMove: MoveCallback,
    onAction?: ActionCallback
): InputController {
    return new InputController({
        canvas,
        onMove,
        onAction
    });
}
