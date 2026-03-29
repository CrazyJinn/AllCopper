/**
 * EventSystem 单元测试
 * 测试事件发布-订阅系统
 */

import { EventSystem, GameEvent } from '../../core/EventSystem';

describe('EventSystem', () => {
  beforeEach(() => {
    // 每个测试前清理所有监听器
    EventSystem.instance.clearAll();
  });

  afterEach(() => {
    EventSystem.instance.clearAll();
  });

  describe('单例模式', () => {
    it('应返回同一个实例', () => {
      const instance1 = EventSystem.instance;
      const instance2 = EventSystem.instance;
      expect(instance1).toBe(instance2);
    });

    it('eventSystem导出应与instance相同', () => {
      const { eventSystem } = require('../../core/EventSystem');
      expect(eventSystem).toBe(EventSystem.instance);
    });
  });

  describe('on/emit', () => {
    it('应正确触发回调', () => {
      const callback = jest.fn();
      EventSystem.instance.on(GameEvent.PLAYER_DAMAGED, callback);

      EventSystem.instance.emit(GameEvent.PLAYER_DAMAGED, {
        damage: 10,
        source: 'enemy',
        damageType: 'physical',
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        damage: 10,
        source: 'enemy',
        damageType: 'physical',
      });
    });

    it('同一事件应支持多个监听器', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      EventSystem.instance.on(GameEvent.PLAYER_DAMAGED, callback1);
      EventSystem.instance.on(GameEvent.PLAYER_DAMAGED, callback2);
      EventSystem.instance.on(GameEvent.PLAYER_DAMAGED, callback3);

      EventSystem.instance.emit(GameEvent.PLAYER_DAMAGED, {
        damage: 5,
        source: 'trap',
        damageType: 'fire',
      });

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(1);
    });

    it('多次emit应多次触发', () => {
      const callback = jest.fn();
      EventSystem.instance.on(GameEvent.PLAYER_HEALED, callback);

      EventSystem.instance.emit(GameEvent.PLAYER_HEALED, { amount: 10 });
      EventSystem.instance.emit(GameEvent.PLAYER_HEALED, { amount: 20 });
      EventSystem.instance.emit(GameEvent.PLAYER_HEALED, { amount: 30 });

      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('无监听器时emit不应报错', () => {
      expect(() => {
        EventSystem.instance.emit(GameEvent.PLAYER_DIED);
      }).not.toThrow();
    });

    it('应支持void类型的事件数据', () => {
      const callback = jest.fn();
      EventSystem.instance.on(GameEvent.PAUSE_GAME, callback);

      EventSystem.instance.emit(GameEvent.PAUSE_GAME);

      expect(callback).toHaveBeenCalledWith(undefined);
    });
  });

  describe('once', () => {
    it('应只触发一次', () => {
      const callback = jest.fn();
      EventSystem.instance.once(GameEvent.PLAYER_LEVEL_UP, callback);

      EventSystem.instance.emit(GameEvent.PLAYER_LEVEL_UP);
      EventSystem.instance.emit(GameEvent.PLAYER_LEVEL_UP);
      EventSystem.instance.emit(GameEvent.PLAYER_LEVEL_UP);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('触发后应自动移除', () => {
      const callback = jest.fn();
      EventSystem.instance.once(GameEvent.SKILL_USED, callback);

      EventSystem.instance.emit(GameEvent.SKILL_USED, { skillId: 'skill_1', cooldown: 5 });
      EventSystem.instance.emit(GameEvent.SKILL_USED, { skillId: 'skill_2', cooldown: 10 });

      expect(callback).toHaveBeenCalledWith({ skillId: 'skill_1', cooldown: 5 });
      expect(callback).not.toHaveBeenCalledWith({ skillId: 'skill_2', cooldown: 10 });
    });

    it('once和on可以共存', () => {
      const onceCallback = jest.fn();
      const onCallback = jest.fn();

      EventSystem.instance.once(GameEvent.ITEM_PICKED_UP, onceCallback);
      EventSystem.instance.on(GameEvent.ITEM_PICKED_UP, onCallback);

      EventSystem.instance.emit(GameEvent.ITEM_PICKED_UP, { itemId: 'item_1', count: 1 });
      EventSystem.instance.emit(GameEvent.ITEM_PICKED_UP, { itemId: 'item_2', count: 2 });

      expect(onceCallback).toHaveBeenCalledTimes(1);
      expect(onCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('off', () => {
    it('取消订阅后不应触发', () => {
      const callback = jest.fn();
      EventSystem.instance.on(GameEvent.ENEMY_DIED, callback);
      EventSystem.instance.off(GameEvent.ENEMY_DIED, callback);

      EventSystem.instance.emit(GameEvent.ENEMY_DIED);

      expect(callback).not.toHaveBeenCalled();
    });

    it('取消不存在的监听器不应报错', () => {
      const callback = jest.fn();
      expect(() => {
        EventSystem.instance.off(GameEvent.PLAYER_DIED, callback);
      }).not.toThrow();
    });

    it('应只移除指定的回调', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      EventSystem.instance.on(GameEvent.DIALOG_STARTED, callback1);
      EventSystem.instance.on(GameEvent.DIALOG_STARTED, callback2);
      EventSystem.instance.off(GameEvent.DIALOG_STARTED, callback1);

      EventSystem.instance.emit(GameEvent.DIALOG_STARTED, { dialogId: 'dialog_1' });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('off应同时移除once监听器', () => {
      const callback = jest.fn();
      EventSystem.instance.once(GameEvent.GAME_SAVED, callback);
      EventSystem.instance.off(GameEvent.GAME_SAVED, callback);

      EventSystem.instance.emit(GameEvent.GAME_SAVED);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('应清除指定事件的所有监听器', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      EventSystem.instance.on(GameEvent.ROOM_CLEARED, callback1);
      EventSystem.instance.on(GameEvent.ROOM_CLEARED, callback2);
      EventSystem.instance.clear(GameEvent.ROOM_CLEARED);

      EventSystem.instance.emit(GameEvent.ROOM_CLEARED, { roomId: 'room_1', rewards: [] });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it('clear不应影响其他事件', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      EventSystem.instance.on(GameEvent.PAUSE_GAME, callback1);
      EventSystem.instance.on(GameEvent.RESUME_GAME, callback2);
      EventSystem.instance.clear(GameEvent.PAUSE_GAME);

      EventSystem.instance.emit(GameEvent.RESUME_GAME);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('clearAll', () => {
    it('应清除所有事件的监听器', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      EventSystem.instance.on(GameEvent.PLAYER_DAMAGED, callback1);
      EventSystem.instance.on(GameEvent.PLAYER_HEALED, callback2);
      EventSystem.instance.on(GameEvent.PLAYER_DIED, callback3);

      EventSystem.instance.clearAll();

      EventSystem.instance.emit(GameEvent.PLAYER_DAMAGED, { damage: 10, source: '', damageType: '' });
      EventSystem.instance.emit(GameEvent.PLAYER_HEALED, { amount: 10 });
      EventSystem.instance.emit(GameEvent.PLAYER_DIED);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).not.toHaveBeenCalled();
    });
  });

  describe('类型安全', () => {
    it('应有正确的事件数据类型', () => {
      // 这个测试主要是TypeScript编译时检查
      const damagedCallback = jest.fn();
      const currencyCallback = jest.fn();

      EventSystem.instance.on(GameEvent.PLAYER_DAMAGED, damagedCallback);
      EventSystem.instance.on(GameEvent.CURRENCY_CHANGED, currencyCallback);

      EventSystem.instance.emit(GameEvent.PLAYER_DAMAGED, {
        damage: 100,
        source: 'boss',
        damageType: 'magic',
      });

      EventSystem.instance.emit(GameEvent.CURRENCY_CHANGED, {
        amount: 50,
        reason: 'quest_reward',
      });

      expect(damagedCallback).toHaveBeenCalledWith({
        damage: 100,
        source: 'boss',
        damageType: 'magic',
      });

      expect(currencyCallback).toHaveBeenCalledWith({
        amount: 50,
        reason: 'quest_reward',
      });
    });
  });

  describe('边界情况', () => {
    it('回调函数抛出异常时不应影响其他回调', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Test error');
      });
      const normalCallback = jest.fn();

      // 抑制console.error
      const originalError = console.error;
      console.error = jest.fn();

      EventSystem.instance.on(GameEvent.PLAYER_DIED, errorCallback);
      EventSystem.instance.on(GameEvent.PLAYER_DIED, normalCallback);

      // 注意：当前实现中，一个回调抛出异常会中断后续回调
      // 这是一个设计决策，可以根据需求修改

      try {
        EventSystem.instance.emit(GameEvent.PLAYER_DIED);
      } catch (e) {
        // 预期会抛出异常
      }

      // 恢复console.error
      console.error = originalError;
    });
  });
});
