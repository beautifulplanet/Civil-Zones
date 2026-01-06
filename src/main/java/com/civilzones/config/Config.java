package com.civilzones.config;

import java.util.Map;
import java.util.HashMap;

/**
 * Game Configuration - All constants and settings
 * Converted from JavaScript CFG object
 */
public class Config {
    
    // ═══════════════════════════════════════════════════════════════════
    // I. GLOBAL RULES (The Physics Engine)
    // ═══════════════════════════════════════════════════════════════════
    
    // Map & Rendering
    public static final int TILE_SIZE = 48;        // Tile size in pixels
    public static final int MAP_WIDTH = 250;       // Map width in tiles
    public static final int MAP_HEIGHT = 250;      // Map height in tiles
    
    // Canvas dimensions
    public static final int CANVAS_WIDTH = 1014;
    public static final int CANVAS_HEIGHT = 749;
    
    // Camera
    public static final double CAMERA_START_X = 3200;
    public static final double CAMERA_START_Y = 3200;
    public static final double CAMERA_START_ZOOM = 1.0;
    public static final double ZOOM_MIN = 0.1;
    public static final double ZOOM_MAX = 3.0;
    public static final double ZOOM_STEP = 1.1;
    
    // ═══════════════════════════════════════════════════════════════════
    // II. INVENTORY SYSTEM
    // ═══════════════════════════════════════════════════════════════════
    
    public static final int BACKPACK_BASE = 150;
    public static final int BACKPACK_PER_POP = 100;
    public static final int SACK_CAPACITY = 1000;
    
    // ═══════════════════════════════════════════════════════════════════
    // III. VISUAL STATES
    // ═══════════════════════════════════════════════════════════════════
    
    public static final int ABANDONED_YEARS = 10;
    public static final double LIGHT_MAX = 0.30;
    public static final double MEDIUM_MAX = 0.80;
    public static final double EXTREME_MIN = 0.81;
    
    // ═══════════════════════════════════════════════════════════════════
    // IV. PLAYER / WANDERER
    // ═══════════════════════════════════════════════════════════════════
    
    public static final int PLAYER_START_HEALTH = 3;
    public static final int PLAYER_VISION_RADIUS = 3;
    
    // Movement food cost
    public static final int STEPS_PER_FOOD = 15;
    public static final int FOOD_PER_PERSON = 1;
    
    // Forest resources
    public static final int WOOD_PER_STEP = 1;
    
    // Open ground rare finds
    public static final double RARE_FIND_CHANCE = 0.01;
    public static final double METAL_CHANCE = 0.5;
    public static final int FIND_AMOUNT = 1;
    
    // ═══════════════════════════════════════════════════════════════════
    // V. ENTITIES
    // ═══════════════════════════════════════════════════════════════════
    
    // Berries
    public static final int BERRY_SPAWN_COUNT = 400;
    public static final int BERRY_FOOD_VALUE = 10;
    public static final double POISON_CHANCE = 0.10;
    public static final int POISON_DAMAGE = 1;
    
    // Animals
    public static final int ANIMAL_SPAWN_COUNT = 1064;
    public static final int PACK_DAMAGE = 1;
    
    // Nomads
    public static final int NOMAD_SPAWN_COUNT = 1500;
    public static final double HOSTILE_CHANCE = 0.33;
    public static final int FRIENDLY_POP_BONUS = 1;
    public static final int HOSTILE_DAMAGE_MIN = 1;
    public static final int HOSTILE_DAMAGE_MAX = 3;
    
    // ═══════════════════════════════════════════════════════════════════
    // VI. SETTLEMENT REQUIREMENTS
    // ═══════════════════════════════════════════════════════════════════
    
    public static final int SETTLEMENT_MIN_POP = 2;
    public static final int SETTLEMENT_MIN_FOOD = 100;
    public static final int SETTLEMENT_MIN_WOOD = 25;
    public static final int SETTLEMENT_WATER_DISTANCE = 5;
    
    // Aliases for UI consistency
    public static final int SETTLE_MIN_POP = SETTLEMENT_MIN_POP;
    public static final int SETTLE_MIN_FOOD = SETTLEMENT_MIN_FOOD;
    public static final int SETTLE_MIN_WOOD = SETTLEMENT_MIN_WOOD;
    
    // Thirst system
    public static final int MAX_THIRST = 100;
    public static final int THIRST_PER_MOVE = 2;
    public static final int WATER_RECOVERY = 50;
    
    // Resource gathering
    public static final int WOOD_PER_TREE = 10;
    public static final int STONE_PER_MINE = 5;
    
    // ═══════════════════════════════════════════════════════════════════
    // VII. BUILDING COSTS
    // ═══════════════════════════════════════════════════════════════════
    
    public static final int COST_RES = 100;
    public static final int COST_COM = 250;
    public static final int COST_IND = 500;
    public static final int COST_WELL = 50;
    public static final int COST_ROAD = 5;
    public static final int COST_BULL = 1;
    
