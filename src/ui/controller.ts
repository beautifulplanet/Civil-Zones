/**
 * Civil Zones v48.0 - UI Controller
 * Handles all menu interactions and UI state management
 */

import { showToast } from './toast.js';
import { getBuildingsByCategory } from '../config/building-db.js';
import type { BuildingDefinition } from '../types/index.js';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export type Tool = 'PAN' | 'BUILD_RES' | 'BUILD_COM' | 'BUILD_IND' | 'BUILD_ROAD' | 'BUILD_WELL' | 'DEMOLISH' | 'BUILD_SPECIAL' | 'BUILD_MILESTONE';

export interface UIState {
    currentTool: Tool;
    selectedBuildingLevel: number;
    selectedIndustrialLevel: number;
    selectedCommercialLevel: number;
    selectedRoadLevel: number;
    loreEnabled: boolean;
    showElevation: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════

let uiState: UIState = {
    currentTool: 'PAN',
    selectedBuildingLevel: 1,
    selectedIndustrialLevel: 1,
    selectedCommercialLevel: 1,
    selectedRoadLevel: 1,
    loreEnabled: true,
    showElevation: false
};

// Track unlocked levels (will be updated from game state)
let unlockedResidentialLevels: number[] = [1];
let unlockedIndustrialLevels: number[] = [1];
let unlockedCommercialLevels: number[] = [1];

// Media files for building previews (images/videos in Media folder)
const RESIDENTIAL_MEDIA: Record<number, { video: string | null; image: string; name: string }> = {
    1: { video: 'Media/Residential/Tree Shelter Video.mp4', image: 'Media/Residential/Tree Shelter.jpg', name: 'Tree Shelter' },
    2: { video: 'Media/Residential/Ground Pit Video.mp4', image: 'Media/Residential/Ground Pit.jpg', name: 'Ground Pit' },
    3: { video: 'Media/Residential/Ground Cave Video.mp4', image: 'Media/Residential/Ground Cave.jpg', name: 'Ground Cave' },
    4: { video: null, image: 'Media/Residential/Tipi Village.jpg', name: 'Tipi Village' },
    5: { video: null, image: 'Media/Residential/Log LongHouse.jpg', name: 'Log LongHouse' },
    6: { video: null, image: 'Media/Residential/Old Growth Log Compound.jpg', name: 'Old Growth Log Compound' }
};

const COMMERCIAL_MEDIA: Record<number, { video: string | null; image: string; name: string }> = {
    1: { video: null, image: 'Media/Commercial/Pebble Trade Fire.jpg', name: 'Pebble Trade Fire' },
    2: { video: null, image: 'Media/Commercial/Squirrel Trade Camp.jpg', name: 'Squirrel Trade Camp' },
    3: { video: null, image: 'Media/Commercial/Barter Boulder.jpg', name: 'Barter Boulder' },
    4: { video: null, image: 'Media/Commercial/Bear  Market Camp.png', name: 'Bear Market Camp' },
    5: { video: null, image: 'Media/Commercial/Blanket Market.png', name: 'Blanket Market' }
};

const INDUSTRIAL_MEDIA: Record<number, { video: string | null; image: string; name: string }> = {
    1: { video: null, image: 'Media/Industrial/Grub Digging Pit.jpg', name: 'Grub Digging Pit' },
    2: { video: null, image: 'Media/Industrial/Bird Hunting Range.jpg', name: 'Bird Hunting Range' },
    3: { video: null, image: 'Media/Industrial/Stone Kepping.png', name: 'Stone Keeping' }
};

// Preload all media images for instant display
const preloadedImages: Map<string, HTMLImageElement> = new Map();
function preloadAllMedia(): void {
    const allMedia = [
        ...Object.values(RESIDENTIAL_MEDIA),
        ...Object.values(COMMERCIAL_MEDIA),
        ...Object.values(INDUSTRIAL_MEDIA)
    ];
    
    for (const media of allMedia) {
        if (media.image && !preloadedImages.has(media.image)) {
            const img = new Image();
            img.src = media.image;
            preloadedImages.set(media.image, img);
        }
    }
    console.log(`📸 Preloaded ${preloadedImages.size} media images`);
}

let onToolChange: ((tool: Tool) => void) | null = null;
let onBuildingSelect: ((buildingId: string, category: string) => void) | null = null;
let onAction: ((action: string) => void) | null = null;

// ═══════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════

export interface UICallbacks {
    onToolChange?: (tool: Tool) => void;
    onBuildingSelect?: (buildingId: string, category: string) => void;
    onAction?: (action: string) => void;
}

export function initUIController(callbacks: UICallbacks = {}): void {
    onToolChange = callbacks.onToolChange || null;
    onBuildingSelect = callbacks.onBuildingSelect || null;
    onAction = callbacks.onAction || null;
    
    setupMenubarButtons();
    setupDashboardButtons();
    setupMenuPanels();
    setupModals();
    
    // Preload media images immediately
    preloadAllMedia();
    
    console.log('🎮 UI Controller initialized');
}

// ═══════════════════════════════════════════════════════════════════
// MENUBAR BUTTONS
// ═══════════════════════════════════════════════════════════════════

function setupMenubarButtons(): void {
    // Tool buttons
    addClickHandler('t-pan', () => setTool('PAN'));
    addClickHandler('t-road', () => openMenu('road-menu-panel'));
    addClickHandler('t-well', () => openMenu('well-menu-panel'));
    addClickHandler('t-demolish', () => setTool('DEMOLISH'));
    addClickHandler('t-res', () => openMenu('building-menu-panel'));
    addClickHandler('t-com', () => openMenu('commercial-menu-panel'));
    addClickHandler('t-ind', () => openMenu('industrial-menu-panel'));
    addClickHandler('t-special', () => openMenu('special-menu-panel'));
    addClickHandler('t-milestone', () => openMenu('milestone-menu-panel'));
    addClickHandler('t-exchange', () => onAction?.('EXCHANGE_GOLD'));
    
    // Game control buttons
    addClickHandler('btn-settle', () => onAction?.('SETTLE'));
    addClickHandler('btn-turn', () => onAction?.('END_TURN'));
    
    // View controls
    addClickHandler('btn-view', () => onAction?.('TOGGLE_VIEW'));
    addClickHandler('btn-save', () => onAction?.('SAVE'));
    addClickHandler('btn-load', () => triggerFileLoad());
    addClickHandler('btn-zoom-in', () => onAction?.('ZOOM_IN'));
    addClickHandler('btn-zoom-out', () => onAction?.('ZOOM_OUT'));
    addClickHandler('btn-reset', () => showNewGameConfirm());
    
    // Debug/utility buttons
    addClickHandler('btn-elevation', () => toggleElevation());
    addClickHandler('btn-add-pop', () => onAction?.('DEBUG_ADD_POP'));
    addClickHandler('btn-add-res', () => onAction?.('DEBUG_ADD_RES'));
    addClickHandler('btn-lore', () => toggleLore());
    addClickHandler('btn-ai', () => togglePanel('ai-training-panel'));
    addClickHandler('btn-log', () => showLog());
}

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD BUTTONS
// ═══════════════════════════════════════════════════════════════════

function setupDashboardButtons(): void {
    addClickHandler('btn-newgame', () => showNewGameConfirm());
    addClickHandler('btn-stats', () => showStats());
}

// ═══════════════════════════════════════════════════════════════════
// MENU PANELS
// ═══════════════════════════════════════════════════════════════════

function setupMenuPanels(): void {
    // Close buttons
    addClickHandler('close-building-menu', () => closeMenu('building-menu-panel'));
    addClickHandler('close-industrial-menu', () => closeMenu('industrial-menu-panel'));
    addClickHandler('close-commercial-menu', () => closeMenu('commercial-menu-panel'));
    addClickHandler('close-road-menu', () => closeMenu('road-menu-panel'));
    addClickHandler('close-special-menu', () => closeMenu('special-menu-panel'));
    addClickHandler('close-milestone-menu', () => closeMenu('milestone-menu-panel'));
    addClickHandler('close-well-menu', () => closeMenu('well-menu-panel'));
    
    // Confirm buttons
    addClickHandler('confirm-building', () => confirmBuildingSelection());
    addClickHandler('confirm-industrial', () => confirmIndustrialSelection());
    addClickHandler('confirm-commercial', () => confirmCommercialSelection());
    addClickHandler('confirm-road', () => confirmRoadSelection());
    addClickHandler('confirm-special', () => confirmSpecialSelection());
    addClickHandler('confirm-milestone', () => confirmMilestoneSelection());
    addClickHandler('confirm-well', () => confirmWellSelection());
    
    // Road level cards
    setupRoadCards();
    
    // AI panel close
    addClickHandler('close-ai-panel', () => hidePanel('ai-training-panel'));
}

function setupRoadCards(): void {
    for (let i = 1; i <= 3; i++) {
        const card = document.getElementById(`card-road-${i}`);
        if (card && !card.classList.contains('level-locked')) {
            card.addEventListener('click', () => selectRoadLevel(i));
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════════════════════════

function setupModals(): void {
    // Stats menu
    addClickHandler('close-stats', () => hideStats());
    addClickHandler('stats-overlay', () => hideStats());
    
    // Log modal
    addClickHandler('close-log', () => hideLog());
    
    // New game confirmation
    addClickHandler('confirm-newgame-yes', () => confirmNewGame());
    addClickHandler('confirm-newgame-no', () => cancelNewGame());
    
    // Game over
    addClickHandler('btn-newgame-gameover', () => {
        hideElement('gameover-screen');
        onAction?.('NEW_GAME');
    });
    
    // Lore popup
    addClickHandler('lore-close-btn', () => closeLorePopup());
    addClickHandler('lore-popup-overlay', () => closeLorePopup());
}

// ═══════════════════════════════════════════════════════════════════
// TOOL MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

export function setTool(tool: Tool): void {
    uiState.currentTool = tool;
    
    // Update button states
    const toolButtons = ['t-pan', 't-demolish'];
    toolButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.classList.remove('active');
        }
    });
    
    // Activate current tool button
    let activeId = '';
    switch (tool) {
        case 'PAN': activeId = 't-pan'; break;
        case 'DEMOLISH': activeId = 't-demolish'; break;
    }
    
    if (activeId) {
        const activeBtn = document.getElementById(activeId);
        if (activeBtn) activeBtn.classList.add('active');
    }
    
    onToolChange?.(tool);
    showToast(`Tool: ${tool.replace('_', ' ')}`);
}

export function getCurrentTool(): Tool {
    return uiState.currentTool;
}

// ═══════════════════════════════════════════════════════════════════
// MENU OPERATIONS
// ═══════════════════════════════════════════════════════════════════

function openMenu(menuId: string): void {
    // Close any open menus first
    closeAllMenus();
    
    // Populate the menu before showing
    if (menuId === 'building-menu-panel') {
        populateBuildingGrid();
    } else if (menuId === 'industrial-menu-panel') {
        populateIndustrialGrid();
    } else if (menuId === 'commercial-menu-panel') {
        populateCommercialGrid();
    }
    
    const menu = document.getElementById(menuId);
    if (menu) {
        menu.style.display = 'block';
    }
}

function closeMenu(menuId: string): void {
    const menu = document.getElementById(menuId);
    if (menu) {
        menu.style.display = 'none';
    }
}

function closeAllMenus(): void {
    const menuIds = [
        'building-menu-panel',
        'industrial-menu-panel',
        'commercial-menu-panel',
        'road-menu-panel',
        'special-menu-panel',
        'milestone-menu-panel',
        'well-menu-panel'
    ];
    menuIds.forEach(id => closeMenu(id));
}

// Building selection confirmations
function confirmBuildingSelection(): void {
    closeMenu('building-menu-panel');
    setTool('BUILD_RES');
    showToast('🏠 Click on the map to place a home');
}

function confirmIndustrialSelection(): void {
    closeMenu('industrial-menu-panel');
    setTool('BUILD_IND');
    showToast('⚒️ Click on the map to place a workshop');
}

function confirmCommercialSelection(): void {
    closeMenu('commercial-menu-panel');
    setTool('BUILD_COM');
    showToast('🏪 Click on the map to place a trade post');
}

function confirmRoadSelection(): void {
    closeMenu('road-menu-panel');
    setTool('BUILD_ROAD');
    showToast('🛣️ Click and drag to build roads');
}

function confirmSpecialSelection(): void {
    closeMenu('special-menu-panel');
    setTool('BUILD_SPECIAL');
    showToast('⭐ Click on the map to place special building');
}

function confirmMilestoneSelection(): void {
    closeMenu('milestone-menu-panel');
    setTool('BUILD_MILESTONE');
    showToast('🏛️ Click on the map to place milestone');
}

function confirmWellSelection(): void {
    closeMenu('well-menu-panel');
    setTool('BUILD_WELL');
    showToast('💧 Click on the map to dig a well');
}

function selectRoadLevel(level: number): void {
    uiState.selectedRoadLevel = level;
    
    // Update card selection visuals
    for (let i = 1; i <= 3; i++) {
        const card = document.getElementById(`card-road-${i}`);
        if (card) {
            card.classList.toggle('selected', i === level);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// BUILDING GRID POPULATION
// ═══════════════════════════════════════════════════════════════════

function formatCost(cost: Partial<Record<string, number>>): string {
    let parts: string[] = [];
    if (cost.food && cost.food > 0) parts.push(`${cost.food} F`);
    if (cost.wood && cost.wood > 0) parts.push(`${cost.wood} W`);
    if (cost.stone && cost.stone > 0) parts.push(`${cost.stone} S`);
    if (cost.metal && cost.metal > 0) parts.push(`${cost.metal} M`);
    return parts.join(' + ') || 'Free';
}

function populateBuildingGrid(): void {
    const grid = document.getElementById('building-level-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const buildings = getBuildingsByCategory('RESIDENTIAL');
    buildings.sort((a, b) => a.level - b.level);
    
    for (const building of buildings) {
        const levelNum = building.level;
        const isUnlocked = unlockedResidentialLevels.includes(levelNum);
        const isSelected = uiState.selectedBuildingLevel === levelNum;
        const icon = building.variants?.[building.variants.length - 1]?.icon || '🏠';
        
        const card = document.createElement('div');
        card.className = 'level-card' + (isSelected ? ' selected' : '') + (!isUnlocked ? ' level-locked' : '');
        card.id = `card-level-${levelNum}`;
        card.setAttribute('data-building-id', building.id);
        
        let costText = formatCost(building.cost);
        if (!isUnlocked && building.unlockReq) {
            const req = building.unlockReq;
            let parts: string[] = [];
            if (req.pop) parts.push(`${req.pop} pop`);
            costText = '🔒 ' + parts.join(' + ');
        }
        
        // Use media image/video if available
        let mediaHTML = '';
        const media = RESIDENTIAL_MEDIA[levelNum];
        if (media) {
            const mediaId = `media-res-${levelNum}`;
            if (media.video) {
                // Has video - show video that autoplays on hover, with zoom button
                mediaHTML = `
                    <div class="building-media-container" style="position:relative;width:200px;height:200px;">
                        <img src="${media.image}" alt="${media.name}" 
                             class="building-preview-img"
                             id="img-res-${levelNum}"
                             style="width:200px;height:200px;object-fit:cover;border-radius:10px;border:3px solid rgba(76,175,80,0.6);box-shadow:0 4px 15px rgba(0,0,0,0.4);position:absolute;top:0;left:0;z-index:2;transition:opacity 0.3s ease;">
                        <video id="${mediaId}" loop muted playsinline preload="auto"
                               style="width:200px;height:200px;object-fit:cover;border-radius:10px;border:3px solid rgba(76,175,80,0.6);box-shadow:0 4px 15px rgba(0,0,0,0.4);position:absolute;top:0;left:0;z-index:1;">
                            <source src="${media.video}" type="video/mp4">
                        </video>
                        <button class="zoom-media-btn" data-level="${levelNum}" data-type="residential" 
                                style="position:absolute;bottom:8px;right:8px;z-index:10;background:rgba(0,0,0,0.7);color:white;border:1px solid #4CAF50;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:12px;">
                            🔍 Zoom
                        </button>
                    </div>
                `;
            } else {
                // Image only with zoom button
                mediaHTML = `
                    <div class="building-media-container" style="position:relative;width:200px;height:200px;">
                        <img src="${media.image}" alt="${media.name}" 
                             style="width:200px;height:200px;object-fit:cover;border-radius:10px;border:3px solid rgba(76,175,80,0.6);box-shadow:0 4px 15px rgba(0,0,0,0.4);">
                        <button class="zoom-media-btn" data-level="${levelNum}" data-type="residential" 
                                style="position:absolute;bottom:8px;right:8px;z-index:10;background:rgba(0,0,0,0.7);color:white;border:1px solid #4CAF50;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:12px;">
                            🔍 Zoom
                        </button>
                    </div>
                `;
            }
        } else {
            // Fallback to emoji icon
            mediaHTML = `<div style="font-size: 48px;">${icon}</div>`;
        }
        
        card.innerHTML = `
            <div class="level-number">L${levelNum}</div>
            <div class="level-icon">${mediaHTML}</div>
            <div class="level-name">${building.name}</div>
            <div class="level-stats">Cap: ${building.capacity}</div>
            <div class="level-cost">${costText}</div>
        `;
        
        // Add hover handlers for video playback - use event delegation for reliability
        if (media?.video) {
            const mediaContainer = card.querySelector('.building-media-container');
            if (mediaContainer) {
                mediaContainer.addEventListener('mouseenter', () => {
                    const video = document.getElementById(`media-res-${levelNum}`) as HTMLVideoElement;
                    const img = document.getElementById(`img-res-${levelNum}`) as HTMLImageElement;
                    if (video && img) {
                        img.style.opacity = '0';
                        video.currentTime = 0;
                        video.play().catch(e => console.log('Video play failed:', e));
                    }
                });
                mediaContainer.addEventListener('mouseleave', () => {
                    const video = document.getElementById(`media-res-${levelNum}`) as HTMLVideoElement;
                    const img = document.getElementById(`img-res-${levelNum}`) as HTMLImageElement;
                    if (video && img) {
                        video.pause();
                        video.currentTime = 0;
                        img.style.opacity = '1';
                    }
                });
            }
        }
        
        // Add zoom button click handler
        card.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('zoom-media-btn')) {
                e.stopPropagation();
                const level = parseInt(target.getAttribute('data-level') || '1');
                showMediaZoom('residential', level);
                return;
            }
            selectBuildingLevel(levelNum);
        });
        
        grid.appendChild(card);
    }
}

function selectBuildingLevel(level: number): void {
    if (!unlockedResidentialLevels.includes(level)) {
        showToast('🔒 Locked! Grow population to unlock.');
        return;
    }
    
    uiState.selectedBuildingLevel = level;
    
    // Update card selection visuals
    document.querySelectorAll('#building-level-grid .level-card').forEach(card => {
        card.classList.remove('selected');
    });
    const card = document.getElementById(`card-level-${level}`);
    if (card) card.classList.add('selected');
    
    const buildings = getBuildingsByCategory('RESIDENTIAL');
    const building = buildings.find(b => b.level === level);
    showToast(`Selected: ${building?.name || 'Home'} L${level}`);
}

function populateIndustrialGrid(): void {
    const grid = document.getElementById('industrial-level-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const buildings = getBuildingsByCategory('INDUSTRIAL');
    buildings.sort((a, b) => a.level - b.level);
    
    for (const building of buildings) {
        const levelNum = building.level;
        const isUnlocked = unlockedIndustrialLevels.includes(levelNum);
        const isSelected = uiState.selectedIndustrialLevel === levelNum;
        const icon = building.variants?.[building.variants.length - 1]?.icon || '🏭';
        
        const card = document.createElement('div');
        card.className = 'level-card' + (isSelected ? ' selected' : '') + (!isUnlocked ? ' level-locked' : '');
        card.id = `card-ind-level-${levelNum}`;
        card.setAttribute('data-building-id', building.id);
        
        let costText = formatCost(building.cost);
        if (!isUnlocked) {
            costText = '🔒 Locked';
        }
        
        const workText = building.capacity <= 5 ? '⚒️ Small workshop' : 
                        building.capacity <= 10 ? '⚒️ Workshop' :
                        building.capacity <= 20 ? '🏭 Factory' : '🏗️ Large factory';
        
        // Use media image if available
        let mediaHTML = '';
        const media = INDUSTRIAL_MEDIA[levelNum];
        if (media) {
            mediaHTML = `
                <div class="building-media-container" style="position:relative;width:200px;height:200px;">
                    <img src="${media.image}" alt="${media.name}" 
                         style="width:200px;height:200px;object-fit:cover;border-radius:10px;border:3px solid rgba(239,68,68,0.6);box-shadow:0 4px 15px rgba(0,0,0,0.4);">
                    <button class="zoom-media-btn" data-level="${levelNum}" data-type="industrial" 
                            style="position:absolute;bottom:8px;right:8px;z-index:10;background:rgba(0,0,0,0.7);color:white;border:1px solid #EF4444;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:12px;">
                        🔍 Zoom
                    </button>
                </div>
            `;
        } else {
            // Fallback to emoji icon
            mediaHTML = `<div style="font-size: 48px;">${icon}</div>`;
        }
        
        card.innerHTML = `
            <div class="level-number">L${levelNum}</div>
            <div class="level-icon">${mediaHTML}</div>
            <div class="level-name">${building.name}</div>
            <div class="level-stats">${workText}</div>
            <div class="level-cost">${costText}</div>
        `;
        
        // Add zoom button click handler
        card.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('zoom-media-btn')) {
                e.stopPropagation();
                const level = parseInt(target.getAttribute('data-level') || '1');
                showMediaZoom('industrial', level);
                return;
            }
            selectIndustrialLevel(levelNum);
        });
        
        grid.appendChild(card);
    }
}

