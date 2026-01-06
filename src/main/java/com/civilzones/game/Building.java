package com.civilzones.game;

/**
 * Represents a building on the map
 */
public class Building {
    
    private BuildingType type;
    private int x;
    private int y;
    private int level = 1;
    private int variant = 1;  // 0=abandoned, 1=low, 2=medium, 3=high
    private int population = 0;
    private int capacity;
    private double desirability = 0.5;
    private int yearsEmpty = 0;
    
    // Upkeep tracking
    private int woodUpkeep = 0;
    private int foodUpkeep = 0;
    
    public Building(BuildingType type, int x, int y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.capacity = getDefaultCapacity(type);
    }
    
    public Building(int x, int y, BuildingType type, int level) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.level = level;
        this.capacity = getDefaultCapacity(type);
    }
    
    private int getDefaultCapacity(BuildingType type) {
        return switch (type) {
            case RES -> 20;
            case COM, CAMPFIRE -> 10;
            case IND, HUNTING_GROUND -> 15;
            case WELL -> 500;
            default -> 0;
        };
    }
    
    // Getters and Setters
    public BuildingType getType() { return type; }
    public void setType(BuildingType type) { this.type = type; }
    
    public int getX() { return x; }
    public int getY() { return y; }
    
    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }
    
    public int getVariant() { return variant; }
    public void setVariant(int variant) { this.variant = Math.max(0, Math.min(3, variant)); }
    
    public int getPopulation() { return population; }
    public void setPopulation(int population) { 
        this.population = Math.max(0, Math.min(capacity, population)); 
    }
    
    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }
    
    public double getDesirability() { return desirability; }
    public void setDesirability(double desirability) { this.desirability = desirability; }
    
    public int getYearsEmpty() { return yearsEmpty; }
    public void setYearsEmpty(int years) { this.yearsEmpty = years; }
    
    public int getWoodUpkeep() { return woodUpkeep; }
    public void setWoodUpkeep(int upkeep) { this.woodUpkeep = upkeep; }
    
    public int getFoodUpkeep() { return foodUpkeep; }
    public void setFoodUpkeep(int upkeep) { this.foodUpkeep = upkeep; }
    
    /**
     * Check if building is abandoned (variant 0)
     */
    public boolean isAbandoned() {
        return variant == 0;
    }
    
    /**
     * Check if building is at full capacity
     */
    public boolean isFull() {
        return population >= capacity;
    }
    
    /**
     * Get occupancy percentage
     */
    public double getOccupancy() {
        if (capacity == 0) return 0;
        return (double) population / capacity;
    }
    
    /**
     * Get the variant name based on type and variant
     */
    public String getVariantName() {
        if (type == BuildingType.RES) {
            return switch (variant) {
                case 0 -> "Abandoned";
                case 1 -> "Mud Pit";
                case 2 -> "Straw Pit";
                case 3 -> "Large Straw Pit";
                default -> "Pit";
            };
        } else if (type == BuildingType.COM || type == BuildingType.CAMPFIRE) {
            return switch (variant) {
                case 0 -> "Abandoned";
                case 1 -> "Campfire";
                case 2 -> "Fire Pit";
                case 3 -> "Trading Post";
                default -> "Commercial";
            };
        } else if (type == BuildingType.IND || type == BuildingType.HUNTING_GROUND) {
            return switch (variant) {
                case 0 -> "Abandoned";
                case 1 -> "Hunting Ground";
                case 2 -> "Butcher";
                case 3 -> "Hunter's Lodge";
                default -> "Industrial";
            };
        }
        return type.toString();
    }
    
    /**
     * Update building each year
     */
    public void update() {
        if (population == 0) {
            yearsEmpty++;
        } else {
            yearsEmpty = 0;
        }
    }
    
    @Override
    public String toString() {
        return String.format("Building[%s L%d at (%d,%d) pop=%d/%d]",
            type, level, x, y, population, capacity);
    }
}
