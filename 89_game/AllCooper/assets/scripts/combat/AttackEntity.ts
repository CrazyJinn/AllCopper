/**
 * 攻击实体系统
 * 管理攻击的生命周期、移动和碰撞检测
 */

import { DamageType } from '../core/GameConfig';

/** 攻击实体类型 */
export enum AttackEntityType {
    /** 投射物（子弹、箭矢等） */
    PROJECTILE = 'projectile',
    /** 近战判定框 */
    MELEE_HITBOX = 'melee_hitbox',
    /** AOE 区域 */
    AOE = 'aoe',
}

/** 攻击实体状态 */
export enum AttackEntityState {
    /** 活跃中 */
    ACTIVE = 'active',
    /** 已命中（等待销毁） */
    HIT = 'hit',
    /** 已过期 */
    EXPIRED = 'expired',
}

/** 攻击实体基础数据 */
export interface AttackEntityData {
    /** 唯一ID */
    id?: string;
    /** 所属者ID（发起攻击的角色） */
    ownerId: string;
    /** 位置 */
    position: { x: number; y: number };
    /** 方向（单位向量） */
    direction: { x: number; y: number };
    /** 基础伤害 */
    baseDamage: number;
    /** 伤害类型 */
    damageType: DamageType;
    /** 最大存活时间（秒） */
    lifetime: number;
    /** 是否穿透（命中后不销毁） */
    piercing: boolean;
    /** 最大穿透次数（0 = 无限） */
    maxPierceCount?: number;
    /** 是否可以暴击 */
    canCrit: boolean;
    /** 暴击率 */
    critRate: number;
    /** 碰撞半径 */
    hitboxRadius: number;
    /** 阵营（用于友军伤害判断） */
    faction?: string;
    /** 已命中的目标ID集合 */
    hitTargets?: Set<string>;
}

/** ID生成器 */
let entityIdCounter = 0;
export function generateAttackEntityId(): string {
    return `attack_${Date.now()}_${entityIdCounter++}`;
}

/**
 * 攻击实体基类
 */
export abstract class AttackEntity {
    protected data: Required<Pick<AttackEntityData, 'id'>> & Omit<AttackEntityData, 'id'>;
    /** 已存活时间 */
    protected elapsedLifetime: number = 0;
    /** 当前状态 */
    protected _state: AttackEntityState = AttackEntityState.ACTIVE;
    /** 当前穿透次数 */
    protected pierceCount: number = 0;

    constructor(data: AttackEntityData) {
        this.data = {
            ...data,
            id: data.id || generateAttackEntityId(),
            hitTargets: data.hitTargets || new Set<string>(),
        } as Required<Pick<AttackEntityData, 'id'>> & Omit<AttackEntityData, 'id'>;
    }

    /** 获取ID */
    get id(): string {
        return this.data.id;
    }

    /** 获取所属者ID */
    get ownerId(): string {
        return this.data.ownerId;
    }

    /** 获取类型 */
    abstract get type(): AttackEntityType;

    /** 获取位置 */
    get position(): { x: number; y: number } {
        return { ...this.data.position };
    }

    /** 获取方向 */
    get direction(): { x: number; y: number } {
        return { ...this.data.direction };
    }

    /** 获取碰撞半径 */
    get hitboxRadius(): number {
        return this.data.hitboxRadius;
    }

    /** 获取状态 */
    get state(): AttackEntityState {
        return this._state;
    }

    /** 是否已结束 */
    get isFinished(): boolean {
        return this._state !== AttackEntityState.ACTIVE;
    }

    /** 获取攻击数据 */
    getAttackData(): AttackEntityData {
        return { ...this.data, hitTargets: this.data.hitTargets };
    }

    /**
     * 每帧更新
     * @param deltaTime 帧间隔
     * @returns 是否仍然存活
     */
    update(deltaTime: number): boolean {
        if (this.isFinished) {
            return false;
        }

        // 更新存活时间
        this.elapsedLifetime += deltaTime;

        // 检查是否过期
        if (this.elapsedLifetime >= this.data.lifetime) {
            this._state = AttackEntityState.EXPIRED;
            return false;
        }

        // 子类实现的更新逻辑
        this.onUpdate(deltaTime);

        return !this.isFinished;
    }

    /**
     * 子类实现的更新逻辑
     */
    protected abstract onUpdate(deltaTime: number): void;

    /**
     * 检查是否可以命中目标
     */
    canHitTarget(targetId: string, targetFaction?: string): boolean {
        // 不能命中自己
        if (targetId === this.data.ownerId) {
            return false;
        }

        // 检查友军伤害（同阵营不造成伤害）
        if (this.data.faction && targetFaction && this.data.faction === targetFaction) {
            return false;
        }

        // 检查是否已经命中过
        if (this.data.hitTargets.has(targetId)) {
            return false;
        }

        return true;
    }

    /**
     * 记录命中目标
     */
    recordHit(targetId: string): void {
        this.data.hitTargets.add(targetId);

        // 非穿透攻击，标记为命中状态
        if (!this.data.piercing) {
            this._state = AttackEntityState.HIT;
            return;
        }

        // 穿透攻击，检查穿透次数
        this.pierceCount++;
        if (this.data.maxPierceCount && this.pierceCount >= this.data.maxPierceCount) {
            this._state = AttackEntityState.HIT;
        }
    }

    /**
     * 设置位置
     */
    setPosition(x: number, y: number): void {
        this.data.position = { x, y };
    }

    /**
     * 检查与目标的碰撞（默认圆形碰撞）
     * 子类可以重写此方法实现不同形状的碰撞检测
     */
    checkCollision(targetPos: { x: number; y: number }, targetRadius: number): boolean {
        const dx = this.data.position.x - targetPos.x;
        const dy = this.data.position.y - targetPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.data.hitboxRadius + targetRadius);
    }

    /**
     * 销毁
     */
    destroy(): void {
        this._state = AttackEntityState.EXPIRED;
    }
}
