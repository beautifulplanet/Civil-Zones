/**
 * Civil Zones - Input Module Index
 * Central exports for input handling
 */

// Types
export {
    type CameraState,
    type CameraBounds,
    type PointerState,
    type PointerEvent,
    type MovementKey,
    type ActionKey,
    type ModifierState,
    type KeyboardEvent,
    type ToolType,
    type ToolState,
    type RoadDragState,
    type MoveCallback,
    type BuildCallback,
    type PanCallback,
    type ZoomCallback,
    type ActionCallback,
    type TileClickCallback,
    type InputConfig,
    DEFAULT_INPUT_CONFIG
} from './types.js';

// Keyboard handling
export {
    MOVEMENT_KEYS,
    ACTION_KEYS,
    getModifierState,
    isShiftHeld,
    isKeyPressed,
    extractModifiers,
    isMovementKey,
    getMovementDelta,
    isActionKey,
    KeyboardHandler,
    type KeyboardHandlerConfig,
    createKeyboardHandler,
    createMovementHandler
} from './keyboard.js';

// Mouse/pointer handling
// Note: screenToWorld, screenToTile, panCamera, zoomCamera also in rendering/camera
// Using prefixed versions here to avoid conflicts
export {
    screenToWorld as inputScreenToWorld,
    worldToTile,
    screenToTile as inputScreenToTile,
    clampCamera,
    panCamera as inputPanCamera,
    zoomCamera as inputZoomCamera,
    isClickOnCanvas,
    isPointInRect,
    isClickBlockedByMenu,
    createRoadDragState,
    startRoadDrag,
    addRoadDragPosition,
    endRoadDrag,
    MouseHandler,
    type MouseHandlerConfig,
    createMouseHandler
} from './mouse.js';

// Unified controller
export {
    InputController,
    type InputControllerConfig,
    createInputController,
    createSimpleInputController
} from './controller.js';
