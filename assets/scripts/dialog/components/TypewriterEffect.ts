/**
 * 打字机效果组件
 * 实现文字逐字显示的打字机效果
 */

import { _decorator, Component, Label } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 打字机效果组件
 * 挂载在包含Label组件的节点上使用
 */
@ccclass('TypewriterEffect')
export class TypewriterEffect extends Component {
    @property(Label)
    targetLabel: Label | null = null;

    /** 打字速度（字符/秒） */
    @property({ min: 1, max: 100 })
    typeSpeed: number = 30;

    /** 是否启用光标闪烁 */
    @property
    enableCursor: boolean = false;

    /** 光标字符 */
    @property({
        visible: function (this: TypewriterEffect) {
            return this.enableCursor;
        }
    })
    cursorChar: string = '▌';

    /** 完整文本 */
    private _fullText: string = '';

    /** 当前显示的文本 */
    private _displayText: string = '';

    /** 当前字符索引 */
    private _charIndex: number = 0;

    /** 是否正在打字 */
    private _isTyping: boolean = false;

    /** 是否已完成 */
    private _isComplete: boolean = true;

    /** 打字计时器 */
    private _typeTimer: number = 0;

    /** 完成回调 */
    private _onComplete: (() => void) | null = null;

    /** 逐字回调 */
    private _onChar: ((char: string, index: number) => void) | null = null;

    // ===================== 生命周期 =====================

    protected onLoad(): void {
        if (!this.targetLabel) {
            this.targetLabel = this.getComponent(Label);
        }
    }

    protected update(dt: number): void {
        if (!this._isTyping || !this.targetLabel) {
            return;
        }

        this._typeTimer += dt;

        const interval = 1 / this.typeSpeed;

        while (this._typeTimer >= interval && this._charIndex < this._fullText.length) {
            this._typeTimer -= interval;
            this._displayNextChar();
        }

        if (this._charIndex >= this._fullText.length) {
            this._onTypingComplete();
        }
    }

    // ===================== 公共方法 =====================

    /**
     * 开始打字效果
     * @param text 要显示的文本
     * @param onComplete 完成回调（可选）
     */
    public startTyping(text: string, onComplete?: () => void): void {
        this._fullText = text;
        this._displayText = '';
        this._charIndex = 0;
        this._isTyping = true;
        this._isComplete = false;
        this._typeTimer = 0;
        this._onComplete = onComplete || null;

        if (this.targetLabel) {
            this.targetLabel.string = this.enableCursor ? this.cursorChar : '';
        }
    }

    /**
     * 立即显示全部文本
     */
    public showAll(): void {
        if (this._isComplete) {
            return;
        }

        this._displayText = this._fullText;
        this._charIndex = this._fullText.length;

        if (this.targetLabel) {
            this.targetLabel.string = this._displayText;
        }

        this._onTypingComplete();
    }

    /**
     * 停止打字效果
     */
    public stop(): void {
        this._isTyping = false;
        this._isComplete = true;
    }

    /**
     * 重置状态
     */
    public reset(): void {
        this._fullText = '';
        this._displayText = '';
        this._charIndex = 0;
        this._isTyping = false;
        this._isComplete = true;
        this._typeTimer = 0;
        this._onComplete = null;
        this._onChar = null;

        if (this.targetLabel) {
            this.targetLabel.string = '';
        }
    }

    /**
     * 设置逐字回调
     */
    public setOnCharCallback(callback: (char: string, index: number) => void): void {
        this._onChar = callback;
    }

    /**
     * 获取当前进度 (0-1)
     */
    public get progress(): number {
        if (this._fullText.length === 0) return 1;
        return this._charIndex / this._fullText.length;
    }

    /**
     * 是否正在打字
     */
    public get isTyping(): boolean {
        return this._isTyping;
    }

    /**
     * 是否已完成
     */
    public get isComplete(): boolean {
        return this._isComplete;
    }

    // ===================== 私有方法 =====================

    /**
     * 显示下一个字符
     */
    private _displayNextChar(): void {
        if (this._charIndex >= this._fullText.length) {
            return;
        }

        const char = this._fullText[this._charIndex];
        this._displayText += char;
        this._charIndex++;

        if (this.targetLabel) {
            let displayString = this._displayText;
            if (this.enableCursor) {
                displayString += this.cursorChar;
            }
            this.targetLabel.string = displayString;
        }

        if (this._onChar) {
            this._onChar(char, this._charIndex - 1);
        }
    }

    /**
     * 打字完成处理
     */
    private _onTypingComplete(): void {
        this._isTyping = false;
        this._isComplete = true;

        if (this.targetLabel && this.enableCursor) {
            this.targetLabel.string = this._displayText;
        }

        if (this._onComplete) {
            this._onComplete();
        }
    }
}
