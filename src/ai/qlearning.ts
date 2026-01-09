/**
 * Civil Zones - Q-Learning System
 * Core Q-Learning algorithm for AI training
 */

import type { 
    QTable, 
    QLearningParams, 
    QLearningStats, 
    AIAction,
    LearningPhase,
    DeathCause,
    DeathRecord 
} from './types.js';
import { DEFAULT_QLEARNING_PARAMS, AI_ACTIONS } from './types.js';

// ═══════════════════════════════════════════════════════════════════
// Q-TABLE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

/** Get Q-value for state-action pair */
export function getQ(qTable: QTable, state: string, action: string): number {
    if (!qTable[state]) qTable[state] = {};
    if (qTable[state][action] === undefined) qTable[state][action] = 0;
    return qTable[state][action];
}

/** Update Q-value using Bellman equation */
export function updateQ(
    qTable: QTable, 
    state: string, 
    action: string, 
    reward: number, 
    nextState: string,
    params: QLearningParams = DEFAULT_QLEARNING_PARAMS
): void {
    const currentQ = getQ(qTable, state, action);
    const maxNextQ = Math.max(...AI_ACTIONS.map(a => getQ(qTable, nextState, a)));
    const newQ = currentQ + params.learningRate * (reward + params.discountFactor * maxNextQ - currentQ);
    
    if (!qTable[state]) qTable[state] = {};
    qTable[state][action] = newQ;
}

/** Prune Q-table to prevent memory explosion */
export function pruneQTable(qTable: QTable, maxSize: number): number {
    const states = Object.keys(qTable);
    if (states.length < maxSize * 0.9) return 0;
    
    // Calculate average Q-value per state
    const stateScores = states.map(s => {
        const actions = qTable[s];
        const values = Object.values(actions);
        const maxQ = values.length > 0 ? Math.max(...values) : 0;
        return { state: s, score: maxQ };
    });
    
    // Sort by score (lowest first) and remove bottom 20%
    stateScores.sort((a, b) => a.score - b.score);
    const removeCount = Math.floor(states.length * 0.2);
    
    for (let i = 0; i < removeCount; i++) {
        delete qTable[stateScores[i].state];
    }
    
    return removeCount;
}

/** Get best action for a state (exploitation) */
export function getBestAction(qTable: QTable, state: string, availableActions: AIAction[]): AIAction {
    let bestAction = availableActions[0];
    let bestQ = -Infinity;
    
    for (const action of availableActions) {
        const q = getQ(qTable, state, action);
        if (q > bestQ) {
            bestQ = q;
            bestAction = action;
        }
    }
    
    return bestAction;
}

/** Choose action using epsilon-greedy policy */
export function chooseActionEpsilonGreedy(
    qTable: QTable,
    state: string,
    availableActions: AIAction[],
    explorationRate: number
): AIAction {
    // Explore: random action
    if (Math.random() < explorationRate) {
        return availableActions[Math.floor(Math.random() * availableActions.length)];
    }
    
    // Exploit: best known action
    return getBestAction(qTable, state, availableActions);
}

// ═══════════════════════════════════════════════════════════════════
// STATE ENCODING
// ═══════════════════════════════════════════════════════════════════

/** Encode wander state to string */
export function encodeWanderState(
    stage: number,
    highestUnlock: number,
    popBucket: number,
    foodOK: boolean,
    woodOK: boolean
): string {
    return `WANDER_S${stage}_LV${highestUnlock}_P${popBucket}_F${foodOK ? 1 : 0}_W${woodOK ? 1 : 0}`;
}

