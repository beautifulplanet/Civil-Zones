package com.civilzones.entity;

import com.civilzones.config.Config;
import com.civilzones.game.Inventory;

/**
 * Nomad entity - can be recruited or may be hostile
 */
public class Nomad extends Entity {
    
    private boolean isHostile;
    private int popBonus;
    private int damage;
    private Inventory loot;
    
    public Nomad(int x, int y) {
        super(x, y, "NOMAD");
        
        // 33% chance of being hostile
        this.isHostile = Math.random() < Config.HOSTILE_CHANCE;
        
        if (isHostile) {
            // Hostile nomad - damages player
            this.popBonus = 0;
            this.damage = Config.HOSTILE_DAMAGE_MIN + 
                (int)(Math.random() * (Config.HOSTILE_DAMAGE_MAX - Config.HOSTILE_DAMAGE_MIN + 1));
            this.loot = new Inventory(0);
        } else {
            // Friendly nomad - joins party
            this.popBonus = Config.FRIENDLY_POP_BONUS;
            this.damage = 0;
            
            // Generate random loot
            this.loot = new Inventory(500);
            loot.setFood(5 + Math.random() * 25);
            loot.setWood(5 + Math.random() * 25);
            loot.setMetal(Math.random() * 10);
            loot.setStone(Math.random() * 5);
        }
    }
    
    public boolean isHostile() { return isHostile; }
    public boolean isFriendly() { return !isHostile; }
    public int getPopBonus() { return popBonus; }
    public int getGroupSize() { return popBonus > 0 ? popBonus : 1; }
    public int getDamage() { return damage; }
    public Inventory getLoot() { return loot; }
    
    @Override
    public void onInteract(Player player) {
        if (isHostile) {
            // Hostile attack
            player.takeDamage(damage);
        } else {
            // Friendly recruitment
            player.addPopulation(popBonus);
            
            // Transfer loot
            player.getInventory().transferFrom(loot, Double.MAX_VALUE);
            
            // Increase inventory capacity
            player.getInventory().addCapacity(100);
            
            // Expand exploration radius temporarily
            player.setVisionBonus(15);
        }
        active = false; // Nomad is consumed
    }
    
    @Override
    public String toString() {
        return String.format("Nomad[%d,%d %s pop=%d dmg=%d]",
            x, y, isHostile ? "HOSTILE" : "friendly", popBonus, damage);
    }
}
