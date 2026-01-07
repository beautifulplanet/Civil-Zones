// ═══════════════════════════════════════════════════════════════════════════════
// CITGAME AI AUTOPLAY SYSTEM - Autonomous Game Agent
// ═══════════════════════════════════════════════════════════════════════════════
//
// PURPOSE: Handles intelligent resource gathering, exploration, and city building
//          for automated testing and gameplay demonstration.
//
// HOW IT WORKS:
// - Runs every 150ms when enabled (AI.enabled = true)
// - Two modes: WANDER (exploration/gathering) and CITY (building/management)
// - Uses A* pathfinding to navigate to targets
// - Prioritizes: Berries > Animals > Nomads > Exploration
//
// KEY FUNCTIONS:
// - update(game): Main loop, called every frame
// - wanderMode(game): Handles Epoch 0 exploration
// - cityMode(game): Handles settlement building
// - findBestTarget(game): Prioritizes what to pursue
// - exploreRandomly(game): Explores unexplored areas
//
// CURRENT BALANCE AWARENESS:
// - Avoids attacking animal herds (cost 1-3 pop)
// - Manages inventory capacity (150 base + 100/nomad)
// - Settles when inventory full and has enough resources
//
// RELATED FILES:
// - index.html: Main game, calls AI.update() in game loop
// - GAME_BALANCE.txt: Balance values AI should consider
//
// ═══════════════════════════════════════════════════════════════════════════════

