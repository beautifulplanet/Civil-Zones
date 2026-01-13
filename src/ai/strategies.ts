/**
 * Civil Zones - AI Strategies
 * Build strategies and macro playbooks for AI
 */

import type { 
    MacroPlaybook, 
    MacroStep, 
    TacticStats, 
    AIAction,
    AIGameState,
    SequenceStrategy,
    RatioStrategy,
    BuildRatio
} from './types.js';

// ═══════════════════════════════════════════════════════════════════
// MACRO PLAYBOOKS
// ═══════════════════════════════════════════════════════════════════

/** Default macro playbooks for city building 
 * IMPROVED: Roads come BEFORE zones to connect them (like a human would)
 * Pattern: Road network first, then zones along roads
 */
export const DEFAULT_PLAYBOOKS: MacroPlaybook[] = [
    {
        id: 'road_first_expansion',
        name: 'Road Network First (Recommended)',
        steps: [
            // Start: Build road network from center
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_RES' },       // First house along road
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_WELL', waitYears: 1 },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_RES', waitYears: 2 },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_RES', waitYears: 2 },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_COM', waitYears: 3 },  // Commercial along road
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_WELL', waitYears: 2 },
            { action: 'BUILD_RES', waitYears: 2 }
        ]
    },
    {
        id: 'grid_builder',
        name: 'Grid Pattern Builder',
        steps: [
            // Build a small road grid first
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_ROAD' },
            // Now fill in zones
            { action: 'BUILD_RES' },
            { action: 'BUILD_WELL', waitYears: 1 },
            { action: 'BUILD_RES', waitYears: 2 },
            { action: 'BUILD_RES', waitYears: 2 },
            // Expand grid
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_COM', waitYears: 2 },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_IND', requirePop: 20, waitYears: 3 }
        ]
    },
    {
        id: 'early_twin_res',
        name: 'Twin Huts Opener',
        steps: [
            { action: 'BUILD_ROAD' },      // Road first!
            { action: 'BUILD_RES' },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_RES', waitYears: 2 },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_WELL', waitYears: 2 },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_RES', waitYears: 2 }
        ]
    },
    {
        id: 'water_buffer',
        name: 'Water Buffer Start',
        steps: [
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_WELL' },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_RES', waitYears: 1 },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_RES', waitYears: 2 },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_RES', waitYears: 2, requirePop: 12 },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_COM', waitYears: 1, minYear: 3, requireDemand: 'C' }
        ]
    },
    {
        id: 'main_street',
        name: 'Main Street Pattern',
        steps: [
            // Build main street
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_ROAD' },
            // Build zones along main street
            { action: 'BUILD_RES' },
            { action: 'BUILD_WELL', waitYears: 1 },
            { action: 'BUILD_RES', waitYears: 2 },
            { action: 'BUILD_RES', waitYears: 2 },
            { action: 'BUILD_COM', waitYears: 2 },
            // Branch roads
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_RES', waitYears: 2 },
            { action: 'BUILD_IND', requirePop: 25, waitYears: 3 }
        ]
    },
    {
        id: 'balanced_growth',
        name: 'Balanced Road+Zone Growth',
        steps: [
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_RES' },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_WELL', waitYears: 1 },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_RES', waitYears: 2 },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_RES', waitYears: 2 },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_COM', waitYears: 2 },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_WELL', waitYears: 1 }
        ]
    },
    {
        id: 'industrial_district',
        name: 'Industrial District Plan',
        steps: [
            // Roads for residential area
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_RES' },
            { action: 'BUILD_WELL', waitYears: 1 },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_RES', waitYears: 2 },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_COM', waitYears: 2 },
            // Roads to industrial area
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_ROAD' },
            { action: 'BUILD_IND', requirePop: 20, requireFood: 500, waitYears: 3 },
            { action: 'BUILD_IND', waitYears: 2 },
            { action: 'BUILD_ROAD' }
        ]
    }
];

