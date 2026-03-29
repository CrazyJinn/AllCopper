/**
 * 增强版对话系统
 * 支持 JSON 数据加载、表情立绘管理、双人对话显示
 */

import { eventSystem, GameEvent } from '../core/EventSystem';
import { gameManager } from '../core/GameManager';
import {
    EmotionType,
    PortraitPosition,
    PortraitAnimation,
    CharacterPortrait,
    DialogChoice,
    DialogLineData,
    DialogScriptData,
    DialogDisplayState,
    DialogEffect,
} from './DialogData';
import { portraitManager, PortraitManager } from './PortraitManager';

/** 对话事件类型 */
export enum DialogEventType {
    /** 对话开始 */
    DIALOG_STARTED = 'dialog_started',
    /** 对话结束 */
    DIALOG_ENDED = 'dialog_ended',
    /** 对话行切换 */
    LINE_CHANGED = 'line_changed',
    /** 打字机完成 */
    TYPEWRITER_COMPLETE = 'typewriter_complete',
    /** 选项出现 */
    CHOICES_APPEARED = 'choices_appeared',
    /** 选项选择 */
    CHOICE_SELECTED = 'choice_selected',
    /** 立绘变化 */
    PORTRAIT_CHANGED = 'portrait_changed',
    /** 特效触发 */
    EFFECT_TRIGGERED = 'effect_triggered',
}

/** 对话事件数据 */
export interface DialogEvent {
    type: DialogEventType;
    data?: any;
}

/** 对话回调接口 */
export interface DialogCallbacks {
    /** 显示文本回调 */
    onShowText?: (text: string, speakerName: string) => void;
    /** 更新立绘回调 */
    onUpdatePortrait?: (portraits: Map<string, CharacterPortrait>) => void;
    /** 显示选项回调 */
    onShowChoices?: (choices: DialogChoice[]) => void;
    /** 隐藏选项回调 */
    onHideChoices?: () => void;
    /** 播放特效回调 */
    onPlayEffect?: (effect: DialogEffect) => void;
    /** 对话开始回调 */
    onDialogStart?: (scriptId: string) => void;
    /** 对话结束回调 */
    onDialogEnd?: (scriptId: string) => void;
}

/**
 * 增强版对话系统
 */
export class EnhancedDialogSystem {
    /** 对话显示状态 */
    private state: DialogDisplayState;
    /** 已加载的对话脚本 */
    private loadedScripts: Map<string, DialogScriptData> = new Map();
    /** 打字机速度（字符/秒） */
    private typewriterSpeed: number = 30;
    /** 当前显示的立绘 */
    private displayedPortraits: Map<string, CharacterPortrait> = new Map();
    /** 回调函数 */
    private callbacks: DialogCallbacks = {};
    /** 事件监听器 */
    private eventListeners: Map<DialogEventType, Set<(event: DialogEvent) => void>> = new Map();

    constructor() {
        this.state = this.createInitialState();
    }

    /**
     * 创建初始状态
     */
    private createInitialState(): DialogDisplayState {
        return {
            currentScript: null,
            currentLineIndex: 0,
            currentLine: null,
            displayedPortraits: new Map(),
            history: [],
            isActive: false,
            waitingForChoice: false,
            typewriterProgress: 0,
            isTypewriting: false,
        };
    }

    // ==================== 脚本加载 ====================

    /**
     * 从 JSON 加载对话脚本
     */
    loadScriptFromJson(jsonData: DialogScriptData | string): boolean {
        try {
            const script = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

            // 验证脚本数据
            if (!this.validateScript(script)) {
                console.error('[DialogSystem] 脚本数据验证失败');
                return false;
            }

            this.loadedScripts.set(script.id, script);
            console.log(`[DialogSystem] 加载对话脚本: ${script.name} (${script.id})`);
            return true;
        } catch (error) {
            console.error('[DialogSystem] 解析 JSON 失败:', error);
            return false;
        }
    }

    /**
     * 批量加载脚本
     */
    loadScripts(scripts: (DialogScriptData | string)[]): void {
        scripts.forEach(script => this.loadScriptFromJson(script));
    }

