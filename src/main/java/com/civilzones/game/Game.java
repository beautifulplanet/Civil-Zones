package com.civilzones.game;

import com.civilzones.config.Config;
import com.civilzones.entity.*;

import java.util.ArrayList;
import java.util.List;
import java.util.LinkedList;
import java.io.*;
import java.util.Queue;

/**
 * Main game logic class
 * Converted from JavaScript Game object
 */
public class Game {
    
    // Game state
    private GameState gameState = GameState.WANDER;
    private int seed;
    private int year = 0;
    
    // Map
    private Tile[][] tiles;
    private Noise noise;
    
    // Player
    private Player player;
    
    // Entities
    private List<Animal> animals = new ArrayList<>();
    private List<Building> buildings = new ArrayList<>();
    
    // Resources (City mode)
    private double food = 0;
    private double gold = 0;
    private int population = 0;
    private int wellCount = 0;
    
    // Pathfinding
    private Queue<int[]> pathQueue = new LinkedList<>();
    private long lastMoveTime = 0;
    
    // Evolution tracking
    private int evolutionFrameCounter = 0;
    
    // View mode
    private String viewMode = "NORMAL";  // NORMAL, BIRDSEYE, DESIRABILITY, POL
    
    public Game(int seed) {
        this.seed = seed;
        this.noise = new Noise(seed);
    }
    
    /**
     * Initialize the game
     */
    public void init() {
        generateMap();
        spawnEntities();
        spawnPlayer();
        System.out.println("Game initialized with seed: " + seed);
    }
    
    /**
     * Generate the terrain map using noise
     */
    private void generateMap() {
        tiles = new Tile[Config.MAP_WIDTH][Config.MAP_HEIGHT];
        
        for (int x = 0; x < Config.MAP_WIDTH; x++) {
            for (int y = 0; y < Config.MAP_HEIGHT; y++) {
                tiles[x][y] = new Tile(x, y);
                
                // Generate height using FBM
                double nx = (double) x / Config.MAP_WIDTH;
                double ny = (double) y / Config.MAP_HEIGHT;
                double height = noise.fbm(nx * 8, ny * 8);
                tiles[x][y].setHeight(height);
                
                // Determine terrain type based on height
                TerrainType type;
                if (height < 0.2) {
                    type = TerrainType.DEEP;
                } else if (height < 0.3) {
                    type = TerrainType.WATER;
                } else if (height < 0.35) {
                    type = TerrainType.SAND;
                } else if (height < 0.6) {
                    type = TerrainType.GRASS;
                } else if (height < 0.7) {
                    type = TerrainType.FOREST;
                } else if (height < 0.85) {
                    type = TerrainType.ROCK;
                } else {
                    type = TerrainType.SNOW;
                }
                tiles[x][y].setType(type);
                
                // Add trees to forest and some grass tiles
                if (type == TerrainType.FOREST || 
                    (type == TerrainType.GRASS && Math.random() < 0.1)) {
                    tiles[x][y].setTree(true);
                }
            }
        }
        
        // Generate rivers
        generateRivers();
        
        System.out.println("Map generated: " + Config.MAP_WIDTH + "x" + Config.MAP_HEIGHT);
    }
    
    /**
     * Generate rivers across the map
     */
    private void generateRivers() {
        // Simple river generation - start from mountains, flow to water
        int riverCount = 5 + (int)(Math.random() * 5);
        
        for (int r = 0; r < riverCount; r++) {
            // Find a high point to start
            int startX = (int)(Math.random() * Config.MAP_WIDTH);
            int startY = (int)(Math.random() * Config.MAP_HEIGHT);
            
            // Flow downhill
            int x = startX;
            int y = startY;
            
            for (int step = 0; step < 100; step++) {
                if (x < 0 || x >= Config.MAP_WIDTH || y < 0 || y >= Config.MAP_HEIGHT) break;
                
                Tile tile = tiles[x][y];
                if (tile.getType() == TerrainType.DEEP || tile.getType() == TerrainType.WATER) break;
                
                if (tile.getType() == TerrainType.GRASS || tile.getType() == TerrainType.SAND) {
                    tile.setType(TerrainType.RIVER);
                    tile.setTree(false);
                }
                
                // Find lowest neighbor
                double minHeight = tile.getHeight();
                int nextX = x, nextY = y;
                
                int[][] dirs = {{0,-1}, {0,1}, {-1,0}, {1,0}};
                for (int[] dir : dirs) {
                    int nx = x + dir[0];
                    int ny = y + dir[1];
                    if (nx >= 0 && nx < Config.MAP_WIDTH && ny >= 0 && ny < Config.MAP_HEIGHT) {
                        if (tiles[nx][ny].getHeight() < minHeight) {
                            minHeight = tiles[nx][ny].getHeight();
                            nextX = nx;
                            nextY = ny;
                        }
                    }
                }
                
                if (nextX == x && nextY == y) {
                    // No lower neighbor, add some randomness
                    int[] dir = dirs[(int)(Math.random() * 4)];
                    nextX = x + dir[0];
                    nextY = y + dir[1];
                }
                
                x = nextX;
                y = nextY;
            }
        }
    }
    
