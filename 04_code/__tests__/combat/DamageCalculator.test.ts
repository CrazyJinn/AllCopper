/**
 * DamageCalculator 单元测试
 * 测试伤害计算逻辑
 */

import { DamageCalculator, DamageParams, DamageResult } from '../../combat/DamageCalculator';
import { DamageType } from '../../core/GameConfig';

describe('DamageCalculator', () => {
  // 默认测试参数
  const createDefaultParams = (overrides: Partial<DamageParams> = {}): DamageParams => ({
    baseDamage: 100,
    attack: 10,
    defense: 0,
    critRate: 0,
    critMultiplier: 1.5,
    damageType: DamageType.NORMAL,
    targetShield: 0,
    targetMaxShield: 0,
    shieldAbsorbRate: 0.9,
    isInvincible: false,
    ...overrides,
  });

  describe('calculateDefenseReduction', () => {
    it('防御为0时应返回0减伤', () => {
      expect(DamageCalculator.calculateDefenseReduction(0)).toBe(0);
    });

    it('防御为100时应返回约50%减伤', () => {
      const reduction = DamageCalculator.calculateDefenseReduction(100);
      expect(reduction).toBeCloseTo(0.5, 2); // 100 / (100 + 100) = 0.5
    });

    it('防御为50时应返回约33%减伤', () => {
      const reduction = DamageCalculator.calculateDefenseReduction(50);
      expect(reduction).toBeCloseTo(0.333, 2); // 50 / (50 + 100) = 0.333
    });

    it('减伤上限应为80%', () => {
      // 400防御 = 400/500 = 0.8
      expect(DamageCalculator.calculateDefenseReduction(400)).toBe(0.8);
      // 1000防御 = 1000/1100 = 0.909... 但上限是0.8
      expect(DamageCalculator.calculateDefenseReduction(1000)).toBe(0.8);
    });
  });

  describe('calculate - 基础伤害计算', () => {
    it('应正确计算基础伤害（baseDamage + attack）', () => {
      const result = DamageCalculator.calculate(createDefaultParams({
        baseDamage: 50,
        attack: 20,
        defense: 0,
        critRate: 0,
      }));
      expect(result.rawDamage).toBe(70);
      expect(result.finalDamage).toBe(70);
    });

    it('应正确应用伤害加成', () => {
      const result = DamageCalculator.calculate(createDefaultParams({
        baseDamage: 100,
        attack: 0,
        damageBonus: 0.2, // +20% 伤害
      }));
      expect(result.rawDamage).toBe(120);
    });

    it('应正确应用防御减伤', () => {
      const result = DamageCalculator.calculate(createDefaultParams({
        baseDamage: 100,
        attack: 0,
        defense: 100, // 50% 减伤
        critRate: 0,
      }));
      expect(result.rawDamage).toBe(100);
      expect(result.finalDamage).toBe(50);
    });

    it('应正确应用额外伤害减免', () => {
      const result = DamageCalculator.calculate(createDefaultParams({
        baseDamage: 100,
        attack: 0,
        defense: 0,
        damageReduction: 0.3, // 30% 额外减伤
        critRate: 0,
      }));
      expect(result.finalDamage).toBe(70);
    });
  });

  describe('calculate - 无敌状态', () => {
    it('无敌状态应返回isDodged=true且伤害为0', () => {
      const result = DamageCalculator.calculate(createDefaultParams({
        isInvincible: true,
        baseDamage: 1000,
      }));
      expect(result.isDodged).toBe(true);
      expect(result.finalDamage).toBe(0);
      expect(result.hpDamage).toBe(0);
      expect(result.shieldDamage).toBe(0);
    });
  });

  describe('calculate - 暴击', () => {
    it('暴击率100%时应必定暴击', () => {
      // 多次测试以确保稳定性
      for (let i = 0; i < 10; i++) {
        const result = DamageCalculator.calculate(createDefaultParams({
          critRate: 1, // 100% 暴击
          critMultiplier: 2,
          baseDamage: 100,
          attack: 0,
        }));
        expect(result.isCrit).toBe(true);
        expect(result.finalDamage).toBe(200);
      }
    });

    it('暴击率0%时应不暴击', () => {
      for (let i = 0; i < 10; i++) {
        const result = DamageCalculator.calculate(createDefaultParams({
          critRate: 0,
        }));
        expect(result.isCrit).toBe(false);
      }
    });

    it('应使用默认暴击倍率1.5', () => {
      const result = DamageCalculator.calculate(createDefaultParams({
        critRate: 1,
        critMultiplier: undefined as any,
        baseDamage: 100,
        attack: 0,
      }));
      expect(result.finalDamage).toBe(150);
    });
  });

  describe('calculate - 伤害类型分配', () => {
    describe('POISON 中毒伤害', () => {
      it('中毒伤害应直接扣HP，无视护盾', () => {
        const result = DamageCalculator.calculate(createDefaultParams({
          damageType: DamageType.POISON,
          baseDamage: 50,
          attack: 0,
          targetShield: 100,
          critRate: 0,
        }));
        expect(result.hpDamage).toBe(50);
        expect(result.shieldDamage).toBe(0);
      });
    });

    describe('SHIELD_BREAK 碎盾伤害', () => {
      it('碎盾伤害应双倍伤害护盾，不扣HP', () => {
        const result = DamageCalculator.calculate(createDefaultParams({
          damageType: DamageType.SHIELD_BREAK,
          baseDamage: 50,
          attack: 0,
          targetShield: 200,
          critRate: 0,
        }));
        expect(result.shieldDamage).toBe(100); // 50 * 2
        expect(result.hpDamage).toBe(0);
      });

      it('碎盾伤害不应超过当前护盾值', () => {
        const result = DamageCalculator.calculate(createDefaultParams({
          damageType: DamageType.SHIELD_BREAK,
          baseDamage: 100,
          attack: 0,
          targetShield: 50,
          critRate: 0,
        }));
        expect(result.shieldDamage).toBe(50);
        expect(result.hpDamage).toBe(0);
      });
    });

    describe('NORMAL 普通伤害', () => {
      it('有护盾时应按吸收率分配伤害', () => {
        const result = DamageCalculator.calculate(createDefaultParams({
          damageType: DamageType.NORMAL,
          baseDamage: 100,
          attack: 0,
          targetShield: 100,
          shieldAbsorbRate: 0.9,
          critRate: 0,
        }));
        expect(result.shieldDamage).toBe(90);
        expect(result.hpDamage).toBeCloseTo(10, 5);
      });

      it('无护盾时应全部伤害扣HP', () => {
        const result = DamageCalculator.calculate(createDefaultParams({
          damageType: DamageType.NORMAL,
          baseDamage: 100,
          attack: 0,
          targetShield: 0,
          critRate: 0,
        }));
        expect(result.hpDamage).toBe(100);
        expect(result.shieldDamage).toBe(0);
      });

      it('护盾不足时剩余伤害应扣HP', () => {
        const result = DamageCalculator.calculate(createDefaultParams({
          damageType: DamageType.NORMAL,
          baseDamage: 100,
          attack: 0,
          targetShield: 50,
          shieldAbsorbRate: 0.9,
          critRate: 0,
        }));
        // 90%伤害 = 90，护盾只有50，所以护盾伤害50
        expect(result.shieldDamage).toBe(50);
        // 剩余伤害：100 * (1 - 0.9) = 10 HP伤害
        expect(result.hpDamage).toBeCloseTo(10, 5);
      });
    });
  });

  describe('calculateDOT', () => {
    it('应正确计算持续伤害', () => {
      const result = DamageCalculator.calculateDOT(100, 0, 5, 1);
      expect(result.damagePerTick).toBe(100);
      expect(result.tickCount).toBe(5);
    });

    it('应考虑防御减伤', () => {
      const result = DamageCalculator.calculateDOT(100, 100, 5, 1); // 100防御=50%减伤
      expect(result.damagePerTick).toBe(50);
    });

    it('应正确计算tick数量', () => {
      const result = DamageCalculator.calculateDOT(100, 0, 10, 2);
      expect(result.tickCount).toBe(5);
    });
  });

  describe('calculateAoeDamage', () => {
    it('距离为0时应返回满伤害', () => {
      expect(DamageCalculator.calculateAoeDamage(100, 0, 10)).toBe(100);
    });

    it('距离越远伤害越低', () => {
      const damage0 = DamageCalculator.calculateAoeDamage(100, 0, 10);
      const damage5 = DamageCalculator.calculateAoeDamage(100, 5, 10);
      const damage9 = DamageCalculator.calculateAoeDamage(100, 9, 10);
      expect(damage0).toBeGreaterThan(damage5);
      expect(damage5).toBeGreaterThan(damage9);
    });

    it('超出范围时应返回最小伤害比例', () => {
      expect(DamageCalculator.calculateAoeDamage(100, 15, 10, 0.3)).toBe(30);
    });

    it('在边界时应返回最小伤害', () => {
      expect(DamageCalculator.calculateAoeDamage(100, 10, 10, 0.3)).toBe(30);
    });

    it('应使用默认最小伤害比例0.3', () => {
      const result = DamageCalculator.calculateAoeDamage(100, 10, 10);
      expect(result).toBe(30);
    });
  });

  describe('边界情况', () => {
    it('伤害应向下取整', () => {
      const result = DamageCalculator.calculate(createDefaultParams({
        baseDamage: 33,
        attack: 33,
        defense: 0,
        critRate: 0,
      }));
      expect(result.finalDamage).toBe(66);
      expect(Number.isInteger(result.finalDamage)).toBe(true);
    });

    it('零伤害应正常处理', () => {
      const result = DamageCalculator.calculate(createDefaultParams({
        baseDamage: 0,
        attack: 0,
        critRate: 0,
      }));
      expect(result.rawDamage).toBe(0);
      expect(result.finalDamage).toBe(0);
    });
  });
});
