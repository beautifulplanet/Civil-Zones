package com.civilzones.data;

import java.util.List;

public class LevelDef {
    private int levelNumber;
    private String levelName;
    private List<String> allowedBuildingIds;
    private int startingMoney;
    private int populationGoal;
    // Add more fields as needed

    public int getLevelNumber() { return levelNumber; }
    public String getLevelName() { return levelName; }
    public List<String> getAllowedBuildingIds() { return allowedBuildingIds; }
    public int getStartingMoney() { return startingMoney; }
    public int getPopulationGoal() { return populationGoal; }
}
