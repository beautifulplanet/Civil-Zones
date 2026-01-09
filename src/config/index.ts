/**
 * Civil Zones - Configuration Index
 * Central export point for all configuration modules
 */

// Constants
export {
    MAP_CONFIG,
    INVENTORY,
    VISUAL_STATES,
    BULLDOZE_REFUND,
    ZONE_COST,
    CHIEF_COST,
    CHIEF_RADIUS,
    CHIEF_BONUS,
    GROWTH_THRESHOLD,
    DECAY_THRESHOLD,
    EFFICIENCY,
    DESIRABILITY,
    ZONE_BONUSES,
    GOLD_EXCHANGE_RATE,
    ERAS,
    BUILDING_CATEGORIES
} from './constants.js';

// Building Database
export {
    BUILDING_DB,
    getBuilding,
    getBuildingsByCategory,
    getBuildingsByType,
    getResidentialByLevel,
    getCommercialByLevel,
    getIndustrialByLevel,
    extractGatherBonus,
    isBuildingUnlocked,
    RESIDENTIAL_BUILDINGS,
    COMMERCIAL_BUILDINGS,
    INDUSTRIAL_BUILDINGS,
    SPECIAL_BUILDINGS,
    MILESTONE_BUILDINGS,
    INFRASTRUCTURE_BUILDINGS
} from './building-db.js';
