package com.civilzones.entity;

/**
 * Base entity class for all game entities
 */
public abstract class Entity {
    
    protected int x;
    protected int y;
    protected String type;
    protected boolean active = true;
    
    public Entity(int x, int y, String type) {
        this.x = x;
        this.y = y;
        this.type = type;
    }
    
    public int getX() { return x; }
    public void setX(int x) { this.x = x; }
    
    public int getY() { return y; }
    public void setY(int y) { this.y = y; }
    
    public String getType() { return type; }
    
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    
    /**
     * Called when player interacts with this entity
     */
    public abstract void onInteract(Player player);
    
    /**
     * Update entity state
     */
    public void update() {
        // Override in subclasses
    }
    
    @Override
    public String toString() {
        return String.format("%s[%d,%d]", type, x, y);
    }
}
