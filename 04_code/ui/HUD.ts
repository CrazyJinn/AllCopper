/**
 * 游戏HUD
 * 游戏内UI界面
 */

import { eventSystem, GameEvent } from '../core/EventSystem';
import { CharacterRuntimeState } from '../data/CharacterData';

/** HUD配置 */
export interface HUDConfig {
    /** 血条宽度 */
    hpBarWidth: number;
    /** 血条高度 */
    hpBarHeight: number;
    /** 护盾条高度 */
    shieldBarHeight: number;
    /** 魔法条高度 */
    mpBarHeight: number;
    /** 技能图标大小 */
    skillIconSize: number;
    /** 技能图标间距 */
    skillIconGap: number;
}

/** 默认配置 */
const DEFAULT_HUD_CONFIG: HUDConfig = {
    hpBarWidth: 200,
    hpBarHeight: 20,
    shieldBarHeight: 8,
    mpBarHeight: 12,
    skillIconSize: 48,
    skillIconGap: 8,
};

/** 玩家状态显示数据 */
export interface PlayerHUDData {
    /** 当前HP */
    currentHp: number;
    /** 最大HP */
    maxHp: number;
    /** 当前护盾 */
    currentShield: number;
    /** 最大护盾 */
    maxShield: number;
    /** 当前MP */
    currentMp: number;
    /** 最大MP */
    maxMp: number;
    /** 当前弹药 */
    currentAmmo: number;
    /** 最大弹药 */
    maxAmmo: number;
    /** 货币 */
    currency: number;
    /** 技能冷却 */
    skillCooldowns: {
        skill1: number;
        skill2: number;
        ultimate: number;
    };
}

/**
 * HUD管理器
 */
export class HUDManager {
    private config: HUDConfig;
    private playerData: PlayerHUDData;
    private isVisible: boolean = true;

    constructor(config: Partial<HUDConfig> = {}) {
        this.config = { ...DEFAULT_HUD_CONFIG, ...config };
        this.playerData = this.createDefaultPlayerData();
        this.setupEventListeners();
    }

    /**
     * 创建默认玩家数据
     */
    private createDefaultPlayerData(): PlayerHUDData {
        return {
            currentHp: 100,
            maxHp: 100,
            currentShield: 50,
            maxShield: 50,
            currentMp: 100,
            maxMp: 100,
            currentAmmo: 30,
            maxAmmo: 30,
            currency: 0,
            skillCooldowns: {
                skill1: 0,
                skill2: 0,
                ultimate: 0,
            },
        };
    }

    /**
     * 设置事件监听
     */
    private setupEventListeners(): void {
        eventSystem.on(GameEvent.PLAYER_DAMAGED, (data: any) => {
            // 更新HP和护盾显示
        });

        eventSystem.on(GameEvent.PLAYER_HEALED, (data: any) => {
            // 更新HP显示
        });

        eventSystem.on(GameEvent.PLAYER_SHIELD_CHANGED, (data: any) => {
            this.playerData.currentShield = data.current;
            this.playerData.maxShield = data.max;
        });

        eventSystem.on(GameEvent.CURRENCY_CHANGED, (data: any) => {
            this.playerData.currency += data.amount;
        });

        eventSystem.on(GameEvent.SKILL_USED, (data: any) => {
            // 开始技能冷却动画
        });
    }

    /**
     * 更新玩家数据
     */
    updatePlayerData(state: CharacterRuntimeState, maxStats: any): void {
        this.playerData.currentHp = state.currentHp;
        this.playerData.maxHp = maxStats.maxHp;
        this.playerData.currentShield = state.currentShield;
        this.playerData.maxShield = maxStats.maxShield;
        this.playerData.currentMp = state.currentMp;
        this.playerData.maxMp = maxStats.maxMp;
        this.playerData.skillCooldowns = {
            skill1: state.skillTimers.skill1,
            skill2: state.skillTimers.skill2,
            ultimate: state.skillTimers.ultimate,
        };
    }

    /**
     * 更新弹药
     */
    updateAmmo(current: number, max: number): void {
        this.playerData.currentAmmo = current;
        this.playerData.maxAmmo = max;
    }

    /**
     * 更新货币
     */
    updateCurrency(amount: number): void {
        this.playerData.currency = amount;
    }

    /**
     * 显示/隐藏HUD
     */
    setVisible(visible: boolean): void {
        this.isVisible = visible;
    }

