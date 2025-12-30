package com.civilzones.renderer;

import com.civilzones.config.Config;
import com.civilzones.config.Colors;
import com.civilzones.entity.*;
import com.civilzones.game.*;

import javafx.scene.canvas.Canvas;
import javafx.scene.canvas.GraphicsContext;
import javafx.scene.paint.*;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;
import javafx.scene.text.TextAlignment;

import java.util.ArrayList;
import java.util.List;

/**
 * Game renderer using JavaFX Canvas
 * Converted from JavaScript Renderer object
 */
public class GameRenderer {
    
    private Canvas canvas;
    private GraphicsContext ctx;
    private Game game;
    
    // Animation
    private double time = 0;
    private List<Particle> particles = new ArrayList<>();
    
    public GameRenderer(Canvas canvas, Game game) {
        this.canvas = canvas;
        this.ctx = canvas.getGraphicsContext2D();
        this.game = game;
    }
    
    public void setGame(Game game) {
        this.game = game;
    }
    
    /**
     * Main render method
     */
    public void render(double camX, double camY, double camZoom) {
        if (game == null || game.getTiles() == null) return;
        
        time += 0.05;
        
        double w = canvas.getWidth();
        double h = canvas.getHeight();
        int T = Config.TILE_SIZE;
        
        // Clear canvas
        ctx.setFill(Color.BLACK);
        ctx.fillRect(0, 0, w, h);
        
        // Save transform
        ctx.save();
        
        // Apply camera transform
        ctx.translate(w / 2, h / 2);
        ctx.scale(camZoom, camZoom);
        ctx.translate(-camX, -camY);
        
        // Calculate visible tile range
        int startCol = Math.max(0, (int)((camX - w / camZoom / 2) / T));
        int endCol = Math.min(Config.MAP_WIDTH, (int)((camX + w / camZoom / 2) / T) + 1);
        int startRow = Math.max(0, (int)((camY - h / camZoom / 2) / T));
        int endRow = Math.min(Config.MAP_HEIGHT, (int)((camY + h / camZoom / 2) / T) + 1);
        
        Tile[][] tiles = game.getTiles();
        
        // Draw tiles
        for (int x = startCol; x < endCol; x++) {
            for (int y = startRow; y < endRow; y++) {
                Tile tile = tiles[x][y];
                
                // Fog of war
                if (!tile.isExplored()) {
                    ctx.setFill(Color.BLACK);
                    ctx.fillRect(x * T, y * T, T, T);
                    continue;
                }
                
                // Draw terrain
                drawTerrain(tile, x, y, T);
                
                // Draw features
                if (tile.hasRoad()) {
                    drawRoad(x, y, T);
                } else if (tile.hasTree() && tile.getBuilding() == null) {
                    drawTree(x, y, T, tile.getType());
                }
                
                // Draw stone deposits
                if (tile.getStoneDeposit() != null) {
                    drawStoneDeposit(x, y, T);
                }
                
                // Draw entities
                Entity entity = tile.getEntity();
                if (entity != null && entity.isActive()) {
                    if (entity instanceof Berry) {
                        drawBerry(x, y, T, (Berry) entity);
                    } else if (entity instanceof Nomad) {
                        drawNomad(x, y, T);
                    }
                }
                
                // Draw animals
                Animal animal = tile.getAnimal();
                if (animal != null && animal.isActive()) {
                    drawAnimal(x, y, T, animal);
                }
                
                // Draw buildings
                Building building = tile.getBuilding();
                if (building != null) {
                    drawBuilding(x, y, T, building);
                }
                
                // Draw desirability overlay
                if ("DESIRABILITY".equals(game.getViewMode())) {
                    drawDesirabilityOverlay(x, y, T);
                }
            }
        }
        
        // Draw player
        if (game.getPlayer() != null && game.getGameState() == GameState.WANDER) {
            drawPlayer(game.getPlayer(), T);
        }
        
        // Draw particles
        drawParticles();
        
        // Restore transform
        ctx.restore();
    }
    
