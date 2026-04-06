# 编码规范 (Godot + GDScript)

## 基本原则

1. **可读性优先**：代码应该易于理解和维护
2. **一致性**：整个项目保持统一的代码风格
3. **简洁性**：避免过度设计，保持代码简洁

## 命名规范

| 类型 | 命名风格 | 示例 |
|------|---------|------|
| 类名 | PascalCase | `PlayerController` |
| 函数名 | snake_case | `take_damage()` |
| 变量名 | snake_case | `current_health` |
| 常量 | UPPER_SNAKE_CASE | `MAX_HEALTH` |
| 私有属性 | _snake_case | `_is_attacking` |
| 信号 | snake_case | `health_changed` |
| 文件名 | PascalCase | `player_controller.gd` |

## 代码组织

### 脚本文件结构

```gdscript
# 1. class_name 声明
class_name PlayerController
extends CharacterBody2D

# 2. 信号
signal health_changed(new_health: int)
signal died

# 3. 导出变量（编辑器可配置）
@export var move_speed: float = 200.0
@export var max_health: int = 100

# 4. 公共变量
var current_health: int = 100

# 5. 私有变量
var _is_attacking: bool = false

# 6. 引用节点（@onready）
@onready var _sprite: Sprite2D = $Sprite2D
@onready var _hitbox: Area2D = $Hitbox

# 7. 生命周期方法
func _ready() -> void:
    pass

func _physics_process(delta: float) -> void:
    pass

# 8. 公共方法
func take_damage(amount: int, source: Node) -> int:
    pass

# 9. 私有方法
func _calculate_damage() -> int:
    pass
```

## 注释规范

### 类注释

```gdscript
## 角色控制器
## 处理角色移动、攻击等核心逻辑
class_name PlayerController
extends CharacterBody2D
```

### 函数注释

```gdscript
## 造成伤害
## [param amount] 伤害数值
## [param source] 伤害来源节点
## [return] 实际造成的伤害值
func take_damage(amount: int, source: Node) -> int:
    pass
```

## Godot 特有模式

### 信号驱动解耦

```gdscript
# 发射方
signal health_changed(new_health: int)

func take_damage(amount: int) -> void:
    current_health -= amount
    health_changed.emit(current_health)

# 接收方
func _ready() -> void:
    player.health_changed.connect(_on_health_changed)

func _on_health_changed(new_health: int) -> void:
    health_bar.value = new_health
```

### Autoload 单例

用于全局状态管理（在 project.godot 中注册）：

```gdscript
# game_manager.gd - 注册为 Autoload "GameManager"
extends Node

var player: CharacterBody2D
var current_level: String = ""
```

### 状态机模式

```gdscript
# 在角色的 _physics_process 中通过枚举驱动
enum State { IDLE, MOVE, ATTACK, DODGE }
var _state: State = State.IDLE

func _physics_process(delta: float) -> void:
    match _state:
        State.IDLE:
            _handle_idle()
        State.MOVE:
            _handle_move(delta)
        State.ATTACK:
            _handle_attack()
        State.DODGE:
            _handle_dodge()
```

## 最佳实践

1. **单一职责**：每个脚本只负责一个功能
2. **避免魔法数字**：使用 `@export` 常量代替硬编码数值
3. **信号解耦**：模块间优先通过信号通信
4. **节点引用用 @onready**：避免 `_ready()` 之前的空引用
5. **类型标注**：参数和返回值尽量标注类型
