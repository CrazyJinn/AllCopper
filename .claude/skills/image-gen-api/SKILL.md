---
name: image-gen-api
description: 调用火山引擎豆包API生成图片。支持文生图和图生图两种模式，统一接口调用。触发条件：(1) 需要生成场景图片 (2) 需要生成角色立绘表情 (3) 基于设计图生成衍生图 (4) 批量图片生成任务
allowed-tools: Read, Bash, Write, Edit
---

# 图片生成

调用火山引擎豆包 API 生成图片，支持文生图和图生图两种模式。

## 执行流程

### 阶段1：从 backlog 获取任务

读取 `99_流程管理/backlog.yaml`，找到 `skill: image-gen-api` 的条目（可能为 `文生图api` 或 `图生图api`），获取：
- `inputs`: 输入文件列表
- `items`: 待办事项

若 backlog 中无本任务，说明当前无可执行任务，提示用户使用 `/流程管理` 初始化。

### 阶段2：执行图片生成

> **并发控制**：API 支持最多 5 个并发请求，建议控制在 2-3 个以确保稳定性。

> **尺寸参数（强制）**：每次调用 `submit` 时必须通过 `--size` 显式传入图片尺寸。尺寸从当前任务的需求/上下文中确定（如场景类型、角色资源规格、backlog 条目说明等）。若无法从上下文中明确尺寸，**必须向用户确认**后再调用，禁止省略 `--size` 或使用默认值。

根据任务类型执行对应流程：

#### 场景图片生成（文生图）

1. 读取 `03_场景设计/场景设计总览.md`，筛选状态为"提示词"的场景
2. **并发处理**待生成场景（建议 2-3 个并发）：
   - 进入场景文件夹，读取 `提示词.md` 提取提示词
   - 从场景类型、需求文档或上下文中确定图片尺寸
   - 执行 `python scripts/doubao_api.py submit "<提示词>" --size WxH` 提交任务
   - 从返回结果中获取图片 URL
   - 执行 `python scripts/doubao_api.py download <url> <output_path>` 下载图片
   - 下载成功后更新状态为"初稿"

#### 角色立绘表情生成（图生图）

1. 读取 `02_角色设计/角色设计总览.md`
2. 找到所有角色的"**立绘表情状态**"表格
3. 筛选状态为"提示词"的表情
4. **并发处理**待生成表情（建议 2-3 个并发）：
   - 进入角色文件夹，读取 `立绘表情提示词.md`
   - 找到该角色的设计图终稿作为输入图片
   - 从角色类型、需求文档或上下文中确定图片尺寸
   - 执行 `python scripts/doubao_api.py submit "<提示词>" --image <设计图路径> --size WxH` 提交任务
   - 下载图片并更新状态为"初稿"

#### 多参考图生成（融合风格）

```bash
python scripts/doubao_api.py submit "<提示词>" --image <图片1> --image <图片2> --image <图片3>
```

### 阶段3：写入 feedback 摘要

执行完成后，向 `99_流程管理/feedback.yaml` 追加执行摘要：

```yaml
entries:
  - task_id: 文生图api
    skill: image-gen-api
    executed_at: "<当前时间 ISO格式>"
    processed:              # 已成功完成
      - "生成scene_001场景图"
      - "生成scene_002场景图"
    unprocessed:            # 需后续处理，留在 backlog
      - "scene_003审核未通过，待重试"
    unable_to_process:      # 无法处理，标记 blocked
      - []
```

**三类摘要说明**：

| 类型 | 含义 | 后续动作 |
|------|------|----------|
| processed | 已成功完成 | 节点标记 completed |
| unprocessed | 需要后续处理 | 保留在 backlog |
| unable_to_process | 无法处理，需人工介入 | 节点标记 blocked |

## 脚本用法

> 脚本位于技能目录的 `scripts/doubao_api.py`

```bash
# 文生图（--size 为必填参数）
python scripts/doubao_api.py submit "提示词" --size 2048x2048

# 图生图（--size 为必填参数）
python scripts/doubao_api.py submit "提示词" --image ./设计图.jpg --size 2048x2048

# 下载图片
python scripts/doubao_api.py download <url> <output_path>

# 等待并下载
python scripts/doubao_api.py wait '<json_result>' <output_path>
```

## 模型与参数

使用 `doubao-seedream-5.0-lite` 模型。

### 通用参数

| 参数 | 类型 | 默认值 | 说明 |
|-----|------|-------|------|
| --model | string | doubao-seedream-5.0-lite | 模型名称 |
| --size | string | — | **必填**。输出尺寸（宽x高），从任务需求中确定，不明确时向用户确认 |
| --no-watermark | flag | - | 禁用水印 |

### 图生图参数

| 参数 | 类型 | 说明 |
|-----|------|------|
| --image | string | 本地图片路径 |
| --image-url | string | 图片URL |

## 尺寸规格

> API 支持的预设尺寸，供确定 `--size` 时参考。具体使用哪个尺寸须从当前任务的需求中明确。

| 分辨率 | 宽高比 | 尺寸 |
|-------|-------|------|
| 2K | 1:1 | 2048x2048 |
| 2K | 4:3 | 2304x1728 |
| 2K | 16:9 | 2848x1600 |
| 3K | 1:1 | 3072x3072 |
| 3K | 16:9 | 4096x2304 |

## 输入图片要求（图生图）

| 要求 | 限制 |
|-----|------|
| 格式 | JPEG、PNG、webp、bmp、tiff、gif |
| 文件大小 | 最大 10MB |
| 宽高比 | [1/16, 16] |
| 最小边长 | > 14px |

## 错误处理

| 错误类型 | 处理方式 |
|---------|---------|
| 输入图片审核未通过 | 跳过该任务，记录原因 |
| 输入文本审核未通过 | 跳过该任务，记录原因 |
| 输出图片审核未通过 | 可重试1-2次 |
| QPS/并发超限 | 减少并发数，等待30秒后重试 |

## 输出文件命名

统一格式：`{type}_{YYYY-MM-DD}_{序号}.png`

| 类型 | type 前缀 |
|-----|----------|
| 场景图片 | scene |
| 角色设计图 | char / npc / enemy |
| 立绘表情 | expr |
| 动画帧 | anim |

## 配置

在项目根目录 `settings.json` 中配置：

```json
{
  "doubao_api_key": "your-api-key-here",
  "seedream_model": "doubao-seedream-5.0-lite"
}
```

## 参考文档

- **API完整参数**: [references/api-reference.md](references/api-reference.md)

## 调用方式

```
/image-gen-api
或由 /流程管理 next 自动调度
```
