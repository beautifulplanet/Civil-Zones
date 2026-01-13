/**
 * Civil Zones - Entity Renderer
 * ═══════════════════════════════════════════════════════════════════════════════
 * Renders berries (Yoshi's Island style), nomads (animated stick figures),
 * and animals (deer, bison, mammoth, turtle)
 * Ported from index.html entity drawing sections
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { CFG } from '../config/game-config.js';

export interface BerryEntity {
    type: 'BERRY';
    x: number;
    y: number;
    is_poisonous?: boolean;
    amount?: number;
}

export interface NomadEntity {
    type: 'NOMAD';
    x: number;
    y: number;
    is_hostile?: boolean;
}

export interface AnimalEntity {
    type: 'DEER' | 'BISON' | 'MAMMOTH' | 'TURTLE';
    x: number;
    y: number;
    hits?: number;
}

export type GameEntity = BerryEntity | NomadEntity | AnimalEntity;

/**
 * Entity Renderer - Draws berries, nomads, and animals
 */
export class EntityRenderer {
    
    /**
     * Draw a berry bush - Yoshi's Island style cute berries
     */
    drawBerry(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number,
        isPoisonous: boolean = false
    ): void {
        const bx = x * T + T / 2;
        const by = y * T + T / 2;
        
        // Cute bush base
        ctx.fillStyle = '#60C060';
        ctx.beginPath();
        ctx.arc(bx - 8, by + 8, 8, 0, Math.PI * 2);
        ctx.arc(bx + 8, by + 8, 8, 0, Math.PI * 2);
        ctx.arc(bx, by + 4, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Bush highlight
        ctx.fillStyle = '#90E890';
        ctx.beginPath();
        ctx.arc(bx - 6, by + 4, 4, 0, Math.PI * 2);
        ctx.arc(bx + 4, by + 2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Berry positions
        const berryCount = 3 + Math.floor((x + y) % 3);
        const positions = [
            { x: 0, y: -8 },
            { x: -7, y: -2 },
            { x: 7, y: -2 },
            { x: -4, y: 4 },
            { x: 4, y: 4 }
        ];
        
        // Colors based on poisonous state
        const berryColor = isPoisonous ? '#C878F0' : '#FF6090';
        const berryHighlight = isPoisonous ? '#E0B0FF' : '#FF90B0';
        
        for (let i = 0; i < berryCount; i++) {
            const pos = positions[i];
            const bpx = bx + pos.x;
            const bpy = by + pos.y;
            
            // Berry body
            ctx.fillStyle = berryColor;
            ctx.beginPath();
            ctx.arc(bpx, bpy, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Black outline for cartoon look
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            // Highlight shine
            ctx.fillStyle = berryHighlight;
            ctx.beginPath();
            ctx.arc(bpx - 2, bpy - 3, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // White shine spot
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.beginPath();
            ctx.arc(bpx - 2, bpy - 2, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    /**
     * Draw an animated nomad - stick figure with club
     * Every ~25 seconds they shake their club angrily!
     */
    drawNomad(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number,
        currentTime: number
    ): void {
        const nx = x * T + T / 2;
        const ny = y * T + T / 2;
        const scale = T / 64;
        
        // Animation parameters
        const time = currentTime / 1000;
        const uniqueOffset = (x * 7 + y * 13) % 100;
        const sway = Math.sin(time * 1.2 + uniqueOffset) * 1.5 * scale;
        const breathe = Math.sin(time * 2 + uniqueOffset) * 0.8 * scale;
        const legShift = Math.sin(time * 0.6 + uniqueOffset) * 1.5 * scale;
        
        // ANGRY CLUB SHAKE every ~25 seconds (staggered per nomad)
        const shakeInterval = 25; // seconds
        const shakeDuration = 1.5; // seconds of shaking
        const nomadPhase = uniqueOffset / 100 * shakeInterval; // stagger each nomad
        const cycleTime = (time + nomadPhase) % shakeInterval;
        const isShaking = cycleTime < shakeDuration;
        
        let armWave: number;
        let clubAngle: number;
        
        if (isShaking) {
            // ANGRY SHAKE! Fast, aggressive movement
            const shakeProgress = cycleTime / shakeDuration;
            const shakeIntensity = Math.sin(shakeProgress * Math.PI); // fade in/out
            armWave = Math.sin(time * 25) * 8 * scale * shakeIntensity; // Fast shake
            clubAngle = Math.sin(time * 30) * 0.5 * shakeIntensity; // Club rotation
        } else {
            // Normal idle animation
            armWave = Math.sin(time * 0.8 + uniqueOffset) * 2 * scale;
            clubAngle = 0;
        }
        
        // All nomads look the same (don't reveal hostility)
        ctx.strokeStyle = '#8B5A2B';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Head (circle) - with sway, shake more when angry
        const headShake = isShaking ? Math.sin(time * 20) * 2 * scale : 0;
        ctx.beginPath();
        ctx.arc(nx + sway + headShake, ny - 18 * scale + breathe, 5 * scale, 0, Math.PI * 2);
        ctx.stroke();
        
        // Angry eyebrows when shaking
        if (isShaking) {
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(nx + sway + headShake - 3 * scale, ny - 20 * scale + breathe);
            ctx.lineTo(nx + sway + headShake - 1 * scale, ny - 18 * scale + breathe);
            ctx.moveTo(nx + sway + headShake + 3 * scale, ny - 20 * scale + breathe);
            ctx.lineTo(nx + sway + headShake + 1 * scale, ny - 18 * scale + breathe);
            ctx.stroke();
            ctx.lineWidth = 2;
        }
        
        // Body (vertical line) - slight sway
        ctx.beginPath();
        ctx.moveTo(nx + sway * 0.8, ny - 13 * scale + breathe);
        ctx.lineTo(nx + sway * 0.3, ny + 5 * scale);
        ctx.stroke();
        
        // Arms - raised arm holds club
        ctx.beginPath();
        // Left arm (club arm) - raised high when shaking
        const armRaise = isShaking ? -8 * scale : 0;
        ctx.moveTo(nx + sway * 0.6, ny - 8 * scale + breathe * 0.5);
        ctx.lineTo(nx - 8 * scale + armWave, ny - 15 * scale + breathe + armRaise);
        // Right arm
        ctx.moveTo(nx + sway * 0.6, ny - 8 * scale + breathe * 0.5);
        ctx.lineTo(nx + 8 * scale + sway * 0.2, ny - 2 * scale);
        ctx.stroke();
        
        // Legs (idle stance with weight shift)
        ctx.beginPath();
        ctx.moveTo(nx + sway * 0.3, ny + 5 * scale);
        ctx.lineTo(nx - 6 * scale + legShift, ny + 15 * scale);
        ctx.moveTo(nx + sway * 0.3, ny + 5 * scale);
        ctx.lineTo(nx + 6 * scale - legShift * 0.5, ny + 15 * scale);
        ctx.stroke();
        
        // CLUB (thicker than spear, with knobby end)
        ctx.save();
        const clubX = nx - 8 * scale + armWave;
        const clubY = ny - 15 * scale + breathe + armRaise;
        ctx.translate(clubX, clubY);
        ctx.rotate(clubAngle - 0.3); // Slight tilt
        
        // Club shaft (thick wood)
        ctx.strokeStyle = '#6B4423';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-2 * scale, -14 * scale);
        ctx.stroke();
        
        // Club head (knobby end)
        ctx.fillStyle = '#5A3A1A';
        ctx.beginPath();
        ctx.ellipse(-2 * scale, -16 * scale, 4 * scale, 5 * scale, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Club bumps/knots
        ctx.fillStyle = '#4A2A10';
        ctx.beginPath();
        ctx.arc(-4 * scale, -15 * scale, 1.5 * scale, 0, Math.PI * 2);
        ctx.arc(0, -17 * scale, 1.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    /**
     * Draw a walking nomad with proper leg animation!
     * Like a stick figure hunting game - legs move when walking/chasing
     * Also includes periodic "angry club wave" for character!
     */
    drawWalkingNomad(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number,
        currentTime: number,
        walkCycle: number,
        isChasing: boolean = false,
        isHostile: boolean = false
    ): void {
        const nx = x * T + T / 2;
        const ny = y * T + T / 2;
        const scale = T / 64;
        
        const time = currentTime / 1000;
        const uniqueOffset = (Math.floor(x * 7) + Math.floor(y * 13)) % 100;
        
        // Walking animation - legs swing back and forth
        // SLOWER leg animation for natural walking look
        const walkSpeed = isChasing ? 3 : 1.5;
        const legSwing = Math.sin(walkCycle * walkSpeed) * 6 * scale;
        const armSwing = Math.sin(walkCycle * walkSpeed + Math.PI) * 4 * scale;
        const bodyBounce = Math.abs(Math.sin(walkCycle * walkSpeed * 2)) * 2 * scale;
        
        // Breathing when idle
        const breathe = Math.sin(time * 2 + uniqueOffset) * 0.8 * scale;
        
        // ═══════════════════════════════════════════════════════════════════
        // ANGRY CLUB WAVE - Every ~8 seconds, nomad shakes club and makes face!
        // This is the signature animation the user loves
        // ═══════════════════════════════════════════════════════════════════
        const waveInterval = 8; // More frequent!
        const waveDuration = 2; // 2 seconds of waving
        const nomadPhase = (uniqueOffset / 100) * waveInterval; // Stagger each nomad
        const cycleTime = (time + nomadPhase) % waveInterval;
        const isWaving = cycleTime < waveDuration && !isChasing; // Don't wave while chasing
        
        let clubWaveAngle = 0;
        let clubWaveY = 0;
        let mouthOpen = false;
        
        if (isWaving) {
            // Aggressive club waving!
            const waveProgress = cycleTime / waveDuration;
            const intensity = Math.sin(waveProgress * Math.PI); // Fade in/out
            clubWaveAngle = Math.sin(time * 15) * 0.6 * intensity; // Fast rotation
            clubWaveY = Math.sin(time * 20) * 4 * scale * intensity; // Up/down shake
            mouthOpen = Math.sin(time * 12) > 0.3; // Yelling!
        }
        
        // Chasing = more intense animation
        const intensity = isChasing ? 1.5 : 1;
        
        // Body color - ALL nomads look the same (hostile is a surprise dice roll!)
        const skinColor = '#8B5A2B';
        const skinDark = '#6B4423';
        ctx.strokeStyle = skinColor;
        ctx.fillStyle = skinColor;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(nx, ny + 17 * scale, 8 * scale, 3 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // NO hostile indicator - it's a surprise dice roll for the player!
        
        // Head
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(nx, ny - 18 * scale - bodyBounce + breathe, 5 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = skinDark;
        ctx.stroke();
        
        // Eyes - wide when waving or chasing!
        const eyeSize = (isWaving || isChasing) ? 2 * scale : 1.5 * scale;
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(nx - 2 * scale, ny - 19 * scale - bodyBounce + breathe, eyeSize, 0, Math.PI * 2);
        ctx.arc(nx + 2 * scale, ny - 19 * scale - bodyBounce + breathe, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(nx - 2 * scale, ny - 19 * scale - bodyBounce + breathe, eyeSize * 0.5, 0, Math.PI * 2);
        ctx.arc(nx + 2 * scale, ny - 19 * scale - bodyBounce + breathe, eyeSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Angry eyebrows when chasing OR waving
        if (isChasing || isWaving) {
            ctx.strokeStyle = '#6B4423';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(nx - 4 * scale, ny - 22 * scale - bodyBounce);
            ctx.lineTo(nx - 1 * scale, ny - 20 * scale - bodyBounce);
            ctx.moveTo(nx + 4 * scale, ny - 22 * scale - bodyBounce);
            ctx.lineTo(nx + 1 * scale, ny - 20 * scale - bodyBounce);
            ctx.stroke();
        }
        
        // Mouth - open when waving (yelling!)
        if (mouthOpen) {
            ctx.fillStyle = '#4A2A10';
            ctx.beginPath();
            ctx.ellipse(nx, ny - 15 * scale - bodyBounce + breathe, 2 * scale, 1.5 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Body
        ctx.strokeStyle = '#8B5A2B';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(nx, ny - 13 * scale - bodyBounce + breathe);
        ctx.lineTo(nx, ny + 5 * scale);
        ctx.stroke();
        
        // LEGS - Professional walk cycle (simple pendulum motion)
        // Standard 2D game animation - legs swing from hip like pendulum
        ctx.strokeStyle = '#6B4423';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        // Simple pendulum walk - legs swing in opposite directions
        const legPhase = walkCycle * walkSpeed;
        const legSwingAngle = Math.sin(legPhase) * 0.45 * intensity; // Max ~25 degree swing
        const legLength = 11 * scale;
        
        // Left leg
        const leftFootX = nx - 3 * scale + Math.sin(legSwingAngle) * legLength;
        const leftFootY = ny + 5 * scale + Math.cos(legSwingAngle) * legLength;
        ctx.beginPath();
        ctx.moveTo(nx - 2 * scale, ny + 5 * scale);
        ctx.lineTo(leftFootX, leftFootY);
        ctx.stroke();
        
        // Right leg (opposite phase)
        const rightFootX = nx + 3 * scale + Math.sin(-legSwingAngle) * legLength;
        const rightFootY = ny + 5 * scale + Math.cos(-legSwingAngle) * legLength;
        ctx.beginPath();
        ctx.moveTo(nx + 2 * scale, ny + 5 * scale);
        ctx.lineTo(rightFootX, rightFootY);
        ctx.stroke();
        
        // Feet (small horizontal lines)
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(leftFootX - 2 * scale, leftFootY);
        ctx.lineTo(leftFootX + 2 * scale, leftFootY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(rightFootX - 2 * scale, rightFootY);
        ctx.lineTo(rightFootX + 2 * scale, rightFootY);
        ctx.stroke();
        
        // ARMS - One holds club (raised when waving), other swings
        ctx.strokeStyle = '#8B5A2B';
        ctx.lineWidth = 2;
        
        // Club arm position - higher when waving!
        const clubArmY = isWaving ? ny - 20 * scale - bodyBounce + clubWaveY : ny - 14 * scale - bodyBounce;
        
        ctx.beginPath();
        // Left arm (club arm) - raised higher when waving
        ctx.moveTo(nx, ny - 8 * scale - bodyBounce + breathe);
        ctx.lineTo(nx - 8 * scale, clubArmY);
        // Right arm - swings when walking
        ctx.moveTo(nx, ny - 8 * scale - bodyBounce + breathe);
        ctx.lineTo(nx + 6 * scale + armSwing * intensity, ny - 4 * scale - bodyBounce);
        ctx.stroke();
        
        // CLUB - The signature weapon!
        ctx.save();
        const clubX = nx - 8 * scale;
        const clubY = clubArmY;
        ctx.translate(clubX, clubY);
        
        // Club shakes when chasing OR waving
        const clubShake = isChasing ? Math.sin(time * 20) * 0.2 : 0;
        ctx.rotate(-0.4 + clubShake + clubWaveAngle);
        
        // Club shaft
        ctx.strokeStyle = '#6B4423';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-3 * scale, -12 * scale);
        ctx.stroke();
        
        // Club head (big and knobby)
        ctx.fillStyle = '#5A3A1A';
        ctx.beginPath();
        ctx.ellipse(-3 * scale, -15 * scale, 4 * scale, 6 * scale, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Club bumps
        ctx.fillStyle = '#4A2A10';
        ctx.beginPath();
        ctx.arc(-6 * scale, -14 * scale, 2 * scale, 0, Math.PI * 2);
        ctx.arc(-1 * scale, -18 * scale, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    /**
     * Draw a deer - simplified but cute
     */
    drawDeer(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number,
        currentTime: number
    ): void {
        const ax = x * T + T / 2;
        const ay = y * T + T / 2;
        const scale = T / 64;
        
        // Animation
        const time = Math.floor(currentTime / 100) / 10;
        const uniqueOffset = (x * 11 + y * 17) % 100;
        const headBob = Math.sin(time * 0.8 + uniqueOffset) * 2 * scale;
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(ax, ay + 16 * scale, 12 * scale, 4 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Back legs
        ctx.fillStyle = '#C8A070';
        ctx.beginPath();
        ctx.ellipse(ax - 8 * scale, ay + 12 * scale, 3 * scale, 8 * scale, 0.1, 0, Math.PI * 2);
        ctx.ellipse(ax + 4 * scale, ay + 12 * scale, 3 * scale, 8 * scale, -0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Hooves
        ctx.fillStyle = '#4A3A2A';
        ctx.beginPath();
        ctx.ellipse(ax - 8 * scale, ay + 19 * scale, 2 * scale, 1.5 * scale, 0, 0, Math.PI * 2);
        ctx.ellipse(ax + 4 * scale, ay + 19 * scale, 2 * scale, 1.5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Main body
        ctx.fillStyle = '#D4B890';
        ctx.beginPath();
        ctx.ellipse(ax - 2 * scale, ay, 16 * scale, 10 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Belly highlight
        ctx.fillStyle = 'rgba(255,252,245,0.6)';
        ctx.beginPath();
        ctx.ellipse(ax - 2 * scale, ay + 4 * scale, 10 * scale, 5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Front legs
        ctx.fillStyle = '#C8A878';
        ctx.beginPath();
        ctx.ellipse(ax - 12 * scale, ay + 10 * scale, 2.5 * scale, 9 * scale, 0.15, 0, Math.PI * 2);
        ctx.ellipse(ax + 8 * scale, ay + 10 * scale, 2.5 * scale, 9 * scale, -0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Neck
        ctx.fillStyle = '#E8D8B8';
        ctx.beginPath();
        ctx.moveTo(ax + 6 * scale, ay - 4 * scale);
        ctx.quadraticCurveTo(ax + 10 * scale, ay - 14 * scale, ax + 16 * scale, ay - 16 * scale);
        ctx.quadraticCurveTo(ax + 20 * scale, ay - 14 * scale, ax + 18 * scale, ay - 6 * scale);
        ctx.closePath();
        ctx.fill();
        
        // Head
        ctx.fillStyle = '#D8C8A8';
        ctx.beginPath();
        ctx.ellipse(ax + 18 * scale, ay - 16 * scale + headBob, 7 * scale, 5 * scale, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Snout
        ctx.fillStyle = '#E8D8C0';
        ctx.beginPath();
        ctx.ellipse(ax + 24 * scale, ay - 14 * scale + headBob, 4 * scale, 3 * scale, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Nose
        ctx.fillStyle = '#3A2A1A';
        ctx.beginPath();
        ctx.ellipse(ax + 27 * scale, ay - 14 * scale + headBob, 1.5 * scale, 1 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye - bigger and more expressive!
        ctx.fillStyle = '#1A0A00';
        ctx.beginPath();
        ctx.ellipse(ax + 19 * scale, ay - 17 * scale + headBob, 3 * scale, 3.5 * scale, 0.1, 0, Math.PI * 2);
        ctx.fill();
        // Big cute shine
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(ax + 17.5 * scale, ay - 18.5 * scale + headBob, 1.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        // Small secondary shine
        ctx.beginPath();
        ctx.arc(ax + 20 * scale, ay - 16 * scale + headBob, 0.7 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Cute blush marks!
        ctx.fillStyle = 'rgba(255,150,150,0.4)';
        ctx.beginPath();
        ctx.ellipse(ax + 22 * scale, ay - 12 * scale + headBob, 2.5 * scale, 1.5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Ear
        ctx.fillStyle = '#D8C098';
        ctx.beginPath();
        ctx.ellipse(ax + 14 * scale, ay - 22 * scale + headBob, 3 * scale, 5 * scale, -0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Antlers
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ax + 12 * scale, ay - 20 * scale);
        ctx.quadraticCurveTo(ax + 8 * scale, ay - 28 * scale, ax + 6 * scale, ay - 34 * scale);
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax + 10 * scale, ay - 24 * scale);
        ctx.lineTo(ax + 4 * scale, ay - 26 * scale);
        ctx.moveTo(ax + 8 * scale, ay - 28 * scale);
        ctx.lineTo(ax + 2 * scale, ay - 30 * scale);
        ctx.stroke();
        
        // White tail
        ctx.fillStyle = '#FFF8F0';
        ctx.beginPath();
        ctx.ellipse(ax - 16 * scale, ay - 2 * scale, 4 * scale, 3 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Draw a turtle - simple cute beach creature
     */
    drawTurtle(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number
    ): void {
        const ax = x * T + T / 2;
        const ay = y * T + T / 2;
        const scale = T / 64;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(ax, ay + 8 * scale, 10 * scale, 4 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Shell
        ctx.fillStyle = '#4A7A4A';
        ctx.beginPath();
        ctx.ellipse(ax, ay, 12 * scale, 8 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Shell pattern
        ctx.strokeStyle = '#2A5A2A';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ax - 8 * scale, ay);
        ctx.lineTo(ax + 8 * scale, ay);
        ctx.moveTo(ax, ay - 6 * scale);
        ctx.lineTo(ax, ay + 6 * scale);
        ctx.stroke();
        
        // Head
        ctx.fillStyle = '#6A9A6A';
        ctx.beginPath();
        ctx.ellipse(ax + 10 * scale, ay - 2 * scale, 4 * scale, 3 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Big sleepy eye - turtles look chill
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.ellipse(ax + 12 * scale, ay - 3 * scale, 1.8 * scale, 1.2 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        // Sleepy eyelid (half-closed look)
        ctx.fillStyle = '#5A8A5A';
        ctx.beginPath();
        ctx.ellipse(ax + 12 * scale, ay - 4 * scale, 2 * scale, 1 * scale, 0, 0, Math.PI);
        ctx.fill();
        // Tiny shine
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(ax + 11.5 * scale, ay - 3.5 * scale, 0.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Cute smile line
        ctx.strokeStyle = '#3A6A3A';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ax + 12 * scale, ay - 1 * scale, 2 * scale, 0.2, Math.PI - 0.2);
        ctx.stroke();
        
        // Legs
        ctx.fillStyle = '#6A9A6A';
        for (const offset of [{ x: -8, y: 4 }, { x: 8, y: 4 }, { x: -8, y: -4 }, { x: 8, y: -4 }]) {
            ctx.beginPath();
            ctx.ellipse(ax + offset.x * scale, ay + offset.y * scale, 3 * scale, 2 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    /**
     * Draw a boar - stocky and tough
     */
    drawBoar(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number,
        currentTime: number
    ): void {
        const ax = x * T + T / 2;
        const ay = y * T + T / 2;
        const scale = T / 64;
        
        const time = Math.floor(currentTime / 100) / 10;
        const uniqueOffset = (x * 13 + y * 19) % 100;
        const snort = Math.sin(time * 3 + uniqueOffset) * 1 * scale;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(ax, ay + 12 * scale, 14 * scale, 5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Legs (short and sturdy)
        ctx.fillStyle = '#3A2820';
        for (const lx of [-10, -4, 4, 10]) {
            ctx.beginPath();
            ctx.ellipse(ax + lx * scale, ay + 10 * scale, 2.5 * scale, 6 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Body (barrel-shaped)
        ctx.fillStyle = '#5A4A3A';
        ctx.beginPath();
        ctx.ellipse(ax, ay, 16 * scale, 10 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Bristly back (darker stripe)
        ctx.fillStyle = '#3A2A1A';
        ctx.beginPath();
        ctx.ellipse(ax, ay - 6 * scale, 12 * scale, 3 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.fillStyle = '#4A3A2A';
        ctx.beginPath();
        ctx.ellipse(ax + 14 * scale, ay - 2 * scale + snort, 8 * scale, 6 * scale, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Snout
        ctx.fillStyle = '#6A5A4A';
        ctx.beginPath();
        ctx.ellipse(ax + 22 * scale, ay + snort, 5 * scale, 4 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Nostrils
        ctx.fillStyle = '#2A1A0A';
        ctx.beginPath();
        ctx.arc(ax + 24 * scale, ay - 1 * scale + snort, 1 * scale, 0, Math.PI * 2);
        ctx.arc(ax + 24 * scale, ay + 2 * scale + snort, 1 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Tusks
        ctx.fillStyle = '#E8E0D0';
        ctx.beginPath();
        ctx.moveTo(ax + 20 * scale, ay + 3 * scale + snort);
        ctx.quadraticCurveTo(ax + 26 * scale, ay + 6 * scale, ax + 24 * scale, ay - 2 * scale);
        ctx.lineTo(ax + 22 * scale, ay + snort);
        ctx.fill();
        
        // Eye (small and suspicious, like "what're you looking at?")
        ctx.fillStyle = '#1A0A00';
        ctx.beginPath();
        ctx.ellipse(ax + 16 * scale, ay - 4 * scale + snort, 2 * scale, 1.5 * scale, -0.2, 0, Math.PI * 2);
        ctx.fill();
        // Angry squint line
        ctx.strokeStyle = '#3A2A1A';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ax + 13 * scale, ay - 6 * scale + snort);
        ctx.lineTo(ax + 18 * scale, ay - 5 * scale + snort);
        ctx.stroke();
        // Tiny shine
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(ax + 15.5 * scale, ay - 4.5 * scale + snort, 0.6 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Ear
        ctx.fillStyle = '#4A3A2A';
        ctx.beginPath();
        ctx.ellipse(ax + 10 * scale, ay - 8 * scale, 3 * scale, 4 * scale, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Tail (curly)
        ctx.strokeStyle = '#4A3A2A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax - 16 * scale, ay);
        ctx.quadraticCurveTo(ax - 20 * scale, ay - 4 * scale, ax - 18 * scale, ay - 8 * scale);
        ctx.stroke();
    }
    
    /**
     * Draw a rabbit - small and cute
     */
    drawRabbit(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number,
        currentTime: number
    ): void {
        const ax = x * T + T / 2;
        const ay = y * T + T / 2;
        const scale = T / 64;
        
        const time = Math.floor(currentTime / 100) / 10;
        const uniqueOffset = (x * 17 + y * 23) % 100;
        const hop = Math.abs(Math.sin(time * 2 + uniqueOffset)) * 3 * scale;
        const earTwitch = Math.sin(time * 4 + uniqueOffset) * 0.2;
        
        // Shadow (moves with hop)
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(ax, ay + 8 * scale, 8 * scale - hop * 0.5, 3 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Back legs (big and powerful)
        ctx.fillStyle = '#C8B8A0';
        ctx.beginPath();
        ctx.ellipse(ax - 4 * scale, ay + 4 * scale - hop, 5 * scale, 4 * scale, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Body
        ctx.fillStyle = '#D8C8B0';
        ctx.beginPath();
        ctx.ellipse(ax, ay - hop, 10 * scale, 7 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Front paws
        ctx.fillStyle = '#C8B8A0';
        ctx.beginPath();
        ctx.ellipse(ax + 6 * scale, ay + 4 * scale - hop, 2 * scale, 3 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.fillStyle = '#E0D0C0';
        ctx.beginPath();
        ctx.ellipse(ax + 8 * scale, ay - 6 * scale - hop, 6 * scale, 5 * scale, 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears (long!)
        ctx.fillStyle = '#D8C8B0';
        ctx.save();
        ctx.translate(ax + 6 * scale, ay - 10 * scale - hop);
        ctx.rotate(earTwitch - 0.3);
        ctx.beginPath();
        ctx.ellipse(0, -8 * scale, 3 * scale, 10 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        // Inner ear
        ctx.fillStyle = '#E8B8A8';
        ctx.beginPath();
        ctx.ellipse(0, -8 * scale, 1.5 * scale, 7 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        ctx.fillStyle = '#D8C8B0';
        ctx.save();
        ctx.translate(ax + 10 * scale, ay - 10 * scale - hop);
        ctx.rotate(-earTwitch + 0.3);
        ctx.beginPath();
        ctx.ellipse(0, -8 * scale, 3 * scale, 10 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#E8B8A8';
        ctx.beginPath();
        ctx.ellipse(0, -8 * scale, 1.5 * scale, 7 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Eye
        ctx.fillStyle = '#1A0A00';
        ctx.beginPath();
        ctx.arc(ax + 11 * scale, ay - 7 * scale - hop, 1.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(ax + 10.5 * scale, ay - 7.5 * scale - hop, 0.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Nose
        ctx.fillStyle = '#E8A0A0';
        ctx.beginPath();
        ctx.ellipse(ax + 13 * scale, ay - 5 * scale - hop, 1.5 * scale, 1 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Fluffy tail
        ctx.fillStyle = '#F0E8E0';
        ctx.beginPath();
        ctx.arc(ax - 10 * scale, ay - 2 * scale - hop, 4 * scale, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Draw a mammoth - big and woolly
     */
    drawMammoth(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number,
        currentTime: number
    ): void {
        const ax = x * T + T / 2;
        const ay = y * T + T / 2;
        const scale = T / 64;
        
        const time = Math.floor(currentTime / 100) / 10;
        const uniqueOffset = (x * 19 + y * 29) % 100;
        const sway = Math.sin(time * 0.5 + uniqueOffset) * 2 * scale;
        const trunkSwing = Math.sin(time * 1 + uniqueOffset) * 3 * scale;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(ax, ay + 14 * scale, 18 * scale, 6 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Legs (thick and stumpy)
        ctx.fillStyle = '#5A4A3A';
        for (const lx of [-12, -4, 4, 12]) {
            ctx.beginPath();
            ctx.ellipse(ax + lx * scale, ay + 8 * scale, 4 * scale, 10 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Body (huge and woolly)
        ctx.fillStyle = '#7A6A5A';
        ctx.beginPath();
        ctx.ellipse(ax + sway, ay - 4 * scale, 20 * scale, 14 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Woolly texture (shaggy fur lines)
        ctx.strokeStyle = '#5A4A3A';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 8; i++) {
            const furX = ax - 16 * scale + i * 4 * scale + sway;
            ctx.beginPath();
            ctx.moveTo(furX, ay + 6 * scale);
            ctx.quadraticCurveTo(furX - 2 * scale, ay + 12 * scale, furX + 1 * scale, ay + 16 * scale);
            ctx.stroke();
        }
        
        // Head
        ctx.fillStyle = '#6A5A4A';
        ctx.beginPath();
        ctx.ellipse(ax + 18 * scale + sway, ay - 8 * scale, 10 * scale, 8 * scale, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Trunk
        ctx.fillStyle = '#6A5A4A';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#6A5A4A';
        ctx.beginPath();
        ctx.moveTo(ax + 26 * scale + sway, ay - 4 * scale);
        ctx.quadraticCurveTo(
            ax + 32 * scale + trunkSwing, ay + 4 * scale,
            ax + 28 * scale + trunkSwing * 1.5, ay + 14 * scale
        );
        ctx.stroke();
        
        // Tusks (huge and curved!)
        ctx.fillStyle = '#F0E8D8';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#F0E8D8';
        ctx.beginPath();
        ctx.moveTo(ax + 20 * scale + sway, ay - 2 * scale);
        ctx.quadraticCurveTo(ax + 34 * scale, ay + 8 * scale, ax + 28 * scale, ay - 10 * scale);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ax + 20 * scale + sway, ay - 6 * scale);
        ctx.quadraticCurveTo(ax + 32 * scale, ay - 2 * scale, ax + 26 * scale, ay - 16 * scale);
        ctx.stroke();
        
        // Eye - big friendly mammoth eye!
        ctx.fillStyle = '#1A0A00';
        ctx.beginPath();
        ctx.ellipse(ax + 22 * scale + sway, ay - 10 * scale, 3 * scale, 3.5 * scale, 0.1, 0, Math.PI * 2);
        ctx.fill();
        // Big shine
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(ax + 20.5 * scale + sway, ay - 11 * scale, 1.3 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ax + 23 * scale + sway, ay - 9 * scale, 0.6 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Fuzzy eyebrow for character
        ctx.strokeStyle = '#5A4A3A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax + 18 * scale + sway, ay - 14 * scale);
        ctx.quadraticCurveTo(ax + 22 * scale + sway, ay - 15 * scale, ax + 26 * scale + sway, ay - 13 * scale);
        ctx.stroke();
        
        // Ear
        ctx.fillStyle = '#5A4A3A';
        ctx.beginPath();
        ctx.ellipse(ax + 12 * scale + sway, ay - 12 * scale, 5 * scale, 7 * scale, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Hump
        ctx.fillStyle = '#7A6A5A';
        ctx.beginPath();
        ctx.ellipse(ax - 8 * scale + sway, ay - 14 * scale, 8 * scale, 5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Draw a bison - sturdy plains animal
     */
    drawBison(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number,
        currentTime: number
    ): void {
        const ax = x * T + T / 2;
        const ay = y * T + T / 2;
        const scale = T / 64;
        
        const time = Math.floor(currentTime / 100) / 10;
        const uniqueOffset = (x * 23 + y * 31) % 100;
        const graze = Math.sin(time * 0.8 + uniqueOffset) * 2 * scale;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(ax, ay + 12 * scale, 16 * scale, 5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Legs
        ctx.fillStyle = '#3A2A1A';
        for (const lx of [-10, -3, 3, 10]) {
            ctx.beginPath();
            ctx.ellipse(ax + lx * scale, ay + 8 * scale, 3 * scale, 8 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Body
        ctx.fillStyle = '#5A4030';
        ctx.beginPath();
        ctx.ellipse(ax, ay - 2 * scale, 18 * scale, 12 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Big shoulder hump
        ctx.fillStyle = '#4A3020';
        ctx.beginPath();
        ctx.ellipse(ax + 6 * scale, ay - 10 * scale, 10 * scale, 8 * scale, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Shaggy front (darker fur)
        ctx.fillStyle = '#3A2010';
        ctx.beginPath();
        ctx.ellipse(ax + 10 * scale, ay, 8 * scale, 10 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Head (lowered, grazing)
        ctx.fillStyle = '#4A3020';
        ctx.beginPath();
        ctx.ellipse(ax + 18 * scale, ay + 2 * scale + graze, 8 * scale, 6 * scale, 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Beard
        ctx.fillStyle = '#2A1A0A';
        ctx.beginPath();
        ctx.ellipse(ax + 20 * scale, ay + 8 * scale + graze, 4 * scale, 5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Horns (curved outward)
        ctx.strokeStyle = '#2A2A2A';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ax + 14 * scale, ay - 4 * scale + graze);
        ctx.quadraticCurveTo(ax + 10 * scale, ay - 12 * scale, ax + 6 * scale, ay - 8 * scale);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ax + 20 * scale, ay - 2 * scale + graze);
        ctx.quadraticCurveTo(ax + 26 * scale, ay - 10 * scale, ax + 28 * scale, ay - 4 * scale);
        ctx.stroke();
        
        // Eye - grumpy but lovable!
        ctx.fillStyle = '#1A0A00';
        ctx.beginPath();
        ctx.ellipse(ax + 20 * scale, ay - 1 * scale + graze, 2.5 * scale, 2 * scale, 0.2, 0, Math.PI * 2);
        ctx.fill();
        // Angry/focused eyebrow line
        ctx.strokeStyle = '#2A1A0A';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ax + 17 * scale, ay - 2 * scale + graze);
        ctx.lineTo(ax + 22 * scale, ay - 4 * scale + graze);
        ctx.stroke();
        // Eye shine
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(ax + 19 * scale, ay - 1.5 * scale + graze, 0.8 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Nostril - steam puff for extra character!
        ctx.fillStyle = '#1A0A00';
        ctx.beginPath();
        ctx.arc(ax + 24 * scale, ay + 4 * scale + graze, 1 * scale, 0, Math.PI * 2);
        ctx.fill();
        // Little steam puffs (like snorting)
        const puff = Math.sin(time * 2 + uniqueOffset) * 0.5;
        if (puff > 0.3) {
            ctx.fillStyle = 'rgba(200,200,200,0.3)';
            ctx.beginPath();
            ctx.arc(ax + 28 * scale, ay + 3 * scale + graze, 2 * scale * puff, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Tail
        ctx.strokeStyle = '#3A2010';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax - 18 * scale, ay);
        ctx.lineTo(ax - 22 * scale, ay + 8 * scale);
        ctx.stroke();
        ctx.fillStyle = '#2A1A0A';
        ctx.beginPath();
        ctx.ellipse(ax - 22 * scale, ay + 10 * scale, 2 * scale, 3 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WALKING ANIMAL VARIANTS - With leg animation!
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Draw a walking deer with animated legs
     */
    drawWalkingDeer(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number,
        currentTime: number,
        walkCycle: number,
        isFleeing: boolean = false
    ): void {
        const ax = x * T + T / 2;
        const ay = y * T + T / 2;
        const scale = T / 64;
        
        const time = currentTime / 1000;
        const walkSpeed = isFleeing ? 12 : 6;
        const legSwing = Math.sin(walkCycle * walkSpeed) * 8 * scale;
        const bodyBounce = Math.abs(Math.sin(walkCycle * walkSpeed * 2)) * 2 * scale;
        const headBob = Math.sin(time * 0.8) * 2 * scale + bodyBounce;
        
        ctx.lineCap = 'round';
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(ax, ay + 16 * scale, 12 * scale, 4 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Back legs with walking animation
        ctx.fillStyle = '#C8A070';
        ctx.beginPath();
        ctx.ellipse(ax - 8 * scale - legSwing * 0.5, ay + 10 * scale + Math.abs(legSwing) * 0.3, 3 * scale, 9 * scale, 0.1 + legSwing * 0.02, 0, Math.PI * 2);
        ctx.ellipse(ax + 4 * scale + legSwing * 0.5, ay + 10 * scale + Math.abs(legSwing) * 0.3, 3 * scale, 9 * scale, -0.1 - legSwing * 0.02, 0, Math.PI * 2);
        ctx.fill();
        
        // Hooves
        ctx.fillStyle = '#4A3A2A';
        ctx.beginPath();
        ctx.ellipse(ax - 8 * scale - legSwing * 0.8, ay + 18 * scale, 2 * scale, 1.5 * scale, 0, 0, Math.PI * 2);
        ctx.ellipse(ax + 4 * scale + legSwing * 0.8, ay + 18 * scale, 2 * scale, 1.5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Main body
        ctx.fillStyle = '#D4B890';
        ctx.beginPath();
        ctx.ellipse(ax - 2 * scale, ay - bodyBounce, 16 * scale, 10 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Front legs with opposite animation
        ctx.fillStyle = '#C8A878';
        ctx.beginPath();
        ctx.ellipse(ax - 12 * scale + legSwing * 0.5, ay + 8 * scale + Math.abs(legSwing) * 0.3, 2.5 * scale, 10 * scale, 0.15 - legSwing * 0.02, 0, Math.PI * 2);
        ctx.ellipse(ax + 8 * scale - legSwing * 0.5, ay + 8 * scale + Math.abs(legSwing) * 0.3, 2.5 * scale, 10 * scale, -0.15 + legSwing * 0.02, 0, Math.PI * 2);
        ctx.fill();
        
        // Front hooves
        ctx.fillStyle = '#4A3A2A';
        ctx.beginPath();
        ctx.ellipse(ax - 12 * scale + legSwing * 0.8, ay + 17 * scale, 2 * scale, 1.5 * scale, 0, 0, Math.PI * 2);
        ctx.ellipse(ax + 8 * scale - legSwing * 0.8, ay + 17 * scale, 2 * scale, 1.5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Neck
        ctx.fillStyle = '#E8D8B8';
        ctx.beginPath();
        ctx.moveTo(ax + 6 * scale, ay - 4 * scale - bodyBounce);
        ctx.quadraticCurveTo(ax + 10 * scale, ay - 14 * scale - bodyBounce, ax + 16 * scale, ay - 16 * scale - bodyBounce);
        ctx.quadraticCurveTo(ax + 20 * scale, ay - 14 * scale - bodyBounce, ax + 18 * scale, ay - 6 * scale - bodyBounce);
        ctx.closePath();
        ctx.fill();
        
        // Head
        ctx.fillStyle = '#D8C8A8';
        ctx.beginPath();
        ctx.ellipse(ax + 18 * scale, ay - 16 * scale + headBob - bodyBounce, 7 * scale, 5 * scale, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye
        ctx.fillStyle = isFleeing ? '#FF4444' : '#2A1A0A';  // Red eyes when fleeing!
        ctx.beginPath();
        ctx.ellipse(ax + 19 * scale, ay - 17 * scale + headBob - bodyBounce, 2 * scale, 2.5 * scale, 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Ear
        ctx.fillStyle = '#D8C098';
        ctx.beginPath();
        ctx.ellipse(ax + 14 * scale, ay - 22 * scale + headBob - bodyBounce, 3 * scale, 5 * scale, -0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // White tail (raised when fleeing)
        ctx.fillStyle = '#FFF8F0';
        ctx.beginPath();
        const tailRaise = isFleeing ? -5 * scale : 0;
        ctx.ellipse(ax - 16 * scale, ay - 2 * scale - bodyBounce + tailRaise, 4 * scale, 3 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Draw a walking rabbit with animated legs
     */
    drawWalkingRabbit(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number,
        currentTime: number,
        walkCycle: number,
        isFleeing: boolean = false
    ): void {
        const ax = x * T + T / 2;
        const ay = y * T + T / 2;
        const scale = T / 64;
        
        const hopCycle = Math.sin(walkCycle * (isFleeing ? 15 : 8));
        const hopHeight = Math.abs(hopCycle) * 6 * scale * (isFleeing ? 1.5 : 1);
        const stretchX = 1 + Math.abs(hopCycle) * 0.2;
        
        // Shadow (moves with hop)
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(ax, ay + 8 * scale, 6 * scale * stretchX, 2 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Back legs
        ctx.fillStyle = '#C8B898';
        const backLegExtend = hopCycle * 4 * scale;
        ctx.beginPath();
        ctx.ellipse(ax - 3 * scale - backLegExtend, ay + 4 * scale - hopHeight, 4 * scale, 6 * scale, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Body
        ctx.fillStyle = '#E8D8C8';
        ctx.beginPath();
        ctx.ellipse(ax, ay - 2 * scale - hopHeight, 8 * scale * stretchX, 6 * scale / stretchX, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Front legs
        ctx.fillStyle = '#D8C8B8';
        ctx.beginPath();
        ctx.ellipse(ax + 4 * scale + backLegExtend, ay + 3 * scale - hopHeight * 0.5, 2 * scale, 4 * scale, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.fillStyle = '#E8D8C8';
        ctx.beginPath();
        ctx.ellipse(ax + 6 * scale, ay - 6 * scale - hopHeight, 5 * scale, 4 * scale, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears (flatten when running fast)
        ctx.fillStyle = '#D8C0A8';
        const earFlat = isFleeing ? 0.8 : 0;
        ctx.beginPath();
        ctx.ellipse(ax + 4 * scale, ay - 14 * scale - hopHeight + earFlat * 6 * scale, 2 * scale, 6 * scale - earFlat * 3 * scale, -0.3 + earFlat, 0, Math.PI * 2);
        ctx.ellipse(ax + 8 * scale, ay - 14 * scale - hopHeight + earFlat * 6 * scale, 2 * scale, 6 * scale - earFlat * 3 * scale, 0.3 - earFlat, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye
        ctx.fillStyle = isFleeing ? '#FF6666' : '#2A1A0A';
        ctx.beginPath();
        ctx.arc(ax + 8 * scale, ay - 7 * scale - hopHeight, 1.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Fluffy tail
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(ax - 7 * scale, ay - 2 * scale - hopHeight, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Draw a walking bison with animated legs
     */
    drawWalkingBison(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number,
        currentTime: number,
        walkCycle: number,
        isFleeing: boolean = false
    ): void {
        const ax = x * T + T / 2;
        const ay = y * T + T / 2;
        const scale = T / 64;
        
        const walkSpeed = isFleeing ? 10 : 4;
        const legSwing = Math.sin(walkCycle * walkSpeed) * 5 * scale;
        const bodyBounce = Math.abs(Math.sin(walkCycle * walkSpeed * 2)) * 1.5 * scale;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(ax, ay + 14 * scale, 16 * scale, 5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Back legs with animation
        ctx.fillStyle = '#6A5040';
        ctx.beginPath();
        ctx.ellipse(ax - 10 * scale - legSwing * 0.5, ay + 8 * scale, 4 * scale, 10 * scale, 0.1, 0, Math.PI * 2);
        ctx.ellipse(ax + 6 * scale + legSwing * 0.5, ay + 8 * scale, 4 * scale, 10 * scale, -0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Hooves
        ctx.fillStyle = '#2A1A10';
        ctx.beginPath();
        ctx.ellipse(ax - 10 * scale - legSwing * 0.8, ay + 17 * scale, 3 * scale, 2 * scale, 0, 0, Math.PI * 2);
        ctx.ellipse(ax + 6 * scale + legSwing * 0.8, ay + 17 * scale, 3 * scale, 2 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Big chunky body
        ctx.fillStyle = '#8A6A50';
        ctx.beginPath();
        ctx.ellipse(ax, ay - 2 * scale - bodyBounce, 18 * scale, 12 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Front legs
        ctx.fillStyle = '#7A5A40';
        ctx.beginPath();
        ctx.ellipse(ax - 14 * scale + legSwing * 0.5, ay + 6 * scale, 4 * scale, 11 * scale, 0.15, 0, Math.PI * 2);
        ctx.ellipse(ax + 10 * scale - legSwing * 0.5, ay + 6 * scale, 4 * scale, 11 * scale, -0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Shaggy hump
        ctx.fillStyle = '#6A4A30';
        ctx.beginPath();
        ctx.ellipse(ax - 4 * scale, ay - 12 * scale - bodyBounce, 12 * scale, 8 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.fillStyle = '#5A4A38';
        ctx.beginPath();
        ctx.ellipse(ax + 16 * scale, ay - 4 * scale - bodyBounce, 8 * scale, 7 * scale, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Horns
        ctx.strokeStyle = '#3A2A1A';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ax + 14 * scale, ay - 10 * scale - bodyBounce, 5 * scale, Math.PI * 0.5, Math.PI * 1.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ax + 18 * scale, ay - 10 * scale - bodyBounce, 5 * scale, Math.PI * 1.8, Math.PI * 0.5);
        ctx.stroke();
        
        // Eye
        ctx.fillStyle = isFleeing ? '#FF4444' : '#1A0A00';
        ctx.beginPath();
        ctx.arc(ax + 18 * scale, ay - 5 * scale - bodyBounce, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Draw a walking mammoth with animated legs
     */
    drawWalkingMammoth(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number,
        currentTime: number,
        walkCycle: number,
        isFleeing: boolean = false
    ): void {
        const ax = x * T + T / 2;
        const ay = y * T + T / 2;
        const scale = T / 64;
        
        const walkSpeed = isFleeing ? 8 : 3;
        const legSwing = Math.sin(walkCycle * walkSpeed) * 4 * scale;
        const bodyBounce = Math.abs(Math.sin(walkCycle * walkSpeed * 2)) * 2 * scale;
        const trunkSwing = Math.sin(walkCycle * walkSpeed * 0.5) * 3 * scale;
        
        // Big shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(ax, ay + 18 * scale, 20 * scale, 6 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Back legs
        ctx.fillStyle = '#7A6050';
        ctx.beginPath();
        ctx.ellipse(ax - 12 * scale - legSwing * 0.4, ay + 10 * scale, 5 * scale, 12 * scale, 0.1, 0, Math.PI * 2);
        ctx.ellipse(ax + 8 * scale + legSwing * 0.4, ay + 10 * scale, 5 * scale, 12 * scale, -0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Feet
        ctx.fillStyle = '#5A4A3A';
        ctx.beginPath();
        ctx.ellipse(ax - 12 * scale - legSwing * 0.6, ay + 20 * scale, 4 * scale, 2 * scale, 0, 0, Math.PI * 2);
        ctx.ellipse(ax + 8 * scale + legSwing * 0.6, ay + 20 * scale, 4 * scale, 2 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Massive fluffy body
        ctx.fillStyle = '#8A7060';
        ctx.beginPath();
        ctx.ellipse(ax, ay - 4 * scale - bodyBounce, 22 * scale, 16 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Front legs
        ctx.fillStyle = '#7A5A4A';
        ctx.beginPath();
        ctx.ellipse(ax - 16 * scale + legSwing * 0.4, ay + 8 * scale, 5 * scale, 14 * scale, 0.1, 0, Math.PI * 2);
        ctx.ellipse(ax + 12 * scale - legSwing * 0.4, ay + 8 * scale, 5 * scale, 14 * scale, -0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Fur texture
        ctx.fillStyle = '#6A5040';
        for (let i = 0; i < 8; i++) {
            const furX = ax - 15 * scale + i * 4 * scale;
            const furY = ay + 2 * scale - bodyBounce + Math.sin(i) * 2 * scale;
            ctx.beginPath();
            ctx.ellipse(furX, furY, 3 * scale, 5 * scale, 0.2 * (i % 2 ? 1 : -1), 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Head
        ctx.fillStyle = '#7A6050';
        ctx.beginPath();
        ctx.ellipse(ax + 18 * scale, ay - 8 * scale - bodyBounce, 10 * scale, 9 * scale, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Trunk with swing
        ctx.strokeStyle = '#6A5040';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ax + 26 * scale, ay - 6 * scale - bodyBounce);
        ctx.quadraticCurveTo(
            ax + 32 * scale + trunkSwing, 
            ay + 4 * scale - bodyBounce,
            ax + 28 * scale + trunkSwing * 2, 
            ay + 14 * scale - bodyBounce
        );
        ctx.stroke();
        
        // Giant tusks
        ctx.strokeStyle = '#F8F0E8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(ax + 20 * scale, ay - 2 * scale - bodyBounce);
        ctx.quadraticCurveTo(ax + 30 * scale, ay + 8 * scale - bodyBounce, ax + 24 * scale, ay + 16 * scale - bodyBounce);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ax + 16 * scale, ay - 2 * scale - bodyBounce);
        ctx.quadraticCurveTo(ax + 26 * scale, ay + 8 * scale - bodyBounce, ax + 20 * scale, ay + 16 * scale - bodyBounce);
        ctx.stroke();
        
        // Eyes
        ctx.fillStyle = isFleeing ? '#FF4444' : '#2A1A0A';
        ctx.beginPath();
        ctx.arc(ax + 22 * scale, ay - 10 * scale - bodyBounce, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears
        ctx.fillStyle = '#6A5040';
        ctx.beginPath();
        ctx.ellipse(ax + 12 * scale, ay - 14 * scale - bodyBounce, 6 * scale, 8 * scale, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // NEW ANIMALS - Wolf, Fox, Bear, Fish
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Draw a walking wolf - gray and fierce
     */
    drawWalkingWolf(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number,
        currentTime: number,
        walkCycle: number,
        isFleeing: boolean = false
    ): void {
        const ax = x * T + T / 2;
        const ay = y * T + T / 2;
        const scale = T / 64;
        
        const walkSpeed = isFleeing ? 12 : 6;
        const legSwing = Math.sin(walkCycle * walkSpeed) * 6 * scale;
        const bodyBounce = Math.abs(Math.sin(walkCycle * walkSpeed * 2)) * 1.5 * scale;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(ax, ay + 14 * scale, 14 * scale, 4 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Back legs
        ctx.fillStyle = '#606060';
        ctx.beginPath();
        ctx.ellipse(ax - 8 * scale - legSwing * 0.5, ay + 8 * scale, 3 * scale, 10 * scale, 0.1, 0, Math.PI * 2);
        ctx.ellipse(ax + 4 * scale + legSwing * 0.5, ay + 8 * scale, 3 * scale, 10 * scale, -0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Paws
        ctx.fillStyle = '#404040';
        ctx.beginPath();
        ctx.ellipse(ax - 8 * scale - legSwing * 0.7, ay + 17 * scale, 2.5 * scale, 1.5 * scale, 0, 0, Math.PI * 2);
        ctx.ellipse(ax + 4 * scale + legSwing * 0.7, ay + 17 * scale, 2.5 * scale, 1.5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body - sleek
        ctx.fillStyle = '#707070';
        ctx.beginPath();
        ctx.ellipse(ax - 2 * scale, ay - bodyBounce, 16 * scale, 9 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Belly
        ctx.fillStyle = '#909090';
        ctx.beginPath();
        ctx.ellipse(ax - 2 * scale, ay + 2 * scale - bodyBounce, 10 * scale, 5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Front legs
        ctx.fillStyle = '#686868';
        ctx.beginPath();
        ctx.ellipse(ax - 12 * scale + legSwing * 0.5, ay + 6 * scale, 3 * scale, 11 * scale, 0.15, 0, Math.PI * 2);
        ctx.ellipse(ax + 8 * scale - legSwing * 0.5, ay + 6 * scale, 3 * scale, 11 * scale, -0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Neck/mane
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.ellipse(ax + 10 * scale, ay - 6 * scale - bodyBounce, 8 * scale, 7 * scale, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.fillStyle = '#707070';
        ctx.beginPath();
        ctx.ellipse(ax + 18 * scale, ay - 10 * scale - bodyBounce, 7 * scale, 5 * scale, 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Snout
        ctx.fillStyle = '#606060';
        ctx.beginPath();
        ctx.ellipse(ax + 24 * scale, ay - 9 * scale - bodyBounce, 5 * scale, 3 * scale, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Nose
        ctx.fillStyle = '#202020';
        ctx.beginPath();
        ctx.arc(ax + 28 * scale, ay - 9 * scale - bodyBounce, 1.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes - yellow/amber, menacing
        ctx.fillStyle = isFleeing ? '#FF4444' : '#FFB020';
        ctx.beginPath();
        ctx.arc(ax + 19 * scale, ay - 12 * scale - bodyBounce, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(ax + 19.5 * scale, ay - 12 * scale - bodyBounce, 1 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears - pointed
        ctx.fillStyle = '#606060';
        ctx.beginPath();
        ctx.moveTo(ax + 14 * scale, ay - 14 * scale - bodyBounce);
        ctx.lineTo(ax + 12 * scale, ay - 22 * scale - bodyBounce);
        ctx.lineTo(ax + 17 * scale, ay - 16 * scale - bodyBounce);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(ax + 18 * scale, ay - 14 * scale - bodyBounce);
        ctx.lineTo(ax + 20 * scale, ay - 21 * scale - bodyBounce);
        ctx.lineTo(ax + 22 * scale, ay - 15 * scale - bodyBounce);
        ctx.closePath();
        ctx.fill();
        
        // Bushy tail
        ctx.fillStyle = '#707070';
        ctx.beginPath();
        ctx.ellipse(ax - 16 * scale, ay - 4 * scale - bodyBounce, 6 * scale, 4 * scale, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Draw a walking fox - orange and quick
     */
    drawWalkingFox(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number,
        currentTime: number,
        walkCycle: number,
        isFleeing: boolean = false
    ): void {
        const ax = x * T + T / 2;
        const ay = y * T + T / 2;
        const scale = T / 64;
        
        const walkSpeed = isFleeing ? 14 : 7;
        const legSwing = Math.sin(walkCycle * walkSpeed) * 5 * scale;
        const bodyBounce = Math.abs(Math.sin(walkCycle * walkSpeed * 2)) * 2 * scale;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(ax, ay + 12 * scale, 10 * scale, 3 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Back legs
        ctx.fillStyle = '#C06020';
        ctx.beginPath();
        ctx.ellipse(ax - 6 * scale - legSwing * 0.4, ay + 6 * scale, 2 * scale, 8 * scale, 0.1, 0, Math.PI * 2);
        ctx.ellipse(ax + 3 * scale + legSwing * 0.4, ay + 6 * scale, 2 * scale, 8 * scale, -0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Paws - black
        ctx.fillStyle = '#202020';
        ctx.beginPath();
        ctx.ellipse(ax - 6 * scale - legSwing * 0.6, ay + 13 * scale, 1.5 * scale, 1 * scale, 0, 0, Math.PI * 2);
        ctx.ellipse(ax + 3 * scale + legSwing * 0.6, ay + 13 * scale, 1.5 * scale, 1 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body - orange
        ctx.fillStyle = '#D87030';
        ctx.beginPath();
        ctx.ellipse(ax - 2 * scale, ay - 2 * scale - bodyBounce, 12 * scale, 7 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // White belly
        ctx.fillStyle = '#F8F0E8';
        ctx.beginPath();
        ctx.ellipse(ax - 2 * scale, ay + 1 * scale - bodyBounce, 8 * scale, 4 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Front legs
        ctx.fillStyle = '#C06020';
        ctx.beginPath();
        ctx.ellipse(ax - 10 * scale + legSwing * 0.4, ay + 4 * scale, 2 * scale, 9 * scale, 0.1, 0, Math.PI * 2);
        ctx.ellipse(ax + 6 * scale - legSwing * 0.4, ay + 4 * scale, 2 * scale, 9 * scale, -0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.fillStyle = '#D87030';
        ctx.beginPath();
        ctx.ellipse(ax + 12 * scale, ay - 6 * scale - bodyBounce, 6 * scale, 5 * scale, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // White cheeks
        ctx.fillStyle = '#F8F0E8';
        ctx.beginPath();
        ctx.ellipse(ax + 14 * scale, ay - 4 * scale - bodyBounce, 3 * scale, 2.5 * scale, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Snout
        ctx.fillStyle = '#C06020';
        ctx.beginPath();
        ctx.ellipse(ax + 18 * scale, ay - 5 * scale - bodyBounce, 4 * scale, 2.5 * scale, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Nose
        ctx.fillStyle = '#101010';
        ctx.beginPath();
        ctx.arc(ax + 21 * scale, ay - 5 * scale - bodyBounce, 1.2 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = isFleeing ? '#FF4444' : '#FFD020';
        ctx.beginPath();
        ctx.ellipse(ax + 13 * scale, ay - 8 * scale - bodyBounce, 2 * scale, 2.5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(ax + 13.5 * scale, ay - 8 * scale - bodyBounce, 0.8 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Big ears
        ctx.fillStyle = '#D87030';
        ctx.beginPath();
        ctx.moveTo(ax + 8 * scale, ay - 10 * scale - bodyBounce);
        ctx.lineTo(ax + 6 * scale, ay - 20 * scale - bodyBounce);
        ctx.lineTo(ax + 12 * scale, ay - 12 * scale - bodyBounce);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(ax + 14 * scale, ay - 10 * scale - bodyBounce);
        ctx.lineTo(ax + 16 * scale, ay - 19 * scale - bodyBounce);
        ctx.lineTo(ax + 18 * scale, ay - 11 * scale - bodyBounce);
        ctx.closePath();
        ctx.fill();
        
        // Fluffy tail with white tip
        ctx.fillStyle = '#D87030';
        ctx.beginPath();
        ctx.ellipse(ax - 14 * scale, ay - 4 * scale - bodyBounce, 8 * scale, 4 * scale, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#F8F0E8';
        ctx.beginPath();
        ctx.ellipse(ax - 20 * scale, ay - 6 * scale - bodyBounce, 3 * scale, 2 * scale, -0.4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Draw a walking bear - big and powerful
     */
    drawWalkingBear(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number,
        currentTime: number,
        walkCycle: number,
        isFleeing: boolean = false
    ): void {
        const ax = x * T + T / 2;
        const ay = y * T + T / 2;
        const scale = T / 64;
        
        const walkSpeed = isFleeing ? 8 : 3;
        const legSwing = Math.sin(walkCycle * walkSpeed) * 4 * scale;
        const bodyBounce = Math.abs(Math.sin(walkCycle * walkSpeed * 2)) * 2 * scale;
        
        // Big shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(ax, ay + 16 * scale, 18 * scale, 5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Back legs - thick
        ctx.fillStyle = '#5A4030';
        ctx.beginPath();
        ctx.ellipse(ax - 10 * scale - legSwing * 0.3, ay + 8 * scale, 5 * scale, 12 * scale, 0.1, 0, Math.PI * 2);
        ctx.ellipse(ax + 6 * scale + legSwing * 0.3, ay + 8 * scale, 5 * scale, 12 * scale, -0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Big paws
        ctx.fillStyle = '#3A2A20';
        ctx.beginPath();
        ctx.ellipse(ax - 10 * scale - legSwing * 0.5, ay + 18 * scale, 4 * scale, 2 * scale, 0, 0, Math.PI * 2);
        ctx.ellipse(ax + 6 * scale + legSwing * 0.5, ay + 18 * scale, 4 * scale, 2 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Massive body
        ctx.fillStyle = '#6A5040';
        ctx.beginPath();
        ctx.ellipse(ax, ay - 2 * scale - bodyBounce, 20 * scale, 14 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Front legs
        ctx.fillStyle = '#5A4030';
        ctx.beginPath();
        ctx.ellipse(ax - 14 * scale + legSwing * 0.3, ay + 6 * scale, 5 * scale, 13 * scale, 0.1, 0, Math.PI * 2);
        ctx.ellipse(ax + 10 * scale - legSwing * 0.3, ay + 6 * scale, 5 * scale, 13 * scale, -0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Hump/shoulder
        ctx.fillStyle = '#5A4030';
        ctx.beginPath();
        ctx.ellipse(ax - 6 * scale, ay - 14 * scale - bodyBounce, 10 * scale, 8 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.fillStyle = '#6A5040';
        ctx.beginPath();
        ctx.ellipse(ax + 16 * scale, ay - 8 * scale - bodyBounce, 9 * scale, 8 * scale, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Snout
        ctx.fillStyle = '#5A4535';
        ctx.beginPath();
        ctx.ellipse(ax + 24 * scale, ay - 6 * scale - bodyBounce, 6 * scale, 4 * scale, 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Nose
        ctx.fillStyle = '#1A1A1A';
        ctx.beginPath();
        ctx.ellipse(ax + 29 * scale, ay - 6 * scale - bodyBounce, 2 * scale, 1.5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes - small and beady
        ctx.fillStyle = isFleeing ? '#FF4444' : '#1A1A0A';
        ctx.beginPath();
        ctx.arc(ax + 18 * scale, ay - 10 * scale - bodyBounce, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Round ears
        ctx.fillStyle = '#5A4030';
        ctx.beginPath();
        ctx.arc(ax + 10 * scale, ay - 16 * scale - bodyBounce, 4 * scale, 0, Math.PI * 2);
        ctx.arc(ax + 20 * scale, ay - 14 * scale - bodyBounce, 4 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Small tail
        ctx.fillStyle = '#5A4030';
        ctx.beginPath();
        ctx.arc(ax - 18 * scale, ay - 6 * scale - bodyBounce, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Draw wild boar - tusked and bristly
     */
    drawWalkingBoar(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number,
        currentTime: number,
        walkCycle: number,
        isFleeing: boolean = false
    ): void {
        const ax = x * T + T / 2;
        const ay = y * T + T / 2;
        const scale = T / 64;
        
        const walkSpeed = isFleeing ? 10 : 5;
        const legSwing = Math.sin(walkCycle * walkSpeed) * 5 * scale;
        const bodyBounce = Math.abs(Math.sin(walkCycle * walkSpeed * 2)) * 1.5 * scale;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(ax, ay + 13 * scale, 12 * scale, 4 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Back legs
        ctx.fillStyle = '#3A3030';
        ctx.beginPath();
        ctx.ellipse(ax - 7 * scale - legSwing * 0.4, ay + 6 * scale, 3 * scale, 9 * scale, 0.1, 0, Math.PI * 2);
        ctx.ellipse(ax + 4 * scale + legSwing * 0.4, ay + 6 * scale, 3 * scale, 9 * scale, -0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Hooves
        ctx.fillStyle = '#202020';
        ctx.beginPath();
        ctx.ellipse(ax - 7 * scale - legSwing * 0.5, ay + 14 * scale, 2 * scale, 1.5 * scale, 0, 0, Math.PI * 2);
        ctx.ellipse(ax + 4 * scale + legSwing * 0.5, ay + 14 * scale, 2 * scale, 1.5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Stocky body
        ctx.fillStyle = '#4A3A30';
        ctx.beginPath();
        ctx.ellipse(ax - 2 * scale, ay - 2 * scale - bodyBounce, 14 * scale, 9 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Bristly back hair
        ctx.strokeStyle = '#2A2020';
        ctx.lineWidth = 1.5;
        for (let i = -6; i <= 4; i += 2) {
            ctx.beginPath();
            ctx.moveTo(ax + i * scale, ay - 10 * scale - bodyBounce);
            ctx.lineTo(ax + i * scale, ay - 14 * scale - bodyBounce);
            ctx.stroke();
        }
        
        // Front legs
        ctx.fillStyle = '#3A3030';
        ctx.beginPath();
        ctx.ellipse(ax - 10 * scale + legSwing * 0.4, ay + 4 * scale, 3 * scale, 10 * scale, 0.1, 0, Math.PI * 2);
        ctx.ellipse(ax + 7 * scale - legSwing * 0.4, ay + 4 * scale, 3 * scale, 10 * scale, -0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.fillStyle = '#4A3A30';
        ctx.beginPath();
        ctx.ellipse(ax + 12 * scale, ay - 4 * scale - bodyBounce, 8 * scale, 6 * scale, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Snout
        ctx.fillStyle = '#5A4A40';
        ctx.beginPath();
        ctx.ellipse(ax + 20 * scale, ay - 2 * scale - bodyBounce, 5 * scale, 4 * scale, 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Nose disc
        ctx.fillStyle = '#6A5A50';
        ctx.beginPath();
        ctx.ellipse(ax + 24 * scale, ay - 2 * scale - bodyBounce, 3 * scale, 2.5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#303030';
        ctx.beginPath();
        ctx.arc(ax + 23 * scale, ay - 2 * scale - bodyBounce, 0.8 * scale, 0, Math.PI * 2);
        ctx.arc(ax + 25 * scale, ay - 2 * scale - bodyBounce, 0.8 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Tusks
        ctx.fillStyle = '#F0E8E0';
        ctx.beginPath();
        ctx.moveTo(ax + 18 * scale, ay - 1 * scale - bodyBounce);
        ctx.lineTo(ax + 16 * scale, ay - 6 * scale - bodyBounce);
        ctx.lineTo(ax + 19 * scale, ay - 3 * scale - bodyBounce);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(ax + 20 * scale, ay - 1 * scale - bodyBounce);
        ctx.lineTo(ax + 22 * scale, ay - 7 * scale - bodyBounce);
        ctx.lineTo(ax + 22 * scale, ay - 2 * scale - bodyBounce);
        ctx.closePath();
        ctx.fill();
        
        // Eyes - small and angry
        ctx.fillStyle = isFleeing ? '#FF4444' : '#1A1A0A';
        ctx.beginPath();
        ctx.arc(ax + 14 * scale, ay - 6 * scale - bodyBounce, 1.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears
        ctx.fillStyle = '#4A3A30';
        ctx.beginPath();
        ctx.ellipse(ax + 8 * scale, ay - 10 * scale - bodyBounce, 3 * scale, 5 * scale, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Curly tail
        ctx.strokeStyle = '#4A3A30';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ax - 14 * scale, ay - 4 * scale - bodyBounce, 3 * scale, 0, Math.PI * 1.5);
        ctx.stroke();
    }
    
    /**
     * Draw a fish swimming in water
     */
    drawFish(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        T: number,
        currentTime: number
    ): void {
        const ax = x * T + T / 2;
        const ay = y * T + T / 2;
        const scale = T / 64;
        
        const time = currentTime / 1000;
        const swim = Math.sin(time * 4 + x + y) * 3 * scale;
        const tailWag = Math.sin(time * 8 + x * 2) * 0.3;
        
        // Body - shiny fish
        ctx.fillStyle = '#A0B8D0';
        ctx.beginPath();
        ctx.ellipse(ax + swim, ay, 8 * scale, 4 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Scales shimmer
        ctx.fillStyle = '#C0D8E8';
        ctx.beginPath();
        ctx.ellipse(ax + swim - 2 * scale, ay - 1 * scale, 4 * scale, 2 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Tail fin
        ctx.fillStyle = '#8098B0';
        ctx.save();
        ctx.translate(ax + swim - 8 * scale, ay);
        ctx.rotate(tailWag);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-6 * scale, -4 * scale);
        ctx.lineTo(-6 * scale, 4 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        // Dorsal fin
        ctx.fillStyle = '#8098B0';
        ctx.beginPath();
        ctx.moveTo(ax + swim, ay - 4 * scale);
        ctx.lineTo(ax + swim - 3 * scale, ay - 8 * scale);
        ctx.lineTo(ax + swim + 3 * scale, ay - 4 * scale);
        ctx.closePath();
        ctx.fill();
        
        // Eye
        ctx.fillStyle = '#FFD800';
        ctx.beginPath();
        ctx.arc(ax + swim + 4 * scale, ay - 1 * scale, 1.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(ax + swim + 4.5 * scale, ay - 1 * scale, 0.7 * scale, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw a walking elk - like a big deer with huge antlers
     */
    drawWalkingElk(
        ctx: CanvasRenderingContext2D,
        x: number, y: number, T: number,
        currentTime: number, walkCycle: number, isFleeing: boolean
    ): void {
        const ax = x * T + T / 2;
        const ay = y * T + T / 2;
        const scale = T / 64;
        const legSwing = Math.sin(walkCycle * 5) * 4 * scale;
        const bodyBounce = Math.abs(Math.sin(walkCycle * 5)) * 2 * scale;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(ax, ay + 18 * scale, 14 * scale, 5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body - big brown elk
        ctx.fillStyle = '#8B6914';
        ctx.beginPath();
        ctx.ellipse(ax, ay - bodyBounce, 18 * scale, 12 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Legs
        ctx.fillStyle = '#6B5010';
        ctx.fillRect(ax - 10 * scale + legSwing, ay + 4 * scale, 4 * scale, 14 * scale);
        ctx.fillRect(ax + 6 * scale - legSwing, ay + 4 * scale, 4 * scale, 14 * scale);
        
        // Head
        ctx.fillStyle = '#9B7920';
        ctx.beginPath();
        ctx.ellipse(ax + 16 * scale, ay - 6 * scale - bodyBounce, 8 * scale, 6 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // BIG antlers!
        ctx.strokeStyle = '#5A4A30';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ax + 14 * scale, ay - 12 * scale - bodyBounce);
        ctx.lineTo(ax + 8 * scale, ay - 26 * scale);
        ctx.lineTo(ax + 4 * scale, ay - 30 * scale);
        ctx.moveTo(ax + 8 * scale, ay - 26 * scale);
        ctx.lineTo(ax + 14 * scale, ay - 28 * scale);
        ctx.moveTo(ax + 18 * scale, ay - 12 * scale - bodyBounce);
        ctx.lineTo(ax + 24 * scale, ay - 26 * scale);
        ctx.lineTo(ax + 28 * scale, ay - 30 * scale);
        ctx.moveTo(ax + 24 * scale, ay - 26 * scale);
        ctx.lineTo(ax + 18 * scale, ay - 28 * scale);
        ctx.stroke();
        
        // Eye
        ctx.fillStyle = isFleeing ? '#FF4444' : '#000';
        ctx.beginPath();
        ctx.arc(ax + 20 * scale, ay - 7 * scale - bodyBounce, 1.5 * scale, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw a walking goat - mountain climber!
     */
    drawWalkingGoat(
        ctx: CanvasRenderingContext2D,
        x: number, y: number, T: number,
        currentTime: number, walkCycle: number, isFleeing: boolean
    ): void {
        const ax = x * T + T / 2;
        const ay = y * T + T / 2;
        const scale = T / 64;
        const legSwing = Math.sin(walkCycle * 6) * 3 * scale;
        const bodyBounce = Math.abs(Math.sin(walkCycle * 6)) * 1.5 * scale;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(ax, ay + 14 * scale, 10 * scale, 4 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body - fluffy white/grey
        ctx.fillStyle = '#E8E0D8';
        ctx.beginPath();
        ctx.ellipse(ax, ay - bodyBounce, 12 * scale, 8 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Legs
        ctx.fillStyle = '#B0A898';
        ctx.fillRect(ax - 7 * scale + legSwing, ay + 2 * scale, 3 * scale, 12 * scale);
        ctx.fillRect(ax + 4 * scale - legSwing, ay + 2 * scale, 3 * scale, 12 * scale);
        
        // Head
        ctx.fillStyle = '#D8D0C8';
        ctx.beginPath();
        ctx.ellipse(ax + 10 * scale, ay - 4 * scale - bodyBounce, 6 * scale, 5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Horns - curved!
        ctx.strokeStyle = '#8A7A60';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(ax + 8 * scale, ay - 14 * scale - bodyBounce, 6 * scale, 0.5, Math.PI);
        ctx.stroke();
        
        // Beard
        ctx.fillStyle = '#C0B8A8';
        ctx.beginPath();
        ctx.ellipse(ax + 14 * scale, ay + 2 * scale - bodyBounce, 3 * scale, 4 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye
        ctx.fillStyle = isFleeing ? '#FF4444' : '#000';
        ctx.beginPath();
        ctx.arc(ax + 13 * scale, ay - 5 * scale - bodyBounce, 1.2 * scale, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw a walking sheep - fluffy cloud!
     */
    drawWalkingSheep(
        ctx: CanvasRenderingContext2D,
        x: number, y: number, T: number,
        currentTime: number, walkCycle: number, isFleeing: boolean
    ): void {
        const ax = x * T + T / 2;
        const ay = y * T + T / 2;
        const scale = T / 64;
        const legSwing = Math.sin(walkCycle * 4) * 2 * scale;
        const wobble = Math.sin(walkCycle * 4) * 1 * scale;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(ax, ay + 12 * scale, 12 * scale, 4 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Fluffy body - lots of circles!
        ctx.fillStyle = '#FFFEF8';
        ctx.beginPath();
        ctx.arc(ax - 6 * scale + wobble, ay - 2 * scale, 8 * scale, 0, Math.PI * 2);
        ctx.arc(ax + 6 * scale - wobble, ay - 2 * scale, 8 * scale, 0, Math.PI * 2);
        ctx.arc(ax, ay - 6 * scale, 8 * scale, 0, Math.PI * 2);
        ctx.arc(ax, ay + 2 * scale, 7 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Legs - black
        ctx.fillStyle = '#2A2A2A';
        ctx.fillRect(ax - 6 * scale + legSwing, ay + 6 * scale, 2.5 * scale, 8 * scale);
        ctx.fillRect(ax + 4 * scale - legSwing, ay + 6 * scale, 2.5 * scale, 8 * scale);
        
        // Head - black face
        ctx.fillStyle = '#3A3A3A';
        ctx.beginPath();
        ctx.ellipse(ax + 10 * scale, ay - 4 * scale, 5 * scale, 4 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears
        ctx.fillStyle = '#2A2A2A';
        ctx.beginPath();
        ctx.ellipse(ax + 7 * scale, ay - 8 * scale, 2 * scale, 3 * scale, -0.5, 0, Math.PI * 2);
        ctx.ellipse(ax + 13 * scale, ay - 8 * scale, 2 * scale, 3 * scale, 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = isFleeing ? '#FF6666' : '#FFF';
        ctx.beginPath();
        ctx.arc(ax + 12 * scale, ay - 5 * scale, 1.5 * scale, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw a walking llama - elegant, fluffy, and FAST!
     * They're cute and sassy - can't be caught!
     */
    drawWalkingLlama(
        ctx: CanvasRenderingContext2D,
        x: number, y: number, T: number,
        currentTime: number, walkCycle: number, isFleeing: boolean
    ): void {
        const ax = x * T + T / 2;
        const ay = y * T + T / 2;
        const scale = T / 64;
        
        // Llamas have a prancing gait - extra bouncy!
        const legSwing = Math.sin(walkCycle * 5) * 4 * scale;
        const bodyBounce = Math.abs(Math.sin(walkCycle * 5)) * 3 * scale;
        const headBob = Math.sin(walkCycle * 5 + 0.5) * 2 * scale;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(ax, ay + 16 * scale, 14 * scale, 5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Long elegant legs
        ctx.fillStyle = '#C4A882';
        const frontLegOffset = legSwing;
        const backLegOffset = -legSwing;
        // Back legs
        ctx.fillRect(ax - 8 * scale + backLegOffset, ay + 2 * scale, 3 * scale, 14 * scale);
        ctx.fillRect(ax - 3 * scale - backLegOffset, ay + 2 * scale, 3 * scale, 14 * scale);
        // Front legs  
        ctx.fillRect(ax + 3 * scale + frontLegOffset, ay + 2 * scale, 3 * scale, 14 * scale);
        ctx.fillRect(ax + 8 * scale - frontLegOffset, ay + 2 * scale, 3 * scale, 14 * scale);
        
        // Fluffy body - creamy white/tan
        ctx.fillStyle = '#F5EBD7';
        ctx.beginPath();
        ctx.ellipse(ax, ay - 2 * scale - bodyBounce, 14 * scale, 10 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Fluffy chest fluff
        ctx.fillStyle = '#FFFEF5';
        ctx.beginPath();
        ctx.ellipse(ax + 8 * scale, ay - 4 * scale - bodyBounce, 6 * scale, 6 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Long neck - elegant!
        ctx.fillStyle = '#E8DCC8';
        ctx.beginPath();
        ctx.ellipse(ax + 12 * scale, ay - 14 * scale - bodyBounce + headBob, 5 * scale, 12 * scale, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Fluffy neck fur
        ctx.fillStyle = '#F5EBD7';
        ctx.beginPath();
        ctx.ellipse(ax + 11 * scale, ay - 10 * scale - bodyBounce + headBob, 4 * scale, 6 * scale, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Head - cute and oval
        ctx.fillStyle = '#D4C4AA';
        ctx.beginPath();
        ctx.ellipse(ax + 14 * scale, ay - 24 * scale - bodyBounce + headBob, 6 * scale, 5 * scale, 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Cute banana ears!
        ctx.fillStyle = '#C4B498';
        ctx.save();
        ctx.translate(ax + 10 * scale, ay - 28 * scale - bodyBounce + headBob);
        ctx.rotate(-0.4);
        ctx.beginPath();
        ctx.ellipse(0, 0, 2 * scale, 6 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.translate(ax + 18 * scale, ay - 28 * scale - bodyBounce + headBob);
        ctx.rotate(0.4);
        ctx.beginPath();
        ctx.ellipse(0, 0, 2 * scale, 6 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // BIG anime eyes - llamas look smug!
        const eyeY = ay - 24 * scale - bodyBounce + headBob;
        ctx.fillStyle = '#1A0A00';
        ctx.beginPath();
        ctx.ellipse(ax + 12 * scale, eyeY, 2.5 * scale, 3 * scale, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(ax + 18 * scale, eyeY, 2.5 * scale, 3 * scale, -0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye shines - extra sparkly!
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(ax + 11 * scale, eyeY - 1.5 * scale, 1.2 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ax + 17 * scale, eyeY - 1.5 * scale, 1.2 * scale, 0, Math.PI * 2);
        ctx.fill();
        // Smaller secondary shines
        ctx.beginPath();
        ctx.arc(ax + 13 * scale, eyeY + 0.5 * scale, 0.6 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ax + 19 * scale, eyeY + 0.5 * scale, 0.6 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Smug/happy mouth expression
        if (isFleeing) {
            // Smug grin when escaping!
            ctx.strokeStyle = '#8A6A4A';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(ax + 15 * scale, ay - 21 * scale - bodyBounce + headBob, 2.5 * scale, 0.2, Math.PI - 0.2);
            ctx.stroke();
            // Little tongue sticking out - teasing!
            ctx.fillStyle = '#FF9999';
            ctx.beginPath();
            ctx.ellipse(ax + 15 * scale, ay - 18.5 * scale - bodyBounce + headBob, 1.5 * scale, 1 * scale, 0, 0, Math.PI);
            ctx.fill();
        } else {
            // Content little smile
            ctx.strokeStyle = '#8A6A4A';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(ax + 15 * scale, ay - 21 * scale - bodyBounce + headBob, 2 * scale, 0.3, Math.PI - 0.3);
            ctx.stroke();
        }
        
        // Cute nose
        ctx.fillStyle = '#6A5A4A';
        ctx.beginPath();
        ctx.ellipse(ax + 18 * scale, ay - 22 * scale - bodyBounce + headBob, 1.5 * scale, 1 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Blush marks - llamas are cute!
        ctx.fillStyle = 'rgba(255,180,180,0.35)';
        ctx.beginPath();
        ctx.ellipse(ax + 10 * scale, ay - 22 * scale - bodyBounce + headBob, 2 * scale, 1.2 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(ax + 20 * scale, ay - 22 * scale - bodyBounce + headBob, 2 * scale, 1.2 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Fluffy tail
        ctx.fillStyle = '#E8DCC8';
        ctx.beginPath();
        ctx.ellipse(ax - 12 * scale, ay - 4 * scale - bodyBounce, 4 * scale, 3 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw a walking moose - huge with palmate antlers!
     */
    drawWalkingMoose(
        ctx: CanvasRenderingContext2D,
        x: number, y: number, T: number,
        currentTime: number, walkCycle: number, isFleeing: boolean
    ): void {
        const ax = x * T + T / 2;
        const ay = y * T + T / 2;
        const scale = T / 64;
        const legSwing = Math.sin(walkCycle * 4) * 4 * scale;
        const bodyBounce = Math.abs(Math.sin(walkCycle * 4)) * 2.5 * scale;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(ax, ay + 20 * scale, 16 * scale, 6 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body - HUGE dark brown
        ctx.fillStyle = '#4A3A28';
        ctx.beginPath();
        ctx.ellipse(ax, ay - bodyBounce, 20 * scale, 14 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Shoulder hump
        ctx.fillStyle = '#3A2A18';
        ctx.beginPath();
        ctx.ellipse(ax - 4 * scale, ay - 10 * scale - bodyBounce, 10 * scale, 8 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Legs - thick
        ctx.fillStyle = '#3A2818';
        ctx.fillRect(ax - 12 * scale + legSwing, ay + 4 * scale, 5 * scale, 16 * scale);
        ctx.fillRect(ax + 7 * scale - legSwing, ay + 4 * scale, 5 * scale, 16 * scale);
        
        // Long head
        ctx.fillStyle = '#5A4A38';
        ctx.beginPath();
        ctx.ellipse(ax + 18 * scale, ay - 8 * scale - bodyBounce, 10 * scale, 6 * scale, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Bell (dewlap under chin)
        ctx.fillStyle = '#4A3A28';
        ctx.beginPath();
        ctx.ellipse(ax + 20 * scale, ay + 2 * scale - bodyBounce, 3 * scale, 6 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Palmate antlers (flat like hands!)
        ctx.fillStyle = '#6A5A40';
        ctx.beginPath();
        // Left antler
        ctx.ellipse(ax + 8 * scale, ay - 24 * scale - bodyBounce, 8 * scale, 6 * scale, -0.4, 0, Math.PI * 2);
        // Right antler
        ctx.ellipse(ax + 24 * scale, ay - 24 * scale - bodyBounce, 8 * scale, 6 * scale, 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye
        ctx.fillStyle = isFleeing ? '#FF4444' : '#000';
        ctx.beginPath();
        ctx.arc(ax + 24 * scale, ay - 9 * scale - bodyBounce, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw a bird - simple flying/hopping bird
     */
    drawWalkingBird(
        ctx: CanvasRenderingContext2D,
        x: number, y: number, T: number,
        currentTime: number, walkCycle: number, isFleeing: boolean
    ): void {
        const ax = x * T + T / 2;
        const ay = y * T + T / 2;
        const scale = T / 64;
        const hop = Math.abs(Math.sin(walkCycle * 8)) * 4 * scale;
        const wingFlap = Math.sin(walkCycle * 12) * 0.5;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(ax, ay + 8 * scale + hop, 6 * scale, 2 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body - small round bird
        ctx.fillStyle = isFleeing ? '#FF8844' : '#886644';
        ctx.beginPath();
        ctx.ellipse(ax, ay - hop, 6 * scale, 5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Wings
        ctx.fillStyle = isFleeing ? '#AA6622' : '#664422';
        ctx.save();
        ctx.translate(ax - 4 * scale, ay - hop);
        ctx.rotate(wingFlap);
        ctx.beginPath();
        ctx.ellipse(0, 0, 5 * scale, 3 * scale, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        ctx.save();
        ctx.translate(ax + 4 * scale, ay - hop);
        ctx.rotate(-wingFlap);
        ctx.beginPath();
        ctx.ellipse(0, 0, 5 * scale, 3 * scale, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Head
        ctx.fillStyle = isFleeing ? '#FF8844' : '#886644';
        ctx.beginPath();
        ctx.arc(ax + 5 * scale, ay - 4 * scale - hop, 3.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Beak
        ctx.fillStyle = '#FF8800';
        ctx.beginPath();
        ctx.moveTo(ax + 8 * scale, ay - 4 * scale - hop);
        ctx.lineTo(ax + 12 * scale, ay - 3 * scale - hop);
        ctx.lineTo(ax + 8 * scale, ay - 2 * scale - hop);
        ctx.closePath();
        ctx.fill();
        
        // Eye
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(ax + 6 * scale, ay - 5 * scale - hop, 1 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Tail feathers
        ctx.fillStyle = isFleeing ? '#AA6622' : '#664422';
        ctx.beginPath();
        ctx.moveTo(ax - 6 * scale, ay - hop);
        ctx.lineTo(ax - 12 * scale, ay - 2 * scale - hop);
        ctx.lineTo(ax - 10 * scale, ay + 2 * scale - hop);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Draw any entity type
     */
    drawEntity(
        ctx: CanvasRenderingContext2D,
        entity: GameEntity,
        T: number,
        currentTime: number
    ): void {
        if (entity.type === 'BERRY') {
            this.drawBerry(ctx, entity.x, entity.y, T, (entity as BerryEntity).is_poisonous);
        } else if (entity.type === 'NOMAD') {
            this.drawNomad(ctx, entity.x, entity.y, T, currentTime);
        } else if (entity.type === 'DEER') {
            this.drawDeer(ctx, entity.x, entity.y, T, currentTime);
        } else if (entity.type === 'TURTLE') {
            this.drawTurtle(ctx, entity.x, entity.y, T);
        }
        // Add more animal types as needed
    }
}

// Export singleton instance
export const entityRenderer = new EntityRenderer();
