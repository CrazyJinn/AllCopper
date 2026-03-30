/**
 * 对话触发器示例
 * 挂载到场景中的触发区域或 NPC 上
 */

import { _decorator, Component, Collider2D, IPhysics2DContact, Contact2DType, Enum } from 'cc';
import { DialogComponent } from './DialogComponent';
import { dialogLoader } from './DialogLoader';
import { PortraitPosition, EmotionType } from './DialogData';

const { ccclass, property } = _decorator;

/** 触发方式 */
enum TriggerType {
    /** 交互键触发 */
    INTERACT = 0,
    /** 碰撞触发 */
    COLLISION = 1,
}

// 注册枚举到 Cocos
Enum(TriggerType);

@ccclass('DialogTrigger')
export class DialogTrigger extends Component {
    // ==================== 编辑器配置 ====================

    /** 对话组件引用 */
    @property(DialogComponent)
    dialogComponent: DialogComponent | null = null;

    /** 对话脚本路径（相对于 resources/dialogs/） */
    @property
    dialogPath: string = 'chapter1/dialog_001';

    /** 是否只触发一次 */
    @property
    triggerOnce: boolean = true;

    /** 触发方式 */
    @property({ type: Enum(TriggerType) })
    triggerType: TriggerType = TriggerType.INTERACT;

    // ==================== 运行时状态 ====================

    private hasTriggered: boolean = false;

    onLoad() {
        if (this.triggerType === TriggerType.COLLISION) {
            this.setupCollisionTrigger();
        }
    }

    // ==================== 碰撞触发 ====================

    private setupCollisionTrigger() {
        const collider = this.node.getComponent(Collider2D);
        if (collider) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
        }
    }

    private onCollisionEnter(self: Collider2D, other: Collider2D, contact: IPhysics2DContact | null) {
        if (other.tag === 1) { // 假设玩家 tag 为 1
            this.startDialog();
        }
    }

    // ==================== 交互触发 ====================

    /**
     * 外部调用（如玩家按下交互键时）
     */
    interact() {
        if (this.triggerType === TriggerType.INTERACT) {
            this.startDialog();
        }
    }

    // ==================== 开始对话 ====================

    async startDialog() {
        if (this.hasTriggered && this.triggerOnce) return;
        if (!this.dialogComponent) {
            console.error('[DialogTrigger] 未绑定 DialogComponent');
            return;
        }

        this.hasTriggered = true;

        try {
            // 1. 定义角色立绘配置
            const characters = [
                {
                    characterId: 'char_001',
                    name: '罗兰',
                    defaultPosition: PortraitPosition.LEFT,
                    emotionPaths: new Map([
                        [EmotionType.DEFAULT, 'char_001/calm'],
                        [EmotionType.SMILE, 'char_001/smile'],
                        [EmotionType.LAUGH, 'char_001/laugh'],
                        [EmotionType.ANGRY, 'char_001/angry'],
                        [EmotionType.SAD, 'char_001/sad'],
                        [EmotionType.THINK, 'char_001/think'],
                    ]),
                },
                {
                    characterId: 'char_002',
                    name: '薇',
                    defaultPosition: PortraitPosition.RIGHT,
                    emotionPaths: new Map([
                        [EmotionType.DEFAULT, 'char_002/calm'],
                        [EmotionType.SMILE, 'char_002/smile'],
                        [EmotionType.LAUGH, 'char_002/laugh'],
                        [EmotionType.ANGRY, 'char_002/angry'],
                        [EmotionType.FURIOUS, 'char_002/furious'],
                        [EmotionType.SAD, 'char_002/sad'],
                        [EmotionType.THINK, 'char_002/think'],
                    ]),
                },
            ];

            // 2. 加载对话脚本和立绘
            console.log('[DialogTrigger] 开始加载对话...');
            const { script } = await dialogLoader.loadCompleteDialog(
                this.dialogPath,
                characters
            );

            // 3. 开始对话
            this.dialogComponent.loadScript(script);
            this.dialogComponent.startDialog(script.id);

        } catch (e) {
            console.error('[DialogTrigger] 加载对话失败:', e);
        }
    }
}
