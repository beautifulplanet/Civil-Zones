/**
 * Civil Zones - Noise Generation Utilities
 * Perlin-like noise for terrain generation
 */

/**
 * Noise generator for procedural terrain
 * Uses hash-based pseudo-random noise with fractal brownian motion
 */
export class NoiseGenerator {
    private seed: number = 1;

    /**
     * Initialize the noise generator with a seed
     */
    init(seed: number): void {
        this.seed = seed;
    }

    /**
     * Hash function for pseudo-random values
     */
    hash(x: number, y: number): number {
        const h = Math.sin(x * 12.98 + y * 78.23 + this.seed) * 43758.54;
        return h - Math.floor(h);
    }

    /**
     * Linear interpolation between two values
     */
    mix(a: number, b: number, t: number): number {
        return a * (1 - t) + b * t;
    }

    /**
     * Get noise value at position (smooth interpolated)
     */
    val(x: number, y: number): number {
        const i = Math.floor(x);
        const j = Math.floor(y);
        const fx = x - i;
        const fy = y - j;
        
        // Smoothstep interpolation
        const ux = fx * fx * (3 - 2 * fx);
        const uy = fy * fy * (3 - 2 * fy);
        
        const a = this.hash(i, j);
        const b = this.hash(i + 1, j);
        const c = this.hash(i, j + 1);
        const d = this.hash(i + 1, j + 1);
        
        return this.mix(this.mix(a, b, ux), this.mix(c, d, ux), uy);
    }

    /**
     * Fractal Brownian Motion - layered noise for natural terrain
     * @param x X coordinate
     * @param y Y coordinate
     * @param octaves Number of noise layers (default 5)
     * @returns Noise value 0-1
     */
    fbm(x: number, y: number, octaves: number = 5): number {
        let total = 0;
        let amplitude = 0.5;
        let frequency = 1;
        
        for (let i = 0; i < octaves; i++) {
            total += this.val(x * frequency, y * frequency) * amplitude;
            frequency *= 2;
            amplitude *= 0.5;
        }
        
        return total;
    }
}

// Singleton instance for global use
export const Noise = new NoiseGenerator();
