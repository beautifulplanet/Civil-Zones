package com.civilzones.ui;

import com.civilzones.config.Config;
import com.civilzones.game.*;
import com.civilzones.entity.*;
import com.civilzones.ai.QLearningAI;

import javafx.animation.*;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;
import javafx.util.Duration;

import java.util.function.Consumer;

/**
 * Game UI components using JavaFX
 * Converted from JavaScript UI object
 */
public class GameUI {
    
    private VBox root;
    private VBox dashboard;
    private VBox aiPanel;
    private HBox toolbar;
    private Label toastLabel;
    private VBox toastContainer;
    private StackPane overlay;
    
    private Game game;
    private QLearningAI ai;
    
    // UI State
    private String selectedBuildType = null;
    private boolean isTrainingMode = false;
    private Consumer<String> buildCallback;
    private Runnable nextTurnCallback;
    
    public GameUI(Game game) {
        this.game = game;
        createUI();
    }
    
    public void setAI(QLearningAI ai) {
        this.ai = ai;
    }
    
    public void setBuildCallback(Consumer<String> callback) {
        this.buildCallback = callback;
    }
    
    public void setNextTurnCallback(Runnable callback) {
        this.nextTurnCallback = callback;
    }
    
    private void createUI() {
        root = new VBox();
        root.setSpacing(0);
        
        // Create toolbar
        createToolbar();
        
        // Create dashboard
        createDashboard();
        
        // Create AI panel
        createAIPanel();
        
        // Create toast container
        createToastContainer();
        
        // Create overlay for game over
        createOverlay();
    }
    
    /**
     * Create the top toolbar
     */
    private void createToolbar() {
        toolbar = new HBox();
        toolbar.setSpacing(10);
        toolbar.setPadding(new Insets(8, 15, 8, 15));
        toolbar.setStyle("-fx-background-color: linear-gradient(to bottom, #3a3a3a, #2a2a2a);" +
                        "-fx-border-color: #555555; -fx-border-width: 0 0 1 0;");
        
        // Game title
        Label title = new Label("🏛️ Civil Zones v48.0");
        title.setFont(Font.font("System", FontWeight.BOLD, 14));
        title.setTextFill(Color.web("#FFD700"));
        
        // Spacer
        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);
        
        // View mode buttons
        Button normalView = createToolbarButton("Normal View", "👁️");
        normalView.setOnAction(e -> game.setViewMode("NORMAL"));
        
        Button desirabilityView = createToolbarButton("Desirability", "📊");
        desirabilityView.setOnAction(e -> game.setViewMode("DESIRABILITY"));
        
        // Save/Load buttons
        Button saveBtn = createToolbarButton("Save", "💾");
        saveBtn.setOnAction(e -> {
            game.save();
            showToast("Game saved!", "#4CAF50");
        });
        
        Button loadBtn = createToolbarButton("Load", "📂");
        loadBtn.setOnAction(e -> {
            game.load();
            showToast("Game loaded!", "#2196F3");
            updateDashboard();
        });
        