function selectIndustrialLevel(level: number): void {
    if (!unlockedIndustrialLevels.includes(level)) {
        showToast('🔒 Locked! Build more residential first.');
        return;
    }
    
    uiState.selectedIndustrialLevel = level;
    
    // Update card selection visuals
    document.querySelectorAll('#industrial-level-grid .level-card').forEach(card => {
        card.classList.remove('selected');
    });
    const card = document.getElementById(`card-ind-level-${level}`);
    if (card) card.classList.add('selected');
    
    const buildings = getBuildingsByCategory('INDUSTRIAL');
    const building = buildings.find(b => b.level === level);
    showToast(`Selected: ${building?.name || 'Workshop'} L${level}`);
}

function populateCommercialGrid(): void {
    const grid = document.getElementById('commercial-level-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const buildings = getBuildingsByCategory('COMMERCIAL');
    buildings.sort((a, b) => a.level - b.level);
    
    for (const building of buildings) {
        const levelNum = building.level;
        const isUnlocked = unlockedCommercialLevels.includes(levelNum);
        const isSelected = uiState.selectedCommercialLevel === levelNum;
        const icon = building.variants?.[building.variants.length - 1]?.icon || '🏪';
        
        const card = document.createElement('div');
        card.className = 'level-card' + (isSelected ? ' selected' : '') + (!isUnlocked ? ' level-locked' : '');
        card.id = `card-com-level-${levelNum}`;
        card.setAttribute('data-building-id', building.id);
        
        let costText = formatCost(building.cost);
        if (!isUnlocked) {
            costText = '🔒 Locked';
        }
        
        // Use media image if available
        let mediaHTML = '';
        const media = COMMERCIAL_MEDIA[levelNum];
        if (media) {
            mediaHTML = `
                <div class="building-media-container" style="position:relative;width:200px;height:200px;">
                    <img src="${media.image}" alt="${media.name}" 
                         style="width:200px;height:200px;object-fit:cover;border-radius:10px;border:3px solid rgba(74,158,255,0.6);box-shadow:0 4px 15px rgba(0,0,0,0.4);">
                    <button class="zoom-media-btn" data-level="${levelNum}" data-type="commercial" 
                            style="position:absolute;bottom:8px;right:8px;z-index:10;background:rgba(0,0,0,0.7);color:white;border:1px solid #4A9EFF;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:12px;">
                        🔍 Zoom
                    </button>
                </div>
            `;
        } else {
            // Fallback to emoji icon
            mediaHTML = `<div style="font-size: 48px;">${icon}</div>`;
        }
        
        card.innerHTML = `
            <div class="level-number">L${levelNum}</div>
            <div class="level-icon">${mediaHTML}</div>
            <div class="level-name">${building.name}</div>
            <div class="level-stats">Cap: ${building.capacity} workers</div>
            <div class="level-cost">${costText}</div>
        `;
        
        // Add zoom button click handler
        card.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('zoom-media-btn')) {
                e.stopPropagation();
                const level = parseInt(target.getAttribute('data-level') || '1');
                showMediaZoom('commercial', level);
                return;
            }
            selectCommercialLevel(levelNum);
        });
        
        grid.appendChild(card);
    }
}

