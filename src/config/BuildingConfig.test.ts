import { describe, it, expect } from 'vitest';
import {
    getAllBuildings,
    getBuildingById,
    getBuildingsByType,
    getBuildingsByLevel,
    canUnlockBuilding,
    getStateForBuilding,
} from './BuildingConfig';

describe('getAllBuildings', () => {
    it('returns at least 20 buildings', () => {
        const all = getAllBuildings();
        expect(all.length).toBeGreaterThanOrEqual(20);
    });

    it('every building has required fields', () => {
        for (const b of getAllBuildings()) {
            expect(b.id).toBeTruthy();
            expect(b.name).toBeTruthy();
            expect(b.type).toBeTruthy();
            expect(b.level).toBeGreaterThanOrEqual(1);
            expect(b.states).toHaveLength(4);
        }
    });
});

describe('getBuildingById', () => {
    it('finds R1 by id', () => {
        const b = getBuildingById('R1');
        expect(b).not.toBeNull();
        expect(b!.name).toBe('Hobo Camp');
    });

    it('returns null for unknown id', () => {
        expect(getBuildingById('NONEXISTENT')).toBeNull();
    });
});

describe('getBuildingsByType', () => {
    it('returns only residential buildings', () => {
        const res = getBuildingsByType('RESIDENTIAL');
        expect(res.length).toBeGreaterThan(0);
        for (const b of res) {
            expect(b.type).toBe('RESIDENTIAL');
        }
    });

    it('returns only WELL type', () => {
        const wells = getBuildingsByType('WELL');
        expect(wells.length).toBeGreaterThan(0);
        for (const w of wells) {
            expect(w.type).toBe('WELL');
        }
    });
});

describe('getBuildingsByLevel', () => {
    it('filters by level 1', () => {
        const lvl1 = getBuildingsByLevel(1);
        expect(lvl1.length).toBeGreaterThan(0);
        for (const b of lvl1) {
            expect(b.level).toBe(1);
        }
    });
});

describe('canUnlockBuilding', () => {
    it('returns true when population meets requirement', () => {
        const b = getBuildingById('R1')!;
        expect(canUnlockBuilding(b, 100, false)).toBe(true);
    });

    it('returns false when population too low', () => {
        // R1 has populationUnlock = 0, so any pop works
        // Find a building with higher unlock
        const all = getAllBuildings();
        const locked = all.find(x => x.populationUnlock > 0);
        if (locked) {
            expect(canUnlockBuilding(locked, 0, false)).toBe(false);
        }
    });

    it('requires chief hut when building needs it', () => {
        const all = getAllBuildings();
        const needsChief = all.find(x => x.requiresChiefHut);
        if (needsChief) {
            expect(canUnlockBuilding(needsChief, 9999, false)).toBe(false);
            expect(canUnlockBuilding(needsChief, 9999, true)).toBe(true);
        }
    });
});

describe('getStateForBuilding', () => {
    it('returns state 0 for residential with 0 population', () => {
        const b = getBuildingById('R1')!;
        expect(getStateForBuilding(b, 0)).toBe(0);
    });

    it('returns higher state for more population', () => {
        const b = getBuildingById('R1')!;
        // R1 states: [0,0], [1,5], [6,10], [11,15]
        expect(getStateForBuilding(b, 12)).toBe(3);
    });

    it('returns state 2 for non-residential', () => {
        const b = getBuildingById('WELL')!;
        expect(getStateForBuilding(b, 0)).toBe(2);
    });
});
