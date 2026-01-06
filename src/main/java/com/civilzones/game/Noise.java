package com.civilzones.game;

/**
 * Perlin noise generator for terrain generation
 * Converted from JavaScript Noise object
 */
public class Noise {
    
    private int seed;
    
    public Noise(int seed) {
        this.seed = seed;
    }
    
    public void setSeed(int seed) {
        this.seed = seed;
    }
    
    /**
     * Hash function for pseudo-random values
     */
    private double hash(double x, double y) {
        double h = Math.sin(x * 12.98 + y * 78.23 + seed) * 43758.54;
        return h - Math.floor(h);
    }
    
    /**
     * Linear interpolation
     */
    private double mix(double a, double b, double t) {
        return a * (1 - t) + b * t;
    }
    
    /**
     * Value noise at point (x, y)
     */
    public double value(double x, double y) {
        int i = (int) Math.floor(x);
        int j = (int) Math.floor(y);
        double fx = x - i;
        double fy = y - j;
        
        // Smoothstep
        double ux = fx * fx * (3 - 2 * fx);
        double uy = fy * fy * (3 - 2 * fy);
        
        double a = hash(i, j);
        double b = hash(i + 1, j);
        double c = hash(i, j + 1);
        double d = hash(i + 1, j + 1);
        
        return mix(mix(a, b, ux), mix(c, d, ux), uy);
    }
    
    /**
     * Fractal Brownian Motion (multi-octave noise)
     */
    public double fbm(double x, double y) {
        return fbm(x, y, 5, 0.5);
    }
    
    /**
     * FBM with configurable octaves and persistence
     */
    public double fbm(double x, double y, int octaves, double persistence) {
        double total = 0;
        double amplitude = persistence;
        double frequency = 1;
        double maxValue = 0;
        
        for (int i = 0; i < octaves; i++) {
            total += value(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            x *= 2;
            y *= 2;
            amplitude *= persistence;
        }
        
        return total / maxValue;
    }
    
    /**
     * Turbulence noise (absolute value of FBM)
     */
    public double turbulence(double x, double y, int octaves) {
        double total = 0;
        double amplitude = 1;
        double frequency = 1;
        
        for (int i = 0; i < octaves; i++) {
            total += Math.abs(value(x * frequency, y * frequency) - 0.5) * 2 * amplitude;
            frequency *= 2;
            amplitude *= 0.5;
        }
        
        return total;
    }
    
    /**
     * Ridge noise (inverted turbulence)
     */
    public double ridge(double x, double y, int octaves) {
        return 1 - turbulence(x, y, octaves);
    }
    
    /**
     * Worley/cellular noise (distance to nearest point)
     */
    public double worley(double x, double y) {
        int xi = (int) Math.floor(x);
        int yi = (int) Math.floor(y);
        
        double minDist = 1;
        
        for (int dx = -1; dx <= 1; dx++) {
            for (int dy = -1; dy <= 1; dy++) {
                int nx = xi + dx;
                int ny = yi + dy;
                
                // Random point in cell
                double px = nx + hash(nx, ny);
                double py = ny + hash(ny, nx);
                
                double dist = Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
                minDist = Math.min(minDist, dist);
            }
        }
        
        return minDist;
    }
}