function selectCommercialLevel(level: number): void {
    if (!unlockedCommercialLevels.includes(level)) {
        showToast('🔒 Locked! Build more residential first.');
        return;
    }
    
    uiState.selectedCommercialLevel = level;
    
    // Update card selection visuals
    document.querySelectorAll('#commercial-level-grid .level-card').forEach(card => {
        card.classList.remove('selected');
    });
    const card = document.getElementById(`card-com-level-${level}`);
    if (card) card.classList.add('selected');
    
    const buildings = getBuildingsByCategory('COMMERCIAL');
    const building = buildings.find(b => b.level === level);
    showToast(`Selected: ${building?.name || 'Trade Post'} L${level}`);
}

// Function to update unlocked levels from game state
export function updateUnlockedLevels(residential: number[], industrial: number[], commercial: number[]): void {
    unlockedResidentialLevels = residential;
    unlockedIndustrialLevels = industrial;
    unlockedCommercialLevels = commercial;
}

// ═══════════════════════════════════════════════════════════════════
// PANEL TOGGLES
// ═══════════════════════════════════════════════════════════════════

function togglePanel(panelId: string): void {
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

function hidePanel(panelId: string): void {
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.style.display = 'none';
    }
}

function toggleElevation(): void {
    uiState.showElevation = !uiState.showElevation;
    onAction?.('TOGGLE_ELEVATION');
    showToast(uiState.showElevation ? '🗻 Elevation view ON' : '🗻 Elevation view OFF');
}

