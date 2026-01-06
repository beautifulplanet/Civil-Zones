package com.civilzones.game;

/**
 * Inventory system for storing resources
 */
public class Inventory {
    
    private double food = 0;
    private double wood = 0;
    private double metal = 0;
    private double stone = 0;
    private int capacity;
    
    // Pocket for rare items (separate from main inventory)
    private double pocketMetal = 0;
    private double pocketStone = 0;
    private int pocketCapacity = 1000;
    
    public Inventory() {
        this.capacity = 100;  // Default capacity
    }
    
    public Inventory(int capacity) {
        this.capacity = capacity;
    }
    
    // Main inventory getters/setters
    public double getFood() { return food; }
    public void setFood(double food) { this.food = Math.max(0, food); }
    public void addFood(double amount) { setFood(this.food + amount); }
    
    public double getWood() { return wood; }
    public void setWood(double wood) { this.wood = Math.max(0, wood); }
    public void addWood(double amount) { setWood(this.wood + amount); }
    
    public double getMetal() { return metal; }
    public void setMetal(double metal) { this.metal = Math.max(0, metal); }
    public void addMetal(double amount) { setMetal(this.metal + amount); }
    
    public double getStone() { return stone; }
    public void setStone(double stone) { this.stone = Math.max(0, stone); }
    public void addStone(double amount) { setStone(this.stone + amount); }
    
    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }
    public void addCapacity(int amount) { this.capacity += amount; }
    
    // Pocket inventory
    public double getPocketMetal() { return pocketMetal; }
    public void setPocketMetal(double metal) { this.pocketMetal = Math.max(0, metal); }
    public void addPocketMetal(double amount) { 
        double space = pocketCapacity - pocketMetal - pocketStone;
        setPocketMetal(this.pocketMetal + Math.min(amount, space)); 
    }
    
    public double getPocketStone() { return pocketStone; }
    public void setPocketStone(double stone) { this.pocketStone = Math.max(0, stone); }
    public void addPocketStone(double amount) { 
        double space = pocketCapacity - pocketMetal - pocketStone;
        setPocketStone(this.pocketStone + Math.min(amount, space)); 
    }
    
    public int getPocketCapacity() { return pocketCapacity; }
    
    /**
     * Get total items in main inventory
     */
    public double getTotal() {
        return food + wood + metal + stone;
    }
    
    /**
     * Get available space in main inventory
     */
    public double getAvailableSpace() {
        return Math.max(0, capacity - getTotal());
    }
    
    /**
     * Check if main inventory is full
     */
    public boolean isFull() {
        return getTotal() >= capacity;
    }
    
    /**
     * Get total items in pocket
     */
    public double getPocketTotal() {
        return pocketMetal + pocketStone;
    }
    
    /**
     * Get available space in pocket
     */
    public double getPocketSpace() {
        return Math.max(0, pocketCapacity - getPocketTotal());
    }
    
    /**
     * Try to add food, returns amount actually added
     */
    public double tryAddFood(double amount) {
        double space = getAvailableSpace();
        double toAdd = Math.min(amount, space);
        addFood(toAdd);
        return toAdd;
    }
    
    /**
     * Try to add wood, returns amount actually added
     */
    public double tryAddWood(double amount) {
        double space = getAvailableSpace();
        double toAdd = Math.min(amount, space);
        addWood(toAdd);
        return toAdd;
    }
    
    /**
     * Clear all resources
     */
    public void clear() {
        food = 0;
        wood = 0;
        metal = 0;
        stone = 0;
    }
    
    /**
     * Transfer from another inventory
     */
    public void transferFrom(Inventory other, double maxAmount) {
        double space = getAvailableSpace();
        double toTransfer = Math.min(maxAmount, space);
        double ratio = toTransfer / other.getTotal();
        
        if (ratio >= 1) {
            // Transfer everything
            addFood(other.food);
            addWood(other.wood);
            addMetal(other.metal);
            addStone(other.stone);
            other.clear();
        } else {
            // Transfer proportionally
            double f = other.food * ratio;
            double w = other.wood * ratio;
            double m = other.metal * ratio;
            double s = other.stone * ratio;
            
            addFood(f);
            addWood(w);
            addMetal(m);
            addStone(s);
            
            other.food -= f;
            other.wood -= w;
            other.metal -= m;
            other.stone -= s;
        }
    }
    
    @Override
    public String toString() {
        return String.format("Inventory[F:%.0f W:%.0f M:%.0f S:%.0f / %d]",
            food, wood, metal, stone, capacity);
    }
}
