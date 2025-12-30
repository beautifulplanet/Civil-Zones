package com.civilzones;

import com.civilzones.game.Game;
import com.civilzones.game.GameState;
import com.civilzones.renderer.GameRenderer;
import com.civilzones.ui.GameUI;
import com.civilzones.config.Config;
import com.civilzones.ai.QLearningAI;

import javafx.application.Application;
import javafx.application.Platform;
import javafx.geometry.Insets;
import javafx.scene.Scene;
import javafx.scene.canvas.Canvas;
import javafx.scene.input.KeyCode;
import javafx.scene.input.MouseButton;
import javafx.scene.layout.*;

import javafx.stage.Stage;
import javafx.animation.AnimationTimer;

/**
 * Civil Zones v48.0 - Historical Zoning Simulator
 * 
 * A city-building game converted from JavaScript to Java/JavaFX.
 * 
 * Original game features:
 * - Exploration/wandering phase with nomad recruitment
 * - Settlement building with resource management
 * - Q-Learning AI for automated play
 * - Multiple building types and levels
 * - Desirability-based building evolution
 * 
 * @author Converted to Java
 * @version 48.0
 */
public class CivilZonesApp extends Application {
    
    // Core game components
    private Game game;
    private GameRenderer renderer;
    private GameUI gameUI;
    private QLearningAI ai;
    
    // JavaFX components
    private Canvas canvas;
    private Stage primaryStage;
    
    // Camera state
    private double camX = Config.MAP_WIDTH * Config.TILE_SIZE / 2.0;
    private double camY = Config.MAP_HEIGHT * Config.TILE_SIZE / 2.0;
    private double camZoom = 1.0;
    
    // Input state
    private double lastMouseX;
    private double lastMouseY;
    private boolean isPanning = false;
    private String selectedBuildType = null;
    
    // Animation
    private AnimationTimer gameLoop;
    private long lastUpdate = 0;
    
    // Constants
    private static final double ZOOM_MIN = 0.25;
    private static final double ZOOM_MAX = 4.0;
    private static final double ZOOM_STEP = 1.1;
    
    @Override
    public void start(Stage primaryStage) {
        this.primaryStage = primaryStage;
        primaryStage.setTitle("Civil Zones v48.0 - Historical Zoning Simulator");
        
        // Initialize game
        initializeGame();
        
        // Create UI layout
        BorderPane root = createLayout();
        
        // Create scene
        Scene scene = new Scene(root, 1200, 800);
        
        // Try to load stylesheet (optional)
        try {
            var cssUrl = getClass().getResource("/styles/game.css");
            if (cssUrl != null) {
                scene.getStylesheets().add(cssUrl.toExternalForm());
            }
        } catch (Exception e) {
            System.out.println("CSS not loaded, using default styles");
        }
        
        // Set up input handlers
        setupInputHandlers(scene);
        
        // Start game loop
        startGameLoop();
        
        primaryStage.setScene(scene);
        primaryStage.setOnCloseRequest(e -> {
            stopGameLoop();
            Platform.exit();
        });
        primaryStage.show();
        
        // Initial render
        renderer.render(camX, camY, camZoom);
        gameUI.updateDashboard();
        
        System.out.println("Civil Zones v48.0 started successfully!");
    }
    
    private void initializeGame() {
        // Create game with random seed
        int seed = (int)(Math.random() * 100000);
        game = new Game(seed);
        game.init();
        
        // Create canvas
        canvas = new Canvas(800, 600);
        
        // Create renderer
        renderer = new GameRenderer(canvas, game);
        
        // Create UI
        gameUI = new GameUI(game);
        
        // Create AI
        ai = new QLearningAI(game);
        gameUI.setAI(ai);
        
        // Set callbacks
        gameUI.setBuildCallback(type -> selectedBuildType = type);
        gameUI.setNextTurnCallback(() -> {
            game.nextTurn();
            gameUI.updateDashboard();
        });
        
        // Center camera on player
        if (game.getPlayer() != null) {
            camX = game.getPlayer().getX() * Config.TILE_SIZE;
            camY = game.getPlayer().getY() * Config.TILE_SIZE;
        }
    }
    
