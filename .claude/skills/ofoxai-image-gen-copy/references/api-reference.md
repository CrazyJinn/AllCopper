# OfoxAI Images API 参考

## 端点

### 文生图
```
POST https://api.ofox.ai/v1/images/generations
Content-Type: application/json
```

### 图生图（编辑）
```
POST https://api.ofox.ai/v1/images/edits
Content-Type: multipart/form-data
```

### 文件上传
```
POST https://api.ofox.ai/v1/files
Content-Type: multipart/form-data
```

### Batch API
```
POST   https://api.ofox.ai/v1/batches          创建批量任务
GET    https://api.ofox.ai/v1/batches/{id}      查询状态
POST   https://api.ofox.ai/v1/batches/{id}/cancel  取消任务
GET    https://api.ofox.ai/v1/batches?limit=N   列出任务
GET    https://api.ofox.ai/v1/files/{id}/content  下载文件
```

## 认证
Header: `Authorization: Bearer $OFOX_API_KEY`
API Key 存储位置: 项目根目录 `settings.json` → `ofox` 字段

## 文生图参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| model | string | Y | 模型名称 |
| prompt | string | Y | 图像描述文本 |
| n | number | N | 生成数量，默认 1 |
| size | string | N | 尺寸，如 `1024x1024`、`2048x2048` |
| quality | string | N | 见下方质量参数对照 |
| response_format | string | N | `b64_json`（默认）或 `url` |

## 图生图参数（multipart/form-data）

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| image / image[] | file | Y | 单图用 `image`，多图引用用 `image[]` |
| prompt | string | Y | 编辑指令 |
| model | string | Y | 模型名称 |
| n | number | N | 生成数量 |
| size | string | N | 输出尺寸 |
| mask | file | N | 蒙版图片（仅 gpt-image 模型，需含 alpha 通道） |

### 多图引用
使用 `image[]` 字段名上传多张参考图片：
```bash
curl ... \
  -F "image[]=@ref1.png" \
  -F "image[]=@ref2.png" \
  -F "image[]=@ref3.png" \
  -F 'prompt=生成包含所有参考图元素的礼物篮'
```

## 质量参数对照

不同模型系列使用不同的质量值：

| 模型系列 | 可选值 | 说明 |
|---------|--------|------|
| gpt-image-2 / gpt-image-1 | `low` / `medium` / `high` / `auto` | low 用于快速草稿，high 用于最终产出 |
| dall-e-3 | `standard` / `hd` | hd 质量更高但更慢 |
| dall-e-2 | — | 不支持 quality 参数 |

## 尺寸约束（gpt-image-2）

- 最大边长: 3840px
- 两边必须是 16 的倍数
- 长短边比例不超过 3:1
- 总像素: 655,360 ~ 8,294,400

## 响应格式

### b64_json（默认）
```json
{
  "created": 1703123456,
  "data": [
    {
      "b64_json": "..."
    }
  ]
}
```

### url
```json
{
  "created": 1703123456,
  "data": [
    {
      "url": "https://...",
      "revised_prompt": "..."
    }
  ]
}
```

## 常用模型

| 模型 ID | 文生图 | 图生图 | 质量 | 说明 |
|---------|:------:|:------:|------|------|
| openai/gpt-image-2 | Y | Y | low/medium/high | 最新模型，支持多图引用 |
| openai/gpt-image-1 | Y | Y | low/medium/high | 上一代 GPT Image |
| openai/dall-e-3 | Y | N | standard/hd | 高质量文生图 |
| openai/dall-e-2 | Y | Y | — | 支持编辑，仅单图 |

---

## Batch API

### 概述

Batch API 允许异步批量提交请求，享受 50% 成本折扣和更高的速率限制。

### 支持的端点

- `/v1/images/generations` — 文生图
- `/v1/images/edits` — 图生图

### 工作流

1. 准备 `.jsonl` 输入文件（每行一个请求）
2. 上传文件到 Files API
3. 创建 batch（指定 endpoint 和 completion_window）
4. 轮询状态直到 completed
5. 下载结果文件

### 输入文件格式（.jsonl）

每行一个 JSON 对象：

```jsonl
{"custom_id": "request-1", "method": "POST", "url": "/v1/images/generations", "body": {"model": "openai/gpt-image-2", "prompt": "描述文本", "n": 1, "size": "2048x2048", "response_format": "b64_json", "quality": "low"}}
```

| 字段 | 说明 |
|------|------|
| custom_id | 请求唯一标识，用于匹配输出结果，也作为输出文件名 |
| method | 固定 `POST` |
| url | 目标端点路径 |
| body | 与直接调用相同的请求参数 |

同一 .jsonl 文件中所有请求必须使用同一 endpoint。

### 图生图 Batch

Batch 不支持 multipart，需将参考图 base64 编码后嵌入 JSON body：

```bash
# 将图片转为 base64 data URI
python scripts/ofoxai_api.py encode-image ./ref.png
# 输出: data:image/png;base64,iVBOR...
```

```jsonl
{"custom_id": "edit-1", "method": "POST", "url": "/v1/images/edits", "body": {"model": "openai/gpt-image-2", "prompt": "编辑指令", "image": "data:image/png;base64,iVBOR...", "n": 1, "size": "2048x2048", "response_format": "b64_json"}}
```

注意：base64 编码使图片增大约 33%，注意控制每批图片数量以不超过 200MB 文件上限。

### 创建 Batch

```bash
curl https://api.ofox.ai/v1/batches \
  -H "Authorization: Bearer $OFOX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input_file_id": "file-abc123",
    "endpoint": "/v1/images/generations",
    "completion_window": "24h"
  }'
```

返回 Batch 对象：

```json
{
  "id": "batch_abc123",
  "object": "batch",
  "endpoint": "/v1/images/generations",
  "status": "validating",
  "input_file_id": "file-abc123",
  "output_file_id": null,
  "error_file_id": null,
  "completion_window": "24h",
  "request_counts": {"total": 0, "completed": 0, "failed": 0}
}
```

### 状态流转

| 状态 | 说明 |
|------|------|
| `validating` | 输入文件验证中 |
| `failed` | 输入文件验证失败 |
| `in_progress` | 批量执行中 |
| `finalizing` | 执行完成，准备结果 |
| `completed` | 结果就绪 |
| `expired` | 24h 内未完成 |
| `cancelling` | 正在取消 |
| `cancelled` | 已取消 |

### 输出格式

输出文件为 .jsonl，每行对应一个请求的结果。**行顺序不保证与输入一致**，通过 `custom_id` 匹配。

```jsonl
{"id": "batch_req_123", "custom_id": "request-1", "response": {"status_code": 200, "body": {"data": [{"b64_json": "..."}]}}, "error": null}
```

失败请求：

```jsonl
{"id": "batch_req_456", "custom_id": "request-2", "response": null, "error": {"code": "batch_expired", "message": "..."}}
```

### 限制

| 项目 | 值 |
|------|------|
| 每批最大请求数 | 50,000 |
| 输入文件大小 | 200 MB |
| 完成时间 | 24h 内 |
| 每小时创建批次上限 | 2,000 |
| 输出文件保留 | 30 天 |

---

## 错误处理

| HTTP 状态码 | 含义 | 处理方式 |
|-------------|------|---------|
| 400 | 请求参数错误 | 检查参数格式和尺寸约束 |
| 401 | 认证失败 | 检查 API Key |
| 402 | 余额不足 | 充值后重试 |
| 429 | 请求频率超限 | 等待后重试 |
| 500 | 服务端错误 | 重试 |
