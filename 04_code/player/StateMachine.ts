/**
 * 状态机
 * 通用的有限状态机实现，用于角色状态管理
 */

/** 状态接口 */
export interface IState<T> {
    /** 状态名称 */
    name: string;
    /** 进入状态时调用 */
    enter(context: T): void;
    /** 更新时调用 */
    update(context: T, deltaTime: number): void;
    /** 退出状态时调用 */
    exit(context: T): void;
    /** 检查是否可以转换到此状态 */
    canEnter(context: T): boolean;
}

/** 状态转换条件 */
export type TransitionCondition<T> = (context: T) => boolean;

/** 状态转换配置 */
export interface TransitionConfig<T> {
    /** 目标状态名称 */
    toState: string;
    /** 转换条件 */
    condition: TransitionCondition<T>;
    /** 优先级（数字越大优先级越高） */
    priority: number;
}

/**
 * 状态机类
 */
export class StateMachine<T> {
    /** 所有状态 */
    private states: Map<string, IState<T>> = new Map();
    /** 状态转换映射 */
    private transitions: Map<string, TransitionConfig<T>[]> = new Map();
    /** 当前状态 */
    private _currentState: IState<T> | null = null;
    /** 上下文对象 */
    private context: T;
    /** 状态历史（用于调试） */
    private stateHistory: string[] = [];
    /** 最大历史记录数 */
    private maxHistoryLength: number = 10;

    constructor(context: T) {
        this.context = context;
    }

    /** 获取当前状态名称 */
    get currentStateName(): string | null {
        return this._currentState?.name || null;
    }

    /** 获取当前状态 */
    get currentState(): IState<T> | null {
        return this._currentState;
    }

    /** 是否在某个状态中 */
    isInState(stateName: string): boolean {
        return this._currentState?.name === stateName;
    }

    /**
     * 添加状态
     */
    addState(state: IState<T>): void {
        this.states.set(state.name, state);
    }

    /**
     * 添加状态转换
     * @param fromState 源状态名称
     * @param toState 目标状态名称
     * @param condition 转换条件
     * @param priority 优先级
     */
    addTransition(
        fromState: string,
        toState: string,
        condition: TransitionCondition<T>,
        priority: number = 0
    ): void {
        if (!this.transitions.has(fromState)) {
            this.transitions.set(fromState, []);
        }
        this.transitions.get(fromState)!.push({
            toState,
            condition,
            priority,
        });
    }

    /**
     * 设置初始状态
     */
    setInitialState(stateName: string): void {
        const state = this.states.get(stateName);
        if (state) {
            this._currentState = state;
            state.enter(this.context);
            this.addToHistory(stateName);
        }
    }

    /**
     * 强制切换状态（忽略转换条件）
     */
    forceChangeState(stateName: string): void {
        const state = this.states.get(stateName);
        if (!state) {
            console.warn(`[StateMachine] 状态不存在: ${stateName}`);
            return;
        }

        if (this._currentState) {
            this._currentState.exit(this.context);
        }

        this._currentState = state;
        state.enter(this.context);
        this.addToHistory(stateName);
    }

    /**
     * 尝试切换状态
     */
    changeState(stateName: string): boolean {
        if (!this._currentState) {
            return false;
        }

        const targetState = this.states.get(stateName);
        if (!targetState) {
            console.warn(`[StateMachine] 目标状态不存在: ${stateName}`);
            return false;
        }

        // 检查是否可以转换
        if (!targetState.canEnter(this.context)) {
            return false;
        }

        // 执行转换
        this._currentState.exit(this.context);
        this._currentState = targetState;
        targetState.enter(this.context);
        this.addToHistory(stateName);

        return true;
    }

    /**
     * 更新状态机
     */
    update(deltaTime: number): void {
        if (!this._currentState) return;

        // 检查自动转换
        this.checkTransitions();

        // 更新当前状态
        this._currentState.update(this.context, deltaTime);
    }

    /**
     * 检查状态转换
     */
    private checkTransitions(): void {
        if (!this._currentState) return;

        const transitions = this.transitions.get(this._currentState.name);
        if (!transitions || transitions.length === 0) return;

        // 按优先级排序
        const sortedTransitions = [...transitions].sort((a, b) => b.priority - a.priority);

        // 检查每个转换条件
        for (const transition of sortedTransitions) {
            if (transition.condition(this.context)) {
                this.changeState(transition.toState);
                return;
            }
        }
    }

    /**
     * 添加到历史记录
     */
    private addToHistory(stateName: string): void {
        this.stateHistory.push(stateName);
        if (this.stateHistory.length > this.maxHistoryLength) {
            this.stateHistory.shift();
        }
    }

    /**
     * 获取状态历史
     */
    getHistory(): string[] {
        return [...this.stateHistory];
    }

    /**
     * 清除所有状态
     */
    clear(): void {
        if (this._currentState) {
            this._currentState.exit(this.context);
        }
        this._currentState = null;
        this.states.clear();
        this.transitions.clear();
        this.stateHistory = [];
    }
}

/** 玩家状态名称 */
export enum PlayerStateName {
    /** 待机 */
    IDLE = 'idle',
    /** 行走 */
    WALK = 'walk',
    /** 奔跑 */
    RUN = 'run',
    /** 闪避 */
    DODGE = 'dodge',
    /** 攻击 */
    ATTACK = 'attack',
    /** 技能1 */
    SKILL_1 = 'skill_1',
    /** 技能2 */
    SKILL_2 = 'skill_2',
    /** 终极技能 */
    ULTIMATE = 'ultimate',
    /** 受伤 */
    HURT = 'hurt',
    /** 死亡 */
    DEATH = 'death',
    /** 换弹 */
    RELOAD = 'reload',
    /** 冥想（法师恢复魔法） */
    MEDITATE = 'meditate',
}

/** 基础状态类 */
export abstract class BaseState<T> implements IState<T> {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    enter(context: T): void {
        // 子类实现
    }

    update(context: T, deltaTime: number): void {
        // 子类实现
    }

    exit(context: T): void {
        // 子类实现
    }

    canEnter(context: T): boolean {
        return true;
    }
}
