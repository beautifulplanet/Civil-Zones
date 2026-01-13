/**
 * Civil Zones - UI System
 * Central export point for all UI modules
 */

// Types - use renamed exports to avoid conflicts
export type {
    ToastOptions,
    ToastState,
    MenuPanelId,
    MenuState,
    ResourceDisplay,
    StatsConfig,
    HUDState,
    NeedType,
    NeedWarning,
    NeedsPanelState,
    LoreEventType,
    LoreEvent,
    LoreState,
    LogLevel,
    LogEntry,
    LogViewType,
    LogState,
    ViewModeInfo
} from './types.js';

// Rename ViewMode to UIViewMode to avoid conflict with game/state.ts
export type { ViewMode as UIViewMode } from './types.js';

export {
    VIEW_MODES,
    NEED_COLORS,
    DEFAULT_TOAST_DURATION,
    MAX_PLAYER_LOG_ENTRIES,
    MAX_TECHNICAL_LOG_ENTRIES
} from './types.js';

// UI Controller - main UI management
export {
    initUIController,
    setTool,
    getCurrentTool,
    updateDashboard,
    updateDebugInfo,
    updateStatsContent,
    updateLogContent,
    showLorePopup,
    showSettlementVideo,
    showGameOver,
    getUIState,
    updateSettleButton,
    showWanderUI,
    showCityUI
} from './controller.js';

export type { Tool, UIState, UICallbacks } from './controller.js';

// Toast Notifications
export {
    initToast,
    showToast,
    hideToast,
    showError,
    showSuccess,
    showWarning,
    ToastManager
} from './toast.js';

// Menu System
export {
    showMenu,
    hideMenu,
    hideAllMenus,
    toggleMenu,
    isMenuOpen,
    setSelectedLevel,
    getSelectedLevel,
    updateCardSelection,
    showModal,
    hideModal,
    generateStatsHTML
} from './menus.js';

// HUD System - rename conflicting exports
export {
    formatNumber as uiFormatNumber,
    updateElement,
    updatePopulation,
    updateResources,
    updateWaterDisplay,
    updateWellsDisplay,
    updateThirst as uiUpdateThirst,
    updateNeedsPanel,
    setWanderMode,
    setCityMode
} from './hud.js';

// Logging System
export {
    initLogCapture,
    restoreConsole,
    addPlayerEntry,
    addTechnicalEntry,
    getPlayerLog,
    getTechnicalLog,
    getLogEntries,
    getCurrentLogView,
    setCurrentLogView,
    updateLogDisplay,
    switchLogView,
    showLogModal,
    hideLogModal,
    copyLogToClipboard,
    clearLogs,
    setLogs,
    getLogState
} from './logging.js';
