---
name: 需求分析
description: "2D游戏开发需求分析，将世界观和设定集转化为结构化的开发需求文档。触发条件：(1) 分析游戏世界观/设定集生成需求文档 (2) 需求分析阶段 (3) 生成角色/场景/音频/代码需求文档，游戏基本信息写入CLAUDE.md"
---

# 游戏需求分析

从世界观和设定集文档中提取并生成结构化的游戏开发需求。

## 执行流程

### 阶段1：从 backlog 获取任务

读取 `99_流程管理/backlog.yaml`，找到 `task_id: 需求分析` 的条目，获取：
- `inputs`: 输入文件列表（`00_init/游戏概览.md`、`00_init/世界设定.md`）
- `outputs`: 预期输出文件列表

若 backlog 中无本任务，说明当前无可执行任务，提示用户使用 `/流程管理` 初始化。

### 阶段2：执行需求分析

1. 按 `inputs` 逐个读取输入文件，检查是否全部存在。缺失则终止并报告
2. 分析提取关键信息（见 [references/extraction-guide.md](references/extraction-guide.md)）
3. 生成 `CLAUDE.md` 项目配置文件（游戏基本信息统一在此维护）
4. 按模板格式生成4个需求文档（见 [references/output-templates.md](references/output-templates.md)）：
   ```
   01_需求文档/
   ├── 角色需求.md          # 角色列表、外观描述、动画需求
   ├── 场景需求.md          # 场景列表、环境描述、交互元素
   ├── 音频需求.md          # BGM列表、音效需求、风格参考
   └── 代码需求.md          # 核心系统、UI系统、功能模块
   ```
5. 验证 `outputs` 中的所有文件已正确生成

### 阶段3：写入 feedback 摘要

执行完成后，向 `99_流程管理/feedback.yaml` 追加执行摘要：

```yaml
entries:
  - task_id: 需求分析
    skill: 需求分析
    executed_at: "<当前时间 ISO格式>"
    processed:              # 已成功完成
      - "生成角色需求文档"
      - "生成场景需求文档"
    unprocessed:            # 需后续处理，留在 backlog
      - "音频需求待补充"
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

- **信息提取指南**: [references/extraction-guide.md](references/extraction-guide.md)
- **输出文档模板**: [references/output-templates.md](references/output-templates.md)

## 调用方式

```
/需求分析
或由 /流程管理 next 自动调度
```
