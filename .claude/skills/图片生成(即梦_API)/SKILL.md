---
name: 图片生成(即梦_API)
description: 调用火山引擎即梦API生成场景图片。读取场景设计总览中状态为'提示词'的场景，逐个串行处理：提交生成→查询状态→下载图片→更新状态。触发条件：(1) 需要生成场景图片 (2) 批量图片生成任务 (3) 将提示词转化为图片
allowed-tools: Read, Bash, Write, Edit
---

# 场景图片生成

读取场景提示词，调用火山引擎即梦API生成图片并下载。

## 工作流程

> **重要**：API并发限制为1，必须串行处理每个场景。

1. 读取 `03_场景设计/场景设计总览.md`，筛选状态为"提示词"的场景
2. 对每个待生成场景**串行处理**：
   - 进入场景文件夹，读取 `提示词.md` 提取提示词
   - 根据场景类型选择图片尺寸
   - 执行 `python scripts/jimeng_api.py submit "<提示词>" --width W --height H` 提交任务
   - 获取返回的 task_id
   - 执行 `python scripts/jimeng_api.py wait <task_id> <output_path>` 等待完成并下载
   - 下载成功后更新 `场景设计总览.md` 中对应场景状态为"初稿"
3. 继续处理下一个场景

## 图片尺寸

> 从 `03_场景设计/场景设计总览.md` 的"美术规格"部分读取对应场景类型的尺寸。

## 脚本用法

> 脚本位于技能目录的 `scripts/jimeng_api.py`

```bash
# 提交生成任务（返回task_id）
python scripts/jimeng_api.py submit "提示词" --width 2048 --height 2048
# 输出: {"task_id": "xxx"}

# 查询任务状态
python scripts/jimeng_api.py query <task_id>

# 下载图片
python scripts/jimeng_api.py download <url> <output_path>

# 等待任务完成并自动下载（推荐）
python scripts/jimeng_api.py wait <task_id> <output_path> [--interval 10] [--max-wait 300]
```

## 任务状态说明

| API状态 | 说明 | 处理方式 |
|--------|------|---------|
| running | 生成中 | 继续轮询等待 |
| done | 已完成 | 下载图片，更新状态为初稿 |
| not_found | 任务不存在 | 记录错误，跳过该场景 |
| expired | 任务已过期 | 记录错误，需重新提交生成 |

## 错误处理

| 错误码 | 处理方式 |
|-------|---------|
| 50411/50412/50413 | 跳过该场景，记录原因 |
| 50511/50519 | 可重试1-2次 |
| 50429/50430 | 等待30秒后重试 |

## 文件保存

下载的图片保存到场景文件夹：`03_场景设计/[分类]/[场景名]/初稿_1.jpeg`

## 详细文档

API完整参数和错误码见 [references/api-reference.md](references/api-reference.md)
