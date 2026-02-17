/**
 * Building Manager
 * Handles building placement, validation, and management
 */

import type { Building } from './Building';
import { createBuilding } from './Building';
import type { BuildingDefinition } from '../config/BuildingConfig';
import { getBuildingById } from '../config/BuildingConfig';
import { calculatePlacementBonus } from '../config/ZoneBonuses';
import type { ChunkManager } from './ChunkManager';
import { TileType } from './Tile';

export class BuildingManager {
    private buildings: Map<string, Building> = new Map();
    private buildingGrid: Map<string, string> = new Map(); // "x,y" -> buildingId
    private chunkManager: ChunkManager;

    constructor(chunkManager: ChunkManager) {
        this.chunkManager = chunkManager;
    }

    private getTileKey(x: number, y: number): string {
        return `${Math.floor(x)},${Math.floor(y)}`;
    }

    /**
     * Check if a tile can have a building placed on it
     */
    public canPlaceAt(x: number, y: number): boolean {
        // Check if tile already occupied
        const key = this.getTileKey(x, y);
        if (this.buildingGrid.has(key)) {
            return false;
        }

        // Check terrain type
        const tile = this.chunkManager.getTile(x, y);
        if (!tile) return false;

        // Can't build on water or stone
        if (tile.type === TileType.WATER || tile.type === TileType.STONE) {
            return false;
        }

        return true;
    }

    /**
     * Place a building
     * Returns building instance if successful, null if failed
     */
    public placeBuilding(
        definitionId: string,
        x: number,
        y: number,
        currentYear: number
    ): Building | null {
        // Get building definition
        const definition = getBuildingById(definitionId);
        if (!definition) {
            console.error(`Unknown building: ${definitionId}`);
            return null;
        }

        // Validate placement
        if (!this.canPlaceAt(x, y)) {
            console.warn(`Cannot place building at ${x},${y}`);
            return null;
        }

        // Create building instance
        const building = createBuilding(definition, x, y, currentYear);

        // Store building
        this.buildings.set(building.id, building);
        const key = this.getTileKey(x, y);
        this.buildingGrid.set(key, building.id);

        // Calculate and apply placement efficiency bonus
        const bonus = calculatePlacementBonus(building, definition, this, this.chunkManager);
        building.efficiency = bonus.total;

        return building;
    }

    /**
     * Remove a building
     */
    public removeBuilding(buildingId: string): boolean {
        const building = this.buildings.get(buildingId);
        if (!building) return false;

        const key = this.getTileKey(building.x, building.y);
        this.buildingGrid.delete(key);
        this.buildings.delete(buildingId);
        return true;
    }

    /**
     * Get building at specific tile
     */
    public getBuildingAt(x: number, y: number): Building | null {
        const key = this.getTileKey(x, y);
        const buildingId = this.buildingGrid.get(key);
        if (!buildingId) return null;
        return this.buildings.get(buildingId) || null;
    }

    /**
     * Get all buildings
     */
    public getAllBuildings(): Building[] {
        return Array.from(this.buildings.values());
    }

    /**
     * Get building definition for an instance
     */
    public getBuildingDefinition(building: Building): BuildingDefinition | null {
        return getBuildingById(building.definitionId);
    }

    /**
     * Get buildings near a point
     */
    public getBuildingsNear(x: number, y: number, radius: number): Building[] {
        const buildings: Building[] = [];
        const radiusSq = radius * radius;

        for (const building of this.buildings.values()) {
            const dx = building.x - x;
            const dy = building.y - y;
            const distSq = dx * dx + dy * dy;

            if (distSq <= radiusSq) {
                buildings.push(building);
            }
        }

        return buildings;
    }
}
