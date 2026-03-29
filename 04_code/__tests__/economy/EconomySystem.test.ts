/**
 * EconomySystem 单元测试
 * 测试经济系统货币计算和交易逻辑
 */

import { EconomySystem, TransactionType, TransactionRecord } from '../../economy/EconomySystem';
import { EventSystem, GameEvent } from '../../core/EventSystem';

describe('EconomySystem', () => {
  let economy: EconomySystem;

  beforeEach(() => {
    economy = new EconomySystem(100);
    EventSystem.instance.clearAll();
  });

  afterEach(() => {
    EventSystem.instance.clearAll();
  });

  describe('构造函数和初始状态', () => {
    it('应正确设置初始货币', () => {
      const eco = new EconomySystem(50.5);
      expect(eco.currency).toBe(50.5);
    });

    it('默认初始货币应为0', () => {
      const eco = new EconomySystem();
      expect(eco.currency).toBe(0);
    });

    it('应正确处理初始货币精度', () => {
      const eco = new EconomySystem(99.999);
      expect(eco.currency).toBeCloseTo(100, 1); // 2位精度
    });
  });

  describe('addCurrency', () => {
    it('应正确添加货币', () => {
      const result = economy.addCurrency(50, 'test', TransactionType.QUEST_REWARD);
      expect(result).toBe(true);
      expect(economy.currency).toBe(150);
    });

    it('应触发CURRENCY_CHANGED事件', () => {
      const eventSpy = jest.fn();
      EventSystem.instance.on(GameEvent.CURRENCY_CHANGED, eventSpy);

      economy.addCurrency(50, 'test reward', TransactionType.QUEST_REWARD);

      expect(eventSpy).toHaveBeenCalledWith({
        amount: 50,
        reason: 'test reward',
      });
    });

    it('负数金额应被拒绝', () => {
      const result = economy.addCurrency(-10, 'test', TransactionType.QUEST_REWARD);
      expect(result).toBe(false);
      expect(economy.currency).toBe(100);
    });

    it('零金额应被接受', () => {
      const result = economy.addCurrency(0, 'test', TransactionType.QUEST_REWARD);
      expect(result).toBe(true);
      expect(economy.currency).toBe(100);
    });

    it('应正确处理浮点数精度', () => {
      economy.addCurrency(0.1, 'test1', TransactionType.QUEST_REWARD);
      economy.addCurrency(0.2, 'test2', TransactionType.QUEST_REWARD);
      expect(economy.currency).toBeCloseTo(100.3, 2);
    });
  });

  describe('spendCurrency', () => {
    it('应正确扣除货币', () => {
      const result = economy.spendCurrency(30, 'test', TransactionType.BUY);
      expect(result).toBe(true);
      expect(economy.currency).toBe(70);
    });

    it('余额不足时应返回false', () => {
      const result = economy.spendCurrency(150, 'test', TransactionType.BUY);
      expect(result).toBe(false);
      expect(economy.currency).toBe(100);
    });

    it('余额刚好够时应成功', () => {
      const result = economy.spendCurrency(100, 'test', TransactionType.BUY);
      expect(result).toBe(true);
      expect(economy.currency).toBe(0);
    });

    it('负数金额应被拒绝', () => {
      const result = economy.spendCurrency(-10, 'test', TransactionType.BUY);
      expect(result).toBe(false);
      expect(economy.currency).toBe(100);
    });

    it('应触发CURRENCY_CHANGED事件（负数金额）', () => {
      const eventSpy = jest.fn();
      EventSystem.instance.on(GameEvent.CURRENCY_CHANGED, eventSpy);

      economy.spendCurrency(30, 'buying item', TransactionType.BUY);

      expect(eventSpy).toHaveBeenCalledWith({
        amount: -30,
        reason: 'buying item',
      });
    });
  });

  describe('hasEnough', () => {
    it('余额足够时应返回true', () => {
      expect(economy.hasEnough(50)).toBe(true);
      expect(economy.hasEnough(100)).toBe(true);
    });

    it('余额不足时应返回false', () => {
      expect(economy.hasEnough(101)).toBe(false);
      expect(economy.hasEnough(200)).toBe(false);
    });

    it('应正确处理浮点数比较', () => {
      const eco = new EconomySystem(0.3);
      expect(eco.hasEnough(0.3)).toBe(true);
      expect(eco.hasEnough(0.31)).toBe(false);
    });
  });

  describe('buyItem', () => {
    it('应正确购买物品', () => {
      const result = economy.buyItem('item_potion', 20, 3);
      expect(result).toBe(true);
      expect(economy.currency).toBe(40); // 100 - 20*3
    });

    it('余额不足时应购买失败', () => {
      const result = economy.buyItem('item_expensive', 200);
      expect(result).toBe(false);
      expect(economy.currency).toBe(100);
    });

    it('购买数量默认为1', () => {
      const result = economy.buyItem('item_test', 30);
      expect(result).toBe(true);
      expect(economy.currency).toBe(70);
    });
  });

  describe('sellItem', () => {
    it('应正确出售物品', () => {
      const result = economy.sellItem('item_loot', 25, 2);
      expect(result).toBe(true);
      expect(economy.currency).toBe(150); // 100 + 25*2
    });

    it('出售数量默认为1', () => {
      const result = economy.sellItem('item_test', 30);
      expect(result).toBe(true);
      expect(economy.currency).toBe(130);
    });
  });

  describe('exchangeEssence', () => {
    it('应正确兑换精粹为电池', () => {
      const result = economy.exchangeEssence(10, 0.5); // 10精粹 * 0.5 = 5电池
      expect(result).toBe(true);
      expect(economy.currency).toBe(105);
    });
  });

  describe('lootFromHumanEnemy', () => {
    it('应正确添加击杀掉落', () => {
      const result = economy.lootFromHumanEnemy(15.5);
      expect(result).toBe(true);
      expect(economy.currency).toBe(115.5);
    });
  });

  describe('receiveQuestReward', () => {
    it('应正确添加任务奖励', () => {
      const result = economy.receiveQuestReward(50, 'Main Quest 1');
      expect(result).toBe(true);
      expect(economy.currency).toBe(150);
    });
  });

  describe('交易历史', () => {
    beforeEach(() => {
      economy.addCurrency(100, '初始资金', TransactionType.QUEST_REWARD);
      economy.spendCurrency(30, '购买药水', TransactionType.BUY);
      economy.sellItem('item_loot', 20, 1);
      economy.buyItem('item_sword', 50, 1);
    });

    it('应正确记录交易历史', () => {
      const history = economy.getTransactionHistory();
      expect(history.length).toBe(4);
    });

    it('应按时间顺序记录', () => {
      const history = economy.getTransactionHistory();
      expect(history[0].description).toBe('初始资金');
      expect(history[3].description).toBe('购买 item_sword x1');
    });

    it('应正确记录交易类型', () => {
      const history = economy.getTransactionHistory();
      const buyRecords = history.filter(r => r.type === TransactionType.BUY);
      expect(buyRecords.length).toBe(2);
    });

    it('getTransactionHistoryByType应正确过滤', () => {
      const buyHistory = economy.getTransactionHistoryByType(TransactionType.BUY);
      expect(buyHistory.length).toBe(2);
      buyHistory.forEach(record => {
        expect(record.type).toBe(TransactionType.BUY);
      });
    });

    it('应限制历史记录数量', () => {
      const smallEconomy = new EconomySystem(1000);
      for (let i = 0; i < 150; i++) {
        smallEconomy.buyItem(`item_${i}`, 1);
      }
      const history = smallEconomy.getTransactionHistory(200);
      expect(history.length).toBeLessThanOrEqual(100);
    });

    it('getTransactionHistory应支持limit参数', () => {
      const history = economy.getTransactionHistory(2);
      expect(history.length).toBe(2);
    });
  });

  describe('formatCurrency', () => {
    it('应正确格式化货币显示', () => {
      economy.setCurrency(123.45);
      expect(economy.formatCurrency()).toBe('123.45 电池');
    });

    it('应正确处理整数', () => {
      economy.setCurrency(100);
      expect(economy.formatCurrency()).toBe('100.00 电池');
    });
  });

  describe('setCurrency', () => {
    it('应正确设置货币值', () => {
      economy.setCurrency(500);
      expect(economy.currency).toBe(500);
    });

    it('应处理精度', () => {
      economy.setCurrency(123.456);
      expect(economy.currency).toBeCloseTo(123.46, 2);
    });
  });

  describe('reset', () => {
    it('应重置所有状态', () => {
      economy.addCurrency(100, 'test', TransactionType.QUEST_REWARD);
      economy.spendCurrency(50, 'test', TransactionType.BUY);

      economy.reset();

      expect(economy.currency).toBe(0);
      expect(economy.getTransactionHistory()).toHaveLength(0);
    });
  });

  describe('货币精度边界测试', () => {
    it('大额交易应正确处理', () => {
      const richEconomy = new EconomySystem(1000000);
      richEconomy.spendCurrency(999999.99, 'big purchase', TransactionType.BUY);
      expect(richEconomy.currency).toBeCloseTo(0.01, 2);
    });

    it('小额累加应正确', () => {
      const eco = new EconomySystem(0);
      for (let i = 0; i < 100; i++) {
        eco.addCurrency(0.01, 'penny', TransactionType.KILL_DROP);
      }
      expect(eco.currency).toBeCloseTo(1, 2);
    });

    it('浮点数乘法应正确', () => {
      const eco = new EconomySystem(0);
      eco.addCurrency(3 * 0.1, 'test', TransactionType.QUEST_REWARD);
      expect(eco.currency).toBeCloseTo(0.3, 2);
    });
  });

  describe('完整交易流程', () => {
    it('模拟玩家游戏流程', () => {
      // 初始资金
      economy.setCurrency(0);

      // 完成任务获得奖励
      economy.receiveQuestReward(50, '新手任务');
      expect(economy.currency).toBe(50);

      // 购买装备
      economy.buyItem('eqp_sword', 30);
      expect(economy.currency).toBe(20);

      // 击杀敌人掉落
      economy.lootFromHumanEnemy(5.5);
      expect(economy.currency).toBe(25.5);

      // 出售战利品
      economy.sellItem('item_loot', 10);
      expect(economy.currency).toBe(35.5);

      // 尝试购买买不起的物品
      const result = economy.buyItem('item_expensive', 100);
      expect(result).toBe(false);
      expect(economy.currency).toBe(35.5);

      // 检查交易历史
      const history = economy.getTransactionHistory();
      expect(history.length).toBe(4);
    });
  });
});
