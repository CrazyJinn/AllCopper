/**
 * 伤害数字显示
 * 大数字飘字效果
 */

import { combatSystem } from '../combat/CombatSystem';

/** 伤害数字配置 */
export interface DamageNumberConfig {
    /** 字体大小 */
    fontSize: number;
    /** 暴击字体大小 */
    critFontSize: number;
    /** 颜色 */
    color: string;
    /** 暴击颜色 */
    critColor: string;
    /** 治疗颜色 */
    healColor: string;
    /** 上升速度 */
    riseSpeed: number;
    /** 持续时间 */
    duration: number;
    /** 淡出开始时间 */
    fadeStartTime: number;
}

/** 伤害数字实例 */
export interface DamageNumberInstance {
    /** 位置 */
    position: { x: number; y: number };
    /** 伤害值 */
    damage: number;
    /** 是否暴击 */
    isCrit: boolean;
    /** 是否治疗 */
    isHeal: boolean;
    /** 当前透明度 */
    alpha: number;
    /** 已存在时间 */
    elapsed: number;
    /** 偏移量（随机） */
    offset: { x: number; y: number };
}

/** 默认配置 */
const DEFAULT_CONFIG: DamageNumberConfig = {
    fontSize: 24,
    critFontSize: 36,
    color: '#FFFFFF',
    critColor: '#FFD700',
    healColor: '#00FF00',
    riseSpeed: 80,
    duration: 1.5,
    fadeStartTime: 1.0,
};

/**
 * 伤害数字管理器
 */
export class DamageNumberManager {
    /** 配置 */
    private config: DamageNumberConfig;
    /** 活动的伤害数字 */
    private activeNumbers: DamageNumberInstance[] = [];
    /** 对象池 */
    private pool: DamageNumberInstance[] = [];

    constructor(config: Partial<DamageNumberConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * 创建伤害数字
     */
    create(position: { x: number; y: number }, damage: number, isCrit: boolean = false, isHeal: boolean = false): void {
        const instance = this.getInstance();
        instance.position = { ...position };
        instance.damage = damage;
        instance.isCrit = isCrit;
        instance.isHeal = isHeal;
        instance.alpha = 1;
        instance.elapsed = 0;
        instance.offset = {
            x: (Math.random() - 0.5) * 40,
            y: Math.random() * 20,
        };

        this.activeNumbers.push(instance);
    }

    /**
     * 从对象池获取实例
     */
    private getInstance(): DamageNumberInstance {
        if (this.pool.length > 0) {
            return this.pool.pop()!;
        }
        return {
            position: { x: 0, y: 0 },
            damage: 0,
            isCrit: false,
            isHeal: false,
            alpha: 1,
            elapsed: 0,
            offset: { x: 0, y: 0 },
        };
    }

    /**
     * 回收到对象池
     */
    private recycle(instance: DamageNumberInstance): void {
        this.pool.push(instance);
    }

    /**
     * 更新所有伤害数字
     */
    update(deltaTime: number): void {
        // 从战斗系统获取新的伤害数字
        const newNumbers = combatSystem.getAndClearDamageNumbers();
        newNumbers.forEach(n => {
            this.create(n.position, n.damage, n.isCrit);
        });

        // 更新活动的数字
        const toRemove: number[] = [];

        for (let i = 0; i < this.activeNumbers.length; i++) {
            const num = this.activeNumbers[i];
            num.elapsed += deltaTime;

            // 上升
            num.position.y += this.config.riseSpeed * deltaTime;

            // 淡出
            if (num.elapsed > this.config.fadeStartTime) {
                const fadeProgress = (num.elapsed - this.config.fadeStartTime) /
                    (this.config.duration - this.config.fadeStartTime);
                num.alpha = 1 - fadeProgress;
            }

            // 检查是否过期
            if (num.elapsed >= this.config.duration) {
                toRemove.push(i);
            }
        }

        // 移除过期的数字
        for (let i = toRemove.length - 1; i >= 0; i--) {
            const instance = this.activeNumbers.splice(toRemove[i], 1)[0];
            this.recycle(instance);
        }
    }

    /**
     * 渲染伤害数字
     * @param ctx Canvas 2D上下文
     * @param cameraX 相机X偏移
     * @param cameraY 相机Y偏移
     */
    render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
        for (const num of this.activeNumbers) {
            const screenX = num.position.x + num.offset.x - cameraX;
            const screenY = num.position.y + num.offset.y - cameraY;

            // 设置字体
            const fontSize = num.isCrit ? this.config.critFontSize : this.config.fontSize;
            ctx.font = `bold ${fontSize}px Arial`;

            // 设置颜色
            let color = this.config.color;
            if (num.isHeal) {
                color = this.config.healColor;
            } else if (num.isCrit) {
                color = this.config.critColor;
            }

            // 设置透明度
            ctx.globalAlpha = num.alpha;

            // 绘制阴影
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'center';
            ctx.fillText(Math.floor(num.damage).toString(), screenX + 2, screenY + 2);

            // 绘制文字
            ctx.fillStyle = color;
            ctx.fillText(Math.floor(num.damage).toString(), screenX, screenY);

            // 暴击额外显示
            if (num.isCrit) {
                ctx.font = `bold ${fontSize * 0.6}px Arial`;
                ctx.fillText('暴击!', screenX, screenY - fontSize * 0.8);
            }

            ctx.globalAlpha = 1;
        }
    }

    /**
     * 清除所有伤害数字
     */
    clear(): void {
        this.activeNumbers.forEach(n => this.recycle(n));
        this.activeNumbers = [];
    }

    /**
     * 获取活动数字数量
     */
    getActiveCount(): number {
        return this.activeNumbers.length;
    }
}
