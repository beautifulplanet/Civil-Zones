/**
 * Civil Zones - Effects & Particles System
 * Handles visual effects like dust, wood chips, water splashes, etc.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
    active: boolean;
}

export interface Effect {
    type: EffectType;
    x: number;          // Tile X position
    y: number;          // Tile Y position
    start: number;      // Start time (performance.now())
    duration: number;   // Duration in ms
    data?: unknown;     // Effect-specific data
}

export type EffectType = 
    | 'woodchips'
    | 'dust'
    | 'water_splash'
    | 'impact_stars'
    | 'smoke'
    | 'sparkle';

export interface WoodChipData {
    chips: Array<{ angle: number; speed: number }>;
}

export interface DustData {
    puffs: Array<{ angle: number; radius: number }>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARTICLE POOL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Object pool for particles to avoid GC
 */
export class ParticlePool {
    private pool: Particle[] = [];
    private maxSize: number;
    
    constructor(initialSize: number = 500, maxSize: number = 1000) {
        this.maxSize = maxSize;
        
        // Pre-allocate particles
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createParticle());
        }
    }
    
    private createParticle(): Particle {
        return {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            life: 0,
            maxLife: 0,
            color: '',
            size: 1,
            active: false
        };
    }
    
    /**
     * Get a particle from the pool
     */
    get(
        x: number,
        y: number,
        vx: number,
        vy: number,
        life: number,
        color: string,
        size: number = 2
    ): Particle {
        // Find inactive particle
        for (const p of this.pool) {
            if (!p.active) {
                p.x = x;
                p.y = y;
                p.vx = vx;
                p.vy = vy;
                p.life = life;
                p.maxLife = life;
                p.color = color;
                p.size = size;
                p.active = true;
                return p;
            }
        }
        
        // Pool exhausted - create new if under max
        if (this.pool.length < this.maxSize) {
            const p = this.createParticle();
            p.x = x;
            p.y = y;
            p.vx = vx;
            p.vy = vy;
            p.life = life;
            p.maxLife = life;
            p.color = color;
            p.size = size;
            p.active = true;
            this.pool.push(p);
            return p;
        }
        
        // Pool at max - return oldest active particle (reuse it)
        const oldest = this.pool[0];
        oldest.x = x;
        oldest.y = y;
        oldest.vx = vx;
        oldest.vy = vy;
        oldest.life = life;
        oldest.maxLife = life;
        oldest.color = color;
        oldest.size = size;
        oldest.active = true;
        return oldest;
    }
    
    /**
     * Update all active particles
     */
    update(deltaTime: number, gravity: number = 0.1): void {
        for (const p of this.pool) {
            if (p.active) {
                p.x += p.vx * deltaTime;
                p.y += p.vy * deltaTime;
                p.vy += gravity * deltaTime;
                p.life -= deltaTime;
                
                if (p.life <= 0) {
                    p.active = false;
                }
            }
        }
    }
    
    /**
     * Get all active particles
     */
    getActive(): Particle[] {
        return this.pool.filter(p => p.active);
    }
    
    /**
     * Clear all particles
     */
    clear(): void {
        for (const p of this.pool) {
            p.active = false;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EFFECT MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Manages timed visual effects
 */
export class EffectManager {
    private effects: Effect[] = [];
    
    /**
     * Add a new effect
     */
    add(type: EffectType, tileX: number, tileY: number, duration: number, data?: unknown): void {
        this.effects.push({
            type,
            x: tileX,
            y: tileY,
            start: performance.now(),
            duration,
            data
        });
    }
    
    /**
     * Add wood chips burst effect
     */
    addWoodChips(tileX: number, tileY: number): void {
        const chips: WoodChipData['chips'] = [];
        
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2) * (i / 8) + Math.random() * 0.3;
            const speed = 0.5 + Math.random() * 0.7;
            chips.push({ angle, speed });
        }
        
        this.add('woodchips', tileX, tileY, 600, { chips });
    }
    
    /**
     * Add dust cloud effect
     */
    addDust(tileX: number, tileY: number): void {
        const puffs: DustData['puffs'] = [];
        
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2) * (i / 6);
            const radius = 0.18 + (i % 2) * 0.06;
            puffs.push({ angle, radius });
        }
        
        this.add('dust', tileX, tileY, 9000, { puffs });
    }
    
    /**
     * Add water splash effect
     */
    addWaterSplash(tileX: number, tileY: number): void {
        this.add('water_splash', tileX, tileY, 500);
    }
    
    /**
     * Add impact stars effect
     */
    addImpactStars(tileX: number, tileY: number): void {
        this.add('impact_stars', tileX, tileY, 300);
    }
    
    /**
     * Update effects (remove expired)
     */
    update(): void {
        const now = performance.now();
        this.effects = this.effects.filter(
            e => (now - e.start) < e.duration
        );
    }
    
    /**
     * Get all active effects
     */
    getActive(): Effect[] {
        return this.effects;
    }
    
    /**
     * Get effect progress (0.0 - 1.0)
     */
    getProgress(effect: Effect): number {
        const elapsed = performance.now() - effect.start;
        return Math.min(1.0, elapsed / effect.duration);
    }
    
    /**
     * Clear all effects
     */
    clear(): void {
        this.effects = [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EFFECT RENDERING HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate wood chip position at time
 */
export function getWoodChipPosition(
    chip: { angle: number; speed: number },
    progress: number,
    tileSize: number
): { x: number; y: number; alpha: number } {
    const distance = chip.speed * progress * tileSize;
    const gravity = progress * progress * tileSize * 0.3;
    
    return {
        x: Math.cos(chip.angle) * distance,
        y: Math.sin(chip.angle) * distance + gravity,
        alpha: 1 - progress
    };
}

/**
 * Calculate dust puff size at time
 */
export function getDustPuffSize(
    puff: { angle: number; radius: number },
    progress: number,
    tileSize: number
): { x: number; y: number; size: number; alpha: number } {
    const expand = Math.sin(progress * Math.PI) * 0.5;
    const currentRadius = (puff.radius + expand) * tileSize;
    
    return {
        x: Math.cos(puff.angle) * currentRadius,
        y: Math.sin(puff.angle) * currentRadius,
        size: tileSize * (0.2 + expand * 0.3),
        alpha: (1 - progress) * 0.6
    };
}

/**
 * Get impact star positions
 */
export function getImpactStarPositions(
    progress: number,
    count: number = 3
): Array<{ x: number; y: number; size: number }> {
    const stars: Array<{ x: number; y: number; size: number }> = [];
    
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2) * (i / count) + progress * 2;
        const distance = progress * 20;
        const size = (1 - progress) * 4;
        
        stars.push({
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            size
        });
    }
    
    return stars;
}
