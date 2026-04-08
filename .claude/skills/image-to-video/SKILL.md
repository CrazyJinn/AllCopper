---
name: image-to-video
description: 调用火山引擎 Seedance API 生成视频。支持图生视频（首帧/首尾帧）、文生视频、多模态参考生视频。异步任务模式：提交→轮询→下载。触发条件：(1) 基于设计图/场景图生成动画视频 (2) 角色动画视频生成 (3) 场景过场动画 (4) 连续视频拼接（尾帧接力）
allowed-tools: Read, Bash, Write, Edit
---

# 图生视频

调用火山引擎 Seedance API，基于图片/文本生成视频。异步模式：提交任务 → 轮询状态 → 下载视频。

## 执行流程

### 阶段1：从 backlog 获取任务

读取 `99_流程管理/backlog.yaml`，找到 `skill: image-to-video` 的条目，获取 `inputs` 和 `items`。

若 backlog 中无本任务，提示用户使用 `/流程管理` 初始化。

### 阶段2：执行视频生成

根据任务类型选择模式：

#### 图生视频 - 首帧模式（最常用）

基于一张图片生成视频动画。适合角色动画、场景动态效果。

1. 定位输入图片（角色设计图终稿/场景图终稿）
2. 准备提示词（描述期望的运动/动画效果）
3. 提交任务：
   ```bash
   python scripts/seedance_api.py submit \
     --first-frame <图片路径> \
     --prompt "提示词" \
     --ratio 16:9 --duration 5 --resolution 720p
   ```
4. 从返回 JSON 中获取 `id`（task_id）
5. 等待并下载：
   ```bash
   python scripts/seedance_api.py wait <task_id> <输出路径> \
     --interval 15 --max-wait 1800
   ```
6. 下载成功后更新状态为"初稿"

#### 图生视频 - 首尾帧模式

指定起始帧和结束帧，生成过渡动画。适合精确控制动画起止状态。

```bash
python scripts/seedance_api.py submit \
  --first-frame <首帧图片> \
  --last-frame <尾帧图片> \
  --prompt "提示词（可选）" \
  --ratio 16:9 --duration 5
```

#### 连续视频生成（尾帧接力）

利用 `--return-last-frame` 获取上一段视频的尾帧，作为下一段的首帧，实现无缝拼接。

```bash
# 第1段：提交并获取尾帧
python scripts/seedance_api.py submit --first-frame <图1> --prompt "..." --return-last-frame
python scripts/seedance_api.py wait <task_id> output_1.mp4 --with-last-frame

# 第2段：用上段尾帧作为首帧
python scripts/seedance_api.py submit --first-frame output_1.last_frame.png --prompt "..." --return-last-frame
python scripts/seedance_api.py wait <task_id> output_2.mp4 --with-last-frame
```

#### 文生视频

无输入图片，纯文本描述生成视频。

```bash
python scripts/seedance_api.py submit --prompt "提示词" --text-only --ratio 16:9
```

### 阶段3：写入 feedback 摘要

向 `99_流程管理/feedback.yaml` 追加：

```yaml
entries:
  - task_id: 图生视频
    skill: image-to-video
    executed_at: "<ISO时间>"
    processed:
      - "char_001_idle动画 5s"
    unprocessed:
      - []
    unable_to_process:
      - []
```

## 脚本用法

> 脚本位于 `scripts/seedance_api.py`

```bash
# 提交任务
python scripts/seedance_api.py submit --first-frame ./img.png --prompt "角色缓慢行走"

# 查询状态
python scripts/seedance_api.py query <task_id>

# 下载视频
python scripts/seedance_api.py download <video_url> <output.mp4>

# 等待并下载（推荐）
python scripts/seedance_api.py wait <task_id> <output.mp4>
```

## 模型与参数

使用 `doubao-seedance-2-0-260128` 模型（可在 settings.json 中通过 `seedance_model` 配置）。

### 通用参数

| 参数 | CLI 参数 | 类型 | 默认值 | 说明 |
|-----|---------|------|-------|------|
| model | --model | string | doubao-seedance-2-0-260128 | 模型ID |
| resolution | --resolution | string | 720p | 480p/720p/1080p |
| ratio | --ratio | string | adaptive | 16:9/4:3/1:1/3:4/9:16/21:9/adaptive |
| duration | --duration | int | 5 | 视频时长秒数，2.0: [4,15] |
| seed | --seed | int | -1 | 随机种子 |
| camera_fixed | --camera-fixed | flag | false | 固定摄像头 |
| watermark | --watermark | flag | false | 含水印 |
| generate_audio | --audio | flag | false | 生成同步音频 |
| return_last_frame | --return-last-frame | flag | false | 返回尾帧图片 |

### 图片输入参数

| 参数 | CLI 参数 | 说明 |
|-----|---------|------|
| 首帧 | --first-frame | 本地图片路径 |
| 首帧URL | --first-frame-url | 图片URL |
| 尾帧 | --last-frame | 本地图片路径 |
| 尾帧URL | --last-frame-url | 图片URL |
| 参考图 | --ref-image | 参考图片路径（可多次指定） |
| 参考视频 | --ref-video | 参考视频URL |
| 参考音频 | --ref-audio | 参考音频URL |

## 输入图片要求

| 要求 | 限制 |
|-----|------|
| 格式 | jpeg, png, webp, bmp, tiff, gif |
| 宽高比 | (0.4, 2.5) |
| 宽高 | (300, 6000) px |
| 大小 | 单张 < 30MB，请求体 < 64MB |

## 错误处理

| 错误类型 | 处理方式 |
|---------|---------|
| 图片审核未通过 | 跳过，记录原因 |
| 任务超时 (expired) | 重试1次，减少duration |
| 任务失败 (failed) | 检查错误信息，调整参数重试 |
| 轮询超时 | 建议用 query 命令手动检查 |
| QPS/并发超限 | 等待60秒后重试 |

## 输出文件命名

格式：`{type}_{YYYY-MM-DD}_{序号}.mp4`

| 类型 | type 前缀 |
|-----|----------|
| 角色动画 | char / npc / enemy |
| 场景过场 | scene |
| 过场动画 | cutscene |

## 配置

在项目根目录 `settings.json` 中配置（与图片生成共用）：

```json
{
  "doubao_api_key": "your-api-key-here",
  "seedance_model": "doubao-seedance-2-0-260128"
}
```

## 参考文档

- **API完整参数**: [references/api-reference.md](references/api-reference.md)

## 调用方式

```
/image-to-video
或由 /流程管理 next 自动调度
```
