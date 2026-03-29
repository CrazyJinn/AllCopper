/**
 * StateMachine 单元测试
 * 测试状态机状态转换逻辑
 */

import { StateMachine, IState, TransitionCondition, BaseState } from '../../player/StateMachine';

// 测试上下文类型
interface TestContext {
  hp: number;
  maxHp: number;
  isGrounded: boolean;
  isAttacking: boolean;
  speed: number;
}

// 创建测试用的状态类
class TestState extends BaseState<TestContext> {
  enterCallback?: jest.Mock;
  updateCallback?: jest.Mock;
  exitCallback?: jest.Mock;
  canEnterCallback?: jest.Mock;

  constructor(
    name: string,
    options: {
      enter?: jest.Mock;
      update?: jest.Mock;
      exit?: jest.Mock;
      canEnter?: jest.Mock;
    } = {}
  ) {
    super(name);
    this.enterCallback = options.enter;
    this.updateCallback = options.update;
    this.exitCallback = options.exit;
    this.canEnterCallback = options.canEnter;
  }

  enter(context: TestContext): void {
    this.enterCallback?.(context);
  }

  update(context: TestContext, deltaTime: number): void {
    this.updateCallback?.(context, deltaTime);
  }

  exit(context: TestContext): void {
    this.exitCallback?.(context);
  }

  canEnter(context: TestContext): boolean {
    return this.canEnterCallback?.(context) ?? true;
  }
}

