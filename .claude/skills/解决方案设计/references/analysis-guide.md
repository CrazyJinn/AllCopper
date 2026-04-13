# 需求分析指南

指导如何从代码需求文档中提取信息并设计基于 Godot 4 + C# 的系统架构方案。

## 核心设计原则

来自 Godot 参考文档的强制规则，需求分析时必须贯彻：

1. **一切皆节点**：通过添加节点来组合行为，而非增加继承深度
2. **信号完整性**：所有跨模块通信使用 Godot Signal，信号必须携带类型化参数
3. **类型安全**：所有公共 API 必须有显式类型声明
4. **场景可独立运行**：每个场景必须可独立实例化，不假设父节点类型或兄弟节点存在
5. **Autoload 纪律**：仅用于真正跨场景的全局状态，不存放游戏逻辑
6. **场景用 C# 代码构建**：.tscn 只保留空壳，所有子节点在 C# 中动态创建

## 分析步骤

### 1. 提取系统清单

从代码需求文档中提取所有系统，按优先级（P0/P1）分类：

- **P0 核心系统**：角色控制、战斗资源、受伤判定、对话、背包、战斗场景、经济、怪物AI
- **P1 扩展系统**：关卡类型、存档、音频管理、资源管理
- **UI系统**：按优先级排序的所有 UI 模块

### 2. 设计模块依赖关系

为每个系统确定：
- 上游依赖（需要哪些其他系统的输出）
- 下游输出（本系统为哪些系统提供数据）
- 使用 mermaid 绘制依赖图

### 3. 定义接口协议（C# 模式）

每个系统需定义 C# 接口，包含属性、方法和信号：

```csharp
// 系统名: HealthComponent
// 文件: scripts/components/HealthComponent.cs

[GlobalClass]
public partial class HealthComponent : Node
{
    // --- 信号（PascalCase + EventHandler 后缀）---
    [Signal]
    public delegate void HealthChangedEventHandler(float newHealth);
    [Signal]
    public delegate void DiedEventHandler();

    // --- 输入（通过 [Export] 或方法参数）---
    [Export] public float MaxHealth { get; set; } = 100f;

    // --- 输出（公共属性/方法）---
    public float CurrentHealth { get; private set; }
    public void ApplyDamage(float amount) { ... }
    public void Heal(float amount) { ... }

    // --- 信号触发条件 → 监听方 ---
    // HealthChanged: 生命值变化时 → UIHealthBar, BossHealthBar
    // Died: 生命值归零时 → GameStateManager, EnemySpawner
}
```

### 4. 数据结构设计（C# Resource）

基于需求文档中的数据结构需求，设计 Godot Resource（C# 版本，等价于 Unity ScriptableObject）：

```csharp
// 角色数据 → CharacterData.cs
[GlobalClass]
public partial class CharacterData : Resource
{
    [Export] public string DisplayName { get; set; } = "";
    [Export] public float MaxHealth { get; set; } = 100f;
    [Export] public float ShieldAbsorbRate { get; set; } = 0.5f;
    [Export] public float ShieldRegenSpeed { get; set; } = 1.0f;
    [Export] public float MoveSpeed { get; set; } = 200f;
    // 科技系
    [Export] public int MaxBullets { get; set; } = 30;
    [Export] public float ReloadSpeed { get; set; } = 1.5f;
    // 魔法系
    [Export] public float ChargeTime { get; set; } = 2.0f;
    [Export] public float CdAcceleration { get; set; } = 1.0f;
}

// 物品数据 → ItemData.cs
[GlobalClass]
public partial class ItemData : Resource
{
    [Export] public string ItemId { get; set; }
    [Export] public string DisplayName { get; set; }
    [Export] public string Description { get; set; }
    [Export] public Texture2D Icon { get; set; }
    [Export] public Vector2I SpaceOccupied { get; set; } = new(1, 1);
    [Export] public ItemCategory Category { get; set; }
}

// 怪物数据 → EnemyData.cs
[GlobalClass]
public partial class EnemyData : Resource
{
    [Export] public string DisplayName { get; set; }
    [Export] public float MaxHealth { get; set; } = 100f;
    [Export] public float AttackPower { get; set; } = 10f;
    [Export] public float MoveSpeed { get; set; } = 150f;
    [Export] public Texture2D Sprite { get; set; }
}

// 对话数据 → DialogData.cs
[GlobalClass]
public partial class DialogData : Resource
{
    [Export] public string DialogId { get; set; }
    [Export] public DialogEntry[] Entries { get; set; }
}
```

