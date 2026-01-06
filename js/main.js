// ═══════════════════════════════════════════════════════════════════════════════
// CIVIL ZONES: STONE AGE - Main Entry Point
// ═══════════════════════════════════════════════════════════════════════════════
// Game initialization and main loop
// ═══════════════════════════════════════════════════════════════════════════════

// Global game instance
let game = null;
let renderer = null;
let ui = null;
let running = false;

// ─────────────────────────────────────────────────────────────────────────────
// Initialize
// ─────────────────────────────────────────────────────────────────────────────
function init() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('   CIVIL ZONES: STONE AGE v1.0');
    console.log('═══════════════════════════════════════════════════════════════');
    
    try {
        // Get canvas
        const canvas = document.getElementById('game-canvas');
        if (!canvas) {
            throw new Error('Canvas element not found!');
        }
        
        // Initialize game
        game = new Game();
        game.init();
        
        // Initialize renderer
        renderer = new Renderer(canvas);
        renderer.init();
        renderer.centerOn(game.player.x, game.player.y);
        
        // Initialize UI
        ui = new UI();
        ui.init();
        ui.updateStats(game);
        
        // Setup input handlers
        setupInput();
        
        // Start game loop
        running = true;
        requestAnimationFrame(gameLoop);
        
        console.log('[Main] Game started!');
        Utils.showToast('Welcome to Civil Zones: Stone Age!', 'success');
        
    } catch (error) {
        console.error('[Main] Failed to initialize:', error);
        Utils.showToast(`Error: ${error.message}`, 'error', 10000);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Game Loop
// ─────────────────────────────────────────────────────────────────────────────
function gameLoop(timestamp) {
    if (!running) return;
    
    try {
        // Render
        renderer.render(game);
        
        // Update UI
        ui.updateStats(game);
        
    } catch (error) {
        console.error('[Main] Error in game loop:', error);
    }
    
    requestAnimationFrame(gameLoop);
}

// ─────────────────────────────────────────────────────────────────────────────
// Input Handling
// ─────────────────────────────────────────────────────────────────────────────
function setupInput() {
    // Keyboard
    document.addEventListener('keydown', handleKeyDown);
    
    // Tile selection event from renderer
    window.addEventListener('tileSelected', handleTileSelection);
    
    // Button clicks
    setupButtons();
}

function handleKeyDown(e) {
    if (game.gameOver) return;
    
    // Prevent default for game keys
    const gameKeys = ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
                      'c', ' ', 'Escape', 'F5', 'F9'];
    if (gameKeys.includes(e.key)) {
        e.preventDefault();
    }
    
    // Movement (WANDER mode)
    if (game.mode === 'WANDER') {
        let dx = 0, dy = 0;
        
        switch (e.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                dy = -1;
                break;
            case 's':
            case 'arrowdown':
                dy = 1;
                break;
            case 'a':
            case 'arrowleft':
                dx = -1;
                break;
            case 'd':
            case 'arrowright':
                dx = 1;
                break;
        }
        
        if (dx !== 0 || dy !== 0) {
            if (game.movePlayer(dx, dy)) {
                renderer.centerOn(game.player.x, game.player.y);
            }
        }
    }
    
    // Actions
    switch (e.key.toLowerCase()) {
        case 'c':
            // Chop tree (WANDER mode)
            if (game.mode === 'WANDER') {
                game.chopTree();
            }
            break;
            
        case 'w':
            // Place well (if shift held)
            if (e.shiftKey) {
                game.placeWell();
            }
            break;
            
        case ' ':
            // Advance turn (CITY mode)
            if (game.mode === 'CITY') {
                game.advanceTurn();
            }
            break;
            
        case 'escape':
            // Cancel building selection
            ui.clearSelection();
            break;
            
        case 'f5':
            // Quick save
            game.save('quicksave');
            break;
            
        case 'f9':
            // Quick load
            if (game.load('quicksave')) {
                renderer.centerOn(game.player.x, game.player.y);
            }
            break;
            
        case 'h':
            // Help
            ui.showHelp();
            break;
    }
}

function handleTileSelection(e) {
    const { x, y } = e.detail;
    const tile = game.map.getTile(x, y);
    
    if (!tile || !game.map.isRevealed(x, y)) {
        ui.hideInfoPanel();
        return;
    }
    
    // Show tile info
    ui.showTileInfo(tile, game);
    
    // Handle building placement in CITY mode
    if (game.mode === 'CITY') {
        const buildingType = ui.getSelectedBuildingType();
        if (buildingType) {
            if (buildingType === 'WELL') {
                // Place well at selected location
                const oldX = game.player.x;
                const oldY = game.player.y;
                game.player.x = x;
                game.player.y = y;
                
                if (game.placeWell()) {
                    ui.clearSelection();
                } else {
                    game.player.x = oldX;
                    game.player.y = oldY;
                }
            } else {
                // Place building
                if (game.placeBuilding(x, y, buildingType)) {
                    ui.clearSelection();
                    ui.setupBuildMenu(game);
                }
            }
        }
    }
}

function setupButtons() {
    const btnSettle = document.getElementById('btn-settle');
    const btnWell = document.getElementById('btn-well');
    const btnChop = document.getElementById('btn-chop');
    const btnSave = document.getElementById('btn-save');
    const btnLoad = document.getElementById('btn-load');
    
    if (btnSettle) {
        btnSettle.addEventListener('click', () => {
            ui.showSettleDialog((name) => {
                if (game.settle(name)) {
                    ui.setupBuildMenu(game);
                }
            });
        });
    }
    
    if (btnWell) {
        btnWell.addEventListener('click', () => {
            game.placeWell();
        });
    }
    
    if (btnChop) {
        btnChop.addEventListener('click', () => {
            game.chopTree();
        });
    }
    
    if (btnSave) {
        btnSave.addEventListener('click', () => {
            game.save('manual');
        });
    }
    
    if (btnLoad) {
        btnLoad.addEventListener('click', () => {
            if (game.load('manual')) {
                renderer.centerOn(game.player.x, game.player.y);
                ui.setupBuildMenu(game);
            }
        });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Start when DOM ready
// ─────────────────────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