describe('StateMachine', () => {
  let sm: StateMachine<TestContext>;
  let context: TestContext;

  beforeEach(() => {
    context = {
      hp: 100,
      maxHp: 100,
      isGrounded: true,
      isAttacking: false,
      speed: 200,
    };
    sm = new StateMachine(context);
  });

  describe('addState', () => {
    it('应成功添加状态', () => {
      const idleState = new TestState('idle');
      sm.addState(idleState);
      // 通过设置初始状态来验证状态已添加
      expect(() => sm.setInitialState('idle')).not.toThrow();
    });
  });

  describe('setInitialState', () => {
    it('应正确设置初始状态', () => {
      const idleState = new TestState('idle');
      const enterSpy = jest.fn();
      idleState.enterCallback = enterSpy;

      sm.addState(idleState);
      sm.setInitialState('idle');

      expect(sm.currentStateName).toBe('idle');
      expect(enterSpy).toHaveBeenCalledWith(context);
    });

    it('设置不存在的初始状态应不做任何操作', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      sm.setInitialState('nonexistent');

      expect(sm.currentStateName).toBeNull();
      expect(consoleSpy).not.toHaveBeenCalled(); // 当前实现静默处理
      consoleSpy.mockRestore();
    });
  });

  describe('currentState/currentStateName', () => {
    it('初始时currentStateName应为null', () => {
      expect(sm.currentStateName).toBeNull();
    });

    it('初始时currentState应为null', () => {
      expect(sm.currentState).toBeNull();
    });
  });

  describe('isInState', () => {
    it('应正确检查当前状态', () => {
      sm.addState(new TestState('idle'));
      sm.setInitialState('idle');

      expect(sm.isInState('idle')).toBe(true);
      expect(sm.isInState('walk')).toBe(false);
    });

    it('无状态时应返回false', () => {
      expect(sm.isInState('idle')).toBe(false);
    });
  });

  describe('changeState', () => {
    beforeEach(() => {
      sm.addState(new TestState('idle'));
      sm.addState(new TestState('walk'));
      sm.addState(new TestState('dead'));
      sm.setInitialState('idle');
    });

    it('应成功转换状态', () => {
      const result = sm.changeState('walk');
      expect(result).toBe(true);
      expect(sm.currentStateName).toBe('walk');
    });

    it('转换状态时应调用exit和enter', () => {
      const idleExitSpy = jest.fn();
      const walkEnterSpy = jest.fn();

      const idleState = new TestState('idle', { exit: idleExitSpy });
      const walkState = new TestState('walk', { enter: walkEnterSpy });

      sm.addState(idleState);
      sm.addState(walkState);
      sm.setInitialState('idle');

      sm.changeState('walk');

      expect(idleExitSpy).toHaveBeenCalledWith(context);
      expect(walkEnterSpy).toHaveBeenCalledWith(context);
    });

    it('canEnter返回false时应拒绝转换', () => {
      const deadState = new TestState('dead', {
        canEnter: jest.fn((ctx) => ctx.hp <= 0),
      });
      sm.addState(deadState);

      context.hp = 100;
      const result = sm.changeState('dead');

      expect(result).toBe(false);
      expect(sm.currentStateName).toBe('idle');
    });

    it('canEnter返回true时应允许转换', () => {
      const deadState = new TestState('dead', {
        canEnter: jest.fn((ctx) => ctx.hp <= 0),
      });
      sm.addState(deadState);

      context.hp = 0;
      const result = sm.changeState('dead');

      expect(result).toBe(true);
      expect(sm.currentStateName).toBe('dead');
    });

    it('无当前状态时应返回false', () => {
      const newSm = new StateMachine(context);
      newSm.addState(new TestState('idle'));

      const result = newSm.changeState('idle');
      expect(result).toBe(false);
    });

    it('目标状态不存在时应返回false', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = sm.changeState('nonexistent');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('forceChangeState', () => {
    beforeEach(() => {
      sm.addState(new TestState('idle'));
      sm.addState(new TestState('dead'));
      sm.setInitialState('idle');
    });

    it('应忽略canEnter强制转换', () => {
      const deadState = new TestState('dead', {
        canEnter: jest.fn((ctx) => ctx.hp <= 0),
      });
      sm.addState(deadState);

      context.hp = 100; // hp > 0, canEnter 应返回 false
      sm.forceChangeState('dead');

      expect(sm.currentStateName).toBe('dead');
    });

    it('状态不存在时应警告', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      sm.forceChangeState('nonexistent');

      expect(sm.currentStateName).toBe('idle');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('update', () => {
    beforeEach(() => {
      sm.addState(new TestState('idle'));
      sm.setInitialState('idle');
    });

    it('应调用当前状态的update', () => {
      const updateSpy = jest.fn();
      const idleState = new TestState('idle', { update: updateSpy });
      sm.addState(idleState);
      sm.setInitialState('idle');

      sm.update(0.016);

      expect(updateSpy).toHaveBeenCalledWith(context, 0.016);
    });

    it('无当前状态时update不应报错', () => {
      const newSm = new StateMachine(context);
      expect(() => newSm.update(0.016)).not.toThrow();
    });
  });

  describe('addTransition', () => {
    beforeEach(() => {
      sm.addState(new TestState('idle'));
      sm.addState(new TestState('walk'));
      sm.addState(new TestState('run'));
      sm.addState(new TestState('attack'));
      sm.setInitialState('idle');
    });

    it('应添加状态转换规则', () => {
      const condition: TransitionCondition<TestContext> = (ctx) => ctx.speed > 100;
      sm.addTransition('idle', 'walk', condition);

      // 通过update触发转换检查
      context.speed = 200;
      sm.update(0.016);

      expect(sm.currentStateName).toBe('walk');
    });

    it('条件不满足时不应转换', () => {
      const condition: TransitionCondition<TestContext> = (ctx) => ctx.speed > 100;
      sm.addTransition('idle', 'walk', condition);

      context.speed = 50; // 条件不满足
      sm.update(0.016);

      expect(sm.currentStateName).toBe('idle');
    });

    it('应按优先级检查转换', () => {
      const walkCondition: TransitionCondition<TestContext> = () => true;
      const runCondition: TransitionCondition<TestContext> = () => true;

      sm.addTransition('idle', 'walk', walkCondition, 1);
      sm.addTransition('idle', 'run', runCondition, 2); // 更高优先级

      sm.update(0.016);

      // 应该转换到run，因为它的优先级更高
      expect(sm.currentStateName).toBe('run');
    });

    it('高优先级条件不满足时应检查低优先级', () => {
      const walkCondition: TransitionCondition<TestContext> = () => true;
      const runCondition: TransitionCondition<TestContext> = () => false;

      sm.addTransition('idle', 'walk', walkCondition, 1);
      sm.addTransition('idle', 'run', runCondition, 2);

      sm.update(0.016);

      expect(sm.currentStateName).toBe('walk');
    });
  });

  describe('状态历史', () => {
    beforeEach(() => {
      sm.addState(new TestState('idle'));
      sm.addState(new TestState('walk'));
      sm.addState(new TestState('run'));
      sm.setInitialState('idle');
    });

    it('应记录状态转换历史', () => {
      sm.changeState('walk');
      sm.changeState('run');

      const history = sm.getHistory();
      expect(history).toContain('idle');
      expect(history).toContain('walk');
      expect(history).toContain('run');
    });

    it('历史记录应按时间顺序排列', () => {
      sm.changeState('walk');
      sm.changeState('run');

      const history = sm.getHistory();
      expect(history[history.length - 1]).toBe('run');
    });

    it('历史记录应限制最大长度', () => {
      for (let i = 0; i < 15; i++) {
        sm.addState(new TestState(`state_${i}`));
      }

      sm.setInitialState('idle');
      for (let i = 0; i < 15; i++) {
        sm.changeState(`state_${i}`);
      }

      const history = sm.getHistory();
      expect(history.length).toBeLessThanOrEqual(10);
    });
  });

  describe('clear', () => {
    it('应清除所有状态和转换', () => {
      const exitSpy = jest.fn();
      const idleState = new TestState('idle', { exit: exitSpy });
      sm.addState(idleState);
      sm.setInitialState('idle');

      sm.clear();

      expect(sm.currentStateName).toBeNull();
      expect(exitSpy).toHaveBeenCalled();
    });
  });

  describe('复杂场景', () => {
    it('完整的玩家状态转换流程', () => {
      // 创建玩家状态
      const idleState = new TestState('idle');
      const walkState = new TestState('walk');
      const attackState = new TestState('attack', {
        canEnter: jest.fn(() => true),
      });
      const hurtState = new TestState('hurt');
      const deadState = new TestState('dead', {
        canEnter: jest.fn((ctx) => ctx.hp <= 0),
      });

      sm.addState(idleState);
      sm.addState(walkState);
      sm.addState(attackState);
      sm.addState(hurtState);
      sm.addState(deadState);

      // 添加转换规则
      sm.addTransition('idle', 'walk', (ctx) => ctx.speed > 0);
      sm.addTransition('walk', 'idle', (ctx) => ctx.speed === 0);
      sm.addTransition('idle', 'attack', (ctx) => ctx.isAttacking);
      sm.addTransition('attack', 'idle', () => false); // 攻击后手动切换
      sm.addTransition('idle', 'hurt', (ctx) => ctx.hp < ctx.maxHp);
      sm.addTransition('hurt', 'dead', (ctx) => ctx.hp <= 0);

      // 设置初始状态
      sm.setInitialState('idle');
      expect(sm.isInState('idle')).toBe(true);

      // 玩家开始移动
      context.speed = 100;
      sm.update(0.016);
      expect(sm.isInState('walk')).toBe(true);

      // 玩家停止移动
      context.speed = 0;
      sm.update(0.016);
      expect(sm.isInState('idle')).toBe(true);

      // 玩家攻击
      context.isAttacking = true;
      sm.update(0.016);
      expect(sm.isInState('attack')).toBe(true);

      // 玩家受伤（强制切换）
      context.hp = 50;
      sm.forceChangeState('hurt');
      expect(sm.isInState('hurt')).toBe(true);

      // 玩家死亡
      context.hp = 0;
      sm.update(0.016);
      expect(sm.isInState('dead')).toBe(true);
    });
  });
});
