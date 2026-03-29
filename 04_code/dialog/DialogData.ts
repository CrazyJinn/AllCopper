/**
 * 简化版对话数据结构
 * 用于纯剧情推进的对话系统
 */

/** 表情类型 */
export enum EmotionType {
    DEFAULT = 'default',
    HAPPY = 'happy',
    ANGRY = 'angry',
    SAD = 'sad',
    SURPRISED = 'surprised',
    SCARED = 'scared',
    THINKING = 'thinking',
    EMBARRASSED = 'embarrassed',
    COLD = 'cold',
    DETERMINED = 'determined',
    PAIN = 'pain',
}

/** 立绘位置 */
export enum PortraitPosition {
    LEFT = 'left',
    RIGHT = 'right',
    CENTER = 'center',
    HIDDEN = 'hidden',
}

/** 单条对话数据 */
export interface DialogLineData {
    /** 对话ID */
    id: string;
    /** 说话者ID */
    speakerId: string;
    /** 说话者名称 */
    speakerName?: string;
    /** 对话文本 */
    text: string;
    /** 说话者表情 */
    speakerEmotion?: EmotionType;
    /** 听话者ID */
    listenerId?: string;
    /** 听话者表情 */
    listenerEmotion?: EmotionType;
    /** 下一段对话ID（无则结束） */
    nextDialogId?: string;
}

/** 对话脚本（JSON 格式） */
export interface DialogScriptData {
    /** 脚本ID */
    id: string;
    /** 脚本名称 */
    name: string;
    /** 参与角色ID列表 */
    characters: string[];
    /** 对话内容列表 */
    lines: DialogLineData[];
    /** 起始对话ID */
    startLineId: string;
    /** 背景图片ID */
    backgroundId?: string;
    /** 背景音乐ID */
    bgmId?: string;
}

/** 角色立绘配置 */
export interface CharacterPortraitConfig {
    characterId: string;
    name: string;
    defaultPortraitId: string;
    emotionPortraits: Map<EmotionType, string>;
    defaultPosition: PortraitPosition;
}

/** 角色立绘显示信息 */
export interface CharacterPortrait {
    characterId: string;
    name: string;
    emotion: EmotionType;
    position: PortraitPosition;
    highlighted: boolean;
    portraitAssetId: string;
}

/** 默认值 */
export const DefaultPortraitPosition = PortraitPosition.LEFT;
export const DefaultEmotion = EmotionType.DEFAULT;