    /**
     * Spawn entities (berries, nomads, animals, stone deposits)
     */
    private void spawnEntities() {
        // Spawn berries
        for (int i = 0; i < Config.BERRY_SPAWN_COUNT; i++) {
            int x = (int)(Math.random() * Config.MAP_WIDTH);
            int y = (int)(Math.random() * Config.MAP_HEIGHT);
            Tile tile = tiles[x][y];
            
            if (tile.isPassable() && tile.getEntity() == null) {
                tile.setEntity(new Berry(x, y));
            }
        }
        
        // Spawn nomads
        for (int i = 0; i < Config.NOMAD_SPAWN_COUNT; i++) {
            int x = (int)(Math.random() * Config.MAP_WIDTH);
            int y = (int)(Math.random() * Config.MAP_HEIGHT);
            Tile tile = tiles[x][y];
            
            if (tile.isPassable() && tile.getEntity() == null) {
                tile.setEntity(new Nomad(x, y));
            }
        }
        
        // Spawn animals
        for (int i = 0; i < Config.ANIMAL_SPAWN_COUNT; i++) {
            int x = (int)(Math.random() * Config.MAP_WIDTH);
            int y = (int)(Math.random() * Config.MAP_HEIGHT);
            Tile tile = tiles[x][y];
            
            if (tile.isPassable() && tile.getAnimal() == null) {
                Animal animal = new Animal(x, y);
                tile.setAnimal(animal);
                animals.add(animal);
            }
        }
        
        // Spawn stone deposits
        for (int i = 0; i < 80; i++) {
            int x = (int)(Math.random() * Config.MAP_WIDTH);
            int y = (int)(Math.random() * Config.MAP_HEIGHT);
            Tile tile = tiles[x][y];
            
            if (tile.getType() == TerrainType.ROCK || tile.getType() == TerrainType.GRASS) {
                tile.setStoneDeposit(new StoneDeposit(x, y));
            }
        }
        
        System.out.println("Entities spawned: " + Config.BERRY_SPAWN_COUNT + " berries, " +
            Config.NOMAD_SPAWN_COUNT + " nomads, " + animals.size() + " animals");
    }
    
    /**
     * Spawn the player at a valid starting location
     */
    private void spawnPlayer() {
        // Find a grass tile near center
        int centerX = Config.MAP_WIDTH / 2;
        int centerY = Config.MAP_HEIGHT / 2;
        
        for (int radius = 0; radius < 50; radius++) {
            for (int dx = -radius; dx <= radius; dx++) {
                for (int dy = -radius; dy <= radius; dy++) {
                    int x = centerX + dx;
                    int y = centerY + dy;
                    
                    if (x >= 0 && x < Config.MAP_WIDTH && y >= 0 && y < Config.MAP_HEIGHT) {
                        Tile tile = tiles[x][y];
                        if (tile.isPassable() && tile.getEntity() == null) {
                            player = new Player(x, y);
                            exploreArea(x, y, player.getVisionRadius());
                            System.out.println("Player spawned at: " + x + ", " + y);
                            return;
                        }
                    }
                }
            }
        }
        
        // Fallback - spawn at center anyway
        player = new Player(centerX, centerY);
    }
    