// ═══════════════════════════════════════════════════════════════════
// SEQUENCE STRATEGIES
// ═══════════════════════════════════════════════════════════════════

/** Starter sequence strategy - Roads first approach */
export const STARTER_STRATEGY: SequenceStrategy = {
    name: 'Starter',
    sequence: [
        { type: 'ROAD', count: 3 },  // Build roads first!
        { type: 'RES', count: 1 },
        { type: 'ROAD', count: 1 },
        { type: 'WELL', count: 1 },
        { type: 'ROAD', count: 2 },
        { type: 'RES', count: 1 },
        { type: 'WAIT', years: 5 },
        { type: 'ROAD', count: 2 },
        { type: 'RES', count: 1 },
        { type: 'ROAD', count: 2 },
        { type: 'COM', count: 1 },
        { type: 'ROAD', count: 2 },
        { type: 'IND', count: 1 },
        { type: 'ROAD', count: 2 }
    ],
    step: 0,
    subStep: 0,
    waitStartYear: 0
};

/** Balanced ratio strategy - More roads! */
export const BALANCED_STRATEGY: RatioStrategy = {
    name: 'Balanced',
    ratio: { R: 4, C: 1, I: 2 },
    roadsPerBuilding: 1.5  // Build 1.5 roads per zone (was 0.5)
};

/** Housing-heavy ratio strategy */
export const HOUSING_HEAVY_STRATEGY: RatioStrategy = {
    name: 'Housing Heavy',
    ratio: { R: 6, C: 1, I: 1 },
    roadsPerBuilding: 1.0  // Build 1 road per zone (was 0.3)
};

// ═══════════════════════════════════════════════════════════════════
// TACTIC SELECTION
// ═══════════════════════════════════════════════════════════════════

/** Initialize tactic stats for playbooks */
export function initTacticStats(playbooks: MacroPlaybook[]): Record<string, TacticStats> {
    const stats: Record<string, TacticStats> = {};
    for (const pb of playbooks) {
        stats[pb.id] = {
            attempts: 0,
            successes: 0,
            totalYears: 0,
            maxPop: 0,
            avgScore: 0
        };
    }
    return stats;
}

/** Select a tactic using weighted random based on success rate */
export function selectTactic(
    playbooks: MacroPlaybook[],
    tacticStats: Record<string, TacticStats>,
    episode: number,
    strategicChance: number = 0.7
): MacroPlaybook | null {
    if (!playbooks || playbooks.length === 0) return null;
    
    let candidates = [...playbooks];
    
    // After 10 episodes, 70% chance to pick strategically
    if (Math.random() < strategicChance && episode > 10) {
        // Sort by success rate + average score
        candidates.sort((a, b) => {
            const statsA = tacticStats[a.id] || { attempts: 0, avgScore: 0, successes: 0 };
            const statsB = tacticStats[b.id] || { attempts: 0, avgScore: 0, successes: 0 };
            const scoreA = statsA.attempts > 0 
                ? (statsA.successes / statsA.attempts * 100 + statsA.avgScore) 
                : 50;
            const scoreB = statsB.attempts > 0 
                ? (statsB.successes / statsB.attempts * 100 + statsB.avgScore) 
                : 50;
            return scoreB - scoreA;
        });
        
        // Pick from top 5 with weighted random
        const topN = candidates.slice(0, Math.min(5, candidates.length));
        const weights = topN.map((_, i) => Math.pow(0.6, i));
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        
        let r = Math.random() * totalWeight;
        let cumulative = 0;
        
        for (let i = 0; i < topN.length; i++) {
            cumulative += weights[i];
            if (r <= cumulative) {
                return topN[i];
            }
        }
    }
    
    // Random exploration
    return candidates[Math.floor(Math.random() * candidates.length)];
}