    /**
     * 验证脚本数据
     */
    private validateScript(script: any): script is DialogScriptData {
        if (!script || typeof script !== 'object') return false;
        if (!script.id || typeof script.id !== 'string') return false;
        if (!script.name || typeof script.name !== 'string') return false;
        if (!Array.isArray(script.lines) || script.lines.length === 0) return false;
        if (!script.startLineId || typeof script.startLineId !== 'string') return false;

        // 验证起始对话存在
        const startLine = script.lines.find((line: any) => line.id === script.startLineId);
        if (!startLine) {
            console.error('[DialogSystem] 起始对话不存在:', script.startLineId);
            return false;
        }

        return true;
    }

    /**
     * 获取已加载的脚本
     */
    getLoadedScript(scriptId: string): DialogScriptData | undefined {
        return this.loadedScripts.get(scriptId);
    }

    /**
     * 卸载脚本
     */
    unloadScript(scriptId: string): void {
        this.loadedScripts.delete(scriptId);
    }

    // ==================== 对话控制 ====================

    /**
     * 开始对话
     */
    startDialog(scriptId: string): boolean {
        const script = this.loadedScripts.get(scriptId);
        if (!script) {
            console.error(`[DialogSystem] 脚本未加载: ${scriptId}`);
            return false;
        }

        // 重置状态
        this.state = this.createInitialState();
        this.state.currentScript = script;
        this.state.isActive = true;
        this.displayedPortraits.clear();

        // 查找起始对话
        const startLine = script.lines.find(line => line.id === script.startLineId);
        if (!startLine) {
            console.error(`[DialogSystem] 起始对话不存在: ${script.startLineId}`);
            return false;
        }

        // 设置当前对话
        this.setCurrentLine(startLine);

        // 进入对话状态
        gameManager.enterDialog(scriptId);

        // 触发事件
        this.emitEvent(DialogEventType.DIALOG_STARTED, { scriptId, script });
        this.callbacks.onDialogStart?.(scriptId);

        console.log(`[DialogSystem] 开始对话: ${script.name}`);
        return true;
    }

    /**
     * 设置当前对话行
     */
    private setCurrentLine(line: DialogLineData): void {
        this.state.currentLine = line;
        this.state.typewriterProgress = 0;
        this.state.isTypewriting = true;
        this.state.waitingForChoice = false;

        // 更新立绘显示
        this.updatePortraits(line);

        // 触发特效
        if (line.effects) {
            line.effects.forEach(effect => {
                this.callbacks.onPlayEffect?.(effect);
                this.emitEvent(DialogEventType.EFFECT_TRIGGERED, { effect });
            });
        }

        // 触发事件
        this.emitEvent(DialogEventType.LINE_CHANGED, { line });

        // 显示文本
        const speakerName = line.speakerName || this.getCharacterName(line.speakerId);
        this.callbacks.onShowText?.(line.text, speakerName);
    }

    /**
     * 更新立绘显示
     */
    private updatePortraits(line: DialogLineData): void {
        // 更新说话者立绘
        const speakerPortrait = portraitManager.getPortrait(
            line.speakerId,
            line.speakerEmotion || EmotionType.DEFAULT
        );

        if (speakerPortrait) {
            speakerPortrait.highlighted = true;
            this.displayedPortraits.set(line.speakerId, speakerPortrait);
        }

        // 更新听话者立绘
        if (line.listenerId) {
            const listenerPortrait = portraitManager.getPortrait(
                line.listenerId,
                line.listenerEmotion || EmotionType.DEFAULT
            );

            if (listenerPortrait) {
                listenerPortrait.highlighted = false;
                this.displayedPortraits.set(line.listenerId, listenerPortrait);
            }
        }

        // 回调更新
        this.callbacks.onUpdatePortrait?.(new Map(this.displayedPortraits));
        this.emitEvent(DialogEventType.PORTRAIT_CHANGED, {
            portraits: Array.from(this.displayedPortraits.values()),
        });
    }

    /**
     * 获取角色名称
     */
    private getCharacterName(characterId: string): string {
        const config = portraitManager.getCharacterConfig(characterId);
        return config?.name || characterId;
    }

