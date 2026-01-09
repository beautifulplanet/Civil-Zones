/**
 * Civil Zones - Entity Spawning
 * Functions for spawning animals, nomads, and berries
 */

import type { 
    EntityAnimal, 
    AnimalTypeName, 
    AnimalTypeConfig, 
    Nomad, 
    BerryBush,
    SpawnPosition,
    SpawnOptions 
} from './types.js';
import type { TerrainType } from '../types/tiles.js';
import { DEFAULT_ANIMAL_TYPES, DEFAULT_ANIMAL_CONFIG } from './types.js';

// ═══════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════

interface TileLike {
    type: string;
    explored?: boolean;
    entity?: any;
}

interface PlayerLike {
    x: number;
    y: number;
}

interface ConfigLike {
    W: number;
    H: number;
    ANIMALS?: {
        SPAWN_COUNT: number;
        TYPES: AnimalTypeConfig[];
        BEACH_SPAWN_COUNT?: number;
    };
    NOMAD?: {
        SPAWN_COUNT: number;
    };
    BERRIES?: {
        SPAWN_COUNT: number;
    };
}

interface GameLike {
    tiles: TileLike[][];
    player: PlayerLike;
    animals: EntityAnimal[];
    nomads?: Nomad[];
}

// ═══════════════════════════════════════════════════════════════════
// SPAWN POSITION HELPERS
// ═══════════════════════════════════════════════════════════════════

/** Get random spawn position */
export function getRandomPosition(
    config: ConfigLike
): { x: number; y: number } {
    return {
        x: Math.floor(Math.random() * config.W),
        y: Math.floor(Math.random() * config.H)
    };
}

/** Check if position is valid for spawning */
export function isValidSpawnPosition(
    game: GameLike,
    config: ConfigLike,
    x: number,
    y: number,
    options: SpawnOptions = {}
): SpawnPosition {
    const {
        minDistanceFromPlayer = 10,
        allowOverlap = false,
        terrainFilter
    } = options;
    
    // Bounds check
    if (x < 0 || x >= config.W || y < 0 || y >= config.H) {
        return { x, y, valid: false };
    }
    
    const tile = game.tiles[x]?.[y];
    if (!tile) {
        return { x, y, valid: false };
    }
    
    // Distance from player check
    const dist = Math.abs(x - game.player.x) + Math.abs(y - game.player.y);
    if (dist <= minDistanceFromPlayer) {
        return { x, y, valid: false };
    }
    
    // Terrain filter check
    const terrain = tile.type as TerrainType;
    if (terrainFilter && !terrainFilter.includes(terrain)) {
        return { x, y, valid: false };
    }
    
    // Overlap check for animals
    if (!allowOverlap) {
        const occupied = game.animals.some(a => a.x === x && a.y === y);
        if (occupied) {
            return { x, y, valid: false };
        }
    }
    
    return { x, y, valid: true, terrain };
}

/** Get valid terrain types for an animal type */
export function getValidTerrain(
    animalType: AnimalTypeName,
    animalTypes: AnimalTypeConfig[] = DEFAULT_ANIMAL_TYPES
): TerrainType[] {
    const config = animalTypes.find(a => a.name === animalType);
    if (config?.terrain) {
        return config.terrain;
    }
    // Default terrain for animals without explicit terrain
    return ['GRASS', 'FOREST'];
}

// ═══════════════════════════════════════════════════════════════════
// ANIMAL SPAWNING
// ═══════════════════════════════════════════════════════════════════

/** Select random animal type based on spawn rates and terrain */
export function selectAnimalType(
    validTypes: AnimalTypeConfig[]
): AnimalTypeName {
    if (validTypes.length === 0) {
        return 'DEER'; // Fallback
    }
    
    // Calculate total spawn rate
    const totalRate = validTypes.reduce((sum, type) => sum + type.spawnRate, 0);
    
    // Random selection weighted by spawn rate
    const rand = Math.random() * totalRate;
    let cumulative = 0;
    
    for (const type of validTypes) {
        cumulative += type.spawnRate;
        if (rand < cumulative) {
            return type.name;
        }
    }
    
    return validTypes[0].name;
}

