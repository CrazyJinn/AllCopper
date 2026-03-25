/**
 * 游戏配置文件
 * 包含游戏的全局配置参数
 */

/** 分辨率配置 */
export const Resolution = {
    /** 目标分辨率 1920x1080 */
    HD: { width: 1920, height: 1080 },
    /** 目标分辨率 1280x720 */
    SD: { width: 1280, height: 720 },
} as const;

/** 帧率配置 */
export const FrameRate = {
    /** 目标帧率 */
    TARGET: 60,
    /** 最低帧率 */
    MIN: 30,
} as const;

/** 阵营类型 */
export enum Faction {
    /** 科技阵营 */
    TECH = 'tech',
    /** 魔法阵营（升格者） */
    MAGIC = 'magic',
    /** 野生/中立 */
    WILD = 'wild',
}

/** 角色类型 */
export enum CharacterType {
    PLAYER = 'player',
    NPC = 'npc',
    ENEMY = 'enemy',
}

/** 怪物类型 */
export enum MonsterType {
    NORMAL = 'normal',
    ELITE = 'elite',
    BOSS = 'boss',
}

/** 怪物类别 */
export enum MonsterCategory {
    ANIMAL = 'animal',
    PLANT = 'plant',
}

/** 伤害类型 */
export enum DamageType {
    /** 普通伤害 - 按护盾吸收率分配 */
    NORMAL = 'normal',
    /** 物理伤害 */
    PHYSICAL = 'physical',
    /** 魔法伤害 */
    MAGIC = 'magic',
    /** 中毒伤害 - 直接扣除HP，无视护盾 */
    POISON = 'poison',
    /** 碎盾伤害 - 扣除巨额护盾，不扣HP */
    SHIELD_BREAK = 'shield_break',
    /** 辐射伤害 */
    RADIATION = 'radiation',
}

/** 物品稀有度 */
export enum Rarity {
    COMMON = 'common',
    UNCOMMON = 'uncommon',
    RARE = 'rare',
    EPIC = 'epic',
    LEGENDARY = 'legendary',
}

/** 物品类型 */
export enum ItemType {
    WEAPON = 'weapon',
    ARMOR = 'armor',
    CONSUMABLE = 'consumable',
    MATERIAL = 'material',
    QUEST = 'quest',
}

/** 场景类型 */
export enum SceneType {
    /** 安全区 */
    SAFE_ZONE = 'safe_zone',
    /** 战斗区 */
    COMBAT = 'combat',
    /** 副本 */
    DUNGEON = 'dungeon',
}

/** 房间类型 */
export enum RoomType {
    NORMAL = 'normal',
    ELITE = 'elite',
    BOSS = 'boss',
    HIDDEN = 'hidden',
    ENTRANCE = 'entrance',
    EXIT = 'exit',
}

/** 表情类型 */
export enum EmotionType {
    DEFAULT = 'default',
    HAPPY = 'happy',
    SAD = 'sad',
    ANGRY = 'angry',
    SURPRISED = 'surprised',
    SERIOUS = 'serious',
    SCARED = 'scared',
}

/** 输入按键映射 */
export const InputMapping = {
    /** 向上移动 */
    MOVE_UP: 'W',
    /** 向下移动 */
    MOVE_DOWN: 'S',
    /** 向左移动 */
    MOVE_LEFT: 'A',
    /** 向右移动 */
    MOVE_RIGHT: 'D',
    /** 翻滚闪避 */
    DODGE: 'Space',
    /** 技能1 */
    SKILL_1: 'Q',
    /** 技能2 */
    SKILL_2: 'E',
    /** 换弹/冥想 */
    RELOAD: 'R',
    /** 拾取物品 */
    INTERACT: 'F',
    /** 暂停菜单 */
    PAUSE: 'Escape',
    /** 地图/任务 */
    MAP: 'Tab',
    /** 背包 */
    INVENTORY: 'I',
    /** 角色属性 */
    CHARACTER: 'C',
} as const;

/** 鼠标按键映射 */
export const MouseMapping = {
    /** 普通攻击/射击 */
    ATTACK: 0, // 左键
    /** 终极技能 */
    ULTIMATE: 2, // 右键
} as const;

/** 对话系统配置 */
export const DialogConfig = {
    /** 立绘尺寸 */
    PORTRAIT_SIZE: { width: 400, height: 800 },
    /** 科技派站位 */
    TECH_POSITION: 'left',
    /** 魔法派站位 */
    MAGIC_POSITION: 'right',
} as const;

/** 过场动画配置 */
export const CutsceneConfig = {
    /** 视频分辨率 */
    RESOLUTION: { width: 1920, height: 1080 },
} as const;

/** 性能配置 */
export const PerformanceConfig = {
    /** 首屏加载时间（秒） */
    INITIAL_LOAD_TIME: 3,
    /** 场景切换时间（秒） */
    SCENE_TRANSITION_TIME: 2,
    /** 最大内存占用（MB） */
    MAX_MEMORY: 500,
    /** 对象池默认大小 */
    POOL_SIZE: 50,
} as const;

/** 经济系统配置 */
export const EconomyConfig = {
    /** 货币精度（小数位数） */
    CURRENCY_PRECISION: 2,
    /** 满电电池单位值 */
    FULL_BATTERY_VALUE: 1,
} as const;

/** 护盾系统配置 */
export const ShieldConfig = {
    /** 默认护盾吸收率（90%） */
    DEFAULT_ABSORB_RATE: 0.9,
    /** 护盾恢复延迟（秒） */
    REGEN_DELAY: 3,
} as const;
