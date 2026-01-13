/**
 * Civil Zones - Player Renderer (Logical Larry)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Cute caveman character with fur tunic, stone club, and animated expressions
 * NOW with walking leg animation and bash swing!
 * Ported from index.html player drawing section
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { CFG } from '../config/game-config.js';

export interface Player {
    x: number;
    y: number;
    direction: 'up' | 'down' | 'left' | 'right';
    hp: number;
    maxHp: number;
    bashTime?: number;
    walkCycle?: number;  // Walking animation cycle (0-2π)
    isMoving?: boolean;  // Whether player is currently walking
}

/**
 * Player Renderer - Draws Logical Larry the cute caveman
 */
export class PlayerRenderer {
    
    /**
     * Draw the player character - Cute Chibi Caveman
     * High contrast colors, round friendly shapes
     */
    drawPlayer(
        ctx: CanvasRenderingContext2D,
        player: Player,
        T: number,
        currentTime: number
    ): void {
        const px = player.x * T + T / 2;
        const py = player.y * T + T / 2;
        const s = T / 32;
        const dir = player.direction || 'down';
        
        const isBashing = player.bashTime && (currentTime - player.bashTime) < 400;
        const bashProgress = isBashing && player.bashTime ? (currentTime - player.bashTime) / 400 : 0;
        const facing = (dir === 'right') ? 1 : (dir === 'left') ? -1 : 0;
        const facingY = (dir === 'down') ? 1 : (dir === 'up') ? -1 : 0;
        
        const walkCycle = player.walkCycle || 0;
        const isWalking = player.isMoving || false;
        const bounce = isWalking ? Math.abs(Math.sin(walkCycle * 5)) * 2 * s : 0;
        const legFrame = isWalking ? Math.floor((walkCycle * 4) % 2) : 0;
        
        // ═══════════════════════════════════════════════════════════
        // FRED FLINTSTONE STYLE CAVEMAN - ZEBRA TUNIC
        // Warm tan skin, zebra striped tunic, dark messy hair
        // ═══════════════════════════════════════════════════════════
        
        // Color palette - Caveman with zebra hide
        const SKIN = '#D4A574';      // Warm tan skin (like Fred)
        const SKIN_DARK = '#B8906A'; // Skin shadow
        const SKIN_LIGHT = '#E8BC8A';// Skin highlight
        const TUNIC = '#F5F0E6';     // Off-white zebra base
        const TUNIC_DARK = '#D0C8BC';// Tunic shadow/edge
        const STRIPE = '#1A1A1A';    // Black zebra stripes
        const HAIR = '#1A1008';      // Very dark brown/black hair
        const OUTLINE = '#2D1F11';   // Dark brown outlines
        
        // Shadow on ground
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(px, py + 14 * s, 8 * s, 3 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // ─── BARE FEET (Caveman style - no shoes!) ───
        const footY = py + 12 * s;
        const footSpread = legFrame === 1 && isWalking ? 6 : 4;
        
        // Feet - warm tan skin
        ctx.fillStyle = SKIN;
        ctx.beginPath();
        ctx.ellipse(px - footSpread * s, footY, 4 * s, 2.5 * s, 0, 0, Math.PI * 2);
        ctx.ellipse(px + footSpread * s, footY, 4 * s, 2.5 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        // Foot outline
        ctx.strokeStyle = SKIN_DARK;
        ctx.lineWidth = 1 * s;
        ctx.stroke();
        
        // ─── LEGS (Bare skin - caveman!) ───
        ctx.fillStyle = SKIN;
        // Left leg
        ctx.beginPath();
        ctx.moveTo(px - 6 * s, py + 5 * s - bounce);
        ctx.lineTo(px - footSpread * s - 2 * s, footY - 1 * s);
        ctx.lineTo(px - footSpread * s + 2 * s, footY - 1 * s);
        ctx.lineTo(px - 2 * s, py + 5 * s - bounce);
        ctx.closePath();
        ctx.fill();
        // Right leg
        ctx.beginPath();
        ctx.moveTo(px + 2 * s, py + 5 * s - bounce);
        ctx.lineTo(px + footSpread * s - 2 * s, footY - 1 * s);
        ctx.lineTo(px + footSpread * s + 2 * s, footY - 1 * s);
        ctx.lineTo(px + 6 * s, py + 5 * s - bounce);
        ctx.closePath();
        ctx.fill();
        
        // ─── BODY (Zebra tunic with ragged edge!) ───
        ctx.fillStyle = TUNIC;
        ctx.beginPath();
        ctx.moveTo(px - 10 * s, py - 8 * s - bounce); // Left shoulder
        ctx.lineTo(px + 10 * s, py - 8 * s - bounce); // Right shoulder
        ctx.lineTo(px + 9 * s, py + 6 * s - bounce);  // Right hip
        // Ragged bottom edge (zigzag)
        ctx.lineTo(px + 7 * s, py + 4 * s - bounce);
        ctx.lineTo(px + 5 * s, py + 7 * s - bounce);
        ctx.lineTo(px + 2 * s, py + 4 * s - bounce);
        ctx.lineTo(px, py + 6 * s - bounce);
        ctx.lineTo(px - 2 * s, py + 4 * s - bounce);
        ctx.lineTo(px - 5 * s, py + 7 * s - bounce);
        ctx.lineTo(px - 7 * s, py + 4 * s - bounce);
        ctx.lineTo(px - 9 * s, py + 6 * s - bounce);  // Left hip
        ctx.closePath();
        ctx.fill();
        
        // Tunic outline
        ctx.strokeStyle = TUNIC_DARK;
        ctx.lineWidth = 1.5 * s;
        ctx.stroke();
        
        // Zebra stripes on tunic!
        ctx.fillStyle = STRIPE;
        ctx.lineWidth = 2.5 * s;
        ctx.lineCap = 'round';
        // Diagonal stripes across tunic
        ctx.beginPath();
        ctx.moveTo(px - 8 * s, py - 6 * s - bounce);
        ctx.lineTo(px - 5 * s, py + 3 * s - bounce);
        ctx.lineTo(px - 3 * s, py + 3 * s - bounce);
        ctx.lineTo(px - 6 * s, py - 6 * s - bounce);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(px - 2 * s, py - 7 * s - bounce);
        ctx.lineTo(px + 1 * s, py + 2 * s - bounce);
        ctx.lineTo(px + 3 * s, py + 2 * s - bounce);
        ctx.lineTo(px, py - 7 * s - bounce);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(px + 4 * s, py - 7 * s - bounce);
        ctx.lineTo(px + 7 * s, py + 4 * s - bounce);
        ctx.lineTo(px + 9 * s, py + 4 * s - bounce);
        ctx.lineTo(px + 6 * s, py - 7 * s - bounce);
        ctx.closePath();
        ctx.fill();
        
        // ─── HEAD (Round friendly face) ───
        // Main head shape
        ctx.fillStyle = SKIN;
        ctx.beginPath();
        ctx.arc(px, py - 14 * s - bounce, 11 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = SKIN_DARK;
        ctx.lineWidth = 1.5 * s;
        ctx.stroke();
        
        // ─── HAIR (Messy dark caveman hair) ───
        ctx.fillStyle = HAIR;
        // Main hair mass on top
        ctx.beginPath();
        ctx.arc(px, py - 21 * s - bounce, 9 * s, 0, Math.PI * 2);
        ctx.fill();
        // Messy tufts sticking out
        ctx.beginPath();
        ctx.arc(px - 8 * s, py - 18 * s - bounce, 5 * s, 0, Math.PI * 2);
        ctx.arc(px + 8 * s, py - 18 * s - bounce, 5 * s, 0, Math.PI * 2);
        ctx.fill();
        // Top tufts (irregular, not spiky)
        ctx.beginPath();
        ctx.arc(px - 4 * s, py - 27 * s - bounce, 3 * s, 0, Math.PI * 2);
        ctx.arc(px + 3 * s, py - 26 * s - bounce, 3.5 * s, 0, Math.PI * 2);
        ctx.arc(px, py - 25 * s - bounce, 4 * s, 0, Math.PI * 2);
        ctx.fill();
        
        // ─── FACE ───
        // Big round nose (Fred's prominent feature!)
        ctx.fillStyle = SKIN_LIGHT;
        ctx.beginPath();
        ctx.arc(px + facing * 2 * s, py - 10 * s - bounce, 4 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = SKIN_DARK;
        ctx.lineWidth = 1 * s;
        ctx.stroke();
        
        // Eyes (simple but expressive)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(px - 4 * s, py - 15 * s - bounce, 3.5 * s, 4 * s, 0, 0, Math.PI * 2);
        ctx.ellipse(px + 4 * s, py - 15 * s - bounce, 3.5 * s, 4 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1 * s;
        ctx.stroke();
        
        // Pupils
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(px - 4 * s + facing * 1.5 * s, py - 14 * s - bounce + facingY * s, 2 * s, 0, Math.PI * 2);
        ctx.arc(px + 4 * s + facing * 1.5 * s, py - 14 * s - bounce + facingY * s, 2 * s, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye shine
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(px - 5 * s, py - 16 * s - bounce, 1 * s, 0, Math.PI * 2);
        ctx.arc(px + 3 * s, py - 16 * s - bounce, 1 * s, 0, Math.PI * 2);
        ctx.fill();
        
        // Mouth
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.5 * s;
        ctx.lineCap = 'round';
        if (isBashing) {
            // Open mouth yelling
            ctx.fillStyle = '#4A1A0A';
            ctx.beginPath();
            ctx.ellipse(px, py - 5 * s - bounce, 4 * s, 3 * s, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else {
            // Friendly smile
            ctx.beginPath();
            ctx.arc(px, py - 6 * s - bounce, 3 * s, 0.2, Math.PI - 0.2);
            ctx.stroke();
        }
        
        // Eyebrows (thick caveman brows!)
        ctx.strokeStyle = HAIR;
        ctx.lineWidth = 2.5 * s;
        ctx.lineCap = 'round';
        if (isBashing) {
            // Angry brows
            ctx.beginPath();
            ctx.moveTo(px - 7 * s, py - 20 * s - bounce);
            ctx.lineTo(px - 2 * s, py - 18 * s - bounce);
            ctx.moveTo(px + 7 * s, py - 20 * s - bounce);
            ctx.lineTo(px + 2 * s, py - 18 * s - bounce);
            ctx.stroke();
        } else {
            // Normal brows
            ctx.beginPath();
            ctx.moveTo(px - 7 * s, py - 19 * s - bounce);
            ctx.lineTo(px - 1 * s, py - 19 * s - bounce);
            ctx.moveTo(px + 7 * s, py - 19 * s - bounce);
            ctx.lineTo(px + 1 * s, py - 19 * s - bounce);
            ctx.stroke();
        }
        
        // ─── ARMS (Bare skin) ───
        ctx.strokeStyle = SKIN;
        ctx.lineWidth = 5 * s;
        ctx.lineCap = 'round';
        
        // Left arm
        const armSwing = isWalking ? Math.sin(walkCycle * 5) * 3 * s : 0;
        ctx.beginPath();
        ctx.moveTo(px - 10 * s, py - 6 * s - bounce);
        ctx.lineTo(px - 14 * s + armSwing, py + 2 * s - bounce);
        ctx.stroke();
        // Left hand
        ctx.fillStyle = SKIN;
        ctx.beginPath();
        ctx.arc(px - 14 * s + armSwing, py + 3 * s - bounce, 3.5 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = SKIN_DARK;
        ctx.lineWidth = 1 * s;
        ctx.stroke();
        
        // Right arm + CLUB
        ctx.save();
        let clubAngle = 0.5;
        if (isBashing) {
            clubAngle = 0.5 - Math.sin(bashProgress * Math.PI) * 2.5;
        }
        
        ctx.translate(px + 10 * s, py - 6 * s - bounce);
        ctx.rotate(clubAngle);
        
        // Arm
        ctx.strokeStyle = SKIN;
        ctx.lineWidth = 5 * s;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(6 * s, 6 * s);
        ctx.stroke();
        
        // Hand
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.arc(6 * s, 7 * s, 3 * s, 0, Math.PI * 2);
        ctx.fill();
        
        // CLUB
        // Handle (wood brown)
        ctx.fillStyle = '#8D6E63';
        ctx.beginPath();
        ctx.roundRect(4 * s, 8 * s, 4 * s, 12 * s, 2 * s);
        ctx.fill();
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 1.5 * s;
        ctx.stroke();
        
        // Club head (gray stone)
        ctx.fillStyle = '#78909C';
        ctx.beginPath();
        ctx.ellipse(6 * s, 22 * s, 7 * s, 9 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#546E7A';
        ctx.lineWidth = 2 * s;
        ctx.stroke();
        
        // Stone bumps
        ctx.fillStyle = '#90A4AE';
        ctx.beginPath();
        ctx.arc(3 * s, 19 * s, 2.5 * s, 0, Math.PI * 2);
        ctx.arc(9 * s, 23 * s, 2 * s, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // ─── BASH EFFECT ───
        if (isBashing && bashProgress > 0.3 && bashProgress < 0.7) {
            const ex = px + 20 * s;
            const ey = py + 12 * s;
            
            // Yellow star burst
            ctx.fillStyle = '#FFEB3B';
            ctx.beginPath();
            for (let i = 0; i < 10; i++) {
                const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
                const r = i % 2 === 0 ? 10 * s : 5 * s;
                const x = ex + Math.cos(a) * r;
                const y = ey + Math.sin(a) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#FFC107';
            ctx.lineWidth = 2 * s;
            ctx.stroke();
        }
    }
    
    /**
     * Helper to draw rounded rectangle
     */
    private roundRect(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number,
        r: number
    ): void {
        if (r > w / 2) r = w / 2;
        if (r > h / 2) r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
    
    /**
     * Draw player health indicator
     */
    drawHealthBar(
        ctx: CanvasRenderingContext2D,
        player: Player,
        T: number
    ): void {
        const px = player.x * T + T / 2;
        const py = player.y * T;
        const scale = T / 64;
        
        const barWidth = 20 * scale;
        const barHeight = 4 * scale;
        const barX = px - barWidth / 2;
        const barY = py - 30 * scale;
        
        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
        
        // Health bar
        const healthPct = player.hp / player.maxHp;
        const healthColor = healthPct > 0.5 ? '#4CAF50' : healthPct > 0.25 ? '#FFC107' : '#F44336';
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * healthPct, barHeight);
        
        // Border
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}

// Export singleton instance
export const playerRenderer = new PlayerRenderer();
