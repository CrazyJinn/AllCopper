# 数据文件结构说明

## 目录

- [workflow.yaml](#workflowyaml)
- [backlog.yaml](#backlogyaml)
- [feedback.yaml](#feedbackyaml)
- [history.yaml](#historyyaml)

---

## workflow.yaml

### 顶层结构

```yaml
version: 1.0
generated_at: 2026-04-02T10:00:00
source: ReadMe.md

nodes:
  <node_id>:
    # ... 节点配置
```

### 节点字段

```yaml
需求分析:
  name: 需求分析                # 显示名称
  skill: 需求分析               # 对应 skill（人工任务为 null）
  description: "功能描述"
  execution_type: skill         # skill | api | manual | auto
  inputs: [00_init/游戏概览.md]
  outputs: [01_需求文档/角色需求.md]
  predecessors: [前期准备]
  successors: [角色设计]
  check_condition: "01_需求文档/角色需求.md 存在"
  status: pending               # pending | ready | in_progress | completed | blocked
  retry_count: 0
  started_at: null
  completed_at: null
```

### execution_type 执行类型

| 值 | 含义 | 示例 |
|----|------|------|
| `skill` | 调用 Claude skill | 需求分析、角色设计 |
| `api` | 调用外部 API | image-gen-api |
| `manual` | 需要人工处理 | t2i(人工)、游戏组装 |
| `auto` | 自动化脚本 | 精灵帧提取、资源搬运 |

### 状态转换

```
pending → ready → in_progress → completed
   ↑          ↓         ↓
   │          │         ├─→ blocked (unable_to_process)
   │          │
   └──────────┴──── 依赖更新时重新计算
```

---

## backlog.yaml

ready 状态节点的可执行队列，按拓扑序排列。每个任务包含分配给 skill 的 items 列表。

```yaml
tasks:
  - task_id: 需求分析
    skill: 需求分析
    inputs: [00_init/游戏概览.md]
    outputs: [01_需求文档/角色需求.md]
    items:                          # 分配给 skill 的具体任务，逐个执行
      - "分析角色需求，生成角色需求文档"
      - "分析场景需求，生成场景需求文档"
      - "分析音频需求，生成音频需求文档"
      - "分析代码需求，生成代码需求文档"
  - task_id: 角色设计
    skill: 角色设计
    inputs: [01_需求文档/角色需求.md]
    outputs: [02_角色设计/角色设计总览.md]
    items:
      - "设计主角罗兰的角色立绘提示词"
      - "设计主角薇的角色立绘提示词"
      - "设计Boss以诺的角色立绘提示词"
```

**items 生成规则**：
- 从 workflow.yaml 节点的 outputs 推导，每个输出文件对应一个 item
- 也可根据节点 description 细化拆分
- skill 收到 items 后逐个执行，每完成一个 item 更新进度

**生成时机**：
- `init`: 初始化时生成
- `review`: 处理 feedback 后更新
- `status`: 全面重建

---

## feedback.yaml

任务执行摘要，由被调用的 skill 写入（非流程管理写入）。

```yaml
entries:
  - task_id: 需求分析
    skill: 需求分析
    executed_at: "2026-04-02T12:00:00"
    processed:              # 已成功完成
      - "生成角色需求文档"
      - "生成场景需求文档"
    unprocessed:            # 需后续处理，留在 backlog
      - "音频需求待补充"
    unable_to_process:      # 无法处理，标记 blocked
      - []
```

**写入职责**：由 `run` 唤起的 skill 在执行完成后写入，流程管理只负责读取和处理。

**三类摘要说明**：

| 类型 | 含义 | 后续动作 |
|------|------|----------|
| processed | 已成功完成 | 节点标记 completed |
| unprocessed | 需要后续处理 | 保留在 backlog |
| unable_to_process | 无法处理，需人工介入 | 节点标记 blocked |

---

## history.yaml

执行历史 + 归档。

```yaml
history:
  - task_id: 需求分析
    skill: 需求分析
    status: completed       # completed | partial | failed
    started_at: "2026-04-02T12:00:00"
    completed_at: "2026-04-02T12:35:00"
    summary: "完成角色/场景需求，音频待补充"

archived:
  - period: "2026-04-01 ~ 2026-04-02"
    total: 8
    completed: 6
    failed: 2
    tasks: [需求分析, 剧本拆解]
```

**压缩规则**：`status` 命令保留最近 10 条详细记录，更早记录压缩到 archived。

---

## 从 mermaid 解析映射

| mermaid 元素 | yaml 字段 |
|-------------|----------|
| `subgraph ID["name"]` | nodes.ID.name |
| `S1O1[文件名]` | outputs 列表 |
| `A & B --> C` | C.predecessors: [A, B] |
| `classDef manual` | execution_type: manual |

详见 [mermaid-parsing-guide.md](mermaid-parsing-guide.md)。

## 样式类到执行类型映射

| 样式类 | 颜色 | execution_type |
|--------|------|----------------|
| `manual` | #ffebee 红 | `manual` |
| `semi` | #fff3e0 橙 | `api` |
| `auto` | #e8f5e9 绿 | `auto` 或 `skill` |
| `input` | #e3f2fd 蓝 | `input` |
