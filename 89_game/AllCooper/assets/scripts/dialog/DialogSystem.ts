/**
 * 对话系统
 * 管理剧情对话、NPC交互
 */

import { eventSystem, GameEvent } from '../core/EventSystem';
import { gameManager } from '../core/GameManager';
import { EmotionType, DialogConfig, Faction } from '../core/GameConfig';

/** 对话选项 */
export interface DialogChoice {
    /** 选项ID */
    id: string;
    /** 选项文本 */
    text: string;
    /** 下一段对话ID */
    nextDialogId: string;
    /** 条件（可选） */
    condition?: string;
}

/** 对话内容 */
export interface DialogContent {
    /** 对话ID */
    id: string;
    /** 说话角色ID */
    speakerId: string;
    /** 说话角色名 */
    speakerName: string;
    /** 角色阵营 */
    speakerFaction: Faction;
    /** 对话文本 */
    text: string;
    /** 表情 */
    emotion: EmotionType;
    /** 对话选项（可选） */
    choices?: DialogChoice[];
    /** 下一段对话ID（无选项时使用） */
    nextDialogId?: string;
    /** 触发的过场动画ID（可选） */
    cutsceneId?: string;
    /** 触发的任务ID（可选） */
    questId?: string;
}

/** 对话脚本 */
export interface DialogScript {
    /** 脚本ID */
    id: string;
    /** 脚本名称 */
    name: string;
    /** 对话内容列表 */
    contents: DialogContent[];
    /** 起始对话ID */
    startContentId: string;
}

/** 对话状态 */
export interface DialogState {
    /** 当前脚本 */
    currentScript: DialogScript | null;
    /** 当前内容索引 */
    currentIndex: number;
    /** 当前内容 */
    currentContent: DialogContent | null;
    /** 对话历史 */
    history: {
        contentId: string;
        choiceId?: string;
    }[];
    /** 是否活动 */
    isActive: boolean;
}

/**
 * 对话系统类
 */
export class DialogSystem {
    /** 对话状态 */
    private state: DialogState;
    /** 已注册的对话脚本 */
    private scripts: Map<string, DialogScript> = new Map();
    /** 打字机效果进度 */
    private typewriterProgress: number = 0;
    /** 打字机速度（字符/秒） */
    private typewriterSpeed: number = 30;
    /** 是否正在显示打字机效果 */
    private isTypewriting: boolean = false;

    /** 立绘位置映射 */
    private portraitPositions: Map<string, 'left' | 'right'> = new Map();

    constructor() {
        this.state = {
            currentScript: null,
            currentIndex: 0,
            currentContent: null,
            history: [],
            isActive: false,
        };
    }

    /**
     * 注册对话脚本
     */
    registerScript(script: DialogScript): void {
        this.scripts.set(script.id, script);
    }

    /**
     * 开始对话
     */
    startDialog(scriptId: string): boolean {
        const script = this.scripts.get(scriptId);
        if (!script) {
            console.error(`[DialogSystem] 对话脚本不存在: ${scriptId}`);
            return false;
        }

        this.state.currentScript = script;
        this.state.currentIndex = 0;
        this.state.history = [];
        this.state.isActive = true;

        // 找到起始内容
        const startContent = script.contents.find(c => c.id === script.startContentId);
        if (startContent) {
            this.state.currentContent = startContent;
        } else if (script.contents.length > 0) {
            this.state.currentContent = script.contents[0];
        }

        // 重置打字机
        this.typewriterProgress = 0;
        this.isTypewriting = true;

        // 进入对话状态
        gameManager.enterDialog(scriptId);

        // 更新立绘位置
        this.updatePortraitPosition(this.state.currentContent);

        console.log(`[DialogSystem] 开始对话: ${script.name}`);
        return true;
    }

    /**
     * 更新立绘位置
     */
    private updatePortraitPosition(content: DialogContent | null): void {
        if (!content) return;

        const speakerId = content.speakerId;
        const faction = content.speakerFaction;

        // 根据阵营决定位置
        if (!this.portraitPositions.has(speakerId)) {
            const position = faction === Faction.TECH ? 'left' : 'right';
            this.portraitPositions.set(speakerId, position);
        }
    }

    /**
     * 更新对话系统
     */
    update(deltaTime: number): void {
        if (!this.state.isActive || !this.state.currentContent) return;

        // 更新打字机效果
        if (this.isTypewriting) {
            this.typewriterProgress += this.typewriterSpeed * deltaTime;

            const textLength = this.state.currentContent.text.length;
            if (this.typewriterProgress >= textLength) {
                this.typewriterProgress = textLength;
                this.isTypewriting = false;
            }
        }
    }

