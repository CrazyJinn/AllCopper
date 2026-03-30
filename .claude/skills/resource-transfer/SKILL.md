---
name: resource-transfer
description: 将成品资源从开发目录搬运到 Cocos Creator 游戏项目目录。读取各总览文件中状态为'终稿'的资源，复制到游戏项目 assets 目录，并在 99_变更管理/资源搬运记录/ 中生成搬运记录。触发条件：(1) 需要将成品资源导入游戏项目 (2) 资源搬运/同步 (3) 更新游戏资源
user-invocable: true
allowed-tools: Read, Bash, Write, Edit
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
| 89_game/AllCooper/assets/resources/portraits/ | 角色立绘（透明背景PNG） |
| 89_game/AllCooper/assets/textures/ | 其他图片资源 |
| 89_game/AllCooper/assets/scripts/ | TypeScript 代码 |
| 99_变更管理/资源搬运记录/ | 搬运记录 |
| 89_game/AllCooper/assets/.resource-manifest.json | 增量追踪清单 |

## 目标目录结构

```
89_game/AllCooper/assets/
├── resources/                   # 动态加载资源
│   └── portraits/               # 角色立绘（透明背景PNG）
│       ├── char_001/            # 角色ID
│       │   ├── calm.png         # 平静
│       │   ├── smile.png        # 微笑
│       │   └── angry.png        # 愤怒
│       ├── char_002/
│       │   └── ...
│       └── npc_001/
│           └── ...
├── textures/                    # 静态图片资源
│   ├── characters/              # 角色设计图
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
2. 读取 `02_角色设计/角色设计总览.md`，筛选状态为"终稿"的角色资源：
   - **角色级别资源**：设计图、立绘、动画（检查资源类型表格中的状态列）
   - **立绘表情**：遍历"立绘表情状态"表格，检查每个表情的状态和文件名
   - **动画状态**：遍历"动画状态"表格，检查每个动作的状态和文件名
3. 扫描 `04_code/` 目录下所有 `.ts` 文件
4. 读取 `89_game/AllCooper/assets/.resource-manifest.json`（如存在），比对已有记录

**角色设计总览.md 结构解析：**
```markdown
#### char_002 薇
| 资源类型 | 状态 | 文件夹 |
|---------|------|--------|
| 立绘 | 初稿 | [立绘提示词.md](./主角/char_002_薇/立绘提示词.md) |  ← 角色级别

**立绘表情状态：**
| 表情 | 状态 | 文件名 |
|-----|------|--------|
| 平静 | 终稿 | expr_2026-03-29_001_平静.jpeg |  ← 终稿，需搬运
| 微笑 | 初稿 | expr_2026-03-29_002_微笑.jpeg |  ← 非终稿，跳过
```

**终稿筛选规则：**
- 状态列值为"终稿"的资源才搬运
- 立绘表情需要检查每个表情的状态
- 文件名用于定位源文件

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

# 角色立绘：使用ffmpeg处理透明背景（见下方立绘处理步骤）
# 场景图片：直接复制
cp "03_场景设计/大地图/骑士团城镇/xxx.png" \
   "89_game/AllCooper/assets/textures/scenes/maps/map_001_骑士团城镇.png"

# 复制代码文件（保持目录结构）
cp -r "04_code/core" "89_game/AllCooper/assets/scripts/"
```

### 3.1 角色立绘处理（透明背景）

角色立绘必须使用 ffmpeg 将纯色背景转换为透明背景，输出格式为 PNG。

**ffmpeg路径配置：**
从项目根目录 `settings.json` 中读取 `ffmpeg_path` 配置获取ffmpeg可执行文件路径。

```json
// settings.json 配置示例
{
  "ffmpeg_path": "C:/ffmpeg/bin/ffmpeg.exe"
}
```

**ffmpeg命令模板：**
```bash
# 基础命令：将白色背景变为透明，并缩放到宽度512像素
${ffmpeg_path} -i "输入图片.jpg" -vf "colorkey=0xFFFFFF:0.1:0.0,scale=512:-1" -y "输出图片.png"

# 常用背景色参数：
# 白色背景: colorkey=0xFFFFFF:0.1:0.0
# 浅灰背景: colorkey=0xF5F5F5:0.15:0.0
# 绿幕背景: colorkey=0x00FF00:0.1:0.0
# 蓝幕背景: colorkey=0x0000FF:0.1:0.0
```

