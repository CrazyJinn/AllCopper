/**
 * 场景数据定义
 * 包含场景、副本、房间的数据结构
 */

import { SceneType, RoomType } from '../core/GameConfig';

/** 时间段 */
export type TimeOfDay = 'day' | 'dusk' | 'night' | 'dynamic';

/** 天气类型 */
export type WeatherType = 'clear' | 'cloudy' | 'sandstorm' | 'snow' | 'rain';

/** 环境配置 */
export interface EnvironmentConfig {
    /** 时间段 */
    timeOfDay: TimeOfDay;
    /** 天气 */
    weather: WeatherType;
    /** 背景音乐 */
    bgm: string;
    /** 环境音效 */
    ambientSound: string;
}

/** 刷怪点配置 */
export interface SpawnPointConfig {
    /** 位置 */
    position: { x: number; y: number };
    /** 可刷出的怪物ID列表 */
    monsterIds: string[];
    /** 刷怪数量范围 [最小, 最大] */
    spawnCount: [number, number];
    /** 刷新间隔（秒），0表示不刷新 */
    respawnInterval: number;
}

/** 可交互物品类型 */
export type InteractableType = 'npc' | 'item' | 'door' | 'chest' | 'save_point' | 'shop';

/** 可交互物品配置 */
export interface InteractableConfig {
    /** 唯一ID */
    id: string;
    /** 类型 */
    type: InteractableType;
    /** 位置 */
    position: { x: number; y: number };
    /** 额外数据 */
    data: Record<string, any>;
}

/** 场景数据 */
export interface SceneData {
    /** 场景唯一ID */
    id: string;
    /** 场景名称 */
    name: string;
    /** 场景类型 */
    type: SceneType;
    /** 场景等级 */
    level: number;

    /** 环境设置 */
    environment: EnvironmentConfig;

    /** 连接的其他场景ID */
    connections: string[];

    /** 刷怪配置 */
    spawnPoints?: SpawnPointConfig[];

    /** 可交互物品 */
    interactables: InteractableConfig[];

    /** 场景尺寸 */
    size: { width: number; height: number };

    /** 地图资源路径 */
    mapPath: string;

    /** 进入条件 */
    enterCondition?: {
        level: number;
        items?: string[];
        quests?: string[];
    };

    /** 描述 */
    description: string;
}

/** 房间数据 */
export interface RoomData {
    /** 房间唯一ID */
    id: string;
    /** 房间类型 */
    type: RoomType;
    /** 房间名称 */
    name: string;

    /** 怪物池 */
    monsterPool: string[];
    /** 怪物数量范围 */
    monsterCount: [number, number];

    /** 是否已清理 */
    isCleared: boolean;
    /** 是否已进入 */
    hasEntered: boolean;
    /** 是否锁定 */
    isLocked: boolean;

    /** 保底掉落 */
    guaranteedDrop?: string;

    /** 随机掉落池 */
    randomDrops?: {
        itemId: string;
        chance: number;
    }[];

    /** 连接的房间ID */
    connectedRooms: string[];

    /** 房间位置（在副本地图中） */
    position: { x: number; y: number };
}

/** 隐藏房间触发条件类型 */
export type HiddenRoomConditionType = 'no_damage' | 'item' | 'character' | 'time' | 'kill_count';

/** 隐藏房间触发条件 */
export interface HiddenRoomCondition {
    /** 条件类型 */
    type: HiddenRoomConditionType;
    /** 条件值 */
    value: any;
    /** 描述 */
    description: string;
}

/** 副本奖励 */
export interface DungeonRewards {
    /** 首次通关奖励 */
    firstClear: string[];
    /** 普通通关奖励 */
    normal: string[];
    /** 经验奖励 */
    exp: number;
    /** 货币奖励范围 */
    currency: [number, number];
}

/** 副本数据 */
export interface DungeonData {
    /** 副本唯一ID */
    id: string;
    /** 副本名称 */
    name: string;
    /** 难度等级 */
    difficulty: number;
    /** 推荐等级 */
    recommendedLevel: number;

    /** 房间列表 */
    rooms: RoomData[];

    /** 隐藏房间条件 */
    hiddenRoomCondition?: HiddenRoomCondition;

    /** 奖励 */
    rewards: DungeonRewards;

    /** 副本时限（秒），0表示无限制 */
    timeLimit: number;

    /** 进入条件 */
    enterCondition?: {
        level: number;
        items?: string[];
        currency?: number;
    };

    /** 描述 */
    description: string;
}

/** 副本运行时状态 */
export interface DungeonRuntimeState {
    /** 当前房间ID */
    currentRoomId: string;
    /** 已清理房间ID列表 */
    clearedRooms: string[];
    /** 隐藏房间是否解锁 */
    hiddenRoomUnlocked: boolean;
    /** 进入时间 */
    enterTime: number;
    /** 总击杀数 */
    totalKills: number;
    /** 受到伤害总量 */
    totalDamageTaken: number;
    /** 是否已完成 */
    isCompleted: boolean;
}

/**
 * 副本管理类
 */
export class DungeonInstance {
    private data: DungeonData;
    private state: DungeonRuntimeState;

