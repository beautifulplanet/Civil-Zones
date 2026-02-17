import { ChunkManager } from './world/ChunkManager';
import { Player } from './world/Player';
import { Camera } from './rendering/Camera';
import { Renderer } from './rendering/Renderer';
import { createGameState } from './game/GameState';
import { getThirstWarning } from './ui/WarningSystem';
import './style.css';

// Setup Canvas
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <canvas id="gameCanvas"></canvas>
  <div id="ui" style="position: absolute; top: 10px; left: 10px; color: white; font-family: monospace; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px;">
    <div id="coordInfo">Cam: 0, 0 Zoom: 1.00</div>
    <hr style="border-color: #444;">
    
    <div style="margin: 10px 0;">
      <label>Level: </label>
      <select id="levelSelect" style="pointer-events: auto;">
        <option value="1">L1 - Stone Age Basic</option>
        <option value="2">L2 - Stone Age Advanced</option>
        <option value="3">L3 - Stone Age Master</option>
        <option value="4" disabled>L4 - Requires Chief's Hut</option>
        <option value="5" disabled>L5 - Requires Chief's Hut</option>
        <option value="6" disabled>L6 - Requires Chief's Hut</option>
      </select>
    </div>
    
    <div id="cityButtons" style="margin: 10px 0; pointer-events: auto;">
      <button id="placeResBtn" style="background:#4CAF50; color:white; padding:5px 10px; border:none; cursor:pointer;">🏕️ Residential (R)</button>
      <button id="placeComBtn" style="background:#2196F3; color:white; padding:5px 10px; border:none; cursor:pointer;">🔥 Commercial (C)</button>
      <button id="placeIndBtn" style="background:#FF9800; color:white; padding:5px 10px; border:none; cursor:pointer;">🦅 Industrial (I)</button>
    </div>
    
    <div id="wanderButtons" style="margin: 10px 0; pointer-events: auto; display: none;">
      <button id="gatherFoodBtn" style="background:#4CAF50; color:white; padding:5px 10px; border:none; cursor:pointer;">🍇 Gather Food</button>
      <button id="gatherWoodBtn" style="background:#8B4513; color:white; padding:5px 10px; border:none; cursor:pointer;">🌳 Gather Wood</button>
      <button id="digWellBtn" style="background:#00BCD4; color:white; padding:5px 10px; border:none; cursor:pointer;">💧 Dig Well</button>
      <button id="settleBtn" style="background:#FF5722; color:white; padding:10px 20px; border:none; cursor:pointer; font-weight: bold; display: none;">🏛️ SETTLE CITY</button>
    </div>
    
    <div style="margin: 10px 0; pointer-events: auto;">
      <button id="placeWellBtn" style="background:#00BCD4; color:white; padding:5px 10px; border:none; cursor:pointer;">💧 Well (W)</button>
      <button id="placeRoadBtn" style="background:#795548; color:white; padding:5px 10px; border:none; cursor:pointer;">🛤️ Road (D)</button>
    </div>
    
    <hr style="border-color: #444;">
    <div id="resourceInfo"></div>
    <div id="selectedInfo" style="margin-top: 10px; color: #ffeb3b;"></div>
    <hr style="border-color: #444;">
    <div style="margin: 10px 0; pointer-events: auto;">
      <button id="endTurnBtn" style="background:#e91e63; color:white; padding:10px 20px; border:none; cursor:pointer; font-size: 14px; font-weight: bold;">⏭️ END TURN (Space)</button>
    </div>
    <div id="turnLog" style="margin-top: 10px; font-size: 11px; max-height: 100px; overflow-y: auto; color: #aaa;"></div>
  </div>
