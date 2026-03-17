package com.civilzones.data;

public class BuildingDef {
    private String id;
    private String name;
    private String type; // R, C, I, or SPECIAL
    private int cost;
    private int levelRequirement;
    private String description;
    // Add more fields as needed (e.g., upkeep, production, etc.)

    public String getId() { return id; }
    public String getName() { return name; }
    public String getType() { return type; }
    public int getCost() { return cost; }
    public int getLevelRequirement() { return levelRequirement; }
    public String getDescription() { return description; }
}
