# 万物为铜 - 游戏开发流程图

```mermaid
%%{init: {'flowchart': {'nodeSpacing': 50, 'rankSpacing': 80, 'curve': 'basis', 'htmlLabels': true}, 'themeVariables': {'nodeTextAlignment': 'center', 'subGraphTitleFontWeight': 'bold'}}}%%
flowchart TB
    %% ========== 前期准备 ==========
    subgraph 前期准备["<b>前期准备</b>"]
        A1[游戏概览.md]
        A2[世界设定.md]
        A3[剧本大纲.md]
    end

    %% ========== 需求分析 ==========
    subgraph 需求分析["<b>需求分析</b>"]
        S1O1[CLAUDE.md]
        S1O2[角色需求.md]
        S1O3[场景需求.md]
        S1O4[音频需求.md]
        S1O5[代码需求.md]
    end

    %% ========== 剧本拆解 ==========
    subgraph 剧本拆解["<b>剧本拆解</b>"]
        S2O1[剧本.md]
        S2O2[立绘提示词.md]
        S2O3[过场提示词.md]
    end

    %% ========== 角色设计 ==========
    subgraph 角色设计["<b>角色设计</b>"]
        S3O1[角色设计图提示词.md]
    end

    %% ========== 场景设计 ==========
    subgraph 场景设计["<b>场景设计</b>"]
        S4O1[大地图.md]
        S4O2[游戏场景.md]
        S4O3[对话背景.md]
        S4O4[UI背景.md]
    end

    %% ========== 代码需求分析 ==========
    subgraph 代码需求分析["<b>代码需求分析</b>"]
        S5O1[需求分析文档]
    end

    %% ========== t2i(人工) ==========
    subgraph t2i人工["<b>t2i (人工)</b>"]
        S6O1[角色设计图.png]
    end

    %% ========== t2i(api) ==========
    subgraph t2iapi["<b>t2i (api)</b>"]
        S7O1[场景图片.png]
    end

    %% ========== i2i(api) ==========
    subgraph i2i图片["<b>i2i (api)</b>"]
        S8O1[立绘.png]
        S8O2[过场.png]
    end

    %% ========== i2i(人工) ==========
    subgraph i2i人工["<b>i2i (人工)</b>"]
        S9O1[Q版设计图.png]
    end

    %% ========== i2v(api) ==========
    subgraph i2vapi["<b>i2v (api)</b>"]
        S10O1[Q版动画视频.mp4]
    end

    %% ========== 精灵帧提取 ==========
    subgraph 精灵帧提取["<b>精灵帧提取 (ffmpeg)</b>"]
        S11O1[精灵帧序列.png]
        S11O2[精灵图集.png]
    end

    %% ========== 音频实现 ==========
    subgraph 音频实现["<b>音频实现</b>"]
        S12O1[BGM.mp3]
        S12O2[音效.mp3]
    end

    %% ========== 代码生成 ==========
    subgraph 代码生成["<b>代码生成</b>"]
        S13O1[游戏代码]
    end

    %% ========== 资源搬运 ==========
    subgraph 资源搬运["<b>资源搬运</b>"]
        S14O1[游戏assets目录]
    end

    %% ========== 游戏组装 ==========
    subgraph 游戏组装["<b>游戏组装 (人工)</b>"]
        S15O1[游戏成品]
    end

    %% ========== 剧本组装 ==========
    subgraph 剧本组装["<b>剧本组装 (人工)</b>"]
        S16O1[剧本.json]
    end

    %% ========== 主流程连接线 ==========
    A1 & A2 --> 需求分析
    A3 --> 剧本拆解

    S1O2 --> 角色设计
    S1O3 --> 场景设计
    S1O5 --> 代码需求分析

    S3O1 --> t2i人工
    S2O2 & S2O3 --> i2i图片
    S4O1 & S4O2 & S4O3 & S4O4 --> t2iapi

    S6O1 --> i2i图片
    S6O1 --> i2i人工

    S9O1 --> i2vapi
    S10O1 --> 精灵帧提取

    S1O4 --> 音频实现

    S5O1 --> 代码生成

    S2O1 --> 剧本组装

    S7O1 & S8O1 & S8O2 & S11O1 & S11O2 & S12O1 & S12O2 --> 资源搬运
    S14O1 & S13O1 & S16O1 --> 游戏组装

    %% ========== 样式定义 ==========
    classDef manual fill:#ffebee,stroke:#c62828,stroke-width:3px,color:#000
    classDef semi fill:#fff3e0,stroke:#ef6c00,stroke-width:2px,color:#000
    classDef auto fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#000
    classDef input fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#000

    class t2i人工,i2i人工,游戏组装 manual
    class i2i图片,i2vapi semi
    class t2iapi,精灵帧提取,资源搬运 auto
    class 前期准备 input
```

