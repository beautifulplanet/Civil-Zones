/**
 * Civil Zones - Spatial Grid
 * Fast spatial lookup for buildings and entities
 */

/**
 * Generic spatial grid for fast proximity queries
 * Divides the map into cells for O(1) regional lookups
 */
export class SpatialGrid<T> {
    private grid: T[][][];
    private cellSize: number;
    private width: number;
    private height: number;

    /**
     * Create a new spatial grid
     * @param mapWidth Map width in tiles
     * @param mapHeight Map height in tiles
     * @param cellSize Size of each grid cell in tiles (default 16)
     */
    constructor(mapWidth: number, mapHeight: number, cellSize: number = 16) {
        this.cellSize = cellSize;
        this.width = Math.ceil(mapWidth / cellSize);
        this.height = Math.ceil(mapHeight / cellSize);
        
        this.grid = [];
        for (let i = 0; i < this.width; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.height; j++) {
                this.grid[i][j] = [];
            }
        }
    }

    /**
     * Convert tile coordinates to grid cell coordinates
     */
    private toGridCoords(x: number, y: number): { gx: number; gy: number } {
        return {
            gx: Math.floor(x / this.cellSize),
            gy: Math.floor(y / this.cellSize)
        };
    }

    /**
     * Check if grid coordinates are valid
     */
    private isValidGridCoord(gx: number, gy: number): boolean {
        return gx >= 0 && gy >= 0 && gx < this.width && gy < this.height;
    }

    /**
     * Add an object to the grid at tile position
     */
    add(x: number, y: number, obj: T): void {
        const { gx, gy } = this.toGridCoords(x, y);
        if (this.isValidGridCoord(gx, gy)) {
            this.grid[gx][gy].push(obj);
        }
    }

    /**
     * Remove an object from the grid at tile position
     */
    remove(x: number, y: number, obj: T): boolean {
        const { gx, gy } = this.toGridCoords(x, y);
        if (!this.isValidGridCoord(gx, gy)) return false;
        
        const idx = this.grid[gx][gy].indexOf(obj);
        if (idx !== -1) {
            this.grid[gx][gy].splice(idx, 1);
            return true;
        }
        return false;
    }

    /**
     * Get all objects in a cell at tile position
     */
    getAt(x: number, y: number): T[] {
        const { gx, gy } = this.toGridCoords(x, y);
        if (!this.isValidGridCoord(gx, gy)) return [];
        return [...this.grid[gx][gy]];
    }

    /**
     * Get all objects within radius of tile position
     */
    getNearby(x: number, y: number, radius: number = 1): T[] {
        const { gx, gy } = this.toGridCoords(x, y);
        const gridRadius = Math.ceil(radius / this.cellSize);
        const nearby: T[] = [];
        
        for (let dx = -gridRadius; dx <= gridRadius; dx++) {
            for (let dy = -gridRadius; dy <= gridRadius; dy++) {
                const gxi = gx + dx;
                const gyi = gy + dy;
                if (this.isValidGridCoord(gxi, gyi)) {
                    nearby.push(...this.grid[gxi][gyi]);
                }
            }
        }
        
        return nearby;
    }

    /**
     * Get all objects in the grid
     */
    getAll(): T[] {
        const all: T[] = [];
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                all.push(...this.grid[i][j]);
            }
        }
        return all;
    }

    /**
     * Clear the entire grid
     */
    clear(): void {
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                this.grid[i][j] = [];
            }
        }
    }

    /**
     * Get count of objects in the grid
     */
    count(): number {
        let total = 0;
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                total += this.grid[i][j].length;
            }
        }
        return total;
    }
}

/**
 * Object pool for reusing temporary objects
 * Reduces garbage collection pressure
 */
export class ObjectPool<T extends { active: boolean }> {
    private pool: T[] = [];
    private factory: () => T;

    constructor(factory: () => T, initialSize: number = 100) {
        this.factory = factory;
        
        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            const obj = factory();
            obj.active = false;
            this.pool.push(obj);
        }
    }

    /**
     * Get an object from the pool (or create new if exhausted)
     */
    acquire(): T {
        for (const obj of this.pool) {
            if (!obj.active) {
                obj.active = true;
                return obj;
            }
        }
        
        // Pool exhausted, create new
        const obj = this.factory();
        obj.active = true;
        this.pool.push(obj);
        return obj;
    }

    /**
     * Return an object to the pool
     */
    release(obj: T): void {
        obj.active = false;
    }

    /**
     * Release all objects back to the pool
     */
    releaseAll(): void {
        for (const obj of this.pool) {
            obj.active = false;
        }
    }

    /**
     * Get all active objects
     */
    getActive(): T[] {
        return this.pool.filter(obj => obj.active);
    }

    /**
     * Get pool statistics
     */
    getStats(): { total: number; active: number; available: number } {
        const active = this.pool.filter(obj => obj.active).length;
        return {
            total: this.pool.length,
            active,
            available: this.pool.length - active
        };
    }
}

/**
 * Particle object interface for pooling
 */
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

/**
 * Create a particle pool
 */
export function createParticlePool(size: number = 500): ObjectPool<Particle> {
    return new ObjectPool<Particle>(() => ({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        color: '#ffffff',
        size: 2,
        active: false
    }), size);
}
