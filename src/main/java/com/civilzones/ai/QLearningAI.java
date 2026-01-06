package com.civilzones.ai;

import com.civilzones.config.Config;
import com.civilzones.game.*;
import com.civilzones.entity.*;

import java.util.*;

/**
 * Q-Learning AI for Civil Zones
 * Converted from JavaScript QLearning object
 */
public class QLearningAI {
    
    // Q-Learning parameters
    private double learningRate = 0.1;
    private double discountFactor = 0.95;
    private double epsilon = 1.0;
    private double epsilonDecay = 0.9995;
    private double epsilonMin = 0.01;
    
    // Q-Table: state -> action -> value
    private Map<String, Map<String, Double>> qTable = new HashMap<>();
    
    // State tracking
    private boolean training = false;
    private boolean autoPlay = false;
    private String lastState = null;
    private String lastAction = null;
    private int statesExplored = 0;
    private int episodeCount = 0;
    private double totalReward = 0;
    
    // Reference to game
    private Game game;
    
    // Action definitions
    private static final String[] WANDER_ACTIONS = {
        "MOVE_N", "MOVE_S", "MOVE_E", "MOVE_W",
        "MOVE_NE", "MOVE_NW", "MOVE_SE", "MOVE_SW",
        "INTERACT", "WAIT"
    };
    
    private static final String[] CITY_ACTIONS = {
        "BUILD_RES", "BUILD_COM", "BUILD_IND", "BUILD_WELL",
        "BUILD_ROAD", "DEMOLISH", "NEXT_TURN", "WAIT"
    };
    
    public QLearningAI(Game game) {
        this.game = game;
    }
    
    /**
     * Encode current game state to string
     */
    public String encodeState() {
        StringBuilder sb = new StringBuilder();
        
        if (game.getGameState() == GameState.WANDER) {
            return encodeWanderState();
        } else if (game.getGameState() == GameState.CITY) {
            return encodeCityState();
        }
        
        return "UNKNOWN";
    }
    
    /**
     * Encode wander mode state
     */
    private String encodeWanderState() {
        Player player = game.getPlayer();
        if (player == null) return "NO_PLAYER";
        
        int px = player.getX();
        int py = player.getY();
        
        // Discretize position into zones (reduce state space)
        int zoneX = px / 10;
        int zoneY = py / 10;
        
        // Population bucket
        int popBucket = player.getPopulation() / 5;
        
        // Resource buckets
        Inventory inv = player.getInventory();
        int foodBucket = Math.min((int)(inv.getFood() / 10), 5);
        int woodBucket = Math.min((int)(inv.getWood() / 10), 5);
        
        // Thirst level
        int thirstLevel = player.getThirst() < 30 ? 0 : player.getThirst() < 70 ? 1 : 2;
        
        // Nearby features (8 directions)
        String nearbyFeatures = encodeNearbyFeatures(px, py);
        
        // Check if can settle
        boolean canSettle = canPlayerSettle();
        
        return String.format("W|z%d,%d|p%d|f%d|w%d|t%d|%s|s%d",
            zoneX, zoneY, popBucket, foodBucket, woodBucket, 
            thirstLevel, nearbyFeatures, canSettle ? 1 : 0);
    }
    
    /**
     * Encode nearby features for state representation
     */
    private String encodeNearbyFeatures(int px, int py) {
        StringBuilder sb = new StringBuilder();
        int[][] dirs = {{0, -1}, {1, -1}, {1, 0}, {1, 1}, {0, 1}, {-1, 1}, {-1, 0}, {-1, -1}};
        
        Tile[][] tiles = game.getTiles();
        
        for (int[] dir : dirs) {
            int nx = px + dir[0];
            int ny = py + dir[1];
            
            if (nx < 0 || nx >= Config.MAP_WIDTH || ny < 0 || ny >= Config.MAP_HEIGHT) {
                sb.append("X");
                continue;
            }
            
            Tile tile = tiles[nx][ny];
            
            // Encode what's on the tile
            if (tile.getEntity() instanceof Berry) {
                Berry berry = (Berry) tile.getEntity();
                sb.append(berry.isPoisonous() ? "P" : "B"); // Berry or Poison
            } else if (tile.getEntity() instanceof Nomad) {
                sb.append("N"); // Nomad
            } else if (tile.getAnimal() != null) {
                sb.append("A"); // Animal
            } else if (tile.getType() == TerrainType.WATER || tile.getType() == TerrainType.RIVER) {
                sb.append("W"); // Water
            } else if (tile.getStoneDeposit() != null) {
                sb.append("S"); // Stone
            } else if (tile.hasTree()) {
                sb.append("T"); // Tree
            } else if (tile.isWalkable()) {
                sb.append("."); // Empty walkable
            } else {
                sb.append("X"); // Blocked
            }
        }
        
        return sb.toString();
    }
    