    /**
     * Draw terrain tile
     */
    private void drawTerrain(Tile tile, int x, int y, int T) {
        TerrainType type = tile.getType();
        
        switch (type) {
            case GRASS -> drawGrass(x, y, T);
            case WATER, RIVER, DEEP -> drawWater(x, y, T, type);
            case SAND -> drawSand(x, y, T);
            case FOREST -> drawForest(x, y, T);
            case STONE, ROCK -> drawStone(x, y, T);
            case SNOW -> drawSnow(x, y, T);
            default -> {
                ctx.setFill(Colors.getTerrainColor(type.name()));
                ctx.fillRect(x * T, y * T, T, T);
            }
        }
        
        // Grid lines
        ctx.setStroke(Color.rgb(0, 0, 0, 0.15));
        ctx.setLineWidth(1);
        ctx.strokeRect(x * T, y * T, T, T);
    }
    
    /**
     * Draw grass tile (Yoshi's Island style)
     */
    private void drawGrass(int x, int y, int T) {
        // Gradient
        Stop[] stops = {
            new Stop(0, Color.web("#98FF98")),
            new Stop(0.5, Color.web("#78E878")),
            new Stop(1, Color.web("#58C858"))
        };
        LinearGradient gradient = new LinearGradient(
            0, 0, 0, 1, true, CycleMethod.NO_CYCLE, stops
        );
        ctx.setFill(gradient);
        ctx.fillRect(x * T, y * T, T, T);
        
        // Highlight
        ctx.setFill(Color.rgb(255, 255, 255, 0.5));
        ctx.fillRect(x * T, y * T, T, 4);
        
        // Grass tufts
        if ((x + y) % 3 == 0) {
            ctx.setFill(Color.web("#B0FFB0"));
            ctx.beginPath();
            ctx.moveTo(x * T + 10, y * T + T - 8);
            ctx.lineTo(x * T + 12, y * T + T - 16);
            ctx.lineTo(x * T + 14, y * T + T - 8);
            ctx.closePath();
            ctx.fill();
        }
        
        // Occasional flower
        if ((x * 3 + y * 7) % 11 == 0) {
            ctx.setFill(Color.web("#FFD0D0"));
            ctx.fillOval(x * T + 16, y * T + 20, 8, 8);
            ctx.setFill(Color.web("#FFFF80"));
            ctx.fillOval(x * T + 18, y * T + 22, 4, 4);
        }
    }
    
    /**
     * Draw water tile (animated)
     */
    private void drawWater(int x, int y, int T, TerrainType type) {
        Stop[] stops;
        if (type == TerrainType.DEEP) {
            stops = new Stop[]{
                new Stop(0, Color.web("#78A8FF")),
                new Stop(1, Color.web("#5890E8"))
            };
        } else if (type == TerrainType.WATER) {
            stops = new Stop[]{
                new Stop(0, Color.web("#B0E0FF")),
                new Stop(1, Color.web("#78C8FF"))
            };
        } else {
            stops = new Stop[]{
                new Stop(0, Color.web("#C8F0FF")),
                new Stop(1, Color.web("#A0DCFF"))
            };
        }
        
        LinearGradient gradient = new LinearGradient(
            0, 0, 0, 1, true, CycleMethod.NO_CYCLE, stops
        );
        ctx.setFill(gradient);
        ctx.fillRect(x * T, y * T, T, T);
        
        // Wave highlight
        ctx.setFill(Color.rgb(255, 255, 255, 0.7));
        ctx.fillRect(x * T, y * T, T, 4);
        
        // Animated sparkles
        ctx.setFill(Color.rgb(255, 255, 255, 0.8));
        double sparkle1 = Math.sin(time * 1.5 + x * 0.5 + y) * 3;
        double sparkle2 = Math.cos(time * 1.2 + x + y * 0.5) * 3;
        ctx.fillOval(x * T + 12 + sparkle1 - 3, y * T + 14 - 3, 6, 6);
        ctx.fillOval(x * T + T - 14 + sparkle2 - 2.5, y * T + T - 16 - 2.5, 5, 5);
    }
    
