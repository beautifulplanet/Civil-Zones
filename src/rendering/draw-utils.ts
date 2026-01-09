/**
 * Civil Zones - Canvas Drawing Utilities
 * Helper functions for common 2D canvas operations
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type Context2D = CanvasRenderingContext2D;

export interface Point {
    x: number;
    y: number;
}

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Circle {
    x: number;
    y: number;
    radius: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUNDED RECTANGLE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Draw a rounded rectangle path (does not fill or stroke)
 */
export function roundRectPath(
    ctx: Context2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
): void {
    // Clamp radius to half of smallest dimension
    const radius = Math.min(r, w / 2, h / 2);
    
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

/**
 * Fill a rounded rectangle
 */
export function fillRoundRect(
    ctx: Context2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
): void {
    roundRectPath(ctx, x, y, w, h, r);
    ctx.fill();
}

/**
 * Stroke a rounded rectangle
 */
export function strokeRoundRect(
    ctx: Context2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
): void {
    roundRectPath(ctx, x, y, w, h, r);
    ctx.stroke();
}

/**
 * Fill and stroke a rounded rectangle
 */
export function drawRoundRect(
    ctx: Context2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fillStyle?: string,
    strokeStyle?: string
): void {
    roundRectPath(ctx, x, y, w, h, r);
    
    if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }
    
    if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.stroke();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BASIC SHAPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Draw a circle
 */
export function drawCircle(
    ctx: Context2D,
    x: number,
    y: number,
    radius: number,
    fillStyle?: string,
    strokeStyle?: string
): void {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }
    
    if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.stroke();
    }
}

/**
 * Draw an ellipse
 */
export function drawEllipse(
    ctx: Context2D,
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    rotation: number = 0,
    fillStyle?: string,
    strokeStyle?: string
): void {
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2);
    
    if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }
    
    if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.stroke();
    }
}

/**
 * Draw a line
 */
