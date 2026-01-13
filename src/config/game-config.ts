/**
 * Civil Zones - Master Game Configuration
 * ═══════════════════════════════════════════════════════════════════════════════
 * Ported from index.html CFG object
 * All game balance variables, colors, and settings in one place
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// I. GLOBAL RULES (The Physics Engine)
// ═══════════════════════════════════════════════════════════════════════════════

export const CFG = {
    // === MAP & RENDERING ===
    TILE: 48,           // Tile size in pixels
    W: 250,             // Map width in tiles (250x250 = 62,500 tiles)
    H: 250,             // Map height in tiles
    
    // === INVENTORY SYSTEM ===
    INVENTORY: {
        BACKPACK_BASE: 150,         // Starting backpack capacity
        BACKPACK_PER_POP: 100,      // Additional capacity per population
        SACK_CAPACITY: 1000,        // Fixed rare item storage (Stone & Metal)
        OVERFLOW_DELETE: true       // Overflow items are deleted instantly
    },
    
    // === VISUAL STATES ===
    VISUAL_STATES: {
        ABANDONED_YEARS: 10,        // Years at 0 occupancy before abandoned
        LIGHT_MAX: 0.30,            // 1-30% occupancy
        MEDIUM_MAX: 0.80,           // 31-80% occupancy
        EXTREME_MIN: 0.81           // 81-100% occupancy
    },
    
    // === BULLDOZE MECHANIC ===
    BULLDOZE_REFUND: 0.10,          // 10% of construction cost returned
    
    // === TERRAIN & BUILDING COLORS - VICTORIAN MAP THEME (matched to legacy) ===
    COLORS: {
        // Terrain - Aged parchment & ink tones
        DEEP: "#4A6B8A",
        WATER: "#6B8FAD",
        RIVER: "#7FA0B8",
        SAND: "#D4C4A8",
        GRASS: "#C9D4A0",
        FOREST: "#8B9A6B",        // Match legacy (was #A8B888)
        EARTH: "#C4A882",
        ROCK: "#9A9A8A",
        SNOW: "#E8E8E0",
        STONE: "#8A8A7A",
        PINE: "#8B9B6B",
        
        // Building colors - Ink & wash tones
        ROAD: "#A89070",          // Match legacy (was #555555)
        RES: "#C4946A",
        COM: "#B8A060",
        IND: "#8A7A6A",
        WELL: "#6A8A9A",
        BASKET: "#B89A70",
        POTTERY: "#A8906A",
        GRANARY: "#9A8A70",
        PALACE: "#D4B480",
        CHIEF: "#C4A070",
        CLAN_CHIEF: "#D4B060",
        DOCK: "#5A7A8A",
        
        // Map overlay colors
        PARCHMENT: "#E8DCC8",
        INK: "#3A3020",
        SEPIA: "#704020",
        FOG: "#C8B8A0",
        
        // UI colors
        OK: "rgba(180,160,120,0.5)",
        NO: "rgba(160,80,60,0.85)"
    },
    
    // === PLAYER (EPOCH 0: WANDERER) ===
    PLAYER: {
        START_HEALTH: 3,            // Initial health (population = health in Epoch 0)
        VISION_RADIUS: 3            // Fog of war reveal radius
    },
    
    // === MOVEMENT FOOD COST ===
    MOVEMENT: {
        STEPS_PER_FOOD: 15,         // Every 15 steps costs food
        FOOD_PER_PERSON: 1          // 1 food consumed per person per 15 steps
    },
    
    // === FOREST TILE ===
    FOREST_CONFIG: {
        WOOD_PER_STEP: 1            // Wood gained when stepping on forest
    },
    
    // === OPEN GROUND ===
    OPEN_GROUND: {
        RARE_FIND_CHANCE: 0.01,     // 1% chance per step
        METAL_CHANCE: 0.5,          // 50% metal, 50% stone if rare find
        FIND_AMOUNT: 1              // +1 Metal or +1 Stone
    },
    
    // === BERRY BUSH ===
    BERRIES: {
        SPAWN_COUNT: 400,           // Number of berry bushes on map
        FOOD_VALUE: 10,             // Food gained (90% chance)
        POISON_CHANCE: 0.10,        // 10% chance of poison
        POISON_DAMAGE: 1            // -1 Pop if poisoned
    },
    
    // === ANIMALS ===
    ANIMALS: {
        SPAWN_COUNT: 1064,
        PACK_DAMAGE: 1,
        BEACH_SPAWN_COUNT: 150,
        TYPES: [
            { name: 'DEER', hitToKill: 2, foodReward: [1, 30], popCost: 0, color: '#C89858', speed: 1, spawnRate: 0.45, terrain: ['GRASS', 'FOREST'] },
            { name: 'BISON', hitToKill: 3, foodReward: [5, 30], popCost: 0, color: '#A06830', speed: 0.5, spawnRate: 0.30, terrain: ['GRASS', 'FOREST'] },
            { name: 'MAMMOTH', hitToKill: 5, foodReward: [15, 30], popCost: 0, color: '#806040', speed: 0.3, spawnRate: 0.10, terrain: ['GRASS', 'FOREST'] },
            { name: 'TURTLE', hitToKill: 1, foodReward: [3, 15], popCost: 0, color: '#4A7A4A', speed: 0.1, spawnRate: 0.15, terrain: ['SAND'] }
        ]
    },
    
    // === NOMADS ===
    NOMAD: {
        SPAWN_COUNT: 1500,
        HOSTILE_CHANCE: 0.33,
        FRIENDLY_POP_BONUS: 1,
        HOSTILE_DAMAGE: [1, 3],
        LOOT_RANGES: {
            FOOD: [5, 30],
            WOOD: [5, 30],
            METAL: [0, 10],
            STONE: [0, 5]
        }
    },
    
    // === SETTLEMENT TRANSITION ===
    SETTLEMENT_REQUIREMENTS: {
        MIN_POP: 2,
        MIN_FOOD: 100,
        MIN_WOOD: 25,
        WATER_DISTANCE: 5
    },
    
    // === BUILDING COSTS ===
    COST: {
        RES: 100,
        COM: 250,
        IND: 500,
        WELL: 50,
        BULL: 1,
        ROAD: 5
    },
    
    // === STONE DEPOSITS ===
    STONE_DEPOSITS: {
        MIN_METAL: 0,
        MAX_METAL: 100
    },
    
    // === CHIEF RADIUS ===
    CHIEF_RADIUS: 10,
    
    // === PERFORMANCE ===
    PERF: {
        TARGET_FPS: 30,
        SPATIAL_GRID_SIZE: 10,
        PARTICLE_POOL_SIZE: 100,
        ENABLE_OFFSCREEN_CACHE: true,
        DIRTY_RECT_RENDERING: true
    },
    
    // === ELEVATION & FLOODING SYSTEM ===
    ELEVATION_SYSTEM: {
        ENABLED: true,
        UPDATE_INTERVAL_YEARS: 100,     // Check every 100 years
        SEA_LEVEL_MIN: 1.0,
        SEA_LEVEL_MAX: 6.0,
        HIGH_GROUND_BONUS: 2,           // Tiles 2+ above sea level are safe
        
        // Geological periods (based on real paleoclimate data)
        GEOLOGICAL_PERIODS: [
            { name: "Warm Interglacial", seaLevel: 5, duration: 20 },
            { name: "Cooling Transition", seaLevel: 4, duration: 10 },
            { name: "Glacial Advance", seaLevel: 3, duration: 30 },
            { name: "Deep Ice Age", seaLevel: 2, duration: 20 },
            { name: "Glacial Retreat", seaLevel: 3, duration: 10 },
            { name: "Warming Transition", seaLevel: 4, duration: 10 }
        ]
    }
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// II. TERRAIN TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type TerrainType = 
    | 'DEEP' | 'WATER' | 'RIVER' | 'SAND' | 'GRASS' 
    | 'FOREST' | 'EARTH' | 'ROCK' | 'SNOW' | 'STONE' | 'PINE';

export const TERRAIN_WALKABLE: Record<TerrainType, boolean> = {
    DEEP: false,
    WATER: false,
    RIVER: false,
    SAND: true,
    GRASS: true,
    FOREST: true,
    EARTH: true,
    ROCK: true,
    SNOW: true,
    STONE: true,
    PINE: true
};

// ═══════════════════════════════════════════════════════════════════════════════
// III. BUILDING TYPES & CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export type BuildingType = 
    | 'RES' | 'COM' | 'IND' | 'WELL' | 'ROAD' 
    | 'CHIEF' | 'CLAN_CHIEF' | 'DOCK' | 'BASKET' 
    | 'POTTERY' | 'GRANARY' | 'PALACE'
    | 'FOOD_PIT' | 'WOOD_PIT' | 'STONE_PIT' | 'METAL_PIT';

export interface BuildingConfig {
    id: string;
    category: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'SPECIAL' | 'STORAGE';
    level: number;
    name: string;
    cost: { food: number; wood: number; stone: number; metal: number };
    size: { w: number; h: number };
    capacity?: number;
    upkeep?: { wood?: number; food?: number };
    baseIncome?: number;
    unlockReq?: { pop?: number };
}

// ═══════════════════════════════════════════════════════════════════════════════
// IV. PRE-FIRE AGE BUILDING SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export const PRE_FIRE_AGE = {
    RESIDENTIAL: {
        1: {
            name: 'Tree Shelter',
            description: 'Primitive shelter in the trees, safe from predators',
            baseCost: { food: 100, wood: 100, stone: 0 },
            baseCapacity: 15,
            baseIncome: 1,
            densityStates: [
                { id: 'ABANDONED', name: 'Abandoned Nest', icon: '🪹', popRange: [0, 0], incomeMultiplier: 0 },
                { id: 'LOW', name: 'Small Nest', icon: '🪺', popRange: [1, 5], incomeMultiplier: 0.5 },
                { id: 'MEDIUM', name: 'Tree Platform', icon: '🌳', popRange: [6, 10], incomeMultiplier: 1.0 },
                { id: 'HIGH', name: 'Sturdy Treehouse', icon: '🏕️', popRange: [11, 15], incomeMultiplier: 1.5 }
            ]
        },
        2: {
            name: 'Ground Pit',
            description: 'Dug-out shelter with branch covering',
            baseCost: { food: 300, wood: 300, stone: 50 },
            baseCapacity: 25,
            baseIncome: 3,
            densityStates: [
                { id: 'ABANDONED', name: 'Collapsed Pit', icon: '🕳️', popRange: [0, 0], incomeMultiplier: 0 },
                { id: 'LOW', name: 'Shallow Scrape', icon: '⬛', popRange: [1, 8], incomeMultiplier: 0.5 },
                { id: 'MEDIUM', name: 'Dug Pit', icon: '🟫', popRange: [9, 17], incomeMultiplier: 1.0 },
                { id: 'HIGH', name: 'Covered Pit Dwelling', icon: '🏠', popRange: [18, 25], incomeMultiplier: 1.5 }
            ]
        },
        3: {
            name: 'Ground Cave',
            description: 'Expanded cave dwelling for extended families',
            baseCost: { food: 900, wood: 900, stone: 200 },
            baseCapacity: 60,
            baseIncome: 8,
            densityStates: [
                { id: 'ABANDONED', name: 'Collapsed Cave', icon: '🕳️', popRange: [0, 0], incomeMultiplier: 0 },
                { id: 'LOW', name: 'Shallow Cave', icon: '⬛', popRange: [1, 20], incomeMultiplier: 0.5 },
                { id: 'MEDIUM', name: 'Deep Cave', icon: '🟤', popRange: [21, 40], incomeMultiplier: 1.0 },
                { id: 'HIGH', name: 'Cave Complex', icon: '🏔️', popRange: [41, 60], incomeMultiplier: 1.5 }
            ]
        }
    },
    COMMERCIAL: {
        1: {
            name: 'Pebble Trade Fire',
            description: 'Simple fire pit for exchanging goods',
            baseCost: { food: 200, wood: 200, stone: 0 },
            baseProduction: 5,
            baseWorkers: 2,
            densityStates: [
                { id: 'ABANDONED', name: 'Cold Embers', icon: '🪨', activityRange: [0, 0], productionMultiplier: 0 },
                { id: 'LOW', name: 'Dying Fire', icon: '🔥', activityRange: [0.01, 0.3], productionMultiplier: 0.5 },
                { id: 'MEDIUM', name: 'Pebble Trade Fire', icon: '🔥', activityRange: [0.31, 0.7], productionMultiplier: 1.0 },
                { id: 'HIGH', name: 'Busy Trade Fire', icon: '🎉', activityRange: [0.71, 1.0], productionMultiplier: 1.5 }
            ]
        },
        2: {
            name: 'Squirrel Trade Camp',
            description: 'Camp where hunters trade squirrel pelts and goods',
            baseCost: { food: 500, wood: 500, stone: 100 },
            baseProduction: 15,
            baseWorkers: 5,
            densityStates: [
                { id: 'ABANDONED', name: 'Empty Camp', icon: '🏕️', activityRange: [0, 0], productionMultiplier: 0 },
                { id: 'LOW', name: 'Sparse Camp', icon: '🏕️', activityRange: [0.01, 0.3], productionMultiplier: 0.5 },
                { id: 'MEDIUM', name: 'Squirrel Trade Camp', icon: '🐿️', activityRange: [0.31, 0.7], productionMultiplier: 1.0 },
                { id: 'HIGH', name: 'Busy Fur Camp', icon: '🦺', activityRange: [0.71, 1.0], productionMultiplier: 1.5 }
            ]
        }
    },
    INDUSTRIAL: {
        1: {
            name: 'Bird Hunting Range',
            description: 'Area for hunting small birds with rocks',
            baseCost: { food: 200, wood: 200, stone: 0 },
            baseProduction: 10,
            baseWorkers: 3,
            densityStates: [
                { id: 'ABANDONED', name: 'Empty Grounds', icon: '🪶', activityRange: [0, 0], productionMultiplier: 0 },
                { id: 'LOW', name: 'Sparse Hunting Path', icon: '🪶', activityRange: [0.01, 0.3], productionMultiplier: 0.5 },
                { id: 'MEDIUM', name: 'Bird Hunting Range', icon: '🦅', activityRange: [0.31, 0.7], productionMultiplier: 1.0 },
                { id: 'HIGH', name: 'Prime Fowling Grounds', icon: '🎯', activityRange: [0.71, 1.0], productionMultiplier: 1.5 }
            ]
        },
        2: {
            name: 'Grub Digging Pit',
            description: 'Digging area for insects, roots, and small prey',
            baseCost: { food: 500, wood: 500, stone: 100 },
            baseProduction: 25,
            baseWorkers: 6,
            densityStates: [
                { id: 'ABANDONED', name: 'Barren Earth', icon: '🕳️', activityRange: [0, 0], productionMultiplier: 0 },
                { id: 'LOW', name: 'Scratched Earth', icon: '🕳️', activityRange: [0.01, 0.3], productionMultiplier: 0.5 },
                { id: 'MEDIUM', name: 'Grub Digging Pit', icon: '🪱', activityRange: [0.31, 0.7], productionMultiplier: 1.0 },
                { id: 'HIGH', name: 'Bountiful Foraging Pit', icon: '🍖', activityRange: [0.71, 1.0], productionMultiplier: 1.5 }
            ]
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// V. LORE EVENTS - Story messages
// ═══════════════════════════════════════════════════════════════════════════════

export const LORE_EVENTS = {
    GAME_START: {
        title: 'The Dream',
        text: 'Early man had a dream one night... a vision of something greater than mere survival. He saw his descendants building, thriving, creating. And so, with nothing but hope and hunger, he left his people and began to wander...',
        illustration: 'wanderer'
    },
    FIRST_WELL: {
        title: 'Fresh Water!',
        text: 'Digging far enough revealed what the wise ones spoke of - underground rivers! Fresh water bubbled up from the earth. No longer would the tribe be slaves to rivers and lakes.',
        illustration: 'well'
    },
    FIRST_RESIDENTIAL: {
        title: 'A Proper Shelter',
        text: 'Now THIS is proper living! No more sleeping under stars with wolves howling. Four walls and a roof - what luxury! The tribe looked upon their creation with pride. "We are no longer wanderers," they declared. "We are SETTLERS."',
        illustration: 'hut'
    },
    FIRST_ROAD: {
        title: 'The Beaten Path',
        text: 'Why walk through thorns when you can walk on dirt? The tribe\'s smartest member packed down the earth to make travel easier. Revolutionary!',
        illustration: 'road'
    },
    FIRST_BERRY: {
        title: 'The Berry Bush',
        text: 'Red and plump, the berries glistened in the sun. The hungry wanderer reached out... Would they bring life or death? 90% of the time, it\'s fine! The other 10%... well, that\'s how we learned which ones NOT to eat.',
        illustration: 'berry'
    },
    FIRST_NOMAD: {
        title: 'A Stranger Approaches',
        text: 'From the mist emerged another... a fellow wanderer! Heart pounding, spear raised, our ancestor faced a choice. Friend or foe? The stranger raised a hand in peace. Today, the tribe grows stronger.',
        illustration: 'nomad'
    },
    FIRST_SETTLEMENT: {
        title: 'A Settlement is Born',
        text: 'No more wandering. No more running. This patch of earth... THIS belongs to us! The tribe drove stakes into the ground and declared themselves FOUNDERS. History was about to begin.',
        illustration: 'settlement'
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// VI. UI THEME COLORS (CSS Variables in TypeScript)
// ═══════════════════════════════════════════════════════════════════════════════

export const UI_THEME = {
    // Base colors
    bg: '#0A0806',
    text: '#F5E6C8',
    panel: '#2E251B',
    border: '#5C4A3D',
    
    // Zone colors
    cRes: '#4fc3f7',
    cCom: '#ffd54f',
    cInd: '#ff7043',
    cWat: '#00e5ff',
    cRoad: '#8d6e63',
    cBull: '#e57373',
    
    // Accent colors
    accent: '#8B6914',
    accentHover: '#A68328',
    textPrimary: '#F5E6C8',
    textSecondary: '#C4A878',
    textMuted: '#8B7355',
    
    // Tribal theme
    tribalGold: '#8B6914',
    tribalBrown: '#5C4A3D',
    tribalDark: '#2E251B',
    tribalLeather: '#6B4423'
};

// ═══════════════════════════════════════════════════════════════════════════════
// VII. HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get the density state for a building based on population/activity
 */
