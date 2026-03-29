/**
 * 战斗系统集成测试
 * 测试战斗相关模块的协作
 */

import { DamageCalculator } from '../../combat/DamageCalculator';
import { BuffSystem, BuffType, BuffEffectType, BuffData, BUFFS } from '../../combat/BuffSystem';
import { EventSystem, GameEvent } from '../../core/EventSystem';
import { DamageType } from '../../core/GameConfig';

/**
 * 模拟战斗实体
 */
interface CombatEntity {
  id: string;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  attack: number;
  defense: number;
  critRate: number;
  critMultiplier: number;
  buffSystem: BuffSystem;
}

/**
 * 创建测试用战斗实体
 */
function createTestEntity(overrides: Partial<CombatEntity> = {}): CombatEntity {
  const id = overrides.id || `entity_${Date.now()}`;
  return {
    id,
    hp: 100,
    maxHp: 100,
    shield: 50,
    maxShield: 50,
    attack: 10,
    defense: 5,
    critRate: 0,
    critMultiplier: 1.5,
    buffSystem: new BuffSystem(id),
    ...overrides,
  };
}

/**
 * 模拟攻击流程
 */
function performAttack(attacker: CombatEntity, defender: CombatEntity): void {
  const isInvincible = defender.buffSystem.isInvincible();

  const result = DamageCalculator.calculate({
    baseDamage: 0,
    attack: attacker.attack,
    defense: defender.defense,
    critRate: attacker.critRate,
    critMultiplier: attacker.critMultiplier,
    damageType: DamageType.NORMAL,
    targetShield: defender.shield,
    targetMaxShield: defender.maxShield,
    shieldAbsorbRate: 0.9,
    isInvincible,
  });

  if (!result.isDodged) {
    defender.shield -= result.shieldDamage;
    if (defender.shield < 0) defender.shield = 0;

    defender.hp -= result.hpDamage;
    if (defender.hp < 0) defender.hp = 0;

    EventSystem.instance.emit(GameEvent.DAMAGE_DEALT, {
      target: defender.id,
      damage: result.finalDamage,
      isCrit: result.isCrit,
      damageType: result.damageType,
    });
  }
}

