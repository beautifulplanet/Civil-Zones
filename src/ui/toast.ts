/**
 * Civil Zones - Toast Notification System
 * Shows temporary messages to the player
 */

import type { ToastOptions, ToastState } from './types.js';
import { DEFAULT_TOAST_DURATION, MAX_PLAYER_LOG_ENTRIES, MAX_TECHNICAL_LOG_ENTRIES } from './types.js';

// ═══════════════════════════════════════════════════════════════════
// TOAST STATE
// ═══════════════════════════════════════════════════════════════════

let toastState: ToastState = {
    message: '',
    isVisible: false,
    isError: false,
    timeoutId: null
};

let toastElement: HTMLElement | null = null;

// Log storage (for integration with game logs)
let playerLog: string[] = [];
let technicalLog: string[] = [];
let currentYear = 0;

// ═══════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════

/** Initialize toast system with DOM element */
export function initToast(elementId: string = 'toast'): void {
    toastElement = document.getElementById(elementId);
    if (!toastElement) {
        console.warn(`Toast element with id '${elementId}' not found`);
    }
}

/** Set current game year for log timestamps */
export function setCurrentYear(year: number): void {
    currentYear = year;
}

// ═══════════════════════════════════════════════════════════════════
// TOAST DISPLAY
// ═══════════════════════════════════════════════════════════════════

/** Show a toast notification */
export function showToast(message: string, options: ToastOptions = {}): void {
    const {
        duration = DEFAULT_TOAST_DURATION,
        isError = false,
        persistent = false
    } = options;

    // Clear existing timeout
    if (toastState.timeoutId !== null) {
        clearTimeout(toastState.timeoutId);
        toastState.timeoutId = null;
    }

    // Update state
    toastState.message = message;
    toastState.isVisible = true;
    toastState.isError = isError;

    // Update DOM
    if (toastElement) {
        toastElement.innerText = message;
        toastElement.style.opacity = '1';
        toastElement.style.background = isError 
            ? '#F44336' 
            : 'rgba(0, 0, 0, 0.85)';
    }

    // Add to logs
    addToPlayerLog(message);
    addToTechnicalLog(message);

    // Auto-hide unless persistent
    if (!persistent) {
        toastState.timeoutId = window.setTimeout(() => {
            hideToast();
        }, duration);
    }
}

/** Hide the toast */
export function hideToast(): void {
    toastState.isVisible = false;
    toastState.timeoutId = null;
    
    if (toastElement) {
        toastElement.style.opacity = '0';
    }
}

/** Show error toast */
export function showError(message: string, duration: number = DEFAULT_TOAST_DURATION): void {
    showToast(message, { isError: true, duration });
}

/** Show success toast (green-tinted message) */
export function showSuccess(message: string, duration: number = DEFAULT_TOAST_DURATION): void {
    showToast(`✅ ${message}`, { duration });
}

/** Show warning toast */
export function showWarning(message: string, duration: number = DEFAULT_TOAST_DURATION): void {
    showToast(`⚠️ ${message}`, { duration });
}

// ═══════════════════════════════════════════════════════════════════
// LOGGING
// ═══════════════════════════════════════════════════════════════════

/** Add message to player log */
function addToPlayerLog(message: string): void {
    const timestamp = `[Y${currentYear}]`;
    playerLog.push(`${timestamp} ${message}`);
    
    // Trim if too long
    while (playerLog.length > MAX_PLAYER_LOG_ENTRIES) {
        playerLog.shift();
    }
}

/** Add message to technical log */
function addToTechnicalLog(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    technicalLog.push(`[${timestamp}] ${message}`);
    
    // Trim if too long
    while (technicalLog.length > MAX_TECHNICAL_LOG_ENTRIES) {
        technicalLog.shift();
    }
}

/** Get player log entries */
export function getPlayerLog(): string[] {
    return [...playerLog];
}

/** Get technical log entries */
export function getTechnicalLog(): string[] {
    return [...technicalLog];
}

/** Clear all logs */
export function clearLogs(): void {
    playerLog = [];
    technicalLog = [];
}

/** Set logs from external source (for game state restoration) */
export function setLogs(player: string[], technical: string[]): void {
    playerLog = [...player];
    technicalLog = [...technical];
}

// ═══════════════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════════════

/** Get current toast state */
export function getToastState(): ToastState {
    return { ...toastState };
}

/** Check if toast is currently visible */
export function isToastVisible(): boolean {
    return toastState.isVisible;
}

// ═══════════════════════════════════════════════════════════════════
// TOAST CLASS (for object-oriented usage)
// ═══════════════════════════════════════════════════════════════════

export class ToastManager {
    private element: HTMLElement | null = null;
    private state: ToastState;
    private playerLog: string[] = [];
    private technicalLog: string[] = [];
    private currentYear: number = 0;

    constructor(elementId: string = 'toast') {
        this.element = document.getElementById(elementId);
        this.state = {
            message: '',
            isVisible: false,
            isError: false,
            timeoutId: null
        };
    }

    setYear(year: number): void {
        this.currentYear = year;
    }

    show(message: string, options: ToastOptions = {}): void {
        const { duration = DEFAULT_TOAST_DURATION, isError = false, persistent = false } = options;

        if (this.state.timeoutId !== null) {
            clearTimeout(this.state.timeoutId);
        }

        this.state.message = message;
        this.state.isVisible = true;
        this.state.isError = isError;

        if (this.element) {
            this.element.innerText = message;
            this.element.style.opacity = '1';
            this.element.style.background = isError ? '#F44336' : 'rgba(0, 0, 0, 0.85)';
        }

        // Log the message
        const playerTimestamp = `[Y${this.currentYear}]`;
        this.playerLog.push(`${playerTimestamp} ${message}`);
        if (this.playerLog.length > MAX_PLAYER_LOG_ENTRIES) this.playerLog.shift();

        const techTimestamp = new Date().toLocaleTimeString();
        this.technicalLog.push(`[${techTimestamp}] ${message}`);
        if (this.technicalLog.length > MAX_TECHNICAL_LOG_ENTRIES) this.technicalLog.shift();

        if (!persistent) {
            this.state.timeoutId = window.setTimeout(() => this.hide(), duration);
        }
    }

    hide(): void {
        this.state.isVisible = false;
        this.state.timeoutId = null;
        if (this.element) {
            this.element.style.opacity = '0';
        }
    }

    error(message: string): void {
        this.show(message, { isError: true });
    }

    success(message: string): void {
        this.show(`✅ ${message}`);
    }

    warning(message: string): void {
        this.show(`⚠️ ${message}`);
    }

    getPlayerLog(): string[] {
        return [...this.playerLog];
    }

    getTechnicalLog(): string[] {
        return [...this.technicalLog];
    }
}
