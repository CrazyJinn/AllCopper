# 对话系统动态加载指南

## 资源目录结构

```
resources/
  dialogs/
    chapter1/
      dialog_001.json      <- 对话脚本
      dialog_002.json
    chapter2/
      dialog_003.json
  portraits/
    roland/
      default.png
      happy.png
      angry.png
      sad.png
    wei/
      default.png
      happy.png
      angry.png
```

## 对话 JSON 格式示例

```json
{
  "id": "dialog_001",
  "name": "初次相遇",
  "characters": ["char_001_roland", "char_002_wei"],
  "startLineId": "line_001",
  "backgroundId": "bg_cave",
  "bgmId": "bgm_mystery",
  "lines": [
    {
      "id": "line_001",
      "speakerId": "char_001_roland",
      "speakerName": "罗兰",
      "text": "这里是...什么地方？",
      "speakerEmotion": "default",
      "listenerId": "char_002_wei",
      "listenerEmotion": "default",
      "nextDialogId": "line_002"
    },
    {
      "id": "line_002",
      "speakerId": "char_002_wei",
      "speakerName": "薇",
      "text": "你终于醒了。",
      "speakerEmotion": "default",
      "listenerId": "char_001_roland",
      "listenerEmotion": "surprised",
      "nextDialogId": "line_003"
    },
    {
      "id": "line_003",
      "speakerId": "char_001_roland",
      "speakerName": "罗兰",
      "text": "你是谁？",
      "speakerEmotion": "thinking",
      "nextDialogId": "line_004"
    },
    {
      "id": "line_004",
      "speakerId": "char_002_wei",
      "speakerName": "薇",
      "text": "我是薇，先跟我来，这里不安全。",
      "speakerEmotion": "serious",
      "nextDialogId": null
    }
  ]
}
```

## 代码使用方式

### 方式一：完整加载（推荐）

```typescript
import { DialogComponent, dialogLoader } from './dialog';
import { PortraitPosition, EmotionType } from './dialog';

export class GameScene extends Component {
    @property(DialogComponent)
    dialogComponent: DialogComponent | null = null;

    async startDialog() {
        if (!this.dialogComponent) return;

        // 1. 定义角色配置
        const characters = [
            {
                characterId: 'char_001_roland',
                name: '罗兰',
                defaultPosition: PortraitPosition.LEFT,
                emotionPaths: new Map([
                    [EmotionType.DEFAULT, 'roland/default'],
                    [EmotionType.HAPPY, 'roland/happy'],
                    [EmotionType.ANGRY, 'roland/angry'],
                    [EmotionType.SAD, 'roland/sad'],
                    [EmotionType.SURPRISED, 'roland/surprised'],
                    [EmotionType.THINKING, 'roland/thinking'],
                ]),
            },
            {
                characterId: 'char_002_wei',
                name: '薇',
                defaultPosition: PortraitPosition.RIGHT,
                emotionPaths: new Map([
                    [EmotionType.DEFAULT, 'wei/default'],
                    [EmotionType.HAPPY, 'wei/happy'],
                    [EmotionType.ANGRY, 'wei/angry'],
                ]),
            },
        ];

        // 2. 加载对话和立绘
        const { script } = await dialogLoader.loadCompleteDialog(
            'chapter1/dialog_001',  // JSON 路径
            characters,
            (progress, message) => {
                console.log(`加载进度: ${(progress * 100).toFixed(0)}% - ${message}`);
            }
        );

        // 3. 加载脚本并开始对话
        this.dialogComponent.loadScript(script);
        this.dialogComponent.startDialog(script.id);
    }
}
```

### 方式二：分离加载

```typescript
import { dialogLoader } from './dialog';

// 只加载 JSON
const script = await dialogLoader.loadDialogJson('chapter1/dialog_001');

// 只加载某个角色的立绘
const rolandFrames = await dialogLoader.loadPredefinedCharacter('char_001_roland');

// 手动设置立绘显示
const defaultFrame = rolandFrames.get(EmotionType.DEFAULT);
dialogComponent.setPortraitSpriteFrame(PortraitPosition.LEFT, defaultFrame);
```

### 方式三：从代码直接创建脚本

```typescript
const script: DialogScriptData = {
    id: 'test_dialog',
    name: '测试对话',
    characters: ['char_001_roland'],
    startLineId: 'l1',
    lines: [
        {
            id: 'l1',
            speakerId: 'char_001_roland',
            speakerName: '罗兰',
            text: '这是一段测试对话。',
            nextDialogId: null,
        },
    ],
};

dialogComponent.loadScript(script);
dialogComponent.startDialog('test_dialog');
```

## DialogComponent 编辑器绑定

在 Cocos Creator 编辑器中：

1. 创建节点结构：
   ```
   DialogRoot (挂载 DialogComponent)
     ├── LeftPortrait (Sprite)
     ├── RightPortrait (Sprite)
     ├── TextBox (Sprite)
     │    ├── SpeakerName (Label)
     │    └── DialogText (Label)
     └── ContinueHint (Sprite - 箭头图标)
   ```

2. 绑定属性：
   | 属性 | 节点 |
   |------|------|
   | rootNode | DialogRoot |
   | leftPortraitNode | LeftPortrait |
   | rightPortraitNode | RightPortrait |
   | textBoxNode | TextBox |
   | speakerNameLabel | SpeakerName |
   | dialogTextLabel | DialogText |
   | continueHintNode | ContinueHint |

3. 可选属性：
   | 属性 | 说明 |
   |------|------|
   | typewriterSpeed | 打字速度（字符/秒）|
   | portraitFadeDuration | 立绘淡入时长 |
   | highlightedScale | 高亮立绘缩放 |
   | dimmedOpacity | 非高亮透明度 |
   | clickSound | 点击音效（可选）|

## 表情类型

```typescript
enum EmotionType {
    DEFAULT = 'default',
    HAPPY = 'happy',
    ANGRY = 'angry',
    SAD = 'sad',
    SURPRISED = 'surprised',
    SCARED = 'scared',
    THINKING = 'thinking',
    EMBARRASSED = 'embarrassed',
    COLD = 'cold',
    DETERMINED = 'determined',
    PAIN = 'pain',
}
```

## 立绘位置

```typescript
enum PortraitPosition {
    LEFT = 'left',      // 左侧（科技派角色）
    RIGHT = 'right',    // 右侧（魔法派角色）
    CENTER = 'center',  // 居中
    HIDDEN = 'hidden',  // 隐藏
}
```
