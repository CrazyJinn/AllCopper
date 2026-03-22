/**
 * 场景管理器
 * 管理游戏场景的加载、切换和卸载
 */

import { eventSystem, GameEvent } from '../core/EventSystem';
import { SceneData, DungeonData, DungeonInstance } from '../data/SceneData';
import { SceneType } from '../core/GameConfig';

/** 场景加载选项 */
export interface SceneLoadOptions {
    /** 是否显示加载界面 */
    showLoading?: boolean;
    /** 加载完成回调 */
    onComplete?: () => void;
    /** 加载进度回调 */
    onProgress?: (progress: number) => void;
}

/** 场景状态 */
export enum SceneState {
    /** 未加载 */
    UNLOADED = 'unloaded',
    /** 加载中 */
    LOADING = 'loading',
    /** 已加载 */
    LOADED = 'loaded',
    /** 活动中 */
    ACTIVE = 'active',
}

/** 已加载场景信息 */
interface LoadedScene {
    data: SceneData;
    state: SceneState;
    instance: any; // Cocos场景实例
}

/**
 * 场景管理器
 * 单例模式
 */
export class SceneManager {
    private static _instance: SceneManager;

    /** 当前活动场景 */
    private _currentScene: LoadedScene | null = null;
    /** 已加载场景缓存 */
    private loadedScenes: Map<string, LoadedScene> = new Map();
    /** 场景数据注册表 */
    private sceneRegistry: Map<string, SceneData> = new Map();
    /** 当前副本实例 */
    private _currentDungeon: DungeonInstance | null = null;

    private constructor() {
        this.registerScenes();
    }

    static get instance(): SceneManager {
        if (!this._instance) {
            this._instance = new SceneManager();
        }
        return this._instance;
    }

    /** 获取当前场景数据 */
    get currentScene(): SceneData | null {
        return this._currentScene?.data || null;
    }

    /** 获取当前副本实例 */
    get currentDungeon(): DungeonInstance | null {
        return this._currentDungeon;
    }

    /**
     * 注册场景数据
     */
    private registerScenes(): void {
        // 实际实现应从配置文件加载场景数据
    }

    /**
     * 注册单个场景
     */
    registerScene(sceneData: SceneData): void {
        this.sceneRegistry.set(sceneData.id, sceneData);
    }

    /**
     * 获取场景数据
     */
    getSceneData(sceneId: string): SceneData | undefined {
        return this.sceneRegistry.get(sceneId);
    }

    /**
     * 加载场景
     */
    async loadScene(sceneId: string, options: SceneLoadOptions = {}): Promise<boolean> {
        const sceneData = this.sceneRegistry.get(sceneId);
        if (!sceneData) {
            console.error(`[SceneManager] 场景不存在: ${sceneId}`);
            return false;
        }

        // 检查是否已加载
        const existing = this.loadedScenes.get(sceneId);
        if (existing && existing.state === SceneState.LOADED) {
            this.activateScene(sceneId);
            return true;
        }

        // 创建加载信息
        const loadedScene: LoadedScene = {
            data: sceneData,
            state: SceneState.LOADING,
            instance: null,
        };
        this.loadedScenes.set(sceneId, loadedScene);

        try {
            // 模拟异步加载
            if (options.showLoading) {
                // 显示加载界面
            }

            // 加载资源
            await this.loadSceneAssets(sceneData, options.onProgress);

            // 更新状态
            loadedScene.state = SceneState.LOADED;

            // 激活场景
            this.activateScene(sceneId);

            // 回调
            options.onComplete?.();

            return true;
        } catch (error) {
            console.error(`[SceneManager] 加载场景失败: ${sceneId}`, error);
            this.loadedScenes.delete(sceneId);
            return false;
        }
    }

