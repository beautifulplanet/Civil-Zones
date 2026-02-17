/**
 * Entity System
 * Base system for all moving entities: animals, nomads, etc.
 * Clean, modular design with clear interfaces
 */

import type { ChunkManager } from './ChunkManager';
import { isWalkable } from './Tile';
import { ANIMAL_CONFIG, calculateFoodReward, type AnimalBehavior } from '../config/CombatConfig';

// All entity types - animals and nomads
export type EntityType =
    | 'ANIMAL_DEER'
    | 'ANIMAL_RABBIT'
    | 'ANIMAL_BOAR'
    | 'ANIMAL_BEAR'
    | 'ANIMAL_BISON'
    | 'NOMAD';

// Entity behavior states
export type EntityState = 'idle' | 'wandering' | 'fleeing' | 'charging' | 'dying' | 'dead';

export interface Entity {
    readonly id: number;
    type: EntityType;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    speed: number;
    baseSpeed: number;      // Original speed (for restoring after flee)
    isMoving: boolean;
    state: EntityState;
    health: number;
    maxHealth: number;

    // Nomad-specific
    isHostile?: boolean;    // 25% chance for nomads
    isRecruited?: boolean;  // Set when nomad joins tribe

    // Nomad behaviors
    nomadBehavior?: 'idle' | 'chasing' | 'waving' | 'dancing';
    targetAnimalId?: number; // ID of animal being chased
    behaviorTimer?: number;  // Countdown for behavior duration
    animFrame?: number;      // Animation frame counter for smooth anims

    // Animation
    deathTimer?: number;    // Countdown for death animation
}

let entityIdCounter = 0;

/**
 * Get entity stats from config or fallback defaults
 */
function getEntityStats(type: EntityType): { speed: number; health: number } {
    const config = ANIMAL_CONFIG[type];
    if (config) {
        return { speed: 0.08, health: config.hp };
    }
    // Fallback for nomads and unknown types
    if (type === 'NOMAD') {
        return { speed: 0.05, health: 50 };
    }
    return { speed: 0.06, health: 10 };
}

/**
 * Create a new entity
 */
export function createEntity(type: EntityType, x: number, y: number): Entity {
    const stats = getEntityStats(type);

    // Determine if nomad is hostile (25% chance)
    const isHostile = type === 'NOMAD' ? Math.random() < 0.25 : undefined;

    return {
        id: entityIdCounter++,
        type,
        x,
        y,
        targetX: x,
        targetY: y,
        speed: stats.speed,
        baseSpeed: stats.speed,
        isMoving: false,
        state: 'idle',
        health: stats.health,
        maxHealth: stats.health,
        isHostile,
        isRecruited: false
    };
}

/**
 * Deal damage to an entity
 * Returns true if the entity died
 */
export function damageEntity(entity: Entity, damage: number): boolean {
    entity.health = Math.max(0, entity.health - damage);
    if (entity.health <= 0) {
        entity.state = 'dying';
        entity.deathTimer = 60; // 60 frames of death animation
        entity.isMoving = false;
        return true;
    }
    return false;
}

/**
 * Get food reward when killing an animal
 */
export function getEntityFoodReward(entity: Entity): number {
    return calculateFoodReward(entity.type);
}

/**
 * Check if entity is an animal (not a nomad)
 */
export function isAnimal(entity: Entity): boolean {
    return entity.type.startsWith('ANIMAL_');
}

/**
 * Get the behavior type for an entity
 */
export function getEntityBehavior(entity: Entity): AnimalBehavior {
    const config = ANIMAL_CONFIG[entity.type];
    return config?.behavior ?? 'flee';
}

/**
 * Entity Manager - handles all entities in the game
 */
export class EntityManager {
    private entities: Entity[] = [];
    private chunkManager: ChunkManager;
    private wanderTimer = 0;

    constructor(chunkManager: ChunkManager) {
        this.chunkManager = chunkManager;
    }

    public addEntity(entity: Entity): void {
        this.entities.push(entity);
    }

    public getEntities(): readonly Entity[] {
        return this.entities;
    }

    public getEntitiesByType(type: EntityType): Entity[] {
        return this.entities.filter(e => e.type === type);
    }

    public getAnimals(): Entity[] {
        return this.entities.filter(e => isAnimal(e) && e.state !== 'dead');
    }

    public getNomads(): Entity[] {
        return this.entities.filter(e => e.type === 'NOMAD' && !e.isRecruited && e.state !== 'dead');
    }

    public removeEntity(id: number): void {
        const index = this.entities.findIndex(e => e.id === id);
        if (index >= 0) {
            this.entities.splice(index, 1);
        }
    }

