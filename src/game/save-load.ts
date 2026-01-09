/**
 * Civil Zones - Save/Load System
 * Handles game state persistence to localStorage
 */

import type { GameState } from './state.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Serializable save data */
export interface SaveData {
    version: string;
    timestamp: number;
    state: SerializableGameState;
    tiles?: unknown;    // Tile data (large, may be compressed)
}

/** Game state without non-serializable properties */
export type SerializableGameState = Omit<GameState, 'dirtyRegions'> & {
    dirtyRegions?: string[];  // Convert Set to array for JSON
};

/** Save slot info */
export interface SaveSlot {
    id: string;
    name: string;
    timestamp: number;
    year: number;
    pop: number;
    phase: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const SAVE_VERSION = '48.0.0';
export const AUTOSAVE_KEY = 'civilzones_autosave';
export const SAVE_PREFIX = 'civilzones_save_';
export const MAX_SAVE_SLOTS = 5;

// ═══════════════════════════════════════════════════════════════════════════════
// SERIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Prepare game state for serialization
 */
export function serializeState(state: GameState): SerializableGameState {
    return {
        ...state,
        dirtyRegions: Array.from(state.dirtyRegions)
    };
}

/**
 * Restore game state from serialized data
 */
export function deserializeState(data: SerializableGameState): GameState {
    return {
        ...data,
        dirtyRegions: new Set(data.dirtyRegions || [])
    };
}

/**
 * Create save data object
 */
export function createSaveData(state: GameState, tiles?: unknown): SaveData {
    return {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        state: serializeState(state),
        tiles
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOCAL STORAGE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Save game to localStorage
 */
export function saveGame(
    state: GameState,
    tiles: unknown,
    slotId: string = 'autosave'
): boolean {
    try {
        const key = slotId === 'autosave' ? AUTOSAVE_KEY : `${SAVE_PREFIX}${slotId}`;
        const saveData = createSaveData(state, tiles);
        const json = JSON.stringify(saveData);
        
        localStorage.setItem(key, json);
        console.log(`[Save] Game saved to ${key} (${(json.length / 1024).toFixed(1)} KB)`);
        
        return true;
    } catch (error) {
        console.error('[Save] Failed to save game:', error);
        return false;
    }
}

/**
 * Load game from localStorage
 */
export function loadGame(slotId: string = 'autosave'): SaveData | null {
    try {
        const key = slotId === 'autosave' ? AUTOSAVE_KEY : `${SAVE_PREFIX}${slotId}`;
        const json = localStorage.getItem(key);
        
        if (!json) {
            console.log(`[Load] No save found at ${key}`);
            return null;
        }
        
        const saveData: SaveData = JSON.parse(json);
        
        // Version check
        if (saveData.version !== SAVE_VERSION) {
            console.warn(`[Load] Save version mismatch: ${saveData.version} vs ${SAVE_VERSION}`);
            // Could add migration logic here
        }
        
        console.log(`[Load] Game loaded from ${key}`);
        return saveData;
    } catch (error) {
        console.error('[Load] Failed to load game:', error);
        return null;
    }
}

/**
 * Delete a save slot
 */
export function deleteSave(slotId: string): boolean {
    try {
        const key = slotId === 'autosave' ? AUTOSAVE_KEY : `${SAVE_PREFIX}${slotId}`;
        localStorage.removeItem(key);
        console.log(`[Save] Deleted save: ${key}`);
        return true;
    } catch (error) {
        console.error('[Save] Failed to delete save:', error);
        return false;
    }
}

/**
 * Check if save exists
 */
export function hasSave(slotId: string = 'autosave'): boolean {
    const key = slotId === 'autosave' ? AUTOSAVE_KEY : `${SAVE_PREFIX}${slotId}`;
    return localStorage.getItem(key) !== null;
}

/**
 * Get list of all save slots
 */
export function getSaveSlots(): SaveSlot[] {
    const slots: SaveSlot[] = [];
    
    // Check autosave
    if (hasSave('autosave')) {
        const data = loadGame('autosave');
        if (data) {
            slots.push({
                id: 'autosave',
                name: 'Autosave',
                timestamp: data.timestamp,
                year: data.state.year,
                pop: data.state.pop,
                phase: data.state.gamePhase
            });
        }
    }
    
    // Check numbered slots
    for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
        const slotId = `slot${i}`;
        if (hasSave(slotId)) {
            const data = loadGame(slotId);
            if (data) {
                slots.push({
                    id: slotId,
                    name: `Save ${i}`,
                    timestamp: data.timestamp,
                    year: data.state.year,
                    pop: data.state.pop,
                    phase: data.state.gamePhase
                });
            }
        }
    }
    
    return slots;
}

/**
 * Get next available save slot
 */
export function getNextSaveSlot(): string {
    for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
        const slotId = `slot${i}`;
        if (!hasSave(slotId)) {
            return slotId;
        }
    }
    // All slots full, return slot1 for overwrite
    return 'slot1';
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTOSAVE
// ═══════════════════════════════════════════════════════════════════════════════

/** Autosave interval in milliseconds */
export const AUTOSAVE_INTERVAL = 60000; // 1 minute

let autosaveTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start autosave timer
 */
export function startAutosave(
    getState: () => GameState,
    getTiles: () => unknown,
    interval: number = AUTOSAVE_INTERVAL
): void {
    stopAutosave();
    
    autosaveTimer = setInterval(() => {
        const state = getState();
        const tiles = getTiles();
        
        if (!state.gameOver) {
            saveGame(state, tiles, 'autosave');
        }
    }, interval);
    
    console.log(`[Autosave] Started with ${interval / 1000}s interval`);
}

/**
 * Stop autosave timer
 */
export function stopAutosave(): void {
    if (autosaveTimer) {
        clearInterval(autosaveTimer);
        autosaveTimer = null;
        console.log('[Autosave] Stopped');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT/IMPORT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Export save to downloadable file
 */
export function exportSave(state: GameState, tiles: unknown): void {
    const saveData = createSaveData(state, tiles);
    const json = JSON.stringify(saveData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `civilzones_save_${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

/**
 * Import save from file
 */
export async function importSave(file: File): Promise<SaveData | null> {
    try {
        const json = await file.text();
        const saveData: SaveData = JSON.parse(json);
        
        // Basic validation
        if (!saveData.version || !saveData.state) {
            throw new Error('Invalid save file format');
        }
        
        return saveData;
    } catch (error) {
        console.error('[Import] Failed to import save:', error);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISPLAY HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Format save timestamp for display
 */
export function formatSaveTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    
    // Same day - show time only
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // This year - show month/day
    if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Different year - show full date
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Get save slot description
 */
export function getSaveDescription(slot: SaveSlot): string {
    const time = formatSaveTime(slot.timestamp);
    return `${slot.name} - Year ${slot.year}, Pop ${slot.pop} (${slot.phase}) - ${time}`;
}
