/**
 * 玩家控制器
 * 处理玩家角色的移动、动作控制
 */

import { inputManager, InputAction } from './InputManager';
import { StateMachine, PlayerStateName, BaseState } from './StateMachine';
import { CharacterData, CharacterRuntimeState, CharacterDataFactory } from '../data/CharacterData';
import { eventSystem, GameEvent } from '../core/EventSystem';
import { Faction } from '../core/GameConfig';

/** 玩家上下文 */
export interface PlayerContext {
    controller: PlayerController;
}

/** 待机状态 */
class IdleState extends BaseState<PlayerContext> {
    constructor() {
        super(PlayerStateName.IDLE);
    }

    enter(context: PlayerContext): void {
        const controller = context.controller;
        controller.playAnimation('idle');
    }

    update(context: PlayerContext, deltaTime: number): void {
        const controller = context.controller;
        const input = inputManager;

        // 检查闪避
        if (input.isActionJustPressed(InputAction.DODGE)) {
            controller.stateMachine.changeState(PlayerStateName.DODGE);
            return;
        }

        // 检查攻击
        if (input.isActionJustPressed(InputAction.ATTACK)) {
            controller.stateMachine.changeState(PlayerStateName.ATTACK);
            return;
        }

        // 检查技能
        if (input.isActionJustPressed(InputAction.SKILL_1)) {
            controller.stateMachine.changeState(PlayerStateName.SKILL_1);
            return;
        }

        if (input.isActionJustPressed(InputAction.SKILL_2)) {
            controller.stateMachine.changeState(PlayerStateName.SKILL_2);
            return;
        }

        if (input.isActionJustPressed(InputAction.ULTIMATE)) {
            controller.stateMachine.changeState(PlayerStateName.ULTIMATE);
            return;
        }

        // 检查移动
        const movement = input.movementVector;
        if (movement.x !== 0 || movement.y !== 0) {
            controller.stateMachine.changeState(PlayerStateName.WALK);
        }
    }
}

/** 行走状态 */
class WalkState extends BaseState<PlayerContext> {
    constructor() {
        super(PlayerStateName.WALK);
    }

    enter(context: PlayerContext): void {
        context.controller.playAnimation('walk');
    }

    update(context: PlayerContext, deltaTime: number): void {
        const controller = context.controller;
        const input = inputManager;

        // 检查闪避
        if (input.isActionJustPressed(InputAction.DODGE)) {
            controller.stateMachine.changeState(PlayerStateName.DODGE);
            return;
        }

        // 检查攻击
        if (input.isActionJustPressed(InputAction.ATTACK)) {
            controller.stateMachine.changeState(PlayerStateName.ATTACK);
            return;
        }

        // 检查技能
        if (input.isActionJustPressed(InputAction.SKILL_1)) {
            controller.stateMachine.changeState(PlayerStateName.SKILL_1);
            return;
        }

        if (input.isActionJustPressed(InputAction.SKILL_2)) {
            controller.stateMachine.changeState(PlayerStateName.SKILL_2);
            return;
        }

        if (input.isActionJustPressed(InputAction.ULTIMATE)) {
            controller.stateMachine.changeState(PlayerStateName.ULTIMATE);
            return;
        }

        // 移动
        const movement = input.movementVector;
        if (movement.x !== 0 || movement.y !== 0) {
            controller.move(movement, deltaTime);
        } else {
            controller.stateMachine.changeState(PlayerStateName.IDLE);
        }
    }
}

/** 闪避状态 */
class DodgeState extends BaseState<PlayerContext> {
    private dodgeTimer: number = 0;
    private dodgeDuration: number = 0.5;
    private dodgeDirection: { x: number; y: number } = { x: 0, y: 0 };
    private dodgeSpeed: number = 400;

    constructor() {
        super(PlayerStateName.DODGE);
    }

    canEnter(context: PlayerContext): boolean {
        // 检查是否在冷却中
        return true;
    }