    /**
     * Draw sand tile
     */
    private void drawSand(int x, int y, int T) {
        Stop[] stops = {
            new Stop(0, Color.web("#FFFFC8")),
            new Stop(0.5, Color.web("#FFE8A0")),
            new Stop(1, Color.web("#F8D880"))
        };
        LinearGradient gradient = new LinearGradient(
            0, 0, 0, 1, true, CycleMethod.NO_CYCLE, stops
        );
        ctx.setFill(gradient);
        ctx.fillRect(x * T, y * T, T, T);
        
        // Highlight
        ctx.setFill(Color.rgb(255, 255, 240, 0.8));
        ctx.fillRect(x * T, y * T, T, 3);
    }
    
    /**
     * Draw forest tile
     */
    private void drawForest(int x, int y, int T) {
        Stop[] stops = {
            new Stop(0, Color.web("#60C860")),
            new Stop(0.5, Color.web("#48B848")),
            new Stop(1, Color.web("#38A038"))
        };
        LinearGradient gradient = new LinearGradient(
            0, 0, 0, 1, true, CycleMethod.NO_CYCLE, stops
        );
        ctx.setFill(gradient);
        ctx.fillRect(x * T, y * T, T, T);
        
        // Dappled light
        if ((x + y) % 2 == 0) {
            ctx.setFill(Color.rgb(180, 255, 180, 0.4));
            ctx.fillOval(x * T + 6, y * T + 12, 12, 8);
        }
    }
    
    /**
     * Draw stone/rock tile
     */
    private void drawStone(int x, int y, int T) {
        Stop[] stops = {
            new Stop(0, Color.web("#C8C8D8")),
            new Stop(0.5, Color.web("#B0B0C0")),
            new Stop(1, Color.web("#9898A8"))
        };
        LinearGradient gradient = new LinearGradient(
            0, 0, 0, 1, true, CycleMethod.NO_CYCLE, stops
        );
        ctx.setFill(gradient);
        ctx.fillRect(x * T, y * T, T, T);
        
        // Highlight
        ctx.setFill(Color.rgb(255, 255, 255, 0.6));
        ctx.fillRect(x * T, y * T, T, 5);
        ctx.fillRect(x * T, y * T, 5, T);
    }
    
    /**
     * Draw snow tile
     */
    private void drawSnow(int x, int y, int T) {
        ctx.setFill(Color.web("#F8F8FF"));
        ctx.fillRect(x * T, y * T, T, T);
        
        // Sparkles
        ctx.setFill(Color.rgb(255, 255, 255, 0.8));
        ctx.fillOval(x * T + 8, y * T + 12, 3, 3);
        ctx.fillOval(x * T + 28, y * T + 26, 2, 2);
    }
    
    /**
     * Draw tree
     */
    private void drawTree(int x, int y, int T, TerrainType terrain) {
        double cx = x * T + T / 2.0;
        double cy = y * T + T / 2.0;
        
        // Trunk
        ctx.setFill(Color.web("#5D4037"));
        ctx.fillRect(cx - 3, cy + 5, 6, 15);
        
        // Foliage (pine tree shape)
        ctx.setFill(Color.web("#2E7D32"));
        ctx.beginPath();
        ctx.moveTo(cx, cy - 15);
        ctx.lineTo(cx - 12, cy + 5);
        ctx.lineTo(cx + 12, cy + 5);
        ctx.closePath();
        ctx.fill();
        
        // Second layer
        ctx.setFill(Color.web("#388E3C"));
        ctx.beginPath();
        ctx.moveTo(cx, cy - 8);
        ctx.lineTo(cx - 10, cy);
        ctx.lineTo(cx + 10, cy);
        ctx.closePath();
        ctx.fill();
    }
    
    /**
     * Draw road
     */
    private void drawRoad(int x, int y, int T) {
        ctx.setFill(Colors.ROAD);
        ctx.fillRect(x * T + 2, y * T + 2, T - 4, T - 4);
        
        // Road markings
        ctx.setFill(Color.rgb(255, 255, 255, 0.3));
        ctx.fillRect(x * T + T / 2 - 2, y * T + 4, 4, T - 8);
    }
    
