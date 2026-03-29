/**
 * Cocos Creator 对话组件
 * 连接 SimpleDialogSystem 与 UI 显示
 *
 * 使用方式：
 * 1. 将此组件挂载到 Canvas 下的 DialogRoot 节点
 * 2. 在编辑器中绑定各个 UI 节点引用
 * 3. 调用 startDialog(scriptId) 开始对话
 */

import { _decorator, Component, Node, Sprite, SpriteFrame, Label, tween, Vec3, UIOpacity, Input, EventTouch, AudioSource, AudioClip } from 'cc';
import { SimpleDialogSystem, simpleDialogSystem, DialogCallbacks } from './SimpleDialogSystem';
import { DialogScriptData, CharacterPortrait, PortraitPosition, EmotionType } from './DialogData';
import { dialogLoader } from './DialogLoader';

const { ccclass, property } = _decorator;

@ccclass('DialogComponent')
export class DialogComponent extends Component {
    // ==================== 编辑器属性 ====================

    /** 根节点（控制整体显示/隐藏） */
    @property(Node)
    rootNode: Node | null = null;

    /** 左侧立绘节点 */
    @property(Node)
    leftPortraitNode: Node | null = null;

    /** 右侧立绘节点 */
    @property(Node)
    rightPortraitNode: Node | null = null;

    /** 文本框背景节点 */
    @property(Node)
    textBoxNode: Node | null = null;

    /** 说话者名称 Label */
    @property(Label)
    speakerNameLabel: Label | null = null;

    /** 对话文本 Label */
    @property(Label)
    dialogTextLabel: Label | null = null;

    /** 继续提示节点（箭头动画） */
    @property(Node)
    continueHintNode: Node | null = null;

    /** 打字机速度（字符/秒） */
    @property
    typewriterSpeed: number = 30;

    /** 立绘切换动画时长（秒） */
    @property
    portraitFadeDuration: number = 0.3;

    /** 高亮立绘缩放 */
    @property
    highlightedScale: number = 1.1;

    /** 非高亮立绘透明度 (0-255) */
    @property
    dimmedOpacity: number = 150;

    /** 点击音效（可选，不绑定也不会报错） */
    @property(AudioClip)
    clickSound: AudioClip | null = null;

    // ==================== 运行时状态 ====================

    private dialogSystem: SimpleDialogSystem = simpleDialogSystem;
    private audioSource: AudioSource | null = null;
    private isInitialized: boolean = false;

    /** 当前显示的立绘资源ID */
    private currentLeftPortraitId: string = '';
    private currentRightPortraitId: string = '';

    /** 继续提示动画 */
    private continueHintTween: any = null;

    // ==================== 生命周期 ====================

    onLoad() {
        this.initComponent();
        this.setupCallbacks();
        this.hide();
    }

    onDestroy() {
        this.stopContinueHintAnimation();
        this.dialogSystem.clear();
    }

    update(deltaTime: number) {
        if (!this.dialogSystem.isActive) return;

        this.dialogSystem.update(deltaTime);
        this.updateDisplayText();
    }

    // ==================== 初始化 ====================

    private initComponent() {
        if (this.isInitialized) return;

        // 获取或添加 AudioSource（用于播放音效）
        this.audioSource = this.node.getComponent(AudioSource);
        if (!this.audioSource) {
            this.audioSource = this.node.addComponent(AudioSource);
        }

        // 注册触摸事件
        this.registerTouchEvents();

        this.isInitialized = true;
    }

    private setupCallbacks() {
        const callbacks: DialogCallbacks = {
            onDialogStart: this.onDialogStart.bind(this),
            onDialogEnd: this.onDialogEnd.bind(this),
            onShowText: this.onShowText.bind(this),
            onUpdatePortraits: this.onUpdatePortraits.bind(this),
            onTypewriterComplete: this.onTypewriterComplete.bind(this),
        };

        this.dialogSystem.setCallbacks(callbacks);
    }

    private registerTouchEvents() {
        if (this.rootNode) {
            this.rootNode.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        }
    }

    // ==================== 公共接口 ====================

    /**
     * 加载对话脚本
     */
    loadScript(script: DialogScriptData): boolean {
        return this.dialogSystem.loadScript(script);
    }

    /**
     * 从 JSON 加载脚本
     */
    loadScriptFromJson(json: string): boolean {
        return this.dialogSystem.loadScriptFromJson(json);
    }

    /**
     * 开始对话
     */
    startDialog(scriptId: string): boolean {
        const result = this.dialogSystem.start(scriptId);
        if (result) {
            this.show();
        }
        return result;
    }

    /**
     * 强制结束对话
     */
    endDialog(): void {
        this.dialogSystem.end();
    }

