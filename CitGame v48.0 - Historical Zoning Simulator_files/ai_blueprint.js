// ═══════════════════════════════════════════════════════════════════════════════
// CIVIL ZONES - SMART LEARNING AI v3.0
// ═══════════════════════════════════════════════════════════════════════════════
//
// A hybrid AI that combines:
// 1. Rule-based decisions (expert knowledge you teach it)
// 2. Pattern learning (saves what works, remembers failures)
// 3. City blueprints (proven layouts it can follow/adapt)
//
// BUILD STRATEGIES (alternates between 3):
// Strategy 1: "Starter" - Your exact pattern (1 RES, 1 WELL, 2 ROAD, wait, expand)
// Strategy 2: "Balanced" - 4:1:2 ratio (R:C:I)
// Strategy 3: "Housing Heavy" - 6:1:1 ratio (R:C:I)
//
// ═══════════════════════════════════════════════════════════════════════════════

const BlueprintAI = {
    version: 'Smart Learning AI v3.0',
    enabled: false,
    lastAction: 0,
    updateInterval: 200,
    
    // ═══════════════════════════════════════════════════════════════
    // BUILD STRATEGIES - Alternates between these 3
    // ═══════════════════════════════════════════════════════════════
    strategies: {
        current: 0, // Which strategy we're using (0, 1, or 2)
        cycleCount: 0, // How many full build cycles completed
        
        // Strategy 0: YOUR EXACT STARTER PATTERN
        // 1 RES → 1 WELL → 2 ROADS → wait 8 years → 1 RES → wait → 1 RES → 
        // wait → 2 COM → roads → 2 IND → roads
        STARTER: {
            name: 'Starter',
            sequence: [
                { type: 'RES', count: 1 },
                { type: 'WELL', count: 1 },
                { type: 'ROAD', count: 2 },
                { type: 'WAIT', years: 8 },
                { type: 'RES', count: 1 },
                { type: 'WAIT', years: 5 },
                { type: 'RES', count: 1 },
                { type: 'WAIT', years: 5 },
                { type: 'COM', count: 2 },
                { type: 'ROAD', count: 2 },
                { type: 'IND', count: 2 },
                { type: 'ROAD', count: 2 },
            ],
            step: 0,
            subStep: 0, // For counting within a step (e.g., 2 roads)
            waitStartYear: 0
        },
        
        // Strategy 1: BALANCED (4:1:2)
        BALANCED: {
            name: 'Balanced',
            ratio: { R: 4, C: 1, I: 2 },
            roadsPerBuilding: 0.5
        },
        
        // Strategy 2: HOUSING HEAVY (6:1:1)
        HOUSING_HEAVY: {
            name: 'Housing Heavy',
            ratio: { R: 6, C: 1, I: 1 },
            roadsPerBuilding: 0.3
        }
    },
    
    // ═══════════════════════════════════════════════════════════════
    // LEARNED KNOWLEDGE (persisted to localStorage)
    // ═══════════════════════════════════════════════════════════════
    memory: {
        patterns: [],
        stats: {
            gamesPlayed: 0,
            bestPop: 0,
            avgSurvivalYears: 0,
            successfulActions: {},
            failedActions: {}
        },
        blueprints: [],
        watchedActions: []
    },
    
    // ═══════════════════════════════════════════════════════════════
    // CORE RULES
    // ═══════════════════════════════════════════════════════════════
    RULES: {
        WATER_PER_WELL: 100,
        MIN_WELLS_BEFORE_BUILDING: 1,
        WATER_SAFETY_MARGIN: 1.3,
        HOUSING_PER_RES: 10,
        MAX_HOUSING_ABOVE_WATER: 0,
        TARGET_RATIO: { R: 4, C: 1, I: 2 },
        ROADS_PER_BUILDING: 0.5,
        ROAD_COST: 5,
        WELL_COST: 50,
        RES_COST_FOOD: 100,
        RES_COST_WOOD: 100,
        COM_COST_FOOD: 150,
        COM_COST_WOOD: 100,
        IND_COST_FOOD: 200,
        IND_COST_WOOD: 150,
    },
    
    // ═══════════════════════════════════════════════════════════════
    // TRACKING STATE
    // ═══════════════════════════════════════════════════════════════
    cityCenter: null,
    currentRing: 0,
    lastBuildType: null,
    buildSequence: 0,
    builtRoadPositions: new Set(),
    lastYear: 0,
    
    stats: {
        totalBuilt: 0,
        wellsBuilt: 0,
        resBuilt: 0,
        comBuilt: 0,
        indBuilt: 0,
        roadsBuilt: 0,
        turnsAdvanced: 0
    },
    
    // ═══════════════════════════════════════════════════════════════
    // MAIN UPDATE LOOP
    // ═══════════════════════════════════════════════════════════════
    
    update: function(game) {
        if (!this.enabled || !game) return;
        
        // STOP AI if game is over!
        if (game.gameOver) {
            this.enabled = false;
            console.log('[AI v3] Game over detected - AI disabled');
            return;
        }
        
        let now = performance.now();
        if (now - this.lastAction < this.updateInterval) return;
        this.lastAction = now;
        
        if (game.gameState !== 'CITY') return;
        
        if (!this.cityCenter && game.player) {
            this.cityCenter = { x: game.player.x, y: game.player.y };
            console.log('[AI v3] City center:', this.cityCenter);
            this.loadMemory();
        }
        
        // Track year for waiting
        let currentYear = game.year || 0;
        if (currentYear !== this.lastYear) {
            this.lastYear = currentYear;
        }
        
        // Run the appropriate strategy
        this.runStrategy(game);
    },
    
    // ═══════════════════════════════════════════════════════════════
    // RUN STRATEGY - Switches between 3 strategies
    // ═══════════════════════════════════════════════════════════════
    
    runStrategy: function(game) {
        let strategyIndex = this.strategies.current;
        
        if (strategyIndex === 0) {
            // Strategy 0: Your exact starter pattern
            this.runStarterStrategy(game);
        } else if (strategyIndex === 1) {
            // Strategy 1: Balanced 4:1:2
            this.RULES.TARGET_RATIO = this.strategies.BALANCED.ratio;
            this.smartBuild(game);
        } else {
            // Strategy 2: Housing Heavy 6:1:1
            this.RULES.TARGET_RATIO = this.strategies.HOUSING_HEAVY.ratio;
            this.smartBuild(game);
        }
    },
    
    // ═══════════════════════════════════════════════════════════════
    // STARTER STRATEGY - Your exact build pattern!
    // ═══════════════════════════════════════════════════════════════
    
    runStarterStrategy: function(game) {
        let starter = this.strategies.STARTER;
        let state = this.analyzeCity(game);
        let currentYear = game.year || 0;
        
        // Check if we finished the starter sequence
        if (starter.step >= starter.sequence.length) {
            console.log('[AI v3] 🎉 Starter sequence complete! Switching to Balanced strategy.');
            this.strategies.current = 1; // Switch to Balanced
            starter.step = 0;
            starter.subStep = 0;
            this.strategies.cycleCount++;
            return;
        }
        
        let currentAction = starter.sequence[starter.step];
        console.log('[AI v3] Starter Step ' + starter.step + ': ' + currentAction.type + 
                    (currentAction.count ? ' x' + currentAction.count : '') +
                    (currentAction.years ? ' (wait ' + currentAction.years + ' years)' : ''));
        
        // Handle WAIT action
        if (currentAction.type === 'WAIT') {
            if (starter.waitStartYear === 0) {
                starter.waitStartYear = currentYear;
                console.log('[AI v3] ⏳ Waiting ' + currentAction.years + ' years (started at year ' + currentYear + ')');
            }
            
            let yearsWaited = currentYear - starter.waitStartYear;
            if (yearsWaited >= currentAction.years) {
                console.log('[AI v3] ✓ Wait complete! Moving to next step.');
                starter.step++;
                starter.subStep = 0;
                starter.waitStartYear = 0;
            } else {
                // Just pass the year
                if (typeof game.endTurn === 'function') {
                    game.endTurn();
                    this.stats.turnsAdvanced++;
                }
            }
            return;
        }
        
        // Handle build actions
        let targetCount = currentAction.count || 1;
        
        // Check if we can afford it
        if (!this.canAfford(state, currentAction.type)) {
            // Wait for resources
            if (typeof game.endTurn === 'function') {
                game.endTurn();
                this.stats.turnsAdvanced++;
            }
            return;
        }
        
        // Water check for RES
        if (currentAction.type === 'RES' && state.waterCap <= state.housingCap) {
            // Need more water first!
            if (state.food >= this.RULES.WELL_COST) {
                console.log('[AI v3] Need water before RES! Building well first.');
                this.buildNearCenter(game, 'WELL', 0);
            } else {
                if (typeof game.endTurn === 'function') game.endTurn();
            }
            return;
        }
        
        // Build the thing
        let built = false;
        if (currentAction.type === 'ROAD') {
            built = this.buildRoadNearBuilding(game, state);
        } else {
            built = this.buildNearCenter(game, currentAction.type, this.currentRing);
        }
        
        if (built) {
            starter.subStep++;
            console.log('[AI v3] Built ' + currentAction.type + ' (' + starter.subStep + '/' + targetCount + ')');
            
            if (starter.subStep >= targetCount) {
                starter.step++;
                starter.subStep = 0;
                
                // Expand ring after RES builds
                if (currentAction.type === 'RES') {
                    this.currentRing++;
                }
            }
        } else {
            // Couldn't build, pass turn
            if (typeof game.endTurn === 'function') {
                game.endTurn();
                this.stats.turnsAdvanced++;
            }
        }
    },
    
    // ═══════════════════════════════════════════════════════════════
    // SMART BUILD - For Balanced and Housing Heavy strategies
    // ═══════════════════════════════════════════════════════════════
    
    smartBuild: function(game) {
        let state = this.analyzeCity(game);
        
        if (this.stats.totalBuilt % 10 === 0) {
            console.log('[AI v3] Strategy: ' + (this.strategies.current === 1 ? 'Balanced 4:1:2' : 'Housing Heavy 6:1:1'));
            console.log('[AI v3] State:', JSON.stringify({
                pop: state.pop, wells: state.wells, res: state.resCount, 
                com: state.comCount, ind: state.indCount
            }));
        }
        
        // Check if we should switch strategies (every ~20 buildings)
        let totalZones = state.resCount + state.comCount + state.indCount;
        if (totalZones > 0 && totalZones % 20 === 0 && this.lastSwitchCount !== totalZones) {
            this.lastSwitchCount = totalZones;
            this.strategies.current = (this.strategies.current + 1) % 3;
            console.log('[AI v3] 🔄 Switching to strategy ' + this.strategies.current + 
                        ' (' + ['Starter', 'Balanced', 'Housing Heavy'][this.strategies.current] + ')');
            
            if (this.strategies.current === 0) {
                // Reset starter sequence
                this.strategies.STARTER.step = 0;
                this.strategies.STARTER.subStep = 0;
            }
            return;
        }
        
        // PRIORITY 1: WATER
        if (state.wells === 0 && state.food >= this.RULES.WELL_COST) {
            return this.buildNearCenter(game, 'WELL', 0);
        }
        
        let waterUsage = state.pop / Math.max(1, state.waterCap);
        if (waterUsage > 0.7 && state.food >= this.RULES.WELL_COST) {
            return this.buildNearCenter(game, 'WELL', Math.min(state.wells * 2, 10));
        }
        
        let wellsNeeded = Math.ceil(state.housingCap / this.RULES.WATER_PER_WELL * this.RULES.WATER_SAFETY_MARGIN);
        wellsNeeded = Math.max(wellsNeeded, 2);
        
        if (state.wells < wellsNeeded && state.food >= this.RULES.WELL_COST) {
            return this.buildNearCenter(game, 'WELL', Math.min(state.wells * 2, 10));
        }
        
        // PRIORITY 2: ROADS
        let totalBuildings = state.resCount + state.comCount + state.indCount;
        let roadsNeeded = Math.floor(totalBuildings * this.RULES.ROADS_PER_BUILDING);
        
        if (state.roadCount < roadsNeeded && state.food >= this.RULES.ROAD_COST) {
            if (this.buildRoadNearBuilding(game, state)) return;
        }
        
        // PRIORITY 3: BUILDINGS (based on ratio)
        let canAddBuilding = state.waterCap > state.housingCap;
        
        if (canAddBuilding) {
            let buildType = this.getNextBuildType(state);
            
            if (buildType === 'RES' && this.canAfford(state, 'RES')) {
                if (this.buildNearCenter(game, 'RES', this.currentRing)) {
                    this.buildSequence++;
                    if (state.resCount > 0 && state.resCount % 3 === 0) this.currentRing++;
                    return;
                }
            }
            
            if (buildType === 'COM' && this.canAfford(state, 'COM')) {
                if (this.buildNearCenter(game, 'COM', this.currentRing)) {
                    this.buildSequence++;
                    return;
                }
            }
            
            if (buildType === 'IND' && this.canAfford(state, 'IND')) {
                if (this.buildNearCenter(game, 'IND', this.currentRing)) {
                    this.buildSequence++;
                    return;
                }
            }
        }
        
        // PRIORITY 4: WAIT
        if (typeof game.endTurn === 'function') {
            game.endTurn();
            this.stats.turnsAdvanced++;
            
            if (this.stats.turnsAdvanced % 10 === 0) {
                this.saveSnapshot(state);
            }
        }
    },
    
    // ═══════════════════════════════════════════════════════════════
    // GET NEXT BUILD TYPE - Based on current ratio
    // ═══════════════════════════════════════════════════════════════
    
    getNextBuildType: function(state) {
        let r = state.resCount || 0;
        let c = state.comCount || 0;
        let i = state.indCount || 0;
        
        let total = r + c + i + 1;
        let rRatio = r / total;
        let cRatio = c / total;
        let iRatio = i / total;
        
        let targetTotal = this.RULES.TARGET_RATIO.R + this.RULES.TARGET_RATIO.C + this.RULES.TARGET_RATIO.I;
        let rTarget = this.RULES.TARGET_RATIO.R / targetTotal;
        let cTarget = this.RULES.TARGET_RATIO.C / targetTotal;
        let iTarget = this.RULES.TARGET_RATIO.I / targetTotal;
        
        let rDeficit = rTarget - rRatio;
        let cDeficit = cTarget - cRatio;
        let iDeficit = iTarget - iRatio;
        
        // Build what's most needed
        if (rDeficit >= cDeficit && rDeficit >= iDeficit) return 'RES';
        if (iDeficit >= cDeficit) return 'IND';
        return 'COM';
    },
    
    canAfford: function(state, type) {
        if (type === 'RES') return state.food >= this.RULES.RES_COST_FOOD && state.wood >= this.RULES.RES_COST_WOOD;
        if (type === 'COM') return state.food >= this.RULES.COM_COST_FOOD && state.wood >= this.RULES.COM_COST_WOOD;
        if (type === 'IND') return state.food >= this.RULES.IND_COST_FOOD && state.wood >= this.RULES.IND_COST_WOOD;
        if (type === 'WELL') return state.food >= this.RULES.WELL_COST;
        if (type === 'ROAD') return state.food >= this.RULES.ROAD_COST;
        return false;
    },
    
    // ═══════════════════════════════════════════════════════════════
    // BUILD ROAD NEAR BUILDING - Smart placement (NO DOUBLES!)
    // ═══════════════════════════════════════════════════════════════
    
    buildRoadNearBuilding: function(game, state) {
        let buildings = game.blds || [];
        
        for (let b of buildings) {
            if (b.t === 'WELL') continue;
            
            let adjacentPositions = [
                {x: b.x - 1, y: b.y}, {x: b.x + 1, y: b.y},
                {x: b.x, y: b.y - 1}, {x: b.x, y: b.y + 1},
                {x: b.x + 2, y: b.y}, {x: b.x + 2, y: b.y + 1},
                {x: b.x - 1, y: b.y + 1}, {x: b.x, y: b.y + 2}, {x: b.x + 1, y: b.y + 2}
            ];
            
            for (let pos of adjacentPositions) {
                let key = pos.x + ',' + pos.y;
                if (this.builtRoadPositions.has(key)) continue;
                if (game.tiles && game.tiles[pos.x] && game.tiles[pos.x][pos.y]) {
                    if (game.tiles[pos.x][pos.y].road) continue;
                }
                
                if (this.canBuildAt(game, pos.x, pos.y, 'ROAD')) {
                    if (this.build(game, 'ROAD', pos.x, pos.y)) {
                        this.builtRoadPositions.add(key);
                        return true;
                    }
                }
            }
        }
        return false;
    },
    
    analyzeCity: function(game) {
        let blds = game.blds || [];
        let wells = blds.filter(b => b.t === 'WELL').length;
        let resCount = blds.filter(b => b.t === 'RES').length;
        let comCount = blds.filter(b => b.t === 'COM').length;
        let indCount = blds.filter(b => b.t === 'IND').length;
        
        let roadCount = 0;
        if (game.tiles) {
            for (let x = 0; x < game.tiles.length; x++) {
                for (let y = 0; y < game.tiles[x].length; y++) {
                    if (game.tiles[x][y] && game.tiles[x][y].road) roadCount++;
                }
            }
        }
        
        return {
            pop: game.pop || 0,
            food: game.food || 0,
            wood: game.wood || 0,
            wells: wells,
            waterCap: wells * this.RULES.WATER_PER_WELL,
            housingCap: game.housingCap || 0,
            resCount: resCount,
            comCount: comCount,
            indCount: indCount,
            roadCount: roadCount
        };
    },
    
    buildNearCenter: function(game, type, minDistance) {
        if (!this.cityCenter && game.player) {
            this.cityCenter = { x: game.player.x, y: game.player.y };
        }
        if (!this.cityCenter) return false;
        
        let cx = this.cityCenter.x, cy = this.cityCenter.y;
        
        for (let dist = minDistance; dist < 50; dist++) {
            let positions = this.getPositionsAtDistance(cx, cy, dist);
            this.shuffle(positions);
            
            for (let pos of positions) {
                if (this.canBuildAt(game, pos.x, pos.y, type)) {
                    return this.build(game, type, pos.x, pos.y);
                }
            }
        }
        return false;
    },
    
    getPositionsAtDistance: function(cx, cy, dist) {
        let positions = [];
        if (dist === 0) { positions.push({x: cx, y: cy}); return positions; }
        
        for (let x = cx - dist; x <= cx + dist; x++) {
            positions.push({x: x, y: cy - dist});
            positions.push({x: x, y: cy + dist});
        }
        for (let y = cy - dist + 1; y < cy + dist; y++) {
            positions.push({x: cx - dist, y: y});
            positions.push({x: cx + dist, y: y});
        }
        return positions;
    },
    
    shuffle: function(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    },
    
    canBuildAt: function(game, x, y, type) {
        if (!game.tiles || x < 2 || y < 2) return false;
        if (x >= game.tiles.length - 2) return false;
        if (!game.tiles[x] || y >= game.tiles[x].length - 2) return false;
        
        let tile = game.tiles[x][y];
        if (!tile) return false;
        if (!tile.explored) return false;
        if (['WATER', 'DEEP', 'RIVER', 'STONE'].includes(tile.type)) return false;
        if (tile.zone || tile.building) return false;
        if (type === 'ROAD' && tile.road) return false;
        if (type !== 'ROAD' && tile.road) return false;
        
        if (game.blds) {
            for (let b of game.blds) {
                let sz = (b.t === 'WELL' || b.t === 'COM' || b.t === 'IND') ? 1 : 2;
                if (x >= b.x && x < b.x + sz && y >= b.y && y < b.y + sz) return false;
            }
        }
        
        if (type === 'RES') {
            for (let dx = 0; dx < 2; dx++) {
                for (let dy = 0; dy < 2; dy++) {
                    let tx = x + dx, ty = y + dy;
                    if (tx >= game.tiles.length || ty >= game.tiles[0].length) return false;
                    let t = game.tiles[tx][ty];
                    if (!t || !t.explored) return false;
                    if (['WATER', 'DEEP', 'RIVER', 'STONE'].includes(t.type)) return false;
                    if (t.zone || t.road || t.building) return false;
                    
                    if (game.blds) {
                        for (let b of game.blds) {
                            let sz = (b.t === 'WELL' || b.t === 'COM' || b.t === 'IND') ? 1 : 2;
                            if (tx >= b.x && tx < b.x + sz && ty >= b.y && ty < b.y + sz) return false;
                        }
                    }
                }
            }
        }
        return true;
    },
    
    build: function(game, type, x, y) {
        if (typeof game.build !== 'function') return false;
        
        try {
            game.build(type, x, y);
            this.stats.totalBuilt++;
            if (type === 'WELL') this.stats.wellsBuilt++;
            if (type === 'RES') this.stats.resBuilt++;
            if (type === 'COM') this.stats.comBuilt++;
            if (type === 'IND') this.stats.indBuilt++;
            if (type === 'ROAD') {
                this.stats.roadsBuilt++;
                this.builtRoadPositions.add(x + ',' + y);
            }
            this.lastBuildType = type;
            this.recordAction(type, true);
            return true;
        } catch (e) {
            this.recordAction(type, false);
            return false;
        }
    },
    
    // ═══════════════════════════════════════════════════════════════
    // LEARNING & MEMORY
    // ═══════════════════════════════════════════════════════════════
    
    recordAction: function(action, success) {
        if (success) {
            this.memory.stats.successfulActions[action] = (this.memory.stats.successfulActions[action] || 0) + 1;
        } else {
            this.memory.stats.failedActions[action] = (this.memory.stats.failedActions[action] || 0) + 1;
        }
    },
    
    saveSnapshot: function(state) {
        let snapshot = {
            pop: state.pop,
            ratio: { res: state.resCount, com: state.comCount, ind: state.indCount },
            wells: state.wells,
            year: this.stats.turnsAdvanced,
            strategy: this.strategies.current
        };
        
        if (state.pop > (this.memory.stats.bestPop * 0.8)) {
            this.memory.patterns.push(snapshot);
            if (this.memory.patterns.length > 100) this.memory.patterns.shift();
            if (state.pop > this.memory.stats.bestPop) {
                this.memory.stats.bestPop = state.pop;
            }
            this.saveMemory();
        }
    },
    
    saveMemory: function() {
        try {
            localStorage.setItem('blueprint_ai_memory', JSON.stringify(this.memory));
        } catch (e) {}
    },
    
    loadMemory: function() {
        try {
            let saved = localStorage.getItem('blueprint_ai_memory');
            if (saved) {
                this.memory = JSON.parse(saved);
                console.log('[AI v3] Memory loaded - Best pop:', this.memory.stats.bestPop);
            }
        } catch (e) {}
    },
    
    // ═══════════════════════════════════════════════════════════════
    // CONTROL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════
    
    enable: function() {
        this.enabled = true;
        this.loadMemory();
        console.log('[AI v3] ' + this.version + ' ENABLED');
        console.log('[AI v3] Starting with STARTER strategy (your pattern!)');
    },
    
    disable: function() {
        this.enabled = false;
        this.saveMemory();
        console.log('[AI v3] DISABLED');
    },
    
    reset: function() {
        this.cityCenter = null;
        this.currentRing = 0;
        this.buildSequence = 0;
        this.builtRoadPositions = new Set();
        this.strategies.current = 0;
        this.strategies.STARTER.step = 0;
        this.strategies.STARTER.subStep = 0;
        this.strategies.STARTER.waitStartYear = 0;
        this.lastYear = 0;
        this.lastSwitchCount = 0;
        this.stats = { totalBuilt: 0, wellsBuilt: 0, resBuilt: 0, comBuilt: 0, indBuilt: 0, roadsBuilt: 0, turnsAdvanced: 0 };
    },
    
    setBlueprint: function(name) {
        console.log('[AI v3] Blueprint: ' + name);
    },
    
    status: function() {
        return {
            enabled: this.enabled,
            version: this.version,
            stats: this.stats,
            currentStrategy: ['Starter', 'Balanced 4:1:2', 'Housing Heavy 6:1:1'][this.strategies.current],
            starterStep: this.strategies.STARTER.step
        };
    },
    
    getLearningStats: function() {
        return {
            patternsLearned: this.memory.patterns.length,
            bestPop: this.memory.stats.bestPop,
            successfulActions: this.memory.stats.successfulActions,
            currentStrategy: this.strategies.current,
            watchedActions: this.memory.watchedActions ? this.memory.watchedActions.length : 0
        };
    },
    
    clearMemory: function() {
        this.memory = { patterns: [], stats: { gamesPlayed: 0, bestPop: 0, successfulActions: {}, failedActions: {} }, blueprints: [], watchedActions: [] };
        localStorage.removeItem('blueprint_ai_memory');
    },
    
    // ═══════════════════════════════════════════════════════════════
    // WATCH MODE
    // ═══════════════════════════════════════════════════════════════
    
    watchMode: false,
    watchedBuilds: [],
    
    startWatching: function() {
        this.watchMode = true;
        this.watchedBuilds = [];
        console.log('[AI v3] 👀 WATCH MODE ENABLED');
    },
    
    stopWatching: function() {
        this.watchMode = false;
        if (this.watchedBuilds.length > 0) {
            if (!this.memory.watchedActions) this.memory.watchedActions = [];
            let lesson = {
                timestamp: Date.now(),
                builds: this.watchedBuilds.slice(),
                buildOrder: this.watchedBuilds.map(b => b.type)
            };
            this.memory.watchedActions.push(lesson);
            if (this.memory.watchedActions.length > 20) this.memory.watchedActions.shift();
            this.saveMemory();
            console.log('[AI v3] 📚 Learned: ' + lesson.buildOrder.join(' → '));
        }
        this.watchedBuilds = [];
    },
    
    recordPlayerBuild: function(type, x, y, game) {
        if (!this.watchMode) return;
        let state = this.analyzeCity(game);
        this.watchedBuilds.push({
            type: type, x: x, y: y,
            stateWhen: { pop: state.pop, food: state.food, wells: state.wells }
        });
        console.log('[AI v3] 👁️ Watched: ' + type);
    },
    
    applyLesson: function() {
        if (!this.memory.watchedActions || this.memory.watchedActions.length === 0) {
            console.log('[AI v3] No lessons yet!');
            return;
        }
        let lesson = this.memory.watchedActions[this.memory.watchedActions.length - 1];
        let counts = { WELL: 0, RES: 0, COM: 0, IND: 0 };
        for (let b of lesson.builds) {
            if (counts[b.type] !== undefined) counts[b.type]++;
        }
        let total = counts.RES + counts.COM + counts.IND;
        if (total > 0) {
            let gcd = (a, b) => b ? gcd(b, a % b) : a;
            let g = gcd(gcd(counts.RES || 1, counts.COM || 1), counts.IND || 1);
            this.RULES.TARGET_RATIO = {
                R: Math.round((counts.RES || 1) / g),
                C: Math.round((counts.COM || 1) / g),
                I: Math.round((counts.IND || 1) / g)
            };
            console.log('[AI v3] Applied ratio: ' + this.RULES.TARGET_RATIO.R + ':' + this.RULES.TARGET_RATIO.C + ':' + this.RULES.TARGET_RATIO.I);
        }
    }
};

if (typeof window !== 'undefined') {
    window.BlueprintAI = BlueprintAI;
}
