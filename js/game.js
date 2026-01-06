// ═══════════════════════════════════════════════════════════════════════════════
// CIVIL ZONES: STONE AGE - Game State & Logic
// ═══════════════════════════════════════════════════════════════════════════════
// Core game state, player management, game modes
// ═══════════════════════════════════════════════════════════════════════════════

class Game {
    constructor() {
        // Core State
        this.mode = 'WANDER';       // WANDER | CITY
        this.level = 0;             // Level 0 = nomadic, Level 1 = settled
        this.year = CFG.TIME.START_YEAR;
        this.paused = false;
        this.gameOver = false;
        
        // Map reference
        this.map = null;
        
        // Player (WANDER mode)
        this.player = {
            x: 0,
            y: 0,
            population: CFG.START.POPULATION,
            food: CFG.START.FOOD,
            wood: CFG.START.WOOD,
            stone: CFG.START.STONE,
            thirst: CFG.START.THIRST,
            stepsTaken: 0,
            inventoryCapacity: CFG.START.INVENTORY_CAPACITY,
        };
        
        // Settlement (CITY mode)
        this.settlement = {
            name: '',
            x: 0,
            y: 0,
            founded: 0,
            wells: 0,
            buildings: { RES: 0, COM: 0, IND: 0 },
            totalPopulation: 0,
            income: 0,
        };
        
        // Wells placed on map
        this.wells = [];
        
        // Statistics
        this.stats = {
            tilesExplored: 0,
            animalsHunted: 0,
            nomadsRecruited: 0,
            berriesCollected: 0,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Initialize Game
    // ─────────────────────────────────────────────────────────────────────────
    init() {
        console.log('[Game] Initializing...');
        
        this.map = new GameMap();
        this.map.init();
        
        // Find valid starting position
        this.spawnPlayer();
        
        // Reveal starting area
        this.map.revealArea(this.player.x, this.player.y, CFG.VISION.WANDER_RADIUS);
        
        console.log('[Game] Ready! Mode: WANDER, Level: 0');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Player Spawning
    // ─────────────────────────────────────────────────────────────────────────
    spawnPlayer() {
        const centerX = Math.floor(this.map.width / 2);
        const centerY = Math.floor(this.map.height / 2);
        
        // Spiral outward to find valid spawn
        for (let radius = 0; radius < 20; radius++) {
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const x = centerX + dx;
                    const y = centerY + dy;
                    if (this.map.isPassable(x, y)) {
                        this.player.x = x;
                        this.player.y = y;
                        console.log(`[Game] Player spawned at (${x}, ${y})`);
                        return;
                    }
                }
            }
        }
        
        console.error('[Game] Could not find valid spawn!');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Movement (WANDER mode)
    // ─────────────────────────────────────────────────────────────────────────
    movePlayer(dx, dy) {
        if (this.mode !== 'WANDER' || this.paused || this.gameOver) return false;
        
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        // Check bounds and passability
        if (!this.map.isPassable(newX, newY)) {
            Utils.showToast("Cannot move there!", "warning");
            return false;
        }
        
        // Move player
        this.player.x = newX;
        this.player.y = newY;
        this.player.stepsTaken++;
        
        // Reveal new area
        this.map.revealArea(newX, newY, CFG.VISION.WANDER_RADIUS);
        
        // Consume thirst
        this.player.thirst -= CFG.THIRST.DRAIN_PER_STEP;
        if (this.player.thirst <= CFG.THIRST.WARNING) {
            Utils.showToast("You're getting thirsty!", "warning");
        }
        if (this.player.thirst <= 0) {
            this.handleThirstDeath();
        }
        
        // Consume food periodically
        if (this.player.stepsTaken % CFG.MOVE.STEPS_PER_FOOD === 0) {
            const foodNeeded = this.player.population * CFG.MOVE.FOOD_PER_PERSON;
            this.player.food -= foodNeeded;
            if (this.player.food <= 0) {
                this.handleStarvation();
            }
        }
        
        // Check for tile interactions
        this.checkTileInteractions(newX, newY);
        
        // Check map expansion
        this.map.checkExpand(newX, newY);
        
        return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Tile Interactions
    // ─────────────────────────────────────────────────────────────────────────
    checkTileInteractions(x, y) {
        const tile = this.map.getTile(x, y);
        if (!tile) return;
        
        // Check for water (refill thirst)
        if (this.isNearWater(x, y)) {
            this.player.thirst = CFG.THIRST.MAX;
            Utils.showToast("Refilled water!", "success");
        }
        
        // Check for entities
        const entity = this.map.getEntityAt(x, y);
        if (entity) {
            this.collectEntity(entity);
        }
        
        // Check for animals
        const animal = this.map.getAnimalAt(x, y);
        if (animal) {
            this.showAnimalEncounter(animal);
        }
    }

    isNearWater(x, y) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (this.map.isWater(x + dx, y + dy)) {
                    return true;
                }
            }
        }
        // Also check wells
        return this.wells.some(w => w.x === x && w.y === y);
    }

