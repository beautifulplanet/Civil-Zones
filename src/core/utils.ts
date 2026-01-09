/**
 * Civil Zones - Utility Functions
 * Common helper functions used across the game
 */

/**
 * Clamp a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * clamp(t, 0, 1);
}

/**
 * Smooth step function (ease in/out)
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
}

/**
 * Format large numbers with K/M/B suffixes
 */
export function formatNumber(num: number): string {
    if (num >= 1_000_000_000) {
        return (num / 1_000_000_000).toFixed(1) + 'B';
    }
    if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(1) + 'M';
    }
    if (num >= 1_000) {
        return (num / 1_000).toFixed(1) + 'K';
    }
    return num.toFixed(0);
}

/**
 * Format a number with commas (1234567 -> "1,234,567")
 */
export function formatWithCommas(num: number): string {
    return num.toLocaleString();
}

/**
 * Generate a unique ID
 */
export function generateUID(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Calculate Manhattan distance between two points
 */
export function manhattanDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Calculate Euclidean distance between two points
 */
export function euclideanDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if a point is within a circle
 */
export function isInCircle(px: number, py: number, cx: number, cy: number, radius: number): boolean {
    return euclideanDistance(px, py, cx, cy) <= radius;
}

/**
 * Check if a point is within bounds
 */
export function isInBounds(x: number, y: number, width: number, height: number): boolean {
    return x >= 0 && x < width && y >= 0 && y < height;
}

/**
 * Deep clone an object (JSON-safe only)
 */
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Random integer in range [min, max] inclusive
 */
export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Random float in range [min, max)
 */
export function randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

/**
 * Pick a random element from an array
 */
export function randomPick<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Shuffle an array in place (Fisher-Yates)
 */
export function shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Debounce function - delays execution until after wait milliseconds
 */
export function debounce<T extends (...args: unknown[]) => void>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    
    return function (...args: Parameters<T>): void {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Throttle function - limits execution to once per wait milliseconds
 */
export function throttle<T extends (...args: unknown[]) => void>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let lastTime = 0;
    
    return function (...args: Parameters<T>): void {
        const now = Date.now();
        if (now - lastTime >= wait) {
            lastTime = now;
            func(...args);
        }
    };
}

/**
 * Seeded random number generator
 * Uses mulberry32 algorithm
 */
export function createSeededRandom(seed: number): () => number {
    return function(): number {
        seed |= 0;
        seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

/**
 * Get adjacent tile coordinates (4-way: up, down, left, right)
 */
export function getAdjacent4(x: number, y: number): Array<{x: number; y: number}> {
    return [
        { x: x, y: y - 1 },  // up
        { x: x, y: y + 1 },  // down
        { x: x - 1, y: y },  // left
        { x: x + 1, y: y }   // right
    ];
}

/**
 * Get adjacent tile coordinates (8-way: includes diagonals)
 */
export function getAdjacent8(x: number, y: number): Array<{x: number; y: number}> {
    return [
        { x: x - 1, y: y - 1 }, { x: x, y: y - 1 }, { x: x + 1, y: y - 1 },
        { x: x - 1, y: y },                         { x: x + 1, y: y },
        { x: x - 1, y: y + 1 }, { x: x, y: y + 1 }, { x: x + 1, y: y + 1 }
    ];
}

/**
 * Calculate percentage (0-100)
 */
export function percent(value: number, max: number): number {
    if (max === 0) return 0;
    return clamp((value / max) * 100, 0, 100);
}

/**
 * Convert ratio (0-1) to percentage string
 */
export function toPercentString(ratio: number, decimals: number = 0): string {
    return (ratio * 100).toFixed(decimals) + '%';
}