    /**
     * Encode city mode state
     */
    private String encodeCityState() {
        // Population info
        int totalPop = game.getTotalPopulation();
        int totalCap = game.getTotalCapacity();
        double popRatio = totalCap > 0 ? (double) totalPop / totalCap : 0;
        int popBucket = (int)(popRatio * 10);
        
        // Resource buckets
        Inventory inv = game.getCityInventory();
        int foodBucket = Math.min((int)(inv.getFood() / 20), 10);
        int woodBucket = Math.min((int)(inv.getWood() / 20), 10);
        int stoneBucket = Math.min((int)(inv.getStone() / 20), 10);
        
        // Building counts
        int resCount = countBuildings(BuildingType.RES);
        int comCount = countBuildings(BuildingType.COM) + countBuildings(BuildingType.CAMPFIRE);
        int indCount = countBuildings(BuildingType.IND) + countBuildings(BuildingType.HUNTING_GROUND);
        int wellCount = countBuildings(BuildingType.WELL);
        
        // Average desirability
        double avgDes = calculateAverageDesirability();
        int desBucket = (int)(avgDes * 10);
        
        // Turn number bucket
        int turnBucket = game.getCurrentTurn() / 10;
        
        return String.format("C|p%d|f%d|w%d|s%d|r%d|c%d|i%d|wl%d|d%d|t%d",
            popBucket, foodBucket, woodBucket, stoneBucket,
            Math.min(resCount, 10), Math.min(comCount, 5), Math.min(indCount, 5),
            Math.min(wellCount, 3), desBucket, Math.min(turnBucket, 20));
    }
    
    /**
     * Count buildings of a type
     */
    private int countBuildings(BuildingType type) {
        int count = 0;
        Tile[][] tiles = game.getTiles();
        
        for (int x = 0; x < Config.MAP_WIDTH; x++) {
            for (int y = 0; y < Config.MAP_HEIGHT; y++) {
                Building b = tiles[x][y].getBuilding();
                if (b != null && b.getType() == type) {
                    count++;
                }
            }
        }
        return count;
    }
    
    /**
     * Calculate average desirability of residential buildings
     */
    private double calculateAverageDesirability() {
        double total = 0;
        int count = 0;
        Tile[][] tiles = game.getTiles();
        
        for (int x = 0; x < Config.MAP_WIDTH; x++) {
            for (int y = 0; y < Config.MAP_HEIGHT; y++) {
                Building b = tiles[x][y].getBuilding();
                if (b != null && b.getType() == BuildingType.RES) {
                    total += game.calculateDesirability(x, y, b.getLevel());
                    count++;
                }
            }
        }
        
        return count > 0 ? total / count : 0;
    }
    
    /**
     * Check if player can settle
     */
    private boolean canPlayerSettle() {
        Player player = game.getPlayer();
        if (player == null) return false;
        
        Inventory inv = player.getInventory();
        return player.getPopulation() >= Config.SETTLE_MIN_POP &&
               inv.getFood() >= Config.SETTLE_MIN_FOOD &&
               inv.getWood() >= Config.SETTLE_MIN_WOOD;
    }
    
    /**
     * Get available actions for current state
     */
    public String[] getAvailableActions() {
        if (game.getGameState() == GameState.WANDER) {
            return getWanderActions();
        } else if (game.getGameState() == GameState.CITY) {
            return getCityActions();
        }
        return new String[]{"WAIT"};
    }
    
