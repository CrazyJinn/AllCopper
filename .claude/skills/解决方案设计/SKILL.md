---
name: 解决方案设计
description: "基于代码需求进行技术方案分析，输出需求分析文档和测试用例设计，为代码生成提供输入。触发条件：(1) 需要分析技术方案 (2) 设计系统架构 (3) 编写测试用例 (4) 技术选型与模块设计"
---

# 解决方案设计 Skill

基于代码需求文档，设计系统架构方案和测试用例，为代码生成阶段提供完整技术蓝图。

## 执行流程

### 阶段1：从 backlog 获取任务

读取 `99_流程管理/backlog.yaml`，找到 `task_id: 解决方案设计` 的条目，获取：
- `inputs`: 输入文件列表
- `outputs`: 预期输出文件列表

若 backlog 中无本任务，说明当前无可执行任务，提示用户使用 `/流程管理` 初始化。

### 阶段2：执行解决方案设计

1. 按 `inputs` 读取输入文件（`01_需求文档/代码需求.md`、`CLAUDE.md`），检查是否全部存在。缺失则终止并报告
2. **分析需求** - 提取核心系统、功能模块、数据结构需求（见 [references/analysis-guide.md](references/analysis-guide.md)）
3. **设计架构** - 为每个系统设计模块划分、接口定义、数据流和依赖关系
4. **生成需求分析文档** - 输出到 `06_解决方案/需求分析文档.md`，包含：
   - 系统总览与模块依赖图
   - 每个核心系统的详细技术方案
   - 接口定义与通信协议
   - 数据结构设计
   - 开发优先级与里程碑
5. **设计测试用例** - 输出到 `06_解决方案/测试用例设计.md`（见 [references/test-design-guide.md](references/test-design-guide.md)）
6. 验证 `outputs` 中的所有文件已正确生成

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

## 调用方式

```
/解决方案设计
或由 /流程管理 next 自动调度
```