`;

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;

// Resize handling
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (camera) camera.resize(canvas.width, canvas.height);
}
window.addEventListener('resize', resize);

// Initialize Systems
const chunkManager = new ChunkManager();
const camera = new Camera(window.innerWidth, window.innerHeight);
const player = new Player(50, 50); // Spawn at position with land
const gameState = createGameState(chunkManager);
const renderer = new Renderer(canvas, camera, chunkManager, player);
renderer.setBuildingManager(gameState.buildings);

// Initialize Entity System
import { EntityManager, damageEntity, getEntityFoodReward, isAnimal } from './world/Entity';
import { ANIMAL_CONFIG, calculateHitChance, calculateHostileDamage } from './config/CombatConfig';
const entityManager = new EntityManager(chunkManager);

// Spawn initial entities near player spawn point
// Includes all animal types per game-data-spec §3.1
// INCREASED counts for a more populated world
entityManager.spawnEntitiesInArea(50, 50, 60, {
    deer: 18,
    rabbits: 30,
    boars: 8,      // Dangerous - charges
    bears: 5,      // Dangerous - aggressive
    bison: 12,     // Medium risk - flees
    nomads: 25     // Mix of friendly/hostile (chase animals, wave, dance)
});

// Connect entity manager to renderer
renderer.setEntityManager(entityManager);

// Initialize Minimap
import { Minimap } from './ui/Minimap';
const minimap = new Minimap();

// Function to toggle UI based on game phase
function updateUIForPhase() {
    const cityButtons = document.getElementById('cityButtons');
    const wanderButtons = document.getElementById('wanderButtons');
    const levelSelect = document.getElementById('levelSelect')?.parentElement;
    const endTurnBtn = document.getElementById('endTurnBtn')?.parentElement;

    if (gameState.phase === 'WANDER') {
        if (cityButtons) cityButtons.style.display = 'none';
        if (wanderButtons) wanderButtons.style.display = 'block';
        if (levelSelect) levelSelect.style.display = 'none';
        if (endTurnBtn) endTurnBtn.style.display = 'none';
    } else {
        if (cityButtons) cityButtons.style.display = 'block';
        if (wanderButtons) wanderButtons.style.display = 'none';
        if (levelSelect) levelSelect.style.display = 'block';
        if (endTurnBtn) endTurnBtn.style.display = 'block';
    }
}

// Update UI for current phase
updateUIForPhase();

// Initial Resize
resize();
// Spawn camera at coordinates more likely to have land
camera.state.x = 50;
camera.state.y = 50;

// Input Handling
let isDragging = false;
let lastX = 0;
let lastY = 0;

canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

window.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        camera.pan(dx, dy);
        lastX = e.clientX;
        lastY = e.clientY;
    }

    const coordInfo = document.getElementById('coordInfo');
    if (coordInfo) {
        coordInfo.innerText = `Cam: ${camera.state.x.toFixed(1)}, ${camera.state.y.toFixed(1)} Zoom: ${camera.state.zoom.toFixed(2)}`;
    }
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    camera.zoomAt(e.clientX, e.clientY, delta);
}, { passive: false });

// Import TileType for water access check
import { TileType } from './world/Tile';

// Check if player is within range of water
function checkWaterAccess(x: number, y: number): boolean {
    const radius = 5;
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            const tile = chunkManager.getTile(Math.floor(x) + dx, Math.floor(y) + dy);
            if (tile && tile.type === TileType.WATER) return true;
        }
    }
    return false;
}

// Update settle button visibility and show requirements
function updateSettleButton() {
    const settleBtn = document.getElementById('settleBtn') as HTMLButtonElement;
    if (!settleBtn) return;

    const resources = gameState.resources.getResources();
    const hasWaterAccess = checkWaterAccess(player.x, player.y) || gameState.hasWell;

    // Requirements per game bible §7.1
    const hasPopulation = gameState.population >= 5;
    const hasFood = resources.food >= 100;
    const hasWood = resources.wood >= 40;
    const canSettle = hasPopulation && hasFood && hasWood && hasWaterAccess;

    settleBtn.style.display = canSettle ? 'inline-block' : 'none';

    // Show requirements progress in title
    const status = [
        hasPopulation ? '✅' : '❌', `Tribe: ${gameState.population}/5`,
        hasFood ? '✅' : '❌', `Food: ${resources.food}/100`,
        hasWood ? '✅' : '❌', `Wood: ${resources.wood}/40`,
        hasWaterAccess ? '✅' : '❌', 'Water'
    ].join(' ');
    settleBtn.title = `Settlement Requirements:\n${status}`;
}

// Building placement
let selectedType: 'R' | 'C' | 'I' | 'WELL' | 'ROAD' | null = null;
let selectedLevel = 1;

function getSelectedBuildingId(): string | null {
    if (!selectedType) return null;
    if (selectedType === 'WELL') return 'WELL';
    if (selectedType === 'ROAD') return 'ROAD';
    return `${selectedType}${selectedLevel}`;
}

function updateSelectedInfo() {
    const selectedInfo = document.getElementById('selectedInfo');
    const buildingId = getSelectedBuildingId();
    if (selectedInfo) {
        if (buildingId) {
            import('./config/BuildingConfig').then(({ getBuildingById }) => {
                const def = getBuildingById(buildingId);
                if (def) {
                    selectedInfo.innerHTML = `<b>Selected:</b> ${def.emoji} ${def.name}<br>Cost: 🍖${def.cost.food || 0} 🪵${def.cost.wood || 0} 🪨${def.cost.stone || 0}`;
                }
            });
        } else {
            selectedInfo.innerHTML = 'Click a button to select building type';
        }
    }
}

// Update HUD
function updateHUD() {
    const resources = gameState.resources.getResources();
    const resourceInfo = document.getElementById('resourceInfo');
    if (resourceInfo) {
        if (gameState.phase === 'WANDER') {
            // WANDER mode: show thirst and basic resources
            const thirstColor = gameState.thirst > 70 ? '#4CAF50' : gameState.thirst > 50 ? '#FF9800' : gameState.thirst > 30 ? '#FF5722' : '#F44336';
            // Thirst warning from WarningSystem module (per game bible)
            const thirstWarn = getThirstWarning(gameState.thirst);
            let thirstWarning = '';
            if (thirstWarn) {
                const flashStyle = thirstWarn.flash ? ' animation: blink 0.5s infinite;' : '';
                const boldStyle = thirstWarn.priority === 'critical' || thirstWarn.priority === 'danger' ? ' font-weight:bold;' : '';
                const icon = thirstWarn.priority === 'critical' || thirstWarn.priority === 'danger' ? '⚠️ ' : '';
                thirstWarning = `<span style="color:${thirstWarn.color};${boldStyle}${flashStyle}">${icon}${thirstWarn.message}</span>`;
            }

            // Settlement requirements check
            const hasWaterAccess = checkWaterAccess(player.x, player.y) || gameState.hasWell;
            const hasPopulation = gameState.population >= 5;
            const hasFood = resources.food >= 100;
            const hasWood = resources.wood >= 40;

            resourceInfo.innerHTML = `
                <b>WANDER Mode:</b><br>
                🍖 ${resources.food}/${gameState.maxFood} | 🪵 ${resources.wood}/${gameState.maxWood}<br>
                <b>Thirst:</b> <span style="color: ${thirstColor}">${gameState.thirst}/100</span><br>
                ${thirstWarning ? thirstWarning + '<br>' : ''}
                <b>Tribe:</b> ${gameState.population} member${gameState.population > 1 ? 's' : ''}<br>
                <hr style="border-color: #555; margin: 5px 0;">
                <b>📋 Settlement Requirements:</b><br>
                <span style="color:${hasPopulation ? '#4CAF50' : '#888'}">${hasPopulation ? '✅' : '⬜'} Tribe: ${gameState.population}/5</span><br>
                <span style="color:${hasFood ? '#4CAF50' : '#888'}">${hasFood ? '✅' : '⬜'} Food: ${resources.food}/100</span><br>
                <span style="color:${hasWood ? '#4CAF50' : '#888'}">${hasWood ? '✅' : '⬜'} Wood: ${resources.wood}/40</span><br>
                <span style="color:${hasWaterAccess ? '#4CAF50' : '#888'}">${hasWaterAccess ? '✅' : '⬜'} Water Access</span>
            `;
        } else {
            // CITY mode: show full resources
            resourceInfo.innerHTML = `
                <b>Resources:</b><br>
                🍖 ${resources.food} | 🪵 ${resources.wood} | 🪨 ${resources.stone}<br>
                🛠️ ${resources.metal} | 🥇 ${resources.gold}<br>
                <b>Population:</b> ${gameState.population} | <b>Year:</b> ${gameState.year}
            `;
        }
    }

    // Update settle button visibility in WANDER mode
    if (gameState.phase === 'WANDER') {
        updateSettleButton();
    }
}

// Level selection
document.getElementById('levelSelect')?.addEventListener('change', (e) => {
    selectedLevel = parseInt((e.target as HTMLSelectElement).value);
    updateSelectedInfo();
});

// Building type buttons
document.getElementById('placeResBtn')?.addEventListener('click', () => {
    selectedType = 'R';
    updateSelectedInfo();
});
document.getElementById('placeComBtn')?.addEventListener('click', () => {
    selectedType = 'C';
    updateSelectedInfo();
});
document.getElementById('placeIndBtn')?.addEventListener('click', () => {
    selectedType = 'I';
    updateSelectedInfo();
});
document.getElementById('placeWellBtn')?.addEventListener('click', () => {
    selectedType = 'WELL';
    updateSelectedInfo();
});
document.getElementById('placeRoadBtn')?.addEventListener('click', () => {
    selectedType = 'ROAD';
    updateSelectedInfo();
});

// WANDER mode buttons
document.getElementById('gatherFoodBtn')?.addEventListener('click', () => {
    // Gather food from current tile
    const tileX = Math.floor(player.x);
    const tileY = Math.floor(player.y);
    const tile = chunkManager.getTile(tileX, tileY);
    if (tile && tile.hasBerries) {
        gameState.resources.add({ food: 10 });
        tile.hasBerries = false; // Remove berries after gathering
        addTurnLog(`Gathered 10 food from berries at (${tileX}, ${tileY})`);
        updateHUD();
    } else {
        alert('No berries here to gather!');
    }
});

document.getElementById('gatherWoodBtn')?.addEventListener('click', () => {
    // Gather wood from current tile
    const tileX = Math.floor(player.x);
    const tileY = Math.floor(player.y);
    const tile = chunkManager.getTile(tileX, tileY);
    if (tile && tile.hasTrees) {
        gameState.resources.add({ wood: 5 });
        // Trees don't disappear in this simple version
        addTurnLog(`Gathered 5 wood from trees at (${tileX}, ${tileY})`);
        updateHUD();
    } else {
        alert('No trees here to gather from!');
    }
});

document.getElementById('digWellBtn')?.addEventListener('click', () => {
    // Dig a well (only one allowed in WANDER mode)
    if (gameState.resources.canAfford({ food: 25, wood: 50 })) {
        gameState.resources.subtract({ food: 25, wood: 50 });
        gameState.thirst = Math.min(100, gameState.thirst + 50); // Restore thirst
        gameState.hasWell = true; // Track well for settlement requirements
        addTurnLog('💧 Dug a well and restored thirst!');
        updateHUD();
    } else {
        alert('Not enough resources! Need 25 food and 50 wood.');
    }
});

document.getElementById('settleBtn')?.addEventListener('click', () => {
    // Transition to CITY mode - record city center at player location
    gameState.settlementX = Math.floor(player.x);
    gameState.settlementY = Math.floor(player.y);
    gameState.phase = 'CITY';
    gameState.year = 1; // Reset year for city founding

    // Center camera on new city
    camera.state.x = gameState.settlementX;
    camera.state.y = gameState.settlementY;

    updateUIForPhase();
    addTurnLog(`🏛️ City founded at (${gameState.settlementX}, ${gameState.settlementY})!`);
    addTurnLog('🎉 The age of civilization begins!');
    addTurnLog(`📊 Starting with ${gameState.population} citizens and ${gameState.resources.getResources().food} food.`);
    updateHUD();
});

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') { selectedType = 'R'; updateSelectedInfo(); }
    if (e.key === 'c' || e.key === 'C') { selectedType = 'C'; updateSelectedInfo(); }
    if (e.key === 'i' || e.key === 'I') { selectedType = 'I'; updateSelectedInfo(); }
    if (e.key === 'w' || e.key === 'W') { selectedType = 'WELL'; updateSelectedInfo(); }
    if (e.key === 'd' || e.key === 'D') { selectedType = 'ROAD'; updateSelectedInfo(); }
    if (e.key >= '1' && e.key <= '6') {
        selectedLevel = parseInt(e.key);
        (document.getElementById('levelSelect') as HTMLSelectElement).value = e.key;
        updateSelectedInfo();
    }
});

// Click to place building or move player
canvas.addEventListener('click', (e) => {
    import('./core/math').then(({ canvasToWorld }) => {
        const worldPos = canvasToWorld(e.clientX, e.clientY, camera.state, camera.viewport);
        const tileX = Math.floor(worldPos.x);
        const tileY = Math.floor(worldPos.y);

        if (gameState.phase === 'WANDER') {
            // WANDER mode: Check for entity interactions first (increased hitbox for easier clicking)
            const clickedEntity = entityManager.getEntityAt(worldPos.x, worldPos.y, 1.5);

            // Nomad interaction - check for hostile (25% chance per spec)
            if (clickedEntity && clickedEntity.type === 'NOMAD' && clickedEntity.state !== 'dying') {
                if (clickedEntity.isHostile) {
                    // Hostile encounter!
                    const damage = calculateHostileDamage();
                    gameState.population = Math.max(1, gameState.population - damage);
                    addTurnLog(`⚔️ Hostile encounter! Lost ${damage} tribe member${damage > 1 ? 's' : ''}.`);
                    entityManager.fleeFrom(clickedEntity, player.x, player.y);
                } else {
                    // Friendly - recruit!
                    entityManager.removeEntity(clickedEntity.id);
                    gameState.population += 1;
                    addTurnLog(`🎉 Nomad joined your tribe! (${gameState.population} members)`);
                }
                updateHUD();
                return;
            }

            // Animal hunting - uses HP system from CombatConfig
            if (clickedEntity && isAnimal(clickedEntity) && clickedEntity.state !== 'dying') {
                // Calculate hit chance based on tribe size
                const hitChance = calculateHitChance(gameState.population);
                const hitRoll = Math.random();

                if (hitRoll < hitChance) {
                    // Hit! Deal 1 damage
                    const killed = damageEntity(clickedEntity, 1);
                    if (killed) {
                        // Animal died - get food reward
                        const foodGained = getEntityFoodReward(clickedEntity);
                        const currentFood = gameState.resources.getResources().food;
                        const cappedFood = Math.min(foodGained, gameState.maxFood - currentFood);
                        gameState.resources.add({ food: cappedFood });
                        addTurnLog(`🍖 Hunted ${clickedEntity.type.replace('ANIMAL_', '').toLowerCase()}! +${cappedFood} food`);
                    } else {
                        addTurnLog(`🗡️ Hit! HP: ${clickedEntity.health}/${clickedEntity.maxHealth}`);
                    }
                } else {
                    // Miss — animal reacts
                    addTurnLog('❌ Attack missed!');
                    const config = ANIMAL_CONFIG[clickedEntity.type];
                    if (config?.behavior === 'charge' || config?.behavior === 'aggressive') {
                        // Dangerous animal attacks back!
                        const counterDamage = Math.random() < 0.3 ? 1 : 0; // 30% chance
                        if (counterDamage > 0) {
                            gameState.population = Math.max(1, gameState.population - counterDamage);
                            addTurnLog(`🐗 ${clickedEntity.type.replace('ANIMAL_', '')} counterattack! Lost 1 tribe member.`);
                        }
                    }
                    entityManager.fleeFrom(clickedEntity, player.x, player.y);
                }
                updateHUD();
                return;
            }

            // Otherwise move player to clicked location
            // Check if tile is walkable
            const tile = chunkManager.getTile(tileX, tileY);
            if (!tile) return;

            import('./world/Tile').then(({ isWalkable, TileType }) => {
                // Check for water - drink instead of walking
                if (tile.type === TileType.WATER) {
                    gameState.thirst = 100;
                    addTurnLog('💧 Thirst restored!');
                    updateHUD();
                    return;
                }

                // Check for berry gathering (with inventory limit)
                if (tile.hasBerries) {
                    const currentFood = gameState.resources.getResources().food;
                    const rawFood = 20 + Math.floor(Math.random() * 80); // 20-100
                    const foodGained = Math.min(rawFood, gameState.maxFood - currentFood);
                    if (foodGained > 0) {
                        gameState.resources.add({ food: foodGained });
                        tile.hasBerries = false;
                        addTurnLog(`🫐 Gathered ${foodGained} food from berries.`);
                    } else {
                        addTurnLog('Inventory full!');
                    }
                    updateHUD();
                    return;
                }

                // Check for tree chopping (with inventory limit)
                if (tile.hasTrees) {
                    const currentWood = gameState.resources.getResources().wood;
                    const rawWood = 10 + Math.floor(Math.random() * 20); // 10-30
                    const woodGained = Math.min(rawWood, gameState.maxWood - currentWood);
                    if (woodGained > 0) {
                        gameState.resources.add({ wood: woodGained });
                        tile.hasTrees = false;
                        addTurnLog(`🪓 Chopped tree for ${woodGained} wood.`);
                    } else {
                        addTurnLog('Inventory full!');
                    }
                    updateHUD();
                    return;
                }

                if (!isWalkable(tile.type)) {
                    // Can't walk on water!
                    return;
                }

                player.moveTo(tileX + 0.5, tileY + 0.5); // Center of tile
                // Decrease thirst for movement
                gameState.thirst = Math.max(0, gameState.thirst - 1);
                updateHUD();
                // Check for death
                if (gameState.thirst <= 0) {
                    alert('You died of thirst! Game Over.');
                    // Reset or something
                }
            });
        } else {
            // CITY mode: place building
            const buildingId = getSelectedBuildingId();
            if (!buildingId) return;

            import('./config/BuildingConfig').then(({ getBuildingById }) => {
                const def = getBuildingById(buildingId);
                if (!def) {
                    console.error(`Building not found: ${buildingId}`);
                    return;
                }

                // Check resources
                if (!gameState.resources.canAfford(def.cost)) {
                    alert(`Not enough resources!\nNeed: 🍖${def.cost.food || 0} 🪵${def.cost.wood || 0} 🪨${def.cost.stone || 0}`);
                    return;
                }

                // Check population unlock
                if (gameState.population < def.populationUnlock) {
                    alert(`Need ${def.populationUnlock} population to unlock ${def.name}!`);
                    return;
                }

                // Place building
                const building = gameState.buildings.placeBuilding(buildingId, tileX, tileY, gameState.year);
                if (building) {
                    gameState.resources.subtract(def.cost);
                    addTurnLog(`✅ Placed ${def.name}`);
                    updateHUD();
                } else {
                    alert('Cannot place building here!');
                }
            });
        }
    });
});

// Game Loop
function loop() {
    player.update();

    // Update entities - pass player position so animals can react (flee/charge)
    const playerPos = player.getPosition();
    entityManager.update(playerPos.x, playerPos.y);

    // In WANDER mode, camera follows player
    if (gameState.phase === 'WANDER') {
        camera.state.x = player.x;
        camera.state.y = player.y;

        // Update minimap with exploration
        minimap.explore(player.x, player.y, 10);
        minimap.render(player.x, player.y, (x, y) => chunkManager.getTile(x, y));
    } else {
        // Hide minimap in CITY mode
        minimap.setVisible(false);
    }

    updateHUD();
    renderer.render();
    requestAnimationFrame(loop);
}

// Turn Log
const turnLogMessages: string[] = [];

function addTurnLog(message: string) {
    turnLogMessages.unshift(`Year ${gameState.year}: ${message}`);
    if (turnLogMessages.length > 20) turnLogMessages.pop();
    const turnLog = document.getElementById('turnLog');
    if (turnLog) {
        turnLog.innerHTML = turnLogMessages.join('<br>');
    }
}

// End Turn Handler
function endTurn() {
    import('./game/TurnProcessor').then(({ processTurn }) => {
        const result = processTurn(gameState);

        // Log events
        for (const event of result.events) {
            addTurnLog(event);
        }

        // Summary log
        const summary = `Produced ${result.foodProduced}🍖, Consumed ${result.foodConsumed}🍖, Income +${result.incomeGenerated}🥇`;
        addTurnLog(summary);

        updateHUD();
    });
}

// End Turn Button
document.getElementById('endTurnBtn')?.addEventListener('click', endTurn);

// Space key to end turn
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        endTurn();
    }
});

// Start
updateSelectedInfo();
addTurnLog('Settlement founded!');
loop();
