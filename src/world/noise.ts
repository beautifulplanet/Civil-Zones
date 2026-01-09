/**
 * Civil Zones - Noise Generation
 * Perlin-style noise for terrain generation
 */

// ═══════════════════════════════════════════════════════════════════
// NOISE STATE
// ═══════════════════════════════════════════════════════════════════

/** Noise generator state */
interface NoiseState {
    seed: number;
}

/** Global noise state */
const state: NoiseState = {
    seed: 1
};

// ═══════════════════════════════════════════════════════════════════
// CORE NOISE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/** Initialize noise with a seed */
export function initNoise(seed: number): void {
    state.seed = seed;
}

/** Get current seed */
export function getSeed(): number {
    return state.seed;
}

/** Hash function for noise generation */
export function hash(x: number, y: number): number {
    const h = Math.sin(x * 12.98 + y * 78.23 + state.seed) * 43758.54;
    return h - Math.floor(h);
}

/** Linear interpolation */
export function mix(a: number, b: number, t: number): number {
    return a * (1 - t) + b * t;
}

/** Value noise at a point */
export function valueNoise(x: number, y: number): number {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = x - i;
    const fy = y - j;
    
    // Smoothstep interpolation
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    
    // Get corner values
    const a = hash(i, j);
    const b = hash(i + 1, j);
    const c = hash(i, j + 1);
    const d = hash(i + 1, j + 1);
    
    // Bilinear interpolation
    return mix(mix(a, b, ux), mix(c, d, ux), uy);
}

/** Fractal Brownian Motion (multi-octave noise) */
export function fbm(x: number, y: number, octaves: number = 5): number {
    let total = 0;
    let amplitude = 0.5;
    let px = x;
    let py = y;
    
    for (let i = 0; i < octaves; i++) {
        total += valueNoise(px, py) * amplitude;
        px *= 2;
        py *= 2;
        amplitude *= 0.5;
    }
    
    return total;
}

/** Normalized FBM (0-1 range) */
export function fbmNormalized(x: number, y: number, octaves: number = 5): number {
    // FBM with 5 octaves produces values roughly in 0-1.8 range
    return fbm(x, y, octaves) / 1.8;
}

// ═══════════════════════════════════════════════════════════════════
// TERRAIN-SPECIFIC NOISE
// ═══════════════════════════════════════════════════════════════════

/** Generate terrain height noise */
export function terrainNoise(x: number, y: number): number {
    return fbmNormalized(x * 0.02, y * 0.02);
}

/** Generate ocean noise (large scale features) */
export function oceanNoise(x: number, y: number): number {
    return fbmNormalized(x * 0.008, y * 0.008);
}

/** Generate lake noise (smaller inland bodies) */
export function lakeNoise(x: number, y: number): number {
    return fbmNormalized(x * 0.08 + 500, y * 0.08 + 500);
}

/** Generate mountain noise */
export function mountainNoise(x: number, y: number): number {
    return fbmNormalized(x * 0.015 + 1000, y * 0.015 + 1000);
}

/** Generate river noise */
export function riverNoise(x: number, y: number): number {
    return fbmNormalized(x * 0.05 + 100, y * 0.05 + 100);
}

/** Check if position is a river based on noise */
export function isRiverAt(x: number, y: number, width: number = 0.015): boolean {
    const r = riverNoise(x, y);
    return Math.abs(r - 0.5) < width;
}

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/** Generate random seed */
export function randomSeed(): number {
    return Math.floor(Math.random() * 1000000);
}

/** Create noise with custom parameters */
export function customNoise(
    x: number, 
    y: number, 
    frequency: number,
    octaves: number = 5,
    offsetX: number = 0,
    offsetY: number = 0
): number {
    return fbmNormalized(
        (x + offsetX) * frequency, 
        (y + offsetY) * frequency, 
        octaves
    );
}
