/**
 * Cocos Creator 角色组件
 * 使用 SpriteAtlas 序列帧动画
 */

import { _decorator, Component, Node, Sprite, SpriteFrame, Vec3, Input, EventMouse, EventKeyboard, Camera, find, input, SpriteAtlas, Enum, UITransform, view } from 'cc';
import { PlayerController } from './PlayerController';
import { CharacterData, WEI_DATA, ROLAND_DATA } from '../data/CharacterData';
import { inputManager, InputAction } from './InputManager';

const { ccclass, property } = _decorator;

/** 角色类型枚举 */
export enum HeroType {
    WEI = 0,
    ROLAND = 1,
}

// 注册枚举到 Cocos Creator
Enum(HeroType);

/** 方向枚举 */
export enum Direction {
    DOWN = 'down',
    UP = 'up',
    LEFT = 'left',
    RIGHT = 'right',
}

/** 动作名称 */
export type ActionName = 'idle' | 'walk' | 'attack' | 'skill' | 'hurt' | 'dodge' | 'death';

/** 带方向的动作 */
export interface DirectedAction {
    action: ActionName;
    direction: Direction;
}

@ccclass('HeroComponent')
export class HeroComponent extends Component {
    // ========== 编辑器属性 ==========

    @property({ type: HeroType })
    heroType: HeroType = HeroType.WEI;

    @property(Sprite)
    sprite: Sprite | null = null;

    @property(Camera)
    camera: Camera | null = null;

    /** 角色 SpriteAtlas（包含所有动作帧） */
    @property(SpriteAtlas)
    atlas: SpriteAtlas | null = null;

    /** 背景图节点（用于计算边界） */
    @property(Node)
    backgroundNode: Node | null = null;

    /** 帧率（FPS） */
    @property
    frameRate: number = 12;

    // ========== 运行时属性 ==========

    private controller: PlayerController | null = null;
    private characterData: CharacterData | null = null;
    private tempVec3: Vec3 = new Vec3();

    /** 当前动作 */
    private currentAction: ActionName = 'idle';
    /** 当前方向 */
    private currentDirection: Direction = Direction.DOWN;
    /** 当前帧索引 */
    private frameIndex: number = 0;
    /** 帧计时器 */
    private frameTimer: number = 0;
    /** 当前动作帧列表 */
    private currentFrames: SpriteFrame[] = [];
    /** 是否在动画循环 */
    private loopAnimation: boolean = true;

    /** 缓存的帧数据 key: "{action}_{direction}" */
    private framesCache: Map<string, SpriteFrame[]> = new Map();

    onLoad() {
        this.initCharacterData();
        this.initInput();
        this.initController();
        this.loadFramesFromAtlas();
    }

    start() {
        if (this.controller) {
            const pos = this.node.getWorldPosition();
            this.controller.setPosition(pos.x, pos.y);
        }
        this.playAction('idle');
    }

    update(deltaTime: number) {
        if (!this.controller) return;

        this.updateMouseWorldPosition();
        // 注意：先让 controller 处理输入，再由 inputManager 重置状态
        this.controller.update(deltaTime);
        inputManager.update(deltaTime);
        this.syncPosition();
        this.updateCameraFollow();
        this.updateDirectionFromInput();
        this.updateFrameAnimation(deltaTime);
    }

    /**
     * 根据输入更新角色方向
     */
    private updateDirectionFromInput() {
        const movement = inputManager.movementVector;

        // 检测方向变化
        if (movement.x !== 0 || movement.y !== 0) {
            const newDirection = this.getDirectionFromMovement(movement.x, movement.y);
            if (newDirection !== this.currentDirection) {
                this.currentDirection = newDirection;
                // 如果正在播放需要方向的动画，更新帧
                if (this.currentAction === 'idle' || this.currentAction === 'walk') {
                    this.playAction(this.currentAction, newDirection);
                }
            }
        }
    }

    onDestroy() {
        try {
            input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
            input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
            input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
            input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        } catch (e) {
            // 忽略解绑错误
        }
    }

    // ========== 初始化 ==========

    private initCharacterData() {
        switch (this.heroType) {
            case HeroType.WEI:
                this.characterData = JSON.parse(JSON.stringify(WEI_DATA));
                break;
            case HeroType.ROLAND:
                this.characterData = JSON.parse(JSON.stringify(ROLAND_DATA));
                break;
            default:
                this.characterData = JSON.parse(JSON.stringify(WEI_DATA));
        }
    }