    // Building cost aliases for UI
    public static final int BUILDING_COST_WOOD_RES = 10;
    public static final int BUILDING_COST_WOOD_COM = 15;
    public static final int BUILDING_COST_STONE_COM = 5;
    public static final int BUILDING_COST_WOOD_IND = 20;
    public static final int WELL_COST_STONE = 10;
    public static final int ROAD_COST_STONE = 2;
    
    // Residential Level 1 (Mud Pit)
    public static final int RES_1_FOOD_COST = 100;
    public static final int RES_1_WOOD_COST = 100;
    public static final int RES_1_CAPACITY = 20;
    
    // Well
    public static final int WELL_FOOD_COST = 50;
    public static final int WELL_WOOD_COST = 200;
    public static final int WELL_STONE_COST = 5;
    public static final int WELL_CAPACITY = 500;
    
    // Industrial (Hunting Ground)
    public static final int IND_FOOD_COST = 500;
    public static final int IND_WOOD_COST = 100;
    
    // ═══════════════════════════════════════════════════════════════════
    // VIII. PRODUCTION
    // ═══════════════════════════════════════════════════════════════════
    
    public static final int PERSON_HUNTS = 2;
    public static final int PERSON_EATS = 1;
    public static final int FOOD_TO_GROW = 10;
    public static final int FOOD_FOR_HUT = 50;
    public static final int INDUSTRIAL_FOOD_PER_TURN = 100;
    public static final int INDUSTRIAL_SUPPORTS_POPULATION = 200;
    public static final double STARVATION_RATE = 0.20;
    public static final double THIRST_DEATH_RATE = 0.10;
    public static final int BASE_GROWTH_RATE = 3;
    
    // ═══════════════════════════════════════════════════════════════════
    // IX. WORKFORCE SYSTEM
    // ═══════════════════════════════════════════════════════════════════
    
    public static final int WELL_WORKERS = 2;
    public static final int ROAD_WORKERS = 0;
    public static final int COMMERCIAL_WORKERS = 3;
    public static final int HUNTING_WORKERS_MIN = 20;
    public static final int HUNTING_WORKERS_MAX = 100;
    public static final double GATHERER_FOOD_RATE = 1.5;
    public static final double GATHERER_WOOD_RATE = 3.0;
    
    // ═══════════════════════════════════════════════════════════════════
    // X. WATER SYSTEM
    // ═══════════════════════════════════════════════════════════════════
    
    public static final int WATER_WELL_CAPACITY = 100;
    public static final int WATER_PER_500_PEOPLE = 500;
    
    // ═══════════════════════════════════════════════════════════════════
    // XI. DESIRABILITY
    // ═══════════════════════════════════════════════════════════════════
    
    public static final double DESIRABILITY_NEIGHBOR_BONUS = 0.10;
    public static final double DESIRABILITY_TREE_BONUS = 0.25;
    public static final double DESIRABILITY_WATER_BONUS = 0.50;
    public static final int DESIRABILITY_WATER_RANGE = 5;
    public static final double DESIRABILITY_ISOLATION_PENALTY = 0.50;
    public static final int DESIRABILITY_ISOLATION_RANGE = 2;
    public static final double DESIRABILITY_PATH_BONUS = 0.10;
    public static final double DESIRABILITY_WELL_BONUS = 0.15;
    public static final double DESIRABILITY_INDUSTRIAL_BONUS = 0.15;
    
    // ═══════════════════════════════════════════════════════════════════
    // XII. CRISES
    // ═══════════════════════════════════════════════════════════════════
    
    public static final double CRISIS_STARVATION_DEATH = 0.20;
    public static final double CRISIS_THIRST_DEATH = 0.10;
    public static final double CRISIS_ROT_SPOILAGE = 0.30;
    public static final double CRISIS_OVERPOP_THEFT = 0.05;
    public static final double CRISIS_OVERPOP_PLAGUE = 0.30;
    
    // ═══════════════════════════════════════════════════════════════════
    // XIII. SPECIAL BUILDINGS
    // ═══════════════════════════════════════════════════════════════════
    
    public static final int BASKET_COST = 500;
    public static final int BASKET_REQ_POP = 20;
    public static final int BASKET_CAPACITY = 2000;
    
    public static final int POTTERY_COST = 5000;
    public static final int POTTERY_REQ_POP = 150;
    public static final int POTTERY_CAPACITY = 10000;
    
    public static final int GRANARY_COST = 50000;
    public static final int GRANARY_REQ_POP = 1000;
    public static final int GRANARY_CAPACITY = 100000;
    
    public static final int PALACE_COST = 250000;
    public static final int PALACE_REQ_POP = 5000;
    public static final int PALACE_CAPACITY = 1000000;
    
    public static final double CHIEF_BONUS = 0.15;
}
