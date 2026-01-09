/**
 * Civil Zones - Type Definitions Index
 * Central export point for all type definitions
 */

// Resource Types
export type {
    ResourceType,
    ResourceCost,
    ResourceRecord,
    ResourceUpkeep
} from './resources.js';

// Building Types
export type {
    BuildingCategory,
    BuildingTypeCode,
    BuildingId,
    BenefitType,
    BaseBenefit,
    GatherBonusBenefit,
    DesirabilityBenefit,
    BuildingBenefit,
    IncomeClass,
    ResidentialStateThreshold,
    ActivityStateThreshold,
    StateThreshold,
    BuildingVariant,
    BuildingTypeRequirement,
    BuildingCategoryRequirement,
    BuildingIdRequirement,
    BuildingRequirement,
    UnlockRequirements,
    BuildingSize,
    BaseBuildingDefinition,
    ResidentialBuildingDefinition,
    CommercialBuildingDefinition,
    IndustrialBuildingDefinition,
    SpecialBuildingDefinition,
    MilestoneBuildingDefinition,
    BuildingDefinition,
    BuildingDatabase,
    PlacedBuilding
} from './buildings.js';

// Game State Types
export type {
    InventoryConfig,
    VisualStatesConfig,
    MapConfig,
    GameSpeed,
    TimeState,
    CivilizationLevel,
    GameStatistics,
    GameState,
    SaveData
} from './game-state.js';

// Tile & Terrain Types
export type {
    TerrainType,
    ZoneType,
    ResourceDeposit,
    StoneDeposit,
    EntityType,
    TileEntity,
    BerryEntity,
    NomadEntity,
    AnimalEntity,
    TileBuilding,
    Tile,
    GeologicalPeriod,
    GeologyState,
    HighGroundPatch,
    TerrainGenConfig
} from './tiles.js';
