/**
 * Civil Zones v48.0 - Main Entry Point
 * 
 * This is the modern TypeScript entry point that initializes
 * the game using properly bundled modules.
 * 
 * Architecture:
 * - Clean separation of concerns
 * - Proper module imports (no inline JS)
 * - Performance-optimized (30 FPS cap, throttled systems)
 * - Hot Module Replacement support in development
 */

// Import all game modules
import * as Types from './types/index.js';
import * as Config from './config/index.js';
import * as Core from './core/index.js';
import * as Systems from './systems/index.js';
import * as Rendering from './rendering/index.js';
import * as GameModule from './game/index.js';
import * as Input from './input/index.js';
import * as UI from './ui/index.js';
import * as AI from './ai/index.js';
import * as Buildings from './buildings/index.js';
import * as Entities from './entities/index.js';
import * as Events from './events/index.js';
import * as World from './world/index.js';
import * as Time from './time/index.js';

// Import specific types
import type { GameState } from './game/state.js';
import type { GameRenderState, RenderTile } from './rendering/game-renderer.js';

// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const TARGET_FPS = 30;
const FRAME_TIME = 1000 / TARGET_FPS;
const AI_UPDATE_INTERVAL = 500;
const TILE_SIZE = 48;

// ═══════════════════════════════════════════════════════════════════════════════
// EXPANDABLE WORLD SYSTEM
// Start at 500x500, can expand to 2000x2000 (4 million tiles!) as player explores
// ═══════════════════════════════════════════════════════════════════════════════
const INITIAL_MAP_SIZE = 500;     // Starting world size
const MAX_MAP_SIZE = 2000;        // Maximum world size (2000x2000 = 4M tiles!)
const EXPANSION_CHUNK = 100;      // Expand by this many tiles at a time
const EXPANSION_DISTANCE = 50;    // Expand when player is this close to edge

// Dynamic map dimensions - start at initial, grow as needed
let MAP_WIDTH = INITIAL_MAP_SIZE;
let MAP_HEIGHT = INITIAL_MAP_SIZE;

