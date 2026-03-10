/**
 * 对话系统类型定义
 * 包含对话数据结构、表情类型、对话状态等
 */

// ===================== 表情类型 =====================

/**
 * 角色表情类型
 * 对应不同情绪状态的表情GIF
 */
export type EmotionType =
    | 'idle'      // 平静
    | 'happy'     // 开心
    | 'angry'     // 愤怒
    | 'sad'       // 悲伤
    | 'surprise'  // 惊讶
    | 'serious'   // 严肃
    | 'fear'      // 恐惧
    | 'shy'       // 害羞
    | 'think'     // 思考
    | 'special';  // 特殊

// ===================== 阵营类型 =====================

/**
 * 角色阵营
 * 决定对话时的站位（科技派左/魔法派右）
 */
export type Faction = 'tech' | 'magic' | 'neutral';

// ===================== 对话角色 =====================

/**
 * 对话参与者信息
 */
export interface DialogSpeaker {
    /** 角色ID */
    characterId: string;
    /** 角色名称 */
    name: string;
    /** 角色阵营 */
    faction: Faction;
    /** 头像资源路径 */
    portrait: string;
    /** 各表情对应的GIF资源路径 */
    emotionGifs: Record<EmotionType, string>;
}

// ===================== 对话行数据 =====================

/**
 * 单行对话数据
 */
export interface DialogLine {
    /** 说话者ID */
    speakerId: string;
    /** 对话文本内容 */
    text: string;
    /** 表情类型 */
    emotion?: EmotionType;
    /** 语音文件路径（可选） */
    voice?: string;
    /** 特效名称（可选） */
    effect?: string;
    /** 触发过场动画ID（可选） */
    cutscene?: string;
    /** 对话选项（可选，用于分支对话） */
    choices?: DialogChoice[];
    /** 延迟显示时间（毫秒，可选） */
    delay?: number;
}

/**
 * 对话选项
 */
export interface DialogChoice {
    /** 选项ID */
    id: string;
    /** 选项文本 */
    text: string;
    /** 跳转到的对话ID（可选） */
    jumpToDialog?: string;
    /** 触发的事件ID（可选） */
    triggerEvent?: string;
}

// ===================== 对话配置 =====================

/**
 * 完整对话配置
 */
export interface DialogConfig {
    /** 对话唯一ID */
    id: string;
    /** 对话标题（用于调试） */
    title?: string;
    /** 参与对话的角色列表 */
    speakers: DialogSpeaker[];
    /** 对话内容行 */
    lines: DialogLine[];
    /** 背景图片路径（可选） */
    background?: string;
    /** 背景音乐路径（可选） */
    bgm?: string;
    /** 对话结束回调事件ID（可选） */
    onEndEvent?: string;
    /** 是否可跳过 */
    skippable?: boolean;
    /** 打字速度（字符/秒） */
    typeSpeed?: number;
}

// ===================== 对话状态 =====================

/**
 * 对话系统运行状态
 */
export enum DialogState {
    /** 空闲，无对话进行 */
    IDLE = 'idle',
    /** 打字中 */
    TYPING = 'typing',
    /** 等待用户输入继续 */
    WAITING = 'waiting',
    /** 等待用户选择 */
    CHOOSING = 'choosing',
    /** 播放过场动画中 */
    CUTSCENE = 'cutscene',
    /** 暂停中 */
    PAUSED = 'paused'
}

// ===================== 对话事件 =====================

/**
 * 对话系统事件类型
 */
export enum DialogEventType {
    /** 对话开始 */
    DIALOG_START = 'dialog_start',
    /** 对话结束 */
    DIALOG_END = 'dialog_end',
    /** 行开始 */
    LINE_START = 'line_start',
    /** 行结束 */
    LINE_END = 'line_end',
    /** 打字完成 */
    TYPE_COMPLETE = 'type_complete',
    /** 选项显示 */
    CHOICES_SHOW = 'choices_show',
    /** 选项选择 */
    CHOICE_SELECTED = 'choice_selected',
    /** 过场动画开始 */
    CUTSCENE_START = 'cutscene_start',
    /** 过场动画结束 */
    CUTSCENE_END = 'cutscene_end',
    /** 表情变化 */
    EMOTION_CHANGE = 'emotion_change',
    /** 说话者变化 */
    SPEAKER_CHANGE = 'speaker_change'
}

/**
 * 对话事件数据
 */
export interface DialogEventData {
    type: DialogEventType;
    dialogId?: string;
    lineIndex?: number;
    line?: DialogLine;
    speaker?: DialogSpeaker;
    emotion?: EmotionType;
    choice?: DialogChoice;
    cutsceneId?: string;
}

// ===================== 过场动画 =====================

/**
 * 过场动画配置
 */
export interface CutsceneConfig {
    /** 过场动画ID */
    id: string;
    /** 视频文件路径 */
    videoPath: string;
    /** 是否可跳过 */
    skippable?: boolean;
    /** 跳过按键 */
    skipKey?: string;
    /** 音频轨道路径（可选） */
    audioPath?: string;
    /** 字幕配置（可选） */
    subtitles?: SubtitleConfig[];
}

/**
 * 字幕配置
 */
export interface SubtitleConfig {
    /** 开始时间（秒） */
    startTime: number;
    /** 结束时间（秒） */
    endTime: number;
    /** 字幕文本 */
    text: string;
}

// ===================== 预加载资源 =====================

/**
 * 对话预加载资源信息
 */
export interface DialogPreloadAssets {
    /** 头像图片列表 */
    portraits: string[];
    /** 表情GIF列表 */
    emotionGifs: string[];
    /** 背景图片 */
    backgrounds: string[];
    /** 视频文件 */
    videos: string[];
    /** 音频文件 */
    audios: string[];
}

// ===================== 常量定义 =====================

/** 默认打字速度（字符/秒） */
export const DEFAULT_TYPE_SPEED = 30;

/** 立绘宽度 */
export const PORTRAIT_WIDTH = 400;

/** 立绘高度 */
export const PORTRAIT_HEIGHT = 800;

/** 对话框高度 */
export const DIALOG_BOX_HEIGHT = 200;

/** 头像大小 */
export const AVATAR_SIZE = 80;

/** 默认表情 */
export const DEFAULT_EMOTION: EmotionType = 'idle';
