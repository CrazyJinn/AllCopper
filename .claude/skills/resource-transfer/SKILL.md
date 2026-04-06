---
name: resource-transfer
description: 将成品资源从开发目录搬运到 Cocos Creator 游戏项目目录。读取各总览文件中状态为'终稿'的资源，复制到游戏项目 assets 目录，并在 99_流程管理/资源搬运记录/ 中生成搬运记录。触发条件：(1) 需要将成品资源导入游戏项目 (2) 资源搬运/同步 (3) 更新游戏资源
user-invocable: true
allowed-tools: Read, Bash, Write, Edit
---

# 资源搬运

将开发目录中的成品资源（终稿状态）复制到游戏项目目录。

## 执行流程

### 阶段1：从 backlog 获取任务

读取 `99_流程管理/backlog.yaml`，找到 `task_id: 资源搬运` 的条目，获取：
- `inputs`: 输入文件列表
- `outputs`: 预期输出文件列表

若 backlog 中无本任务，说明当前无可执行任务，提示用户使用 `/流程管理` 初始化。

### 阶段2：执行资源搬运

#### 2.1 扫描阶段

1. 读取 `03_场景设计/场景设计总览.md`，筛选状态为"终稿"的场景
2. 读取 `02_角色设计/角色设计总览.md`，筛选状态为"终稿"的角色资源：
   - **角色级别资源**：设计图、立绘、动画
   - **立绘表情**：遍历"立绘表情状态"表格，检查每个表情的状态和文件名
   - **动画状态**：遍历"动画状态"表格，检查每个动作的状态和文件名
3. 扫描代码文件变更
4. 读取 `89_game/AllCooper/assets/.resource-manifest.json`（如存在），比对已有记录

**终稿筛选规则**：
- 状态列值为"终稿"的资源才搬运
- 立绘表情需要检查每个表情的状态
- 文件名用于定位源文件

#### 2.2 预览与确认

显示待搬运资源摘要，请用户选择搬运范围（全部/仅图片/仅代码/取消）。

#### 2.3 执行搬运

| 资源类型 | 处理方式 |
|---------|---------|
| 角色立绘 | ffmpeg透明背景处理，输出PNG |
| 角色设计图 | 直接复制 |
| 场景图片 | 直接复制 |
| 代码文件 | 直接复制（保持目录结构） |

**ffmpeg路径**：从项目根目录 `settings.json` 读取 `ffmpeg_path`。

ffmpeg命令模板：
```bash
${ffmpeg_path} -i "输入图片.jpg" -vf "colorkey=0xFFFFFF:0.1:0.0,scale=512:-1" -y "输出图片.png"
```

#### 2.4 更新记录

1. 更新 `.resource-manifest.json`（记录文件哈希用于增量检测）
2. 在 `99_流程管理/资源搬运记录/` 创建当日搬运记录

#### 目标目录结构

```
89_game/AllCooper/assets/
├── resources/portraits/        # 角色立绘（透明背景PNG）
├── textures/
│   ├── characters/players/     # 主角设计图
│   ├── characters/npcs/        # NPC设计图
│   ├── characters/enemies/     # 怪物设计图
│   └── scenes/maps|rooms|dialogs|ui/  # 场景图片
├── scripts/                    # TypeScript 代码
└── .resource-manifest.json     # 增量追踪清单
```

#### 表情文件名映射

| 中文表情 | 英文文件名 |
|---------|-----------|
| 平静 | calm |
| 微笑 | smile |
| 大笑 | laugh |
| 愤怒 | angry |
| 暴怒 | furious |
| 沮丧 | sad |
| 思索 | think |
| 冷漠 | cold |

### 阶段3：写入 feedback 摘要

执行完成后，向 `99_流程管理/feedback.yaml` 追加执行摘要：

```yaml
entries:
  - task_id: 资源搬运
    skill: resource-transfer
    executed_at: "<当前时间 ISO格式>"
    processed:              # 已成功完成
      - "搬运角色立绘 8 个"
      - "搬运场景图片 4 个"
    unprocessed:            # 需后续处理，留在 backlog
      - "npc_002立绘状态为初稿，跳过"
    unable_to_process:      # 无法处理，标记 blocked
      - []
```

**三类摘要说明**：

| 类型 | 含义 | 后续动作 |
|------|------|----------|
| processed | 已成功完成 | 节点标记 completed |
| unprocessed | 需要后续处理 | 保留在 backlog |
| unable_to_process | 无法处理，需人工介入 | 节点标记 blocked |

## 参考文档

- **增量追踪模板**: [references/manifest-template.json](references/manifest-template.json)

## 调用方式

```
/resource-transfer
或由 /流程管理 next 自动调度
```
