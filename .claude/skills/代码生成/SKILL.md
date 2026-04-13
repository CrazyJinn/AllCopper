---
name: 代码生成
description: "根据解决方案设计文档生成 Godot + C# 游戏代码。触发条件：(1) 生成代码 (2) 编写代码 (3) 实现功能 (4) 编程"
---

# 代码生成 Skill

根据需求分析文档和测试用例设计，生成 Godot 4 + C# 游戏代码。

## 技术栈约束

- **语言**：C#（.NET 6+），不使用 GDScript
- **引擎**：Godot 4.x
- **场景构建**：所有场景用 C# 代码构建，.tscn 只保留空壳
- **代码风格**：严格遵循编码规范（见 [references/coding-standards.md](references/coding-standards.md)）

### 强制规则

1. **[GlobalClass]**：所有需要暴露给 Godot 编辑器的类必须标注
2. **信号**：使用 `[Signal]` + `PascalCaseEventHandler` 委托模式
3. **节点引用**：使用 `GetNode<T>()` 在 `_Ready()` 中获取，不使用 `[OnReady]` 属性
4. **组合优于继承**：功能通过子节点组件组合，不创建深层继承链
5. **类型安全**：所有公共属性和方法必须有显式类型声明
6. **命名规范**：PascalCase 用于类名、方法名、属性名；_camelCase 用于私有字段
7. **.tscn 空壳**：场景文件只声明根节点和入口脚本，所有子节点在 C# 的 `BuildScene` 方法中创建

## 执行流程

### 阶段1：从 backlog 获取任务

读取 `99_流程管理/backlog.yaml`，找到 `task_id: 代码生成` 的条目，获取：
- `inputs`: 输入文件列表
- `items`: 待办事项

若 backlog 中无本任务，说明当前无可执行任务，提示用户使用 `/流程管理` 初始化。

### 阶段2：执行代码生成

1. 按 `inputs` 读取输入文件，检查是否全部存在。缺失则终止并报告
2. **分析方案** - 理解系统架构、模块划分、接口定义和测试用例
3. **确认结构** - 按需求分析文档的文件组织方案，确认输出目录结构
4. **生成代码** - 按模块逐一生成代码，遵循以下顺序：
   - **数据层**：先生成 Resource 数据类（CharacterData、ItemData、EnemyData 等）
   - **组件层**：再生成可复用组件（HealthComponent、HitboxComponent 等）
   - **系统层**：然后生成系统脚本（PlayerController、EnemyAI 等）
   - **场景层**：最后生成场景入口脚本和 `BuildScene` 方法
   - **Autoload**：全局单例类（GameManager、EventBus 等）
5. 每个生成的 `.cs` 文件需包含：
   - `using Godot;` 引用
   - `[GlobalClass]` 类标注
   - XML 文档注释（`/// <summary>`）
   - 信号声明（`[Signal]` + `EventHandler` 委托）
   - `[Export]` 属性用于编辑器可配置值
6. 输出到 `89_game/AllCooper/` 对应子目录（scripts/、scenes/、assets/）

### 代码生成模板

#### Resource 数据类

```csharp
using Godot;

[GlobalClass]
public partial class XxxData : Resource
{
    [Export] public string Id { get; set; } = "";
    // ... 其他字段
}
```

#### 组件类

```csharp
using Godot;

[GlobalClass]
public partial class XxxComponent : Node
{
    [Signal]
    public delegate void XxxChangedEventHandler(float newValue);

    [Export]
    public float SomeValue { get; set; } = 0f;

    public override void _Ready() { ... }
}
```

#### 场景入口类

```csharp
using Godot;

[GlobalClass]
public partial class XxxScene : Node2D
{
    public override void _Ready()
    {
        BuildScene(this);
    }

    public static void BuildScene(Node root)
    {
        // 动态创建所有子节点
    }
}
```

### 阶段3：写入 feedback 摘要

执行完成后，向 `99_流程管理/feedback.yaml` 追加执行摘要：

```yaml
entries:
  - task_id: 代码生成
    skill: 代码生成
    executed_at: "<当前时间 ISO格式>"
    processed:              # 已成功完成
      - "生成角色控制模块"
      - "生成战斗系统"
    unprocessed:            # 需后续处理，留在 backlog
      - "UI系统代码待补充"
    unable_to_process:      # 无法处理，标记 blocked
      - []
```

**三类摘要说明**：

| 类型 | 含义 | 后续动作 |
|------|------|----------|
| processed | 已成功完成 | 节点标记 completed |
| unprocessed | 需要后续处理 | 保留在 backlog |
| unable_to_process | 无法处理，需人工介入 | 节点标记 blocked |

## 参考文档

- **编码规范**: [references/coding-standards.md](references/coding-standards.md)
- **Godot 参考文档**: `godot参考文档`（项目根目录）— C# 信号模式、组合架构、Autoload 规则

## 调用方式

```
/代码生成
或由 /流程管理 next 自动调度
```