    constructor(data: DungeonData) {
        this.data = data;
        this.state = {
            currentRoomId: data.rooms[0]?.id || '',
            clearedRooms: [],
            hiddenRoomUnlocked: false,
            enterTime: Date.now(),
            totalKills: 0,
            totalDamageTaken: 0,
            isCompleted: false,
        };
    }

    /**
     * 获取当前房间
     */
    getCurrentRoom(): RoomData | undefined {
        return this.data.rooms.find(r => r.id === this.state.currentRoomId);
    }

    /**
     * 进入房间
     */
    enterRoom(roomId: string): boolean {
        const room = this.data.rooms.find(r => r.id === roomId);
        if (!room) return false;

        // 检查房间是否锁定
        if (room.isLocked) return false;

        // 检查连接性
        const currentRoom = this.getCurrentRoom();
        if (currentRoom && !currentRoom.connectedRooms.includes(roomId)) {
            return false;
        }

        this.state.currentRoomId = roomId;
        room.hasEntered = true;
        return true;
    }

    /**
     * 清理房间
     */
    clearRoom(roomId: string): void {
        const room = this.data.rooms.find(r => r.id === roomId);
        if (!room) return;

        room.isCleared = true;
        if (!this.state.clearedRooms.includes(roomId)) {
            this.state.clearedRooms.push(roomId);
        }

        // 解锁连接的房间
        room.connectedRooms.forEach(connectedId => {
            const connectedRoom = this.data.rooms.find(r => r.id === connectedId);
            if (connectedRoom && connectedRoom.type !== RoomType.HIDDEN) {
                connectedRoom.isLocked = false;
            }
        });

        // 检查是否完成副本
        this.checkCompletion();
    }

    /**
     * 记录伤害
     */
    recordDamage(damage: number): void {
        this.state.totalDamageTaken += damage;
    }

    /**
     * 记录击杀
     */
    recordKill(): void {
        this.state.totalKills++;
    }

    /**
     * 检查隐藏房间条件
     */
    checkHiddenRoomCondition(): boolean {
        if (!this.data.hiddenRoomCondition) return false;
        if (this.state.hiddenRoomUnlocked) return false;

        const condition = this.data.hiddenRoomCondition;
        let unlocked = false;

        switch (condition.type) {
            case 'no_damage':
                unlocked = this.state.totalDamageTaken === 0;
                break;
            case 'kill_count':
                unlocked = this.state.totalKills >= condition.value;
                break;
            case 'time':
                const elapsed = (Date.now() - this.state.enterTime) / 1000;
                unlocked = elapsed <= condition.value;
                break;
            default:
                break;
        }

        if (unlocked) {
            this.state.hiddenRoomUnlocked = true;
            // 解锁隐藏房间
            const hiddenRoom = this.data.rooms.find(r => r.type === RoomType.HIDDEN);
            if (hiddenRoom) {
                hiddenRoom.isLocked = false;
            }
        }

        return unlocked;
    }

    /**
     * 检查是否完成副本
     */
    private checkCompletion(): void {
        // 检查所有必要房间是否已清理
        const requiredRooms = this.data.rooms.filter(r =>
            r.type === RoomType.NORMAL ||
            r.type === RoomType.ELITE ||
            r.type === RoomType.BOSS
        );

        const allCleared = requiredRooms.every(r =>
            this.state.clearedRooms.includes(r.id)
        );

        if (allCleared) {
            this.state.isCompleted = true;
        }
    }

    /**
     * 获取副本进度
     */
    getProgress(): number {
        const totalRooms = this.data.rooms.filter(r =>
            r.type === RoomType.NORMAL ||
            r.type === RoomType.ELITE ||
            r.type === RoomType.BOSS
        ).length;

        if (totalRooms === 0) return 0;
        return this.state.clearedRooms.length / totalRooms;
    }

    /**
     * 获取奖励
     */
    getRewards(): DungeonRewards | null {
        if (!this.state.isCompleted) return null;

        // 检查是否首次通关
        const isFirstClear = false; // 需要从存档系统获取

        return {
            ...this.data.rewards,
            firstClear: isFirstClear ? this.data.rewards.firstClear : [],
        };
    }
}

/** 示例场景数据：废弃工厂 */
export const ABANDONED_FACTORY: SceneData = {
    id: 'scene_abandoned_factory',
    name: '废弃工厂',
    type: SceneType.COMBAT,
    level: 1,
    environment: {
        timeOfDay: 'day',
        weather: 'clear',
        bgm: 'bgm_factory',
        ambientSound: 'ambient_machinery',
    },
    connections: ['scene_settlement', 'scene_wasteland'],
    spawnPoints: [
        {
            position: { x: 500, y: 300 },
            monsterIds: ['monster_wolf', 'monster_drone'],
            spawnCount: [2, 4],
            respawnInterval: 60,
        },
    ],
    interactables: [
        {
            id: 'npc_merchant_01',
            type: 'npc',
            position: { x: 200, y: 400 },
            data: { npcId: 'npc_merchant_scrap' },
        },
        {
            id: 'chest_01',
            type: 'chest',
            position: { x: 800, y: 500 },
            data: { lootTable: 'loot_factory_common' },
        },
    ],
    size: { width: 1920, height: 1080 },
    mapPath: 'maps/abandoned_factory.tmx',
    description: '一座废弃的工厂，里面游荡着变异生物和损坏的机械。',
};