    /**
     * 渲染HUD
     * @param ctx Canvas 2D上下文
     * @param screenWidth 屏幕宽度
     * @param screenHeight 屏幕高度
     */
    render(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number): void {
        if (!this.isVisible) return;

        const padding = 20;

        // 渲染左上角状态栏
        this.renderStatusBar(ctx, padding, padding);

        // 渲染技能栏（底部中央）
        this.renderSkillBar(ctx, screenWidth / 2, screenHeight - padding - this.config.skillIconSize);

        // 渲染弹药（右下角）
        if (this.playerData.maxAmmo > 0) {
            this.renderAmmo(ctx, screenWidth - padding, screenHeight - padding);
        }

        // 渲染货币（右上角）
        this.renderCurrency(ctx, screenWidth - padding, padding);
    }

    /**
     * 渲染状态栏
     */
    private renderStatusBar(ctx: CanvasRenderingContext2D, x: number, y: number): void {
        const barWidth = this.config.hpBarWidth;

        // HP条背景
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y, barWidth, this.config.hpBarHeight);

        // HP条
        const hpRatio = this.playerData.currentHp / this.playerData.maxHp;
        ctx.fillStyle = '#FF3333';
        ctx.fillRect(x, y, barWidth * hpRatio, this.config.hpBarHeight);

        // HP条边框
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, this.config.hpBarHeight);

        // 护盾条（在HP条上方）
        if (this.playerData.maxShield > 0) {
            const shieldY = y - this.config.shieldBarHeight - 2;
            ctx.fillStyle = '#333333';
            ctx.fillRect(x, shieldY, barWidth, this.config.shieldBarHeight);

            const shieldRatio = this.playerData.currentShield / this.playerData.maxShield;
            ctx.fillStyle = '#3399FF';
            ctx.fillRect(x, shieldY, barWidth * shieldRatio, this.config.shieldBarHeight);
        }

        // MP条（在HP条下方）
        if (this.playerData.maxMp > 0) {
            const mpY = y + this.config.hpBarHeight + 2;
            ctx.fillStyle = '#333333';
            ctx.fillRect(x, mpY, barWidth * 0.5, this.config.mpBarHeight);

            const mpRatio = this.playerData.currentMp / this.playerData.maxMp;
            ctx.fillStyle = '#9933FF';
            ctx.fillRect(x, mpY, barWidth * 0.5 * mpRatio, this.config.mpBarHeight);
        }

        // HP文字
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `${Math.floor(this.playerData.currentHp)} / ${this.playerData.maxHp}`,
            x + barWidth / 2,
            y + this.config.hpBarHeight - 5
        );
    }

    /**
     * 渲染技能栏
     */
    private renderSkillBar(ctx: CanvasRenderingContext2D, centerX: number, y: number): void {
        const iconSize = this.config.skillIconSize;
        const gap = this.config.skillIconGap;
        const totalWidth = iconSize * 4 + gap * 3;
        const startX = centerX - totalWidth / 2;

        const skills = [
            { key: 'Q', cooldown: this.playerData.skillCooldowns.skill1, icon: 'skill1' },
            { key: 'E', cooldown: this.playerData.skillCooldowns.skill2, icon: 'skill2' },
            { key: 'R', cooldown: 0, icon: 'reload' },
            { key: '右键', cooldown: this.playerData.skillCooldowns.ultimate, icon: 'ultimate' },
        ];

        skills.forEach((skill, index) => {
            const x = startX + index * (iconSize + gap);

            // 图标背景
            ctx.fillStyle = '#333333';
            ctx.fillRect(x, y, iconSize, iconSize);

            // 图标边框
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, iconSize, iconSize);

            // 冷却遮罩
            if (skill.cooldown > 0) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(x, y, iconSize, iconSize);

                // 冷却时间文字
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(
                    Math.ceil(skill.cooldown).toString(),
                    x + iconSize / 2,
                    y + iconSize / 2 + 5
                );
            }

            // 按键提示
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(skill.key, x + iconSize / 2, y + iconSize + 12);
        });
    }

    /**
     * 渲染弹药
     */
    private renderAmmo(ctx: CanvasRenderingContext2D, x: number, y: number): void {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(
            `${this.playerData.currentAmmo} / ${this.playerData.maxAmmo}`,
            x,
            y
        );
    }

    /**
     * 渲染货币
     */
    private renderCurrency(ctx: CanvasRenderingContext2D, x: number, y: number): void {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`🔋 ${this.playerData.currency.toFixed(2)}`, x, y + 16);
    }
}
