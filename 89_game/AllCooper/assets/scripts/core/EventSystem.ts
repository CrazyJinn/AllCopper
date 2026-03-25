/**
 * 事件系统
 * 实现发布-订阅模式，用于模块间通信
 */

/** 事件回调函数类型 */
type EventCallback<T = any> = (data: T) => void;

/** 事件类型定义 */
export enum GameEvent {
    // 角色事件
    PLAYER_DIED = 'player_died',
    PLAYER_DAMAGED = 'player_damaged',
    PLAYER_HEALED = 'player_healed',
    PLAYER_SHIELD_CHANGED = 'player_shield_changed',
    PLAYER_LEVEL_UP = 'player_level_up',

    // 战斗事件
    ATTACK_PERFORMED = 'attack_performed',
    DAMAGE_DEALT = 'damage_dealt',
    SKILL_USED = 'skill_used',
    SKILL_COOLDOWN_READY = 'skill_cooldown_ready',
    BUFF_ADDED = 'buff_added',
    BUFF_REMOVED = 'buff_removed',

    // 怪物事件
    ENEMY_SPAWNED = 'enemy_spawned',
    ENEMY_DIED = 'enemy_died',
    ENEMY_DAMAGED = 'enemy_damaged',
    BOSS_PHASE_CHANGE = 'boss_phase_change',

    // 物品事件
    ITEM_PICKED_UP = 'item_picked_up',
    ITEM_DROPPED = 'item_dropped',
    ITEM_USED = 'item_used',
    EQUIPMENT_CHANGED = 'equipment_changed',

    // 经济事件
    CURRENCY_CHANGED = 'currency_changed',
    TRANSACTION_COMPLETED = 'transaction_completed',

    // 场景事件
    SCENE_LOADED = 'scene_loaded',
    SCENE_UNLOADED = 'scene_unloaded',
    ROOM_CLEARED = 'room_cleared',
    ROOM_ENTERED = 'room_entered',
    DUNGEON_COMPLETED = 'dungeon_completed',
    HIDDEN_ROOM_UNLOCKED = 'hidden_room_unlocked',

    // 对话事件
    DIALOG_STARTED = 'dialog_started',
    DIALOG_ENDED = 'dialog_ended',
    DIALOG_CHOICE_MADE = 'dialog_choice_made',
    CUTSCENE_STARTED = 'cutscene_started',
    CUTSCENE_ENDED = 'cutscene_ended',

    // UI事件
    UI_MENU_OPENED = 'ui_menu_opened',
    UI_MENU_CLOSED = 'ui_menu_closed',
    PAUSE_GAME = 'pause_game',
    RESUME_GAME = 'resume_game',

    // 游戏状态事件
    GAME_STARTED = 'game_started',
    GAME_SAVED = 'game_saved',
    GAME_LOADED = 'game_loaded',
}

/** 事件数据类型映射 */
interface EventDataMap {
    [GameEvent.PLAYER_DAMAGED]: { damage: number; source: string; damageType: string };
    [GameEvent.PLAYER_HEALED]: { amount: number };
    [GameEvent.PLAYER_SHIELD_CHANGED]: { current: number; max: number };
    [GameEvent.DAMAGE_DEALT]: { target: string; damage: number; isCrit: boolean; damageType: string };
    [GameEvent.SKILL_USED]: { skillId: string; cooldown: number };
    [GameEvent.CURRENCY_CHANGED]: { amount: number; reason: string };
    [GameEvent.ITEM_PICKED_UP]: { itemId: string; count: number };
    [GameEvent.ROOM_CLEARED]: { roomId: string; rewards: string[] };
    [GameEvent.DIALOG_STARTED]: { dialogId: string };
    [GameEvent.PAUSE_GAME]: void;
    [GameEvent.RESUME_GAME]: void;
}

/**
 * 事件系统类
 * 单例模式，全局唯一
 */
export class EventSystem {
    private static _instance: EventSystem;
    private listeners: Map<GameEvent, Set<EventCallback>> = new Map();
    private onceListeners: Map<GameEvent, Set<EventCallback>> = new Map();

    private constructor() {}

    static get instance(): EventSystem {
        if (!this._instance) {
            this._instance = new EventSystem();
        }
        return this._instance;
    }

    /**
     * 订阅事件
     * @param event 事件类型
     * @param callback 回调函数
     */
    on<K extends keyof EventDataMap>(event: K, callback: EventCallback<EventDataMap[K]>): void;
    on(event: GameEvent, callback: EventCallback): void;
    on(event: GameEvent, callback: EventCallback): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);
    }

    /**
     * 订阅一次性事件
     * @param event 事件类型
     * @param callback 回调函数
     */
    once<K extends keyof EventDataMap>(event: K, callback: EventCallback<EventDataMap[K]>): void;
    once(event: GameEvent, callback: EventCallback): void;
    once(event: GameEvent, callback: EventCallback): void {
        if (!this.onceListeners.has(event)) {
            this.onceListeners.set(event, new Set());
        }
        this.onceListeners.get(event)!.add(callback);
    }

    /**
     * 取消订阅事件
     * @param event 事件类型
     * @param callback 回调函数
     */
    off(event: GameEvent, callback: EventCallback): void {
        this.listeners.get(event)?.delete(callback);
        this.onceListeners.get(event)?.delete(callback);
    }

    /**
     * 触发事件
     * @param event 事件类型
     * @param data 事件数据
     */
    emit<K extends keyof EventDataMap>(event: K, data?: EventDataMap[K]): void;
    emit(event: GameEvent, data?: any): void;
    emit(event: GameEvent, data?: any): void {
        // 触发普通监听器
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => callback(data));
        }

        // 触发一次性监听器
        const onceCallbacks = this.onceListeners.get(event);
        if (onceCallbacks) {
            onceCallbacks.forEach(callback => callback(data));
            this.onceListeners.delete(event);
        }
    }

    /**
     * 清除指定事件的所有监听器
     * @param event 事件类型
     */
    clear(event: GameEvent): void {
        this.listeners.delete(event);
        this.onceListeners.delete(event);
    }

    /**
     * 清除所有监听器
     */
    clearAll(): void {
        this.listeners.clear();
        this.onceListeners.clear();
    }
}

/** 全局事件系统实例 */
export const eventSystem = EventSystem.instance;