    /**
     * Explore area around a point
     */
    public void exploreArea(int centerX, int centerY, int radius) {
        for (int dx = -radius; dx <= radius; dx++) {
            for (int dy = -radius; dy <= radius; dy++) {
                int x = centerX + dx;
                int y = centerY + dy;
                
                if (x >= 0 && x < Config.MAP_WIDTH && y >= 0 && y < Config.MAP_HEIGHT) {
                    tiles[x][y].setExplored(true);
                }
            }
        }
    }
    
    /**
     * Move player in a direction
     * @return true if move was successful
     */
    public boolean movePlayer(int dx, int dy) {
        if (player == null || gameState != GameState.WANDER) return false;
        
        // Check if player has food
        if (player.getInventory().getFood() <= 0 && dx != 0 && dy != 0) {
            return false;
        }
        
        int newX = player.getX() + dx;
        int newY = player.getY() + dy;
        
        // Bounds check
        if (newX < 0 || newX >= Config.MAP_WIDTH || newY < 0 || newY >= Config.MAP_HEIGHT) {
            return false;
        }
        
        Tile tile = tiles[newX][newY];
        
        // Check if tile is passable
        if (!tile.isPassable() && tile.getType() != TerrainType.FOREST) {
            return false;
        }
        
        // Update direction
        if (dx > 0) player.setDirection("right");
        else if (dx < 0) player.setDirection("left");
        else if (dy > 0) player.setDirection("down");
        else if (dy < 0) player.setDirection("up");
        
        // Move player
        player.setX(newX);
        player.setY(newY);
        
        // Handle movement costs and effects
        handleMovementEffects(tile);
        
        // Explore around player
        exploreArea(newX, newY, player.getVisionRadius());
        
        // Handle entity interactions
        handleEntityInteraction(tile);
        
        return true;
    }
    
    /**
     * Handle effects of moving to a tile
     */
    private void handleMovementEffects(Tile tile) {
        // Food cost for movement
        player.incrementFoodStepCounter();
        if (player.getFoodStepCounter() >= Config.STEPS_PER_FOOD) {
            player.resetFoodStepCounter();
            int foodCost = player.getPopulation() * Config.FOOD_PER_PERSON;
            player.getInventory().addFood(-foodCost);
            
            // Check for starvation
            if (player.getInventory().getFood() <= 0) {
                gameOver("STARVATION");
            }
        }
        
        // Thirst mechanic
        player.updateThirst();
        
        // Drink if on water
        if (tile.isDrinkable()) {
            player.drink();
        }
        
        // Check for thirst death
        if (player.getThirst() <= 0) {
            gameOver("THIRST");
        }
        
        // Collect wood from forest
        if (tile.getType() == TerrainType.FOREST) {
            double added = player.getInventory().tryAddWood(Config.WOOD_PER_STEP);
            if (added > 0) {
                player.setBashTime(System.currentTimeMillis());
            }
        }
        
        // Chop individual trees
        if (tile.hasTree()) {
            int woodAmount = 2 + (int)(Math.random() * 4);
            double added = player.getInventory().tryAddWood(woodAmount);
            if (added > 0) {
                tile.setTree(false);
                player.setBashTime(System.currentTimeMillis());
            }
        }
        
        // Rare finds on open ground
        if ((tile.getType() == TerrainType.GRASS || tile.getType() == TerrainType.SAND) &&
            Math.random() < Config.RARE_FIND_CHANCE) {
            if (Math.random() < Config.METAL_CHANCE) {
                player.getInventory().addMetal(Config.FIND_AMOUNT);
            } else {
                player.getInventory().addStone(Config.FIND_AMOUNT);
            }
        }
    }
    
    /**
     * Handle interaction with entity on tile
     */
    private void handleEntityInteraction(Tile tile) {
        Entity entity = tile.getEntity();
        if (entity != null && entity.isActive()) {
            entity.onInteract(player);
            
            if (!entity.isActive()) {
                tile.setEntity(null);
            }
            
            if (entity instanceof Nomad && !((Nomad)entity).isHostile()) {
                player.incrementNomadsFound();
                player.updateCapacity();
                exploreArea(player.getX(), player.getY(), 15);
            }
            
            // Check for player death
            if (player.isDead()) {
                gameOver("COMBAT");
            }
        }
        
        // Handle animal on tile (herd danger)
        Animal animal = tile.getAnimal();
        if (animal != null) {
            // Check for herd (adjacent animals)
            int adjacentAnimals = countAdjacentAnimals(tile.getX(), tile.getY());
            if (adjacentAnimals >= 2) {
                // Herd attack
                int damage = Math.min(2, (int)(player.getPopulation() * 0.1));
                player.takeDamage(damage);
                
                if (player.isDead()) {
                    gameOver("HERD_ATTACK");
                }
            }
        }
    }
    
