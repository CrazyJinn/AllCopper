/**
 * 简化版对话系统
 * 纯剧情推进，无选项
 */

import {
    DialogScriptData,
    DialogLineData,
    CharacterPortrait,
    EmotionType,
    DefaultEmotion,
} from './DialogData';
import { portraitManager } from './PortraitManager';

/** 对话状态 */
interface DialogState {
    script: DialogScriptData | null;
    currentLine: DialogLineData | null;
    isActive: boolean;
    typewriterProgress: number;
    isTypewriting: boolean;
}

/** 对话回调 */
export interface DialogCallbacks {
    onShowText?: (text: string, speakerName: string) => void;
    onUpdatePortraits?: (portraits: Map<string, CharacterPortrait>) => void;
    onDialogStart?: (scriptId: string) => void;
    onDialogEnd?: (scriptId: string) => void;
    onTypewriterComplete?: () => void;
}

/**
 * 简化版对话系统
 */
export class SimpleDialogSystem {
    private state: DialogState;
    private callbacks: DialogCallbacks = {};
    private loadedScripts: Map<string, DialogScriptData> = new Map();
    private displayedPortraits: Map<string, CharacterPortrait> = new Map();
    private typewriterSpeed: number = 30;

    constructor() {
        this.state = this.createState();
    }

    private createState(): DialogState {
        return {
            script: null,
            currentLine: null,
            isActive: false,
            typewriterProgress: 0,
            isTypewriting: false,
        };
    }

    // ==================== 脚本管理 ====================

    /** 加载脚本 */
    loadScript(script: DialogScriptData): boolean {
        if (!script?.id || !script?.lines?.length) {
            console.error('[Dialog] 无效脚本');
            return false;
        }
        this.loadedScripts.set(script.id, script);
        return true;
    }

    /** 从 JSON 字符串加载 */
    loadScriptFromJson(json: string): boolean {
        try {
            const script = JSON.parse(json);
            return this.loadScript(script);
        } catch (e) {
            console.error('[Dialog] JSON 解析失败:', e);
            return false;
        }
    }

    /** 卸载脚本 */
    unloadScript(scriptId: string): void {
        this.loadedScripts.delete(scriptId);
    }

    // ==================== 对话控制 ====================

    /** 开始对话 */
    start(scriptId: string): boolean {
        const script = this.loadedScripts.get(scriptId);
        if (!script) {
            console.error(`[Dialog] 脚本未加载: ${scriptId}`);
            return false;
        }

        this.state = this.createState();
        this.state.script = script;
        this.state.isActive = true;
        this.displayedPortraits.clear();

        const startLine = script.lines.find(l => l.id === script.startLineId) || script.lines[0];
        this.setLine(startLine);

        this.callbacks.onDialogStart?.(scriptId);
        return true;
    }

    /** 设置当前对话行 */
    private setLine(line: DialogLineData): void {
        this.state.currentLine = line;
        this.state.typewriterProgress = 0;
        this.state.isTypewriting = true;

        this.updatePortraits(line);

        const name = line.speakerName || this.getCharName(line.speakerId);
        this.callbacks.onShowText?.(line.text, name);
    }

    /** 更新立绘 */
    private updatePortraits(line: DialogLineData): void {
        console.log(`[SimpleDialogSystem] updatePortraits: speakerId=${line.speakerId}, speakerEmotion=${line.speakerEmotion}, listenerId=${line.listenerId}, listenerEmotion=${line.listenerEmotion}`);

        // 说话者
        const speaker = portraitManager.getPortrait(line.speakerId, line.speakerEmotion || DefaultEmotion);
        console.log(`[SimpleDialogSystem] 说话者立绘: ${speaker ? `找到(name=${speaker.name}, position=${speaker.position})` : '未找到'}`);
        if (speaker) {
            speaker.highlighted = true;
            this.displayedPortraits.set(line.speakerId, speaker);
        }

        // 听话者
        if (line.listenerId) {
            const listener = portraitManager.getPortrait(line.listenerId, line.listenerEmotion || DefaultEmotion);
            console.log(`[SimpleDialogSystem] 听话者立绘: ${listener ? `找到(name=${listener.name}, position=${listener.position})` : '未找到'}`);
            if (listener) {
                listener.highlighted = false;
                this.displayedPortraits.set(line.listenerId, listener);
            }
        }

        console.log(`[SimpleDialogSystem] displayedPortraits 数量: ${this.displayedPortraits.size}, 即将调用 onUpdatePortraits 回调`);
        this.callbacks.onUpdatePortraits?.(new Map(this.displayedPortraits));
    }

    private getCharName(id: string): string {
        return portraitManager.getConfig(id)?.name || id;
    }

    /** 每帧更新 */
    update(dt: number): void {
        if (!this.state.isActive || !this.state.currentLine || !this.state.isTypewriting) return;

        this.state.typewriterProgress += this.typewriterSpeed * dt;

        if (this.state.typewriterProgress >= this.state.currentLine.text.length) {
            this.state.typewriterProgress = this.state.currentLine.text.length;
            this.state.isTypewriting = false;
            this.callbacks.onTypewriterComplete?.();
        }
    }

    /** 推进对话 */
    advance(): void {
        if (!this.state.isActive) return;

        // 打字机未完成则跳过
        if (this.state.isTypewriting) {
            this.skipTypewriter();
            return;
        }

        // 进入下一段
        this.next();
    }

    private skipTypewriter(): void {
        if (!this.state.currentLine) return;
        this.state.typewriterProgress = this.state.currentLine.text.length;
        this.state.isTypewriting = false;
        this.callbacks.onTypewriterComplete?.();
    }

    private next(): void {
        if (!this.state.script || !this.state.currentLine) {
            this.end();
            return;
        }

        const nextId = this.state.currentLine.nextDialogId;
        if (!nextId) {
            this.end();
            return;
        }

        const nextLine = this.state.script.lines.find(l => l.id === nextId);
        if (!nextLine) {
            this.end();
            return;
        }

        this.setLine(nextLine);
    }

    /** 结束对话 */
    end(): void {
        const id = this.state.script?.id || '';
        this.state.isActive = false;
        this.state.currentLine = null;
        this.state.script = null;
        this.displayedPortraits.clear();
        this.callbacks.onDialogEnd?.(id);
    }

    // ==================== 状态获取 ====================

    getDisplayText(): string {
        if (!this.state.currentLine) return '';
        return this.state.currentLine.text.substring(0, Math.floor(this.state.typewriterProgress));
    }

    getFullText(): string {
        return this.state.currentLine?.text || '';
    }

    getSpeaker(): { id: string; name: string; emotion: EmotionType } | null {
        if (!this.state.currentLine) return null;
        return {
            id: this.state.currentLine.speakerId,
            name: this.state.currentLine.speakerName || this.getCharName(this.state.currentLine.speakerId),
            emotion: this.state.currentLine.speakerEmotion || DefaultEmotion,
        };
    }

    getPortraits(): Map<string, CharacterPortrait> {
        return new Map(this.displayedPortraits);
    }

    get isActive(): boolean {
        return this.state.isActive;
    }

    get isTypewriterComplete(): boolean {
        return !this.state.isTypewriting;
    }

    // ==================== 配置 ====================

    setCallbacks(cb: DialogCallbacks): void {
        this.callbacks = { ...this.callbacks, ...cb };
    }

    setTypewriterSpeed(speed: number): void {
        this.typewriterSpeed = speed;
    }

    clear(): void {
        this.state = this.createState();
        this.displayedPortraits.clear();
    }
}

export const simpleDialogSystem = new SimpleDialogSystem();
