/**
 * 角色数据定义
 * 包含玩家角色、NPC、敌人的基础数据结构
 */

import { Faction, CharacterType, EmotionType } from '../core/GameConfig';

/** 角色基础属性 */
export interface CharacterStats {
    /** 当前生命值 */
    hp: number;
    /** 最大生命值 */
    maxHp: number;
    /** 当前护盾值 */
    shield: number;
    /** 最大护盾值 */
    maxShield: number;
    /** 护盾恢复速率（每秒） */
    shieldRegenRate: number;
    /** 护盾伤害吸收率（0-1，如0.9表示90%伤害由护盾吸收） */
    shieldAbsorbRate: number;
    /** 当前魔法值 */
    mp: number;
    /** 最大魔法值 */
    maxMp: number;
    /** 攻击力 */
    attack: number;
    /** 防御力 */
    defense: number;
    /** 移动速度 */
    speed: number;
}

/** 战斗资源 */
export interface CombatResource {
    /** 当前子弹数 */
    ammo: number;
    /** 最大子弹数 */
    maxAmmo: number;
    /** 技能1冷却（秒） */
    skill1Cooldown: number;
    /** 技能2冷却（秒） */
    skill2Cooldown: number;
    /** 终极技能冷却（秒） */
    ultimateCooldown: number;
    /** 普攻冷却（秒） */
    attackCooldown: number;
}

/** 背包配置 */
export interface InventoryConfig {
    /** 背包容量（格子数） */
    maxSize: number;
    /** 是否有机甲背包加成 */
    hasMechaBonus: boolean;
}

/** 动画资源配置 */
export interface AnimationConfig {
    /** 待机 */
    idle: string;
    /** 行走 */
    walk: string;
    /** 奔跑 */
    run: string;
    /** 攻击 */
    attack: string;
    /** 技能1 */
    skill1: string;
    /** 技能2 */
    skill2: string;
    /** 终极技能 */
    ultimate: string;
    /** 受伤 */
    hurt: string;
    /** 死亡 */
    death: string;
    /** 闪避 */
    dodge: string;
}

/** 对话立绘配置 */
export interface PortraitConfig {
    [EmotionType.DEFAULT]: string;
    [EmotionType.HAPPY]: string;
    [EmotionType.SAD]: string;
    [EmotionType.ANGRY]: string;
    [EmotionType.SURPRISED]: string;
    [EmotionType.SERIOUS]: string;
    [EmotionType.SCARED]: string;
}

/** 角色完整数据 */
export interface CharacterData {
    /** 角色唯一ID */
    id: string;
    /** 角色名称 */
    name: string;
    /** 角色类型 */
    type: CharacterType;
    /** 所属阵营 */
    faction: Faction;
    /** 角色等级 */
    level: number;

    /** 基础属性 */
    stats: CharacterStats;

    /** 战斗资源 */
    combat: CombatResource;

    /** 背包配置 */
    inventory: InventoryConfig;

    /** 技能ID列表 */
    skills: string[];

    /** 装备ID列表 */
    equipment: string[];

    /** 动画资源 */
    animations: AnimationConfig;

    /** 对话立绘 */
    portraits: PortraitConfig;

    /** 角色描述 */
    description: string;
}

/** 角色运行时状态 */
export interface CharacterRuntimeState {
    /** 当前生命值 */
    currentHp: number;
    /** 当前护盾值 */
    currentShield: number;
    /** 当前魔法值 */
    currentMp: number;
    /** 当前子弹数 */
    currentAmmo: number;
    /** 技能冷却计时器 */
    skillTimers: {
        skill1: number;
        skill2: number;
        ultimate: number;
        attack: number;
    };
    /** 护盾恢复计时器 */
    shieldRegenTimer: number;
    /** 是否死亡 */
    isDead: boolean;
    /** 是否无敌 */
    isInvincible: boolean;
}

/**
 * 角色数据工厂
 */
export class CharacterDataFactory {
    /**
     * 创建默认角色运行时状态
     */
    static createRuntimeState(data: CharacterData): CharacterRuntimeState {
        return {
            currentHp: data.stats.hp,
            currentShield: data.stats.shield,
            currentMp: data.stats.mp,
            currentAmmo: data.combat.ammo,
            skillTimers: {
                skill1: 0,
                skill2: 0,
                ultimate: 0,
                attack: 0,
            },
            shieldRegenTimer: 0,
            isDead: false,
            isInvincible: false,
        };
    }

