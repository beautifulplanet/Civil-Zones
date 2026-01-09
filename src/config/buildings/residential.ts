/**
 * Civil Zones - Residential Building Definitions
 * Pre-Fire Age Theme: First people who discovered fire
 * 6 Levels with 4 Density States each
 */

import type { ResidentialBuildingDefinition } from '../../types/index.js';

export const RESIDENTIAL_BUILDINGS: Record<string, ResidentialBuildingDefinition> = {
    'RES_1': {
        id: 'RES_1',
        category: 'RESIDENTIAL',
        level: 1,
        name: 'Tree Shelter',
        cost: { food: 100, wood: 100, stone: 0, metal: 0 },
        size: { w: 1, h: 1 },
        capacity: 15,
        overflowCapacity: 20,
        upkeep: { wood: 1, food: 1 },
        baseIncome: 1,
        baseLifespan: 20,
        stateThresholds: [
            { min: 0, max: 0, name: 'Abandoned Nest', icon: '🪹', incomeClass: 'NONE', lifespanBonus: 0 },
            { min: 1, max: 5, name: 'Small Nest', icon: '🪺', incomeClass: 'LOW', incomeMult: 0.5, lifespanBonus: 0 },
            { min: 6, max: 10, name: 'Tree Platform', icon: '🌳', incomeClass: 'MEDIUM', incomeMult: 1.0, lifespanBonus: 1 },
            { min: 11, max: 15, name: 'Sturdy Treehouse', icon: '🏕️', incomeClass: 'HIGH', incomeMult: 1.5, lifespanBonus: 2 }
        ],
        benefits: [
            { type: 'HOUSING', value: 15 },
            { type: 'GATHER_BONUS', resource: 'wood', value: 2 },
            { type: 'GATHER_BONUS', resource: 'food', value: 2 }
        ],
        variants: [
            { name: 'Abandoned Nest', icon: '🪹', bonusMult: 0 },
            { name: 'Small Nest', icon: '🪺', bonusMult: 0.5 },
            { name: 'Tree Platform', icon: '🌳', bonusMult: 1.0 },
            { name: 'Sturdy Treehouse', icon: '🏕️', bonusMult: 1.5 }
        ],
        unlockReq: { pop: 0 }
    },

    'RES_2': {
        id: 'RES_2',
        category: 'RESIDENTIAL',
        level: 2,
        name: 'Ground Pit',
        cost: { food: 300, wood: 300, stone: 50, metal: 0 },
        size: { w: 1, h: 1 },
        capacity: 25,
        overflowCapacity: 30,
        upkeep: { wood: 2, food: 2 },
        baseIncome: 3,
        baseLifespan: 20,
        stateThresholds: [
            { min: 0, max: 0, name: 'Collapsed Pit', icon: '🕳️', incomeClass: 'NONE', lifespanBonus: 0 },
            { min: 1, max: 8, name: 'Shallow Scrape', icon: '⬛', incomeClass: 'LOW', incomeMult: 0.5, lifespanBonus: 0 },
            { min: 9, max: 17, name: 'Dug Pit', icon: '🟫', incomeClass: 'MEDIUM', incomeMult: 1.0, lifespanBonus: 1 },
            { min: 18, max: 25, name: 'Covered Pit Dwelling', icon: '🏠', incomeClass: 'HIGH', incomeMult: 1.5, lifespanBonus: 2 }
        ],
        benefits: [
            { type: 'HOUSING', value: 25 },
            { type: 'GATHER_BONUS', resource: 'wood', value: 5 },
            { type: 'GATHER_BONUS', resource: 'food', value: 5 },
            { type: 'GATHER_BONUS', resource: 'stone', value: 1 }
        ],
        variants: [
            { name: 'Collapsed Pit', icon: '🕳️', bonusMult: 0 },
            { name: 'Shallow Scrape', icon: '⬛', bonusMult: 0.5 },
            { name: 'Dug Pit', icon: '🟫', bonusMult: 1.0 },
            { name: 'Covered Pit Dwelling', icon: '🏠', bonusMult: 1.5 }
        ],
        unlockReq: { pop: 50 }
    },

    'RES_3': {
        id: 'RES_3',
        category: 'RESIDENTIAL',
        level: 3,
        name: 'Ground Cave',
        cost: { food: 900, wood: 900, stone: 200, metal: 0 },
        size: { w: 1, h: 1 },
        capacity: 60,
        overflowCapacity: 65,
        upkeep: { wood: 3, food: 3 },
        baseIncome: 8,
        baseLifespan: 20,
        stateThresholds: [
            { min: 0, max: 0, name: 'Collapsed Cave', icon: '🪨', incomeClass: 'NONE', lifespanBonus: 0 },
            { min: 1, max: 20, name: 'Small Cave', icon: '🕳️', incomeClass: 'LOW', incomeMult: 0.5, lifespanBonus: 0 },
            { min: 21, max: 40, name: 'Deep Cave', icon: '⛰️', incomeClass: 'MEDIUM', incomeMult: 1.0, lifespanBonus: 1 },
            { min: 41, max: 60, name: 'Cave Complex', icon: '🏔️', incomeClass: 'HIGH', incomeMult: 1.5, lifespanBonus: 2 }
        ],
        benefits: [
            { type: 'HOUSING', value: 60 },
            { type: 'GATHER_BONUS', resource: 'wood', value: 12 },
            { type: 'GATHER_BONUS', resource: 'food', value: 12 },
            { type: 'GATHER_BONUS', resource: 'stone', value: 3 },
            { type: 'GATHER_BONUS', resource: 'metal', value: 1 }
        ],
        variants: [
            { name: 'Collapsed Cave', icon: '🪨', bonusMult: 0 },
            { name: 'Small Cave', icon: '🕳️', bonusMult: 0.5 },
            { name: 'Deep Cave', icon: '⛰️', bonusMult: 1.0 },
            { name: 'Cave Complex', icon: '🏔️', bonusMult: 1.5 }
        ],
        unlockReq: {
            pop: 200,
            buildings: { type: 'COM', level: 1, count: 2 }
        }
    },

    // Post-Clan Chief Era: Native American themed buildings
    'RES_4': {
        id: 'RES_4',
        category: 'RESIDENTIAL',
        level: 4,
        name: 'Tipi Village',
        cost: { food: 2000, wood: 2000, stone: 40, metal: 0 },
        size: { w: 1, h: 1 },
        capacity: 50,
        overflowCapacity: 55,
        upkeep: { wood: 4, food: 4 },
        baseIncome: 16,
        baseLifespan: 25,
        stateThresholds: [
            { min: 0, max: 0, name: 'Abandoned Tipis', icon: '⛺', incomeClass: 'NONE', lifespanBonus: 0 },
            { min: 1, max: 16, name: 'Small Camp', icon: '⛺', incomeClass: 'LOW', incomeMult: 0.5, lifespanBonus: 0 },
            { min: 17, max: 33, name: 'Tipi Circle', icon: '🏕️', incomeClass: 'MEDIUM', incomeMult: 1.0, lifespanBonus: 2 },
            { min: 34, max: 50, name: 'Tipi Village', icon: '🎪', incomeClass: 'HIGH', incomeMult: 1.5, lifespanBonus: 4 }
        ],
        benefits: [
            { type: 'HOUSING', value: 50 },
            { type: 'GATHER_BONUS', resource: 'wood', value: 20 },
            { type: 'GATHER_BONUS', resource: 'food', value: 20 },
            { type: 'GATHER_BONUS', resource: 'stone', value: 5 }
        ],
        variants: [
            { name: 'Abandoned Tipis', icon: '⛺', bonusMult: 0 },
            { name: 'Small Camp', icon: '⛺', bonusMult: 0.5 },
            { name: 'Tipi Circle', icon: '🏕️', bonusMult: 1.0 },
            { name: 'Tipi Village', icon: '🎪', bonusMult: 1.5 }
        ],
        unlockReq: {
            buildings: { id: 'CLAN_CHIEF', count: 1 }
        },
        popUnlock: 500
    },

    'RES_5': {
        id: 'RES_5',
        category: 'RESIDENTIAL',
        level: 5,
        name: 'Log Longhouse',
        cost: { food: 8000, wood: 8000, stone: 80, metal: 0 },
        size: { w: 1, h: 1 },
        capacity: 120,
        overflowCapacity: 130,
        upkeep: { wood: 6, food: 6 },
        baseIncome: 32,
        baseLifespan: 30,
        stateThresholds: [
            { min: 0, max: 0, name: 'Ruined Longhouse', icon: '🏚️', incomeClass: 'NONE', lifespanBonus: 0 },
            { min: 1, max: 40, name: 'Small Longhouse', icon: '🏠', incomeClass: 'LOW', incomeMult: 0.5, lifespanBonus: 0 },
            { min: 41, max: 80, name: 'Family Longhouse', icon: '🏡', incomeClass: 'MEDIUM', incomeMult: 1.0, lifespanBonus: 3 },
            { min: 81, max: 120, name: 'Clan Longhouse', icon: '🏘️', incomeClass: 'HIGH', incomeMult: 1.5, lifespanBonus: 5 }
        ],
        benefits: [
            { type: 'HOUSING', value: 120 },
            { type: 'GATHER_BONUS', resource: 'wood', value: 40 },
            { type: 'GATHER_BONUS', resource: 'food', value: 40 },
            { type: 'GATHER_BONUS', resource: 'stone', value: 10 },
            { type: 'GATHER_BONUS', resource: 'metal', value: 3 }
        ],
        variants: [
            { name: 'Ruined Longhouse', icon: '🏚️', bonusMult: 0 },
            { name: 'Small Longhouse', icon: '🏠', bonusMult: 0.5 },
            { name: 'Family Longhouse', icon: '🏡', bonusMult: 1.0 },
            { name: 'Clan Longhouse', icon: '🏘️', bonusMult: 1.5 }
        ],
        unlockReq: {
            buildings: { id: 'CLAN_CHIEF', count: 1 }
        },
        popUnlock: 1000
    },

    'RES_6': {
        id: 'RES_6',
        category: 'RESIDENTIAL',
        level: 6,
        name: 'Old Growth Log Compound',
        cost: { food: 20000, wood: 20000, stone: 100, metal: 0 },
        size: { w: 1, h: 1 },
        capacity: 240,
        overflowCapacity: 260,
        upkeep: { wood: 10, food: 10 },
        baseIncome: 64,
        baseLifespan: 35,
        stateThresholds: [
            { min: 0, max: 0, name: 'Abandoned Compound', icon: '🏚️', incomeClass: 'NONE', lifespanBonus: 0 },
            { min: 1, max: 80, name: 'Small Compound', icon: '🏘️', incomeClass: 'LOW', incomeMult: 0.5, lifespanBonus: 0 },
            { min: 81, max: 160, name: 'Growing Compound', icon: '🏰', incomeClass: 'MEDIUM', incomeMult: 1.0, lifespanBonus: 4 },
            { min: 161, max: 240, name: 'Grand Log Compound', icon: '🏯', incomeClass: 'HIGH', incomeMult: 1.5, lifespanBonus: 7 }
        ],
        benefits: [
            { type: 'HOUSING', value: 240 },
            { type: 'GATHER_BONUS', resource: 'wood', value: 80 },
            { type: 'GATHER_BONUS', resource: 'food', value: 80 },
            { type: 'GATHER_BONUS', resource: 'stone', value: 20 },
            { type: 'GATHER_BONUS', resource: 'metal', value: 6 }
        ],
        variants: [
            { name: 'Abandoned Compound', icon: '🏚️', bonusMult: 0 },
            { name: 'Small Compound', icon: '🏘️', bonusMult: 0.5 },
            { name: 'Growing Compound', icon: '🏰', bonusMult: 1.0 },
            { name: 'Grand Log Compound', icon: '🏯', bonusMult: 1.5 }
        ],
        unlockReq: {
            buildings: { id: 'CLAN_CHIEF', count: 1 }
        },
        popUnlock: 2000
    }
};