    private BorderPane createLayout() {
        BorderPane root = new BorderPane();
        root.setStyle("-fx-background-color: #0a0a0f;");
        
        // Top toolbar
        root.setTop(gameUI.getToolbar());
        
        // Center: canvas with resize binding
        StackPane canvasContainer = new StackPane(canvas);
        canvasContainer.setStyle("-fx-background-color: black;");
        root.setCenter(canvasContainer);
        
        // Make canvas resize with window
        canvas.widthProperty().bind(canvasContainer.widthProperty());
        canvas.heightProperty().bind(canvasContainer.heightProperty());
        
        // Add toast container over canvas
        StackPane centerStack = new StackPane(canvasContainer, gameUI.getToastContainer());
        root.setCenter(centerStack);
        
        // Left dashboard
        VBox dashboard = gameUI.getDashboard();
        dashboard.setMinWidth(200);
        dashboard.setMaxWidth(250);
        root.setLeft(dashboard);
        
        // Right AI panel
        VBox aiPanel = gameUI.getAIPanel();
        aiPanel.setMinWidth(180);
        aiPanel.setMaxWidth(200);
        root.setRight(aiPanel);
        
        // Add game over overlay
        root.getChildren().add(gameUI.getOverlay());
        
        return root;
    }
    
    private void setupInputHandlers(Scene scene) {
        // Keyboard input
        scene.setOnKeyPressed(e -> {
            if (game.getGameState() == GameState.WANDER) {
                switch (e.getCode()) {
                    case W, UP -> game.movePlayer(0, -1);
                    case S, DOWN -> game.movePlayer(0, 1);
                    case A, LEFT -> game.movePlayer(-1, 0);
                    case D, RIGHT -> game.movePlayer(1, 0);
                    case SPACE -> {
                        game.settle();
                        gameUI.updateDashboard();
                    }
                    default -> {}
                }
                // Update camera to follow player
                if (game.getPlayer() != null) {
                    camX = game.getPlayer().getX() * Config.TILE_SIZE;
                    camY = game.getPlayer().getY() * Config.TILE_SIZE;
                }
            } else if (game.getGameState() == GameState.CITY) {
                if (e.getCode() == KeyCode.SPACE || e.getCode() == KeyCode.ENTER) {
                    game.nextTurn();
                    gameUI.updateDashboard();
                }
            }
            
            // Zoom controls
            if (e.getCode() == KeyCode.EQUALS || e.getCode() == KeyCode.PLUS) {
                zoomIn();
            } else if (e.getCode() == KeyCode.MINUS) {
                zoomOut();
            }
            
            gameUI.updateDashboard();
        });
        
        // Mouse click
        canvas.setOnMouseClicked(e -> {
            int tileX = screenToTileX(e.getX());
            int tileY = screenToTileY(e.getY());
            
            if (e.getButton() == MouseButton.PRIMARY) {
                handleLeftClick(tileX, tileY);
            } else if (e.getButton() == MouseButton.SECONDARY) {
                handleRightClick(tileX, tileY);
            }
        });
        
        // Mouse drag for panning
        canvas.setOnMousePressed(e -> {
            if (e.getButton() == MouseButton.MIDDLE || 
                (e.getButton() == MouseButton.PRIMARY && e.isShiftDown())) {
                isPanning = true;
                lastMouseX = e.getX();
                lastMouseY = e.getY();
            }
        });
        
        canvas.setOnMouseDragged(e -> {
            if (isPanning) {
                double dx = e.getX() - lastMouseX;
                double dy = e.getY() - lastMouseY;
                camX -= dx / camZoom;
                camY -= dy / camZoom;
                lastMouseX = e.getX();
                lastMouseY = e.getY();
            }
        });
        
        canvas.setOnMouseReleased(e -> {
            isPanning = false;
        });
        
        // Mouse scroll for zoom
        canvas.setOnScroll(e -> {
            if (e.getDeltaY() > 0) {
                zoomIn();
            } else {
                zoomOut();
            }
        });
    }
    
    private void handleLeftClick(int tileX, int tileY) {
        if (game.getGameState() == GameState.WANDER) {
            // Move player to clicked tile (pathfinding)
            game.setPlayerTarget(tileX, tileY);
        } else if (game.getGameState() == GameState.CITY) {
            // Build or interact based on selected tool
            if (selectedBuildType != null) {
                boolean built = game.build(tileX, tileY, selectedBuildType);
                if (built) {
                    gameUI.showToast("Built " + selectedBuildType, "#4CAF50");
                } else {
                    gameUI.showToast("Cannot build here", "#f44336");
                }
            }
        }
        gameUI.updateDashboard();
    }
    
