/**
 * 角色立绘组件
 * 管理对话中的角色立绘显示、表情切换、动画效果
 */

import {
    _decorator,
    Component,
    Node,
    Sprite,
    SpriteFrame,
    resources,
    tween,
    Vec3,
    Color,
    UIOpacity,
    UITransform
} from 'cc';
import {
    DialogSpeaker,
    EmotionType,
    DEFAULT_EMOTION,
    PORTRAIT_WIDTH,
    PORTRAIT_HEIGHT
} from '../data/DialogTypes';

const { ccclass, property } = _decorator;

/** 立绘显示状态 */
enum PortraitState {
    HIDDEN = 'hidden',
    IDLE = 'idle',
    TALKING = 'talking',
    TRANSITIONING = 'transitioning'
}

/** 立绘动画配置 */
interface PortraitAnimConfig {
    fadeInDuration: number;
    fadeOutDuration: number;
    talkFloatAmplitude: number;
    talkFloatSpeed: number;
}

const DEFAULT_ANIM_CONFIG: PortraitAnimConfig = {
    fadeInDuration: 0.3,
    fadeOutDuration: 0.3,
    talkFloatAmplitude: 5,
    talkFloatSpeed: 3
};

/**
 * 单个角色立绘视图
 */
@ccclass('PortraitView')
export class PortraitView extends Component {
    @property(Sprite)
    portraitSprite: Sprite | null = null;

    @property(Node)
    highlightNode: Node | null = null;

    /** 角色信息 */
    private _speaker: DialogSpeaker | null = null;

    /** 当前表情 */
    private _currentEmotion: EmotionType = DEFAULT_EMOTION;

    /** 当前状态 */
    private _state: PortraitState = PortraitState.HIDDEN;

    /** 缓存的表情资源 */
    private _emotionCache: Map<EmotionType, SpriteFrame> = new Map();

    /** 动画配置 */
    private _animConfig: PortraitAnimConfig = DEFAULT_ANIM_CONFIG;

    /** 是否正在说话 */
    private _isTalking: boolean = false;

    /** 浮动动画时间 */
    private _floatTime: number = 0;

    /** 原始Y位置 */
    private _originalY: number = 0;

    /** 不透明度组件 */
    private _opacity: UIOpacity | null = null;

    // ===================== 生命周期 =====================

    protected onLoad(): void {
        if (!this.portraitSprite) {
            this.portraitSprite = this.getComponent(Sprite);
        }

        this._opacity = this.getComponent(UIOpacity);
        if (!this._opacity) {
            this._opacity = this.addComponent(UIOpacity);
        }

        this._originalY = this.node.position.y;
    }

    protected update(dt: number): void {
        if (this._isTalking && this._state === PortraitState.TALKING) {
            this._floatTime += dt * this._animConfig.talkFloatSpeed;
            const offset = Math.sin(this._floatTime) * this._animConfig.talkFloatAmplitude;
            const pos = this.node.position;
            this.node.setPosition(pos.x, this._originalY + offset, pos.z);
        }
    }

    // ===================== 公共方法 =====================

    /**
     * 初始化角色
     */
    public async init(speaker: DialogSpeaker): Promise<void> {
        this._speaker = speaker;
        await this._preloadEmotions();
        this.setEmotion(DEFAULT_EMOTION, false);
        this._updatePosition();
    }

    /**
     * 设置表情
     */
    public setEmotion(emotion: EmotionType, animated: boolean = true): void {
        if (!this._speaker) return;

        this._currentEmotion = emotion;

        const spriteFrame = this._emotionCache.get(emotion);
        if (spriteFrame && this.portraitSprite) {
            if (animated) {
                this._flashTransition(() => {
                    this.portraitSprite!.spriteFrame = spriteFrame;
                });
            } else {
                this.portraitSprite.spriteFrame = spriteFrame;
            }
        } else {
            this._loadEmotion(emotion);
        }
    }

    /**
     * 显示立绘
     */
    public show(animated: boolean = true): void {
        if (this._state !== PortraitState.HIDDEN) return;

        this._state = PortraitState.IDLE;
        this.node.active = true;

        if (animated && this._opacity) {
            this._opacity.opacity = 0;
            tween(this._opacity)
                .to(this._animConfig.fadeInDuration, { opacity: 255 })
                .start();
        } else if (this._opacity) {
            this._opacity.opacity = 255;
        }
    }

    /**
     * 隐藏立绘
     */
    public hide(animated: boolean = true): void {
        if (this._state === PortraitState.HIDDEN) return;

        if (animated && this._opacity) {
            tween(this._opacity)
                .to(this._animConfig.fadeOutDuration, { opacity: 0 })
                .call(() => {
                    this.node.active = false;
                    this._state = PortraitState.HIDDEN;
                })
                .start();
        } else {
            this.node.active = false;
            this._state = PortraitState.HIDDEN;
        }
    }

    /**
     * 开始说话状态
     */
    public startTalking(): void {
        this._isTalking = true;
        this._state = PortraitState.TALKING;
        this._floatTime = 0;

        if (this.highlightNode) {
            this.highlightNode.active = true;
        }

        tween(this.node)
            .to(0.1, { scale: new Vec3(1.02, 1.02, 1) })
            .start();
    }