    /**
     * Get entity at a specific tile position
     */
    public getEntityAt(x: number, y: number, radius = 1.0): Entity | null {
        for (const entity of this.entities) {
            if (entity.state === 'dead') continue;
            const dx = entity.x - x;
            const dy = entity.y - y;
            if (Math.sqrt(dx * dx + dy * dy) < radius) {
                return entity;
            }
        }
        return null;
    }

    /**
     * Get all entities within radius of a position
     */
    public getEntitiesNear(x: number, y: number, radius: number): Entity[] {
        return this.entities.filter(entity => {
            if (entity.state === 'dead') return false;
            const dx = entity.x - x;
            const dy = entity.y - y;
            return Math.sqrt(dx * dx + dy * dy) < radius;
        });
    }

    /**
     * Make entity flee from a position
     */
    public fleeFrom(entity: Entity, fromX: number, fromY: number): void {
        const config = ANIMAL_CONFIG[entity.type];
        if (!config) return;

        // Calculate flee direction (away from threat)
        const dx = entity.x - fromX;
        const dy = entity.y - fromY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.1) return; // Too close, pick random direction

        // Flee 8-12 tiles away
        const fleeDistance = 8 + Math.random() * 4;
        const targetX = entity.x + (dx / dist) * fleeDistance;
        const targetY = entity.y + (dy / dist) * fleeDistance;

