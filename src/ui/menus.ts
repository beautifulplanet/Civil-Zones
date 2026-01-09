/**
 * Civil Zones - Menu System
 * Handles building menus, stat menus, and modal dialogs
 */

import type { MenuPanelId, MenuState } from './types.js';

// ═══════════════════════════════════════════════════════════════════
// MENU STATE
// ═══════════════════════════════════════════════════════════════════

let menuState: MenuState = {
    activeMenu: null,
    selectedLevel: 1,
    selectedBuilding: null
};

// ═══════════════════════════════════════════════════════════════════
// MENU VISIBILITY
// ═══════════════════════════════════════════════════════════════════

/** Show a menu panel by ID */
export function showMenu(menuId: MenuPanelId): void {
    const panel = document.getElementById(menuId);
    if (panel) {
        panel.style.display = 'block';
        menuState.activeMenu = menuId;
    }
}

/** Hide a menu panel by ID */
export function hideMenu(menuId: MenuPanelId): void {
    const panel = document.getElementById(menuId);
    if (panel) {
        panel.style.display = 'none';
        if (menuState.activeMenu === menuId) {
            menuState.activeMenu = null;
        }
    }
}

/** Hide all menus */
export function hideAllMenus(): void {
    const menuIds: MenuPanelId[] = [
        'building-menu-panel',
        'industrial-menu-panel',
        'commercial-menu-panel',
        'storage-menu-panel',
        'special-menu-panel',
        'road-menu-panel',
        'milestone-menu-panel',
        'stats-menu',
        'log-modal'
    ];
    
    for (const menuId of menuIds) {
        hideMenu(menuId);
    }
    menuState.activeMenu = null;
}

/** Toggle menu visibility */
export function toggleMenu(menuId: MenuPanelId): void {
    if (menuState.activeMenu === menuId) {
        hideMenu(menuId);
    } else {
        hideAllMenus();
        showMenu(menuId);
    }
}

/** Check if a menu is open */
export function isMenuOpen(menuId?: MenuPanelId): boolean {
    if (menuId) {
        return menuState.activeMenu === menuId;
    }
    return menuState.activeMenu !== null;
}

/** Get active menu */
export function getActiveMenu(): MenuPanelId | null {
    return menuState.activeMenu;
}

// ═══════════════════════════════════════════════════════════════════
// BUILDING LEVEL SELECTION
// ═══════════════════════════════════════════════════════════════════

/** Set selected building level */
export function setSelectedLevel(level: number): void {
    menuState.selectedLevel = level;
}

/** Get selected building level */
export function getSelectedLevel(): number {
    return menuState.selectedLevel;
}

/** Set selected building type */
export function setSelectedBuilding(buildingId: string | null): void {
    menuState.selectedBuilding = buildingId;
}

/** Get selected building type */
export function getSelectedBuilding(): string | null {
    return menuState.selectedBuilding;
}

// ═══════════════════════════════════════════════════════════════════
// CARD SELECTION
// ═══════════════════════════════════════════════════════════════════

/** Update card selection visual in a grid */
export function updateCardSelection(gridSelector: string, selectedCardId: string): void {
    const cards = document.querySelectorAll(`${gridSelector} .level-card`);
    cards.forEach(card => {
        card.classList.remove('selected');
    });
    
    const selectedCard = document.getElementById(selectedCardId);
    if (selectedCard && !selectedCard.classList.contains('level-locked')) {
        selectedCard.classList.add('selected');
    }
}

/** Check if a card is locked */
export function isCardLocked(cardId: string): boolean {
    const card = document.getElementById(cardId);
    return card?.classList.contains('level-locked') ?? true;
}

// ═══════════════════════════════════════════════════════════════════
// OVERLAY MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

/** Show an overlay by ID */
export function showOverlay(overlayId: string): void {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
        overlay.style.display = 'block';
    }
}

