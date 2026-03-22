/**
 * 游戏管理器
 * 负责游戏的整体流程控制
 */

import { EventSystem, eventSystem, GameEvent } from './EventSystem';
import { Resolution, FrameRate, PerformanceConfig } from './GameConfig';

/** 游戏状态 */
export enum GameState {
    /** 未初始化 */
    NONE = 'none',
    /** 加载中 */
    LOADING = 'loading',
    /** 主菜单 */
    MENU = 'menu',
    /** 游戏中 */
    PLAYING = 'playing',
    /** 暂停 */
    PAUSED = 'paused',
    /** 对话中 */
    DIALOG = 'dialog',
    /** 过场动画 */
    CUTSCENE = 'cutscene',
    /** 游戏结束 */
    GAME_OVER = 'game_over',
}

/**
 * 游戏管理器类
 * 单例模式
 */
export class GameManager {
    private static _instance: GameManager;

    private _state: GameState = GameState.NONE;
    private _isPaused: boolean = false;
    private _frameRate: number = FrameRate.TARGET;
    private _currentResolution = Resolution.HD;
    private _deltaTime: number = 0;
    private _lastFrameTime: number = 0;

    private constructor() {
        this.init();
    }

    static get instance(): GameManager {
        if (!this._instance) {
            this._instance = new GameManager();
        }
        return this._instance;
    }

    /** 当前游戏状态 */
    get state(): GameState {
        return this._state;
    }

    /** 是否暂停 */
    get isPaused(): boolean {
        return this._isPaused;
    }

    /** 当前帧率 */
    get frameRate(): number {
        return this._frameRate;
    }

    /** 当前分辨率 */
    get resolution(): typeof Resolution.HD {
        return this._currentResolution;
    }

    /** 帧间隔时间（秒） */
    get deltaTime(): number {
        return this._deltaTime;
    }

    /**
     * 初始化游戏
     */
    private init(): void {
        console.log('[GameManager] 初始化游戏管理器...');
        this.setupFrameRateMonitor();
    }

    /**
     * 设置帧率监控
     */
    private setupFrameRateMonitor(): void {
        this._lastFrameTime = Date.now();

        // 使用游戏引擎的帧更新
        // 这里提供接口，实际使用时需要与Cocos的update循环绑定
    }

    /**
     * 每帧更新（由引擎调用）
     */
    update(): void {
        const currentTime = Date.now();
        this._deltaTime = (currentTime - this._lastFrameTime) / 1000;
        this._lastFrameTime = currentTime;

        if (this._isPaused || this._state !== GameState.PLAYING) {
            return;
        }

        // 更新游戏逻辑
        this.updateGameLogic();
    }

    /**
     * 更新游戏逻辑
     */
    private updateGameLogic(): void {
        // 由各子系统自行注册更新
    }

    /**
     * 开始游戏
     */
    startGame(): void {
        console.log('[GameManager] 开始游戏');
        this._state = GameState.PLAYING;
        this._isPaused = false;
        eventSystem.emit(GameEvent.GAME_STARTED);
    }

    /**
     * 暂停游戏
     */
    pauseGame(): void {
        if (this._state !== GameState.PLAYING) return;

        console.log('[GameManager] 暂停游戏');
        this._isPaused = true;
        this._state = GameState.PAUSED;
        eventSystem.emit(GameEvent.PAUSE_GAME);
    }

    /**
     * 恢复游戏
     */
    resumeGame(): void {
        if (this._state !== GameState.PAUSED) return;

        console.log('[GameManager] 恢复游戏');
        this._isPaused = false;
        this._state = GameState.PLAYING;
        eventSystem.emit(GameEvent.RESUME_GAME);
    }

    /**
     * 切换暂停状态
     */
    togglePause(): void {
        if (this._isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }

    /**
     * 进入对话状态
     */
    enterDialog(dialogId: string): void {
        this._state = GameState.DIALOG;
        eventSystem.emit(GameEvent.DIALOG_STARTED, { dialogId } as any);
    }

    /**
     * 退出对话状态
     */
    exitDialog(): void {
        this._state = GameState.PLAYING;
        eventSystem.emit(GameEvent.DIALOG_ENDED);
    }

    /**
     * 进入过场动画状态
     */
    enterCutscene(): void {
        this._state = GameState.CUTSCENE;
        eventSystem.emit(GameEvent.CUTSCENE_STARTED);
    }

    /**
     * 退出过场动画状态
     */
    exitCutscene(): void {
        this._state = GameState.PLAYING;
        eventSystem.emit(GameEvent.CUTSCENE_ENDED);
    }

    /**
     * 游戏结束
     */
    gameOver(): void {
        console.log('[GameManager] 游戏结束');
        this._state = GameState.GAME_OVER;
    }

    /**
     * 返回主菜单
     */
    returnToMenu(): void {
        console.log('[GameManager] 返回主菜单');
        this._state = GameState.MENU;
        this._isPaused = false;
    }

    /**
     * 设置分辨率
     * @param resolution 分辨率配置
     */
    setResolution(resolution: typeof Resolution.HD | typeof Resolution.SD): void {
        this._currentResolution = resolution;
        console.log(`[GameManager] 分辨率设置为 ${resolution.width}x${resolution.height}`);
    }

    /**
     * 检查是否可以执行游戏操作
     */
    canPerformGameAction(): boolean {
        return this._state === GameState.PLAYING && !this._isPaused;
    }
}

/** 全局游戏管理器实例 */
export const gameManager = GameManager.instance;