const AI = {
    version: 'AI v2026-01-07 HighGround+2x2+Roads',
    enabled: false,
    lastAction: 0,
    updateInterval: 150, // milliseconds between actions
    target: null, // Current movement/gathering target
    pathStuckTimer: null,
    movementHistory: [], // Track last N moves
    movementPenalty: 0, // Track penalty points
    
    // ═══════════════════════════════════════════════════════════════
    // MAIN UPDATE LOOP
    // Called every frame from game loop when AI is enabled
    // ═══════════════════════════════════════════════════════════════
    update(game) {
        if(!this.enabled || !game.player) return;

        let now = performance.now();
        if(now - this.lastAction < this.updateInterval) return;
        this.lastAction = now;

        // Track movement history and penalize repeated walking
        let posKey = `${game.player.x},${game.player.y}`;
        this.movementHistory.push(posKey);
        if(this.movementHistory.length > 20) this.movementHistory.shift(); // Keep last 20 moves
        // Penalize if revisiting a tile in last 10 moves
        let recentMoves = this.movementHistory.slice(-10, -1);
        if(recentMoves.includes(posKey)) {
            this.movementPenalty++;
            // Example penalty: reduce food by 1, log warning
            if(game.food > 0) game.food--;
            if(this.movementPenalty % 5 === 0) {
                console.warn(`AI penalized for repeated walking (${this.movementPenalty} times)`);
            }
        }

        // Handle stuck pathfinding (timeout after 3 seconds)
        if(game.pathQueue.length > 0) {
            if(!this.pathStuckTimer) this.pathStuckTimer = now;

            if(now - this.pathStuckTimer > 3000) {
                console.warn('AI: Path stuck for 3s, clearing!', {
                    queueLength: game.pathQueue.length,
                    playerPos: {x: game.player.x, y: game.player.y}
                });
                game.pathQueue = [];
                this.target = null;
                this.pathStuckTimer = null;
            }
            return;
        }
        this.pathStuckTimer = null;

        // Route to appropriate mode based on game state
        if(game.gameState === 'WANDER') {
            this.wanderMode(game);
        } else if(game.gameState === 'CITY') {
            this.cityMode(game);
        }
    },
    
    // ═══════════════════════════════════════════════════════════════
    // WANDER MODE - Resource Gathering & Exploration
    // Epoch 0: Gather resources, recruit nomads, find settlement spot
    // ═══════════════════════════════════════════════════════════════
    wanderMode(game) {
        // Check inventory space
        let totalInv = game.inventory.food + game.inventory.wood + game.inventory.metal + game.inventory.stone;
        let invSpace = game.inventory.capacity - totalInv;
        
        // If inventory full or nearly full, try to settle
        if(invSpace <= 10 && game.pop >= 2 && game.inventory.food >= 40 && game.inventory.wood >= 20) {
            game.settleHere();
            return;
        }
        
        // If we don't have a target, find one
        if(!this.target) {
            this.target = this.findBestTarget(game);
            if(this.target) {
                game.movePlayerToTile(this.target.x, this.target.y);
            } else {
                // No target found, explore
                this.exploreRandomly(game);
            }
        } else {
            // Check if we reached our target
            let dist = Math.abs(this.target.x - game.player.x) + Math.abs(this.target.y - game.player.y);
            if(dist <= 1) {
                // If target is an animal, attack it!
                if(this.target.type === 'animal') {
                    let animalIndex = game.animals.findIndex(a => 
                        a.x === this.target.x && a.y === this.target.y
                    );
                    if(animalIndex !== -1) {
                        game.attackAnimal(animalIndex);
                    }
                }
                this.target = null; // Clear target, will find new one next update
            }
        }
        
        // Check if ready to settle (relaxed requirements)
        let readyToSettle = game.pop >= 2 && 
                           game.inventory.food >= 50 && 
                           game.inventory.wood >= 20;
        
        if(readyToSettle) {
            game.settleHere();
        }
    },
    
    // ═══════════════════════════════════════════════════════════════
    // CITY MODE - Strategic Building & Development
    // ═══════════════════════════════════════════════════════════════
    cityMode(game) {
        // Debug: Log population, housing each year
        if(game.year && game.year !== this._lastDebugYear) {
            this._lastDebugYear = game.year;
            let housingCap = game.housingCap || 0;
            let pop = game.pop || 0;
            let wells = game.blds ? game.blds.filter(b => b.t === 'WELL').length : 0;
            console.log(`[AI DEBUG Y${game.year}] Pop=${pop}, Housing=${housingCap}, Wells=${wells}`);
        }
        
        // Analyze current city state
        let stats = this.analyzeCityState(game);
        
        // Make strategic building decision - ALWAYS try to do something
        let built = false;
        
        // Priority 1: Pre-build homes before population growth
        let housingCap = game.housingCap || 0;
        let pop = game.pop || 0;
        // If population is close to or exceeds housing, build more homes
        if(!built && (housingCap - pop < 4 || stats.resZones < 50)) {
            let targetLevel = PROGRESSION.unlockedLevels.includes(1) ? 1 : 0;
            let levelCosts = CFG.BUILDING_LEVELS[targetLevel];
            if(game.food >= levelCosts.food && game.wood >= levelCosts.wood) {
                Controller.selectedBuildingLevel = targetLevel;
                if(this.tryBuild(game, 'RES', 40)) {
                    built = true;
                }
            }
        }
        
        // Priority 2: Wells (1 per 4 zones)
        if(!built && stats.wellRatio < 0.25 && stats.resZones > 0 && game.food >= 20) {
            if(this.tryBuild(game, 'WELL', 30)) {
                built = true;
            }
        }
        
        // Priority 3: Paths (connect zones)
        if(!built && stats.resZones > 3 && stats.paths < stats.resZones * 0.5 && game.food >= 10) {
            if(this.tryBuild(game, 'PATH', 25)) {
                built = true;
            }
        }
        
        // Priority 4: Commercial zones (1 per 4 residential)
        if(!built && stats.comRatio < 0.25 && stats.resZones >= 4 && game.food >= 75) {
            if(this.tryBuild(game, 'COM', 25)) {
                built = true;
            }
        }

        // Priority 5: Industrial (if unlocked, 1 per 6 residential)
        if(!built && PROGRESSION.industrialUnlocked && stats.indRatio < 0.17 && stats.resZones >= 6 && game.food >= 500 && game.wood >= 100) {
            if(this.tryBuild(game, 'IND', 30)) {
                built = true;
            }
        }
        
        // Priority 6: Build MORE residential if we have resources but nothing else needed
        if(!built) {
            let targetLevel = PROGRESSION.unlockedLevels.includes(1) ? 1 : 0;
            let levelCosts = CFG.BUILDING_LEVELS[targetLevel];
            
            if(game.food >= levelCosts.food && game.wood >= levelCosts.wood) {
                Controller.selectedBuildingLevel = targetLevel;
                if(this.tryBuild(game, 'RES', 50)) {
                    built = true;
                }
            }
        }
        
        // Priority 7: If still can't build, try paths anywhere
        if(!built && game.food >= 10) {
            if(this.tryBuild(game, 'PATH', 35)) {
                built = true;
            }
        }
        
        // If nothing built, just wait for more resources (don't advance time)
    },
    
    // ═══════════════════════════════════════════════════════════════
    // HELPER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════
    
    findBestTarget(game) {
        let totalInv = game.inventory.food + game.inventory.wood + game.inventory.metal + game.inventory.stone;
        let invSpace = game.inventory.capacity - totalInv;
        
        // If inventory nearly full, prioritize nomads over resources
        let needWood = game.inventory.wood < 20;
        let needFood = game.inventory.food < 50;
        let needNomads = game.pop < 2;
        let inventoryAlmostFull = invSpace < 15;
        
        let targets = [];
        let searchRadius = 20;
        
        // Scan for targets
        for(let x = Math.max(0, game.player.x - searchRadius); x < Math.min(CFG.W, game.player.x + searchRadius); x++) {
            for(let y = Math.max(0, game.player.y - searchRadius); y < Math.min(CFG.H, game.player.y + searchRadius); y++) {
                let t = game.tiles[x][y];
                if(!t.explored) continue;
                
                let dist = Math.abs(x - game.player.x) + Math.abs(y - game.player.y);
                
                if(t.entity && t.entity.type === 'NOMAD' && !t.entity.is_hostile) {
                    // Nomads are ALWAYS high priority (they give population)
                    targets.push({x, y, dist, priority: needNomads ? 100 : 85, type: 'nomad'});
                }
                
                // Only collect resources if we have space
                if(!inventoryAlmostFull) {
                    if(t.entity && t.entity.type === 'BERRY') {
                        targets.push({x, y, dist, priority: needFood ? 70 : 40, type: 'berry'});
                    }
                    if(t.tree) {
                        targets.push({x, y, dist, priority: needWood ? 75 : 30, type: 'tree'});
                    }
                }
            }
        }
        
        // Only hunt animals if we have inventory space
        if(!inventoryAlmostFull) {
            for(let animal of game.animals) {
                let dist = Math.abs(animal.x - game.player.x) + Math.abs(animal.y - game.player.y);
                if(dist <= searchRadius) {
                    let animalConfig = CFG.ANIMALS.TYPES.find(a => a.name === animal.type);
                    // foodReward is [min, max] array - check if we have space for minimum
                    let minFoodReward = Array.isArray(animalConfig.foodReward) ? animalConfig.foodReward[0] : animalConfig.foodReward;
                    let worthHunting = needFood && invSpace >= minFoodReward;
                    targets.push({
                        x: animal.x,
                        y: animal.y,
                        dist,
                        priority: worthHunting ? 65 : 20,
                        type: 'animal'
                    });
                }
            }
        }
        
        // Sort by priority/distance ratio
        if(targets.length > 0) {
            targets.sort((a, b) => {
                let scoreA = a.priority / Math.max(1, a.dist);
                let scoreB = b.priority / Math.max(1, b.dist);
                return scoreB - scoreA;
            });
            return targets[0];
        }
        
        return null;
    },
    
    exploreRandomly(game) {
        // Look for unexplored tiles
        let unexplored = [];
        for(let x = Math.max(0, game.player.x - 20); x < Math.min(CFG.W, game.player.x + 20); x++) {
            for(let y = Math.max(0, game.player.y - 20); y < Math.min(CFG.H, game.player.y + 20); y++) {
                if(!game.tiles[x][y].explored) {
                    unexplored.push({x, y});
                }
            }
        }
        
        if(unexplored.length > 0) {
            // Pick furthest unexplored tile
            unexplored.sort((a, b) => {
                let distA = Math.abs(a.x - game.player.x) + Math.abs(a.y - game.player.y);
                let distB = Math.abs(b.x - game.player.x) + Math.abs(b.y - game.player.y);
                return distB - distA;
            });
            console.log('AI: Exploring unexplored area');
            game.movePlayerToTile(unexplored[0].x, unexplored[0].y);
        } else {
            // Random walk
            let dx = Math.floor(Math.random() * 61) - 30;
            let dy = Math.floor(Math.random() * 61) - 30;
            let tx = Math.max(5, Math.min(CFG.W - 5, game.player.x + dx));
            let ty = Math.max(5, Math.min(CFG.H - 5, game.player.y + dy));
            console.log('AI: Random exploration walk');
            game.movePlayerToTile(tx, ty);
        }
    },
    
    analyzeCityState(game) {
        let resZones = game.tiles.flat().filter(t => t.zone === 'R').length;
        let comZones = game.blds.filter(b => b.t === 'COM').length;
        let indZones = game.blds.filter(b => b.t === 'IND').length;
        let wells = game.blds.filter(b => b.t === 'WELL').length;
        let paths = game.tiles.flat().filter(t => t.path).length;
        
        return {
            resZones,
            comZones,
            indZones,
            wells,
            paths,
            comRatio: comZones / Math.max(1, resZones),
            indRatio: indZones / Math.max(1, resZones),
            wellRatio: wells / Math.max(1, resZones)
        };
    },
    
    tryBuild(game, type, searchRadius) {
        // Debug: Log build attempts
        console.log(`[AI BUILD] Trying ${type} (radius=${searchRadius})`);
        
        // Helper to build a square road around a 2x2 block
                function buildRoadLoop(game, x, y) {
                    // Road coordinates around 2x2 block (x,y is top-left)
                    let coords = [
                        [x-1, y-1], [x, y-1], [x+1, y-1], [x+2, y-1],
                        [x-1, y],                 [x+2, y],
                        [x-1, y+1],               [x+2, y+1],
                        [x-1, y+2], [x, y+2], [x+1, y+2], [x+2, y+2]
                    ];
                    for(let [rx, ry] of coords) {
                        if(rx >= 0 && rx < CFG.W && ry >= 0 && ry < CFG.H) {
                            if(game.tiles[rx][ry].type === 'GRASS' || game.tiles[rx][ry].type === 'SAND') {
                                if(!game.tiles[rx][ry].path) {
                                    try { game.build('PATH', rx, ry); } catch(e) {}
                                }
                            }
                        }
                    }
                }
        // Find suitable location near existing development
        let centerX = game.player.x;
        let centerY = game.player.y;
        
        // If we have buildings, center search near them
        let zones = [];
        for(let x = 0; x < CFG.W; x++) {
            for(let y = 0; y < CFG.H; y++) {
                if(game.tiles[x][y].zone) {
                    zones.push({x, y});
                    if(zones.length > 50) break; // Don't scan whole map
                }
            }
            if(zones.length > 50) break;
        }
        
        if(zones.length > 0) {
            let center = zones[Math.floor(zones.length / 2)];
            centerX = center.x;
            centerY = center.y;
        }
        
        // For zone types, scan for highest-elevation valid 2x2 block in search area
        if(type === 'RES' || type === 'COM' || type === 'IND') {
            let bestBlock = null;
            let bestElevation = -Infinity;
            let minElevation = 0.05; // Avoid lowlands (tweak as needed)
            let searchR = searchRadius;
            for(let x = Math.max(0, centerX - searchR); x < Math.min(CFG.W - 1, centerX + searchR); x++) {
                for(let y = Math.max(0, centerY - searchR); y < Math.min(CFG.H - 1, centerY + searchR); y++) {
                    // Check 2x2 block validity
                    let validBlock = true;
                    let elevSum = 0;
                    for(let dx2 = 0; dx2 < 2; dx2++) {
                        for(let dy2 = 0; dy2 < 2; dy2++) {
                            let tx = x + dx2, ty = y + dy2;
                            if(tx >= CFG.W || ty >= CFG.H) { validBlock = false; continue; }
                            let tile = game.tiles[tx][ty];
                            if(!this.isValidBuildLocation(game, type, tx, ty)) validBlock = false;
                            elevSum += tile.elevation || 0;
                        }
                    }
                    let avgElev = elevSum / 4;
                    // Check if road loop exists around block
                    let roadLoopExists = true;
                    let roadCoords = [
                        [x-1, y-1], [x, y-1], [x+1, y-1], [x+2, y-1],
                        [x-1, y],                 [x+2, y],
                        [x-1, y+1],               [x+2, y+1],
                        [x-1, y+2], [x, y+2], [x+1, y+2], [x+2, y+2]
                    ];
                    for(let [rx, ry] of roadCoords) {
                        if(rx >= 0 && rx < CFG.W && ry >= 0 && ry < CFG.H) {
                            let tile = game.tiles[rx][ry];
                            if(tile.type === 'GRASS' || tile.type === 'SAND') {
                                if(!tile.path) roadLoopExists = false;
                            }
                        }
                    }
                    if(validBlock && avgElev > bestElevation && avgElev >= minElevation) {
                        bestBlock = {x, y, roadLoopExists};
                        bestElevation = avgElev;
                    }
                }
            }
            if(bestBlock) {
                let {x, y, roadLoopExists} = bestBlock;
                if(!roadLoopExists) {
                    console.log(`[AI BUILD] Building road loop around (${x},${y}) first`);
                    buildRoadLoop(game, x, y);
                    return false;
                }
                try {
                    for(let dx2 = 0; dx2 < 2; dx2++) {
                        for(let dy2 = 0; dy2 < 2; dy2++) {
                            game.build(type, x + dx2, y + dy2);
                        }
                    }
                    console.log(`[AI BUILD] SUCCESS: Built 2x2 ${type} at (${x},${y}) elev=${bestElevation.toFixed(2)}`);
                    return true;
                } catch(e) {
                    console.log(`[AI BUILD] FAILED: ${type} at (${x},${y}) - ${e.message}`);
                }
            }
            console.log(`[AI BUILD] No valid 2x2 block found for ${type}`);
            return false;
        } else {
            // Non-zone types (WELL, PATH) build single tile
            for(let attempt = 0; attempt < 30; attempt++) {
                let radius = Math.min(searchRadius, 5 + attempt * 2);
                let dx = Math.floor(Math.random() * radius * 2) - radius;
                let dy = Math.floor(Math.random() * radius * 2) - radius;
                let x = Math.max(0, Math.min(CFG.W - 1, centerX + dx));
                let y = Math.max(0, Math.min(CFG.H - 1, centerY + dy));
                if(this.isValidBuildLocation(game, type, x, y)) {
                    try {
                        game.build(type, x, y);
                        return true;
                    } catch(e) {}
                }
            }
            return false;
        }
    },
    
    isValidBuildLocation(game, type, x, y) {
        if(x < 0 || x >= CFG.W || y < 0 || y >= CFG.H) return false;
        
        let tile = game.tiles[x][y];
        
        // Can't build on water, stone, or existing structures
        if(tile.type === 'WATER' || tile.type === 'DEEP' || tile.type === 'RIVER') return false;
        if(tile.type === 'STONE' || tile.stoneDeposit) return false;
        if(tile.zone || tile.path) return false;
        
        // Check for existing buildings
        for(let bld of game.blds) {
            let sz = (bld.t === 'WELL') ? 1 : 2;
            if(x >= bld.x && x < bld.x + sz && y >= bld.y && y < bld.y + sz) {
                return false;
            }
        }
        
        // Type-specific checks
        if(type === 'RES' || type === 'COM' || type === 'IND') {
            // Prefer GRASS for zones
            return tile.type === 'GRASS';
        }
        
        if(type === 'WELL') {
            // Wells can be on GRASS or SAND
            return tile.type === 'GRASS' || tile.type === 'SAND';
        }
        
        if(type === 'PATH') {
            // Paths on grass or sand, near existing zones
            if(tile.type !== 'GRASS' && tile.type !== 'SAND') return false;
            
            // Must be near a zone
            for(let dx = -3; dx <= 3; dx++) {
                for(let dy = -3; dy <= 3; dy++) {
                    let nx = x + dx, ny = y + dy;
                    if(nx >= 0 && nx < CFG.W && ny >= 0 && ny < CFG.H) {
                        if(game.tiles[nx][ny].zone) return true;
                    }
                }
            }
            return false;
        }
        
        return true;
    },
    
    // ═══════════════════════════════════════════════════════════════
    // CONTROL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════
    
    enable() {
        this.enabled = true;
        this.lastAction = performance.now();
        this.movementHistory = [];
        this.movementPenalty = 0;
        this._lastDebugYear = 0;
        console.log(`🤖 AI ENABLED - Autoplay started [${this.version}]`);
        if(typeof Controller !== 'undefined' && Controller.toast) {
            Controller.toast(`AI Brain: ${this.version}`);
        }
    },
    
    disable() {
        this.enabled = false;
        this.target = null;
        this.pathStuckTimer = null;
        console.log('🤖 AI DISABLED - Manual control resumed');
    },
    
    toggle() {
        if(this.enabled) {
            this.disable();
        } else {
            this.enable();
        }
        return this.enabled;
    },
    
    reset() {
        this.enabled = false;
        this.lastAction = 0;
        this.target = null;
        this.pathStuckTimer = null;
    }
};