    /**
     * Get available wander actions
     */
    private String[] getWanderActions() {
        List<String> actions = new ArrayList<>();
        Player player = game.getPlayer();
        if (player == null) return new String[]{"WAIT"};
        
        int px = player.getX();
        int py = player.getY();
        Tile[][] tiles = game.getTiles();
        
        // Movement actions
        int[][] dirs = {{0, -1}, {0, 1}, {1, 0}, {-1, 0}, {1, -1}, {-1, -1}, {1, 1}, {-1, 1}};
        String[] dirNames = {"MOVE_N", "MOVE_S", "MOVE_E", "MOVE_W", "MOVE_NE", "MOVE_NW", "MOVE_SE", "MOVE_SW"};
        
        for (int i = 0; i < dirs.length; i++) {
            int nx = px + dirs[i][0];
            int ny = py + dirs[i][1];
            
            if (nx >= 0 && nx < Config.MAP_WIDTH && ny >= 0 && ny < Config.MAP_HEIGHT) {
                Tile tile = tiles[nx][ny];
                if (tile.isWalkable()) {
                    actions.add(dirNames[i]);
                }
            }
        }
        
        // Interact action (if there's something nearby)
        boolean canInteract = false;
        for (int[] dir : dirs) {
            int nx = px + dir[0];
            int ny = py + dir[1];
            if (nx >= 0 && nx < Config.MAP_WIDTH && ny >= 0 && ny < Config.MAP_HEIGHT) {
                Tile tile = tiles[nx][ny];
                if (tile.getEntity() != null || tile.getAnimal() != null || 
                    tile.getStoneDeposit() != null || tile.hasTree()) {
                    canInteract = true;
                    break;
                }
            }
        }
        if (canInteract) {
            actions.add("INTERACT");
        }
        
        // Settle action
        if (canPlayerSettle()) {
            actions.add("SETTLE");
        }
        
        actions.add("WAIT");
        
        return actions.toArray(new String[0]);
    }
    
    /**
     * Get available city actions
     */
    private String[] getCityActions() {
        List<String> actions = new ArrayList<>();
        Inventory inv = game.getCityInventory();
        
        // Build actions (if have resources)
        if (inv.getWood() >= Config.BUILDING_COST_WOOD_RES) {
            actions.add("BUILD_RES");
        }
        if (inv.getWood() >= Config.BUILDING_COST_WOOD_COM && 
            inv.getStone() >= Config.BUILDING_COST_STONE_COM) {
            actions.add("BUILD_COM");
        }
        if (inv.getWood() >= Config.BUILDING_COST_WOOD_IND) {
            actions.add("BUILD_IND");
        }
        if (inv.getStone() >= Config.WELL_COST_STONE) {
            actions.add("BUILD_WELL");
        }
        if (inv.getStone() >= Config.ROAD_COST_STONE) {
            actions.add("BUILD_ROAD");
        }
        
        actions.add("NEXT_TURN");
        actions.add("WAIT");
        
        return actions.toArray(new String[0]);
    }
    
    /**
     * Select action using epsilon-greedy policy
     */
    public String selectAction() {
        String state = encodeState();
        String[] actions = getAvailableActions();
        
        if (actions.length == 0) return "WAIT";
        
        // Epsilon-greedy selection
        if (training && Math.random() < epsilon) {
            // Random exploration
            return actions[(int)(Math.random() * actions.length)];
        }
        
        // Exploitation: choose best action
        return getBestAction(state, actions);
    }
    
    /**
     * Get best action for state based on Q-values
     */
    private String getBestAction(String state, String[] actions) {
        Map<String, Double> stateQ = qTable.getOrDefault(state, new HashMap<>());
        
        String bestAction = actions[0];
        double bestValue = Double.NEGATIVE_INFINITY;
        
        for (String action : actions) {
            double value = stateQ.getOrDefault(action, 0.0);
            if (value > bestValue) {
                bestValue = value;
                bestAction = action;
            }
        }
        
        return bestAction;
    }
    
    /**
     * Get Q-value for state-action pair
     */
    public double getQValue(String state, String action) {
        return qTable.getOrDefault(state, new HashMap<>())
                     .getOrDefault(action, 0.0);
    }
    
    /**
     * Set Q-value for state-action pair
     */
    private void setQValue(String state, String action, double value) {
        qTable.computeIfAbsent(state, k -> new HashMap<>()).put(action, value);
    }
    
