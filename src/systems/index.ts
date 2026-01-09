/**
 * Civil Zones - Systems Module Index
 * Central exports for all game systems
 */

// Population assignment
export {
    assignPopulationToResidential,
    assignPopulationToZones,
    calculateWorkforce,
    calculateBuildingVariant,
    calculateActivityVariant,
    type WorkforceState as PopulationWorkforceState
} from './population.js';

// RCI Demand calculation
export {
    calculateRCIDemand,
    getDemandBarHeight,
    getDemandDescription,
    DEMAND_COLORS,
    type RCIDemand,
    type ZoneCounts,
    type DemandPopulationData
} from './demand.js';

// Geological water cycle
export {
    createGeologyState,
    shouldUpdateGeology,
    advanceGeologicalPeriod,
    calculateSeaLevelChange,
    isFloodRisk,
    shouldFlood,
    shouldDrain,
    getTileElevationInfo,
    getElevationCostMultiplier,
    getPeriodTransitionMessage,
    getFloodWarningMessage,
    getElevationColor,
    DEFAULT_GEOLOGICAL_PERIODS,
    DEFAULT_ELEVATION_CONFIG,
    type ElevationConfig,
    type TileElevationInfo,
    type FloodEvent
} from './geology.js';

// Workforce management
export {
    createWorkforceState,
    calculateWorkforce as calculateWorkforceAllocation,
    calculateWorkforceEfficiency,
    calculateGathererProduction,
    getWorkforceStatusText,
    getEfficiencyColor,
    formatWorkforceBreakdown,
    DEFAULT_WORKFORCE_CONFIG,
    type WorkforceState,
    type WorkforceConfig,
    type InfrastructureCounts
} from './workforce.js';

// Population needs
export {
    createNeedsState,
    calculateHousingNeed,
    calculateWaterNeed,
    calculateFoodNeed,
    calculateJobNeed,
    calculatePathNeed,
    calculateOverallSatisfaction,
    calculateAllNeeds,
    calculatePopulationChange,
    getSatisfactionLevel,
    getSatisfactionColor,
    getCriticalNeed,
    formatNeedPercentage,
    getNeedEmoji,
    DEFAULT_RESOURCE_RATES,
    type Need,
    type NeedsState,
    type ResourceRates
} from './needs.js';