    /**
     * Draw stone deposit
     */
    private void drawStoneDeposit(int x, int y, int T) {
        double cx = x * T + T / 2.0;
        double cy = y * T + T / 2.0;
        
        // Rock pile
        ctx.setFill(Color.web("#808080"));
        ctx.fillOval(cx - 10, cy - 5, 20, 15);
        ctx.fillOval(cx - 15, cy + 2, 15, 12);
        ctx.fillOval(cx + 2, cy + 5, 12, 10);
        
        // Highlight
        ctx.setFill(Color.rgb(255, 255, 255, 0.4));
        ctx.fillOval(cx - 8, cy - 3, 6, 4);
        
        // Ore sparkle
        ctx.setFill(Color.web("#FFD700"));
        ctx.fillOval(cx + 2, cy + 2, 3, 3);
    }
    
    /**
     * Draw berry bush
     */
    private void drawBerry(int x, int y, int T, Berry berry) {
        double bx = x * T + T / 2.0;
        double by = y * T + T / 2.0;
        
        // Bush base
        ctx.setFill(Color.web("#60C060"));
        ctx.fillOval(bx - 12, by + 4, 16, 12);
        ctx.fillOval(bx + 4, by + 4, 16, 12);
        ctx.fillOval(bx - 6, by - 2, 20, 14);
        
        // Berries
        Color berryColor = berry.isPoisonous() ? 
            Color.web("#C878F0") : Color.web("#FF6090");
        
        double[][] berryPositions = {{0, -8}, {-7, -2}, {7, -2}, {-4, 4}, {4, 4}};
        int count = 3 + (x + y) % 3;
        
        for (int i = 0; i < count && i < berryPositions.length; i++) {
            double bpx = bx + berryPositions[i][0];
            double bpy = by + berryPositions[i][1];
            
            ctx.setFill(berryColor);
            ctx.fillOval(bpx - 6, bpy - 6, 12, 12);
            
            // Highlight
            ctx.setFill(Color.rgb(255, 255, 255, 0.8));
            ctx.fillOval(bpx - 4, bpy - 4, 5, 5);
        }
    }
    
    /**
     * Draw nomad (cave painting style)
     */
    private void drawNomad(int x, int y, int T) {
        double nx = x * T + T / 2.0;
        double ny = y * T + T / 2.0;
        double scale = T / 64.0;
        
        ctx.setStroke(Color.web("#8B5A2B"));
        ctx.setLineWidth(2);
        
        // Head
        ctx.strokeOval(nx - 5 * scale, ny - 23 * scale, 10 * scale, 10 * scale);
        
        // Body
        ctx.strokeLine(nx, ny - 13 * scale, nx, ny + 5 * scale);
        
        // Arms
        ctx.strokeLine(nx, ny - 8 * scale, nx - 8 * scale, ny - 15 * scale);
        ctx.strokeLine(nx, ny - 8 * scale, nx + 8 * scale, ny - 2 * scale);
        
        // Legs
        ctx.strokeLine(nx, ny + 5 * scale, nx - 6 * scale, ny + 15 * scale);
        ctx.strokeLine(nx, ny + 5 * scale, nx + 6 * scale, ny + 15 * scale);
        
        // Spear
        ctx.setStroke(Color.web("#8B7355"));
        ctx.setLineWidth(1.5);
        ctx.strokeLine(nx - 8 * scale, ny - 15 * scale, nx - 10 * scale, ny - 28 * scale);
        
        // Spear tip
        ctx.setFill(Color.web("#555555"));
        ctx.beginPath();
        ctx.moveTo(nx - 10 * scale, ny - 28 * scale);
        ctx.lineTo(nx - 12 * scale, ny - 24 * scale);
        ctx.lineTo(nx - 8 * scale, ny - 24 * scale);
        ctx.closePath();
        ctx.fill();
    }
    
