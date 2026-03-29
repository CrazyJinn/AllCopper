/**
 * 对话资源加载器
 * 负责从 resources 目录加载 JSON 脚本和立绘资源
 *
 * 资源目录结构：
 * resources/
 *   dialogs/
 *     dialog_001.json      <- 对话脚本
 *   portraits/
 *     roland/
 *       default.png
 *       happy.png
 *       angry.png
 *     wei/
 *       default.png
 *       happy.png
 */

import { resources, JsonAsset, SpriteFrame, AssetManager, Node, Sprite } from 'cc';
import { DialogScriptData, DialogLineData, CharacterPortraitConfig, EmotionType, PortraitPosition } from './DialogData';
import { portraitManager } from './PortraitManager';

/** 角色立绘资源配置 */
export interface CharacterPortraitResources {
    characterId: string;
    name: string;
    defaultPosition: PortraitPosition;
    /** 表情 -> 资源路径映射 */
    emotionPaths: Map<EmotionType, string>;
}

/** 加载进度回调 */
export type LoadProgressCallback = (progress: number, message: string) => void;

/**
 * 对话加载器
 */
export class DialogLoader {
    private static _instance: DialogLoader;

    private constructor() {}

    static get instance(): DialogLoader {
        if (!this._instance) {
            this._instance = new DialogLoader();
        }
        return this._instance;
    }

    // ==================== JSON 加载 ====================

    /**
     * 从 resources 加载对话 JSON
     * @param path 相对于 resources/dialogs/ 的路径，不含 .json 后缀
     * @example loadDialogJson('chapter1/dialog_001')
     */
    loadDialogJson(path: string): Promise<DialogScriptData> {
        return new Promise((resolve, reject) => {
            const fullPath = `dialogs/${path}`;

            resources.load(fullPath, JsonAsset, (err, jsonAsset) => {
                if (err) {
                    console.error(`[DialogLoader] 加载对话失败: ${fullPath}`, err);
                    reject(err);
                    return;
                }

                try {
                    const json = jsonAsset.json;
                    const scriptData = json as DialogScriptData;
                    console.log(`[DialogLoader] 加载对话成功: ${scriptData.id}`);
                    resolve(scriptData);
                } catch (e) {
                    console.error(`[DialogLoader] 解析对话 JSON 失败:`, e);
                    reject(e);
                }
            });
        });
    }

    /**
     * 同步获取已加载的对话 JSON（需要先加载过）
     */
    getDialogJson(path: string): DialogScriptData | null {
        const fullPath = `dialogs/${path}`;
        const jsonAsset = resources.get(fullPath, JsonAsset);
        if (jsonAsset) {
            return jsonAsset.json as DialogScriptData;
        }
        return null;
    }

    // ==================== 立绘加载 ====================

    /** 支持的图片格式（按优先级尝试） */
    private static IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg'];

    /**
     * 加载单个立绘 SpriteFrame
     * Cocos Creator 的 resources.load 不需要文件扩展名
     * @param path 相对于 resources/portraits/ 的路径，不含后缀
     * @example loadPortrait('roland/default')
     */
    loadPortrait(path: string): Promise<SpriteFrame> {
        return new Promise((resolve, reject) => {
            const fullPath = `portraits/${path}`;
            console.log(`[DialogLoader] 加载立绘: ${fullPath}`);

            resources.load(fullPath, SpriteFrame, (err, spriteFrame) => {
                if (err) {
                    console.error(`[DialogLoader] 加载立绘失败: ${fullPath}`, err.message || err);
                    reject(err);
                    return;
                }

                console.log(`[DialogLoader] 加载立绘成功: ${fullPath}`);
                resolve(spriteFrame);
            });
        });
    }

