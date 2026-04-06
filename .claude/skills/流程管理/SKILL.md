---
name: 流程管理
description: "开发流程中央调度器。管理工作流配置、待办队列、执行历史和任务反馈。触发条件：(1) 需要初始化工作流 (2) 查看当前进度 (3) 处理反馈更新待办 (4) 执行下一个任务"
allowed-tools: Read, Bash, Write, Edit
---

# 流程管理

开发流程的中央调度器，协调所有其他 skill 的执行。

## 命令

| 命令 | 功能 |
|------|------|
| `/流程管理 init` | 从 README 生成全部数据文件 |
| `/流程管理 review` | 处理反馈 → 更新待办队列 |
| `/流程管理 run` | 唤起 skill → 记录结果 |
| `/流程管理 status` | 更新工作流状态，维护待办队列，压缩历史 |

## 数据文件

所有数据位于 `99_流程管理/` 目录下，共 4 个文件：

| 文件 | 内容 | 说明 |
|------|------|------|
| `workflow.yaml` | 节点配置 + 状态 | 唯一的工作流数据源 |
| `backlog.yaml` | 待办任务队列 | ready 节点 + 分配给 skill 的任务列表 |
| `feedback.yaml` | 任务执行摘要 | processed / unprocessed / unable_to_process |
| `history.yaml` | 执行历史 + 归档 | 时间线记录，旧记录自动压缩 |

节点结构详见 [workflow-schema.md](references/workflow-schema.md)。

---

## init - 工作流初始化

从 README.md 的 mermaid 流程图解析生成全部数据文件。

**执行流程**：
1. 读取 README.md 中的 mermaid 流程图
2. 解析子图（阶段）、节点（产出物）、连接线（依赖）、样式类（执行类型）
   - 解析规则详见 [mermaid-parsing-guide.md](references/mermaid-parsing-guide.md)
3. 生成 `workflow.yaml`（节点配置 + 初始状态）
4. 初始化空的 `backlog.yaml`、`feedback.yaml`、`history.yaml`
5. 根据已有产出物更新节点状态（已存在的输出文件 → completed）
6. 将所有 ready 节点按拓扑序写入 `backlog.yaml`

---

## review - 处理反馈，更新待办

读取 skill 执行后写入的 feedback，更新工作流状态和待办队列。

**执行流程**：
1. 读取 `feedback.yaml` 中最新的 entry（由上次调用的 skill 写入）
2. 对 feedback 中的三类内容分别处理：
   - **processed**：确认完成，更新 workflow 节点状态为 completed，级联更新下游节点
   - **unprocessed**：保留在 backlog 中，等待下次执行
   - **unable_to_process**：标记节点为 blocked，需要人工介入
3. 更新 `backlog.yaml`
4. 从 `feedback.yaml` 中删除已处理的条目，保留未处理的（unprocessed / unable_to_process）

---

## run - 唤起 skill，记录结果

从待办队列取任务，调用对应 skill 执行，并记录执行历史。

### Step 1: 唤起对应 skill

1. 从 `backlog.yaml` 取第一个待办任务
2. 从 `workflow.yaml` 读取该任务的 inputs、outputs、skill 名称
3. 更新该节点 status: in_progress
4. 调用对应 skill: `/{skill_name}`，传入 inputs、outputs 和 **items（任务列表）**
5. skill 逐个执行 items 中的任务，执行完成后自行写入 `feedback.yaml`

### Step 2: 写入 history

读取 skill 写入的 `feedback.yaml`，在 `history.yaml` 追加执行记录：

```yaml
history:
  - task_id: 需求分析
    skill: 需求分析
    status: completed       # completed | partial | failed
    started_at: "2026-04-02T12:00:00"
    completed_at: "2026-04-02T12:35:00"
    summary: "完成角色/场景需求，音频待补充"
```

---

## status - 状态检查与数据维护

三步维护：更新工作流 → 重建待办队列 → 压缩历史。

### Step 1: 更新 workflow

遍历所有节点，检查 check_condition，更新状态：

| 状态 | 条件 |
|------|------|
| completed | 所有输出文件存在 |
| ready | 所有前置任务 completed，输出文件不存在 |
| pending | 前置任务未全部完成 |
| blocked | feedback 中有 unable_to_process 记录 |

### Step 2: 更新 backlog

1. 收集所有 status=ready 的节点
2. 按拓扑序排列
3. 覆盖写入 `backlog.yaml`

### Step 3: 压缩 history

1. 保留最近 10 条详细记录
2. 更早记录压缩为归档摘要：
   ```yaml
   archived:
     - period: "2026-04-01 ~ 2026-04-02"
       total: 8
       completed: 6
       failed: 2
       tasks: [需求分析, 剧本拆解]
   ```

### Step 4: 输出状态报告

```
节点状态: completed 5 | ready 3 | pending 8 | blocked 1
待办队列: 角色设计 → 场景设计 → 代码需求分析
最近反馈: 需求分析 完成部分任务，音频需求待补充
```

---

## 与其他 Skill 的集成

### skill 调用接口

`run` 命令调用 skill 时提供：
- **inputs**: workflow.yaml 中该节点的 inputs 列表
- **outputs**: workflow.yaml 中该节点的 outputs 列表
- **items**: backlog.yaml 中该任务的 items 列表（skill 逐个执行）

### skill 执行职责

流程管理负责：
1. 调用 skill 时传入 inputs、outputs、items（任务列表）
2. 从 feedback.yaml 读取 skill 写入的执行结果
3. 写入 history.yaml、更新 workflow.yaml 节点状态

skill 本身负责：
1. 逐个执行 items 中的任务
2. 执行完成后将结果分类写入 feedback.yaml（processed / unprocessed / unable_to_process）

---

## 调用方式

```
/流程管理 init      # 初始化工作流
/流程管理 review    # 处理反馈，更新待办
/流程管理 run       # 执行下一个任务
/流程管理 status    # 查看当前状态
```