    /**
     * Draw animal
     */
    private void drawAnimal(int x, int y, int T, Animal animal) {
        double ax = x * T + T / 2.0;
        double ay = y * T + T / 2.0;
        
        String emoji = animal.getEmoji();
        ctx.setFont(Font.font("System", FontWeight.BOLD, T * 0.6));
        ctx.setTextAlign(TextAlignment.CENTER);
        ctx.setFill(Color.BLACK);
        ctx.fillText(emoji, ax, ay + T * 0.15);
    }
    
    /**
     * Draw building
     */
    private void drawBuilding(int x, int y, int T, Building building) {
        switch (building.getType()) {
            case RES -> drawResidential(x, y, T, building);
            case COM, CAMPFIRE -> drawCommercial(x, y, T, building);
            case IND, HUNTING_GROUND -> drawIndustrial(x, y, T, building);
            case WELL -> drawWell(x, y, T);
            default -> drawGenericBuilding(x, y, T, building);
        }
    }
    
    /**
     * Draw residential building
     */
    private void drawResidential(int x, int y, int T, Building building) {
        int variant = building.getVariant();
        
        // Colors based on variant
        Color[] colors = {
            Color.rgb(101, 67, 33, 0.8),    // Abandoned
            Color.rgb(141, 110, 99, 0.85),  // Low
            Color.rgb(180, 140, 100, 0.9),  // Medium
            Color.rgb(212, 180, 130, 0.95)  // High
        };
        
        ctx.setFill(colors[Math.min(variant, colors.length - 1)]);
        ctx.fillRect(x * T + 2, y * T + 2, T - 4, T - 4);
        
        // Label
        ctx.setFill(Color.WHITE);
        ctx.setFont(Font.font("System", FontWeight.BOLD, T / 5.0));
        ctx.setTextAlign(TextAlignment.CENTER);
        
        double cx = x * T + T / 2.0;
        double cy = y * T + T / 2.0;
        
        ctx.fillText("👥" + building.getPopulation() + "/" + building.getCapacity(), 
            cx, y * T + T / 5.0 + 10);
        ctx.fillText(building.getVariantName(), cx, cy + 2);
        ctx.fillText("L" + building.getLevel(), cx, y * T + T - 4);
    }
    
