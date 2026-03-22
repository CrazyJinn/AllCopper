/**
 * 物品数据定义
 * 包含武器、护甲、消耗品、材料、任务物品的数据结构
 */

import { ItemType, Rarity } from '../core/GameConfig';

/** 物品尺寸（暗黑2风格背包格子） */
export interface ItemSize {
    /** 占用格子宽度 */
    width: number;
    /** 占用格子高度 */
    height: number;
}

/** 属性加成 */
export interface StatBonus {
    [statName: string]: number;
}

/** 使用效果类型 */
export type UseEffectType = 'heal' | 'buff' | 'damage' | 'restore_mp' | 'restore_shield';

/** 物品使用效果 */
export interface ItemUseEffect {
    /** 效果类型 */
    type: UseEffectType;
    /** 效果数值 */
    value: number;
    /** 持续时间（秒），0表示即时效果 */
    duration: number;
}

/** 物品完整数据 */
export interface ItemData {
    /** 物品唯一ID */
    id: string;
    /** 物品名称 */
    name: string;
    /** 物品类型 */
    type: ItemType;
    /** 稀有度 */
    rarity: Rarity;
    /** 物品等级 */
    level: number;

    /** 占用空间 */
    size: ItemSize;

    /** 最大堆叠数量 */
    maxStack: number;

    /** 属性加成（装备类） */
    stats?: StatBonus;

    /** 使用效果（消耗品类） */
    useEffect?: ItemUseEffect;

    /** 购买价格 */
    price: number;
    /** 出售价格 */
    sellPrice: number;

    /** 图标资源路径 */
    icon: string;
    /** 物品描述 */
    description: string;
}

/** 背包物品槽位 */
export interface InventorySlot {
    /** 物品ID */
    itemId: string;
    /** 在背包中的位置 */
    position: { x: number; y: number };
    /** 堆叠数量 */
    count: number;
}

/** 背包数据 */
export interface InventoryData {
    /** 所属角色ID */
    ownerId: string;
    /** 最大容量（格子数，宽度） */
    width: number;
    /** 最大容量（格子数，高度） */
    height: number;
    /** 物品列表 */
    items: InventorySlot[];

    /** 计算已用空间 */
    getUsedSpace(): number;
    /** 检查是否能放入物品 */
    canAddItem(itemId: string, count: number): boolean;
    /** 添加物品 */
    addItem(itemId: string, count: number): boolean;
    /** 移除物品 */
    removeItem(itemId: string, count: number): boolean;
    /** 查找物品 */
    findItem(itemId: string): InventorySlot | undefined;
}

/**
 * 背包管理类
 */
export class Inventory implements InventoryData {
    ownerId: string;
    width: number;
    height: number;
    items: InventorySlot[] = [];

    /** 格子占用状态 */
    private grid: boolean[][];

    constructor(ownerId: string, width: number, height: number) {
        this.ownerId = ownerId;
        this.width = width;
        this.height = height;
        this.grid = Array(height).fill(null).map(() => Array(width).fill(false));
    }

    /**
     * 获取物品数据
     */
    private getItemData(itemId: string): ItemData | null {
        // 实际实现需要从物品数据库获取
        return null;
    }

    /**
     * 计算已用空间
     */
    getUsedSpace(): number {
        return this.items.reduce((total, slot) => {
            const itemData = this.getItemData(slot.itemId);
            if (itemData) {
                return total + itemData.size.width * itemData.size.height;
            }
            return total;
        }, 0);
    }

    /**
     * 检查是否能放入物品
     */
    canAddItem(itemId: string, count: number): boolean {
        const itemData = this.getItemData(itemId);
        if (!itemData) return false;

        // 检查是否可以堆叠
        const existingSlot = this.findItem(itemId);
        if (existingSlot && existingSlot.count + count <= itemData.maxStack) {
            return true;
        }

        // 检查是否有空位
        return this.findEmptySlot(itemData.size) !== null;
    }

    /**
     * 查找空位
     */
    private findEmptySlot(size: ItemSize): { x: number; y: number } | null {
        for (let y = 0; y <= this.height - size.height; y++) {
            for (let x = 0; x <= this.width - size.width; x++) {
                if (this.canPlaceAt(x, y, size)) {
                    return { x, y };
                }
            }
        }
        return null;
    }