    collectEntity(entity) {
        switch (entity.type) {
            case 'BERRY':
                const berryGain = Math.min(entity.amount, this.getRemainingCapacity());
                this.player.food += berryGain;
                Utils.showToast(`Found ${berryGain} berries!`, "success");
                this.stats.berriesCollected++;
                break;
                
            case 'NOMAD':
                this.player.population += entity.amount;
                Utils.showToast(`A nomad joined your tribe! (+${entity.amount} pop)`, "success");
                this.stats.nomadsRecruited++;
                break;
                
            case 'STONE':
                const stoneGain = Math.min(entity.amount, this.getRemainingCapacity());
                this.player.stone += stoneGain;
                Utils.showToast(`Found ${stoneGain} stone!`, "success");
                break;
        }
        
        this.map.collectEntity(entity);
    }

    getRemainingCapacity() {
        const current = this.player.food + this.player.wood + this.player.stone;
        return Math.max(0, this.player.inventoryCapacity - current);
    }

    showAnimalEncounter(animal) {
        // For now, auto-hunt. Later: add encounter menu
        const success = Utils.chance(0.7); // 70% success rate
        if (success) {
            const foodGain = Math.min(animal.food * animal.herdSize, this.getRemainingCapacity());
            this.player.food += foodGain;
            Utils.showToast(`Hunted ${animal.type} herd! (+${foodGain} food)`, "success");
            this.stats.animalsHunted++;
            this.map.removeAnimal(animal);
        } else {
            const damage = Utils.random(CFG.HERD_DAMAGE.MIN, CFG.HERD_DAMAGE.MAX);
            if (damage >= this.player.population) {
                this.handleHerdDeath();
            } else {
                this.player.population -= damage;
                Utils.showToast(`Hunt failed! Lost ${damage} tribe member(s).`, "error");
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Tree Chopping
    // ─────────────────────────────────────────────────────────────────────────
    chopTree() {
        const tile = this.map.getTile(this.player.x, this.player.y);
        if (tile?.hasTree) {
            const woodGain = Math.min(CFG.TREE_WOOD, this.getRemainingCapacity());
            this.player.wood += woodGain;
            tile.hasTree = false;
            Utils.showToast(`Chopped tree! (+${woodGain} wood)`, "success");
            return true;
        }
        Utils.showToast("No tree here!", "warning");
        return false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Well Placement (Works in both WANDER and CITY mode)
    // ─────────────────────────────────────────────────────────────────────────
    placeWell() {
        const { x, y } = this.player;
        const cost = CFG.WELL.cost;
        
        // Check resources
        if (this.player.food < cost.food || this.player.wood < cost.wood) {
            Utils.showToast(`Need ${cost.food} food and ${cost.wood} wood for Water Pit`, "warning");
            return false;
        }
        
        // Check if tile is valid
        const tile = this.map.getTile(x, y);
        if (!tile?.passable || tile.building) {
            Utils.showToast("Cannot place well here!", "warning");
            return false;
        }
        
        // Place well
        this.player.food -= cost.food;
        this.player.wood -= cost.wood;
        
        const well = {
            id: `well_${Date.now()}`,
            x,
            y,
            capacity: CFG.WELL.capacity,
        };
        this.wells.push(well);
        
        Utils.showToast(`Built ${CFG.WELL.name}!`, "success");
        return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Settlement (Level 0 → Level 1)
    // ─────────────────────────────────────────────────────────────────────────
    canSettle() {
        const { population, food, wood } = this.player;
        const req = CFG.SETTLE;
        
        if (population < req.MIN_POP) return { ok: false, reason: `Need ${req.MIN_POP} population` };
        if (food < req.MIN_FOOD) return { ok: false, reason: `Need ${req.MIN_FOOD} food` };
        if (wood < req.MIN_WOOD) return { ok: false, reason: `Need ${req.MIN_WOOD} wood` };
        
        return { ok: true };
    }

    settle(name = 'New Settlement') {
        const check = this.canSettle();
        if (!check.ok) {
            Utils.showToast(check.reason, "warning");
            return false;
        }
        
        // Create settlement
        this.settlement = {
            name,
            x: this.player.x,
            y: this.player.y,
            founded: this.year,
            wells: 0,
            buildings: { RES: 0, COM: 0, IND: 0 },
            totalPopulation: this.player.population,
            income: 0,
        };
        
        // Transition to CITY mode
        this.mode = 'CITY';
        this.level = 1;
        
        // Reveal larger area
        this.map.revealArea(this.player.x, this.player.y, CFG.VISION.SETTLE_RADIUS);
        
        Utils.showToast(`Founded ${name}! Welcome to Level 1.`, "success");
        console.log(`[Game] Settled at (${this.player.x}, ${this.player.y}), transitioned to CITY mode`);
        
        return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Building Placement (CITY mode)
    // ─────────────────────────────────────────────────────────────────────────
    canPlaceBuilding(x, y, buildingKey) {
        if (this.mode !== 'CITY') return { ok: false, reason: "Must be in CITY mode" };
        
        const buildingDef = CFG.BUILDINGS[buildingKey];
        if (!buildingDef) return { ok: false, reason: "Unknown building type" };
        
        // Check resources
        const cost = buildingDef.cost;
        if (this.player.food < cost.food) return { ok: false, reason: `Need ${cost.food} food` };
        if (cost.wood && this.player.wood < cost.wood) return { ok: false, reason: `Need ${cost.wood} wood` };
        if (cost.stone && this.player.stone < cost.stone) return { ok: false, reason: `Need ${cost.stone} stone` };
        
        // Check well requirements
        const totalZones = this.settlement.buildings.RES + 
                          this.settlement.buildings.COM + 
                          this.settlement.buildings.IND;
        const wellsNeeded = Math.ceil((totalZones + 1) / CFG.WELL.zonesPerWell);
        if (this.wells.length < wellsNeeded) {
            return { ok: false, reason: `Need a Water Pit first (1 per ${CFG.WELL.zonesPerWell} zones)` };
        }
        
        // Check map placement
        return this.map.canPlaceBuilding(x, y, buildingKey);
    }

    placeBuilding(x, y, buildingKey) {
        const check = this.canPlaceBuilding(x, y, buildingKey);
        if (!check.ok) {
            Utils.showToast(check.reason, "warning");
            return null;
        }
        
        const buildingDef = CFG.BUILDINGS[buildingKey];
        
        // Deduct resources
        this.player.food -= buildingDef.cost.food;
        if (buildingDef.cost.wood) this.player.wood -= buildingDef.cost.wood;
        if (buildingDef.cost.stone) this.player.stone -= buildingDef.cost.stone;
        
        // Place building
        const building = this.map.placeBuilding(x, y, buildingKey);
        
        // Track in settlement
        this.settlement.buildings[buildingDef.type]++;
        
        // Calculate initial desirability
        this.updateDesirability(building);
        
        const stateInfo = buildingDef.states[building.state];
        Utils.showToast(`Built ${stateInfo.name}!`, "success");
        
        return building;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Desirability Calculation
    // ─────────────────────────────────────────────────────────────────────────
    updateDesirability(building) {
        if (!building) return;
        
        let score = 0;
        const radius = CFG.DESIRABILITY.RADIUS;
        const bonuses = CFG.DESIRABILITY[building.type];
        
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const x = building.x + dx;
                const y = building.y + dy;
                const tile = this.map.getTile(x, y);
                if (!tile) continue;
                
                // Distance factor
                const dist = Utils.distance(0, 0, dx, dy);
                const distFactor = 1 - (dist / radius);
                
                // Water bonus
                if (tile.type === 'WATER') {
                    score += (bonuses.NEAR_WATER || 0) * distFactor;
                }
                
                // Road bonus
                if (tile.road) {
                    score += (bonuses.NEAR_ROAD || 0) * distFactor;
                }
                
                // Building type bonuses
                if (tile.building) {
                    const nearType = tile.building.type;
                    if (nearType === 'RES') score += (bonuses.NEAR_RES || 0) * distFactor;
                    if (nearType === 'COM') score += (bonuses.NEAR_COM || 0) * distFactor;
                    if (nearType === 'IND') score += (bonuses.NEAR_IND || 0) * distFactor;
                }
            }
        }
        
        building.desirability = Math.round(score);
        
        // Determine state based on desirability
        if (score <= CFG.DESIRABILITY.LOW_MAX) {
            building.state = 'LOW';
        } else if (score <= CFG.DESIRABILITY.MEDIUM_MAX) {
            building.state = 'MEDIUM';
        } else {
            building.state = 'LUXURY';
        }
    }

    updateAllDesirability() {
        for (const building of this.map.buildings) {
            this.updateDesirability(building);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Turn Processing (CITY mode year advancement)
    // ─────────────────────────────────────────────────────────────────────────
    advanceTurn() {
        if (this.mode !== 'CITY') return;
        
        this.year += CFG.TIME.YEARS_PER_TURN;
        
        // Process each building
        let totalIncome = 0;
        let totalPop = 0;
        
        for (const building of this.map.buildings) {
            const def = CFG.BUILDINGS[building.key];
            const stateInfo = def.states[building.state];
            
            // Income
            totalIncome += stateInfo.income;
            
            // Population (only RES has birth/death rates)
            if (building.type === 'RES') {
                const births = Math.floor(building.population * stateInfo.birthRate);
                const deaths = Math.floor(building.population * stateInfo.deathRate);
                building.population += births - deaths;
                building.population = Utils.clamp(building.population, 0, def.capacity);
            }
            
            // Upkeep
            this.player.food -= def.upkeep;
            
            totalPop += building.population;
        }
        
        // Update settlement stats
        this.settlement.totalPopulation = totalPop;
        this.settlement.income = totalIncome;
        
        // Add income to food (industrial produces food)
        this.player.food += totalIncome;
        
        // Re-calculate desirability
        this.updateAllDesirability();
        
        // Spawn new animals occasionally
        if (Utils.chance(0.3)) {
            this.map.spawnAnimals(Utils.random(1, 3));
        }
        
        console.log(`[Game] Year ${Utils.formatYear(this.year)}: Pop ${totalPop}, Income ${totalIncome}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Death Handlers
    // ─────────────────────────────────────────────────────────────────────────
    handleThirstDeath() {
        this.player.population--;
        Utils.showToast("A tribe member died of thirst!", "error");
        if (this.player.population <= 0) {
            this.triggerGameOver("Your entire tribe died of thirst.");
        }
        this.player.thirst = CFG.THIRST.MAX * 0.5; // Partial recovery
    }

    handleStarvation() {
        this.player.population--;
        Utils.showToast("A tribe member starved!", "error");
        if (this.player.population <= 0) {
            this.triggerGameOver("Your entire tribe starved.");
        }
        this.player.food = 0;
    }

    handleHerdDeath() {
        this.triggerGameOver("Your tribe was killed by a herd!");
    }

    triggerGameOver(reason) {
        this.gameOver = true;
        this.paused = true;
        Utils.showToast(`GAME OVER: ${reason}`, "error", 10000);
        console.log(`[Game] GAME OVER: ${reason}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Save/Load
    // ─────────────────────────────────────────────────────────────────────────
    save(slot = 'autosave') {
        const saveData = {
            version: '1.0',
            timestamp: Date.now(),
            mode: this.mode,
            level: this.level,
            year: this.year,
            player: this.player,
            settlement: this.settlement,
            wells: this.wells,
            stats: this.stats,
            map: this.map.toJSON(),
        };
        
        Utils.saveLocal(`civilzones_${slot}`, saveData);
        Utils.showToast("Game saved!", "success");
    }

    load(slot = 'autosave') {
        const saveData = Utils.loadLocal(`civilzones_${slot}`);
        if (!saveData) {
            Utils.showToast("No save found!", "warning");
            return false;
        }
        
        this.mode = saveData.mode;
        this.level = saveData.level;
        this.year = saveData.year;
        this.player = saveData.player;
        this.settlement = saveData.settlement;
        this.wells = saveData.wells;
        this.stats = saveData.stats;
        
        this.map = new GameMap();
        this.map.fromJSON(saveData.map);
        
        Utils.showToast("Game loaded!", "success");
        return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Getters for UI
    // ─────────────────────────────────────────────────────────────────────────
    getStats() {
        return {
            mode: this.mode,
            level: this.level,
            year: Utils.formatYear(this.year),
            population: this.mode === 'WANDER' ? this.player.population : this.settlement.totalPopulation,
            food: this.player.food,
            wood: this.player.wood,
            stone: this.player.stone,
            thirst: this.player.thirst,
            income: this.settlement.income,
        };
    }
}

window.Game = Game;
