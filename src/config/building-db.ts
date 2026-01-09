/**
 * Civil Zones - Building Database
 * Central registry of all building definitions
 */

import type { BuildingDefinition, BuildingId } from '../types/index.js';
import { RESIDENTIAL_BUILDINGS } from './buildings/residential.js';
import { COMMERCIAL_BUILDINGS } from './buildings/commercial.js';
import { INDUSTRIAL_BUILDINGS } from './buildings/industrial.js';
import { SPECIAL_BUILDINGS, MILESTONE_BUILDINGS, INFRASTRUCTURE_BUILDINGS } from './buildings/special.js';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLETE BUILDING DATABASE
// ═══════════════════════════════════════════════════════════════════════════════

export const BUILDING_DB: Record<string, BuildingDefinition> = {
    ...RESIDENTIAL_BUILDINGS,
    ...COMMERCIAL_BUILDINGS,
    ...INDUSTRIAL_BUILDINGS,
    ...SPECIAL_BUILDINGS
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get a building definition by ID
 */
export function getBuilding(id: string): BuildingDefinition | null {
    return BUILDING_DB[id] || null;
}

/**
 * Get all buildings in a category
 */
export function getBuildingsByCategory(category: string): BuildingDefinition[] {
    return Object.values(BUILDING_DB).filter(b => b.category === category);
}

/**
 * Get buildings by type prefix (RES, COM, IND, etc.)
 */
export function getBuildingsByType(typePrefix: string): BuildingDefinition[] {
    return Object.entries(BUILDING_DB)
        .filter(([id]) => id.startsWith(typePrefix))
        .map(([, building]) => building);
}

/**
 * Get residential building by level number
 */
export function getResidentialByLevel(level: number): BuildingDefinition | null {
    return BUILDING_DB[`RES_${level}`] || null;
}

/**
 * Get commercial building by level number
 */
export function getCommercialByLevel(level: number): BuildingDefinition | null {
    return BUILDING_DB[`COM_${level}`] || null;
}

/**
 * Get industrial building by level number
 */
export function getIndustrialByLevel(level: number): BuildingDefinition | null {
    return BUILDING_DB[`IND_${level}`] || null;
}

/**
 * Extract gather bonus from building benefits
 */
export function extractGatherBonus(building: BuildingDefinition): Record<string, number> {
    const bonus: Record<string, number> = { wood: 0, food: 0, stone: 0, metal: 0 };
    
    if (!building.benefits) return bonus;
    
    for (const b of building.benefits) {
        if (b.type === 'GATHER_BONUS' && 'resource' in b) {
            bonus[b.resource] = b.value;
        }
    }
    
    return bonus;
}

/**
 * Check if a building is unlocked based on requirements
 */
export function isBuildingUnlocked(
    buildingId: string,
    population: number,
    resources: Record<string, number>,
    builtBuildings: Array<{ id: string; level?: number }>
): boolean {
    const building = BUILDING_DB[buildingId];
    if (!building) return false;
    
    const req = building.unlockReq;
    if (!req) return true;
    
    // Check population requirement
    if (req.pop !== undefined && population < req.pop) {
        return false;
    }
    
    // Check resource requirements
    if (req.resources) {
        for (const [resource, amount] of Object.entries(req.resources)) {
            if ((resources[resource] || 0) < amount) {
                return false;
            }
        }
    }
    
    // Check building requirements (simplified)
    if (req.buildings) {
        const buildingReqs = Array.isArray(req.buildings) ? req.buildings : [req.buildings];
        for (const buildingReq of buildingReqs) {
            if ('id' in buildingReq) {
                const count = builtBuildings.filter(b => b.id === buildingReq.id).length;
                if (count < buildingReq.count) return false;
            }
            // Add more building requirement checks as needed
        }
    }
    
    return true;
}

// Re-export building collections for direct access
export { 
    RESIDENTIAL_BUILDINGS,
    COMMERCIAL_BUILDINGS,
    INDUSTRIAL_BUILDINGS,
    SPECIAL_BUILDINGS,
    MILESTONE_BUILDINGS,
    INFRASTRUCTURE_BUILDINGS
};
