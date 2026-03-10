/**
 * 对话管理器
 * 管理对话流程、状态、事件分发
 */

import { _decorator, EventTarget } from 'cc';
import {
    DialogConfig,
    DialogLine,
    DialogSpeaker,
    DialogState,
    DialogEventType,
    DialogEventData,
    DialogChoice,
    EmotionType,
    DEFAULT_TYPE_SPEED,
    DEFAULT_EMOTION,
    DialogPreloadAssets
} from '../data/DialogTypes';

/** 对话管理器事件目标 */
const dialogEventTarget = new EventTarget();

/**
 * 对话管理器单例类
 * 负责对话的启动、推进、状态管理
 */
export class DialogManager {
    private static _instance: DialogManager | null = null;

    /** 当前对话配置 */
    private _currentDialog: DialogConfig | null = null;

    /** 当前行索引 */
    private _currentLineIndex: number = -1;

    /** 当前状态 */
    private _state: DialogState = DialogState.IDLE;

    /** 当前说话者 */
    private _currentSpeaker: DialogSpeaker | null = null;

    /** 是否暂停 */
    private _isPaused: boolean = false;

    /** 打字速度 */
    private _typeSpeed: number = DEFAULT_TYPE_SPEED;

    /** 私有构造函数 */
    private constructor() {}

    /**
     * 获取单例实例
     */
    public static get instance(): DialogManager {
        if (!DialogManager._instance) {
            DialogManager._instance = new DialogManager();
        }
        return DialogManager._instance;
    }

    // ===================== 状态属性 =====================

    /** 获取当前状态 */
    public get state(): DialogState {
        return this._state;
    }

    /** 获取当前对话 */
    public get currentDialog(): DialogConfig | null {
        return this._currentDialog;
    }

    /** 获取当前行索引 */
    public get currentLineIndex(): number {
        return this._currentLineIndex;
    }

    /** 获取当前行 */
    public get currentLine(): DialogLine | null {
        if (!this._currentDialog || this._currentLineIndex < 0) {
            return null;
        }
        return this._currentDialog.lines[this._currentLineIndex] || null;
    }

    /** 获取当前说话者 */
    public get currentSpeaker(): DialogSpeaker | null {
        return this._currentSpeaker;
    }

    /** 是否正在对话中 */
    public get isInDialog(): boolean {
        return this._state !== DialogState.IDLE;
    }

    /** 获取打字速度 */
    public get typeSpeed(): number {
        return this._typeSpeed;
    }

    /** 设置打字速度 */
    public set typeSpeed(value: number) {
        this._typeSpeed = Math.max(1, value);
    }

    // ===================== 对话控制 =====================

    /**
     * 开始对话
     * @param dialog 对话配置
     */
    public startDialog(dialog: DialogConfig): boolean {
        if (this.isInDialog) {
            console.warn('[DialogManager] 已有对话进行中，无法开始新对话');
            return false;
        }

        if (!dialog.lines || dialog.lines.length === 0) {
            console.warn('[DialogManager] 对话内容为空');
            return false;
        }

        this._currentDialog = dialog;
        this._currentLineIndex = -1;
        this._typeSpeed = dialog.typeSpeed || DEFAULT_TYPE_SPEED;
        this._state = DialogState.WAITING;
        this._isPaused = false;

        // 发送对话开始事件
        this.emitEvent(DialogEventType.DIALOG_START, { dialogId: dialog.id });

        // 自动推进到第一行
        this.nextLine();

        return true;
    }

    /**
     * 推进到下一行
     */
    public nextLine(): boolean {
        if (!this._currentDialog) {
            return false;
        }

        // 检查是否在选择状态
        if (this._state === DialogState.CHOOSING) {
            return false;
        }

        // 检查是否暂停
        if (this._isPaused) {
            return false;
        }

        const nextIndex = this._currentLineIndex + 1;

        // 检查是否到达对话末尾
        if (nextIndex >= this._currentDialog.lines.length) {
            this.endDialog();
            return false;
        }

        this._currentLineIndex = nextIndex;
        const line = this._currentDialog.lines[nextIndex];

        // 处理延迟
        if (line.delay && line.delay > 0) {
            this._state = DialogState.PAUSED;
            setTimeout(() => {
                this._processLine(line);
            }, line.delay);
        } else {
            this._processLine(line);
        }

        return true;
    }

    /**
     * 处理单行对话
     */
    private _processLine(line: DialogLine): void {
        if (!this._currentDialog) return;

        // 更新说话者
        const speaker = this._currentDialog.speakers.find(
            s => s.characterId === line.speakerId
        );

        if (speaker) {
            const speakerChanged = this._currentSpeaker?.characterId !== speaker.characterId;
            this._currentSpeaker = speaker;

            if (speakerChanged) {
                this.emitEvent(DialogEventType.SPEAKER_CHANGE, { speaker });
            }
        }

        // 检查是否有过场动画
        if (line.cutscene) {
            this._state = DialogState.CUTSCENE;
            this.emitEvent(DialogEventType.LINE_START, {
                lineIndex: this._currentLineIndex,
                line
            });
            this.emitEvent(DialogEventType.CUTSCENE_START, {
                cutsceneId: line.cutscene
            });
            return;
        }

        // 设置状态为打字中
        this._state = DialogState.TYPING;

        // 发送行开始事件
        this.emitEvent(DialogEventType.LINE_START, {
            lineIndex: this._currentLineIndex,
            line
        });

        // 发送表情变化事件
        const emotion = line.emotion || DEFAULT_EMOTION;
        this.emitEvent(DialogEventType.EMOTION_CHANGE, { emotion });
    }