    /**
     * Count animals adjacent to a position
     */
    private int countAdjacentAnimals(int x, int y) {
        int count = 0;
        int[][] dirs = {{-1,-1}, {-1,0}, {-1,1}, {0,-1}, {0,1}, {1,-1}, {1,0}, {1,1}};
        
        for (int[] dir : dirs) {
            int nx = x + dir[0];
            int ny = y + dir[1];
            
            if (nx >= 0 && nx < Config.MAP_WIDTH && ny >= 0 && ny < Config.MAP_HEIGHT) {
                if (tiles[nx][ny].getAnimal() != null) {
                    count++;
                }
            }
        }
        
        return count;
    }
    
    /**
     * Move player to a specific tile (pathfinding)
     */
    public void movePlayerToTile(int targetX, int targetY) {
        if (player == null) return;
        
        if (targetX < 0 || targetX >= Config.MAP_WIDTH || 
            targetY < 0 || targetY >= Config.MAP_HEIGHT) return;
        
        Tile tile = tiles[targetX][targetY];
        if (!tile.isPassable()) return;
        
        // Generate path
        pathQueue.clear();
        List<int[]> path = findPath(player.getX(), player.getY(), targetX, targetY);
        pathQueue.addAll(path);
    }
    
    /**
     * A* pathfinding
     */
    private List<int[]> findPath(int startX, int startY, int endX, int endY) {
        List<int[]> path = new ArrayList<>();
        
        // Simple A* implementation
        java.util.PriorityQueue<int[]> openSet = new java.util.PriorityQueue<>(
            (a, b) -> (a[2] + a[3]) - (b[2] + b[3])
        );
        java.util.Set<String> closedSet = new java.util.HashSet<>();
        java.util.Map<String, int[]> parents = new java.util.HashMap<>();
        
        // {x, y, g, h}
        openSet.add(new int[]{startX, startY, 0, Math.abs(endX - startX) + Math.abs(endY - startY)});
        
        while (!openSet.isEmpty()) {
            int[] current = openSet.poll();
            int cx = current[0];
            int cy = current[1];
            int g = current[2];
            
            if (cx == endX && cy == endY) {
                // Reconstruct path
                String key = cx + "," + cy;
                while (parents.containsKey(key)) {
                    path.add(0, new int[]{cx, cy});
                    int[] parent = parents.get(key);
                    cx = parent[0];
                    cy = parent[1];
                    key = cx + "," + cy;
                }
                return path;
            }
            
            String currentKey = cx + "," + cy;
            if (closedSet.contains(currentKey)) continue;
            closedSet.add(currentKey);
            
            // Check neighbors
            int[][] dirs = {{0,-1}, {0,1}, {-1,0}, {1,0}};
            for (int[] dir : dirs) {
                int nx = cx + dir[0];
                int ny = cy + dir[1];
                
                if (nx < 0 || nx >= Config.MAP_WIDTH || ny < 0 || ny >= Config.MAP_HEIGHT) continue;
                
                String neighborKey = nx + "," + ny;
                if (closedSet.contains(neighborKey)) continue;
                
                Tile tile = tiles[nx][ny];
                if (!tile.isPassable() && tile.getType() != TerrainType.FOREST) continue;
                
                int newG = g + 1;
                int h = Math.abs(endX - nx) + Math.abs(endY - ny);
                
                openSet.add(new int[]{nx, ny, newG, h});
                parents.put(neighborKey, new int[]{cx, cy});
            }
            
            // Limit search
            if (closedSet.size() > 1000) break;
        }
        
        return path;
    }
    
