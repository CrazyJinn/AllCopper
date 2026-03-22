# 万物为铜 - 游戏代码

2D俯视角动作游戏，基于 Cocos Creator + TypeScript 开发。

## 目录结构

```
04_code/
├── core/                    # 核心模块
│   ├── GameConfig.ts       # 游戏配置（枚举、常量）
│   ├── EventSystem.ts      # 事件系统（发布-订阅）
│   ├── GameManager.ts      # 游戏管理器（状态控制）
│   └── index.ts
│
├── data/                    # 数据定义
│   ├── CharacterData.ts    # 角色数据结构
│   ├── MonsterData.ts      # 怪物数据结构
│   ├── ItemData.ts         # 物品数据结构
│   ├── SceneData.ts        # 场景/副本数据
│   └── index.ts
│
├── player/                  # 角色控制
│   ├── InputManager.ts     # 输入管理（键盘/鼠标）
│   ├── StateMachine.ts     # 状态机
│   ├── PlayerController.ts # 玩家控制器
│   └── index.ts
│
├── combat/                  # 战斗系统
│   ├── DamageCalculator.ts # 伤害计算
│   ├── BuffSystem.ts       # Buff/Debuff系统
│   ├── CombatSystem.ts     # 战斗管理
│   └── index.ts
│
├── ui/                      # UI系统
│   ├── DamageNumber.ts     # 伤害数字飘字
│   ├── HUD.ts              # 游戏HUD
│   ├── MainMenu.ts         # 主菜单/暂停菜单
│   └── index.ts
│
├── scene/                   # 场景管理
│   ├── SceneManager.ts     # 场景加载/切换
│   └── index.ts
│
├── ai/                      # 怪物AI
│   ├── MonsterAI.ts        # 怪物行为逻辑
│   └── index.ts
│
├── economy/                 # 经济系统
│   ├── EconomySystem.ts    # 货币/交易
│   └── index.ts
│
├── dialog/                  # 对话系统
│   ├── DialogSystem.ts     # 剧情对话
│   └── index.ts
│
└── index.ts                 # 主入口
```

## 核心系统说明

### 1. 角色控制

**输入映射：**
| 按键 | 功能 |
|------|------|
| WASD | 8方向移动 |
| 空格 | 翻滚闪避（无敌帧） |
| Q/E | 技能1/技能2 |
| R | 换弹/冥想 |
| 鼠标左键 | 普通攻击 |
| 鼠标右键 | 终极技能 |

**状态机：**
- 待机 (Idle) → 行走 (Walk) → 闪避 (Dodge) → 攻击 (Attack) → 受伤 (Hurt) → 死亡 (Death)

### 2. 战斗系统

**伤害类型：**
- `NORMAL` - 普通伤害，按护盾吸收率分配（90%护盾/10%HP）
- `POISON` - 中毒伤害，直接扣HP，无视护盾
- `SHIELD_BREAK` - 碎盾伤害，双倍护盾伤害，不扣HP

**伤害计算公式：**
```typescript
原始伤害 = 基础伤害 + 攻击力
防御减伤 = defense / (defense + 100)，最多80%
最终伤害 = 原始伤害 × (1 - 防御减伤)
```

**护盾系统：**
- 未受伤害3秒后自动恢复
- 恢复速率由 `shieldRegenRate` 决定
- 护盾吸收率可由装备/技能动态调整

### 3. Buff系统

**Buff类型：**
- `BUFF` - 增益效果
- `DEBUFF` - 减益效果
- `CONTROL` - 控制效果

**效果类型：**
- 属性修改、持续伤害(DOT)、持续治疗(HOT)
- 眩晕、定身、沉默、减速
- 狂暴、中毒、燃烧、冻结

### 4. 副本系统

**房间类型：**
- 入口 → 普通 → 精英 → Boss → 通关
- 隐藏房间（特殊条件触发）

**隐藏房间条件：**
- `no_damage` - 无伤通关
- `kill_count` - 击杀数量
- `time` - 时间限制