/** Hide an overlay by ID */
export function hideOverlay(overlayId: string): void {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════════════
// MODAL DIALOGS
// ═══════════════════════════════════════════════════════════════════

/** Show a modal with content */
export function showModal(
    modalId: string, 
    title: string, 
    content: string,
    overlayId?: string
): void {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    const titleEl = modal.querySelector('.modal-title, h3, h2');
    const contentEl = modal.querySelector('.modal-content, .content');
    
    if (titleEl) titleEl.textContent = title;
    if (contentEl) contentEl.innerHTML = content;
    
    modal.style.display = 'flex';
    
    if (overlayId) {
        showOverlay(overlayId);
    }
}

/** Hide a modal */
export function hideModal(modalId: string, overlayId?: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
    
    if (overlayId) {
        hideOverlay(overlayId);
    }
}

// ═══════════════════════════════════════════════════════════════════
// STATS MENU
// ═══════════════════════════════════════════════════════════════════

export interface StatsData {
    year: number;
    turn: number;
    gameState: string;
    population: number;
    populationCap: number;
    totalFoodCollected: number;
    nomadsFound: number;
    buildings: {
        residential: number;
        commercial: number;
        industrial: number;
        wells: number;
        total: number;
    };
    avgResLevel: number;
    unlockedLevels: number[];
}

/** Generate stats menu HTML */
export function generateStatsHTML(stats: StatsData): string {
    let html = '';
    
    // Time & Progress
    html += '<div style="margin-bottom:10px;"><strong style="color:#81C784;">⏱️ Progress</strong></div>';
    html += `<div>Year: ${stats.year}</div>`;
    html += `<div>Turns Played: ${stats.turn}</div>`;
    html += `<div>Game Mode: ${stats.gameState}</div>`;
    
    // Population
    if (stats.gameState === 'CITY') {
        html += '<div style="margin: 15px 0 10px 0;"><strong style="color:#FF7043;">👥 Population</strong></div>';
        html += `<div>Total Population: ${formatNumber(stats.population)}</div>`;
        html += `<div>Population Capacity: ${formatNumber(stats.populationCap)}</div>`;
        html += `<div>Residential Buildings: ${stats.buildings.residential}</div>`;
        html += `<div>Average Res Level: ${stats.avgResLevel.toFixed(1)}</div>`;
    }
    
    // Resources
    html += '<div style="margin: 15px 0 10px 0;"><strong style="color:#4CAF50;">🌾 Resources</strong></div>';
    html += `<div>Food Collected: ${formatNumber(stats.totalFoodCollected)}</div>`;
    if (stats.gameState === 'WANDER') {
        html += `<div>Nomads Found: ${stats.nomadsFound}</div>`;
    }
    
    // Buildings
    if (stats.gameState === 'CITY') {
        html += '<div style="margin: 15px 0 10px 0;"><strong style="color:#2196F3;">🏗️ Buildings</strong></div>';
        html += `<div>Residential: ${stats.buildings.residential}</div>`;
        html += `<div>Commercial: ${stats.buildings.commercial}</div>`;
        html += `<div>Industrial: ${stats.buildings.industrial}</div>`;
        html += `<div>Wells: ${stats.buildings.wells}</div>`;
        html += `<div>Total Buildings: ${stats.buildings.total}</div>`;
    }
    
    // Unlocks
    html += '<div style="margin: 15px 0 10px 0;"><strong style="color:#9C27B0;">🔓 Progress</strong></div>';
    html += `<div>Unlocked Res Levels: ${stats.unlockedLevels.length}</div>`;
    html += `<div>Highest Unlocked: Level ${Math.max(...stats.unlockedLevels, 0)}</div>`;
    
    return html;
}

// ═══════════════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════════════

/** Format number with K/M/B suffixes */
function formatNumber(num: number): string {
    if (num >= 1e18) return (num / 1e18).toFixed(1) + 'Qi';
    if (num >= 1e15) return (num / 1e15).toFixed(1) + 'Q';
    if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return Math.floor(num).toString();
}

/** Get menu state */
export function getMenuState(): MenuState {
    return { ...menuState };
}