    /**
     * 检查指定位置是否可以放置
     */
    private canPlaceAt(startX: number, startY: number, size: ItemSize): boolean {
        for (let y = startY; y < startY + size.height; y++) {
            for (let x = startX; x < startX + size.width; x++) {
                if (y >= this.height || x >= this.width || this.grid[y][x]) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * 标记格子占用状态
     */
    private setGridOccupied(startX: number, startY: number, size: ItemSize, occupied: boolean): void {
        for (let y = startY; y < startY + size.height; y++) {
            for (let x = startX; x < startX + size.width; x++) {
                this.grid[y][x] = occupied;
            }
        }
    }

    /**
     * 添加物品
     */
    addItem(itemId: string, count: number): boolean {
        const itemData = this.getItemData(itemId);
        if (!itemData) return false;

        // 尝试堆叠
        const existingSlot = this.findItem(itemId);
        if (existingSlot && existingSlot.count + count <= itemData.maxStack) {
            existingSlot.count += count;
            return true;
        }

        // 查找空位
        const position = this.findEmptySlot(itemData.size);
        if (!position) return false;

        // 标记占用
        this.setGridOccupied(position.x, position.y, itemData.size, true);

        // 添加物品
        this.items.push({
            itemId,
            position,
            count,
        });

        return true;
    }

    /**
     * 移除物品
     */
    removeItem(itemId: string, count: number): boolean {
        const slot = this.findItem(itemId);
        if (!slot || slot.count < count) return false;

        const itemData = this.getItemData(itemId);
        if (!itemData) return false;

        slot.count -= count;

        if (slot.count <= 0) {
            // 清除格子占用
            this.setGridOccupied(slot.position.x, slot.position.y, itemData.size, false);
            // 移除槽位
            const index = this.items.indexOf(slot);
            if (index > -1) {
                this.items.splice(index, 1);
            }
        }

        return true;
    }

    /**
     * 查找物品
     */
    findItem(itemId: string): InventorySlot | undefined {
        return this.items.find(slot => slot.itemId === itemId);
    }

    /**
     * 获取物品数量
     */
    getItemCount(itemId: string): number {
        const slot = this.findItem(itemId);
        return slot ? slot.count : 0;
    }

    /**
     * 清空背包
     */
    clear(): void {
        this.items = [];
        this.grid = Array(this.height).fill(null).map(() => Array(this.width).fill(false));
    }
}

/** 示例物品数据：小型治疗药水 */
export const SMALL_HEALTH_POTION: ItemData = {
    id: 'item_health_potion_s',
    name: '小型治疗药水',
    type: ItemType.CONSUMABLE,
    rarity: Rarity.COMMON,
    level: 1,
    size: { width: 1, height: 2 },
    maxStack: 20,
    useEffect: {
        type: 'heal',
        value: 30,
        duration: 0,
    },
    price: 10,
    sellPrice: 5,
    icon: 'icon_health_potion_s',
    description: '恢复30点生命值。',
};

/** 示例物品数据：纽扣电池（满电） */
export const BATTERY_FULL: ItemData = {
    id: 'item_battery_full',
    name: '纽扣电池（满电）',
    type: ItemType.MATERIAL,
    rarity: Rarity.COMMON,
    level: 1,
    size: { width: 1, height: 1 },
    maxStack: 100,
    price: 1,
    sellPrice: 0.5,
    icon: 'icon_battery_full',
    description: '满电的纽扣电池，通用货币单位。',
};

/** 示例物品数据：狼皮 */
export const WOLF_PELT: ItemData = {
    id: 'item_wolf_pelt',
    name: '变异狼皮',
    type: ItemType.MATERIAL,
    rarity: Rarity.COMMON,
    level: 1,
    size: { width: 2, height: 2 },
    maxStack: 10,
    price: 5,
    sellPrice: 2,
    icon: 'icon_wolf_pelt',
    description: '变异狼的皮毛，可以用来制作护甲。',
};

/** 示例物品数据：精粹结晶 */
export const ESSENCE_CRYSTAL: ItemData = {
    id: 'item_essence',
    name: '精粹结晶',
    type: ItemType.MATERIAL,
    rarity: Rarity.UNCOMMON,
    level: 1,
    size: { width: 1, height: 1 },
    maxStack: 50,
    price: 20,
    sellPrice: 10,
    icon: 'icon_essence',
    description: '从怪物身上提取的能量结晶，可以兑换货币。',
};
