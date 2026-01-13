/**
 * Civil Zones - Rendering Module Index
 * Central exports for all rendering utilities
 */

// Colors and visual constants
export {
    TERRAIN_COLORS,
    BUILDING_COLORS,
    MAP_COLORS,
    UI_COLORS,
    ZONE_COLORS,
    PARTICLE_COLORS,
    CHARACTER_COLORS,
    BERRY_COLORS,
    ALL_COLORS,
    getDesirabilityColor,
    getElevationOverlayColor,
    generateLevelColors,
    type TerrainColorKey,
    type BuildingColorKey,
    type ZoneColorKey
} from './colors.js';

// Terrain renderer
export { TerrainRenderer, terrainRenderer } from './terrain-renderer.js';

// Road renderer
export { RoadRenderer, roadRenderer } from './road-renderer.js';

// Player renderer (Logical Larry)
export { PlayerRenderer, playerRenderer } from './player-renderer.js';

// Entity renderer (berries, nomads, animals)
// Note: Entity types are intentionally not re-exported to avoid conflict with types/tiles.ts
export { EntityRenderer, entityRenderer } from './entity-renderer.js';

// Building renderer (RES, COM, IND, WELL, etc.)
export { BuildingRenderer, buildingRenderer, type BuildingRenderData } from './building-renderer.js';

// Canvas drawing utilities
export {
    roundRectPath,
    fillRoundRect,
    strokeRoundRect,
    drawRoundRect,
    drawCircle,
    drawEllipse,
    drawLine,
    drawPolygon,
    drawQuadraticCurve,
    drawBezierCurve,
    drawText,
    drawTextWithOutline,
    createSphereGradient,
    createLinearGradient,
    withRotation,
    withScale,
    withAlpha,
    withClip,
    withCircularClip,
    drawStipple,
    drawHatching,
    type Context2D,
    type Point,
    type Rect,
    type Circle
} from './draw-utils.js';

// Camera system
export {
    createCamera,
    createCenteredCamera,
    screenToWorld,
    worldToScreen,
    screenToTile,
    tileToScreen,
    getVisibleTileRange,
    isTileVisible,
    panCamera,
    centerCameraOn,
    centerCameraOnTile,
    zoomCamera,
    zoomCameraAt,
    clampCameraToMap,
    applyCameraTransform,
    restoreCameraTransform,
    DEFAULT_CAMERA_CONFIG,
    type Camera,
    type Viewport,
    type TileRange,
    type CameraConfig
} from './camera.js';

// Effects and particles
export {
    ParticlePool,
    EffectManager,
    getWoodChipPosition,
    getDustPuffSize,
    getImpactStarPositions,
    type Particle as RenderParticle,
    type Effect,
    type EffectType,
    type WoodChipData,
    type DustData
} from './effects.js';

// Game Renderer
export {
    GameRenderer,
    createGameRenderer,
    type RenderTile,
    type RenderBuilding,
    type RenderPlayer,
    type RenderEntity,
    type GameRenderState,
    type RendererConfig
} from './game-renderer.js';