    enter(context: PlayerContext): void {
        const controller = context.controller;
        controller.playAnimation('dodge');
        controller.setInvincible(true);

        this.dodgeTimer = 0;

        // 确定闪避方向
        const movement = inputManager.movementVector;
        if (movement.x !== 0 || movement.y !== 0) {
            this.dodgeDirection = { ...movement };
        } else {
            // 默认向角色朝向闪避
            this.dodgeDirection = controller.getFacingDirection();
        }
    }

    update(context: PlayerContext, deltaTime: number): void {
        const controller = context.controller;
        this.dodgeTimer += deltaTime;

        // 闪避移动
        const speed = this.dodgeSpeed * (1 - this.dodgeTimer / this.dodgeDuration);
        controller.move(this.dodgeDirection, deltaTime, speed);

        if (this.dodgeTimer >= this.dodgeDuration) {
            controller.setInvincible(false);
            controller.stateMachine.changeState(PlayerStateName.IDLE);
        }
    }

    exit(context: PlayerContext): void {
        context.controller.setInvincible(false);
    }
}

/** 攻击状态 */
class AttackState extends BaseState<PlayerContext> {
    private attackTimer: number = 0;
    private attackDuration: number = 0.3;
    private hasDealtDamage: boolean = false;

    constructor() {
        super(PlayerStateName.ATTACK);
    }

    canEnter(context: PlayerContext): boolean {
        const controller = context.controller;
        return controller.canAttack();
    }

    enter(context: PlayerContext): void {
        const controller = context.controller;
        controller.playAnimation('attack');
        this.attackTimer = 0;
        this.hasDealtDamage = false;

        // 角色朝向鼠标
        controller.faceMouse();
    }

    update(context: PlayerContext, deltaTime: number): void {
        const controller = context.controller;
        this.attackTimer += deltaTime;

        // 在攻击帧造成伤害
        if (!this.hasDealtDamage && this.attackTimer >= this.attackDuration * 0.5) {
            controller.performAttack();
            this.hasDealtDamage = true;
        }

        if (this.attackTimer >= this.attackDuration) {
            controller.stateMachine.changeState(PlayerStateName.IDLE);
        }
    }

    exit(context: PlayerContext): void {
        context.controller.startAttackCooldown();
    }
}

/** 受伤状态 */
class HurtState extends BaseState<PlayerContext> {
    private hurtTimer: number = 0;
    private hurtDuration: number = 0.3;

    constructor() {
        super(PlayerStateName.HURT);
    }

    canEnter(context: PlayerContext): boolean {
        return !context.controller.isDead();
    }

    enter(context: PlayerContext): void {
        const controller = context.controller;
        controller.playAnimation('hurt');
        this.hurtTimer = 0;
    }

    update(context: PlayerContext, deltaTime: number): void {
        this.hurtTimer += deltaTime;

        if (this.hurtTimer >= this.hurtDuration) {
            context.controller.stateMachine.changeState(PlayerStateName.IDLE);
        }
    }
}

/** 死亡状态 */
class DeathState extends BaseState<PlayerContext> {
    constructor() {
        super(PlayerStateName.DEATH);
    }

    canEnter(context: PlayerContext): boolean {
        return context.controller.isDead();
    }

    enter(context: PlayerContext): void {
        const controller = context.controller;
        controller.playAnimation('death');
        controller.onDeath();
    }

    update(context: PlayerContext, deltaTime: number): void {
        // 死亡状态不更新
    }
}

/**
 * 玩家控制器类
 */
export class PlayerController {
    /** 角色数据 */
    readonly characterData: CharacterData;
    /** 运行时状态 */
    runtimeState: CharacterRuntimeState;
    /** 状态机 */
    stateMachine: StateMachine<PlayerContext>;
    /** 状态机上下文 */
    private context: PlayerContext;

