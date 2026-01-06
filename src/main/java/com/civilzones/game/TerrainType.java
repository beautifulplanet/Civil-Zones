package com.civilzones.game;

/**
 * Terrain types for map tiles
 */
public enum TerrainType {
    DEEP,       // Deep ocean (impassable)
    WATER,      // Shallow water (drinkable, impassable)
    RIVER,      // River (drinkable, impassable)
    SAND,       // Beach/desert
    GRASS,      // Plains/grassland
    FOREST,     // Forest (provides wood)
    EARTH,      // Dirt/earth
    ROCK,       // Rocky terrain
    SNOW,       // Snow/mountain tops
    STONE       // Stone deposits
}