    /**
     * 打字完成回调
     */
    public onTypingComplete(): void {
        if (!this._currentDialog || this._currentLineIndex < 0) {
            return;
        }

        const line = this.currentLine;
        if (!line) return;

        this.emitEvent(DialogEventType.TYPE_COMPLETE, {
            lineIndex: this._currentLineIndex,
            line
        });

        // 检查是否有选项
        if (line.choices && line.choices.length > 0) {
            this._state = DialogState.CHOOSING;
            this.emitEvent(DialogEventType.CHOICES_SHOW, {
                lineIndex: this._currentLineIndex,
                line
            });
        } else {
            this._state = DialogState.WAITING;
        }
    }

    /**
     * 选择选项
     * @param choice 选择的选项
     */
    public selectChoice(choice: DialogChoice): void {
        if (this._state !== DialogState.CHOOSING) {
            return;
        }

        this.emitEvent(DialogEventType.CHOICE_SELECTED, { choice });

        // 处理跳转
        if (choice.jumpToDialog) {
            console.log(`[DialogManager] 跳转到对话: ${choice.jumpToDialog}`);
        }

        // 触发事件
        if (choice.triggerEvent) {
            console.log(`[DialogManager] 触发事件: ${choice.triggerEvent}`);
        }

        // 继续下一行
        this._state = DialogState.WAITING;
        this.nextLine();
    }

    /**
     * 过场动画完成回调
     */
    public onCutsceneComplete(): void {
        this.emitEvent(DialogEventType.CUTSCENE_END, {
            cutsceneId: this.currentLine?.cutscene
        });

        // 继续下一行
        this._state = DialogState.WAITING;
        this.nextLine();
    }

    /**
     * 跳过当前行
     */
    public skipCurrentLine(): void {
        if (!this._currentDialog || this._currentLineIndex < 0) {
            return;
        }

        if (!this._currentDialog.skippable) {
            return;
        }

        if (this._state === DialogState.TYPING) {
            this.onTypingComplete();
            return;
        }

        this.nextLine();
    }

    /**
     * 结束当前对话
     */
    public endDialog(): void {
        if (!this._currentDialog) {
            return;
        }

        const dialogId = this._currentDialog.id;
        const endEvent = this._currentDialog.onEndEvent;

        this.emitEvent(DialogEventType.DIALOG_END, { dialogId });

        if (endEvent) {
            console.log(`[DialogManager] 触发结束事件: ${endEvent}`);
        }

        // 重置状态
        this._currentDialog = null;
        this._currentLineIndex = -1;
        this._currentSpeaker = null;
        this._state = DialogState.IDLE;
        this._isPaused = false;
    }

    /**
     * 强制结束对话
     */
    public forceEnd(): void {
        if (this.isInDialog) {
            this.endDialog();
        }
    }

    /**
     * 暂停对话
     */
    public pause(): void {
        if (this.isInDialog && !this._isPaused) {
            this._isPaused = true;
            this._state = DialogState.PAUSED;
        }
    }

    /**
     * 恢复对话
     */
    public resume(): void {
        if (this._isPaused) {
            this._isPaused = false;
            this._state = DialogState.WAITING;
        }
    }

    // ===================== 事件系统 =====================

    /**
     * 注册事件监听
     */
    public on(eventType: DialogEventType, callback: (data: DialogEventData) => void, target?: any): void {
        dialogEventTarget.on(eventType, callback, target);
    }

    /**
     * 取消事件监听
     */
    public off(eventType: DialogEventType, callback: (data: DialogEventData) => void, target?: any): void {
        dialogEventTarget.off(eventType, callback, target);
    }

    /**
     * 发送事件
     */
    private emitEvent(type: DialogEventType, data: Partial<DialogEventData>): void {
        const eventData: DialogEventData = {
            type,
            ...data
        };
        dialogEventTarget.emit(type, eventData);
    }

    // ===================== 工具方法 =====================

    /**
     * 获取对话所需预加载的资源列表
     */
    public getPreloadAssets(dialog: DialogConfig): DialogPreloadAssets {
        const assets: DialogPreloadAssets = {
            portraits: [],
            emotionGifs: [],
            backgrounds: [],
            videos: [],
            audios: []
        };

        for (const speaker of dialog.speakers) {
            if (speaker.portrait) {
                assets.portraits.push(speaker.portrait);
            }
            for (const emotion of Object.values(speaker.emotionGifs)) {
                if (emotion) {
                    assets.emotionGifs.push(emotion);
                }
            }
        }

        if (dialog.background) {
            assets.backgrounds.push(dialog.background);
        }

        for (const line of dialog.lines) {
            if (line.cutscene) {
                assets.videos.push(line.cutscene);
            }
            if (line.voice) {
                assets.audios.push(line.voice);
            }
        }

        if (dialog.bgm) {
            assets.audios.push(dialog.bgm);
        }

        return assets;
    }

    /**
     * 根据阵营获取站位
     */
    public getPositionByFaction(faction: string): 'left' | 'right' {
        return faction === 'tech' ? 'left' : 'right';
    }
}
