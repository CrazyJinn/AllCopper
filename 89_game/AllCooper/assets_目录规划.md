# AllCooper 游戏项目文件夹规划

## 上下文

基于现有设计资源目录结构，为 Cocos Creator 游戏项目 `89_game/AllCooper` 规划 assets 文件夹结构。

### 现有资源分析

| 来源 | 内容 | 命名规范 |
|------|------|----------|
| 02_角色设计 | 主角(2)、NPC(5)、怪物(12) | `char_XXX_中文名`、`npc_XXX_中文名`、`enemy_XXX_中文名` |
| 03_场景设计 | 大地图(7)、室内场景(5)、对话背景(4)、UI背景(4) | `map_XXX`、`room_XXX`、`dialog_XXX`、`ui_bg_XXX` |
| 04_code | core、data、player、combat、ui、scene、ai、economy、dialog、dungeon | 模块化架构 |

---

## 推荐目录结构

```
89_game/AllCooper/
├── assets/
│   ├── scenes/                          # 场景文件 (.scene)
│   │   ├── MainMenu.scene               # 主菜单
│   │   ├── Loading.scene                # 加载界面
│   │   ├── WorldMap.scene               # 大地图
│   │   ├── Dungeon/                     # 副本场景
│   │   │   ├── Dungeon_Entrance.scene
│   │   │   ├── Dungeon_Normal.scene
│   │   │   ├── Dungeon_Elite.scene
│   │   │   ├── Dungeon_Boss.scene
│   │   │   └── Dungeon_Hidden.scene
│   │   └── Dialog/                      # 对话场景
│   │
│   ├── scripts/                         # TypeScript 脚本
│   │   ├── core/                        # 核心模块 (来自 04_code)
│   │   │   ├── GameConfig.ts
│   │   │   ├── EventSystem.ts
│   │   │   └── GameManager.ts
│   │   ├── data/                        # 数据定义
│   │   │   ├── CharacterData.ts
│   │   │   ├── MonsterData.ts
│   │   │   ├── ItemData.ts
│   │   │   └── SceneData.ts
│   │   ├── player/                      # 玩家控制
│   │   │   ├── InputManager.ts
│   │   │   ├── StateMachine.ts
│   │   │   └── PlayerController.ts
│   │   ├── combat/                      # 战斗系统
│   │   │   ├── DamageCalculator.ts
│   │   │   ├── BuffSystem.ts
│   │   │   └── CombatSystem.ts
│   │   ├── ai/                          # 怪物AI
│   │   │   └── MonsterAI.ts
│   │   ├── ui/                          # UI系统
│   │   │   ├── HUD.ts
│   │   │   ├── MainMenu.ts
│   │   │   └── DamageNumber.ts
│   │   ├── scene/                       # 场景管理
│   │   │   └── SceneManager.ts
│   │   ├── economy/                     # 经济系统
│   │   │   └── EconomySystem.ts
│   │   ├── dialog/                      # 对话系统
│   │   │   └── DialogSystem.ts
│   │   └── dungeon/                     # 副本系统
│   │
│   ├── textures/                        # 图片资源
│   │   ├── characters/                  # 角色图片
│   │   │   ├── heroes/                  # 主角
│   │   │   │   ├── char_001_罗兰/
│   │   │   │   │   ├── portrait/        # 立绘
│   │   │   │   │   │   ├── 罗兰_立绘_01.png
│   │   │   │   │   │   └── 罗兰_立绘_02_愤怒.png  # 表情差分
│   │   │   │   │   ├── portrait_small/  # 头像
│   │   │   │   │   │   └── 罗兰_头像.png
│   │   │   │   │   └── battle/          # 战斗动作序列
│   │   │   │   │       ├── idle/        # 待机
│   │   │   │   │       ├── walk/        # 移动
│   │   │   │   │       ├── attack/      # 攻击
│   │   │   │   │       ├── skill/       # 技能
│   │   │   │   │       ├── hurt/        # 受击
│   │   │   │   │       ├── dodge/       # 闪避
│   │   │   │   │       └── death/       # 死亡
│   │   │   │   └── char_002_薇/
│   │   │   │       └── (同上结构)
│   │   │   ├── npcs/                    # NPC
│   │   │   │   ├── npc_001_康拉德/
│   │   │   │   │   ├── portrait/        # 立绘
│   │   │   │   │   └── portrait_small/  # 头像
│   │   │   │   ├── npc_002_渊宇/
│   │   │   │   ├── npc_003_塞巴斯蒂安/
│   │   │   │   ├── npc_004_以诺/
│   │   │   │   └── npc_005_奥古斯都/
│   │   │   └── enemies/                 # 怪物 (按类型分类)
│   │   │       ├── animals/             # 动物类
│   │   │       │   ├── enemy_001_辐射巨鼠/
│   │   │       │   │   └── battle/      # 战斗动作序列
│   │   │       │   │       ├── idle/
│   │   │       │   │       ├── walk/
│   │   │       │   │       ├── attack/
│   │   │       │   │       ├── hurt/
│   │   │       │   │       └── death/
│   │   │       │   ├── enemy_002_钢鬃野猪/
│   │   │       │   ├── enemy_003_骨翼鸦/
│   │   │       │   ├── enemy_004_毒液蜘蛛/
│   │   │       │   ├── enemy_005_裂变熊/     # 精英
│   │   │       │   │   └── battle/
│   │   │       │   │       ├── idle/
│   │   │       │   │       ├── walk/
│   │   │       │   │       ├── attack/
│   │   │       │   │       ├── special/  # 精英特殊攻击
│   │   │       │   │       ├── hurt/
│   │   │       │   │       └── death/
│   │   │       │   └── enemy_006_双头狼/     # 精英
│   │   │       └── plants/              # 植物类
│   │   │           ├── enemy_007_藤蔓怪/
│   │   │           ├── enemy_008_爆炸孢子菇/
│   │   │           ├── enemy_009_吸血藤/
│   │   │           ├── enemy_010_酸液喷壶草/
│   │   │           ├── enemy_011_树人守卫/   # 精英
│   │   │           └── enemy_012_食人花/     # 精英
│   │   │
│   │   ├── scenes/                      # 场景图片
│   │   │   ├── worldmap/                # 大地图
│   │   │   │   ├── map_001_骑士团城镇/
│   │   │   │   ├── map_002_秘术协会城镇/
│   │   │   │   ├── map_003_教会城镇/
│   │   │   │   ├── map_004_废土/
│   │   │   │   ├── map_005_变异森林/
│   │   │   │   ├── map_006_城市废墟/
│   │   │   │   └── map_007_灰雪地/
│   │   │   ├── dungeon/                 # 副本房间
│   │   │   │   ├── room_001_入口房/
│   │   │   │   ├── room_002_普通房/
│   │   │   │   ├── room_003_精英房/
│   │   │   │   ├── room_004_Boss房/
│   │   │   │   └── room_005_隐藏房/
│   │   │   ├── dialog/                  # 对话背景
│   │   │   │   ├── dialog_001_骑士团城镇/
│   │   │   │   ├── dialog_002_秘术协会/
│   │   │   │   ├── dialog_003_废土/
│   │   │   │   └── dialog_004_变异森林/
│   │   │   └── ui/                      # UI背景
│   │   │       ├── ui_bg_001_主菜单/
│   │   │       ├── ui_bg_002_暂停菜单/
│   │   │       ├── ui_bg_003_背包界面/
│   │   │       └── ui_bg_004_加载界面/
│   │   │
│   │   └── ui/                          # UI元素
│   │       ├── icons/                   # 图标
│   │       │   ├── items/               # 物品图标
│   │       │   ├── skills/              # 技能图标
│   │       │   └── buffs/               # Buff图标
│   │       ├── buttons/                 # 按钮图片
│   │       ├── frames/                  # 边框/框架
│   │       └── fonts/                   # 字体图片(如有)
│   │
│   ├── audio/                           # 音频资源
│   │   ├── bgm/                         # 背景音乐
│   │   │   ├── main_menu.mp3
│   │   │   ├── worldmap/
│   │   │   ├── dungeon/
│   │   │   └── combat/
│   │   ├── sfx/                         # 音效
│   │   │   ├── combat/                  # 战斗音效
│   │   │   ├── ui/                      # UI音效
│   │   │   └── ambient/                 # 环境音效
│   │   └── voice/                       # 语音(如有)
│   │
│   ├── prefabs/                         # 预制体
│   │   ├── characters/                  # 角色预制体
│   │   │   ├── heroes/
│   │   │   ├── npcs/
│   │   │   └── enemies/
│   │   ├── ui/                          # UI预制体
│   │   │   ├── HUD.prefab
│   │   │   ├── DialogBox.prefab
│   │   │   ├── Inventory.prefab
│   │   │   └── DamageNumber.prefab
│   │   └── items/                       # 物品预制体
│   │
│   ├── animations/                      # 动画资源
│   │   ├── characters/                  # 角色动画
│   │   │   ├── heroes/
│   │   │   └── enemies/
│   │   └── ui/                          # UI动画
│   │
│   ├── materials/                       # 材质文件
│   │
│   ├── fonts/                           # 字体文件 (.ttf, .fnt)
│   │
│   └── resources/                       # 动态加载资源
│       ├── data/                        # JSON配置文件
│       │   ├── characters.json
│       │   ├── monsters.json
│       │   ├── items.json
│       │   └── scenes.json
│       └── configs/                     # 游戏配置
│
├── library/                             # Cocos缓存(已存在)
├── temp/                                # 临时文件(已存在)
├── profiles/                            # 编辑器配置(已存在)
├── settings/                            # 项目设置(已存在)
├── package.json                         # (已存在)
└── tsconfig.json                        # (已存在)
```

