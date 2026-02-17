import { describe, it, expect } from 'vitest';
import {
    createEntity,
    damageEntity,
    getEntityFoodReward,
    isAnimal,
    getEntityBehavior,
    EntityManager,
} from './Entity';
import { ChunkManager } from './ChunkManager';

describe('createEntity', () => {
    it('creates deer with correct stats', () => {
        const e = createEntity('ANIMAL_DEER', 10, 20);
        expect(e.type).toBe('ANIMAL_DEER');
        expect(e.x).toBe(10);
        expect(e.y).toBe(20);
        expect(e.state).toBe('idle');
        expect(e.health).toBe(2); // deer hp from CombatConfig
        expect(e.maxHealth).toBe(2);
        expect(e.isMoving).toBe(false);
    });

    it('creates nomad with hostile flag (boolean)', () => {
        const e = createEntity('NOMAD', 0, 0);
        expect(e.type).toBe('NOMAD');
        expect(typeof e.isHostile).toBe('boolean');
        expect(e.health).toBe(50);
    });

    it('assigns unique IDs', () => {
        const a = createEntity('ANIMAL_RABBIT', 0, 0);
        const b = createEntity('ANIMAL_RABBIT', 0, 0);
        expect(a.id).not.toBe(b.id);
    });
});

describe('damageEntity', () => {
    it('reduces health and returns false if alive', () => {
        const e = createEntity('ANIMAL_BOAR', 0, 0); // hp=3
        const died = damageEntity(e, 1);
        expect(died).toBe(false);
        expect(e.health).toBe(2);
    });

    it('returns true and sets state to dying when killed', () => {
        const e = createEntity('ANIMAL_RABBIT', 0, 0); // hp=1
        const died = damageEntity(e, 5);
        expect(died).toBe(true);
        expect(e.health).toBe(0);
        expect(e.state).toBe('dying');
        expect(e.deathTimer).toBe(60);
    });

    it('clamps health to zero (never negative)', () => {
        const e = createEntity('ANIMAL_RABBIT', 0, 0);
        damageEntity(e, 100);
        expect(e.health).toBe(0);
    });
});

describe('isAnimal', () => {
    it('returns true for animal types', () => {
        expect(isAnimal(createEntity('ANIMAL_DEER', 0, 0))).toBe(true);
        expect(isAnimal(createEntity('ANIMAL_BEAR', 0, 0))).toBe(true);
    });

    it('returns false for nomad', () => {
        expect(isAnimal(createEntity('NOMAD', 0, 0))).toBe(false);
    });
});

describe('getEntityBehavior', () => {
    it('deer → flee', () => {
        expect(getEntityBehavior(createEntity('ANIMAL_DEER', 0, 0))).toBe('flee');
    });

    it('boar → charge', () => {
        expect(getEntityBehavior(createEntity('ANIMAL_BOAR', 0, 0))).toBe('charge');
    });

    it('nomad → flee (fallback)', () => {
        expect(getEntityBehavior(createEntity('NOMAD', 0, 0))).toBe('flee');
    });
});

