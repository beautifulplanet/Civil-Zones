/**
 * Zone Bonus Calculator
 * Calculates placement bonuses based on adjacency rules from game-data-spec.md
 */

import type { Building } from '../world/Building';
import type { BuildingDefinition } from './BuildingConfig';
import type { BuildingManager } from '../world/BuildingManager';
import type { ChunkManager } from '../world/ChunkManager';
import { TileType } from '../world/Tile';

// Bonus constants from game-data-spec.md
export const ZONE_BONUSES = {
    // Road Access
    ROAD_ACCESS_BONUS: 0.50,        // +50% if adjacent to road
    NO_ROAD_PENALTY: -0.30,         // -30% if no road within 3 tiles
    ROAD_JUNCTION_BONUS: 0.20,      // +20% for commercial at 3+ road junction

    // Water Proximity
    RES_WATER_BONUS: 0.30,          // +30% for residential near water (3 tiles)
    IND_WATER_BONUS: 0.15,          // +15% for industrial near water

    // Well Proximity
    WELL_BONUS: 0.15,               // +15% for all zones near well (3 tiles)

    // Zone-Specific
    RES_TREE_BONUS: 0.20,           // +20% residential near trees
    RES_CLUSTER_BONUS: 0.10,        // +10% per adjacent residential
    RES_INDUSTRIAL_PENALTY: -0.25,  // -25% residential near industrial (2 tiles)
    COM_RES_NEARBY_BONUS: 0.40,     // +40% commercial near residential (8 tiles)
    COM_ROAD_JUNCTION_BONUS: 0.20,  // +20% commercial at road junction
    IND_STONE_BONUS: 0.25,          // +25% industrial near stone deposits (3 tiles)
    IND_FOREST_BONUS: 0.15,         // +15% industrial near forest (2 tiles)

    // Isolation
    ISOLATION_PENALTY: -0.30        // -30% if no buildings within 2 tiles
};

export interface BonusBreakdown {
    roadAccess: number;
    waterProximity: number;
    wellProximity: number;
    zoneSpecific: number;
    clustering: number;
    penalties: number;
    total: number;
}

/**
 * Calculate total efficiency bonus for a building placement
 */
export function calculatePlacementBonus(
    building: Building,
    definition: BuildingDefinition,
    buildingManager: BuildingManager,
    chunkManager: ChunkManager
): BonusBreakdown {
    const x = building.x;
    const y = building.y;

    let roadAccess = 0;
    let waterProximity = 0;
    let wellProximity = 0;
    let zoneSpecific = 0;
    let clustering = 0;
    let penalties = 0;

    // Check road access (adjacent tiles)
    const hasAdjacentRoad = checkForBuildingType(buildingManager, x, y, 1, 'ROAD');
    if (hasAdjacentRoad) {
        roadAccess += ZONE_BONUSES.ROAD_ACCESS_BONUS;
    } else {
        const hasNearbyRoad = checkForBuildingType(buildingManager, x, y, 3, 'ROAD');
        if (!hasNearbyRoad) {
            penalties += ZONE_BONUSES.NO_ROAD_PENALTY;
        }
    }

    // Check water proximity
    const nearWater = checkForTileType(chunkManager, x, y, 3, TileType.WATER);
    if (nearWater) {
        if (definition.type === 'RESIDENTIAL') {
            waterProximity += ZONE_BONUSES.RES_WATER_BONUS;
        } else if (definition.type === 'INDUSTRIAL') {
            waterProximity += ZONE_BONUSES.IND_WATER_BONUS;
        }
    }

    // Check well proximity
    const nearWell = checkForBuildingType(buildingManager, x, y, 3, 'WELL');
    if (nearWell) {
        wellProximity += ZONE_BONUSES.WELL_BONUS;
    }

    // Zone-specific bonuses
    if (definition.type === 'RESIDENTIAL') {
        // Tree bonus
        const nearForest = checkForTileType(chunkManager, x, y, 2, TileType.FOREST);
        if (nearForest) {
            zoneSpecific += ZONE_BONUSES.RES_TREE_BONUS;
        }

        // Clustering bonus (adjacent residential)
        const adjacentRes = countBuildingsOfType(buildingManager, x, y, 1, 'RESIDENTIAL');
        clustering += adjacentRes * ZONE_BONUSES.RES_CLUSTER_BONUS;

        // Industrial penalty
        const nearIndustrial = checkForBuildingType(buildingManager, x, y, 2, 'INDUSTRIAL');
        if (nearIndustrial) {
            penalties += ZONE_BONUSES.RES_INDUSTRIAL_PENALTY;
        }
    }

    if (definition.type === 'COMMERCIAL') {
        // Residential nearby bonus
        const nearResidential = checkForBuildingType(buildingManager, x, y, 8, 'RESIDENTIAL');
        if (nearResidential) {
            zoneSpecific += ZONE_BONUSES.COM_RES_NEARBY_BONUS;
        }

        // Road junction bonus (3+ roads adjacent)
        const adjacentRoads = countBuildingsOfType(buildingManager, x, y, 1, 'ROAD');
        if (adjacentRoads >= 3) {
            zoneSpecific += ZONE_BONUSES.COM_ROAD_JUNCTION_BONUS;
        }
    }

    if (definition.type === 'INDUSTRIAL') {
        // Stone deposit bonus
        const nearStone = checkForTileType(chunkManager, x, y, 3, TileType.STONE);
        if (nearStone) {
            zoneSpecific += ZONE_BONUSES.IND_STONE_BONUS;
        }

        // Forest bonus
        const nearForest = checkForTileType(chunkManager, x, y, 2, TileType.FOREST);
        if (nearForest) {
            zoneSpecific += ZONE_BONUSES.IND_FOREST_BONUS;
        }
    }

    // Isolation penalty (no buildings within 2 tiles)
    const nearbyBuildings = buildingManager.getBuildingsNear(x, y, 2);
    // Exclude self
    const otherBuildings = nearbyBuildings.filter(b => b.id !== building.id);
    if (otherBuildings.length === 0) {
        penalties += ZONE_BONUSES.ISOLATION_PENALTY;
    }

    const total = 1.0 + roadAccess + waterProximity + wellProximity + zoneSpecific + clustering + penalties;

    return {
        roadAccess,
        waterProximity,
        wellProximity,
        zoneSpecific,
        clustering,
        penalties,
        total: Math.max(0.1, total) // Minimum 10% efficiency
    };
}

// Helper: Check if building type exists within radius
function checkForBuildingType(
    buildingManager: BuildingManager,
    x: number,
    y: number,
    radius: number,
    type: string
): boolean {
    const buildings = buildingManager.getBuildingsNear(x, y, radius);
    return buildings.some(b => {
        const def = buildingManager.getBuildingDefinition(b);
        return def && def.type === type;
    });
}

// Helper: Count buildings of type within radius
function countBuildingsOfType(
    buildingManager: BuildingManager,
    x: number,
    y: number,
    radius: number,
    type: string
): number {
    const buildings = buildingManager.getBuildingsNear(x, y, radius);
    return buildings.filter(b => {
        const def = buildingManager.getBuildingDefinition(b);
        return def && def.type === type;
    }).length;
}

// Helper: Check if tile type exists within radius
function checkForTileType(
    chunkManager: ChunkManager,
    x: number,
    y: number,
    radius: number,
    tileType: number
): boolean {
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            if (dx === 0 && dy === 0) continue;
            const tile = chunkManager.getTile(x + dx, y + dy);
            if (tile && tile.type === tileType) {
                return true;
            }
        }
    }
    return false;
}
