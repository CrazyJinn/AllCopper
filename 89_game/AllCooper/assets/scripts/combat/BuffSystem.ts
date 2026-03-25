/**
 * Buff系统
 * 处理增益/减益效果的管理
 */

import { eventSystem, GameEvent } from '../core/EventSystem';

/** Buff类型 */
export enum BuffType {
    /** 增益 */
    BUFF = 'buff',
    /** 减益 */
    DEBUFF = 'debuff',
    /** 控制 */
    CONTROL = 'control',
}

/** Buff效果类型 */
export enum BuffEffectType {
    /** 属性加成 */
    STAT_MODIFY = 'stat_modify',
    /** 持续伤害 */
    DOT = 'dot',
    /** 持续治疗 */
    HOT = 'hot',
    /** 护盾 */
    SHIELD = 'shield',
    /** 无敌 */
    INVINCIBLE = 'invincible',
    /** 加速 */
    SPEED_UP = 'speed_up',
    /** 减速 */
    SLOW = 'slow',
    /** 眩晕 */
    STUN = 'stun',
    /** 定身 */
    ROOT = 'root',
    /** 沉默 */
    SILENCE = 'silence',
    /** 狂暴 */
    BERSERK = 'berserk',
    /** 中毒 */
    POISON = 'poison',
    /** 燃烧 */
    BURN = 'burn',
    /** 冻结 */
    FREEZE = 'freeze',
    /** 缠绕 */
    BIND = 'bind',
}

/** Buff数据 */
export interface BuffData {
    /** Buff唯一ID */
    id: string;
    /** Buff名称 */
    name: string;
    /** Buff类型 */
    type: BuffType;
    /** 效果类型 */
    effectType: BuffEffectType;
    /** 图标 */
    icon: string;
    /** 描述 */
    description: string;

    /** 持续时间（秒），-1表示永久 */
    duration: number;
    /** 最大层数 */
    maxStack: number;
    /** 是否可驱散 */
    dispellable: boolean;

    /** 效果参数 */
    params: {
        /** 属性修改 */
        statModifies?: { [statName: string]: number };
        /** 每秒伤害/治疗 */
        valuePerSecond?: number;
        /** 触发间隔 */
        tickInterval?: number;
        /** 其他参数 */
        [key: string]: any;
    };

    /** 来源ID */
    sourceId?: string;
}

/** 运行时Buff实例 */
export interface BuffInstance {
    /** Buff数据 */
    data: BuffData;
    /** 剩余时间 */
    remainingTime: number;
    /** 当前层数 */
    stackCount: number;
    /** 下次触发时间 */
    nextTickTime: number;
    /** 施加者ID */
    casterId: string;
}

/**
 * Buff系统类
 */
export class BuffSystem {
    /** Buff实例列表 */
    private buffs: Map<string, BuffInstance> = new Map();
    /** 所属实体ID */
    private ownerId: string;

    constructor(ownerId: string) {
        this.ownerId = ownerId;
    }

    /**
     * 添加Buff
     */
    addBuff(buffData: BuffData, casterId: string): boolean {
        const existing = this.buffs.get(buffData.id);

        if (existing) {
            // 刷新持续时间或增加层数
            if (buffData.maxStack > 1 && existing.stackCount < buffData.maxStack) {
                existing.stackCount++;
            }
            existing.remainingTime = buffData.duration;
            return true;
        }

        // 创建新Buff实例
        const instance: BuffInstance = {
            data: buffData,
            remainingTime: buffData.duration,
            stackCount: 1,
            nextTickTime: buffData.params.tickInterval || 0,
            casterId,
        };

        this.buffs.set(buffData.id, instance);

        // 触发事件
        eventSystem.emit(GameEvent.BUFF_ADDED, {
            targetId: this.ownerId,
            buffId: buffData.id,
            buffType: buffData.type,
        });

        return true;
    }

    /**
     * 移除Buff
     */
    removeBuff(buffId: string): boolean {
        const instance = this.buffs.get(buffId);
        if (!instance) return false;

        this.buffs.delete(buffId);

        // 触发事件
        eventSystem.emit(GameEvent.BUFF_REMOVED, {
            targetId: this.ownerId,
            buffId,
        });

        return true;
    }

    /**
     * 驱散Buff
     * @param count 驱散数量
     * @param types 只驱散特定类型
     */
    dispel(count: number, types?: BuffType[]): number {
        let dispelled = 0;

        for (const [id, instance] of this.buffs) {
            if (dispelled >= count) break;

            if (!instance.data.dispellable) continue;
            if (types && !types.includes(instance.data.type)) continue;

            this.removeBuff(id);
            dispelled++;
        }

        return dispelled;
    }

    /**
     * 更新Buff
     */
    update(deltaTime: number): { dotDamage: number; hotHeal: number; shield: number } {
        let dotDamage = 0;
        let hotHeal = 0;
        let shield = 0;

        const expiredBuffs: string[] = [];

        for (const [id, instance] of this.buffs) {
            // 更新持续时间
            if (instance.data.duration > 0) {
                instance.remainingTime -= deltaTime;
                if (instance.remainingTime <= 0) {
                    expiredBuffs.push(id);
                    continue;
                }
            }

            // 处理周期性效果
            const tickInterval = instance.data.params.tickInterval;
            if (tickInterval && tickInterval > 0) {
                instance.nextTickTime -= deltaTime;
                if (instance.nextTickTime <= 0) {
                    instance.nextTickTime = tickInterval;

                    // 触发效果
                    switch (instance.data.effectType) {
                        case BuffEffectType.DOT:
                            dotDamage += (instance.data.params.valuePerSecond || 0) * instance.stackCount;
                            break;
                        case BuffEffectType.HOT:
                            hotHeal += (instance.data.params.valuePerSecond || 0) * instance.stackCount;
                            break;
                    }
                }
            }

            // 处理护盾
            if (instance.data.effectType === BuffEffectType.SHIELD) {
                shield += (instance.data.params.valuePerSecond || 0) * instance.stackCount;
            }
        }

        // 移除过期Buff
        expiredBuffs.forEach(id => this.removeBuff(id));

        return { dotDamage, hotHeal, shield };
    }

