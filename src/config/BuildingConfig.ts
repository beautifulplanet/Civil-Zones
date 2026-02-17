/**
 * Building Configuration - Stone Age (Levels 1-6)
 * Complete building definitions from game-data-spec.md
 */

import type { ResourceAmounts } from '../core/Resources';

export type BuildingType = 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'WELL' | 'ROAD' | 'SPECIAL';
export type BuildingLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type BuildingState = 0 | 1 | 2 | 3; // Vacant, Developing, Established, Premium

export interface StateDefinition {
    name: string;
    efficiency: number; // 0, 0.5, 1.0, 1.5
    populationRange?: [number, number]; // For residential
}

export interface BuildingDefinition {
    id: string;
    name: string;
    type: BuildingType;
    level: BuildingLevel;

    // Costs
    cost: Partial<ResourceAmounts>;
    upkeep: Partial<ResourceAmounts>;

    // Residential
    populationMin?: number;
    populationMax?: number;

    // Commercial
    jobs?: number;
    income?: number;

    // Industrial
    production?: number;
    gatherBonus?: Partial<ResourceAmounts>;

    // Bonuses
    desirability?: number;
    desirabilityRadius?: number;
    culture?: number;

    // Requirements
    populationUnlock: number;
    requiresChiefHut?: boolean;
    requiresDock?: boolean;

    // Visual
    emoji: string;
    states: [StateDefinition, StateDefinition, StateDefinition, StateDefinition];
}

// ═══════════════════════════════════════════════════════════════
// RESIDENTIAL BUILDINGS (R1-R6)
// ═══════════════════════════════════════════════════════════════

