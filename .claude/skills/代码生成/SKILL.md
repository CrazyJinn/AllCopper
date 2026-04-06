---
name: 代码生成
description: "根据解决方案设计文档生成 Godot + GDScript 游戏代码。触发条件：(1) 生成代码 (2) 编写代码 (3) 实现功能 (4) 编程"
---

# 代码生成 Skill

根据需求分析文档和测试用例设计，生成 Godot + GDScript 游戏代码。

## 执行流程

### 阶段1：从 backlog 获取任务

读取 `99_流程管理/backlog.yaml`，找到 `task_id: 代码生成` 的条目，获取：
- `inputs`: 输入文件列表
- `outputs`: 预期输出文件列表

若 backlog 中无本任务，说明当前无可执行任务，提示用户使用 `/流程管理` 初始化。

### 阶段2：执行代码生成

1. 按 `inputs` 读取输入文件（`06_解决方案/需求分析文档.md`、`06_解决方案/测试用例设计.md`、`CLAUDE.md`），检查是否全部存在。缺失则终止并报告
2. **分析方案** - 理解系统架构、模块划分、接口定义和测试用例
3. **确认结构** - 按需求分析文档的文件组织方案，确认输出目录结构
4. **生成代码** - 按模块逐一生成代码，遵循编码规范（见 [references/coding-standards.md](references/coding-standards.md)），添加必要注释
5. 输出到 `89_game/AllCooper/` 对应子目录（scripts/、scenes/、assets/）
6. 验证 `outputs` 中的所有文件已正确生成

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

## 调用方式

```
/代码生成
或由 /流程管理 next 自动调度
```