    /** 位置 */
    private _position: { x: number; y: number } = { x: 0, y: 0 };
    /** 朝向角度（弧度） */
    private _facingAngle: number = 0;
    /** 当前速度 */
    private _velocity: { x: number; y: number } = { x: 0, y: 0 };

    /** Cocos节点引用（由引擎绑定） */
    private node: any = null;

    constructor(characterData: CharacterData) {
        this.characterData = characterData;
        this.runtimeState = CharacterDataFactory.createRuntimeState(characterData);
        this.context = { controller: this };
        this.stateMachine = new StateMachine<PlayerContext>(this.context);

        this.setupStates();
        this.stateMachine.setInitialState(PlayerStateName.IDLE);
    }

    /** 获取位置 */
    get position(): { x: number; y: number } {
        return { ...this._position };
    }

    /** 获取朝向角度 */
    get facingAngle(): number {
        return this._facingAngle;
    }

    /** 获取速度 */
    get velocity(): { x: number; y: number } {
        return { ...this._velocity };
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
     * 设置状态机状态
     */
    private setupStates(): void {
        // 添加状态
        this.stateMachine.addState(new IdleState());
        this.stateMachine.addState(new WalkState());
        this.stateMachine.addState(new DodgeState());
        this.stateMachine.addState(new AttackState());
        this.stateMachine.addState(new HurtState());
        this.stateMachine.addState(new DeathState());

        // 添加状态转换
        // 受伤状态可以从任何状态进入
        const states = [
            PlayerStateName.IDLE,
            PlayerStateName.WALK,
            PlayerStateName.DODGE,
            PlayerStateName.ATTACK,
        ];

        states.forEach(state => {
            this.stateMachine.addTransition(
                state,
                PlayerStateName.HURT,
                (ctx) => ctx.controller.runtimeState.currentHp < ctx.controller.characterData.stats.hp,
                100
            );

            this.stateMachine.addTransition(
                state,
                PlayerStateName.DEATH,
                (ctx) => ctx.controller.isDead(),
                200
            );
        });
    }

    /**
     * 每帧更新
     */
    update(deltaTime: number): void {
        // 更新输入
        inputManager.update(deltaTime);

        // 更新状态机
        this.stateMachine.update(deltaTime);

        // 更新冷却
        this.updateCooldowns(deltaTime);

        // 更新护盾恢复
        this.updateShieldRegen(deltaTime);
    }

    /**
     * 更新技能冷却
     */
    private updateCooldowns(deltaTime: number): void {
        const timers = this.runtimeState.skillTimers;

        if (timers.attack > 0) timers.attack -= deltaTime;
        if (timers.skill1 > 0) timers.skill1 -= deltaTime;
        if (timers.skill2 > 0) timers.skill2 -= deltaTime;
        if (timers.ultimate > 0) timers.ultimate -= deltaTime;
    }

    /**
     * 更新护盾恢复
     */
    private updateShieldRegen(deltaTime: number): void {
        const state = this.runtimeState;
        const stats = this.characterData.stats;

        if (state.currentShield < stats.maxShield) {
            state.shieldRegenTimer += deltaTime;

            if (state.shieldRegenTimer >= 3) { // 3秒未受伤害后开始恢复
                state.currentShield = Math.min(
                    stats.maxShield,
                    state.currentShield + stats.shieldRegenRate * deltaTime
                );
            }
        }
    }

    /**
     * 移动角色
     */
    move(direction: { x: number; y: number }, deltaTime: number, speed?: number): void {
        const moveSpeed = speed ?? this.characterData.stats.speed;
        this._velocity = {
            x: direction.x * moveSpeed,
            y: direction.y * moveSpeed,
        };

        this._position.x += this._velocity.x * deltaTime;
        this._position.y += this._velocity.y * deltaTime;

        if (this.node) {
            this.node.setPosition(this._position.x, this._position.y);
        }
    }

    /**
     * 角色朝向鼠标
     */
    faceMouse(): void {
        const mousePos = inputManager.mouse.worldPosition;
        const dx = mousePos.x - this._position.x;
        const dy = mousePos.y - this._position.y;
        this._facingAngle = Math.atan2(dy, dx);
    }

    /**
     * 获取朝向方向
     */
    getFacingDirection(): { x: number; y: number } {
        return {
            x: Math.cos(this._facingAngle),
            y: Math.sin(this._facingAngle),
        };
    }

    /** 动画播放回调 */
    private animationCallback: ((animName: string) => void) | null = null;

    /**
     * 设置动画播放回调
     */
    setAnimationCallback(callback: (animName: string) => void): void {
        this.animationCallback = callback;
    }

    /**
     * 播放动画
     */
    playAnimation(animName: string): void {
        if (this.animationCallback) {
            this.animationCallback(animName);
        }
        if (this.node) {
            // 调用Cocos的动画组件
            // this.node.getComponent(Animation).play(animName);
        }
    }

    /**
     * 设置无敌状态
     */
    setInvincible(invincible: boolean): void {
        this.runtimeState.isInvincible = invincible;
    }

    /**
     * 检查是否可以攻击
     */
    canAttack(): boolean {
        return this.runtimeState.skillTimers.attack <= 0 && !this.isDead();
    }

    /**
     * 执行攻击
     */
    performAttack(): void {
        const damage = this.characterData.stats.attack;
        eventSystem.emit(GameEvent.ATTACK_PERFORMED, {
            attackerId: this.characterData.id,
            damage,
            position: this._position,
            angle: this._facingAngle,
        } as any);
    }

    /**
     * 开始攻击冷却
     */
    startAttackCooldown(): void {
        this.runtimeState.skillTimers.attack = this.characterData.combat.attackCooldown;
    }

    /**
     * 受到伤害
     */
    takeDamage(damage: number, damageType: string = 'normal'): void {
        if (this.runtimeState.isInvincible || this.isDead()) return;

        // 重置护盾恢复计时器
        this.runtimeState.shieldRegenTimer = 0;

        // 计算实际伤害
        let hpDamage = 0;
        let shieldDamage = 0;

        switch (damageType) {
            case 'poison':
                // 中毒伤害直接扣HP
                hpDamage = damage;
                break;
            case 'shield_break':
                // 碎盾伤害只扣护盾
                shieldDamage = damage * 2;
                break;
            default:
                // 普通伤害按比例分配
                const absorbRate = this.characterData.stats.shieldAbsorbRate;
                shieldDamage = damage * absorbRate;
                hpDamage = damage * (1 - absorbRate);
                break;
        }

        // 扣除护盾
        if (shieldDamage > 0 && this.runtimeState.currentShield > 0) {
            const actualShieldDamage = Math.min(this.runtimeState.currentShield, shieldDamage);
            this.runtimeState.currentShield -= actualShieldDamage;
        }

        // 扣除HP
        if (hpDamage > 0) {
            this.runtimeState.currentHp -= hpDamage;
        }

        // 触发事件
        eventSystem.emit(GameEvent.PLAYER_DAMAGED, {
            damage,
            source: '',
            damageType,
        });

        // 检查死亡
        if (this.runtimeState.currentHp <= 0) {
            this.runtimeState.currentHp = 0;
            this.runtimeState.isDead = true;
        } else {
            // 进入受伤状态
            this.stateMachine.forceChangeState(PlayerStateName.HURT);
        }
    }

    /**
     * 治疗
     */
    heal(amount: number): void {
        const maxHp = this.characterData.stats.maxHp;
        this.runtimeState.currentHp = Math.min(maxHp, this.runtimeState.currentHp + amount);
        eventSystem.emit(GameEvent.PLAYER_HEALED, { amount });
    }

    /**
     * 检查是否死亡
     */
    isDead(): boolean {
        return this.runtimeState.isDead;
    }

    /**
     * 死亡处理
     */
    onDeath(): void {
        eventSystem.emit(GameEvent.PLAYER_DIED);
    }
}
