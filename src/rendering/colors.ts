/**
 * Civil Zones - Rendering Colors & Constants
 * Victorian parchment map theme colors and visual configuration
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TERRAIN COLORS - Aged parchment & ink tones
// ═══════════════════════════════════════════════════════════════════════════════

export const TERRAIN_COLORS = {
    DEEP: '#4A6B8A',
    WATER: '#6B8FAD',
    RIVER: '#7FA0B8',
    SAND: '#D4C4A8',
    GRASS: '#C9D4A0',
    FOREST: '#8B9A6B',
    EARTH: '#C4A882',
    ROCK: '#9A9A8A',
    SNOW: '#E8E8E0',
    STONE: '#8A8A7A'
} as const;

export type TerrainColorKey = keyof typeof TERRAIN_COLORS;

// ═══════════════════════════════════════════════════════════════════════════════
// BUILDING COLORS - Ink & wash tones
// ═══════════════════════════════════════════════════════════════════════════════

export const BUILDING_COLORS = {
    ROAD: '#A89070',
    RES: '#C4946A',
    COM: '#B8A060',
    IND: '#8A7A6A',
    WELL: '#6A8A9A',
    BASKET: '#B89A70',
    POTTERY: '#A8906A',
    GRANARY: '#9A8A70',
    PALACE: '#D4B480',
    CHIEF: '#C4A070',
    CLAN_CHIEF: '#D4B060',
    DOCK: '#5A7A8A'
} as const;

export type BuildingColorKey = keyof typeof BUILDING_COLORS;

// ═══════════════════════════════════════════════════════════════════════════════
// MAP OVERLAY COLORS
// ═══════════════════════════════════════════════════════════════════════════════

export const MAP_COLORS = {
    PARCHMENT: '#E8DCC8',
    INK: '#3A3020',
    SEPIA: '#704020',
    FOG_OF_WAR: '#C8B8A0'
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// UI COLORS
// ═══════════════════════════════════════════════════════════════════════════════

export const UI_COLORS = {
    OK: 'rgba(180,160,120,0.5)',
    NO: 'rgba(160,80,60,0.85)',
    PANEL_BG: 'rgba(40,35,30,0.95)',
    PANEL_BORDER: 'rgba(180,160,120,0.5)',
    TEXT_PRIMARY: '#E8DCC8',
    TEXT_SECONDARY: '#A09080',
    TEXT_HIGHLIGHT: '#FFD700',
    TEXT_DANGER: '#FF6666',
    TEXT_SUCCESS: '#66FF66',
    BUTTON_BG: 'rgba(80,70,60,0.8)',
    BUTTON_HOVER: 'rgba(100,90,80,0.9)',
    BUTTON_ACTIVE: 'rgba(120,100,80,1.0)'
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// ZONE COLORS (for R/C/I zones)
// ═══════════════════════════════════════════════════════════════════════════════

export const ZONE_COLORS = {
    R: { fill: 'rgba(100,180,100,0.3)', stroke: '#4A8A4A' },  // Green - Residential
    C: { fill: 'rgba(100,100,200,0.3)', stroke: '#4A4A9A' },  // Blue - Commercial
    I: { fill: 'rgba(180,140,60,0.3)', stroke: '#9A8A3A' }    // Yellow - Industrial
} as const;

export type ZoneColorKey = keyof typeof ZONE_COLORS;

// ═══════════════════════════════════════════════════════════════════════════════
// DESIRABILITY HEATMAP COLORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get heatmap color for desirability value
 * Red (0) -> Yellow (0.5) -> Green (1.0) -> Blue (1.5+)
 */
