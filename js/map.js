// ═══════════════════════════════════════════════════════════════════════════════
// CIVIL ZONES: STONE AGE - Map System
// ═══════════════════════════════════════════════════════════════════════════════
// Dynamic expandable map with terrain generation
// ═══════════════════════════════════════════════════════════════════════════════

class GameMap {
    constructor() {
        this.width = CFG.MAP.INITIAL_SIZE;
        this.height = CFG.MAP.INITIAL_SIZE;
        this.tiles = [];
        this.entities = [];
        this.buildings = [];
        this.animals = [];
        this.fog = [];              // Fog of war
        this.noise = null;
        this.seed = Math.random() * 10000;
        
        // Track world offset (when expanding, we need to track the "true" coordinates)
        this.offsetX = 0;
        this.offsetY = 0;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Initialize Map
    // ─────────────────────────────────────────────────────────────────────────
    init() {
        console.log('[Map] Initializing...');
        this.noise = Utils.createNoise(this.seed);
        this.generateTerrain();
        this.spawnEntities();
        this.initFog();
        console.log(`[Map] Created ${this.width}x${this.height} map`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Terrain Generation
    // ─────────────────────────────────────────────────────────────────────────
    generateTerrain() {
        this.tiles = [];
        let waterCount = 0;
        const totalTiles = this.width * this.height;
        const maxWater = Math.floor(totalTiles * CFG.MAP.WATER_MAX_PERCENT);

        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                const tile = this.generateTile(x, y);
                
                // Enforce water limit
                if (tile.type === 'WATER') {
                    if (waterCount >= maxWater) {
                        tile.type = 'SAND';
                        tile.color = this.getTileColor('SAND');
                    } else {
                        waterCount++;
                    }
                }
                
                row.push(tile);
            }
            this.tiles.push(row);
        }

        // Add rivers
        this.generateRivers(2);
        
        console.log(`[Map] Water: ${waterCount}/${totalTiles} (${((waterCount/totalTiles)*100).toFixed(1)}%)`);
    }

    generateTile(x, y) {
        // Use world coordinates for noise (consistent across expansions)
        const wx = x + this.offsetX;
        const wy = y + this.offsetY;
        
        const elevation = Utils.octaveNoise(this.noise, wx, wy, 4, 0.5, 0.03);
        const moisture = Utils.octaveNoise(this.noise, wx + 1000, wy + 1000, 3, 0.6, 0.02);

        let type;
        if (elevation < -0.35) {
            type = 'WATER';
        } else if (elevation < -0.25) {
            type = 'SAND';
        } else if (elevation < 0.3) {
            type = moisture > 0.2 ? 'GRASS' : 'DIRT';
        } else if (elevation < 0.5) {
            type = 'FOREST';
        } else {
            type = 'MOUNTAIN';
        }

        return {
            type,
            x,
            y,
            color: this.getTileColor(type),
            elevation,
            passable: type !== 'WATER' && type !== 'MOUNTAIN',
            hasTree: type === 'FOREST' || (type === 'GRASS' && Utils.chance(0.15)),
            tileBonus: null,         // Set by entities
            building: null,
            road: false,
        };
    }

    getTileColor(type) {
        const colors = {
            WATER: ['#1a5276', '#1e6091', '#2471a3'][Utils.random(0, 2)],
            SAND: ['#d4b896', '#c9a87c', '#dbc4a2'][Utils.random(0, 2)],
            GRASS: ['#2e7d32', '#388e3c', '#43a047'][Utils.random(0, 2)],
            DIRT: ['#6d4c41', '#795548', '#8d6e63'][Utils.random(0, 2)],
            FOREST: ['#1b5e20', '#2e7d32', '#33691e'][Utils.random(0, 2)],
            MOUNTAIN: ['#455a64', '#546e7a', '#607d8b'][Utils.random(0, 2)],
        };
        return colors[type] || '#888888';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // River Generation
    // ─────────────────────────────────────────────────────────────────────────
    generateRivers(count) {
        for (let r = 0; r < count; r++) {
            // Start from random edge
            let x, y, dx, dy;
            
            if (Utils.chance(0.5)) {
                // Start from top or bottom
                x = Utils.random(10, this.width - 10);
                y = Utils.chance(0.5) ? 0 : this.height - 1;
                dx = Utils.randomFloat(-0.3, 0.3);
                dy = y === 0 ? 1 : -1;
            } else {
                // Start from left or right
                x = Utils.chance(0.5) ? 0 : this.width - 1;
                y = Utils.random(10, this.height - 10);
                dx = x === 0 ? 1 : -1;
                dy = Utils.randomFloat(-0.3, 0.3);
            }

            let riverLength = 0;
            const maxLength = this.width + this.height;

            while (x >= 0 && x < this.width && y >= 0 && y < this.height && riverLength < maxLength) {
                const ix = Math.floor(x);
                const iy = Math.floor(y);
                
                if (this.tiles[iy] && this.tiles[iy][ix]) {
                    const tile = this.tiles[iy][ix];
                    if (tile.type !== 'WATER') {
                        tile.type = 'WATER';
                        tile.color = this.getTileColor('WATER');
                        tile.passable = false;
                        tile.hasTree = false;
                    }
                }

                // Meander
                dx += Utils.randomFloat(-0.2, 0.2);
                dy += Utils.randomFloat(-0.2, 0.2);
                dx = Utils.clamp(dx, -1, 1);
                dy = Utils.clamp(dy, -1, 1);

                x += dx;
                y += dy;
                riverLength++;
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Entity Spawning (Berries, Nomads, Stone)
    // ─────────────────────────────────────────────────────────────────────────
    spawnEntities() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y][x];
                if (!tile.passable) continue;

                // Berries
                if (Utils.chance(CFG.ENTITIES.BERRY.rarity)) {
                    this.addEntity('BERRY', x, y, CFG.ENTITIES.BERRY);
                }
                // Nomads
                else if (Utils.chance(CFG.ENTITIES.NOMAD.rarity)) {
                    this.addEntity('NOMAD', x, y, CFG.ENTITIES.NOMAD);
                }
                // Stone deposits
                else if (tile.type === 'MOUNTAIN' || (tile.type === 'DIRT' && Utils.chance(0.3))) {
                    if (Utils.chance(CFG.ENTITIES.STONE_DEPOSIT.rarity)) {
                        this.addEntity('STONE', x, y, CFG.ENTITIES.STONE_DEPOSIT);
                    }
                }
            }
        }
        
        // Initial animals
        this.spawnAnimals(Math.floor(this.width * this.height / 500));
    }

    addEntity(type, x, y, config) {
        const entity = {
            id: `${type}_${Date.now()}_${Utils.random(0, 9999)}`,
            type,
            x,
            y,
            amount: config.amount,
            collected: false,
        };
        this.entities.push(entity);
        
        // Set tile bonus
        if (config.tileBonus) {
            this.tiles[y][x].tileBonus = config.tileBonus;
        }
    }

    spawnAnimals(count) {
        for (let i = 0; i < count; i++) {
            const x = Utils.random(0, this.width - 1);
            const y = Utils.random(0, this.height - 1);
            const tile = this.tiles[y]?.[x];
            
            if (tile?.passable && tile.type !== 'WATER') {
                const animalType = this.pickAnimalType();
                this.animals.push({
                    id: `ANIMAL_${Date.now()}_${i}`,
                    ...animalType,
                    x,
                    y,
                    herdSize: Utils.random(1, 5),
                });
            }
        }
    }

    pickAnimalType() {
        const roll = Math.random();
        let cumulative = 0;
        for (const animal of CFG.ANIMALS) {
            cumulative += animal.rarity;
            if (roll < cumulative) return { ...animal };
        }
        return { ...CFG.ANIMALS[0] };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Fog of War
    // ─────────────────────────────────────────────────────────────────────────
    initFog() {
        this.fog = [];
        for (let y = 0; y < this.height; y++) {
            this.fog.push(new Array(this.width).fill(false));
        }
    }

    revealArea(cx, cy, radius) {
        for (let y = cy - radius; y <= cy + radius; y++) {
            for (let x = cx - radius; x <= cx + radius; x++) {
                if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                    if (Utils.distance(cx, cy, x, y) <= radius) {
                        this.fog[y][x] = true;
                    }
                }
            }
        }
    }

    isRevealed(x, y) {
        return this.fog[y]?.[x] ?? false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Map Expansion
    // ─────────────────────────────────────────────────────────────────────────
    checkExpand(playerX, playerY) {
        const trigger = CFG.MAP.EXPAND_TRIGGER;
        const amount = CFG.MAP.EXPAND_AMOUNT;
        const maxSize = CFG.MAP.MAX_SIZE;
        
        let expanded = false;

        // Check each edge
        if (playerX < trigger && this.width < maxSize) {
            expanded = this.expandWest(amount);
        }
        if (playerX > this.width - trigger && this.width < maxSize) {
            expanded = this.expandEast(amount);
        }
        if (playerY < trigger && this.height < maxSize) {
            expanded = this.expandNorth(amount);
        }
        if (playerY > this.height - trigger && this.height < maxSize) {
            expanded = this.expandSouth(amount);
        }

        if (expanded) {
            console.log(`[Map] Expanded to ${this.width}x${this.height}`);
        }

        return expanded;
    }

    expandWest(amount) {
        if (this.width + amount > CFG.MAP.MAX_SIZE) {
            Utils.showToast("The earth is flat! You cannot go further.", "warning");
            return false;
        }

        this.offsetX -= amount;
        
        // Add columns to the left
        for (let y = 0; y < this.height; y++) {
            const newCols = [];
            for (let x = 0; x < amount; x++) {
                newCols.push(this.generateTile(x, y));
            }
            this.tiles[y] = [...newCols, ...this.tiles[y]];
            this.fog[y] = [...new Array(amount).fill(false), ...this.fog[y]];
        }
        
        this.width += amount;
        
        // Shift all entity/building/animal positions
        this.shiftPositions(amount, 0);
        
        return true;
    }

    expandEast(amount) {
        if (this.width + amount > CFG.MAP.MAX_SIZE) {
            Utils.showToast("The earth is flat! You cannot go further.", "warning");
            return false;
        }

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < amount; x++) {
                this.tiles[y].push(this.generateTile(this.width + x, y));
                this.fog[y].push(false);
            }
        }
        
        this.width += amount;
        return true;
    }

