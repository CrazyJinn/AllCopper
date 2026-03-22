/**
 * 输入管理器
 * 处理键盘和鼠标输入，支持按键重映射
 */

import { InputMapping, MouseMapping } from '../core/GameConfig';

/** 输入动作类型 */
export enum InputAction {
    /** 向上移动 */
    MOVE_UP = 'MOVE_UP',
    /** 向下移动 */
    MOVE_DOWN = 'MOVE_DOWN',
    /** 向左移动 */
    MOVE_LEFT = 'MOVE_LEFT',
    /** 向右移动 */
    MOVE_RIGHT = 'MOVE_RIGHT',
    /** 翻滚闪避 */
    DODGE = 'DODGE',
    /** 技能1 */
    SKILL_1 = 'SKILL_1',
    /** 技能2 */
    SKILL_2 = 'SKILL_2',
    /** 换弹/冥想 */
    RELOAD = 'RELOAD',
    /** 拾取/交互 */
    INTERACT = 'INTERACT',
    /** 暂停 */
    PAUSE = 'PAUSE',
    /** 地图 */
    MAP = 'MAP',
    /** 背包 */
    INVENTORY = 'INVENTORY',
    /** 角色属性 */
    CHARACTER = 'CHARACTER',
    /** 攻击 */
    ATTACK = 'ATTACK',
    /** 终极技能 */
    ULTIMATE = 'ULTIMATE',
}

/** 按键状态 */
export interface KeyState {
    /** 是否按下 */
    isPressed: boolean;
    /** 是否刚按下（仅触发一次） */
    justPressed: boolean;
    /** 是否刚释放（仅触发一次） */
    justReleased: boolean;
    /** 按下持续时间（秒） */
    holdTime: number;
}

/** 鼠标状态 */
export interface MouseState {
    /** 位置 */
    position: { x: number; y: number };
    /** 世界坐标 */
    worldPosition: { x: number; y: number };
    /** 左键状态 */
    leftButton: KeyState;
    /** 右键状态 */
    rightButton: KeyState;
    /** 中键状态 */
    middleButton: KeyState;
    /** 滚轮增量 */
    scrollDelta: number;
}

/** 按键映射配置 */
type KeyMapping = Record<InputAction, string | number>;

/**
 * 输入管理器类
 * 单例模式
 */
export class InputManager {
    private static _instance: InputManager;

    /** 按键状态映射 */
    private keyStates: Map<string, KeyState> = new Map();
    /** 鼠标状态 */
    private mouseState: MouseState;
    /** 按键映射 */
    private keyMapping: KeyMapping;
    /** 是否启用 */
    private _enabled: boolean = true;
    /** 移动向量缓存 */
    private _movementVector: { x: number; y: number } = { x: 0, y: 0 };

    private constructor() {
        this.mouseState = this.createDefaultMouseState();
        this.keyMapping = this.createDefaultKeyMapping();
        this.setupEventListeners();
    }

    static get instance(): InputManager {
        if (!this._instance) {
            this._instance = new InputManager();
        }
        return this._instance;
    }

    /** 获取移动向量（归一化） */
    get movementVector(): { x: number; y: number } {
        return this._movementVector;
    }

    /** 获取鼠标状态 */
    get mouse(): MouseState {
        return this.mouseState;
    }

    /** 是否启用输入 */
    get enabled(): boolean {
        return this._enabled;
    }

    set enabled(value: boolean) {
        this._enabled = value;
        if (!value) {
            this.resetAllStates();
        }
    }

    /**
     * 创建默认按键映射
     */
    private createDefaultKeyMapping(): KeyMapping {
        return {
            [InputAction.MOVE_UP]: InputMapping.MOVE_UP,
            [InputAction.MOVE_DOWN]: InputMapping.MOVE_DOWN,
            [InputAction.MOVE_LEFT]: InputMapping.MOVE_LEFT,
            [InputAction.MOVE_RIGHT]: InputMapping.MOVE_RIGHT,
            [InputAction.DODGE]: InputMapping.DODGE,
            [InputAction.SKILL_1]: InputMapping.SKILL_1,
            [InputAction.SKILL_2]: InputMapping.SKILL_2,
            [InputAction.RELOAD]: InputMapping.RELOAD,
            [InputAction.INTERACT]: InputMapping.INTERACT,
            [InputAction.PAUSE]: InputMapping.PAUSE,
            [InputAction.MAP]: InputMapping.MAP,
            [InputAction.INVENTORY]: InputMapping.INVENTORY,
            [InputAction.CHARACTER]: InputMapping.CHARACTER,
            [InputAction.ATTACK]: MouseMapping.ATTACK.toString(),
            [InputAction.ULTIMATE]: MouseMapping.ULTIMATE.toString(),
        };
    }

