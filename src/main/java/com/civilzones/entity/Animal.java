package com.civilzones.entity;

/**
 * Animal entity that can be hunted for food
 */
public class Animal extends Entity {
    
    private AnimalType animalType;
    private int hits = 0;
    
    public Animal(int x, int y) {
        super(x, y, "ANIMAL");
        this.animalType = AnimalType.getRandomType();
    }
    
    public Animal(int x, int y, AnimalType type) {
        super(x, y, "ANIMAL");
        this.animalType = type;
    }
    
    public AnimalType getAnimalType() { return animalType; }
    public int getHits() { return hits; }
    
    /**
     * Hit the animal (for hunting)
     * @return true if animal is killed
     */
    public boolean hit() {
        hits++;
        if (hits >= animalType.getHitsToKill()) {
            active = false;
            return true;
        }
        return false;
    }
    
    /**
     * Get food reward when killed
     */
    public int getFoodReward() {
        return animalType.getRandomFoodReward();
    }
    
    /**
     * Alias for getFoodReward
     */
    public int getFoodYield() {
        return getFoodReward();
    }
    
    /**
     * Get population cost to kill
     */
    public int getPopCost() {
        return animalType.getPopCost();
    }
    
    @Override
    public void onInteract(Player player) {
        // Animals are hunted, not interacted with directly
        // Hunting is handled by Game.attackAnimal()
    }
    
    @Override
    public void update() {
        // Animals can move around
        if (Math.random() < animalType.getSpeed() * 0.1) {
            int dx = (int)(Math.random() * 3) - 1;
            int dy = (int)(Math.random() * 3) - 1;
            x += dx;
            y += dy;
        }
    }
    
    public String getEmoji() {
        return animalType.getEmoji();
    }
    
    @Override
    public String toString() {
        return String.format("Animal[%s at %d,%d hits=%d/%d]",
            animalType, x, y, hits, animalType.getHitsToKill());
    }
}