    /**
     * 检查是否有某个Buff
     */
    hasBuff(buffId: string): boolean {
        return this.buffs.has(buffId);
    }

    /**
     * 获取Buff实例
     */
    getBuff(buffId: string): BuffInstance | undefined {
        return this.buffs.get(buffId);
    }

    /**
     * 获取Buff层数
     */
    getBuffStack(buffId: string): number {
        const instance = this.buffs.get(buffId);
        return instance?.stackCount || 0;
    }

    /**
     * 获取所有Buff
     */
    getAllBuffs(): BuffInstance[] {
        return Array.from(this.buffs.values());
    }

    /**
     * 检查是否被控制
     */
    isControlled(): boolean {
        for (const instance of this.buffs.values()) {
            if (instance.data.type === BuffType.CONTROL) {
                return true;
            }
        }
        return false;
    }

    /**
     * 检查是否无法行动
     */
    isImmobilized(): boolean {
        for (const instance of this.buffs.values()) {
            const effectType = instance.data.effectType;
            if (
                effectType === BuffEffectType.STUN ||
                effectType === BuffEffectType.FREEZE ||
                effectType === BuffEffectType.ROOT ||
                effectType === BuffEffectType.BIND
            ) {
                return true;
            }
        }
        return false;
    }

    /**
     * 检查是否沉默
     */
    isSilenced(): boolean {
        for (const instance of this.buffs.values()) {
            if (instance.data.effectType === BuffEffectType.SILENCE) {
                return true;
            }
        }
        return false;
    }

    /**
     * 检查是否无敌
     */
    isInvincible(): boolean {
        for (const instance of this.buffs.values()) {
            if (instance.data.effectType === BuffEffectType.INVINCIBLE) {
                return true;
            }
        }
        return false;
    }

    /**
     * 获取属性修改值
     */
    getStatModify(statName: string): number {
        let modify = 0;

        for (const instance of this.buffs.values()) {
            const statModifies = instance.data.params.statModifies;
            if (statModifies && statModifies[statName]) {
                modify += statModifies[statName] * instance.stackCount;
            }
        }

        return modify;
    }

    /**
     * 获取速度倍率
     */
    getSpeedMultiplier(): number {
        let multiplier = 1;

        for (const instance of this.buffs.values()) {
            const effectType = instance.data.effectType;
            if (effectType === BuffEffectType.SPEED_UP) {
                multiplier += instance.data.params.valuePerSecond || 0;
            } else if (effectType === BuffEffectType.SLOW) {
                multiplier -= instance.data.params.valuePerSecond || 0;
            }
        }

        return Math.max(0.1, multiplier);
    }

    /**
     * 清除所有Buff
     */
    clearAll(): void {
        this.buffs.clear();
    }
}

/** 预定义Buff数据 */
export const BUFFS = {
    /** 中毒 */
    POISON: {
        id: 'buff_poison',
        name: '中毒',
        type: BuffType.DEBUFF,
        effectType: BuffEffectType.POISON,
        icon: 'icon_buff_poison',
        description: '每秒受到毒素伤害',
        duration: 5,
        maxStack: 5,
        dispellable: true,
        params: {
            valuePerSecond: 5,
            tickInterval: 1,
        },
    } as BuffData,

    /** 燃烧 */
    BURN: {
        id: 'buff_burn',
        name: '燃烧',
        type: BuffType.DEBUFF,
        effectType: BuffEffectType.BURN,
        icon: 'icon_buff_burn',
        description: '每秒受到火焰伤害',
        duration: 3,
        maxStack: 3,
        dispellable: true,
        params: {
            valuePerSecond: 8,
            tickInterval: 0.5,
        },
    } as BuffData,

    /** 眩晕 */
    STUN: {
        id: 'buff_stun',
        name: '眩晕',
        type: BuffType.CONTROL,
        effectType: BuffEffectType.STUN,
        icon: 'icon_buff_stun',
        description: '无法行动',
        duration: 2,
        maxStack: 1,
        dispellable: false,
        params: {},
    } as BuffData,

    /** 加速 */
    SPEED_UP: {
        id: 'buff_speed_up',
        name: '加速',
        type: BuffType.BUFF,
        effectType: BuffEffectType.SPEED_UP,
        icon: 'icon_buff_speed',
        description: '移动速度提升',
        duration: 5,
        maxStack: 1,
        dispellable: true,
        params: {
            valuePerSecond: 0.3,
            statModifies: { speed: 0.3 },
        },
    } as BuffData,

    /** 狂暴 */
    BERSERK: {
        id: 'buff_berserk',
        name: '狂暴',
        type: BuffType.BUFF,
        effectType: BuffEffectType.BERSERK,
        icon: 'icon_buff_berserk',
        description: '攻击力和速度大幅提升',
        duration: 10,
        maxStack: 1,
        dispellable: false,
        params: {
            statModifies: { attack: 0.5, speed: 0.3 },
        },
    } as BuffData,
};