        toolbar.getChildren().addAll(title, spacer, normalView, desirabilityView, saveBtn, loadBtn);
    }
    
    /**
     * Create toolbar button
     */
    private Button createToolbarButton(String tooltip, String icon) {
        Button btn = new Button(icon);
        btn.setFont(Font.font("System", 16));
        btn.setStyle("-fx-background-color: #444444; -fx-text-fill: white; " +
                    "-fx-padding: 5 10; -fx-cursor: hand; -fx-background-radius: 3;");
        btn.setTooltip(new Tooltip(tooltip));
        
        btn.setOnMouseEntered(e -> btn.setStyle("-fx-background-color: #555555; -fx-text-fill: white; " +
                                                "-fx-padding: 5 10; -fx-cursor: hand; -fx-background-radius: 3;"));
        btn.setOnMouseExited(e -> btn.setStyle("-fx-background-color: #444444; -fx-text-fill: white; " +
                                               "-fx-padding: 5 10; -fx-cursor: hand; -fx-background-radius: 3;"));
        
        return btn;
    }
    
    /**
     * Create the main dashboard panel
     */
    private void createDashboard() {
        dashboard = new VBox();
        dashboard.setSpacing(10);
        dashboard.setPadding(new Insets(10));
        dashboard.setPrefWidth(200);
        dashboard.setStyle("-fx-background-color: rgba(0, 0, 0, 0.85); " +
                          "-fx-border-color: #555555; -fx-border-width: 0 1 0 0;");
    }
    
    /**
     * Update dashboard content based on game state
     */
    public void updateDashboard() {
        dashboard.getChildren().clear();
        
        if (game.getGameState() == GameState.WANDER) {
            updateWanderDashboard();
        } else if (game.getGameState() == GameState.CITY) {
            updateCityDashboard();
        }
    }
    
    /**
     * Update dashboard for wander mode
     */
    private void updateWanderDashboard() {
        Player player = game.getPlayer();
        if (player == null) return;
        
        // Title
        Label title = createSectionTitle("🧭 EXPLORATION");
        
        // Population
        Label popLabel = createStatLabel("👥 Population: " + player.getPopulation());
        
        // Resources
        VBox resources = new VBox(5);
        resources.setStyle("-fx-background-color: rgba(255, 255, 255, 0.1); " +
                          "-fx-padding: 8; -fx-background-radius: 5;");
        
        Label resTitle = new Label("📦 Resources");
        resTitle.setTextFill(Color.web("#FFD700"));
        resTitle.setFont(Font.font("System", FontWeight.BOLD, 12));
        
        Inventory inv = player.getInventory();
        Label foodLabel = createStatLabel("🍖 Food: " + inv.getFood() + "/" + inv.getCapacity());
        Label woodLabel = createStatLabel("🪵 Wood: " + inv.getWood() + "/" + inv.getCapacity());
        Label stoneLabel = createStatLabel("🪨 Stone: " + inv.getStone() + "/" + inv.getCapacity());
        Label metalLabel = createStatLabel("⚙️ Metal: " + inv.getMetal() + "/" + inv.getCapacity());
        
        resources.getChildren().addAll(resTitle, foodLabel, woodLabel, stoneLabel, metalLabel);
        
        // Thirst bar
        VBox thirstBox = createThirstBar(player);
        
        // Requirements to settle
        VBox requirements = createSettleRequirements();
        
        // Settle button
        Button settleBtn = new Button("🏰 SETTLE HERE");
        settleBtn.setMaxWidth(Double.MAX_VALUE);
        settleBtn.setStyle("-fx-background-color: #4CAF50; -fx-text-fill: white; " +
                          "-fx-font-weight: bold; -fx-padding: 10 15; -fx-font-size: 14; " +
                          "-fx-background-radius: 5; -fx-cursor: hand;");
        settleBtn.setDisable(!canSettle());
        settleBtn.setOnAction(e -> {
            game.settle();
            showToast("Settlement established!", "#4CAF50");
            updateDashboard();
        });
        
        dashboard.getChildren().addAll(title, popLabel, resources, thirstBox, requirements, settleBtn);
    }
    
    /**
     * Update dashboard for city mode
     */
    private void updateCityDashboard() {
        // Title
        Label title = createSectionTitle("🏛️ CITY MANAGEMENT");
        
        // Turn counter
        Label turnLabel = createStatLabel("📅 Turn: " + game.getCurrentTurn());
        
        // Population
        int totalPop = game.getTotalPopulation();
        int totalCap = game.getTotalCapacity();
        Label popLabel = createStatLabel("👥 Population: " + totalPop + "/" + totalCap);
        
        // Resources
        VBox resources = new VBox(5);
        resources.setStyle("-fx-background-color: rgba(255, 255, 255, 0.1); " +
                          "-fx-padding: 8; -fx-background-radius: 5;");
        
        Inventory inv = game.getCityInventory();
        Label resTitle = new Label("📦 City Resources");
        resTitle.setTextFill(Color.web("#FFD700"));
        resTitle.setFont(Font.font("System", FontWeight.BOLD, 12));
        
        Label foodLabel = createStatLabel("🍖 Food: " + inv.getFood());
        Label woodLabel = createStatLabel("🪵 Wood: " + inv.getWood());
        Label stoneLabel = createStatLabel("🪨 Stone: " + inv.getStone());
        Label metalLabel = createStatLabel("⚙️ Metal: " + inv.getMetal());
        
        resources.getChildren().addAll(resTitle, foodLabel, woodLabel, stoneLabel, metalLabel);
        
        // Build menu
        VBox buildMenu = createBuildMenu();
        
        // Next turn button
        Button nextTurnBtn = new Button("⏭️ NEXT TURN");
        nextTurnBtn.setMaxWidth(Double.MAX_VALUE);
        nextTurnBtn.setStyle("-fx-background-color: #2196F3; -fx-text-fill: white; " +
                            "-fx-font-weight: bold; -fx-padding: 10 15; -fx-font-size: 14; " +
                            "-fx-background-radius: 5; -fx-cursor: hand;");
        nextTurnBtn.setOnAction(e -> {
            if (nextTurnCallback != null) {
                nextTurnCallback.run();
            }
        });
        
        dashboard.getChildren().addAll(title, turnLabel, popLabel, resources, buildMenu, nextTurnBtn);
    }
    
    /**
     * Create build menu
     */
    private VBox createBuildMenu() {
        VBox menu = new VBox(5);
        menu.setStyle("-fx-background-color: rgba(255, 255, 255, 0.1); " +
                     "-fx-padding: 8; -fx-background-radius: 5;");
        
        Label title = new Label("🔨 Build");
        title.setTextFill(Color.web("#FFD700"));
        title.setFont(Font.font("System", FontWeight.BOLD, 12));
        
        // Build buttons
        Button resBtn = createBuildButton("🏠 Residence", "RES", 
            Config.BUILDING_COST_WOOD_RES + "🪵");
        Button campfireBtn = createBuildButton("🔥 Campfire", "CAMPFIRE",
            Config.BUILDING_COST_WOOD_COM + "🪵 " + Config.BUILDING_COST_STONE_COM + "🪨");
        Button huntBtn = createBuildButton("🏹 Hunting", "HUNTING_GROUND",
            Config.BUILDING_COST_WOOD_IND + "🪵");
        Button wellBtn = createBuildButton("💧 Well", "WELL",
            Config.WELL_COST_STONE + "🪨");
        Button roadBtn = createBuildButton("🛤️ Road", "ROAD",
            Config.ROAD_COST_STONE + "🪨");
        
        menu.getChildren().addAll(title, resBtn, campfireBtn, huntBtn, wellBtn, roadBtn);
        
        return menu;
    }
    
    /**
     * Create a build button
     */
    private Button createBuildButton(String text, String buildType, String cost) {
        Button btn = new Button(text + " (" + cost + ")");
        btn.setMaxWidth(Double.MAX_VALUE);
        btn.setStyle("-fx-background-color: #555555; -fx-text-fill: white; " +
                    "-fx-padding: 5 10; -fx-font-size: 11; -fx-background-radius: 3; -fx-cursor: hand;");
        
        btn.setOnMouseEntered(e -> btn.setStyle("-fx-background-color: #666666; -fx-text-fill: white; " +
                                                "-fx-padding: 5 10; -fx-font-size: 11; -fx-background-radius: 3; -fx-cursor: hand;"));
        btn.setOnMouseExited(e -> btn.setStyle("-fx-background-color: #555555; -fx-text-fill: white; " +
                                               "-fx-padding: 5 10; -fx-font-size: 11; -fx-background-radius: 3; -fx-cursor: hand;"));
        
        btn.setOnAction(e -> {
            selectedBuildType = buildType;
            if (buildCallback != null) {
                buildCallback.accept(buildType);
            }
            showToast("Click on the map to place " + text, "#FF9800");
        });
        
        return btn;
    }
    
    /**
     * Create section title label
     */
    private Label createSectionTitle(String text) {
        Label label = new Label(text);
        label.setTextFill(Color.web("#FFD700"));
        label.setFont(Font.font("System", FontWeight.BOLD, 16));
        return label;
    }
    
    /**
     * Create stat label
     */
    private Label createStatLabel(String text) {
        Label label = new Label(text);
        label.setTextFill(Color.WHITE);
        label.setFont(Font.font("System", 12));
        return label;
    }
    
    /**
     * Create thirst bar
     */
    private VBox createThirstBar(Player player) {
        VBox box = new VBox(3);
        box.setStyle("-fx-background-color: rgba(255, 255, 255, 0.1); " +
                    "-fx-padding: 8; -fx-background-radius: 5;");
        
        Label title = new Label("💧 Thirst");
        title.setTextFill(Color.web("#81D4FA"));
        title.setFont(Font.font("System", FontWeight.BOLD, 12));
        
        ProgressBar bar = new ProgressBar(player.getThirst() / (double) Config.MAX_THIRST);
        bar.setMaxWidth(Double.MAX_VALUE);
        bar.setStyle("-fx-accent: #2196F3;");
        
        Label value = createStatLabel(player.getThirst() + "/" + Config.MAX_THIRST);
        
        box.getChildren().addAll(title, bar, value);
        return box;
    }
    
    /**
     * Create settle requirements display
     */
    private VBox createSettleRequirements() {
        VBox box = new VBox(3);
        box.setStyle("-fx-background-color: rgba(255, 255, 255, 0.1); " +
                    "-fx-padding: 8; -fx-background-radius: 5;");
        
        Label title = new Label("📋 Requirements to Settle");
        title.setTextFill(Color.web("#FFD700"));
        title.setFont(Font.font("System", FontWeight.BOLD, 12));
        
        Player player = game.getPlayer();
        Inventory inv = player.getInventory();
        
        String checkPop = player.getPopulation() >= Config.SETTLE_MIN_POP ? "✅" : "❌";
        String checkFood = inv.getFood() >= Config.SETTLE_MIN_FOOD ? "✅" : "❌";
        String checkWood = inv.getWood() >= Config.SETTLE_MIN_WOOD ? "✅" : "❌";
        
        Label popReq = createStatLabel(checkPop + " Population: " + Config.SETTLE_MIN_POP);
        Label foodReq = createStatLabel(checkFood + " Food: " + Config.SETTLE_MIN_FOOD);
        Label woodReq = createStatLabel(checkWood + " Wood: " + Config.SETTLE_MIN_WOOD);
        
        box.getChildren().addAll(title, popReq, foodReq, woodReq);
        return box;
    }
    
    /**
     * Check if player can settle
     */
    private boolean canSettle() {
        Player player = game.getPlayer();
        if (player == null) return false;
        
        Inventory inv = player.getInventory();
        return player.getPopulation() >= Config.SETTLE_MIN_POP &&
               inv.getFood() >= Config.SETTLE_MIN_FOOD &&
               inv.getWood() >= Config.SETTLE_MIN_WOOD;
    }
    
    /**
     * Create AI panel
     */
    private void createAIPanel() {
        aiPanel = new VBox();
        aiPanel.setSpacing(10);
        aiPanel.setPadding(new Insets(10));
        aiPanel.setPrefWidth(200);
        aiPanel.setStyle("-fx-background-color: rgba(0, 0, 0, 0.85); " +
                        "-fx-border-color: #555555; -fx-border-width: 0 0 0 1;");
        
        // Title
        Label title = createSectionTitle("🤖 Q-Learning AI");
        
        // Training toggle
        CheckBox trainingToggle = new CheckBox("Training Mode");
        trainingToggle.setTextFill(Color.WHITE);
        trainingToggle.setOnAction(e -> {
            isTrainingMode = trainingToggle.isSelected();
            if (ai != null) {
                ai.setTraining(isTrainingMode);
            }
        });
        
        // Auto-play toggle
        CheckBox autoPlayToggle = new CheckBox("Auto-Play");
        autoPlayToggle.setTextFill(Color.WHITE);
        
        // Stats
        Label statesLabel = createStatLabel("States explored: 0");
        Label epsilonLabel = createStatLabel("Epsilon: 1.0");
        
        // Action buttons
        Button stepBtn = new Button("Step");
        stepBtn.setMaxWidth(Double.MAX_VALUE);
        stepBtn.setStyle("-fx-background-color: #4CAF50; -fx-text-fill: white; -fx-padding: 5 10;");
        stepBtn.setOnAction(e -> {
            if (ai != null) {
                ai.step();
                updateDashboard();
            }
        });
        
        Button resetQBtn = new Button("Reset Q-Table");
        resetQBtn.setMaxWidth(Double.MAX_VALUE);
        resetQBtn.setStyle("-fx-background-color: #f44336; -fx-text-fill: white; -fx-padding: 5 10;");
        resetQBtn.setOnAction(e -> {
            if (ai != null) {
                ai.resetQTable();
                showToast("Q-Table reset!", "#f44336");
            }
        });
        
        aiPanel.getChildren().addAll(title, trainingToggle, autoPlayToggle, statesLabel, epsilonLabel, stepBtn, resetQBtn);
    }
    
    /**
     * Update AI panel stats
     */
    public void updateAIPanel() {
        // Update stats in AI panel
        if (ai != null && aiPanel.getChildren().size() > 4) {
            Label statesLabel = (Label) aiPanel.getChildren().get(3);
            Label epsilonLabel = (Label) aiPanel.getChildren().get(4);
            statesLabel.setText("States explored: " + ai.getStatesExplored());
            epsilonLabel.setText("Epsilon: " + String.format("%.3f", ai.getEpsilon()));
        }
    }
    
    /**
     * Create toast notification container
     */
    private void createToastContainer() {
        toastContainer = new VBox();
        toastContainer.setAlignment(Pos.TOP_CENTER);
        toastContainer.setMouseTransparent(true);
        toastContainer.setPadding(new Insets(20, 0, 0, 0));
        
        toastLabel = new Label();
        toastLabel.setFont(Font.font("System", FontWeight.BOLD, 14));
        toastLabel.setTextFill(Color.WHITE);
        toastLabel.setPadding(new Insets(10, 20, 10, 20));
        toastLabel.setStyle("-fx-background-color: rgba(0, 0, 0, 0.8); -fx-background-radius: 20;");
        toastLabel.setVisible(false);
        
        toastContainer.getChildren().add(toastLabel);
    }
    
    /**
     * Show toast notification
     */
    public void showToast(String message, String color) {
        toastLabel.setText(message);
        toastLabel.setStyle("-fx-background-color: " + color + "; -fx-background-radius: 20;");
        toastLabel.setVisible(true);
        
        // Fade out animation
        PauseTransition pause = new PauseTransition(Duration.seconds(2));
        FadeTransition fade = new FadeTransition(Duration.millis(500), toastLabel);
        fade.setFromValue(1.0);
        fade.setToValue(0.0);
        
        pause.setOnFinished(e -> fade.play());
        fade.setOnFinished(e -> toastLabel.setVisible(false));
        
        toastLabel.setOpacity(1.0);
        pause.play();
    }
    
    /**
     * Create game over overlay
     */
    private void createOverlay() {
        overlay = new StackPane();
        overlay.setStyle("-fx-background-color: rgba(0, 0, 0, 0.8);");
        overlay.setVisible(false);
        
        VBox content = new VBox(20);
        content.setAlignment(Pos.CENTER);
        content.setPadding(new Insets(40));
        content.setStyle("-fx-background-color: rgba(0, 0, 0, 0.9); -fx-background-radius: 20;");
        content.setMaxWidth(400);
        
        Label gameOverLabel = new Label("💀 GAME OVER");
        gameOverLabel.setFont(Font.font("System", FontWeight.BOLD, 32));
        gameOverLabel.setTextFill(Color.web("#f44336"));
        
        Label reasonLabel = new Label();
        reasonLabel.setTextFill(Color.WHITE);
        reasonLabel.setFont(Font.font("System", 16));
        reasonLabel.setWrapText(true);
        
        Button restartBtn = new Button("🔄 Restart");
        restartBtn.setStyle("-fx-background-color: #4CAF50; -fx-text-fill: white; " +
                           "-fx-font-weight: bold; -fx-padding: 15 30; -fx-font-size: 16; " +
                           "-fx-background-radius: 10; -fx-cursor: hand;");
        
        content.getChildren().addAll(gameOverLabel, reasonLabel, restartBtn);
        overlay.getChildren().add(content);
    }
    
    /**
     * Show game over screen
     */
    public void showGameOver(String reason) {
        VBox content = (VBox) overlay.getChildren().get(0);
        Label reasonLabel = (Label) content.getChildren().get(1);
        reasonLabel.setText(reason);
        overlay.setVisible(true);
    }
    
    /**
     * Hide game over screen
     */
    public void hideGameOver() {
        overlay.setVisible(false);
    }
    
    // Getters
    public VBox getRoot() { return root; }
    public HBox getToolbar() { return toolbar; }
    public VBox getDashboard() { return dashboard; }
    public VBox getAIPanel() { return aiPanel; }
    public VBox getToastContainer() { return toastContainer; }
    public StackPane getOverlay() { return overlay; }
    public String getSelectedBuildType() { return selectedBuildType; }
    public void setSelectedBuildType(String type) { this.selectedBuildType = type; }
    public boolean isTrainingMode() { return isTrainingMode; }
}