function toggleLore(): void {
    uiState.loreEnabled = !uiState.loreEnabled;
    const btn = document.getElementById('btn-lore');
    if (btn) {
        btn.classList.toggle('active', uiState.loreEnabled);
    }
    showToast(uiState.loreEnabled ? '📖 Lore enabled' : '📖 Lore disabled');
}

// ═══════════════════════════════════════════════════════════════════
// STATS MENU
// ═══════════════════════════════════════════════════════════════════

function showStats(): void {
    showElement('stats-overlay');
    showElement('stats-menu');
    onAction?.('UPDATE_STATS');
}

function hideStats(): void {
    hideElement('stats-overlay');
    hideElement('stats-menu');
}

export function updateStatsContent(html: string): void {
    const content = document.getElementById('stats-content');
    if (content) {
        content.innerHTML = html;
    }
}

// ═══════════════════════════════════════════════════════════════════
// LOG MODAL
// ═══════════════════════════════════════════════════════════════════

function showLog(): void {
    const modal = document.getElementById('log-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
    onAction?.('UPDATE_LOG');
}

function hideLog(): void {
    const modal = document.getElementById('log-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

export function updateLogContent(text: string): void {
    const content = document.getElementById('log-content');
    if (content) {
        content.textContent = text;
    }
}

// ═══════════════════════════════════════════════════════════════════
// NEW GAME CONFIRMATION
// ═══════════════════════════════════════════════════════════════════

function showNewGameConfirm(): void {
    const modal = document.getElementById('newgame-confirm-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function confirmNewGame(): void {
    hideElement('newgame-confirm-modal');
    onAction?.('NEW_GAME');
}

function cancelNewGame(): void {
    hideElement('newgame-confirm-modal');
}

// ═══════════════════════════════════════════════════════════════════
// SETTLEMENT VIDEO POPUP - Shows Tree Shelter video when settling
// ═══════════════════════════════════════════════════════════════════

export function showSettlementVideo(onComplete?: () => void): void {
    // Create overlay if it doesn't exist
    let overlay = document.getElementById('settlement-video-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'settlement-video-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        // Create content container
        const content = document.createElement('div');
        content.style.cssText = `
            text-align: center;
            max-width: 800px;
            padding: 20px;
        `;
        
        // Title
        const title = document.createElement('h1');
        title.textContent = '🏛️ A New Beginning';
        title.style.cssText = `
            color: #f0e68c;
            font-family: 'Times New Roman', serif;
            font-size: 2.5em;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        `;
        content.appendChild(title);
        
        // Video container
        const videoContainer = document.createElement('div');
        videoContainer.style.cssText = `
            border: 4px solid #8b7355;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            margin-bottom: 20px;
        `;
        
        // Video element
        const video = document.createElement('video');
        video.id = 'settlement-video';
        video.src = 'Media/Residential/Tree Shelter Video.mp4';
        video.style.cssText = `
            width: 100%;
            max-width: 640px;
            display: block;
        `;
        video.autoplay = true;
        video.muted = false;  // Will try unmuted first
        video.controls = false;
        video.playsInline = true;
        video.preload = 'auto';
        
        // Handle autoplay - browsers may block with sound
        video.oncanplay = () => {
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Autoplay was blocked, try muted
                    video.muted = true;
                    video.play().then(() => {
                        // Show unmute hint
                        const hint = document.createElement('div');
                        hint.style.cssText = `color: #f0e68c; font-size: 0.9em; margin-top: 10px;`;
                        hint.textContent = '🔇 Click video to unmute';
                        videoContainer.appendChild(hint);
                        video.onclick = () => {
                            video.muted = false;
                            hint.remove();
                        };
                    });
                });
            }
        };
        
        videoContainer.appendChild(video);
        content.appendChild(videoContainer);
        
        // Description text
        const desc = document.createElement('p');
        desc.textContent = 'Your tribe has decided to end their wandering and build a permanent home. The age of cities begins...';
        desc.style.cssText = `
            color: #d4c4a8;
            font-size: 1.2em;
            font-style: italic;
            margin-bottom: 20px;
            line-height: 1.6;
        `;
        content.appendChild(desc);
        
        // Continue button
        const btn = document.createElement('button');
        btn.textContent = 'Begin Settlement';
        btn.style.cssText = `
            background: linear-gradient(180deg, #4a7c59 0%, #2d5a3d 100%);
            color: white;
            border: 2px solid #6b9b7a;
            padding: 15px 40px;
            font-size: 1.2em;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        `;
        btn.onmouseover = () => {
            btn.style.transform = 'scale(1.05)';
            btn.style.boxShadow = '0 4px 16px rgba(74,124,89,0.5)';
        };
        btn.onmouseout = () => {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = 'none';
        };
        btn.onclick = () => {
            video.pause();
            overlay?.remove();
            onComplete?.();
        };
        content.appendChild(btn);
        
        overlay.appendChild(content);
        document.body.appendChild(overlay);
        
        // Auto-close when video ends
        video.onended = () => {
            btn.textContent = '✨ Begin Settlement ✨';
            btn.style.animation = 'pulse 1s infinite';
        };
    } else {
        overlay.style.display = 'flex';
        const video = document.getElementById('settlement-video') as HTMLVideoElement;
        if (video) {
            video.currentTime = 0;
            video.play();
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// MEDIA ZOOM MODAL
// ═══════════════════════════════════════════════════════════════════

function showMediaZoom(type: 'residential' | 'commercial' | 'industrial', level: number): void {
    // Get the media data
    let media: { name: string; image: string; video?: string | null } | undefined;
    let borderColor = '#4CAF50';
    
    if (type === 'residential') {
        media = RESIDENTIAL_MEDIA[level];
        borderColor = '#4CAF50';
    } else if (type === 'commercial') {
        media = COMMERCIAL_MEDIA[level];
        borderColor = '#4A9EFF';
    } else if (type === 'industrial') {
        media = INDUSTRIAL_MEDIA[level];
        borderColor = '#EF4444';
    }
    
    if (!media) {
        showToast('No media available for this building');
        return;
    }
    
    // Remove any existing zoom modal
    const existing = document.getElementById('media-zoom-modal');
    if (existing) existing.remove();
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'media-zoom-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 20000;
        cursor: pointer;
    `;
    
    // Title
    const title = document.createElement('h2');
    title.textContent = media.name;
    title.style.cssText = `
        color: ${borderColor};
        font-family: 'Georgia', serif;
        font-size: 2em;
        margin-bottom: 20px;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        text-transform: uppercase;
        letter-spacing: 3px;
    `;
    modal.appendChild(title);
    
    // Media container
    const mediaContainer = document.createElement('div');
    mediaContainer.style.cssText = `
        border: 4px solid ${borderColor};
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0,0,0,0.8), 0 0 60px ${borderColor}40;
        margin-bottom: 20px;
        max-width: 90vw;
        max-height: 70vh;
    `;
    
    if (media.video) {
        // Show video
        const video = document.createElement('video');
        video.src = media.video;
        video.style.cssText = `
            width: auto;
            height: auto;
            max-width: 85vw;
            max-height: 65vh;
            display: block;
        `;
        video.autoplay = true;
        video.loop = true;
        video.muted = false;
        video.controls = true;
        mediaContainer.appendChild(video);
    } else {
        // Show image
        const img = document.createElement('img');
        img.src = media.image;
        img.style.cssText = `
            width: auto;
            height: auto;
            max-width: 85vw;
            max-height: 65vh;
            display: block;
        `;
        mediaContainer.appendChild(img);
    }
    
    modal.appendChild(mediaContainer);
    
    // Level indicator
    const levelIndicator = document.createElement('div');
    levelIndicator.textContent = `Level ${level} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    levelIndicator.style.cssText = `
        color: #aaa;
        font-size: 1.2em;
        margin-bottom: 15px;
    `;
    modal.appendChild(levelIndicator);
    
    // Close instructions
    const closeText = document.createElement('div');
    closeText.textContent = 'Click anywhere or press ESC to close';
    closeText.style.cssText = `
        color: #666;
        font-size: 0.9em;
        margin-top: 10px;
    `;
    modal.appendChild(closeText);
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ Close';
    closeBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(255,255,255,0.1);
        color: white;
        border: 1px solid rgba(255,255,255,0.3);
        padding: 10px 20px;
        font-size: 1em;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.2s;
    `;
    closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255,255,255,0.2)';
    closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255,255,255,0.1)';
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        modal.remove();
    };
    modal.appendChild(closeBtn);
    
    // Close on click anywhere
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
    
    // Close on ESC key
    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
    
    document.body.appendChild(modal);
}

// ═══════════════════════════════════════════════════════════════════
// LORE POPUP
// ═══════════════════════════════════════════════════════════════════

export function showLorePopup(title: string, text: string): void {
    if (!uiState.loreEnabled) return;
    
    const titleEl = document.getElementById('lore-title');
    const textEl = document.getElementById('lore-text');
    const overlay = document.getElementById('lore-popup-overlay');
    const popup = document.getElementById('lore-popup');
    
    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = text;
    if (overlay) overlay.style.display = 'block';
    if (popup) popup.style.display = 'block';
}

function closeLorePopup(): void {
    hideElement('lore-popup-overlay');
    hideElement('lore-popup');
}

// ═══════════════════════════════════════════════════════════════════
// GAME OVER - Newspaper Style Death Screen
// ═══════════════════════════════════════════════════════════════════

export interface GameOverStats {
    peakPop: number;
    years: number;
    headline?: string;
    subheadline?: string;
    food?: number;
    wood?: number;
    stone?: number;
    metal?: number;
    wells?: number;
    buildings?: number;
    highestResLevel?: number;
    deathReason?: 'THIRST' | 'STARVATION' | 'HUNTING' | 'FLOOD' | 'UNKNOWN';
    gamePhase?: 'WANDER' | 'CITY';
}

export function showGameOver(stats: GameOverStats): void {
    const screen = document.getElementById('gameover-screen');
    if (!screen) return;
    
    screen.style.display = 'flex';
    
    // Get elements
    const dateEl = document.getElementById('newspaper-date');
    const headlineEl = document.getElementById('newspaper-headline');
    const bodyEl = document.getElementById('newspaper-body');
    const statsEl = document.getElementById('newspaper-stats');
    const canvas = document.getElementById('fossil-illustration') as HTMLCanvasElement;
    
    // Set current date
    if (dateEl) {
        const now = new Date();
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        dateEl.textContent = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    }
    
    // Generate newspaper content based on death reason
    const reason = stats.deathReason || 'UNKNOWN';
    const pop = stats.peakPop || 1;
    const years = stats.years || 0;
    const food = stats.food ?? 0;
    const wood = stats.wood ?? 0;
    const resLevel = stats.highestResLevel || 0;
    
    // Population description
    let popDesc = 'a solitary wanderer';
    if (pop >= 100) popDesc = `a thriving community of ${pop}`;
    else if (pop >= 50) popDesc = `a growing tribe of ${pop}`;
    else if (pop >= 20) popDesc = `a small clan of ${pop}`;
    else if (pop >= 10) popDesc = `a band of ${pop} individuals`;
    else if (pop >= 3) popDesc = `a family group of ${pop}`;
    
    // Tech level description based on highest residential
    let techDesc = 'primitive nomadic';
    if (resLevel >= 6) techDesc = 'advanced log compound';
    else if (resLevel >= 5) techDesc = 'developed longhouse';
    else if (resLevel >= 4) techDesc = 'organized tipi village';
    else if (resLevel >= 3) techDesc = 'cave-dwelling';
    else if (resLevel >= 2) techDesc = 'ground pit shelter';
    else if (resLevel >= 1) techDesc = 'tree shelter';
    
    // Generate headline and body based on death reason
    let headline = 'ANCIENT SETTLEMENT VANISHES';
    let body = '';
    
    const professors = ['Dr. Sarah Chen', 'Dr. Michael Oduya', 'Dr. Elena Vasquez', 'Dr. James Thornton', 'Dr. Catherine Dubois', 'Dr. Henrik Larsson', 'Dr. Priya Nair'];
    const prof = professors[Math.floor(Math.random() * professors.length)];
    
    switch (reason) {
        case 'THIRST':
            headline = `TRIBE PERISHES FROM DEHYDRATION`;
            body = `<p><strong>ANCIENT VALLEY</strong> — Archaeologists have uncovered the remains of ${popDesc}, a ${techDesc} society that collapsed approximately ${years} years into their settlement.</p>
                <p>Analysis reveals catastrophic dehydration as the primary cause. "${years > 0 ? 'They survived ' + years + ' years' : 'They barely had time to establish themselves'} before succumbing to water scarcity," explained ${prof}. "The absence of wells or reliable water infrastructure sealed their fate."</p>
                <p>Bone analysis shows progressive signs of water stress. The settlement existed without permanent water infrastructure—a fatal oversight that claimed every member.</p>
                <p>"Water was everything in prehistoric times. Those who planned ahead survived. These... became archaeology."</p>`;
            break;
        case 'STARVATION':
            headline = `FAMINE CLAIMS ${pop > 1 ? 'ENTIRE TRIBE' : 'LONE WANDERER'}`;
            body = `<p><strong>REMOTE EXCAVATION SITE</strong> — The skeletal remains of ${popDesc} have been unearthed, revealing a ${techDesc} community that starved during year ${years}.</p>
                <p>"The evidence is clear," states ${prof}. "No food stores remained. ${food > 0 ? 'Only ' + food + ' units of provisions were found' : 'Not a single preserved food item was discovered'}—nowhere near enough for survival."</p>
                <p>The settlement's ${wood > 0 ? wood + ' wood implements suggest' : 'lack of wooden tools indicates'} ${wood > 50 ? 'capable craftsmen who simply couldn\'t find enough game' : 'a group struggling with basic survival skills'}.</p>
                <p>"Starvation was always one bad season away for early humans. This group ran out of luck."</p>`;
            break;
        case 'HUNTING':
            headline = `HUNTING EXPEDITION TURNS DEADLY`;
            body = `<p><strong>PREHISTORIC HUNTING GROUNDS</strong> — A tragic discovery reveals ${popDesc} who met their end during what appears to be a catastrophic hunting incident in year ${years}.</p>
                <p>"Skeletal trauma patterns are unmistakable," reports ${prof}. "Large animal bones nearby suggest they attempted to take down dangerous prey—and lost."</p>
                <p>The ${techDesc} group had achieved ${resLevel > 0 ? 'level ' + resLevel + ' shelter technology' : 'no permanent shelter'}. ${food > 10 ? 'With ' + food + ' food units stored, they weren\'t desperate—just unlucky.' : 'Hunger may have driven them to take dangerous risks.'}</p>
                <p>"Pack hunting was how humans survived, but one wrong move against a mammoth or bear could wipe out an entire band."</p>`;
            break;
        case 'FLOOD':
            headline = `FLOOD DEVASTATES ANCIENT SETTLEMENT`;
            body = `<p><strong>RIVER VALLEY SITE</strong> — Geological evidence confirms ${popDesc} were swept away by catastrophic flooding during year ${years} of their settlement.</p>
                <p>"They built too close to the water," explains ${prof}. "A ${techDesc} society with ${stats.buildings || 0} structures—all lost in a single flood event."</p>
                <p>Sediment layers show rapid inundation. ${stats.wells || 0 > 0 ? 'Their ' + stats.wells + ' wells were overwhelmed' : 'The irony—they died from too much water, not too little'}.</p>
                <p>"Climate was unpredictable. The rivers that gave life could also take it away without warning."</p>`;
            break;
        default:
            headline = `MYSTERY SURROUNDS SETTLEMENT'S END`;
            body = `<p><strong>UNCHARTED TERRITORY</strong> — The remains of ${popDesc} have been discovered, a ${techDesc} society that vanished in year ${years} under unclear circumstances.</p>
                <p>"We may never know exactly what happened," admits ${prof}. "Disease, conflict, migration—the prehistoric world was harsh and unforgiving."</p>
                <p>The settlement reached ${resLevel > 0 ? 'level ' + resLevel + ' residential technology' : 'no permanent structures'}. ${food > 0 ? food + ' food units' : 'No food'} and ${wood > 0 ? wood + ' wood' : 'no wood'} remained.</p>
                <p>"Most early human groups left no trace at all. At least this one we can remember."</p>`;
    }
    
    if (headlineEl) headlineEl.textContent = headline;
    if (bodyEl) bodyEl.innerHTML = body;
    
    // Generate stats box
    if (statsEl) {
        const verdictColor = reason === 'UNKNOWN' ? '#666' : '#8B0000';
        const verdictText = {
            'THIRST': 'Death by dehydration',
            'STARVATION': 'Death by starvation',
            'HUNTING': 'Killed while hunting',
            'FLOOD': 'Drowned in flood',
            'UNKNOWN': 'Cause unknown'
        }[reason];
        
        statsEl.innerHTML = `<strong>📋 ARCHAEOLOGICAL SURVEY:</strong><br>
            • Peak population: ${pop}<br>
            • Years survived: ${years}<br>
            • Technology level: ${techDesc} (Res Lvl ${resLevel})<br>
            • Dwellings: ${stats.buildings || 0}<br>
            • Water wells: ${stats.wells || 0}<br>
            • Food at collapse: ${food} units<br>
            • Wood reserves: ${wood} units<br>
            • Verdict: <span style="color:${verdictColor};">${verdictText}</span>`;
    }
    
    // Draw illustration on canvas - show highest residential level building
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            drawDeathScreenIllustration(ctx, canvas.width, canvas.height, resLevel);
        }
    }
}