/** Encode city state to string */
export function encodeCityState(params: {
    stage: number;
    highestUnlock: number;
    civLevel: number;
    popBucket: number;
    foodBucket: number;
    woodBucket: number;
    wellCount: number;
    resCount: number;
    indCount: number;
    comCount: number;
    roadCount: number;
    hasWaterCrisis: boolean;
    hasFoodCrisis: boolean;
    expansionBucket: number;
    roadFrontBucket: number;
    quadrantBucket: number;
}): string {
    return `S${params.stage}` +
        `LV${params.highestUnlock}` +
        `CV${Math.min(9, Math.floor(params.civLevel))}` +
        `P${params.popBucket}` +
        `F${params.foodBucket}` +
        `W${params.woodBucket}` +
        `WL${params.wellCount}` +
        `R${params.resCount}` +
        `I${params.indCount}` +
        `C${params.comCount}` +
        `RD${params.roadCount}` +
        `WC${params.hasWaterCrisis ? 1 : 0}` +
        `FC${params.hasFoodCrisis ? 1 : 0}` +
        `EX${params.expansionBucket}` +
        `RF${params.roadFrontBucket}` +
        `Q${params.quadrantBucket}`;
}

/** Bucket a value into discrete ranges */
export function bucket(value: number, bucketSize: number, maxBuckets: number): number {
    return Math.min(maxBuckets, Math.floor(value / bucketSize));
}

// ═══════════════════════════════════════════════════════════════════
// REWARD CALCULATION
// ═══════════════════════════════════════════════════════════════════

/** Calculate reward for state transition */
export function calculateReward(params: {
    popGained: number;
    resourcesGained: number;
    yearsSurvived: number;
    buildingsBuilt: number;
    died: boolean;
    deathCause?: DeathCause;
    balanced: boolean;
    newQuadrant: boolean;
    levelUp: boolean;
}): number {
    let reward = 0;
    
    // Population growth is good
    reward += params.popGained * 10;
    
    // Resource accumulation
    reward += params.resourcesGained * 0.01;
    
    // Survival bonus
    reward += params.yearsSurvived * 2;
    
    // Building construction
    reward += params.buildingsBuilt * 5;
    
    // Death penalty
    if (params.died) {
        reward -= 100;
        if (params.deathCause === 'thirst') reward -= 50; // Extra penalty for thirst death
        if (params.deathCause === 'starvation') reward -= 30;
    }
    
    // Balance bonus
    if (params.balanced) reward += 20;
    
    // Expansion bonus
    if (params.newQuadrant) reward += 15;
    
    // Level up bonus
    if (params.levelUp) reward += 50;
    
    return reward;
}

// ═══════════════════════════════════════════════════════════════════
// TRAINING STATISTICS
// ═══════════════════════════════════════════════════════════════════

/** Create initial training stats */
export function createStats(): QLearningStats {
    return {
        episode: 0,
        totalReward: 0,
        episodeRewards: [],
        bestScore: 0,
        gamesPlayed: 0,
        citiesBuilt: 0,
        bestPopulation: 0,
        bestSurvivalYears: 0,
        balancedCities: 0,
        smartSettlements: 0,
        rewardHistory: []
    };
}

/** Update stats after episode */
export function updateStats(
    stats: QLearningStats,
    episodeReward: number,
    finalPop: number,
    yearsSurvived: number,
    wasBalanced: boolean,
    wasSmartSettlement: boolean
): void {
    stats.episode++;
    stats.gamesPlayed++;
    stats.totalReward += episodeReward;
    stats.episodeRewards.push(episodeReward);
    
    // Keep only last 100 episode rewards
    if (stats.episodeRewards.length > 100) {
        stats.episodeRewards.shift();
    }
    
    // Update best scores
    if (episodeReward > stats.bestScore) {
        stats.bestScore = episodeReward;
    }
    if (finalPop > stats.bestPopulation) {
        stats.bestPopulation = finalPop;
    }
    if (yearsSurvived > stats.bestSurvivalYears) {
        stats.bestSurvivalYears = yearsSurvived;
    }
    
    // Track special achievements
    if (wasBalanced) stats.balancedCities++;
    if (wasSmartSettlement) stats.smartSettlements++;
    
    // Update reward history for graphing
    stats.rewardHistory.push(episodeReward);
    if (stats.rewardHistory.length > 20) {
        stats.rewardHistory.shift();
    }
}

