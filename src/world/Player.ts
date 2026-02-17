/**
 * Player Entity
 * Represent the user's avatar on the map
 */

import type { Point } from '../core/types';

export class Player {
    // World Grid Coordinates (can be fractional during movement)
    public x: number;
    public y: number;

    // Movement state
    private targetX: number;
    private targetY: number;
    private speed: number = 0.4; // Tiles per frame (fast movement)
    private isMoving: boolean = false;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
    }

    public update(): void {
        if (!this.isMoving) return;

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.speed) {
            this.x = this.targetX;
            this.y = this.targetY;
            this.isMoving = false;
        } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }

    public moveTo(x: number, y: number): void {
        this.targetX = x;
        this.targetY = y;
        this.isMoving = true;
    }

    public getPosition(): Point {
        return { x: this.x, y: this.y };
    }
}
