package com.civilzones.entity;

import com.civilzones.config.Config;
import com.civilzones.game.Inventory;

/**
 * Player entity representing the tribe
 */
public class Player extends Entity {
    
    private int population;
    private Inventory inventory;
    private int thirst = 100;
    private int thirstCounter = 0;
    private int stepCounter = 0;
    private int foodStepCounter = 0;
    
    // Direction for rendering
    private String direction = "down";
    
    // Vision
    private int visionRadius = Config.PLAYER_VISION_RADIUS;
    private int visionBonus = 0;
    
    // Animation
    private long bashTime = 0;
    
    // Stats
    private int totalFoodCollected = 0;
    private int nomadsFound = 0;
    
    public Player(int x, int y) {
        super(x, y, "PLAYER");
        this.population = Config.PLAYER_START_HEALTH;
        this.inventory = new Inventory(Config.BACKPACK_BASE);
    }
    
    public int getPopulation() { return population; }
    public void setPopulation(int pop) { this.population = Math.max(0, pop); }
    public void addPopulation(int amount) { this.population += amount; }
    
    public Inventory getInventory() { return inventory; }
    
    public int getThirst() { return thirst; }
    public void setThirst(int thirst) { this.thirst = Math.max(0, Math.min(100, thirst)); }
    
    public int getThirstCounter() { return thirstCounter; }
    public void setThirstCounter(int counter) { this.thirstCounter = counter; }
    public void incrementThirstCounter() { thirstCounter++; }
    
    public int getStepCounter() { return stepCounter; }
    public void incrementStepCounter() { stepCounter = (stepCounter + 1) % 5; }
    
    public int getFoodStepCounter() { return foodStepCounter; }
    public void setFoodStepCounter(int counter) { this.foodStepCounter = counter; }
    public void incrementFoodStepCounter() { foodStepCounter++; }
    public void resetFoodStepCounter() { foodStepCounter = 0; }
    
    public String getDirection() { return direction; }
    public void setDirection(String direction) { this.direction = direction; }
    
    public int getVisionRadius() { return visionRadius + visionBonus; }
    public void setVisionBonus(int bonus) { this.visionBonus = bonus; }
    
    public long getBashTime() { return bashTime; }
    public void setBashTime(long time) { this.bashTime = time; }
    
    public int getTotalFoodCollected() { return totalFoodCollected; }
    public void addFoodCollected(int amount) { totalFoodCollected += amount; }
    
    public int getNomadsFound() { return nomadsFound; }
    public void incrementNomadsFound() { nomadsFound++; }
    
    /**
     * Take damage (lose population)
     */
    public void takeDamage(int damage) {
        population = Math.max(0, population - damage);
    }
    
    /**
     * Check if player is dead
     */
    public boolean isDead() {
        return population <= 0;
    }
    
    /**
     * Drink water (reset thirst)
     */
    public void drink() {
        thirst = 100;
        thirstCounter = 0;
    }
    
    /**
     * Update thirst based on movement
     */
    public void updateThirst() {
        thirstCounter++;
        thirst = Math.max(0, 100 - thirstCounter);
    }
    
    /**
     * Update inventory capacity based on population
     */
    public void updateCapacity() {
        int newCapacity = Config.BACKPACK_BASE + (population * Config.BACKPACK_PER_POP);
        inventory.setCapacity(newCapacity);
    }
    
    /**
     * Consume food for movement
     * @return true if food was consumed, false if no food
     */
    public boolean consumeMovementFood() {
        foodStepCounter++;
        if (foodStepCounter >= Config.STEPS_PER_FOOD) {
            foodStepCounter = 0;
            int foodCost = population * Config.FOOD_PER_PERSON;
            if (inventory.getFood() >= foodCost) {
                inventory.addFood(-foodCost);
                return true;
            }
            return false;
        }
        return true;
    }
    
    @Override
    public void onInteract(Player player) {
        // Player doesn't interact with itself
    }
    
    @Override
    public void update() {
        // Decay vision bonus over time
        if (visionBonus > 0) {
            visionBonus--;
        }
    }
    
    @Override
    public String toString() {
        return String.format("Player[%d,%d pop=%d thirst=%d %s]",
            x, y, population, thirst, inventory);
    }
}