/** Record tactic success/failure */
export function recordTacticResult(
    tacticStats: Record<string, TacticStats>,
    tacticId: string,
    year: number,
    pop: number,
    successThreshold: { minYear: number; minPop: number } = { minYear: 5, minPop: 10 }
): void {
    const stats = tacticStats[tacticId];
    if (!stats) return;
    
    // Count as success if survived threshold
    if (year >= successThreshold.minYear && pop >= successThreshold.minPop) {
        stats.successes++;
    }
    
    stats.totalYears += year;
    stats.maxPop = Math.max(stats.maxPop, pop);
    stats.avgScore = stats.attempts > 0 
        ? Math.round((stats.totalYears / stats.attempts) * 10 + stats.maxPop) 
        : 0;
}

// ═══════════════════════════════════════════════════════════════════
// MACRO STEP EVALUATION
// ═══════════════════════════════════════════════════════════════════

/** Check if macro step conditions are met */
export function macroConditionsMet(step: MacroStep, context: AIGameState & { year: number }): boolean {
    if (!step) return false;
    
    if (step.minYear !== undefined && context.year < step.minYear) return false;
    if (step.maxYear !== undefined && context.year > step.maxYear) return false;
    if (step.requirePop !== undefined && context.pop < step.requirePop) return false;
    if (step.requireDemand && context.highestDemand !== step.requireDemand) return false;
    
    if (step.requireNeeds) {
        for (const need of step.requireNeeds) {
            if (need === 'water' && !context.isThirsty) return false;
            if (need === 'food' && !context.isStarving) return false;
            if (need === 'housing' && !context.needsHousing) return false;
        }
    }
    
    if (step.requireHousingNearFull && !context.needsHousing) return false;
    if (step.requireHomeless && context.homeless < step.requireHomeless) return false;
    if (step.requireWorkerShortage === true && !context.workerShortage) return false;
    if (step.requireWorkerShortage === false && context.workerShortage) return false;
    if (step.requireFood && context.food < step.requireFood) return false;
    if (step.requireWood && context.wood < step.requireWood) return false;
    if (step.requireFoodPerPop && (context.pop === 0 || (context.food / Math.max(1, context.pop)) < step.requireFoodPerPop)) return false;
    
    return true;
}

/** Resolve BUILD_DEMAND to actual action */
export function resolveMacroAction(step: MacroStep, context: AIGameState): AIAction | null {
    if (!step) return null;
    
    if (step.action === 'BUILD_DEMAND') {
        if (context.highestDemand === 'R') return 'BUILD_RES';
        if (context.highestDemand === 'C') return 'BUILD_COM';
        return 'BUILD_IND';
    }
    
    return step.action as AIAction;
}

// ═══════════════════════════════════════════════════════════════════
// RATIO STRATEGY
// ═══════════════════════════════════════════════════════════════════

/** Get next build type based on ratio strategy */
export function getNextBuildFromRatio(
    ratio: BuildRatio,
    resCount: number,
    comCount: number,
    indCount: number
): 'RES' | 'COM' | 'IND' {
    const total = ratio.R + ratio.C + ratio.I;
    const targetR = ratio.R / total;
    const targetC = ratio.C / total;
    
    const currentTotal = resCount + comCount + indCount || 1;
    const currentR = resCount / currentTotal;
    const currentC = comCount / currentTotal;
    
    // Build what's most below target ratio
    const rDelta = targetR - currentR;
    const cDelta = targetC - currentC;
    const iDelta = (1 - targetR - targetC) - (1 - currentR - currentC);
    
    if (rDelta >= cDelta && rDelta >= iDelta) return 'RES';
    if (cDelta >= iDelta) return 'COM';
    return 'IND';
}

/** Check if city is balanced (all 3 zone types present in reasonable ratio) */
export function isCityBalanced(resCount: number, comCount: number, indCount: number): boolean {
    const total = resCount + comCount + indCount;
    if (total < 6) return false; // Need at least 6 buildings
    
    const minRatio = 0.1; // Each type should be at least 10%
    return (
        resCount / total >= minRatio &&
        comCount / total >= minRatio &&
        indCount / total >= minRatio
    );
}