    private initInput() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
    }

    private initController() {
        if (!this.characterData) return;

        this.controller = new PlayerController(this.characterData);
        this.controller.setNode(this.node);
        this.controller.setAnimationCallback(this.playAction.bind(this));
    }

    // ========== 从 Atlas 加载帧 ==========

    /**
     * 从 SpriteAtlas 加载所有动作帧
     * 帧命名规范: {角色}_{动作}_{方向}_{帧号}
     * 例如: wei_walk_down_0001, wei_walk_up_0001
     *       wei_idle_down_0001 (待机默认朝下)
     *       左右方向通过水平翻转实现，无需单独帧
     */
    private loadFramesFromAtlas() {
        if (!this.atlas) return;

        const prefix = this.heroType === HeroType.WEI ? 'wei_' : 'roland_';
        // 只需要上下两个方向，左右通过翻转实现
        const directions = [Direction.DOWN, Direction.UP];

        // 所有动画都需要方向
        const directedActions: ActionName[] = ['idle', 'walk', 'attack', 'skill', 'hurt', 'dodge', 'death'];

        // 加载带方向的动画
        for (const action of directedActions) {
            for (const dir of directions) {
                const key = `${action}_${dir}`;
                const fullPrefix = `${prefix}${action}_${dir}`;
                const frames = this.loadActionFrames(fullPrefix);
                if (frames.length > 0) {
                    this.framesCache.set(key, frames);
                }
            }
        }
    }

    /**
     * 加载指定动作的所有帧
     */
    private loadActionFrames(prefix: string): SpriteFrame[] {
        if (!this.atlas) return [];

        const frames: SpriteFrame[] = [];
        let index = 1;

        // 尝试加载帧，直到找不到为止
        while (true) {
            // 尝试4位数字格式 (wei_walk_down_0001)
            const frameNum = index < 10 ? '000' + index : (index < 100 ? '00' + index : (index < 1000 ? '0' + index : String(index)));
            const frameName = `${prefix}_${frameNum}`;
            const frame = this.atlas.getSpriteFrame(frameName);

            if (frame) {
                frames.push(frame);
                index++;
            } else {
                break;
            }

            // 安全限制，最多 100 帧
            if (index > 100) break;
        }

        return frames;
    }

    /**
     * 根据移动向量获取方向
     * 只返回 UP 或 DOWN，左右通过翻转实现
     */
    private getDirectionFromMovement(x: number, y: number): Direction {
        if (x === 0 && y === 0) {
            return this.currentDirection; // 保持当前方向
        }

        // 只有上下移动才改变 UP/DOWN 状态
        if (y > 0) {
            return Direction.UP;
        } else if (y < 0) {
            return Direction.DOWN;
        }
        // 纯左右移动时保持当前方向
        return this.currentDirection;
    }

    // ========== 输入处理 ==========

    private onKeyDown(event: EventKeyboard) {
        inputManager.setKeyPressed(event.keyCode, true);
    }

    private onKeyUp(event: EventKeyboard) {
        inputManager.setKeyPressed(event.keyCode, false);
    }

    private onMouseMove(event: EventMouse) {
        // 鼠标位置在 updateMouseWorldPosition 中处理
    }

    private onMouseDown(event: EventMouse) {
        const button = event.getButton();
        if (button === 0) {
            console.log('[HeroComponent] 鼠标左键按下');
            inputManager.setActionPressed(InputAction.ATTACK, true);
        } else if (button === 2) {
            console.log('[HeroComponent] 鼠标右键按下');
        }
    }

    private updateMouseWorldPosition() {
        if (!this.camera) {
            const canvas = find('Canvas');
            this.camera = canvas?.getComponentInChildren(Camera) ?? null;
        }

        if (this.camera) {
            const mousePos = this.tempVec3;
            this.camera.screenToWorld(mousePos);
            inputManager.setMouseWorldPosition(mousePos.x, mousePos.y);
        }
    }

    // ========== 位置同步 ==========

    private syncPosition() {
        if (!this.controller) return;

        const pos = this.controller.position;
        this.node.setWorldPosition(pos.x, pos.y, 0);
    }

    // ========== 相机跟随 ==========

    /**
     * 更新相机跟随角色
     * 相机跟随角色移动，但不超出背景边界
     */
    private updateCameraFollow() {
        if (!this.camera || !this.controller) return;

        const playerPos = this.controller.position;
        const cameraNode = this.camera.node;

        // 获取相机视口大小（一半）
        const visibleSize = view.getVisibleSize();
        const halfViewportWidth = visibleSize.width / 2;
        const halfViewportHeight = visibleSize.height / 2;

        // 计算相机边界
        let minX = -Infinity, maxX = Infinity;
        let minY = -Infinity, maxY = Infinity;

        if (this.backgroundNode) {
            const bgTransform = this.backgroundNode.getComponent(UITransform);
            const bgWidth = bgTransform?.width ?? 0;
            const bgHeight = bgTransform?.height ?? 0;

            minX = -bgWidth / 2 + halfViewportWidth;
            maxX = bgWidth / 2 - halfViewportWidth;
            minY = -bgHeight / 2 + halfViewportHeight;
            maxY = bgHeight / 2 - halfViewportHeight;
        }

        // 限制相机位置
        const cameraX = Math.max(minX, Math.min(maxX, playerPos.x));
        const cameraY = Math.max(minY, Math.min(maxY, playerPos.y));

        cameraNode.setWorldPosition(cameraX, cameraY, 0);
    }

    // ========== 序列帧动画 ==========

    /**
     * 播放动作动画
     * @param actionName 动作名称
     * @param forceDirection 强制方向（可选）
     */
    private playAction(actionName: string, forceDirection?: Direction) {
        const action = actionName as ActionName;

        // 所有动画都需要方向
        const needsDirection = true;

        // 如果需要方向但没有强制指定，从当前输入实时获取方向
        let direction: Direction;
        if (forceDirection) {
            direction = forceDirection;
        } else if (needsDirection) {
            // 从输入实时获取方向，而不是使用可能过时的 currentDirection
            const movement = inputManager.movementVector;
            direction = this.getDirectionFromMovement(movement.x, movement.y);
        } else {
            direction = this.currentDirection;
        }

        // 构建缓存 key
        const cacheKey = needsDirection ? `${action}_${direction}` : action;

        // 如果是循环动画且动作和方向都没变，不重复播放
        if (action === this.currentAction &&
            (!needsDirection || direction === this.currentDirection) &&
            this.loopAnimation) {
            return;
        }

        this.currentAction = action;
        if (needsDirection) {
            this.currentDirection = direction;
        }
        this.frameIndex = 0;
        this.frameTimer = 0;

        // 从缓存获取帧列表
        const frames = this.framesCache.get(cacheKey);
        if (frames && frames.length > 0) {
            this.currentFrames = frames;
        } else {
            // 尝试回退到不带方向的版本
            const fallbackFrames = this.framesCache.get(action);
            if (fallbackFrames && fallbackFrames.length > 0) {
                this.currentFrames = fallbackFrames;
            } else {
                this.currentFrames = [];
            }
        }

        // 设置循环
        this.loopAnimation = (action === 'idle' || action === 'walk');

        // 立即显示第一帧
        this.showCurrentFrame();
    }

    private updateFrameAnimation(deltaTime: number) {
        if (!this.currentFrames.length || !this.sprite) return;

        this.frameTimer += deltaTime;
        const frameInterval = 1 / this.frameRate;

        if (this.frameTimer >= frameInterval) {
            this.frameTimer -= frameInterval;
            this.frameIndex++;

            if (this.frameIndex >= this.currentFrames.length) {
                if (this.loopAnimation) {
                    this.frameIndex = 0;
                } else {
                    // 非循环动画播放完毕，回到待机
                    this.frameIndex = this.currentFrames.length - 1;
                    if (this.currentAction !== 'death') {
                        this.playAction('idle');
                    }
                    return;
                }
            }

            this.showCurrentFrame();
        }
    }

    private showCurrentFrame() {
        if (this.sprite && this.currentFrames[this.frameIndex]) {
            this.sprite.spriteFrame = this.currentFrames[this.frameIndex];
        }
    }

    // ========== 公共接口 ==========

    getController(): PlayerController | null {
        return this.controller;
    }

    getCharacterData(): CharacterData | null {
        return this.characterData;
    }

    takeDamage(damage: number, damageType: string = 'normal') {
        this.controller?.takeDamage(damage, damageType);
    }

    heal(amount: number) {
        this.controller?.heal(amount);
    }

    isDead(): boolean {
        return this.controller?.isDead() ?? false;
    }
}
