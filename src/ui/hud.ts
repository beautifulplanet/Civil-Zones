/**
 * Civil Zones - HUD (Heads-Up Display) System
 * Manages on-screen resource displays, stats, and status indicators
 */

import type { HUDState, NeedType, NeedWarning, NeedsPanelState } from './types.js';
import { NEED_COLORS } from './types.js';

// ═══════════════════════════════════════════════════════════════════
// HUD STATE
// ═══════════════════════════════════════════════════════════════════

let hudState: HUDState = {
    showPopulation: true,
    showResources: true,
    showWater: true,
    showYear: true,
    showThirst: false,
    showInventory: false,
    showRCI: true,
    showNeeds: true
};

// ═══════════════════════════════════════════════════════════════════
// NUMBER FORMATTING
// ═══════════════════════════════════════════════════════════════════

/** Format number with K/M/B/T/Q/Qi suffixes */
export function formatNumber(num: number): string {
    if (num >= 1e18) return (num / 1e18).toFixed(1) + 'Qi';
    if (num >= 1e15) return (num / 1e15).toFixed(1) + 'Q';
    if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return Math.floor(num).toString();
}

/** Format percentage */
export function formatPercent(value: number, decimals: number = 0): string {
    return (value * 100).toFixed(decimals) + '%';
}

// ═══════════════════════════════════════════════════════════════════
// ELEMENT UPDATES
// ═══════════════════════════════════════════════════════════════════

/** Update text content of an element */
export function updateElement(elementId: string, value: string | number): void {
    const el = document.getElementById(elementId);
    if (el) {
        el.innerText = typeof value === 'number' ? formatNumber(value) : value;
    }
}

/** Update element visibility */
export function setElementVisible(elementId: string, visible: boolean, display: string = 'flex'): void {
    const el = document.getElementById(elementId);
    if (el) {
        el.style.display = visible ? display : 'none';
    }
}

/** Update element style */
export function setElementStyle(elementId: string, property: string, value: string): void {
    const el = document.getElementById(elementId);
    if (el) {
        (el.style as any)[property] = value;
    }
}

// ═══════════════════════════════════════════════════════════════════
// POPULATION DISPLAY
// ═══════════════════════════════════════════════════════════════════

export interface PopulationData {
    current: number;
    cap: number;
    isWanderMode: boolean;
}

/** Update population display */
export function updatePopulation(data: PopulationData): void {
    const display = data.isWanderMode
        ? formatNumber(data.current)
        : `${formatNumber(data.current)}/${formatNumber(data.cap)}`;
    
    updateElement('v-pop', display);
}

// ═══════════════════════════════════════════════════════════════════
// RESOURCE DISPLAYS
// ═══════════════════════════════════════════════════════════════════

export interface ResourceData {
    food: number;
    wood: number;
    metal: number;
    stone: number;
    gold: number;
    inventory?: {
        food: number;
        wood: number;
        metal: number;
        stone: number;
        capacity: number;
    };
    pocket?: {
        metal: number;
        stone: number;
    };
}

/** Update resource displays */
export function updateResources(data: ResourceData, isWanderMode: boolean): void {
    if (isWanderMode && data.inventory) {
        // Wander mode - show inventory
        const invTotal = data.inventory.food + data.inventory.wood + 
                        data.inventory.metal + data.inventory.stone;
        
        updateElement('v-food', `${formatNumber(data.inventory.food)}/${formatNumber(data.inventory.capacity)}`);
        updateElement('v-wood', formatNumber(data.inventory.wood));
        
        const wanderMetal = (data.inventory.metal || 0) + (data.pocket?.metal || 0);
        const wanderStone = (data.inventory.stone || 0) + (data.pocket?.stone || 0);
        
        updateElement('v-metal', formatNumber(wanderMetal));
        updateElement('v-stone', formatNumber(wanderStone));
        updateElement('v-inventory', `${formatNumber(invTotal)}/${formatNumber(data.inventory.capacity)}`);
        
        setElementVisible('stat-inventory', true);
        setElementVisible('stat-wood', true);
        setElementVisible('stat-metal', true);
        setElementVisible('stat-stone', true);
    } else {
        // City mode - show regular resources
        updateElement('v-food', formatNumber(data.food));
        updateElement('v-wood', formatNumber(data.wood));
        
        const totalMetal = data.metal + (data.pocket?.metal || 0);
        const totalStone = data.stone + (data.pocket?.stone || 0);
        
        updateElement('v-metal', formatNumber(totalMetal));
        updateElement('v-stone', formatNumber(totalStone));
        
        setElementVisible('stat-inventory', false);
        setElementVisible('stat-wood', true);
        setElementVisible('stat-metal', true);
        setElementVisible('stat-stone', true);
    }
    
    updateElement('v-res', formatNumber(data.gold));
}

