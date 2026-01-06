# 🏛️ CIVIL ZONES: STONE AGE (NEW VERSION)

## 🆕 This is the NEW Rebuilt Version

**Version:** 1.0 Stone Age Edition  
**Status:** Clean rebuild from scratch  
**Architecture:** Modern modular ES6  
**Date:** December 31, 2025

---

## 📁 Folder Structure

```
CivilZones/
├── index.html          ← NEW: Main game file
├── css/
│   └── styles.css      ← NEW: Professional dark theme
├── js/
│   ├── config.js       ← All game constants
│   ├── utils.js        ← Utilities & noise generator
│   ├── map.js          ← Map system with expansion
│   ├── game.js         ← Core game logic
│   ├── renderer.js     ← Canvas rendering
│   ├── ui.js           ← DOM manipulation
│   └── main.js         ← Entry point & game loop
└── README.md           ← This file
```

---

## 🎮 Features

### ✅ Level 0: WANDER Mode
- Move with WASD/Arrows
- Collect berries, nomads, stone deposits
- Hunt animals (deer, bison, mammoth)
- Chop trees for wood
- Thirst system (refill at water/wells)
- Place Water Pits
- Dynamic map expansion

### ✅ Level 1: CITY Mode
- Settle when ready (2+ pop, 100 food, 25 wood)
- Build 3 types of zones:
  - 🏡 **Residential** (Tree Houses)
  - 🏪 **Commercial** (Trading Posts)
  - 🦬 **Industrial** (Hunting Grounds)
- 3 states per building (LOW/MEDIUM/LUXURY)
- Desirability system (RES→COM→IND chain)
- Population growth with birth/death rates
- Turn-based year advancement

---

## 🚀 How to Run

### Option 1: Python Server (Recommended)
```bash
cd "c:\Users\Elite\Documents\My Made Games\Civil Zones Beta 0\CivilZones"
python -m http.server 8080
```
Then open: http://localhost:8080

### Option 2: Live Server Extension
Right-click `index.html` → "Open with Live Server"

---

## 🎯 What Changed from Legacy

| Aspect | Legacy (v48) | New (v1.0) |
|--------|-------------|------------|
| **File Size** | 14,258 lines in 1 file | ~2,000 lines across 7 modules |
| **Architecture** | Monolithic | Modular ES6 |
| **Scope** | 100+ levels (planned) | First 3 levels only |
| **Performance** | Slow with large maps | Optimized rendering |
| **Maintainability** | Hard to debug | Easy to find/fix bugs |
| **Expansion Packs** | Not planned | Built-in support |

---

## 📝 Controls

| Key | Action |
|-----|--------|
| **WASD / Arrows** | Move (WANDER mode) |
| **C** | Chop tree |
| **Space** | Advance turn (CITY mode) |
| **Mouse Wheel** | Zoom in/out |
| **Right-click Drag** | Pan camera |
| **Click** | Select tile / Place building |
| **F5** | Quick save |
| **F9** | Quick load |
| **H** | Help |
| **Esc** | Cancel selection |

---

## 🗂️ Related Folders

- **`Legacy-CitGame-v48-Original/`** - Original 14K line game
- **`Legacy-CitGame-v48-Backup/`** - Copy of legacy files
- **`Archive-StoneAge-Draft/`** - Early draft files

---

## 🔧 Technical Notes

- **Map Generation:** Simplex noise with octaves
- **Water Limit:** Max 19% of map
- **Expansion:** Grows from 64x64 to 512x512
- **Fog of War:** Reveals as you explore
- **Save System:** LocalStorage (browser-based)

---

## 🎨 Design Philosophy

This rebuild focuses on:
1. **Code Quality** - Clean, maintainable modules
2. **Performance** - Optimized rendering for large maps
3. **Clarity** - One place for all constants (config.js)
4. **Expansion** - Built for future expansion packs
5. **Polish** - Professional UI matching v48 style

---

**🎮 Ready to explore the Stone Age!**
