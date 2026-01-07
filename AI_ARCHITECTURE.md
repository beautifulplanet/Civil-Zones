# Civil Zones AI - Better Architecture Proposal

## The Problem

The current Q-Learning approach is fundamentally wrong for city building because:

| Q-Learning Needs | City Building Has |
|------------------|-------------------|
| Small state space | 100x100 grid × building types = MASSIVE |
| Immediate rewards | Build well now, benefit in 5 years |
| Short episodes | Games last hundreds of years |
| Simple actions | Complex multi-step construction |

**Result:** After 12,000+ episodes, the AI still dies at population 4-7.

## Why Population Caps at 2k

Looking at the code, I found these bottlenecks:

### 1. Water System (CRITICAL)
```
1 well = 100 people capacity
For 2,000 pop: Need 20 wells
For 10,000 pop: Need 100 wells
For 100,000 pop: Need 1,000 wells
```

**Problem:** AI doesn't build wells proactively. It reacts AFTER people die.

### 2. Building Costs Scale Up
```
Level 1 Residential: 100 food, 100 wood
Level 2 Residential: 2,000 food, 2,000 wood (20x more)
Level 3+: Requires stone and metal
```

**Problem:** AI doesn't upgrade buildings, just spams L1.

### 3. Food Production Limits
- Commercial buildings produce food
- Need ~1 COM per 4 RES for balance
- AI builds randomly, not in ratio

## The Better Approach: Blueprint AI

Instead of "learning", the AI should follow **predefined city layouts**:

### Blueprint City (Grid Pattern)
```
. . . . . .    (. = road)
. R R R R .    (R = residential)
. R W W R .    (W = well)
. R W W R .
. R R R R .
. . . . . .
```

Each 6x6 "block" provides:
- 4 wells = 400 water capacity
- 8 residential = 80-800 housing (depending on level)
- Roads for access

### How It Works

1. **SETTLE** near water
2. **BUILD WELLS FIRST** - Always plan ahead
3. **LAY ROADS** - Grid pattern
4. **FILL IN BUILDINGS** - Follow the pattern
5. **EXPAND** - Add blocks in rings around center

### Key Rules (Hardcoded, Not Learned)

```javascript
rules: {
    // Always 20% more wells than needed
    wellsNeeded: Math.ceil(pop / 100 * 1.2),
    
    // Building ratios
    residential: 60%,
    commercial: 25%,
    industrial: 15%,
    
    // Spacing
    wellFromWell: 3 tiles apart,
    roadEvery: 4 tiles
}
```

## City Styles (User-Configurable)

### 1. Grid City
Classic SimCity style - efficient, predictable
```
[R][R][W][R][R]
[R][R][W][R][R]
[.][.][.][.][.]
[R][R][W][R][R]
```

### 2. Linear City
For rivers - expands in one direction
```
[R][W][R][.][R][W][R][.][R][W][R]
```

### 3. District City
Separated zones - realistic
```
[RESIDENTIAL ZONE]  |  [COMMERCIAL]
                    |  [INDUSTRIAL]
        [WELLS]     |
```

### 4. Radial City
Circular expansion - aesthetic
```
        [R]
    [R][W][R]
  [R][W][W][W][R]
    [R][W][R]
        [R]
```

## Implementation Priority

1. **Fix the 2k population bug first**
   - Ensure wells are built BEFORE pop exceeds capacity
   - Fix the 20% death rate per year from dehydration

2. **Replace Q-Learning with Blueprint AI**
   - Deterministic, predictable behavior
   - Controllable city styles
   - Scales to millions of population

3. **Add upgrade logic**
   - When resources allow, upgrade L1 → L2 → L3 etc.
   - Prioritize buildings near center

4. **Add style selector UI**
   - Let user choose city type before AI starts
   - Preview what the final city will look like

## Files Created

- `ai_blueprint.js` - New blueprint-based AI system
- This document explaining the approach

## Next Steps

1. Integrate `ai_blueprint.js` into index.html
2. Add UI for selecting city styles
3. Fix the water system death spiral
4. Test to 10k, 100k, 1M population

The key insight is: **City building isn't a learning problem, it's an execution problem.**

The AI doesn't need to "figure out" what works - we KNOW what works:
- Wells before population
- Grid layouts
- Proper R:C:I ratios

The AI just needs to execute the plan consistently.