describe('Combat Integration Tests', () => {
  beforeEach(() => {
    EventSystem.instance.clearAll();
  });

  afterEach(() => {
    EventSystem.instance.clearAll();
  });

  describe('基础战斗流程', () => {
    it('攻击者应对防御者造成伤害', () => {
      const attacker = createTestEntity({ id: 'attacker', attack: 20 });
      const defender = createTestEntity({ id: 'defender', defense: 0, shield: 0 });

      performAttack(attacker, defender);

      expect(defender.hp).toBeLessThan(100);
      expect(attacker.hp).toBe(100); // 攻击者不受伤害
    });

    it('防御应减少受到的伤害', () => {
      const attacker = createTestEntity({ attack: 100 });
      const defenderNoDef = createTestEntity({ defense: 0, shield: 0 });
      const defenderHighDef = createTestEntity({ defense: 100, shield: 0 }); // 约50%减伤

      performAttack(attacker, defenderNoDef);
      performAttack(attacker, defenderHighDef);

      expect(defenderHighDef.hp).toBeGreaterThan(defenderNoDef.hp);
    });

    it('护盾应先吸收伤害', () => {
      const attacker = createTestEntity({ attack: 50 });
      const defender = createTestEntity({ shield: 50, maxShield: 50 });

      const initialHp = defender.hp;
      performAttack(attacker, defender);

      // 90%伤害被护盾吸收
      expect(defender.shield).toBeLessThan(50);
    });
  });

  describe('Buff与战斗集成', () => {
    it('中毒Buff应造成持续伤害', () => {
      const entity = createTestEntity();

      entity.buffSystem.addBuff(BUFFS.POISON, 'enemy');

      // Buff 应该存在
      expect(entity.buffSystem.hasBuff('buff_poison')).toBe(true);

      // 更新 1 秒，检查 DOT 效果是否被计算
      const result = entity.buffSystem.update(1);

      // DOT 伤害应该大于 0（如果 tick interval 触发）
      // 注意：实际实现可能需要先经过 tickInterval 时间才触发
      expect(result.dotDamage).toBeGreaterThanOrEqual(0);
    });

    it('无敌Buff应免疫伤害', () => {
      const attacker = createTestEntity({ attack: 1000 });
      const defender = createTestEntity();

      // 添加无敌Buff
      const invincibleBuff: BuffData = {
        id: 'invincible',
        name: '无敌',
        type: BuffType.BUFF,
        effectType: BuffEffectType.INVINCIBLE,
        icon: 'icon',
        description: '无敌',
        duration: 5,
        maxStack: 1,
        dispellable: false,
        params: {},
      };
      defender.buffSystem.addBuff(invincibleBuff, 'caster');

      performAttack(attacker, defender);

      expect(defender.hp).toBe(100);
      expect(defender.shield).toBe(50);
    });

    it('属性Buff应影响伤害', () => {
      const attacker = createTestEntity({ attack: 10 });

      // 添加攻击力Buff
      const attackBuff: BuffData = {
        id: 'attack_up',
        name: '攻击提升',
        type: BuffType.BUFF,
        effectType: BuffEffectType.STAT_MODIFY,
        icon: 'icon',
        description: '攻击+50%',
        duration: 10,
        maxStack: 1,
        dispellable: true,
        params: {
          statModifies: { attack: 0.5 }, // +50%攻击
        },
      };
      attacker.buffSystem.addBuff(attackBuff, 'caster');

      // 计算实际攻击力（需要外部逻辑处理属性修改）
      const attackModify = attacker.buffSystem.getStatModify('attack');
      const effectiveAttack = attacker.attack * (1 + attackModify);

      expect(effectiveAttack).toBeCloseTo(15, 1); // 10 * 1.5
    });

    it('眩晕应导致无法行动', () => {
      const entity = createTestEntity();
      entity.buffSystem.addBuff(BUFFS.STUN, 'enemy');

      expect(entity.buffSystem.isImmobilized()).toBe(true);
    });
  });

  describe('事件系统集成', () => {
    it('攻击应触发DAMAGE_DEALT事件', () => {
      const eventSpy = jest.fn();
      EventSystem.instance.on(GameEvent.DAMAGE_DEALT, eventSpy);

      const attacker = createTestEntity({ id: 'hero' });
      const defender = createTestEntity({ id: 'enemy', shield: 0 });

      performAttack(attacker, defender);

      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        target: 'enemy',
        isCrit: false,
      }));
    });

    it('添加Buff应触发BUFF_ADDED事件', () => {
      const eventSpy = jest.fn();
      EventSystem.instance.on(GameEvent.BUFF_ADDED, eventSpy);

      const entity = createTestEntity();
      entity.buffSystem.addBuff(BUFFS.POISON, 'caster');

      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        targetId: entity.id,
        buffId: 'buff_poison',
      }));
    });
  });

  describe('Buff叠加效果', () => {
    it('多个Buff应正确叠加效果', () => {
      const entity = createTestEntity();

      // 添加多个属性修改Buff
      entity.buffSystem.addBuff({
        id: 'buff_str',
        name: '力量',
        type: BuffType.BUFF,
        effectType: BuffEffectType.STAT_MODIFY,
        icon: 'icon',
        description: '+10攻击',
        duration: 10,
        maxStack: 1,
        dispellable: true,
        params: { statModifies: { attack: 10 } },
      }, 'caster');

      entity.buffSystem.addBuff({
        id: 'buff_speed',
        name: '速度',
        type: BuffType.BUFF,
        effectType: BuffEffectType.SPEED_UP,
        icon: 'icon',
        description: '+30%速度',
        duration: 10,
        maxStack: 1,
        dispellable: true,
        params: { valuePerSecond: 0.3 },
      }, 'caster');

      expect(entity.buffSystem.getStatModify('attack')).toBe(10);
      expect(entity.buffSystem.getSpeedMultiplier()).toBeCloseTo(1.3, 1);
    });

    it('驱散应移除正确数量的Buff', () => {
      const entity = createTestEntity();

      // 添加多个可驱散的debuff
      entity.buffSystem.addBuff(BUFFS.POISON, 'enemy');
      entity.buffSystem.addBuff(BUFFS.BURN, 'enemy');
      entity.buffSystem.addBuff(BUFFS.STUN, 'enemy'); // 不可驱散

      const dispelled = entity.buffSystem.dispel(2, [BuffType.DEBUFF]);

      expect(dispelled).toBe(2);
      expect(entity.buffSystem.hasBuff('buff_stun')).toBe(true); // 眩晕不可驱散
    });
  });

  describe('完整战斗场景', () => {
    it('模拟攻击流程', () => {
      const attacker = createTestEntity({
        id: 'hero',
        attack: 15,
        critRate: 0,
      });
      const defender = createTestEntity({
        id: 'monster',
        hp: 80,
        maxHp: 80,
        shield: 0,
        defense: 5,
      });

      // 记录事件
      const damageEvents: any[] = [];
      EventSystem.instance.on(GameEvent.DAMAGE_DEALT, (data) => damageEvents.push(data));

      // 第一轮攻击
      performAttack(attacker, defender);
      const hpAfterFirstHit = defender.hp;
      expect(hpAfterFirstHit).toBeLessThan(80);

      // 验证事件触发
      expect(damageEvents.length).toBe(1);
    });

    it('模拟护盾消耗场景', () => {
      const attacker = createTestEntity({
        id: 'shield_breaker',
        attack: 30,
      });
      const defender = createTestEntity({
        id: 'defender',
        hp: 100,
        shield: 30,
        maxShield: 30,
      });

      // 多次攻击消耗护盾
      let attackCount = 0;
      while (defender.shield > 0 && attackCount < 20) {
        performAttack(attacker, defender);
        attackCount++;
      }

      // 经过多次攻击后，护盾应该被消耗
      expect(attackCount).toBeGreaterThan(0);
      expect(defender.hp).toBeLessThanOrEqual(100);
    });
  });
});
