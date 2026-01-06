// ═══════════════════════════════════════════════════════════════════════════════
// CIVIL ZONES: STONE AGE - UI Manager
// ═══════════════════════════════════════════════════════════════════════════════
// DOM manipulation and UI updates
// ═══════════════════════════════════════════════════════════════════════════════

class UI {
    constructor() {
        // Cache DOM elements
        this.elements = {};
        this.buildMenu = null;
        this.selectedBuildingType = null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Initialize UI
    // ─────────────────────────────────────────────────────────────────────────
    init() {
        // Cache resource bar elements
        this.elements = {
            // Top bar
            year: document.getElementById('year'),
            mode: document.getElementById('mode'),
            level: document.getElementById('level'),
            
            // Resources
            population: document.getElementById('population'),
            food: document.getElementById('food'),
            wood: document.getElementById('wood'),
            stone: document.getElementById('stone'),
            thirst: document.getElementById('thirst'),
            thirstBar: document.getElementById('thirst-bar'),
            
            // Action buttons
            btnSettle: document.getElementById('btn-settle'),
            btnWell: document.getElementById('btn-well'),
            btnChop: document.getElementById('btn-chop'),
            btnSave: document.getElementById('btn-save'),
            btnLoad: document.getElementById('btn-load'),
            
            // Build menu
            buildMenu: document.getElementById('build-menu'),
            
            // Info panel
            infoPanel: document.getElementById('info-panel'),
            infoPanelContent: document.getElementById('info-content'),
            
            // Settlement dialog
            settleDialog: document.getElementById('settle-dialog'),
            settleName: document.getElementById('settle-name'),
            settleConfirm: document.getElementById('settle-confirm'),
            settleCancel: document.getElementById('settle-cancel'),
        };
        
        console.log('[UI] Initialized');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Update Stats Display
    // ─────────────────────────────────────────────────────────────────────────
    updateStats(game) {
        const stats = game.getStats();
        
        // Update elements with safe checks
        if (this.elements.year) this.elements.year.textContent = stats.year;
        if (this.elements.mode) this.elements.mode.textContent = stats.mode;
        if (this.elements.level) this.elements.level.textContent = `Level ${stats.level}`;
        if (this.elements.population) this.elements.population.textContent = stats.population;
        if (this.elements.food) this.elements.food.textContent = stats.food;
        if (this.elements.wood) this.elements.wood.textContent = stats.wood;
        if (this.elements.stone) this.elements.stone.textContent = stats.stone;
        
        // Thirst bar (WANDER mode only)
        if (game.mode === 'WANDER') {
            if (this.elements.thirst) {
                this.elements.thirst.textContent = stats.thirst;
                const thirstContainer = document.querySelector('.thirst-container');
                if (thirstContainer) thirstContainer.style.display = 'flex';
            }
            if (this.elements.thirstBar) {
                const percent = (stats.thirst / CFG.THIRST.MAX) * 100;
                this.elements.thirstBar.style.width = `${percent}%`;
                
                // Color based on thirst level
                if (stats.thirst <= CFG.THIRST.CRITICAL) {
                    this.elements.thirstBar.style.backgroundColor = '#ef4444';
                } else if (stats.thirst <= CFG.THIRST.WARNING) {
                    this.elements.thirstBar.style.backgroundColor = '#f59e0b';
                } else {
                    this.elements.thirstBar.style.backgroundColor = '#06b6d4';
                }
            }
        } else {
            // Hide thirst in CITY mode
            const thirstContainer = document.querySelector('.thirst-container');
            if (thirstContainer) thirstContainer.style.display = 'none';
        }
        
        // Update button visibility based on mode
        this.updateButtonVisibility(game);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Button Visibility
    // ─────────────────────────────────────────────────────────────────────────
    updateButtonVisibility(game) {
        if (game.mode === 'WANDER') {
            // Show WANDER actions
            if (this.elements.btnSettle) this.elements.btnSettle.style.display = 'inline-block';
            if (this.elements.btnChop) this.elements.btnChop.style.display = 'inline-block';
            if (this.elements.buildMenu) this.elements.buildMenu.style.display = 'none';
            
            // Check settle requirements
            if (this.elements.btnSettle) {
                const canSettle = game.canSettle().ok;
                this.elements.btnSettle.disabled = !canSettle;
                this.elements.btnSettle.classList.toggle('disabled', !canSettle);
            }
        } else {
            // Show CITY actions
            if (this.elements.btnSettle) this.elements.btnSettle.style.display = 'none';
            if (this.elements.btnChop) this.elements.btnChop.style.display = 'none';
            if (this.elements.buildMenu) this.elements.buildMenu.style.display = 'flex';
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Build Menu
    // ─────────────────────────────────────────────────────────────────────────
    setupBuildMenu(game) {
        if (!this.elements.buildMenu) return;
        
        this.elements.buildMenu.innerHTML = '';
        
        // Well button (always available)
        const wellBtn = this.createBuildButton({
            key: 'WELL',
            name: CFG.WELL.name,
            icon: CFG.WELL.icon,
            cost: CFG.WELL.cost,
        });
        this.elements.buildMenu.appendChild(wellBtn);
        
        // Building buttons
        for (const [key, building] of Object.entries(CFG.BUILDINGS)) {
            // Only show buildings for current level
            if (building.level > game.level) continue;
            
            const btn = this.createBuildButton({
                key,
                name: building.states.LOW.name,
                icon: building.states.LOW.icon,
                cost: building.cost,
                type: building.type,
            });
            this.elements.buildMenu.appendChild(btn);
        }
    }

    createBuildButton(info) {
        const btn = document.createElement('button');
        btn.className = `build-btn ${info.type?.toLowerCase() || 'utility'}`;
        btn.dataset.buildKey = info.key;
        
        btn.innerHTML = `
            <span class="build-icon">${info.icon}</span>
            <span class="build-name">${info.name}</span>
            <span class="build-cost">
                ${info.cost.food ? `🍖${info.cost.food}` : ''}
                ${info.cost.wood ? `🪵${info.cost.wood}` : ''}
                ${info.cost.stone ? `🪨${info.cost.stone}` : ''}
            </span>
        `;
        
        btn.addEventListener('click', () => {
            this.selectBuildingType(info.key);
        });
        
        return btn;
    }

    selectBuildingType(key) {
        this.selectedBuildingType = key;
        
        // Update UI to show selected
        const buttons = this.elements.buildMenu.querySelectorAll('.build-btn');
        buttons.forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.buildKey === key);
        });
        
        Utils.showToast(`Selected: ${key}. Click on map to place.`, 'info');
    }

    getSelectedBuildingType() {
        return this.selectedBuildingType;
    }

    clearSelection() {
        this.selectedBuildingType = null;
        const buttons = this.elements.buildMenu?.querySelectorAll('.build-btn');
        buttons?.forEach(btn => btn.classList.remove('selected'));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Settlement Dialog
    // ─────────────────────────────────────────────────────────────────────────
    showSettleDialog(callback) {
        if (!this.elements.settleDialog) {
            // Fallback to prompt
            const name = prompt('Name your settlement:', 'New Settlement');
            if (name) callback(name);
            return;
        }
        
        this.elements.settleDialog.style.display = 'flex';
        this.elements.settleName.value = '';
        this.elements.settleName.focus();
        
        // Clean up old handlers
        const confirmBtn = this.elements.settleConfirm;
        const cancelBtn = this.elements.settleCancel;
        
        const newConfirm = confirmBtn.cloneNode(true);
        const newCancel = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
        this.elements.settleConfirm = newConfirm;
        this.elements.settleCancel = newCancel;
        
        newConfirm.addEventListener('click', () => {
            const name = this.elements.settleName.value.trim() || 'New Settlement';
            this.elements.settleDialog.style.display = 'none';
            callback(name);
        });
        
        newCancel.addEventListener('click', () => {
            this.elements.settleDialog.style.display = 'none';
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Info Panel (Tile Details)
    // ─────────────────────────────────────────────────────────────────────────
    showTileInfo(tile, game) {
        if (!this.elements.infoPanel || !this.elements.infoPanelContent) return;
        if (!tile) {
            this.elements.infoPanel.style.display = 'none';
            return;
        }
        
        let content = `<h3>Tile (${tile.x}, ${tile.y})</h3>`;
        content += `<p><strong>Type:</strong> ${tile.type}</p>`;
        content += `<p><strong>Passable:</strong> ${tile.passable ? 'Yes' : 'No'}</p>`;
        
        if (tile.hasTree) {
            content += `<p>🌲 <strong>Tree available</strong></p>`;
        }
        
        if (tile.road) {
            content += `<p>🛤️ <strong>Road</strong></p>`;
        }
        
        if (tile.tileBonus) {
            content += `<p>⭐ <strong>Bonus:</strong> ${JSON.stringify(tile.tileBonus)}</p>`;
        }
        
        if (tile.building) {
            const building = tile.building;
            const def = CFG.BUILDINGS[building.key];
            const stateInfo = def.states[building.state];
            
            content += `<hr>`;
            content += `<h4>${stateInfo.icon} ${stateInfo.name}</h4>`;
            content += `<p><strong>State:</strong> ${building.state}</p>`;
            content += `<p><strong>Desirability:</strong> ${building.desirability}</p>`;
            if (building.type === 'RES') {
                content += `<p><strong>Population:</strong> ${building.population}/${def.capacity}</p>`;
            }
        }
        
        // Check for entities
        const entity = game.map.getEntityAt(tile.x, tile.y);
        if (entity) {
            content += `<hr>`;
            content += `<p>📦 <strong>${entity.type}</strong>: ${entity.amount}</p>`;
        }
        
        // Check for animals
        const animal = game.map.getAnimalAt(tile.x, tile.y);
        if (animal) {
            content += `<hr>`;
            content += `<p>🦌 <strong>${animal.type}</strong> (Herd: ${animal.herdSize})</p>`;
            content += `<p>Food value: ${animal.food}</p>`;
        }
        
        this.elements.infoPanelContent.innerHTML = content;
        this.elements.infoPanel.style.display = 'block';
    }

    hideInfoPanel() {
        if (this.elements.infoPanel) {
            this.elements.infoPanel.style.display = 'none';
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Keyboard Help
    // ─────────────────────────────────────────────────────────────────────────
    showHelp() {
        const help = `
╔══════════════════════════════════════╗
║     CIVIL ZONES: STONE AGE HELP      ║
╠══════════════════════════════════════╣
║ WASD / Arrows  - Move                ║
║ C              - Chop tree           ║
║ W              - Place water pit     ║
║ S              - Settle (if ready)   ║
║ Space          - Advance turn (CITY) ║
║ Esc            - Cancel selection    ║
║ Mouse Wheel    - Zoom in/out         ║
║ Right Drag     - Pan camera          ║
║ F5             - Quick save          ║
║ F9             - Quick load          ║
╚══════════════════════════════════════╝
        `;
        console.log(help);
        Utils.showToast('Help printed to console (F12)', 'info');
    }
}

window.UI = UI;
