package com.civilzones.config;

import javafx.scene.paint.Color;

/**
 * Color definitions for terrain and buildings
 * Converted from JavaScript CFG.COLORS
 */
public class Colors {
    
    // ═══════════════════════════════════════════════════════════════════
    // TERRAIN COLORS - Yoshi's Island soft pastels
    // ═══════════════════════════════════════════════════════════════════
    
    public static final Color DEEP = Color.web("#5890E8");
    public static final Color WATER = Color.web("#78C8FF");
    public static final Color RIVER = Color.web("#A0DCFF");
    public static final Color SAND = Color.web("#FFE8A0");
    public static final Color GRASS = Color.web("#78E878");
    public static final Color FOREST = Color.web("#40B040");
    public static final Color EARTH = Color.web("#E8A860");
    public static final Color ROCK = Color.web("#B8B8C8");
    public static final Color SNOW = Color.web("#F8F8FF");
    public static final Color STONE = Color.web("#A0A0B0");
    
    // ═══════════════════════════════════════════════════════════════════
    // BUILDING COLORS - Friendly bright tones
    // ═══════════════════════════════════════════════════════════════════
    
    public static final Color ROAD = Color.web("#D8A050");
    public static final Color RES = Color.web("#FF78A8");
    public static final Color COM = Color.web("#FFD878");
    public static final Color IND = Color.web("#B888E8");
    public static final Color WELL = Color.web("#68D8FF");
    public static final Color BASKET = Color.web("#F8A868");
    public static final Color POTTERY = Color.web("#E8B860");
    public static final Color GRANARY = Color.web("#D8B078");
    public static final Color PALACE = Color.web("#FFE078");
    public static final Color CHIEF = Color.web("#E8B068");
    
    // ═══════════════════════════════════════════════════════════════════
    // UI COLORS
    // ═══════════════════════════════════════════════════════════════════
    
    public static final Color OK = Color.rgb(255, 255, 255, 0.4);
    public static final Color NO = Color.rgb(248, 88, 88, 0.85);
    
    // ═══════════════════════════════════════════════════════════════════
    // THEME COLORS
    // ═══════════════════════════════════════════════════════════════════
    
    public static final Color BG_PRIMARY = Color.web("#0a0a0f");
    public static final Color BG_SECONDARY = Color.web("#12121a");
    public static final Color BG_TERTIARY = Color.web("#1a1a24");
    public static final Color BG_ELEVATED = Color.web("#22222e");
    public static final Color BG_HOVER = Color.web("#2a2a38");
    
    public static final Color ACCENT_PRIMARY = Color.web("#10b981");
    public static final Color ACCENT_SECONDARY = Color.web("#059669");
    
    public static final Color TEXT_PRIMARY = Color.web("#f8fafc");
    public static final Color TEXT_SECONDARY = Color.web("#94a3b8");
    public static final Color TEXT_MUTED = Color.web("#64748b");
    public static final Color TEXT_DIM = Color.web("#475569");
    
    // Zone indicator colors
    public static final Color C_RES = Color.web("#3b82f6");
    public static final Color C_COM = Color.web("#f59e0b");
    public static final Color C_IND = Color.web("#ef4444");
    public static final Color C_WAT = Color.web("#06b6d4");
    public static final Color C_ROAD = Color.web("#a78bfa");
    
    /**
     * Get terrain color by type name
     */
    public static Color getTerrainColor(String type) {
        return switch (type) {
            case "DEEP" -> DEEP;
            case "WATER" -> WATER;
            case "RIVER" -> RIVER;
            case "SAND" -> SAND;
            case "GRASS" -> GRASS;
            case "FOREST" -> FOREST;
            case "EARTH" -> EARTH;
            case "ROCK" -> ROCK;
            case "SNOW" -> SNOW;
            case "STONE" -> STONE;
            default -> GRASS;
        };
    }
    
    /**
     * Get building color by type
     */
    public static Color getBuildingColor(String type) {
        return switch (type) {
            case "ROAD", "PATH" -> ROAD;
            case "RES", "RESIDENTIAL" -> RES;
            case "COM", "COMMERCIAL" -> COM;
            case "IND", "INDUSTRIAL" -> IND;
            case "WELL" -> WELL;
            case "BASKET" -> BASKET;
            case "POTTERY" -> POTTERY;
            case "GRANARY" -> GRANARY;
            case "PALACE" -> PALACE;
            case "CHIEF" -> CHIEF;
            default -> Color.GRAY;
        };
    }
    
    /**
     * Convert Color to CSS hex string
     */
    public static String toHex(Color color) {
        return String.format("#%02X%02X%02X",
            (int)(color.getRed() * 255),
            (int)(color.getGreen() * 255),
            (int)(color.getBlue() * 255));
    }
    
    /**
     * Create color with alpha
     */
    public static Color withAlpha(Color color, double alpha) {
        return new Color(color.getRed(), color.getGreen(), color.getBlue(), alpha);
    }
    
    /**
     * Brighten a color
     */
    public static Color brighten(Color color, double factor) {
        return color.deriveColor(0, 1, 1 + factor, 1);
    }
    
    /**
     * Darken a color
     */
    public static Color darken(Color color, double factor) {
        return color.deriveColor(0, 1, 1 - factor, 1);
    }
}
