# 编码规范 (Godot + C#)

## 基本原则

1. **可读性优先**：代码应该易于理解和维护
2. **一致性**：整个项目保持统一的代码风格
3. **简洁性**：避免过度设计，保持代码简洁
4. **类型安全**：所有公共 API 必须有显式类型标注，消除静默运行时错误
5. **信号驱动**：模块间优先通过 Godot Signal 通信，保持解耦

## 命名规范

| 类型 | 命名风格 | 示例 |
|------|---------|------|
| 类名 | PascalCase | `PlayerController` |
| 方法名 | PascalCase | `TakeDamage()` |
| 属性（公共） | PascalCase | `MaxHealth` |
| 属性（私有） | _camelCase | `_currentHealth` |
| 局部变量 | camelCase | `moveSpeed` |
| 常量 | PascalCase (readonly) 或 UPPER_SNAKE_CASE | `MaxHealth` / `MAX_ENEMIES` |
| 信号 | PascalCase + EventHandler 后缀 | `HealthChangedEventHandler` |
| 参数 | camelCase | `amount` |
| 文件名 | PascalCase | `PlayerController.cs` |
| 枚举 | PascalCase（枚举值也 PascalCase） | `enum State { Idle, Move, Attack }` |

## 代码组织

### 脚本文件结构

```csharp
using Godot;

// 1. [GlobalClass] 暴露给 Godot 编辑器
[GlobalClass]
public partial class PlayerController : CharacterBody2D
{
    // 2. 信号 — PascalCase + EventHandler 后缀
    [Signal]
    public delegate void HealthChangedEventHandler(float newHealth);

    [Signal]
    public delegate void DiedEventHandler();

    // 3. 导出属性（编辑器可配置）
    [Export]
    public float MoveSpeed { get; set; } = 200.0f;

    [Export]
    public int MaxHealth { get; set; } = 100;

    // 4. 公共属性
    public int CurrentHealth { get; set; } = 100;

    // 5. 私有字段
    private bool _isAttacking = false;

    // 6. 节点引用 — 在 _Ready() 中获取
    private Sprite2D _sprite;
    private Area2D _hitbox;

    // 7. 生命周期方法
    public override void _Ready()
    {
        _sprite = GetNode<Sprite2D>("Sprite2D");
        _hitbox = GetNode<Area2D>("Hitbox");
    }

    public override void _PhysicsProcess(double delta)
    {
    }

    // 8. 公共方法
    public int TakeDamage(int amount, Node source)
    {
        return 0;
    }

    // 9. 私有方法
    private int CalculateDamage()
    {
        return 0;
    }
}
```

## 注释规范

### 类注释

```csharp
/// <summary>
/// 角色控制器
/// 处理角色移动、攻击等核心逻辑
/// </summary>
[GlobalClass]
public partial class PlayerController : CharacterBody2D
```

### 方法注释

```csharp
/// <summary>
/// 造成伤害
/// </summary>
/// <param name="amount">伤害数值</param>
/// <param name="source">伤害来源节点</param>
/// <returns>实际造成的伤害值</returns>
public int TakeDamage(int amount, Node source)
```

## Godot C# 特有模式

### 信号驱动解耦

```csharp
// 发射方
[Signal]
public delegate void HealthChangedEventHandler(float newHealth);

public void TakeDamage(float amount)
{
    _currentHealth = Mathf.Clamp(_currentHealth - amount, 0f, MaxHealth);
    EmitSignal(SignalName.HealthChanged, _currentHealth);
}

// 接收方 — 代码连接
public override void _Ready()
{
    player.HealthChanged += OnHealthChanged;
}

private void OnHealthChanged(float newHealth)
{
    _healthBar.Value = newHealth;
}

// 断开连接 — 在 _ExitTree 中
public override void _ExitTree()
{
    if (IsInstanceValid(player))
        player.HealthChanged -= OnHealthChanged;
}
```

### Autoload 单例

用于全局状态管理（在 project.godot 中注册）：

```csharp
// GameManager.cs — 注册为 Autoload "GameManager"
[GlobalClass]
public partial class GameManager : Node
{
    public static GameManager Instance { get; private set; }

    public CharacterBody2D Player { get; set; }
    public string CurrentLevel { get; set; } = "";

    public override void _Ready()
    {
        Instance = this;
    }
}
```

### 状态机模式

```csharp
public enum PlayerState
{
    Idle,
    Move,
    Attack,
    Dodge
}

private PlayerState _state = PlayerState.Idle;

public override void _PhysicsProcess(double delta)
{
    switch (_state)
    {
        case PlayerState.Idle:
            HandleIdle();
            break;
        case PlayerState.Move:
            HandleMove((float)delta);
            break;
        case PlayerState.Attack:
            HandleAttack();
            break;
        case PlayerState.Dodge:
            HandleDodge();
            break;
    }
}
```

### 组合模式（组件挂载）

