---
name: 流程管理
description: "开发流程中央调度器。管理工作流配置、待办事项、执行历史和反馈。触发条件：(1) 需要初始化工作流 (2) 查看当前进度 (3) 执行下一步任务 (4) 处理执行反馈"
---

# 流程管理

开发流程的中央调度器，协调所有其他 skill 的执行。

## 命令

| 命令 | 功能 |
|------|------|
| `/流程管理 init` | 从 README 生成 workflow.yaml |
| `/流程管理 status` | 检查状态，更新 workflow.yaml |
| `/流程管理 next` | 执行下一个可执行任务 |
| `/流程管理 run <task_id>` | 执行指定任务 |
| `/流程管理 history` | 查看执行历史 |
| `/流程管理 feedback` | 处理待处理的反馈 |

## 数据文件

所有数据位于 `99_变更管理/流程数据/` 目录下，共 3 个文件：

| 文件 | 内容 | 说明 |
|------|------|------|
| `workflow.yaml` | 节点配置 + 状态 | 唯一的工作流数据源，合并了 todolist |
| `feedback.yaml` | 反馈队列 | 待处理的反馈记录 |
| `history.yaml` | 执行历史 | 已完成任务的执行记录 |

### workflow.yaml 示例

```yaml
nodes:
  角色设计:
    # --- 配置（静态）---
    name: 角色设计
    skill: 角色设计
    execution_type: skill
    inputs: [01_需求文档/角色需求.md]
    outputs: [02_角色设计/角色设计总览.md]
    predecessors: [S1需求分析]
    successors: [S6t2i人工]
    check_condition: "02_角色设计/角色设计总览.md 存在"
    todo_list: ["从头开始角色设计"]  # 仅 in_progress 时填充
    # --- 状态（动态）---
    status: in_progress
    retry_count: 0
    ready_at: "2026-04-02T12:30:00"
    started_at: "2026-04-02T12:35:00"
    completed_at: null
```

### feedback.yaml 示例

```yaml
feedbacks: []
```

### history.yaml 示例

```yaml
history: []
```

---

## 命令详解

### init - 工作流初始化

从 README.md 的 mermaid 流程图解析生成 workflow.yaml。

**执行流程**：
1. 读取 README.md 中的 mermaid 流程图
2. 解析子图（阶段）、节点（产出物）、连接线（依赖）
3. 解析样式类（manual/semi/auto/input）
4. 生成 workflow.yaml（节点配置 + 初始状态）
5. 初始化 feedback.yaml 和 history.yaml 为空
6. 根据已有产出物更新节点状态（已存在的输出文件标记为 completed）

**解析规则**：
| mermaid 元素 | yaml 字段 |
|-------------|----------|
| `subgraph ID["name"]` | nodes.ID.name |
| `S1O1[文件名]` | outputs 列表 |
| `A & B --> C` | C.predecessors: [A, B] |
| `classDef manual` | execution_type: manual |
| `class S6 manual` | nodes.S6.execution_type |

---

### status - 状态检查

检查各节点状态，更新 workflow.yaml 中的 status 字段。

**执行流程**：
1. 读取 workflow.yaml 和 feedback.yaml
2. 遍历所有节点，检查 check_condition
3. 根据依赖关系判断状态：
   - **completed**: 所有输出文件存在
   - **ready**: 所有前置任务 completed
   - **pending**: 前置任务未全部完成
   - **blocked**: feedback.yaml 中有该节点未处理的反馈
4. 更新 workflow.yaml 中的节点状态
5. 输出所有 ready 节点列表（仅状态报告，不生成 todo_list）

**状态转换**：
```
pending → ready → in_progress → completed
   ↑          ↓         ↓
   │          │         ├─→ failed (retry_count < 1)
   │          │         │       │
   │          │         │       └─→ in_progress (自动重试)
   │          │         │
   │          │         └─→ blocked (retry_count >= 1)
   │          │
   └──────────┴─────────────── 依赖更新时重新计算
```

