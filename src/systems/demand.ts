/**
 * Civil Zones - RCI Demand System
 * SimCity-style interdependent zone demand calculation
 * 
 * R demand: People want to live where there are jobs (C+I)
 * C demand: Commerce needs customers (R) AND goods to sell (I)
 * I demand: Industry needs workers (R) AND buyers for goods (C)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** RCI demand values (0-100 scale, higher = more needed) */
export interface RCIDemand {
    r: number;  // Residential demand
    c: number;  // Commercial demand
    i: number;  // Industrial demand
}

/** Zone counts for demand calculation */
export interface ZoneCounts {
    residential: number;
    commercial: number;
    industrial: number;
}

/** Population/housing data for demand calculation */
export interface DemandPopulationData {
    population: number;
    housingCapacity: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEMAND CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

/** Workers per commercial zone */
const JOBS_PER_COMMERCIAL = 10;

/** Workers per industrial zone */
const JOBS_PER_INDUSTRIAL = 15;

/** Ideal ratio of commercial to residential */
const IDEAL_COMMERCIAL_RATIO = 0.5;

/** Ideal ratio of industrial to residential */
const IDEAL_INDUSTRIAL_RATIO = 0.5;

/**
 * Calculate RCI demand based on zone counts and population
 * Returns demand values 0-100 where higher = more of that zone type needed
 */
export function calculateRCIDemand(
    zones: ZoneCounts,
    popData: DemandPopulationData
): RCIDemand {
    const { residential: resCount, commercial: comCount, industrial: indCount } = zones;
    const { population: pop, housingCapacity: housingCap } = popData;
    
    const totalZones = resCount + comCount + indCount;
    
    // Jobs come from Commercial (10 each) and Industrial (15 each)
    const jobCapacity = (comCount * JOBS_PER_COMMERCIAL) + (indCount * JOBS_PER_INDUSTRIAL);
    const unemployed = Math.max(0, pop - jobCapacity);
    const housingNeed = housingCap > 0 ? (housingCap - pop) / housingCap : 0;
    
    // === RESIDENTIAL DEMAND ===
    const rDemand = calculateResidentialDemand(
        totalZones, resCount, comCount, indCount, pop, housingCap, housingNeed, jobCapacity
    );
    
    // === COMMERCIAL DEMAND ===
    const cDemand = calculateCommercialDemand(resCount, comCount, indCount);
    
    // === INDUSTRIAL DEMAND ===
    const iDemand = calculateIndustrialDemand(resCount, comCount, indCount, pop, unemployed);
    
    // Clamp all demands 0-100
    return {
        r: clamp(rDemand, 0, 100),
        c: clamp(cDemand, 0, 100),
        i: clamp(iDemand, 0, 100)
    };
}

/**
 * Calculate residential demand
 * High when: jobs available but housing full, or C+I exist but R doesn't
 */
function calculateResidentialDemand(
    totalZones: number,
    resCount: number,
    comCount: number,
    indCount: number,
    pop: number,
    housingCap: number,
    housingNeed: number,
    jobCapacity: number
): number {
    if (totalZones === 0) {
        return 100; // Nothing built - need residential first!
    }
    
    if (housingNeed < 0.2 && jobCapacity > pop * 0.5) {
        return 80; // Housing nearly full but jobs available
    }
    
    if (comCount + indCount > resCount * 0.5) {
        return 60; // More industry than people to work it
    }
    
    if (pop < housingCap * 0.5) {
        return 40; // Room to grow
    }
    
    return Math.max(10, 50 - (resCount / Math.max(1, comCount + indCount)) * 10);
}

/**
 * Calculate commercial demand
 * Needs BOTH residential (customers) AND industrial (goods to sell)
 */
function calculateCommercialDemand(
    resCount: number,
    comCount: number,
    indCount: number
): number {
    if (resCount === 0) {
        return 10; // No customers yet
    }
    
    if (comCount === 0 && resCount > 0) {
        return 90; // People but no shops!
    }
    
    const customersPerCom = comCount / resCount;
    const goodsSupply = indCount > 0 ? comCount / indCount : 0;
    
    if (customersPerCom < 0.3 && indCount > 0) {
        return 70; // Not enough shops for the people
    }
    
    if (goodsSupply > 2) {
        return 20; // Too many shops, not enough goods
    }
    
    // Calculate based on ideal ratio
    const actualRatio = comCount / resCount;
    return Math.max(10, Math.min(80, (IDEAL_COMMERCIAL_RATIO - actualRatio) * 100 + 50));
}

/**
 * Calculate industrial demand
 * Industry provides: jobs for R, goods for C
 */
function calculateIndustrialDemand(
    resCount: number,
    comCount: number,
    indCount: number,
    pop: number,
    unemployed: number
): number {
    if (resCount === 0) {
        return 10; // No workers yet
    }
    
    if (indCount === 0 && resCount > 0) {
        return 80; // People but no industry!
    }
    
    if (comCount > indCount * 2) {
        return 90; // Commerce needs goods to sell!
    }
    
    if (unemployed > pop * 0.3) {
        return 70; // People need jobs
    }
    
    // Calculate based on ideal ratio
    const actualRatio = indCount / resCount;
    return Math.max(10, Math.min(80, (IDEAL_INDUSTRIAL_RATIO - actualRatio) * 100 + 50));
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEMAND BAR VISUALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

/** Demand bar colors */
export const DEMAND_COLORS = {
    residential: '#4CAF50',  // Green
    commercial: '#2196F3',   // Blue
    industrial: '#FF9800'    // Orange
} as const;

/**
 * Get demand bar height (0-100 scale)
 * Used for UI visualization
 */
export function getDemandBarHeight(demand: number, maxHeight: number = 100): number {
    return (clamp(demand, 0, 100) / 100) * maxHeight;
}

/**
 * Get demand description for tooltip
 */
export function getDemandDescription(type: 'r' | 'c' | 'i', demand: number): string {
    const level = demand > 70 ? 'High' : demand > 40 ? 'Medium' : demand > 10 ? 'Low' : 'None';
    
    const labels: Record<string, string> = {
        r: 'Residential',
        c: 'Commercial',
        i: 'Industrial'
    };
    
    return `${labels[type]} Demand: ${level} (${Math.round(demand)}%)`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════════════════════════

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}
