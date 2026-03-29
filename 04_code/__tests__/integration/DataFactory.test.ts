/**
 * CharacterDataFactory 单元测试
 * 测试角色数据工厂
 */

import { CharacterDataFactory, CharacterStats, CombatResource, ROLAND_DATA, WEI_DATA } from '../../data/CharacterData';
import { Faction, CharacterType } from '../../core/GameConfig';

describe('CharacterDataFactory', () => {
  describe('createDefaultStats', () => {
    it('应返回有效的默认属性对象', () => {
      const stats = CharacterDataFactory.createDefaultStats();

      expect(stats.hp).toBeDefined();
      expect(stats.maxHp).toBeDefined();
      expect(stats.shield).toBeDefined();
      expect(stats.attack).toBeDefined();
      expect(stats.defense).toBeDefined();
      expect(stats.speed).toBeDefined();
    });

    it('默认属性应有合理的值', () => {
      const stats = CharacterDataFactory.createDefaultStats();

      expect(stats.hp).toBeGreaterThan(0);
      expect(stats.hp).toBe(stats.maxHp);
      expect(stats.shield).toBeGreaterThanOrEqual(0);
      expect(stats.attack).toBeGreaterThan(0);
      expect(stats.defense).toBeGreaterThanOrEqual(0);
      expect(stats.speed).toBeGreaterThan(0);
    });

    it('护盾吸收率应为合理范围(0-1)', () => {
      const stats = CharacterDataFactory.createDefaultStats();

      expect(stats.shieldAbsorbRate).toBeGreaterThanOrEqual(0);
      expect(stats.shieldAbsorbRate).toBeLessThanOrEqual(1);
    });

    it('每次调用应返回新对象', () => {
      const stats1 = CharacterDataFactory.createDefaultStats();
      const stats2 = CharacterDataFactory.createDefaultStats();

      stats1.hp = 50;

      expect(stats2.hp).not.toBe(50);
    });
  });

  describe('createDefaultCombatResource', () => {
    it('应返回有效的默认战斗资源', () => {
      const combat = CharacterDataFactory.createDefaultCombatResource();

      expect(combat.ammo).toBeDefined();
      expect(combat.maxAmmo).toBeDefined();
      expect(combat.skill1Cooldown).toBeDefined();
      expect(combat.skill2Cooldown).toBeDefined();
      expect(combat.ultimateCooldown).toBeDefined();
      expect(combat.attackCooldown).toBeDefined();
    });

    it('弹药数不应超过最大弹药', () => {
      const combat = CharacterDataFactory.createDefaultCombatResource();

      expect(combat.ammo).toBeLessThanOrEqual(combat.maxAmmo);
    });

    it('冷却时间应为非负数', () => {
      const combat = CharacterDataFactory.createDefaultCombatResource();

      expect(combat.skill1Cooldown).toBeGreaterThanOrEqual(0);
      expect(combat.skill2Cooldown).toBeGreaterThanOrEqual(0);
      expect(combat.ultimateCooldown).toBeGreaterThanOrEqual(0);
      expect(combat.attackCooldown).toBeGreaterThanOrEqual(0);
    });

    it('每次调用应返回新对象', () => {
      const combat1 = CharacterDataFactory.createDefaultCombatResource();
      const combat2 = CharacterDataFactory.createDefaultCombatResource();

      combat1.ammo = 0;

      expect(combat2.ammo).not.toBe(0);
    });
  });

  describe('createRuntimeState', () => {
    it('应从CharacterData创建正确的运行时状态', () => {
      const stats = CharacterDataFactory.createRuntimeState(ROLAND_DATA);

      expect(stats.currentHp).toBe(ROLAND_DATA.stats.hp);
      expect(stats.currentShield).toBe(ROLAND_DATA.stats.shield);
      expect(stats.currentMp).toBe(ROLAND_DATA.stats.mp);
      expect(stats.currentAmmo).toBe(ROLAND_DATA.combat.ammo);
    });

    it('应初始化所有冷却计时器为0', () => {
      const state = CharacterDataFactory.createRuntimeState(ROLAND_DATA);

      expect(state.skillTimers.skill1).toBe(0);
      expect(state.skillTimers.skill2).toBe(0);
      expect(state.skillTimers.ultimate).toBe(0);
      expect(state.skillTimers.attack).toBe(0);
    });

    it('应初始化为存活状态', () => {
      const state = CharacterDataFactory.createRuntimeState(ROLAND_DATA);

      expect(state.isDead).toBe(false);
      expect(state.isInvincible).toBe(false);
    });

    it('护盾恢复计时器应初始化为0', () => {
      const state = CharacterDataFactory.createRuntimeState(ROLAND_DATA);

      expect(state.shieldRegenTimer).toBe(0);
    });
  });
});

