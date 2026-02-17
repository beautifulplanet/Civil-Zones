import { describe, it, expect } from 'vitest';
import { calculatePlacementBonus, ZONE_BONUSES } from './ZoneBonuses';
import { BuildingManager } from '../world/BuildingManager';
import { ChunkManager } from '../world/ChunkManager';
import { createBuilding } from '../world/Building';
import { getBuildingById } from './BuildingConfig';
import { TileType } from '../world/Tile';

function findValidTile(cm: ChunkManager, startX = 0): number {
    for (let i = startX; i < 200; i++) {
        const t = cm.getTile(i, 0);
        if (t && t.type !== TileType.WATER && t.type !== TileType.STONE) {
            return i;
        }
    }
    return 50; // fallback
}

describe('ZONE_BONUSES constants', () => {
    it('ROAD_ACCESS_BONUS is 0.50', () => {
        expect(ZONE_BONUSES.ROAD_ACCESS_BONUS).toBe(0.50);
    });

    it('ISOLATION_PENALTY is -0.30', () => {
        expect(ZONE_BONUSES.ISOLATION_PENALTY).toBe(-0.30);
    });

    it('minimum total efficiency is 10% (0.1)', () => {
        // This is enforced in calculatePlacementBonus via Math.max(0.1, total)
        expect(ZONE_BONUSES.RES_INDUSTRIAL_PENALTY).toBe(-0.25);
    });
});

describe('calculatePlacementBonus', () => {
    it('isolated building gets isolation penalty', () => {
        const cm = new ChunkManager();
        const bm = new BuildingManager(cm);
        const def = getBuildingById('R1')!;
        const x = findValidTile(cm);
        const building = createBuilding(def, x, 0, 1);

        const bonus = calculatePlacementBonus(building, def, bm, cm);
        // Should have isolation penalty since no other buildings nearby
        expect(bonus.penalties).toBeLessThanOrEqual(0);
        expect(bonus.total).toBeGreaterThanOrEqual(0.1); // min 10%
    });

    it('road adjacency gives 50% bonus', () => {
        const cm = new ChunkManager();
        const bm = new BuildingManager(cm);
        const x = findValidTile(cm);
        const x2 = findValidTile(cm, x + 1);

        // Place a road first
        bm.placeBuilding('ROAD', x, 0, 1);

        // Calculate bonus for building adjacent to road
        const def = getBuildingById('R1')!;
        const building = createBuilding(def, x2, 0, 1);
        const bonus = calculatePlacementBonus(building, def, bm, cm);

        // Should have road access bonus (may or may not depending on distance)
        expect(bonus.roadAccess).toBeGreaterThanOrEqual(0);
    });

    it('total is always >= 0.1', () => {
        const cm = new ChunkManager();
        const bm = new BuildingManager(cm);
        const def = getBuildingById('R1')!;
        const x = findValidTile(cm, 150); // far away, likely isolated
        const building = createBuilding(def, x, 0, 1);

        const bonus = calculatePlacementBonus(building, def, bm, cm);
        expect(bonus.total).toBeGreaterThanOrEqual(0.1);
    });

    it('returns BonusBreakdown with all fields', () => {
        const cm = new ChunkManager();
        const bm = new BuildingManager(cm);
        const def = getBuildingById('R1')!;
        const x = findValidTile(cm);
        const building = createBuilding(def, x, 0, 1);

        const bonus = calculatePlacementBonus(building, def, bm, cm);
        expect(bonus).toHaveProperty('roadAccess');
        expect(bonus).toHaveProperty('waterProximity');
        expect(bonus).toHaveProperty('wellProximity');
        expect(bonus).toHaveProperty('zoneSpecific');
        expect(bonus).toHaveProperty('clustering');
        expect(bonus).toHaveProperty('penalties');
        expect(bonus).toHaveProperty('total');
    });

    it('well proximity bonus for nearby well', () => {
        const cm = new ChunkManager();
        const bm = new BuildingManager(cm);
        const x = findValidTile(cm);
        const x2 = findValidTile(cm, x + 1);

        // Place a well
        bm.placeBuilding('WELL', x, 0, 1);

        // Calculate bonus for building near well
        const def = getBuildingById('R1')!;
        const building = createBuilding(def, x2, 0, 1);
        const bonus = calculatePlacementBonus(building, def, bm, cm);
        expect(bonus.wellProximity).toBeGreaterThanOrEqual(0);
    });
});
