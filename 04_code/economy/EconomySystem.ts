/**
 * 经济系统
 * 管理货币、交易和物品兑换
 */

import { eventSystem, GameEvent } from '../core/EventSystem';
import { EconomyConfig } from '../core/GameConfig';

/** 交易类型 */
export enum TransactionType {
    /** 购买 */
    BUY = 'buy',
    /** 出售 */
    SELL = 'sell',
    /** 兑换（精粹换电池） */
    EXCHANGE = 'exchange',
    /** 任务奖励 */
    QUEST_REWARD = 'quest_reward',
    /** 击杀掉落 */
    KILL_DROP = 'kill_drop',
}

/** 交易记录 */
export interface TransactionRecord {
    /** 交易ID */
    id: string;
    /** 交易类型 */
    type: TransactionType;
    /** 货币变化（正数为获得，负数为消耗） */
    amount: number;
    /** 交易后余额 */
    balance: number;
    /** 时间戳 */
    timestamp: number;
    /** 描述 */
    description: string;
}

/** 货币精度处理 */
class CurrencyPrecision {
    private static PRECISION = EconomyConfig.CURRENCY_PRECISION;
    private static MULTIPLIER = Math.pow(10, CurrencyPrecision.PRECISION);

    static round(value: number): number {
        return Math.round(value * CurrencyPrecision.MULTIPLIER) / CurrencyPrecision.MULTIPLIER;
    }

    static add(a: number, b: number): number {
        return CurrencyPrecision.round(a + b);
    }

    static subtract(a: number, b: number): number {
        return CurrencyPrecision.round(a - b);
    }

    static multiply(a: number, b: number): number {
        return CurrencyPrecision.round(a * b);
    }
}

/**
 * 经济系统类
 */
export class EconomySystem {
    /** 当前货币（纽扣电池） */
    private _currency: number = 0;
    /** 交易历史 */
    private transactionHistory: TransactionRecord[] = [];
    /** 最大历史记录数 */
    private maxHistoryLength: number = 100;
    /** 交易ID计数器 */
    private transactionIdCounter: number = 0;

    constructor(initialCurrency: number = 0) {
        this._currency = CurrencyPrecision.round(initialCurrency);
    }

    /** 获取当前货币 */
    get currency(): number {
        return this._currency;
    }

    /**
     * 添加货币
     */
    addCurrency(amount: number, reason: string, type: TransactionType): boolean {
        if (amount < 0) return false;

        const actualAmount = CurrencyPrecision.round(amount);
        this._currency = CurrencyPrecision.add(this._currency, actualAmount);

        this.recordTransaction(type, actualAmount, reason);

        eventSystem.emit(GameEvent.CURRENCY_CHANGED, {
            amount: actualAmount,
            reason,
        });

        return true;
    }

    /**
     * 消耗货币
     */
    spendCurrency(amount: number, reason: string, type: TransactionType): boolean {
        if (amount < 0) return false;

        const actualAmount = CurrencyPrecision.round(amount);

        if (this._currency < actualAmount) {
            return false;
        }

        this._currency = CurrencyPrecision.subtract(this._currency, actualAmount);

        this.recordTransaction(type, -actualAmount, reason);

        eventSystem.emit(GameEvent.CURRENCY_CHANGED, {
            amount: -actualAmount,
            reason,
        });

        return true;
    }

    /**
     * 检查是否有足够货币
     */
    hasEnough(amount: number): boolean {
        return this._currency >= CurrencyPrecision.round(amount);
    }

    /**
     * 购买物品
     */
    buyItem(itemId: string, price: number, quantity: number = 1): boolean {
        const totalCost = CurrencyPrecision.multiply(price, quantity);

        if (!this.hasEnough(totalCost)) {
            return false;
        }

        return this.spendCurrency(totalCost, `购买 ${itemId} x${quantity}`, TransactionType.BUY);
    }

    /**
     * 出售物品
     */
    sellItem(itemId: string, price: number, quantity: number = 1): boolean {
        const totalValue = CurrencyPrecision.multiply(price, quantity);

        return this.addCurrency(totalValue, `出售 ${itemId} x${quantity}`, TransactionType.SELL);
    }

    /**
     * 兑换精粹为电池
     * @param essenceAmount 精粹数量
     * @param exchangeRate 兑换率（1精粹 = X电池）
     */
    exchangeEssence(essenceAmount: number, exchangeRate: number): boolean {
        const batteryAmount = CurrencyPrecision.multiply(essenceAmount, exchangeRate);

        return this.addCurrency(batteryAmount, `精粹兑换 x${essenceAmount}`, TransactionType.EXCHANGE);
    }

    /**
     * 击杀人形敌人获得电池
     */
    lootFromHumanEnemy(batteryAmount: number): boolean {
        return this.addCurrency(batteryAmount, '击杀人形敌人', TransactionType.KILL_DROP);
    }

    /**
     * 任务奖励
     */
    receiveQuestReward(amount: number, questName: string): boolean {
        return this.addCurrency(amount, `任务奖励: ${questName}`, TransactionType.QUEST_REWARD);
    }

    /**
     * 记录交易
     */
    private recordTransaction(type: TransactionType, amount: number, description: string): void {
        const record: TransactionRecord = {
            id: `txn_${++this.transactionIdCounter}`,
            type,
            amount,
            balance: this._currency,
            timestamp: Date.now(),
            description,
        };

        this.transactionHistory.push(record);

        // 限制历史记录长度
        if (this.transactionHistory.length > this.maxHistoryLength) {
            this.transactionHistory.shift();
        }

        eventSystem.emit(GameEvent.TRANSACTION_COMPLETED, record as any);
    }

    /**
     * 获取交易历史
     */
    getTransactionHistory(limit: number = 20): TransactionRecord[] {
        return this.transactionHistory.slice(-limit);
    }

    /**
     * 获取指定类型的交易历史
     */
    getTransactionHistoryByType(type: TransactionType): TransactionRecord[] {
        return this.transactionHistory.filter(r => r.type === type);
    }

    /**
     * 格式化货币显示
     */
    formatCurrency(): string {
        return `${this._currency.toFixed(EconomyConfig.CURRENCY_PRECISION)} 电池`;
    }

    /**
     * 设置货币（用于存档加载）
     */
    setCurrency(amount: number): void {
        this._currency = CurrencyPrecision.round(amount);
    }

    /**
     * 重置经济系统
     */
    reset(): void {
        this._currency = 0;
        this.transactionHistory = [];
        this.transactionIdCounter = 0;
    }
}
