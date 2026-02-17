import { describe, it, expect } from 'vitest';
import { createBuilding } from './Building';
import type { BuildingDefinition } from '../config/BuildingConfig';

// Minimal mock definition
const mockDef: BuildingDefinition = {
    id: 'TEST_HOUSE',
    name: 'Test House',
    type: 'RESIDENTIAL',
    level: 1,
    cost: { wood: 10 },
    upkeep: {},
    populationMin: 0,
    populationMax: 5,
    populationUnlock: 0,
    emoji: '🏠',
    states: [
        { name: 'Vacant', efficiency: 0 },
        { name: 'Growing', efficiency: 0.5 },
        { name: 'Active', efficiency: 1.0 },
        { name: 'Thriving', efficiency: 1.5 },
    ],
};

const industrialDef: BuildingDefinition = {
    id: 'FARM',
    name: 'Farm',
    type: 'INDUSTRIAL',
    level: 1,
    cost: { wood: 5 },
    upkeep: {},
    jobs: 3,
    production: 10,
    populationUnlock: 0,
    emoji: '🌾',
    states: [
        { name: 'Vacant', efficiency: 0 },
        { name: 'Growing', efficiency: 0.5 },
        { name: 'Active', efficiency: 1.0 },
        { name: 'Thriving', efficiency: 1.5 },
    ],
};

describe('createBuilding', () => {
    it('creates building at correct position', () => {
        const b = createBuilding(mockDef, 5, 10, 3);
        expect(b.x).toBe(5);
        expect(b.y).toBe(10);
        expect(b.yearBuilt).toBe(3);
    });

    it('starts at state 1 (Growing)', () => {
        const b = createBuilding(mockDef, 0, 0, 1);
        expect(b.state).toBe(1);
    });

    it('sets default efficiency to 1.0', () => {
        const b = createBuilding(mockDef, 0, 0, 1);
        expect(b.efficiency).toBe(1.0);
    });

    it('sets population for residential', () => {
        const b = createBuilding(mockDef, 0, 0, 1);
        expect(b.population).toBe(0);
    });

    it('sets workers for buildings with jobs', () => {
        const b = createBuilding(industrialDef, 0, 0, 1);
        expect(b.workers).toBe(0);
    });

    it('generates unique ID containing definition id, coords, and timestamp', () => {
        const b = createBuilding(mockDef, 2, 3, 1);
        expect(b.id).toContain('TEST_HOUSE');
        expect(b.id).toContain('2');
        expect(b.id).toContain('3');
    });

    it('links to definition via definitionId', () => {
        const b = createBuilding(mockDef, 0, 0, 1);
        expect(b.definitionId).toBe('TEST_HOUSE');
    });
});