export function getDensityState(
    zoneType: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL',
    level: number,
    fillPercent: number
): { id: string; name: string; icon: string; multiplier: number; index: number } | null {
    const config = PRE_FIRE_AGE[zoneType]?.[level as keyof typeof PRE_FIRE_AGE[typeof zoneType]];
    if (!config) return null;
    
    const states = config.densityStates;
    for (let i = states.length - 1; i >= 0; i--) {
        const state = states[i];
        const range = 'popRange' in state ? state.popRange : state.activityRange;
        if (fillPercent >= range[0]) {
            return {
                id: state.id,
                name: state.name,
                icon: state.icon,
                multiplier: 'incomeMultiplier' in state ? state.incomeMultiplier : state.productionMultiplier,
                index: i
            };
        }
    }
    return {
        id: states[0].id,
        name: states[0].name,
        icon: states[0].icon,
        multiplier: 0,
        index: 0
    };
}

/**
 * Get terrain color for a given terrain type
 */
export function getTerrainColor(type: string): string {
    return CFG.COLORS[type as keyof typeof CFG.COLORS] || CFG.COLORS.GRASS;
}

/**
 * Check if terrain is walkable
 */
export function isWalkable(type: string): boolean {
    return TERRAIN_WALKABLE[type as TerrainType] ?? true;
}

// Export default config
export default CFG;
