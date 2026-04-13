using Godot;

/// <summary>
/// 受伤接收组件（Area2D）
/// 监听 HitboxComponent 进入碰撞区域，将伤害传递给兄弟节点 HealthComponent
/// 碰撞层：玩家 L1（监测敌人 L4），敌人 L3（监测玩家 L2）
/// </summary>
[GlobalClass]
public partial class HurtboxComponent : Area2D
{
    // ===== 信号 =====

    [Signal]
    public delegate void ReceivedDamageEventHandler(float amount, DamageType type);

    // ===== 私有字段 =====

    private HealthComponent _health;
    private CollisionShape2D _collisionShape;

    public override void _Ready()
    {
        BuildScene();
        _health = GetParent()?.GetNode<HealthComponent>("HealthComponent");
    }

    /// <summary>
    /// 接收来自 HitboxComponent 的伤害
    /// </summary>
    /// <param name="hitbox">攻击来源</param>
    public void ReceiveHit(HitboxComponent hitbox)
    {
        if (hitbox == null || _health == null || _health.IsDead) return;

        float damage = hitbox.Damage;
        DamageType type = hitbox.DamageType;

        switch (type)
        {
            case DamageType.Poison:
                _health.ApplyPoisonDamage(damage);
                break;
            case DamageType.ShieldBreak:
                _health.ApplyShieldBreak(damage);
                break;
            default:
                _health.ApplyDamage(damage);
                break;
        }

        // 击退处理：将击退力传递给父级 CharacterBody2D
        ApplyKnockback(hitbox);

        EmitSignal(SignalName.ReceivedDamage, damage, (int)type);
    }

    /// <summary>
    /// 设置碰撞形状大小
    /// </summary>
    /// <param name="radius">碰撞形状半径</param>
    public void SetShapeRadius(float radius)
    {
        if (_collisionShape != null && _collisionShape.Shape is CircleShape2D circle)
        {
            circle.Radius = radius;
        }
    }

    /// <summary>
    /// 应用击退效果
    /// </summary>
    private void ApplyKnockback(HitboxComponent hitbox)
    {
        if (hitbox.KnockbackForce <= 0f) return;

        if (GetParent() is CharacterBody2D body)
        {
            Vector2 hitboxPos = hitbox.GetParent() != null
                ? hitbox.GetParent().GlobalPosition
                : hitbox.GlobalPosition;
            Vector2 direction = (body.GlobalPosition - hitboxPos).Normalized();
            if (direction == Vector2.Zero) direction = Vector2.Right;
            body.Velocity = direction * hitbox.KnockbackForce;
        }
    }

    /// <summary>
    /// 代码构建子节点
    /// </summary>
    private void BuildScene()
    {
        _collisionShape = new CollisionShape2D();
        _collisionShape.Shape = new CircleShape2D { Radius = 16f };
        AddChild(_collisionShape);
        _collisionShape.Owner = this;
    }
}