    /**
     * 停止说话状态
     */
    public stopTalking(): void {
        this._isTalking = false;
        this._state = PortraitState.IDLE;

        if (this.highlightNode) {
            this.highlightNode.active = false;
        }

        tween(this.node)
            .to(0.1, { scale: new Vec3(1, 1, 1) })
            .start();

        const pos = this.node.position;
        this.node.setPosition(pos.x, this._originalY, pos.z);
    }

    /**
     * 设置高亮/变暗
     */
    public setHighlight(highlighted: boolean): void {
        if (this.portraitSprite) {
            if (highlighted) {
                this.portraitSprite.color = Color.WHITE;
            } else {
                this.portraitSprite.color = new Color(150, 150, 150, 255);
            }
        }
    }

    /**
     * 清除缓存
     */
    public clearCache(): void {
        this._emotionCache.clear();
        this._speaker = null;
    }

    // ===================== 私有方法 =====================

    private async _preloadEmotions(): Promise<void> {
        if (!this._speaker) return;

        const emotions = Object.entries(this._speaker.emotionGifs);
        const promises = emotions.map(([emotion, path]) => {
            return this._loadSpriteFrame(path).then(sf => {
                if (sf) {
                    this._emotionCache.set(emotion as EmotionType, sf);
                }
            });
        });

        await Promise.all(promises);
    }

    private _loadEmotion(emotion: EmotionType): void {
        if (!this._speaker || !this._speaker.emotionGifs[emotion]) return;

        const path = this._speaker.emotionGifs[emotion];
        this._loadSpriteFrame(path).then(sf => {
            if (sf && this.portraitSprite) {
                this._emotionCache.set(emotion, sf);
                if (this._currentEmotion === emotion) {
                    this.portraitSprite.spriteFrame = sf;
                }
            }
        });
    }

    private _loadSpriteFrame(path: string): Promise<SpriteFrame | null> {
        return new Promise((resolve) => {
            resources.load(path, SpriteFrame, (err, spriteFrame) => {
                if (err) {
                    console.warn(`[PortraitView] 加载资源失败: ${path}`, err);
                    resolve(null);
                } else {
                    resolve(spriteFrame);
                }
            });
        });
    }

    private _updatePosition(): void {
        if (!this._speaker) return;

        const transform = this.node.getComponent(UITransform);
        if (!transform) return;

        const screenWidth = 1920;
        const margin = 50;
        const portraitWidth = PORTRAIT_WIDTH;

        let x: number;
        if (this._speaker.faction === 'tech') {
            x = -screenWidth / 2 + portraitWidth / 2 + margin;
        } else {
            x = screenWidth / 2 - portraitWidth / 2 - margin;
        }

        const pos = this.node.position;
        this.node.setPosition(x, pos.y, pos.z);
        this._originalY = pos.y;
    }

    private _flashTransition(callback: () => void): void {
        if (!this._opacity) {
            callback();
            return;
        }

        const originalOpacity = this._opacity.opacity;

        tween(this._opacity)
            .to(0.05, { opacity: 0 })
            .call(() => callback())
            .to(0.05, { opacity: originalOpacity })
            .start();
    }
}

/**
 * 立绘管理器
 */
@ccclass('PortraitManager')
export class PortraitManager extends Component {
    @property(PortraitView)
    leftPortrait: PortraitView | null = null;

    @property(PortraitView)
    rightPortrait: PortraitView | null = null;

    private _currentSpeakers: Map<string, PortraitView> = new Map();

    /**
     * 设置对话角色
     */
    public async setSpeakers(speakers: DialogSpeaker[]): Promise<void> {
        this.clearAll();

        for (const speaker of speakers) {
            let portrait: PortraitView | null = null;

            if (speaker.faction === 'tech' && this.leftPortrait) {
                portrait = this.leftPortrait;
            } else if (speaker.faction === 'magic' && this.rightPortrait) {
                portrait = this.rightPortrait;
            } else if (speaker.faction === 'neutral') {
                portrait = this.leftPortrait || this.rightPortrait;
            }

            if (portrait) {
                await portrait.init(speaker);
                portrait.show();
                this._currentSpeakers.set(speaker.characterId, portrait);
            }
        }
    }

    /**
     * 设置当前说话者
     */
    public setCurrentSpeaker(speakerId: string): void {
        this._currentSpeakers.forEach((portrait, id) => {
            const isSpeaking = id === speakerId;
            portrait.setHighlight(isSpeaking);

            if (isSpeaking) {
                portrait.startTalking();
            } else {
                portrait.stopTalking();
            }
        });
    }

    /**
     * 设置角色表情
     */
    public setEmotion(speakerId: string, emotion: EmotionType): void {
        const portrait = this._currentSpeakers.get(speakerId);
        if (portrait) {
            portrait.setEmotion(emotion);
        }
    }

    /**
     * 清除所有角色
     */
    public clearAll(): void {
        this._currentSpeakers.forEach(portrait => {
            portrait.hide();
            portrait.clearCache();
        });
        this._currentSpeakers.clear();
    }
}
