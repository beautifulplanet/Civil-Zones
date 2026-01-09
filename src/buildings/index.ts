/**
 * Civil Zones - Buildings Module
 * Building placement, validation, zones, and evolution
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════
export type {
    // Building types
    BuildingTool,
    ZoneType as BuildingZoneType,
    BuildingSize as BuildingBuildingSize,
    Building,
    ResidentialBuilding,
    ZoneTile,
    BuildingLevelConfig,
    VariantConfig,
    StateThreshold as BuildingStateThreshold,
    
    // Zone bonus types
    ZoneBonusFactors,
    ZoneBonusResult,
    ElevationCostInfo as BuildingElevationCostInfo,
    TileElevationInfo as BuildingTileElevationInfo
} from './types.js';

export {
    // Constants
    BUILDING_SIZES,
    SMALL_BUILDINGS,
    LARGE_BUILDINGS,
    DEFAULT_EFFICIENCY,
    DEFAULT_ZONE_BONUSES
} from './types.js';

// ═══════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════
export {
    // Size helpers
    getBuildingSize as validationGetBuildingSize,
    isSmallBuilding,
    
    // Placement validation
    isValidPlacement,
    isValidRoadPlacement,
    
    // Cost validation
    canAfford as buildingCanAfford,
    getMissingResource,
    deductCost as buildingDeductCost,
    
    // Elevation costs
    getElevationCostMultiplier as buildingGetElevationCostMultiplier,
    getElevationCostInfo,
    applyElevationCost,
    getTileElevationInfo as buildingGetTileElevationInfo,
    
    // Prerequisites
    checkMilestonePrereq,
    checkPopulationReq
} from './validation.js';

// ═══════════════════════════════════════════════════════════════════
// ZONE BONUSES
// ═══════════════════════════════════════════════════════════════════
export {
    // Tile counting helpers
    countNearbyTiles,
    hasNearbyTile,
    isBuildingNearby,
    isBuildingInRadius,
    
    // Zone bonus calculation
    calculateZoneBonus,
    getZoneBonusDescription,
    
    // Desirability
    calculateDesirability,
    
    // Clustering
    getClusterMultiplier,
    countResidentialNeighbors
} from './zones.js';

// ═══════════════════════════════════════════════════════════════════
// PLACEMENT
// ═══════════════════════════════════════════════════════════════════
export type { Point as BuildingPoint } from './placement.js';

export {
    // Line drawing
    getLineTiles,
    
    // Road placement
    placeRoadTile,
    placeRoadLine,
    
    // Zone placement
    placeResidential,
    placeCommercial,
    placeIndustrial,
    
    // Special buildings
    placeWell,
    placeLargeBuilding,
    
    // Demolition
    demolish,
    
    // Utilities
    getBuildingSize,
    checkBuildingOverlap
} from './placement.js';

// ═══════════════════════════════════════════════════════════════════
// EVOLUTION
// ═══════════════════════════════════════════════════════════════════
export {
    // Thresholds and icons
    VARIANT_THRESHOLDS,
    VARIANT_ICONS,
    
    // Variant helpers
    getVariantFromDesirability,
    getVariantName,
    
    // Desirability calculation
    calculateLevel1Desirability,
    calculateTileDesirability,
    
    // Population scaling
    calculateLevel1Population,
    
    // Evolution update
    updateBuildingEvolution,
    
    // Bonus multipliers
    getVariantBonusMultiplier,
    getVariantIncomeMultiplier,
    getVariantLifespanBonus
} from './evolution.js';
