package com.civilzones.entity;

/**
 * Stone deposit that can be mined for resources
 */
public class StoneDeposit extends Entity {
    
    private double metalAmount;
    private double stoneAmount;
    private int remaining = 100;  // Mining capacity
    
    public StoneDeposit(int x, int y) {
        super(x, y, "STONE_DEPOSIT");
        
        // Random resource amounts
        this.metalAmount = 1 + Math.random() * 9;  // 1-10 metal
        this.stoneAmount = 0.0001 + Math.random() * 0.0009;  // Very small stone amount
        this.remaining = 50 + (int)(Math.random() * 150);  // 50-200 stone
    }
    
    public double getMetalAmount() { return metalAmount; }
    public double getStoneAmount() { return stoneAmount; }
    public int getRemaining() { return remaining; }
    
    public void mine(int amount) {
        remaining = Math.max(0, remaining - amount);
        if (remaining <= 0) {
            active = false;
        }
    }
    
    @Override
    public void onInteract(Player player) {
        // Stone deposits block movement, can't be directly interacted
        // Mining would require tools (future feature)
    }
    
    @Override
    public String toString() {
        return String.format("StoneDeposit[%d,%d metal=%.1f stone=%.4f]",
            x, y, metalAmount, stoneAmount);
    }
}