// ═══════════════════════════════════════════════════════════════════
// WATER DISPLAY
// ═══════════════════════════════════════════════════════════════════

export interface WaterData {
    wellCount: number;
    population: number;
    capacityPerWell: number;
}

/** Update water capacity display */
export function updateWaterDisplay(data: WaterData): void {
    const capacity = data.wellCount * data.capacityPerWell;
    const used = Math.min(data.population, capacity);
    const percent = capacity > 0 ? Math.round((used / capacity) * 100) : 0;
    
    let status: string;
    if (capacity === 0) {
        status = '⚠️ No wells!';
    } else if (data.population > capacity) {
        status = `🔴 OVER CAPACITY! (${data.population}/${capacity})`;
    } else if (percent > 80) {
        status = `🟡 ${percent}% capacity`;
    } else {
        status = `🟢 ${percent}% capacity`;
    }
    
    updateElement('v-wat', status);
}

/** Update wells display */
export function updateWellsDisplay(wellCount: number, population: number, capacityPerWell: number = 100): void {
    const wellsNeeded = Math.max(1, Math.ceil(population / capacityPerWell));
    const capacityUsed = wellCount > 0 ? Math.round((population / (wellCount * capacityPerWell)) * 100) : 0;
    
    let status: string;
    if (wellCount >= wellsNeeded) {
        status = `🟢 ${wellCount} wells (${capacityUsed}% capacity)`;
    } else if (wellCount > 0) {
        const shortage = wellsNeeded - wellCount;
        status = `🔴 ${wellCount} wells (${shortage} more needed!)`;
    } else {
        status = '⚠️ No wells built!';
    }
    
    updateElement('v-wells', status);
    setElementVisible('stat-wells', true);
}

// ═══════════════════════════════════════════════════════════════════
// THIRST DISPLAY
// ═══════════════════════════════════════════════════════════════════