    /**
     * 更新对话系统
     */
    update(deltaTime: number): void {
        if (!this.state.isActive || !this.state.currentLine) return;

        // 更新打字机效果
        if (this.state.isTypewriting) {
            this.state.typewriterProgress += this.typewriterSpeed * deltaTime;

            const textLength = this.state.currentLine.text.length;
            if (this.state.typewriterProgress >= textLength) {
                this.state.typewriterProgress = textLength;
                this.state.isTypewriting = false;

                // 触发打字机完成事件
                this.emitEvent(DialogEventType.TYPEWRITER_COMPLETE, {
                    text: this.state.currentLine.text,
                });

                // 检查是否有选项
                if (this.state.currentLine.choices && this.state.currentLine.choices.length > 0) {
                    this.showChoices(this.state.currentLine.choices);
                }
            }
        }

        // 处理自动继续
        if (
            !this.state.isTypewriting &&
            this.state.currentLine.autoContinue &&
            !this.state.waitingForChoice &&
            this.state.currentLine.autoContinueDelay
        ) {
            // 这里可以添加自动继续计时逻辑
        }
    }

    /**
     * 显示选项
     */
    private showChoices(choices: DialogChoice[]): void {
        this.state.waitingForChoice = true;
        this.callbacks.onShowChoices?.(choices);
        this.emitEvent(DialogEventType.CHOICES_APPEARED, { choices });
    }

    /**
     * 推进对话
     */
    advance(): void {
        if (!this.state.isActive || !this.state.currentLine) return;

        // 如果打字机效果未完成，直接显示全部
        if (this.state.isTypewriting) {
            this.state.typewriterProgress = this.state.currentLine.text.length;
            this.state.isTypewriting = false;

            // 检查是否有选项
            if (this.state.currentLine.choices && this.state.currentLine.choices.length > 0) {
                this.showChoices(this.state.currentLine.choices);
            }
            return;
        }

        // 如果正在等待选择，不处理
        if (this.state.waitingForChoice) {
            return;
        }

        // 检查当前行是否有选项但未显示（打字机完成后直接调用 advance 的情况）
        if (this.state.currentLine.choices && this.state.currentLine.choices.length > 0 && !this.state.waitingForChoice) {
            this.showChoices(this.state.currentLine.choices);
            return;
        }

        // 前进到下一段
        this.goToNext(this.state.currentLine.nextDialogId);
    }

