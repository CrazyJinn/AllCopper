/**
 * 过场动画播放器组件
 * 管理MP4视频的播放、跳过、字幕显示
 */

import {
    _decorator,
    Component,
    Node,
    VideoPlayer,
    Label,
    resources,
    tween,
    UIOpacity,
    input,
    Input,
    KeyCode,
    EventKeyboard,
    SpriteFrame
} from 'cc';
import { CutsceneConfig, SubtitleConfig } from '../data/DialogTypes';

const { ccclass, property } = _decorator;

/** 过场动画状态 */
enum CutsceneState {
    IDLE = 'idle',
    LOADING = 'loading',
    PLAYING = 'playing',
    PAUSED = 'paused',
    ENDED = 'ended'
}

/**
 * 过场动画播放器
 */
@ccclass('CutscenePlayer')
export class CutscenePlayer extends Component {
    @property(VideoPlayer)
    videoPlayer: VideoPlayer | null = null;

    @property(Label)
    subtitleLabel: Label | null = null;

    @property(Node)
    skipHintNode: Node | null = null;

    @property(Label)
    skipHintLabel: Label | null = null;

    private _skippable: boolean = true;
    private _skipKey: KeyCode = KeyCode.SPACE;
    private _subtitles: SubtitleConfig[] = [];
    private _currentSubtitleIndex: number = -1;
    private _state: CutsceneState = CutsceneState.IDLE;
    private _onComplete: (() => void) | null = null;
    private _duration: number = 0;
    private _currentTime: number = 0;
    private _skipHintVisible: boolean = false;

    // ===================== 生命周期 =====================

    protected onLoad(): void {
        input.on(Input.EventType.KEY_DOWN, this._onKeyDown, this);

        if (this.videoPlayer) {
            this.videoPlayer.node.on(VideoPlayer.EventType.READY_TO_PLAY, this._onVideoReady, this);
            this.videoPlayer.node.on(VideoPlayer.EventType.STARTED, this._onVideoStarted, this);
            this.videoPlayer.node.on(VideoPlayer.EventType.COMPLETED, this._onVideoCompleted, this);
        }

        if (this.skipHintNode) {
            this.skipHintNode.active = false;
        }

        if (this.subtitleLabel) {
            this.subtitleLabel.node.active = false;
        }
    }

    protected onDestroy(): void {
        input.off(Input.EventType.KEY_DOWN, this._onKeyDown, this);

        if (this.videoPlayer) {
            this.videoPlayer.node.off(VideoPlayer.EventType.READY_TO_PLAY, this._onVideoReady, this);
            this.videoPlayer.node.off(VideoPlayer.EventType.STARTED, this._onVideoStarted, this);
            this.videoPlayer.node.off(VideoPlayer.EventType.COMPLETED, this._onVideoCompleted, this);
        }
    }

    protected update(dt: number): void {
        if (this._state !== CutsceneState.PLAYING) return;

        if (this.videoPlayer) {
            this._currentTime = this.videoPlayer.currentTime;
        }

        this._updateSubtitles();
    }

    // ===================== 公共方法 =====================

    /**
     * 播放过场动画
     */
    public play(config: CutsceneConfig, onComplete?: () => void): void {
        if (!this.videoPlayer) {
            console.warn('[CutscenePlayer] VideoPlayer未设置');
            if (onComplete) onComplete();
            return;
        }

        this._skippable = config.skippable !== false;
        this._skipKey = this._parseSkipKey(config.skipKey) || KeyCode.SPACE;
        this._subtitles = config.subtitles || [];
        this._currentSubtitleIndex = -1;
        this._onComplete = onComplete || null;
        this._state = CutsceneState.LOADING;
        this._currentTime = 0;

        // 设置视频资源
        this.videoPlayer.remoteURL = '';
        this.videoPlayer.resource = null;

        resources.load(config.videoPath, (err: any) => {
            if (err) {
                this.videoPlayer!.remoteURL = config.videoPath;
            }
        });

        this.node.active = true;

        if (this._skippable && this.skipHintNode) {
            this._showSkipHint();
        }
    }

    /**
     * 暂停播放
     */
    public pause(): void {
        if (this._state !== CutsceneState.PLAYING) return;

        if (this.videoPlayer) {
            this.videoPlayer.pause();
        }
        this._state = CutsceneState.PAUSED;
    }

    /**
     * 恢复播放
     */
    public resume(): void {
        if (this._state !== CutsceneState.PAUSED) return;

        if (this.videoPlayer) {
            this.videoPlayer.play();
        }
        this._state = CutsceneState.PLAYING;
    }

    /**
     * 停止播放
     */
    public stop(): void {
        if (this.videoPlayer) {
            this.videoPlayer.stop();
        }
        this._state = CutsceneState.ENDED;
        this._hideSkipHint();
        this._hideSubtitle();
    }

    /**
     * 跳过过场动画
     */
    public skip(): void {
        if (!this._skippable) return;

        this.stop();

        if (this._onComplete) {
            this._onComplete();
        }
    }

    /**
     * 获取当前状态
     */
    public get state(): CutsceneState {
        return this._state;
    }

    /**
     * 获取播放进度 (0-1)
     */
    public get progress(): number {
        if (this._duration <= 0) return 0;
        return this._currentTime / this._duration;
    }

    // ===================== 私有方法 =====================

    private _onVideoReady(): void {
        if (this.videoPlayer) {
            this._duration = this.videoPlayer.duration;
            this.videoPlayer.play();
        }
    }

    private _onVideoStarted(): void {
        this._state = CutsceneState.PLAYING;
    }

    private _onVideoCompleted(): void {
        this._state = CutsceneState.ENDED;
        this._hideSkipHint();
        this._hideSubtitle();

        if (this._onComplete) {
            this._onComplete();
        }
    }