export const RESIDENTIAL_BUILDINGS: BuildingDefinition[] = [
    {
        id: 'R1',
        name: 'Hobo Camp',
        type: 'RESIDENTIAL',
        level: 1,
        cost: { food: 100, wood: 100 },
        upkeep: { wood: 1, food: 1 },
        populationMin: 5,
        populationMax: 15,
        income: 1,
        gatherBonus: { wood: 2, food: 2 },
        populationUnlock: 0,
        emoji: '🏕️',
        states: [
            { name: 'Abandoned Transient Camp', efficiency: 0, populationRange: [0, 0] },
            { name: 'Makeshift Transient Shelter', efficiency: 0.5, populationRange: [1, 5] },
            { name: 'Hobo Camp', efficiency: 1.0, populationRange: [6, 10] },
            { name: 'Fortified Transient Encampment', efficiency: 1.5, populationRange: [11, 15] }
        ]
    },
    {
        id: 'R2',
        name: 'Straw Pit Shelter',
        type: 'RESIDENTIAL',
        level: 2,
        cost: { food: 300, wood: 300, stone: 50 },
        upkeep: { wood: 2, food: 2 },
        populationMin: 15,
        populationMax: 30,
        income: 3,
        gatherBonus: { wood: 5, food: 5, stone: 1 },
        populationUnlock: 50,
        emoji: '🏚️',
        states: [
            { name: 'Overgrown Pit Depression', efficiency: 0, populationRange: [0, 0] },
            { name: 'Basic Straw Pit Shelter', efficiency: 0.5, populationRange: [1, 10] },
            { name: 'Straw Pit Shelter', efficiency: 1.0, populationRange: [11, 20] },
            { name: 'Reinforced Straw Pit Complex', efficiency: 1.5, populationRange: [21, 30] }
        ]
    },
    {
        id: 'R3',
        name: 'Cave Dwelling',
        type: 'RESIDENTIAL',
        level: 3,
        cost: { food: 900, wood: 900, stone: 200 },
        upkeep: { wood: 3, food: 3 },
        populationMin: 30,
        populationMax: 60,
        income: 8,
        gatherBonus: { wood: 12, food: 12, stone: 3, metal: 1 },
        populationUnlock: 200,
        emoji: '🏔️',
        states: [
            { name: 'Collapsed Cave Entrance', efficiency: 0, populationRange: [0, 0] },
            { name: 'Shallow Cave Shelter', efficiency: 0.5, populationRange: [1, 20] },
            { name: 'Cave Dwelling', efficiency: 1.0, populationRange: [21, 40] },
            { name: 'Deep Cave Complex', efficiency: 1.5, populationRange: [41, 60] }
        ]
    },
    {
        id: 'R4',
        name: 'Wigwam Village',
        type: 'RESIDENTIAL',
        level: 4,
        cost: { food: 2000, wood: 2000, stone: 40 },
        upkeep: { wood: 4, food: 4 },
        populationMin: 60,
        populationMax: 90,
        income: 16,
        gatherBonus: { wood: 20, food: 20, stone: 5 },
        populationUnlock: 500,
        requiresChiefHut: true,
        emoji: '🛖',
        states: [
            { name: 'Collapsed Wigwam Frames', efficiency: 0, populationRange: [0, 0] },
            { name: 'Small Wigwam Camp', efficiency: 0.5, populationRange: [1, 30] },
            { name: 'Wigwam Village', efficiency: 1.0, populationRange: [31, 60] },
            { name: 'Grand Wigwam Circle', efficiency: 1.5, populationRange: [61, 90] }
        ]
    },
    {
        id: 'R5',
        name: 'Papyrus Hut',
        type: 'RESIDENTIAL',
        level: 5,
        cost: { food: 8000, wood: 8000, stone: 80 },
        upkeep: { wood: 6, food: 6 },
        populationMin: 90,
        populationMax: 150,
        income: 32,
        gatherBonus: { wood: 40, food: 40, stone: 10, metal: 3 },
        populationUnlock: 1000,
        requiresChiefHut: true,
        emoji: '🏠',
        states: [
            { name: 'Rotting Papyrus Bundle', efficiency: 0, populationRange: [0, 0] },
            { name: 'Basic Papyrus Hut', efficiency: 0.5, populationRange: [1, 50] },
            { name: 'Papyrus Hut', efficiency: 1.0, populationRange: [51, 100] },
            { name: 'Grand Papyrus Manor', efficiency: 1.5, populationRange: [101, 150] }
        ]
    },
    {
        id: 'R6',
        name: 'Stuga Village',
        type: 'RESIDENTIAL',
        level: 6,
        cost: { food: 20000, wood: 20000, stone: 100 },
        upkeep: { wood: 10, food: 10 },
        populationMin: 150,
        populationMax: 240,
        income: 64,
        gatherBonus: { wood: 80, food: 80, stone: 20, metal: 6 },
        populationUnlock: 2000,
        requiresChiefHut: true,
        emoji: '🏘️',
        states: [
            { name: 'Ruined Stuga Frame', efficiency: 0, populationRange: [0, 0] },
            { name: 'Small Stuga', efficiency: 0.5, populationRange: [1, 80] },
            { name: 'Stuga Village', efficiency: 1.0, populationRange: [81, 160] },
            { name: 'Great Stuga Complex', efficiency: 1.5, populationRange: [161, 240] }
        ]
    }
];

// ═══════════════════════════════════════════════════════════════
// COMMERCIAL BUILDINGS (C1-C6)
// ═══════════════════════════════════════════════════════════════