/** Draw the fossil/building illustration for death screen */
function drawDeathScreenIllustration(ctx: CanvasRenderingContext2D, w: number, h: number, resLevel: number): void {
    // Background - aged paper texture
    ctx.fillStyle = '#D4C4A8';
    ctx.fillRect(0, 0, w, h);
    
    // Add texture spots
    for (let i = 0; i < 40; i++) {
        ctx.fillStyle = ['#C9B896', '#BFA97E', '#E0D4BC', '#A89878'][Math.floor(Math.random() * 4)];
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 6 + 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    const cx = w / 2;
    const cy = h / 2 + 10;
    const scale = 2.5;
    
    // Draw building based on level (orthographic style, abandoned/fossil look)
    const boneColor = '#F5F0E0';
    const boneShade = '#D8D0BC';
    const crackColor = '#A09080';
    
    if (resLevel >= 3) {
        // Level 3+ House structure (ruined)
        // Foundation stones
        ctx.fillStyle = '#7A7A6A';
        ctx.fillRect(cx - 40, cy + 20, 80, 12);
        
        // Ruined walls
        ctx.fillStyle = boneColor;
        ctx.fillRect(cx - 35, cy - 15, 70, 38);
        ctx.strokeStyle = boneShade;
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - 35, cy - 15, 70, 38);
        
        // Collapsed roof (leaning)
        ctx.fillStyle = '#8B6914';
        ctx.beginPath();
        ctx.moveTo(cx - 45, cy - 10);
        ctx.lineTo(cx, cy - 40);
        ctx.lineTo(cx + 45, cy - 10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = crackColor;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Cracks in walls
        ctx.strokeStyle = crackColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 20, cy - 10);
        ctx.lineTo(cx - 10, cy + 5);
        ctx.lineTo(cx - 15, cy + 20);
        ctx.stroke();
        
        // Dark doorway
        ctx.fillStyle = '#2A2A1A';
        ctx.fillRect(cx - 8, cy, 16, 23);
        
    } else if (resLevel >= 2) {
        // Level 2 - Improved hut (ruined)
        // Base circle
        ctx.fillStyle = '#A89070';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 15, 40, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Walls
        ctx.fillStyle = boneColor;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 35, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = boneShade;
        ctx.stroke();
        
        // Collapsed conical roof
        ctx.fillStyle = '#7A8B45';
        ctx.beginPath();
        ctx.moveTo(cx - 40, cy - 5);
        ctx.lineTo(cx - 5, cy - 35);
        ctx.lineTo(cx + 40, cy - 5);
        ctx.closePath();
        ctx.fill();
        
        // Cracks
        ctx.strokeStyle = crackColor;
        ctx.beginPath();
        ctx.moveTo(cx + 10, cy - 25);
        ctx.lineTo(cx + 15, cy - 10);
        ctx.stroke();
        
    } else if (resLevel >= 1) {
        // Level 1 - Simple shelter (ruins)
        // Ground
        ctx.fillStyle = '#A89070';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 12, 35, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Collapsed lean-to
        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.moveTo(cx - 30, cy + 15);
        ctx.lineTo(cx, cy - 25);
        ctx.lineTo(cx + 30, cy + 15);
        ctx.closePath();
        ctx.fill();
        
        // Thatch lines
        ctx.strokeStyle = '#6D5A4A';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const ty = cy - 15 + i * 7;
            const tw = 8 + i * 4;
            ctx.beginPath();
            ctx.moveTo(cx - tw, ty);
            ctx.lineTo(cx + tw, ty);
            ctx.stroke();
        }
        
    } else {
        // No buildings - just bones/fossils
        // Skull
        ctx.beginPath();
        ctx.ellipse(cx - 40, cy, 28, 22, 0.2, 0, Math.PI * 1.8);
        ctx.fillStyle = boneColor;
        ctx.fill();
        ctx.strokeStyle = boneShade;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Eye socket
        ctx.fillStyle = '#B0A090';
        ctx.beginPath();
        ctx.ellipse(cx - 32, cy + 8, 7, 9, 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Spine
        for (let v = 0; v < 5; v++) {
            ctx.beginPath();
            ctx.ellipse(cx + v * 16, cy + Math.sin(v) * 3, 8, 6, 0.3, 0, Math.PI * 2);
            ctx.fillStyle = boneColor;
            ctx.fill();
            ctx.strokeStyle = boneShade;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        // Femur
        ctx.fillStyle = boneColor;
        ctx.save();
        ctx.translate(cx + 60, cy - 20);
        ctx.rotate(0.4);
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-4, 0, 8, 40);
        ctx.beginPath();
        ctx.ellipse(0, 40, 10, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Cracks
        ctx.strokeStyle = crackColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 50, cy - 5);
        ctx.lineTo(cx - 35, cy + 3);
        ctx.lineTo(cx - 38, cy + 15);
        ctx.stroke();
    }
    
    // Add "RUINED" or "FOSSILIZED" label
    ctx.fillStyle = '#666';
    ctx.font = 'italic 11px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(resLevel > 0 ? '~ Ruined Settlement ~' : '~ Fossilized Remains ~', cx, h - 8);
}

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD UPDATES
// ═══════════════════════════════════════════════════════════════════