    /**
     * 批量加载角色所有表情立绘
     * @param config 角色立绘配置
     */
    async loadCharacterPortraits(
        config: CharacterPortraitResources,
        onProgress?: LoadProgressCallback
    ): Promise<Map<EmotionType, SpriteFrame>> {
        const { characterId, emotionPaths } = config;
        const frames = new Map<EmotionType, SpriteFrame>();
        const emotions = Array.from(emotionPaths.entries());
        const total = emotions.length;

        console.log(`[DialogLoader] loadCharacterPortraits: ${characterId}, 需要加载 ${total} 个表情`);
        console.log(`[DialogLoader] 表情路径映射: [${emotions.map(([e, p]) => `${e}:${p}`).join(', ')}]`);

        onProgress?.(0, `加载 ${characterId} 立绘...`);

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < emotions.length; i++) {
            const [emotion, path] = emotions[i];

            try {
                const frame = await this.loadPortrait(path);
                frames.set(emotion, frame);
                successCount++;
                onProgress?.((i + 1) / total, `加载 ${characterId} - ${emotion}`);
            } catch (e) {
                failCount++;
                console.error(`[DialogLoader] ❌ 加载立绘失败: ${characterId}/${emotion}, 路径=resources/portraits/${path}`, e);
            }
        }

        console.log(`[DialogLoader] loadCharacterPortraits 完成: ${characterId}, 成功=${successCount}, 失败=${failCount}`);

        if (failCount > 0) {
            console.warn(`[DialogLoader] ⚠️ 角色 ${characterId} 有 ${failCount} 个立绘加载失败，请检查 resources/portraits/ 目录下是否有对应文件`);
        }

        // 注册到立绘管理器
        this.registerCharacter(config, frames);

