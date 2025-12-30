package com.civilzones.entity;

/**
 * Animal types with their properties
 */
public enum AnimalType {
    DEER(2, 1, 30, 0, "#C89858", 1.0, 0.50, "🦌"),
    BISON(3, 5, 30, 0, "#A06830", 0.5, 0.35, "🦬"),
    MAMMOTH(5, 15, 30, 0, "#806040", 0.3, 0.15, "🦣");
    
    private final int hitsToKill;
    private final int minFood;
    private final int maxFood;
    private final int popCost;
    private final String color;
    private final double speed;
    private final double spawnRate;
    private final String emoji;
    
    AnimalType(int hitsToKill, int minFood, int maxFood, int popCost, 
               String color, double speed, double spawnRate, String emoji) {
        this.hitsToKill = hitsToKill;
        this.minFood = minFood;
        this.maxFood = maxFood;
        this.popCost = popCost;
        this.color = color;
        this.speed = speed;
        this.spawnRate = spawnRate;
        this.emoji = emoji;
    }
    
    public int getHitsToKill() { return hitsToKill; }
    public int getMinFood() { return minFood; }
    public int getMaxFood() { return maxFood; }
    public int getPopCost() { return popCost; }
    public String getColor() { return color; }
    public double getSpeed() { return speed; }
    public double getSpawnRate() { return spawnRate; }
    public String getEmoji() { return emoji; }
    
    /**
     * Get random food reward
     */
    public int getRandomFoodReward() {
        return minFood + (int)(Math.random() * (maxFood - minFood + 1));
    }
    
    /**
     * Get random animal type based on spawn rates
     */
    public static AnimalType getRandomType() {
        double roll = Math.random();
        double cumulative = 0;
        
        for (AnimalType type : values()) {
            cumulative += type.spawnRate;
            if (roll < cumulative) {
                return type;
            }
        }
        
        return DEER; // Default
    }
}
