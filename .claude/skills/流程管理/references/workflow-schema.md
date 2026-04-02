# workflow.yaml 结构说明

本文档定义 workflow.yaml 的完整结构规范。

## 顶层结构

```yaml
version: 1.0                    # 配置版本号
generated_at: 2026-04-02T10:00:00  # 生成时间 (ISO 8601)
source: ReadMe.md               # 来源文件

nodes:                          # 节点字典
  <node_id>:
    # ... 节点配置
```

## 节点配置

每个节点的完整字段：

```yaml
S1需求分析:
  # 基本信息
  name: 需求分析                # 显示名称
  skill: 需求分析               # 对应的 skill 名称（人工任务为 null）
  description: "功能描述"       # 功能说明

  # 执行类型
  execution_type: skill         # skill | api | manual | auto

  # 依赖关系
  inputs:                       # 输入文件列表
    - 00_init/游戏概览.md
    - 00_init/世界设定.md
  outputs:                      # 输出文件列表
    - 01_需求文档/角色需求.md
    - 01_需求文档/场景需求.md
  predecessors: [S0前期准备]     # 前置节点 ID 列表
  successors: [S3角色设计]       # 后继节点 ID 列表

  # 状态检测
  check_condition: "01_需求文档/ 目录存在"  # 完成条件描述

  # 待办事项（字符串数组，节点变为 ready 时填充）
  todo_list: ["从头开始需求分析"]
```

## 字段说明

### execution_type 执行类型

| 值 | 含义 | 示例 |
|----|------|------|
| `skill` | 调用 Claude skill 执行 | 需求分析、角色设计 |
| `api` | 调用外部 API | image-gen-api |
| `manual` | 需要人工处理 | t2i(人工)、游戏组装 |
| `auto` | 自动化脚本执行 | 精灵帧提取、资源搬运 |

### predecessors / successors 依赖关系

- `predecessors`: 前置节点，必须全部完成后才能执行当前节点
- `successors`: 后继节点，当前节点完成后可以触发的节点

### check_condition 完成条件

用于判断节点是否已完成的条件描述，支持：

1. **文件存在检查**：
   - `"path/to/file.md 存在"`
   - `"path/to/dir/ 目录存在"`

2. **通配符检查**：
   - `"path/**/*.png 存在"`

3. **多条件组合**：
   - `"文件A 和 文件B 都存在"`

### todo_list 待办事项

字符串数组，仅当前正在执行的节点（status=in_progress）拥有非空 todo_list。

- `next`/`run` 命令选定节点并设为 in_progress 时，根据 description 生成初始 todo_list
- 执行过程中根据实际进度更新 todo_list 条目
- 节点完成后自行清空：`todo_list: []`，同时更新下游节点状态
- 非活跃节点的 todo_list 始终为 `[]`

## 从 mermaid 解析映射

| mermaid 元素 | yaml 字段 |
|-------------|----------|
| `subgraph S1需求分析["<b>需求分析</b>"]` | `S1需求分析.name: 需求分析` |
| `S1O1[游戏基本信息.memory]` | `S1需求分析.outputs: [..., 游戏基本信息.memory]` |
| `A1 & A2 --> S1需求分析` | `S1需求分析.predecessors: [A1, A2]` |
| `S1O2 --> S3角色设计` | `S3角色设计.predecessors: [S1O2]` |
| `classDef manual fill:#ffebee` | 定义 execution_type=manual |
| `class S6t2i人工 manual` | `S6t2i人工.execution_type: manual` |

## 样式类到执行类型映射

| 样式类 | 颜色 | execution_type |
|--------|------|----------------|
| `manual` | 红色 #ffebee | `manual` |
| `semi` | 橙色 #fff3e0 | `api` |
| `auto` | 绿色 #e8f5e9 | `auto` 或 `skill` |
| `input` | 蓝色 #e3f2fd | `input` (前置准备) |

## 示例：完整节点

```yaml
S8i2i图片:
  name: i2i (api)
  skill: image-gen-api
  description: "图片生成图片，生成角色立绘和过场图"
  execution_type: api
  inputs:
    - 02_角色设计/*/设计图.png
    - 04_剧本/*/立绘提示词.md
    - 04_剧本/*/过场提示词.md
  outputs:
    - 02_角色设计/*/立绘/*.png
    - 04_剧本/*/过场/*.png
  predecessors:
    - S6t2i人工
    - S2剧本拆解
  successors:
    - S14资源搬运
  check_condition: "02_角色设计/**/立绘/*.png 和 04_剧本/**/过场/*.png 存在"
```