        return frames;
    }

    /**
     * 注册角色到立绘管理器
     */
    private registerCharacter(
        config: CharacterPortraitResources,
        frames: Map<EmotionType, SpriteFrame>
    ): void {
        console.log(`[DialogLoader] registerCharacter: characterId=${config.characterId}, 表情数量=${frames.size}`);
        const emotionPortraits = new Map<EmotionType, string>();

        // 将 SpriteFrame 的资源 ID 存入映射
        frames.forEach((frame, emotion) => {
            console.log(`[DialogLoader] 注册表情: ${emotion} -> SpriteFrame(name=${frame.name})`);
            emotionPortraits.set(emotion, frame.name);
        });

        // 获取默认表情
        const defaultEmotion = EmotionType.DEFAULT;
        const defaultPortraitId = emotionPortraits.get(defaultEmotion) || '';
        console.log(`[DialogLoader] 默认表情资源ID: ${defaultPortraitId}`);

        const portraitConfig: CharacterPortraitConfig = {
            characterId: config.characterId,
            name: config.name,
            defaultPortraitId,
            emotionPortraits,
            defaultPosition: config.defaultPosition,
        };

        portraitManager.register(portraitConfig);
        console.log(`[DialogLoader] 已注册到 PortraitManager`);

        // 缓存 SpriteFrame 供后续使用
        this.portraitCache.set(config.characterId, frames);
        console.log(`[DialogLoader] 已缓存到 portraitCache，当前缓存角色数: ${this.portraitCache.size}`);
    }

    /** 立绘缓存 */
    private portraitCache: Map<string, Map<EmotionType, SpriteFrame>> = new Map();

    /**
     * 获取已缓存的立绘 SpriteFrame
     */
    getPortraitFrame(characterId: string, emotion: EmotionType): SpriteFrame | null {
        console.log(`[DialogLoader] getPortraitFrame: characterId=${characterId}, emotion=${emotion}`);
        console.log(`[DialogLoader] portraitCache 当前角色: [${Array.from(this.portraitCache.keys()).join(', ') || '空'}]`);

        const characterFrames = this.portraitCache.get(characterId);
        if (!characterFrames) {
            console.error(`[DialogLoader] ❌ portraitCache 中未找到角色: ${characterId}`);
            console.log(`[DialogLoader] 可能原因: 1) loadCharacterPortraits 未被调用 2) 所有立绘加载失败 3) 角色ID不匹配`);
            return null;
        }

        console.log(`[DialogLoader] 角色 ${characterId} 已加载表情: [${Array.from(characterFrames.keys()).join(', ')}]`);

        const frame = characterFrames.get(emotion);
        if (frame) {
            console.log(`[DialogLoader] ✅ 找到 SpriteFrame: ${frame.name}`);
            return frame;
        }

        // 尝试使用默认表情
        const defaultFrame = characterFrames.get(EmotionType.DEFAULT);
        if (defaultFrame) {
            console.log(`[DialogLoader] ⚠️ 表情 ${emotion} 未找到，使用默认表情: ${defaultFrame.name}`);
            return defaultFrame;
        }

        console.error(`[DialogLoader] ❌ 角色 ${characterId} 没有任何可用的 SpriteFrame（包括默认表情）`);
        return null;
    }

    // ==================== 批量加载 ====================

    /**
     * 加载完整对话（脚本 + 所有角色立绘）
     */
    async loadCompleteDialog(
        dialogPath: string,
        characterConfigs: CharacterPortraitResources[],
        onProgress?: LoadProgressCallback
    ): Promise<{
        script: DialogScriptData;
        portraits: Map<string, Map<EmotionType, SpriteFrame>>;
    }> {
        console.log(`[DialogLoader] loadCompleteDialog 开始: dialogPath=${dialogPath}, 角色数量=${characterConfigs.length}`);

        // 1. 加载对话 JSON
        onProgress?.(0, '加载对话脚本...');
        const script = await this.loadDialogJson(dialogPath);
        console.log(`[DialogLoader] 对话脚本加载完成: id=${script.id}, 对话行数=${script.lines?.length || 0}`);

        // 2. 加载所有角色立绘
        const portraits = new Map<string, Map<EmotionType, SpriteFrame>>();
        const total = characterConfigs.length;

        for (let i = 0; i < characterConfigs.length; i++) {
            const config = characterConfigs[i];
            console.log(`[DialogLoader] 加载角色 ${i + 1}/${total}: ${config.characterId}`);
            const frames = await this.loadCharacterPortraits(config, (p, msg) => {
                const overallProgress = (i + p) / total;
                onProgress?.(overallProgress * 0.9, msg);
            });
            console.log(`[DialogLoader] 角色 ${config.characterId} 加载完成，表情数=${frames.size}`);
            portraits.set(config.characterId, frames);
        }

        console.log(`[DialogLoader] 所有资源加载完成，portraitCache 中角色数: ${this.portraitCache.size}`);
        onProgress?.(1, '加载完成');

        return { script, portraits };
    }

    // ==================== 便捷方法 ====================

    /**
     * 从预定义配置快速加载角色
     */
    async loadPredefinedCharacter(characterId: string): Promise<Map<EmotionType, SpriteFrame>> {
        const config = this.getPredefinedConfig(characterId);
        if (!config) {
            throw new Error(`[DialogLoader] 未找到预定义角色: ${characterId}`);
        }
        return this.loadCharacterPortraits(config);
    }

    /**
     * 获取预定义角色配置
     * 可在此扩展更多角色
     */
    private getPredefinedConfig(characterId: string): CharacterPortraitResources | null {
        const configs: Record<string, CharacterPortraitResources> = {
            'char_001_roland': {
                characterId: 'char_001_roland',
                name: '罗兰',
                defaultPosition: PortraitPosition.LEFT,
                emotionPaths: new Map([
                    [EmotionType.DEFAULT, 'roland/default'],
                    [EmotionType.HAPPY, 'roland/happy'],
                    [EmotionType.ANGRY, 'roland/angry'],
                    [EmotionType.SAD, 'roland/sad'],
                    [EmotionType.SURPRISED, 'roland/surprised'],
                    [EmotionType.THINKING, 'roland/thinking'],
                ]),
            },
            'char_002_wei': {
                characterId: 'char_002_wei',
                name: '薇',
                defaultPosition: PortraitPosition.RIGHT,
                emotionPaths: new Map([
                    [EmotionType.DEFAULT, 'wei/default'],
                    [EmotionType.HAPPY, 'wei/happy'],
                    [EmotionType.ANGRY, 'wei/angry'],
                    [EmotionType.SAD, 'wei/sad'],
                    [EmotionType.SURPRISED, 'wei/surprised'],
                    [EmotionType.THINKING, 'wei/thinking'],
                ]),
            },
        };

        return configs[characterId] || null;
    }

    // ==================== 清理 ====================

    /**
     * 清除缓存
     */
    clearCache(): void {
        this.portraitCache.clear();
    }

    /**
     * 释放指定对话资源
     */
    releaseDialog(path: string): void {
        const fullPath = `dialogs/${path}`;
        const asset = resources.get(fullPath, JsonAsset);
        if (asset) {
            resources.release(asset);
        }
    }
}

export const dialogLoader = DialogLoader.instance;