/** Get valid animal types for a terrain */
export function getValidAnimalTypes(
    terrain: string,
    animalTypes: AnimalTypeConfig[] = DEFAULT_ANIMAL_TYPES
): AnimalTypeConfig[] {
    return animalTypes.filter(type => {
        if (type.terrain) {
            return type.terrain.includes(terrain as TerrainType);
        }
        // Default: spawn on GRASS or FOREST
        return terrain === 'GRASS' || terrain === 'FOREST';
    });
}

/** Spawn animals on the map */
export function spawnAnimals(
    game: GameLike,
    config: ConfigLike,
    count: number = DEFAULT_ANIMAL_CONFIG.SPAWN_COUNT
): number {
    const animalTypes = config.ANIMALS?.TYPES || DEFAULT_ANIMAL_TYPES;
    let spawned = 0;
    const maxAttempts = count * 20;
    
    for (let attempt = 0; attempt < maxAttempts && spawned < count; attempt++) {
        const pos = getRandomPosition(config);
        const tile = game.tiles[pos.x]?.[pos.y];
        if (!tile) continue;
        
        const terrain = tile.type;
        const dist = Math.abs(pos.x - game.player.x) + Math.abs(pos.y - game.player.y);
        
        // Check if tile is already occupied
        const tileOccupied = game.animals.some(a => a.x === pos.x && a.y === pos.y);
        
        // Get valid animal types for this terrain
        const validTypes = getValidAnimalTypes(terrain, animalTypes);
        
        if (validTypes.length > 0 && dist > 10 && !tileOccupied) {
            const animalType = selectAnimalType(validTypes);
            
            game.animals.push({
                x: pos.x,
                y: pos.y,
                hits: 0,
                type: animalType
            });
            spawned++;
        }
    }
    
    return spawned;
}

/** Spawn beach turtles specifically on sand tiles */
export function spawnBeachTurtles(
    game: GameLike,
    config: ConfigLike,
    count: number = DEFAULT_ANIMAL_CONFIG.BEACH_SPAWN_COUNT
): number {
    let spawned = 0;
    const maxAttempts = count * 30;
    
    for (let attempt = 0; attempt < maxAttempts && spawned < count; attempt++) {
        const pos = getRandomPosition(config);
        const tile = game.tiles[pos.x]?.[pos.y];
        
        // Only spawn on SAND tiles
        if (!tile || tile.type !== 'SAND') continue;
        
        // Check if already occupied
        const tileOccupied = game.animals.some(a => a.x === pos.x && a.y === pos.y);
        if (tileOccupied) continue;
        
        // Distance check from player
        const dist = Math.abs(pos.x - game.player.x) + Math.abs(pos.y - game.player.y);
        if (dist <= 5) continue;
        
        game.animals.push({
            x: pos.x,
            y: pos.y,
            hits: 0,
            type: 'TURTLE'
        });
        spawned++;
    }
    
    return spawned;
}

/** Initialize all animals on map */
export function initializeAnimals(
    game: GameLike,
    config: ConfigLike
): { total: number; turtles: number } {
    // Clear existing animals
    game.animals = [];
    
    // Spawn main animals
    const mainCount = config.ANIMALS?.SPAWN_COUNT || DEFAULT_ANIMAL_CONFIG.SPAWN_COUNT;
    const spawned = spawnAnimals(game, config, mainCount);
    
    // Spawn beach turtles
    const turtleCount = config.ANIMALS?.BEACH_SPAWN_COUNT || DEFAULT_ANIMAL_CONFIG.BEACH_SPAWN_COUNT;
    const turtles = spawnBeachTurtles(game, config, turtleCount);
    
    return { total: spawned + turtles, turtles };
}

