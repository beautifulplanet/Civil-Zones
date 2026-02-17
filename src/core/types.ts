/**
 * Core type definitions for Civil Zones v2
 */

// Simple 2D point
export interface Point {
    x: number;
    y: number;
}

// 2D Size
export interface Size {
    width: number;
    height: number;
}

// Rectangle bounds
export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

// Camera state
export interface CameraState {
    x: number;      // World X (center of view)
    y: number;      // World Y (center of view)
    zoom: number;   // 1.0 = 100%
}
