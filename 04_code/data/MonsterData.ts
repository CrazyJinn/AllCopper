/**
 * 怪物数据定义
 * 包含普通怪物、精英怪物、Boss的数据结构
 */

import { MonsterType, MonsterCategory, DamageType } from '../core/GameConfig';

/** 怪物基础属性 */
export interface MonsterStats {
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
    /** 护盾伤害吸收率（0-1） */
    shieldAbsorbRate: number;
    /** 攻击力 */
    attack: number;
    /** 防御力 */
    defense: number;
    /** 移动速度 */
    speed: number;
}

/** 怪物能力类型 */
export type AbilityType = 'melee' | 'ranged' | 'aoe' | 'special' | 'poison' | 'shield_break';

/** 怪物能力 */
export interface MonsterAbility {
    /** 能力ID */
    id: string;
    /** 能力名称 */
    name: string;
    /** 能力类型 */
    type: AbilityType;
    /** 基础伤害 */
    damage: number;
    /** 冷却时间（秒） */
    cooldown: number;
    /** 伤害类型 */
    damageType: DamageType;
    /** 能力范围 */
    range: number;
    /** 描述 */
    description: string;
}

/** 怪物特殊状态类型 */
export type SpecialStateType = 'berserk' | 'summon' | 'poison' | 'regen' | 'shield';

/** 怪物特殊状态 */
export interface MonsterSpecialState {
    /** 状态类型 */
    type: SpecialStateType;
    /** 触发条件（如 "hp < 25%"） */
    trigger?: string;
    /** 状态参数 */
    params?: Record<string, any>;
}

/** 掉落物配置 */
export interface DropConfig {
    /** 物品ID */
    itemId: string;
    /** 掉落概率（0-1） */
    chance: number;
    /** 数量范围 [最小, 最大] */
    amount: [number, number];
}

/** AI配置 */
export interface AIConfig {
    /** 仇恨范围 */
    aggroRange: number;
    /** 攻击范围 */
    attackRange: number;
    /** 巡逻半径 */
    patrolRadius: number;
    /** 追击距离（超出后返回） */
    chaseDistance: number;
    /** 攻击间隔 */
    attackInterval: number;
}

/** 怪物完整数据 */
export interface MonsterData {
    /** 怪物唯一ID */
    id: string;
    /** 怪物名称 */
    name: string;
    /** 怪物类型 */
    type: MonsterType;
    /** 怪物类别 */
    category: MonsterCategory;
    /** 怪物等级 */
    level: number;

    /** 基础属性 */
    stats: MonsterStats;

    /** 战斗资源 */
    combat: {
        /** 技能冷却（秒） */
        skillCooldown: number;
        /** 普攻冷却（秒） */
        attackCooldown: number;
    };

    /** 能力列表 */
    abilities: MonsterAbility[];

    /** 特殊状态 */
    special?: MonsterSpecialState;

    /** 掉落配置 */
    drops: DropConfig[];

    /** AI配置 */
    aiConfig: AIConfig;

    /** 经验值 */
    expReward: number;

    /** 动画资源 */
    animations: {
        idle: string;
        walk: string;
        attack: string;
        hurt: string;
        death: string;
        special?: string;
    };

    /** 描述 */
    description: string;
}

/** 怪物运行时状态 */
export interface MonsterRuntimeState {
    /** 当前生命值 */
    currentHp: number;
    /** 当前护盾值 */
    currentShield: number;
    /** 是否死亡 */
    isDead: boolean;
    /** 当前AI状态 */
    aiState: 'idle' | 'patrol' | 'chase' | 'attack' | 'return' | 'special';
    /** 仇恨目标ID */
    targetId: string | null;
    /** 当前能力冷却 */
    abilityCooldowns: Map<string, number>;
    /** 特殊状态是否激活 */
    specialActive: boolean;
    /** 生成位置（用于返回） */
    spawnPosition: { x: number; y: number };
}

/**
 * 怪物数据工厂
 */
export class MonsterDataFactory {
    /**
     * 创建默认怪物运行时状态
     */
    static createRuntimeState(data: MonsterData, spawnX: number, spawnY: number): MonsterRuntimeState {
        const cooldowns = new Map<string, number>();
        data.abilities.forEach(ability => {
            cooldowns.set(ability.id, 0);
        });

        return {
            currentHp: data.stats.hp,
            currentShield: data.stats.shield,
            isDead: false,
            aiState: 'idle',
            targetId: null,
            abilityCooldowns: cooldowns,
            specialActive: false,
            spawnPosition: { x: spawnX, y: spawnY },
        };
    }

    /**
     * 创建默认怪物属性
     */
    static createDefaultStats(): MonsterStats {
        return {
            hp: 50,
            maxHp: 50,
            shield: 0,
            maxShield: 0,
            shieldRegenRate: 0,
            shieldAbsorbRate: 0.9,
            attack: 10,
            defense: 2,
            speed: 100,
        };
    }

    /**
     * 创建默认AI配置
     */
    static createDefaultAIConfig(): AIConfig {
        return {
            aggroRange: 300,
            attackRange: 50,
            patrolRadius: 100,
            chaseDistance: 500,
            attackInterval: 1.5,
        };
    }
}

