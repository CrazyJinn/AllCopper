# 测试用例设计指南

指导如何为 Godot 4 + C# 游戏系统设计完整的测试用例。

## 测试框架

本项目使用 **Godot 测试框架**（基于 C#）进行测试。测试类需继承 `Godot.GdTest` 或使用 Godot 的 `[TestCase]` 模式。

测试文件位置：`tests/` 目录下，按系统分目录组织。

## 测试层级

### 1. 单元测试

针对单个函数/方法的独立测试。

**格式**：
```
测试ID: TC-<系统缩写>-U<序号>
测试名: <简洁描述>
前置条件: <需要的初始状态>
测试步骤:
  1. <步骤1>
  2. <步骤2>
预期结果: <期望的输出或状态变更>
C# 测试方法: <对应的测试方法签名>
```

**示例**：
```
测试ID: TC-CMB-U01
测试名: 伤害计算-普通攻击
前置条件: HealthComponent MaxHealth=100, CurrentHealth=100
测试步骤:
  1. 调用 ApplyDamage(10)
预期结果: CurrentHealth == 90, HealthChanged 信号触发
C# 测试方法:
  [Test]
  public void TestApplyDamage_NormalAttack()
  {
      var health = new HealthComponent();
      health.MaxHealth = 100f;
      health._Ready();
      float? receivedHealth = null;
      health.HealthChanged += (newHealth) => receivedHealth = newHealth;

      health.ApplyDamage(10f);

      Assert.That(health.CurrentHealth, Is.EqualTo(90f));
      Assert.That(receivedHealth, Is.EqualTo(90f));
  }
```

### 2. 集成测试

测试多个系统协同工作的场景。需要搭建最小的场景树。

**格式**：
```
测试ID: TC-INT-I<序号>
测试名: <场景描述>
涉及系统: <系统A> + <系统B>
前置条件: <各系统的初始状态>
测试步骤:
  1. <操作步骤1>
  2. <操作步骤2>
预期结果: <跨系统的期望行为>
C# 测试方法: <对应的测试方法签名>
```

**示例**：
```
测试ID: TC-INT-I01
测试名: 移动+受伤判定
涉及系统: PlayerController + HurtboxComponent
前置条件: 角色在(0,0), 怪物Hitbox在(50,0)
测试步骤:
  1. 角色向右移动
  2. Hurtbox 检测到 Hitbox 重叠
预期结果: HealthComponent.ApplyDamage 被调用
C# 测试方法:
  [Test]
  public void TestMoveIntoEnemyTakesDamage()
  {
      // 构建最小场景树
      var player = new CharacterBody2D();
      var health = new HealthComponent();
      var hurtbox = new Area2D();
      player.AddChild(health);
      player.AddChild(hurtbox);
      // ... 设置碰撞并验证
  }
```

### 3. 信号测试

验证 Godot C# 信号的发射和接收：

```csharp
[Test]
public void TestHealthChangedSignalEmitted()
{
    var health = new HealthComponent();
    health.MaxHealth = 100f;
    health._Ready();

    var signals = new List<float>();
    health.HealthChanged += (newHealth) => signals.Add(newHealth);

    health.ApplyDamage(30f);

    Assert.That(signals, Has.Count.EqualTo(1));
    Assert.That(signals[0], Is.EqualTo(70f));
}

[Test]
public void TestDiedSignalEmitted()
{
    var health = new HealthComponent();
    health.MaxHealth = 100f;
    health._Ready();

    bool diedFired = false;
    health.Died += () => diedFired = true;

    health.ApplyDamage(100f);

    Assert.That(diedFired, Is.True);
}
```

### 4. 边界条件测试

针对极端值的测试：

- 零值：HP=0, 护盾=0, 弹药=0
- 最大值：HP满, 背包满, 堆叠上限
- 空值：空背包, 空对话, 空掉落表
- 并发：同时受击+闪避, 多怪物同时攻击
- 负值：ApplyDamage(-10) 不应回血
- 超限：ApplyDamage(999) 应将 HP 钳制到 0

### 5. 性能测试

基于代码需求的性能指标设计测试场景：

| 指标 | 测试方法 | 通过标准 |
|------|---------|---------|
| 帧率稳定性 | 20+怪物同屏战斗 | ≥60fps |
| 场景切换 | 房间间切换 | <2秒 |
| 大地图 | 4096×4096地图移动 | ≥60fps |
| 背包操作 | 满背包拖拽 | 无卡顿 |

## 测试用例设计模板

```markdown
# 测试用例设计

## 1. 角色控制系统

### 单元测试
| ID | 测试名 | 前置条件 | 步骤 | 预期结果 |
|----|-------|---------|------|---------|
| TC-CTL-U01 | WASD移动 | 角色在(0,0) | 按W键1秒 | 角色Y坐标减少 |
| TC-CTL-U02 | 闪避无敌帧 | 怪物在攻击范围 | 闪避时被攻击 | 0伤害 |

### 信号测试
| ID | 测试名 | 触发动作 | 预期信号 |
|----|-------|---------|---------|
| TC-CTL-S01 | 受伤发射信号 | ApplyDamage(10) | HealthChanged(90) |
| TC-CTL-S02 | 死亡发射信号 | ApplyDamage(999) | Died() |

### 集成测试
| ID | 测试名 | 涉及系统 | 预期结果 |
|----|-------|---------|---------|
| TC-INT-I01 | 移动+受伤判定 | 控制+受伤 | 移动进入怪物范围受击 |

### 边界条件
| ID | 测试名 | 条件 | 预期结果 |
|----|-------|------|---------|
| TC-CTL-B01 | 闪避冷却中再闪避 | 闪避CD未恢复 | 不执行闪避 |
| TC-CTL-B02 | 负伤害值 | ApplyDamage(-10) | 不改变HP |

## 2. 战斗资源系统
...

## 3. <每个系统重复上述结构>
...

## 性能测试场景
| ID | 场景 | 方法 | 通过标准 |
|----|------|------|---------|
| TC-PERF-01 | 20怪物同屏 | 生成20个怪物战斗 | ≥60fps |
```

## 测试覆盖要点

按系统优先级确保测试覆盖：

**P0 系统必须覆盖**：
- 正常流程（happy path）
- 异常流程（错误输入、非法状态）
- 边界条件（零值、最大值、空值、负值）
- 信号发射（关键信号必须有测试）
- 系统间交互（至少2个集成测试）

**P1 系统基本覆盖**：
- 正常流程
- 关键边界条件
- 关键信号