    /**
     * 对话是否激活中
     */
    get isActive(): boolean {
        return this.dialogSystem.isActive;
    }

    /**
     * 打字机是否完成
     */
    get isTypewriterComplete(): boolean {
        return this.dialogSystem.isTypewriterComplete;
    }

    // ==================== 显示控制 ====================

    private show(): void {
        if (this.rootNode) {
            this.rootNode.active = true;
            // 淡入动画
            const opacity = this.rootNode.getComponent(UIOpacity) || this.rootNode.addComponent(UIOpacity);
            opacity.opacity = 0;
            tween(opacity)
                .to(0.2, { opacity: 255 })
                .start();
        }
    }

    private hide(): void {
        if (this.rootNode) {
            this.rootNode.active = false;
        }
        this.stopContinueHintAnimation();
    }

    // ==================== 回调处理 ====================

    private onDialogStart(scriptId: string): void {
        console.log(`[Dialog] 开始对话: ${scriptId}`);
        this.currentLeftPortraitId = '';
        this.currentRightPortraitId = '';
    }

    private onDialogEnd(scriptId: string): void {
        console.log(`[Dialog] 结束对话: ${scriptId}`);
        this.fadeOutAndHide();
    }

    private onShowText(text: string, speakerName: string): void {
        // 更新说话者名称
        if (this.speakerNameLabel) {
            this.speakerNameLabel.string = speakerName;
        }

        // 隐藏继续提示
        this.hideContinueHint();
    }

    private onUpdatePortraits(portraits: Map<string, CharacterPortrait>): void {
        console.log(`[DialogComponent] onUpdatePortraits 被调用，立绘数量: ${portraits.size}`);
        portraits.forEach((portrait, characterId) => {
            console.log(`[DialogComponent] 处理立绘: characterId=${characterId}, emotion=${portrait.emotion}, position=${portrait.position}, highlighted=${portrait.highlighted}`);
            this.updatePortraitDisplay(portrait);
        });
    }

    private onTypewriterComplete(): void {
        this.showContinueHint();
    }

    // ==================== 文本显示 ====================

    private updateDisplayText(): void {
        if (!this.dialogTextLabel) return;

        const displayText = this.dialogSystem.getDisplayText();
        this.dialogTextLabel.string = displayText;
    }

    // ==================== 立绘显示 ====================

    /**
     * 更新单个立绘显示
     */
    private updatePortraitDisplay(portrait: CharacterPortrait): void {
        const { position, highlighted, characterId, emotion } = portrait;
        console.log(`[DialogComponent] updatePortraitDisplay: characterId=${characterId}, emotion=${emotion}, position=${position}`);

        // 根据位置选择节点
        let targetNode: Node | null = null;
        let isLeft = false;

        switch (position) {
            case PortraitPosition.LEFT:
                targetNode = this.leftPortraitNode;
                isLeft = true;
                console.log(`[DialogComponent] 选择左侧立绘节点`);
                break;
            case PortraitPosition.RIGHT:
                targetNode = this.rightPortraitNode;
                isLeft = false;
                console.log(`[DialogComponent] 选择右侧立绘节点`);
                break;
            case PortraitPosition.CENTER:
                targetNode = this.leftPortraitNode;
                isLeft = true;
                console.log(`[DialogComponent] 选择中间立绘节点（使用左侧）`);
                break;
            case PortraitPosition.HIDDEN:
                console.log(`[DialogComponent] 隐藏立绘: ${characterId}`);
                this.hidePortrait(characterId);
                return;
        }

        if (!targetNode) {
            console.warn(`[DialogComponent] 目标节点为空！position=${position}`);
            return;
        }

        // 获取并设置立绘 SpriteFrame
        console.log(`[DialogComponent] 尝试获取 SpriteFrame: characterId=${characterId}, emotion=${emotion}`);
        const spriteFrame = dialogLoader.getPortraitFrame(characterId, emotion);
        console.log(`[DialogComponent] getPortraitFrame 返回: ${spriteFrame ? `SpriteFrame(name=${spriteFrame.name})` : 'null'}`);

        if (spriteFrame) {
            const sprite = targetNode.getComponent(Sprite);
            console.log(`[DialogComponent] Sprite 组件: ${sprite ? '存在' : '不存在'}`);
            if (sprite) {
                console.log(`[DialogComponent] 设置 spriteFrame: ${spriteFrame.name}`);
                sprite.spriteFrame = spriteFrame;
            }
            targetNode.active = true;
            console.log(`[DialogComponent] 立绘节点已激活`);
        } else {
            console.warn(`[DialogComponent] 未找到立绘资源: ${characterId}/${emotion}`);
        }

        // 更新立绘高亮状态
        this.updatePortraitHighlight(targetNode, highlighted);

        // 记录当前立绘
        if (isLeft) {
            this.currentLeftPortraitId = characterId;
        } else {
            this.currentRightPortraitId = characterId;
        }
    }

