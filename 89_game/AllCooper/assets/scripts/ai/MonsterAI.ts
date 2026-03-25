/**
 * 怪物AI系统
 * 实现怪物的行为逻辑
 */

import { MonsterData, MonsterRuntimeState, MonsterDataFactory } from '../data/MonsterData';
import { eventSystem, GameEvent } from '../core/EventSystem';
import { combatSystem } from '../combat/CombatSystem';
import { DamageType } from '../core/GameConfig';

/** AI状态 */
export enum AIState {
    /** 空闲 */
    IDLE = 'idle',
    /** 巡逻 */
    PATROL = 'patrol',
    /** 追击 */
    CHASE = 'chase',
    /** 攻击 */
    ATTACK = 'attack',
    /** 返回 */
    RETURN = 'return',
    /** 特殊状态 */
    SPECIAL = 'special',
    /** 死亡 */
    DEAD = 'dead',
}

/** 怪物AI控制器 */
export class MonsterAI {
    /** 怪物数据 */
    readonly monsterData: MonsterData;
    /** 运行时状态 */
    runtimeState: MonsterRuntimeState;
    /** 当前AI状态 */
    private _aiState: AIState = AIState.IDLE;

    /** 位置 */
    private _position: { x: number; y: number };
    /** 目标位置 */
    private _targetPosition: { x: number; y: number } | null = null;
    /** 仇恨目标ID */
    private _targetId: string | null = null;

    /** 巡逻目标点 */
    private patrolTarget: { x: number; y: number } | null = null;
    /** 攻击冷却 */
    private attackCooldown: number = 0;

    /** Cocos节点引用 */
    private node: any = null;

    constructor(monsterData: MonsterData, spawnX: number, spawnY: number) {
        this.monsterData = monsterData;
        this.runtimeState = MonsterDataFactory.createRuntimeState(monsterData, spawnX, spawnY);
        this._position = { x: spawnX, y: spawnY };
    }

    /** 获取位置 */
    get position(): { x: number; y: number } {
        return { ...this._position };
    }

    /** 获取AI状态 */
    get aiState(): AIState {
        return this._aiState;
    }

    /** 是否死亡 */
    isDead(): boolean {
        return this.runtimeState.isDead;
    }

    /**
     * 设置节点引用
     */
    setNode(node: any): void {
        this.node = node;
    }

    /**
     * 设置位置
     */
    setPosition(x: number, y: number): void {
        this._position = { x, y };
        if (this.node) {
            this.node.setPosition(x, y);
        }
    }

    /**
     * 更新AI
     */
    update(deltaTime: number): void {
        if (this.isDead()) return;

        // 更新冷却
        this.updateCooldowns(deltaTime);

        // 检查特殊状态触发
        this.checkSpecialTrigger();

        // 根据AI状态执行行为
        switch (this._aiState) {
            case AIState.IDLE:
                this.updateIdle(deltaTime);
                break;
            case AIState.PATROL:
                this.updatePatrol(deltaTime);
                break;
            case AIState.CHASE:
                this.updateChase(deltaTime);
                break;
            case AIState.ATTACK:
                this.updateAttack(deltaTime);
                break;
            case AIState.RETURN:
                this.updateReturn(deltaTime);
                break;
            case AIState.SPECIAL:
                this.updateSpecial(deltaTime);
                break;
        }
    }

    /**
     * 更新冷却
     */
    private updateCooldowns(deltaTime: number): void {
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);