export function updateDashboard(data: {
    pop?: number;
    food?: string;
    wood?: number;
    metal?: number;
    stone?: number;
    inventory?: string;
    year?: number;
    thirst?: number;
    water?: string;
    gold?: number;
    epoch?: string;
    rDemand?: number;
    cDemand?: number;
    iDemand?: number;
}): void {
    if (data.pop !== undefined) updateElement('v-pop', String(data.pop));
    if (data.food !== undefined) updateElement('v-food', data.food);
    if (data.wood !== undefined) updateElement('v-wood', String(data.wood));
    if (data.metal !== undefined) updateElement('v-metal', String(data.metal));
    if (data.stone !== undefined) updateElement('v-stone', String(data.stone));
    if (data.inventory !== undefined) updateElement('v-inventory', data.inventory);
    if (data.year !== undefined) updateElement('v-year', String(data.year));
    if (data.thirst !== undefined) updateElement('v-thirst', String(data.thirst));
    if (data.water !== undefined) updateElement('v-wat', data.water);
    if (data.gold !== undefined) updateElement('v-res', String(data.gold));
    if (data.epoch !== undefined) updateElement('v-epoch', data.epoch);
    
    // Update RCI bars
    if (data.rDemand !== undefined) {
        const bar = document.getElementById('r-bar-fill');
        if (bar) bar.style.height = `${Math.min(100, Math.max(10, data.rDemand))}%`;
    }
    if (data.cDemand !== undefined) {
        const bar = document.getElementById('c-bar-fill');
        if (bar) bar.style.height = `${Math.min(100, Math.max(10, data.cDemand))}%`;
    }
    if (data.iDemand !== undefined) {
        const bar = document.getElementById('i-bar-fill');
        if (bar) bar.style.height = `${Math.min(100, Math.max(10, data.iDemand))}%`;
    }
}