    /**
     * 加载场景资源
     */
    private async loadSceneAssets(
        sceneData: SceneData,
        onProgress?: (progress: number) => void
    ): Promise<void> {
        // 实际实现需要调用Cocos的资源加载API
        // 这里是模拟实现
        const resources = [
            sceneData.mapPath,
            sceneData.environment.bgm,
            sceneData.environment.ambientSound,
        ];

        for (let i = 0; i < resources.length; i++) {
            // 模拟加载延迟
            await new Promise(resolve => setTimeout(resolve, 100));
            onProgress?.((i + 1) / resources.length);
        }
    }

    /**
     * 激活场景
     */
    private activateScene(sceneId: string): void {
        const loadedScene = this.loadedScenes.get(sceneId);
        if (!loadedScene) return;

        // 卸载当前活动场景
        if (this._currentScene && this._currentScene !== loadedScene) {
            this.deactivateCurrentScene();
        }

        // 激活新场景
        loadedScene.state = SceneState.ACTIVE;
        this._currentScene = loadedScene;

        // 触发事件
        eventSystem.emit(GameEvent.SCENE_LOADED, { sceneId } as any);

        console.log(`[SceneManager] 场景已激活: ${loadedScene.data.name}`);
    }

    /**
     * 卸载当前场景
     */
    private deactivateCurrentScene(): void {
        if (!this._currentScene) return;

        const sceneId = this._currentScene.data.id;
        this._currentScene.state = SceneState.LOADED;

        eventSystem.emit(GameEvent.SCENE_UNLOADED, { sceneId } as any);
    }

    /**
     * 卸载场景
     */
    unloadScene(sceneId: string): void {
        const loadedScene = this.loadedScenes.get(sceneId);
        if (!loadedScene) return;

        if (loadedScene.state === SceneState.ACTIVE) {
            this.deactivateCurrentScene();
        }

        // 释放资源
        this.unloadSceneAssets(loadedScene.data);

        this.loadedScenes.delete(sceneId);
    }

    /**
     * 卸载场景资源
     */
    private unloadSceneAssets(sceneData: SceneData): void {
        // 实际实现需要调用Cocos的资源释放API
    }

    /**
     * 切换到连接的场景
     */
    async travelToConnectedScene(connectionIndex: number): Promise<boolean> {
        if (!this._currentScene) return false;

        const connections = this._currentScene.data.connections;
        if (connectionIndex < 0 || connectionIndex >= connections.length) {
            return false;
        }

        const targetSceneId = connections[connectionIndex];
        return await this.loadScene(targetSceneId, { showLoading: true });
    }

    /**
     * 进入副本
     */
    enterDungeon(dungeonData: DungeonData): boolean {
        if (this._currentDungeon) {
            console.warn('[SceneManager] 已有活动副本');
            return false;
        }

        this._currentDungeon = new DungeonInstance(dungeonData);
        console.log(`[SceneManager] 进入副本: ${dungeonData.name}`);
        return true;
    }

    /**
     * 退出副本
     */
    exitDungeon(): void {
        if (!this._currentDungeon) return;

        this._currentDungeon = null;
        console.log('[SceneManager] 退出副本');
    }

    /**
     * 检查场景连接
     */
    canTravelTo(sceneId: string): boolean {
        if (!this._currentScene) return false;
        return this._currentScene.data.connections.includes(sceneId);
    }

    /**
     * 获取当前场景的连接场景列表
     */
    getConnectedScenes(): SceneData[] {
        if (!this._currentScene) return [];

        return this._currentScene.data.connections
            .map(id => this.sceneRegistry.get(id))
            .filter((s): s is SceneData => s !== undefined);
    }

    /**
     * 预加载场景
     */
    async preloadScene(sceneId: string): Promise<void> {
        const sceneData = this.sceneRegistry.get(sceneId);
        if (!sceneData) return;

        if (this.loadedScenes.has(sceneId)) return;

        await this.loadSceneAssets(sceneData);
    }
}

/** 全局场景管理器实例 */
export const sceneManager = SceneManager.instance;
