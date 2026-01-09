/**
 * Civil Zones - Industrial Building Definitions
 * Pre-Fire Age Theme: Hunting, Gathering, and Production
 * 6 Levels with 4 Activity States each
 */

import type { IndustrialBuildingDefinition } from '../../types/index.js';

export const INDUSTRIAL_BUILDINGS: Record<string, IndustrialBuildingDefinition> = {
    'IND_1': {
        id: 'IND_1',
        category: 'INDUSTRIAL',
        level: 1,
        name: 'Bird Hunting Range',
        cost: { food: 200, wood: 200, stone: 0, metal: 0 },
        size: { w: 1, h: 1 },
        capacity: 10,
        baseProduction: 10,
        upkeep: { wood: 1, food: 1 },
        benefits: [
            { type: 'JOBS', value: 10 },
            { type: 'GATHER_BONUS', resource: 'food', value: 5 },
            { type: 'DESIRABILITY', radius: 3, value: 0.1 }
        ],
        stateThresholds: [
            { min: 0, max: 0, name: 'Empty Range', icon: '🪶', productionMult: 0 },
            { min: 0.01, max: 0.3, name: 'Sparse Hunting Path', icon: '🪶', productionMult: 0.5 },
            { min: 0.31, max: 0.7, name: 'Bird Hunting Range', icon: '🦅', productionMult: 1.0 },
            { min: 0.71, max: 1.0, name: 'Prime Fowling Grounds', icon: '🎯', productionMult: 1.5 }
        ],
        variants: [
            { name: 'Empty Range', icon: '🪶', bonusMult: 0 },
            { name: 'Sparse Hunting Path', icon: '🪶', bonusMult: 0.5 },
            { name: 'Bird Hunting Range', icon: '🦅', bonusMult: 1.0 },
            { name: 'Prime Fowling Grounds', icon: '🎯', bonusMult: 1.5 }
        ],
        popUnlock: 2
    },

    'IND_2': {
        id: 'IND_2',
        category: 'INDUSTRIAL',
        level: 2,
        name: 'Grub Digging Pit',
        cost: { food: 500, wood: 500, stone: 100, metal: 0 },
        size: { w: 1, h: 1 },
        capacity: 25,
        baseProduction: 25,
        upkeep: { wood: 2, food: 1 },
        benefits: [
            { type: 'JOBS', value: 25 },
            { type: 'GATHER_BONUS', resource: 'food', value: 10 },
            { type: 'GATHER_BONUS', resource: 'stone', value: 2 },
            { type: 'DESIRABILITY', radius: 3, value: 0.1 }
        ],
        stateThresholds: [
            { min: 0, max: 0, name: 'Filled Hole', icon: '🕳️', productionMult: 0 },
            { min: 0.01, max: 0.3, name: 'Scratched Earth', icon: '🕳️', productionMult: 0.5 },
            { min: 0.31, max: 0.7, name: 'Grub Digging Pit', icon: '🪱', productionMult: 1.0 },
            { min: 0.71, max: 1.0, name: 'Bountiful Foraging Pit', icon: '🍖', productionMult: 1.5 }
        ],
        variants: [
            { name: 'Filled Hole', icon: '🕳️', bonusMult: 0 },
            { name: 'Scratched Earth', icon: '🕳️', bonusMult: 0.5 },
            { name: 'Grub Digging Pit', icon: '🪱', bonusMult: 1.0 },
            { name: 'Bountiful Foraging Pit', icon: '🍖', bonusMult: 1.5 }
        ],
        popUnlock: 50
    },

    'IND_3': {
        id: 'IND_3',
        category: 'INDUSTRIAL',
        level: 3,
        name: 'Stone Knapping Site',
        cost: { food: 1500, wood: 1500, stone: 500, metal: 0 },
        size: { w: 1, h: 1 },
        capacity: 60,
        baseProduction: 60,
        upkeep: { wood: 3, food: 1 },
        benefits: [
            { type: 'JOBS', value: 60 },
            { type: 'GATHER_BONUS', resource: 'food', value: 15 },
            { type: 'GATHER_BONUS', resource: 'stone', value: 10 },
            { type: 'GATHER_BONUS', resource: 'metal', value: 3 },
            { type: 'DESIRABILITY', radius: 4, value: 0.15 }
        ],
        stateThresholds: [
            { min: 0, max: 0, name: 'Abandoned Site', icon: '🪨', productionMult: 0 },
            { min: 0.01, max: 0.3, name: 'Scattered Flakes', icon: '🪨', productionMult: 0.5 },
            { min: 0.31, max: 0.7, name: 'Stone Knapping Site', icon: '⚒️', productionMult: 1.0 },
            { min: 0.71, max: 1.0, name: 'Master Flint Workshop', icon: '🔨', productionMult: 1.5 }
        ],
        variants: [
            { name: 'Abandoned Site', icon: '🪨', bonusMult: 0 },
            { name: 'Scattered Flakes', icon: '🪨', bonusMult: 0.5 },
            { name: 'Stone Knapping Site', icon: '⚒️', bonusMult: 1.0 },
            { name: 'Master Flint Workshop', icon: '🔨', bonusMult: 1.5 }
        ],
        popUnlock: 200
    },

    // Post-Clan Chief Era: Advanced hunting and resource extraction
    'IND_4': {
        id: 'IND_4',
        category: 'INDUSTRIAL',
        level: 4,
        name: 'Turtle Hunting Ground',
        cost: { food: 2400, wood: 2400, stone: 48, metal: 0 },
        size: { w: 1, h: 1 },
        capacity: 20,
        baseProduction: 50,
        upkeep: { wood: 4, food: 2 },
        benefits: [
            { type: 'JOBS', value: 20 },
            { type: 'GATHER_BONUS', resource: 'food', value: 30 },
            { type: 'GATHER_BONUS', resource: 'stone', value: 15 },
            { type: 'DESIRABILITY', radius: 4, value: 0.2 }
        ],
        stateThresholds: [
            { min: 0, max: 0, name: 'Empty Grounds', icon: '🐢', productionMult: 0 },
            { min: 0.01, max: 0.3, name: 'Sparse Hunting', icon: '🐢', productionMult: 0.5 },
            { min: 0.31, max: 0.7, name: 'Turtle Hunting Ground', icon: '🎯', productionMult: 1.0 },
            { min: 0.71, max: 1.0, name: 'Prime Turtle Territory', icon: '🏆', productionMult: 1.5 }
        ],
        variants: [
            { name: 'Empty Grounds', icon: '🐢', bonusMult: 0 },
            { name: 'Sparse Hunting', icon: '🐢', bonusMult: 0.5 },
            { name: 'Turtle Hunting Ground', icon: '🎯', bonusMult: 1.0 },
            { name: 'Prime Turtle Territory', icon: '🏆', bonusMult: 1.5 }
        ],
        unlockReq: {
            buildings: { id: 'CLAN_CHIEF', count: 1 }
        },
        popUnlock: 500
    },

    'IND_5': {
        id: 'IND_5',
        category: 'INDUSTRIAL',
        level: 5,
        name: 'Bear Pit',
        cost: { food: 9600, wood: 9600, stone: 96, metal: 0 },
        size: { w: 1, h: 1 },
        capacity: 50,
        baseProduction: 120,
        upkeep: { wood: 6, food: 3 },
        benefits: [
            { type: 'JOBS', value: 50 },
            { type: 'GATHER_BONUS', resource: 'food', value: 60 },
            { type: 'GATHER_BONUS', resource: 'stone', value: 25 },
            { type: 'GATHER_BONUS', resource: 'metal', value: 8 },
            { type: 'DESIRABILITY', radius: 5, value: 0.25 }
        ],
        stateThresholds: [
            { min: 0, max: 0, name: 'Abandoned Pit', icon: '🐻', productionMult: 0 },
            { min: 0.01, max: 0.3, name: 'Small Bear Trap', icon: '🐻', productionMult: 0.5 },
            { min: 0.31, max: 0.7, name: 'Bear Pit', icon: '⚔️', productionMult: 1.0 },
            { min: 0.71, max: 1.0, name: 'Great Bear Hunting Ground', icon: '🏹', productionMult: 1.5 }
        ],
        variants: [
            { name: 'Abandoned Pit', icon: '🐻', bonusMult: 0 },
            { name: 'Small Bear Trap', icon: '🐻', bonusMult: 0.5 },
            { name: 'Bear Pit', icon: '⚔️', bonusMult: 1.0 },
            { name: 'Great Bear Hunting Ground', icon: '🏹', bonusMult: 1.5 }
        ],
        unlockReq: {
            buildings: { id: 'CLAN_CHIEF', count: 1 }
        },
        popUnlock: 1000
    },

    'IND_6': {
        id: 'IND_6',
        category: 'INDUSTRIAL',
        level: 6,
        name: 'Buffalo Grounds',
        cost: { food: 24000, wood: 24000, stone: 120, metal: 0 },
        size: { w: 1, h: 1 },
        capacity: 120,
        baseProduction: 240,
        upkeep: { wood: 10, food: 5 },
        benefits: [
            { type: 'JOBS', value: 120 },
            { type: 'GATHER_BONUS', resource: 'food', value: 120 },
            { type: 'GATHER_BONUS', resource: 'stone', value: 40 },
            { type: 'GATHER_BONUS', resource: 'metal', value: 15 },
            { type: 'DESIRABILITY', radius: 6, value: 0.3 }
        ],
        stateThresholds: [
            { min: 0, max: 0, name: 'Empty Plains', icon: '🦬', productionMult: 0 },
            { min: 0.01, max: 0.3, name: 'Sparse Herd Grounds', icon: '🦬', productionMult: 0.5 },
            { min: 0.31, max: 0.7, name: 'Buffalo Grounds', icon: '🏹', productionMult: 1.0 },
            { min: 0.71, max: 1.0, name: 'Great Buffalo Hunt', icon: '⚡', productionMult: 1.5 }
        ],
        variants: [
            { name: 'Empty Plains', icon: '🦬', bonusMult: 0 },
            { name: 'Sparse Herd Grounds', icon: '🦬', bonusMult: 0.5 },
            { name: 'Buffalo Grounds', icon: '🏹', bonusMult: 1.0 },
            { name: 'Great Buffalo Hunt', icon: '⚡', bonusMult: 1.5 }
        ],
        unlockReq: {
            buildings: { id: 'CLAN_CHIEF', count: 1 }
        },
        popUnlock: 2000
    }
};