    private _onKeyDown(event: EventKeyboard): void {
        if (this._state !== CutsceneState.PLAYING) return;

        if (event.keyCode === this._skipKey && this._skippable) {
            this.skip();
        }
    }

    private _parseSkipKey(key?: string): KeyCode | null {
        if (!key) return null;

        const keyMap: Record<string, KeyCode> = {
            'space': KeyCode.SPACE,
            'enter': KeyCode.ENTER,
            'escape': KeyCode.ESCAPE,
            'esc': KeyCode.ESCAPE
        };

        return keyMap[key.toLowerCase()] || null;
    }

    private _updateSubtitles(): void {
        if (this._subtitles.length === 0) return;

        const time = this._currentTime;

        let foundIndex = -1;
        for (let i = 0; i < this._subtitles.length; i++) {
            const sub = this._subtitles[i];
            if (time >= sub.startTime && time <= sub.endTime) {
                foundIndex = i;
                break;
            }
        }

        if (foundIndex !== this._currentSubtitleIndex) {
            this._currentSubtitleIndex = foundIndex;

            if (foundIndex >= 0) {
                this._showSubtitle(this._subtitles[foundIndex].text);
            } else {
                this._hideSubtitle();
            }
        }
    }

    private _showSubtitle(text: string): void {
        if (!this.subtitleLabel) return;

        this.subtitleLabel.string = text;
        this.subtitleLabel.node.active = true;

        const opacity = this.subtitleLabel.node.getComponent(UIOpacity);
        if (opacity) {
            opacity.opacity = 0;
            tween(opacity)
                .to(0.2, { opacity: 255 })
                .start();
        }
    }

    private _hideSubtitle(): void {
        if (!this.subtitleLabel) return;

        const opacity = this.subtitleLabel.node.getComponent(UIOpacity);
        if (opacity) {
            tween(opacity)
                .to(0.2, { opacity: 0 })
                .call(() => {
                    this.subtitleLabel!.node.active = false;
                })
                .start();
        } else {
            this.subtitleLabel.node.active = false;
        }
    }

    private _showSkipHint(): void {
        if (!this.skipHintNode || this._skipHintVisible) return;

        this._skipHintVisible = true;
        this.skipHintNode.active = true;

        if (this.skipHintLabel) {
            const keyName = this._getKeyName(this._skipKey);
            this.skipHintLabel.string = `按 ${keyName} 跳过`;
        }

        const opacity = this.skipHintNode.getComponent(UIOpacity);
        if (opacity) {
            opacity.opacity = 0;
            tween(opacity)
                .to(0.3, { opacity: 255 })
                .start();
        }

        this._blinkSkipHint();
    }

    private _hideSkipHint(): void {
        if (!this.skipHintNode) return;

        this._skipHintVisible = false;

        const opacity = this.skipHintNode.getComponent(UIOpacity);
        if (opacity) {
            tween(opacity)
                .to(0.3, { opacity: 0 })
                .call(() => {
                    this.skipHintNode!.active = false;
                })
                .start();
        } else {
            this.skipHintNode.active = false;
        }
    }

    private _blinkSkipHint(): void {
        if (!this.skipHintNode || !this._skipHintVisible) return;

        const opacity = this.skipHintNode.getComponent(UIOpacity);
        if (opacity) {
            tween(opacity)
                .to(0.5, { opacity: 150 })
                .to(0.5, { opacity: 255 })
                .call(() => this._blinkSkipHint())
                .start();
        }
    }

    private _getKeyName(keyCode: KeyCode): string {
        const keyNames: Record<number, string> = {
            [KeyCode.SPACE]: '空格',
            [KeyCode.ENTER]: '回车',
            [KeyCode.ESCAPE]: 'ESC'
        };
        return keyNames[keyCode] || '任意键';
    }
}

/**
 * 过场动画管理器
 */
@ccclass('CutsceneManager')
export class CutsceneManager extends Component {
    @property(CutscenePlayer)
    player: CutscenePlayer | null = null;

    private _cutsceneCache: Map<string, CutsceneConfig> = new Map();
    private _currentCutsceneId: string | null = null;

    /**
     * 注册过场动画配置
     */
    public registerCutscene(config: CutsceneConfig): void {
        this._cutsceneCache.set(config.id, config);
    }

    /**
     * 播放过场动画
     */
    public play(cutsceneId: string | CutsceneConfig, onComplete?: () => void): void {
        if (!this.player) {
            console.warn('[CutsceneManager] Player未设置');
            if (onComplete) onComplete();
            return;
        }

        let config: CutsceneConfig | undefined;

        if (typeof cutsceneId === 'string') {
            config = this._cutsceneCache.get(cutsceneId);
            if (!config) {
                console.warn(`[CutsceneManager] 未找到过场动画: ${cutsceneId}`);
                if (onComplete) onComplete();
                return;
            }
        } else {
            config = cutsceneId;
        }

        this._currentCutsceneId = config.id;
        this.player.play(config, () => {
            this._currentCutsceneId = null;
            if (onComplete) onComplete();
        });
    }

    /**
     * 跳过当前过场动画
     */
    public skip(): void {
        if (this.player) {
            this.player.skip();
        }
    }

    /**
     * 暂停当前过场动画
     */
    public pause(): void {
        if (this.player) {
            this.player.pause();
        }
    }

    /**
     * 恢复当前过场动画
     */
    public resume(): void {
        if (this.player) {
            this.player.resume();
        }
    }

    /**
     * 是否正在播放
     */
    public get isPlaying(): boolean {
        return this._currentCutsceneId !== null;
    }

    /**
     * 获取当前过场动画ID
     */
    public get currentCutsceneId(): string | null {
        return this._currentCutsceneId;
    }
}
