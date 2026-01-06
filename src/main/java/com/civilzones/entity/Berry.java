package com.civilzones.entity;

import com.civilzones.config.Config;

/**
 * Berry bush entity - provides food when collected
 */
public class Berry extends Entity {
    
    private boolean isPoisonous;
    private int foodAmount;
    
    public Berry(int x, int y) {
        super(x, y, "BERRY");
        
        // 10% chance of being poisonous
        this.isPoisonous = Math.random() < Config.POISON_CHANCE;
        
        // Food value varies
        this.foodAmount = Config.BERRY_FOOD_VALUE + (int)(Math.random() * 5);
    }
    
    public boolean isPoisonous() { return isPoisonous; }
    public int getFoodAmount() { return foodAmount; }
    public int getFoodValue() { return foodAmount; }
    
    @Override
    public void onInteract(Player player) {
        if (isPoisonous) {
            // Poison damages population
            player.takeDamage(Config.POISON_DAMAGE);
        } else {
            // Add food to inventory
            player.getInventory().tryAddFood(foodAmount);
        }
        active = false; // Berry is consumed
    }
    
    @Override
    public String toString() {
        return String.format("Berry[%d,%d %s food=%d]", 
            x, y, isPoisonous ? "POISON" : "safe", foodAmount);
    }
}