    private void handleRightClick(int tileX, int tileY) {
        // Cancel current selection
        selectedBuildType = null;
        gameUI.setSelectedBuildType(null);
        gameUI.showToast("Selection cancelled", "#FF9800");
    }
    
    private void startGameLoop() {
        gameLoop = new AnimationTimer() {
            @Override
            public void handle(long now) {
                // Update at ~60 FPS
                if (now - lastUpdate >= 16_666_666) { // ~60 FPS
                    update();
                    render();
                    lastUpdate = now;
                }
            }
        };
        gameLoop.start();
    }
    
    private void stopGameLoop() {
        if (gameLoop != null) {
            gameLoop.stop();
        }
    }
    
    private void update() {
        // Process pathfinding queue
        game.processPathQueue();
        
        // Camera follows player in wander mode
        if (game.getGameState() == GameState.WANDER && game.getPlayer() != null) {
            // Smooth camera follow
            double targetX = game.getPlayer().getX() * Config.TILE_SIZE;
            double targetY = game.getPlayer().getY() * Config.TILE_SIZE;
            camX += (targetX - camX) * 0.1;
            camY += (targetY - camY) * 0.1;
        }
        
        // Check for game over
        if (game.getGameState() == GameState.GAME_OVER) {
            gameUI.showGameOver(game.getGameOverReason());
        }
        
        // AI update (if auto-play enabled)
        if (ai.isAutoPlay()) {
            ai.step();
            gameUI.updateDashboard();
            gameUI.updateAIPanel();
        }
    }
    
    private void render() {
        renderer.render(camX, camY, camZoom);
    }
    
    // Camera controls
    public void zoomIn() {
        camZoom = Math.min(ZOOM_MAX, camZoom * ZOOM_STEP);
    }
    
    public void zoomOut() {
        camZoom = Math.max(ZOOM_MIN, camZoom / ZOOM_STEP);
    }
    
    public void resetCamera() {
        if (game.getPlayer() != null) {
            camX = game.getPlayer().getX() * Config.TILE_SIZE;
            camY = game.getPlayer().getY() * Config.TILE_SIZE;
        } else {
            camX = Config.MAP_WIDTH * Config.TILE_SIZE / 2.0;
            camY = Config.MAP_HEIGHT * Config.TILE_SIZE / 2.0;
        }
        camZoom = 1.0;
    }
    
    // Coordinate conversion
    private int screenToTileX(double screenX) {
        double worldX = camX + (screenX - canvas.getWidth() / 2) / camZoom;
        return (int)(worldX / Config.TILE_SIZE);
    }
    
    private int screenToTileY(double screenY) {
        double worldY = camY + (screenY - canvas.getHeight() / 2) / camZoom;
        return (int)(worldY / Config.TILE_SIZE);
    }
    
    // Game control methods (called from UI)
    public void newGame() {
        game = new Game((int)(Math.random() * 100000));
        game.init();
        renderer.setGame(game);
        ai = new QLearningAI(game);
        gameUI.setAI(ai);
        resetCamera();
        gameUI.updateDashboard();
        gameUI.showToast("🆕 New game started!", "#4CAF50");
    }
    
    public void saveGame() {
        game.save();
        gameUI.showToast("💾 Game saved!", "#4CAF50");
    }
    
    public void loadGame() {
        game.load();
        renderer.setGame(game);
        gameUI.updateDashboard();
        gameUI.showToast("📂 Game loaded!", "#2196F3");
    }
    
    public void toggleAI() {
        if (ai.isAutoPlay()) {
            ai.setAutoPlay(false);
            gameUI.showToast("🤖 AI stopped", "#FF9800");
        } else {
            ai.setAutoPlay(true);
            gameUI.showToast("🤖 AI started", "#4CAF50");
        }
    }
    
    public Game getGame() {
        return game;
    }
    
    public QLearningAI getAI() {
        return ai;
    }
    
    public static void main(String[] args) {
        launch(args);
    }
}
