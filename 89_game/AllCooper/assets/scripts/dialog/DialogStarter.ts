/**
 * 简单对话启动器
 * 一行代码启动对话
 *
 * 使用示例：
 *   import { startSimpleDialog, registerDefaultCharacters } from './dialog/DialogStarter';
 *
 *   // 游戏启动时注册角色（只需一次）
 *   registerDefaultCharacters();
 *
 *   // 触发对话
 *   startSimpleDialog(this.dialogComponent, 'chapter1/dialog_001');
 */

import { DialogComponent } from './DialogComponent';
import { dialogLoader, CharacterPortraitResources } from './DialogLoader';
import { PortraitPosition, EmotionType } from './DialogData';

// ==================== 快速启动对话 ====================

/**
 * 一行代码启动对话
 * 自动加载预定义的角色立绘
 *
 * @param dialogComponent DialogComponent 组件引用
 * @param dialogPath 对话路径（相对于 resources/dialogs/，不含 .json）
 * @param characterIds 可选，指定角色ID列表，默认加载全部预定义角色
 *
 * @example
 * await startSimpleDialog(this.dialog, 'chapter1/dialog_001');
 */
export async function startSimpleDialog(
    dialogComponent: DialogComponent | null,
    dialogPath: string,
    characterIds?: string[]
): Promise<boolean> {
    console.log(`[DialogStarter] startSimpleDialog 被调用: dialogPath=${dialogPath}, characterIds=${characterIds?.join(',') || '全部'}`);

    if (!dialogComponent) {
        console.error('[DialogStarter] DialogComponent 为空');
        return false;
    }

    try {
        // 获取要加载的角色配置
        const configs = getCharacterConfigs(characterIds);
        console.log(`[DialogStarter] 获取到 ${configs.length} 个角色配置: [${configs.map(c => c.characterId).join(', ')}]`);

        if (configs.length === 0) {
            console.warn('[DialogStarter] 没有角色配置，尝试直接加载对话（立绘将无法显示！）');
            const script = await dialogLoader.loadDialogJson(dialogPath);
            dialogComponent.loadScript(script);
            dialogComponent.startDialog(script.id);
            return true;
        }

        // 加载对话和立绘
        console.log(`[DialogStarter] 开始加载对话和 ${configs.length} 个角色立绘...`);
        const { script, portraits } = await dialogLoader.loadCompleteDialog(dialogPath, configs);
        console.log(`[DialogStarter] 加载完成: script.id=${script.id}, 已加载角色数=${portraits.size}`);

        // 开始对话
        dialogComponent.loadScript(script);
        dialogComponent.startDialog(script.id);

        return true;
    } catch (e) {
        console.error('[DialogStarter] 启动对话失败:', e);
        return false;
    }
}

// ==================== 角色配置管理 ====================

/** 预定义角色配置 */
const predefinedCharacters = new Map<string, CharacterPortraitResources>();

/**
 * 注册角色
 */
export function registerCharacter(config: {
    id: string;
    name: string;
    position: 'left' | 'right';
    emotions: Record<string, string>;  // { calm: 'char_001/calm', smile: 'char_001/smile' }
}): void {
    const positionMap: Record<string, PortraitPosition> = {
        'left': PortraitPosition.LEFT,
        'right': PortraitPosition.RIGHT,
    };

    const emotionMap = new Map<EmotionType, string>();
    const emotionKeys = Object.keys(config.emotions);
    for (let i = 0; i < emotionKeys.length; i++) {
        const emotion = emotionKeys[i];
        emotionMap.set(emotion as EmotionType, config.emotions[emotion]);
    }

    predefinedCharacters.set(config.id, {
        characterId: config.id,
        name: config.name,
        defaultPosition: positionMap[config.position] || PortraitPosition.LEFT,
        emotionPaths: emotionMap,
    });

    console.log(`[DialogStarter] 注册角色: ${config.name} (${config.id})`);
}

/**
 * 获取角色配置
 */
function getCharacterConfigs(ids?: string[]): CharacterPortraitResources[] {
    const targetIds = ids || Array.from(predefinedCharacters.keys());
    console.log(`[DialogStarter] getCharacterConfigs: 请求的角色IDs=[${targetIds.join(', ')}], 预定义角色IDs=[${Array.from(predefinedCharacters.keys()).join(', ')}]`);

    const configs: CharacterPortraitResources[] = [];

    for (const id of targetIds) {
        const config = predefinedCharacters.get(id);
        if (config) {
            configs.push(config);
            console.log(`[DialogStarter] 找到角色配置: ${id}`);
        } else {
            console.warn(`[DialogStarter] 未找到角色配置: ${id}`);
        }
    }

    console.log(`[DialogStarter] getCharacterConfigs 返回 ${configs.length} 个配置`);
    return configs;
}

/**
 * 注册默认角色（游戏启动时调用）
 */
export function registerDefaultCharacters(): void {
    // 罗兰 - 科技派
    registerCharacter({
        id: 'char_001',
        name: '罗兰',
        position: 'left',
        emotions: {
            'calm': 'char_001/calm',
            'smile': 'char_001/smile',
            'laugh': 'char_001/laugh',
            'angry': 'char_001/angry',
            'sad': 'char_001/sad',
            'think': 'char_001/think',
        },
    });

    // 薇 - 魔法派
    registerCharacter({
        id: 'char_002',
        name: '薇',
        position: 'right',
        emotions: {
            'calm': 'char_002/calm',
            'smile': 'char_002/smile',
            'laugh': 'char_002/laugh',
            'angry': 'char_002/angry',
            'furious': 'char_002/furious',
            'sad': 'char_002/sad',
            'think': 'char_002/think',
        },
    });

    console.log(`[DialogStarter] 默认角色注册完成，共 ${predefinedCharacters.size} 个角色`);
    console.log(`[DialogStarter] 已注册角色列表: [${Array.from(predefinedCharacters.keys()).join(', ')}]`);
}

// ==================== 便捷方法 ====================

/**
 * 结束当前对话
 */
export function endCurrentDialog(dialogComponent: DialogComponent | null): void {
    if (dialogComponent) {
        dialogComponent.endDialog();
    }
}

/**
 * 检查对话是否进行中
 */
export function isDialogActive(dialogComponent: DialogComponent | null): boolean {
    return dialogComponent?.isActive ?? false;
}

/**
 * 清除已注册的角色
 */
export function clearCharacters(): void {
    predefinedCharacters.clear();
}
