/**
 * Civil Zones - Special & Milestone Building Definitions
 * Infrastructure, Milestones, and Unique Buildings
 */

import type { 
    SpecialBuildingDefinition, 
    MilestoneBuildingDefinition,
    BuildingDefinition 
} from '../../types/index.js';

// Infrastructure Buildings
export const INFRASTRUCTURE_BUILDINGS: Record<string, SpecialBuildingDefinition> = {
    'WELL': {
        id: 'WELL',
        category: 'SPECIAL',
        level: 1,
        name: 'Water Well',
        cost: { food: 50, wood: 200, stone: 5, metal: 0 },
        size: { w: 1, h: 1 },
        capacity: 0,
        upkeep: { wood: 0, food: 0 },
        benefits: [
            { type: 'WATER_ACCESS', value: 100 },
            { type: 'DESIRABILITY', radius: 6, value: 0.15 }
        ],
        stateThresholds: [],
        variants: [
            { name: 'Dry Well', icon: '🕳️', bonusMult: 0 },
            { name: 'Water Well', icon: '💧', bonusMult: 1.0 }
        ],
        popUnlock: 0
    }
};

// Milestone Buildings - Major Progression Gates
export const MILESTONE_BUILDINGS: Record<string, MilestoneBuildingDefinition> = {
    'CLAN_CHIEF': {
        id: 'CLAN_CHIEF',
        category: 'MILESTONE',
        level: 1,
        name: "Clan Chief's Hut",
        cost: { food: 100000, wood: 100000, stone: 0, metal: 0 },
        size: { w: 2, h: 2 },
        capacity: 0,
        upkeep: { wood: 5, food: 5 },
        unique: true,
        benefits: [
            { type: 'DESIRABILITY', radius: 50, value: 2.0 },
            { type: 'CULTURE', value: 25 }
        ],
        stateThresholds: [],
        variants: [
            { name: "Clan Chief's Hut", icon: '🏛️', bonusMult: 1.0 }
        ],
        unlockReq: {
            pop: 500,
            resources: { food: 100000, wood: 100000 }
        },
        milestoneBonus: {
            type: 'UNLOCK_TIER',
            value: 4
        }
    },

    'DOCK': {
        id: 'DOCK',
        category: 'MILESTONE',
        level: 2,
        name: "First Dock",
        cost: { food: 500000, wood: 500000, stone: 0, metal: 0 },
        size: { w: 3, h: 2 },
        capacity: 0,
        upkeep: { wood: 15, food: 10 },
        unique: true,
        benefits: [
            { type: 'DESIRABILITY', radius: 60, value: 3.0 },
            { type: 'CULTURE', value: 50 },
            { type: 'INCOME', value: 500 }
        ],
        stateThresholds: [],
        variants: [
            { name: "First Dock", icon: '⚓', bonusMult: 1.0 }
        ],
        unlockReq: {
            pop: 2000,
            buildings: { id: 'CLAN_CHIEF', count: 1 },
            resources: { food: 500000, wood: 500000 }
        },
        milestoneBonus: {
            type: 'UNLOCK_TIER',
            value: 7
        }
    }
};

// Legacy Special Buildings (backward compatibility)
export const LEGACY_BUILDINGS: Record<string, SpecialBuildingDefinition> = {
    'CHIEF': {
        id: 'CHIEF',
        category: 'SPECIAL',
        level: 1,
        name: "First Chief's Hut",
        cost: { food: 10000, wood: 0, stone: 0, metal: 0 },
        size: { w: 2, h: 2 },
        capacity: 0,
        upkeep: { wood: 0, food: 0 },
        benefits: [
            { type: 'DESIRABILITY', radius: 50, value: 2.0 },
            { type: 'CULTURE', value: 10 }
        ],
        stateThresholds: [],
        variants: [
            { name: "First Chief's Hut", icon: '🏛️', bonusMult: 1.0 }
        ],
        popUnlock: 0
    }
};

// Combined special buildings export
export const SPECIAL_BUILDINGS: Record<string, BuildingDefinition> = {
    ...INFRASTRUCTURE_BUILDINGS,
    ...MILESTONE_BUILDINGS,
    ...LEGACY_BUILDINGS
};
