---
name: 场景设计
description: "2D游戏场景设计提示词生成。根据游戏基本信息和场景需求，生成用于AI绘图的场景提示词。触发条件：(1) 需要生成场景图像提示词 (2) 场景设计阶段 (3) 为Midjourney/Stable Diffusion等工具准备prompt"
---

# 场景设计提示词生成

将场景需求转化为专业的AI绘图提示词。

## 输入

从 `01_需求文档/` 目录读取：

| 文件 | 必需 | 说明 |
|-----|-----|-----|
| 游戏基本信息.md | 是 | 提供美术风格、世界观背景 |
| 场景需求.md | 是 | 场景环境、物品、连接等信息 |
| UI需求.md | 是 | UI背景的风格、色调需求 |

## 输出

输出到 `03_场景设计/` 目录，按用途分类：

```
03_场景设计/
├── 场景设计总览.md
├── 大地图/                      # 游戏世界地图、区域地图
├── 游戏场景/                    # 实际游戏发生的场景
 │   ├── 室内场景/
│   └── 室外场景/
├── 对话背景/                    # 对话系统的背景图
└── UI背景/                      # 界面背景（菜单、背包等）
```

## 场景分类说明

| 分类 | 用途 | 特点 |
|-----|------|------|
| 大地图 | 世界地图、区域导航 | 俯视角，标注地点，可点击区域 |
| 游戏场景 | 玩家实际探索的场景 | 完整的远中近景分层，可交互区域 |
| 对话背景 | 对话系统背景 | 简洁，突出角色立绘，氛围感 |
| UI背景 | 菜单、背包、技能树等界面 | 简洁，不干扰UI元素阅读 |

## HTML格式

输出HTML文件用于可视化场景布局，格式简洁：

**容器属性**：`id`（场景ID），`description`（整体描述：风格、视角、色调、氛围等）

**元素属性**：`description`（区域描述），`style`（百分比定位：left/top/width/height/z-index）

```html
<div id="scene_001" description="整体描述...">
  <div description="区域描述" style="left:0;top:0;width:100%;height:40%;z-index:1"></div>
</div>
```

**注意**：CSS使用 `body > div > div` 选择器，无需class名称。

样式示例：
```html
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 100vw; height: 100vh; overflow: hidden; }
  body > div { position: relative; width: 100%; height: 100%; }
  body > div > div { position: absolute; }
</style>
```

## 示例文件

| 类型 | 文件 | 说明 |
|-----|------|------|
| 大地图 | [example-world-map.html](references/example-world-map.html) | 世界地图，可点击区域 |
| 室外场景 | [example-outdoor-scene.html](references/example-outdoor-scene.html) | 城镇等室外探索场景 |
| 室内场景 | [example-indoor-scene.html](references/example-indoor-scene.html) | 副本房间等室内场景 |
| 对话背景 | [example-dialog-bg.html](references/example-dialog-bg.html) | 对话系统背景 |
| UI背景 | [example-ui-bg.html](references/example-ui-bg.html) | 菜单、背包等界面背景 |

## 提示词要求

- **简洁**：物品描述无需重复容器级风格（美术风格、视角、色调等）
- **中文**：所有提示词使用中文
- **分层**：远景、中景、近景分别描述
- **相对定位**：使用百分比

## 工作流程

1. 读取 `01_需求文档/游戏基本信息.md`，提取美术风格
2. 读取 `01_需求文档/场景需求.md`，提取场景信息
3. 读取 `01_需求文档/UI需求.md`，提取UI背景需求
4. 根据场景用途分类（大地图/游戏场景/对话背景/UI背景）
5. 为每个场景创建文件夹并生成 `场景布局.html`
6. 生成 `场景设计总览.md` 汇总索引

## 调用方式

```
使用 scene-design-prompt skill
输入目录: 01_需求文档/
输出目录: 03_场景设计/
```