        // Check if target is walkable
        const tile = this.chunkManager.getTile(Math.floor(targetX), Math.floor(targetY));
        if (tile && isWalkable(tile.type)) {
            entity.targetX = targetX;
            entity.targetY = targetY;
            entity.speed = entity.baseSpeed * config.fleeSpeed;
            entity.isMoving = true;
            entity.state = 'fleeing';
        }
    }

    /**
     * Make entity charge toward a position (aggressive behavior)
     */
    public chargeToward(entity: Entity, toX: number, toY: number): void {
        const config = ANIMAL_CONFIG[entity.type];
        if (!config) return;

        entity.targetX = toX;
        entity.targetY = toY;
        entity.speed = entity.baseSpeed * config.fleeSpeed; // Use fleeSpeed for charging too
        entity.isMoving = true;
        entity.state = 'charging';
    }

    /**
     * Update all entities - call each frame
     */
    public update(playerX?: number, playerY?: number): void {
        this.wanderTimer++;

        // Remove dead entities that finished death animation
        this.entities = this.entities.filter(e => {
            if (e.state === 'dying') {
                e.deathTimer = (e.deathTimer ?? 0) - 1;
                if (e.deathTimer <= 0) {
                    e.state = 'dead';
                }
            }
            return e.state !== 'dead';
        });

        for (const entity of this.entities) {
            if (entity.state === 'dying') continue;

            // Check for player proximity and react
            if (playerX !== undefined && playerY !== undefined && isAnimal(entity)) {
                const config = ANIMAL_CONFIG[entity.type];
                if (config && entity.state !== 'fleeing' && entity.state !== 'charging') {
                    const dx = entity.x - playerX;
                    const dy = entity.y - playerY;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < config.fleeDistance) {
                        if (config.behavior === 'charge' || config.behavior === 'aggressive') {
                            this.chargeToward(entity, playerX, playerY);
                        } else {
                            this.fleeFrom(entity, playerX, playerY);
                        }
                    }
                }
            }

            // Movement update
            if (entity.isMoving) {
                const dx = entity.targetX - entity.x;
                const dy = entity.targetY - entity.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < entity.speed) {
                    entity.x = entity.targetX;
                    entity.y = entity.targetY;
                    entity.isMoving = false;
                    entity.speed = entity.baseSpeed; // Reset speed after fleeing
                    entity.state = 'idle';
                } else {
                    entity.x += (dx / dist) * entity.speed;
                    entity.y += (dy / dist) * entity.speed;
                }
            }

            // Nomad-specific behaviors
            if (entity.type === 'NOMAD' && !entity.isRecruited && entity.state !== 'fleeing') {
                // Increment animation frame
                entity.animFrame = ((entity.animFrame ?? 0) + 1) % 1000;

                // Decrement behavior timer
                if (entity.behaviorTimer !== undefined && entity.behaviorTimer > 0) {
                    entity.behaviorTimer--;
                }

                // If no current behavior or timer expired, pick a new one
                if (entity.nomadBehavior === undefined || entity.behaviorTimer === 0) {
                    const roll = Math.random();
                    if (roll < 0.5) {
                        // 50% chance: Chase an animal
                        const nearbyAnimals = this.getAnimals().filter(a => {
                            const d = Math.sqrt(Math.pow(a.x - entity.x, 2) + Math.pow(a.y - entity.y, 2));
                            return d < 15; // Only chase animals within 15 tiles
                        });
                        if (nearbyAnimals.length > 0) {
                            const target = nearbyAnimals[Math.floor(Math.random() * nearbyAnimals.length)];
                            entity.nomadBehavior = 'chasing';
                            entity.targetAnimalId = target.id;
                            entity.behaviorTimer = 180; // Chase for 3 seconds
                        } else {
                            entity.nomadBehavior = 'idle';
                            entity.behaviorTimer = 60;
                        }
                    } else if (roll < 0.7) {
                        // 20% chance: Wave club angrily
                        entity.nomadBehavior = 'waving';
                        entity.behaviorTimer = 90; // 1.5 seconds
                        entity.isMoving = false;
                    } else if (roll < 0.85) {
                        // 15% chance: Dance
                        entity.nomadBehavior = 'dancing';
                        entity.behaviorTimer = 120; // 2 seconds
                        entity.isMoving = false;
                    } else {
                        // 15% chance: Just idle/wander
                        entity.nomadBehavior = 'idle';
                        entity.behaviorTimer = 90;
                    }
                }

                // Execute current behavior
                if (entity.nomadBehavior === 'chasing' && entity.targetAnimalId !== undefined) {
                    const targetAnimal = this.entities.find(e => e.id === entity.targetAnimalId);
                    if (targetAnimal && targetAnimal.state !== 'dead') {
                        // Move toward animal but SLOWER so can't catch it
                        const dx = targetAnimal.x - entity.x;
                        const dy = targetAnimal.y - entity.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist > 1.5) { // Keep chasing if not too close
                            entity.targetX = entity.x + (dx / dist) * 0.3;
                            entity.targetY = entity.y + (dy / dist) * 0.3;
                            entity.speed = entity.baseSpeed * 0.7; // Slower than animals
                            entity.isMoving = true;
                        }
                    } else {
                        // Target gone, stop chasing
                        entity.nomadBehavior = 'idle';
                        entity.behaviorTimer = 30;
                    }
                }
            }

            // Wander randomly when idle
            if (entity.state === 'idle' && this.wanderTimer % 120 === 0) {
                // Only wander if nomad is not doing a special behavior
                if (entity.type !== 'NOMAD' || entity.nomadBehavior === 'idle' || entity.nomadBehavior === undefined) {
                    this.startWander(entity);
                }
            }
        }
    }

    /**
     * Start entity wandering to a random nearby location
     */
    private startWander(entity: Entity): void {
        const maxAttempts = 10;
        for (let i = 0; i < maxAttempts; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 2 + Math.random() * 3;
            const newX = entity.x + Math.cos(angle) * distance;
            const newY = entity.y + Math.sin(angle) * distance;

            const tile = this.chunkManager.getTile(Math.floor(newX), Math.floor(newY));
            if (tile && isWalkable(tile.type)) {
                entity.targetX = newX;
                entity.targetY = newY;
                entity.isMoving = true;
                entity.state = 'wandering';
                break;
            }
        }
    }

    /**
     * Spawn entities in an area with extended config
     */
    public spawnEntitiesInArea(
        centerX: number,
        centerY: number,
        radius: number,
        config: {
            deer?: number;
            rabbits?: number;
            boars?: number;
            bears?: number;
            bison?: number;
            nomads?: number;
        }
    ): void {
        const spawn = (type: EntityType, count: number) => {
            for (let i = 0; i < count; i++) {
                const maxAttempts = 20;
                for (let j = 0; j < maxAttempts; j++) {
                    const x = centerX + (Math.random() - 0.5) * radius * 2;
                    const y = centerY + (Math.random() - 0.5) * radius * 2;

                    const tile = this.chunkManager.getTile(Math.floor(x), Math.floor(y));
                    if (tile && isWalkable(tile.type)) {
                        this.addEntity(createEntity(type, x, y));
                        break;
                    }
                }
            }
        };

        if (config.deer) spawn('ANIMAL_DEER', config.deer);
        if (config.rabbits) spawn('ANIMAL_RABBIT', config.rabbits);
        if (config.boars) spawn('ANIMAL_BOAR', config.boars);
        if (config.bears) spawn('ANIMAL_BEAR', config.bears);
        if (config.bison) spawn('ANIMAL_BISON', config.bison);
        if (config.nomads) spawn('NOMAD', config.nomads);
    }
}