```csharp
// HealthComponent.cs — 作为子节点挂载，不使用继承
[GlobalClass]
public partial class HealthComponent : Node
{
    [Signal]
    public delegate void HealthChangedEventHandler(float newHealth);

    [Signal]
    public delegate void DiedEventHandler();

    [Export]
    public float MaxHealth { get; set; } = 100f;

    private float _currentHealth;

    public override void _Ready()
    {
        _currentHealth = MaxHealth;
    }

    public void ApplyDamage(float amount)
    {
        _currentHealth = Mathf.Clamp(_currentHealth - amount, 0f, MaxHealth);
        EmitSignal(SignalName.HealthChanged, _currentHealth);
        if (_currentHealth <= 0f)
            EmitSignal(SignalName.Died);
    }

    public void Heal(float amount)
    {
        _currentHealth = Mathf.Clamp(_currentHealth + amount, 0f, MaxHealth);
        EmitSignal(SignalName.HealthChanged, _currentHealth);
    }
}
```

### 基于 Resource 的数据（等价于 Unity ScriptableObject）

```csharp
// EnemyData.cs
[GlobalClass]
public partial class EnemyData : Resource
{
    [Export]
    public string DisplayName { get; set; } = "";

    [Export]
    public float MaxHealth { get; set; } = 100f;

    [Export]
    public float MoveSpeed { get; set; } = 150f;

    [Export]
    public float Damage { get; set; } = 10f;

    [Export]
    public Texture2D Sprite { get; set; }
}

// 使用方式：从任何节点导出
// [Export] public EnemyData EnemyConfig { get; set; }
```

### 类型安全节点访问

```csharp
private HealthComponent _health;

public override void _Ready()
{
    _health = GetNode<HealthComponent>("HealthComponent");
    if (_health == null)
    {
        GD.PrintErr("HealthComponent not found!");
        return;
    }
    _health.Died += OnDied;
}
```

### 事件总线 Autoload

```csharp
// EventBus.cs (Autoload) — 全局事件总线，用于跨场景解耦通信
[GlobalClass]
public partial class EventBus : Node
{
    [Signal]
    public delegate void PlayerDiedEventHandler();

    [Signal]
    public delegate void ScoreChangedEventHandler(int newScore);

    [Signal]
    public delegate void LevelCompletedEventHandler(string levelId);

    [Signal]
    public delegate void ItemCollectedEventHandler(string itemId, Node collector);
}
```

### 对象池模式

```csharp
[GlobalClass]
public partial class BulletPool : Node
{
    private readonly Stack<Node> _pool = new();

    [Export]
    public PackedScene BulletScene { get; set; }

    [Export]
    public int InitialSize { get; set; } = 20;

    public override void _Ready()
    {
        for (int i = 0; i < InitialSize; i++)
        {
            var bullet = BulletScene.Instantiate<Node>();
            bullet.SetProcess(false);
            bullet.SetPhysicsProcess(false);
            AddChild(bullet);
            _pool.Push(bullet);
        }
    }

    public Node Get()
    {
        Node bullet;
        if (_pool.Count > 0)
        {
            bullet = _pool.Pop();
        }
        else
        {
            bullet = BulletScene.Instantiate<Node>();
            AddChild(bullet);
        }
        bullet.SetProcess(true);
        bullet.SetPhysicsProcess(true);
        return bullet;
    }

    public void Return(Node bullet)
    {
        bullet.SetProcess(false);
        bullet.SetPhysicsProcess(false);
        _pool.Push(bullet);
    }
}
```

## 场景构建规则

本项目所有场景用 C# 代码构建，`.tscn` 文件只保留空壳。代码生成时需遵循：

1. **每个场景一个 `BuildScene` 静态方法**：在场景入口脚本中提供，负责创建所有子节点
2. **使用代码设置属性**：节点位置、大小、碰撞形状等全部在 C# 中设定
3. **.tscn 只声明根节点和入口脚本**：不手动编辑 .tscn 添加子节点

```csharp
// 示例：代码构建场景
public static void BuildScene(Node root)
{
    var sprite = new Sprite2D();
    sprite.Texture = GD.Load<Texture2D>("res://assets/sprites/player.png");
    sprite.Position = new Vector2(960, 540);
    root.AddChild(sprite);
    sprite.Owner = root;

    var collider = new CollisionShape2D();
    collider.Shape = new CircleShape2D { Radius = 20f };
    root.AddChild(collider);
    collider.Owner = root;
}
```

## 最佳实践

1. **单一职责**：每个类只负责一个功能
2. **避免魔法数字**：使用 `[Export]` 属性代替硬编码数值
3. **信号解耦**：模块间优先通过信号通信，避免直接引用
4. **组合优于继承**：通过子节点组合行为，而非增加继承深度
5. **所有 Export 属性使用显式类型**：保持编辑器自动补全和运行时验证
6. **Autoload 仅用于全局状态**：设置、存档、事件总线、输入映射——不把游戏逻辑放在 Autoload 中
7. **每个场景可独立运行**：不假设父节点类型或兄弟节点存在
8. **生命周期纪律**：`_Ready()` 做需要节点在场景树中的初始化，`_ExitTree()` 断开信号连接