    /**
     * Calculate reward for current state
     */
    public double calculateReward() {
        double reward = 0;
        
        if (game.getGameState() == GameState.WANDER) {
            reward = calculateWanderReward();
        } else if (game.getGameState() == GameState.CITY) {
            reward = calculateCityReward();
        } else if (game.getGameState() == GameState.GAME_OVER) {
            reward = -100; // Big penalty for game over
        }
        
        return reward;
    }
    
    /**
     * Calculate reward for wander state
     */
    private double calculateWanderReward() {
        Player player = game.getPlayer();
        if (player == null) return -100;
        
        double reward = 0;
        Inventory inv = player.getInventory();
        
        // Reward for having resources
        reward += inv.getFood() * 0.1;
        reward += inv.getWood() * 0.1;
        reward += inv.getStone() * 0.05;
        
        // Reward for population
        reward += player.getPopulation() * 2;
        
        // Penalty for low thirst
        if (player.getThirst() < 20) {
            reward -= 5;
        } else if (player.getThirst() < 50) {
            reward -= 1;
        }
        
        // Exploration reward
        reward += game.getExploredTiles() * 0.01;
        
        // Big reward if can settle
        if (canPlayerSettle()) {
            reward += 10;
        }
        
        return reward;
    }
    
    /**
     * Calculate reward for city state
     */
    private double calculateCityReward() {
        double reward = 0;
        
        // Population is good
        int pop = game.getTotalPopulation();
        int cap = game.getTotalCapacity();
        reward += pop * 0.5;
        
        // Penalize overcrowding or undercrowding
        if (cap > 0) {
            double ratio = (double) pop / cap;
            if (ratio > 0.9) {
                reward += 5; // Efficient use
            } else if (ratio < 0.5) {
                reward -= 2; // Wasted capacity
            }
        }
        
        // Resources are good
        Inventory inv = game.getCityInventory();
        reward += inv.getFood() * 0.1;
        reward += inv.getWood() * 0.05;
        reward += inv.getStone() * 0.05;
        
        // Desirability is good
        double avgDes = calculateAverageDesirability();
        reward += avgDes * 5;
        
        // Survival is rewarded per turn
        reward += 1;
        
        return reward;
    }
    
    /**
     * Update Q-value based on experience
     */
    public void update(String state, String action, double reward, String nextState) {
        if (!training) return;
        
        double currentQ = getQValue(state, action);
        
        // Get max Q for next state
        double maxNextQ = 0;
        String[] nextActions = getAvailableActions();
        for (String nextAction : nextActions) {
            maxNextQ = Math.max(maxNextQ, getQValue(nextState, nextAction));
        }
        
        // Q-learning update rule
        double newQ = currentQ + learningRate * (reward + discountFactor * maxNextQ - currentQ);
        setQValue(state, action, newQ);
        
        // Track stats
        if (!qTable.containsKey(state)) {
            statesExplored++;
        }
        totalReward += reward;
        
        // Decay epsilon
        if (epsilon > epsilonMin) {
            epsilon *= epsilonDecay;
        }
    }
    
    /**
     * Execute a single AI step
     */
    public void step() {
        String currentState = encodeState();
        String action = selectAction();
        
        // Execute the action
        executeAction(action);
        
        // Calculate reward
        double reward = calculateReward();
        
        // Get new state
        String newState = encodeState();
        
        // Update Q-values
        if (lastState != null && lastAction != null) {
            update(lastState, lastAction, reward, currentState);
        }
        
        lastState = currentState;
        lastAction = action;
    }
    
