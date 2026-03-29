# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

万物为铜 (Tongs) - A 2D top-down action game built with Cocos Creator 3.x + TypeScript. The project follows a structured game development pipeline with AI-assisted content generation.

## Development Commands

### Testing
```bash
cd 04_code
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
npx jest -t "test name"     # Run specific test
```

## Code Architecture

### Two Code Locations
- **`04_code/`** - Design/prototyping code with tests, organized by module
- **`89_game/AllCooper/assets/scripts/`** - Actual Cocos Creator game code (synced from 04_code)

Both locations share identical module structure. Code is developed in `04_code/` then copied to the Cocos project.

### Module Structure
```
core/           # EventSystem (pub-sub), GameManager (state), GameConfig (enums/constants)
data/           # CharacterData, MonsterData, ItemData, SceneData definitions
player/         # InputManager, StateMachine, PlayerController
combat/         # DamageCalculator, BuffSystem, CombatSystem
ai/             # MonsterAI
ui/             # HUD, DamageNumber, MainMenu
scene/          # SceneManager
economy/        # EconomySystem (currency, transactions)
dialog/         # DialogSystem
```

### Key Systems

**EventSystem** - Singleton pub-sub pattern for module communication
```typescript
eventSystem.on(GameEvent.PLAYER_DAMAGED, callback);
eventSystem.emit(GameEvent.PLAYER_DAMAGED, data);
```

**StateMachine** - Generic finite state machine for player states (idle, walk, attack, hurt, death)

**DamageCalculator** - Static methods for damage formulas:
- Formula: `rawDamage = baseDamage + attack; reduction = defense / (defense + 100); max 80%`
- DamageTypes: NORMAL (90% shield / 10% HP), POISON (direct HP), SHIELD_BREAK (2x shield)

**BuffSystem** - Manages buffs/debuffs with stacking, DOT/HOT, and status effects (stun, silence, etc.)

### Coding Standards

| Type | Convention | Example |
|------|-----------|---------|
| Class | PascalCase | `PlayerController` |
| Function | camelCase | `takeDamage()` |
| Private property | _camelCase | `_isAttacking` |
| Constant | UPPER_SNAKE_CASE | `MAX_HEALTH` |
| Interface | I prefix | `IDamageable` |

File header comment required. JSDoc for public methods.

## Game-Specific Knowledge

### Two Factions
- **Tech (科技)** - Uses ammo, no MP. Example: Roland
- **Magic (魔法)** - Uses MP, no ammo. Example: Wei

### Input Mapping
WASD=move, Space=dodge, Q/E=skills, R=reload/meditate, LeftClick=attack, RightClick=ultimate

### Currency
"纽扣电池" (Button Battery) - supports 2 decimal precision. Sources: human enemy drops, quest rewards, essence exchange.

## Skills Workflow

This project uses custom skills for content generation. Key skills:
- `需求分析` - Generate requirements from world/setting docs
- `角色设计` - Generate character design prompts
- `场景设计` - Generate scene design prompts
- `代码生成` - Generate game code from requirements
- `资源搬运` - Copy finalized assets to game project

## Test Structure

Tests are in `04_code/__tests__/` mirroring source structure:
- Unit tests for DamageCalculator, BuffSystem, EventSystem, StateMachine, EconomySystem
- Integration tests in `integration/` folder
- Run `npm test` from `04_code/` directory
