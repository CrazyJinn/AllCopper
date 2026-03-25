---
name: 资源搬运
description: 将成品资源从开发目录搬运到 Cocos Creator 游戏项目目录。读取各总览文件中状态为'终稿'的资源，复制到游戏项目 assets 目录，并在 99_变更管理/资源搬运记录/ 中生成搬运记录。触发条件：(1) 需要将成品资源导入游戏项目 (2) 资源搬运/同步 (3) 更新游戏资源
allowed-tools: Read, Bash, Write, Edit
triggers:
  - 资源搬运
  - 导入资源
  - 同步资源
  - 搬运资源
---

# 资源搬运到 Cocos Creator

将开发目录中的成品资源（终稿状态）复制到 Cocos Creator 游戏项目目录。

## 输入

| 文件 | 必需 | 说明 |
|-----|-----|-----|
| 02_角色设计/角色设计总览.md | 是 | 角色状态追踪，筛选终稿 |
| 03_场景设计/场景设计总览.md | 是 | 场景状态追踪，筛选终稿 |
| 04_code/ | 是 | TypeScript 代码目录 |
| 89_game/AllCooper/assets/.resource-manifest.json | 否 | 增量追踪清单 |

## 输出

| 位置 | 说明 |
|-----|-----|
| 89_game/AllCooper/assets/textures/ | 图片资源 |
| 89_game/AllCooper/assets/scripts/ | TypeScript 代码 |
| 99_变更管理/资源搬运记录/ | 搬运记录 |
| 89_game/AllCooper/assets/.resource-manifest.json | 增量追踪清单 |

## 目标目录结构

```
89_game/AllCooper/assets/
├── textures/                    # 图片资源
│   ├── characters/              # 角色图片
│   │   ├── players/             # 主角
│   │   │   └── char_001_罗兰/
│   │   │       └── design.png
│   │   ├── npcs/                # NPC
│   │   │   └── npc_001_康拉德/
│   │   │           └── design.png
│   │   └── enemies/             # 怪物
│   │       └── enemy_001_辐射巨鼠/
│   │           └── design.png
│   └── scenes/                  # 场景图片
│       ├── maps/                # 大地图
│       │   └── map_001_骑士团城镇.png
│       ├── rooms/               # 副本房间
│       │   └── room_001_入口房.png
│       ├── dialogs/             # 对话背景
│       │   └── dialog_001_骑士团城镇.png
│       └── ui/                  # UI背景
│           └── ui_bg_001_主菜单.png
├── scripts/                     # TypeScript 脚本
│   ├── core/
│   ├── data/
│   ├── player/
│   ├── combat/
│   ├── ui/
│   ├── scene/
│   ├── ai/
│   ├── economy/
│   └── dialog/
└── .resource-manifest.json      # 增量追踪清单
```

## 工作流程

### 1. 扫描阶段

1. 读取 `03_场景设计/场景设计总览.md`，筛选状态为"终稿"的场景
2. 读取 `02_角色设计/角色设计总览.md`，筛选状态为"终稿"的角色
3. 扫描 `04_code/` 目录下所有 `.ts` 文件
4. 读取 `89_game/AllCooper/assets/.resource-manifest.json`（如存在），比对已有记录

### 2. 预览与确认

显示待搬运资源摘要：

```
=== 资源搬运预览 ===

[角色图片] 终稿 3 个
  - 主角: char_001_罗兰
  - NPC: npc_001_康拉德

[场景图片] 终稿 4 个
  - 大地图: 骑士团城镇, 秘术协会城镇
  - 对话背景: 骑士团城镇对话, 秘术协会对话

[代码文件] 5 个有变更
  - core/GameConfig.ts (修改)
  - combat/DamageCalculator.ts (新增)

请选择搬运范围：
1. 全部搬运
2. 仅图片资源
3. 仅代码文件
4. 取消
```

### 3. 执行搬运

根据用户选择执行：

```bash
# 创建目标目录
mkdir -p "89_game/AllCooper/assets/textures/characters/players/char_001_罗兰"

# 复制图片文件
cp "02_角色设计/主角/char_001_罗兰/jimeng-xxx.png" \
   "89_game/AllCooper/assets/textures/characters/players/char_001_罗兰/design.png"

# 复制代码文件（保持目录结构）
cp -r "04_code/core" "89_game/AllCooper/assets/scripts/"
```

### 4. 更新记录

1. 更新 `.resource-manifest.json`（记录文件哈希用于增量检测）
2. 在 `99_变更管理/资源搬运记录/` 创建当日搬运记录

## 成品识别规则

| 资源类型 | 状态来源 | 搬运条件 |
|---------|---------|---------|
| 角色图片 | 角色设计总览.md | 状态为"终稿" |
| 场景图片 | 场景设计总览.md | 状态为"终稿" |
| 代码文件 | 文件哈希比对 | 有变更（新增/修改） |

## 增量追踪

使用 `.resource-manifest.json` 记录已搬运资源：

```json
{
  "version": "1.0.0",
  "lastUpdate": "2026-03-22T10:30:00Z",
  "resources": {
    "textures/characters/players/char_001_罗兰/design.png": {
      "source": "02_角色设计/主角/char_001_罗兰/jimeng-xxx.png",
      "hash": "sha256:abc123...",
      "copiedAt": "2026-03-22T10:30:00Z"
    },
    "scripts/core/GameConfig.ts": {
      "source": "04_code/core/GameConfig.ts",
      "hash": "sha256:def456...",
      "copiedAt": "2026-03-22T10:30:00Z"
    }
  }
}
```

## 搬运记录格式

在 `99_变更管理/资源搬运记录/日期_搬运记录.md` 生成记录：

```markdown
# 资源搬运记录 - 2026-03-22

## 搬运统计
- 角色图片: 3 个
- 场景图片: 4 个
- 代码文件: 5 个（增量）
- 总计: 12 个文件

## 详细列表

### 角色图片（终稿）
| 角色 | 源路径 | 目标路径 |
|-----|-------|---------|
| 罗兰 | 02_角色设计/主角/char_001_罗兰/ | textures/characters/players/char_001_罗兰/ |

### 场景图片（终稿）
| 场景 | 源路径 | 目标路径 |
|-----|-------|---------|
| 骑士团城镇 | 03_场景设计/大地图/骑士团城镇/ | textures/scenes/maps/ |

### 代码文件（增量）
| 文件 | 变更类型 |
|-----|---------|
| core/GameConfig.ts | 修改 |

## 跳过的资源
- xxx - 状态为"初稿"，非终稿
```

## 调用方式

```
使用 资源搬运 skill
```

## 详细文档

增量追踪机制见 [references/manifest-template.json](references/manifest-template.json)
