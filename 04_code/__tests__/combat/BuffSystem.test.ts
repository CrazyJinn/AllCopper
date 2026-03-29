/**
 * BuffSystem 单元测试
 * 测试Buff效果管理逻辑
 */

import { BuffSystem, BuffData, BuffType, BuffEffectType, BUFFS } from '../../combat/BuffSystem';
import { EventSystem, GameEvent } from '../../core/EventSystem';

describe('BuffSystem', () => {
  let buffSystem: BuffSystem;
  const ownerId = 'test_entity';

  // 创建自定义Buff用于测试
  const createTestBuff = (overrides: Partial<BuffData> = {}): BuffData => ({
    id: 'test_buff',
    name: '测试Buff',
    type: BuffType.BUFF,
    effectType: BuffEffectType.STAT_MODIFY,
    icon: 'test_icon',
    description: '测试用',
    duration: 5,
    maxStack: 1,
    dispellable: true,
    params: {},
    ...overrides,
  });

  beforeEach(() => {
    buffSystem = new BuffSystem(ownerId);
    // 清理事件系统
    EventSystem.instance.clearAll();
  });

  afterEach(() => {
    EventSystem.instance.clearAll();
  });

  describe('addBuff', () => {
    it('添加新Buff应成功并触发事件', () => {
      const eventSpy = jest.fn();
      EventSystem.instance.on(GameEvent.BUFF_ADDED, eventSpy);

      const buff = createTestBuff();
      const result = buffSystem.addBuff(buff, 'caster_1');

      expect(result).toBe(true);
      expect(buffSystem.hasBuff('test_buff')).toBe(true);
      expect(eventSpy).toHaveBeenCalledWith({
        targetId: ownerId,
        buffId: 'test_buff',
        buffType: BuffType.BUFF,
      });
    });

    it('重复添加相同Buff应刷新持续时间', () => {
      const buff = createTestBuff({ duration: 5, maxStack: 1 });
      buffSystem.addBuff(buff, 'caster_1');

      // 获取初始剩余时间
      const instance1 = buffSystem.getBuff('test_buff');
      expect(instance1?.remainingTime).toBe(5);

      // 更新一点时间后再次添加
      buffSystem.update(2);

      // 再次添加应刷新持续时间
      buffSystem.addBuff(buff, 'caster_1');
      const instance2 = buffSystem.getBuff('test_buff');
      expect(instance2?.remainingTime).toBe(5);
    });

    it('可叠加Buff应增加层数', () => {
      const buff = createTestBuff({ maxStack: 5 });
      buffSystem.addBuff(buff, 'caster_1');
      expect(buffSystem.getBuffStack('test_buff')).toBe(1);

      buffSystem.addBuff(buff, 'caster_1');
      expect(buffSystem.getBuffStack('test_buff')).toBe(2);

      buffSystem.addBuff(buff, 'caster_1');
      expect(buffSystem.getBuffStack('test_buff')).toBe(3);
    });

    it('层数不应超过maxStack', () => {
      const buff = createTestBuff({ maxStack: 3 });
      for (let i = 0; i < 10; i++) {
        buffSystem.addBuff(buff, 'caster_1');
      }
      expect(buffSystem.getBuffStack('test_buff')).toBe(3);
    });

    it('maxStack=1时不应叠加', () => {
      const buff = createTestBuff({ maxStack: 1 });
      buffSystem.addBuff(buff, 'caster_1');
      buffSystem.addBuff(buff, 'caster_1');
      expect(buffSystem.getBuffStack('test_buff')).toBe(1);
    });
  });

  describe('removeBuff', () => {
    it('移除存在的Buff应成功并触发事件', () => {
      const eventSpy = jest.fn();
      EventSystem.instance.on(GameEvent.BUFF_REMOVED, eventSpy);

      const buff = createTestBuff();
      buffSystem.addBuff(buff, 'caster_1');
      const result = buffSystem.removeBuff('test_buff');

      expect(result).toBe(true);
      expect(buffSystem.hasBuff('test_buff')).toBe(false);
      expect(eventSpy).toHaveBeenCalledWith({
        targetId: ownerId,
        buffId: 'test_buff',
      });
    });

    it('移除不存在的Buff应返回false', () => {
      const result = buffSystem.removeBuff('non_existent');
      expect(result).toBe(false);
    });
  });

  describe('dispel', () => {
    beforeEach(() => {
      // 添加多个可驱散的debuff
      buffSystem.addBuff(createTestBuff({
        id: 'debuff_1',
        type: BuffType.DEBUFF,
        dispellable: true,
      }), 'caster');
      buffSystem.addBuff(createTestBuff({
        id: 'debuff_2',
        type: BuffType.DEBUFF,
        dispellable: true,
      }), 'caster');
      buffSystem.addBuff(createTestBuff({
        id: 'debuff_3',
        type: BuffType.DEBUFF,
        dispellable: false, // 不可驱散
      }), 'caster');
    });

    it('应驱散指定数量的可驱散Buff', () => {
      const dispelled = buffSystem.dispel(2);
      expect(dispelled).toBe(2);
      expect(buffSystem.hasBuff('debuff_3')).toBe(true); // 不可驱散的保留
    });

    it('应只驱散指定类型的Buff', () => {
      // 添加一个可驱散的BUFF类型
      buffSystem.addBuff(createTestBuff({
        id: 'buff_1',
        type: BuffType.BUFF,
        dispellable: true,
      }), 'caster');

      const dispelled = buffSystem.dispel(10, [BuffType.DEBUFF]);
      expect(dispelled).toBe(2);
      expect(buffSystem.hasBuff('buff_1')).toBe(true);
    });

    it('没有可驱散Buff时应返回0', () => {
      const newSystem = new BuffSystem('new_entity');
      newSystem.addBuff(createTestBuff({
        id: 'undispellable',
        dispellable: false,
      }), 'caster');
      expect(newSystem.dispel(5)).toBe(0);
    });
  });

  describe('update', () => {
    it('过期Buff应自动移除', () => {
      const buff = createTestBuff({ duration: 2 });
      buffSystem.addBuff(buff, 'caster');
      expect(buffSystem.hasBuff('test_buff')).toBe(true);

      buffSystem.update(2.1);
      expect(buffSystem.hasBuff('test_buff')).toBe(false);
    });

    it('永久Buff(duration=-1)不应过期', () => {
      const buff = createTestBuff({ duration: -1 });
      buffSystem.addBuff(buff, 'caster');

      buffSystem.update(1000);
      expect(buffSystem.hasBuff('test_buff')).toBe(true);
    });

    it('DOT应正确计算周期性伤害', () => {
      const dotBuff: BuffData = {
        id: 'dot_test',
        name: '测试DOT',
        type: BuffType.DEBUFF,
        effectType: BuffEffectType.DOT,
        icon: 'icon',
        description: 'DOT测试',
        duration: 5,
        maxStack: 1,
        dispellable: true,
        params: {
          valuePerSecond: 10,
          tickInterval: 1,
        },
      };

      buffSystem.addBuff(dotBuff, 'caster');

      // 第一次tick
      let result = buffSystem.update(1);
      expect(result.dotDamage).toBe(10);

      // 第二次tick
      result = buffSystem.update(1);
      expect(result.dotDamage).toBe(10);
    });

    it('HOT应正确计算周期性治疗', () => {
      const hotBuff: BuffData = {
        id: 'hot_test',
        name: '测试HOT',
        type: BuffType.BUFF,
        effectType: BuffEffectType.HOT,
        icon: 'icon',
        description: 'HOT测试',
        duration: 5,
        maxStack: 1,
        dispellable: true,
        params: {
          valuePerSecond: 15,
          tickInterval: 0.5,
        },
      };

      buffSystem.addBuff(hotBuff, 'caster');
      const result = buffSystem.update(0.5);
      expect(result.hotHeal).toBe(15);
    });

    it('可叠加DOT应按层数增加伤害', () => {
      const dotBuff: BuffData = {
        id: 'stack_dot',
        name: '可叠加DOT',
        type: BuffType.DEBUFF,
        effectType: BuffEffectType.DOT,
        icon: 'icon',
        description: '可叠加',
        duration: 10,
        maxStack: 5,
        dispellable: true,
        params: {
          valuePerSecond: 5,
          tickInterval: 1,
        },
      };

      // 叠加3层
      buffSystem.addBuff(dotBuff, 'caster');
      buffSystem.addBuff(dotBuff, 'caster');
      buffSystem.addBuff(dotBuff, 'caster');

      const result = buffSystem.update(1);
      expect(result.dotDamage).toBe(15); // 5 * 3层
    });
  });

  describe('状态检查方法', () => {
    describe('isControlled', () => {
      it('有控制类Buff时应返回true', () => {
        buffSystem.addBuff(createTestBuff({
          id: 'control_buff',
          type: BuffType.CONTROL,
        }), 'caster');
        expect(buffSystem.isControlled()).toBe(true);
      });

      it('无控制类Buff时应返回false', () => {
        buffSystem.addBuff(createTestBuff({
          type: BuffType.BUFF,
        }), 'caster');
        expect(buffSystem.isControlled()).toBe(false);
      });
    });

    describe('isImmobilized', () => {
      it('眩晕时应无法行动', () => {
        buffSystem.addBuff(createTestBuff({
          id: 'stun',
          effectType: BuffEffectType.STUN,
        }), 'caster');
        expect(buffSystem.isImmobilized()).toBe(true);
      });

      it('冻结时应无法行动', () => {
        buffSystem.addBuff(createTestBuff({
          id: 'freeze',
          effectType: BuffEffectType.FREEZE,
        }), 'caster');
        expect(buffSystem.isImmobilized()).toBe(true);
      });

      it('定身时应无法行动', () => {
        buffSystem.addBuff(createTestBuff({
          id: 'root',
          effectType: BuffEffectType.ROOT,
        }), 'caster');
        expect(buffSystem.isImmobilized()).toBe(true);
      });

      it('缠绕时应无法行动', () => {
        buffSystem.addBuff(createTestBuff({
          id: 'bind',
          effectType: BuffEffectType.BIND,
        }), 'caster');
        expect(buffSystem.isImmobilized()).toBe(true);
      });

      it('其他Buff应不影响行动', () => {
        buffSystem.addBuff(createTestBuff({
          effectType: BuffEffectType.SPEED_UP,
        }), 'caster');
        expect(buffSystem.isImmobilized()).toBe(false);
      });
    });

    describe('isSilenced', () => {
      it('沉默时应返回true', () => {
        buffSystem.addBuff(createTestBuff({
          id: 'silence',
          effectType: BuffEffectType.SILENCE,
        }), 'caster');
        expect(buffSystem.isSilenced()).toBe(true);
      });

      it('其他控制效果不应导致沉默', () => {
        buffSystem.addBuff(createTestBuff({
          effectType: BuffEffectType.STUN,
        }), 'caster');
        expect(buffSystem.isSilenced()).toBe(false);
      });
    });

    describe('isInvincible', () => {
      it('无敌Buff时应返回true', () => {
        buffSystem.addBuff(createTestBuff({
          id: 'invincible',
          effectType: BuffEffectType.INVINCIBLE,
        }), 'caster');
        expect(buffSystem.isInvincible()).toBe(true);
      });
    });
  });

  describe('getSpeedMultiplier', () => {
    it('无Buff时应返回1', () => {
      expect(buffSystem.getSpeedMultiplier()).toBe(1);
    });

    it('加速Buff应增加速度', () => {
      buffSystem.addBuff(createTestBuff({
        id: 'speed_up',
        effectType: BuffEffectType.SPEED_UP,
        params: { valuePerSecond: 0.3 },
      }), 'caster');
      expect(buffSystem.getSpeedMultiplier()).toBe(1.3);
    });

    it('减速Buff应降低速度', () => {
      buffSystem.addBuff(createTestBuff({
        id: 'slow',
        effectType: BuffEffectType.SLOW,
        params: { valuePerSecond: 0.3 },
      }), 'caster');
      expect(buffSystem.getSpeedMultiplier()).toBe(0.7);
    });

    it('加速和减速应叠加', () => {
      buffSystem.addBuff(createTestBuff({
        id: 'speed_up',
        effectType: BuffEffectType.SPEED_UP,
        params: { valuePerSecond: 0.2 },
      }), 'caster');
      buffSystem.addBuff(createTestBuff({
        id: 'slow',
        effectType: BuffEffectType.SLOW,
        params: { valuePerSecond: 0.1 },
      }), 'caster');
      expect(buffSystem.getSpeedMultiplier()).toBeCloseTo(1.1, 5);
    });

    it('速度倍率下限应为0.1', () => {
      buffSystem.addBuff(createTestBuff({
        id: 'extreme_slow',
        effectType: BuffEffectType.SLOW,
        params: { valuePerSecond: 1.5 }, // 150%减速
      }), 'caster');
      expect(buffSystem.getSpeedMultiplier()).toBe(0.1);
    });
  });

  describe('getStatModify', () => {
    it('应正确计算属性修改值', () => {
      buffSystem.addBuff(createTestBuff({
        id: 'attack_buff',
        params: {
          statModifies: { attack: 20 },
        },
      }), 'caster');
      expect(buffSystem.getStatModify('attack')).toBe(20);
    });

    it('可叠加Buff应按层数增加属性', () => {
      const stackBuff: BuffData = createTestBuff({
        id: 'stack_attack',
        maxStack: 5,
        params: {
          statModifies: { attack: 10 },
        },
      });
      buffSystem.addBuff(stackBuff, 'caster');
      buffSystem.addBuff(stackBuff, 'caster');
      buffSystem.addBuff(stackBuff, 'caster');
      expect(buffSystem.getBuffStack('stack_attack')).toBe(3);
      expect(buffSystem.getStatModify('attack')).toBe(30);
    });

    it('无属性修改时应返回0', () => {
      buffSystem.addBuff(createTestBuff(), 'caster');
      expect(buffSystem.getStatModify('nonexistent')).toBe(0);
    });
  });

  describe('预定义Buff', () => {
    it('BUFFS.POISON应正确配置', () => {
      expect(BUFFS.POISON.type).toBe(BuffType.DEBUFF);
      expect(BUFFS.POISON.effectType).toBe(BuffEffectType.POISON);
      expect(BUFFS.POISON.maxStack).toBe(5);
      expect(BUFFS.POISON.dispellable).toBe(true);
    });

    it('BUFFS.STUN应不可驱散', () => {
      expect(BUFFS.STUN.type).toBe(BuffType.CONTROL);
      expect(BUFFS.STUN.dispellable).toBe(false);
    });

    it('预定义Buff应可正常添加', () => {
      buffSystem.addBuff(BUFFS.POISON, 'caster');
      expect(buffSystem.hasBuff('buff_poison')).toBe(true);
    });
  });

  describe('clearAll', () => {
    it('应清除所有Buff', () => {
      buffSystem.addBuff(createTestBuff({ id: 'buff1' }), 'caster');
      buffSystem.addBuff(createTestBuff({ id: 'buff2' }), 'caster');
      buffSystem.addBuff(createTestBuff({ id: 'buff3' }), 'caster');

      buffSystem.clearAll();

      expect(buffSystem.getAllBuffs()).toHaveLength(0);
    });
  });

  describe('getAllBuffs', () => {
    it('应返回所有Buff实例', () => {
      buffSystem.addBuff(createTestBuff({ id: 'buff1' }), 'caster');
      buffSystem.addBuff(createTestBuff({ id: 'buff2' }), 'caster');

      const allBuffs = buffSystem.getAllBuffs();
      expect(allBuffs).toHaveLength(2);
      expect(allBuffs.map(b => b.data.id)).toContain('buff1');
      expect(allBuffs.map(b => b.data.id)).toContain('buff2');
    });
  });
});