export const COMMERCIAL_BUILDINGS: BuildingDefinition[] = [
    {
        id: 'C1',
        name: 'Pebble Trade Fire',
        type: 'COMMERCIAL',
        level: 1,
        cost: { food: 150, wood: 150 },
        upkeep: { wood: 1 },
        jobs: 8,
        income: 5,
        desirability: 0.2,
        desirabilityRadius: 4,
        populationUnlock: 10,
        emoji: '🔥',
        states: [
            { name: 'Extinguished Pebble Fire', efficiency: 0 },
            { name: 'Smoldering Pebble Exchange', efficiency: 0.5 },
            { name: 'Pebble Trade Fire', efficiency: 1.0 },
            { name: 'Blazing Pebble Trading Circle', efficiency: 1.5 }
        ]
    },
    {
        id: 'C2',
        name: 'Squirrel Trade Camp',
        type: 'COMMERCIAL',
        level: 2,
        cost: { food: 400, wood: 400, stone: 50 },
        upkeep: { wood: 2 },
        jobs: 20,
        income: 15,
        desirability: 0.3,
        desirabilityRadius: 5,
        populationUnlock: 40,
        emoji: '🐿️',
        states: [
            { name: 'Abandoned Squirrel Traps', efficiency: 0 },
            { name: 'Sparse Squirrel Fur Post', efficiency: 0.5 },
            { name: 'Squirrel Trade Camp', efficiency: 1.0 },
            { name: 'Bustling Squirrel Fur Exchange', efficiency: 1.5 }
        ]
    },
    {
        id: 'C3',
        name: 'Fire Meet Camp',
        type: 'COMMERCIAL',
        level: 3,
        cost: { food: 1200, wood: 1200, stone: 200 },
        upkeep: { wood: 3 },
        jobs: 50,
        income: 40,
        desirability: 0.4,
        desirabilityRadius: 6,
        culture: 5,
        populationUnlock: 150,
        emoji: '🏕️',
        states: [
            { name: 'Cold Meeting Ashes', efficiency: 0 },
            { name: 'Small Tribal Fire Gathering', efficiency: 0.5 },
            { name: 'Fire Meet Camp', efficiency: 1.0 },
            { name: 'Great Tribal Fire Council', efficiency: 1.5 }
        ]
    },
    {
        id: 'C4',
        name: 'Barter Barrel',
        type: 'COMMERCIAL',
        level: 4,
        cost: { food: 1600, wood: 1600, stone: 32 },
        upkeep: { wood: 4 },
        jobs: 16,
        income: 80,
        desirability: 0.35,
        desirabilityRadius: 5,
        populationUnlock: 500,
        requiresChiefHut: true,
        emoji: '🛢️',
        states: [
            { name: 'Tipped Empty Barter Barrel', efficiency: 0 },
            { name: 'Sparse Goods Exchange', efficiency: 0.5 },
            { name: 'Barter Barrel', efficiency: 1.0 },
            { name: 'Grand Barter Trading Post', efficiency: 1.5 }
        ]
    },
    {
        id: 'C5',
        name: 'Blanket Market',
        type: 'COMMERCIAL',
        level: 5,
        cost: { food: 6400, wood: 6400, stone: 64 },
        upkeep: { wood: 6 },
        jobs: 40,
        income: 160,
        desirability: 0.45,
        desirabilityRadius: 6,
        culture: 8,
        populationUnlock: 1000,
        requiresChiefHut: true,
        emoji: '🧵',
        states: [
            { name: 'Empty Blanket Display Frame', efficiency: 0 },
            { name: 'Sparse Textile Exchange', efficiency: 0.5 },
            { name: 'Blanket Market', efficiency: 1.0 },
            { name: 'Grand Textile Trading Bazaar', efficiency: 1.5 }
        ]
    },
    {
        id: 'C6',
        name: 'Bear Market',
        type: 'COMMERCIAL',
        level: 6,
        cost: { food: 16000, wood: 16000, stone: 80 },
        upkeep: { wood: 10 },
        jobs: 100,
        income: 320,
        desirability: 0.55,
        desirabilityRadius: 7,
        culture: 15,
        populationUnlock: 2000,
        requiresChiefHut: true,
        emoji: '🐻',
        states: [
            { name: 'Abandoned Bear Skin Racks', efficiency: 0 },
            { name: 'Quiet Bear Hide Trading Post', efficiency: 0.5 },
            { name: 'Bear Market', efficiency: 1.0 },
            { name: 'Great Bear Hide Exchange', efficiency: 1.5 }
        ]
    }
];

// ═══════════════════════════════════════════════════════════════
// INDUSTRIAL BUILDINGS (I1-I6)
// ═══════════════════════════════════════════════════════════════

