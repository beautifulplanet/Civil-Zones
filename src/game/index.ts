/**
 * Civil Zones - Game Module Index
 * Central exports for game systems
 */

// Inventory management
export {
    createWanderInventory,
    getInventoryTotal,
    getAvailableSpace,
    hasSpace,
    addToInventory,
    removeFromInventory,
    hasResources,
    increaseCapacity,
    addToPocket,
    getPocketTotal,
    createCityResources,
    addCityResource,
    removeCityResource,
    canAfford,
    deductCost,
    formatResource,
    getInventoryFillPercent,
    getResourceColor,
    getResourceEmoji,
    DEFAULT_WANDER_INVENTORY,
    DEFAULT_POCKET_INVENTORY,
    DEFAULT_CITY_RESOURCES,
    type WanderInventory,
    type PocketInventory,
    type CityResources,
    // ResourceType already exported from types/
    type TransferResult
} from './inventory.js';

// Player system
export {
    createPlayer,
    getNewPosition,
    getDirectionFromDelta,
    getDeltaFromDirection,
    // isInBounds already exported from core/utils
    isTileTypePassable,
    movePlayer,
    damagePlayer,
    healPlayer,
    isPlayerDead,
    isValidSpawnTile,
    countReachableTiles,
    findSpawnPosition,
    getExplorationTiles,
    createThirstState,
    updateThirst,
    drinkWater,
    isDyingOfThirst,
    getThirstWarning,
    type Direction,
    type Player,
    type MoveResult,
    type PassabilityResult,
    type SpawnValidation,
    type ThirstState
} from './player.js';

// Game state management
export {
    createInitialGameState,
    transitionToCity,
    logGameEvent,
    markDirty,
    clearDirtyRegions,
    updatePeakPop,
    checkGameOver,
    type GamePhase,
    type ViewMode,
    // BerryEntity, NomadEntity, StoneDeposit already in types/
    type Animal,
    type WanderWell,
    type GameBuilding,
    type SiteTrait,
    type LockedResources,
    type ProgressionState
    // GameState already in types/game-state.ts
} from './state.js';

// Save/Load system
export {
    saveGame,
    loadGame,
    deleteSave,
    hasSave,
    getSaveSlots,
    getNextSaveSlot,
    startAutosave,
    stopAutosave,
    exportSave,
    importSave,
    formatSaveTime,
    getSaveDescription,
    serializeState,
    deserializeState,
    createSaveData,
    SAVE_VERSION,
    AUTOSAVE_KEY,
    AUTOSAVE_INTERVAL,
    MAX_SAVE_SLOTS,
    // SaveData already in types/
    type SaveSlot,
    type SerializableGameState
} from './save-load.js';