/** Update thirst indicator */
export function updateThirst(thirst: number, show: boolean = true): void {
    setElementVisible('stat-thirst', show);
    
    if (!show) return;
    
    const thirstEl = document.getElementById('v-thirst');
    if (thirstEl) {
        thirstEl.innerText = thirst.toString();
        
        // Color code thirst level
        if (thirst > 50) {
            thirstEl.style.color = '#29B6F6'; // Blue - good
        } else if (thirst > 25) {
            thirstEl.style.color = '#FFA726'; // Orange - warning
        } else {
            thirstEl.style.color = '#E53935'; // Red - critical
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// NEEDS WARNING PANEL
// ═══════════════════════════════════════════════════════════════════

export interface NeedsData {
    housing: { satisfied: number; shortage: number };
    water: { satisfied: number; shortage: number };
    food: { satisfied: number; shortage?: number };
    jobs: { satisfied: number; shortage: number };
    paths: { satisfied: number; shortage: number };
    overall: number;
}

/** Generate need warnings from needs data */
export function generateNeedWarnings(needs: NeedsData, population: number): NeedWarning[] {
    const warnings: NeedWarning[] = [];
    
    // Housing warnings
    if (needs.housing.satisfied < 0.5) {
        warnings.push({
            type: 'housing',
            message: `🏠 Housing CRITICAL (${needs.housing.shortage} homeless)`,
            severity: 'critical',
            color: NEED_COLORS.housing
        });
    } else if (needs.housing.satisfied < 0.8) {
        warnings.push({
            type: 'housing',
            message: `🏠 Housing needed (${needs.housing.shortage} shortage)`,
            severity: 'warning',
            color: NEED_COLORS.housing
        });
    }
    
    // Water warnings
    if (needs.water.satisfied < 0.5 && population >= 10) {
        warnings.push({
            type: 'water',
            message: `💧 Water CRITICAL (need ${needs.water.shortage} wells)`,
            severity: 'critical',
            color: NEED_COLORS.water
        });
    } else if (needs.water.satisfied < 0.8 && population >= 10) {
        warnings.push({
            type: 'water',
            message: `💧 Water needed (${needs.water.shortage} wells)`,
            severity: 'warning',
            color: NEED_COLORS.water
        });
    }
    
    // Food warnings
    if (needs.food.satisfied < 0.3) {
        warnings.push({
            type: 'food',
            message: '🌾 Food CRITICAL - reserves low!',
            severity: 'critical',
            color: NEED_COLORS.food
        });
    } else if (needs.food.satisfied < 0.6) {
        warnings.push({
            type: 'food',
            message: '🌾 Food low - build industry',
            severity: 'warning',
            color: NEED_COLORS.food
        });
    }
    
    // Jobs warnings
    if (needs.jobs.satisfied < 0.7 && population > 20) {
        warnings.push({
            type: 'jobs',
            message: `💼 Jobs needed (${needs.jobs.shortage} unemployed)`,
            severity: 'warning',
            color: NEED_COLORS.jobs
        });
    }
    
    // Paths warnings
    if (needs.paths.satisfied < 0.5) {
        warnings.push({
            type: 'paths',
            message: `🛤️ Paths needed (${needs.paths.shortage} tiles)`,
            severity: 'warning',
            color: NEED_COLORS.paths
        });
    }
    
    return warnings;
}

/** Update needs warning panel */
export function updateNeedsPanel(needs: NeedsData, population: number, isSimcityMode: boolean): void {
    const panel = document.getElementById('needs-warning-panel');
    const needsList = document.getElementById('needs-list');
    const satisfactionBar = document.getElementById('satisfaction-bar');
    
    // Only show in SimCity mode with reasonable population
    if (!isSimcityMode || population < 5) {
        if (panel) panel.style.display = 'none';
        return;
    }
    
    const warnings = generateNeedWarnings(needs, population);
    
    if (needsList) {
        if (warnings.length === 0) {
            needsList.innerHTML = '<span style="color: #6BCF7F;">✓ All needs met!</span>';
            if (panel) {
                panel.style.border = '2px solid #6BCF7F';
                panel.style.boxShadow = '0 8px 25px rgba(107,207,127,0.3)';
            }
        } else {
            needsList.innerHTML = warnings.map(w => `<div>• ${w.message}</div>`).join('');
            if (panel) {
                panel.style.border = '2px solid #FF6B6B';
                panel.style.boxShadow = '0 8px 25px rgba(255,107,107,0.3)';
            }
        }
    }
    
    // Update satisfaction bar
    if (satisfactionBar) {
        const satisfaction = needs.overall || 1.0;
        const satPercent = Math.floor(satisfaction * 100);
        
        satisfactionBar.style.width = (satisfaction * 100) + '%';
        satisfactionBar.textContent = satPercent + '%';
        
        if (satisfaction >= 0.8) {
            satisfactionBar.style.background = 'linear-gradient(90deg, #6BCF7F 0%, #4CAF50 100%)';
        } else if (satisfaction >= 0.5) {
            satisfactionBar.style.background = 'linear-gradient(90deg, #FFD93D 0%, #FFA726 100%)';
        } else {
            satisfactionBar.style.background = 'linear-gradient(90deg, #FF6B6B 0%, #C62828 100%)';
        }
    }
    
    if (panel) panel.style.display = 'block';
}

// ═══════════════════════════════════════════════════════════════════
// BUTTON STATE
// ═══════════════════════════════════════════════════════════════════

/** Enable/disable a button */
export function setButtonEnabled(buttonId: string, enabled: boolean, title?: string): void {
    const btn = document.getElementById(buttonId) as HTMLButtonElement;
    if (btn) {
        btn.disabled = !enabled;
        if (title) btn.title = title;
    }
}

/** Set button active state */
export function setButtonActive(buttonId: string, active: boolean): void {
    const btn = document.getElementById(buttonId);
    if (btn) {
        if (active) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }
}

/** Clear all button active states */
export function clearAllButtonActive(selector: string = '.btn'): void {
    document.querySelectorAll(selector).forEach(btn => {
        btn.classList.remove('active');
    });
}

// ═══════════════════════════════════════════════════════════════════
// HUD MODE SWITCHING
// ═══════════════════════════════════════════════════════════════════

/** Configure HUD for Wander mode */
export function setWanderMode(): void {
    hudState.showThirst = true;
    hudState.showInventory = true;
    hudState.showYear = false;
    
    setElementVisible('stat-thirst', true);
    setElementVisible('stat-inventory', true);
    setElementVisible('stat-wander-wells', true);
    setElementVisible('stat-year', false);
    setElementVisible('stat-water', false);
    setElementVisible('stat-funds', false);
    setElementVisible('btn-settle', true, 'inline-block');
}

/** Configure HUD for City mode */
export function setCityMode(): void {
    hudState.showThirst = false;
    hudState.showInventory = false;
    hudState.showYear = true;
    
    setElementVisible('stat-thirst', false);
    setElementVisible('stat-inventory', false);
    setElementVisible('stat-wander-wells', false);
    setElementVisible('stat-year', true);
    setElementVisible('stat-water', true);
    setElementVisible('stat-funds', true);
    setElementVisible('btn-settle', false);
}

// ═══════════════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════════════

/** Get HUD state */
export function getHUDState(): HUDState {
    return { ...hudState };
}

/** Update HUD state */
export function updateHUDState(updates: Partial<HUDState>): void {
    Object.assign(hudState, updates);
}