    /**
     * 推进对话
     */
    advance(): void {
        if (!this.state.isActive || !this.state.currentContent) return;

        // 如果打字机效果未完成，直接显示全部
        if (this.isTypewriting) {
            this.typewriterProgress = this.state.currentContent.text.length;
            this.isTypewriting = false;
            return;
        }

        // 记录历史
        this.state.history.push({
            contentId: this.state.currentContent.id,
        });

        // 检查是否有选项
        if (this.state.currentContent.choices && this.state.currentContent.choices.length > 0) {
            // 等待玩家选择
            return;
        }

        // 检查是否有触发过场动画
        if (this.state.currentContent.cutsceneId) {
            this.playCutscene(this.state.currentContent.cutsceneId);
            return;
        }

        // 前进到下一段
        this.goToNext(this.state.currentContent.nextDialogId);
    }

    /**
     * 选择选项
     */
    selectChoice(choiceId: string): boolean {
        if (!this.state.currentContent?.choices) return false;

        const choice = this.state.currentContent.choices.find(c => c.id === choiceId);
        if (!choice) return false;

        // 记录选择
        this.state.history[this.state.history.length - 1].choiceId = choiceId;

        // 触发事件
        eventSystem.emit(GameEvent.DIALOG_CHOICE_MADE, {
            dialogId: this.state.currentContent.id,
            choiceId,
        });

        // 前进到下一段
        this.goToNext(choice.nextDialogId);
        return true;
    }

    /**
     * 前进到指定对话
     */
    private goToNext(nextDialogId?: string): void {
        if (!this.state.currentScript) return;

        // 如果没有下一段，结束对话
        if (!nextDialogId) {
            this.endDialog();
            return;
        }

        // 查找下一段内容
        const nextContent = this.state.currentScript.contents.find(c => c.id === nextDialogId);
        if (!nextContent) {
            console.warn(`[DialogSystem] 对话内容不存在: ${nextDialogId}`);
            this.endDialog();
            return;
        }

        this.state.currentContent = nextContent;
        this.state.currentIndex++;

        // 重置打字机
        this.typewriterProgress = 0;
        this.isTypewriting = true;

        // 更新立绘位置
        this.updatePortraitPosition(nextContent);
    }

    /**
     * 播放过场动画
     */
    private playCutscene(cutsceneId: string): void {
        console.log(`[DialogSystem] 播放过场动画: ${cutsceneId}`);
        gameManager.enterCutscene();

        // 实际实现需要调用视频播放组件
        // 播放完成后调用 onCutsceneComplete
    }

    /**
     * 过场动画播放完成
     */
    onCutsceneComplete(): void {
        gameManager.exitCutscene();

        if (this.state.currentContent) {
            this.goToNext(this.state.currentContent.nextDialogId);
        }
    }

    /**
     * 结束对话
     */
    endDialog(): void {
        const scriptName = this.state.currentScript?.name || '';
        console.log(`[DialogSystem] 结束对话: ${scriptName}`);

        this.state.currentScript = null;
        this.state.currentContent = null;
        this.state.isActive = false;

        gameManager.exitDialog();
        eventSystem.emit(GameEvent.DIALOG_ENDED);
    }

    /**
     * 获取当前显示文本（考虑打字机效果）
     */
    getDisplayText(): string {
        if (!this.state.currentContent) return '';

        const text = this.state.currentContent.text;
        const length = Math.floor(this.typewriterProgress);

        return text.substring(0, length);
    }

    /**
     * 获取当前说话者信息
     */
    getCurrentSpeaker(): {
        id: string;
        name: string;
        faction: Faction;
        emotion: EmotionType;
        position: 'left' | 'right';
    } | null {
        if (!this.state.currentContent) return null;

        const content = this.state.currentContent;
        const position = this.portraitPositions.get(content.speakerId) || 'left';

        return {
            id: content.speakerId,
            name: content.speakerName,
            faction: content.speakerFaction,
            emotion: content.emotion,
            position,
        };
    }

    /**
     * 获取当前选项
     */
    getCurrentChoices(): DialogChoice[] {
        return this.state.currentContent?.choices || [];
    }

    /**
     * 是否有选项
     */
    hasChoices(): boolean {
        return (this.state.currentContent?.choices?.length || 0) > 0;
    }

    /**
     * 是否活动
     */
    isActive(): boolean {
        return this.state.isActive;
    }

    /**
     * 是否打字机效果完成
     */
    isTypewriterComplete(): boolean {
        return !this.isTypewriting;
    }

    /**
     * 设置打字机速度
     */
    setTypewriterSpeed(speed: number): void {
        this.typewriterSpeed = speed;
    }

    /**
     * 跳过打字机效果
     */
    skipTypewriter(): void {
        if (this.state.currentContent) {
            this.typewriterProgress = this.state.currentContent.text.length;
            this.isTypewriting = false;
        }
    }
}
