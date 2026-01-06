// Assign population to residential buildings
// Call this after population changes or buildings are built

// Assign population to residential, commercial, and industrial buildings
function assignPopulationToResidential(game) {
    // Get all residential zones (tiles with zone = 'R')
    let residentials = [];
    for (let x = 0; x < game.tiles.length; x++) {
        for (let y = 0; y < game.tiles[0].length; y++) {
            let tile = game.tiles[x][y];
            if (tile.zone === 'R' && tile.building) {
                // Get the actual capacity from building configuration
                let buildingLevel = tile.building.level || 1;
                let levelConfig = CFG.BUILDING_LEVELS[buildingLevel] || CFG.BUILDING_LEVELS[1];
                let capacity = levelConfig.capacity || 20;
                // Use overflowCapacity to allow temporary overcrowding (+5 extra)
                let overflowCapacity = levelConfig.overflowCapacity || (capacity + 5);
                residentials.push({ tile: tile, cap: capacity, overflowCap: overflowCapacity });
            }
        }
    }
    let totalPop = game.pop;
    // Reset all building populations
    for (let res of residentials) {
        res.tile.building.pop = 0;
    }
    // Assign population to buildings in order of capacity (largest first)
    residentials.sort((a, b) => b.cap - a.cap);
    // First pass: fill to normal capacity
    for (let res of residentials) {
        let assign = Math.min(res.cap, totalPop);
        res.tile.building.pop = assign;
        totalPop -= assign;
        if (totalPop <= 0) break;
    }
    // Second pass: if there's still population, allow overflow (up to overflowCapacity)
    if (totalPop > 0) {
        for (let res of residentials) {
            let currentPop = res.tile.building.pop;
            let extraSpace = res.overflowCap - currentPop;
            if (extraSpace > 0) {
                let assign = Math.min(extraSpace, totalPop);
                res.tile.building.pop += assign;
                totalPop -= assign;
                if (totalPop <= 0) break;
            }
        }
    }
    // After residential, assign to commercial and industrial
    assignPopulationToZones(game, totalPop);
}

// Assign remaining population to commercial and industrial buildings
function assignPopulationToZones(game, availablePop) {
    // Commercial and Industrial are stored in the blds array (not tile.building)
    let commercials = [];
    let industrials = [];
    
    // Check blds array for COM and IND buildings
    if (game.blds && game.blds.length > 0) {
        for (let bld of game.blds) {
            if (bld.t === 'COM') {
                let buildingLevel = bld.lvl || 1;
                let levelConfig = (typeof CFG !== 'undefined' && CFG.COMMERCIAL_LEVELS) ? CFG.COMMERCIAL_LEVELS[buildingLevel] : null;
                let capacity = (levelConfig && levelConfig.capacity) || bld.capacity || (buildingLevel * 10);
                commercials.push({ bld: bld, cap: capacity });
            }
            if (bld.t === 'IND') {
                let buildingLevel = bld.lvl || 1;
                let levelConfig = (typeof CFG !== 'undefined' && CFG.INDUSTRIAL_LEVELS) ? CFG.INDUSTRIAL_LEVELS[buildingLevel] : null;
                let capacity = (levelConfig && levelConfig.capacity) || bld.capacity || (buildingLevel * 15);
                industrials.push({ bld: bld, cap: capacity });
            }
        }
    }
    
    // Also check tiles for zone-based commercial/industrial (fallback)
    for (let x = 0; x < game.tiles.length; x++) {
        for (let y = 0; y < game.tiles[0].length; y++) {
            let tile = game.tiles[x][y];
            if ((tile.zone === 'C' || tile.zone === 'COM') && tile.building) {
                let buildingLevel = tile.building.level || 1;
                let levelConfig = (typeof CFG !== 'undefined' && CFG.COMMERCIAL_LEVELS) ? CFG.COMMERCIAL_LEVELS[buildingLevel] : null;
                let capacity = (levelConfig && levelConfig.capacity) || tile.building.capacity || 10;
                commercials.push({ tile: tile, cap: capacity });
            }
            if ((tile.zone === 'I' || tile.zone === 'IND') && tile.building) {
                let buildingLevel = tile.building.level || 1;
                let levelConfig = (typeof CFG !== 'undefined' && CFG.INDUSTRIAL_LEVELS) ? CFG.INDUSTRIAL_LEVELS[buildingLevel] : null;
                let capacity = (levelConfig && levelConfig.capacity) || tile.building.capacity || 10;
                industrials.push({ tile: tile, cap: capacity });
            }
        }
    }
    
    // Reset all building populations
    for (let com of commercials) {
        if (com.bld) com.bld.pop = 0;
        if (com.tile && com.tile.building) com.tile.building.pop = 0;
    }
    for (let ind of industrials) {
        if (ind.bld) ind.bld.pop = 0;
        if (ind.tile && ind.tile.building) ind.tile.building.pop = 0;
    }
    
    // Assign workers to commercial first, then industrial
    for (let com of commercials) {
        let assign = Math.min(com.cap, availablePop);
        if (com.bld) com.bld.pop = assign;
        if (com.tile && com.tile.building) com.tile.building.pop = assign;
        availablePop -= assign;
        if (availablePop <= 0) break;
    }
    for (let ind of industrials) {
        let assign = Math.min(ind.cap, availablePop);
        if (ind.bld) ind.bld.pop = assign;
        if (ind.tile && ind.tile.building) ind.tile.building.pop = assign;
        availablePop -= assign;
        if (availablePop <= 0) break;
    }
}
// Example usage: assignPopulationToResidential(Game);