export function updateDebugInfo(text: string): void {
    updateElement('debug', text);
}

// ═══════════════════════════════════════════════════════════════════
// FILE OPERATIONS
// ═══════════════════════════════════════════════════════════════════

function triggerFileLoad(): void {
    const input = document.getElementById('file-input') as HTMLInputElement;
    if (input) {
        input.click();
        input.onchange = () => {
            if (input.files && input.files[0]) {
                onAction?.('LOAD_FILE');
            }
        };
    }
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function addClickHandler(id: string, handler: () => void): void {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('click', handler);
    }
}

function showElement(id: string): void {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = el.tagName === 'DIV' ? 'block' : 'flex';
    }
}

function hideElement(id: string): void {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = 'none';
    }
}

function updateElement(id: string, text: string): void {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = text;
    }
}

// ═══════════════════════════════════════════════════════════════════
// UI MODE SWITCHING - WANDER vs CITY
// ═══════════════════════════════════════════════════════════════════

/** Update settle button visibility based on requirements */
export function updateSettleButton(canSettle: boolean, gamePhase: 'WANDER' | 'CITY'): void {
    const settleBtn = document.getElementById('btn-settle');
    if (!settleBtn) return;
    
    // Hide in CITY mode, show in WANDER mode only when requirements met
    if (gamePhase === 'CITY') {
        settleBtn.style.display = 'none';
    } else {
        settleBtn.style.display = canSettle ? 'flex' : 'none';
    }
}

/** Switch UI to WANDER mode - hide building buttons */
export function showWanderUI(): void {
    // Hide city-only buttons
    hideElement('t-res');
    hideElement('t-com');
    hideElement('t-ind');
    hideElement('t-special');
    hideElement('t-milestone');
    hideElement('t-road');
    hideElement('t-exchange');
    
    // Show wander-specific buttons
    showElement('t-well'); // Well button works in both modes
}

/** Switch UI to CITY mode - show building buttons */
export function showCityUI(): void {
    // Show city building buttons
    showElement('t-res');
    showElement('t-com');
    showElement('t-ind');
    showElement('t-special');
    showElement('t-milestone');
    showElement('t-road');
    showElement('t-exchange');
    showElement('t-well');
    
    // Hide settle button
    hideElement('btn-settle');
}

function showElementInline(id: string): void {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = 'inline-flex';
    }
}

// Export state getter
export function getUIState(): UIState {
    return { ...uiState };
}
