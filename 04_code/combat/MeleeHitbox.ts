/**
 * 近战判定框
 * 用于近战攻击的碰撞检测
 */

import { AttackEntity, AttackEntityData, AttackEntityType } from './AttackEntity';
import { DamageType } from '../core/GameConfig';

/** 近战判定框形状 */
export enum MeleeHitboxShape {
    /** 圆形 */
    CIRCLE = 'circle',
    /** 扇形 */
    SECTOR = 'sector',
    /** 矩形 */
    RECTANGLE = 'rectangle',
}

/** 近战判定框数据 */
export interface MeleeHitboxData extends AttackEntityData {
    /** 判定框形状 */
    shape: MeleeHitboxShape;
    /** 扇形角度（弧度） */
    sectorAngle?: number;
    /** 矩形宽度 */
    rectangleWidth?: number;
    /** 矩形高度 */
    rectangleHeight?: number;
    /** 命中特效ID */
    hitEffectId?: string;
    /** 击退力度 */
    knockbackForce?: number;
}

/** 近战判定框配置 */
export interface MeleeHitboxConfig {
    /** 攻击者ID */
    ownerId: string;
    /** 攻击者位置 */
    ownerPosition: { x: number; y: number };
    /** 攻击方向（角度，弧度） */
    facingAngle: number;
    /** 判定框形状 */
    shape?: MeleeHitboxShape;
    /** 攻击范围（半径/长度） */
    range: number;
    /** 基础伤害 */
    baseDamage: number;
    /** 伤害类型 */
    damageType?: DamageType;
    /** 存活时间（攻击判定持续时间） */
    duration?: number;
    /** 扇形角度（仅扇形） */
    sectorAngle?: number;
    /** 是否穿透 */
    piercing?: boolean;
    /** 是否可以暴击 */
    canCrit?: boolean;
    /** 暴击率 */
    critRate?: number;
    /** 击退力度 */
    knockbackForce?: number;
}

/**
 * 近战判定框类
 */
export class MeleeHitbox extends AttackEntity {
    private meleeData: MeleeHitboxData;
    /** 攻击方向角度 */
    private facingAngle: number;

    constructor(data: MeleeHitboxData, facingAngle: number) {
        super(data);
        this.meleeData = { ...data };
        this.facingAngle = facingAngle;
    }

    /** 获取类型 */
    override get type(): AttackEntityType {
        return AttackEntityType.MELEE_HITBOX;
    }

    /** 获取形状 */
    get shape(): MeleeHitboxShape {
        return this.meleeData.shape;
    }

    /** 获取击退力度 */
    get knockbackForce(): number {
        return this.meleeData.knockbackForce || 0;
    }

    /**
     * 工厂方法：创建圆形近战判定框
     */
    static createCircle(config: MeleeHitboxConfig): MeleeHitbox {
        const offset = {
            x: Math.cos(config.facingAngle) * config.range * 0.5,
            y: Math.sin(config.facingAngle) * config.range * 0.5,
        };

        return new MeleeHitbox({
            ownerId: config.ownerId,
            position: {
                x: config.ownerPosition.x + offset.x,
                y: config.ownerPosition.y + offset.y,
            },
            direction: {
                x: Math.cos(config.facingAngle),
                y: Math.sin(config.facingAngle),
            },
            shape: MeleeHitboxShape.CIRCLE,
            baseDamage: config.baseDamage,
            damageType: config.damageType || DamageType.NORMAL,
            lifetime: config.duration || 0.1,
            hitboxRadius: config.range * 0.5,
            piercing: config.piercing || false,
            canCrit: config.canCrit ?? true,
            critRate: config.critRate || 0.05,
            knockbackForce: config.knockbackForce,
        }, config.facingAngle);
    }

    /**
     * 工厂方法：创建扇形近战判定框
     */
    static createSector(config: MeleeHitboxConfig): MeleeHitbox {
        // 扇形的判定中心在攻击者前方
        const offset = {
            x: Math.cos(config.facingAngle) * config.range * 0.3,
            y: Math.sin(config.facingAngle) * config.range * 0.3,
        };

        return new MeleeHitbox({
            ownerId: config.ownerId,
            position: {
                x: config.ownerPosition.x + offset.x,
                y: config.ownerPosition.y + offset.y,
            },
            direction: {
                x: Math.cos(config.facingAngle),
                y: Math.sin(config.facingAngle),
            },
            shape: MeleeHitboxShape.SECTOR,
            sectorAngle: config.sectorAngle || Math.PI / 3, // 默认60度
            baseDamage: config.baseDamage,
            damageType: config.damageType || DamageType.NORMAL,
            lifetime: config.duration || 0.1,
            hitboxRadius: config.range,
            piercing: config.piercing || false,
            canCrit: config.canCrit ?? true,
            critRate: config.critRate || 0.05,
            knockbackForce: config.knockbackForce,
        }, config.facingAngle);
    }