### 5. 经济系统

**货币：纽扣电池**
- 满电 = 1单位
- 支持小数精度（2位）
- 来源：击杀人形敌人、任务奖励、精粹兑换

## 使用方式

### 初始化游戏

```typescript
import { initGame, gameUpdate } from './04_code';

// Cocos引擎加载完成后调用
initGame();

// 在游戏循环中调用
update(dt: number) {
    gameUpdate(dt);
}
```

### 创建玩家角色

```typescript
import { PlayerController } from './04_code/player';
import { ROLAND_DATA } from './04_code/data';

const player = new PlayerController(ROLAND_DATA);
player.setPosition(100, 100);

// 每帧更新
player.update(deltaTime);
```

### 使用战斗系统

```typescript
import { combatSystem, AttackType } from './04_code/combat';
import { DamageType } from './04_code/core';

// 注册实体
combatSystem.registerEntity(playerEntity);

// 执行攻击
combatSystem.performAttack({
    attackerId: 'player',
    attackType: AttackType.MELEE,
    baseDamage: 20,
    damageType: DamageType.PHYSICAL,
    range: 50,
    position: { x: 100, y: 100 },
    direction: { x: 1, y: 0 },
    canCrit: true,
    critRate: 0.1,
});
```

### 使用事件系统

```typescript
import { eventSystem, GameEvent } from './04_code/core';

// 订阅事件
eventSystem.on(GameEvent.PLAYER_DAMAGED, (data) => {
    console.log(`玩家受到 ${data.damage} 点伤害`);
});

// 触发事件
eventSystem.emit(GameEvent.CURRENCY_CHANGED, {
    amount: 10,
    reason: '击杀奖励',
});
```

### 使用对话系统

```typescript
import { DialogSystem } from './04_code/dialog';

const dialogSystem = new DialogSystem();

// 注册对话脚本
dialogSystem.registerScript({
    id: 'dialog_001',
    name: '初次相遇',
    contents: [...],
    startContentId: 'content_001',
});

// 开始对话
dialogSystem.startDialog('dialog_001');

// 推进对话
dialogSystem.advance();

// 选择选项
dialogSystem.selectChoice('choice_001');
```

## 与Cocos Creator集成

### 组件绑定示例

```typescript
const { ccclass, property } = cc._decorator;

@ccclass
export class GameScene extends cc.Component {
    private player: PlayerController;

    onLoad() {
        initGame();
        this.player = new PlayerController(ROLAND_DATA);
    }

    update(dt: number) {
        gameUpdate(dt);
        this.player.update(dt);
    }
}
```

### 资源引用

代码中定义的动画和图片资源路径需要与Cocos资源管理对应：

```typescript
// 动画资源
animations: {
    idle: 'roland_idle',    // 对应 Cocos 动画剪辑名称
    walk: 'roland_walk',
    // ...
}

// 立绘资源
portraits: {
    default: 'roland_portrait_default',  // 对应资源路径
    // ...
}
```

## 扩展指南

### 添加新角色

1. 在 `data/CharacterData.ts` 中定义角色数据
2. 创建对应的动画资源
3. 使用 `new PlayerController(characterData)` 创建实例

### 添加新怪物

1. 在 `data/MonsterData.ts` 中定义怪物数据
2. 创建对应的动画资源
3. 使用 `new MonsterAI(monsterData, x, y)` 创建实例

### 添加新技能

1. 在角色数据的 `skills` 数组中添加技能ID
2. 实现技能逻辑（可在战斗系统中扩展）

## 性能优化建议

1. 使用对象池复用伤害数字、特效
2. 合理使用图集减少DrawCall
3. 场景切换时释放未使用资源
4. 避免在update中创建新对象

## 版本信息

- **版本**: v1.0
- **引擎**: Cocos Creator 3.x
- **语言**: TypeScript 4.x
- **更新日期**: 2026-03-21
