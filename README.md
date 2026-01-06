# Civil Zones v48.0

A city-building survival game with Q-Learning AI, converted from JavaScript to Java/JavaFX.

## 🎮 Game Overview

Civil Zones is a historical city-building simulation where you lead a small band of nomads from wandering the wilderness to establishing a thriving settlement.

### Game Phases

1. **Wander Phase** - Explore the procedurally generated world, gather resources, recruit nomads, and find the perfect spot to settle
2. **City Phase** - Build and manage your settlement with residential, commercial, and industrial zones

## 🚀 Getting Started

### Prerequisites

- Java 17 or higher
- Maven 3.8+

### Building

```bash
cd Civil-Zones
mvn clean package
```

### Running

```bash
mvn javafx:run
```

Or run the packaged JAR:

```bash
java -jar target/civil-zones-48.0.jar
```

## 🎯 Features

### Exploration (Wander Phase)
- **WASD/Arrow Keys** - Move your nomad band
- **Click** - Pathfind to a location
- **Space** - Settle when requirements are met
- Gather berries, hunt animals, chop trees, mine stone
- Recruit friendly nomads (beware hostile ones!)
- Manage thirst by staying near water

### Settlement Requirements
- Minimum 10 population
- 50+ food
- 30+ wood

### City Building (City Phase)
- **🏠 Residence** - Houses for your population
- **🔥 Campfire** - Community gathering, boosts desirability
- **🏹 Hunting Ground** - Food production
- **💧 Well** - Water source, reduces thirst-related issues
- **🛤️ Road** - Improves access and desirability

### Desirability System
Buildings evolve based on surrounding desirability:
- Proximity to water, campfires, and wells increases desirability
- Industrial buildings decrease nearby desirability
- High desirability → better building variants → more population capacity

### Q-Learning AI
- Toggle training mode to let the AI learn optimal strategies
- Watch the AI play automatically
- AI learns to explore, gather resources, and build efficiently

## 📁 Project Structure

```
Civil-Zones/
├── pom.xml                           # Maven build configuration
├── src/main/java/com/civilzones/
│   ├── CivilZonesApp.java           # Main application entry point
│   ├── ai/
│   │   └── QLearningAI.java         # Q-Learning AI implementation
│   ├── config/
│   │   ├── Config.java              # Game constants and configuration
│   │   └── Colors.java              # Color definitions
│   ├── entity/
│   │   ├── Entity.java              # Base entity class
│   │   ├── Player.java              # Player entity
│   │   ├── Berry.java               # Collectible berry
│   │   ├── Nomad.java               # Recruitable/hostile nomad
│   │   ├── Animal.java              # Huntable animal
│   │   ├── AnimalType.java          # Animal type enum
│   │   └── StoneDeposit.java        # Mineable stone
│   ├── game/
│   │   ├── Game.java                # Core game logic
│   │   ├── GameState.java           # Game state enum
│   │   ├── TerrainType.java         # Terrain types enum
│   │   ├── BuildingType.java        # Building types enum
│   │   ├── Tile.java                # Map tile class
│   │   ├── Building.java            # Building class
│   │   ├── Inventory.java           # Resource storage
│   │   └── Noise.java               # Perlin noise generator
│   ├── renderer/
│   │   └── GameRenderer.java        # JavaFX Canvas rendering
│   └── ui/
│       └── GameUI.java              # UI components
└── src/main/resources/
    └── styles/
        └── game.css                 # JavaFX styling
```

## 🎨 Visual Style

The game features a colorful, stylized look inspired by classic games:
- **Terrain** - Gradient-based tiles with highlights and details
- **Water** - Animated sparkles and waves
- **Characters** - Cave painting style nomads, Fred Flintstone-inspired player
- **Buildings** - Visual evolution based on prosperity level

## 🔧 Technical Details

### Map Generation
- **Perlin Noise FBM** - Fractional Brownian Motion for natural terrain
- **River Generation** - Flows from highlands to lowlands
- **Entity Spawning** - Balanced resource distribution

### Pathfinding
- **A* Algorithm** - Efficient path finding across the map
- **Walkability** - Respects terrain and building placement

### Building Evolution
- Desirability calculated from surrounding features
- Buildings automatically upgrade/downgrade based on conditions
- Population adjusts with building capacity

## 📜 License

This project is a conversion of an original JavaScript game to Java/JavaFX.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!
Android Development Project 