---

## 文件命名规范

| 资源类型 | 命名格式 | 示例 |
|---------|---------|------|
| 场景文件 | `{功能名}.scene` / `{类型}_{名称}.scene` | `MainMenu.scene`, `Dungeon_Boss.scene` |
| 脚本文件 | `{类名}.ts` | `PlayerController.ts` |
| 立绘图片 | `{名称}_立绘_{编号}.png` | `罗兰_立绘_01.png`, `罗兰_立绘_02_愤怒.png` |
| 头像图片 | `{名称}_头像.png` | `罗兰_头像.png` |
| 动作序列 | `{名称}_{动作}_{帧号}.png` | `罗兰_攻击_01.png`, `辐射巨鼠_待机_03.png` |
| 预制体 | `{名称}.prefab` | `HUD.prefab`, `char_001_罗兰.prefab` |
| 音频文件 | `{用途}_{描述}.{格式}` | `bgm_dungeon_01.mp3`, `sfx_attack_sword.wav` |

### 动作类型命名

| 动作 | 目录名 | 说明 |
|-----|-------|------|
| 待机 | idle | 默认站立/待机动画 |
| 移动 | walk | 行走/移动动画 |
| 攻击 | attack | 普通攻击 |
| 技能 | skill | 主角技能（怪物无） |
| 特殊 | special | 精英怪特殊攻击 |
| 受击 | hurt | 被攻击受伤 |
| 闪避 | dodge | 闪避动作（主角） |
| 死亡 | death | 死亡动画 |

---

## 关键对应关系

| 设计目录 | 游戏目录 | 说明 |
|---------|---------|------|
| 02_角色设计/主角 | textures/characters/heroes | 主角立绘、战斗图、头像 |
| 02_角色设计/NPC | textures/characters/npcs | NPC立绘、头像 |
| 02_角色设计/怪物 | textures/characters/enemies | 怪物战斗图 |
| 03_场景设计/大地图 | textures/scenes/worldmap | 大地图背景 |
| 03_场景设计/游戏场景 | textures/scenes/dungeon | 副本房间背景 |
| 03_场景设计/对话背景 | textures/scenes/dialog | 对话界面背景 |
| 03_场景设计/UI背景 | textures/scenes/ui | UI界面背景 |
| 04_code/* | scripts/* | 全部代码模块 |

---

## 执行步骤

1. 创建 assets 目录及子目录结构
2. 从 04_code 复制脚本文件到 assets/scripts
3. 创建资源搬运配置，用于后续从设计目录导入图片
4. 创建基础场景文件
5. 配置 resources/data 中的 JSON 数据文件