---

## 图例说明

| 样式 | 含义 | 示例环节 |
|------|------|---------|
| 🔴 红色边框 | 纯人工处理 | t2i(人工)、i2i(人工)、游戏组装 |
| 🟠 橙色边框 | AI辅助（需人工参与） | i2i(图片)、i2v(api) |
| 🟢 绿色边框 | 自动化处理 | t2i(api)、精灵帧提取、资源搬运 |
| 🔵 蓝色边框 | 前期准备（输入资料） | 世界观、设定集、剧本大纲 |

## 名词解释

| 术语 | 全称 | 含义 |
|------|------|------|
| t2i | Text to Image | 文字生成图片 |
| i2i | Image to Image | 图片生成图片 |
| i2v | Image to Video | 图片生成视频 |

---

## 目录结构

```
万物为铜/
├── 00_init/
│   ├── 游戏概览.md
│   ├── 世界设定.md
│   └── 剧本大纲.md
│
├── 01_需求文档/
│   ├── 角色需求.md
│   ├── 场景需求.md
│   ├── 音频需求.md
│   └── 代码需求.md
│
├── 02_角色设计/
│   ├── 角色设计总览.md
│   ├── 主角/
│   │   └── char_001/
│   │       ├── 设计图提示词.md
│   │       ├── 设计图.png
│   │       ├── 立绘/
│   │       │   ├── 提示词.md
│   │       │   └── *.png
│   │       ├── 动画/
│   │       │   ├── 提示词.md
│   │       │   └── *.png
│   │       └── Q版/
│   │           ├── 设计图.png
│   │           ├── 动画.mp4
│   │           └── 精灵图集.png
│   ├── NPC/
│   └── 怪物/
│
├── 03_场景设计/
│   ├── 场景设计总览.md
│   ├── 大地图/
│   │   └── map_001/
│   │       ├── 提示词.md
│   │       └── 场景图.png
│   ├── 游戏场景/
│   ├── 对话背景/
│   └── UI背景/
│
├── 04_剧本/
│   ├── 剧本总览.md
│   ├── 章节/
│   │   ├── 第一章.md
│   │   └── ...
│   └── 分镜/
│
├── 05_音频/
│   ├── 音频需求.md
│   ├── BGM/
│   └── 音效/
│
├── 89_game/
│   └── AllCooper/
│       ├── project.godot
│       ├── scenes/
│       │   ├── levels/
│       │   ├── ui/
│       │   └── dialogs/
│       ├── scripts/
│       │   ├── core/
│       │   ├── player/
│       │   ├── combat/
│       │   ├── ai/
│       │   └── ui/
│       ├── assets/
│       │   ├── sprites/
│       │   │   ├── characters/
│       │   │   ├── enemies/
│       │   │   └── effects/
│       │   ├── backgrounds/
│       │   ├── ui/
│       │   └── audio/
│       │       ├── bgm/
│       │       └── sfx/
│       └── addons/
│
├── 99_变更管理/
│
└── .claude/skills/
```