    /**
     * 工厂方法：创建矩形近战判定框
     */
    static createRectangle(config: MeleeHitboxConfig & { width: number }): MeleeHitbox {
        const offset = {
            x: Math.cos(config.facingAngle) * config.range * 0.5,
            y: Math.sin(config.facingAngle) * config.range * 0.5,
        };

        return new MeleeHitbox({
            ownerId: config.ownerId,
            position: {
                x: config.ownerPosition.x + offset.x,
                y: config.ownerPosition.y + offset.y,
            },
            direction: {
                x: Math.cos(config.facingAngle),
                y: Math.sin(config.facingAngle),
            },
            shape: MeleeHitboxShape.RECTANGLE,
            rectangleWidth: config.width,
            rectangleHeight: config.range,
            baseDamage: config.baseDamage,
            damageType: config.damageType || DamageType.NORMAL,
            lifetime: config.duration || 0.1,
            hitboxRadius: config.range * 0.5, // 用于简化碰撞检测
            piercing: config.piercing || false,
            canCrit: config.canCrit ?? true,
            critRate: config.critRate || 0.05,
            knockbackForce: config.knockbackForce,
        }, config.facingAngle);
    }

    protected onUpdate(_deltaTime: number): void {
        // 近战判定框通常不需要移动
        // 如果需要跟随拥有者，需要在 CombatSystem 中处理
    }

    /**
     * 重写碰撞检测，支持多种形状
     */
    override checkCollision(targetPos: { x: number; y: number }, targetRadius: number): boolean {
        switch (this.meleeData.shape) {
            case MeleeHitboxShape.CIRCLE:
                return this.checkCircleCollision(targetPos, targetRadius);
            case MeleeHitboxShape.SECTOR:
                return this.checkSectorCollision(targetPos, targetRadius);
            case MeleeHitboxShape.RECTANGLE:
                return this.checkRectangleCollision(targetPos, targetRadius);
            default:
                return super.checkCollision(targetPos, targetRadius);
        }
    }

    /**
     * 圆形碰撞检测
     */
    private checkCircleCollision(targetPos: { x: number; y: number }, targetRadius: number): boolean {
        const dx = this.data.position.x - targetPos.x;
        const dy = this.data.position.y - targetPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.data.hitboxRadius + targetRadius);
    }

    /**
     * 扇形碰撞检测
     */
    private checkSectorCollision(targetPos: { x: number; y: number }, targetRadius: number): boolean {
        // 获取攻击者位置（假设在判定框后方）
        const ownerPos = {
            x: this.data.position.x - this.data.direction.x * this.data.hitboxRadius * 0.3,
            y: this.data.position.y - this.data.direction.y * this.data.hitboxRadius * 0.3,
        };

        // 1. 检查距离
        const dx = targetPos.x - ownerPos.x;
        const dy = targetPos.y - ownerPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > this.data.hitboxRadius + targetRadius) {
            return false;
        }

        // 2. 检查角度
        const targetAngle = Math.atan2(dy, dx);
        const halfAngle = (this.meleeData.sectorAngle || Math.PI / 3) / 2;

        // 计算角度差
        let angleDiff = targetAngle - this.facingAngle;
        // 归一化到 [-PI, PI]
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        return Math.abs(angleDiff) <= halfAngle;
    }

    /**
     * 矩形碰撞检测
     */
    private checkRectangleCollision(targetPos: { x: number; y: number }, targetRadius: number): boolean {
        // 将目标位置转换到矩形的本地坐标系
        const dx = targetPos.x - this.data.position.x;
        const dy = targetPos.y - this.data.position.y;

        // 矩形的方向
        const cos = Math.cos(this.facingAngle);
        const sin = Math.sin(this.facingAngle);

        // 旋转到本地坐标
        const localX = dx * cos + dy * sin;
        const localY = -dx * sin + dy * cos;

        // 检查是否在矩形范围内（考虑目标半径）
        const halfWidth = (this.meleeData.rectangleWidth || 50) / 2 + targetRadius;
        const halfHeight = (this.meleeData.rectangleHeight || 100) / 2 + targetRadius;

        return Math.abs(localX) <= halfWidth && Math.abs(localY) <= halfHeight;
    }

    /**
     * 获取击退方向
     */
    getKnockbackDirection(): { x: number; y: number } {
        return {
            x: Math.cos(this.facingAngle),
            y: Math.sin(this.facingAngle),
        };
    }
}