export const INDUSTRIAL_BUILDINGS: BuildingDefinition[] = [
    {
        id: 'I1',
        name: 'Bird Hunting Range',
        type: 'INDUSTRIAL',
        level: 1,
        cost: { food: 200, wood: 200 },
        upkeep: { wood: 1, food: 1 },
        jobs: 10,
        production: 10,
        gatherBonus: { food: 5 },
        desirability: 0.1,
        desirabilityRadius: 3,
        populationUnlock: 2,
        emoji: '🦅',
        states: [
            { name: 'Empty Hunting Grounds', efficiency: 0 },
            { name: 'Sparse Bird Hunting', efficiency: 0.5 },
            { name: 'Bird Hunting Range', efficiency: 1.0 },
            { name: 'Abundant Hunting Grounds', efficiency: 1.5 }
        ]
    },
    {
        id: 'I2',
        name: 'Grub Digging Pit',
        type: 'INDUSTRIAL',
        level: 2,
        cost: { food: 500, wood: 500, stone: 100 },
        upkeep: { wood: 2, food: 1 },
        jobs: 25,
        production: 25,
        gatherBonus: { food: 10, stone: 2 },
        desirability: 0.1,
        desirabilityRadius: 3,
        populationUnlock: 50,
        emoji: '🪱',
        states: [
            { name: 'Collapsed Digging Pit', efficiency: 0 },
            { name: 'Basic Grub Site', efficiency: 0.5 },
            { name: 'Grub Digging Pit', efficiency: 1.0 },
            { name: 'Rich Grub Colony', efficiency: 1.5 }
        ]
    },
    {
        id: 'I3',
        name: 'Stone Knapping Site',
        type: 'INDUSTRIAL',
        level: 3,
        cost: { food: 1500, wood: 1500, stone: 500 },
        upkeep: { wood: 3, food: 1 },
        jobs: 60,
        production: 60,
        gatherBonus: { food: 15, stone: 10, metal: 3 },
        desirability: 0.15,
        desirabilityRadius: 4,
        populationUnlock: 200,
        emoji: '🪨',
        states: [
            { name: 'Scattered Stone Flakes', efficiency: 0 },
            { name: 'Basic Knapping Area', efficiency: 0.5 },
            { name: 'Stone Knapping Site', efficiency: 1.0 },
            { name: 'Master Knapping Workshop', efficiency: 1.5 }
        ]
    },
    {
        id: 'I4',
        name: 'Turtle Hunting Ground',
        type: 'INDUSTRIAL',
        level: 4,
        cost: { food: 2400, wood: 2400, stone: 48 },
        upkeep: { wood: 4, food: 2 },
        jobs: 20,
        production: 50,
        gatherBonus: { food: 30, stone: 15 },
        desirability: 0.2,
        desirabilityRadius: 4,
        populationUnlock: 500,
        requiresChiefHut: true,
        emoji: '🐢',
        states: [
            { name: 'Empty Shell Piles', efficiency: 0 },
            { name: 'Sparse Turtle Hunting', efficiency: 0.5 },
            { name: 'Turtle Hunting Ground', efficiency: 1.0 },
            { name: 'Abundant Turtle Grounds', efficiency: 1.5 }
        ]
    },
    {
        id: 'I5',
        name: 'Bear Pit',
        type: 'INDUSTRIAL',
        level: 5,
        cost: { food: 9600, wood: 9600, stone: 96 },
        upkeep: { wood: 6, food: 3 },
        jobs: 50,
        production: 120,
        gatherBonus: { food: 60, stone: 25, metal: 8 },
        desirability: 0.25,
        desirabilityRadius: 5,
        populationUnlock: 1000,
        requiresChiefHut: true,
        emoji: '🕳️',
        states: [
            { name: 'Collapsed Bear Trap', efficiency: 0 },
            { name: 'Basic Bear Pit', efficiency: 0.5 },
            { name: 'Bear Pit', efficiency: 1.0 },
            { name: 'Master Bear Hunting Grounds', efficiency: 1.5 }
        ]
    },
    {
        id: 'I6',
        name: 'Buffalo Grounds',
        type: 'INDUSTRIAL',
        level: 6,
        cost: { food: 24000, wood: 24000, stone: 120 },
        upkeep: { wood: 10, food: 5 },
        jobs: 120,
        production: 240,
        gatherBonus: { food: 120, stone: 40, metal: 15 },
        desirability: 0.3,
        desirabilityRadius: 6,
        populationUnlock: 2000,
        requiresChiefHut: true,
        emoji: '🦬',
        states: [
            { name: 'Empty Plains', efficiency: 0 },
            { name: 'Sparse Herd Grounds', efficiency: 0.5 },
            { name: 'Buffalo Grounds', efficiency: 1.0 },
            { name: 'Great Buffalo Hunting Grounds', efficiency: 1.5 }
        ]
    }
];

