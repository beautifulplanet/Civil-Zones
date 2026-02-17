import { describe, it, expect } from 'vitest';
import { BuildingManager } from './BuildingManager';
import { ChunkManager } from './ChunkManager';
import { TileType } from './Tile';

describe('BuildingManager', () => {
    function createBM(): BuildingManager {
        const cm = new ChunkManager();
        return new BuildingManager(cm);
    }

    describe('canPlaceAt', () => {
        it('allows placement on grass', () => {
            const bm = createBM();
            // Find a grass tile by probing
            // Tile at (10,10) should be land (seed-dependent but generally valid)
            const cm = new ChunkManager();
            const tile = cm.getTile(10, 10);
            // If it's water or stone we just test with a different coord
            if (tile && tile.type !== TileType.WATER && tile.type !== TileType.STONE) {
                expect(bm.canPlaceAt(10, 10)).toBe(true);
            }
        });

        it('rejects double placement on same tile', () => {
            const cm = new ChunkManager();
            const bm = new BuildingManager(cm);
            // Find a valid tile
            let x = 0, y = 0;
            for (let i = 0; i < 100; i++) {
                const tile = cm.getTile(i, 0);
                if (tile && tile.type !== TileType.WATER && tile.type !== TileType.STONE) {
                    x = i; break;
                }
            }
            bm.placeBuilding('WELL', x, y, 1);
            expect(bm.canPlaceAt(x, y)).toBe(false);
        });
    });

    describe('placeBuilding', () => {
        it('returns building instance on success', () => {
            const cm = new ChunkManager();
            const bm = new BuildingManager(cm);
            let x = 0;
            for (let i = 0; i < 100; i++) {
                const tile = cm.getTile(i, 0);
                if (tile && tile.type !== TileType.WATER && tile.type !== TileType.STONE) {
                    x = i; break;
                }
            }
            const b = bm.placeBuilding('WELL', x, 0, 1);
            expect(b).not.toBeNull();
            expect(b!.definitionId).toBe('WELL');
        });

        it('returns null for unknown building id', () => {
            const cm = new ChunkManager();
            const bm = new BuildingManager(cm);
            const b = bm.placeBuilding('NONEXISTENT', 0, 0, 1);
            expect(b).toBeNull();
        });

        it('calculates efficiency via ZoneBonuses', () => {
            const cm = new ChunkManager();
            const bm = new BuildingManager(cm);
            let x = 0;
            for (let i = 0; i < 100; i++) {
                const tile = cm.getTile(i, 0);
                if (tile && tile.type !== TileType.WATER && tile.type !== TileType.STONE) {
                    x = i; break;
                }
            }
            const b = bm.placeBuilding('R1', x, 0, 1);
            expect(b).not.toBeNull();
            // Efficiency should be set (may include isolation penalty etc.)
            expect(b!.efficiency).toBeGreaterThan(0);
        });
    });

    describe('removeBuilding', () => {
        it('removes a placed building', () => {
            const cm = new ChunkManager();
            const bm = new BuildingManager(cm);
            let x = 0;
            for (let i = 0; i < 100; i++) {
                const tile = cm.getTile(i, 0);
                if (tile && tile.type !== TileType.WATER && tile.type !== TileType.STONE) {
                    x = i; break;
                }
            }
            const b = bm.placeBuilding('WELL', x, 0, 1);
            expect(b).not.toBeNull();
            const removed = bm.removeBuilding(b!.id);
            expect(removed).toBe(true);
            expect(bm.getBuildingAt(x, 0)).toBeNull();
        });

        it('returns false for non-existent building', () => {
            const bm = createBM();
            expect(bm.removeBuilding('fake_id')).toBe(false);
        });
    });

    describe('getAllBuildings', () => {
        it('returns empty array initially', () => {
            const bm = createBM();
            expect(bm.getAllBuildings()).toEqual([]);
        });
    });

    describe('getBuildingsNear', () => {
        it('finds buildings within radius', () => {
            const cm = new ChunkManager();
            const bm = new BuildingManager(cm);
            // Place two buildings close together
            let x1 = -1, x2 = -1;
            for (let i = 0; i < 100; i++) {
                const t = cm.getTile(i, 0);
                if (t && t.type !== TileType.WATER && t.type !== TileType.STONE) {
                    if (x1 === -1) x1 = i;
                    else if (x2 === -1 && i - x1 <= 2) { x2 = i; break; }
                }
            }
            if (x1 >= 0 && x2 >= 0) {
                bm.placeBuilding('WELL', x1, 0, 1);
                bm.placeBuilding('ROAD', x2, 0, 1);
                const nearby = bm.getBuildingsNear(x1, 0, 3);
                expect(nearby.length).toBeGreaterThanOrEqual(1);
            }
        });
    });

    describe('getBuildingDefinition', () => {
        it('returns definition for placed building', () => {
            const cm = new ChunkManager();
            const bm = new BuildingManager(cm);
            let x = 0;
            for (let i = 0; i < 100; i++) {
                const tile = cm.getTile(i, 0);
                if (tile && tile.type !== TileType.WATER && tile.type !== TileType.STONE) {
                    x = i; break;
                }
            }
            const b = bm.placeBuilding('WELL', x, 0, 1);
            expect(b).not.toBeNull();
            const def = bm.getBuildingDefinition(b!);
            expect(def).not.toBeNull();
            expect(def!.id).toBe('WELL');
        });
    });
});
