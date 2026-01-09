/**
 * Civil Zones - Game State Type Definitions
 * Core game state and configuration interfaces
 */

import type { ResourceRecord } from './resources.js';
import type { PlacedBuilding } from './buildings.js';

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTORY CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface InventoryConfig {
    /** Base backpack capacity (food & wood) */
    BACKPACK_BASE: number;
    /** Additional backpack capacity per population */
    BACKPACK_PER_POP: number;
    /** Fixed sack capacity (stone & metal) */
    SACK_CAPACITY: number;
    /** Whether overflow items are deleted */
    OVERFLOW_DELETE: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL STATES CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface VisualStatesConfig {
    /** Years at 0 occupancy before abandoned appearance */
    ABANDONED_YEARS: number;
    /** Maximum occupancy ratio for "light" state (0-30%) */
    LIGHT_MAX: number;
    /** Maximum occupancy ratio for "medium" state (31-80%) */
    MEDIUM_MAX: number;
    /** Minimum occupancy ratio for "extreme" state (81-100%) */
    EXTREME_MIN: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAP CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface MapConfig {
    /** Tile size in pixels */
    TILE: number;
    /** Map width in tiles */
    W: number;
    /** Map height in tiles */
    H: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GAME SPEED & TIME
// ═══════════════════════════════════════════════════════════════════════════════

export type GameSpeed = 'PAUSED' | 'NORMAL' | 'FAST' | 'ULTRA';

export interface TimeState {
    /** Current game year */
    year: number;
    /** Current month (1-12) */
    month: number;
    /** Current day (1-30) */
    day: number;
    /** Total game ticks elapsed */
    totalTicks: number;
    /** Current game speed */
    speed: GameSpeed;
    /** Is game currently paused? */
    isPaused: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CIVILIZATION PROGRESSION
// ═══════════════════════════════════════════════════════════════════════════════

export interface CivilizationLevel {
    level: number;
    name: string;
    popRequired: number;
    description: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATISTICS & TRACKING
// ═══════════════════════════════════════════════════════════════════════════════

export interface GameStatistics {
    /** Total buildings ever constructed */
    totalBuildingsConstructed: number;
    /** Total buildings demolished */
    totalBuildingsDemolished: number;
    /** Peak population reached */
    peakPopulation: number;
    /** Total resources gathered (lifetime) */
    totalResourcesGathered: ResourceRecord;
    /** Total income earned (lifetime) */
    totalIncomeEarned: number;
    /** Buildings by category count */
    buildingsByCategory: Record<string, number>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN GAME STATE
// ═══════════════════════════════════════════════════════════════════════════════

export interface GameState {
    /** Current resources */
    resources: ResourceRecord;
    /** Resource storage capacities */
    storage: ResourceRecord;
    /** Current population */
    population: number;
    /** Maximum population capacity */
    populationCapacity: number;
    /** Total jobs available */
    totalJobs: number;
    /** Workers currently employed */
    employedWorkers: number;
    /** Current gold/currency */
    gold: number;
    /** Time state */
    time: TimeState;
    /** All placed buildings */
    buildings: PlacedBuilding[];
    /** Current civilization level */
    civLevel: number;
    /** Game statistics */
    stats: GameStatistics;
    /** Is bulldoze mode active? */
    bulldozeMode: boolean;
    /** Currently selected building ID for placement */
    selectedBuildingId: string | null;
    /** Camera/viewport position */
    camera: {
        x: number;
        y: number;
        zoom: number;
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAVE/LOAD
// ═══════════════════════════════════════════════════════════════════════════════

export interface SaveData {
    version: string;
    timestamp: number;
    state: GameState;
}