// ═══════════════════════════════════════════════════════════════════
// NOMAD SPAWNING
// ═══════════════════════════════════════════════════════════════════

/** Spawn nomads on the map */
export function spawnNomads(
    game: GameLike,
    config: ConfigLike,
    count: number
): number {
    if (!game.nomads) game.nomads = [];
    
    let spawned = 0;
    const maxAttempts = count * 20;
    
    for (let attempt = 0; attempt < maxAttempts && spawned < count; attempt++) {
        const pos = getRandomPosition(config);
        const tile = game.tiles[pos.x]?.[pos.y];
        
        if (!tile) continue;
        
        // Only spawn on walkable terrain
        if (tile.type === 'WATER' || tile.type === 'DEEP' || 
            tile.type === 'RIVER' || tile.type === 'STONE') {
            continue;
        }
        
        // Distance from player
        const dist = Math.abs(pos.x - game.player.x) + Math.abs(pos.y - game.player.y);
        if (dist <= 10) continue;
        
        // Check overlap with other nomads
        const occupied = game.nomads.some(n => n.x === pos.x && n.y === pos.y);
        if (occupied) continue;
        
        game.nomads.push({
            x: pos.x,
            y: pos.y,
            encountered: false
        });
        spawned++;
    }
    
    return spawned;
}

// ═══════════════════════════════════════════════════════════════════
// BERRY SPAWNING
// ═══════════════════════════════════════════════════════════════════

/** Spawn berry bushes on the map (stored in tiles) */
export function spawnBerries(
    game: GameLike,
    config: ConfigLike,
    count: number
): number {
    let spawned = 0;
    const maxAttempts = count * 20;
    
    for (let attempt = 0; attempt < maxAttempts && spawned < count; attempt++) {
        const pos = getRandomPosition(config);
        const tile = game.tiles[pos.x]?.[pos.y];
        
        if (!tile) continue;
        
        // Only spawn on grass or forest
        if (tile.type !== 'GRASS' && tile.type !== 'FOREST') continue;
        
        // Don't overwrite existing entities
        if (tile.entity) continue;
        
        // Distance from player
        const dist = Math.abs(pos.x - game.player.x) + Math.abs(pos.y - game.player.y);
        if (dist <= 5) continue;
        
        tile.entity = { type: 'BERRY', depleted: false };
        spawned++;
    }
    
    return spawned;
}

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/** Get animal at position */
export function getAnimalAt(
    animals: EntityAnimal[],
    x: number,
    y: number
): { animal: EntityAnimal; index: number } | null {
    const index = animals.findIndex(a => a.x === x && a.y === y);
    if (index === -1) return null;
    return { animal: animals[index], index };
}

/** Get animals adjacent to position (for herd detection) */
export function getAdjacentAnimals(
    animals: EntityAnimal[],
    x: number,
    y: number,
    excludeIndex?: number
): EntityAnimal[] {
    return animals.filter((a, idx) => {
        if (excludeIndex !== undefined && idx === excludeIndex) return false;
        const dx = Math.abs(a.x - x);
        const dy = Math.abs(a.y - y);
        return dx <= 1 && dy <= 1;
    });
}

/** Check if position has a herd (multiple animals nearby) */
export function isHerdLocation(
    animals: EntityAnimal[],
    x: number,
    y: number,
    targetIndex?: number
): boolean {
    const adjacent = getAdjacentAnimals(animals, x, y, targetIndex);
    return adjacent.length > 0;
}

/** Count animals by type */
export function countAnimalsByType(
    animals: EntityAnimal[]
): Record<AnimalTypeName, number> {
    const counts: Partial<Record<AnimalTypeName, number>> = {};
    
    for (const animal of animals) {
        counts[animal.type] = (counts[animal.type] || 0) + 1;
    }
    
    return counts as Record<AnimalTypeName, number>;
}