---

### next / run - 执行任务

调用对应 skill 执行任务，支持自动重试一次。

**执行流程**：
1. 从 workflow.yaml 中筛选 status=ready 的节点
2. 选择目标节点，更新状态为 in_progress
3. **为目标节点生成 todo_list**（根据 description 和 inputs），写入 workflow.yaml
4. 调用对应 skill: `/{skill_name}`
5. skill 执行完成后（自行清理与下游更新）：
   - **成功**:
     a. 清空当前节点 todo_list → `[]`
     b. 更新当前节点 status=completed
     c. 遍历下游节点（successors）：若其所有前置节点均已完成，则更新为 ready
   - **失败**: 检查 retry_count
     - retry_count < 1: 自动重试
     - retry_count >= 1: status=blocked，写入 feedback
6. 记录到 history.yaml

---

### history - 执行历史

查看所有执行历史记录。

**输出格式**：
```
#  | 任务ID       | Skill    | 状态     | 开始时间           | 耗时
---|-------------|----------|---------|-------------------|-----
1  | S1需求分析   | 需求分析  | completed| 2026-04-01 09:00  | 60min
2  | S3角色设计   | 角色设计  | failed   | 2026-04-02 10:00  | 5min
```

---

### feedback - 反馈处理

处理待处理的反馈记录。

**反馈类型及处理策略**：
| 类型 | 触发场景 | 处理策略 |
|------|---------|---------|
| `update_input` | 需要新增角色、玩法等 | 更新 00_init 文件，重置下游节点状态 |
| `missing_input` | 缺少输入文件 | 回退到产出该输入的任务 |
| `skill_error` | skill 执行失败 | 重试当前任务 |
| `quality_issue` | 输出质量不达标 | 标记为 blocked，等待人工处理 |

**update_input 处理流程**（新增角色/玩法）：
1. 识别 feedback 类型为 `update_input`
2. 读取 `target_files`（如 00_init/世界设定.md）
3. 更新前期准备文件（人工或 skill 辅助）
4. 计算影响传播：`impact_nodes = 所有下游节点`
5. 重置 `impact_nodes` 状态为 ready
6. 标记 feedback 为 resolved

**执行流程**：
1. 读取 feedback.yaml 中的反馈队列
2. 分析每个反馈的类型
3. 根据类型执行对应处理策略
4. 更新节点状态
5. 清理已处理的反馈

---

## 与其他 Skill 的集成

### todo_list 生命周期

todo_list 仅存在于当前正在执行的节点（status=in_progress），遵循以下生命周期：

1. **生成**：`next`/`run` 命令选定节点时，根据 description 生成 todo_list 写入 workflow.yaml
2. **执行**：skill 执行过程中根据实际进度更新 todo_list 条目
3. **清理**：skill 完成后自行清空 todo_list → `[]`，同时更新下游节点状态
4. **默认**：非活跃节点的 todo_list 始终为 `[]`

### skill 完成后的行为

每个 skill 执行完成后应：
1. 验证输出文件是否生成
2. **成功**：清空自身 todo_list，更新状态为 completed，更新下游节点为 ready
3. **失败**：写入 feedback.yaml

**写入 feedback.yaml 格式**：
```yaml
feedbacks:
  - task_id: S3角色设计
    skill: 角色设计
    error_type: missing_input  # missing_input | skill_error | quality_issue | dependency_failed
    message: "缺少必要的角色需求文档"
    suggested_action: "重新执行 S1需求分析"
    created_at: 2026-04-02T11:00:00
```

---

## 调用方式

初始化工作流：
```
/流程管理 init
```

查看当前进度：
```
/流程管理 status
```

执行下一个任务：
```
/流程管理 next
```

执行指定任务：
```
/流程管理 run S3角色设计
```

查看历史：
```
/流程管理 history
```

处理反馈：
```
/流程管理 feedback
```
