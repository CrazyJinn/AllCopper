/**
 * 投射物类
 * 用于子弹、箭矢等飞行攻击
 */

import { AttackEntity, AttackEntityData, AttackEntityType } from './AttackEntity';
import { DamageType } from '../core/GameConfig';

/** 投射物数据 */
export interface ProjectileData extends AttackEntityData {
    /** 飞行速度 */
    speed: number;
    /** 是否受重力影响 */
    gravity?: number;
    /** 加速度 */
    acceleration?: number;
    /** 最大速度 */
    maxSpeed?: number;
    /** 追踪目标ID */
    homingTargetId?: string;
    /** 追踪强度（0-1） */
    homingStrength?: number;
    /** 轨迹特效ID */
    trailEffectId?: string;
    /** 命中特效ID */
    hitEffectId?: string;
}

/** 投射物配置 */
export interface ProjectileConfig {
    /** 发射者ID */
    ownerId: string;
    /** 初始位置 */
    position: { x: number; y: number };
    /** 初始方向 */
    direction: { x: number; y: number };
    /** 飞行速度 */
    speed: number;
    /** 基础伤害 */
    baseDamage: number;
    /** 伤害类型 */
    damageType?: DamageType;
    /** 存活时间 */
    lifetime?: number;
    /** 碰撞半径 */
    hitboxRadius?: number;
    /** 是否穿透 */
    piercing?: boolean;
    /** 最大穿透次数 */
    maxPierceCount?: number;
    /** 是否可以暴击 */
    canCrit?: boolean;
    /** 暴击率 */
    critRate?: number;
    /** 加速度 */
    acceleration?: number;
    /** 最大速度 */
    maxSpeed?: number;
    /** 追踪强度 */
    homingStrength?: number;
}

/**
 * 投射物类
 */
export class Projectile extends AttackEntity {
    private projectileData: ProjectileData;
    private currentSpeed: number;

    constructor(data: ProjectileData) {
        super(data);
        this.projectileData = { ...data };
        this.currentSpeed = data.speed;
    }

    /** 获取类型 */
    override get type(): AttackEntityType {
        return AttackEntityType.PROJECTILE;
    }

    /** 获取速度 */
    get speed(): number {
        return this.currentSpeed;
    }

    /** 获取当前速度向量 */
    get velocity(): { x: number; y: number } {
        return {
            x: this.data.direction.x * this.currentSpeed,
            y: this.data.direction.y * this.currentSpeed,
        };
    }

    /**
     * 工厂方法：从配置创建投射物
     */
    static create(config: ProjectileConfig): Projectile {
        // 标准化方向向量
        const dir = config.direction;
        const length = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
        const normalizedDir = length > 0 ? { x: dir.x / length, y: dir.y / length } : { x: 1, y: 0 };

        return new Projectile({
            ownerId: config.ownerId,
            position: { ...config.position },
            direction: normalizedDir,
            speed: config.speed,
            baseDamage: config.baseDamage,
            damageType: config.damageType || DamageType.NORMAL,
            lifetime: config.lifetime || 5,
            hitboxRadius: config.hitboxRadius || 10,
            piercing: config.piercing || false,
            maxPierceCount: config.maxPierceCount,
            canCrit: config.canCrit ?? true,
            critRate: config.critRate || 0.05,
            acceleration: config.acceleration,
            maxSpeed: config.maxSpeed,
            homingStrength: config.homingStrength,
        });
    }

    protected onUpdate(_deltaTime: number): void {
        // 应用加速度
        if (this.projectileData.acceleration) {
            this.currentSpeed = Math.min(
                this.currentSpeed + this.projectileData.acceleration * _deltaTime,
                this.projectileData.maxSpeed || this.currentSpeed * 2
            );
        }

        // 移动
        this.move(_deltaTime);
    }

    /**
     * 更新追踪方向
     */
    updateHomingDirection(targetPosition: { x: number; y: number }): void {
        if (!this.projectileData.homingStrength) return;

        const dx = targetPosition.x - this.data.position.x;
        const dy = targetPosition.y - this.data.position.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length === 0) return;

        // 目标方向
        const targetDir = { x: dx / length, y: dy / length };
        const strength = this.projectileData.homingStrength;

        // 插值计算新方向
        this.data.direction = {
            x: this.data.direction.x + (targetDir.x - this.data.direction.x) * strength,
            y: this.data.direction.y + (targetDir.y - this.data.direction.y) * strength,
        };

        // 重新标准化
        const newLength = Math.sqrt(
            this.data.direction.x * this.data.direction.x +
            this.data.direction.y * this.data.direction.y
        );
        if (newLength > 0) {
            this.data.direction = {
                x: this.data.direction.x / newLength,
                y: this.data.direction.y / newLength,
            };
        }
    }

    /**
     * 移动投射物
     */
    private move(deltaTime: number): void {
        const velocity = this.velocity;

        this.data.position.x += velocity.x * deltaTime;
        this.data.position.y += velocity.y * deltaTime;

        // 应用重力（如果有）
        if (this.projectileData.gravity) {
            this.data.direction.y += this.projectileData.gravity * deltaTime;
        }
    }
}
