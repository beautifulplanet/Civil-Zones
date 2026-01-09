/**
 * Civil Zones - Commercial Building Definitions
 * Pre-Fire Age Theme: Trading and Exchange
 * 6 Levels with 4 Activity States each
 */

import type { CommercialBuildingDefinition } from '../../types/index.js';

export const COMMERCIAL_BUILDINGS: Record<string, CommercialBuildingDefinition> = {
    'COM_1': {
        id: 'COM_1',
        category: 'COMMERCIAL',
        level: 1,
        name: 'Pebble Trade Fire',
        cost: { food: 150, wood: 150, stone: 0, metal: 0 },
        size: { w: 1, h: 1 },
        capacity: 8,
        baseIncome: 5,
        upkeep: { wood: 1, food: 0 },
        benefits: [
            { type: 'JOBS', value: 8 },
            { type: 'INCOME', value: 5 },
            { type: 'DESIRABILITY', radius: 4, value: 0.2 }
        ],
        stateThresholds: [
            { min: 0, max: 0, name: 'Cold Embers', icon: '⬛', incomeMult: 0 },
            { min: 0.01, max: 0.3, name: 'Pebble Trade Fire', icon: '🔥', incomeMult: 0.5 },
            { min: 0.31, max: 0.7, name: 'Pebble Trade Fire', icon: '🔥', incomeMult: 1.0 },
            { min: 0.71, max: 1.0, name: 'Busy Trade Fire', icon: '🔥', incomeMult: 1.5 }
        ],
        variants: [
            { name: 'Cold Embers', icon: '⬛', bonusMult: 0 },
            { name: 'Pebble Trade Fire', icon: '🔥', bonusMult: 0.5 },
            { name: 'Pebble Trade Fire', icon: '🔥', bonusMult: 1.0 },
            { name: 'Busy Trade Fire', icon: '🔥', bonusMult: 1.5 }
        ],
        popUnlock: 10
    },

    'COM_2': {
        id: 'COM_2',
        category: 'COMMERCIAL',
        level: 2,
        name: 'Squirrel Trade Camp',
        cost: { food: 400, wood: 400, stone: 50, metal: 0 },
        size: { w: 1, h: 1 },
        capacity: 20,
        baseIncome: 15,
        upkeep: { wood: 2, food: 0 },
        benefits: [
            { type: 'JOBS', value: 20 },
            { type: 'INCOME', value: 15 },
            { type: 'DESIRABILITY', radius: 5, value: 0.3 }
        ],
        stateThresholds: [
            { min: 0, max: 0, name: 'Empty Camp', icon: '🏕️', incomeMult: 0 },
            { min: 0.01, max: 0.3, name: 'Squirrel Trade Camp', icon: '🐿️', incomeMult: 0.5 },
            { min: 0.31, max: 0.7, name: 'Squirrel Trade Camp', icon: '🐿️', incomeMult: 1.0 },
            { min: 0.71, max: 1.0, name: 'Busy Fur Camp', icon: '🐿️', incomeMult: 1.5 }
        ],
        variants: [
            { name: 'Empty Camp', icon: '🏕️', bonusMult: 0 },
            { name: 'Squirrel Trade Camp', icon: '🐿️', bonusMult: 0.5 },
            { name: 'Squirrel Trade Camp', icon: '🐿️', bonusMult: 1.0 },
            { name: 'Busy Fur Camp', icon: '🐿️', bonusMult: 1.5 }
        ],
        popUnlock: 40
    },

    'COM_3': {
        id: 'COM_3',
        category: 'COMMERCIAL',
        level: 3,
        name: 'Fire Meet Camp',
        cost: { food: 1200, wood: 1200, stone: 200, metal: 0 },
        size: { w: 1, h: 1 },
        capacity: 50,
        baseIncome: 40,
        upkeep: { wood: 3, food: 0 },
        benefits: [
            { type: 'JOBS', value: 50 },
            { type: 'INCOME', value: 40 },
            { type: 'DESIRABILITY', radius: 6, value: 0.4 },
            { type: 'CULTURE', value: 5 }
        ],
        stateThresholds: [
            { min: 0, max: 0, name: 'Cold Meeting Ground', icon: '⭕', incomeMult: 0 },
            { min: 0.01, max: 0.3, name: 'Fire Meet Camp', icon: '🏕️', incomeMult: 0.5 },
            { min: 0.31, max: 0.7, name: 'Fire Meet Camp', icon: '🔥', incomeMult: 1.0 },
            { min: 0.71, max: 1.0, name: 'Great Fire Gathering', icon: '🎆', incomeMult: 1.5 }
        ],
        variants: [
            { name: 'Cold Meeting Ground', icon: '⭕', bonusMult: 0 },
            { name: 'Fire Meet Camp', icon: '🏕️', bonusMult: 0.5 },
            { name: 'Fire Meet Camp', icon: '🔥', bonusMult: 1.0 },
            { name: 'Great Fire Gathering', icon: '🎆', bonusMult: 1.5 }
        ],
        popUnlock: 150
    },

    // Post-Clan Chief Era: Advanced trading and marketplaces
    'COM_4': {
        id: 'COM_4',
        category: 'COMMERCIAL',
        level: 4,
        name: 'Barter Barrel',
        cost: { food: 1600, wood: 1600, stone: 32, metal: 0 },
        size: { w: 1, h: 1 },
        capacity: 16,
        baseIncome: 80,
        upkeep: { wood: 4, food: 0 },
        benefits: [
            { type: 'JOBS', value: 16 },
            { type: 'INCOME', value: 80 },
            { type: 'DESIRABILITY', radius: 5, value: 0.35 }
        ],
        stateThresholds: [
            { min: 0, max: 0, name: 'Empty Barrel', icon: '🪣', incomeMult: 0 },
            { min: 0.01, max: 0.3, name: 'Sparse Goods', icon: '🪣', incomeMult: 0.5 },
            { min: 0.31, max: 0.7, name: 'Barter Barrel', icon: '🛢️', incomeMult: 1.0 },
            { min: 0.71, max: 1.0, name: 'Bustling Trade Post', icon: '💰', incomeMult: 1.5 }
        ],
        variants: [
            { name: 'Empty Barrel', icon: '🪣', bonusMult: 0 },
            { name: 'Sparse Goods', icon: '🪣', bonusMult: 0.5 },
            { name: 'Barter Barrel', icon: '🛢️', bonusMult: 1.0 },
            { name: 'Bustling Trade Post', icon: '💰', bonusMult: 1.5 }
        ],
        unlockReq: {
            buildings: { id: 'CLAN_CHIEF', count: 1 }
        },
        popUnlock: 500
    },

    'COM_5': {
        id: 'COM_5',
        category: 'COMMERCIAL',
        level: 5,
        name: 'Blanket Market',
        cost: { food: 6400, wood: 6400, stone: 64, metal: 0 },
        size: { w: 1, h: 1 },
        capacity: 40,
        baseIncome: 160,
        upkeep: { wood: 6, food: 0 },
        benefits: [
            { type: 'JOBS', value: 40 },
            { type: 'INCOME', value: 160 },
            { type: 'DESIRABILITY', radius: 6, value: 0.45 },
            { type: 'CULTURE', value: 8 }
        ],
        stateThresholds: [
            { min: 0, max: 0, name: 'Empty Market', icon: '🧺', incomeMult: 0 },
            { min: 0.01, max: 0.3, name: 'Few Blankets', icon: '🧺', incomeMult: 0.5 },
            { min: 0.31, max: 0.7, name: 'Blanket Market', icon: '🛍️', incomeMult: 1.0 },
            { min: 0.71, max: 1.0, name: 'Grand Market Fair', icon: '🎪', incomeMult: 1.5 }
        ],
        variants: [
            { name: 'Empty Market', icon: '🧺', bonusMult: 0 },
            { name: 'Few Blankets', icon: '🧺', bonusMult: 0.5 },
            { name: 'Blanket Market', icon: '🛍️', bonusMult: 1.0 },
            { name: 'Grand Market Fair', icon: '🎪', bonusMult: 1.5 }
        ],
        unlockReq: {
            buildings: { id: 'CLAN_CHIEF', count: 1 }
        },
        popUnlock: 1000
    },

    'COM_6': {
        id: 'COM_6',
        category: 'COMMERCIAL',
        level: 6,
        name: 'Bear Market',
        cost: { food: 16000, wood: 16000, stone: 80, metal: 0 },
        size: { w: 1, h: 1 },
        capacity: 100,
        baseIncome: 320,
        upkeep: { wood: 10, food: 0 },
        benefits: [
            { type: 'JOBS', value: 100 },
            { type: 'INCOME', value: 320 },
            { type: 'DESIRABILITY', radius: 7, value: 0.55 },
            { type: 'CULTURE', value: 15 }
        ],
        stateThresholds: [
            { min: 0, max: 0, name: 'Abandoned Market', icon: '🐻', incomeMult: 0 },
            { min: 0.01, max: 0.3, name: 'Quiet Trading', icon: '🐻', incomeMult: 0.5 },
            { min: 0.31, max: 0.7, name: 'Bear Market', icon: '🏪', incomeMult: 1.0 },
            { min: 0.71, max: 1.0, name: 'Great Bear Exchange', icon: '🏛️', incomeMult: 1.5 }
        ],
        variants: [
            { name: 'Abandoned Market', icon: '🐻', bonusMult: 0 },
            { name: 'Quiet Trading', icon: '🐻', bonusMult: 0.5 },
            { name: 'Bear Market', icon: '🏪', bonusMult: 1.0 },
            { name: 'Great Bear Exchange', icon: '🏛️', bonusMult: 1.5 }
        ],
        unlockReq: {
            buildings: { id: 'CLAN_CHIEF', count: 1 }
        },
        popUnlock: 2000
    }
};