describe('预定义角色数据', () => {
  describe('ROLAND_DATA', () => {
    it('应有有效的ID和名称', () => {
      expect(ROLAND_DATA.id).toBe('char_roland');
      expect(ROLAND_DATA.name).toBe('罗兰');
    });

    it('应为科技阵营玩家角色', () => {
      expect(ROLAND_DATA.type).toBe(CharacterType.PLAYER);
      expect(ROLAND_DATA.faction).toBe(Faction.TECH);
    });

    it('属性应在合理范围', () => {
      expect(ROLAND_DATA.stats.hp).toBeGreaterThan(0);
      expect(ROLAND_DATA.stats.maxHp).toBe(ROLAND_DATA.stats.hp);
      expect(ROLAND_DATA.stats.attack).toBeGreaterThan(0);
      expect(ROLAND_DATA.stats.speed).toBeGreaterThan(0);
    });

    it('应有完整的动画配置', () => {
      const anims = ROLAND_DATA.animations;

      expect(anims.idle).toBeDefined();
      expect(anims.walk).toBeDefined();
      expect(anims.run).toBeDefined();
      expect(anims.attack).toBeDefined();
      expect(anims.hurt).toBeDefined();
      expect(anims.death).toBeDefined();
    });

    it('应有完整的立绘配置', () => {
      const portraits = ROLAND_DATA.portraits;

      expect(portraits.default).toBeDefined();
      expect(portraits.happy).toBeDefined();
      expect(portraits.angry).toBeDefined();
    });

    it('科技阵营不应有魔法值', () => {
      expect(ROLAND_DATA.stats.mp).toBe(0);
      expect(ROLAND_DATA.stats.maxMp).toBe(0);
    });

    it('科技阵营应有弹药', () => {
      expect(ROLAND_DATA.combat.ammo).toBeGreaterThan(0);
      expect(ROLAND_DATA.combat.maxAmmo).toBeGreaterThan(0);
    });
  });

  describe('WEI_DATA', () => {
    it('应有有效的ID和名称', () => {
      expect(WEI_DATA.id).toBe('char_wei');
      expect(WEI_DATA.name).toBe('薇');
    });

    it('应为魔法阵营玩家角色', () => {
      expect(WEI_DATA.type).toBe(CharacterType.PLAYER);
      expect(WEI_DATA.faction).toBe(Faction.MAGIC);
    });

    it('魔法阵营应有魔法值', () => {
      expect(WEI_DATA.stats.mp).toBeGreaterThan(0);
      expect(WEI_DATA.stats.maxMp).toBeGreaterThan(0);
    });

    it('魔法阵营不应有弹药', () => {
      expect(WEI_DATA.combat.ammo).toBe(0);
      expect(WEI_DATA.combat.maxAmmo).toBe(0);
    });

    it('魔法阵营应有法术技能', () => {
      expect(WEI_DATA.skills).toContain('skill_fireball');
      expect(WEI_DATA.skills).toContain('skill_teleport');
    });

    it('应有完整的动画配置', () => {
      const anims = WEI_DATA.animations;

      expect(anims.idle).toBeDefined();
      expect(anims.attack).toBeDefined();
      expect(anims.skill1).toBeDefined();
      expect(anims.ultimate).toBeDefined();
    });
  });

  describe('角色数据对比', () => {
    it('罗兰和薇应有不同的属性倾向', () => {
      // 罗兰更肉，薇攻击更高但更脆
      expect(ROLAND_DATA.stats.hp).toBeGreaterThan(WEI_DATA.stats.hp);
      expect(ROLAND_DATA.stats.defense).toBeGreaterThan(WEI_DATA.stats.defense);
      expect(WEI_DATA.stats.attack).toBeGreaterThan(ROLAND_DATA.stats.attack);
    });

    it('两者应有不同的技能列表', () => {
      const rolandSkills = new Set(ROLAND_DATA.skills);
      const weiSkills = new Set(WEI_DATA.skills);

      // 没有共同技能
      const commonSkills = [...rolandSkills].filter(s => weiSkills.has(s));
      expect(commonSkills).toHaveLength(0);
    });
  });
});
