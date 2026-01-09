/**
 * Civil Zones - Resource Type Definitions
 * Core resource types used throughout the game
 */

/** Primary resource types in the game */
export type ResourceType = 'food' | 'wood' | 'stone' | 'metal';

/** Resource amounts as a partial record (not all resources required) */
export type ResourceCost = Partial<Record<ResourceType, number>>;

/** Complete resource record (all resources required) */
export type ResourceRecord = Record<ResourceType, number>;

/** Resource upkeep per tick */
export interface ResourceUpkeep {
    food?: number;
    wood?: number;
    stone?: number;
    metal?: number;
}