export function getDesirabilityColor(desirability: number, alpha: number = 0.5): string {
    let r: number, g: number, b: number;
    
    if (desirability < 0.3) {
        r = 255;
        g = Math.floor(desirability * 850);
        b = 0;
    } else if (desirability < 0.7) {
        r = Math.floor(255 - (desirability - 0.3) * 600);
        g = 255;
        b = 0;
    } else if (desirability < 1.2) {
        r = 0;
        g = 255;
        b = Math.floor((desirability - 0.7) * 510);
    } else {
        r = 0;
        g = Math.floor(255 - (desirability - 1.2) * 200);
        b = 255;
    }
    
    return `rgba(${r},${g},${b},${alpha})`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ELEVATION OVERLAY COLORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get elevation overlay color based on height relative to sea level
 */
export function getElevationOverlayColor(
    tileType: string,
    elevation: number,
    seaLevel: number
): string {
    const diff = elevation - seaLevel;
    
    if (tileType === 'WATER' || tileType === 'DEEP' || tileType === 'RIVER') {
        return 'rgba(0, 50, 150, 0.4)'; // Already water
    }
    
    if (diff < 0) {
        return 'rgba(255, 0, 0, 0.5)';      // BELOW SEA - RED
    } else if (diff < 0.5) {
        return 'rgba(255, 100, 0, 0.45)';   // HIGH RISK - ORANGE
    } else if (diff < 1.0) {
        return 'rgba(255, 200, 0, 0.4)';    // WARNING - YELLOW
    } else if (diff < 2.0) {
        return 'rgba(0, 180, 0, 0.3)';      // SAFE - GREEN
    } else {
        return 'rgba(0, 100, 255, 0.25)';   // HIGH GROUND - BLUE
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILDING LEVEL COLORS
// ═══════════════════════════════════════════════════════════════════════════════

/** Generate colors for a building level (1-6) */
export function generateLevelColors(level: number): {
    wall: string;
    wallDark: string;
    roof: string;
    roofDark: string;
    wood: string;
    woodDark: string;
} {
    // Hue shifts from earthy (level 1) to more refined (level 6)
    const hueBase = 30 + level * 5; // 35-60 range
    const saturation = 40 + level * 8; // 48-88%
    const lightness = 45 + level * 5; // 50-75%
    
    return {
        wall: `hsl(${hueBase}, ${saturation}%, ${lightness}%)`,
        wallDark: `hsl(${hueBase}, ${saturation}%, ${lightness - 15}%)`,
        roof: `hsl(${hueBase - 10}, ${saturation - 10}%, ${lightness - 10}%)`,
        roofDark: `hsl(${hueBase - 10}, ${saturation - 10}%, ${lightness - 25}%)`,
        wood: `hsl(${hueBase + 5}, ${saturation - 20}%, ${lightness - 5}%)`,
        woodDark: `hsl(${hueBase + 5}, ${saturation - 20}%, ${lightness - 20}%)`
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARTICLE COLORS
// ═══════════════════════════════════════════════════════════════════════════════

export const PARTICLE_COLORS = {
    WOOD_CHIP: ['#B8956A', '#A08050', '#C8A878', '#9A7548'],
    DUST: ['#C8B8A0', '#B8A890', '#D8C8B0', '#A89880'],
    WATER_SPLASH: ['#6B9FCF', '#5A8FC0', '#7CAFDF', '#4A7FB0'],
    FIRE: ['#FF6600', '#FF9900', '#FFCC00', '#FF3300'],
    SMOKE: ['#666666', '#555555', '#777777', '#444444'],
    SPARKLE: ['#FFFFFF', '#FFFFCC', '#FFFF99', '#FFFFFF']
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// CHARACTER COLORS
// ═══════════════════════════════════════════════════════════════════════════════

export const CHARACTER_COLORS = {
    // Logical Larry (player)
    SKIN: '#DDA675',
    SKIN_DARK: '#B8865C',
    SKIN_LIGHT: '#C9966C',
    HAIR: '#5D3A1A',
    FUR_TUNIC: '#A0522D',
    FUR_DARK: '#6B3A1E',
    FUR_TEXTURE: '#8B4513',
    BELT_BONE: '#F5F5DC',
    BELT_DARK: '#B8A080',
    FUR_BOOTS: '#8B6914',
    BOOTS_DARK: '#5D4510',
    CLUB_WOOD: '#8B7355',
    CLUB_WOOD_DARK: '#5D4E3A',
    CLUB_STONE: '#808080',
    CLUB_STONE_DARK: '#555555',
    
    // Nomads
    NOMAD_BODY: '#8B5A2B',
    NOMAD_SPEAR: '#8B7355',
    NOMAD_SPEARTIP: '#555555',
    
    // Animals
    WOLF: '#666666',
    WOLF_LIGHT: '#888888',
    DEER: '#8B6914',
    DEER_LIGHT: '#A08030'
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// BERRY COLORS
// ═══════════════════════════════════════════════════════════════════════════════

export const BERRY_COLORS = {
    BUSH: '#60C060',
    BUSH_HIGHLIGHT: '#90E890',
    SAFE: {
        light: '#FF90B0',
        mid: '#FF6090',
        dark: '#E04070'
    },
    POISON: {
        light: '#E0B0FF',
        mid: '#C878F0',
        dark: '#A050D0'
    }
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// ALL COLORS COMBINED (for CFG.COLORS compatibility)
// ═══════════════════════════════════════════════════════════════════════════════

export const ALL_COLORS = {
    ...TERRAIN_COLORS,
    ...BUILDING_COLORS,
    ...MAP_COLORS,
    ...UI_COLORS
} as const;
