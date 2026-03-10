# 对话系统 (Dialog System)

## 目录结构

```
assets/scripts/dialog/
├── data/                      # 数据定义
│   ├── DialogTypes.ts         # 类型、接口、常量
│   └── index.ts
├── managers/                  # 管理器
│   ├── DialogManager.ts       # 对话流程管理（单例）
│   └── index.ts
├── components/                # UI组件
│   ├── TypewriterEffect.ts    # 打字机效果
│   ├── PortraitView.ts        # 角色立绘
│   ├── CutscenePlayer.ts      # 过场动画
│   ├── DialogUI.ts            # 对话UI主组件
│   └── index.ts
└── index.ts                   # 入口文件
```

## 资源目录

```
assets/resources/
├── dialog/
│   ├── portraits/             # 头像
│   ├── emotions/              # 表情GIF
│   └── backgrounds/           # 对话背景
├── cutscenes/                 # 过场动画视频
└── audio/
    └── voice/                 # 语音文件
```

## 快速开始

### 1. 创建对话数据

```typescript
import { DialogConfig } from './scripts/dialog';

const dialog: DialogConfig = {
    id: 'intro_001',
    title: '初次相遇',
    speakers: [
        {
            characterId: 'tech_hero',
            name: '钢铁之心',
            faction: 'tech',
            portrait: 'dialog/portraits/tech_hero',
            emotionGifs: {
                idle: 'dialog/emotions/tech_hero/idle',
                happy: 'dialog/emotions/tech_hero/happy',
                angry: 'dialog/emotions/tech_hero/angry',
                sad: 'dialog/emotions/tech_hero/sad',
                surprise: 'dialog/emotions/tech_hero/surprise',
                serious: 'dialog/emotions/tech_hero/serious',
                fear: 'dialog/emotions/tech_hero/fear',
                shy: 'dialog/emotions/tech_hero/shy',
                think: 'dialog/emotions/tech_hero/think',
                special: 'dialog/emotions/tech_hero/special'
            }
        }
    ],
    lines: [
        {
            speakerId: 'tech_hero',
            text: '欢迎来到废土世界...',
            emotion: 'serious'
        }
    ],
    skippable: true,
    typeSpeed: 30
};
```

### 2. 在场景中设置

1. 创建 Canvas 下的 DialogUI 节点
2. 添加 `DialogUI` 组件
3. 配置子节点引用：
   - `DialogBox` - 对话框容器
   - `AvatarSprite` - 头像 Sprite
   - `NameLabel` - 角色名 Label
   - `DialogLabel` - 对话文本 Label
   - `Typewriter` - 打字机组件
   - `ChoicesContainer` - 选项容器
   - `ContinueHint` - 继续提示
   - `PortraitManager` - 立绘管理器
   - `CutsceneManager` - 过场动画管理器

### 3. 启动对话

```typescript
import { DialogUI } from './scripts/dialog';

// 获取组件
const dialogUI = this.node.getComponent(DialogUI);

// 启动对话
dialogUI.startDialog(dialog);

// 或通过管理器
DialogManager.instance.startDialog(dialog);
```

## 组件说明

### DialogManager（管理器）

单例模式，负责对话流程控制：

```typescript
const manager = DialogManager.instance;

// 开始对话
manager.startDialog(dialog);

// 推进对话
manager.nextLine();

// 暂停/恢复
manager.pause();
manager.resume();

// 强制结束
manager.forceEnd();

// 事件监听
manager.on(DialogEventType.DIALOG_END, (data) => {
    console.log('对话结束');
});
```

### TypewriterEffect（打字机）

```typescript
// 挂载在 Label 节点上
const typewriter = node.addComponent(TypewriterEffect);
typewriter.typeSpeed = 30;

// 开始打字
typewriter.startTyping('文本内容', () => {
    console.log('完成');
});

// 立即显示全部
typewriter.showAll();
```

### PortraitView（立绘）

- 科技派角色自动站位左侧
- 魔法派角色自动站位右侧
- 支持说话时浮动动画
- 支持高亮/变暗切换

### CutscenePlayer（过场动画）

```typescript
// 播放过场动画
cutscenePlayer.play({
    id: 'cs_001',
    videoPath: 'cutscenes/intro',
    skippable: true,
    skipKey: 'space',
    subtitles: [
        { startTime: 0, endTime: 3, text: '字幕文本' }
    ]
}, () => {
    console.log('播放完成');
});
```

## 事件类型

| 事件 | 说明 |
|------|------|
| `DIALOG_START` | 对话开始 |
| `DIALOG_END` | 对话结束 |
| `LINE_START` | 行开始 |
| `TYPE_COMPLETE` | 打字完成 |
| `CHOICES_SHOW` | 选项显示 |
| `CHOICE_SELECTED` | 选项选择 |
| `EMOTION_CHANGE` | 表情变化 |
| `SPEAKER_CHANGE` | 说话者变化 |
| `CUTSCENE_START` | 过场开始 |
| `CUTSCENE_END` | 过场结束 |

## 表情类型

| 类型 | 说明 |
|------|------|
| `idle` | 平静 |
| `happy` | 开心 |
| `angry` | 愤怒 |
| `sad` | 悲伤 |
| `surprise` | 惊讶 |
| `serious` | 严肃 |
| `fear` | 恐惧 |
| `shy` | 害羞 |
| `think` | 思考 |
| `special` | 特殊 |

## 预制体结构建议

```
DialogUI (Canvas子节点)
├── Background                # 背景图
├── LeftPortrait              # 左侧立绘 (PortraitView)
├── RightPortrait             # 右侧立绘 (PortraitView)
├── DialogBox                 # 对话框
│   ├── Avatar                # 头像
│   ├── NameLabel             # 角色名
│   ├── DialogLabel           # 对话文本 (TypewriterEffect)
│   └── ContinueHint          # 继续提示
├── ChoicesContainer          # 选项容器
└── CutscenePlayer            # 过场动画播放器
```

## 操作方式

| 操作 | 效果 |
|------|------|
| 点击对话框 | 推进对话/显示全部文本 |
| 空格/回车 | 推进对话 |
| ESC | 跳过对话 |
