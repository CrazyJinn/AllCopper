---
name: image-gen-api
description: 调用火山引擎豆包API生成图片。支持文生图和图生图两种模式，统一接口调用。触发条件：(1) 需要生成场景图片 (2) 需要生成角色立绘表情 (3) 基于设计图生成衍生图 (4) 批量图片生成任务
allowed-tools: Read, Bash, Write, Edit
---

# 图片生成

调用火山引擎豆包 API 生成图片，支持文生图和图生图两种模式。

## 工作流程

> **并发控制**：API 支持最多 5 个并发请求，建议控制在 2-3 个以确保稳定性。对于大批量任务，可使用并发处理提高效率。

### 场景图片生成（文生图）

1. 读取 `03_场景设计/场景设计总览.md`，筛选状态为"提示词"的场景
2. **并发处理**待生成场景（建议 2-3 个并发）：
   - 进入场景文件夹，读取 `提示词.md` 提取提示词
   - 根据场景类型选择图片尺寸
   - 执行 `python scripts/doubao_api.py submit "<提示词>" --size WxH` 提交任务
   - 从返回结果中获取图片 URL
   - 执行 `python scripts/doubao_api.py download <url> <output_path>` 下载图片
   - 下载成功后更新状态为"初稿"
3. 继续处理下一批场景

### 角色立绘表情生成（图生图）

1. 读取 `02_角色设计/角色设计总览.md`
2. 找到所有角色的"**立绘表情状态**"表格
3. 筛选状态为"提示词"的表情
4. **并发处理**待生成表情（建议 2-3 个并发）：
   - 进入角色文件夹，读取 `立绘表情提示词.md`
   - 提取对应表情的提示词
   - 找到该角色的设计图终稿作为输入图片
   - 执行 `python scripts/doubao_api.py submit "<提示词>" --image <设计图路径>` 提交任务
   - 从返回结果中获取图片 URL
   - 执行 `python scripts/doubao_api.py download <url> <output_path>` 下载图片
   - 下载成功后更新状态为"初稿"
5. 继续处理下一批表情

### 多参考图生成（融合风格）

1. 收集多张参考图片（最多 14 张）
2. 使用 `--image` 参数传入多张图片：
   ```bash
   python scripts/doubao_api.py submit "<提示词>" --image <图片1> --image <图片2> --image <图片3>
   ```
3. API 会融合多张参考图的风格生成新图片
4. 下载生成的图片

## 脚本用法

> 脚本位于技能目录的 `scripts/doubao_api.py`

```bash
# 文生图 - 提交生成任务
python scripts/doubao_api.py submit "提示词" --size 2048x2048
# 输出: {"data": [{"url": "https://..."}], "usage": {...}}

# 图生图 - 提交编辑任务
python scripts/doubao_api.py submit "提示词" --image ./设计图.jpg
# 可选参数：--size 1328x1328 --model doubao-seededit-3.0-i2i
# 输出: {"data": [{"url": "https://..."}], "usage": {...}}

# 多参考图生成 - 融合多张图片风格（最多14张）
python scripts/doubao_api.py submit "提示词" --image ./图1.jpg --image ./图2.jpg --image ./图3.jpg
# 或使用通配符
python scripts/doubao_api.py submit "提示词" --image-dir ./参考图/

# 下载图片
python scripts/doubao_api.py download <url> <output_path>

# 等待并下载（从JSON结果中提取URL并下载）
python scripts/doubao_api.py wait '<json_result>' <output_path>
# 示例: python scripts/doubao_api.py wait '{"data":[{"url":"..."}]}' ./output.jpg
```

## 模型与参数

使用 `doubao-seedream-5.0-lite` 模型。

### 通用参数

| 参数 | 类型 | 默认值 | 说明 |
|-----|------|-------|------|
| --model | string | doubao-seedream-5.0-lite | 模型名称 |
| --size | string | 2048x2048 | 输出尺寸（宽x高） |
| --response-format | string | url | 返回格式：url 或 b64_json |
| --output-format | string | png | 输出格式：jpeg 或 png |
| --no-watermark | flag | - | 禁用水印 |

### 图生图参数

| 参数 | 类型 | 默认值 | 说明 |
|-----|------|-------|------|
| --image | string | - | 本地图片路径（与--image-url二选一） |
| --image-url | string | - | 图片URL（与--image二选一） |

## 尺寸规格

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
| 总像素 | ≤ 6000×6000 |

## 任务状态说明

新版 API 是**同步返回**的，无需轮询查询。

| 状态 | 说明 | 处理方式 |
|-----|------|---------|
| 成功 | data 数组包含图片 URL | 下载图片，更新状态 |
| 失败 | error 字段包含错误信息 | 记录错误，跳过 |

## 错误处理

| 错误类型 | 处理方式 |
|---------|---------|
| 输入图片审核未通过 | 跳过该任务，记录原因 |
| 输入文本审核未通过 | 跳过该任务，记录原因 |
| 输出图片审核未通过 | 可重试1-2次 |
| QPS/并发超限 | 减少并发数，等待30秒后重试 |

## 输出目录与文件命名规范

### 命名格式

所有生成图片统一使用格式：`{type}_{YYYY-MM-DD}_{序号}.png`

| 类型 | type 前缀 |
|-----|----------|
| 场景图片 | scene |
| 角色设计图 | char |
| NPC设计图 | npc |
| 怪物设计图 | enemy |
| 立绘表情 | expr |
| 动画帧 | anim |

### 输出目录结构

```
02_角色设计/
├── 主角/
│   └── char_001_罗兰/
│       ├── 设计图/
│       │   ├── char_2026-03-29_001.png
│       │   └── char_2026-03-29_002.png
│       ├── 立绘/
│       │   └── expr_2026-03-29_001_愤怒.png
│       └── 动画/
│           └── anim_2026-03-29_001_攻击_01.png
├── NPC/
│   └── npc_001_康拉德/
│       └── 设计图/
│           └── npc_2026-03-29_001.png
└── 怪物/
    └── enemy_001_辐射巨鼠/
        └── 设计图/
            └── enemy_2026-03-29_001.png

03_场景设计/
├── 室内/
│   └── scene_001_废弃实验室/
│       └── scene_2026-03-29_001.png
└── 室外/
    └── scene_002_城市废墟/
        └── scene_2026-03-29_001.png
```

### 文件命名规则

1. **日期格式**：使用 `YYYY-MM-DD`（如 2026-03-29）
2. **序号**：三位数字，从 001 开始（如 001, 002, 003）
3. **后缀**：可选，用于区分同一批次的不同内容（如表情名、动作名）
4. **示例**：
   - `char_2026-03-29_001.png` - 角色设计图
   - `expr_2026-03-29_001_愤怒.png` - 立绘表情
   - `anim_2026-03-29_001_攻击_01.png` - 动画帧（帧号两位数）
   - `scene_2026-03-29_001.png` - 场景图片

## 配置说明

在项目根目录 `settings.json` 中配置：

```json
{
  "doubao_api_key": "your-api-key-here",
  "doubao_model": "doubao-seedream-5.0-lite"
}
```

获取 API Key：[火山引擎控制台](https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey)

## 详细文档

API完整参数和错误码见 [references/api-reference.md](references/api-reference.md)
