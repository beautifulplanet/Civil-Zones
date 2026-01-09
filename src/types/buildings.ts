/**
 * Civil Zones - Building Type Definitions
 * Comprehensive interfaces for all building-related structures
 */

import type { ResourceCost, ResourceUpkeep } from './resources.js';

// ═══════════════════════════════════════════════════════════════════════════════
// BUILDING CATEGORIES & IDENTIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

/** Building category types */
export type BuildingCategory = 
    | 'RESIDENTIAL' 
    | 'COMMERCIAL' 
    | 'INDUSTRIAL' 
    | 'SPECIAL'
    | 'MILESTONE';

/** Building type short codes */
export type BuildingTypeCode = 'RES' | 'COM' | 'IND' | 'SPEC' | 'MILE';

/** Valid building ID strings */
export type BuildingId = 
    // Residential
    | 'RES_1' | 'RES_2' | 'RES_3' | 'RES_4' | 'RES_5' | 'RES_6'
    // Commercial
    | 'COM_1' | 'COM_2' | 'COM_3' | 'COM_4' | 'COM_5' | 'COM_6'
    // Industrial
    | 'IND_1' | 'IND_2' | 'IND_3' | 'IND_4' | 'IND_5' | 'IND_6'
    // Infrastructure
    | 'WELL'
    // Milestone Buildings  
    | 'CLAN_CHIEF' | 'DOCK'
    // Legacy/Special Buildings
    | 'CHIEF' | 'FIRST_DOCK' | 'SIGNAL_FIRE' | 'SACRED_GROVE' | 'NUTS_STORAGE_REED_HOUSE'
    | 'BONFIRE' | 'STONE_CIRCLE' | 'GREAT_FIRE' | 'ANCESTOR_SHRINE' | 'TRIBAL_MONUMENT';

// ═══════════════════════════════════════════════════════════════════════════════
// BUILDING BENEFITS
// ═══════════════════════════════════════════════════════════════════════════════

/** Types of benefits a building can provide */
export type BenefitType = 
    | 'HOUSING'
    | 'JOBS'
    | 'INCOME'
    | 'GATHER_BONUS'
    | 'DESIRABILITY'
    | 'CULTURE'
    | 'WATER_ACCESS'
    | 'STORAGE'
    | 'DOCK';

/** Base benefit interface */
export interface BaseBenefit {
    type: BenefitType;
    value: number;
}

/** Gather bonus benefit (resource-specific) */
export interface GatherBonusBenefit extends BaseBenefit {
    type: 'GATHER_BONUS';
    resource: 'food' | 'wood' | 'stone' | 'metal';
}

/** Desirability benefit (has radius) */
export interface DesirabilityBenefit extends BaseBenefit {
    type: 'DESIRABILITY';
    radius: number;
}

/** Union of all possible benefit types */
export type BuildingBenefit = 
    | BaseBenefit 
    | GatherBonusBenefit 
    | DesirabilityBenefit;

// ═══════════════════════════════════════════════════════════════════════════════
// BUILDING STATES & VARIANTS
// ═══════════════════════════════════════════════════════════════════════════════

/** Income class levels */
export type IncomeClass = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

/** State threshold for residential buildings (population-based) */
export interface ResidentialStateThreshold {
    min: number;
    max: number;
    name: string;
    icon: string;
    incomeClass: IncomeClass;
    incomeMult?: number;
    lifespanBonus: number;
}

/** State threshold for commercial/industrial (activity-based with ratios) */
export interface ActivityStateThreshold {
    min: number;
    max: number;
    name: string;
    icon: string;
    incomeMult?: number;
    productionMult?: number;
}

/** Union of threshold types */
export type StateThreshold = ResidentialStateThreshold | ActivityStateThreshold;

