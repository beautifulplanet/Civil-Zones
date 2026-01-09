/**
 * Civil Zones - Logging System
 * Captures console logs and provides player/technical log views
 */

import type { LogLevel, LogEntry, LogViewType, LogState } from './types.js';
import { MAX_PLAYER_LOG_ENTRIES, MAX_TECHNICAL_LOG_ENTRIES } from './types.js';

// ═══════════════════════════════════════════════════════════════════
// LOG STATE
// ═══════════════════════════════════════════════════════════════════

let logState: LogState = {
    playerLog: [],
    technicalLog: [],
    currentView: 'player',
    maxEntries: MAX_TECHNICAL_LOG_ENTRIES
};

// Original console methods (preserved for chaining)
let originalConsole: {
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
    info: typeof console.info;
} | null = null;

// Callback for toast display on errors
let errorToastCallback: ((message: string) => void) | null = null;

// ═══════════════════════════════════════════════════════════════════
// LOG CAPTURE
// ═══════════════════════════════════════════════════════════════════

/** Initialize console log capture */
export function initLogCapture(onErrorToast?: (message: string) => void): void {
    if (originalConsole) return; // Already initialized
    
    errorToastCallback = onErrorToast || null;
    
    // Store original methods
    originalConsole = {
        log: console.log.bind(console),
        error: console.error.bind(console),
        warn: console.warn.bind(console),
        info: console.info.bind(console)
    };
    
    // Override console.log
    console.log = function(...args: any[]) {
        originalConsole!.log(...args);
        addTechnicalEntry('LOG', formatLogArgs(args));
    };
    
    // Override console.error
    console.error = function(...args: any[]) {
        originalConsole!.error(...args);
        const msg = formatLogArgs(args);
        addTechnicalEntry('ERROR', msg);
        
        // Auto-toast errors
        if (errorToastCallback) {
            const shortMsg = msg.length > 80 ? msg.substring(0, 80) + '...' : msg;
            errorToastCallback(`⚠️ ERROR: ${shortMsg}`);
        }
    };
    
    // Override console.warn
    console.warn = function(...args: any[]) {
        originalConsole!.warn(...args);
        addTechnicalEntry('WARN', formatLogArgs(args));
    };
    
    // Override console.info
    console.info = function(...args: any[]) {
        originalConsole!.info(...args);
        addTechnicalEntry('INFO', formatLogArgs(args));
    };
}

/** Restore original console methods */
export function restoreConsole(): void {
    if (!originalConsole) return;
    
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
    
    originalConsole = null;
}

/** Format log arguments to string */
function formatLogArgs(args: any[]): string {
    return args.map(a => {
        if (typeof a === 'object') {
            try {
                return JSON.stringify(a);
            } catch {
                return String(a);
            }
        }
        return String(a);
    }).join(' ');
}

// ═══════════════════════════════════════════════════════════════════
// LOG ENTRIES
// ═══════════════════════════════════════════════════════════════════

/** Add entry to player log */
export function addPlayerEntry(message: string, year: number = 0): void {
    const entry: LogEntry = {
        timestamp: `[Y${year}]`,
        level: 'INFO',
        message
    };
    
    logState.playerLog.push(entry);
    
    // Trim if too long
    while (logState.playerLog.length > MAX_PLAYER_LOG_ENTRIES) {
        logState.playerLog.shift();
    }
}

/** Add entry to technical log */
export function addTechnicalEntry(level: LogLevel, message: string): void {
    const entry: LogEntry = {
        timestamp: new Date().toLocaleTimeString(),
        level,
        message
    };
    
    logState.technicalLog.push(entry);
    
    // Trim if too long
    while (logState.technicalLog.length > MAX_TECHNICAL_LOG_ENTRIES) {
        logState.technicalLog.shift();
    }
}

// ═══════════════════════════════════════════════════════════════════
// LOG RETRIEVAL
// ═══════════════════════════════════════════════════════════════════