// ═══════════════════════════════════════════════════════════════════
// CURRICULUM LEARNING
// ═══════════════════════════════════════════════════════════════════

/** Determine learning phase based on progress */
export function determineLearningPhase(
    citiesBuilt: number,
    balancedCities: number,
    phase1Threshold: number = 10,
    phase2Threshold: number = 5
): LearningPhase {
    // Phase 1: Learn to survive WANDER and settle
    if (citiesBuilt < phase1Threshold) return 1;
    
    // Phase 2: Learn to build balanced cities
    if (balancedCities < phase2Threshold) return 2;
    
    // Phase 3: Advanced optimization
    return 3;
}

/** Get exploration rate for current phase */
export function getPhaseExplorationRate(
    phase: LearningPhase,
    baseRate: number,
    episode: number
): number {
    // Higher exploration in early phases
    const phaseBonus = (3 - phase) * 0.1;
    const decayedRate = baseRate * Math.pow(0.99, episode);
    return Math.max(0.1, decayedRate + phaseBonus);
}

// ═══════════════════════════════════════════════════════════════════
// DEATH TRACKING
// ═══════════════════════════════════════════════════════════════════

/** Track death cause */
export function recordDeath(
    deaths: DeathRecord[],
    cause: DeathCause,
    year: number,
    pop: number,
    state: string,
    maxRecords: number = 100
): void {
    deaths.push({ cause, year, pop, state });
    
    if (deaths.length > maxRecords) {
        deaths.shift();
    }
}

/** Analyze death patterns */
export function analyzeDeaths(deaths: DeathRecord[]): {
    mostCommon: DeathCause;
    thirstDeaths: number;
    starvationDeaths: number;
    avgYearOfDeath: number;
} {
    const counts: Record<DeathCause, number> = {
        thirst: 0,
        starvation: 0,
        collapse: 0,
        unknown: 0
    };
    
    let totalYears = 0;
    
    for (const death of deaths) {
        counts[death.cause]++;
        totalYears += death.year;
    }
    
    const mostCommon = (Object.entries(counts) as [DeathCause, number][])
        .sort((a, b) => b[1] - a[1])[0][0];
    
    return {
        mostCommon,
        thirstDeaths: counts.thirst,
        starvationDeaths: counts.starvation,
        avgYearOfDeath: deaths.length > 0 ? totalYears / deaths.length : 0
    };
}

// ═══════════════════════════════════════════════════════════════════
// PERSISTENCE
// ═══════════════════════════════════════════════════════════════════

/** Save Q-table to localStorage */
export function saveQTable(qTable: QTable, key: string = 'civil_zones_qtable'): void {
    try {
        const json = JSON.stringify(qTable);
        localStorage.setItem(key, json);
    } catch (e) {
        console.warn('Failed to save Q-table:', e);
    }
}

/** Load Q-table from localStorage */
export function loadQTable(key: string = 'civil_zones_qtable'): QTable | null {
    try {
        const json = localStorage.getItem(key);
        if (json) {
            return JSON.parse(json);
        }
    } catch (e) {
        console.warn('Failed to load Q-table:', e);
    }
    return null;
}

/** Export Q-table to JSON file */
export function exportQTableToFile(qTable: QTable, stats: QLearningStats): void {
    const data = {
        qTable,
        stats,
        exportedAt: new Date().toISOString(),
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `civil_zones_ai_brain_${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

/** Import Q-table from file */
export async function importQTableFromFile(file: File): Promise<{ qTable: QTable; stats?: QLearningStats } | null> {
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (data.qTable) {
            return { qTable: data.qTable, stats: data.stats };
        }
        
        // Legacy format: just the Q-table
        return { qTable: data };
    } catch (e) {
        console.error('Failed to import Q-table:', e);
        return null;
    }
}
