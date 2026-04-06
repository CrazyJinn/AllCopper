# Seedance 视频生成 API 参考

## 接口概览

| 属性 | 值 |
|------|-----|
| 创建任务 | POST https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks |
| 查询任务 | GET https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/{task_id} |
| 请求方式 | POST / GET |
| Content-Type | application/json |
| 鉴权方式 | Bearer Token (API Key) |
| 调用模式 | 异步（提交→轮询→下载） |

## 鉴权

```
Authorization: Bearer <API_KEY>
```

与图片生成共用 `doubao_api_key`。

## 模型列表

| 模型 ID | 能力 | 音频 |
|--------|------|------|
| doubao-seedance-2-0-260128 | 多模态参考/首尾帧/首帧/文生 | 有声/无声 |
| doubao-seedance-2-0-fast-260128 | 同上 | 有声/无声 |
| doubao-seedance-1-5-pro-251215 | 首尾帧/首帧/文生 | 有声/无声 |
| doubao-seedance-1-0-pro-250428 | 首尾帧/首帧/文生 | 无声 |
| doubao-seedance-1-0-pro-fast-250428 | 首帧/文生 | 无声 |
| doubao-seedance-1-0-lite-t2v-250428 | 文生 | 无声 |
| doubao-seedance-1-0-lite-i2v-250428 | 参考图/首尾帧/首帧 | 无声 |

## 请求参数

### content 数组

| 字段 | 类型 | 必选 | 说明 |
|-----|------|------|------|
| type | string | 是 | `text` / `image_url` / `video_url` / `audio_url` |
| text | string | 条件 | 文本提示词（type=text时），中文≤500字，英文≤1000词 |
| image_url.url | string | 条件 | 图片URL/Base64/素材ID |
| image_url.role | string | 条件 | `first_frame` / `last_frame` / `reference_image` |
| video_url.url | string | 条件 | 视频URL/素材ID（仅2.0） |
| video_url.role | string | 条件 | `reference_video` |
| audio_url.url | string | 条件 | 音频URL/Base64/素材ID（仅2.0） |
| audio_url.role | string | 条件 | `reference_audio` |

### 视频参数

| 参数 | 类型 | 默认值 | 说明 |
|-----|------|-------|------|
| resolution | string | 720p | 480p / 720p / 1080p |
| ratio | string | adaptive | 16:9 / 4:3 / 1:1 / 3:4 / 9:16 / 21:9 / adaptive |
| duration | integer | 5 | 视频时长（秒）。2.0: [4,15]，1.0: [2,12]，-1=智能 |
| seed | integer | -1 | 随机种子，[-1, 2^32-1] |
| camera_fixed | boolean | false | 固定摄像头 |
| watermark | boolean | false | 含水印 |
| generate_audio | boolean | false | 生成同步音频（仅2.0/1.5 pro） |
| return_last_frame | boolean | false | 返回尾帧图片（用于连续生成） |

### 分辨率与像素值

| 分辨率 | 宽高比 | Seedance 1.0 像素 | Seedance 1.5/2.0 像素 |
|-------|--------|------------------|---------------------|
| 480p | 16:9 | 864×480 | 864×496 |
| 480p | 4:3 | 736×544 | 752×560 |
| 480p | 1:1 | 640×640 | 640×640 |
| 480p | 3:4 | 544×736 | 560×752 |
| 480p | 9:16 | 480×864 | 496×864 |
| 720p | 16:9 | 1248×704 | 1280×720 |
| 720p | 4:3 | 1120×832 | 1112×834 |
| 720p | 1:1 | 960×960 | 960×960 |
| 720p | 3:4 | 832×1120 | 834×1112 |
| 720p | 9:16 | 704×1248 | 720×1280 |
| 1080p | 16:9 | 1920×1088 | 1920×1080 |

## 输入要求

### 图片

| 要求 | 限制 |
|-----|------|
| 格式 | jpeg, png, webp, bmp, tiff, gif |
| 宽高比 | (0.4, 2.5) |
| 宽高 | (300, 6000) px |
| 大小 | 单张 < 30MB，请求体 < 64MB |
| 数量 | 首帧1张，首尾帧2张，参考图1-9张（2.0）或1-4张（1.0 lite） |

### 视频（仅2.0参考视频）

| 要求 | 限制 |
|-----|------|
| 格式 | mp4, mov |
| 分辨率 | 480p, 720p |
| 时长 | 单个 [2,15]s，最多3个，总时长≤15s |
| 大小 | 单个 < 50MB |
| 帧率 | [24, 60] fps |

### 音频（仅2.0参考音频）

| 要求 | 限制 |
|-----|------|
| 格式 | wav, mp3 |
| 时长 | 单个 [2,15]s，最多3段，总时长≤15s |
| 大小 | 单个 < 15MB |

## 响应

### 创建任务

```json
{
  "id": "task_id_string",
  "model": "doubao-seedance-2-0-260128",
  "status": "queued",
  "created_at": 1710000000
}
```

### 查询任务

```json
{
  "id": "task_id",
  "model": "doubao-seedance-2-0-260128",
  "status": "succeeded",
  "error": null,
  "created_at": 1710000000,
  "updated_at": 1710000060,
  "content": {
    "video_url": "https://...mp4",
    "last_frame_url": "https://...png"
  },
  "seed": 12345,
  "resolution": "720p",
  "ratio": "16:9",
  "duration": 5,
  "framespersecond": 24,
  "generate_audio": false,
  "service_tier": "default",
  "usage": {
    "completion_tokens": 100,
    "total_tokens": 100
  }
}
```

> **注意**：`content.video_url` 和 `content.last_frame_url` 都是**字符串**（直接是URL），不是对象。视频URL有效期24小时。

### 任务状态

| 状态 | 含义 |
|-----|------|
| queued | 排队中 |
| running | 生成中 |
| succeeded | 成功 |
| failed | 失败 |
| expired | 超时（默认48h） |

## 请求示例

### 图生视频 - 首帧

```bash
curl -X POST https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "doubao-seedance-2-0-260128",
    "content": [
      {"type": "text", "text": "角色缓缓走向远方"},
      {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}, "role": "first_frame"}
    ],
    "resolution": "720p",
    "ratio": "16:9",
    "duration": 5,
    "watermark": false
  }'
```

### 图生视频 - 首尾帧

```bash
curl -X POST https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "doubao-seedance-2-0-260128",
    "content": [
      {"type": "text", "text": "角色转身"},
      {"type": "image_url", "image_url": {"url": "..."}, "role": "first_frame"},
      {"type": "image_url", "image_url": {"url": "..."}, "role": "last_frame"}
    ],
    "resolution": "720p",
    "ratio": "16:9",
    "duration": 5
  }'
```

### 查询任务

```bash
curl https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/TASK_ID \
  -H "Authorization: Bearer $API_KEY"
```
