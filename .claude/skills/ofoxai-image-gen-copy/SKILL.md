---
name: ofoxai-image-gen-copy
description: 调用 OfoxAI Images Batch API 批量异步生成图片。50% 成本折扣，24h 内完成。支持文生图和图生图（base64 嵌入参考图）。触发条件：(1) 需要使用 OfoxAI 批量生成图片 (2) 用户指定使用 batch 模式 (3) 作为异步图片生成的备选工具
---

# OfoxAI 图片生成（Batch 模式）

通过 OfoxAI Batch API 批量异步生成图片。比直接调用节省 50% 成本，24h 内完成。

脚本路径: `scripts/ofoxai_api.py`（相对于 skill 目录）
API Key 在项目根目录 `settings.json` → `ofox` 字段，脚本自动读取。

## 工作流

1. 准备 `.jsonl` 输入文件（每行一个请求，custom_id 作为输出文件名）
2. `batch-submit` 上传并创建批量任务 → 返回 batch_id
3. `batch-status` 轮询状态（通常几分钟到几小时）
4. `batch-results` 下载并保存结果到指定目录

## 命令

### batch-submit — 提交批量任务

```bash
python scripts/ofoxai_api.py batch-submit ./batch_input.jsonl
```

自动从 .jsonl 首行检测 endpoint，上传文件并创建 batch。返回 batch_id。

### batch-status — 查询状态

```bash
python scripts/ofoxai_api.py batch-status <batch_id>
```

状态流转: `validating` → `in_progress` → `completed` / `failed` / `expired`

### batch-results — 下载结果

```bash
python scripts/ofoxai_api.py batch-results <batch_id> ./output_dir
```

批量完成后执行。每个请求的结果保存为 `{custom_id}.png`。未完成时返回当前状态。

### batch-cancel — 取消任务

```bash
python scripts/ofoxai_api.py batch-cancel <batch_id>
```

### batch-list — 列出任务

```bash
python scripts/ofoxai_api.py batch-list --limit 10
```

### upload-file — 上传参考图片

```bash
python scripts/ofoxai_api.py upload-file ./ref.png --purpose batch
# 返回 {"id": "file-abc123", ...}
```

用于图生图 batch 模式：先上传图片获取 file_id，再在 .jsonl 中引用。

## .jsonl 请求格式

每行一个 JSON 对象，custom_id 将作为输出文件名。同一文件内所有请求必须使用同一 endpoint。

### 文生图

```jsonl
{"custom_id": "scene_001", "method": "POST", "url": "/v1/images/generations", "body": {"model": "openai/gpt-image-2", "prompt": "描述文本", "n": 1, "size": "2048x2048", "response_format": "b64_json", "quality": "low"}}
{"custom_id": "scene_002", "method": "POST", "url": "/v1/images/generations", "body": {"model": "openai/gpt-image-2", "prompt": "另一段描述", "n": 1, "size": "2048x2048", "response_format": "b64_json", "quality": "low"}}
```

### 图生图

将参考图 base64 编码后直接嵌入 .jsonl 的 JSON body：

```bash
# 先将图片转为 base64（脚本自动处理）
python scripts/ofoxai_api.py encode-image ./ref.png
# 输出 base64 字符串，用于填入 .jsonl
```

```jsonl
{"custom_id": "char_expr_001", "method": "POST", "url": "/v1/images/edits", "body": {"model": "openai/gpt-image-2", "prompt": "编辑指令", "image": "data:image/png;base64,iVBOR...", "n": 1, "size": "2048x2048", "response_format": "b64_json"}}
```

注意：base64 编码会使单张图片增大约 33%，单批 .jsonl 文件上限 200MB，注意控制图片数量。

## body 参数

| 参数 | 必填 | 说明 |
|------|:----:|------|
| model | Y | 默认 `openai/gpt-image-2` |
| prompt | Y | 图像描述文本 |
| n | N | 生成数量，默认 1 |
| size | N | 默认 `1024x1024`，如 `2048x2048` |
| quality | N | 默认 `low`。gpt-image: `low`/`medium`/`high`；dall-e-3: `standard`/`hd` |
| response_format | N | `b64_json`（推荐）或 `url` |
| image | N | 图生图时的参考图 base64 data URI |

## 限制

- 每批最多 50,000 请求
- 输入文件最大 200 MB
- 24h 内完成（通常更快）
- 输出行顺序不保证与输入一致，通过 custom_id 匹配
- 输出文件 30 天后自动删除

**输出命名:** `{custom_id}.png`，custom_id 建议格式: `{type}_{YYYY-MM-DD}_{序号}`，type: `scene`/`char`/`npc`/`enemy`/`expr`/`anim`

## 参考

- Batch API 文档见项目根目录 `batch.md`
- 模型和参数见 [references/api-reference.md](references/api-reference.md)
- 图片尺寸规格见项目 CLAUDE.md
