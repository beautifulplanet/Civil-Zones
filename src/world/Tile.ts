/**
 * Tile Definition
 * The atomic unit of the world map.
 * 
 * Color palette inspired by Sega Genesis / 16-bit era games
 * with vibrant, saturated colors and dithering support
 */

export const TileType = {
    GRASS: 0,
    WATER: 1,
    SAND: 2,
    STONE: 3,
    FOREST: 4,
    DIRT: 5  // Brown dirt patches
} as const;

export type TileType = typeof TileType[keyof typeof TileType];

export interface Tile {
    type: TileType;
    elevation: number; // Height layer (0-255)
    explored: boolean; // Fog of war status
    terrainVariant?: number; // 0-3 for color variation (grass shades, dirt patches)
    hasBerries?: boolean; // For food gathering
    hasTrees?: boolean; // For wood gathering
    hasOre?: boolean; // For mining
    oreType?: 'iron' | 'gold' | 'stone'; // Type of ore deposit
}

/**
 * Check if a tile type is walkable
 */
export function isWalkable(type: TileType): boolean {
    return type !== TileType.WATER;
}

/**
 * Sega Genesis-style color palettes
 * Each tile type has: base, highlight, shadow, and dither colors
 */
export interface TilePalette {
    base: string;
    highlight: string;
    shadow: string;
    dither: string;
    outline: string;
}

export const TILE_PALETTES: Record<TileType, TilePalette> = {
    // GRASS - Vibrant green like Sonic the Hedgehog
    [TileType.GRASS]: {
        base: '#40C040',      // Bright green
        highlight: '#60E060', // Light green
        shadow: '#208020',    // Dark green
        dither: '#30A030',    // Mid green
        outline: '#106010'    // Outline
    },
    // WATER - Deep blue like Ecco the Dolphin
    [TileType.WATER]: {
        base: '#2080E0',      // Ocean blue
        highlight: '#40A0FF', // Light wave
        shadow: '#1060A0',    // Deep water
        dither: '#3090E0',    // Mid blue
        outline: '#004080'    // Dark outline
    },
    // SAND - Golden like desert stages
    [TileType.SAND]: {
        base: '#E0C060',      // Sand yellow
        highlight: '#F0E090', // Bright sand
        shadow: '#C0A040',    // Dark sand
        dither: '#D0B050',    // Mid sand
        outline: '#806020'    // Brown outline
    },
    // STONE - Rocky mountain gray
    [TileType.STONE]: {
        base: '#808090',      // Stone gray
        highlight: '#A0A0B0', // Light rock
        shadow: '#606070',    // Dark rock
        dither: '#707080',    // Mid gray
        outline: '#404050'    // Dark outline
    },
    // FOREST - Deep forest green like Golden Axe
    [TileType.FOREST]: {
        base: '#208040',      // Forest green
        highlight: '#40A060', // Lighter green
        shadow: '#106030',    // Dark forest
        dither: '#188038',    // Mid forest
        outline: '#004020'    // Very dark
    },
    // DIRT - Brown earth patches
    [TileType.DIRT]: {
        base: '#8B6914',      // Brown dirt
        highlight: '#A08030', // Light dirt
        shadow: '#604810',    // Dark dirt
        dither: '#7A5A12',    // Mid dirt
        outline: '#4A3008'    // Dark outline
    }
};

// Grass variant palettes for terrain variety
export const GRASS_VARIANTS: TilePalette[] = [
    // Variant 0: Standard lush green
    { base: '#40C040', highlight: '#60E060', shadow: '#208020', dither: '#30A030', outline: '#106010' },
    // Variant 1: Light/yellow-green (sunny patches)
    { base: '#60D030', highlight: '#80F050', shadow: '#408010', dither: '#50C020', outline: '#306008' },
    // Variant 2: Dark/deep green (shaded areas)
    { base: '#309030', highlight: '#40B040', shadow: '#186818', dither: '#288028', outline: '#084008' },
    // Variant 3: Olive/dried grass
    { base: '#708038', highlight: '#90A048', shadow: '#505820', dither: '#607030', outline: '#404010' },
];

/**
 * Get the full palette for a tile type
 */
export function getTilePalette(type: TileType): TilePalette {
    return TILE_PALETTES[type] || TILE_PALETTES[TileType.GRASS];
}

/**
 * Legacy helper - get base color for tile type
 */
export function getTileColor(type: TileType): string {
    return getTilePalette(type).base;
}
