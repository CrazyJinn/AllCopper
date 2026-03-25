/**
 * 战斗系统
 * 管理战斗逻辑、伤害判定、技能系统
 */

import { DamageCalculator, DamageResult, DamageParams } from './DamageCalculator';
import { BuffSystem, BuffData } from './BuffSystem';
import { CharacterData, CharacterRuntimeState } from '../data/CharacterData';
import { MonsterData, MonsterRuntimeState } from '../data/MonsterData';
import { eventSystem, GameEvent } from '../core/EventSystem';
import { DamageType } from '../core/GameConfig';

/** 攻击类型 */
export enum AttackType {
    /** 近战 */
    MELEE = 'melee',
    /** 远程 */
    RANGED = 'ranged',
    /** 范围 */
    AOE = 'aoe',
}

/** 攻击数据 */
export interface AttackData {
    /** 攻击者ID */
    attackerId: string;
    /** 攻击类型 */
    attackType: AttackType;
    /** 基础伤害 */
    baseDamage: number;
    /** 伤害类型 */
    damageType: DamageType;
    /** 攻击范围/距离 */
    range: number;
    /** 攻击角度（弧度，用于扇形攻击） */
    angle?: number;
    /** 攻击位置 */
    position: { x: number; y: number };
    /** 攻击方向 */
    direction: { x: number; y: number };
    /** 是否可以暴击 */
    canCrit: boolean;
    /** 暴击率 */
    critRate: number;
    /** 附带的Buff */
    attachedBuff?: BuffData;
}

/** 战斗实体接口 */
export interface CombatEntity {
    id: string;
    position: { x: number; y: number };
    isDead: boolean;
    isInvincible: boolean;
    stats: {
        hp: number;
        maxHp: number;
        shield: number;
        maxShield: number;
        shieldAbsorbRate: number;
        attack: number;
        defense: number;
        critRate: number;
        critMultiplier: number;
    };
    buffSystem: BuffSystem;
    takeDamage(result: DamageResult, attackerId: string): void;
    heal(amount: number): void;
}

/**
 * 战斗系统类
 * 单例模式
 */
export class CombatSystem {
    private static _instance: CombatSystem;

    /** 战斗实体映射 */
    private entities: Map<string, CombatEntity> = new Map();
    /** 伤害数字队列 */
    private damageNumbers: { position: { x: number; y: number }; damage: number; isCrit: boolean }[] = [];

    private constructor() {}

    static get instance(): CombatSystem {
        if (!this._instance) {
            this._instance = new CombatSystem();
        }
        return this._instance;
    }

    /**
     * 注册战斗实体
     */
    registerEntity(entity: CombatEntity): void {
        this.entities.set(entity.id, entity);
    }

    /**
     * 注销战斗实体
     */
    unregisterEntity(entityId: string): void {
        this.entities.delete(entityId);
    }

    /**
     * 获取战斗实体
     */
    getEntity(entityId: string): CombatEntity | undefined {
        return this.entities.get(entityId);
    }

    /**
     * 执行攻击
     */
    performAttack(attackData: AttackData): void {
        const attacker = this.entities.get(attackData.attackerId);
        if (!attacker) return;

        // 根据攻击类型获取目标
        const targets = this.getTargetsInAttack(attackData);

        // 对每个目标造成伤害
        targets.forEach(target => {
            if (target.isDead || target.id === attackData.attackerId) return;

            const result = this.calculateDamage(attacker, target, attackData);

            if (!result.isDodged) {
                target.takeDamage(result, attackData.attackerId);

                // 施加Buff
                if (attackData.attachedBuff) {
                    target.buffSystem.addBuff(attackData.attachedBuff, attackData.attackerId);
                }

                // 添加伤害数字
                this.addDamageNumber(target.position, result.finalDamage, result.isCrit);

                // 触发事件
                eventSystem.emit(GameEvent.DAMAGE_DEALT, {
                    target: target.id,
                    damage: result.finalDamage,
                    isCrit: result.isCrit,
                    damageType: attackData.damageType,
                });
            }
        });

        // 触发攻击事件
        eventSystem.emit(GameEvent.ATTACK_PERFORMED, {
            attackerId: attackData.attackerId,
            attackType: attackData.attackType,
        } as any);
    }

