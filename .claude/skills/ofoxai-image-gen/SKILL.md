---
name: ofoxai-image-gen
description: 调用 OfoxAI Images API 生成图片。支持文生图和图生图（含多图引用），兼容 gpt-image-2 / dall-e-3 / dall-e-2。触发条件：(1) 需要使用 OfoxAI 生成图片 (2) 用户指定使用 ofoxai 或 GPT Image / DALL-E 模型生成图片 (3) 精灵帧表生成（基于JSON提示词+Q版设计图生成角色动画帧表）(4) 作为 image-gen-api 之外的备选图片生成工具
---

# OfoxAI 图片生成

通过 Python + requests 调用 OfoxAI Images API。

脚本路径: `scripts/ofoxai_api.py`（相对于 skill 目录）
API Key 在项目根目录 `settings.json` → `ofox` 字段，脚本自动读取。

## 执行流程

### 阶段1：从 backlog 获取任务

读取 `99_流程管理/backlog.yaml`，找到 `skill: ofoxai-image-gen` 的条目（可能为 `精灵帧生成` 或 `图生图api`），获取：
- `inputs`: 输入文件列表
- `items`: 待办事项

若 backlog 中无本任务，说明当前无可执行任务，提示用户使用 `/流程管理` 初始化。

### 阶段2：执行图片生成

> **尺寸参数（强制）**：每次调用 `submit` 时必须通过 `--size` 显式传入图片尺寸。尺寸从当前任务的需求/上下文中确定。若无法从上下文中明确尺寸，**必须向用户确认**后再调用，禁止省略 `--size` 或使用默认值。

根据任务类型选择流程：

#### 精灵帧表生成（图生图）

基于 Q版设计图 + JSON 提示词，生成角色精灵帧动画表。每个动作需按方向拆分为独立任务。

1. 读取 `inputs` 中的精灵帧目录文件（如 `精灵帧目录.md`），获取动画列表
2. 筛选状态为"提示词"的动画，读取对应 JSON 文件
3. **方向拆分**（见下方规则），每个方向作为独立任务
4. 定位参考图：角色目录下的 Q版设计图（见参考图选择规则）
5. 为每个方向构建提示词（见提示词构建模板）
6. 提交图生图任务 → 下载保存到精灵帧文件夹
7. 更新 `精灵帧目录.md` 中该动画状态为"初稿"

**方向拆分规则：**

JSON 中 `direction` 和 `camera` 字段以 ` | `（空格管道空格）分隔两个方向值：

```json
"direction": "正面 | 背面"
"camera": "3/4 front left view | 3/4 back left view"
```

拆分为两个独立生成任务：

| 任务 | direction | camera |
|------|-----------|--------|
| 正面 | 正面 | 3/4 front left view |
| 背面 | 背面 | 3/4 back left view |

> **注意**：pose descriptions 中也可能出现 `|`（如 `双手|双臂微微抬起`），这是肢体描述的并列关系，不要拆分。方向分隔符特征是 **两侧有空格**（` | `），pose 中的 `|` 无空格。

**提示词构建模板：**

将拆分出来的方向填入 JSON ，每个方向使用对应的 camera 值，之后将提示词格式化为一串不带换行符的json string

**参考图选择：**

使用`精灵帧概览.md`中的参考图：

**输出命名：** `{角色id}_{动作类型}_{方向}_{YYYY-MM-DD}_{序号}.png`

| 动画名称 | 动作类型标识 |
|---------|------------|
| 待机 | idle |
| 移动 | move |
| 普通攻击 | attack |
| 终极技能 | ultimate |
| 技能1 | skill1 |
| 技能2 | skill2 |
| 翻滚闪避 | dodge |
| 受击 | hit |
| 死亡 | death |
| 加快技能CD | skill_cd |

示例：`char_002_move_front_2026-05-01_01.png`

#### 通用文生图

```bash
python scripts/ofoxai_api.py submit "提示词" --size 1024*1024 --quality low
# wait 保存结果
python scripts/ofoxai_api.py wait '<json_response>' ./output.png
```

#### 通用图生图

```bash
python scripts/ofoxai_api.py submit "编辑指令" --image ./ref.png --size 1024*1024
```

### 阶段3：写入 feedback 摘要

向 `99_流程管理/feedback.yaml` 追加：

```yaml
entries:
  - task_id: 精灵帧生成
    skill: ofoxai-image-gen
    executed_at: "<ISO时间>"
    processed:
      - "char_002_move_front"
      - "char_002_move_back"
    unprocessed:
      - []
    unable_to_process:
      - []
```

| 类型 | 含义 | 后续动作 |
|------|------|----------|
| processed | 已成功完成 | 节点标记 completed |
| unprocessed | 需要后续处理 | 保留在 backlog |
| unable_to_process | 无法处理，需人工介入 | 节点标记 blocked |

## 脚本用法

### submit — 提交生成任务

```bash
# 文生图
python scripts/ofoxai_api.py submit "提示词" --size 1024x1024 --quality low

# 图生图（单图）
python scripts/ofoxai_api.py submit "编辑指令" --image ./ref.png --size 1024x1024

# 多图引用
python scripts/ofoxai_api.py submit "合成指令" --image ./ref1.png --image ./ref2.png --size 1024x1024
```

| 参数 | 必填 | 说明 |
|------|:----:|------|
| prompt | Y | 图像描述文本 |
| `--model` | N | 默认 `openai/gpt-image-2` |
| `--size` | N | 默认 `1024x1024`，gpt-image-2 最大边 3840px，两边 16 的倍数 |
| `--quality` | N | 默认 `low`。gpt-image: `low`/`medium`/`high` |
| `--n` | N | 生成数量，默认 1 |
| `--image` | N | 参考图路径，可多次指定 |
| `--response-format` | N | `b64_json`（默认）或 `url` |

### wait — 保存结果

```bash
python scripts/ofoxai_api.py wait '<json_response>' ./output.png
python scripts/ofoxai_api.py wait ./result.json ./output.png
```

### download — 下载图片

```bash
python scripts/ofoxai_api.py download <url> ./output.png
```

## 错误处理

| HTTP 状态码 | 处理方式 |
|-------------|---------|
| 400 | 检查参数格式和尺寸约束 |
| 401 | 检查 API Key |
| 402 | 余额不足，充值后重试 |
| 429 | 等待后重试 |
| 500 | 重试 |

## 参考

- 完整 API 参数见 [references/api-reference.md](references/api-reference.md)
- 图片尺寸规格见项目 CLAUDE.md
