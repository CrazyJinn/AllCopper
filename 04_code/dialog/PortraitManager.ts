/**
 * 立绘管理器
 * 管理角色立绘资源和表情映射
 */

import {
    EmotionType,
    PortraitPosition,
    CharacterPortrait,
    CharacterPortraitConfig,
    DefaultEmotion,
    DefaultPortraitPosition,
} from './DialogData';

/**
 * 立绘管理器（单例）
 */
export class PortraitManager {
    private static _instance: PortraitManager;
    private configs: Map<string, CharacterPortraitConfig> = new Map();

    private constructor() {}

    static get instance(): PortraitManager {
        if (!this._instance) {
            this._instance = new PortraitManager();
        }
        return this._instance;
    }

    /** 注册角色 */
    register(config: CharacterPortraitConfig): void {
        this.configs.set(config.characterId, config);
    }

    /** 批量注册 */
    registerAll(configs: CharacterPortraitConfig[]): void {
        configs.forEach(c => this.register(c));
    }

    /** 获取立绘 */
    getPortrait(characterId: string, emotion: EmotionType = DefaultEmotion): CharacterPortrait | null {
        console.log(`[PortraitManager] getPortrait 被调用: characterId=${characterId}, emotion=${emotion}`);
        console.log(`[PortraitManager] 已注册角色: [${Array.from(this.configs.keys()).join(', ')}]`);

        const config = this.configs.get(characterId);
        if (!config) {
            console.warn(`[PortraitManager] 未找到角色配置: ${characterId}`);
            console.log(`[PortraitManager] 提示: 需要先调用 register() 注册角色`);
            return null;
        }

        const assetId = config.emotionPortraits.get(emotion) || config.defaultPortraitId;
        console.log(`[PortraitManager] 找到角色配置: name=${config.name}, assetId=${assetId}, 表情映射=[${Array.from(config.emotionPortraits.entries()).map(([k, v]) => `${k}:${v}`).join(', ')}]`);

        return {
            characterId,
            name: config.name,
            emotion,
            position: config.defaultPosition,
            highlighted: false,
            portraitAssetId: assetId,
        };
    }

    /** 获取角色配置 */
    getConfig(characterId: string): CharacterPortraitConfig | undefined {
        return this.configs.get(characterId);
    }

    /** 角色是否存在 */
    has(characterId: string): boolean {
        return this.configs.has(characterId);
    }

    /** 清除 */
    clear(): void {
        this.configs.clear();
    }
}

export const portraitManager = PortraitManager.instance;
