# 测试指南

## 目录结构

```
04_code/
├── __tests__/
│   ├── jest.setup.ts          # Jest 测试环境配置
│   ├── combat/
│   │   ├── DamageCalculator.test.ts  # 伤害计算器测试
│   │   └── BuffSystem.test.ts        # Buff系统测试
│   ├── core/
│   │   └── EventSystem.test.ts       # 事件系统测试
│   ├── player/
│   │   └── StateMachine.test.ts      # 状态机测试
│   ├── economy/
│   │   └── EconomySystem.test.ts     # 经济系统测试
│   └── integration/
│       ├── CombatFlow.test.ts        # 战斗流程集成测试
│       └── DataFactory.test.ts       # 数据工厂测试
└── jest.config.js                    # Jest 配置
```

## 安装依赖

```bash
npm install --save-dev jest ts-jest @types/jest
```

## 运行测试

```bash
# 运行所有测试
npx jest

# 运行特定测试文件
npx jest __tests__/combat/DamageCalculator.test.ts

# 运行带覆盖率报告
npx jest --coverage

# 监视模式（文件变化时自动运行）
npx jest --watch

# 运行匹配特定名称的测试
npx jest -t "DamageCalculator"
```

## 测试覆盖范围

| 模块 | 文件 | 测试重点 |
|------|------|----------|
| DamageCalculator | [DamageCalculator.test.ts](__tests__/combat/DamageCalculator.test.ts) | 伤害公式、暴击、防御减伤、DOT、AOE衰减 |
| BuffSystem | [BuffSystem.test.ts](__tests__/combat/BuffSystem.test.ts) | Buff添加/移除、层数叠加、过期、状态检查 |
| EventSystem | [EventSystem.test.ts](__tests__/core/EventSystem.test.ts) | 订阅/发布、once、取消订阅、事件隔离 |
| StateMachine | [StateMachine.test.ts](__tests__/player/StateMachine.test.ts) | 状态转换、优先级、历史记录 |
| EconomySystem | [EconomySystem.test.ts](__tests__/economy/EconomySystem.test.ts) | 货币精度、购买/出售、余额检查 |

## 编写测试规范

### 测试命名
```typescript
describe('模块名称', () => {
  describe('方法名/功能', () => {
    it('应正确描述预期行为', () => {
      // arrange
      // act
      // assert
    });
  });
});
```

### 测试原则
1. **单一职责**：每个测试只验证一个行为
2. **独立性**：测试之间不应有依赖关系
3. **可重复**：多次运行结果一致
4. **清晰**：测试名称应清楚说明验证内容

### Mock 使用
```typescript
// 模拟函数
const callback = jest.fn();

// 模拟返回值
jest.fn().mockReturnValue(true);

// 模拟实现
jest.fn((x) => x * 2);

// 检查调用
expect(callback).toHaveBeenCalled();
expect(callback).toHaveBeenCalledWith(arg1, arg2);
```

### 事件系统测试
```typescript
beforeEach(() => {
  EventSystem.instance.clearAll();
});

afterEach(() => {
  EventSystem.instance.clearAll();
});
```

## 持续集成

在 CI/CD 中添加测试步骤：

```yaml
# GitHub Actions 示例
- name: Run Tests
  run: npx jest --coverage --ci
```

## 常见问题

### 1. 单例模式测试隔离
单例在测试间可能造成状态污染，使用 `beforeEach` 清理：

```typescript
beforeEach(() => {
  EventSystem.instance.clearAll();
});
```

### 2. 浮点数比较
使用 `toBeCloseTo` 处理精度问题：

```typescript
expect(value).toBeCloseTo(0.3, 2); // 精确到小数点后2位
```

### 3. 异步测试
```typescript
it('async test', async () => {
  await expect(someAsyncFunction()).resolves.toBe(true);
});
```
