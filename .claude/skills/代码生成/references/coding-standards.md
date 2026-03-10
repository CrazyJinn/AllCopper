# 编码规范

## 基本原则

1. **可读性优先**：代码应该易于理解和维护
2. **一致性**：整个项目保持统一的代码风格
3. **简洁性**：避免过度设计，保持代码简洁

## 命名规范

| 类型 | 命名风格 | 示例 |
|------|---------|------|
| 类名 | PascalCase | `PlayerController` |
| 函数名 | camelCase | `takeDamage()` |
| 变量名 | camelCase | `currentHealth` |
| 常量 | UPPER_SNAKE_CASE | `MAX_HEALTH` |
| 私有属性 | _camelCase | `_isAttacking` |
| 接口 | I前缀 | `IDamageable` |
| 文件名 | PascalCase | `PlayerController.ts` |

## 代码组织

### 文件结构

```typescript
// 1. 导入语句
import { _decorator, Component } from 'cc';

// 2. 类型定义/接口
interface ICharacterData {
    id: string;
    name: string;
}

// 3. 常量定义
const MAX_LEVEL = 100;

// 4. 类定义
export class Character extends Component {
    // 4.1 属性
    private _health: number = 100;

    // 4.2 生命周期方法
    protected onLoad(): void {}

    protected start(): void {}

    protected update(dt: number): void {}

    // 4.3 公共方法
    public takeDamage(amount: number): void {}

    // 4.4 私有方法
    private _calculateDamage(): number {}
}
```

## 注释规范

### 类注释

```typescript
/**
 * 角色控制器
 * 处理角色移动、攻击等核心逻辑
 */
export class PlayerController extends Component {}
```

### 函数注释

```typescript
/**
 * 造成伤害
 * @param amount 伤害数值
 * @param source 伤害来源
 * @returns 实际造成的伤害值
 */
public takeDamage(amount: number, source: GameObject): number {}
```

## 最佳实践

1. **单一职责**：每个类只负责一个功能
2. **避免魔法数字**：使用常量代替硬编码数值
3. **及时释放资源**：注意资源生命周期管理
4. **事件解耦**：模块间通过事件通信
5. **防御性编程**：对输入参数进行校验