每个数据结构需明确：
- **字段名**：PascalCase 属性
- **类型**：使用 Godot C# 类型（float/int/string/Texture2D/Vector2I 等）
- **默认值**：必须提供合理默认值
- **[Export] 标记**：所有需要编辑器配置的属性

### 5. 架构模式选择

| 模式 | 适用场景 | 本项目应用 | C# 实现要点 |
|------|---------|-----------|------------|
| Autoload 单例 | 全局状态管理 | GameManager, AudioManager, EventBus | `Instance` 静态属性 + `_Ready()` 赋值 |
| 状态机 | 角色行为切换 | PlayerState, EnemyAIState | `enum` + `switch`，非状态类继承 |
| 观察者 (Signal) | 模块解耦 | 战斗事件、UI更新 | `[Signal]` + `EventHandler` 委托 + `+=` 订阅 |
| 策略模式 | 阵营差异 | 科技系操作/魔法系操作 | `interface` + 依赖注入 |
| 对象池 | 频繁创建销毁 | 子弹、伤害数字、掉落物 | `Stack<T>` + `PackedScene.Instantiate()` |
| 组件模式 | 功能组合 | HealthComponent, HitboxComponent | 作为子节点挂载，不使用继承 |

### 6. 场景树结构设计

每个系统需设计其场景树结构，遵循组合原则：

```
# 角色场景树示例
Player (CharacterBody2D) ← PlayerController.cs
  ├── Sprite2D
  ├── CollisionShape2D
  ├── HealthComponent (Node) ← HealthComponent.cs
  ├── HitboxComponent (Area2D) ← HitboxComponent.cs
  ├── HurtboxComponent (Area2D) ← HurtboxComponent.cs
  ├── MovementComponent (Node) ← MovementComponent.cs
  └── AnimationPlayer
```

关键规则：
- **不使用继承链**：用 `PlayerController` 直接继承 `CharacterBody2D`，功能通过组件子节点组合
- **组件可复用**：`HealthComponent` 在玩家、NPC、Boss 上都能挂载
- **每个组件可独立测试**：不依赖特定父节点

### 7. 开发里程碑

按依赖关系排序开发阶段：

**阶段1 - 基础框架**：场景管理、角色控制、受伤判定
**阶段2 - 核心战斗**：战斗资源系统、怪物AI、经济系统
**阶段3 - 内容系统**：对话系统、背包系统、战斗场景系统
**阶段4 - UI与优化**：UI系统、关卡类型、存档系统

## 需求分析文档输出模板

```markdown
# 需求分析文档

## 系统总览
<依赖关系 mermaid 图>

## 场景树设计
<每个系统的场景树结构图>

## 系统详细设计

### <系统名称>
- **优先级**: P0/P1
- **依赖**: <上游系统列表>
- **模块文件**: <建议的 .cs 文件路径和类名>
- **继承关系**: <直接继承的 Godot 节点类型>
- **组件组合**: <挂载的子节点组件列表>
- **接口定义**: <C# 属性/方法/信号定义>
- **核心算法**: <关键逻辑的伪代码>
- **数据结构**: <使用的 Resource 类>
- **性能约束**: <帧率/内存要求>

## 数据结构汇总
<所有 C# Resource 类定义>

## Autoload 单例清单
<全局单例列表及其职责>

## 开发里程碑
<分阶段计划>
```