/** 示例怪物数据：变异野狼 */
export const WOLF_DATA: MonsterData = {
    id: 'monster_wolf',
    name: '变异野狼',
    type: MonsterType.NORMAL,
    category: MonsterCategory.ANIMAL,
    level: 1,
    stats: {
        hp: 40,
        maxHp: 40,
        shield: 0,
        maxShield: 0,
        shieldRegenRate: 0,
        shieldAbsorbRate: 0.9,
        attack: 12,
        defense: 2,
        speed: 150,
    },
    combat: {
        skillCooldown: 5,
        attackCooldown: 1,
    },
    abilities: [
        {
            id: 'wolf_bite',
            name: '撕咬',
            type: 'melee',
            damage: 12,
            cooldown: 1,
            damageType: DamageType.PHYSICAL,
            range: 50,
            description: '近距离撕咬攻击',
        },
        {
            id: 'wolf_pounce',
            name: '扑击',
            type: 'special',
            damage: 20,
            cooldown: 5,
            damageType: DamageType.PHYSICAL,
            range: 150,
            description: '跳跃扑击，造成更高伤害',
        },
    ],
    drops: [
        { itemId: 'item_wolf_pelt', chance: 0.5, amount: [1, 2] },
        { itemId: 'item_raw_meat', chance: 0.3, amount: [1, 1] },
    ],
    aiConfig: {
        aggroRange: 250,
        attackRange: 50,
        patrolRadius: 80,
        chaseDistance: 400,
        attackInterval: 1.2,
    },
    expReward: 10,
    animations: {
        idle: 'wolf_idle',
        walk: 'wolf_walk',
        attack: 'wolf_attack',
        hurt: 'wolf_hurt',
        death: 'wolf_death',
    },
    description: '受到辐射影响的野狼，比普通狼更加凶猛。',
};

/** 示例怪物数据：变异植物 */
export const PLANT_DATA: MonsterData = {
    id: 'monster_plant',
    name: '食人藤蔓',
    type: MonsterType.NORMAL,
    category: MonsterCategory.PLANT,
    level: 2,
    stats: {
        hp: 60,
        maxHp: 60,
        shield: 0,
        maxShield: 0,
        shieldRegenRate: 0,
        shieldAbsorbRate: 0.9,
        attack: 8,
        defense: 5,
        speed: 0,
    },
    combat: {
        skillCooldown: 3,
        attackCooldown: 2,
    },
    abilities: [
        {
            id: 'plant_whip',
            name: '藤鞭',
            type: 'ranged',
            damage: 8,
            cooldown: 2,
            damageType: DamageType.PHYSICAL,
            range: 200,
            description: '使用藤蔓进行远程攻击',
        },
        {
            id: 'plant_poison',
            name: '毒雾',
            type: 'poison',
            damage: 5,
            cooldown: 8,
            damageType: DamageType.POISON,
            range: 100,
            description: '释放毒雾，造成持续中毒伤害',
        },
    ],
    special: {
        type: 'poison',
        trigger: 'hp < 30%',
        params: { duration: 5, dps: 3 },
    },
    drops: [
        { itemId: 'item_plant_fiber', chance: 0.6, amount: [1, 3] },
        { itemId: 'item_poison_sac', chance: 0.2, amount: [1, 1] },
    ],
    aiConfig: {
        aggroRange: 200,
        attackRange: 200,
        patrolRadius: 0,
        chaseDistance: 0,
        attackInterval: 2,
    },
    expReward: 15,
    animations: {
        idle: 'plant_idle',
        walk: 'plant_idle',
        attack: 'plant_attack',
        hurt: 'plant_hurt',
        death: 'plant_death',
    },
    description: '变异的食肉植物，能够释放有毒气体。',
};

/** 示例精英怪物：狂暴熊 */
export const ELITE_BEAR_DATA: MonsterData = {
    id: 'monster_elite_bear',
    name: '狂暴巨熊',
    type: MonsterType.ELITE,
    category: MonsterCategory.ANIMAL,
    level: 5,
    stats: {
        hp: 200,
        maxHp: 200,
        shield: 50,
        maxShield: 50,
        shieldRegenRate: 2,
        shieldAbsorbRate: 0.9,
        attack: 25,
        defense: 10,
        speed: 80,
    },
    combat: {
        skillCooldown: 6,
        attackCooldown: 1.5,
    },
    abilities: [
        {
            id: 'bear_slam',
            name: '猛击',
            type: 'melee',
            damage: 25,
            cooldown: 1.5,
            damageType: DamageType.PHYSICAL,
            range: 80,
            description: '强力近战攻击',
        },
        {
            id: 'bear_roar',
            name: '咆哮',
            type: 'aoe',
            damage: 15,
            cooldown: 10,
            damageType: DamageType.PHYSICAL,
            range: 150,
            description: '发出震耳咆哮，造成范围伤害并减速',
        },
        {
            id: 'bear_charge',
            name: '冲撞',
            type: 'special',
            damage: 35,
            cooldown: 8,
            damageType: DamageType.PHYSICAL,
            range: 300,
            description: '向前冲撞，击退敌人',
        },
    ],
    special: {
        type: 'berserk',
        trigger: 'hp < 30%',
        params: { attackBonus: 1.5, speedBonus: 1.3 },
    },
    drops: [
        { itemId: 'item_bear_pelt', chance: 0.8, amount: [1, 1] },
        { itemId: 'item_bear_claw', chance: 0.5, amount: [1, 2] },
        { itemId: 'item_essence_large', chance: 0.3, amount: [1, 1] },
    ],
    aiConfig: {
        aggroRange: 350,
        attackRange: 80,
        patrolRadius: 120,
        chaseDistance: 600,
        attackInterval: 1.8,
    },
    expReward: 100,
    animations: {
        idle: 'bear_idle',
        walk: 'bear_walk',
        attack: 'bear_attack',
        hurt: 'bear_hurt',
        death: 'bear_death',
        special: 'bear_berserk',
    },
    description: '强大的变异熊，生命值低时会进入狂暴状态。',
};
