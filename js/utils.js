// ═══════════════════════════════════════════════════════════════════════════════
// CIVIL ZONES: STONE AGE - Utilities
// ═══════════════════════════════════════════════════════════════════════════════
// Common utility functions with error handling
// ═══════════════════════════════════════════════════════════════════════════════

const Utils = {
    // ─────────────────────────────────────────────────────────────────────────
    // Random Helpers
    // ─────────────────────────────────────────────────────────────────────────
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    },

    chance(probability) {
        return Math.random() < probability;
    },

    pick(array) {
        if (!array || array.length === 0) return null;
        return array[Math.floor(Math.random() * array.length)];
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Simplex Noise Implementation (for terrain generation)
    // ─────────────────────────────────────────────────────────────────────────
    createNoise(seed = Math.random() * 10000) {
        // Permutation table
        const perm = new Uint8Array(512);
        const permMod = new Uint8Array(512);
        
        // Initialize permutation with seed
        const p = [];
        for (let i = 0; i < 256; i++) p[i] = i;
        
        // Seed-based shuffle
        let s = seed;
        for (let i = 255; i > 0; i--) {
            s = (s * 16807) % 2147483647;
            const j = s % (i + 1);
            [p[i], p[j]] = [p[j], p[i]];
        }
        
        for (let i = 0; i < 512; i++) {
            perm[i] = p[i & 255];
            permMod[i] = perm[i] % 12;
        }

        // Gradients for 2D
        const grad3 = [
            [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
            [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
            [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
        ];

        function dot(g, x, y) {
            return g[0] * x + g[1] * y;
        }

        // 2D Simplex noise
        return function(xin, yin) {
            const F2 = 0.5 * (Math.sqrt(3) - 1);
            const G2 = (3 - Math.sqrt(3)) / 6;

            let n0, n1, n2;
            const s = (xin + yin) * F2;
            const i = Math.floor(xin + s);
            const j = Math.floor(yin + s);
            const t = (i + j) * G2;
            const X0 = i - t;
            const Y0 = j - t;
            const x0 = xin - X0;
            const y0 = yin - Y0;

            let i1, j1;
            if (x0 > y0) { i1 = 1; j1 = 0; }
            else { i1 = 0; j1 = 1; }

            const x1 = x0 - i1 + G2;
            const y1 = y0 - j1 + G2;
            const x2 = x0 - 1 + 2 * G2;
            const y2 = y0 - 1 + 2 * G2;

            const ii = i & 255;
            const jj = j & 255;

            let t0 = 0.5 - x0 * x0 - y0 * y0;
            if (t0 < 0) n0 = 0;
            else {
                t0 *= t0;
                n0 = t0 * t0 * dot(grad3[permMod[ii + perm[jj]]], x0, y0);
            }

            let t1 = 0.5 - x1 * x1 - y1 * y1;
            if (t1 < 0) n1 = 0;
            else {
                t1 *= t1;
                n1 = t1 * t1 * dot(grad3[permMod[ii + i1 + perm[jj + j1]]], x1, y1);
            }

            let t2 = 0.5 - x2 * x2 - y2 * y2;
            if (t2 < 0) n2 = 0;
            else {
                t2 *= t2;
                n2 = t2 * t2 * dot(grad3[permMod[ii + 1 + perm[jj + 1]]], x2, y2);
            }

            return 70 * (n0 + n1 + n2);
        };
    },

    // Multi-octave noise for more natural terrain
    octaveNoise(noise, x, y, octaves = 4, persistence = 0.5, scale = 0.02) {
        let total = 0;
        let frequency = scale;
        let amplitude = 1;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            total += noise(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }

        return total / maxValue;
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Error Handling Wrapper
    // ─────────────────────────────────────────────────────────────────────────
    safe(fn, errorMsg = 'Unknown error', defaultReturn = null) {
        try {
            return fn();
        } catch (e) {
            console.error(`[ERROR] ${errorMsg}:`, e.message);
            return defaultReturn;
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Distance Calculations
    // ─────────────────────────────────────────────────────────────────────────
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    manhattanDistance(x1, y1, x2, y2) {
        return Math.abs(x2 - x1) + Math.abs(y2 - y1);
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Clamp & Math
    // ─────────────────────────────────────────────────────────────────────────
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Formatting
    // ─────────────────────────────────────────────────────────────────────────
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    },

    formatYear(year) {
        if (year < 0) {
            const absYear = Math.abs(year);
            if (absYear >= 1000000) return (absYear / 1000000).toFixed(1) + ' Million BCE';
            if (absYear >= 1000) return (absYear / 1000).toFixed(0) + ',000 BCE';
            return absYear + ' BCE';
        }
        return year + ' CE';
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Toast Notification
    // ─────────────────────────────────────────────────────────────────────────
    toasts: [],
    toastContainer: null,
    
    showToast(message, type = 'info', duration = 3000) {
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'toast-container';
            document.body.appendChild(this.toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        this.toastContainer.appendChild(toast);

        // Fade in
        requestAnimationFrame(() => toast.classList.add('show'));

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Local Storage with Error Handling
    // ─────────────────────────────────────────────────────────────────────────
    saveLocal(key, data) {
        return this.safe(() => {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        }, `Failed to save ${key}`, false);
    },

    loadLocal(key, defaultValue = null) {
        return this.safe(() => {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        }, `Failed to load ${key}`, defaultValue);
    },
};

window.Utils = Utils;