        this.runtimeState.abilityCooldowns.forEach((cooldown, abilityId) => {
            if (cooldown > 0) {
                this.runtimeState.abilityCooldowns.set(abilityId, cooldown - deltaTime);
            }
        });
    }

    /**
     * 检查特殊状态触发
     */
    private checkSpecialTrigger(): void {
        if (!this.monsterData.special || this.runtimeState.specialActive) return;

        const trigger = this.monsterData.special.trigger;
        if (!trigger) return;

        // 解析触发条件
        if (trigger.includes('hp <')) {
            const threshold = parseFloat(trigger.match(/\d+/)?.[0] || '0') / 100;
            const hpRatio = this.runtimeState.currentHp / this.monsterData.stats.maxHp;

            if (hpRatio < threshold) {
                this.triggerSpecial();
            }
        }
    }

    /**
     * 触发特殊状态
     */
    private triggerSpecial(): void {
        this.runtimeState.specialActive = true;
        this._aiState = AIState.SPECIAL;

        console.log(`[MonsterAI] ${this.monsterData.name} 触发特殊状态: ${this.monsterData.special!.type}`);

        eventSystem.emit(GameEvent.BOSS_PHASE_CHANGE, {
            monsterId: this.monsterData.id,
            phase: this.monsterData.special!.type,
        } as any);
    }

    /**
     * 更新空闲状态
     */
    private updateIdle(deltaTime: number): void {
        // 检查是否有目标进入仇恨范围
        const target = this.findTargetInRange(this.monsterData.aiConfig.aggroRange);
        if (target) {
            this._targetId = target.id;
            this._aiState = AIState.CHASE;
            return;
        }

        // 有巡逻半径则开始巡逻
        if (this.monsterData.aiConfig.patrolRadius > 0) {
            this._aiState = AIState.PATROL;
        }
    }

    /**
     * 更新巡逻状态
     */
    private updatePatrol(deltaTime: number): void {
        // 检查目标
        const target = this.findTargetInRange(this.monsterData.aiConfig.aggroRange);
        if (target) {
            this._targetId = target.id;
            this._aiState = AIState.CHASE;
            return;
        }

        // 生成巡逻目标点
        if (!this.patrolTarget) {
            const radius = this.monsterData.aiConfig.patrolRadius;
            const spawn = this.runtimeState.spawnPosition;
            this.patrolTarget = {
                x: spawn.x + (Math.random() - 0.5) * radius * 2,
                y: spawn.y + (Math.random() - 0.5) * radius * 2,
            };
        }

        // 移动到巡逻点
        const distance = this.getDistanceTo(this.patrolTarget);
        if (distance < 10) {
            this.patrolTarget = null;
            this._aiState = AIState.IDLE;
        } else {
            this.moveToward(this.patrolTarget, deltaTime, this.monsterData.stats.speed * 0.5);
        }
    }

    /**
     * 更新追击状态
     */
    private updateChase(deltaTime: number): void {
        const target = this.getTarget();
        if (!target) {
            this._targetId = null;
            this._aiState = AIState.RETURN;
            return;
        }

        const distance = this.getDistanceTo(target.position);

        // 检查是否超出追击距离
        const distanceToSpawn = this.getDistanceTo(this.runtimeState.spawnPosition);
        if (distanceToSpawn > this.monsterData.aiConfig.chaseDistance) {
            this._targetId = null;
            this._aiState = AIState.RETURN;
            return;
        }

        // 检查是否进入攻击范围
        if (distance <= this.monsterData.aiConfig.attackRange) {
            this._aiState = AIState.ATTACK;
            return;
        }

        // 追击目标
        this.moveToward(target.position, deltaTime, this.monsterData.stats.speed);
    }

    /**
     * 更新攻击状态
     */
    private updateAttack(deltaTime: number): void {
        const target = this.getTarget();
        if (!target) {
            this._targetId = null;
            this._aiState = AIState.RETURN;
            return;
        }

        const distance = this.getDistanceTo(target.position);

        // 检查目标是否离开攻击范围
        if (distance > this.monsterData.aiConfig.attackRange * 1.5) {
            this._aiState = AIState.CHASE;
            return;
        }

        // 执行攻击
        if (this.attackCooldown <= 0) {
            this.performAttack(target);
            this.attackCooldown = this.monsterData.aiConfig.attackInterval;
        }
    }

    /**
     * 更新返回状态
     */
    private updateReturn(deltaTime: number): void {
        const spawn = this.runtimeState.spawnPosition;
        const distance = this.getDistanceTo(spawn);

        if (distance < 10) {
            this._aiState = AIState.IDLE;
            return;
        }

        this.moveToward(spawn, deltaTime, this.monsterData.stats.speed);
    }

    /**
     * 更新特殊状态
     */
    private updateSpecial(deltaTime: number): void {
        const special = this.monsterData.special;
        if (!special) {
            this._aiState = AIState.IDLE;
            return;
        }

        switch (special.type) {
            case 'berserk':
                // 狂暴状态：增加攻击和速度
                const target = this.getTarget();
                if (target) {
                    if (this.getDistanceTo(target.position) <= this.monsterData.aiConfig.attackRange) {
                        if (this.attackCooldown <= 0) {
                            this.performAttack(target, 1.5); // 1.5倍伤害
                            this.attackCooldown = this.monsterData.aiConfig.attackInterval * 0.7; // 更快攻击
                        }
                    } else {
                        this.moveToward(target.position, deltaTime, this.monsterData.stats.speed * 1.3);
                    }
                }
                break;

            case 'summon':
                // 召唤小怪
                // 实际实现需要调用怪物生成系统
                this._aiState = AIState.CHASE;
                break;

            default:
                this._aiState = AIState.CHASE;
                break;
        }
    }

    /**
     * 执行攻击
     */
    private performAttack(target: any, damageMultiplier: number = 1): void {
        const ability = this.selectAbility();
        if (!ability) return;

        // 检查能力冷却
        const cooldown = this.runtimeState.abilityCooldowns.get(ability.id) || 0;
        if (cooldown > 0) return;

        // 执行攻击
        combatSystem.performAttack({
            attackerId: this.monsterData.id,
            attackType: ability.type === 'ranged' ? 'ranged' : 'melee',
            baseDamage: ability.damage * damageMultiplier,
            damageType: ability.damageType as DamageType,
            range: ability.range,
            position: this._position,
            direction: {
                x: target.position.x - this._position.x,
                y: target.position.y - this._position.y,
            },
            canCrit: false,
            critRate: 0,
        });

        // 设置冷却
        this.runtimeState.abilityCooldowns.set(ability.id, ability.cooldown);
    }

    /**
     * 选择能力
     */
    private selectAbility(): MonsterData['abilities'][0] | null {
        const abilities = this.monsterData.abilities;
        if (abilities.length === 0) return null;

        // 选择冷却完成的能力
        const available = abilities.filter(a => {
            const cooldown = this.runtimeState.abilityCooldowns.get(a.id) || 0;
            return cooldown <= 0;
        });

        if (available.length === 0) return abilities[0]; // 默认使用第一个

        // 随机选择
        return available[Math.floor(Math.random() * available.length)];
    }

    /**
     * 查找范围内的目标
     */
    private findTargetInRange(range: number): any {
        // 实际实现需要查询战斗系统中的玩家实体
        return null;
    }

    /**
     * 获取当前目标
     */
    private getTarget(): any {
        if (!this._targetId) return null;
        return combatSystem.getEntity(this._targetId);
    }

    /**
     * 计算到目标点的距离
     */
    private getDistanceTo(target: { x: number; y: number }): number {
        const dx = this._position.x - target.x;
        const dy = this._position.y - target.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 向目标点移动
     */
    private moveToward(target: { x: number; y: number }, deltaTime: number, speed: number): void {
        const dx = target.x - this._position.x;
        const dy = target.y - this._position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 1) return;

        const moveX = (dx / distance) * speed * deltaTime;
        const moveY = (dy / distance) * speed * deltaTime;

        this._position.x += moveX;
        this._position.y += moveY;

        if (this.node) {
            this.node.setPosition(this._position.x, this._position.y);
        }
    }

    /**
     * 受到伤害
     */
    takeDamage(damage: number, damageType: string): void {
        if (this.isDead()) return;

        let hpDamage = damage;
        let shieldDamage = 0;

        if (damageType !== 'poison' && this.runtimeState.currentShield > 0) {
            const absorbRate = this.monsterData.stats.shieldAbsorbRate;
            shieldDamage = Math.min(damage * absorbRate, this.runtimeState.currentShield);
            hpDamage = damage * (1 - absorbRate);
        }

        this.runtimeState.currentShield -= shieldDamage;
        this.runtimeState.currentHp -= hpDamage;

        eventSystem.emit(GameEvent.ENEMY_DAMAGED, {
            monsterId: this.monsterData.id,
            damage,
            damageType,
        });

        if (this.runtimeState.currentHp <= 0) {
            this.die();
        }
    }

    /**
     * 死亡
     */
    private die(): void {
        this.runtimeState.isDead = true;
        this._aiState = AIState.DEAD;

        eventSystem.emit(GameEvent.ENEMY_DIED, {
            monsterId: this.monsterData.id,
            position: this._position,
            drops: this.monsterData.drops,
        });
    }
}
