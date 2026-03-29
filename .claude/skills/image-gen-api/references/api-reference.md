# 火山引擎豆包图片生成 API 参考

## 接口概览

| 属性 | 值 |
|------|-----|
| 接口地址 | https://ark.cn-beijing.volces.com/api/v3/images/generations |
| 请求方式 | POST |
| Content-Type | application/json |
| 鉴权方式 | Bearer Token (API Key) |

## 鉴权说明

在请求头中添加 Authorization：

```
Authorization: Bearer <API_KEY>
```

获取 API Key：[火山引擎控制台](https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey)

## 请求参数

### 请求体

| 参数 | 类型 | 必选 | 说明 |
|-----|------|------|------|
| model | string | 是 | 模型 ID |
| prompt | string | 是 | 提示词，支持中英文，建议不超过300汉字或600英文单词 |
| image | string/array | 否 | 输入图片（URL或Base64），用于图生图 |
| size | string | 否 | 输出尺寸，默认 "2048x2048" |
| response_format | string | 否 | 返回格式：url（默认）或 b64_json |
| watermark | boolean | 否 | 是否添加水印，默认 true |

### 模型列表

| 模型 ID | 支持能力 |
|--------|---------|
| doubao-seedream-5.0-lite | 文生图、图生图、组图 |
| doubao-seedream-4.5 | 文生图、图生图、组图 |
| doubao-seedream-4.0 | 文生图、图生图、组图 |
| doubao-seedream-3.0-t2i | 仅文生图 |
| doubao-seededit-3.0-i2i | 仅图生图 |

### 5.0-lite 专属参数

| 参数 | 类型 | 默认值 | 说明 |
|-----|------|-------|------|
| output_format | string | jpeg | 输出格式：jpeg 或 png |
| stream | boolean | false | 是否流式输出 |
| sequential_image_generation | string | disabled | 组图模式：auto 或 disabled |
| tools | array | - | 工具配置，如联网搜索 |

### 3.0-t2i / seededit-3.0-i2i 专属参数

| 参数 | 类型 | 默认值 | 说明 |
|-----|------|-------|------|
| seed | integer | -1 | 随机种子，范围 [-1, 2147483647] |
| guidance_scale | float | 2.5/5.5 | 文本权重，范围 [1, 10] |

## 尺寸规格

### doubao-seedream-5.0-lite

**方式1：指定分辨率（prompt中描述宽高比）**
- 可选值：`2K`、`3K`

**方式2：指定像素值**
- 总像素范围：[3686400, 10404496]
- 宽高比范围：[1/16, 16]
- 默认：`2048x2048`

**推荐尺寸：**

| 分辨率 | 宽高比 | 尺寸 |
|-------|-------|------|
| 2K | 1:1 | 2048x2048 |
| 2K | 4:3 | 2304x1728 |
| 2K | 16:9 | 2848x1600 |
| 3K | 1:1 | 3072x3072 |
| 3K | 16:9 | 4096x2304 |

### doubao-seedream-4.5

**方式1：指定分辨率**
- 可选值：`2K`、`4K`

**方式2：指定像素值**
- 总像素范围：[3686400, 16777216]
- 宽高比范围：[1/16, 16]

### doubao-seedream-4.0

**方式1：指定分辨率**
- 可选值：`1K`、`2K`、`4K`

**方式2：指定像素值**
- 总像素范围：[921600, 16777216]
- 宽高比范围：[1/16, 16]

### doubao-seedream-3.0-t2i

- 单张像素范围：[512x512, 2048x2048]
- 默认：`1024x1024`

### doubao-seededit-3.0-i2i

- 仅支持 `adaptive`，自动选择与输入图最接近的预设尺寸

## 输入图片要求（图生图）

| 要求 | 限制 |
|-----|------|
| 格式 | JPEG、PNG（5.0-lite/4.5/4.0 还支持 webp、bmp、tiff、gif） |
| 文件大小 | 最大 10MB |
| 宽高比 | [1/16, 16]（5.0-lite/4.5/4.0）或 [1/3, 3]（其他模型） |
| 最小边长 | > 14px |
| 总像素 | ≤ 6000×6000 |
| 参考图数量 | 最多 14 张 |

## 响应参数

### 成功响应

```json
{
  "model": "doubao-seedream-5.0-lite",
  "created": 1710000000,
  "data": [
    {
      "url": "https://...",
      "size": "2048x2048"
    }
  ],
  "usage": {
    "generated_images": 1,
    "output_tokens": 16384,
    "total_tokens": 16384
  }
}
```

### 错误响应

```json
{
  "error": {
    "code": "invalid_api_key",
    "message": "Invalid API key"
  }
}
```

### data 字段说明

| 字段 | 类型 | 说明 |
|-----|------|------|
| url | string | 图片下载链接（24小时有效） |
| b64_json | string | Base64 编码的图片数据 |
| size | string | 图片尺寸，如 "2048x2048" |
| error | object | 单张图片生成失败时的错误信息 |

## 错误码

| 错误码 | 说明 | 处理方式 |
|-------|------|---------|
| invalid_api_key | API Key 无效 | 检查配置 |
| insufficient_quota | 余额不足 | 充值 |
| rate_limit_exceeded | 请求频率超限 | 等待后重试 |
| content_violation | 内容审核未通过 | 修改提示词 |
| invalid_image | 图片格式/大小不符合要求 | 检查输入图片 |
| model_not_found | 模型不存在 | 检查模型名称 |

## 请求示例

### 文生图

```bash
curl -X POST https://ark.cn-beijing.volces.com/api/v3/images/generations \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "doubao-seedream-5.0-lite",
    "prompt": "骑士团阵营城镇，室外场景，白天，晴朗",
    "size": "2048x2048",
    "response_format": "url",
    "watermark": false
  }'
```

### 图生图

```bash
curl -X POST https://ark.cn-beijing.volces.com/api/v3/images/generations \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "doubao-seedream-5.0-lite",
    "prompt": "背景换成演唱会现场",
    "image": "data:image/jpeg;base64,<base64_data>",
    "size": "2048x2048"
  }'
```

### 组图生成

```bash
curl -X POST https://ark.cn-beijing.volces.com/api/v3/images/generations \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "doubao-seedream-5.0-lite",
    "prompt": "角色四个不同角度的设计图",
    "size": "2048x2048",
    "sequential_image_generation": "auto",
    "sequential_image_generation_options": {
      "max_images": 4
    }
  }'
```

## 注意事项

1. **图片链接有效期**：返回的 URL 在 24 小时内有效，请及时下载
2. **并发限制**：API 并发限制为 1，请串行处理任务
3. **提示词长度**：建议不超过 300 汉字或 600 英文单词
4. **水印**：默认添加"AI生成"水印，可通过 `watermark: false` 禁用