    /**
     * Execute an action
     */
    private void executeAction(String action) {
        Player player = game.getPlayer();
        
        switch (action) {
            case "MOVE_N" -> { if (player != null) game.movePlayer(0, -1); }
            case "MOVE_S" -> { if (player != null) game.movePlayer(0, 1); }
            case "MOVE_E" -> { if (player != null) game.movePlayer(1, 0); }
            case "MOVE_W" -> { if (player != null) game.movePlayer(-1, 0); }
            case "MOVE_NE" -> { if (player != null) game.movePlayer(1, -1); }
            case "MOVE_NW" -> { if (player != null) game.movePlayer(-1, -1); }
            case "MOVE_SE" -> { if (player != null) game.movePlayer(1, 1); }
            case "MOVE_SW" -> { if (player != null) game.movePlayer(-1, 1); }
            case "INTERACT" -> interactWithNearby();
            case "SETTLE" -> game.settle();
            case "BUILD_RES" -> buildAt("RES");
            case "BUILD_COM" -> buildAt("CAMPFIRE");
            case "BUILD_IND" -> buildAt("HUNTING_GROUND");
            case "BUILD_WELL" -> buildAt("WELL");
            case "BUILD_ROAD" -> buildAt("ROAD");
            case "NEXT_TURN" -> game.nextTurn();
            case "WAIT" -> { /* Do nothing */ }
        }
    }
    
    /**
     * Interact with nearby tile
     */
    private void interactWithNearby() {
        Player player = game.getPlayer();
        if (player == null) return;
        
        int px = player.getX();
        int py = player.getY();
        Tile[][] tiles = game.getTiles();
        
        int[][] dirs = {{0, -1}, {0, 1}, {1, 0}, {-1, 0}};
        
        for (int[] dir : dirs) {
            int nx = px + dir[0];
            int ny = py + dir[1];
            
            if (nx >= 0 && nx < Config.MAP_WIDTH && ny >= 0 && ny < Config.MAP_HEIGHT) {
                Tile tile = tiles[nx][ny];
                
                // Try to gather resources
                if (tile.getEntity() instanceof Berry) {
                    game.gather(nx, ny);
                    return;
                }
                if (tile.getAnimal() != null) {
                    game.hunt(nx, ny);
                    return;
                }
                if (tile.hasTree()) {
                    game.chopTree(nx, ny);
                    return;
                }
                if (tile.getStoneDeposit() != null) {
                    game.mineStone(nx, ny);
                    return;
                }
                if (tile.getEntity() instanceof Nomad) {
                    game.talkToNomad(nx, ny);
                    return;
                }
            }
        }
    }
    
    /**
     * Build at best location
     */
    private void buildAt(String buildType) {
        // Find best location based on desirability
        int bestX = -1, bestY = -1;
        double bestDesirability = -1;
        
        Tile[][] tiles = game.getTiles();
        int[] center = game.getSettlementCenter();
        
        // Search around settlement center
        int searchRadius = 20;
        for (int dx = -searchRadius; dx <= searchRadius; dx++) {
            for (int dy = -searchRadius; dy <= searchRadius; dy++) {
                int x = center[0] + dx;
                int y = center[1] + dy;
                
                if (x < 0 || x >= Config.MAP_WIDTH || y < 0 || y >= Config.MAP_HEIGHT) continue;
                
                Tile tile = tiles[x][y];
                if (!tile.isWalkable() || tile.getBuilding() != null) continue;
                
                double desirability = game.calculateDesirability(x, y, 1);
                if (desirability > bestDesirability) {
                    bestDesirability = desirability;
                    bestX = x;
                    bestY = y;
                }
            }
        }
        
        if (bestX >= 0 && bestY >= 0) {
            game.build(bestX, bestY, buildType);
        }
    }
    
    /**
     * Reset Q-table
     */
    public void resetQTable() {
        qTable.clear();
        statesExplored = 0;
        epsilon = 1.0;
        episodeCount = 0;
        totalReward = 0;
    }
    
    /**
     * Start new episode
     */
    public void newEpisode() {
        episodeCount++;
        lastState = null;
        lastAction = null;
    }
    
    // Getters and setters
    public boolean isTraining() { return training; }
    public void setTraining(boolean training) { this.training = training; }
    public boolean isAutoPlay() { return autoPlay; }
    public void setAutoPlay(boolean autoPlay) { this.autoPlay = autoPlay; }
    public double getEpsilon() { return epsilon; }
    public int getStatesExplored() { return statesExplored; }
    public int getEpisodeCount() { return episodeCount; }
    public double getTotalReward() { return totalReward; }
    public double getLearningRate() { return learningRate; }
    public void setLearningRate(double lr) { this.learningRate = lr; }
    public double getDiscountFactor() { return discountFactor; }
    public void setDiscountFactor(double df) { this.discountFactor = df; }
}