export function drawLine(
    ctx: Context2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    strokeStyle: string,
    lineWidth: number = 1
): void {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

/**
 * Draw a polygon from points
 */
export function drawPolygon(
    ctx: Context2D,
    points: Point[],
    fillStyle?: string,
    strokeStyle?: string
): void {
    if (points.length < 3) return;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.closePath();
    
    if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }
    
    if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.stroke();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BEZIER CURVES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Draw a quadratic bezier curve
 */
export function drawQuadraticCurve(
    ctx: Context2D,
    x1: number,
    y1: number,
    cpX: number,
    cpY: number,
    x2: number,
    y2: number,
    strokeStyle: string,
    lineWidth: number = 1
): void {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(cpX, cpY, x2, y2);
    ctx.stroke();
}

/**
 * Draw a cubic bezier curve
 */
export function drawBezierCurve(
    ctx: Context2D,
    x1: number,
    y1: number,
    cp1X: number,
    cp1Y: number,
    cp2X: number,
    cp2Y: number,
    x2: number,
    y2: number,
    strokeStyle: string,
    lineWidth: number = 1
): void {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, x2, y2);
    ctx.stroke();
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEXT DRAWING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Draw text with optional shadow
 */
export function drawText(
    ctx: Context2D,
    text: string,
    x: number,
    y: number,
    options: {
        font?: string;
        fillStyle?: string;
        align?: CanvasTextAlign;
        baseline?: CanvasTextBaseline;
        shadow?: {
            color: string;
            blur: number;
            offsetX?: number;
            offsetY?: number;
        };
    } = {}
): void {
    const {
        font = '12px sans-serif',
        fillStyle = '#FFFFFF',
        align = 'left',
        baseline = 'alphabetic',
        shadow
    } = options;
    
    ctx.font = font;
    ctx.fillStyle = fillStyle;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    
    if (shadow) {
        ctx.shadowColor = shadow.color;
        ctx.shadowBlur = shadow.blur;
        ctx.shadowOffsetX = shadow.offsetX || 0;
        ctx.shadowOffsetY = shadow.offsetY || 0;
    }
    
    ctx.fillText(text, x, y);
    
    // Reset shadow
    if (shadow) {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
}

/**
 * Draw text with outline
 */
export function drawTextWithOutline(
    ctx: Context2D,
    text: string,
    x: number,
    y: number,
    fillStyle: string,
    strokeStyle: string,
    font: string = '12px sans-serif',
    lineWidth: number = 2
): void {
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw outline first
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.strokeText(text, x, y);
    
    // Then fill
    ctx.fillStyle = fillStyle;
    ctx.fillText(text, x, y);
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRADIENTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a radial gradient for 3D sphere effect
 */
export function createSphereGradient(
    ctx: Context2D,
    x: number,
    y: number,
    radius: number,
    lightColor: string,
    midColor: string,
    darkColor: string
): CanvasGradient {
    // Offset highlight toward upper-left
    const gradient = ctx.createRadialGradient(
        x - radius * 0.3,
        y - radius * 0.3,
        radius * 0.1,
        x,
        y,
        radius
    );
    
    gradient.addColorStop(0, lightColor);
    gradient.addColorStop(0.5, midColor);
    gradient.addColorStop(1, darkColor);
    
    return gradient;
}

/**
 * Create a linear gradient
 */
export function createLinearGradient(
    ctx: Context2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    stops: Array<{ offset: number; color: string }>
): CanvasGradient {
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    
    for (const stop of stops) {
        gradient.addColorStop(stop.offset, stop.color);
    }
    
    return gradient;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSFORMS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Execute drawing with rotation around a point
 */
export function withRotation(
    ctx: Context2D,
    x: number,
    y: number,
    angle: number,
    draw: () => void
): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.translate(-x, -y);
    draw();
    ctx.restore();
}

/**
 * Execute drawing with scale around a point
 */
export function withScale(
    ctx: Context2D,
    x: number,
    y: number,
    scaleX: number,
    scaleY: number,
    draw: () => void
): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-x, -y);
    draw();
    ctx.restore();
}

/**
 * Execute drawing with alpha
 */
export function withAlpha(
    ctx: Context2D,
    alpha: number,
    draw: () => void
): void {
    const prevAlpha = ctx.globalAlpha;
    ctx.globalAlpha = alpha;
    draw();
    ctx.globalAlpha = prevAlpha;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLIPPING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Execute drawing with rectangular clip region
 */
export function withClip(
    ctx: Context2D,
    x: number,
    y: number,
    w: number,
    h: number,
    draw: () => void
): void {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    draw();
    ctx.restore();
}

/**
 * Execute drawing with circular clip region
 */
export function withCircularClip(
    ctx: Context2D,
    x: number,
    y: number,
    radius: number,
    draw: () => void
): void {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();
    draw();
    ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Draw stipple dots (for cartographic effect)
 */
export function drawStipple(
    ctx: Context2D,
    x: number,
    y: number,
    width: number,
    height: number,
    density: number,
    color: string,
    dotSize: number = 1
): void {
    ctx.fillStyle = color;
    
    const count = Math.floor(width * height * density);
    
    for (let i = 0; i < count; i++) {
        const dx = Math.random() * width;
        const dy = Math.random() * height;
        ctx.fillRect(x + dx, y + dy, dotSize, dotSize);
    }
}

/**
 * Draw hatching lines (for elevation effect)
 */
export function drawHatching(
    ctx: Context2D,
    x: number,
    y: number,
    width: number,
    height: number,
    spacing: number,
    angle: number,
    color: string,
    lineWidth: number = 0.5
): void {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const diagonal = Math.sqrt(width * width + height * height);
    
    for (let d = -diagonal; d < diagonal; d += spacing) {
        const startX = x + width / 2 + d * cos - diagonal * sin;
        const startY = y + height / 2 + d * sin + diagonal * cos;
        const endX = x + width / 2 + d * cos + diagonal * sin;
        const endY = y + height / 2 + d * sin - diagonal * cos;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
    
    ctx.restore();
}