    expandNorth(amount) {
        if (this.height + amount > CFG.MAP.MAX_SIZE) {
            Utils.showToast("The earth is flat! You cannot go further.", "warning");
            return false;
        }

        this.offsetY -= amount;
        
        const newRows = [];
        const newFog = [];
        for (let y = 0; y < amount; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                row.push(this.generateTile(x, y));
            }
            newRows.push(row);
            newFog.push(new Array(this.width).fill(false));
        }
        
        this.tiles = [...newRows, ...this.tiles];
        this.fog = [...newFog, ...this.fog];
        this.height += amount;
        
        this.shiftPositions(0, amount);
        
        return true;
    }

    expandSouth(amount) {
        if (this.height + amount > CFG.MAP.MAX_SIZE) {
            Utils.showToast("The earth is flat! You cannot go further.", "warning");
            return false;
        }

        for (let y = 0; y < amount; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                row.push(this.generateTile(x, this.height + y));
            }
            this.tiles.push(row);
            this.fog.push(new Array(this.width).fill(false));
        }
        
        this.height += amount;
        return true;
    }

    shiftPositions(dx, dy) {
        // Shift all entities
        for (const e of this.entities) {
            e.x += dx;
            e.y += dy;
        }
        // Shift all buildings
        for (const b of this.buildings) {
            b.x += dx;
            b.y += dy;
        }
        // Shift all animals
        for (const a of this.animals) {
            a.x += dx;
            a.y += dy;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Tile Access
    // ─────────────────────────────────────────────────────────────────────────
    getTile(x, y) {
        return this.tiles[y]?.[x] ?? null;
    }

    isPassable(x, y) {
        const tile = this.getTile(x, y);
        return tile?.passable ?? false;
    }

    isWater(x, y) {
        const tile = this.getTile(x, y);
        return tile?.type === 'WATER';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Entity Interactions
    // ─────────────────────────────────────────────────────────────────────────
    getEntityAt(x, y) {
        return this.entities.find(e => e.x === x && e.y === y && !e.collected);
    }

    collectEntity(entity) {
        entity.collected = true;
        // Remove tile bonus when collected (picking up removes tile resource bonus)
        const tile = this.getTile(entity.x, entity.y);
        if (tile) tile.tileBonus = null;
    }

    getAnimalAt(x, y) {
        return this.animals.find(a => a.x === x && a.y === y);
    }

    removeAnimal(animal) {
        const idx = this.animals.indexOf(animal);
        if (idx !== -1) this.animals.splice(idx, 1);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Building Placement
    // ─────────────────────────────────────────────────────────────────────────
    canPlaceBuilding(x, y, buildingKey) {
        const tile = this.getTile(x, y);
        if (!tile) return { ok: false, reason: "Out of bounds" };
        if (!tile.passable) return { ok: false, reason: "Cannot build here" };
        if (tile.building) return { ok: false, reason: "Already occupied" };
        if (tile.type === 'WATER') return { ok: false, reason: "Cannot build on water" };
        
        return { ok: true };
    }

    placeBuilding(x, y, buildingKey, state = 'LOW') {
        const buildingDef = CFG.BUILDINGS[buildingKey];
        if (!buildingDef) return null;

        const building = {
            id: `${buildingKey}_${Date.now()}`,
            key: buildingKey,
            x,
            y,
            state,
            population: 0,
            desirability: 0,
            ...buildingDef,
        };

        this.buildings.push(building);
        this.tiles[y][x].building = building;
        
        return building;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Road Placement
    // ─────────────────────────────────────────────────────────────────────────
    placeRoad(x, y) {
        const tile = this.getTile(x, y);
        if (tile && tile.passable && !tile.building) {
            tile.road = true;
            return true;
        }
        return false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Serialization
    // ─────────────────────────────────────────────────────────────────────────
    toJSON() {
        return {
            width: this.width,
            height: this.height,
            seed: this.seed,
            offsetX: this.offsetX,
            offsetY: this.offsetY,
            tiles: this.tiles,
            entities: this.entities.filter(e => !e.collected),
            buildings: this.buildings,
            animals: this.animals,
            fog: this.fog,
        };
    }

    fromJSON(data) {
        this.width = data.width;
        this.height = data.height;
        this.seed = data.seed;
        this.offsetX = data.offsetX;
        this.offsetY = data.offsetY;
        this.tiles = data.tiles;
        this.entities = data.entities;
        this.buildings = data.buildings;
        this.animals = data.animals;
        this.fog = data.fog;
        this.noise = Utils.createNoise(this.seed);
    }
}

window.GameMap = GameMap;