    /**
     * 获取攻击范围内的目标
     */
    private getTargetsInAttack(attackData: AttackData): CombatEntity[] {
        const targets: CombatEntity[] = [];

        for (const entity of this.entities.values()) {
            if (entity.id === attackData.attackerId) continue;
            if (entity.isDead) continue;

            const distance = this.getDistance(attackData.position, entity.position);

            switch (attackData.attackType) {
                case AttackType.MELEE:
                    // 近战：检查距离
                    if (distance <= attackData.range) {
                        targets.push(entity);
                    }
                    break;

                case AttackType.RANGED:
                    // 远程：检查射线
                    if (distance <= attackData.range) {
                        if (this.isInLineOfSight(attackData, entity.position)) {
                            targets.push(entity);
                        }
                    }
                    break;

                case AttackType.AOE:
                    // 范围：检查是否在范围内
                    if (distance <= attackData.range) {
                        targets.push(entity);
                    }
                    break;
            }
        }

        return targets;
    }

    /**
     * 计算伤害
     */
    private calculateDamage(
        attacker: CombatEntity,
        target: CombatEntity,
        attackData: AttackData
    ): DamageResult {
        const params: DamageParams = {
            baseDamage: attackData.baseDamage,
            attack: attacker.stats.attack,
            defense: target.stats.defense,
            critRate: attackData.canCrit ? (attackData.critRate || attacker.stats.critRate) : 0,
            critMultiplier: attacker.stats.critMultiplier,
            damageType: attackData.damageType,
            targetShield: target.stats.shield,
            targetMaxShield: target.stats.maxShield,
            shieldAbsorbRate: target.stats.shieldAbsorbRate,
            isInvincible: target.isInvincible || target.buffSystem.isInvincible(),
        };

        return DamageCalculator.calculate(params);
    }

    /**
     * 计算两点距离
     */
    private getDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 检查是否在视线内
     */
    private isInLineOfSight(
        attackData: AttackData,
        targetPos: { x: number; y: number }
    ): boolean {
        // 简化实现：检查目标是否在攻击方向的扇形范围内
        if (!attackData.direction || !attackData.angle) return true;

        const dx = targetPos.x - attackData.position.x;
        const dy = targetPos.y - attackData.position.y;
        const targetAngle = Math.atan2(dy, dx);

        const attackAngle = Math.atan2(attackData.direction.y, attackData.direction.x);
        const angleDiff = Math.abs(targetAngle - attackAngle);

        return angleDiff <= (attackData.angle / 2);
    }

    /**
     * 添加伤害数字
     */
    private addDamageNumber(
        position: { x: number; y: number },
        damage: number,
        isCrit: boolean
    ): void {
        this.damageNumbers.push({
            position: { ...position },
            damage,
            isCrit,
        });
    }

    /**
     * 获取并清除伤害数字队列
     */
    getAndClearDamageNumbers(): { position: { x: number; y: number }; damage: number; isCrit: boolean }[] {
        const numbers = [...this.damageNumbers];
        this.damageNumbers = [];
        return numbers;
    }

    /**
     * 更新战斗系统
     */
    update(deltaTime: number): void {
        // 更新所有实体的Buff系统
        for (const entity of this.entities.values()) {
            if (!entity.isDead) {
                const buffResult = entity.buffSystem.update(deltaTime);

                // 应用DOT伤害
                if (buffResult.dotDamage > 0) {
                    entity.takeDamage({
                        rawDamage: buffResult.dotDamage,
                        finalDamage: buffResult.dotDamage,
                        shieldDamage: 0,
                        hpDamage: buffResult.dotDamage,
                        isCrit: false,
                        damageType: DamageType.POISON,
                        isDodged: false,
                    }, 'dot');
                }

                // 应用HOT治疗
                if (buffResult.hotHeal > 0) {
                    entity.heal(buffResult.hotHeal);
                }
            }
        }
    }

    /**
     * 清除所有实体
     */
    clear(): void {
        this.entities.clear();
        this.damageNumbers = [];
    }
}

/** 全局战斗系统实例 */
export const combatSystem = CombatSystem.instance;
