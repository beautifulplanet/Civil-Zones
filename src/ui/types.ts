/**
 * Civil Zones - UI Types
 * Type definitions for UI components
 */

// ═══════════════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════

/** Toast notification options */
export interface ToastOptions {
    duration?: number;      // Duration in ms (default: 2000)
    isError?: boolean;      // Red background for errors
    persistent?: boolean;   // Don't auto-hide
}

/** Toast notification state */
export interface ToastState {
    message: string;
    isVisible: boolean;
    isError: boolean;
    timeoutId: number | null;
}

// ═══════════════════════════════════════════════════════════════════
// MENUS
// ═══════════════════════════════════════════════════════════════════

/** Menu panel identifiers */
export type MenuPanelId = 
    | 'building-menu-panel'
    | 'industrial-menu-panel'
    | 'commercial-menu-panel'
    | 'storage-menu-panel'
    | 'special-menu-panel'
    | 'road-menu-panel'
    | 'milestone-menu-panel'
    | 'stats-menu'
    | 'log-modal';

/** Menu state */
export interface MenuState {
    activeMenu: MenuPanelId | null;
    selectedLevel: number;
    selectedBuilding: string | null;
}

// ═══════════════════════════════════════════════════════════════════
// HUD ELEMENTS
// ═══════════════════════════════════════════════════════════════════

/** Resource display configuration */
export interface ResourceDisplay {
    elementId: string;
    icon: string;
    getValue: () => number;
    format?: (value: number) => string;
    showInWander?: boolean;
    showInCity?: boolean;
}

/** Stats bar configuration */
export interface StatsConfig {
    population: ResourceDisplay;
    food: ResourceDisplay;
    wood: ResourceDisplay;
    metal: ResourceDisplay;
    stone: ResourceDisplay;
    gold: ResourceDisplay;
    water: ResourceDisplay;
    thirst: ResourceDisplay;
    inventory: ResourceDisplay;
}

/** HUD visibility state */
export interface HUDState {
    showPopulation: boolean;
    showResources: boolean;
    showWater: boolean;
    showYear: boolean;
    showThirst: boolean;
    showInventory: boolean;
    showRCI: boolean;
    showNeeds: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// NEEDS WARNING PANEL
// ═══════════════════════════════════════════════════════════════════

/** Need type */
export type NeedType = 'housing' | 'water' | 'food' | 'jobs' | 'paths';

/** Need warning */
export interface NeedWarning {
    type: NeedType;
    message: string;
    severity: 'critical' | 'warning' | 'info';
    color: string;
}

/** Needs panel state */
export interface NeedsPanelState {
    visible: boolean;
    warnings: NeedWarning[];
    satisfaction: number;
}

// ═══════════════════════════════════════════════════════════════════
// LORE SYSTEM
// ═══════════════════════════════════════════════════════════════════

/** Lore event type */
export type LoreEventType = 
    | 'GAME_START'
    | 'FIRST_WELL'
    | 'FIRST_HUT'
    | 'FIRST_HUNT'
    | 'FIRST_ROAD'
    | 'SETTLEMENT'
    | 'FIRST_TRADE'
    | 'FLOOD_WARNING';

/** Lore event data */
export interface LoreEvent {
    id: LoreEventType;
    title: string;
    text: string;
    illustration: string;
}

/** Lore popup state */
export interface LoreState {
    enabled: boolean;
    seenEvents: Set<LoreEventType>;
    currentEvent: LoreEvent | null;
    isVisible: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// LOGGING
// ═══════════════════════════════════════════════════════════════════

/** Log entry type */
export type LogLevel = 'LOG' | 'WARN' | 'ERROR' | 'INFO';

/** Log entry */
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
}

/** Log view type */
export type LogViewType = 'player' | 'technical';

/** Log state */
export interface LogState {
    playerLog: LogEntry[];
    technicalLog: LogEntry[];
    currentView: LogViewType;
    maxEntries: number;
}

// ═══════════════════════════════════════════════════════════════════
// VIEW MODES
// ═══════════════════════════════════════════════════════════════════

/** Game view mode */
export type ViewMode = 'NORMAL' | 'DESIRABILITY' | 'BIRDSEYE' | 'POL' | 'ELEVATION';

/** View mode info */
export interface ViewModeInfo {
    mode: ViewMode;
    icon: string;
    title: string;
    description: string;
}

/** Available view modes */
export const VIEW_MODES: ViewModeInfo[] = [
    { mode: 'NORMAL', icon: '👁️', title: 'Normal View', description: 'Standard game view' },
    { mode: 'DESIRABILITY', icon: '🔥', title: 'Desirability Heatmap', description: 'Shows land value' },
    { mode: 'BIRDSEYE', icon: '🎨', title: 'Birds Eye View', description: 'Clean view without UI' },
    { mode: 'POL', icon: '☢️', title: 'Pollution View', description: 'Shows pollution levels' }
];

// ═══════════════════════════════════════════════════════════════════
// UI CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

/** Need type colors */
export const NEED_COLORS: Record<NeedType, string> = {
    housing: '#FF6B6B',
    water: '#4ECDC4',
    food: '#FFD93D',
    jobs: '#6BCF7F',
    paths: '#A78BFA'
};

/** Default toast duration */
export const DEFAULT_TOAST_DURATION = 2000;

/** Max log entries */
export const MAX_PLAYER_LOG_ENTRIES = 200;
export const MAX_TECHNICAL_LOG_ENTRIES = 500;
