/**
 * Civil Zones - Keyboard Input Handler
 * Handles keyboard input for player movement and actions
 */

import type { 
    KeyboardEvent as InputKeyboardEvent,
    ModifierState,
    MoveCallback,
    ActionCallback
} from './types.js';

// ═══════════════════════════════════════════════════════════════════
// KEY MAPPINGS
// ═══════════════════════════════════════════════════════════════════

/** Movement key to delta mapping */
export const MOVEMENT_KEYS: Record<string, [number, number]> = {
    // Cardinal directions
    'w': [0, -1],
    'W': [0, -1],
    'ArrowUp': [0, -1],
    's': [0, 1],
    'S': [0, 1],
    'ArrowDown': [0, 1],
    'a': [-1, 0],
    'A': [-1, 0],
    'ArrowLeft': [-1, 0],
    'd': [1, 0],
    'D': [1, 0],
    'ArrowRight': [1, 0],
    // Diagonal directions
    'q': [-1, -1],
    'Q': [-1, -1],
    'e': [1, -1],
    'E': [1, -1],
    'z': [-1, 1],
    'Z': [-1, 1],
    'c': [1, 1],
    'C': [1, 1]
};

/** Action keys */
export const ACTION_KEYS = ['Enter', ' ', 'Escape', 'b', 'B', 'v', 'V'] as const;

// ═══════════════════════════════════════════════════════════════════
// KEYBOARD STATE
// ═══════════════════════════════════════════════════════════════════

/** Current modifier key state */
let modifierState: ModifierState = {
    shift: false,
    ctrl: false,
    alt: false,
    meta: false
};

/** Track pressed keys for multi-key detection */
const pressedKeys = new Set<string>();

/** Get current modifier state */
export function getModifierState(): ModifierState {
    return { ...modifierState };
}

/** Check if shift is held (useful for diagonal road drawing) */
export function isShiftHeld(): boolean {
    return modifierState.shift;
}

/** Check if a specific key is pressed */
export function isKeyPressed(key: string): boolean {
    return pressedKeys.has(key.toLowerCase());
}

// ═══════════════════════════════════════════════════════════════════
// KEY EVENT UTILITIES
// ═══════════════════════════════════════════════════════════════════

/** Extract modifier state from native event */
export function extractModifiers(e: globalThis.KeyboardEvent): ModifierState {
    return {
        shift: e.shiftKey,
        ctrl: e.ctrlKey,
        alt: e.altKey,
        meta: e.metaKey
    };
}

/** Check if key is a movement key */
export function isMovementKey(key: string): boolean {
    return key in MOVEMENT_KEYS;
}

/** Get movement delta from key */
export function getMovementDelta(key: string): [number, number] | null {
    return MOVEMENT_KEYS[key] || null;
}

/** Check if key is an action key */
export function isActionKey(key: string): boolean {
    return ACTION_KEYS.includes(key as any);
}

// ═══════════════════════════════════════════════════════════════════
// KEYBOARD HANDLER CLASS
// ═══════════════════════════════════════════════════════════════════

export interface KeyboardHandlerConfig {
    /** Called when movement key pressed */
    onMove?: MoveCallback;
    
    /** Called when action key pressed */
    onAction?: ActionCallback;
    
    /** Called when modifier state changes */
    onModifierChange?: (modifiers: ModifierState) => void;
    
    /** Check if input should be blocked (e.g., game over) */
    shouldBlockInput?: () => boolean;
    
    /** Check if input should be limited (e.g., death screen - allow Tab/Enter) */
    isLimitedInput?: () => boolean;
}

export class KeyboardHandler {
    private config: KeyboardHandlerConfig;
    private boundKeyDown: (e: globalThis.KeyboardEvent) => void;
    private boundKeyUp: (e: globalThis.KeyboardEvent) => void;
    private enabled: boolean = false;

    constructor(config: KeyboardHandlerConfig = {}) {
        this.config = config;
        this.boundKeyDown = this.handleKeyDown.bind(this);
        this.boundKeyUp = this.handleKeyUp.bind(this);
    }

    /** Start listening for keyboard events */
    enable(): void {
        if (this.enabled) return;
        window.addEventListener('keydown', this.boundKeyDown);
        window.addEventListener('keyup', this.boundKeyUp);
        this.enabled = true;
    }

    /** Stop listening for keyboard events */
    disable(): void {
        if (!this.enabled) return;
        window.removeEventListener('keydown', this.boundKeyDown);
        window.removeEventListener('keyup', this.boundKeyUp);
        this.enabled = false;
        pressedKeys.clear();
        modifierState = { shift: false, ctrl: false, alt: false, meta: false };
    }

    /** Update configuration */
    updateConfig(config: Partial<KeyboardHandlerConfig>): void {
        this.config = { ...this.config, ...config };
    }

    private handleKeyDown(e: globalThis.KeyboardEvent): void {
        // Block all input if requested
        if (this.config.shouldBlockInput?.()) {
            e.preventDefault();
            return;
        }

        // Limited input mode (death screen - only Tab/Enter allowed)
        if (this.config.isLimitedInput?.()) {
            if (e.key !== 'Tab' && e.key !== 'Enter') {
                e.preventDefault();
                return;
            }
            return;
        }

        // Update modifier state
        const oldShift = modifierState.shift;
        modifierState = extractModifiers(e);
        if (oldShift !== modifierState.shift) {
            this.config.onModifierChange?.(modifierState);
        }

        // Track pressed keys
        pressedKeys.add(e.key.toLowerCase());

        // Handle movement keys
        const moveDelta = getMovementDelta(e.key);
        if (moveDelta) {
            this.config.onMove?.(moveDelta[0], moveDelta[1]);
            e.preventDefault();
            return;
        }

        // Handle action keys
        if (isActionKey(e.key)) {
            this.config.onAction?.(e.key);
            e.preventDefault();
            return;
        }
    }

    private handleKeyUp(e: globalThis.KeyboardEvent): void {
        // Update modifier state
        const oldShift = modifierState.shift;
        modifierState = extractModifiers(e);
        if (oldShift !== modifierState.shift) {
            this.config.onModifierChange?.(modifierState);
        }

        // Track key release
        pressedKeys.delete(e.key.toLowerCase());
    }
}

// ═══════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/** Create a keyboard handler with standard game controls */
export function createKeyboardHandler(config: KeyboardHandlerConfig = {}): KeyboardHandler {
    return new KeyboardHandler(config);
}

/** Create movement-only keyboard handler */
export function createMovementHandler(onMove: MoveCallback): KeyboardHandler {
    return new KeyboardHandler({ onMove });
}