/** Get player log entries as strings */
export function getPlayerLog(): string[] {
    return logState.playerLog.map(e => `${e.timestamp} ${e.message}`);
}

/** Get technical log entries as strings */
export function getTechnicalLog(): string[] {
    return logState.technicalLog.map(e => `[${e.timestamp}] [${e.level}] ${e.message}`);
}

/** Get raw log entries */
export function getLogEntries(type: LogViewType): LogEntry[] {
    return type === 'player' ? [...logState.playerLog] : [...logState.technicalLog];
}

/** Get current log view type */
export function getCurrentLogView(): LogViewType {
    return logState.currentView;
}

/** Set current log view type */
export function setCurrentLogView(view: LogViewType): void {
    logState.currentView = view;
}

// ═══════════════════════════════════════════════════════════════════
// LOG MODAL UI
// ═══════════════════════════════════════════════════════════════════

/** Update log modal display */
export function updateLogDisplay(contentElementId: string = 'log-content'): void {
    const content = document.getElementById(contentElementId);
    if (!content) return;
    
    const logs = logState.currentView === 'player' 
        ? getPlayerLog() 
        : getTechnicalLog();
    
    if (logs.length === 0) {
        content.innerText = logState.currentView === 'player'
            ? 'No player events logged yet.'
            : 'No technical events logged yet.';
    } else {
        content.innerText = logs.join('\n');
    }
    
    // Auto-scroll to bottom
    content.scrollTop = content.scrollHeight;
}

/** Switch log view and update UI */
export function switchLogView(
    view: LogViewType,
    playerBtnId: string = 'btn-player-log',
    techBtnId: string = 'btn-technical-log'
): void {
    setCurrentLogView(view);
    
    const playerBtn = document.getElementById(playerBtnId);
    const techBtn = document.getElementById(techBtnId);
    
    if (view === 'player') {
        if (playerBtn) {
            playerBtn.style.background = '#4CAF50';
            playerBtn.style.fontWeight = 'bold';
        }
        if (techBtn) {
            techBtn.style.background = '#333';
            techBtn.style.fontWeight = 'normal';
        }
    } else {
        if (playerBtn) {
            playerBtn.style.background = '#333';
            playerBtn.style.fontWeight = 'normal';
        }
        if (techBtn) {
            techBtn.style.background = '#4CAF50';
            techBtn.style.fontWeight = 'bold';
        }
    }
    
    updateLogDisplay();
}

/** Show log modal */
export function showLogModal(modalId: string = 'log-modal'): void {
    updateLogDisplay();
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

/** Hide log modal */
export function hideLogModal(modalId: string = 'log-modal'): void {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

/** Copy log to clipboard */
export async function copyLogToClipboard(
    contentElementId: string = 'log-content',
    onSuccess?: () => void,
    onError?: () => void
): Promise<boolean> {
    const content = document.getElementById(contentElementId);
    if (!content) return false;
    
    const text = content.innerText;
    
    try {
        await navigator.clipboard.writeText(text);
        onSuccess?.();
        return true;
    } catch {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            onSuccess?.();
            document.body.removeChild(textarea);
            return true;
        } catch {
            onError?.();
            document.body.removeChild(textarea);
            return false;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// LOG MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

/** Clear all logs */
export function clearLogs(): void {
    logState.playerLog = [];
    logState.technicalLog = [];
}

/** Set logs from external source (for save/load) */
export function setLogs(playerLog: string[], technicalLog: string[]): void {
    logState.playerLog = playerLog.map(msg => ({
        timestamp: '',
        level: 'INFO' as LogLevel,
        message: msg
    }));
    logState.technicalLog = technicalLog.map(msg => ({
        timestamp: '',
        level: 'INFO' as LogLevel,
        message: msg
    }));
}

/** Get log state */
export function getLogState(): LogState {
    return { ...logState };
}