**参数说明：**
- `colorkey=颜色:相似度阈值:亮度混合`
  - 颜色：16进制RGB值，如 `0xFFFFFF`（白色）
  - 相似度阈值：0.0-1.0，越大匹配范围越宽（推荐0.1-0.2）
  - 亮度混合：0.0表示完全透明，1.0表示不透明

**完整处理流程：**
```bash
# 1. 读取settings.json获取ffmpeg路径
ffmpeg_path=$(读取 settings.json 中 ffmpeg_path)

# 2. 创建目标目录
mkdir -p "89_game/AllCooper/assets/resources/portraits/char_001"

# 3. 转换立绘为透明背景PNG，缩放到宽度512像素
${ffmpeg_path} -i "02_角色设计/主角/char_001_罗兰/立绘表情/expr_001_平静.jpeg" \
       -vf "colorkey=0xFFFFFF:0.1:0.0,scale=512:-1" \
       -y "89_game/AllCooper/assets/resources/portraits/char_001/calm.png"
```

**处理规则：**
| 资源类型 | 处理方式 |
|---------|---------|
| 角色立绘 | ffmpeg透明背景处理，输出PNG |
| 角色设计图 | 直接复制（保留背景） |
| 场景图片 | 直接复制 |
| UI图片 | 直接复制 |

### 4. 更新记录

1. 更新 `.resource-manifest.json`（记录文件哈希用于增量检测）
2. 在 `99_变更管理/资源搬运记录/` 创建当日搬运记录

## 成品识别规则

| 资源类型 | 状态来源 | 搬运条件 | 处理方式 |
|---------|---------|---------|---------|
| 角色设计图 | 角色设计总览.md 资源类型表 | 状态为"终稿" | 直接复制 |
| 角色立绘表情 | 角色设计总览.md 立绘表情状态表 | 状态为"终稿" | ffmpeg透明背景→PNG |
| 角色动画 | 角色设计总览.md 动画状态表 | 状态为"终稿" | 直接复制 |
| 场景图片 | 场景设计总览.md | 状态为"终稿" | 直接复制 |
| 代码文件 | 文件哈希比对 | 有变更（新增/修改） | 直接复制 |

## 表情文件名映射

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
- 角色设计图: 2 个
- 角色立绘表情: 8 个（透明背景处理）
- 场景图片: 4 个
- 代码文件: 5 个（增量）
- 总计: 19 个文件

## 详细列表

### 角色设计图（终稿）
| 角色 | 源路径 | 目标路径 | 处理方式 |
|-----|-------|---------|---------|
| 罗兰 | 02_角色设计/主角/char_001_罗兰/设计图/ | textures/characters/players/char_001_罗兰/ | 直接复制 |
| 薇 | 02_角色设计/主角/char_002_薇/设计图/ | textures/characters/players/char_002_薇/ | 直接复制 |

### 角色立绘表情（终稿，透明背景处理）
| 角色 | 表情 | 源文件 | 目标文件 | ffmpeg命令 |
|-----|-----|-------|---------|-----------|
| 薇 | 平静 | expr_2026-03-29_001_平静.jpeg | resources/portraits/char_002/calm.png | colorkey=0xFFFFFF:0.1:0.0 |
| 薇 | 微笑 | expr_2026-03-29_002_微笑.jpeg | resources/portraits/char_002/smile.png | colorkey=0xFFFFFF:0.1:0.0 |

### 场景图片（终稿）
| 场景 | 源路径 | 目标路径 |
|-----|-------|---------|
| 骑士团城镇 | 03_场景设计/大地图/骑士团城镇/ | textures/scenes/maps/ |

### 代码文件（增量）
| 文件 | 变更类型 |
|-----|---------|
| core/GameConfig.ts | 修改 |

## 跳过的资源
- char_001_罗兰 立绘 - 状态为"提示词"，非终稿
- char_002_薇 暴怒表情 - 状态为"初稿"，非终稿
```

## 调用方式

```
使用 资源搬运 skill
```

## 详细文档

增量追踪机制见 [references/manifest-template.json](references/manifest-template.json)