    /**
     * 创建默认鼠标状态
     */
    private createDefaultMouseState(): MouseState {
        const defaultKeyState = this.createDefaultKeyState();
        return {
            position: { x: 0, y: 0 },
            worldPosition: { x: 0, y: 0 },
            leftButton: { ...defaultKeyState },
            rightButton: { ...defaultKeyState },
            middleButton: { ...defaultKeyState },
            scrollDelta: 0,
        };
    }

    /**
     * 创建默认按键状态
     */
    private createDefaultKeyState(): KeyState {
        return {
            isPressed: false,
            justPressed: false,
            justReleased: false,
            holdTime: 0,
        };
    }

    /**
     * 设置事件监听
     */
    private setupEventListeners(): void {
        // 键盘事件
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));

        // 鼠标事件
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        document.addEventListener('wheel', this.onMouseWheel.bind(this));
    }

    /**
     * 键盘按下事件
     */
    private onKeyDown(event: KeyboardEvent): void {
        if (!this._enabled) return;

        const key = event.key.toUpperCase();
        const state = this.keyStates.get(key) || this.createDefaultKeyState();

        if (!state.isPressed) {
            state.justPressed = true;
            state.isPressed = true;
        }

        this.keyStates.set(key, state);
    }

    /**
     * 键盘释放事件
     */
    private onKeyUp(event: KeyboardEvent): void {
        if (!this._enabled) return;

        const key = event.key.toUpperCase();
        const state = this.keyStates.get(key);

        if (state) {
            state.isPressed = false;
            state.justReleased = true;
            state.holdTime = 0;
        }
    }

    /**
     * 鼠标移动事件
     */
    private onMouseMove(event: MouseEvent): void {
        if (!this._enabled) return;

        this.mouseState.position = { x: event.clientX, y: event.clientY };
        // 世界坐标需要通过相机转换
    }

    /**
     * 鼠标按下事件
     */
    private onMouseDown(event: MouseEvent): void {
        if (!this._enabled) return;

        const button = this.getMouseButtonState(event.button);
        if (button) {
            button.isPressed = true;
            button.justPressed = true;
        }
    }

    /**
     * 鼠标释放事件
     */
    private onMouseUp(event: MouseEvent): void {
        if (!this._enabled) return;

        const button = this.getMouseButtonState(event.button);
        if (button) {
            button.isPressed = false;
            button.justReleased = true;
            button.holdTime = 0;
        }
    }

    /**
     * 鼠标滚轮事件
     */
    private onMouseWheel(event: WheelEvent): void {
        if (!this._enabled) return;

        this.mouseState.scrollDelta = event.deltaY > 0 ? -1 : 1;
    }

    /**
     * 获取鼠标按键状态
     */
    private getMouseButtonState(button: number): KeyState | null {
        switch (button) {
            case 0: return this.mouseState.leftButton;
            case 1: return this.mouseState.middleButton;
            case 2: return this.mouseState.rightButton;
            default: return null;
        }
    }

    /**
     * 更新输入状态（每帧调用）
     * @param deltaTime 帧间隔时间
     */
    update(deltaTime: number): void {
        // 更新按键持续时间
        this.keyStates.forEach((state) => {
            if (state.isPressed) {
                state.holdTime += deltaTime;
            }
            // 重置单帧状态
            state.justPressed = false;
            state.justReleased = false;
        });

        // 重置鼠标单帧状态
        this.mouseState.leftButton.justPressed = false;
        this.mouseState.leftButton.justReleased = false;
        this.mouseState.rightButton.justPressed = false;
        this.mouseState.rightButton.justReleased = false;
        this.mouseState.middleButton.justPressed = false;
        this.mouseState.middleButton.justReleased = false;
        this.mouseState.scrollDelta = 0;

        // 更新移动向量
        this.updateMovementVector();
    }

    /**
     * 更新移动向量
     */
    private updateMovementVector(): void {
        let x = 0;
        let y = 0;

        if (this.isActionPressed(InputAction.MOVE_UP)) y += 1;
        if (this.isActionPressed(InputAction.MOVE_DOWN)) y -= 1;
        if (this.isActionPressed(InputAction.MOVE_LEFT)) x -= 1;
        if (this.isActionPressed(InputAction.MOVE_RIGHT)) x += 1;

        // 归一化向量
        const length = Math.sqrt(x * x + y * y);
        if (length > 0) {
            x /= length;
            y /= length;
        }

        this._movementVector = { x, y };
    }

    /**
     * 检查动作是否按下
     */
    isActionPressed(action: InputAction): boolean {
        const key = this.keyMapping[action];
        if (typeof key === 'number') {
            // 鼠标按键
            const buttonState = this.getMouseButtonState(key);
            return buttonState?.isPressed || false;
        } else {
            // 键盘按键
            const state = this.keyStates.get(key.toUpperCase());
            return state?.isPressed || false;
        }
    }

    /**
     * 检查动作是否刚按下
     */
    isActionJustPressed(action: InputAction): boolean {
        const key = this.keyMapping[action];
        if (typeof key === 'number') {
            const buttonState = this.getMouseButtonState(key);
            return buttonState?.justPressed || false;
        } else {
            const state = this.keyStates.get(key.toUpperCase());
            return state?.justPressed || false;
        }
    }

    /**
     * 检查动作是否刚释放
     */
    isActionJustReleased(action: InputAction): boolean {
        const key = this.keyMapping[action];
        if (typeof key === 'number') {
            const buttonState = this.getMouseButtonState(key);
            return buttonState?.justReleased || false;
        } else {
            const state = this.keyStates.get(key.toUpperCase());
            return state?.justReleased || false;
        }
    }

    /**
     * 获取动作按住时间
     */
    getActionHoldTime(action: InputAction): number {
        const key = this.keyMapping[action];
        if (typeof key === 'number') {
            const buttonState = this.getMouseButtonState(key);
            return buttonState?.holdTime || 0;
        } else {
            const state = this.keyStates.get(key.toUpperCase());
            return state?.holdTime || 0;
        }
    }

    /**
     * 重映射按键
     * @param action 动作类型
     * @param newKey 新的按键
     */
    remapKey(action: InputAction, newKey: string): void {
        this.keyMapping[action] = newKey;
    }

    /**
     * 重置为默认按键映射
     */
    resetKeyMapping(): void {
        this.keyMapping = this.createDefaultKeyMapping();
    }

    /**
     * 重置所有状态
     */
    private resetAllStates(): void {
        this.keyStates.clear();
        this.mouseState = this.createDefaultMouseState();
        this._movementVector = { x: 0, y: 0 };
    }

    /**
     * 设置世界坐标（由相机系统调用）
     */
    setWorldPosition(x: number, y: number): void {
        this.mouseState.worldPosition = { x, y };
    }

    // ========== Cocos Creator 输入适配方法 ==========

    /**
     * 设置按键状态（供 Cocos 输入系统调用）
     * @param keyCode 按键码
     * @param pressed 是否按下
     */
    setKeyPressed(keyCode: any, pressed: boolean): void {
        const key = typeof keyCode === 'string' ? keyCode.toUpperCase() : String(keyCode);
        const state = this.keyStates.get(key) || this.createDefaultKeyState();

        if (pressed && !state.isPressed) {
            state.justPressed = true;
            state.isPressed = true;
        } else if (!pressed && state.isPressed) {
            state.isPressed = false;
            state.justReleased = true;
            state.holdTime = 0;
        }

        this.keyStates.set(key, state);
    }

    /**
     * 设置鼠标世界坐标（供 Cocos 输入系统调用）
     */
    setMouseWorldPosition(x: number, y: number): void {
        this.mouseState.worldPosition = { x, y };
    }

    /**
     * 设置动作按下状态（供 Cocos 输入系统调用）
     */
    setActionPressed(action: InputAction, pressed: boolean): void {
        if (action === InputAction.ATTACK) {
            if (pressed) {
                this.mouseState.leftButton.isPressed = true;
                this.mouseState.leftButton.justPressed = true;
            } else {
                this.mouseState.leftButton.isPressed = false;
                this.mouseState.leftButton.justReleased = true;
            }
        }
    }
}

/** 全局输入管理器实例 */
export const inputManager = InputManager.instance;
