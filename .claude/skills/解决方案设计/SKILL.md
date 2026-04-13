---
name: 解决方案设计
description: "基于代码需求进行技术方案分析，输出需求分析文档和测试用例设计，为代码生成提供输入。触发条件：(1) 需要分析技术方案 (2) 设计系统架构 (3) 编写测试用例 (4) 技术选型与模块设计"
---

# 解决方案设计 Skill

基于代码需求文档，设计基于 Godot 4 + C# 的系统架构方案和测试用例，为代码生成阶段提供完整技术蓝图。

## 技术栈约束

- **语言**：C#（.NET 6+），不使用 GDScript
- **引擎**：Godot 4.x
- **架构核心**：节点组合 + 信号驱动 + 类型安全
- **数据驱动**：使用 Godot Resource（C# 版 ScriptableObject）

### 强制设计原则

1. **一切皆节点**：通过添加节点组合行为，不增加继承深度
2. **信号完整性**：所有跨模块通信使用 `[Signal]` + `EventHandler` 委托，信号必须携带类型化参数
3. **场景独立**：每个场景可独立实例化，不假设父节点或兄弟节点存在
4. **Autoload 纪律**：仅用于全局状态（EventBus、GameManager），不存放游戏逻辑
5. **场景代码构建**：.tscn 空壳，子节点在 C# `BuildScene` 方法中动态创建

## 执行流程

### 阶段1：从 backlog 获取任务

读取 `99_流程管理/backlog.yaml`，找到 `task_id: 解决方案设计` 的条目，获取：
- `inputs`: 输入文件列表
- `items`: 待办事项

若 backlog 中无本任务，说明当前无可执行任务，提示用户使用 `/流程管理` 初始化。

### 阶段2：执行解决方案设计

1. 按 `inputs` 读取输入文件，检查是否全部存在。缺失则终止并报告
2. **分析需求** - 提取核心系统、功能模块、数据结构需求（见 [references/analysis-guide.md](references/analysis-guide.md)）
3. **设计架构** - 为每个系统设计：
   - **场景树结构**：以组合模式设计节点层级
   - **C# 类定义**：每个节点的脚本类名、继承关系、组件组合
   - **信号架构**：`[Signal]` + `EventHandler` 委托，信号流和监听关系
   - **数据结构**：`Resource` 子类，`[Export]` 属性列表
   - **Autoload 清单**：全局单例及其职责
4. **生成需求分析文档** - 输出到 `10_解决方案设计/需求分析文档.md`，包含：
   - 系统总览与模块依赖图（mermaid）
   - 场景树结构设计（每个系统的节点树图）
   - 每个核心系统的 C# 接口定义（属性、方法、信号）
   - C# Resource 数据结构汇总
   - Autoload 单例清单
   - 开发优先级与里程碑
5. **设计测试用例** - 输出到 `10_解决方案设计/测试用例设计.md`（见 [references/test-design-guide.md](references/test-design-guide.md)），包含：
   - 单元测试（C# 测试方法签名）
   - 信号测试（验证信号发射和接收）
   - 集成测试（跨系统场景）
   - 边界条件和性能测试

### 阶段3：写入 feedback 摘要

执行完成后，向 `99_流程管理/feedback.yaml` 追加执行摘要：

```yaml
entries:
  - task_id: 解决方案设计
    skill: 解决方案设计
    executed_at: "<当前时间 ISO格式>"
    processed:              # 已成功完成
      - "生成需求分析文档"
      - "生成测试用例设计"
    unprocessed:            # 需后续处理，留在 backlog
      - []
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

- **需求分析指南**: [references/analysis-guide.md](references/analysis-guide.md)
- **测试用例设计指南**: [references/test-design-guide.md](references/test-design-guide.md)
- **Godot 参考文档**: `godot参考文档`（项目根目录）— C# 信号模式、组合架构、Autoload 规则、Resource 数据模式

## 调用方式

```
/解决方案设计
或由 /流程管理 next 自动调度
```
