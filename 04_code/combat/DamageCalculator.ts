/**
 * 伤害计算器
 * 处理各种伤害类型的计算逻辑
 */

import { DamageType } from '../core/GameConfig';

/** 伤害计算结果 */
export interface DamageResult {
    /** 原始伤害 */
    rawDamage: number;
    /** 最终伤害 */
    finalDamage: number;
    /** 护盾伤害 */
    shieldDamage: number;
    /** HP伤害 */
    hpDamage: number;
    /** 是否暴击 */
    isCrit: boolean;
    /** 伤害类型 */
    damageType: DamageType;
    /** 是否被闪避 */
    isDodged: boolean;
}

/** 伤害计算参数 */
export interface DamageParams {
    /** 基础伤害 */
    baseDamage: number;
    /** 攻击力 */
    attack: number;
    /** 防御力 */
    defense: number;
    /** 暴击率 (0-1) */
    critRate: number;
    /** 暴击伤害倍率 */
    critMultiplier: number;
    /** 伤害类型 */
    damageType: DamageType;
    /** 目标护盾值 */
    targetShield: number;
    /** 目标最大护盾值 */
    targetMaxShield: number;
    /** 护盾吸收率 */
    shieldAbsorbRate: number;
    /** 是否无敌 */
    isInvincible: boolean;
    /** 额外伤害加成 */
    damageBonus?: number;
    /** 伤害减免 */
    damageReduction?: number;
}

/**
 * 伤害计算器类
 */
export class DamageCalculator {
    /** 默认暴击倍率 */
    static DEFAULT_CRIT_MULTIPLIER = 1.5;

    /**
     * 计算最终伤害
     */
    static calculate(params: DamageParams): DamageResult {
        const result: DamageResult = {
            rawDamage: 0,
            finalDamage: 0,
            shieldDamage: 0,
            hpDamage: 0,
            isCrit: false,
            damageType: params.damageType,
            isDodged: false,
        };

        // 检查无敌状态
        if (params.isInvincible) {
            result.isDodged = true;
            return result;
        }

        // 计算原始伤害
        let rawDamage = params.baseDamage + params.attack;

        // 应用伤害加成
        if (params.damageBonus && params.damageBonus !== 0) {
            rawDamage *= (1 + params.damageBonus);
        }

        result.rawDamage = rawDamage;

        // 计算防御减免
        const defenseReduction = this.calculateDefenseReduction(params.defense);
        let finalDamage = rawDamage * (1 - defenseReduction);

        // 应用伤害减免
        if (params.damageReduction && params.damageReduction !== 0) {
            finalDamage *= (1 - params.damageReduction);
        }

        // 暴击判定
        result.isCrit = this.rollCrit(params.critRate);
        if (result.isCrit) {
            const critMult = params.critMultiplier || this.DEFAULT_CRIT_MULTIPLIER;
            finalDamage *= critMult;
        }

        result.finalDamage = Math.floor(finalDamage);

        // 根据伤害类型分配伤害
        this.distributeDamage(result, params);

        return result;
    }

    /**
     * 计算防御减伤率
     */
    static calculateDefenseReduction(defense: number): number {
        // 防御减伤公式：reduction = defense / (defense + 100)
        // 最多减免80%伤害
        const reduction = defense / (defense + 100);
        return Math.min(reduction, 0.8);
    }

    /**
     * 暴击判定
     */
    static rollCrit(critRate: number): boolean {
        return Math.random() < critRate;
    }

    /**
     * 分配伤害到护盾和HP
     */
    private static distributeDamage(result: DamageResult, params: DamageParams): void {
        const damage = result.finalDamage;

        switch (params.damageType) {
            case DamageType.POISON:
                // 中毒伤害：直接扣HP，无视护盾
                result.hpDamage = damage;
                result.shieldDamage = 0;
                break;

            case DamageType.SHIELD_BREAK:
                // 碎盾伤害：双倍护盾伤害，不扣HP
                result.shieldDamage = Math.min(damage * 2, params.targetShield);
                result.hpDamage = 0;
                break;

            default:
                // 普通伤害：按护盾吸收率分配
                if (params.targetShield > 0) {
                    const absorbRate = params.shieldAbsorbRate;
                    result.shieldDamage = Math.min(damage * absorbRate, params.targetShield);
                    result.hpDamage = damage * (1 - absorbRate);
                } else {
                    result.hpDamage = damage;
                    result.shieldDamage = 0;
                }
                break;
        }
    }

    /**
     * 计算持续伤害
     */
    static calculateDOT(
        baseDamage: number,
        defense: number,
        duration: number,
        tickInterval: number = 1
    ): { damagePerTick: number; tickCount: number } {
        const defenseReduction = this.calculateDefenseReduction(defense);
        const damagePerTick = Math.floor(baseDamage * (1 - defenseReduction));
        const tickCount = Math.floor(duration / tickInterval);

        return { damagePerTick, tickCount };
    }

    /**
     * 计算范围伤害衰减
     */
    static calculateAoeDamage(
        baseDamage: number,
        distance: number,
        maxDistance: number,
        minDamageRatio: number = 0.3
    ): number {
        if (distance >= maxDistance) {
            return Math.floor(baseDamage * minDamageRatio);
        }

        const ratio = 1 - (distance / maxDistance) * (1 - minDamageRatio);
        return Math.floor(baseDamage * ratio);
    }
}
