// ═══════════════════════════════════════════════════════════════════════════════
// CIVIL ZONES - BLUEPRINT-BASED AI SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
//
// This replaces Q-Learning with a deterministic, blueprint-based approach.
// The AI follows predefined city layouts and knows exactly what to build where.
//
// PHILOSOPHY:
// - Complex cities = simple rules applied consistently
// - AI doesn't "learn" - it executes proven strategies
// - User can define city styles/blueprints
// - Predictable, controllable, scalable to millions of population
//
// ═══════════════════════════════════════════════════════════════════════════════

const BlueprintAI = {
    version: 'Blueprint AI v1.0',
    enabled: false,
    currentBlueprint: null,
    buildQueue: [],
    lastAction: 0,
    updateInterval: 100,
    
    // ═══════════════════════════════════════════════════════════════
    // CITY BLUEPRINTS - Predefined successful city patterns
    // ═══════════════════════════════════════════════════════════════
    
    blueprints: {
        // GRID CITY: Classic SimCity-style grid layout
        // Wells in center, residential in rings, commercial on corners
        grid: {
            name: 'Grid City',
            description: 'Classic grid pattern with wells in center',
            targetPop: 100000,
            
            // The pattern repeats in "blocks"
            // Each block is 6x6 tiles
            blockSize: 6,
            
            // Block layout (relative positions)
            // W=Well, R=Residential, C=Commercial, I=Industrial, .=Road
            blockPattern: [
                '.', '.', '.', '.', '.', '.',
                '.', 'R', 'R', 'R', 'R', '.',
                '.', 'R', 'W', 'W', 'R', '.',
                '.', 'R', 'W', 'W', 'R', '.',
                '.', 'R', 'R', 'R', 'R', '.',
                '.', '.', '.', '.', '.', '.'
            ],
            
            // How many blocks to build in each ring
            rings: [
                { radius: 1, blocks: 4, type: 'core' },      // Center: 4 blocks (pop ~3200)
                { radius: 2, blocks: 8, type: 'inner' },     // Inner ring: 8 blocks
                { radius: 3, blocks: 12, type: 'middle' },   // Middle ring
                { radius: 4, blocks: 16, type: 'outer' },    // Outer ring
                { radius: 5, blocks: 20, type: 'suburbs' }   // Suburbs
            ],
            
            // Ratios per block
            perBlock: {
                wells: 4,        // 4 wells per block = 400 water capacity
                residential: 8,  // 8 RES = ~800 housing if upgraded
                roads: 20        // Border roads
            }
        },
        
        // LINEAR CITY: Long strip along a river/road
        linear: {
            name: 'Linear City',
            description: 'Long strip city, good for rivers',
            targetPop: 50000,
            
            // Build in segments along X axis
            segmentWidth: 4,
            segmentPattern: ['R', 'W', 'R', '.'],
            
            // Grow by adding segments
            maxSegments: 100
        },
        
        // DISTRICT CITY: Separate zones for R/C/I
        district: {
            name: 'District City',
            description: 'Separated residential, commercial, industrial zones',
            targetPop: 200000,
            
            // Zone placement
            zones: {
                residential: { startX: 0, startY: 0, width: 20, height: 20 },
                commercial: { startX: 22, startY: 0, width: 10, height: 10 },
                industrial: { startX: 22, startY: 12, width: 10, height: 10 },
                wells: { startX: 10, startY: 10, width: 4, height: 4 }  // Central water district
            }
        },
        
        // RADIAL CITY: Circular pattern expanding from center
        radial: {
            name: 'Radial City',
            description: 'Circular expansion from central plaza',
            targetPop: 500000,
            
            // Center is a plaza with wells
            center: { type: 'WELL', count: 9 },  // 3x3 wells = 900 water
            
            // Rings expand outward
            rings: [
                { radius: 3, types: ['RES', 'RES', 'RES', 'RES'] },
                { radius: 5, types: ['RES', 'COM', 'RES', 'COM'] },
                { radius: 7, types: ['RES', 'RES', 'IND', 'RES'] },
                { radius: 9, types: ['RES', 'COM', 'RES', 'IND'] }
            ]
        }
    },
    
    // ═══════════════════════════════════════════════════════════════
    // CITY RULES - The "wisdom" of city building
    // These are FACTS, not learned patterns
    // ═══════════════════════════════════════════════════════════════
    
    rules: {
        // WATER: 1 well per 100 people, ALWAYS build wells FIRST
        water: {
            wellCapacity: 100,
            safetyBuffer: 1.2,  // 20% extra capacity
            
            // Calculate wells needed for target population
            wellsNeeded: function(pop) {
                return Math.ceil(pop / this.wellCapacity * this.safetyBuffer);
            }
        },
        
        // HOUSING: Build residential to match well capacity
        housing: {
            perWell: 100,  // Don't exceed water capacity
            
            // Residential building capacities by level
            capacity: {
                1: 10,   // Hut
                2: 25,   // House
                3: 50,   // Manor
                4: 100,  // Apartment
                5: 250,  // Tower
                6: 500   // Skyscraper
            }
        },
        
        // RATIOS: Optimal R:C:I balance
        ratios: {
            residential: 0.60,  // 60% of zones
            commercial: 0.25,   // 25% of zones
            industrial: 0.15    // 15% of zones
        },
        
        // SPACING: How far apart buildings should be
        spacing: {
            wellFromWell: 3,      // Wells should be 3+ tiles apart
            resFromRes: 1,        // RES can be adjacent
            indFromRes: 5,        // Industrial away from residential
            roadInterval: 4       // Road every 4 tiles
        }
    },
    
    // ═══════════════════════════════════════════════════════════════
    // MAIN AI LOOP
    // ═══════════════════════════════════════════════════════════════
    
    update: function(game) {
        if (!this.enabled || !game) return;
        
        let now = performance.now();
        if (now - this.lastAction < this.updateInterval) return;
        this.lastAction = now;
        
        // WANDER mode: Gather resources and settle
        if (game.gameState === 'WANDER') {
            this.wanderPhase(game);
            return;
        }
        
        // CITY mode: Execute blueprint
        if (game.gameState === 'CITY') {
            this.buildPhase(game);
            return;
        }
    },
    
    // ═══════════════════════════════════════════════════════════════
    // WANDER PHASE: Quick resource gathering, then settle
    // ═══════════════════════════════════════════════════════════════
    
    wanderPhase: function(game) {
        // Simple wander: collect resources until we can settle
        let pop = game.pop || 0;
        let food = game.inventory ? game.inventory.food : 0;
        let wood = game.inventory ? game.inventory.wood : 0;
        
        // Settle requirements (be generous)
        let canSettle = pop >= 5 && food >= 100 && wood >= 30;
        
        // Check if near water
        let nearWater = this.isNearWater(game);
        
        if (canSettle && nearWater) {
            // SETTLE!
            if (typeof game.settleHere === 'function') {
                game.settleHere();
                console.log('[Blueprint AI] Settled! Starting city construction.');
                this.initializeBlueprint(game);
            }
            return;
        }
        
        // Keep wandering to gather resources
        if (typeof game.moveRandom === 'function') {
            game.moveRandom();
        }
    },
    
    // ═══════════════════════════════════════════════════════════════
    // BUILD PHASE: Execute the blueprint
    // ═══════════════════════════════════════════════════════════════
    
    buildPhase: function(game) {
        let pop = game.pop || 0;
        let food = game.food || 0;
        let wood = game.wood || 0;
        let wellCount = game.wellCount || 0;
        let housingCap = game.housingCap || 0;
        
        // PRIORITY 1: WELLS (most critical)
        let wellsNeeded = this.rules.water.wellsNeeded(pop + 100); // Plan ahead
        if (wellCount < wellsNeeded && food >= 50) {
            this.buildWell(game);
            return;
        }
        
        // PRIORITY 2: HOUSING (if at capacity)
        if (pop >= housingCap - 5 && food >= 100 && wood >= 100) {
            this.buildResidential(game);
            return;
        }
        
        // PRIORITY 3: EXPAND according to blueprint
        if (this.buildQueue.length > 0) {
            this.executeNextBuild(game);
            return;
        }
        
        // PRIORITY 4: End turn to grow population
        if (typeof game.endTurn === 'function') {
            game.endTurn();
        }
    },
    
    // ═══════════════════════════════════════════════════════════════
    // BLUEPRINT EXECUTION
    // ═══════════════════════════════════════════════════════════════
    
    initializeBlueprint: function(game) {
        // Default to grid city
        this.currentBlueprint = this.blueprints.grid;
        this.buildQueue = [];
        
        // Generate build queue from blueprint
        this.generateBuildQueue(game);
        
        console.log(`[Blueprint AI] Initialized ${this.currentBlueprint.name}`);
        console.log(`[Blueprint AI] Build queue: ${this.buildQueue.length} items`);
    },
    
    generateBuildQueue: function(game) {
        let bp = this.currentBlueprint;
        let centerX = game.player ? game.player.x : 50;
        let centerY = game.player ? game.player.y : 50;
        
        // For grid city: generate blocks around center
        if (bp.name === 'Grid City') {
            this.generateGridCity(centerX, centerY, bp);
        }
    },
    
    generateGridCity: function(centerX, centerY, bp) {
        let blockSize = bp.blockSize;
        
        // Start with core block (center)
        this.addBlockToBuildQueue(centerX, centerY, bp.blockPattern, blockSize);
        
        // Add surrounding blocks in rings
        for (let ring of bp.rings) {
            let offsets = this.getRingOffsets(ring.radius, blockSize);
            for (let offset of offsets) {
                let bx = centerX + offset.x;
                let by = centerY + offset.y;
                this.addBlockToBuildQueue(bx, by, bp.blockPattern, blockSize);
            }
        }
    },
    
    addBlockToBuildQueue: function(startX, startY, pattern, blockSize) {
        // First pass: Roads (foundation)
        for (let i = 0; i < pattern.length; i++) {
            if (pattern[i] === '.') {
                let x = startX + (i % blockSize);
                let y = startY + Math.floor(i / blockSize);
                this.buildQueue.push({ type: 'ROAD', x: x, y: y });
            }
        }
        
        // Second pass: Wells (critical infrastructure)
        for (let i = 0; i < pattern.length; i++) {
            if (pattern[i] === 'W') {
                let x = startX + (i % blockSize);
                let y = startY + Math.floor(i / blockSize);
                this.buildQueue.push({ type: 'WELL', x: x, y: y });
            }
        }
        
        // Third pass: Residential
        for (let i = 0; i < pattern.length; i++) {
            if (pattern[i] === 'R') {
                let x = startX + (i % blockSize);
                let y = startY + Math.floor(i / blockSize);
                this.buildQueue.push({ type: 'RES', x: x, y: y });
            }
        }
        
        // Fourth pass: Commercial
        for (let i = 0; i < pattern.length; i++) {
            if (pattern[i] === 'C') {
                let x = startX + (i % blockSize);
                let y = startY + Math.floor(i / blockSize);
                this.buildQueue.push({ type: 'COM', x: x, y: y });
            }
        }
        
        // Fifth pass: Industrial
        for (let i = 0; i < pattern.length; i++) {
            if (pattern[i] === 'I') {
                let x = startX + (i % blockSize);
                let y = startY + Math.floor(i / blockSize);
                this.buildQueue.push({ type: 'IND', x: x, y: y });
            }
        }
    },
    
    getRingOffsets: function(radius, blockSize) {
        let offsets = [];
        let d = radius * blockSize;
        
        // Top and bottom
        for (let x = -radius; x <= radius; x++) {
            offsets.push({ x: x * blockSize, y: -d });
            offsets.push({ x: x * blockSize, y: d });
        }
        
        // Left and right (excluding corners)
        for (let y = -radius + 1; y < radius; y++) {
            offsets.push({ x: -d, y: y * blockSize });
            offsets.push({ x: d, y: y * blockSize });
        }
        
        return offsets;
    },
    
    executeNextBuild: function(game) {
        if (this.buildQueue.length === 0) return;
        
        let next = this.buildQueue[0];
        let cost = this.getBuildCost(next.type);
        
        // Check if we can afford it
        if (game.food >= cost.food && game.wood >= cost.wood) {
            // Try to build
            if (typeof game.build === 'function') {
                try {
                    game.build(next.type, next.x, next.y);
                    this.buildQueue.shift(); // Remove from queue
                    console.log(`[Blueprint AI] Built ${next.type} at (${next.x}, ${next.y})`);
                } catch (e) {
                    // Can't build here, skip
                    this.buildQueue.shift();
                }
            }
        }
    },
    
    getBuildCost: function(type) {
        // Use game config if available
        switch (type) {
            case 'WELL': return { food: 50, wood: 0 };
            case 'RES': return { food: 100, wood: 100 };
            case 'COM': return { food: 200, wood: 200 };
            case 'IND': return { food: 1000, wood: 1000 };
            case 'ROAD': return { food: 5, wood: 0 };
            default: return { food: 100, wood: 100 };
        }
    },
    
    // ═══════════════════════════════════════════════════════════════
    // HELPER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════
    
    buildWell: function(game) {
        // Find best spot for well (high ground, near center)
        let centerX = game.player ? game.player.x : 50;
        let centerY = game.player ? game.player.y : 50;
        
        // Search in expanding rings
        for (let r = 1; r <= 20; r++) {
            for (let dx = -r; dx <= r; dx++) {
                for (let dy = -r; dy <= r; dy++) {
                    if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
                    
                    let x = centerX + dx;
                    let y = centerY + dy;
                    
                    if (this.canBuildAt(game, x, y)) {
                        if (typeof game.build === 'function') {
                            game.build('WELL', x, y);
                            console.log(`[Blueprint AI] Built WELL at (${x}, ${y})`);
                            return;
                        }
                    }
                }
            }
        }
    },
    
    buildResidential: function(game) {
        let centerX = game.player ? game.player.x : 50;
        let centerY = game.player ? game.player.y : 50;
        
        for (let r = 1; r <= 30; r++) {
            for (let dx = -r; dx <= r; dx++) {
                for (let dy = -r; dy <= r; dy++) {
                    if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
                    
                    let x = centerX + dx;
                    let y = centerY + dy;
                    
                    if (this.canBuildAt(game, x, y)) {
                        if (typeof game.build === 'function') {
                            game.build('RES', x, y);
                            console.log(`[Blueprint AI] Built RES at (${x}, ${y})`);
                            return;
                        }
                    }
                }
            }
        }
    },
    
    canBuildAt: function(game, x, y) {
        if (!game.tiles || x < 0 || y < 0) return false;
        if (x >= game.tiles.length || y >= game.tiles[0].length) return false;
        
        let tile = game.tiles[x][y];
        if (!tile) return false;
        
        // Can't build on water, stone, existing structures
        if (tile.type === 'WATER' || tile.type === 'DEEP' || tile.type === 'RIVER') return false;
        if (tile.type === 'STONE') return false;
        if (tile.zone || tile.road) return false;
        
        return true;
    },
    
    isNearWater: function(game) {
        if (!game.player || !game.tiles) return false;
        
        let px = game.player.x;
        let py = game.player.y;
        
        for (let dx = -3; dx <= 3; dx++) {
            for (let dy = -3; dy <= 3; dy++) {
                let x = px + dx;
                let y = py + dy;
                
                if (x < 0 || y < 0 || x >= game.tiles.length || y >= game.tiles[0].length) continue;
                
                let tile = game.tiles[x][y];
                if (tile && (tile.type === 'WATER' || tile.type === 'RIVER')) {
                    return true;
                }
            }
        }
        return false;
    },
    
    // ═══════════════════════════════════════════════════════════════
    // CONTROL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════
    
    enable: function() {
        this.enabled = true;
        console.log(`🏗️ ${this.version} ENABLED`);
    },
    
    disable: function() {
        this.enabled = false;
        console.log('🏗️ Blueprint AI DISABLED');
    },
    
    setBlueprint: function(name) {
        if (this.blueprints[name]) {
            this.currentBlueprint = this.blueprints[name];
            this.buildQueue = [];
            console.log(`[Blueprint AI] Switched to: ${this.currentBlueprint.name}`);
        }
    },
    
    // Show current status
    status: function() {
        return {
            enabled: this.enabled,
            blueprint: this.currentBlueprint ? this.currentBlueprint.name : 'None',
            queueLength: this.buildQueue.length,
            version: this.version
        };
    }
};

// Export for use
if (typeof window !== 'undefined') {
    window.BlueprintAI = BlueprintAI;
}