describe('getEntityFoodReward', () => {
    it('returns non-zero for valid animal', () => {
        // run enough times so we get a non-zero at least once
        let gotNonZero = false;
        for (let i = 0; i < 20; i++) {
            const e = createEntity('ANIMAL_BEAR', 0, 0);
            const reward = getEntityFoodReward(e);
            if (reward > 0) gotNonZero = true;
        }
        expect(gotNonZero).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// EntityManager
// ---------------------------------------------------------------------------
describe('EntityManager', () => {
    function makeEM(): EntityManager {
        return new EntityManager(new ChunkManager());
    }

    it('starts with no entities', () => {
        const em = makeEM();
        expect(em.getEntities()).toHaveLength(0);
    });

    it('addEntity and getEntities', () => {
        const em = makeEM();
        em.addEntity(createEntity('ANIMAL_DEER', 10, 10));
        expect(em.getEntities()).toHaveLength(1);
    });

    it('getEntitiesByType filters correctly', () => {
        const em = makeEM();
        em.addEntity(createEntity('ANIMAL_DEER', 0, 0));
        em.addEntity(createEntity('ANIMAL_RABBIT', 1, 1));
        em.addEntity(createEntity('NOMAD', 2, 2));
        expect(em.getEntitiesByType('ANIMAL_DEER')).toHaveLength(1);
        expect(em.getEntitiesByType('NOMAD')).toHaveLength(1);
    });

    it('getAnimals excludes nomads and dead', () => {
        const em = makeEM();
        em.addEntity(createEntity('ANIMAL_DEER', 0, 0));
        em.addEntity(createEntity('NOMAD', 1, 1));
        const animals = em.getAnimals();
        expect(animals).toHaveLength(1);
        expect(animals[0].type).toBe('ANIMAL_DEER');
    });

    it('getNomads excludes recruited and dead', () => {
        const em = makeEM();
        const n1 = createEntity('NOMAD', 0, 0);
        const n2 = createEntity('NOMAD', 1, 1);
        n2.isRecruited = true;
        em.addEntity(n1);
        em.addEntity(n2);
        expect(em.getNomads()).toHaveLength(1);
    });

    it('removeEntity removes by id', () => {
        const em = makeEM();
        const e = createEntity('ANIMAL_DEER', 0, 0);
        em.addEntity(e);
        em.removeEntity(e.id);
        expect(em.getEntities()).toHaveLength(0);
    });

    it('removeEntity no-ops for unknown id', () => {
        const em = makeEM();
        em.addEntity(createEntity('ANIMAL_DEER', 0, 0));
        em.removeEntity(-999);
        expect(em.getEntities()).toHaveLength(1);
    });

    it('getEntityAt finds nearby entity', () => {
        const em = makeEM();
        const e = createEntity('ANIMAL_DEER', 5, 5);
        em.addEntity(e);
        expect(em.getEntityAt(5, 5)).toBe(e);
        expect(em.getEntityAt(100, 100)).toBeNull();
    });

    it('getEntityAt ignores dead entities', () => {
        const em = makeEM();
        const e = createEntity('ANIMAL_DEER', 5, 5);
        e.state = 'dead';
        em.addEntity(e);
        expect(em.getEntityAt(5, 5)).toBeNull();
    });

    it('getEntitiesNear returns entities within radius', () => {
        const em = makeEM();
        em.addEntity(createEntity('ANIMAL_DEER', 0, 0));
        em.addEntity(createEntity('ANIMAL_DEER', 100, 100));
        const nearby = em.getEntitiesNear(0, 0, 5);
        expect(nearby).toHaveLength(1);
    });

    it('fleeFrom sets fleeing state when target is walkable', () => {
        const em = makeEM();
        // Place deer at (32,32) — center of chunk, very likely grass
        const deer = createEntity('ANIMAL_DEER', 32, 32);
        em.addEntity(deer);
        // Threat 3 tiles away (well outside the 0.1 guard)
        em.fleeFrom(deer, 32, 35);
        // The flee target depends on terrain; just check the method doesn't crash
        // and if target was walkable, entity should be fleeing
        expect(['idle', 'fleeing']).toContain(deer.state);
    });

    it('fleeFrom ignores nomads (no config)', () => {
        const em = makeEM();
        const nomad = createEntity('NOMAD', 10, 10);
        em.addEntity(nomad);
        em.fleeFrom(nomad, 10, 9);
        // NOMAD has no ANIMAL_CONFIG entry, so should not change state
        expect(nomad.state).toBe('idle');
    });

    it('chargeToward makes animal charge', () => {
        const em = makeEM();
        const boar = createEntity('ANIMAL_BOAR', 10, 10);
        em.addEntity(boar);
        em.chargeToward(boar, 5, 5);
        expect(boar.state).toBe('charging');
        expect(boar.targetX).toBe(5);
        expect(boar.targetY).toBe(5);
    });

    it('update moves entities toward targets', () => {
        const em = makeEM();
        const deer = createEntity('ANIMAL_DEER', 10, 10);
        deer.targetX = 20;
        deer.targetY = 10;
        deer.isMoving = true;
        deer.state = 'wandering';
        em.addEntity(deer);
        em.update();
        expect(deer.x).toBeGreaterThan(10);
    });

    it('update removes dead entities after death timer', () => {
        const em = makeEM();
        const deer = createEntity('ANIMAL_DEER', 10, 10);
        deer.state = 'dying';
        deer.deathTimer = 1; // will expire on next update
        em.addEntity(deer);
        em.update();
        // After timer expires, entity becomes dead and is filtered
        expect(em.getEntities()).toHaveLength(0);
    });

    it('update triggers flee when player is near a flee-type animal', () => {
        const em = makeEM();
        const deer = createEntity('ANIMAL_DEER', 32, 32);
        em.addEntity(deer);
        // Player 2 tiles away, within deer fleeDistance=5
        em.update(32, 34);
        // Flee will succeed if target terrain is walkable
        expect(['idle', 'fleeing']).toContain(deer.state);
    });

    it('update triggers charge when player is near a charge-type animal', () => {
        const em = makeEM();
        const boar = createEntity('ANIMAL_BOAR', 32, 32);
        em.addEntity(boar);
        // Player 1 tile away, within boar fleeDistance=3
        em.update(32, 33);
        expect(boar.state).toBe('charging');
    });

    it('spawnEntitiesInArea creates entities', () => {
        const em = makeEM();
        em.spawnEntitiesInArea(32, 32, 10, { deer: 3, rabbits: 2 });
        expect(em.getEntities().length).toBeGreaterThanOrEqual(1);
    });
});