    /**
     * Draw commercial building (campfire)
     */
    private void drawCommercial(int x, int y, int T, Building building) {
        int variant = building.getVariant();
        double cx = x * T + T / 2.0;
        double cy = y * T + T / 2.0;
        
        // Ground
        ctx.setFill(Color.web("#8B7355"));
        ctx.fillOval(cx - T * 0.42, cy - T * 0.22, T * 0.84, T * 0.64);
        
        // Stone ring
        ctx.setFill(Color.web("#696969"));
        for (int i = 0; i < 8; i++) {
            double angle = (i / 8.0) * Math.PI * 2;
            ctx.fillOval(
                cx + Math.cos(angle) * T * 0.25 - T * 0.04,
                cy + Math.sin(angle) * T * 0.18 - T * 0.03,
                T * 0.08, T * 0.06
            );
        }
        
        // Fire (if active)
        if (variant > 0) {
            // Glow
            RadialGradient glow = new RadialGradient(
                0, 0, cx, cy - T * 0.05, T * 0.25, false, CycleMethod.NO_CYCLE,
                new Stop(0, Color.rgb(255, 100, 0, 0.4)),
                new Stop(1, Color.rgb(255, 100, 0, 0))
            );
            ctx.setFill(glow);
            ctx.fillOval(cx - T * 0.25, cy - T * 0.3, T * 0.5, T * 0.5);
            
            // Flame
            double flameHeight = T * (0.2 + variant * 0.08);
            ctx.setFill(Color.web("#FF6600"));
            ctx.beginPath();
            ctx.moveTo(cx - T * 0.1, cy);
            ctx.quadraticCurveTo(cx - T * 0.15, cy - flameHeight * 0.6, cx, cy - flameHeight);
            ctx.quadraticCurveTo(cx + T * 0.15, cy - flameHeight * 0.6, cx + T * 0.1, cy);
            ctx.closePath();
            ctx.fill();
            
            // Inner flame
            ctx.setFill(Color.web("#FFCC00"));
            ctx.beginPath();
            ctx.moveTo(cx - T * 0.05, cy);
            ctx.quadraticCurveTo(cx - T * 0.08, cy - flameHeight * 0.4, cx, cy - flameHeight * 0.7);
            ctx.quadraticCurveTo(cx + T * 0.08, cy - flameHeight * 0.4, cx + T * 0.05, cy);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    /**
     * Draw industrial building
     */
    private void drawIndustrial(int x, int y, int T, Building building) {
        int variant = building.getVariant();
        
        Color color = variant == 3 ? Color.web("#FF5722") : Color.web("#8D6E63");
        if (variant == 0) color = Color.web("#424242");
        
        ctx.setFill(color);
        ctx.fillRect(x * T + 2, y * T + 2, T - 4, T - 4);
        
        // Border
        ctx.setStroke(variant == 3 ? Color.web("#FFD700") : Color.web("#333333"));
        ctx.setLineWidth(variant == 3 ? 2 : 1);
        ctx.strokeRect(x * T + 2, y * T + 2, T - 4, T - 4);
        
        // Label
        double cx = x * T + T / 2.0;
        ctx.setFill(Color.WHITE);
        ctx.setFont(Font.font("System", FontWeight.BOLD, 16));
        ctx.setTextAlign(TextAlignment.CENTER);
        ctx.fillText("I", cx, y * T + T / 2.0 - 5);
        ctx.setFont(Font.font("System", FontWeight.BOLD, 10));
        ctx.fillText("L" + building.getLevel(), cx, y * T + T / 2.0 + 15);
    }
    
    /**
     * Draw well
     */
    private void drawWell(int x, int y, int T) {
        double cx = x * T + T * 0.5;
        double cy = y * T + T * 0.55;
        
        // Shadow
        ctx.setFill(Color.rgb(0, 0, 0, 0.25));
        ctx.fillOval(cx + T * 0.04, cy + T * 0.05, T * 0.36, T * 0.18);
        
        // Rim
        ctx.setFill(Color.web("#8D6E63"));
        ctx.fillOval(cx - T * 0.18, cy - T * 0.12, T * 0.36, T * 0.24);
        
        // Water
        ctx.setFill(Color.web("#81D4FA"));
        ctx.fillOval(cx - T * 0.12, cy - T * 0.08, T * 0.24, T * 0.16);
        
        // Posts
        ctx.setFill(Color.web("#6D4C41"));
        ctx.fillRect(cx - T * 0.16, cy - T * 0.22, T * 0.04, T * 0.22);
        ctx.fillRect(cx + T * 0.12, cy - T * 0.22, T * 0.04, T * 0.22);
        
        // Crossbeam
        ctx.setFill(Color.web("#8D6E63"));
        ctx.fillRect(cx - T * 0.16, cy - T * 0.24, T * 0.36, T * 0.03);
    }
    
    /**
     * Draw generic building
     */
    private void drawGenericBuilding(int x, int y, int T, Building building) {
        ctx.setFill(Colors.getBuildingColor(building.getType().name()));
        ctx.fillRect(x * T + 2, y * T + 2, T - 4, T - 4);
        
        ctx.setFill(Color.WHITE);
        ctx.setFont(Font.font("System", FontWeight.BOLD, 10));
        ctx.setTextAlign(TextAlignment.CENTER);
        ctx.fillText(building.getType().name(), x * T + T / 2.0, y * T + T / 2.0);
    }
    
    /**
     * Draw player (Fred Flintstone style)
     */
    private void drawPlayer(Player player, int T) {
        double px = player.getX() * T + T / 2.0;
        double py = player.getY() * T + T / 2.0;
        double scale = T / 64.0;
        
        String dir = player.getDirection();
        int facing = "right".equals(dir) ? 1 : "left".equals(dir) ? -1 : 0;
        
        // Shadow
        ctx.setFill(Color.rgb(0, 0, 0, 0.25));
        ctx.fillOval(px - 14 * scale, py + 15 * scale, 28 * scale, 10 * scale);
        
        // Feet
        ctx.setFill(Color.web("#E8B090"));
        ctx.fillOval(px - 10 * scale, py + 12 * scale, 12 * scale, 8 * scale);
        ctx.fillOval(px + 0 * scale, py + 12 * scale, 12 * scale, 8 * scale);
        
        // Body (leopard skin)
        ctx.setFill(Color.web("#D2691E"));
        ctx.beginPath();
        ctx.moveTo(px - 12 * scale, py + 8 * scale);
        ctx.lineTo(px + 12 * scale, py + 8 * scale);
        ctx.lineTo(px + 10 * scale, py - 8 * scale);
        ctx.lineTo(px - 10 * scale, py - 8 * scale);
        ctx.closePath();
        ctx.fill();
        
        // Black spots
        ctx.setFill(Color.BLACK);
        ctx.fillOval(px - 6 * scale, py - 2 * scale, 4 * scale, 4 * scale);
        ctx.fillOval(px + 3 * scale, py - 5 * scale, 4 * scale, 4 * scale);
        
        // Head
        ctx.setFill(Color.web("#E8B090"));
        ctx.fillOval(px - 12 * scale, py - 28 * scale, 24 * scale, 24 * scale);
        
        // Hair
        ctx.setFill(Color.web("#1a1a1a"));
        ctx.fillOval(px - 10 * scale, py - 29 * scale, 10 * scale, 10 * scale);
        ctx.fillOval(px - 5 * scale, py - 32 * scale, 10 * scale, 10 * scale);
        ctx.fillOval(px + 1 * scale, py - 31 * scale, 10 * scale, 10 * scale);
        ctx.fillOval(px + 6 * scale, py - 27 * scale, 8 * scale, 8 * scale);
        
        // Eyes
        ctx.setFill(Color.WHITE);
        ctx.fillOval(px - 9 * scale, py - 23 * scale, 8 * scale, 10 * scale);
        ctx.fillOval(px + 1 * scale, py - 23 * scale, 8 * scale, 10 * scale);
        
        // Pupils
        ctx.setFill(Color.BLACK);
        ctx.fillOval(px - 6 * scale + facing * scale, py - 19 * scale, 4 * scale, 4 * scale);
        ctx.fillOval(px + 4 * scale + facing * scale, py - 19 * scale, 4 * scale, 4 * scale);
        
        // Nose
        ctx.setFill(Color.web("#E8B090"));
        ctx.fillOval(px - 3 * scale + 2 * facing * scale, py - 19 * scale, 10 * scale, 10 * scale);
    }
    
    /**
     * Draw desirability overlay
     */
    private void drawDesirabilityOverlay(int x, int y, int T) {
        double desirability = game.calculateDesirability(x, y, 1);
        
        int r, g, b;
        if (desirability < 0.3) {
            r = 255;
            g = (int)(desirability * 850);
            b = 0;
        } else if (desirability < 0.7) {
            r = (int)(255 - (desirability - 0.3) * 600);
            g = 255;
            b = 0;
        } else if (desirability < 1.2) {
            r = 0;
            g = 255;
            b = (int)((desirability - 0.7) * 510);
        } else {
            r = 0;
            g = (int)(255 - (desirability - 1.2) * 200);
            b = 255;
        }
        
        ctx.setFill(Color.rgb(r, g, b, 0.5));
        ctx.fillRect(x * T, y * T, T, T);
    }
    
    /**
     * Draw particles
     */
    private void drawParticles() {
        for (int i = particles.size() - 1; i >= 0; i--) {
            Particle p = particles.get(i);
            p.y -= 1;
            p.life--;
            
            ctx.setFill(p.color);
            ctx.fillOval(p.x - 2.5, p.y - 2.5, 5, 5);
            
            if (p.life <= 0) {
                particles.remove(i);
            }
        }
    }
    
    /**
     * Add a particle
     */
    public void addParticle(double x, double y, int life, Color color) {
        particles.add(new Particle(x, y, life, color));
    }
    
    /**
     * Inner class for particles
     */
    private static class Particle {
        double x, y;
        int life;
        Color color;
        
        Particle(double x, double y, int life, Color color) {
            this.x = x;
            this.y = y;
            this.life = life;
            this.color = color;
        }
    }
}