    /**
     * Process one step of pathfinding queue
     */
    public void processPath() {
        long now = System.currentTimeMillis();
        if (now - lastMoveTime < 150) return;
        
        if (!pathQueue.isEmpty()) {
            int[] next = pathQueue.peek();
            int dx = next[0] - player.getX();
            int dy = next[1] - player.getY();
            
            if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
                if (movePlayer(dx, dy)) {
                    pathQueue.poll();
                    lastMoveTime = now;
                } else {
                    pathQueue.clear();
                }
            } else {
                pathQueue.clear();
            }
        }
    }
    
    /**
     * Settle at current location (transition to CITY mode)
     */
    public boolean settleHere() {
        if (gameState != GameState.WANDER || player == null) return false;
        
        // Check requirements
        if (player.getPopulation() < Config.SETTLEMENT_MIN_POP) return false;
        if (player.getInventory().getFood() < Config.SETTLEMENT_MIN_FOOD) return false;
        if (player.getInventory().getWood() < Config.SETTLEMENT_MIN_WOOD) return false;
        
        // Transition to city mode
        gameState = GameState.CITY;
        
        // Transfer resources
        food = player.getInventory().getFood();
        population = player.getPopulation();
        
        System.out.println("Settlement founded at " + player.getX() + ", " + player.getY());
        
        return true;
    }
    
    /**
     * Build at a location
     */
    public boolean build(int x, int y, String buildingType) {
        if (gameState != GameState.CITY) return false;
        
        Tile tile = tiles[x][y];
        if (!tile.isBuildable()) return false;
        
        BuildingType type;
        int foodCost = 0;
        int woodCost = 0;
        
        switch (buildingType) {
            case "RES" -> {
                type = BuildingType.RES;
                foodCost = Config.RES_1_FOOD_COST;
                woodCost = Config.RES_1_WOOD_COST;
            }
            case "COM" -> {
                type = BuildingType.COM;
                foodCost = 200;
                woodCost = 200;
            }
            case "IND" -> {
                type = BuildingType.IND;
                foodCost = Config.IND_FOOD_COST;
                woodCost = Config.IND_WOOD_COST;
            }
            case "WELL" -> {
                type = BuildingType.WELL;
                foodCost = Config.WELL_FOOD_COST;
                woodCost = Config.WELL_WOOD_COST;
            }
            case "ROAD" -> {
                tile.setRoad(true);
                return true;
            }
            default -> {
                return false;
            }
        }
        
        // Check resources
        if (food < foodCost || player.getInventory().getWood() < woodCost) {
            return false;
        }
        
        // Deduct resources
        food -= foodCost;
        player.getInventory().addWood(-woodCost);
        
        // Create building
        Building building = new Building(type, x, y);
        tile.setBuilding(building);
        tile.setZone(buildingType.charAt(0));
        buildings.add(building);
        
        if (type == BuildingType.WELL) {
            wellCount++;
        }
        
        return true;
    }
    
    /**
     * Settle at current player location (transition from WANDER to CITY)
     */
    public void settle() {
        if (gameState != GameState.WANDER) return;
        if (player == null) return;
        
        // Check requirements
        Inventory inv = player.getInventory();
        if (player.getPopulation() < Config.SETTLE_MIN_POP) {
            System.out.println("Not enough population to settle!");
            return;
        }
        if (inv.getFood() < Config.SETTLE_MIN_FOOD) {
            System.out.println("Not enough food to settle!");
            return;
        }
        if (inv.getWood() < Config.SETTLE_MIN_WOOD) {
            System.out.println("Not enough wood to settle!");
            return;
        }
        
        // Transition to city mode
        gameState = GameState.CITY;
        
        // Transfer resources
        food = inv.getFood();
        population = player.getPopulation();
        
        // Create initial buildings
        int px = player.getX();
        int py = player.getY();
        
        // Build a starting residence
        if (tiles[px][py].isBuildable()) {
            Building res = new Building(px, py, BuildingType.RES, 1);
            res.setPopulation(population);
            tiles[px][py].setBuilding(res);
            buildings.add(res);
        }
        
        System.out.println("Settlement established at (" + px + ", " + py + ")!");
    }
    
    /**
     * End turn / pass year (alias for endTurn)
     */
    public void nextTurn() {
        endTurn();
    }
    
    /**
     * End turn / pass year
     */
    public void endTurn() {
        if (gameState != GameState.CITY) return;
        
        year++;
        
        // Process buildings
        for (Building b : buildings) {
            b.update();
        }
        
        // Food consumption
        double foodConsumed = population * Config.PERSON_EATS;
        food -= foodConsumed;
        
        // Food production from industrial
        long indCount = buildings.stream()
            .filter(b -> b.getType() == BuildingType.IND)
            .count();
        food += indCount * Config.INDUSTRIAL_FOOD_PER_TURN;
        
        // Water check
        int waterCapacity = wellCount * Config.WATER_WELL_CAPACITY;
        if (population > waterCapacity) {
            int deaths = (int)((population - waterCapacity) * Config.CRISIS_THIRST_DEATH);
            population = Math.max(0, population - deaths);
        }
        
        // Starvation check
        if (food < 0) {
            int deaths = (int)(population * Config.CRISIS_STARVATION_DEATH);
            population = Math.max(0, population - deaths);
            food = 0;
        }
        
        // Population growth
        if (food > population * 10) {
            int growth = (int)(population * 0.1);
            long housingCap = buildings.stream()
                .filter(b -> b.getType() == BuildingType.RES)
                .mapToInt(Building::getCapacity)
                .sum();
            
            if (population + growth <= housingCap) {
                population += growth;
            }
        }
        
        // Check for game over
        if (population <= 0) {
            gameOver("EXTINCTION");
        }
    }
    
    /**
     * Update building evolution (desirability-based)
     */
    public void updateBuildingEvolution() {
        evolutionFrameCounter++;
        if (evolutionFrameCounter < 300) return;
        evolutionFrameCounter = 0;
        
        if (gameState != GameState.CITY) return;
        
        for (Building b : buildings) {
            if (b.getType() == BuildingType.RES) {
                double desirability = calculateDesirability(b.getX(), b.getY(), b.getLevel());
                b.setDesirability(desirability);
                
                // Update variant based on desirability
                int newVariant;
                if (desirability < 0.1) newVariant = 0;
                else if (desirability < 0.4) newVariant = 1;
                else if (desirability < 0.7) newVariant = 2;
                else newVariant = 3;
                
                b.setVariant(newVariant);
            }
        }
    }
    
    /**
     * Calculate desirability for a tile
     */
    public double calculateDesirability(int x, int y, int level) {
        double score = 0.35;
        
        // Water proximity
        int waterDist = findNearestWater(x, y, 5);
        if (waterDist <= 5) {
            score += 0.30 * (1 - (waterDist / 6.0));
        }
        
        // Well proximity
        int wellDist = findNearestBuilding(x, y, BuildingType.WELL, 8);
        if (wellDist <= 8) {
            score += 0.25 * (1 - (wellDist / 9.0));
        }
        
        // Road connectivity
        int roadDist = findNearestRoad(x, y, 2);
        if (roadDist <= 2) {
            score += 0.20 * (1 - (roadDist / 3.0));
        }
        
        // Industrial penalty
        int indDist = findNearestBuilding(x, y, BuildingType.IND, 15);
        if (indDist < 15) {
            double penalty = indDist < 3 ? -0.20 : -0.20 * (1 - ((indDist - 3) / 12.0));
            score += penalty;
        }
        
        return Math.max(0, Math.min(1, score));
    }
    
    /**
     * Find nearest water tile
     */
    private int findNearestWater(int x, int y, int maxDist) {
        for (int d = 0; d <= maxDist; d++) {
            for (int dx = -d; dx <= d; dx++) {
                for (int dy = -d; dy <= d; dy++) {
                    if (Math.abs(dx) + Math.abs(dy) != d) continue;
                    
                    int nx = x + dx;
                    int ny = y + dy;
                    
                    if (nx >= 0 && nx < Config.MAP_WIDTH && ny >= 0 && ny < Config.MAP_HEIGHT) {
                        TerrainType type = tiles[nx][ny].getType();
                        if (type == TerrainType.WATER || type == TerrainType.RIVER) {
                            return d;
                        }
                    }
                }
            }
        }
        return maxDist + 1;
    }
    
    /**
     * Find nearest building of type
     */
    private int findNearestBuilding(int x, int y, BuildingType type, int maxDist) {
        int nearest = maxDist + 1;
        
        for (Building b : buildings) {
            if (b.getType() == type) {
                int dist = Math.abs(b.getX() - x) + Math.abs(b.getY() - y);
                if (dist < nearest) {
                    nearest = dist;
                }
            }
        }
        
        return nearest;
    }
    
    /**
     * Find nearest road
     */
    private int findNearestRoad(int x, int y, int maxDist) {
        for (int d = 0; d <= maxDist; d++) {
            for (int dx = -d; dx <= d; dx++) {
                for (int dy = -d; dy <= d; dy++) {
                    if (Math.abs(dx) + Math.abs(dy) != d) continue;
                    
                    int nx = x + dx;
                    int ny = y + dy;
                    
                    if (nx >= 0 && nx < Config.MAP_WIDTH && ny >= 0 && ny < Config.MAP_HEIGHT) {
                        if (tiles[nx][ny].hasRoad()) {
                            return d;
                        }
                    }
                }
            }
        }
        return maxDist + 1;
    }
    
    /**
     * Game over
     */
    private String gameOverReason = "";
    
    private void gameOver(String reason) {
        gameState = GameState.GAME_OVER;
        gameOverReason = reason;
        System.out.println("GAME OVER: " + reason);
    }
    
    public String getGameOverReason() {
        return gameOverReason;
    }
    
    /**
     * Process pathfinding queue (called each frame)
     */
    public void processPathQueue() {
        if (pathQueue.isEmpty() || player == null) return;
        
        long now = System.currentTimeMillis();
        if (now - lastMoveTime < 100) return; // Rate limit movement
        
        int[] next = pathQueue.poll();
        if (next != null) {
            int dx = next[0] - player.getX();
            int dy = next[1] - player.getY();
            movePlayer(dx, dy);
            lastMoveTime = now;
        }
    }
    
    /**
     * Set player target for pathfinding
     */
    public void setPlayerTarget(int targetX, int targetY) {
        if (player == null) return;
        if (targetX < 0 || targetX >= Config.MAP_WIDTH || targetY < 0 || targetY >= Config.MAP_HEIGHT) return;
        
        // Clear existing path
        pathQueue.clear();
        
        // Use A* to find path
        List<int[]> path = findPath(player.getX(), player.getY(), targetX, targetY);
        pathQueue.addAll(path);
    }
    
    /**
     * Get city inventory
     */
    public Inventory getCityInventory() {
        // Return a combined city inventory
        Inventory inv = new Inventory();
        inv.setFood((int) food);
        // Add resources from all storage buildings etc.
        return inv;
    }
    
    /**
     * Get settlement center coordinates
     */
    public int[] getSettlementCenter() {
        if (player != null) {
            return new int[]{player.getX(), player.getY()};
        }
        // Find center of buildings
        if (!buildings.isEmpty()) {
            int sumX = 0, sumY = 0;
            for (Building b : buildings) {
                sumX += b.getX();
                sumY += b.getY();
            }
            return new int[]{sumX / buildings.size(), sumY / buildings.size()};
        }
        return new int[]{Config.MAP_WIDTH / 2, Config.MAP_HEIGHT / 2};
    }
    
    /**
     * Get explored tile count
     */
    public int getExploredTiles() {
        int count = 0;
        for (int x = 0; x < Config.MAP_WIDTH; x++) {
            for (int y = 0; y < Config.MAP_HEIGHT; y++) {
                if (tiles[x][y].isExplored()) {
                    count++;
                }
            }
        }
        return count;
    }
    
    /**
     * Gather resource from tile
     */
    public void gather(int x, int y) {
        if (player == null) return;
        if (x < 0 || x >= Config.MAP_WIDTH || y < 0 || y >= Config.MAP_HEIGHT) return;
        
        Tile tile = tiles[x][y];
        Entity entity = tile.getEntity();
        
        if (entity instanceof Berry berry) {
            if (berry.isPoisonous()) {
                // Poisonous berry - lose population
                int loss = Math.max(1, player.getPopulation() / 4);
                player.setPopulation(player.getPopulation() - loss);
                System.out.println("Poisonous berry! Lost " + loss + " population");
            } else {
                player.getInventory().addFood(berry.getFoodValue());
            }
            tile.setEntity(null);
        }
    }
    
    /**
     * Hunt animal on tile
     */
    public void hunt(int x, int y) {
        if (player == null) return;
        if (x < 0 || x >= Config.MAP_WIDTH || y < 0 || y >= Config.MAP_HEIGHT) return;
        
        Tile tile = tiles[x][y];
        Animal animal = tile.getAnimal();
        
        if (animal != null && animal.isActive()) {
            player.getInventory().addFood(animal.getFoodYield());
            animal.setActive(false);
            tile.setAnimal(null);
            animals.remove(animal);
        }
    }
    
    /**
     * Chop tree on tile
     */
    public void chopTree(int x, int y) {
        if (player == null) return;
        if (x < 0 || x >= Config.MAP_WIDTH || y < 0 || y >= Config.MAP_HEIGHT) return;
        
        Tile tile = tiles[x][y];
        if (tile.hasTree()) {
            player.getInventory().addWood(Config.WOOD_PER_TREE);
            tile.setTree(false);
        }
    }
    
    /**
     * Mine stone from deposit
     */
    public void mineStone(int x, int y) {
        if (player == null) return;
        if (x < 0 || x >= Config.MAP_WIDTH || y < 0 || y >= Config.MAP_HEIGHT) return;
        
        Tile tile = tiles[x][y];
        StoneDeposit deposit = tile.getStoneDeposit();
        
        if (deposit != null && deposit.getRemaining() > 0) {
            int amount = Math.min(Config.STONE_PER_MINE, deposit.getRemaining());
            player.getInventory().addStone(amount);
            deposit.mine(amount);
            
            if (deposit.getRemaining() <= 0) {
                tile.setStoneDeposit(null);
            }
        }
    }
    
    /**
     * Talk to nomad on tile
     */
    public void talkToNomad(int x, int y) {
        if (player == null) return;
        if (x < 0 || x >= Config.MAP_WIDTH || y < 0 || y >= Config.MAP_HEIGHT) return;
        
        Tile tile = tiles[x][y];
        Entity entity = tile.getEntity();
        
        if (entity instanceof Nomad nomad) {
            if (nomad.isFriendly()) {
                // Recruit nomad
                int recruits = nomad.getGroupSize();
                player.setPopulation(player.getPopulation() + recruits);
                System.out.println("Recruited " + recruits + " nomads!");
            } else {
                // Hostile encounter - lose some population
                int loss = Math.max(1, (int)(player.getPopulation() * 0.2));
                player.setPopulation(player.getPopulation() - loss);
                System.out.println("Hostile nomads attacked! Lost " + loss + " population");
            }
            tile.setEntity(null);
        }
    }
    
    /**
     * Save game to file
     */
    public void save() {
        try (ObjectOutputStream out = new ObjectOutputStream(
                new FileOutputStream("civilzones_save.dat"))) {
            out.writeInt(seed);
            out.writeInt(year);
            out.writeObject(gameState);
            // Save more state...
            System.out.println("Game saved!");
        } catch (IOException e) {
            System.err.println("Failed to save: " + e.getMessage());
        }
    }
    
    /**
     * Load game from file
     */
    public void load() {
        try (ObjectInputStream in = new ObjectInputStream(
                new FileInputStream("civilzones_save.dat"))) {
            seed = in.readInt();
            year = in.readInt();
            gameState = (GameState) in.readObject();
            // Load more state...
            System.out.println("Game loaded!");
        } catch (IOException | ClassNotFoundException e) {
            System.err.println("Failed to load: " + e.getMessage());
        }
    }
    
    // Getters
    public GameState getGameState() { return gameState; }
    public int getSeed() { return seed; }
    public int getYear() { return year; }
    public int getCurrentTurn() { return year; }
    public Tile[][] getTiles() { return tiles; }
    public Player getPlayer() { return player; }
    public List<Animal> getAnimals() { return animals; }
    public List<Building> getBuildings() { return buildings; }
    public double getFood() { return food; }
    public double getGold() { return gold; }
    public int getPopulation() { return population; }
    public int getWellCount() { return wellCount; }
    public String getViewMode() { return viewMode; }
    public void setViewMode(String mode) { this.viewMode = mode; }
    
    public int getTotalPopulation() {
        int total = 0;
        for (Building b : buildings) {
            if (b.getType() == BuildingType.RES) {
                total += b.getPopulation();
            }
        }
        return total;
    }
    
    public int getTotalCapacity() {
        int total = 0;
        for (Building b : buildings) {
            if (b.getType() == BuildingType.RES) {
                total += b.getCapacity();
            }
        }
        return total;
    }
    
    public boolean isValid(int x, int y, String type) {
        if (x < 0 || x >= Config.MAP_WIDTH || y < 0 || y >= Config.MAP_HEIGHT) return false;
        return tiles[x][y].isBuildable();
    }
}
