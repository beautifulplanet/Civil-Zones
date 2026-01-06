package com.civilzones.game;

import com.civilzones.entity.*;

/**
 * Represents a single tile on the game map
 */
public class Tile {
    
    // Position
    private int x;
    private int y;
    
    // Terrain
    private TerrainType type;
    private double height;
    private boolean explored = false;
    
    // Features
    private boolean tree = false;
    private boolean road = false;
    private StoneDeposit stoneDeposit = null;
    
    // Entity on this tile
    private Entity entity = null;
    
    // Animal on this tile
    private Animal animal = null;
    
    // Building/Zone
    private char zone = 0;  // 'R', 'C', 'I', or 0 for none
    private Building building = null;
    
    // Pollution
    private double pollution = 0;
    
    // Water proximity (cached for performance)
    private int waterDistance = -1;
    
    public Tile(int x, int y) {
        this.x = x;
        this.y = y;
        this.type = TerrainType.GRASS;
    }
    
    // Getters and Setters
    public int getX() { return x; }
    public int getY() { return y; }
    
    public TerrainType getType() { return type; }
    public void setType(TerrainType type) { this.type = type; }
    
    public double getHeight() { return height; }
    public void setHeight(double height) { this.height = height; }
    
    public boolean isExplored() { return explored; }
    public void setExplored(boolean explored) { this.explored = explored; }
    
    public boolean hasTree() { return tree; }
    public void setTree(boolean tree) { this.tree = tree; }
    
    public boolean hasRoad() { return road; }
    public void setRoad(boolean road) { this.road = road; }
    
    public StoneDeposit getStoneDeposit() { return stoneDeposit; }
    public void setStoneDeposit(StoneDeposit deposit) { this.stoneDeposit = deposit; }
    
    public Entity getEntity() { return entity; }
    public void setEntity(Entity entity) { this.entity = entity; }
    
    public Animal getAnimal() { return animal; }
    public void setAnimal(Animal animal) { this.animal = animal; }
    
    public char getZone() { return zone; }
    public void setZone(char zone) { this.zone = zone; }
    
    public Building getBuilding() { return building; }
    public void setBuilding(Building building) { this.building = building; }
    
    public double getPollution() { return pollution; }
    public void setPollution(double pollution) { this.pollution = pollution; }
    
    public int getWaterDistance() { return waterDistance; }
    public void setWaterDistance(int distance) { this.waterDistance = distance; }
    
    /**
     * Check if tile is passable (can be walked on)
     */
    public boolean isPassable() {
        if (type == TerrainType.WATER || 
            type == TerrainType.DEEP || 
            type == TerrainType.RIVER) {
            return false;
        }
        if (stoneDeposit != null) {
            return false;
        }
        return true;
    }
    
    /**
     * Alias for isPassable - check if tile can be walked on
     */
    public boolean isWalkable() {
        return isPassable();
    }
    
    /**
     * Check if tile is drinkable water
     */
    public boolean isDrinkable() {
        return type == TerrainType.WATER || type == TerrainType.RIVER;
    }
    
    /**
     * Check if tile can be built on
     */
    public boolean isBuildable() {
        return isPassable() && 
               building == null && 
               entity == null &&
               !road &&
               (type == TerrainType.GRASS || 
                type == TerrainType.SAND || 
                type == TerrainType.EARTH);
    }
    
    /**
     * Clear all features from the tile
     */
    public void clear() {
        tree = false;
        road = false;
        stoneDeposit = null;
        entity = null;
        animal = null;
        zone = 0;
        building = null;
    }
    
    @Override
    public String toString() {
        return String.format("Tile[%d,%d type=%s explored=%b]", 
            x, y, type, explored);
    }
}
