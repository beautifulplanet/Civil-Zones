/**
 * Civil Zones - Core Module Index
 * Central export point for core game systems
 */

// Noise Generation
export { NoiseGenerator, Noise } from './noise.js';

// Utility Functions
export {
    clamp,
    lerp,
    smoothstep,
    formatNumber,
    formatWithCommas,
    generateUID,
    manhattanDistance,
    euclideanDistance,
    isInCircle,
    isInBounds,
    deepClone,
    randomInt,
    randomFloat,
    randomPick,
    shuffle,
    debounce,
    throttle,
    createSeededRandom,
    getAdjacent4,
    getAdjacent8,
    percent,
    toPercentString
} from './utils.js';

// Terrain Generation
export {
    TerrainGenerator,
    isTerrainPassable,
    isTerrainBuildable,
    isWater,
    getTerrainColor,
    getTerrainMoveCost
} from './terrain.js';

// Spatial Data Structures
export {
    SpatialGrid,
    ObjectPool,
    createParticlePool
} from './spatial.js';
export type { Particle } from './spatial.js';