    /**
     * 更新立绘高亮状态
     */
    private updatePortraitHighlight(node: Node, highlighted: boolean): void {
        const targetScale = highlighted ? this.highlightedScale : 1.0;
        const targetOpacity = highlighted ? 255 : this.dimmedOpacity;

        // 缩放动画
        tween(node)
            .to(this.portraitFadeDuration, { scale: new Vec3(targetScale, targetScale, 1) })
            .start();

        // 透明度动画
        const opacity = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
        tween(opacity)
            .to(this.portraitFadeDuration, { opacity: targetOpacity })
            .start();
    }

    /**
     * 隐藏指定角色的立绘
     */
    private hidePortrait(characterId: string): void {
        if (this.currentLeftPortraitId === characterId && this.leftPortraitNode) {
            this.fadeOutPortrait(this.leftPortraitNode);
            this.currentLeftPortraitId = '';
        }
        if (this.currentRightPortraitId === characterId && this.rightPortraitNode) {
            this.fadeOutPortrait(this.rightPortraitNode);
            this.currentRightPortraitId = '';
        }
    }

    /**
     * 淡出立绘
     */
    private fadeOutPortrait(node: Node): void {
        const opacity = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
        tween(opacity)
            .to(this.portraitFadeDuration, { opacity: 0 })
            .call(() => {
                node.active = false;
            })
            .start();
    }

    // ==================== 继续提示 ====================

    private showContinueHint(): void {
        if (!this.continueHintNode) return;

        this.continueHintNode.active = true;
        this.startContinueHintAnimation();
    }

    private hideContinueHint(): void {
        if (!this.continueHintNode) return;

        this.stopContinueHintAnimation();
        this.continueHintNode.active = false;
    }

    private startContinueHintAnimation(): void {
        if (!this.continueHintNode) return;

        this.stopContinueHintAnimation();

        // 上下浮动动画
        const originalY = this.continueHintNode.position.y;
        this.continueHintTween = tween(this.continueHintNode)
            .to(0.5, { position: new Vec3(this.continueHintNode.position.x, originalY - 10, 0) })
            .to(0.5, { position: new Vec3(this.continueHintNode.position.x, originalY, 0) })
            .union()
            .repeatForever()
            .start();
    }

    private stopContinueHintAnimation(): void {
        if (this.continueHintTween) {
            this.continueHintTween.stop();
            this.continueHintTween = null;
        }
    }

    // ==================== 输入处理 ====================

    private onTouchEnd(event: EventTouch): void {
        if (!this.dialogSystem.isActive) return;

        // 播放点击音效（如果绑定了的话）
        this.playClickSound();

        // 推进对话
        this.dialogSystem.advance();
    }

    // ==================== 音效 ====================

    private playClickSound(): void {
        // 只有音效和音频源都存在时才播放
        if (this.clickSound && this.audioSource) {
            this.audioSource.playOneShot(this.clickSound, 1.0);
        }
    }

    // ==================== 动画 ====================

    /**
     * 淡出并隐藏
     */
    private fadeOutAndHide(): void {
        if (!this.rootNode) {
            this.hide();
            return;
        }

        const opacity = this.rootNode.getComponent(UIOpacity) || this.rootNode.addComponent(UIOpacity);
        tween(opacity)
            .to(0.3, { opacity: 0 })
            .call(() => {
                this.hide();
            })
            .start();
    }

    // ==================== 编辑器工具 ====================

    /**
     * 设置立绘 SpriteFrame（供外部调用）
     */
    setPortraitSpriteFrame(position: PortraitPosition, spriteFrame: SpriteFrame | null): void {
        let targetNode: Node | null = null;

        switch (position) {
            case PortraitPosition.LEFT:
            case PortraitPosition.CENTER:
                targetNode = this.leftPortraitNode;
                break;
            case PortraitPosition.RIGHT:
                targetNode = this.rightPortraitNode;
                break;
        }

        if (targetNode) {
            const sprite = targetNode.getComponent(Sprite);
            if (sprite && spriteFrame) {
                sprite.spriteFrame = spriteFrame;
                targetNode.active = true;
            }
        }
    }

    /**
     * 根据角色ID和表情设置立绘
     * 配合 DialogLoader 使用
     */
    setPortraitByCharacter(characterId: string, emotion: EmotionType, position: PortraitPosition): void {
        const frame = dialogLoader.getPortraitFrame(characterId, emotion);
        if (frame) {
            this.setPortraitSpriteFrame(position, frame);
        } else {
            console.warn(`[DialogComponent] 未找到立绘: ${characterId}/${emotion}`);
        }
    }
}