// ═══════════════════════════════════════════════════════════════
// SPECIAL BUILDINGS
// ═══════════════════════════════════════════════════════════════

export const SPECIAL_BUILDINGS: BuildingDefinition[] = [
    {
        id: 'WELL',
        name: 'Water Well',
        type: 'WELL',
        level: 1,
        cost: { food: 50, wood: 200 },
        upkeep: {},
        desirability: 0.15,
        desirabilityRadius: 6,
        populationUnlock: 0,
        emoji: '💧',
        states: [
            { name: 'Dry Well', efficiency: 0 },
            { name: 'Water Well', efficiency: 1.0 },
            { name: 'Water Well', efficiency: 1.0 },
            { name: 'Water Well', efficiency: 1.0 }
        ]
    },
    {
        id: 'ROAD',
        name: 'Road',
        type: 'ROAD',
        level: 1,
        cost: { wood: 10 },
        upkeep: {},
        populationUnlock: 0,
        emoji: '🛤️',
        states: [
            { name: 'Overgrown Path', efficiency: 0 },
            { name: 'Dirt Path', efficiency: 0.5 },
            { name: 'Road', efficiency: 1.0 },
            { name: 'Paved Road', efficiency: 1.5 }
        ]
    },
    {
        id: 'CHIEF_HUT',
        name: "Clan Chief's Hut",
        type: 'SPECIAL',
        level: 4,
        cost: { food: 100000, wood: 100000, gold: 1 },
        upkeep: { wood: 5, food: 5 },
        desirability: 2.0,
        desirabilityRadius: 50,
        culture: 25,
        populationUnlock: 500,
        emoji: '👑',
        states: [
            { name: 'Ruined Hut', efficiency: 0 },
            { name: "Chief's Hut", efficiency: 1.0 },
            { name: "Clan Chief's Hut", efficiency: 1.0 },
            { name: "Grand Chief's Palace", efficiency: 1.5 }
        ]
    }
];

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function getAllBuildings(): BuildingDefinition[] {
    return [
        ...RESIDENTIAL_BUILDINGS,
        ...COMMERCIAL_BUILDINGS,
        ...INDUSTRIAL_BUILDINGS,
        ...SPECIAL_BUILDINGS
    ];
}

export function getBuildingById(id: string): BuildingDefinition | null {
    return getAllBuildings().find(b => b.id === id) || null;
}

export function getBuildingsByType(type: BuildingType): BuildingDefinition[] {
    return getAllBuildings().filter(b => b.type === type);
}

export function getBuildingsByLevel(level: BuildingLevel): BuildingDefinition[] {
    return getAllBuildings().filter(b => b.level === level);
}

export function canUnlockBuilding(building: BuildingDefinition, population: number, hasChiefHut: boolean): boolean {
    if (population < building.populationUnlock) return false;
    if (building.requiresChiefHut && !hasChiefHut) return false;
    return true;
}

export function getStateForBuilding(building: BuildingDefinition, population: number): BuildingState {
    if (building.type === 'RESIDENTIAL' && building.states[0].populationRange) {
        for (let i = 3; i >= 0; i--) {
            const range = building.states[i].populationRange;
            if (range && population >= range[0]) {
                return i as BuildingState;
            }
        }
        return 0;
    }
    // Default: return state 2 (Established) for non-residential
    return 2;
}