    /**
     * 创建默认角色属性
     */
    static createDefaultStats(): CharacterStats {
        return {
            hp: 100,
            maxHp: 100,
            shield: 50,
            maxShield: 50,
            shieldRegenRate: 5,
            shieldAbsorbRate: 0.9,
            mp: 100,
            maxMp: 100,
            attack: 10,
            defense: 5,
            speed: 200,
        };
    }

    /**
     * 创建默认战斗资源
     */
    static createDefaultCombatResource(): CombatResource {
        return {
            ammo: 30,
            maxAmmo: 30,
            skill1Cooldown: 5,
            skill2Cooldown: 8,
            ultimateCooldown: 30,
            attackCooldown: 0.5,
        };
    }
}

/** 示例角色数据：罗兰（科技阵营主角） */
export const ROLAND_DATA: CharacterData = {
    id: 'char_roland',
    name: '罗兰',
    type: CharacterType.PLAYER,
    faction: Faction.TECH,
    level: 1,
    stats: {
        hp: 120,
        maxHp: 120,
        shield: 60,
        maxShield: 60,
        shieldRegenRate: 6,
        shieldAbsorbRate: 0.9,
        mp: 0,
        maxMp: 0,
        attack: 15,
        defense: 8,
        speed: 220,
    },
    combat: {
        ammo: 30,
        maxAmmo: 30,
        skill1Cooldown: 5,
        skill2Cooldown: 10,
        ultimateCooldown: 45,
        attackCooldown: 0.3,
    },
    inventory: {
        maxSize: 20,
        hasMechaBonus: false,
    },
    skills: ['skill_grenade', 'skill_overdrive', 'skill_air_support'],
    equipment: ['eqp_pistol', 'eqp_light_armor'],
    animations: {
        idle: 'roland_idle',
        walk: 'roland_walk',
        run: 'roland_run',
        attack: 'roland_attack',
        skill1: 'roland_skill1',
        skill2: 'roland_skill2',
        ultimate: 'roland_ultimate',
        hurt: 'roland_hurt',
        death: 'roland_death',
        dodge: 'roland_dodge',
    },
    portraits: {
        default: 'roland_portrait_default',
        happy: 'roland_portrait_happy',
        sad: 'roland_portrait_sad',
        angry: 'roland_portrait_angry',
        surprised: 'roland_portrait_surprised',
        serious: 'roland_portrait_serious',
        scared: 'roland_portrait_scared',
    },
    description: '金属合唱团的拾荒者，擅长使用科技武器和战术装备。',
};

/** 示例角色数据：薇（魔法阵营主角） */
export const WEI_DATA: CharacterData = {
    id: 'char_wei',
    name: '薇',
    type: CharacterType.PLAYER,
    faction: Faction.MAGIC,
    level: 1,
    stats: {
        hp: 80,
        maxHp: 80,
        shield: 40,
        maxShield: 40,
        shieldRegenRate: 4,
        shieldAbsorbRate: 0.9,
        mp: 100,
        maxMp: 100,
        attack: 20,
        defense: 3,
        speed: 200,
    },
    combat: {
        ammo: 0,
        maxAmmo: 0,
        skill1Cooldown: 4,
        skill2Cooldown: 8,
        ultimateCooldown: 40,
        attackCooldown: 0.4,
    },
    inventory: {
        maxSize: 16,
        hasMechaBonus: false,
    },
    skills: ['skill_fireball', 'skill_teleport', 'skill_arcane_storm'],
    equipment: ['eqp_staff', 'eqp_robe'],
    animations: {
        idle: 'wei_idle',
        walk: 'wei_walk',
        run: 'wei_run',
        attack: 'wei_attack',
        skill1: 'wei_skill1',
        skill2: 'wei_skill2',
        ultimate: 'wei_ultimate',
        hurt: 'wei_hurt',
        death: 'wei_death',
        dodge: 'wei_dodge',
    },
    portraits: {
        default: 'wei_portrait_default',
        happy: 'wei_portrait_happy',
        sad: 'wei_portrait_sad',
        angry: 'wei_portrait_angry',
        surprised: 'wei_portrait_surprised',
        serious: 'wei_portrait_serious',
        scared: 'wei_portrait_scared',
    },
    description: '教会年轻的升格者，拥有强大的魔法天赋。',
};