/** Building variant definition */
export interface BuildingVariant {
    name: string;
    icon: string;
    bonusMult: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNLOCK REQUIREMENTS
// ═══════════════════════════════════════════════════════════════════════════════

/** Building requirement by type/level/count */
export interface BuildingTypeRequirement {
    type: BuildingTypeCode;
    level?: number;
    count: number;
}

/** Building requirement by category */
export interface BuildingCategoryRequirement {
    category: BuildingCategory;
    count: number;
}

/** Building requirement by specific ID */
export interface BuildingIdRequirement {
    id: BuildingId;
    count: number;
}

/** Union of building requirement types */
export type BuildingRequirement = 
    | BuildingTypeRequirement 
    | BuildingCategoryRequirement 
    | BuildingIdRequirement;

/** Complete unlock requirements for a building */
export interface UnlockRequirements {
    /** Minimum population required */
    pop?: number;
    /** Resources that must be in stock */
    resources?: Partial<Record<'food' | 'wood' | 'stone' | 'metal', number>>;
    /** Building requirements (single or array) */
    buildings?: BuildingRequirement | BuildingRequirement[];
    /** Year that must be reached */
    year?: number;
    /** Civilization level required */
    level?: number;
    /** Technologies that must be researched (future) */
    tech?: string[];
    /** Achievements that must be earned (future) */
    achievements?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILDING SIZE
// ═══════════════════════════════════════════════════════════════════════════════

/** Building footprint in tiles */
export interface BuildingSize {
    w: number;
    h: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILDING DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/** Base building definition (shared properties) */
export interface BaseBuildingDefinition {
    id: BuildingId;
    category: BuildingCategory;
    level: number;
    name: string;
    cost: ResourceCost;
    size: BuildingSize;
    capacity: number;
    upkeep: ResourceUpkeep;
    benefits: BuildingBenefit[];
    stateThresholds: StateThreshold[];
    variants: BuildingVariant[];
    unlockReq?: UnlockRequirements;
    popUnlock?: number;
    unique?: boolean;
}

/** Residential building definition */
export interface ResidentialBuildingDefinition extends BaseBuildingDefinition {
    category: 'RESIDENTIAL';
    overflowCapacity: number;
    baseIncome: number;
    baseLifespan: number;
    stateThresholds: ResidentialStateThreshold[];
}

/** Commercial building definition */
export interface CommercialBuildingDefinition extends BaseBuildingDefinition {
    category: 'COMMERCIAL';
    baseIncome: number;
    stateThresholds: ActivityStateThreshold[];
}

/** Industrial building definition */
export interface IndustrialBuildingDefinition extends BaseBuildingDefinition {
    category: 'INDUSTRIAL';
    baseProduction: number;
    stateThresholds: ActivityStateThreshold[];
}

/** Special building definition */
export interface SpecialBuildingDefinition extends BaseBuildingDefinition {
    category: 'SPECIAL';
    unique?: boolean;
    baseProduction?: number;
    storageBonus?: Partial<Record<'food' | 'wood' | 'stone' | 'metal', number>>;
}

/** Milestone building definition */
export interface MilestoneBuildingDefinition extends BaseBuildingDefinition {
    category: 'MILESTONE';
    unique: true;
    milestoneBonus?: {
        type: string;
        value: number;
    };
}

/** Union of all building definition types */
export type BuildingDefinition = 
    | ResidentialBuildingDefinition
    | CommercialBuildingDefinition
    | IndustrialBuildingDefinition
    | SpecialBuildingDefinition
    | MilestoneBuildingDefinition;

// ═══════════════════════════════════════════════════════════════════════════════
// BUILDING DATABASE TYPE
// ═══════════════════════════════════════════════════════════════════════════════

/** The complete building database type */
export type BuildingDatabase = {
    [K in BuildingId]: BuildingDefinition;
};

// ═══════════════════════════════════════════════════════════════════════════════
// PLACED BUILDING INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

/** A building instance placed on the map */
export interface PlacedBuilding {
    /** Unique instance ID */
    uid: string;
    /** Building definition ID */
    id: BuildingId;
    /** Grid position X */
    x: number;
    /** Grid position Y */
    y: number;
    /** Current population (residential) or workers (commercial/industrial) */
    population: number;
    /** Current variant state (0-3) */
    variant: number;
    /** Year the building was constructed */
    builtYear: number;
    /** Years at zero population (for abandonment) */
    emptyYears: number;
    /** Current health/condition (0-100) */
    health: number;
    /** Is this building selected? */
    selected?: boolean;
    /** Custom data for special buildings */
    customData?: Record<string, unknown>;
}
