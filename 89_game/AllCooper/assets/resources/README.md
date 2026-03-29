# Resources 资源目录

此目录存放动态加载的游戏资源。

## 目录结构

```
resources/
  dialogs/              <- 对话脚本 (JSON)
    chapter1/
      dialog_001.json

  portraits/            <- 角色立绘 (PNG)
    roland/
      default.png       <- 待机/默认
      happy.png         <- 开心
      angry.png         <- 生气
      sad.png           <- 悲伤
      surprised.png     <- 惊讶
      thinking.png      <- 思考
      determined.png    <- 坚定
    wei/
      default.png
      happy.png
      ...
```

## 立绘规格

| 属性 | 规格 |
|------|------|
| 尺寸 | 400×800 px |
| 格式 | PNG 透明背景 |
| 命名 | 小写英文，对应表情 |

## 表情列表

| 文件名 | 表情 |
|--------|------|
| default | 默认/待机 |
| happy | 开心 |
| angry | 生气 |
| sad | 悲伤 |
| surprised | 惊讶 |
| scared | 恐惧 |
| thinking | 思考 |
| embarrassed | 尴尬 |
| cold | 冷漠 |
| determined | 坚定 |
| pain | 痛苦 |

## 加载示例

```typescript
import { dialogLoader, PortraitPosition, EmotionType } from '../dialog';

// 加载对话
const script = await dialogLoader.loadDialogJson('chapter1/dialog_001');

// 加载角色立绘
const frames = await dialogLoader.loadCharacterPortraits({
    characterId: 'char_001_roland',
    name: '罗兰',
    defaultPosition: PortraitPosition.LEFT,
    emotionPaths: new Map([
        [EmotionType.DEFAULT, 'roland/default'],
        [EmotionType.HAPPY, 'roland/happy'],
    ]),
});
```