    /**
     * 选择选项
     */
    selectChoice(choiceId: string): boolean {
        if (!this.state.waitingForChoice || !this.state.currentLine?.choices) {
            return false;
        }

        const choice = this.state.currentLine.choices.find(c => c.id === choiceId);
        if (!choice) {
            console.warn(`[DialogSystem] 选项不存在: ${choiceId}`);
            return false;
        }

        // 检查选项是否可用
        if (choice.enabled === false) {
            return false;
        }

        // 记录历史
        this.state.history.push({
            lineId: this.state.currentLine.id,
            choiceId,
            timestamp: Date.now(),
        });

        // 隐藏选项
        this.callbacks.onHideChoices?.();
        this.state.waitingForChoice = false;

        // 触发事件
        this.emitEvent(DialogEventType.CHOICE_SELECTED, {
            choiceId,
            choice,
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

        // 记录历史
        if (this.state.currentLine) {
            this.state.history.push({
                lineId: this.state.currentLine.id,
                timestamp: Date.now(),
            });
        }

        // 如果没有下一段，结束对话
        if (!nextDialogId) {
            this.endDialog();
            return;
        }

        // 查找下一段内容
        const nextLine = this.state.currentScript.lines.find(line => line.id === nextDialogId);
        if (!nextLine) {
            console.warn(`[DialogSystem] 对话不存在: ${nextDialogId}`);
            this.endDialog();
            return;
        }

        this.state.currentLineIndex++;
        this.setCurrentLine(nextLine);
    }

    /**
     * 跳转到指定对话
     */
    jumpToLine(lineId: string): boolean {
        if (!this.state.currentScript) return false;

        const line = this.state.currentScript.lines.find(l => l.id === lineId);
        if (!line) {
            console.warn(`[DialogSystem] 对话不存在: ${lineId}`);
            return false;
        }

        this.setCurrentLine(line);
        return true;
    }

    /**
     * 结束对话
     */
    endDialog(): void {
        const scriptId = this.state.currentScript?.id || '';
        const scriptName = this.state.currentScript?.name || '';

        console.log(`[DialogSystem] 结束对话: ${scriptName}`);

        this.state.isActive = false;
        this.state.currentLine = null;
        this.state.currentScript = null;
        this.displayedPortraits.clear();

        gameManager.exitDialog();

        // 触发事件
        this.emitEvent(DialogEventType.DIALOG_ENDED, { scriptId });
        this.callbacks.onDialogEnd?.(scriptId);
    }

    // ==================== 状态获取 ====================

    /**
     * 获取当前显示文本（考虑打字机效果）
     */
    getDisplayText(): string {
        if (!this.state.currentLine) return '';

        const text = this.state.currentLine.text;
        const length = Math.floor(this.state.typewriterProgress);

        return text.substring(0, length);
    }

    /**
     * 获取当前完整文本
     */
    getFullText(): string {
        return this.state.currentLine?.text || '';
    }

    /**
     * 获取当前说话者信息
     */
    getCurrentSpeaker(): {
        id: string;
        name: string;
        emotion: EmotionType;
        portrait: CharacterPortrait | null;
    } | null {
        if (!this.state.currentLine) return null;

        const line = this.state.currentLine;
        const name = line.speakerName || this.getCharacterName(line.speakerId);
        const portrait = this.displayedPortraits.get(line.speakerId) || null;

        return {
            id: line.speakerId,
            name,
            emotion: line.speakerEmotion || EmotionType.DEFAULT,
            portrait,
        };
    }

    /**
     * 获取当前选项
     */
    getCurrentChoices(): DialogChoice[] {
        return this.state.currentLine?.choices || [];
    }

    /**
     * 是否活动
     */
    isActive(): boolean {
        return this.state.isActive;
    }

    /**
     * 是否等待选择
     */
    isWaitingForChoice(): boolean {
        return this.state.waitingForChoice;
    }

    /**
     * 是否打字机完成
     */
    isTypewriterComplete(): boolean {
        return !this.state.isTypewriting;
    }

    /**
     * 获取当前显示的立绘
     */
    getDisplayedPortraits(): Map<string, CharacterPortrait> {
        return new Map(this.displayedPortraits);
    }

    /**
     * 获取对话历史
     */
    getHistory(): Array<{ lineId: string; choiceId?: string; timestamp: number }> {
        return [...this.state.history];
    }

    // ==================== 回调设置 ====================

    /**
     * 设置回调
     */
    setCallbacks(callbacks: DialogCallbacks): void {
        this.callbacks = { ...this.callbacks, ...callbacks };
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
        if (this.state.currentLine) {
            this.state.typewriterProgress = this.state.currentLine.text.length;
            this.state.isTypewriting = false;

            // 检查是否有选项
            if (this.state.currentLine.choices && this.state.currentLine.choices.length > 0) {
                this.showChoices(this.state.currentLine.choices);
            }
        }
    }

    // ==================== 事件系统 ====================

    /**
     * 添加事件监听
     */
    addEventListener(type: DialogEventType, listener: (event: DialogEvent) => void): void {
        if (!this.eventListeners.has(type)) {
            this.eventListeners.set(type, new Set());
        }
        this.eventListeners.get(type)!.add(listener);
    }

    /**
     * 移除事件监听
     */
    removeEventListener(type: DialogEventType, listener: (event: DialogEvent) => void): void {
        this.eventListeners.get(type)?.delete(listener);
    }

    /**
     * 触发事件
     */
    private emitEvent(type: DialogEventType, data?: any): void {
        const listeners = this.eventListeners.get(type);
        if (listeners) {
            const event: DialogEvent = { type, data };
            listeners.forEach(listener => listener(event));
        }
    }

    // ==================== 工具方法 ====================

    /**
     * 清除所有数据
     */
    clear(): void {
        this.state = this.createInitialState();
        this.displayedPortraits.clear();
        this.eventListeners.clear();
    }
}

/** 全局对话系统实例 */
export const enhancedDialogSystem = new EnhancedDialogSystem();