// ═══════════════════════════════════════════════════════════════════════════════
// GAME ENGINE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class CivilZonesEngine {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    gameState: GameState | null = null;
    tiles: RenderTile[][] = [];
    camera: Rendering.Camera;
    targetCameraX: number = 0; // For smooth camera following
    targetCameraY: number = 0;
    gameRenderer: Rendering.GameRenderer | null = null;
    inputController: Input.InputController | null = null;
    lastFrameTime: number = 0;
    lastAIUpdate: number = 0;
    running: boolean = false;
    isRendering: boolean = false;  // Mutex to prevent overlapping renders
    frameCount: number = 0;
    
    // Pathfinding
    pathQueue: Array<{ x: number; y: number }> = [];
    lastMoveTime: number = 0;
    currentTool: string = 'SELECT';
    actualFPS: number = 0;
    fpsUpdateTime: number = 0;
    fpsFrameCount: number = 0;
    
    constructor(canvasId: string) {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) {
            throw new Error(`Canvas element '${canvasId}' not found`);
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get 2D context');
        }
        
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Initialize camera centered on map
        this.camera = Rendering.createCamera(
            (MAP_WIDTH * TILE_SIZE) / 2,
            (MAP_HEIGHT * TILE_SIZE) / 2,
            1.0
        );
        
        // Set up canvas size after a frame delay to ensure layout is computed
        requestAnimationFrame(() => {
            this.resizeCanvas();
        });
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    private resizeCanvas(): void {
        // Get viewport dimensions
        const viewport = document.getElementById('viewport');
        const container = document.getElementById('canvas-container');
        
        // Use container if available, fall back to viewport, then window
        let width = container?.clientWidth || viewport?.clientWidth || window.innerWidth;
        let height = container?.clientHeight || viewport?.clientHeight || window.innerHeight;
        
        // Ensure minimum size
        width = Math.max(width, 400);
        height = Math.max(height, 300);
        
        // Use device pixel ratio for crisp rendering (like legacy game)
        const dpr = window.devicePixelRatio || 1;
        
        // Set canvas size to match viewport with DPR scaling
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        
        // Store logical dimensions for rendering (DO NOT scale ctx here - done in render loop)
        (this.canvas as any).logicalWidth = width;
        (this.canvas as any).logicalHeight = height;
        
        // Disable image smoothing for crisp pixel graphics
        this.ctx.imageSmoothingEnabled = false;
        
        console.log(`📐 Canvas resized to ${width}x${height} (DPR: ${dpr})`);
    }
    
    async init(): Promise<void> {
        console.log('🏛️ Civil Zones v48.0 - Initializing...');
        
        this.updateLoadingStatus('Generating world...');
        
        // Initialize noise with random seed
        World.initNoise(Math.random() * 10000);
        
        // Generate terrain
        this.tiles = this.generateWorld();
        
        this.updateLoadingStatus('Initializing game state...');
        
        // Create initial game state
        this.gameState = GameModule.createInitialGameState();
        
        // Find spawn position and create player
        const spawn = this.findSpawnPosition();
        if (spawn && this.gameState) {
            this.gameState.player = {
                x: spawn.x,
                y: spawn.y,
                health: 100,
                direction: 'down'
            };
            
            // Explore around spawn
            this.exploreArea(spawn.x, spawn.y, 8);
            
            // Center camera on player
            this.camera.x = spawn.x * TILE_SIZE;
            this.camera.y = spawn.y * TILE_SIZE;
            this.targetCameraX = this.camera.x;
            this.targetCameraY = this.camera.y;
        }
        
        // Spawn some entities
        this.spawnEntities();
        
        this.updateLoadingStatus('Setting up renderer...');
        
        // Create game renderer
        this.gameRenderer = Rendering.createGameRenderer(this.ctx, {
            tileSize: TILE_SIZE,
            mapWidth: MAP_WIDTH,
            mapHeight: MAP_HEIGHT,
            showGrid: true,
            showFogOfWar: true
        });
        
        this.updateLoadingStatus('Setting up input handlers...');
        
        // Set up input controller
        this.inputController = Input.createSimpleInputController(
            this.canvas,
            (dx: number, dy: number) => this.handleMove(dx, dy),
            (action: string) => this.handleAction(action)
        );
        
        // Add mouse controls for camera
        this.setupMouseControls();
        
        this.updateLoadingStatus('Loading UI...');
        
        // Initialize UI
        UI.initToast();
        UI.initUIController({
            onToolChange: (tool) => this.handleToolChange(tool),
            onBuildingSelect: (buildingId, category) => this.handleBuildingSelect(buildingId, category),
            onAction: (action) => this.handleUIAction(action)
        });
        
        // Start in WANDER mode - hide city buttons
        UI.showWanderUI();
        
        // Hide any lingering game over screen
        const gameOverScreen = document.getElementById('gameover-screen');
        if (gameOverScreen) {
            gameOverScreen.style.display = 'none';
        }
        
        // Initial dashboard update
        this.updateDashboard();
        
        this.updateLoadingStatus('Ready!');
        
        // Hide loading screen
        document.body.classList.add('game-ready');
        
        console.log('✅ Civil Zones initialized successfully');
        
        // Show welcome toast
        UI.showToast('🏛️ Welcome to Civil Zones v48.0! Use WASD to move, scroll to zoom.', { duration: 5000 });
    }
    
    private generateWorld(): RenderTile[][] {
        const tiles: RenderTile[][] = [];
        
        // ═══════════════════════════════════════════════════════════════════
        // ENHANCED MAP GENERATION - ~15% Water for interesting terrain!
        // ═══════════════════════════════════════════════════════════════════
        const seaLevel = 4;  // Raised from 3 to create more coastlines
        const highGroundPatches = World.generateHighGroundPatches(MAP_WIDTH, MAP_HEIGHT);
        
        // Additional lakes scattered across the map
        const lakeCount = Math.floor(MAP_WIDTH * MAP_HEIGHT * 0.00015); // ~9 lakes on 250x250 map
        const lakes: Array<{x: number, y: number, radius: number}> = [];
        for (let i = 0; i < lakeCount; i++) {
            lakes.push({
                x: Math.floor(Math.random() * MAP_WIDTH),
                y: Math.floor(Math.random() * MAP_HEIGHT),
                radius: 4 + Math.floor(Math.random() * 6)  // 4-9 tile radius lakes
            });
        }
        
        // Ponds - smaller water features for character
        const pondCount = Math.floor(MAP_WIDTH * MAP_HEIGHT * 0.0004); // ~25 ponds
        const ponds: Array<{x: number, y: number, radius: number}> = [];
        for (let i = 0; i < pondCount; i++) {
            ponds.push({
                x: Math.floor(Math.random() * MAP_WIDTH),
                y: Math.floor(Math.random() * MAP_HEIGHT),
                radius: 1 + Math.floor(Math.random() * 3)  // 1-3 tile radius ponds
            });
        }
        
        for (let x = 0; x < MAP_WIDTH; x++) {
            tiles[x] = [];
            for (let y = 0; y < MAP_HEIGHT; y++) {
                const heightNoise = World.terrainNoise(x, y);
                const isHighGround = World.isInHighGroundPatch(x, y, highGroundPatches);
                
                let elevation = World.calculateElevation(heightNoise);
                if (isHighGround) {
                    elevation = World.generateHighGroundElevation();
                }
                
                let terrain = World.determineTerrainType(x, y, elevation, seaLevel, heightNoise, isHighGround);
                
                // Check if in a lake
                let inLake = false;
                for (const lake of lakes) {
                    const dx = x - lake.x;
                    const dy = y - lake.y;
                    // Use slightly irregular shape with noise
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const noiseOffset = World.terrainNoise(x * 3, y * 3) * 2;
                    if (dist < lake.radius + noiseOffset && !isHighGround) {
                        inLake = true;
                        break;
                    }
                }
                
                // Check if in a pond
                let inPond = false;
                for (const pond of ponds) {
                    const dx = x - pond.x;
                    const dy = y - pond.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < pond.radius && !isHighGround && terrain.type !== 'STONE' && terrain.type !== 'ROCK') {
                        inPond = true;
                        break;
                    }
                }
                
                // Override terrain with water features
                if (inLake || inPond) {
                    terrain = { type: 'WATER', elevation: seaLevel - 0.5 };
                }
                
                // Add trees to forest, some grass, and some snow (matching original: 20% tree chance)
                const hasTree = terrain.type === 'FOREST' || 
                    (terrain.type === 'GRASS' && Math.random() < 0.2) ||
                    (terrain.type === 'SNOW' && Math.random() < 0.2);
                
                tiles[x][y] = {
                    type: terrain.type,
                    elevation: terrain.elevation,
                    explored: false,
                    tree: hasTree,
                    road: false
                };
            }
        }
        
        return tiles;
    }
    
    private findSpawnPosition(): { x: number; y: number } | null {
        // Find a grass tile near the center
        const centerX = Math.floor(MAP_WIDTH / 2);
        const centerY = Math.floor(MAP_HEIGHT / 2);
        
        for (let r = 0; r < 50; r++) {
            for (let dx = -r; dx <= r; dx++) {
                for (let dy = -r; dy <= r; dy++) {
                    const x = centerX + dx;
                    const y = centerY + dy;
                    
                    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) continue;
                    
                    const tile = this.tiles[x]?.[y];
                    if (tile && (tile.type === 'GRASS' || tile.type === 'EARTH' || tile.type === 'SAND')) {
                        return { x, y };
                    }
                }
            }
        }
        
        return { x: centerX, y: centerY };
    }
    
    private exploreArea(cx: number, cy: number, radius: number): void {
        let newTilesExplored = false;
        
        // Check if we need to expand the world!
        this.checkWorldExpansion(cx, cy);
        
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const x = cx + dx;
                const y = cy + dy;
                
                if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) continue;
                if (dx * dx + dy * dy > radius * radius) continue;
                
                if (this.tiles[x]?.[y] && !this.tiles[x][y].explored) {
                    this.tiles[x][y].explored = true;
                    newTilesExplored = true;
                }
            }
        }
        
        // Invalidate entity cache if new tiles were explored
        if (newTilesExplored) {
            this.invalidateEntityCache();
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // WORLD EXPANSION SYSTEM - "Some say the world is flat..."
    // ═══════════════════════════════════════════════════════════════════
    private checkWorldExpansion(px: number, py: number): void {
        let expanded = false;
        let expandDirection = '';
        
        // Check if near edges and expand if possible
        if (px >= MAP_WIDTH - EXPANSION_DISTANCE && MAP_WIDTH < MAX_MAP_SIZE) {
            this.expandWorld('east');
            expanded = true;
            expandDirection = 'east';
        }
        if (py >= MAP_HEIGHT - EXPANSION_DISTANCE && MAP_HEIGHT < MAX_MAP_SIZE) {
            this.expandWorld('south');
            expanded = true;
            expandDirection = expandDirection ? 'southeast' : 'south';
        }
        
        // Show world edge message when player is close to actual max boundary
        if (px >= MAX_MAP_SIZE - 10 || py >= MAX_MAP_SIZE - 10 ||
            px < 10 || py < 10) {
            if (Math.random() < 0.01) { // Don't spam
                UI.showToast('🌍 Some say the world is flat... but no one has ever returned to tell.', { duration: 5000 });
            }
        }
        
        if (expanded) {
            UI.showToast(`🌄 The world expands to the ${expandDirection}! New lands await...`, { duration: 3000 });
        }
    }
    
    private expandWorld(direction: 'east' | 'south'): void {
        const oldWidth = MAP_WIDTH;
        const oldHeight = MAP_HEIGHT;
        
        if (direction === 'east') {
            MAP_WIDTH = Math.min(MAX_MAP_SIZE, MAP_WIDTH + EXPANSION_CHUNK);
        } else if (direction === 'south') {
            MAP_HEIGHT = Math.min(MAX_MAP_SIZE, MAP_HEIGHT + EXPANSION_CHUNK);
        }
        
        // Generate new terrain for expanded area
        const seaLevel = 4;
        const highGroundPatches = World.generateHighGroundPatches(MAP_WIDTH, MAP_HEIGHT);
        
        // Generate new tiles
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (!this.tiles[x]) this.tiles[x] = [];
            for (let y = 0; y < MAP_HEIGHT; y++) {
                // Skip already generated tiles
                if (x < oldWidth && y < oldHeight && this.tiles[x][y]) continue;
                
                const heightNoise = World.terrainNoise(x, y);
                const isHighGround = World.isInHighGroundPatch(x, y, highGroundPatches);
                
                let elevation = World.calculateElevation(heightNoise);
                if (isHighGround) {
                    elevation = World.generateHighGroundElevation();
                }
                
                const terrain = World.determineTerrainType(x, y, elevation, seaLevel, heightNoise, isHighGround);
                
                // Add trees
                const hasTree = terrain.type === 'FOREST' || 
                    (terrain.type === 'GRASS' && Math.random() < 0.2) ||
                    (terrain.type === 'SNOW' && Math.random() < 0.2);
                
                this.tiles[x][y] = {
                    type: terrain.type,
                    elevation: terrain.elevation,
                    explored: false,
                    tree: hasTree,
                    road: false
                };
            }
        }
        
        // Spawn entities in new area
        this.spawnEntitiesInArea(
            direction === 'east' ? oldWidth : 0,
            direction === 'south' ? oldHeight : 0,
            MAP_WIDTH,
            MAP_HEIGHT
        );
        
        // Update renderer with new map size
        if (this.gameRenderer) {
            this.gameRenderer.updateMapSize(MAP_WIDTH, MAP_HEIGHT);
        }
        
        console.log(`🌍 World expanded ${direction}: ${MAP_WIDTH}x${MAP_HEIGHT} (${MAP_WIDTH * MAP_HEIGHT} tiles)`);
    }
    
    private spawnEntitiesInArea(startX: number, startY: number, endX: number, endY: number): void {
        if (!this.gameState) return;
        
        const areaSize = (endX - startX) * (endY - startY);
        const berryCount = Math.floor(areaSize * 0.0064);  // ~1600 per 250k tiles
        const animalCount = Math.floor(areaSize * 0.01);   // ~2500 per 250k tiles
        const nomadCount = Math.floor(areaSize * 0.006);   // ~1500 per 250k tiles
        
        // Spawn berries
        for (let i = 0; i < berryCount; i++) {
            const x = startX + Math.floor(Math.random() * (endX - startX));
            const y = startY + Math.floor(Math.random() * (endY - startY));
            const tile = this.tiles[x]?.[y];
            
            if (tile && (tile.type === 'GRASS' || tile.type === 'FOREST') && !tile.entity) {
                tile.entity = { 
                    type: 'BERRY', 
                    amount: Math.floor(Math.random() * 80) + 20,
                    is_poisonous: Math.random() < 0.1
                };
            }
        }
        
        // Spawn animals
        const animalTypes = ['DEER', 'RABBIT', 'BISON', 'ELK', 'WOLF', 'BOAR', 'BEAR', 'MAMMOTH'];
        for (let i = 0; i < animalCount; i++) {
            const x = startX + Math.floor(Math.random() * (endX - startX));
            const y = startY + Math.floor(Math.random() * (endY - startY));
            const tile = this.tiles[x]?.[y];
            
            if (tile && (tile.type === 'GRASS' || tile.type === 'FOREST')) {
                const type = animalTypes[Math.floor(Math.random() * animalTypes.length)];
                this.gameState.animals.push({
                    x, y, type,
                    hits: type === 'MAMMOTH' ? 5 : type === 'BEAR' ? 4 : type === 'BISON' ? 3 : 2,
                    state: 'IDLE',
                    walkCycle: Math.random() * Math.PI * 2,
                    moveProgress: 1
                });
            }
        }
        
        // Spawn nomads (mostly friendly in new lands)
        for (let i = 0; i < nomadCount; i++) {
            const x = startX + Math.floor(Math.random() * (endX - startX));
            const y = startY + Math.floor(Math.random() * (endY - startY));
            const tile = this.tiles[x]?.[y];
            
            if (tile && (tile.type === 'GRASS' || tile.type === 'FOREST')) {
                this.gameState.nomads.push({
                    x, y,
                    is_hostile: Math.random() < 0.15,  // 15% hostile in new lands
                    state: 'CHASING',
                    walkCycle: Math.random() * Math.PI * 2,
                    moveProgress: 1
                });
            }
        }
    }
    
    private spawnEntities(): void {
        if (!this.gameState) return;
        
        // ═══════════════════════════════════════════════════════════════════
        // BERRIES - 400 total (original had 400)
        // ═══════════════════════════════════════════════════════════════════
        let berriesSpawned = 0;
        for (let i = 0; i < 2000 && berriesSpawned < 400; i++) {
            const x = Math.floor(Math.random() * MAP_WIDTH);
            const y = Math.floor(Math.random() * MAP_HEIGHT);
            const tile = this.tiles[x]?.[y];
            
            if (tile && (tile.type === 'GRASS' || tile.type === 'FOREST') && !tile.entity) {
                tile.entity = { 
                    type: 'BERRY', 
                    amount: Math.floor(Math.random() * 80) + 20,
                    is_poisonous: Math.random() < 0.1  // 10% chance of poison
                };
                berriesSpawned++;
            }
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // ROAMING NOMADS - 1500 total! They walk around and hunt animals!
        // ═══════════════════════════════════════════════════════════════════
        this.gameState.nomads = [];
        let nomadsSpawned = 0;
        for (let i = 0; i < 10000 && nomadsSpawned < 1500; i++) {
            const x = Math.floor(Math.random() * MAP_WIDTH);
            const y = Math.floor(Math.random() * MAP_HEIGHT);
            const tile = this.tiles[x]?.[y];
            
            if (tile && (tile.type === 'GRASS' || tile.type === 'FOREST' || tile.type === 'EARTH')) {
                this.gameState.nomads.push({
                    x,
                    y,
                    is_hostile: Math.random() < 0.25,  // 25% hostile like original game!
                    state: 'CHASING',   // Start actively hunting!
                    walkCycle: Math.random() * Math.PI * 2,  // Random start phase
                    moveProgress: 1
                });
                nomadsSpawned++;
            }
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // ANIMALS - 1000+ (original had 1064)
        // ═══════════════════════════════════════════════════════════════════
        this.gameState.animals = [];
        
        // Land animals with proper spawn rates - LOTS of variety!
        const animalConfigs = [
            // Common prey animals
            { type: 'DEER', terrain: ['GRASS', 'FOREST'], rate: 0.25, hits: 2 },
            { type: 'RABBIT', terrain: ['GRASS', 'FOREST'], rate: 0.20, hits: 1 },
            { type: 'BISON', terrain: ['GRASS', 'FOREST'], rate: 0.15, hits: 3 },
            // New animals!
            { type: 'ELK', terrain: ['GRASS', 'FOREST', 'SNOW'], rate: 0.12, hits: 3 },
            { type: 'GOAT', terrain: ['ROCK', 'GRASS', 'SNOW'], rate: 0.10, hits: 2 },
            { type: 'SHEEP', terrain: ['GRASS'], rate: 0.10, hits: 1 },
            { type: 'LLAMA', terrain: ['GRASS', 'ROCK', 'SAND'], rate: 0.08, hits: 2 }, // Cute and uncatchable!
            // Dangerous predators
            { type: 'WOLF', terrain: ['GRASS', 'FOREST', 'SNOW'], rate: 0.08, hits: 2 },
            { type: 'FOX', terrain: ['GRASS', 'FOREST'], rate: 0.08, hits: 1 },
            { type: 'BOAR', terrain: ['FOREST'], rate: 0.08, hits: 3 },
            { type: 'BEAR', terrain: ['FOREST', 'GRASS'], rate: 0.06, hits: 4 },
            // Rare giants
            { type: 'MAMMOTH', terrain: ['GRASS', 'FOREST', 'SNOW'], rate: 0.04, hits: 5 },
            { type: 'MOOSE', terrain: ['FOREST', 'SNOW'], rate: 0.04, hits: 4 },
            // Birds
            { type: 'BIRD', terrain: ['GRASS', 'FOREST', 'SAND'], rate: 0.15, hits: 1 }
        ];
        
        let animalsSpawned = 0;
        // Create a Set of occupied nomad positions for fast lookup
        const nomadPositions = new Set<string>();
        for (const nomad of this.gameState.nomads) {
            nomadPositions.add(`${nomad.x},${nomad.y}`);
        }
        
        for (let i = 0; i < 8000 && animalsSpawned < 2500; i++) {
            const x = Math.floor(Math.random() * MAP_WIDTH);
            const y = Math.floor(Math.random() * MAP_HEIGHT);
            const tile = this.tiles[x]?.[y];
            
            if (!tile) continue;
            
            // Skip if nomad already at this position
            if (nomadPositions.has(`${x},${y}`)) continue;
            
            // Pick animal type based on spawn rates
            const roll = Math.random();
            let cumulative = 0;
            for (const config of animalConfigs) {
                cumulative += config.rate;
                if (roll <= cumulative && config.terrain.includes(tile.type)) {
                    this.gameState.animals.push({
                        x,
                        y,
                        type: config.type,
                        hits: config.hits,
                        state: 'IDLE',
                        walkCycle: Math.random() * Math.PI * 2,
                        moveProgress: 1
                    });
                    animalsSpawned++;
                    break;
                }
            }
        }
        
        // Beach turtles (original had 150 on beaches)
        let turtlesSpawned = 0;
        for (let i = 0; i < 1000 && turtlesSpawned < 200; i++) {
            const x = Math.floor(Math.random() * MAP_WIDTH);
            const y = Math.floor(Math.random() * MAP_HEIGHT);
            const tile = this.tiles[x]?.[y];
            
            if (tile && tile.type === 'SAND') {
                this.gameState.animals.push({
                    x,
                    y,
                    type: 'TURTLE',
                    hits: 1,
                    state: 'IDLE',
                    walkCycle: Math.random() * Math.PI * 2,
                    moveProgress: 1
                });
                turtlesSpawned++;
            }
        }
        
        // Fish in water!
        let fishSpawned = 0;
        for (let i = 0; i < 1000 && fishSpawned < 300; i++) {
            const x = Math.floor(Math.random() * MAP_WIDTH);
            const y = Math.floor(Math.random() * MAP_HEIGHT);
            const tile = this.tiles[x]?.[y];
            
            if (tile && (tile.type === 'WATER' || tile.type === 'RIVER')) {
                this.gameState.animals.push({
                    x,
                    y,
                    type: 'FISH',
                    hits: 1,
                    state: 'IDLE',
                    walkCycle: Math.random() * Math.PI * 2,
                    moveProgress: 1
                });
                fishSpawned++;
            }
        }
        
        console.log(`🌍 Spawned: ${berriesSpawned} berries, ${nomadsSpawned} nomads, ${animalsSpawned + turtlesSpawned + fishSpawned} animals`);
    }
    
    private setupMouseControls(): void {
        let isDragging = false;
        let lastX = 0;
        let lastY = 0;
        let startX = 0;  // Initial click position
        let startY = 0;
        let dragStartTime = 0;
        let lastPaintedTile: { x: number; y: number } | null = null;
        
        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            startX = e.clientX;  // Store initial position
            startY = e.clientY;
            dragStartTime = performance.now();
            lastPaintedTile = null;
            
            // If BUILD_WELL tool is active in WANDER mode, paint on click
            if (this.currentTool === 'BUILD_WELL' && this.gameState?.gamePhase === 'WANDER') {
                const tile = this.screenToTile(e);
                if (tile) {
                    this.paintWellAtTile(tile.x, tile.y);
                    lastPaintedTile = tile;
                }
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                // If BUILD_WELL tool is active, paint wells while dragging
                if (this.currentTool === 'BUILD_WELL' && this.gameState?.gamePhase === 'WANDER') {
                    const tile = this.screenToTile(e);
                    if (tile && (!lastPaintedTile || tile.x !== lastPaintedTile.x || tile.y !== lastPaintedTile.y)) {
                        this.paintWellAtTile(tile.x, tile.y);
                        lastPaintedTile = tile;
                    }
                    return; // Don't pan while painting
                }
                
                // Normal pan behavior
                const dx = e.clientX - lastX;
                const dy = e.clientY - lastY;
                this.camera.x -= dx / this.camera.z;
                this.camera.y -= dy / this.camera.z;
                // Update target to match so smooth follow doesn't fight the drag
                this.targetCameraX = this.camera.x;
                this.targetCameraY = this.camera.y;
                lastX = e.clientX;
                lastY = e.clientY;
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            const wasDragging = isDragging;
            isDragging = false;
            lastPaintedTile = null;
            
            // If using BUILD_WELL tool, don't do click-to-move
            if (this.currentTool === 'BUILD_WELL') {
                return;
            }
            
            // If it was a quick click (not drag), handle placement or movement
            const dragDuration = performance.now() - dragStartTime;
            const dragDistance = Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY);
            
            // Click threshold: less than 200ms and less than 10px movement
            if (wasDragging && dragDuration < 200 && dragDistance < 10) {
                this.handleClickToMove(e);
            }
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            isDragging = false;
            lastPaintedTile = null;
        });
        
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.camera.z = Math.max(0.15, Math.min(5.0, this.camera.z * zoomFactor));
        });
        
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    /** Convert screen coordinates to tile coordinates */
    private screenToTile(e: MouseEvent): { x: number; y: number } | null {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        
        const worldX = (screenX / this.camera.z) + this.camera.x - (this.canvas.width / 2 / this.camera.z);
        const worldY = (screenY / this.camera.z) + this.camera.y - (this.canvas.height / 2 / this.camera.z);
        
        const tileX = Math.floor(worldX / TILE_SIZE);
        const tileY = Math.floor(worldY / TILE_SIZE);
        
        if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) return null;
        return { x: tileX, y: tileY };
    }
    
    /** Paint a well at the specified tile (for drag-paint) */
    private paintWellAtTile(tileX: number, tileY: number): void {
        if (!this.gameState) return;
        if (this.gameState.gamePhase !== 'WANDER') return;
        
        const WELL_COST = { food: 25, wood: 50 };
        
        // Check resources
        if (this.gameState.inventory.food < WELL_COST.food || this.gameState.inventory.wood < WELL_COST.wood) {
            return; // Silent fail for painting - main function shows toast
        }
        
        // Check tile is buildable
        const tile = this.tiles[tileX]?.[tileY];
        if (!tile) return;
        
        const unbuildable = ['WATER', 'RIVER', 'DEEP', 'STONE'];
        if (unbuildable.includes(tile.type)) return;
        
        // Check if well already exists at this exact spot
        if (this.gameState.wanderWells?.some(w => w.x === tileX && w.y === tileY)) return;
        
        // LIMIT: Only 1 well at a time - building new one replaces old one
        // This allows exploration - you can always build a new pit further out
        const hadPreviousWell = this.gameState.wanderWells && this.gameState.wanderWells.length > 0;
        
        // Initialize array if needed
        if (!this.gameState.wanderWells) {
            this.gameState.wanderWells = [];
        } else {
            // Clear old well - only 1 at a time!
            this.gameState.wanderWells = [];
        }
        
        // Deduct resources
        this.gameState.inventory.food -= WELL_COST.food;
        this.gameState.inventory.wood -= WELL_COST.wood;
        
        // Create well
        this.gameState.wanderWells.push({ x: tileX, y: tileY });
        
        // Reset thirst
        if (this.gameState.thirst) {
            this.gameState.thirst.level = 100;
        }
        
        // First well lore (only show once ever)
        if (!hadPreviousWell && this.gameState.wanderWells.length === 1) {
            UI.showLorePopup('First Water Pit', 'Your tribe has dug their first water pit! This oasis in the wilderness will help sustain your wanderers on their long journey.');
        }
        
        UI.showToast(`🕳️ Water Pit dug! (-${WELL_COST.food} food, -${WELL_COST.wood} wood)`, { duration: 1500 });
        this.updateDashboard();
    }
    
    private handleClickToMove(e: MouseEvent): void {
        if (!this.gameState?.player) return;
        
        // Convert screen coordinates to world coordinates
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        
        // Account for camera position and zoom
        const worldX = (screenX / this.camera.z) + this.camera.x - (this.canvas.width / 2 / this.camera.z);
        const worldY = (screenY / this.camera.z) + this.camera.y - (this.canvas.height / 2 / this.camera.z);
        
        // Convert to tile coordinates
        const tileX = Math.floor(worldX / TILE_SIZE);
        const tileY = Math.floor(worldY / TILE_SIZE);
        
        // Bounds check
        if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) return;
        
        // Handle building tool placement (from UI confirm buttons)
        if (this.currentTool === 'BUILD_RES' || this.currentTool === 'BUILD_COM' || 
            this.currentTool === 'BUILD_IND' || this.currentTool === 'BUILD_ROAD' ||
            this.currentTool === 'BUILD_SPECIAL' || this.currentTool === 'BUILD_MILESTONE') {
            
            if (this.gameState.gamePhase !== 'CITY') {
                UI.showToast('⚠️ Must settle first to build! Press V to settle.', { duration: 2500 });
                return;
            }
            
            if (this.handleToolBasedPlacement(tileX, tileY)) {
                return;
            }
        }
        
        // If we have a building selected, try to place it
        if (this.selectedBuilding) {
            if (this.handleTilePlacement(tileX, tileY)) {
                return;
            }
        }
        
        // Check if target is walkable
        const tile = this.tiles[tileX]?.[tileY];
        if (!tile) return;
        
        const blocked = ['WATER', 'DEEP', 'RIVER', 'STONE'];
        if (blocked.includes(tile.type)) {
            UI.showToast('⛔ Cannot walk there!', { duration: 1000 });
            return;
        }
        
        // Generate A* path to target
        const player = this.gameState.player;
        this.pathQueue = this.findPath(player.x, player.y, tileX, tileY);
        
        // Silently start walking - no coordinate toast
        // if (this.pathQueue.length > 0) {
        //     UI.showToast(`🚶 Walking...`, { duration: 1000 });
        // }
    }
    
    // Handle tool-based building placement (from UI confirm buttons)
    private handleToolBasedPlacement(tileX: number, tileY: number): boolean {
        if (!this.gameState) return false;
        
        const tile = this.tiles[tileX]?.[tileY];
        if (!tile) return false;
        
        // Check terrain passability for building
        const unbuildable = ['WATER', 'DEEP', 'RIVER', 'STONE', 'ROCK'];
        if (unbuildable.includes(tile.type)) {
            UI.showToast('⛔ Cannot build here!', { duration: 1500 });
            return false;
        }
        
        // Check if already occupied
        const existingBuilding = this.gameState.blds.find(b => b.x === tileX && b.y === tileY);
        if (existingBuilding) {
            UI.showToast('⚠️ Tile already occupied!', { duration: 1500 });
            return false;
        }
        
        // Get the selected level from UI state
        const uiState = UI.getUIState();
        let buildingType: string = '';
        let level: number = 1;
        let buildingName: string = '';
        
        // Determine type and level based on current tool
        switch (this.currentTool) {
            case 'BUILD_RES':
                buildingType = 'RES';
                level = uiState.selectedBuildingLevel || 1;
                buildingName = `Home L${level}`;
                break;
            case 'BUILD_COM':
                buildingType = 'COM';
                level = uiState.selectedCommercialLevel || 1;
                buildingName = `Trade Post L${level}`;
                break;
            case 'BUILD_IND':
                buildingType = 'IND';
                level = uiState.selectedIndustrialLevel || 1;
                buildingName = `Workshop L${level}`;
                break;
            case 'BUILD_ROAD':
                buildingType = 'ROAD';
                level = uiState.selectedRoadLevel || 1;
                buildingName = 'Road';
                break;
            case 'BUILD_SPECIAL':
                buildingType = 'SPC';
                level = 1;
                buildingName = 'Special Building';
                break;
            case 'BUILD_MILESTONE':
                buildingType = 'MILE';
                level = 1;
                buildingName = 'Milestone';
                break;
            default:
                return false;
        }
        
        // Base costs by type and level
        const baseCosts: Record<string, { wood: number; stone: number; food: number }> = {
            'RES': { wood: 10 * level, stone: level > 1 ? 5 * level : 0, food: 0 },
            'COM': { wood: 15 * level, stone: level > 1 ? 8 * level : 0, food: 5 * level },
            'IND': { wood: 20 * level, stone: 10 * level, food: 0 },
            'ROAD': { wood: 2, stone: level > 1 ? 1 * level : 0, food: 0 },
            'SPC': { wood: 50, stone: 25, food: 0 },
            'MILE': { wood: 100, stone: 50, food: 0 }
        };
        
        const cost = baseCosts[buildingType] || { wood: 10, stone: 0, food: 0 };
        
        // Check if we can afford it
        if (cost.wood && this.gameState.resources.wood < cost.wood) {
            UI.showToast(`⚠️ Need ${cost.wood} wood!`, { duration: 1500 });
            return false;
        }
        if (cost.stone && this.gameState.resources.stone < cost.stone) {
            UI.showToast(`⚠️ Need ${cost.stone} stone!`, { duration: 1500 });
            return false;
        }
        if (cost.food && this.gameState.resources.food < cost.food) {
            UI.showToast(`⚠️ Need ${cost.food} food!`, { duration: 1500 });
            return false;
        }
        
        // Deduct resources
        if (cost.wood) this.gameState.resources.wood -= cost.wood;
        if (cost.stone) this.gameState.resources.stone -= cost.stone;
        if (cost.food) this.gameState.resources.food -= cost.food;
        
        // Create the building
        const newBuilding = {
            t: buildingType,
            x: tileX,
            y: tileY,
            lvl: level,
            pop: 0,
            efficiency: 1.0
        };
        
        this.gameState.blds.push(newBuilding);
        
        // Build cost message
        const costParts = [];
        if (cost.wood) costParts.push(`-${cost.wood} 🪵`);
        if (cost.stone) costParts.push(`-${cost.stone} 🪨`);
        if (cost.food) costParts.push(`-${cost.food} 🍖`);
        const costMsg = costParts.length > 0 ? ` (${costParts.join(', ')})` : '';
        
        UI.showToast(`🏗️ Built ${buildingName}!${costMsg}`, { duration: 1500 });
        this.updateDashboard();
        
        return true;
    }
    
    // A* Pathfinding Algorithm
    private findPath(startX: number, startY: number, endX: number, endY: number): Array<{ x: number; y: number }> {
        interface PathNode {
            x: number;
            y: number;
            g: number;
            h: number;
            parent: PathNode | null;
        }
        
        const openSet: PathNode[] = [{ x: startX, y: startY, g: 0, h: Math.abs(endX - startX) + Math.abs(endY - startY), parent: null }];
        const closedSet = new Set<string>();
        
        const blocked = ['WATER', 'DEEP', 'RIVER', 'STONE'];
        
        while (openSet.length > 0) {
            // Find node with lowest f score
            openSet.sort((a, b) => (a.g + a.h) - (b.g + b.h));
            const current = openSet.shift()!;
            
            // Reached destination
            if (current.x === endX && current.y === endY) {
                const path: Array<{ x: number; y: number }> = [];
                let node: PathNode | null = current;
                while (node?.parent) {
                    path.unshift({ x: node.x, y: node.y });
                    node = node.parent;
                }
                return path;
            }
            
            closedSet.add(`${current.x},${current.y}`);
            
            // Check 4-directional neighbors
            const directions = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
            for (const dir of directions) {
                const nx = current.x + dir.x;
                const ny = current.y + dir.y;
                
                // Bounds check
                if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;
                if (closedSet.has(`${nx},${ny}`)) continue;
                
                // Passability check
                const tile = this.tiles[nx]?.[ny];
                if (!tile || blocked.includes(tile.type)) continue;
                
                const g = current.g + 1;
                const h = Math.abs(endX - nx) + Math.abs(endY - ny);
                
                const existing = openSet.find(n => n.x === nx && n.y === ny);
                if (!existing) {
                    openSet.push({ x: nx, y: ny, g, h, parent: current });
                } else if (g < existing.g) {
                    existing.g = g;
                    existing.parent = current;
                }
            }
            
            // Limit search to prevent lag
            if (closedSet.size > 1000) break;
        }
        
        // No path found
        return [];
    }
    
    // Process pathfinding queue (called in update)
    private processPath(): void {
        if (this.pathQueue.length === 0) return;
        
        const now = performance.now();
        if (now - this.lastMoveTime < 150) return; // Rate limit movement
        
        const next = this.pathQueue[0];
        if (!next || !this.gameState?.player) return;
        
        const player = this.gameState.player;
        const dx = next.x - player.x;
        const dy = next.y - player.y;
        
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
            // Store old position to check if move succeeded
            const oldX = player.x;
            const oldY = player.y;
            
            this.handleMove(dx, dy);
            
            // If player moved, remove from queue
            if (player.x !== oldX || player.y !== oldY) {
                this.pathQueue.shift();
                this.lastMoveTime = now;
            } else {
                // Path blocked, clear queue
                this.pathQueue = [];
            }
        } else {
            // Invalid path step
            this.pathQueue = [];
        }
    }
    
    private createHUD(): void {
        const uiRoot = document.getElementById('ui-root');
        if (!uiRoot) return;
        
        uiRoot.innerHTML = `
            <div id="hud" style="position: absolute; top: 10px; left: 10px; 
                background: rgba(40,35,30,0.9); padding: 15px; border-radius: 8px;
                color: #E8DCC8; font-family: 'Segoe UI', sans-serif; font-size: 14px;
                border: 2px solid rgba(180,160,120,0.5); min-width: 200px;">
                <div style="font-size: 18px; font-weight: bold; color: #D4A040; margin-bottom: 10px;">
                    🏛️ Civil Zones
                </div>
                <div id="hud-pop">👥 Population: <span style="color: #4CAF50">4</span></div>
                <div id="hud-food">🍖 Food: <span style="color: #8BC34A">300/450</span></div>
                <div id="hud-wood">🪵 Wood: <span style="color: #A86838">300</span></div>
                <div id="hud-year">📅 Year: <span style="color: #9E9E9E">0</span></div>
                <div id="hud-phase" style="margin-top: 10px; color: #FFC107">🌍 EXPLORING</div>
                <div style="margin-top: 15px; font-size: 11px; color: #888;">
                    WASD: Move | Scroll: Zoom<br>
                    Drag: Pan camera
                </div>
            </div>
            <div id="fps-counter" style="position: absolute; bottom: 10px; right: 10px;
                background: rgba(0,0,0,0.7); padding: 5px 10px; border-radius: 4px;
                color: #4CAF50; font-family: monospace; font-size: 12px;">
                FPS: 30
            </div>
        `;
    }
    
    private updateHUD(): void {
        // Use the new dashboard update
        this.updateDashboard();
    }
    
    private updateDashboard(): void {
        if (!this.gameState) return;
        
        // Check if player can settle (requirements: pop >= 2, food >= 100, wood >= 25)
        const canSettle = this.gameState.gamePhase === 'WANDER' &&
            this.gameState.pop >= 2 &&
            this.gameState.inventory.food >= 100 &&
            this.gameState.inventory.wood >= 25;
        
        // Update settle button visibility
        UI.updateSettleButton(canSettle, this.gameState.gamePhase);
        
        // Update the tribal UI dashboard
        UI.updateDashboard({
            pop: this.gameState.pop,
            food: `${this.gameState.inventory.food}/${this.gameState.inventory.capacity}`,
            wood: this.gameState.inventory.wood,
            year: this.gameState.year,
            gold: 0, // TODO: Add gold to game state
            thirst: this.gameState.thirst?.level || 100,
            epoch: this.gameState.gamePhase === 'WANDER' ? '🌍 EXPLORING' : '🏛️ CITY MODE',
            rDemand: 50, // TODO: Calculate actual demand
            cDemand: 50,
            iDemand: 50
        });
        
        // Debug info disabled - no coordinate display
        // UI.updateDebugInfo(`FPS: ${this.actualFPS}`);
    }
    
    private countBuildingsByZone(zone: string): number {
        // TODO: Implement building counting when building system is integrated
        return 0;
    }
    
    private handleToolChange(tool: UI.Tool): void {
        console.log(`Tool changed to: ${tool}`);
        this.currentTool = tool;
        
        // Update cursor based on tool
        if (tool === 'PAN') {
            this.canvas.style.cursor = 'grab';
        } else if (tool === 'DEMOLISH' || tool === 'BUILD_WELL') {
            this.canvas.style.cursor = 'crosshair';
        } else {
            this.canvas.style.cursor = 'pointer';
        }
        
        // Show tool-specific hint
        if (tool === 'BUILD_WELL' && this.gameState?.gamePhase === 'WANDER') {
            UI.showToast('💧 Click or drag to place Water Pits (25 food, 50 wood each)', { duration: 3000 });
        }
    }
    
    // Build a water pit at player location (WANDER mode only)
    private buildWanderWell(): void {
        if (!this.gameState) return;
        if (this.gameState.gamePhase !== 'WANDER') {
            UI.showToast('⚠️ Can only build Water Pits while wandering!', { duration: 2000 });
            return;
        }
        
        const WELL_COST = { food: 25, wood: 50 };
        
        // Check resources
        if (this.gameState.inventory.food < WELL_COST.food) {
            UI.showToast(`⚠️ Need ${WELL_COST.food} food! (${Math.floor(this.gameState.inventory.food)}/${WELL_COST.food})`, { duration: 2000 });
            return;
        }
        if (this.gameState.inventory.wood < WELL_COST.wood) {
            UI.showToast(`⚠️ Need ${WELL_COST.wood} wood! (${Math.floor(this.gameState.inventory.wood)}/${WELL_COST.wood})`, { duration: 2000 });
            return;
        }
        
        // Check tile is buildable
        const px = this.gameState.player?.x || 0;
        const py = this.gameState.player?.y || 0;
        const tile = this.tiles[px]?.[py];
        
        if (!tile) return;
        
        if (tile.type === 'WATER' || tile.type === 'RIVER' || tile.type === 'DEEP') {
            UI.showToast('⚠️ Can\'t build on water! You can drink here already.', { duration: 2000 });
            return;
        }
        if (tile.type === 'STONE') {
            UI.showToast('⚠️ Too rocky to dig here!', { duration: 2000 });
            return;
        }
        
        // Check if well already exists here
        if (this.gameState.wanderWells?.some(w => w.x === px && w.y === py)) {
            UI.showToast('⚠️ There\'s already a Water Pit here!', { duration: 2000 });
            return;
        }
        
        // LIMIT: Only 1 well at a time - building new one replaces old one
        // This allows exploration - you can always dig a new pit further out
        const isFirstEverWell = !this.gameState.wanderWells || this.gameState.wanderWells.length === 0;
        
        // Initialize array or clear old well (only 1 at a time!)
        if (!this.gameState.wanderWells) {
            this.gameState.wanderWells = [];
        } else {
            // Clear old well
            this.gameState.wanderWells = [];
        }
        
        // Deduct resources
        this.gameState.inventory.food -= WELL_COST.food;
        this.gameState.inventory.wood -= WELL_COST.wood;
        
        // Create well
        this.gameState.wanderWells.push({ x: px, y: py });
        
        // Reset thirst
        if (this.gameState.thirst) {
            this.gameState.thirst.level = 100;
        }
        
        // First well lore (only show once ever)
        if (isFirstEverWell) {
            UI.showLorePopup('First Water Pit', 'Your tribe has dug their first water pit! This oasis in the wilderness will help sustain your wanderers on their long journey.');
        }
        
        UI.showToast(`🕳️ Built Water Pit! (-${WELL_COST.food} food, -${WELL_COST.wood} wood)`, { duration: 2500 });
        this.updateDashboard();
    }
    
    // Selected building for placement
    private selectedBuilding: { id: string; category: string } | null = null;
    
    private handleBuildingSelect(buildingId: string, category: string): void {
        console.log(`Building selected: ${buildingId} from ${category}`);
        this.selectedBuilding = { id: buildingId, category };
        this.canvas.style.cursor = 'crosshair';
        UI.showToast(`🏗️ Click to place ${buildingId}`, { duration: 2000 });
    }
    
    private handleTilePlacement(tileX: number, tileY: number): boolean {
        if (!this.selectedBuilding || !this.gameState) return false;
        if (this.gameState.gamePhase !== 'CITY') {
            UI.showToast('⚠️ Must settle first to build!', { duration: 2000 });
            return false;
        }
        
        const tile = this.tiles[tileX]?.[tileY];
        if (!tile) return false;
        
        // Check terrain passability for building
        const unbuildable = ['WATER', 'DEEP', 'RIVER', 'STONE', 'ROCK'];
        if (unbuildable.includes(tile.type)) {
            UI.showToast('⛔ Cannot build here!', { duration: 1500 });
            return false;
        }
        
        // Check if already occupied
        const existingBuilding = this.gameState.blds.find(b => b.x === tileX && b.y === tileY);
        if (existingBuilding) {
            UI.showToast('⚠️ Tile already occupied!', { duration: 1500 });
            return false;
        }
        
        // Check resource costs based on building type
        const costs: Record<string, { wood?: number; stone?: number; food?: number }> = {
            'HUT': { wood: 10 },
            'HOUSE': { wood: 25 },
            'VILLA': { wood: 50, stone: 10 },
            'FARM': { wood: 15 },
            'MARKET': { wood: 30 },
            'ROAD': { wood: 2 },
            'WELL': { wood: 20, stone: 5 }
        };
        
        const cost = costs[this.selectedBuilding.id] || { wood: 10 };
        
        // Check if we can afford it
        if (cost.wood && this.gameState.resources.wood < cost.wood) {
            UI.showToast(`⚠️ Need ${cost.wood} wood!`, { duration: 1500 });
            return false;
        }
        if (cost.stone && this.gameState.resources.stone < cost.stone) {
            UI.showToast(`⚠️ Need ${cost.stone} stone!`, { duration: 1500 });
            return false;
        }
        
        // Deduct resources
        if (cost.wood) this.gameState.resources.wood -= cost.wood;
        if (cost.stone) this.gameState.resources.stone -= cost.stone;
        
        // Place building
        // Determine building type from ID and category
        let buildingType = this.selectedBuilding.category === 'RESIDENTIAL' ? 'RES' : 
               this.selectedBuilding.category === 'COMMERCIAL' ? 'COM' : 
               this.selectedBuilding.category === 'INDUSTRIAL' ? 'IND' : 'SPC';
        
        // Override for specific special building types
        if (this.selectedBuilding.id === 'WELL') buildingType = 'WELL';
        if (this.selectedBuilding.id === 'ROAD') buildingType = 'ROAD';
        
        const newBuilding = {
            t: buildingType,
            x: tileX,
            y: tileY,
            lvl: 1,
            pop: 0,
            efficiency: 1.0
        };
        
        this.gameState.blds.push(newBuilding);
        
        UI.showToast(`🏗️ Built ${this.selectedBuilding.id}!`, { duration: 1500 });
        this.updateDashboard();
        
        // Clear selection after placement
        this.selectedBuilding = null;
        this.canvas.style.cursor = 'pointer';
        
        return true;
    }
    
    private handleUIAction(action: string): void {
        console.log(`UI Action: ${action}`);
        
        switch (action) {
            case 'SETTLE':
                this.handleSettle();
                break;
            case 'END_TURN':
                this.handleEndTurn();
                break;
            case 'SAVE':
                this.handleSave();
                break;
            case 'LOAD':
                this.handleLoad();
                break;
            case 'NEW_GAME':
                this.handleNewGame();
                break;
            case 'STATS':
                this.showStats();
                break;
            case 'TOGGLE_VIEW':
                this.cycleViewMode();
                break;
            case 'DEBUG_ADD_POP':
                if (this.gameState) {
                    this.gameState.pop += 1000;
                    UI.showToast(`👥 +1000 Pop (now ${this.gameState.pop})`, { duration: 1500 });
                    this.updateDashboard();
                }
                break;
            case 'DEBUG_ADD_RES':
                if (this.gameState) {
                    this.gameState.inventory.food += 1000;
                    this.gameState.inventory.wood += 1000;
                    this.gameState.resources.food += 1000;
                    this.gameState.resources.wood += 1000;
                    this.gameState.resources.stone += 500;
                    this.gameState.resources.metal += 250;
                    UI.showToast(`📦 +1000 Food/Wood, +500 Stone, +250 Metal`, { duration: 1500 });
                    this.updateDashboard();
                }
                break;
            case 'TOGGLE_ELEVATION':
                if (this.gameState) {
                    this.gameState.viewMode = this.gameState.viewMode === 'ELEVATION' ? 'NORMAL' : 'ELEVATION';
                }
                break;
            default:
                console.log(`Unknown action: ${action}`);
        }
    }
    
    private cycleViewMode(): void {
        if (!this.gameState) return;
        
        const modes: Array<'NORMAL' | 'POL' | 'DESIRABILITY' | 'ELEVATION'> = ['NORMAL', 'DESIRABILITY', 'POL', 'ELEVATION'];
        const currentIndex = modes.indexOf(this.gameState.viewMode);
        this.gameState.viewMode = modes[(currentIndex + 1) % modes.length];
        
        const icons: Record<string, string> = { 'NORMAL': '👁️', 'DESIRABILITY': '🔥', 'POL': '☢️', 'ELEVATION': '🗻' };
        const titles: Record<string, string> = { 
            'NORMAL': 'Normal View', 
            'DESIRABILITY': 'Desirability Heatmap', 
            'POL': 'Pollution View',
            'ELEVATION': 'Elevation Topography'
        };
        
        // Update button
        const btn = document.getElementById('btn-view');
        if (btn) {
            btn.innerText = icons[this.gameState.viewMode] || '👁️';
            btn.title = titles[this.gameState.viewMode] || 'Normal View';
        }
        
        UI.showToast(`View: ${titles[this.gameState.viewMode]}`, { duration: 2000 });
    }
    
    private handleSettle(): void {
        if (!this.gameState) return;
        
        if (this.gameState.gamePhase === 'WANDER') {
            // Check settlement requirements
            if (this.gameState.pop < 2) {
                UI.showToast('⚠️ Need at least 2 population to settle!', { duration: 2000 });
                return;
            }
            if (this.gameState.inventory.food < 100) {
                UI.showToast('⚠️ Need at least 100 food to settle!', { duration: 2000 });
                return;
            }
            if (this.gameState.inventory.wood < 25) {
                UI.showToast('⚠️ Need at least 25 wood to settle!', { duration: 2000 });
                return;
            }
            
            // Found settlement
            this.gameState.gamePhase = 'CITY';
            
            // Switch UI to city mode - show building buttons
            UI.showCityUI();
            
            // Transfer resources from pocket to city resources
            this.gameState.resources.food = this.gameState.inventory.food;
            this.gameState.resources.wood = this.gameState.inventory.wood;
            this.gameState.resources.metal = this.gameState.pocket.metal || 0;
            this.gameState.resources.stone = this.gameState.pocket.stone || 0;
            
            // Convert wander wells to city wells
            if (this.gameState.wanderWells && this.gameState.wanderWells.length > 0) {
                for (const well of this.gameState.wanderWells) {
                    this.gameState.blds.push({
                        t: 'WELL',
                        x: well.x,
                        y: well.y,
                        lvl: 1,
                        pop: 0,
                        efficiency: 1.0
                    });
                }
                console.log(`Converted ${this.gameState.wanderWells.length} wander wells to city wells`);
                this.gameState.wanderWells = [];
            }
            
            // Bonus based on starting population
            const gatheringBonus = 1.0 + (this.gameState.pop * 0.1);
            
            // Show settlement video popup with Tree Shelter video!
            UI.showSettlementVideo(() => {
                UI.showToast(`🏛️ Settlement founded! Gathering bonus: ${(gatheringBonus * 100).toFixed(0)}%`, { duration: 4000 });
            });
            
            this.updateDashboard();
        }
    }
    
    private handleEndTurn(): void {
        if (!this.gameState) return;
        
        this.gameState.year++;
        
        // ═══════════════════════════════════════════════════════════════════
        // CITY MODE: Full economy simulation
        // ═══════════════════════════════════════════════════════════════════
        if (this.gameState.gamePhase === 'CITY') {
            // Count buildings
            const wellCount = this.gameState.blds.filter(b => b.t === 'WELL').length;
            const resCount = this.gameState.blds.filter(b => b.t === 'RES').length;
            const roadCount = this.tiles.flat().filter(t => t.road).length;
            
            // ═══════════════════════════════════════════════════════════════════
            // WORKFORCE ALLOCATION
            // ═══════════════════════════════════════════════════════════════════
            const wellWorkersNeeded = wellCount * 2; // 2 workers per well
            const roadWorkersNeeded = Math.ceil(roadCount / 5); // 1 worker per 5 roads
            const totalWorkersNeeded = wellWorkersNeeded + roadWorkersNeeded;
            
            const wellWorkers = Math.min(wellWorkersNeeded, this.gameState.pop);
            const roadWorkers = Math.min(roadWorkersNeeded, Math.max(0, this.gameState.pop - wellWorkers));
            const gatherers = Math.max(0, this.gameState.pop - wellWorkers - roadWorkers);
            
            // Update workforce state
            this.gameState.workforce = {
                total: this.gameState.pop,
                wellWorkers,
                roadWorkers,
                comWorkers: 0,
                indWorkers: 0,
                gatherers,
                wellsNeeded: wellWorkersNeeded,
                roadsNeeded: roadWorkersNeeded,
                comNeeded: 0,
                indNeeded: 0,
                shortage: Math.max(0, totalWorkersNeeded - this.gameState.pop)
            };
            
            // ═══════════════════════════════════════════════════════════════════
            // GATHERER PRODUCTION (unassigned workers)
            // ═══════════════════════════════════════════════════════════════════
            const gatherMultiplier = this.gameState.gatheringMultiplier || 1.0;
            const foodProduced = Math.floor(gatherers * 1.5 * gatherMultiplier);
            const woodProduced = Math.floor(gatherers * 3.0 * gatherMultiplier);
            const stoneProduced = Math.floor(gatherers * 0.4 * gatherMultiplier);
            
            this.gameState.resources.food += foodProduced;
            this.gameState.resources.wood += woodProduced;
            this.gameState.resources.stone = (this.gameState.resources.stone || 0) + stoneProduced;
            
            if (gatherers > 0 && this.gameState.pop < 20) {
                UI.showToast(`🌾 ${gatherers} gatherers: +${foodProduced} food, +${woodProduced} wood`, { duration: 2000 });
            }
            
            // ═══════════════════════════════════════════════════════════════════
            // WATER SYSTEM - Wells are critical for survival!
            // ═══════════════════════════════════════════════════════════════════
            const waterCapacity = wellCount * 100; // Each well supports 100 people
            
            if (wellCount === 0 && this.gameState.pop > 0) {
                // NO WELLS - track years without water
                this.gameState.yearsWithoutWell = (this.gameState.yearsWithoutWell || 0) + 1;
                
                if (this.gameState.yearsWithoutWell >= 1) {
                    this.triggerGameOver('Your settlement died of thirst! Build wells to survive.', 'THIRST');
                    return;
                }
                UI.showToast('⚠️ NO WELLS! Build wells or everyone will die!', { duration: 3000 });
            } else if (this.gameState.pop > waterCapacity && wellCount > 0) {
                // Not enough wells - only people without water die
                const peopleWithoutWater = this.gameState.pop - waterCapacity;
                const dehydrationDeaths = Math.ceil(peopleWithoutWater * 0.20);
                this.gameState.pop = Math.max(1, this.gameState.pop - dehydrationDeaths);
                
                if (dehydrationDeaths > 0) {
                    UI.showToast(`💧 Water shortage! ${dehydrationDeaths} died. Need more wells!`, { duration: 3000 });
                }
                this.gameState.yearsWithoutWell = 0;
            } else {
                this.gameState.yearsWithoutWell = 0;
            }
            
            // ═══════════════════════════════════════════════════════════════════
            // BUILDING UPKEEP
            // ═══════════════════════════════════════════════════════════════════
            const upkeepCost = Math.ceil(resCount * 0.5);
            if (this.gameState.resources.wood >= upkeepCost) {
                this.gameState.resources.wood -= upkeepCost;
            } else {
                // Buildings decay without upkeep (future feature)
                this.gameState.resources.wood = 0;
            }
            
            // ═══════════════════════════════════════════════════════════════════
            // FOOD CONSUMPTION
            // ═══════════════════════════════════════════════════════════════════
            const foodConsumed = this.gameState.pop;
            this.gameState.resources.food -= foodConsumed;
            
            // Starvation check
            if (this.gameState.resources.food < 0) {
                const shortfall = Math.abs(this.gameState.resources.food);
                const deaths = Math.ceil(shortfall * 0.5);
                this.gameState.pop = Math.max(0, this.gameState.pop - deaths);
                this.gameState.resources.food = 0;
                
                if (deaths > 0) {
                    UI.showToast(`💀 FAMINE! ${deaths} starved to death!`, { duration: 3000 });
                }
            }
            
            // ═══════════════════════════════════════════════════════════════════
            // HOUSING CAPACITY
            // ═══════════════════════════════════════════════════════════════════
            const housingCapacity = resCount * 20; // 20 per residential building
            const homeless = Math.max(0, this.gameState.pop - housingCapacity);
            
            if (homeless > 0) {
                // Homeless suffer exposure
                const exposureDeaths = Math.ceil(homeless * 0.15);
                this.gameState.pop = Math.max(1, this.gameState.pop - exposureDeaths);
                
                if (exposureDeaths > 0) {
                    UI.showToast(`🏚️ ${homeless} homeless! ${exposureDeaths} died from exposure.`, { duration: 2500 });
                }
            }
            
            // ═══════════════════════════════════════════════════════════════════
            // POPULATION GROWTH
            // ═══════════════════════════════════════════════════════════════════
            const canGrow = this.gameState.pop < housingCapacity && 
                           this.gameState.resources.food > foodConsumed * 1.5;
            
            if (canGrow) {
                // Slow growth - 5% per year
                const growth = Math.max(1, Math.ceil(this.gameState.pop * 0.05));
                const newPop = Math.min(this.gameState.pop + growth, housingCapacity);
                const actualGrowth = newPop - this.gameState.pop;
                
                if (actualGrowth > 0) {
                    this.gameState.pop = newPop;
                    if (Math.random() < 0.3 || actualGrowth > 3) {
                        UI.showToast(`👶 ${actualGrowth} new settlers born!`, { duration: 2000 });
                    }
                }
            }
            
            // Population boom every 10 years
            if (this.gameState.year % 10 === 0 && housingCapacity > this.gameState.pop) {
                const boomSize = 1 + Math.floor(Math.random() * 3);
                this.gameState.pop = Math.min(this.gameState.pop + boomSize, housingCapacity);
                UI.showToast(`👶 Population boom! +${boomSize}`, { duration: 2000 });
            }
            
            // ═══════════════════════════════════════════════════════════════════
            // GEOLOGICAL WATER CYCLE - Check every 100 years
            // ═══════════════════════════════════════════════════════════════════
            this.updateGeologicalCycle();
            
            // ═══════════════════════════════════════════════════════════════════
            // GAME OVER CHECKS
            // ═══════════════════════════════════════════════════════════════════
            if (this.gameState.pop <= 0) {
                this.triggerGameOver('Your settlement has perished...', 'UNKNOWN');
                return;
            }
        }
        
        // Track peak population
        if (this.gameState.pop > this.gameState.peakPop) {
            this.gameState.peakPop = this.gameState.pop;
        }
        
        UI.showToast(`📅 Year ${this.gameState.year}`, { duration: 1500 });
        this.updateDashboard();
    }
    
    private updateGeologicalCycle(): void {
        if (!this.gameState) return;
        
        const cfg = Config.CFG.ELEVATION_SYSTEM;
        if (!cfg.ENABLED) return;
        
        const geo = this.gameState.geology;
        
        // Only check every 100 years
        if (this.gameState.year - geo.lastUpdateYear < cfg.UPDATE_INTERVAL_YEARS) return;
        geo.lastUpdateYear = this.gameState.year;
        
        // Advance centuries in current period
        geo.centuriesInPeriod++;
        
        // Check if period has ended
        const currentPeriod = cfg.GEOLOGICAL_PERIODS[geo.periodIndex];
        if (geo.centuriesInPeriod >= currentPeriod.duration) {
            // Move to next period
            geo.periodIndex = (geo.periodIndex + 1) % cfg.GEOLOGICAL_PERIODS.length;
            geo.centuriesInPeriod = 0;
            
            const newPeriod = cfg.GEOLOGICAL_PERIODS[geo.periodIndex];
            geo.currentPeriodName = newPeriod.name;
            
            // Announce major geological shift
            const oldLevel = geo.currentSeaLevel;
            const newLevel = newPeriod.seaLevel;
            
            if (newLevel > oldLevel) {
                UI.showToast(`🌊 ${newPeriod.name} begins! Waters are rising as ice melts...`, { duration: 5000 });
            } else if (newLevel < oldLevel) {
                UI.showToast(`❄️ ${newPeriod.name} begins! Waters recede as glaciers grow...`, { duration: 5000 });
            } else {
                UI.showToast(`🌍 ${newPeriod.name} begins.`, { duration: 3000 });
            }
        }
        
        // Gradual sea level change
        const targetLevel = cfg.GEOLOGICAL_PERIODS[geo.periodIndex].seaLevel;
        const oldLevel = geo.currentSeaLevel;
        
        if (geo.currentSeaLevel < targetLevel) {
            // Water rising slowly
            geo.currentSeaLevel = Math.min(cfg.SEA_LEVEL_MAX, geo.currentSeaLevel + 0.1);
            if (Math.floor(oldLevel * 10) !== Math.floor(geo.currentSeaLevel * 10)) {
                UI.showToast(`📰 The waters creep higher. Coastal areas at risk.`, { duration: 4000 });
            }
            this.applySeaLevelChange();
        } else if (geo.currentSeaLevel > targetLevel) {
            // Water receding
            geo.currentSeaLevel = Math.max(cfg.SEA_LEVEL_MIN, geo.currentSeaLevel - 0.1);
            this.applySeaLevelChange();
        }
    }
    
    private applySeaLevelChange(): void {
        if (!this.gameState) return;
        
        const seaLevel = this.gameState.geology.currentSeaLevel;
        let flooded = 0;
        let populationDrowned = 0;
        let wellsLost = 0;
        const bldsToRemove: number[] = [];
        
        for (let x = 0; x < MAP_WIDTH; x++) {
            for (let y = 0; y < MAP_HEIGHT; y++) {
                const tile = this.tiles[x]?.[y];
                if (!tile) continue;
                
                // Skip extreme elevations
                if (tile.elevation <= 0 || tile.elevation >= 8) continue;
                
                // Check if tile should flood
                if (tile.elevation < seaLevel && tile.type !== 'WATER' && tile.type !== 'DEEP') {
                    // Check for buildings at this location
                    for (let i = 0; i < this.gameState.blds.length; i++) {
                        const b = this.gameState.blds[i];
                        if (b.x === x && b.y === y && !bldsToRemove.includes(i)) {
                            bldsToRemove.push(i);
                            if (b.t === 'WELL') wellsLost++;
                            if (b.t === 'RES' && b.pop) populationDrowned += b.pop;
                        }
                    }
                    
                    // Flood the tile
                    tile.type = 'WATER';
                    tile.tree = false;
                    tile.road = false;
                    flooded++;
                }
            }
        }
        
        // Remove flooded buildings
        if (bldsToRemove.length > 0) {
            bldsToRemove.sort((a, b) => b - a);
            for (const idx of bldsToRemove) {
                this.gameState.blds.splice(idx, 1);
            }
        }
        
        // Apply casualties
        if (populationDrowned > 0) {
            this.gameState.pop = Math.max(0, this.gameState.pop - populationDrowned);
            UI.showToast(`🌊💀 ${populationDrowned} drowned in rising waters!`, { duration: 5000 });
        }
        
        if (wellsLost > 0) {
            UI.showToast(`💧🌊 ${wellsLost} well${wellsLost > 1 ? 's' : ''} swallowed by the sea!`, { duration: 4000 });
        }
        
        // Update geology stats
        this.gameState.geology.tilesFlooded += flooded;
    }
    
    private handleSave(): void {
        if (!this.gameState) return;
        
        try {
            const saveData = {
                version: '48.0',
                timestamp: Date.now(),
                gameState: this.gameState,
                tiles: this.tiles.map(col => col.map(tile => ({
                    type: tile.type,
                    elevation: tile.elevation,
                    explored: tile.explored,
                    tree: tile.tree,
                    road: tile.road
                })))
            };
            
            localStorage.setItem('civilzones_save', JSON.stringify(saveData));
            UI.showToast('💾 Game saved!', { duration: 2000 });
        } catch (error) {
            UI.showToast('❌ Failed to save game!', { duration: 2000 });
            console.error('Save error:', error);
        }
    }
    
    private handleLoad(): void {
        try {
            const saveJson = localStorage.getItem('civilzones_save');
            if (!saveJson) {
                UI.showToast('📂 No save file found!', { duration: 2000 });
                return;
            }
            
            const saveData = JSON.parse(saveJson);
            
            // Restore game state
            this.gameState = saveData.gameState;
            
            // Restore tiles
            for (let x = 0; x < MAP_WIDTH && x < saveData.tiles.length; x++) {
                for (let y = 0; y < MAP_HEIGHT && y < saveData.tiles[x].length; y++) {
                    const saved = saveData.tiles[x][y];
                    if (this.tiles[x]?.[y]) {
                        this.tiles[x][y].explored = saved.explored;
                        this.tiles[x][y].tree = saved.tree;
                        this.tiles[x][y].road = saved.road;
                    }
                }
            }
            
            this.invalidateEntityCache();
            this.updateDashboard();
            
            UI.showToast('📂 Game loaded!', { duration: 2000 });
        } catch (error) {
            UI.showToast('❌ Failed to load game!', { duration: 2000 });
            console.error('Load error:', error);
        }
    }
    
    private handleNewGame(): void {
        // Clear any cached state
        window.__civilZonesEngine = undefined;
        window.__civilZonesInitializing = false;
        
        // Clear localStorage cache if any
        try {
            localStorage.removeItem('civilzones_autosave');
        } catch (e) {
            // Ignore if localStorage not available
        }
        
        // Force full page reload (bypass cache)
        window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now();
    }
    
    private showStats(): void {
        if (!this.gameState) return;
        
        const statsHtml = `
            <div class="stat-row">
                <span>👥 Population:</span>
                <span>${this.gameState.pop}</span>
            </div>
            <div class="stat-row">
                <span>🍖 Food:</span>
                <span>${this.gameState.inventory.food}/${this.gameState.inventory.capacity}</span>
            </div>
            <div class="stat-row">
                <span>🪵 Wood:</span>
                <span>${this.gameState.inventory.wood}</span>
            </div>
            <div class="stat-row">
                <span>📅 Year:</span>
                <span>${this.gameState.year}</span>
            </div>
            <div class="stat-row">
                <span>🏠 Residential:</span>
                <span>${this.countBuildingsByZone('residential')}</span>
            </div>
            <div class="stat-row">
                <span>🏪 Commercial:</span>
                <span>${this.countBuildingsByZone('commercial')}</span>
            </div>
            <div class="stat-row">
                <span>🏭 Industrial:</span>
                <span>${this.countBuildingsByZone('industrial')}</span>
            </div>
        `;
        
        UI.updateStatsContent(statsHtml);
    }
    
    private updateLoadingStatus(message: string): void {
        const statusEl = document.querySelector('#loading-screen .status');
        if (statusEl) {
            statusEl.textContent = message;
        }
    }
    
    start(): void {
        if (this.running) {
            console.log('⚠️ Engine already running, skipping start');
            return;
        }
        
        // Cancel any existing animation frame first
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = 0;
        }
        
        this.running = true;
        this.lastFrameTime = performance.now();
        this.fpsUpdateTime = this.lastFrameTime;
        this.inputController?.enable();
        
        // Start the single game loop
        this.scheduleNextFrame();
    }
    
    stop(): void {
        this.running = false;
        this.inputController?.disable();
        // Cancel any pending animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = 0;
        }
    }
    
    private animationFrameId: number = 0;
    
    private scheduleNextFrame(): void {
        // Only schedule if running and no frame pending
        if (this.running && !this.animationFrameId) {
            this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
        }
    }
    
    private gameLoop(timestamp: number): void {
        // Clear the frame ID since we're now in the callback
        this.animationFrameId = 0;
        
        // Stop if no longer running
        if (!this.running) {
            return;
        }
        
        const deltaTime = timestamp - this.lastFrameTime;
        
        // Throttle to target FPS
        if (deltaTime >= FRAME_TIME) {
            this.lastFrameTime = timestamp - (deltaTime % FRAME_TIME);
            this.frameCount++;
            this.fpsFrameCount++;
            
            // Update FPS counter every second
            if (timestamp - this.fpsUpdateTime >= 1000) {
                this.actualFPS = this.fpsFrameCount;
                this.fpsFrameCount = 0;
                this.fpsUpdateTime = timestamp;
            }
            
            // Update game logic (with try/catch to prevent crashes)
            try {
                this.update(deltaTime);
            } catch (err) {
                console.error('Update error:', err);
            }
            
            // Render frame (with try/catch to prevent crashes)
            try {
                this.render(deltaTime);
            } catch (err) {
                console.error('Render error:', err);
            }
            
            // Update HUD (throttled - every 5 frames)
            if (this.frameCount % 5 === 0) {
                this.updateHUD();
            }
        }
        
        // Schedule next frame using the dedicated method
        this.scheduleNextFrame();
    }
    
    private update(deltaTime: number): void {
        if (!this.gameState) return;
        
        // Process pathfinding queue
        this.processPath();
        
        // INSTANT camera following - like legacy game (racecar feel!)
        // No lerp = no lag = snappy responsive controls
        this.camera.x = this.targetCameraX;
        this.camera.y = this.targetCameraY;
        
        // Update AI systems (throttled)
        const now = performance.now();
        if (now - this.lastAIUpdate >= AI_UPDATE_INTERVAL) {
            this.lastAIUpdate = now;
            this.updateAI();
        }
        
        // Update entity animations and movement every frame
        this.updateEntityMovement();
        
        // ═══════════════════════════════════════════════════════════════════
        // PLAYER WALKING ANIMATION DECAY
        // Stop leg animation after player stops moving
        // ═══════════════════════════════════════════════════════════════════
        if (this.gameState.player && this.gameState.player.isMoving) {
            const timeSinceMove = now - (this.gameState.player.lastMoveTime || 0);
            if (timeSinceMove > 200) {
                // Player stopped moving - freeze legs
                this.gameState.player.isMoving = false;
            }
        }
    }
    
    private updateAI(): void {
        // AI updates here
    }
    
    /**
     * Update all entity movement - animals wander, nomads chase
     * Called every frame - SMOOTH WALKING with interpolation
     * Classic stick figure feel - entities glide smoothly between tiles
     */
    private updateEntityMovement(): void {
        if (!this.gameState) return;
        
        // ═══════════════════════════════════════════════════════════════════
        // ANIMAL MOVEMENT - Smooth walking with interpolation
        // Classic stick figure feel - slow, smooth gliding between tiles
        // ═══════════════════════════════════════════════════════════════════
        for (const animal of this.gameState.animals) {
            // Initialize walk cycle for leg animation
            if (animal.walkCycle === undefined) animal.walkCycle = Math.random() * 10;
            
            // Initialize flee timer if not present
            if (animal.fleeTimer === undefined) animal.fleeTimer = 0;
            
            // SMOOTH INTERPOLATION - animate between tiles
            if (animal.moveProgress !== undefined && animal.moveProgress < 1) {
                // Llamas are SUPER fast when fleeing - basically uncatchable!
                const isLlama = animal.type === 'LLAMA';
                const baseSpeed = isLlama ? 0.035 : 0.015;
                const fleeSpeed = isLlama ? 0.08 : 0.025; // Llamas zoom away!
                const speed = animal.state === 'FLEEING' ? fleeSpeed : baseSpeed;
                animal.moveProgress += speed;
                // Animate legs while moving
                animal.walkCycle += speed * 3;
                continue; // Still walking to next tile
            }
            
            // Arrived at destination - decrement flee timer
            if (animal.fleeTimer > 0) {
                animal.fleeTimer--;
            }
            
            // PERFORMANCE: Check for nearby nomads using squared distance (no sqrt) 
            // and early exit once we find one close enough
            let nearestNomad: { x: number; y: number; dist: number } | null = null;
            // Llamas have AMAZING situational awareness - they see you from SO far away
            const isLlama = animal.type === 'LLAMA';
            const threatRange = isLlama ? 25 : 12; // Llamas spot threats from 25 tiles!
            const threatRangeSq = threatRange * threatRange;
            
            for (const nomad of this.gameState.nomads) {
                const dx = nomad.x - animal.x;
                const dy = nomad.y - animal.y;
                const distSq = dx * dx + dy * dy;
                
                // Early exit if very close - no need to check others
                if (distSq < 16) { // 4 tiles - immediate threat
                    nearestNomad = { x: nomad.x, y: nomad.y, dist: Math.sqrt(distSq) };
                    break;
                }
                
                if (distSq < threatRangeSq && (!nearestNomad || distSq < nearestNomad.dist * nearestNomad.dist)) {
                    nearestNomad = { x: nomad.x, y: nomad.y, dist: Math.sqrt(distSq) };
                }
            }
            
            // Determine movement based on state
            let moveX = 0, moveY = 0;
            
            // Only start new movement occasionally - not every frame
            // Walking: 3% chance, Fleeing: 8% chance per frame when idle
            const moveChance = animal.fleeTimer > 0 ? 0.08 : 0.03;
            if (Math.random() > moveChance && !nearestNomad) {
                continue; // Stay still most of the time
            }
            
            // FLEE if nomad is close - run away!
            if (nearestNomad && nearestNomad.dist < 10) {
                // FLEE! Move directly away from nomad
                animal.state = 'FLEEING';
                animal.fleeTimer = 30; // Keep fleeing for ~1 sec
                
                // Store last known nomad position for consistent flee direction
                animal.fleeFromX = nearestNomad.x;
                animal.fleeFromY = nearestNomad.y;
                
                // Calculate flee direction - DIRECTLY away from nomad
                const fleeX = animal.x - nearestNomad.x;
                const fleeY = animal.y - nearestNomad.y;
                // Simple direction - no threshold needed
                moveX = fleeX > 0 ? 1 : fleeX < 0 ? -1 : 0;
                moveY = fleeY > 0 ? 1 : fleeY < 0 ? -1 : 0;
                // If somehow at exact same position, pick random direction
                if (moveX === 0 && moveY === 0) {
                    moveX = Math.random() > 0.5 ? 1 : -1;
                    moveY = Math.random() > 0.5 ? 1 : -1;
                }
            } else if (animal.fleeTimer > 0 && animal.fleeFromX !== undefined && animal.fleeFromY !== undefined) {
                // Still fleeing based on last known position - keep running same direction
                animal.state = 'FLEEING';
                const fleeX = animal.x - animal.fleeFromX;
                const fleeY = animal.y - animal.fleeFromY;
                moveX = fleeX > 0 ? 1 : fleeX < 0 ? -1 : 0;
                moveY = fleeY > 0 ? 1 : fleeY < 0 ? -1 : 0;
            } else {
                // Random wander - 50% when checked (checked every 8 frames)
                animal.state = 'WALKING';
                if (Math.random() < 0.5) {
                    moveX = Math.floor(Math.random() * 3) - 1;
                    moveY = Math.floor(Math.random() * 3) - 1;
                }
            }
            
            if (moveX === 0 && moveY === 0) continue;
            
            const newX = animal.x + moveX;
            const newY = animal.y + moveY;
            
            if (newX >= 0 && newX < MAP_WIDTH && newY >= 0 && newY < MAP_HEIGHT) {
                const tile = this.tiles[newX]?.[newY];
                // Allow animals to move on terrain that matches their spawn terrain
                const validTerrain = animal.type === 'TURTLE' 
                    ? (tile?.type === 'SAND' || tile?.type === 'GRASS')
                    : animal.type === 'FISH'
                    ? (tile?.type === 'WATER' || tile?.type === 'RIVER')
                    : (tile?.type === 'GRASS' || tile?.type === 'FOREST' || tile?.type === 'EARTH' || 
                       tile?.type === 'SNOW' || tile?.type === 'SAND' || tile?.type === 'ROCK');
                
                if (tile && validTerrain) {
                    // Check if animal is moving into player's tile
                    const player = this.gameState.player;
                    if (player && newX === player.x && newY === player.y) {
                        // ANIMAL WALKED INTO PLAYER! Pack attack!
                        // Count adjacent animals for pack danger
                        let adjacentAnimals = 0;
                        for (let dx = -1; dx <= 1; dx++) {
                            for (let dy = -1; dy <= 1; dy++) {
                                if (dx === 0 && dy === 0) continue;
                                const checkX = newX + dx;
                                const checkY = newY + dy;
                                if (this.gameState.animals.some(a => a.x === checkX && a.y === checkY)) {
                                    adjacentAnimals++;
                                }
                            }
                        }
                        
                        // Pack attack costs population!
                        if (adjacentAnimals >= 1) {
                            const popLoss = Math.max(1, Math.min(3, Math.ceil(this.gameState.pop * 0.1)));
                            this.gameState.pop = Math.max(1, this.gameState.pop - popLoss);
                            const emoji = animal.type === 'WOLF' ? '🐺' : animal.type === 'BEAR' ? '🐻' : animal.type === 'BOAR' ? '🐗' : '🦬';
                            UI.showToast(`${emoji} ANIMAL ATTACK! Herd trampled you! -${popLoss} pop!`, { duration: 3000 });
                        } else {
                            // Single animal bumped into player - minor damage
                            this.gameState.pop = Math.max(1, this.gameState.pop - 1);
                            const emoji = animal.type === 'WOLF' ? '🐺' : animal.type === 'BEAR' ? '🐻' : '🦌';
                            UI.showToast(`${emoji} ${animal.type} charged at you! -1 pop!`, { duration: 2000 });
                        }
                        continue; // Don't move animal into player
                    }
                    
                    // Start smooth walk to new tile
                    animal.prevX = animal.x;
                    animal.prevY = animal.y;
                    animal.moveProgress = 0;
                    animal.x = newX;
                    animal.y = newY;
                }
            }
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // NOMAD MOVEMENT - Smooth walking with interpolation
        // Classic stick figure feel - slow, smooth gliding between tiles
        // ═══════════════════════════════════════════════════════════════════
        for (const nomad of this.gameState.nomads) {
            // Initialize walk cycle
            if (nomad.walkCycle === undefined) nomad.walkCycle = Math.random() * 10;
            
            // SMOOTH INTERPOLATION - animate between tiles
            if (nomad.moveProgress !== undefined && nomad.moveProgress < 1) {
                // Very slow progress = smooth classic walking
                // 0.02 = ~50 frames per tile = about 0.8 seconds per tile
                const speed = nomad.state === 'CHASING' ? 0.025 : 0.018;
                nomad.moveProgress += speed;
                // Animate legs while moving
                nomad.walkCycle += speed * 3;
                continue; // Still walking to next tile
            }
            
            // Look for nearby animals to chase (within 12 tiles)
            let nearestAnimal: { x: number; y: number; dist: number } | null = null;
            for (let i = 0; i < this.gameState.animals.length; i++) {
                const animal = this.gameState.animals[i];
                // Don't chase fish
                if (animal.type === 'FISH') continue;
                const dx = animal.x - nomad.x;
                const dy = animal.y - nomad.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 12 && dist > 0 && (!nearestAnimal || dist < nearestAnimal.dist)) {
                    nearestAnimal = { x: animal.x, y: animal.y, dist };
                }
            }
            
            // Check for nearby OTHER nomads to avoid clumping
            let tooCloseToOtherNomad = false;
            let avoidX = 0, avoidY = 0;
            for (const other of this.gameState.nomads) {
                if (other === nomad) continue;
                const dx = other.x - nomad.x;
                const dy = other.y - nomad.y;
                const dist = Math.abs(dx) + Math.abs(dy);
                if (dist <= 2) {
                    tooCloseToOtherNomad = true;
                    // Move away from other nomad
                    avoidX = dx > 0 ? -1 : dx < 0 ? 1 : 0;
                    avoidY = dy > 0 ? -1 : dy < 0 ? 1 : 0;
                    break;
                }
            }
            
            let moveX = 0, moveY = 0;
            
            if (nearestAnimal) {
                // CHASE! But never catch - always stay 1 tile behind (it's funnier this way)
                nomad.state = 'CHASING';
                nomad.chaseTarget = { x: nearestAnimal.x, y: nearestAnimal.y };
                
                // If already adjacent (1-2 tiles), don't move closer - just stalk
                if (nearestAnimal.dist <= 1.5) {
                    // Too close! Stay here and stalk, don't catch
                    continue;
                }
                
                // If too close to another nomad, scatter instead of chasing
                if (tooCloseToOtherNomad && Math.random() < 0.7) {
                    // 70% chance to scatter away from other nomads
                    moveX = avoidX !== 0 ? avoidX : (Math.random() < 0.5 ? -1 : 1);
                    moveY = avoidY !== 0 ? avoidY : (Math.random() < 0.5 ? -1 : 1);
                } else {
                    // Various chase speeds for comedy:
                    // 60% chance to chase, 40% chance to stalk slowly (skip move) - more scattered
                    if (Math.random() < 0.4) {
                        // Stalking... pretend to be sneaky
                        continue;
                    }
                    
                    // Move towards animal with some randomness (flanking behavior)
                    const chaseX = nearestAnimal.x - nomad.x;
                    const chaseY = nearestAnimal.y - nomad.y;
                    moveX = chaseX > 0 ? 1 : chaseX < 0 ? -1 : 0;
                    moveY = chaseY > 0 ? 1 : chaseY < 0 ? -1 : 0;
                    
                    // 40% chance to add lateral movement (flanking) instead of direct chase
                    if (Math.random() < 0.4) {
                        if (Math.random() < 0.5) {
                            // Swap X and Y for sideways movement
                            const temp = moveX;
                            moveX = moveY;
                            moveY = temp;
                        } else {
                            // Just randomize one axis
                            if (Math.random() < 0.5) {
                                moveX = Math.floor(Math.random() * 3) - 1;
                            } else {
                                moveY = Math.floor(Math.random() * 3) - 1;
                            }
                        }
                    }
                }
            } else {
                // Random wander - only 4% chance when idle = mostly standing still
                nomad.state = 'WALKING';
                nomad.chaseTarget = undefined;
                if (Math.random() < 0.04) {
                    moveX = Math.floor(Math.random() * 3) - 1;
                    moveY = Math.floor(Math.random() * 3) - 1;
                }
            }
            
            // Skip if no movement
            if (moveX === 0 && moveY === 0) continue;
            
            const newX = nomad.x + moveX;
            const newY = nomad.y + moveY;
            
            if (newX >= 0 && newX < MAP_WIDTH && newY >= 0 && newY < MAP_HEIGHT) {
                const tile = this.tiles[newX]?.[newY];
                // Nomads can walk on ANY non-water terrain
                const blocked = tile?.type === 'WATER' || tile?.type === 'DEEP' || 
                               tile?.type === 'RIVER' || tile?.type === 'STONE';
                if (tile && !blocked) {
                    // Check if nomad is moving into player's tile
                    const player = this.gameState.player;
                    if (player && newX === player.x && newY === player.y) {
                        // NOMAD WALKS INTO PLAYER!
                        if (nomad.is_hostile) {
                            // Hostile ambush - player loses population!
                            const damage = 1 + Math.floor(Math.random() * 2);
                            this.gameState.pop = Math.max(1, this.gameState.pop - damage);
                            UI.showToast(`⚔️ Hostile nomad ambush! -${damage} pop!`, { duration: 2500 });
                            // Remove hostile nomad after attack
                            this.gameState.nomads = this.gameState.nomads.filter(n => n !== nomad);
                        } else {
                            // Friendly nomad joins!
                            this.gameState.pop += 1;
                            this.gameState.inventory.capacity += 50;
                            UI.showToast(`🤝 Friendly hunter joined your tribe! +1 pop!`, { duration: 2500 });
                            this.gameState.nomads = this.gameState.nomads.filter(n => n !== nomad);
                        }
                        continue; // Don't move this nomad
                    }
                    
                    // Start smooth walk to new tile
                    nomad.prevX = nomad.x;
                    nomad.prevY = nomad.y;
                    nomad.moveProgress = 0;
                    nomad.x = newX;
                    nomad.y = newY;
                }
            }
        }
    }
    
    private render(deltaTime: number): void {
        // Mutex - prevent overlapping renders
        if (this.isRendering) return;
        if (!this.gameRenderer || !this.gameState) return;
        
        // Skip rendering if canvas has no size
        if (this.canvas.width <= 0 || this.canvas.height <= 0) {
            this.resizeCanvas();
            return;
        }
        
        this.isRendering = true;
        
        try {
            // Use logical dimensions for rendering (before DPR scaling)
            const logicalWidth = (this.canvas as any).logicalWidth || this.canvas.width;
            const logicalHeight = (this.canvas as any).logicalHeight || this.canvas.height;
            
            const viewport: Rendering.Viewport = {
                width: logicalWidth,
                height: logicalHeight
            };
            
            // Build render state
            const renderState: GameRenderState = {
                tiles: this.tiles,
                buildings: this.gameState.blds.map(b => ({
                    t: b.t,
                    x: b.x,
                y: b.y,
                lvl: b.lvl,
                pop: b.pop,
                variant: 2,
                efficiency: b.efficiency
            })),
            player: this.gameState.player ? {
                x: this.gameState.player.x,
                y: this.gameState.player.y,
                direction: this.gameState.player.direction || 'down',
                hp: this.gameState.player.health || 100,
                maxHp: 100,
                bashTime: this.gameState.player.bashTime,
                walkCycle: this.gameState.player.walkCycle || 0,
                isMoving: this.gameState.player.isMoving || false
            } : null,
            entities: this.getEntitiesForRender(),
            animals: this.gameState.animals,
            nomads: this.gameState.nomads,
            wanderWells: this.gameState.wanderWells || [],
            gamePhase: this.gameState.gamePhase,
            viewMode: this.gameState.viewMode,
            year: this.gameState.year
        };
        
        // Render the game
        this.gameRenderer.render(renderState, this.camera, viewport, deltaTime);
        } finally {
            this.isRendering = false;
        }
    }
    
    // Cache for entity rendering (avoid scanning entire map every frame)
    private entityCache: Array<{ type: string; x: number; y: number; amount?: number }> = [];
    private entityCacheDirty: boolean = true;
    
    private getEntitiesForRender(): Array<{ type: string; x: number; y: number; amount?: number }> {
        // Only rebuild cache when needed
        if (!this.entityCacheDirty) {
            return this.entityCache;
        }
        
        const entities: Array<{ type: string; x: number; y: number; amount?: number }> = [];
        
        for (let x = 0; x < MAP_WIDTH; x++) {
            for (let y = 0; y < MAP_HEIGHT; y++) {
                const tile = this.tiles[x]?.[y];
                if (tile?.entity && tile.explored) {
                    const entity = tile.entity as { type: string; amount?: number };
                    entities.push({
                        type: entity.type,
                        x,
                        y,
                        amount: entity.amount
                    });
                }
            }
        }
        
        this.entityCache = entities;
        this.entityCacheDirty = false;
        return entities;
    }
    
    // Call this when entities change (player moves, entity collected, etc.)
    private invalidateEntityCache(): void {
        this.entityCacheDirty = true;
    }
    
    // Input handlers
    private handleMove(dx: number, dy: number): void {
        if (!this.gameState?.player) return;
        if (this.gameState.gameOver) return;
        
        const player = this.gameState.player;
        const newX = player.x + dx;
        const newY = player.y + dy;
        
        // Update direction
        if (dx > 0) player.direction = 'right';
        else if (dx < 0) player.direction = 'left';
        else if (dy > 0) player.direction = 'down';
        else if (dy < 0) player.direction = 'up';
        
        // Check bounds (Flat Earth message at edges)
        if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) {
            UI.showToast('🌍 You have reached the edge of the known world!', { duration: 2000 });
            return;
        }
        
        // Check passability
        const tile = this.tiles[newX]?.[newY];
        if (!tile) return;
        
        // Block water tiles always
        // Block STONE terrain only in WANDER mode (impassable mountains)
        // ROCK terrain (mountain slopes) is walkable!
        const impassable = this.gameState.gamePhase === 'WANDER' 
            ? ['WATER', 'DEEP', 'RIVER', 'STONE']
            : ['WATER', 'DEEP', 'RIVER'];
        
        if (impassable.includes(tile.type)) {
            if (tile.type === 'STONE') {
                UI.showToast('⛰️ Dense rock formation. Impassable.', { duration: 1000 });
            } else {
                UI.showToast('⛔ Cannot walk there!', { duration: 1000 });
            }
            return;
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // WALKING ANIMATION - Update walk cycle for leg movement!
        // ═══════════════════════════════════════════════════════════════════
        player.walkCycle = (player.walkCycle || 0) + 0.5; // Advance walk cycle
        player.isMoving = true;
        player.lastMoveTime = performance.now();
        
        // Move player
        player.x = newX;
        player.y = newY;
        
        // ═══════════════════════════════════════════════════════════════════
        // THIRST SYSTEM (WANDER mode only)
        // ═══════════════════════════════════════════════════════════════════
        if (this.gameState.gamePhase === 'WANDER' && this.gameState.thirst) {
            this.gameState.thirst.stepCounter++;
            
            // Deplete thirst every step
            if (this.gameState.thirst.stepCounter >= 1) {
                this.gameState.thirst.stepCounter = 0;
                this.gameState.thirst.level = Math.max(0, this.gameState.thirst.level - 1);
            }
            
            // Check for water sources to refill
            const nearWater = this.isNearWater(newX, newY);
            if (nearWater) {
                if (this.gameState.thirst.level < 100) {
                    this.gameState.thirst.level = 100;
                    UI.showToast('💧 Refreshed at water source!', { duration: 1500 });
                }
            }
            
            // Thirst warnings and death
            if (this.gameState.thirst.level <= 30 && this.gameState.thirst.level > 15) {
                UI.showToast('💧 Getting thirsty...', { duration: 1500 });
            } else if (this.gameState.thirst.level <= 15 && this.gameState.thirst.level > 0) {
                UI.showToast('⚠️ DEHYDRATED! Find water NOW!', { duration: 2000 });
            } else if (this.gameState.thirst.level <= 0) {
                this.triggerGameOver('Your tribe died of thirst in the wilderness...', 'THIRST');
                return;
            }
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // RESOURCE COLLECTION
        // ═══════════════════════════════════════════════════════════════════
        
        // Forest passive wood (+1 per step)
        if (tile.type === 'FOREST') {
            this.gameState.inventory.wood += 1;
        }
        
        // Tree collection (+2-5 wood, consumes tree)
        if (tile.tree) {
            // BASH ANIMATION! Club swing when chopping trees!
            player.bashTime = performance.now();
            
            const woodGained = 2 + Math.floor(Math.random() * 4);
            this.gameState.inventory.wood += woodGained;
            tile.tree = false;
            UI.showToast(`🪵 Gathered ${woodGained} wood from tree!`, { duration: 1500 });
        }
        
        // Rare metal/stone finds (0.01% per step on grass/sand)
        if (tile.type === 'GRASS' || tile.type === 'SAND') {
            if (Math.random() < 0.0001) {
                const findType = Math.random() < 0.5 ? 'metal' : 'stone';
                const amount = 1 + Math.floor(Math.random() * 5);
                this.gameState.pocket[findType] += amount;
                UI.showToast(`✨ Found ${amount} ${findType} nuggets!`, { duration: 2000 });
            }
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // ENTITY INTERACTIONS
        // ═══════════════════════════════════════════════════════════════════
        
        // Berry collection with poison chance
        if (tile.entity) {
            const entity = tile.entity as { type: string; amount?: number; is_poisonous?: boolean };
            if (entity.type === 'BERRY' && entity.amount) {
                const collected = Math.min(entity.amount, 10);
                this.gameState.inventory.food += collected;
                entity.amount -= collected;
                
                // 10% poison chance
                if (Math.random() < 0.1) {
                    this.gameState.pop = Math.max(1, this.gameState.pop - 1);
                    UI.showToast('☠️ Poisonous berries! Lost 1 tribe member!', { duration: 3000 });
                } else {
                    UI.showToast(`🫐 Collected ${collected} berries!`, { duration: 1500 });
                }
                
                if (entity.amount <= 0) {
                    tile.entity = undefined;
                    this.invalidateEntityCache();
                }
            }
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // ANIMAL/HERD ENCOUNTER CHECK - with Safe Hunt mechanic
        // ═══════════════════════════════════════════════════════════════════
        const animalsHere = this.gameState.animals.filter(a => a.x === newX && a.y === newY);
        if (animalsHere.length > 0) {
            // BASH ANIMATION! Club swing when hunting!
            player.bashTime = performance.now();
            
            // Check if any friendly nomad is nearby (within 3 tiles) for SAFE HUNT
            const nearbyNomad = this.gameState.nomads.find(n => {
                const dx = Math.abs(n.x - newX);
                const dy = Math.abs(n.y - newY);
                return dx <= 3 && dy <= 3 && !n.is_hostile;
            });
            
            // Check for herd danger (2+ adjacent animals) - but nomads make it safe!
            const adjacentAnimals = this.countAdjacentAnimals(newX, newY);
            if (adjacentAnimals >= 2 && !nearbyNomad) {
                // Herd attack! (only without nomad help)
                const losses = Math.max(1, Math.floor(this.gameState.pop * 0.15));
                this.gameState.pop = Math.max(1, this.gameState.pop - losses);
                UI.showToast(`🦬 HERD ATTACK! Lost ${losses} tribe members!`, { duration: 3000 });
            } else {
                // Safe hunt (single animal OR nomad nearby helping)
                const animal = animalsHere[0];
                animal.hits = (animal.hits || 3) - 1;
                
                // Nomad help gives bonus damage
                if (nearbyNomad) {
                    animal.hits -= 1; // Extra hit from nomad helper!
                }
                
                if (animal.hits <= 0) {
                    // Kill animal, get food
                    const baseFood = 5 + Math.floor(Math.random() * 26);
                    const foodGained = nearbyNomad ? Math.floor(baseFood * 1.5) : baseFood; // 50% bonus with nomad
                    this.gameState.inventory.food += foodGained;
                    this.gameState.animals = this.gameState.animals.filter(a => a !== animal);
                    
                    if (nearbyNomad) {
                        UI.showToast(`🏹 SAFE HUNT with nomad! +${foodGained} food!`, { duration: 2500 });
                    } else {
                        UI.showToast(`🍖 Hunted ${animal.type}! +${foodGained} food!`, { duration: 2000 });
                    }
                } else {
                    if (nearbyNomad) {
                        UI.showToast(`🏹 Nomad helps! Hit ${animal.type}! (${animal.hits} left)`, { duration: 1500 });
                    } else {
                        UI.showToast(`⚔️ Hit ${animal.type}! (${animal.hits} hits remaining)`, { duration: 1500 });
                    }
                }
            }
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // ROAMING NOMAD ENCOUNTERS - Catch the hunter to recruit them!
        // ═══════════════════════════════════════════════════════════════════
        if (this.gameState.nomads && this.gameState.nomads.length > 0) {
            const nomadIdx = this.gameState.nomads.findIndex(n => n.x === newX && n.y === newY);
            if (nomadIdx !== -1) {
                const nomad = this.gameState.nomads[nomadIdx];
                player.bashTime = performance.now(); // Trigger greeting animation
                
                // All roaming nomads are friendly hunters looking to join a tribe!
                this.gameState.pop += 1;
                this.gameState.inventory.capacity += 75; // Extra carry capacity
                
                // Nomad brings a gift of food from their hunting
                const foodGift = 5 + Math.floor(Math.random() * 15);
                this.gameState.inventory.food += foodGift;
                
                UI.showToast(`🏹 Hunter joined! +1 pop, +${foodGift} food!`, { duration: 2500 });
                this.gameState.nomads.splice(nomadIdx, 1);
            }
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // NOMAD ENCOUNTERS
        // ═══════════════════════════════════════════════════════════════════
        if (tile.entity) {
            const entity = tile.entity as { type: string; pop?: number; loot?: { food: number; wood: number }; is_hostile?: boolean };
            if (entity.type === 'NOMAD') {
                const isHostile = entity.is_hostile ?? Math.random() < 0.33;
                
                if (isHostile) {
                    const damage = 1 + Math.floor(Math.random() * 3);
                    this.gameState.pop = Math.max(1, this.gameState.pop - damage);
                    UI.showToast(`⚔️ Hostile nomads! Lost ${damage} tribe members!`, { duration: 3000 });
                } else {
                    const popGained = entity.pop || 1;
                    this.gameState.pop += popGained;
                    this.gameState.inventory.capacity += 100;
                    
                    if (entity.loot) {
                        this.gameState.inventory.food += entity.loot.food || 0;
                        this.gameState.inventory.wood += entity.loot.wood || 0;
                    }
                    
                    UI.showToast(`🤝 Friendly nomads joined! +${popGained} pop!`, { duration: 3000 });
                }
                
                tile.entity = undefined;
                this.invalidateEntityCache();
            }
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // FOOD CONSUMPTION (every 15 steps per pop)
        // ═══════════════════════════════════════════════════════════════════
        this.gameState.stepCounter++;
        if (this.gameState.stepCounter >= 15) {
            this.gameState.stepCounter = 0;
            const consumption = Math.ceil(this.gameState.pop * 1);
            this.gameState.inventory.food = Math.max(0, this.gameState.inventory.food - consumption);
            
            // Starvation check
            if (this.gameState.inventory.food <= 0) {
                const deaths = Math.ceil(this.gameState.pop * 0.2);
                this.gameState.pop = Math.max(1, this.gameState.pop - deaths);
                if (deaths > 0) {
                    UI.showToast(`💀 ${deaths} starved to death!`, { duration: 3000 });
                }
                
                if (this.gameState.pop <= 0) {
                    this.triggerGameOver('Your tribe starved to death...', 'STARVATION');
                    return;
                }
            }
        }
        
        // Explore area
        this.exploreArea(newX, newY, 5);
        
        // Update camera target for smooth following
        this.targetCameraX = newX * TILE_SIZE;
        this.targetCameraY = newY * TILE_SIZE;
    }
    
    private isNearWater(x: number, y: number): boolean {
        const waterTypes = ['WATER', 'RIVER', 'DEEP'];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const tile = this.tiles[x + dx]?.[y + dy];
                if (tile && waterTypes.includes(tile.type)) {
                    return true;
                }
            }
        }
        // Check for wells
        for (const well of this.gameState?.wanderWells || []) {
            if (Math.abs(well.x - x) <= 1 && Math.abs(well.y - y) <= 1) {
                return true;
            }
        }
        return false;
    }
    
    private countAdjacentAnimals(x: number, y: number): number {
        if (!this.gameState) return 0;
        let count = 0;
        for (const animal of this.gameState.animals) {
            const dx = Math.abs(animal.x - x);
            const dy = Math.abs(animal.y - y);
            if (dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0)) {
                count++;
            }
        }
        return count;
    }
    
    private triggerGameOver(message: string, reason: 'THIRST' | 'STARVATION' | 'HUNTING' | 'FLOOD' | 'UNKNOWN' = 'UNKNOWN'): void {
        if (!this.gameState) return;
        this.gameState.gameOver = true;
        
        // Find highest residential level
        let highestResLevel = 0;
        for (const bld of this.gameState.blds) {
            if (bld.t === 'RES' && (bld.lvl || 1) > highestResLevel) {
                highestResLevel = bld.lvl || 1;
            }
        }
        
        UI.showGameOver({
            years: this.gameState.year,
            peakPop: this.gameState.peakPop,
            food: Math.floor(this.gameState.inventory?.food || 0),
            wood: Math.floor(this.gameState.inventory?.wood || 0),
            stone: Math.floor(this.gameState.inventory?.stone || 0),
            metal: Math.floor(this.gameState.inventory?.metal || 0),
            wells: this.gameState.wanderWells?.length || 0,
            buildings: this.gameState.blds.length,
            highestResLevel,
            deathReason: reason,
            gamePhase: this.gameState.gamePhase
        });
    }
    
    private handleAction(action: string): void {
        console.log('Action:', action);
        
        if (!this.gameState?.player) return;
        if (this.gameState.gameOver) return;
        
        const player = this.gameState.player;
        
        // Space or Enter - Attack/Bash
        if (action === ' ' || action === 'Enter') {
            // Trigger bash animation
            player.bashTime = performance.now();
            
            // Check for animal on same tile
            const animalIdx = this.gameState.animals.findIndex(a => a.x === player.x && a.y === player.y);
            if (animalIdx !== -1) {
                const animal = this.gameState.animals[animalIdx];
                
                // Check for PACK - count adjacent animals
                let adjacentAnimals = 0;
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        const checkX = player.x + dx;
                        const checkY = player.y + dy;
                        if (this.gameState.animals.some(a => a.x === checkX && a.y === checkY)) {
                            adjacentAnimals++;
                        }
                    }
                }
                
                // If 2+ adjacent animals, it's a dangerous pack!
                const isPack = adjacentAnimals >= 2;
                
                // Llamas are TOO FAST to hunt - they always escape!
                if (animal.type === 'LLAMA') {
                    const llamaMessages = [
                        `🦙 The llama gives you a smug look and prances away!`,
                        `🦙 *spits* The llama disapproves of your hunting skills!`,
                        `🦙 The llama does a little dance and escapes effortlessly!`,
                        `🦙 "Catch me if you can!" - the llama, probably`,
                        `🦙 The llama is simply too elegant to be caught!`
                    ];
                    UI.showToast(llamaMessages[Math.floor(Math.random() * llamaMessages.length)], { duration: 2500 });
                    // Make the llama flee immediately
                    animal.state = 'FLEEING';
                    animal.fleeTimer = 60; // Extra long flee!
                    return;
                }
                
                if (isPack) {
                    // Pack attack! Lose population
                    const popLoss = Math.max(1, Math.min(3, Math.ceil(this.gameState.pop * 0.15)));
                    this.gameState.pop = Math.max(1, this.gameState.pop - popLoss);
                    const emoji = animal.type === 'DEER' ? '🦌' : animal.type === 'BISON' ? '🦬' : '🐘';
                    UI.showToast(`💀 UNSAFE HUNT! ${emoji} Pack attacked! Lost ${popLoss} wanderer${popLoss > 1 ? 's' : ''}!`, { duration: 3000 });
                    return; // Don't kill the animal - packs are dangerous!
                }
                
                // Safe hunt - attack the animal
                animal.hits = (animal.hits || 3) - 1;
                
                if (animal.hits <= 0) {
                    const foodGained = 5 + Math.floor(Math.random() * 26);
                    this.gameState.inventory.food += foodGained;
                    this.gameState.animals.splice(animalIdx, 1);
                    UI.showToast(`🍖 Killed ${animal.type}! +${foodGained} food!`, { duration: 2000 });
                } else {
                    UI.showToast(`⚔️ Hit ${animal.type}! (${animal.hits} hits left)`, { duration: 1500 });
                }
                return;
            }
            
            // Check for roaming nomad on same tile
            const nomadIdx = this.gameState.nomads?.findIndex(n => n.x === player.x && n.y === player.y) ?? -1;
            if (nomadIdx !== -1 && this.gameState.nomads) {
                const nomad = this.gameState.nomads[nomadIdx];
                
                if (nomad.is_hostile) {
                    const damage = 1 + Math.floor(Math.random() * 2);
                    this.gameState.pop = Math.max(1, this.gameState.pop - damage);
                    this.gameState.nomads.splice(nomadIdx, 1);
                    UI.showToast(`⚔️ Fought hostile nomad! -${damage} pop!`, { duration: 2500 });
                } else {
                    this.gameState.pop += 1;
                    this.gameState.inventory.capacity += 50;
                    this.gameState.nomads.splice(nomadIdx, 1);
                    UI.showToast(`🤝 Recruited nomad! +1 pop!`, { duration: 2500 });
                }
                return;
            }
            
            UI.showToast('👊 *swoosh* Nothing there...', { duration: 1000 });
        }
        
        // V key - cycle view
        if (action === 'v' || action === 'V') {
            this.cycleViewMode();
        }
        
        // B key - open build panel
        if (action === 'b' || action === 'B') {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none';
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOTSTRAP
// ═══════════════════════════════════════════════════════════════════════════════

// Use window to persist across HMR reloads
declare global {
    interface Window {
        __civilZonesEngine?: CivilZonesEngine;
        __civilZonesInitializing?: boolean;
    }
}

async function bootstrap(): Promise<void> {
    // Guard against multiple initializations - check window for HMR persistence
    if (window.__civilZonesInitializing || window.__civilZonesEngine) {
        console.log('⚠️ Engine already initialized or initializing, skipping...');
        return;
    }
    
    window.__civilZonesInitializing = true;
    console.log('🚀 Bootstrap starting...');
    
    try {
        console.log('📦 Creating engine...');
        const engine = new CivilZonesEngine('game-canvas');
        console.log('⚙️ Initializing engine...');
        await engine.init();
        console.log('▶️ Starting engine...');
        engine.start();
        console.log('✅ Engine started successfully');
        
        // Store on window for HMR persistence and debugging
        window.__civilZonesEngine = engine;
        (window as unknown as Record<string, unknown>).CivilZones = engine;
        (window as unknown as Record<string, unknown>).GameModules = {
            Types,
            Config,
            Core,
            Systems,
            Rendering,
            GameModule,
            Input,
            UI,
            AI,
            Buildings,
            Entities,
            Events,
            World,
            Time
        };
        
    } catch (error) {
        console.error('❌ Failed to initialize Civil Zones:', error);
        window.__civilZonesEngine = undefined;
        
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            const status = loadingScreen.querySelector('.status');
            if (status) {
                status.textContent = `Error: ${error}`;
                status.setAttribute('style', 'color: #ff6b6b;');
            }
        }
    } finally {
        window.__civilZonesInitializing = false;
    }
}

// Start when DOM is ready - but only if engine doesn't exist
if (!window.__civilZonesEngine && !window.__civilZonesInitializing) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }
}

// Hot Module Replacement - completely disabled to prevent reinitializations
if (import.meta.hot) {
    // Accept updates but keep existing engine
    import.meta.hot.accept();
}
